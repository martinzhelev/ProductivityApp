const cron = require('node-cron');
const mysql = require('mysql2');
const { sendEventReminder, sendDeadlineReminder } = require('./emailService');

// Create a separate pool for the scheduler
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: null,
    database: 'productivityapp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Set to track notified event/deadline IDs
const notifiedEventIds = new Set();
const notifiedDeadlineIds = new Set();

// Array to store cron jobs for potential cleanup
const scheduledJobs = [];

const scheduleNotifications = async () => {
    console.log('Scheduling notifications at server startup:', new Date().toLocaleString());
    try {
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                return;
            }

            // Fetch all future events - combine date and time fields
            connection.query(`
                SELECT s.*, u.email,
                       CONCAT(s.date, ' ', s.time) as datetime
                FROM social s
                JOIN users u ON s.user_id = u.user_id
                WHERE CONCAT(s.date, ' ', s.time) > NOW()
            `, (error, events) => {
                if (error) {
                    console.error('Error querying events:', error);
                    connection.release();
                    return;
                }

                console.log(`Scheduling ${events ? events.length : 0} future events`);
                events.forEach(event => {
                    const eventDate = new Date(event.datetime);
                    const notificationTime = new Date(eventDate.getTime() - 60 * 60 * 1000); // 1 hour before
                    console.log(`Event ID ${event.id} scheduled for ${eventDate.toLocaleString()}, notification at ${notificationTime.toLocaleString()}`);
                    
                    // Skip if notification time is in the past
                    if (notificationTime < new Date()) {
                        console.log(`Notification time for event ID ${event.id} is in the past, skipping.`);
                        return;
                    }

                    // Convert to cron format
                    const minute = notificationTime.getMinutes();
                    const hour = notificationTime.getHours();
                    const day = notificationTime.getDate();
                    const month = notificationTime.getMonth() + 1;

                    const cronExpression = `0 ${minute} ${hour} ${day} ${month} *`;
                    
                    console.log(`Cron expression for event: ${cronExpression}`);
                    const job = cron.schedule(cronExpression, () => {
                        if (!notifiedEventIds.has(event.id)) {
                            sendEventReminder(
                                event.email,
                                event.event_name,
                                new Date(event.date).toLocaleDateString(),
                                event.time
                            );
                            notifiedEventIds.add(event.id);
                        }
                    }, {
                        scheduled: true,
                        timezone: 'Europe/Bucharest'
                    });
                    scheduledJobs.push(job);
                });

                // Fetch all future deadlines - already in datetime format
                connection.query(`
                    SELECT w.*, u.email 
                    FROM work_deadlines w
                    JOIN users u ON w.user_id = u.user_id
                    WHERE w.date > NOW()
                `, (error, deadlines) => {
                    if (error) {
                        console.error('Error querying deadlines:', error);
                        connection.release();
                        return;
                    }

                    console.log(`Scheduling ${deadlines ? deadlines.length : 0} future deadlines`);
                    deadlines.forEach(deadline => {
                        const deadlineDate = new Date(deadline.date);
                        const notificationTime = new Date(deadlineDate.getTime() - 60 * 60 * 1000); // 1 hour before

                        if (notificationTime < new Date()) {
                            console.log(`Notification time for deadline ID ${deadline.id} is in the past, skipping.`);
                            return;
                        }

                        const minute = notificationTime.getMinutes();
                        const hour = notificationTime.getHours();
                        const day = notificationTime.getDate();
                        const month = notificationTime.getMonth() + 1;
                        const dayOfWeek = notificationTime.getDay();

                        const cronExpression = `0 ${minute} ${hour} ${day} ${month} *`;
                        console.log(`Cron expression: ${deadline.deadline}, ${cronExpression}`);
                        const job = cron.schedule(cronExpression, () => {
                            if (!notifiedDeadlineIds.has(deadline.id)) {
                                console.log(`Running checkUpcomingEvents for deadline ID ${deadline.id}: ${deadline.deadline} at ${new Date().toLocaleString()}`);
                                sendDeadlineReminder(
                                    deadline.email,
                                    deadline.deadline,
                                    deadlineDate.toLocaleDateString(),
                                    deadlineDate.toLocaleTimeString()
                                );
                                notifiedDeadlineIds.add(deadline.id); // Mark as notified
                            }
                        }, {
                            scheduled: true,
                            timezone: 'Europe/Bucharest'
                        });
                        scheduledJobs.push(job);
                    });

                    connection.release();
                });
            });
        });
    } catch (error) {
        console.error('Error scheduling notifications:', error);
    }
};

const startScheduler = () => {
    try {
        scheduleNotifications();
        console.log('Scheduler started successfully');
    } catch (error) {
        console.error('Error starting scheduler:', error);
    }
};

module.exports = { startScheduler };
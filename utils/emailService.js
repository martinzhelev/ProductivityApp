const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// Test the connection when the service starts
transporter.verify(function(error, success) {
    if (error) {
        console.error('Email service error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

const sendEventReminder = async (userEmail, eventName, eventDate, eventTime) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Upcoming Event Reminder',
        html: `
            <h2>Event Reminder</h2>
            <p>Don't forget about your upcoming event:</p>
            <p><strong>${eventName}</strong></p>
            <p>Date: ${eventDate}</p>
            <p>Time: ${eventTime}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reminder email sent successfully');
    } catch (error) {
        console.error('Error sending reminder email:', error);
    }
};

const sendDeadlineReminder = async (userEmail, deadlineName, deadlineDate, deadlineTime) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Upcoming Deadline Reminder',
        html: `
            <h2>Deadline Reminder</h2>
            <p>You have an upcoming deadline:</p>
            <p><strong>${deadlineName}</strong></p>
            <p>Due: ${deadlineDate} at ${deadlineTime}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Deadline reminder email sent successfully');
    } catch (error) {
        console.error('Error sending deadline reminder email:', error);
    }
};

module.exports = {
    sendEventReminder,
    sendDeadlineReminder
};
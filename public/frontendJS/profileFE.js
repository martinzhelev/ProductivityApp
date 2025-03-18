// // Nutrient Pie Chart
// const nutrientCtx = document.getElementById('nutrientChart').getContext('2d');
// new Chart(nutrientCtx, {
//     type: 'pie',
//     data: {
//         labels: ['Fat', 'Carbs', 'Protein'],
//         datasets: [{
//             data: [
//                 parseFloat(window.profileData.nutrients.fat),
//                 parseFloat(window.profileData.nutrients.carbs),
//                 parseFloat(window.profileData.nutrients.protein)
//             ],
//             backgroundColor: ['#ff6384', '#36a2eb', '#ffcd56'],
//             borderWidth: 1
//         }]
//     },
//     options: { responsive: true, maintainAspectRatio: false }
// });

// // Weekly Calorie Intake Bar Graph
// const calorieCtx = document.getElementById('calorieChart').getContext('2d');
// const days = Array.from({ length: 7 }, (_, i) => {
//     const d = new Date();
//     d.setDate(d.getDate() - i);
//     return d.toISOString().split('T')[0];
// }).reverse();
// const weeklyCalories = JSON.parse(window.profileData.weeklyCalories);
// const intakeData = days.map(day => {
//     const entry = weeklyCalories.find(d => d.day === day);
//     return entry ? entry.intake : 0;
// });
// new Chart(calorieCtx, {
//     type: 'bar',
//     data: {
//         labels: days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
//         datasets: [
//             { label: 'Intake', data: intakeData, backgroundColor: '#36a2eb' }
//         ]
//     },
//     options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
// });

// // Habit Completion Line Chart (All Time)
// const habitCtx = document.getElementById('habitChart').getContext('2d');
// const habits = JSON.parse(window.profileData.habits);
// new Chart(habitCtx, {
//     type: 'line',
//     data: {
//         labels: habits.map(h => new Date(h.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
//         datasets: [{
//             label: 'Completed',
//             data: habits.map(h => h.completed ? 1 : 0),
//             borderColor: '#ffcd56',
//             fill: false,
//             tension: 0.1
//         }]
//     },
//     options: { 
//         responsive: true, 
//         maintainAspectRatio: false, 
//         scales: { 
//             y: { beginAtZero: true, max: 1, ticks: { stepSize: 1 } },
//             x: { ticks: { maxRotation: 45, minRotation: 45 } }
//         } 
//     }
// });

// // Reading Progress Bar Chart
// const readingCtx = document.getElementById('readingChart').getContext('2d');
// const readingData = JSON.parse(window.profileData.reading);
// new Chart(readingCtx, {
//     type: 'bar',
//     data: {
//         labels: days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })),
//         datasets: [{
//             label: 'Pages Read',
//             data: days.map(day => {
//                 const entry = readingData.find(r => r.day === day);
//                 return entry ? entry.pages : 0;
//             }),
//             backgroundColor: '#28a745'
//         }]
//     },
//     options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
// });
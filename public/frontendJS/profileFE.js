// Core Stats Chart Configuration
document.addEventListener('DOMContentLoaded', function() {
    // Core Stats Chart
    const ctx = document.getElementById('coreStatsChart').getContext('2d');
    const coreStats = window.profileData.coreStats;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Strength', 'Speed', 'Mental', 'Social', 'Work', 'Agility', 'Financial'],
            datasets: [{
                data: [
                    coreStats.strength,
                    coreStats.speed,
                    coreStats.mental,
                    coreStats.social,
                    coreStats.work,
                    coreStats.agility,
                    coreStats.financial
                ],
                backgroundColor: [
                    '#FF6B6B',
                    '#4ECDC4',
                    '#45B7D1',
                    '#96CEB4',
                    '#FFEEAD',
                    '#D4A5A5',
                    '#9B59B6'
                ],
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        stepSize: 20
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw}%`;
                        }
                    }
                }
            }
        }
    });

    // Nutrient Pie Chart
    const nutrientCtx = document.getElementById('nutrientChart').getContext('2d');
    const nutrients = window.profileData.nutrients;
    
    new Chart(nutrientCtx, {
        type: 'doughnut',
        data: {
            labels: ['Fat', 'Carbs', 'Protein'],
            datasets: [{
                data: [nutrients.fat, nutrients.carbs, nutrients.protein],
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}g`;
                        }
                    }
                }
            }
        }
    });

    // Add section fade-in animation
    const sections = document.querySelectorAll('.section-fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => observer.observe(section));

    // Add data refresh functionality
    const refreshButton = document.getElementById('dataRefresh');
    let lastUpdate = new Date();

    function checkForUpdates() {
        const now = new Date();
        const timeDiff = now - lastUpdate;
        if (timeDiff > 5 * 60 * 1000) { // 5 minutes
            refreshButton.classList.add('show');
        }
    }

    setInterval(checkForUpdates, 60000); // Check every minute

    refreshButton.addEventListener('click', function() {
        // Add loading state
        sections.forEach(section => {
            section.innerHTML = '<div class="loading"></div>';
        });

        // Simulate data refresh
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    });
});
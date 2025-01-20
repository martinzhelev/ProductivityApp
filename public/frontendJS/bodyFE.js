const userId = getCookie('userId');

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function markWorkoutComplete(checkbox) {
  const isCompleted = checkbox.checked;
  const date = checkbox.getAttribute('data-date'); // Retrieve the workout ID

  if (!date) {
      console.error('date is null or undefined');
      return; // Exit if no workout ID is present
  }

  const userId = getCookie('userId');

  // Make an AJAX request to update workout status
  fetch(`/body/${userId}`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date, isCompleted }), // Send workoutId instead of date
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          console.log('Workout status updated successfully.');
      } else {
          console.error('Error updating workout status:', data.message);
      }
  })
  .catch(error => {
      console.error('Error:', error);
  });
}


// Add event listeners to checkboxes once the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const checkboxes = document.querySelectorAll('.workout-checkbox'); // Select all checkboxes with the class 'workout-checkbox'
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            markWorkoutComplete(event.target); // Call the existing function when a checkbox state changes
        });
    });
});

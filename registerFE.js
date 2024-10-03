window.onload = function() {
    let registerButton = document.getElementById("registerButton");
    
    // Ensure the button exists before adding an event listener
    if (registerButton) {
        registerButton.onclick = function(event){
            
            event.preventDefault(); // Prevent the form from submitting
            
            let username = document.getElementById("username").value;
            let emailAddress = document.getElementById("email").value;
            let password = document.getElementById("password").value;
            let confirmPassword = document.getElementById("confirm-password").value;

            // Check if passwords match
            if (password !== confirmPassword) {
                alert("Passwords do not match");
                return;
            }

            // Check if all fields are filled
            if (!username || !emailAddress || !password) {
                alert("Please fill in all fields");
                return;
            }

            // Create user object
            let userObject = {
                username: username,
                email: emailAddress,
                password: password
            };

            // Send the form data to the back-end using fetch
            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userObject)
            })
            .then(response => {
                // Check for non-200 responses
                if (!response.ok) {
                    return response.json().then(errData => { throw new Error(errData.message); });
                }
                return response.json();
            })
            .then(data => {
                // Provide feedback to the user
                alert(data.message);  // You can display this on the page instead of using an alert
            })
            .catch(error => {
                console.error('Error:', error);
                alert("An error occurred: " + error.message);
            });
        };
    } else {
        console.error("Register button not found");
    }
};

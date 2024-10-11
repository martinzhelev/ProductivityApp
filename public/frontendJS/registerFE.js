
    function validatePassword(password) {
        // Regular expression for validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[~!@#\$%\^&\*\_\-\+\(\)\[\]\{\}><\/\\\|\"\'\.,:;])[\w~!@#\$%\^&\*\_\-\+\(\)\[\]\{\}><\/\\\|\"\'\.,:;]{8,128}$/;
    
        // Check if the password contains spaces
        if (/\s/.test(password)) {
            return "Password should not contain any spaces.";
        }
    
        // Validate the password using the regex
        if (!passwordRegex.test(password)) {
            return "Password must be 8-128 characters long, contain at least one uppercase letter, one lowercase letter, one numeral, and one special character from the allowed set.";
        }
    
        return "Password is valid!"
    }



    let registerButton = document.getElementById("registerButton");
    
    // Ensure the button exists before adding an event listener
    if (registerButton) {
        registerButton.onclick = function(event){
            
            event.preventDefault(); // Prevent the form from submitting
            
            let username = document.getElementById("username").value;
            let emailAddress = document.getElementById("email").value;
            let password = document.getElementById("password").value;
            let confirmPassword = document.getElementById("confirm-password").value;
            console.log(username, password)

            // Check if passwords match
            if (password !== confirmPassword) {
                alert("Passwords do not match");
                return;
            }
            if (!username || !emailAddress || !password) {
                alert("Please fill in all fields");
                return;
            }
            if (validatePassword(password) !== "Password is valid!") {
                alert(validatePassword(password));  
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
                if (data.message === 'User registered successfully') {
                    alert(data.message)
                    window.location.href = data.redirectUrl;
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("An error occurred: " + error.message);
            });
            
        };
    } else {
        console.error("Register button not found");
    }

 
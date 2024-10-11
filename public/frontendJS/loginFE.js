console.log("login page loaded");

let loginButton = document.getElementById("loginButton");

if (loginButton) {
    loginButton.onclick = (event) => {
        event.preventDefault();  // Prevent the default form submission behavior

        let username = document.getElementById("login_username").value;
        let password = document.getElementById("login_password").value;

        let userObject = {
            username: username,
            password: password
        };

        console.log("Attempting to login with:", userObject);

        fetch('/login', {
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
            return response.json();  // Return the parsed JSON response
        })
        .then(data => {
            if (data.message === 'Login successful') {
                window.location.href = data.redirectUrl;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("An error occurred: " + error.message);
        });
    };
} else {
    console.error("Login button not found");
}

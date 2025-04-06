console.log("Logout page loaded");

// Function to clear any local storage or session storage
function clearLocalData() {
    localStorage.clear();
    sessionStorage.clear();
}

// Function to clear cookies
function clearCookies() {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
}

// Execute cleanup when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Clear local storage and session storage
    clearLocalData();
    
    // Clear cookies
    clearCookies();
    
    // Redirect to login page after 1 second
    setTimeout(() => {
        window.location.href = '/login';
    }, 1000);
}); 
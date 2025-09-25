document.addEventListener("DOMContentLoaded", () => {
    console.log("Subscription page loaded");

    // Get user ID from cookies
    function getCookie(name) {
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
            const [cookieName, cookieValue] = cookie.split("=");
            if (cookieName === name) {
                return decodeURIComponent(cookieValue);
            }
        }
        return null;
    }

    const userId = getCookie("userId");
    console.log("User ID:", userId);

    // Subscribe button functionality
    const subscribeBtn = document.getElementById("subscribeBtn");
    if (subscribeBtn) {
        subscribeBtn.addEventListener("click", async (event) => {
            event.preventDefault();
            console.log("Subscribe button clicked");

            // Disable button and show loading state
            subscribeBtn.disabled = true;
            subscribeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
            subscribeBtn.classList.add('btn','btn-primary');

            try {
                console.log("Creating checkout session...");
                const response = await fetch("/stripe/create-checkout-session", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include"
                });

                console.log("Response status:", response.status);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || errorData.message || "Failed to create checkout session");
                }

                const data = await response.json();
                console.log("Checkout session created:", data);

                if (data.url) {
                    console.log("Redirecting to Stripe checkout...");
                    window.location.href = data.url;
                } else {
                    throw new Error("No checkout URL received");
                }

            } catch (error) {
                console.error("Error creating checkout session:", error);
                alert("Failed to redirect to Stripe: " + error.message);
                
                // Re-enable button
                subscribeBtn.disabled = false;
                subscribeBtn.innerHTML = '<i class="fas fa-credit-card me-2"></i>Subscribe via Stripe';
                subscribeBtn.classList.add('btn','btn-success');
            }
        });
    } else {
        console.log("Subscribe button not found");
    }

    // Cancel subscription button functionality
    const cancelSubscriptionBtn = document.getElementById("cancelSubscriptionBtn");
    if (cancelSubscriptionBtn) {
        cancelSubscriptionBtn.addEventListener("click", async (event) => {
            event.preventDefault();
            console.log("Cancel subscription button clicked");

            if (confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.")) {
                // Disable button and show loading state
                cancelSubscriptionBtn.disabled = true;
                cancelSubscriptionBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Canceling...';
                cancelSubscriptionBtn.classList.add('btn','btn-outline-danger');

                try {
                    console.log("Canceling subscription...");
                    const response = await fetch("/stripe/cancel-subscription", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        credentials: "include"
                    });

                    console.log("Response status:", response.status);
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || errorData.message || "Failed to cancel subscription");
                    }

                    const data = await response.json();
                    console.log("Subscription canceled:", data);

                    if (data.success) {
                        alert("Subscription will be canceled at the end of the current period.");
                        window.location.reload();
                    } else {
                        throw new Error(data.error || "Failed to cancel subscription");
                    }

                } catch (error) {
                    console.error("Error canceling subscription:", error);
                    alert("Could not cancel subscription: " + error.message);
                    
                    // Re-enable button
                    cancelSubscriptionBtn.disabled = false;
                    cancelSubscriptionBtn.innerHTML = '<i class="fas fa-times me-2"></i>Cancel Subscription';
                    cancelSubscriptionBtn.classList.add('btn','btn-outline-danger');
                }
            }
        });
    } else {
        console.log("Cancel subscription button not found");
    }

    // Reactivate subscription button functionality
    const reactivateSubscriptionBtn = document.getElementById("reactivateSubscriptionBtn");
    if (reactivateSubscriptionBtn) {
        reactivateSubscriptionBtn.addEventListener("click", async (event) => {
            event.preventDefault();
            console.log("Reactivate subscription button clicked");

            if (confirm("Reactivate your subscription?")) {
                // Disable button and show loading state
                reactivateSubscriptionBtn.disabled = true;
                reactivateSubscriptionBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Reactivating...';
                reactivateSubscriptionBtn.classList.add('btn','btn-outline-success');

                try {
                    console.log("Reactivating subscription...");
                    const response = await fetch("/stripe/reactivate-subscription", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        credentials: "include"
                    });

                    console.log("Response status:", response.status);
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || errorData.message || "Failed to reactivate subscription");
                    }

                    const data = await response.json();
                    console.log("Subscription reactivated:", data);

                    if (data.success) {
                        alert("Subscription reactivated successfully!");
                        window.location.reload();
                    } else {
                        throw new Error(data.error || "Failed to reactivate subscription");
                    }

                } catch (error) {
                    console.error("Error reactivating subscription:", error);
                    alert("Could not reactivate subscription: " + error.message);
                    
                    // Re-enable button
                    reactivateSubscriptionBtn.disabled = false;
                    reactivateSubscriptionBtn.innerHTML = '<i class="fas fa-play me-2"></i>Reactivate Subscription';
                    reactivateSubscriptionBtn.classList.add('btn','btn-outline-success');
                }
            }
        });
    } else {
        console.log("Reactivate subscription button not found");
    }

    // Debug: Log subscription info if available
    if (typeof subscriptionInfo !== 'undefined') {
        console.log("Subscription info:", subscriptionInfo);
    }
});

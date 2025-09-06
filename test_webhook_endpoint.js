// Test script to verify webhook endpoint is accessible
const https = require('https');
const http = require('http');

async function testWebhookEndpoint() {
    console.log('🔍 Testing webhook endpoint accessibility...\n');
    
    const webhookUrl = 'https://amblezio.com/stripe/webhook';
    
    try {
        console.log('Testing webhook endpoint:', webhookUrl);
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Stripe-Signature': 'test-signature'
            },
            body: JSON.stringify({ test: 'data' })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.status === 400) {
            console.log('✅ Webhook endpoint is accessible!');
            console.log('   (400 error is expected for invalid signature)');
        } else if (response.status === 404) {
            console.log('❌ Webhook endpoint not found (404)');
        } else {
            console.log('⚠️  Unexpected response:', response.status);
        }
        
    } catch (error) {
        console.error('❌ Error testing webhook endpoint:', error.message);
    }
}

// Run the test
testWebhookEndpoint().catch(console.error);

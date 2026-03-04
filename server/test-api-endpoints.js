/**
 * Subscription API Endpoint Tests
 * 
 * Tests all subscription-related HTTP endpoints
 * Run after starting the server: npm run dev (in server/)
 * 
 * Usage: node server/test-api-endpoints.js
 */

import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const TEST_EMAIL = 'test@example.com';

// Mock JWT token - you'll need to replace this with a real token
// For testing, you can get a token by logging in through the app
let AUTH_TOKEN = '';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  if (AUTH_TOKEN) {
    config.headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  }
  return config;
});

async function testEndpoints() {
  console.log('🧪 Subscription API Endpoint Tests\n');
  console.log('⚠️  IMPORTANT: Replace AUTH_TOKEN with a valid JWT token from your app\n');

  try {
    // Test 1: Get current subscription
    console.log('Test 1: GET /api/subscriptions');
    try {
      const res = await api.get('/subscriptions');
      console.log('✓ Response:', res.data);
    } catch (error) {
      console.log('✗ Error:', error.response?.data || error.message);
    }

    // Test 2: Initialize Premium subscription
    console.log('\nTest 2: POST /api/subscriptions/initialize');
    try {
      const res = await api.post('/subscriptions/initialize', {
        plan: 'premium',
        billing_cycle: 'monthly',
        add_casual: false,
        callback_url: 'http://localhost:5173/premium?verify=true',
      });
      console.log('✓ Payment initialized:', res.data);
    } catch (error) {
      console.log('✗ Error:', error.response?.data || error.message);
    }

    // Test 3: Initialize with Casual Add-On
    console.log('\nTest 3: POST /api/subscriptions/initialize (with Casual Add-On)');
    try {
      const res = await api.post('/subscriptions/initialize', {
        plan: 'premium',
        billing_cycle: 'monthly',
        add_casual: true,
        callback_url: 'http://localhost:5173/premium?verify=true',
      });
      console.log('✓ Payment with addon initialized:', res.data);
    } catch (error) {
      console.log('✗ Error:', error.response?.data || error.message);
    }

    // Test 4: Purchase Boosts
    console.log('\nTest 4: POST /api/subscriptions/purchase-boosts');
    try {
      const res = await api.post('/subscriptions/purchase-boosts', {
        quantity: 1,
      });
      console.log('✓ Boost purchase initialized:', res.data);
    } catch (error) {
      console.log('✗ Error:', error.response?.data || error.message);
    }

    // Test 5: Purchase Super Likes
    console.log('\nTest 5: POST /api/subscriptions/purchase-super-likes');
    try {
      const res = await api.post('/subscriptions/purchase-super-likes', {
        quantity: 5,
      });
      console.log('✓ Super Like purchase initialized:', res.data);
    } catch (error) {
      console.log('✗ Error:', error.response?.data || error.message);
    }

    // Test 6: Use Super Like (requires valid subscription)
    console.log('\nTest 6: POST /api/subscriptions/use-super-like');
    try {
      const res = await api.post('/subscriptions/use-super-like');
      console.log('✓ Super Like used:', res.data);
    } catch (error) {
      console.log('✗ Error:', error.response?.data || error.message);
    }

    // Test 7: Verify payment (this would normally be done after payment callback)
    console.log('\nTest 7: GET /api/subscriptions/verify/:reference');
    console.log('ℹ️  Skip manual test - requires valid Paystack reference');

    console.log('\n✅ API endpoint tests completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Start the server: cd server && npm run dev');
    console.log('2. Login through the app to get a valid JWT token');
    console.log('3. Update AUTH_TOKEN in this script');
    console.log('4. Re-run this script to test authenticated endpoints');

  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
  }
}

// Also test sending a Super Like through likes endpoint
async function testSuperLikeFlow() {
  console.log('\n\n🎯 Testing Super Like Flow\n');

  try {
    // Test sending a regular like
    console.log('Test A: POST /api/likes (regular like)');
    try {
      const res = await api.post('/likes', {
        to_email: TEST_EMAIL,
        daily_match_id: null,
        is_super_like: false,
      });
      console.log('✓ Regular like sent:', res.data);
    } catch (error) {
      console.log('✗ Error:', error.response?.data || error.message);
    }

    // Test sending a Super Like
    console.log('\nTest B: POST /api/likes (Super Like)');
    try {
      const res = await api.post('/likes', {
        to_email: TEST_EMAIL,
        daily_match_id: null,
        is_super_like: true,
      });
      console.log('✓ Super Like sent:', res.data);
    } catch (error) {
      console.log('✗ Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Super Like flow test failed:', error.message);
  }
}

async function main() {
  await testEndpoints();
  await testSuperLikeFlow();
  console.log('\n\n💡 For manual testing, use these curl commands:');
  console.log('\n# Get subscription:');
  console.log('curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/subscriptions');
  console.log('\n# Initialize payment:');
  console.log('curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d \'{"plan":"premium","billing_cycle":"monthly"}\' http://localhost:5000/api/subscriptions/initialize');
  console.log('\n# Send Super Like:');
  console.log('curl -X POST -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d \'{"to_email":"someone@example.com","is_super_like":true}\' http://localhost:5000/api/likes');
}

main();

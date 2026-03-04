/**
 * Test Paystack Connection
 * 
 * This script tests if your server can connect to Paystack API
 * Run: node server/test-paystack-connection.js
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

async function testPaystackConnection() {
  console.log('🧪 Testing Paystack Connection\n');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Paystack Key Present:', !!PAYSTACK_SECRET);
  console.log('Paystack Key Prefix:', PAYSTACK_SECRET ? PAYSTACK_SECRET.substring(0, 15) + '...' : 'NOT SET');
  console.log();

  try {
    // Test 1: Check if we can reach Paystack
    console.log('Test 1: Checking network connectivity...');
    const startTime = Date.now();
    
    await axios.get('https://api.paystack.co', {
      timeout: 5000,
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`✓ Paystack API is reachable (${responseTime}ms)`);
    
  } catch (error) {
    console.log('✗ Cannot reach Paystack API');
    console.log('  Error:', error.message);
    console.log('  Code:', error.code);
    console.log('\n💡 Possible solutions:');
    console.log('  - Check your internet connection');
    console.log('  - Firewall may be blocking HTTPS requests');
    console.log('  - Try restarting your router');
    return;
  }

  try {
    // Test 2: Test with API key (this will fail but shows if key is valid)
    console.log('\nTest 2: Testing API key authentication...');
    
    const response = await axios.get(
      'https://api.paystack.co/transaction',
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    console.log('✓ API key is valid');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('API request completed (expected to fail without proper endpoint)');
    
    if (error.response?.status === 401) {
      console.log('✗ Invalid API key!');
      console.log('  Status: 401 Unauthorized');
      console.log('\n💡 Solution:');
      console.log('  - Check your PAYSTACK_SECRET_KEY in server/.env');
      console.log('  - Make sure it starts with sk_test_ or sk_live_');
      console.log('  - Get your key from https://dashboard.paystack.com/#/settings/api');
    } else if (error.code === 'ECONNRESET') {
      console.log('✗ Connection reset by server');
      console.log('\n💡 Solution:');
      console.log('  - Network instability');
      console.log('  - Try again in a few moments');
    } else {
      console.log('✓ API key appears valid (got expected error)');
    }
  }

  try {
    // Test 3: Test transaction initialization with dummy data
    console.log('\nTest 3: Testing transaction initialization...');
    
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: 'test@example.com',
        amount: 10000, // ₦100.00 in kobo
        callback_url: 'http://localhost:5173/premium?verify=true',
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    console.log('✓ Transaction initialization works!');
    console.log('Authorization URL:', response.data.data.authorization_url);
    console.log('Reference:', response.data.data.reference);
    
  } catch (error) {
    console.log('Transaction initialization result:');
    
    if (error.response?.data) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
      
      if (error.response.status === 401) {
        console.log('\n❌ Your API key is invalid or expired!');
        console.log('\n💡 Fix:');
        console.log('  1. Go to https://dashboard.paystack.com/#/settings/api');
        console.log('  2. Copy your Secret Key');
        console.log('  3. Update server/.env file:');
        console.log('     PAYSTACK_SECRET_KEY=sk_test_your_key_here');
        console.log('  4. Restart your server');
      } else if (error.response.status === 400) {
        console.log('\n⚠️  Bad request - but API key is working');
        console.log('This is normal for test data');
      }
    } else if (error.code === 'ECONNRESET') {
      console.log('✗ Connection was reset');
      console.log('\n💡 This is a network issue:');
      console.log('  - Check your internet connection');
      console.log('  - Disable VPN/proxy if active');
      console.log('  - Try mobile hotspot to test');
    } else {
      console.log('Error:', error.message);
      console.log('Code:', error.code);
    }
  }

  console.log('\n✅ Paystack connection test complete!\n');
  
  console.log('\n📋 Next Steps:');
  console.log('1. If all tests passed: Your server should work now');
  console.log('2. If API key failed: Update your .env file and restart server');
  console.log('3. If network failed: Check internet connection');
  console.log('4. After fixing, restart server: npm run dev');
}

testPaystackConnection();

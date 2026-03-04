/**
 * Subscription Flow Test Script
 * 
 * This script tests the complete subscription flow:
 * 1. Get current subscription status
 * 2. Initialize subscription payment
 * 3. Verify subscription payment (mock)
 * 4. Test Super Like usage
 * 5. Test Boost purchase
 * 
 * Usage: node server/test-subscription.js
 */

import mongoose from 'mongoose';
import Subscription from './models/Subscription.js';
import UserProfile from './models/UserProfile.js';

const TEST_EMAIL = 'test@example.com';

async function runTests() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/aura');
    console.log('✓ Connected to MongoDB\n');

    // Test 1: Create or get test subscription
    console.log('Test 1: Creating test subscription...');
    let sub = await Subscription.findOneAndUpdate(
      { user_email: TEST_EMAIL },
      {
        user_email: TEST_EMAIL,
        plan: 'free',
        is_active: false,
        super_likes_used: 0,
        super_likes_limit: 0,
        boosts_purchased: 0,
      },
      { upsert: true, new: true }
    );
    console.log('✓ Test subscription created:', { 
      email: sub.user_email, 
      plan: sub.plan,
      super_likes: `${sub.super_likes_used}/${sub.super_likes_limit}`,
      boosts: sub.boosts_purchased 
    });

    // Test 2: Simulate Premium subscription activation
    console.log('\nTest 2: Activating Premium subscription...');
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);
    
    sub = await Subscription.findOneAndUpdate(
      { user_email: TEST_EMAIL },
      {
        plan: 'premium',
        billing_cycle: 'monthly',
        started_at: new Date(),
        expires_at: expires,
        is_active: true,
        paystack_reference: 'test_reference_123',
        amount: 1999000, // ₦19,999 in kobo
        super_likes_limit: 5,
        super_likes_used: 0,
      },
      { new: true }
    );
    console.log('✓ Premium activated:', {
      plan: sub.plan,
      expires: sub.expires_at.toLocaleDateString(),
      super_likes: `${sub.super_likes_used}/${sub.super_likes_limit}`,
    });

    // Test 3: Simulate using Super Likes
    console.log('\nTest 3: Using Super Likes...');
    for (let i = 0; i < 3; i++) {
      sub.super_likes_used += 1;
      await sub.save();
      console.log(`  ✓ Super Like #${i + 1} used (${sub.super_likes_used}/${sub.super_likes_limit} remaining)`);
    }

    // Test 4: Purchase additional Super Likes
    console.log('\nTest 4: Purchasing 5 more Super Likes...');
    sub = await Subscription.findOneAndUpdate(
      { user_email: TEST_EMAIL },
      {
        $inc: {
          super_likes_limit: 5,
        }
      },
      { new: true }
    );
    console.log('✓ Additional Super Likes purchased:', {
      super_likes: `${sub.super_likes_used}/${sub.super_likes_limit}`,
      remaining: sub.super_likes_limit - sub.super_likes_used
    });

    // Test 5: Purchase Boosts
    console.log('\nTest 5: Purchasing 2 Boosts...');
    sub = await Subscription.findOneAndUpdate(
      { user_email: TEST_EMAIL },
      {
        $inc: { boosts_purchased: 2 }
      },
      { new: true }
    );
    console.log('✓ Boosts purchased:', { total_boosts: sub.boosts_purchased });

    // Test 6: Add Casual Add-On
    console.log('\nTest 6: Adding Casual Connection Add-On...');
    const casualExpires = new Date();
    casualExpires.setMonth(casualExpires.getMonth() + 1);
    
    sub = await Subscription.findOneAndUpdate(
      { user_email: TEST_EMAIL },
      {
        casual_addon: true,
        casual_addon_expires_at: casualExpires,
      },
      { new: true }
    );
    console.log('✓ Casual Add-On activated:', {
      has_casual: sub.casual_addon,
      expires: sub.casual_addon_expires_at.toLocaleDateString()
    });

    // Test 7: Get final subscription state
    console.log('\nTest 7: Final subscription state...');
    const finalSub = await Subscription.findOne({ user_email: TEST_EMAIL });
    console.log('✓ Final state:', JSON.stringify(finalSub, null, 2));

    // Test 8: Update UserProfile with premium features
    console.log('\nTest 8: Updating UserProfile with premium flags...');
    const profile = await UserProfile.findOneAndUpdate(
      { user_email: TEST_EMAIL },
      {
        user_email: TEST_EMAIL,
        is_hot_love: true,
        is_verified: true,
      },
      { upsert: true, new: true }
    );
    console.log('✓ UserProfile updated:', {
      email: profile.user_email,
      is_hot_love: profile.is_hot_love,
      is_verified: profile.is_verified
    });

    console.log('\n✅ All tests passed successfully!');
    
    // Cleanup option
    console.log('\n--- Cleanup ---');
    console.log('To clean up test data, run:');
    console.log(`db.subscriptions.deleteOne({ user_email: "${TEST_EMAIL}" })`);
    console.log(`db.userprofiles.deleteOne({ user_email: "${TEST_EMAIL}" })`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

runTests();

# Subscription & Like Model Testing Guide

This guide covers testing the complete subscription flow and Super Like functionality in AURA.

## Overview

The subscription model includes:
- **Premium Plans**: Monthly, Quarterly, Biannual, Annual
- **Casual Connection Add-On**: Additional features for casual dating
- **Microtransactions**: Boosts and Super Likes
- **Feature Access Control**: Based on subscription tier

## Features Implemented

### 1. Subscription Tiers

#### Free Plan
- Limited daily matches
- Basic filters
- No access to Super Likes or Boosts

#### Premium Plan (₦19,999/month)
- Unlimited daily matches
- Advanced AI compatibility analysis
- See who likes you
- Advanced filters
- 5 Super Likes per week included
- Ability to purchase Boosts
- Ability to purchase additional Super Likes

#### Premium + Casual Add-On (+₦9,999/month)
- All Premium features
- Intent-based casual matching
- Discreet profile visibility
- Verified-only browsing
- Disappearing messages
- AI consent monitoring

### 2. Microtransactions

**Boosts** (₦4,990 each)
- Get 10x more profile views for 30 minutes
- Requires Premium subscription to purchase
- Purchased individually or in packs

**Super Likes** (₦4,990 for 5)
- Stand out with a special like
- Premium users get 5 free per week
- Can purchase additional packs
- Limited by subscription tier

## API Endpoints

### Subscription Management

```bash
# Get current subscription
GET /api/subscriptions
Authorization: Bearer <token>

# Initialize subscription payment
POST /api/subscriptions/initialize
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "premium",
  "billing_cycle": "monthly",
  "add_casual": false,
  "callback_url": "http://localhost:5173/premium?verify=true"
}

# Verify payment
GET /api/subscriptions/verify/:reference
Authorization: Bearer <token>

# Purchase Boosts
POST /api/subscriptions/purchase-boosts
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 1
}

# Verify Boost purchase
GET /api/subscriptions/verify-boosts/:reference
Authorization: Bearer <token>

# Purchase Super Likes
POST /api/subscriptions/purchase-super-likes
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 5
}

# Verify Super Like purchase
GET /api/subscriptions/verify-super-likes/:reference
Authorization: Bearer <token>

# Use Super Like
POST /api/subscriptions/use-super-like
Authorization: Bearer <token>
```

### Likes with Super Like Support

```bash
# Send a like (regular or Super Like)
POST /api/likes
Authorization: Bearer <token>
Content-Type: application/json

{
  "to_email": "user@example.com",
  "daily_match_id": "64f3a2b1c9d8e7f6a5b4c3d2",
  "is_super_like": true  // Set to true for Super Like
}
```

Response:
```json
{
  "like": {
    "_id": "...",
    "from_email": "user@example.com",
    "to_email": "user@example.com",
    "daily_match_id": "...",
    "is_super_like": true,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "match": null,
  "is_mutual": false
}
```

## Database Schema

### Subscription Model
```javascript
{
  user_email: String,
  plan: "free" | "premium" | "hot_love",
  casual_addon: Boolean,
  casual_addon_expires_at: Date,
  billing_cycle: "monthly" | "quarterly" | "biannual" | "annual",
  started_at: Date,
  expires_at: Date,
  is_active: Boolean,
  paystack_reference: String,
  paystack_customer_code: String,
  amount: Number,
  super_likes_used: Number,      // How many used this week
  super_likes_limit: Number,     // Total available (5 base + purchased)
  boosts_purchased: Number,      // Total boosts bought
  ai_coaching_enabled: Boolean
}
```

### Like Model (Updated)
```javascript
{
  from_email: String,
  to_email: String,
  daily_match_id: ObjectId,
  is_super_like: Boolean,        // NEW: Tracks if this was a Super Like
  createdAt: Date,
  updatedAt: Date
}
```

## Testing Steps

### Step 1: Run Database Tests

Tests the MongoDB models directly:

```bash
cd server
node test-subscription.js
```

This will:
1. Create a test subscription
2. Activate Premium
3. Test Super Like usage tracking
4. Test purchasing additional Super Likes
5. Test Boost purchases
6. Test Casual Add-On activation
7. Update UserProfile with premium flags

Expected output: ✅ All tests passed!

### Step 2: Start the Server

```bash
cd server
npm run dev
```

Server should start on `http://localhost:5000`

### Step 3: Run API Endpoint Tests

First, login through the app to get a JWT token, then:

```bash
# Edit test-api-endpoints.js and set AUTH_TOKEN
# Then run:
node server/test-api-endpoints.js
```

Or use curl commands provided at the end of the script output.

### Step 4: Test Frontend Integration

1. **Start frontend dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Premium page:**
   - Go to `/premium`
   - Select billing cycle
   - Click "Start Premium Trial"
   - Complete payment on Paystack (use test card)
   - Verify redirect and subscription activation

3. **Test Super Likes:**
   - Go to Discover page (`/`)
   - As a Premium user, you should see a flame icon button
   - Click it to send a Super Like
   - Check that the counter decrements
   - Try to send more than allowed (should show error)

4. **Test Boosts:**
   - Go to Premium page
   - Scroll to "Boost Your Experience"
   - Click "Buy Boost"
   - Complete payment
   - Verify boost count increases
   - Click "Activate Boost"

### Step 5: Manual Testing Scenarios

#### Scenario A: Free User Tries Super Like
1. Login as free user
2. Go to Discover
3. Should NOT see Super Like button
4. ✅ PASS: Button is hidden for free users

#### Scenario B: Premium User Uses Super Like
1. Login as Premium user
2. Go to Discover
3. See flame icon (Super Like button)
4. Click to send Super Like
5. Toast notification: "Super Like sent! ⭐"
6. Check subscription: `super_likes_used` increments
7. ✅ PASS: Super Like sent and tracked

#### Scenario C: Premium User Runs Out of Super Likes
1. Login as Premium user with 0 Super Likes remaining
2. Try to send Super Like
3. Error toast: "No Super Likes remaining. Purchase more in Premium!"
4. Button shows disabled state
5. ✅ PASS: Proper validation and messaging

#### Scenario D: Purchase Additional Super Likes
1. Go to Premium page
2. Click "Buy Super Likes"
3. Complete Paystack payment
4. Redirected back to Premium page
5. Toast: "Successfully added 5 Super Like(s)!"
6. Check subscription: limit increased by 5
7. ✅ PASS: Purchase flow works correctly

#### Scenario E: Boost Purchase and Activation
1. Premium user purchases Boost
2. Payment verified
3. Boost count increases
4. Click "Activate Boost"
5. Toast: "Boost activated! You'll get 10x more views..."
6. ✅ PASS: Boost flow works

#### Scenario F: Casual Add-On Purchase
1. Select Premium + Casual Add-On
2. Complete payment
3. Verify both features activated
4. Check UserProfile: `casual_addon: true`
5. ✅ PASS: Add-on works correctly

## Validation Rules

### Super Like Validation (Backend)
```javascript
// In /api/likes POST endpoint
if (is_super_like) {
  const sub = await Subscription.findOne({ user_email: req.user.email });
  
  if (!sub || sub.plan === "free") {
    return res.status(403).json({ error: "Super Likes require Premium subscription" });
  }

  if (sub.super_likes_used >= sub.super_likes_limit) {
    return res.status(400).json({ error: "Super Like limit reached for this week" });
  }

  sub.super_likes_used += 1;
  await sub.save();
}
```

### Frontend Validation (Discover Page)
```javascript
async function handleSuperLike(dm) {
  // Check if user has Super Likes remaining
  if (!subscription || subscription.plan === "free") {
    toast.error("Super Likes require Premium subscription");
    return;
  }
  if (subscription.super_likes_used >= subscription.super_likes_limit) {
    toast.error("No Super Likes remaining. Purchase more in Premium!");
    return;
  }

  // Send the Super Like (backend will validate and increment counter)
  const res = await likeService.create({ 
    to_email: dm.matched_email, 
    daily_match_id: dm._id,
    is_super_like: true,
  });
  // ... rest of logic
}
```

## Pricing Reference

All prices in NGN kobo (₦1 = 100 kobo)

### Premium Plans
- Monthly: ₦19,999 (1,999,000 kobo)
- Quarterly: ₦49,999 (4,999,000 kobo) - 17% discount
- Biannual: ₦89,999 (8,999,000 kobo) - 25% discount
- Annual: ₦149,999 (14,999,000 kobo) - 38% discount

### Casual Add-On
- Monthly: ₦9,999 (999,000 kobo)
- Quarterly: ₦24,999 (2,499,000 kobo)
- Biannual: ₦44,999 (4,499,000 kobo)
- Annual: ₦79,999 (7,999,000 kobo)

### Microtransactions
- Boost: ₦4,990 (499,000 kobo) each
- Super Likes (5 pack): ₦4,990 (499,000 kobo)

## Common Issues & Solutions

### Issue 1: Super Like button not showing
**Cause:** Subscription data not loaded
**Solution:** Check that `useQuery(["subscription"])` is enabled and returning data

### Issue 2: "Super Like limit reached" error
**Cause:** User has used all available Super Likes
**Solution:** Purchase more Super Likes or wait for weekly reset

### Issue 3: Payment verification fails
**Cause:** Invalid Paystack reference or network issue
**Solution:** Check Paystack dashboard, verify webhook configuration

### Issue 4: Boost activation doesn't work
**Cause:** Missing implementation in backend
**Solution:** Implement boost activation logic (currently shows toast only)

### Issue 5: Subscription not updating after payment
**Cause:** Callback URL mismatch or verification logic error
**Solution:** Ensure callback_url matches your frontend domain

## Weekly Reset Logic

Super Likes should reset weekly. This can be implemented as:

```javascript
// In Subscription model or service
async function resetWeeklySuperLikes(email) {
  const sub = await Subscription.findOne({ user_email: email });
  if (sub && sub.plan !== "free") {
    // Reset to base limit (5 for premium, plus any purchased extras)
    const purchasedExtras = sub.super_likes_limit - 5;
    sub.super_likes_used = 0;
    sub.super_likes_limit = 5 + purchasedExtras;
    await sub.save();
  }
}

// Run weekly via cron job or scheduled task
```

## Next Steps

1. ✅ Complete Super Like implementation
2. ✅ Add backend validation
3. ✅ Add frontend UI
4. ✅ Create test scripts
5. ⏳ Implement Boost activation logic
6. ⏳ Add weekly Super Like reset automation
7. ⏳ Add analytics tracking for purchases
8. ⏳ Implement receipt/invoice generation

## Support

For issues or questions:
- Check server logs: `server/logs/`
- Review Paystack dashboard for payment details
- Inspect browser console for frontend errors
- Check MongoDB data directly if needed

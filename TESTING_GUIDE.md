# AURA Premium - Quick Start Testing Guide

## 🚀 Getting Started

### Prerequisites
1. MongoDB running locally or connection string
2. Paystack account (test mode) with SECRET_KEY
3. Node.js installed

### Setup Steps

#### 1. Backend Configuration
Create `server/.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/aura
JWT_SECRET=your_random_secret_here
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
PORT=5000
```

**Get Paystack Test Key:**
1. Go to https://test.paystack.co/settings/developer
2. Copy "Secret Key" (starts with `sk_test_`)
3. Paste in `.env`

#### 2. Install Dependencies
```bash
# Backend
cd server
npm install

# Frontend (new terminal)
cd ..
npm install
```

#### 3. Run the Application
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
npm run dev
```

App will be available at: `http://localhost:5173`

---

## 🧪 Testing Premium Features

### Test User Flow

#### Step 1: Create Account
1. Go to `http://localhost:5173`
2. Sign up with test email
3. Complete profile setup

#### Step 2: Access Premium Page
1. Navigate to Profile tab
2. Click "Premium ✨" button
3. Or go directly to `http://localhost:5173/premium`

#### Step 3: Select Plan
1. Choose billing cycle:
   - Monthly (₦19,999)
   - Quarterly (₦49,999) - Save 17%
   - Biannual (₦89,999) - Save 25%
   - Annual (₦149,999) - Save 38%

2. Toggle "Add Casual Connection features" (+₦9,999/month)
   - See total price update
   - Review Casual Add-On features

3. Click "Start Premium Trial"

#### Step 4: Payment (Test Mode)
1. Paystack checkout page opens
2. Use test card details:
   ```
   Card Number: 4187 4200 0000 0000
   CVV: Any 3 digits (e.g., 123)
   Expiry: Any future date (e.g., 12/25)
   OTP: 12345 (if prompted)
   ```

3. Complete payment

#### Step 5: Verification
1. Redirected back to `/premium?verify=true&reference=...`
2. Automatic verification runs
3. Success toast appears
4. Redirected to Profile page

#### Step 6: Verify Activation
Check Profile page shows:
- ✅ Premium Status Card (purple gradient)
- ✅ Plan type: "Premium"
- ✅ Billing cycle displayed
- ✅ Renewal date shown
- ✅ "Active" badge
- ✅ "Manage Subscription" button

---

## 🎯 Feature Testing Checklist

### Premium Features to Test:

#### 1. **Profile Badge Display**
- [ ] Crown icon visible on profile
- [ ] Premium status card shows correct info
- [ ] Expiration date accurate

#### 2. **Incognito Mode** (Premium Feature)
- [ ] Toggle works only for Premium users
- [ ] Free users see "Requires Premium" message
- [ ] Incognito badge appears when active

#### 3. **Navigation**
- [ ] Premium page accessible at `/premium`
- [ ] Profile → Premium button works
- [ ] Manage Subscription button works

#### 4. **Casual Add-On** (If Selected)
- [ ] Flame icon appears in status card
- [ ] "Casual Add-On Active" text visible
- [ ] Correct expiration date shown

---

## 🔍 Backend Testing (Optional)

### API Endpoints to Test

Use Postman or Thunder Client:

#### 1. Get Subscription Status
```http
GET http://localhost:5000/api/subscriptions
Authorization: Bearer YOUR_JWT_TOKEN
```

Expected Response:
```json
{
  "_id": "...",
  "user_email": "test@example.com",
  "plan": "premium",
  "billing_cycle": "monthly",
  "is_active": true,
  "casual_addon": false,
  "expires_at": "2024-04-03T00:00:00.000Z",
  "amount": 1999000
}
```

#### 2. Initialize Payment (Manual Test)
```http
POST http://localhost:5000/api/subscriptions/initialize
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "plan": "premium",
  "billing_cycle": "quarterly",
  "add_casual": true
}
```

#### 3. Verify Payment
```http
GET http://localhost:5000/api/subscriptions/verify/YOUR_REFERENCE
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🐛 Troubleshooting

### Issue: Payment Not Verifying
**Solution:** Check Paystack webhook configuration or manually verify in database:
```javascript
// MongoDB Compass or CLI
db.subscriptions.findOne({ user_email: "test@example.com" })
```

### Issue: Premium Features Not Unlocking
**Solution:** 
1. Check subscription is active: `sub.is_active === true`
2. Check plan is correct: `sub.plan === "premium"`
3. Clear browser cache and reload

### Issue: Paystack Not Loading
**Solution:**
1. Verify `PAYSTACK_SECRET_KEY` in `.env`
2. Check you're using test key (`sk_test_...`)
3. Ensure backend is running on port 5000

### Issue: MongoDB Connection Error
**Solution:**
1. Start MongoDB: `mongod`
2. Check connection string in `.env`
3. Verify MongoDB is running: `mongo --eval "db.version()"`

---

## 💳 Test Card Details (Paystack)

| Card Type | Card Number | Result |
|-----------|-------------|--------|
| Visa | 4187 4200 0000 0000 | Success |
| Mastercard | 5348 0000 0000 0009 | Success |
| Declined | 4187 4200 0000 0018 | Declined |

**OTP for 3D Secure:** `12345`

---

## 📊 Database Inspection

### Check Subscription in MongoDB
```bash
# MongoDB Shell
use aura
db.subscriptions.find({ user_email: "test@example.com" }).pretty()
```

### Expected Document Structure
```javascript
{
  "_id": ObjectId("..."),
  "user_email": "test@example.com",
  "plan": "premium",
  "billing_cycle": "monthly",
  "casual_addon": false,
  "started_at": ISODate("2024-03-03T00:00:00.000Z"),
  "expires_at": ISODate("2024-04-03T00:00:00.000Z"),
  "is_active": true,
  "paystack_reference": "T123456789",
  "amount": 1999000,
  "super_likes_used": 0,
  "super_likes_limit": 5,
  "boosts_purchased": 0
}
```

---

## ✅ Success Criteria

Your Premium implementation is working correctly if:

1. ✅ Can navigate to Premium page
2. ✅ Can select billing cycle
3. ✅ Can toggle Casual Add-On
4. ✅ Paystack checkout loads
5. ✅ Test payment processes successfully
6. ✅ Verification completes automatically
7. ✅ Premium status displays on profile
8. ✅ Incognito mode unlocks for Premium users
9. ✅ Subscription data saved in database
10. ✅ Expiration date calculated correctly

---

## 🎉 Next Steps After Testing

### Phase 2 Implementation:
1. AI Compatibility Analysis
2. Advanced Filters for Premium users
3. Intent-Based Matching system
4. Privacy features (blurred photos)
5. Boost functionality
6. Date Events integration

### Production Deployment:
1. Switch Paystack to live keys
2. Update MongoDB to production database
3. Configure webhooks for automatic renewal
4. Set up analytics tracking
5. Add email notifications

---

## 📞 Support

For issues or questions:
- Check `PREMIUM_IMPLEMENTATION.md` for detailed documentation
- Review Paystack test mode docs: https://paystack.com/docs/guides/testing/
- Inspect browser console for frontend errors
- Check backend logs for API errors

Happy Testing! 🚀

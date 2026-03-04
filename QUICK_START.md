# 🚀 QUICK START GUIDE - AURA Premium Features

## Get Started in 5 Minutes

### Step 1: Setup Environment (2 min)

Create `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/aura
JWT_SECRET=your_random_secret_123
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
PORT=5000
```

**Get Paystack Test Key:**
1. Visit https://test.paystack.co/settings/developer
2. Copy "Secret Key" (starts with `sk_test_`)
3. Paste in `.env`

---

### Step 2: Install & Run (2 min)

```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend (new terminal)
npm install
npm run dev
```

**App runs at:** `http://localhost:5173`

---

### Step 3: Test New Features (1 min)

#### Test Privacy Settings:
1. Navigate to `/privacy`
2. See all privacy controls
3. Try toggling settings (requires Premium subscription)

#### Test Date Events:
1. Go to your Profile
2. Set preferred date types
3. Check event suggestions (coming soon to UI)

---

## 🎯 Feature Quick Tests

### Privacy Features:

| Feature | Route | What to Test |
|---------|-------|-------------|
| Incognito Mode | `/privacy` | Toggle on/off |
| Blurred Photos | `/privacy` | Upload blurred version |
| Screenshot Alerts | `/privacy` | Enable notifications |
| Disappearing Messages | `/privacy` | Casual Add-On only |

### Date Events:

| Feature | API Endpoint | Test With |
|---------|-------------|-----------|
| Suggestions | `GET /api/date-events/suggestions` | Postman |
| Event Types | `GET /api/date-events/types` | Postman |
| Preferences | `PUT /api/date-events/preferences` | Postman |
| Propose Date | `POST /api/date-events/propose-date` | Postman |

---

## 🧪 Test Payment Flow

### Upgrade to Premium:

1. Go to `/premium`
2. Select billing cycle (e.g., Monthly)
3. Click "Start Premium Trial"
4. Use test card: **4187 4200 0000 0000**
   - CVV: `123`
   - Expiry: `12/25`
   - OTP: `12345`
5. Verify activation on `/profile`

### Add Casual Connection:

1. On `/premium` page
2. Toggle "Add Casual Connection"
3. See total price update
4. Complete payment
5. Check `/privacy` for unlocked features

---

## 📱 New Routes Added

| Route | Purpose | Access |
|-------|---------|--------|
| `/privacy` | Privacy Settings | All users |
| `/premium` | Premium Landing | All users |
| `/profile` | Profile + Subscription Status | Logged in |

---

## 🔧 API Endpoints Quick Reference

### Privacy:
```bash
GET    /api/privacy/settings              # Get privacy settings
PUT    /api/privacy/settings              # Update settings
POST   /api/privacy/upload-blurred-photo  # Upload blurred photo
GET    /api/privacy/public-photos/:email  # Get public photos
POST   /api/privacy/enable-disappearing-messages  # Enable disappearing msgs
```

### Date Events:
```bash
GET    /api/date-events/suggestions       # Get event suggestions
GET    /api/date-events/types             # Get event types
PUT    /api/date-events/preferences       # Update preferences
POST   /api/date-events/propose-date      # Propose date to match
```

### Subscriptions:
```bash
GET    /api/subscriptions                 # Get current subscription
POST   /api/subscriptions/initialize      # Start payment
GET    /api/subscriptions/verify/:ref     # Verify payment
POST   /api/subscriptions/purchase-boosts # Buy boosts
POST   /api/subscriptions/use-super-like  # Use Super Like
```

---

## 🎨 Visual Indicators

### Premium Features Show:
- 👑 Crown icon
- Purple badges
- "Premium" label
- Locked padlock (for free users)

### Casual Add-On Features Show:
- 🔥 Flame icon
- Rose gradient badges
- "Casual Active" banner
- Lock icon (if not subscribed)

---

## ⚡ Quick Troubleshooting

### Issue: Can't access `/privacy`
**Solution:** Make sure you're logged in and route is added in App.jsx

### Issue: Payment not verifying
**Solution:** Check Paystack webhook or manually verify in database

### Issue: Features not unlocking
**Solution:** 
1. Check subscription in DB: `db.subscriptions.findOne({ user_email: "test@example.com" })`
2. Clear browser cache
3. Reload page

### Issue: MongoDB connection error
**Solution:** Start MongoDB: `mongod` or check connection string

---

## 📊 What to Monitor

### During Testing:

1. **Subscription Activation**
   - Check `is_active: true` in database
   - Verify correct plan type
   - Confirm expiration date

2. **Feature Gating**
   - Free users see locked features
   - Premium users see unlocked
   - Casual Add-On shows extra features

3. **Privacy Settings**
   - Toggles persist after refresh
   - Settings save to database
   - Subscription checks work

4. **Event Suggestions**
   - Personalization works
   - Location filtering functional
   - Premium gets more suggestions

---

## ✅ Success Checklist

After setup, verify:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Can access landing page
- [ ] Can sign up/login
- [ ] Can navigate to `/premium`
- [ ] Can navigate to `/privacy`
- [ ] Premium page shows pricing
- [ ] Privacy page shows settings
- [ ] Can toggle non-premium settings
- [ ] Premium gates work (try without subscription)
- [ ] Test payment flow completes
- [ ] Subscription activates after payment
- [ ] Premium features unlock
- [ ] Database has correct data

---

## 🎯 Next Steps After Testing

### For Production Launch:

1. **Switch Paystack to Live**
   - Replace `sk_test_` with `sk_live_`
   - Test with real cards

2. **Deploy Backend**
   - Heroku, Railway, or DigitalOcean
   - Set environment variables
   - Connect to production MongoDB

3. **Deploy Frontend**
   - Vercel, Netlify, or similar
   - Update API base URL
   - Build: `npm run build`

4. **Monitor & Iterate**
   - Track conversions
   - Gather user feedback
   - Fix bugs quickly
   - Add requested features

---

## 🆘 Need Help?

### Documentation Files:

1. **FINAL_PHASE2_SUMMARY.md** - Complete overview
2. **PREMIUM_IMPLEMENTATION.md** - Payment system details
3. **PHASE2_IMPLEMENTATION.md** - Intent matching details
4. **TESTING_GUIDE.md** - Detailed testing scenarios
5. **VISUAL_DEMO_GUIDE.md** - UI/UX visualizations

### Quick Debug Commands:

```bash
# Check MongoDB is running
mongo --eval "db.version()"

# View subscription
mongo
use aura
db.subscriptions.find({ user_email: "test@example.com" }).pretty()

# View profile
db.userprofiles.findOne({ user_email: "test@example.com" })

# Check backend logs
# (Check terminal where `npm run dev` is running)
```

---

## 🎉 You're Ready!

Everything is set up and ready to test. Follow the steps above, and you'll have the full AURA Premium experience running in under 5 minutes!

**Happy Testing!** 🚀❤️

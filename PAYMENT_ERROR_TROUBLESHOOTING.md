# Troubleshooting Payment Initialization Errors

## Error: ECONNRESET when calling /api/subscriptions/initialize

This error means the connection to Paystack was reset. Here's how to diagnose and fix it.

## Quick Fix Steps

### Step 1: Test Your Internet Connection
```bash
# From project root
ping api.paystack.co
```

If this fails, check your internet connection.

### Step 2: Test Paystack Connection
```bash
cd server
node test-paystack-connection.js
```

This will tell you if:
- ✅ Paystack API is reachable
- ✅ Your API key is valid
- ✅ Transaction initialization works

### Step 3: Check Server Logs

After clicking "Start Premium Trial", check the terminal where your server is running. You should now see detailed logs like:

```
Initialize payment request: {
  plan: 'premium',
  billing_cycle: 'monthly',
  add_casual: false,
  user_email: 'user@example.com',
  headers_origin: 'http://localhost:5173'
}
Calling Paystack with amount: 1999000
```

If you see an error, it will now show the specific issue.

## Common Causes & Solutions

### Cause 1: Network Connectivity Issue
**Symptoms:**
- `ECONNRESET` error
- Timeout errors
- Cannot reach Paystack API

**Solutions:**
1. Check your internet connection
2. Disable VPN or proxy temporarily
3. Try a different network (mobile hotspot)
4. Restart your router
5. Check if firewall is blocking outbound HTTPS

### Cause 2: Invalid API Key
**Symptoms:**
- 401 Unauthorized error
- Payment processor authentication failed

**Solution:**
1. Go to https://dashboard.paystack.com/#/settings/api
2. Copy your Secret Key (starts with `sk_test_` or `sk_live_`)
3. Update `server/.env`:
   ```
   PAYSTACK_SECRET_KEY=sk_test_your_key_here
   ```
4. **Restart your server**

### Cause 3: Missing User Email in JWT Token
**Symptoms:**
- Error: "User email not found in token"
- 400 Bad Request

**Solution:**
The JWT token doesn't contain the user's email. Check your auth/signup and auth/login routes to ensure they include email in the token payload:

```javascript
// In server/routes/auth.js
const token = jwt.sign(
  { email: user.email, _id: user._id }, // Make sure email is here
  process.env.JWT_SECRET
);
```

### Cause 4: Axios Timeout
**Symptoms:**
- `ETIMEDOUT` error
- Request takes too long

**Solution:**
Already fixed - added 10 second timeout to the request. If still timing out, it's a network issue.

### Cause 5: Paystack API Down
**Symptoms:**
- Multiple failed requests
- Different error codes
- Works for others but not you

**Check Status:**
Visit https://status.paystack.com to see if there's an outage.

## Testing After Fix

### 1. Restart Server
```bash
cd server
# Press Ctrl+C to stop
npm run dev
```

### 2. Try Again
1. Login to your app
2. Navigate to /premium
3. Click "Start Premium Trial"
4. Watch server logs for the detailed output

### 3. Check Browser Console
Press F12 in your browser and check for any additional errors.

## Expected Flow

When everything works correctly:

```
Frontend → POST /api/subscriptions/initialize
         ↓
Backend validates request
         ↓
Logs: Initialize payment request: {...}
Logs: Calling Paystack with amount: 1999000
         ↓
Calls: https://api.paystack.co/transaction/initialize
         ↓
Paystack responds with authorization_url
         ↓
Logs: Paystack response: {...}
         ↓
Returns: { authorization_url, reference, access_code }
         ↓
Frontend redirects user to Paystack payment page
```

## Manual Test with cURL

If still having issues, test manually:

```bash
# Get a JWT token first (login through the app)
TOKEN="your_jwt_token_here"

# Test the endpoint
curl -X POST http://localhost:5000/api/subscriptions/initialize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "premium",
    "billing_cycle": "monthly",
    "callback_url": "http://localhost:5173/premium?verify=true"
  }'
```

This bypasses the frontend and tests the backend directly.

## Debug Mode

Add this to your server code temporarily for even more logging:

```javascript
// In server/routes/subscriptions.js, add at the top:
import axios from 'axios';

// Enable axios debug logging
axios.interceptors.request.use(request => {
  console.log('Axios Request:', {
    url: request.url,
    method: request.method,
    headers: request.headers,
    data: request.data
  });
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Axios Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('Axios Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    });
    return Promise.reject(error);
  }
);
```

## Still Not Working?

If none of the above helps:

1. **Check if you're behind a corporate firewall**
   - Some companies block external API calls
   - Try from a different network

2. **Test on a different machine**
   - Rules out local configuration issues

3. **Use ngrok for testing**
   - Sometimes localhost has issues
   - `ngrok http 5000` and update callback URLs

4. **Contact Paystack support**
   - If API key is invalid
   - If you suspect account issues

## Success Indicators

You'll know it's working when:
- ✅ Server logs show "Paystack response"
- ✅ Browser redirects to Paystack payment page
- ✅ No ECONNRESET errors
- ✅ Authorization URL is returned

## What Changed in Your Code

I've enhanced the error handling in `server/routes/subscriptions.js`:

1. **Added detailed logging** - Shows exactly what's being sent to Paystack
2. **Better error messages** - Tells you specifically what went wrong
3. **Timeout handling** - 10 second timeout to prevent hanging
4. **Network error detection** - Identifies ECONNRESET and ETIMEDOUT
5. **Authentication error detection** - Identifies 401 errors from Paystack

Now when you click "Start Premium Trial", you'll see exactly where the failure occurs.

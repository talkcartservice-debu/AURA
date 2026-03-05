import { Router } from "express";
import axios from "axios";
import auth from "../middleware/auth.js";
import Subscription from "../models/Subscription.js";
import UserProfile from "../models/UserProfile.js";

const router = Router();
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Pricing in NGN kobo
const PRICING = {
  premium: {
    monthly: 1999000,      // ₦19,999
    quarterly: 4999000,    // ₦49,999
    biannual: 8999000,     // ₦89,999
    annual: 14999000,      // ₦149,999
  },
  casual_addon: {
    monthly: 999000,       // ₦9,999
    quarterly: 2499000,    // ₦24,999
    biannual: 4499000,     // ₦44,999
    annual: 7999000,       // ₦79,999
  },
};

// Get current subscription
router.get("/", auth, async (req, res) => {
  try {
    const sub = await Subscription.findOne({ user_email: req.user.email });
    res.json(sub || { plan: "free", is_active: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize Paystack payment for any plan
router.post("/initialize", auth, async (req, res) => {
  try {
    const { plan, billing_cycle, add_casual, callback_url } = req.body;
    
    console.log('Initialize payment request:', {
      plan,
      billing_cycle,
      add_casual,
      user_email: req.user.email,
      headers_origin: req.headers.origin
    });
    
    // Validate user email exists
    if (!req.user.email) {
      return res.status(400).json({ error: "User email not found in token" });
    }
    
    // Determine amount based on plan and cycle
    let amount;

    if (plan === "premium" && PRICING.premium[billing_cycle]) {
      // Check if user already has an active premium (Silver) subscription
      const existingSub = await Subscription.findOne({
        user_email: req.user.email,
        plan: "premium",
        is_active: true,
      });

      if (add_casual) {
        // Gold-only purchase for existing Silver users
        if (existingSub) {
          if (!PRICING.casual_addon[billing_cycle]) {
            return res.status(400).json({ error: "Invalid billing cycle for Gold Premium" });
          }
          amount = PRICING.casual_addon[billing_cycle];
        } else {
          // Bundle: first time Silver + Gold together
          if (!PRICING.casual_addon[billing_cycle]) {
            return res.status(400).json({ error: "Invalid billing cycle for Gold Premium" });
          }
          amount =
            PRICING.premium[billing_cycle] + PRICING.casual_addon[billing_cycle];
        }
      } else {
        // Silver-only purchase
        amount = PRICING.premium[billing_cycle];
      }
    } else {
      return res.status(400).json({ error: "Invalid plan or billing cycle" });
    }

    console.log('Calling Paystack with amount:', amount);

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amount,
        callback_url: callback_url || `${req.headers.origin}/premium?verify=true`,
        metadata: {
          plan,
          billing_cycle,
          add_casual: add_casual || false,
          user_email: req.user.email,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    console.log('Paystack response:', response.data);

    res.json({
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference,
      access_code: response.data.data.access_code,
    });
  } catch (err) {
    console.error("Paystack init error:", {
      message: err.message,
      response: err.response?.data,
      code: err.code,
      stack: err.stack
    });
    
    // More specific error messages
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({ 
        error: "Unable to connect to payment processor. Please check your internet connection." 
      });
    }
    
    if (err.response?.status === 401) {
      return res.status(500).json({ 
        error: "Payment processor authentication failed. Please contact support." 
      });
    }
    
    res.status(500).json({ error: "Failed to initialize payment" });
  }
});

// Verify Paystack payment and activate subscription
router.get("/verify/:reference", auth, async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const { status, amount, customer, metadata } = response.data.data;

    if (status !== "success") {
      return res.status(400).json({ error: "Payment not successful", status });
    }

    const plan = metadata?.plan || "premium";
    const billing_cycle = metadata?.billing_cycle || "monthly";
    const add_casual = metadata?.add_casual || false;

    // Calculate expiration date based on billing cycle
    const expires = new Date();
    const monthsToAdd = {
      monthly: 1,
      quarterly: 3,
      biannual: 6,
      annual: 12,
    }[billing_cycle];
    expires.setMonth(expires.getMonth() + monthsToAdd);

    // Update or create subscription
    const updateData = {
      plan,
      billing_cycle,
      started_at: new Date(),
      expires_at: expires,
      is_active: true,
      paystack_reference: reference,
      paystack_customer_code: customer?.customer_code,
      amount: amount,
    };

    // Premium + Casual Add-On + AI coaching when requested
    if (add_casual) {
      updateData.casual_addon = true;
      updateData.casual_addon_expires_at = expires;
      updateData.ai_coaching_enabled = true;
    }

    const sub = await Subscription.findOneAndUpdate(
      { user_email: req.user.email },
      updateData,
      { upsert: true, new: true }
    );

    // Update UserProfile with premium features
    const profileUpdate = {};
    if (plan === "premium") {
      profileUpdate.is_hot_love = !!add_casual;
    }
    await UserProfile.findOneAndUpdate(
      { user_email: req.user.email },
      profileUpdate
    );

    res.json({ 
      subscription: sub, 
      message: `Payment verified! Welcome to ${add_casual ? "Premium + Casual" : "Premium"}! ❤️‍🔥` 
    });
  } catch (err) {
    console.error("Paystack verify error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

// Purchase Boosts (microtransaction)
router.post("/purchase-boosts", auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const BOOST_PRICE = 499000; // ₦4,990 per boost in kobo
    const amount = BOOST_PRICE * quantity;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amount,
        callback_url: `${req.headers.origin}/profile?boosts=verified`,
        metadata: {
          type: "boosts",
          quantity,
          user_email: req.user.email,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (err) {
    console.error("Boost purchase error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to initialize boost purchase" });
  }
});

// Verify boosts purchase
router.get("/verify-boosts/:reference", auth, async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const { status, metadata } = response.data.data;

    if (status !== "success") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    const quantity = metadata?.quantity || 1;

    // Update subscription with boosts
    const sub = await Subscription.findOneAndUpdate(
      { user_email: req.user.email },
      { $inc: { boosts_purchased: quantity } },
      { upsert: true, new: true }
    );

    res.json({ message: `Successfully added ${quantity} boost(s)!`, boosts: sub.boosts_purchased });
  } catch (err) {
    console.error("Boost verify error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to verify boost purchase" });
  }
});

// Purchase Super Likes
router.post("/purchase-super-likes", auth, async (req, res) => {
  try {
    const { quantity = 5 } = req.body;
    const SUPER_LIKE_PRICE = 499000; // ₦4,990 in kobo
    const amount = SUPER_LIKE_PRICE * quantity;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: amount,
        callback_url: `${req.headers.origin}/premium?superlikes=verified`,
        metadata: {
          type: "super_likes",
          quantity,
          user_email: req.user.email,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference,
    });
  } catch (err) {
    console.error("Super Like purchase error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to initialize Super Like purchase" });
  }
});

// Verify Super Like purchase
router.get("/verify-super-likes/:reference", auth, async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const { status, metadata } = response.data.data;

    if (status !== "success") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    const quantity = metadata?.quantity || 5;

    // Update super likes limit (add purchased amount)
    const sub = await Subscription.findOneAndUpdate(
      { user_email: req.user.email },
      { 
        $inc: { 
          super_likes_limit: quantity,
          super_likes_used: 0 // Reset used count
        } 
      },
      { upsert: true, new: true }
    );

    res.json({ 
      message: `Successfully added ${quantity} Super Like(s)!`, 
      super_likes_limit: sub.super_likes_limit,
      super_likes_used: sub.super_likes_used
    });
  } catch (err) {
    console.error("Super Like verify error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to verify Super Like purchase" });
  }
});

// Use Super Like
router.post("/use-super-like", auth, async (req, res) => {
  try {
    const sub = await Subscription.findOne({ user_email: req.user.email });
    
    if (!sub || sub.plan === "free") {
      return res.status(403).json({ error: "Super Likes require Premium subscription" });
    }

    if (sub.super_likes_used >= sub.super_likes_limit) {
      return res.status(400).json({ error: "Super Like limit reached for this week" });
    }

    sub.super_likes_used += 1;
    await sub.save();

    res.json({ message: "Super Like sent!", remaining: sub.super_likes_limit - sub.super_likes_used });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

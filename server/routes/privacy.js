import { Router } from "express";
import auth from "../middleware/auth.js";
import UserProfile from "../models/UserProfile.js";
import Message from "../models/Message.js";
import Subscription from "../models/Subscription.js";

const router = Router();

// Get privacy settings for current user
router.get("/settings", auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user_email: req.user.email });
    const subscription = await Subscription.findOne({ user_email: req.user.email });
    
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const hasPrivacySuite = subscription && 
      (subscription.plan === "premium" || subscription.plan === "hot_love");
    
    const hasCasualAddon = subscription && 
      subscription.casual_addon && 
      new Date(subscription.casual_addon_expires_at) > new Date();

    res.json({
      is_incognito: profile.is_incognito || false,
      hide_from_contacts: profile.hide_from_contacts || false,
      screenshot_alerts_enabled: profile.screenshot_alerts_enabled || false,
      show_blurred_to_public: profile.show_blurred_to_public || false,
      blurred_photos_count: (profile.blurred_photos || []).length,
      disappearing_messages_default: profile.casual_preferences?.disappearing_messages_default || false,
      verified_only_browsing: profile.casual_preferences?.verified_only || false,
      read_receipts_enabled: profile.read_receipts_enabled !== false,
      blocked_emails: profile.blocked_emails || [],
      has_privacy_suite: !!hasPrivacySuite,
      has_casual_addon: !!hasCasualAddon,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update privacy settings
router.put("/settings", auth, async (req, res) => {
  try {
    const {
      is_incognito,
      hide_from_contacts,
      screenshot_alerts_enabled,
      show_blurred_to_public,
      disappearing_messages_default,
      verified_only_browsing,
      read_receipts_enabled,
    } = req.body;

    const profile = await UserProfile.findOne({ user_email: req.user.email });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Check subscription for premium features
    const subscription = await Subscription.findOne({ user_email: req.user.email });
    const hasPrivacySuite = subscription && 
      (subscription.plan === "premium" || subscription.plan === "hot_love");

    // Update basic settings
    if (typeof is_incognito === "boolean") {
      if (!hasPrivacySuite && is_incognito) {
        return res.status(403).json({ error: "Incognito mode requires Premium subscription" });
      }
      profile.is_incognito = is_incognito;
    }

    if (typeof hide_from_contacts === "boolean") {
      if (!hasPrivacySuite && hide_from_contacts) {
        return res.status(403).json({ error: "Hide from contacts requires Premium subscription" });
      }
      profile.hide_from_contacts = hide_from_contacts;
    }

    if (typeof screenshot_alerts_enabled === "boolean") {
      if (!hasPrivacySuite && screenshot_alerts_enabled) {
        return res.status(403).json({ error: "Screenshot alerts require Premium subscription" });
      }
      profile.screenshot_alerts_enabled = screenshot_alerts_enabled;
    }

    if (typeof show_blurred_to_public === "boolean") {
      profile.show_blurred_to_public = show_blurred_to_public;
    }

    // Casual Add-On features
    if (typeof disappearing_messages_default === "boolean") {
      const hasCasualAddon = subscription && 
        subscription.casual_addon && 
        new Date(subscription.casual_addon_expires_at) > new Date();
      
      if (!hasCasualAddon && disappearing_messages_default) {
        return res.status(403).json({ error: "Disappearing messages require Casual Add-On" });
      }
      if (!profile.casual_preferences) {
        profile.casual_preferences = {};
      }
      profile.casual_preferences.disappearing_messages_default = disappearing_messages_default;
    }

    if (typeof verified_only_browsing === "boolean") {
      const hasCasualAddon = subscription && 
        subscription.casual_addon && 
        new Date(subscription.casual_addon_expires_at) > new Date();
      
      if (!hasCasualAddon && verified_only_browsing) {
        return res.status(403).json({ error: "Verified-only browsing requires Casual Add-On" });
      }
      if (!profile.casual_preferences) {
        profile.casual_preferences = {};
      }
      profile.casual_preferences.verified_only = verified_only_browsing;
    }

    if (typeof read_receipts_enabled === "boolean") {
      profile.read_receipts_enabled = read_receipts_enabled;
    }

    await profile.save();

    res.json({ message: "Privacy settings updated", profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload blurred photo version
router.post("/upload-blurred-photo", auth, async (req, res) => {
  try {
    const { photo_url, blurred_url } = req.body;

    if (!photo_url || !blurred_url) {
      return res.status(400).json({ error: "Both photo_url and blurred_url are required" });
    }

    const profile = await UserProfile.findOne({ user_email: req.user.email });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Add to blurred photos array
    if (!profile.blurred_photos) {
      profile.blurred_photos = [];
    }
    
    // Store mapping (in production, use a proper mapping system)
    profile.blurred_photos.push(blurred_url);
    await profile.save();

    res.json({ 
      message: "Blurred photo uploaded",
      blurred_url,
      total_blurred: profile.blurred_photos.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's public photos (blurred if privacy enabled)
router.get("/public-photos/:email", auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user_email: req.params.email });
    const requesterProfile = await UserProfile.findOne({ user_email: req.user.email });
    const subscription = await Subscription.findOne({ user_email: req.user.email });
    
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const hasPrivacySuite = subscription && 
      (subscription.plan === "premium" || subscription.plan === "hot_love");

    // Check if users have matched
    const Match = (await import("../models/Match.js")).default;
    const isMatched = await Match.findOne({
      $or: [
        { user1_email: req.user.email, user2_email: req.params.email },
        { user1_email: req.params.email, user2_email: req.user.email }
      ]
    });

    let photos = profile.photos || [];
    let arePhotosBlurred = false;

    // If profile has blur enabled and not matched, return blurred versions
    if (profile.show_blurred_to_public && !isMatched && !hasPrivacySuite) {
      // Return blurred photos or placeholders
      photos = profile.blurred_photos?.length > 0 
        ? profile.blurred_photos.map(url => ({ url, is_blurred: true }))
        : [];
      arePhotosBlurred = true;
    }

    res.json({
      photos,
      are_photos_blurred: arePhotosBlurred,
      can_unblur: hasPrivacySuite || !!isMatched,
      is_matched: !!isMatched,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enable disappearing messages for a conversation
router.post("/enable-disappearing-messages", auth, async (req, res) => {
  try {
    const { match_id, duration_hours = 24 } = req.body;

    if (!match_id) {
      return res.status(400).json({ error: "match_id is required" });
    }

    const subscription = await Subscription.findOne({ user_email: req.user.email });
    const hasCasualAddon = subscription && 
      subscription.casual_addon && 
      new Date(subscription.casual_addon_expires_at) > new Date();

    if (!hasCasualAddon) {
      return res.status(403).json({ error: "Disappearing messages require Casual Add-On" });
    }

    // Get match to find the other user
    const Match = (await import("../models/Match.js")).default;
    const match = await Match.findById(match_id);
    
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Update all messages in this thread for this user to auto-delete
    await Message.updateMany(
      { 
        match_id,
        sender_email: req.user.email,
        deleted: false
      },
      { 
        $set: { 
          is_disappearing: true,
          disappears_at: new Date(Date.now() + duration_hours * 60 * 60 * 1000)
        }
      }
    );

    res.json({ 
      message: "Disappearing messages enabled",
      duration_hours,
      expires_in: `${duration_hours} hours`
    });
  } catch (err) {
    console.error("Enable disappearing messages error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get messages with disappearing filter
router.get("/messages/:match_id", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      match_id: req.params.match_id,
      $or: [
        { sender_email: req.user.email },
        { receiver_email: req.user.email }
      ],
      deleted: false,
      // Filter out expired disappearing messages
      $or: [
        { is_disappearing: false },
        { 
          is_disappearing: true, 
          disappears_at: { $gt: new Date() } 
        }
      ]
    }).sort({ createdAt: -1 });

    // Clean up expired messages
    await Message.deleteMany({
      is_disappearing: true,
      disappears_at: { $lte: new Date() }
    });

    res.json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Block a user
router.post("/block", auth, async (req, res) => {
  try {
    const { block_email } = req.body;
    if (!block_email) return res.status(400).json({ error: "block_email is required" });

    const profile = await UserProfile.findOne({ user_email: req.user.email });
    if (!profile.blocked_emails) profile.blocked_emails = [];
    
    if (!profile.blocked_emails.includes(block_email)) {
      profile.blocked_emails.push(block_email);
      await profile.save();
    }

    // Also unmatch if they are matched
    const Match = (await import("../models/Match.js")).default;
    await Match.deleteMany({
      $or: [
        { user1_email: req.user.email, user2_email: block_email },
        { user1_email: block_email, user2_email: req.user.email }
      ]
    });

    res.json({ message: "User blocked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unblock a user
router.post("/unblock", auth, async (req, res) => {
  try {
    const { unblock_email } = req.body;
    if (!unblock_email) return res.status(400).json({ error: "unblock_email is required" });

    const profile = await UserProfile.findOne({ user_email: req.user.email });
    if (profile.blocked_emails) {
      profile.blocked_emails = profile.blocked_emails.filter(e => e !== unblock_email);
      await profile.save();
    }

    res.json({ message: "User unblocked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

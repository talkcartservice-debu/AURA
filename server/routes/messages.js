import { Router } from "express";
import auth from "../middleware/auth.js";
import Message from "../models/Message.js";
import { emitToUser } from "../signaling.js";

const router = Router();

// Get messages for a match
router.get("/:matchId", auth, async (req, res) => {
  try {
    const messages = await Message.find({ 
      match_id: req.params.matchId,
      deleted: false,
      $or: [
        { sender_email: req.user.email },
        { receiver_email: req.user.email }
      ],
      // Filter out expired disappearing messages
      $or: [
        { is_disappearing: false },
        { 
          is_disappearing: true, 
          disappears_at: { $gt: new Date() } 
        }
      ]
    }).sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post("/", auth, async (req, res) => {
  try {
    const { match_id, content, is_disappearing, duration_hours } = req.body;
    
    if (!match_id || !content) {
      return res.status(400).json({ error: "match_id and content are required" });
    }

    // Get match to find receiver
    const Match = (await import("../models/Match.js")).default;
    const match = await Match.findById(match_id);
    
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Determine receiver email
    const receiver_email = match.user1_email === req.user.email 
      ? match.user2_email 
      : match.user1_email;

    // Prepare message data
    const messageData = {
      match_id,
      sender_email: req.user.email,
      receiver_email,
      content,
    };

    // Add disappearing message settings if requested
    if (is_disappearing && duration_hours) {
      // Check if user has Casual Add-On
      const Subscription = (await import("../models/Subscription.js")).default;
      const subscription = await Subscription.findOne({ user_email: req.user.email });
      const hasCasualAddon = subscription && 
        subscription.casual_addon && 
        new Date(subscription.casual_addon_expires_at) > new Date();

      if (!hasCasualAddon) {
        return res.status(403).json({ error: "Disappearing messages require Casual Add-On" });
      }

      messageData.is_disappearing = true;
      messageData.disappears_at = new Date(Date.now() + duration_hours * 60 * 60 * 1000);
    }

    const message = await Message.create(messageData);

    // Notify receiver in real-time via Socket.IO (if online)
    try {
      emitToUser(receiver_email, "message_received", {
        match_id,
        from_email: req.user.email,
        content: message.content,
        message_id: message._id,
        created_at: message.createdAt,
      });
    } catch (notifyErr) {
      console.error("Socket notify message_received error:", notifyErr);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Mark messages as read
router.patch("/:matchId/read", auth, async (req, res) => {
  try {
    await Message.updateMany(
      { 
        match_id: req.params.matchId, 
        sender_email: { $ne: req.user.email },
        receiver_email: req.user.email,
        is_read: false 
      },
      { is_read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a message (soft delete)
router.delete("/:messageId", auth, async (req, res) => {
  try {
    const message = await Message.findOne({ 
      _id: req.params.messageId,
      sender_email: req.user.email 
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found or you can only delete your own messages" });
    }

    message.deleted = true;
    message.content = "This message was deleted";
    await message.save();

    res.json({ message: "Message deleted", messageId: message._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit a message
router.put("/:messageId", auth, async (req, res) => {
  try {
    const message = await Message.findOne({ 
      _id: req.params.messageId,
      sender_email: req.user.email,
      is_disappearing: false // Can't edit disappearing messages
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found or cannot be edited" });
    }

    message.content = req.body.content;
    message.edited = true;
    await message.save();

    res.json({ message: "Message updated", messageId: message._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread message count for a match
router.get("/:matchId/unread-count", auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      match_id: req.params.matchId,
      receiver_email: req.user.email,
      sender_email: { $ne: req.user.email },
      is_read: false,
      deleted: false
    });

    res.json({ count, match_id: req.params.matchId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get last message for each match (for matches list preview)
router.get("/matches/last-messages", auth, async (req, res) => {
  try {
    const Match = (await import("../models/Match.js")).default;
    
    // Get all matches for the user
    const matches = await Match.find({
      $or: [
        { user1_email: req.user.email },
        { user2_email: req.user.email }
      ]
    });

    // Get last message for each match
    const lastMessages = await Promise.all(
      matches.map(async (match) => {
        const lastMessage = await Message.findOne({
          match_id: match._id,
          deleted: false
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          match_id: match._id,
          receiver_email: req.user.email,
          sender_email: { $ne: req.user.email },
          is_read: false,
          deleted: false
        });

        return {
          match_id: match._id,
          last_message: lastMessage ? {
            content: lastMessage.content,
            sender_email: lastMessage.sender_email,
            created_at: lastMessage.createdAt
          } : null,
          unread_count: unreadCount
        };
      })
    );

    res.json(lastMessages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

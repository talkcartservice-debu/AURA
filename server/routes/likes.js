import { Router } from "express";
import auth from "../middleware/auth.js";
import Like from "../models/Like.js";
import Match from "../models/Match.js";
import DailyMatch from "../models/DailyMatch.js";
import Subscription from "../models/Subscription.js";
import { emitToUser } from "../signaling.js";
import { sendNotificationToUser } from "../utils/notificationService.js";

const router = Router();

router.post("/", auth, async (req, res) => {
  try {
    const { to_email, daily_match_id, is_super_like } = req.body;

    // Check if this is a Super Like and validate subscription
    if (is_super_like) {
      const sub = await Subscription.findOne({ user_email: req.user.email });
      
      if (!sub || sub.plan === "free") {
        return res.status(403).json({ error: "Super Likes require Premium subscription" });
      }

      if (sub.super_likes_used >= sub.super_likes_limit) {
        return res.status(400).json({ error: "Super Like limit reached for this week" });
      }

      // Increment Super Likes used
      sub.super_likes_used += 1;
      await sub.save();
    }

    const like = await Like.create({
      from_email: req.user.email,
      to_email,
      daily_match_id,
      is_super_like: is_super_like || false,
    });

    // Update daily match status
    if (daily_match_id) {
      await DailyMatch.findByIdAndUpdate(daily_match_id, { status: "liked" });
    }

    // Check for mutual like
    const mutual = await Like.findOne({ from_email: to_email, to_email: req.user.email });
    let match = null;
    if (mutual) {
      // Only create Match if one doesn't already exist between these two users
      const existingMatch = await Match.findOne({
        $or: [
          { user1_email: req.user.email, user2_email: to_email },
          { user1_email: to_email, user2_email: req.user.email },
        ],
      });
      if (!existingMatch) {
        match = await Match.create({
          user1_email: req.user.email,
          user2_email: to_email,
        });
      } else {
        match = existingMatch;
      }

      // Notify both users about the new mutual match (if online)
      try {
        emitToUser(req.user.email, "match_created", {
          match_id: match._id,
          other_email: to_email,
        });
        emitToUser(to_email, "match_created", {
          match_id: match._id,
          other_email: req.user.email,
        });
      } catch (notifyErr) {
        console.error("Socket notify match_created error:", notifyErr);
      }

      // Send push notifications
      try {
        await Promise.all([
          sendNotificationToUser(to_email, {
            title: "New Match! ❤️",
            body: "You have a new mutual match on AURAsoul!",
            data: { type: "MATCH", match_id: match._id.toString() }
          }),
          sendNotificationToUser(req.user.email, {
            title: "New Match! ❤️",
            body: `You matched with someone new!`,
            data: { type: "MATCH", match_id: match._id.toString() }
          })
        ]);
      } catch (pushErr) {
        console.error("Push notification error:", pushErr);
      }
    }

    res.status(201).json({ like, match, is_mutual: !!mutual });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Already liked" });
    res.status(500).json({ error: err.message });
  }
});

export default router;

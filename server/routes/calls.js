import { Router } from "express";
import auth from "../middleware/auth.js";
import Call from "../models/Call.js";
import Match from "../models/Match.js";

const router = Router();

// Get call history for a match
router.get("/history/:matchId", auth, async (req, res) => {
  try {
    const calls = await Call.find({ 
      match_id: req.params.matchId,
      $or: [
        { initiator_email: req.user.email },
        { receiver_email: req.user.email }
      ]
    }).sort({ createdAt: -1 }).limit(20);

    res.json(calls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent calls
router.get("/recent", auth, async (req, res) => {
  try {
    const calls = await Call.find({
      $or: [
        { initiator_email: req.user.email },
        { receiver_email: req.user.email }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("match_id");

    res.json(calls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initiate a call (creates call record)
router.post("/initiate", auth, async (req, res) => {
  try {
    const { match_id, type = "video" } = req.body;

    if (!match_id) {
      return res.status(400).json({ error: "match_id is required" });
    }

    // Get match to find receiver
    const match = await Match.findById(match_id);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    const receiver_email = match.user1_email === req.user.email 
      ? match.user2_email 
      : match.user1_email;

    // Check if there's an active call already
    const activeCall = await Call.findOne({
      match_id,
      status: { $in: ["initiated", "accepted"] },
      $or: [
        { initiator_email: req.user.email },
        { receiver_email: req.user.email }
      ]
    });

    if (activeCall) {
      return res.status(400).json({ 
        error: "Call already in progress",
        call_id: activeCall._id
      });
    }

    // Create call record
    const call = await Call.create({
      match_id,
      initiator_email: req.user.email,
      receiver_email,
      type,
      status: "initiated",
      started_at: new Date(),
    });

    res.json({ 
      message: "Call initiated",
      call_id: call._id,
      receiver_email
    });
  } catch (err) {
    console.error("Initiate call error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Accept call
router.post("/accept", auth, async (req, res) => {
  try {
    const { call_id } = req.body;

    if (!call_id) {
      return res.status(400).json({ error: "call_id is required" });
    }

    const call = await Call.findOneAndUpdate(
      { 
        _id: call_id,
        receiver_email: req.user.email,
        status: "initiated"
      },
      { 
        status: "accepted",
        started_at: new Date()
      },
      { new: true }
    );

    if (!call) {
      return res.status(404).json({ error: "Call not found or already handled" });
    }

    res.json({ message: "Call accepted", call });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject call
router.post("/reject", auth, async (req, res) => {
  try {
    const { call_id } = req.body;

    if (!call_id) {
      return res.status(400).json({ error: "call_id is required" });
    }

    const call = await Call.findOneAndUpdate(
      { 
        _id: call_id,
        receiver_email: req.user.email,
        status: "initiated"
      },
      { 
        status: "rejected",
        ended_at: new Date()
      },
      { new: true }
    );

    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    res.json({ message: "Call rejected", call });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// End call
router.post("/end", auth, async (req, res) => {
  try {
    const { call_id } = req.body;

    if (!call_id) {
      return res.status(400).json({ error: "call_id is required" });
    }

    const call = await Call.findOne({
      _id: call_id,
      $or: [
        { initiator_email: req.user.email },
        { receiver_email: req.user.email }
      ]
    });

    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    call.status = "ended";
    call.ended_at = new Date();
    
    // Calculate duration
    if (call.started_at) {
      call.duration = Math.floor((call.ended_at - call.started_at) / 1000);
    }

    await call.save();

    res.json({ message: "Call ended", duration: call.duration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

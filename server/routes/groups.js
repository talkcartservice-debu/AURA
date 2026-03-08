import { Router } from "express";
import auth from "../middleware/auth.js";
import Group from "../models/Group.js";
import GroupMessage from "../models/GroupMessage.js";
import { emitToUsers } from "../signaling.js";

const router = Router();

router.get("/", auth, async (req, res) => {
  try {
    const groups = await Group.find({ is_public: true }).sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const group = await Group.create({
      ...req.body,
      creator_email: req.user.email,
      member_emails: [req.user.email],
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/join", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.max_members && group.member_emails.length >= group.max_members) {
      return res.status(400).json({ error: "Group is full" });
    }
    if (!group.member_emails.includes(req.user.email)) {
      group.member_emails.push(req.user.email);
      await group.save();
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/leave", auth, async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { $pull: { member_emails: req.user.email } },
      { new: true }
    );
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Group Messaging
router.get("/:id/messages", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    
    // Check if user is a member
    if (!group.member_emails.includes(req.user.email)) {
      return res.status(403).json({ error: "Must be a member to see messages" });
    }

    const messages = await GroupMessage.find({ group_id: req.params.id, deleted: false })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/messages", auth, async (req, res) => {
  try {
    const { content } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!group.member_emails.includes(req.user.email)) {
      return res.status(403).json({ error: "Must be a member to post messages" });
    }

    const message = await GroupMessage.create({
      group_id: req.params.id,
      sender_email: req.user.email,
      content,
    });

    // Notify all members except sender
    const otherMembers = group.member_emails.filter(e => e !== req.user.email);
    emitToUsers(otherMembers, "group_message_received", {
      group_id: req.params.id,
      message,
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

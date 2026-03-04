import { Router } from "express";
import auth from "../middleware/auth.js";
import Group from "../models/Group.js";

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

export default router;

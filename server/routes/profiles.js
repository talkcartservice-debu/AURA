import { Router } from "express";
import auth from "../middleware/auth.js";
import UserProfile from "../models/UserProfile.js";

const router = Router();

// Get my profile
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user_email: req.user.email });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update my profile
router.put("/me", auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOneAndUpdate(
      { user_email: req.user.email },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a profile by email
router.get("/:email", auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user_email: req.params.email });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all profiles (for discovery)
router.get("/", auth, async (req, res) => {
  try {
    const profiles = await UserProfile.find({
      user_email: { $ne: req.user.email },
      profile_complete: true,
      is_incognito: { $ne: true },
    });
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

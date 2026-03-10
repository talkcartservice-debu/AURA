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
    const myProfile = await UserProfile.findOne({ user_email: req.user.email });
    const blockedEmails = myProfile?.blocked_emails || [];

    // Build gender compatibility query
    const genderQuery = {};
    if (myProfile?.gender && myProfile?.looking_for) {
      const lookingForGenders = [];
      if (myProfile.looking_for.includes("men")) lookingForGenders.push("man");
      if (myProfile.looking_for.includes("women")) lookingForGenders.push("woman");
      if (myProfile.looking_for.includes("both")) lookingForGenders.push("man", "woman");
      if (myProfile.looking_for.includes("others")) lookingForGenders.push("non_binary", "other");
      
      genderQuery.gender = { $in: lookingForGenders };
      
      const myGenderCategory = 
        myProfile.gender === "man" ? "men" : 
        myProfile.gender === "woman" ? "women" : 
        "others";
      
      genderQuery.looking_for = { $in: [myGenderCategory, "both"] };
    }

    const profiles = await UserProfile.find({
      user_email: { $ne: req.user.email, $nin: blockedEmails },
      profile_complete: true,
      is_incognito: { $ne: true },
      ...genderQuery
    });
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

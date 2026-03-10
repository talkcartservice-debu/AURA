import { Router } from "express";
import auth from "../middleware/auth.js";
import BlindDate from "../models/BlindDate.js";
import UserProfile from "../models/UserProfile.js";

const router = Router();

const CONVERSATION_PROMPTS = [
  "If you could travel anywhere tomorrow, where would you go and why?",
  "What's one thing people are always surprised to learn about you?",
  "Describe your perfect weekend in three words.",
  "What's a hobby you've always wanted to try but haven't yet?",
  "If you could have dinner with anyone (alive or not), who would it be?",
  "What's the best advice you've ever received?",
  "What song always puts you in a good mood?",
  "What's your love language?",
  "Coffee or tea? And what does your order say about you?",
  "What's the most spontaneous thing you've ever done?",
];

// Toggle blind date availability
router.post("/opt-in", auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOneAndUpdate(
      { user_email: req.user.email },
      { blind_date_available: true },
      { new: true }
    );
    res.json({ blind_date_available: profile.blind_date_available });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/opt-out", auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOneAndUpdate(
      { user_email: req.user.email },
      { blind_date_available: false },
      { new: true }
    );
    res.json({ blind_date_available: profile.blind_date_available });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get active blind date
router.get("/active", auth, async (req, res) => {
  try {
    const blindDate = await BlindDate.findOne({
      $or: [
        { user1_email: req.user.email },
        { user2_email: req.user.email },
      ],
      status: "active",
    });

    if (!blindDate) {
      return res.json(null);
    }

    // Determine partner email
    const partnerEmail =
      blindDate.user1_email === req.user.email
        ? blindDate.user2_email
        : blindDate.user1_email;

    // If revealed, include partner profile
    let partnerProfile = null;
    if (blindDate.revealed) {
      partnerProfile = await UserProfile.findOne({ user_email: partnerEmail });
    }

    res.json({ blindDate, partnerProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start a new blind date (find a match)
router.post("/start", auth, async (req, res) => {
  try {
    // Check if user already has an active blind date
    const existing = await BlindDate.findOne({
      $or: [
        { user1_email: req.user.email },
        { user2_email: req.user.email },
      ],
      status: "active",
    });

    if (existing) {
      return res.status(400).json({ error: "You already have an active blind date" });
    }

    // Find another user who opted in and doesn't have an active blind date
    const myProfile = await UserProfile.findOne({ user_email: req.user.email });

    // Get all users with active blind dates to exclude them
    const activeBlindDates = await BlindDate.find({ status: "active" });
    const busyEmails = new Set();
    activeBlindDates.forEach((bd) => {
      busyEmails.add(bd.user1_email);
      busyEmails.add(bd.user2_email);
    });
    busyEmails.add(req.user.email);

    // Build gender compatibility query
    const genderQuery = {};
    if (myProfile.gender && myProfile.looking_for) {
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

    const candidate = await UserProfile.findOne({
      user_email: { $nin: [...busyEmails] },
      blind_date_available: true,
      profile_complete: true,
      ...genderQuery
    });

    if (!candidate) {
      return res.status(404).json({ error: "No blind date partners available right now. Try again later!" });
    }

    // Calculate shared interests
    const myInterests = myProfile?.interests || [];
    const theirInterests = candidate.interests || [];
    const shared = myInterests.filter((i) => theirInterests.includes(i));
    const score = Math.min(
      95,
      Math.max(40, 50 + shared.length * 10 + Math.floor(Math.random() * 15))
    );

    const prompt = CONVERSATION_PROMPTS[Math.floor(Math.random() * CONVERSATION_PROMPTS.length)];

    const blindDate = await BlindDate.create({
      user1_email: req.user.email,
      user2_email: candidate.user_email,
      compatibility_score: score,
      shared_interests: shared,
      conversation_prompt: prompt,
    });

    res.status(201).json({ blindDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message in blind date
router.post("/message", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Message text required" });

    const blindDate = await BlindDate.findOne({
      $or: [
        { user1_email: req.user.email },
        { user2_email: req.user.email },
      ],
      status: "active",
    });

    if (!blindDate) {
      return res.status(404).json({ error: "No active blind date found" });
    }

    // Add message
    blindDate.messages.push({
      sender_email: req.user.email,
      text: text.trim(),
    });

    // Update message counts
    if (blindDate.user1_email === req.user.email) {
      blindDate.user1_message_count += 1;
    } else {
      blindDate.user2_message_count += 1;
    }

    // Check if both have sent 3+ messages — auto-reveal
    if (blindDate.user1_message_count >= 3 && blindDate.user2_message_count >= 3) {
      blindDate.revealed = true;
      blindDate.status = "revealed";
    }

    await blindDate.save();

    // If just revealed, include partner profile
    let partnerProfile = null;
    if (blindDate.revealed) {
      const partnerEmail =
        blindDate.user1_email === req.user.email
          ? blindDate.user2_email
          : blindDate.user1_email;
      partnerProfile = await UserProfile.findOne({ user_email: partnerEmail });
    }

    res.json({ blindDate, partnerProfile, justRevealed: blindDate.revealed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel blind date
router.post("/cancel", auth, async (req, res) => {
  try {
    const blindDate = await BlindDate.findOneAndUpdate(
      {
        $or: [
          { user1_email: req.user.email },
          { user2_email: req.user.email },
        ],
        status: "active",
      },
      { status: "cancelled" },
      { new: true }
    );

    if (!blindDate) {
      return res.status(404).json({ error: "No active blind date found" });
    }

    res.json({ message: "Blind date cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

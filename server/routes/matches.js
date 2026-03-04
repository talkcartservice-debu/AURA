import { Router } from "express";
import auth from "../middleware/auth.js";
import DailyMatch from "../models/DailyMatch.js";
import Match from "../models/Match.js";
import MatchFeedback from "../models/MatchFeedback.js";
import UserProfile from "../models/UserProfile.js";

const router = Router();

// Get daily matches for current user
router.get("/daily", auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get user's subscription and profile
    const myProfile = await UserProfile.findOne({ user_email: req.user.email });
    const Subscription = (await import('../models/Subscription.js')).default;
    const mySub = await Subscription.findOne({ user_email: req.user.email });
    
    const isPremium = mySub && (mySub.plan === "premium" || mySub.plan === "hot_love");
    const hasCasualAddon = mySub && mySub.casual_addon && new Date(mySub.casual_addon_expires_at) > new Date();
    
    // Determine matching intent
    const myIntent = myProfile?.dating_intent || "long_term";
    const useIntentMatching = hasCasualAddon && ["casual_dating", "short_term_connection"].includes(myIntent);
    
    let matches = await DailyMatch.find({
      user_email: req.user.email,
      date: { $gte: today },
    });

    // Generate daily matches if none exist today
    if (matches.length === 0) {
      // Exclude users already seen (liked/passed) or already mutually matched
      const previousMatches = await DailyMatch.find({ user_email: req.user.email }).distinct("matched_email");
      const mutualMatches = await Match.find({
        $or: [{ user1_email: req.user.email }, { user2_email: req.user.email }],
      });
      const mutualEmails = mutualMatches.map((m) =>
        m.user1_email === req.user.email ? m.user2_email : m.user1_email
      );
      const excludeEmails = [...new Set([req.user.email, ...previousMatches, ...mutualEmails])];

      // Build query based on intent matching
      let intentQuery = {};
      if (useIntentMatching) {
        // Casual mode: match only with compatible intents
        intentQuery = {
          dating_intent: { $in: ["casual_dating", "short_term_connection", "open_to_anything"] }
        };
      } else if (isPremium) {
        // Premium users: smarter intent compatibility
        const compatibleIntents = [];
        if (["long_term", "marriage_minded"].includes(myIntent)) {
          compatibleIntents.push("long_term", "marriage_minded", "open_to_anything");
        } else if (myIntent === "friendship_first") {
          compatibleIntents.push("friendship_first", "casual_dating", "open_to_anything");
        } else {
          compatibleIntents.push(myIntent, "open_to_anything");
        }
        intentQuery = { dating_intent: { $in: compatibleIntents } };
      }

      const candidates = await UserProfile.find({
        user_email: { $nin: excludeEmails },
        profile_complete: true,
        is_incognito: { $ne: true },
        ...intentQuery,
      }).limit(isPremium ? 20 : 10); // Premium users get more matches

      const newMatches = candidates.map((c) => {
        const sharedInterests = (myProfile?.interests || []).filter((i) =>
          (c.interests || []).includes(i)
        );
        
        // Enhanced compatibility scoring for Premium users
        let score = 50 + sharedInterests.length * 10 + Math.floor(Math.random() * 15);
        const reasons = [];
        
        if (sharedInterests.length > 0) {
          reasons.push(`You both enjoy ${sharedInterests.slice(0, 2).join(" and ")}`);
        }
        
        if (myProfile?.relationship_goals === c.relationship_goals) {
          reasons.push("Same relationship goals");
          score += 5;
        }
        
        if ((myProfile?.values || []).some((v) => (c.values || []).includes(v))) {
          reasons.push("Shared core values");
          score += 5;
        }
        
        // Intent alignment bonus
        if (myProfile?.dating_intent === c.dating_intent) {
          reasons.push("Aligned dating intentions");
          score += 10;
        }
        
        // Premium: AI compatibility traits matching
        if (isPremium && myProfile?.compatibility_traits && c.compatibility_traits) {
          const traitMatches = Object.keys(myProfile.compatibility_traits).filter(key => {
            const myTrait = myProfile.compatibility_traits[key];
            const theirTrait = c.compatibility_traits[key];
            return myTrait && theirTrait && Math.abs(myTrait - theirTrait) < 2;
          });
          
          if (traitMatches.length > 2) {
            reasons.push("Highly compatible personalities");
            score += 8;
          }
        }
        
        if (!reasons.length) reasons.push("Complementary personalities");
        
        score = Math.min(99, Math.max(40, score));
        
        return {
          user_email: req.user.email,
          matched_email: c.user_email,
          compatibility_score: score,
          compatibility_reasons: reasons,
          date: today,
          intent_aligned: myProfile?.dating_intent === c.dating_intent,
        };
      });

      if (newMatches.length) matches = await DailyMatch.insertMany(newMatches);
    }

    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update daily match status
router.patch("/daily/:id", auth, async (req, res) => {
  try {
    const match = await DailyMatch.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get mutual matches
router.get("/mutual", auth, async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ user1_email: req.user.email }, { user2_email: req.user.email }],
    }).sort({ matched_at: -1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit match feedback
router.post("/feedback", auth, async (req, res) => {
  try {
    const feedback = await MatchFeedback.create({
      ...req.body,
      user_email: req.user.email,
    });
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

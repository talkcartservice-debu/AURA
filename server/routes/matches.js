import { Router } from "express";
import auth from "../middleware/auth.js";
import DailyMatch from "../models/DailyMatch.js";
import Match from "../models/Match.js";
import MatchFeedback from "../models/MatchFeedback.js";
import UserProfile from "../models/UserProfile.js";
import Report from "../models/Report.js";
import Message from "../models/Message.js";
import { calculateDistance, getLocationCompatibility } from "../utils/locationService.js";

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
    
    const isPremium = mySub && mySub.plan === "premium";
    const hasCasualAddon = mySub && mySub.casual_addon && new Date(mySub.casual_addon_expires_at) > new Date();
    
    // Determine matching intent
    const myIntent = myProfile?.dating_intent || "long_term";
    const useIntentMatching = hasCasualAddon && ["casual_dating", "short_term_connection"].includes(myIntent);

    // Base search radius (km) for location-aware matching
    // Premium users can see a slightly wider radius
    const baseRadiusKm = isPremium ? 75 : 50;
    
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
      
      const blockedEmails = myProfile.blocked_emails || [];
      const excludeEmails = [...new Set([req.user.email, ...previousMatches, ...mutualEmails, ...blockedEmails])];

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

      let rawCandidates = await UserProfile.find({
        user_email: { $nin: excludeEmails },
        profile_complete: true,
        is_incognito: { $ne: true },
        ...intentQuery,
      });

      // If intent filter is too strict and returns nothing, relax it once
      if (rawCandidates.length === 0 && Object.keys(intentQuery).length > 0) {
        rawCandidates = await UserProfile.find({
          user_email: { $nin: excludeEmails },
          profile_complete: true,
          is_incognito: { $ne: true },
        });
      }

      // Apply location-based filtering when we have coordinates
      let candidatesWithLocation = rawCandidates.filter((c) => {
        if (!myProfile?.location_coordinates || !c.location_coordinates) {
          // If either user lacks location, keep them (don't over-filter)
          return true;
        }
        const dist = calculateDistance(
          myProfile.location_coordinates.latitude,
          myProfile.location_coordinates.longitude,
          c.location_coordinates.latitude,
          c.location_coordinates.longitude
        );
        return dist <= baseRadiusKm;
      });

      // If radius is too strict and yields nothing, relax radius once
      if (candidatesWithLocation.length === 0 && rawCandidates.length > 0) {
        candidatesWithLocation = rawCandidates;
      }

      // Limit final candidate pool size
      const candidates = candidatesWithLocation.slice(0, isPremium ? 20 : 10); // Premium users get more matches

      const newMatches = candidates.map((c) => {
        const reasons = [];

        const interestsA = myProfile?.interests || [];
        const interestsB = c.interests || [];
        const sharedInterests = interestsA.filter((i) => interestsB.includes(i));

        const valuesA = myProfile?.values || [];
        const valuesB = c.values || [];
        const sharedValues = valuesA.filter((v) => valuesB.includes(v));

        // Sub-scores normalised 0–1
        let scoreInterests = Math.min(1, sharedInterests.length / 4); // up to 4 interests
        let scoreValues = Math.min(1, sharedValues.length / 3);

        let scoreIntent = 0;
        if (myProfile?.dating_intent && c.dating_intent) {
          scoreIntent = myProfile.dating_intent === c.dating_intent ? 1 : 0.4;
        }

        let scoreGoals = 0;
        if (myProfile?.relationship_goals && c.relationship_goals) {
          scoreGoals = myProfile.relationship_goals === c.relationship_goals ? 1 : 0.3;
        }

        let scoreAge = 0;
        if (myProfile?.age && c.age) {
          const ageDiff = Math.abs(myProfile.age - c.age);
          if (ageDiff <= 3) scoreAge = 1;
          else if (ageDiff <= 7) scoreAge = 0.6;
          else if (ageDiff <= 12) scoreAge = 0.3;
        }

        let scoreLifestyle = 0;
        if (myProfile?.lifestyle && c.lifestyle) {
          let matches = 0;
          if (myProfile.lifestyle.smoking && myProfile.lifestyle.smoking === c.lifestyle.smoking) matches += 1;
          if (myProfile.lifestyle.drinking && myProfile.lifestyle.drinking === c.lifestyle.drinking) matches += 1;
          scoreLifestyle = matches / 2;
        }

        const locationCompat = getLocationCompatibility(myProfile || {}, c || {}); // 0–100
        const scoreLocation = locationCompat / 100;

        let scoreTraits = 0;
        if (isPremium && myProfile?.compatibility_traits && c.compatibility_traits) {
          const traitKeys = Object.keys(myProfile.compatibility_traits || {});
          let closeCount = 0;
          traitKeys.forEach((key) => {
            const a = myProfile.compatibility_traits[key];
            const b = c.compatibility_traits[key];
            if (typeof a === "number" && typeof b === "number" && Math.abs(a - b) <= 2) {
              closeCount += 1;
            }
          });
          scoreTraits = Math.min(1, closeCount / Math.max(1, traitKeys.length));
        }

        // Trust / profile quality
        const verifiedBoost = (c.is_verified ? 0.4 : 0) + (c.is_personality_verified ? 0.2 : 0);
        const photosCount = (c.photos || []).length;
        const hasBio = !!c.bio;
        const profileQuality = Math.min(1, (photosCount >= 3 ? 0.6 : photosCount * 0.2) + (hasBio ? 0.4 : 0));

        // Recency / activity (use updatedAt when available)
        let recencyScore = 0.3;
        if (c.updatedAt) {
          const now = Date.now();
          const updated = new Date(c.updatedAt).getTime();
          const days = (now - updated) / (1000 * 60 * 60 * 24);
          if (days <= 3) recencyScore = 1;
          else if (days <= 7) recencyScore = 0.8;
          else if (days <= 30) recencyScore = 0.5;
          else recencyScore = 0.2;
        }

        // Weights sum ~1.5, then scaled to 40–99 later
        const WEIGHTS = {
          interests: 0.18,
          values: 0.18,
          intent: 0.18,
          goals: 0.1,
          age: 0.08,
          lifestyle: 0.08,
          location: 0.08,
          traits: 0.12,
          trust: 0.08,
          recency: 0.12,
        };

        let composite =
          scoreInterests * WEIGHTS.interests +
          scoreValues * WEIGHTS.values +
          scoreIntent * WEIGHTS.intent +
          scoreGoals * WEIGHTS.goals +
          scoreAge * WEIGHTS.age +
          scoreLifestyle * WEIGHTS.lifestyle +
          scoreLocation * WEIGHTS.location +
          scoreTraits * WEIGHTS.traits +
          profileQuality * WEIGHTS.trust +
          recencyScore * WEIGHTS.recency +
          verifiedBoost * 0.05;

        // Clamp composite 0–1
        composite = Math.max(0, Math.min(1, composite));

        // Map to 40–99 and add small noise
        let score = 40 + composite * 55 + Math.random() * 4;
        score = Math.min(99, Math.max(40, Math.round(score)));

        // Build human reasons from sub-scores
        if (sharedInterests.length > 0) {
          reasons.push(`You both enjoy ${sharedInterests.slice(0, 2).join(" and ")}`);
        }
        if (sharedValues.length > 0) {
          reasons.push("You share important values");
        }
        if (scoreIntent >= 0.9) {
          reasons.push("You have very similar dating intentions");
        } else if (scoreIntent >= 0.5) {
          reasons.push("Your dating intentions are compatible");
        }
        if (scoreGoals >= 0.9) {
          reasons.push("You want the same kind of relationship");
        }
        if (scoreAge >= 0.9) {
          reasons.push("Great age compatibility");
        } else if (scoreAge >= 0.5) {
          reasons.push("Comfortable age difference");
        }
        if (scoreLifestyle >= 0.5) {
          reasons.push("You have similar lifestyle habits");
        }
        if (locationCompat >= 80) {
          reasons.push("You live very close to each other");
        } else if (locationCompat >= 60) {
          reasons.push("You are in the same area");
        }
        if (scoreTraits >= 0.6) {
          reasons.push("Your personalities are highly compatible");
        }
        if (c.is_verified) {
          reasons.push("Their profile is identity-verified");
        }
        if (c.is_personality_verified) {
          reasons.push("Their personality is verified");
        }
        if (recencyScore >= 0.8) {
          reasons.push("They've been active recently");
        } else if (recencyScore >= 0.5) {
          reasons.push("They were active not too long ago");
        }

        if (!reasons.length) {
          reasons.push("You could balance each other well");
        }

        return {
          user_email: req.user.email,
          matched_email: c.user_email,
          compatibility_score: score,
          compatibility_reasons: reasons,
          date: today,
          intent_aligned: myProfile?.dating_intent === c.dating_intent,
        };
      });

      if (newMatches.length) {
        const sorted = [...newMatches].sort(
          (a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0)
        );
        matches = await DailyMatch.insertMany(sorted);
      }
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

// Unmatch a user
router.delete("/:id", auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ error: "Match not found" });

    // Verify user is part of the match
    if (match.user1_email !== req.user.email && match.user2_email !== req.user.email) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const other_email = match.user1_email === req.user.email ? match.user2_email : match.user1_email;

    // Delete the match
    await Match.findByIdAndDelete(req.params.id);

    // Delete likes to reset state
    const Like = (await import("../models/Like.js")).default;
    await Like.deleteMany({
      $or: [
        { from_email: req.user.email, to_email: other_email },
        { from_email: other_email, to_email: req.user.email }
      ]
    });

    // Optionally delete messages (or they'll just be orphaned)
    await Message.deleteMany({ match_id: req.params.id });

    res.json({ message: "Unmatched successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Report a match
router.post("/report", auth, async (req, res) => {
  try {
    const { match_id, reason, details, reported_email } = req.body;

    // Create the report
    const report = await Report.create({
      reporter_email: req.user.email,
      reported_email,
      reason,
      details,
      match_id,
    });

    // If there's a match_id, unmatch automatically
    if (match_id) {
      const match = await Match.findById(match_id);
      if (match) {
        if (match.user1_email === req.user.email || match.user2_email === req.user.email) {
          await Match.findByIdAndDelete(match_id);
          await Message.deleteMany({ match_id });
        }
      }
    }

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

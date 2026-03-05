import { Router } from "express";
import auth from "../middleware/auth.js";
import DailyMatch from "../models/DailyMatch.js";
import Match from "../models/Match.js";
import MatchFeedback from "../models/MatchFeedback.js";
import UserProfile from "../models/UserProfile.js";
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

      const rawCandidates = await UserProfile.find({
        user_email: { $nin: excludeEmails },
        profile_complete: true,
        is_incognito: { $ne: true },
        ...intentQuery,
      });

      // Apply location-based filtering when we have coordinates
      const candidatesWithLocation = rawCandidates.filter((c) => {
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

      // Limit final candidate pool size
      const candidates = candidatesWithLocation.slice(0, isPremium ? 20 : 10); // Premium users get more matches

      const newMatches = candidates.map((c) => {
        const sharedInterests = (myProfile?.interests || []).filter((i) =>
          (c.interests || []).includes(i)
        );
        
        // Base compatibility score
        let score = 50 + sharedInterests.length * 10 + Math.floor(Math.random() * 15);
        const reasons = [];
        
        if (sharedInterests.length > 0) {
          reasons.push(`You both enjoy ${sharedInterests.slice(0, 2).join(" and ")}`);
        }
        
        if (myProfile?.relationship_goals && myProfile.relationship_goals === c.relationship_goals) {
          reasons.push("Same relationship goals");
          score += 5;
        }
        
        if ((myProfile?.values || []).some((v) => (c.values || []).includes(v))) {
          reasons.push("Shared core values");
          score += 5;
        }
        
        // Intent alignment bonus
        if (myProfile?.dating_intent && myProfile.dating_intent === c.dating_intent) {
          reasons.push("Aligned dating intentions");
          score += 10;
        }

        // Age compatibility: smaller age gaps are slightly favored
        if (myProfile?.age && c.age) {
          const ageDiff = Math.abs(myProfile.age - c.age);
          if (ageDiff <= 3) {
            reasons.push("Great age compatibility");
            score += 6;
          } else if (ageDiff <= 7) {
            reasons.push("Compatible age range");
            score += 3;
          }
        }

        // Lifestyle alignment (smoking/drinking)
        if (myProfile?.lifestyle && c.lifestyle) {
          const lifestyleReasons = [];
          if (myProfile.lifestyle.smoking && myProfile.lifestyle.smoking === c.lifestyle.smoking) {
            lifestyleReasons.push("similar smoking habits");
          }
          if (myProfile.lifestyle.drinking && myProfile.lifestyle.drinking === c.lifestyle.drinking) {
            lifestyleReasons.push("similar drinking habits");
          }
          if (lifestyleReasons.length) {
            reasons.push(`You have ${lifestyleReasons.join(" and ")}.`);
            score += 3;
          }
        }

        // Location compatibility (if both have coordinates)
        const locationCompat = getLocationCompatibility(myProfile || {}, c || {});
        if (locationCompat > 0) {
          // Convert 0-100 into a small bump
          score += Math.floor(locationCompat / 25); // +0 to +4
          if (locationCompat >= 80) {
            reasons.push("You live close to each other");
          } else if (locationCompat >= 60) {
            reasons.push("You are in the same area");
          }
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

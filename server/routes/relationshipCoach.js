import { Router } from "express";
import auth from "../middleware/auth.js";
import UserProfile from "../models/UserProfile.js";
import Match from "../models/Match.js";
import RelationshipCoach from "../models/RelationshipCoach.js";
import ConversationCoach from "../models/ConversationCoach.js";
import {
  generateCoachResponse,
  getConversationHistory,
  clearConversationHistory,
  setCoachingStyle,
  generateConversationStarters,
  generateDateGuidance,
  getRedFlagsEducation,
  generateCommunicationTips,
  generateProfileReview,
} from "../utils/conversationCoachService.js";

const router = Router();

// Get conversation starters for a specific match
router.get("/conversation-starters/:matchId", auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Verify this match belongs to the user
    if (match.user1_email !== req.user.email && match.user2_email !== req.user.email) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Get both profiles
    const myProfile = await UserProfile.findOne({ user_email: req.user.email });
    const otherEmail = match.user1_email === req.user.email ? match.user2_email : match.user1_email;
    const otherProfile = await UserProfile.findOne({ user_email: otherEmail });

    if (!myProfile || !otherProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Generate conversation starters
    const starters = generateConversationStarters(myProfile, otherProfile, match);

    // Save to coach history
    let coachRecord = await RelationshipCoach.findOne({ user_email: req.user.email });
    if (!coachRecord) {
      coachRecord = await RelationshipCoach.create({
        user_email: req.user.email,
        conversations: [],
        red_flags: [],
        communication_tips: [],
        insights: [],
      });
    }

    // Add insights
    starters.forEach(starter => {
      coachRecord.insights.push({
        insight_type: "pattern_recognition",
        title: "Conversation Starter Generated",
        description: starter.message,
        actionable_advice: `Try this opener based on: ${starter.context}`,
        priority: "medium",
      });
    });

    await coachRecord.save();

    res.json({
      starters,
      match_info: {
        matched_with: otherProfile.display_name,
        shared_interests: (myProfile.interests || []).filter(i => 
          (otherProfile.interests || []).includes(i)
        ),
      },
    });
  } catch (err) {
    console.error("Error generating conversation starters:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get date guidance for a specific event type
router.get("/date-guidance/:eventType", auth, async (req, res) => {
  try {
    const { eventType } = req.params;
    const { eventName } = req.query;

    const guidance = generateDateGuidance(eventType, eventName);

    res.json(guidance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get communication tips for a match
router.get("/communication-tips/:matchId", auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (!match.users.includes(req.user.email)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const myProfile = await UserProfile.findOne({ user_email: req.user.email });
    const otherEmail = match.users.find(u => u !== req.user.email);
    const otherProfile = await UserProfile.findOne({ user_email: otherEmail });

    if (!myProfile || !otherProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const tips = generateCommunicationTips(myProfile, otherProfile);

    res.json({
      tips,
      match_info: {
        matched_with: otherProfile.display_name,
        their_intent: otherProfile.dating_intent,
        their_style: otherProfile.communication_style,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get educational content about red flags and healthy relationships
router.get("/red-flags-education", auth, async (req, res) => {
  try {
    const { categories, resources } = getRedFlagsEducation();

    res.json({
      categories,
      resources,
      disclaimer: "This content is for educational purposes. Trust your instincts and prioritize your safety.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get overall coach dashboard data
router.get("/dashboard", auth, async (req, res) => {
  try {
    let coachData = await RelationshipCoach.findOne({ user_email: req.user.email });
    
    if (!coachData) {
      coachData = await RelationshipCoach.create({
        user_email: req.user.email,
        conversations: [],
        red_flags: [],
        communication_tips: [],
        insights: [],
        relationship_health: {
          overall_score: 75, // Default starting score
          components: {
            communication: 75,
            trust: 75,
            respect: 75,
            compatibility: 75,
            emotional_connection: 75,
          },
        },
      });
    }

    // Get recent insights
    const recentInsights = coachData.insights
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    // Get unread insights
    const unreadCount = coachData.insights.filter(i => !i.read).length;

    // Track health score history if not updated today
    const today = new Date().setHours(0, 0, 0, 0);
    const lastHistoryEntry = coachData.health_history?.[coachData.health_history.length - 1];
    const lastEntryDate = lastHistoryEntry ? new Date(lastHistoryEntry.timestamp).setHours(0, 0, 0, 0) : null;

    if (!lastEntryDate || lastEntryDate < today) {
      coachData.health_history.push({
        score: coachData.relationship_health.overall_score,
        timestamp: new Date(),
      });
      
      // Keep only last 30 days
      if (coachData.health_history.length > 30) {
        coachData.health_history.shift();
      }
      
      await coachData.save();
    }

    res.json({
      insights: recentInsights,
      unread_count: unreadCount,
      relationship_health: coachData.relationship_health,
      health_history: coachData.health_history,
      total_tips_provided: coachData.communication_tips.length,
      red_flags_addressed: coachData.red_flags.filter(r => r.addressed).length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark insight as read
router.patch("/insights/:insightId/read", auth, async (req, res) => {
  try {
    const coachData = await RelationshipCoach.findOne({ user_email: req.user.email });
    if (!coachData) {
      return res.status(404).json({ error: "Coach data not found" });
    }

    const insight = coachData.insights.id(req.params.insightId);
    if (!insight) {
      return res.status(404).json({ error: "Insight not found" });
    }

    insight.read = true;
    await coachData.save();

    res.json({ message: "Insight marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get AI profile review
router.get("/profile-review", auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user_email: req.user.email });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const review = await generateProfileReview(profile);

    // Save to coach history as an insight
    let coachRecord = await RelationshipCoach.findOne({ user_email: req.user.email });
    if (!coachRecord) {
      coachRecord = await RelationshipCoach.create({
        user_email: req.user.email,
        conversations: [],
        red_flags: [],
        communication_tips: [],
        insights: [],
      });
    }

    coachRecord.insights.push({
      insight_type: "pattern_recognition",
      title: "AI Profile Review Completed",
      description: review.overall_impression,
      actionable_advice: `Your profile score: ${review.score}/100. Check the Review tab for details.`,
      priority: "high",
    });

    await coachRecord.save();

    res.json(review);
  } catch (err) {
    console.error("Error generating profile review:", err);
    res.status(500).json({ error: err.message });
  }
});

// Rate coach interaction helpfulness
router.post("/interactions/rate", auth, async (req, res) => {
  try {
    const { interaction_id, rating } = req.body;
    
    if (!interaction_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Invalid rating" });
    }

    const coachData = await RelationshipCoach.findOne({ user_email: req.user.email });
    if (!coachData) {
      return res.status(404).json({ error: "Coach data not found" });
    }

    const interaction = coachData.coach_interactions.id(interaction_id);
    if (!interaction) {
      return res.status(404).json({ error: "Interaction not found" });
    }

    interaction.helpfulness_rating = rating;
    await coachData.save();

    res.json({ message: "Rating submitted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat with AI Relationship Coach
router.post("/chat", auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    const result = await generateCoachResponse(message.trim(), req.user.email);
    
    res.json({
      response: result.response,
      category: result.category,
      mood: result.mood,
      topic: result.topic,
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get conversation history
router.get("/chat/history", auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = await getConversationHistory(req.user.email, limit);
    
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear conversation history
router.delete("/chat/history", auth, async (req, res) => {
  try {
    await clearConversationHistory(req.user.email);
    res.json({ success: true, message: "Conversation history cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set coaching style preference
router.put("/chat/style", auth, async (req, res) => {
  try {
    const { style } = req.body;
    
    if (!style || !["supportive", "direct", "gentle", "motivational", "analytical"].includes(style)) {
      return res.status(400).json({ error: "Invalid coaching style" });
    }
    
    const updated = await setCoachingStyle(req.user.email, style);
    res.json({ success: true, coaching_style: updated?.coaching_style });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

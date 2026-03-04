import { Router } from "express";
import auth from "../middleware/auth.js";
import UserProfile from "../models/UserProfile.js";
import DateEvent from "../models/DateEvent.js";
import CommunityEvent from "../models/CommunityEvent.js";
import {
  generateConversationStarters,
  generateDateGuidance,
  calculateEventCompatibility,
} from "../utils/relationshipCoachService.js";

const router = Router();

// Sample local events database (in production, integrate with Eventbrite, Meetup, etc.)
const SAMPLE_EVENTS = [
  {
    id: "1",
    title: "Coffee & Conversation",
    type: "coffee_shop",
    description: "Casual meetup at a cozy café",
    venue: "The Coffee Bean",
    location: "Lagos",
    date: new Date(Date.now() + 86400000 * 2), // 2 days from now
    price_range: "₦",
    atmosphere: "casual",
    image_url: "/images/coffee-date.jpg",
  },
  {
    id: "2",
    title: "Art Gallery Opening",
    type: "art_exhibit",
    description: "Contemporary art exhibition opening night",
    venue: "Nike Art Gallery",
    location: "Lekki",
    date: new Date(Date.now() + 86400000 * 3),
    price_range: "₦₦",
    atmosphere: "cultural",
    image_url: "/images/art-gallery.jpg",
  },
  {
    id: "3",
    title: "Live Jazz Night",
    type: "concert",
    description: "Smooth jazz performance under the stars",
    venue: "The Jazzhole",
    location: "Victoria Island",
    date: new Date(Date.now() + 86400000 * 5),
    price_range: "₦₦₦",
    atmosphere: "romantic",
    image_url: "/images/jazz-night.jpg",
  },
  {
    id: "4",
    title: "Hiking Adventure",
    type: "outdoor_activity",
    description: "Morning hike with breathtaking views",
    venue: "Ogbelle Forest",
    location: "Ibadan",
    date: new Date(Date.now() + 86400000 * 7),
    price_range: "₦",
    atmosphere: "active",
    image_url: "/images/hiking.jpg",
  },
  {
    id: "5",
    title: "Food Festival",
    type: "food_event",
    description: "Taste local cuisines from top chefs",
    venue: "Eko Hotel Grounds",
    location: "Victoria Island",
    date: new Date(Date.now() + 86400000 * 10),
    price_range: "₦₦",
    atmosphere: "fun",
    image_url: "/images/food-festival.jpg",
  },
  {
    id: "6",
    title: "Beach Sunset Picnic",
    type: "outdoor_activity",
    description: "Romantic sunset picnic on the beach",
    venue: "Elegushi Beach",
    location: "Lekki",
    date: new Date(Date.now() + 86400000 * 4),
    price_range: "₦₦",
    atmosphere: "romantic",
    image_url: "/images/beach-picnic.jpg",
  },
];

// Get personalized event suggestions
router.get("/suggestions", auth, async (req, res) => {
  try {
    const myProfile = await UserProfile.findOne({ user_email: req.user.email });
    
    if (!myProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const preferredTypes = myProfile.preferred_date_types || [];
    const location = myProfile.location || "";

    // Check subscription status first
    const Subscription = (await import('../models/Subscription.js')).default;
    const subscription = await Subscription.findOne({ user_email: req.user.email });
    const isPremium = subscription && (subscription.plan === "premium" || subscription.plan === "hot_love");

    // Filter and score events based on preferences
    let suggestedEvents = SAMPLE_EVENTS.map(event => {
      let score = 0;
      
      // Preference match bonus
      if (preferredTypes.includes(event.type)) {
        score += 20;
      }
      
      // Location match bonus
      if (location && event.location.toLowerCase().includes(location.toLowerCase())) {
        score += 15;
      }
      
      // Atmosphere matching based on personality
      if (myProfile.personality_tags?.includes("adventurous") && event.atmosphere === "active") {
        score += 10;
      }
      if (myProfile.personality_tags?.includes("romantic") && event.atmosphere === "romantic") {
        score += 10;
      }
      if (myProfile.personality_tags?.includes("artistic") && event.type === "art_exhibit") {
        score += 10;
      }

      if (isPremium) {
        score += 5; // Boost all scores for premium users
      }

      return { ...event, match_score: score };
    });

    // Sort by match score and filter future events only
    suggestedEvents = suggestedEvents
      .filter(e => e.date > new Date())
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, isPremium ? 10 : 5); // Premium users get 10 suggestions, others get 5

    res.json({
      events: suggestedEvents,
      total: suggestedEvents.length,
      is_premium: !!isPremium,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all event types
router.get("/types", auth, async (req, res) => {
  try {
    const eventTypes = [
      { value: "coffee_shop", label: "Coffee Shops", icon: "☕" },
      { value: "art_exhibit", label: "Art & Culture", icon: "🎨" },
      { value: "concert", label: "Concerts & Live Music", icon: "🎵" },
      { value: "outdoor_activity", label: "Outdoor Activities", icon: "🏃" },
      { value: "food_event", label: "Food & Dining", icon: "🍽️" },
      { value: "sports", label: "Sports & Fitness", icon: "⚽" },
      { value: "workshop", label: "Workshops & Classes", icon: "📚" },
      { value: "volunteer", label: "Volunteering", icon: "❤️" },
    ];

    res.json(eventTypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user's preferred date types
router.put("/preferences", auth, async (req, res) => {
  try {
    const { preferred_date_types } = req.body;

    if (!Array.isArray(preferred_date_types)) {
      return res.status(400).json({ error: "preferred_date_types must be an array" });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { user_email: req.user.email },
      { $set: { preferred_date_types } },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({ 
      message: "Date preferences updated",
      preferred_date_types: profile.preferred_date_types 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Propose a date from an event (creates a conversation starter)
router.post("/propose-date", auth, async (req, res) => {
  try {
    const { event_id, match_id, message } = req.body;

    if (!event_id || !match_id) {
      return res.status(400).json({ error: "event_id and match_id are required" });
    }

    const event = SAMPLE_EVENTS.find(e => e.id === event_id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // In production, send notification to matched user
    // For now, just return success with event details
    
    res.json({
      message: "Date proposal sent!",
      event,
      proposal_message: message || `Hey! I found this ${event.title} and thought it might be fun. Want to check it out together?`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suggest a community event (user-generated content)
router.post("/suggest", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      price_range,
      atmosphere,
      best_for,
      images,
      website_url,
      phone_number,
      hours_of_operation,
      tips,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !location?.name || !location?.city) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get user profile
    const myProfile = await UserProfile.findOne({ user_email: req.user.email });
    if (!myProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Create community event suggestion
    const communityEvent = await CommunityEvent.create({
      title,
      description,
      category,
      location: {
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        country: location.country || "Nigeria",
        coordinates: location.coordinates,
      },
      price_range,
      atmosphere: atmosphere || [],
      best_for: best_for || [],
      suggested_by: myProfile._id,
      suggester_email: req.user.email,
      images: images || [],
      website_url,
      phone_number,
      hours_of_operation,
      tips: tips || [],
      status: "pending", // Requires admin approval
    });

    res.status(201).json({
      message: "Event suggested successfully! It will appear after approval.",
      event: communityEvent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get community-suggested events
router.get("/community", auth, async (req, res) => {
  try {
    const { category, city, sort = "upvotes" } = req.query;

    const filter = { status: "approved" };
    
    if (category) {
      filter.category = category;
    }
    
    if (city) {
      filter["location.city"] = new RegExp(city, "i");
    }

    const sortOption = {};
    if (sort === "upvotes") {
      sortOption.upvote_count = -1;
    } else if (sort === "recent") {
      sortOption.createdAt = -1;
    } else if (sort === "popular") {
      sortOption.times_proposed_as_date = -1;
    }

    const events = await CommunityEvent.find(filter)
      .populate("suggested_by", "display_name photos")
      .sort(sortOption)
      .limit(50);

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upvote a community event
router.post("/community/:id/upvote", auth, async (req, res) => {
  try {
    const event = await CommunityEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if already upvoted
    const existingUpvote = event.upvotes.find(
      u => u.user_email === req.user.email
    );

    if (existingUpvote) {
      // Remove upvote (toggle off)
      event.upvotes = event.upvotes.filter(u => u.user_email !== req.user.email);
      event.upvote_count = Math.max(0, event.upvote_count - 1);
    } else {
      // Add upvote
      event.upvotes.push({
        user_email: req.user.email,
        profile: (await UserProfile.findOne({ user_email: req.user.email }))._id,
      });
      event.upvote_count += 1;
    }

    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate AI coach tips for event matching
router.post("/generate-coach-tips", auth, async (req, res) => {
  try {
    const { match_id, event_type } = req.body;

    if (!match_id) {
      return res.status(400).json({ error: "match_id is required" });
    }

    const match = await DateEvent.findById(match_id);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Get both profiles
    const myProfile = await UserProfile.findOne({ user_email: req.user.email });
    const otherProfile = await UserProfile.findOne({ 
      user_email: match.proposed_to[0]?.user_email 
    });

    if (!myProfile || !otherProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Generate conversation starters
    const conversationStarters = generateConversationStarters(myProfile, otherProfile, match);

    // Generate date guidance if event type specified
    const dateGuidance = event_type ? generateDateGuidance(event_type, match.title) : null;

    // Calculate compatibility
    const compatibility = calculateEventCompatibility(myProfile, otherProfile, {
      type: event_type,
      location: match.location?.city,
      atmosphere: match.atmosphere?.[0],
    });

    res.json({
      conversation_starters: conversationStarters,
      date_guidance: dateGuidance,
      compatibility: compatibility,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get match compatibility for events
router.get("/match-compatibility/:matchId", auth, async (req, res) => {
  try {
    const match = await DateEvent.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    const myProfile = await UserProfile.findOne({ user_email: req.user.email });
    const otherProfile = await UserProfile.findOne({ 
      user_email: match.proposed_to[0]?.user_email 
    });

    if (!myProfile || !otherProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const compatibility = calculateEventCompatibility(myProfile, otherProfile, {
      type: match.category,
      location: match.location?.city,
      atmosphere: match.atmosphere?.[0],
    });

    res.json(compatibility);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

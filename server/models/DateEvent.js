import mongoose from "mongoose";

const dateEventSchema = new mongoose.Schema(
  {
    // Event details
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "concert",
        "art_exhibit",
        "coffee_shop",
        "outdoor_activity",
        "restaurant",
        "museum",
        "sports_event",
        "workshop_class",
        "festival",
        "movie_screening",
        "comedy_show",
        "wine_tasting",
        "hiking",
        "beach_day",
        "cultural_event",
        "volunteer_activity",
        "dance_class",
        "cooking_class",
        "photography_walk",
        "book_club",
        "other"
      ],
      required: true,
    },
    
    // Location information
    location: {
      name: String,
      address: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    
    // Timing
    suggested_date: Date,
    suggested_time: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night"],
    },
    duration_hours: Number,
    
    // Pricing
    price_range: {
      type: String,
      enum: ["free", "$", "$$", "$$$", "$$$$"],
    },
    estimated_cost_per_person: Number,
    
    // Created by user
    created_by: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'UserProfile',
      required: true 
    },
    creator_email: { type: String, required: true },
    
    // For matched events - who it's proposed to
    proposed_to: [{
      user_email: String,
      match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
      status: {
        type: String,
        enum: ["pending", "interested", "not_interested", "accepted", "declined"],
        default: "pending",
      },
      proposed_at: { type: Date, default: Date.now },
      responded_at: Date,
      response_message: String,
    }],
    
    // Interest matching
    interested_users: [{
      user_email: String,
      profile: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' },
      interest_level: { type: String, enum: ["maybe", "interested", "excited"] },
      availability: {
        status: { type: String, enum: ["available", "busy", "check_schedule"] },
        preferred_dates: [Date],
      },
      added_at: { type: Date, default: Date.now },
    }],
    
    // AI-generated conversation starters for this event
    conversation_starters: [{
      topic: String,
      question: String,
      context: String,
    }],
    
    // Tips for this type of date
    date_tips: [{
      tip_type: String,
      content: String,
    }],
    
    // Event status
    status: {
      type: String,
      enum: [
        "draft",
        "active",
        "proposed",
        "planning",
        "confirmed",
        "completed",
        "cancelled",
        "expired"
      ],
      default: "active",
    },
    
    // Additional details
    images: [String],
    website_url: String,
    booking_url: String,
    tags: [String],
    
    // Engagement metrics
    views: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    
    // Post-date feedback
    post_date_feedback: [{
      user_email: String,
      rating: { type: Number, min: 1, max: 5 },
      enjoyed: Boolean,
      would_recommend: Boolean,
      notes: String,
      submitted_at: Date,
    }],
  },
  { timestamps: true }
);

// Indexes for efficient queries
dateEventSchema.index({ category: 1 });
dateEventSchema.index({ status: 1 });
dateEventSchema.index({ 'location.coordinates': '2dsphere' });
dateEventSchema.index({ suggested_date: 1 });
dateEventSchema.index({ created_by: 1 });

export default mongoose.model("DateEvent", dateEventSchema);

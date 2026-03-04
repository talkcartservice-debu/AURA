import mongoose from "mongoose";

const communityEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "coffee_shop",
        "art_exhibit",
        "concert",
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
    
    // Location details
    location: {
      name: { type: String, required: true },
      address: String,
      city: { type: String, required: true },
      state: String,
      country: { type: String, default: "Nigeria" },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    
    // Event characteristics
    price_range: {
      type: String,
      enum: ["free", "₦", "₦₦", "₦₦₦", "₦₦₦₦"],
    },
    atmosphere: [{
      type: String,
      enum: ["casual", "romantic", "active", "cultural", "fun", "relaxed", "upscale", "adventurous"],
    }],
    
    // Why it's great for dates
    best_for: [{
      type: String,
      enum: ["first_dates", "anniversary", "group_date", "double_date", "casual_meetup", "deep_conversation"],
    }],
    
    suggested_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
    },
    suggester_email: { type: String, required: true },
    
    // Community validation
    upvotes: [{
      user_email: String,
      profile: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile" },
    }],
    upvote_count: { type: Number, default: 0 },
    
    downvotes: [{
      user_email: String,
    }],
    downvote_count: { type: Number, default: 0 },
    
    // Moderation
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged"],
      default: "pending",
    },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approved_at: Date,
    
    // Additional info
    images: [String],
    website_url: String,
    phone_number: String,
    hours_of_operation: String,
    tips: [String], // User tips for this venue
    
    // AI-generated content
    ai_description: String,
    conversation_starters: [{
      topic: String,
      suggestion: String,
    }],
    
    // Engagement metrics
    views: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    times_proposed_as_date: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for efficient queries
communityEventSchema.index({ category: 1 });
communityEventSchema.index({ 'location.city': 1 });
communityEventSchema.index({ status: 1 });
communityEventSchema.index({ upvote_count: -1 });
communityEventSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model("CommunityEvent", communityEventSchema);

import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true, unique: true, index: true },
    display_name: { type: String, default: "" },
    gender: { 
      type: String, 
      enum: ["man", "woman", "non_binary", "other"],
      default: "other"
    },
    looking_for: {
      type: [String],
      enum: ["men", "women", "both", "others"],
      default: ["both"]
    },
    age: { type: Number },
    bio: { type: String, default: "" },
    // Enhanced location tracking
    location: { type: String, default: "" },
    location_coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      last_updated: { type: Date },
      accuracy: { type: Number }, // in meters
      city: { type: String },
      country: { type: String },
    },
    location_history: [{
      latitude: Number,
      longitude: Number,
      timestamp: Date,
      accuracy: Number,
    }],
    photos: [{ type: String }],
    // Privacy settings
    blurred_photos: [{ type: String }], // Photos visible only to matches
    show_blurred_to_public: { type: Boolean, default: false },
    interests: [{ type: String }],
    values: [{ type: String }],
    dealbreakers: [{ type: String }],
    hobbies: [{ type: String }],
    lifestyle: {
      smoking: { type: String },
      drinking: { type: String },
      exercise: { type: String },
      diet: { type: String },
    },
    // Intent-based dating
    dating_intent: { 
      type: String,
      enum: ["long_term", "casual_dating", "friendship_first", "marriage_minded", "open_to_anything", "short_term_connection"],
      default: "long_term"
    },
    // Casual mode preferences (requires Premium + Casual Add-On)
    casual_preferences: {
      open_to_short_term: { type: Boolean, default: false },
      discreet_mode: { type: Boolean, default: false },
      verified_only: { type: Boolean, default: false },
      disappearing_messages_default: { type: Boolean, default: false },
    },
    relationship_goals: {
      type: String,
      enum: ["long_term", "casual_dating", "friendship_first", "marriage_minded", "open_to_anything"],
    },
    relationship_expectations: [{ type: String }],
    is_verified: { type: Boolean, default: false },
    is_personality_verified: { type: Boolean, default: false },
    is_hot_love: { type: Boolean, default: false },
    is_incognito: { type: Boolean, default: false },
    blind_date_available: { type: Boolean, default: false },
    personality_tags: [{ type: String }],
    profile_complete: { type: Boolean, default: false },
    // Biometric authentication
    has_biometric: { type: Boolean, default: false },
    biometric_registered_at: { type: Date },
    // Enhanced privacy controls
    hide_from_contacts: { type: Boolean, default: false },
    screenshot_alerts_enabled: { type: Boolean, default: false },
    // AI features
    ai_compatibility_score: { type: Number },
    emotional_intelligence_score: { type: Number },
    communication_style: { type: String },
    compatibility_traits: {
      openness: { type: Number },
      conscientiousness: { type: Number },
      extraversion: { type: Number },
      agreeableness: { type: Number },
      neuroticism: { type: Number },
    },
    // Date/event preferences
    preferred_date_types: [{ type: String }], // e.g., "concerts", "art_exhibits", "coffee_shops", "outdoor_activities"
    available_for_dates: { type: Boolean, default: true },
    // Blocked users
    blocked_emails: [{ type: String }],
    // Read receipts
    read_receipts_enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes for efficient queries
userProfileSchema.index({ dating_intent: 1 });
userProfileSchema.index({ is_hot_love: 1 });
userProfileSchema.index({ is_verified: 1 });

// Geospatial indexes for location-based queries
userProfileSchema.index({ 'location_coordinates.latitude': 1, 'location_coordinates.longitude': 1 });
userProfileSchema.index({ 'location_history.timestamp': -1 });

export default mongoose.model("UserProfile", userProfileSchema);

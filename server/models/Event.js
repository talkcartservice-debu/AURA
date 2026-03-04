import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    event_date: { type: String, required: true },
    event_time: { type: String },
    location: { type: String, default: "" },
    capacity: { type: Number },
    cover_emoji: { type: String, default: "🎉" },
    is_public: { type: Boolean, default: true },
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    creator_email: { type: String, required: true },
    rsvp_emails: [{ type: String }],
    
    // AI Relationship Coach fields
    ai_insights: [{
      insight_type: { 
        type: String, 
        enum: ["conversation_starter", "date_tip", "compatibility_note", "icebreaker"] 
      },
      content: String,
      generated_at: { type: Date, default: Date.now },
    }],
    
    date_guidance: {
      preparation_tips: [String],
      conversation_topics: [String],
      etiquette_notes: [String],
      what_to_wear: String,
      estimated_duration: String,
    },
    
    // Community-suggested events
    community_suggested: { type: Boolean, default: false },
    suggested_by: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile" },
    upvotes: [{ type: String }], // Array of user emails who upvoted
    upvote_count: { type: Number, default: 0 },
    
    // Event matching tags
    event_tags: [String], // e.g., "first-date-friendly", "romantic", "casual", "active"
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);

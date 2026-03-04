import mongoose from "mongoose";

const conversationCoachSchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true, index: true },
    
    // Chat messages
    messages: [{
      role: { 
        type: String, 
        enum: ["user", "coach"], 
        required: true 
      },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      category: {
        type: String,
        enum: [
          "general_advice",
          "relationship_question",
          "dating_tip",
          "confidence_building",
          "communication_help",
          "breakup_support",
          "first_date_prep",
          "red_flag_discussion",
          "goal_setting",
          "other"
        ],
        default: "general_advice"
      },
    }],
    
    // Conversation context
    context: {
      current_topic: String,
      mood: {
        type: String,
        enum: ["happy", "sad", "anxious", "excited", "confused", "frustrated", "hopeful", "neutral"],
        default: "neutral"
      },
      urgency: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "low"
      },
      goals: [String],
    },
    
    // Session tracking
    session_count: { type: Number, default: 0 },
    last_active: { type: Date, default: Date.now },
    
    // User preferences
    coaching_style: {
      type: String,
      enum: ["supportive", "direct", "gentle", "motivational", "analytical"],
      default: "supportive"
    },
    
    // Topics frequently discussed
    common_topics: [{
      topic: String,
      count: { type: Number, default: 1 },
      last_discussed: Date,
    }],
    
    // Progress tracking
    milestones: [{
      milestone: String,
      achieved_at: Date,
      notes: String,
    }],
  },
  { timestamps: true }
);

// Indexes for efficient queries
conversationCoachSchema.index({ 'messages.timestamp': -1 });
conversationCoachSchema.index({ session_count: -1 });
conversationCoachSchema.index({ 'common_topics.count': -1 });

export default mongoose.model("ConversationCoach", conversationCoachSchema);

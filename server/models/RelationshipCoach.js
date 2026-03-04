import mongoose from "mongoose";

const relationshipCoachSchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true, index: true },
    
    // Conversation analysis
    conversations: [{
      match_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
      messages_analyzed: Number,
      conversation_quality_score: Number, // 0-100
      topics_discussed: [String],
      emotional_tone: { type: String, enum: ["positive", "neutral", "negative", "mixed"] },
      last_analyzed: Date,
    }],
    
    // Red flags detected
    red_flags: [{
      type: { 
        type: String, 
        enum: [
          "disrespectful_language",
          "controlling_behavior", 
          "inconsistent_stories",
          "pressure_for_personal_info",
          "avoidance_video_call",
          "money_requests",
          "love_bombing",
          "gaslighting_signs",
          "boundary_violations",
          "emotional_unavailability"
        ]
      },
      severity: { type: String, enum: ["low", "medium", "high", "critical"] },
      description: String,
      message_examples: [String],
      detected_at: { type: Date, default: Date.now },
      addressed: { type: Boolean, default: false },
    }],
    
    // Communication tips provided
    communication_tips: [{
      tip_type: {
        type: String,
        enum: [
          "conversation_starter",
          "active_listening",
          "conflict_resolution",
          "boundary_setting",
          "compliment_giving",
          "question_asking",
          "humor_usage",
          "vulnerability_sharing"
        ]
      },
      content: String,
      context: String,
      applied: { type: Boolean, default: false },
      created_at: { type: Date, default: Date.now },
    }],
    
    // Date readiness assessment
    date_readiness: {
      score: Number, // 0-100
      factors: [{
        factor: String,
        status: String, // "ready", "needs_work", "not_ready"
      }],
      recommendations: [String],
      assessed_at: Date,
    },
    
    // Relationship goals tracking
    goal_progress: [{
      goal: String,
      category: {
        type: String,
        enum: ["communication", "trust", "intimacy", "boundaries", "quality_time"],
      },
      progress_percentage: Number,
      milestones_completed: [String],
      started_at: Date,
      updated_at: Date,
    }],
    
    // AI coach interactions
    coach_interactions: [{
      interaction_type: {
        type: String,
        enum: ["advice_request", "check_in", "crisis_support", "celebration", "question"],
      },
      user_message: String,
      coach_response: String,
      sentiment: String,
      helpfulness_rating: { type: Number, min: 1, max: 5 },
      timestamp: { type: Date, default: Date.now },
    }],
    
    // Personalized insights
    insights: [{
      insight_type: {
        type: String,
        enum: [
          "pattern_recognition",
          "compatibility_indicator",
          "growth_area",
          "strength_highlight",
          "warning_sign"
        ]
      },
      title: String,
      description: String,
      actionable_advice: String,
      priority: { type: String, enum: ["low", "medium", "high"] },
      read: { type: Boolean, default: false },
      created_at: { type: Date, default: Date.now },
    }],
    
    // Overall relationship health score
    relationship_health: {
      overall_score: { type: Number, min: 0, max: 100 },
      components: {
        communication: { type: Number, min: 0, max: 100 },
        trust: { type: Number, min: 0, max: 100 },
        respect: { type: Number, min: 0, max: 100 },
        compatibility: { type: Number, min: 0, max: 100 },
        emotional_connection: { type: Number, min: 0, max: 100 },
      },
      last_updated: Date,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
relationshipCoachSchema.index({ user_email: 1 });
relationshipCoachSchema.index({ 'red_flags.detected_at': -1 });
relationshipCoachSchema.index({ 'insights.created_at': -1 });

export default mongoose.model("RelationshipCoach", relationshipCoachSchema);

import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true, unique: true },
    plan: { 
      type: String, 
      enum: ["free", "premium", "hot_love"], 
      default: "free" 
    },
    // Casual Connection Add-On (requires Premium)
    casual_addon: { type: Boolean, default: false },
    casual_addon_expires_at: { type: Date },
    // Subscription duration and pricing
    billing_cycle: { 
      type: String, 
      enum: ["monthly", "quarterly", "biannual", "annual"],
      default: "monthly"
    },
    started_at: { type: Date, default: Date.now },
    expires_at: { type: Date },
    is_active: { type: Boolean, default: true },
    paystack_reference: { type: String },
    paystack_customer_code: { type: String },
    amount: { type: Number },
    // Feature usage tracking
    super_likes_used: { type: Number, default: 0 },
    super_likes_limit: { type: Number, default: 5 },
    boosts_purchased: { type: Number, default: 0 },
    // AI features
    ai_coaching_enabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for efficient queries
subscriptionSchema.index({ user_email: 1, is_active: 1 });

export default mongoose.model("Subscription", subscriptionSchema);

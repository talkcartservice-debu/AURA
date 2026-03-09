import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true, index: true },
    plan: { type: String, required: true }, // e.g., 'premium', 'casual_addon', 'boosts', 'super_likes'
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" }, // Paystack default
    status: { 
      type: String, 
      enum: ["success", "failed", "pending", "refunded", "cancelled"],
      default: "pending" 
    },
    reference: { type: String, required: true, unique: true },
    paystack_id: { type: String },
    gateway_response: { type: String },
    paid_at: { type: Date },
    refund_details: {
      amount: Number,
      reason: String,
      refunded_at: Date,
      refund_reference: String
    }
  },
  { timestamps: true }
);

transactionSchema.index({ reference: 1 });
transactionSchema.index({ user_email: 1 });
transactionSchema.index({ createdAt: -1 });

export default mongoose.model("Transaction", transactionSchema);

import mongoose from "mongoose";

const blindDateMessageSchema = new mongoose.Schema({
  sender_email: { type: String, required: true },
  text: { type: String, required: true },
  sent_at: { type: Date, default: Date.now },
});

const blindDateSchema = new mongoose.Schema(
  {
    user1_email: { type: String, required: true, index: true },
    user2_email: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["active", "revealed", "expired", "cancelled"],
      default: "active",
    },
    messages: [blindDateMessageSchema],
    user1_message_count: { type: Number, default: 0 },
    user2_message_count: { type: Number, default: 0 },
    revealed: { type: Boolean, default: false },
    compatibility_score: { type: Number, default: 0 },
    shared_interests: [{ type: String }],
    conversation_prompt: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("BlindDate", blindDateSchema);

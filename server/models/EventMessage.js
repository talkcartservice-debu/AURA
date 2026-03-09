import mongoose from "mongoose";

const eventMessageSchema = new mongoose.Schema(
  {
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    sender_email: { type: String, required: true, index: true },
    content: { type: String, required: false },
    image_url: { type: String, default: null },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for efficient queries
eventMessageSchema.index({ event_id: 1, createdAt: -1 });

export default mongoose.model("EventMessage", eventMessageSchema);

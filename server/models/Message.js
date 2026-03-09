import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    match_id: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true, index: true },
    sender_email: { type: String, required: true, index: true },
    receiver_email: { type: String, required: true, index: true },
    content: { type: String, required: false },
    image_url: { type: String, required: false },
    is_read: { type: Boolean, default: false },
    // Disappearing messages support
    is_disappearing: { type: Boolean, default: false },
    disappears_at: { type: Date },
    // Message metadata
    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    reactions: [
      {
        user_email: { type: String, required: true },
        emoji: { type: String, required: true },
      }
    ],
  },
  { timestamps: true }
);

// Index for efficient queries
messageSchema.index({ match_id: 1, created_at: -1 });
messageSchema.index({ sender_email: 1, is_read: 1 });

export default mongoose.model("Message", messageSchema);

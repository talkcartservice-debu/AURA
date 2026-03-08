import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
  {
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    sender_email: { type: String, required: true, index: true },
    content: { type: String, required: true },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for efficient queries
groupMessageSchema.index({ group_id: 1, createdAt: -1 });

export default mongoose.model("GroupMessage", groupMessageSchema);

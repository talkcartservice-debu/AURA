import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "social" },
    cover_emoji: { type: String, default: "🎉" },
    tags: [{ type: String }],
    location: { type: String, default: "" },
    creator_email: { type: String, required: true },
    member_emails: [{ type: String }],
    pending_member_emails: [{ type: String }],
    max_members: { type: Number },
    is_public: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Group", groupSchema);

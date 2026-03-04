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
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);

import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    adminEmail: { type: String, required: true },
    action: { type: String, required: true }, // e.g., 'ban_user', 'update_role', 'delete_event'
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetType: { type: String }, // e.g., 'User', 'Event', 'Message'
    details: { type: Object },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("AdminLog", adminLogSchema);

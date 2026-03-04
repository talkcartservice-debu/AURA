import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    from_email: { type: String, required: true, index: true },
    to_email: { type: String, required: true, index: true },
    daily_match_id: { type: mongoose.Schema.Types.ObjectId, ref: "DailyMatch" },
    is_super_like: { type: Boolean, default: false },
  },
  { timestamps: true }
);

likeSchema.index({ from_email: 1, to_email: 1 }, { unique: true });

export default mongoose.model("Like", likeSchema);

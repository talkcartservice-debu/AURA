import mongoose from "mongoose";

const dailyMatchSchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true, index: true },
    matched_email: { type: String, required: true },
    compatibility_score: { type: Number, default: 0 },
    compatibility_reasons: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "liked", "passed"],
      default: "pending",
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("DailyMatch", dailyMatchSchema);

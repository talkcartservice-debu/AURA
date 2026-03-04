import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    user1_email: { type: String, required: true, index: true },
    user2_email: { type: String, required: true, index: true },
    matched_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);

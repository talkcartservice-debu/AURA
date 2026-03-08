import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter_email: { type: String, required: true, index: true },
    reported_email: { type: String, required: true, index: true },
    reason: { type: String, required: true },
    details: { type: String },
    match_id: { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
    status: { type: String, enum: ["pending", "reviewed", "resolved"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);

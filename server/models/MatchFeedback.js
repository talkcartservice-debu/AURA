import mongoose from "mongoose";

const matchFeedbackSchema = new mongoose.Schema(
  {
    match_id: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    user_email: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("MatchFeedback", matchFeedbackSchema);

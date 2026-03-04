import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    match_id: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true, index: true },
    initiator_email: { type: String, required: true },
    receiver_email: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["video", "voice"], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ["initiated", "accepted", "rejected", "missed", "ended"], 
      default: "initiated" 
    },
    started_at: { type: Date },
    ended_at: { type: Date },
    duration: { type: Number, default: 0 }, // in seconds
    // WebRTC signaling data (temporary storage)
    signal_data: { type: Object },
  },
  { timestamps: true }
);

// Index for efficient queries
callSchema.index({ match_id: 1, createdAt: -1 });
callSchema.index({ initiator_email: 1, receiver_email: 1 });

export default mongoose.model("Call", callSchema);

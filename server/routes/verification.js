import { Router } from "express";
import auth from "../middleware/auth.js";
import VerificationRequest from "../models/VerificationRequest.js";
import UserProfile from "../models/UserProfile.js";

const router = Router();

router.get("/", auth, async (req, res) => {
  try {
    const request = await VerificationRequest.findOne({ user_email: req.user.email }).sort({ createdAt: -1 });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const request = await VerificationRequest.create({
      user_email: req.user.email,
      selfie_url: req.body.selfie_url,
    });
    // Auto-approve for demo purposes
    request.status = "approved";
    request.reviewed_at = new Date();
    await request.save();

    await UserProfile.findOneAndUpdate(
      { user_email: req.user.email },
      { is_verified: true }
    );

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

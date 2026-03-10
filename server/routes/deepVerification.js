import express from "express";
import auth from "../middleware/auth.js";
import {
  initVerification,
  submitIDDocument,
  sendPhoneVerificationCode,
  verifyPhoneCode,
  submitSocialAccounts,
  submitVideoVerification,
  performFraudDetection,
  approveVerification,
  rejectVerification,
  getVerificationStatus,
} from "../utils/deepVerificationService.js";

const router = express.Router();

/**
 * POST /api/deep-verification/deep/init
 * Initialize deep verification process
 */
router.post("/deep/init", auth, async (req, res) => {
  try {
    const { verification_type = "basic" } = req.body;
    const email = req.user.email;

    const result = await initVerification(email, verification_type);

    res.json(result);
  } catch (error) {
    console.error("Error initializing verification:", error);
    res.status(500).json({ error: error.message || "Failed to initialize verification" });
  }
});

/**
 * POST /api/deep-verification/deep/id-document
 * Submit ID document for verification
 */
router.post("/deep/id-document", auth, async (req, res) => {
  try {
    const { ...documentData } = req.body;
    const email = req.user.email;

    if (!documentData.front_url || !documentData.document_type) {
      return res.status(400).json({ error: "front_url and document_type are required" });
    }

    const result = await submitIDDocument(email, documentData);

    res.json(result);
  } catch (error) {
    console.error("Error submitting ID document:", error);
    res.status(500).json({ error: error.message || "Failed to submit ID document" });
  }
});

/**
 * POST /api/deep-verification/deep/phone/send-code
 * Send phone verification code
 */
router.post("/deep/phone/send-code", auth, async (req, res) => {
  try {
    const { phone_number, country_code } = req.body;
    const email = req.user.email;

    if (!phone_number) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const result = await sendPhoneVerificationCode(email, phone_number, country_code);

    res.json(result);
  } catch (error) {
    console.error("Error sending phone verification:", error);
    res.status(500).json({ error: error.message || "Failed to send verification code" });
  }
});

/**
 * POST /api/deep-verification/deep/phone/verify-code
 * Verify phone OTP code
 */
router.post("/deep/phone/verify-code", auth, async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.user.email;

    if (!otp) {
      return res.status(400).json({ error: "OTP is required" });
    }

    const result = await verifyPhoneCode(email, otp);

    res.json(result);
  } catch (error) {
    console.error("Error verifying phone code:", error);
    res.status(500).json({ error: error.message || "Failed to verify phone code" });
  }
});

/**
 * POST /api/deep-verification/deep/social-accounts
 * Submit social media accounts
 */
router.post("/deep/social-accounts", auth, async (req, res) => {
  try {
    const { social_accounts } = req.body;
    const email = req.user.email;

    if (!social_accounts) {
      return res.status(400).json({ error: "social_accounts are required" });
    }

    const result = await submitSocialAccounts(email, social_accounts);

    res.json(result);
  } catch (error) {
    console.error("Error submitting social accounts:", error);
    res.status(500).json({ error: error.message || "Failed to submit social accounts" });
  }
});

/**
 * POST /api/deep-verification/deep/video
 * Submit video verification
 */
router.post("/deep/video", auth, async (req, res) => {
  try {
    const { video_url, duration, phrase } = req.body;
    const email = req.user.email;

    if (!video_url) {
      return res.status(400).json({ error: "video_url is required" });
    }

    const result = await submitVideoVerification(email, {
      video_url,
      duration,
      phrase,
    });

    res.json(result);
  } catch (error) {
    console.error("Error submitting video verification:", error);
    res.status(500).json({ error: error.message || "Failed to submit video verification" });
  }
});

/**
 * POST /api/deep-verification/deep/fraud-detection
 * Perform AI fraud detection
 */
router.post("/deep/fraud-detection", auth, async (req, res) => {
  try {
    const { ip, device_fingerprint, country, city, is_vpn, is_proxy } = req.body;
    const email = req.user.email;

    const verification = await VerificationRequest.findOne({ user_email: email });

    if (!verification) {
      return res.status(404).json({ error: "No verification request found" });
    }

    const fraudResult = await performFraudDetection(verification, {
      ip,
      deviceFingerprint: device_fingerprint,
      country,
      city,
      isVpn: is_vpn,
      isProxy: is_proxy,
    });

    res.json({
      success: true,
      fraud_detection: fraudResult,
    });
  } catch (error) {
    console.error("Error performing fraud detection:", error);
    res.status(500).json({ error: error.message || "Failed to perform fraud detection" });
  }
});

/**
 * POST /api/deep-verification/deep/approve
 * Approve verification (admin only - should have admin middleware)
 */
router.post("/deep/approve", async (req, res) => {
  try {
    const { email, reviewer_email, confidence_score = 85 } = req.body;

    if (!email || !reviewer_email) {
      return res.status(400).json({ error: "Email and reviewer_email are required" });
    }

    const result = await approveVerification(email, reviewer_email, confidence_score);

    res.json(result);
  } catch (error) {
    console.error("Error approving verification:", error);
    res.status(500).json({ error: error.message || "Failed to approve verification" });
  }
});

/**
 * POST /api/deep-verification/deep/reject
 * Reject verification (admin only - should have admin middleware)
 */
router.post("/deep/reject", async (req, res) => {
  try {
    const { email, reviewer_email, reason } = req.body;

    if (!email || !reviewer_email || !reason) {
      return res.status(400).json({ error: "Email, reviewer_email, and reason are required" });
    }

    const result = await rejectVerification(email, reviewer_email, reason);

    res.json(result);
  } catch (error) {
    console.error("Error rejecting verification:", error);
    res.status(500).json({ error: error.message || "Failed to reject verification" });
  }
});

/**
 * GET /api/deep-verification/deep/status
 * Get verification status
 */
router.get("/deep/status", auth, async (req, res) => {
  try {
    const email = req.user.email;

    const result = await getVerificationStatus(email);

    res.json(result);
  } catch (error) {
    console.error("Error getting verification status:", error);
    res.status(500).json({ error: error.message || "Failed to get verification status" });
  }
});

export default router;

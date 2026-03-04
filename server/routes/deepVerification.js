import express from "express";
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
 * POST /api/verification/deep/init
 * Initialize deep verification process
 */
router.post("/deep/init", async (req, res) => {
  try {
    const { email, verification_type = "basic" } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await initVerification(email, verification_type);

    res.json(result);
  } catch (error) {
    console.error("Error initializing verification:", error);
    res.status(500).json({ error: error.message || "Failed to initialize verification" });
  }
});

/**
 * POST /api/verification/deep/id-document
 * Submit ID document for verification
 */
router.post("/deep/id-document", async (req, res) => {
  try {
    const { email, ...documentData } = req.body;

    if (!email || !documentData.front_url || !documentData.document_type) {
      return res.status(400).json({ error: "Email, front_url, and document_type are required" });
    }

    const result = await submitIDDocument(email, documentData);

    res.json(result);
  } catch (error) {
    console.error("Error submitting ID document:", error);
    res.status(500).json({ error: error.message || "Failed to submit ID document" });
  }
});

/**
 * POST /api/verification/deep/phone/send-code
 * Send phone verification code
 */
router.post("/deep/phone/send-code", async (req, res) => {
  try {
    const { email, phone_number, country_code } = req.body;

    if (!email || !phone_number) {
      return res.status(400).json({ error: "Email and phone number are required" });
    }

    const result = await sendPhoneVerificationCode(email, phone_number, country_code);

    res.json(result);
  } catch (error) {
    console.error("Error sending phone verification:", error);
    res.status(500).json({ error: error.message || "Failed to send verification code" });
  }
});

/**
 * POST /api/verification/deep/phone/verify-code
 * Verify phone OTP code
 */
router.post("/deep/phone/verify-code", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const result = await verifyPhoneCode(email, otp);

    res.json(result);
  } catch (error) {
    console.error("Error verifying phone code:", error);
    res.status(500).json({ error: error.message || "Failed to verify phone code" });
  }
});

/**
 * POST /api/verification/deep/social-accounts
 * Submit social media accounts
 */
router.post("/deep/social-accounts", async (req, res) => {
  try {
    const { email, social_accounts } = req.body;

    if (!email || !social_accounts) {
      return res.status(400).json({ error: "Email and social_accounts are required" });
    }

    const result = await submitSocialAccounts(email, social_accounts);

    res.json(result);
  } catch (error) {
    console.error("Error submitting social accounts:", error);
    res.status(500).json({ error: error.message || "Failed to submit social accounts" });
  }
});

/**
 * POST /api/verification/deep/video
 * Submit video verification
 */
router.post("/deep/video", async (req, res) => {
  try {
    const { email, video_url, duration, phrase } = req.body;

    if (!email || !video_url) {
      return res.status(400).json({ error: "Email and video_url are required" });
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
 * POST /api/verification/deep/fraud-detection
 * Perform AI fraud detection
 */
router.post("/deep/fraud-detection", async (req, res) => {
  try {
    const { email, ip, device_fingerprint, country, city, is_vpn, is_proxy } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

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
 * POST /api/verification/deep/approve
 * Approve verification (admin only)
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
 * POST /api/verification/deep/reject
 * Reject verification (admin only)
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
 * GET /api/verification/deep/status
 * Get verification status
 */
router.get("/deep/status", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await getVerificationStatus(email);

    res.json(result);
  } catch (error) {
    console.error("Error getting verification status:", error);
    res.status(500).json({ error: error.message || "Failed to get verification status" });
  }
});

export default router;

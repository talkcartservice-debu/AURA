import VerificationRequest from "../models/VerificationRequest.js";
import UserProfile from "../models/UserProfile.js";
import crypto from "crypto";

/**
 * Deep Verification Service
 * Multi-layer identity and profile verification system
 */

/**
 * Initialize verification request
 */
export async function initVerification(email, verificationType = "basic") {
  try {
    const profile = await UserProfile.findOne({ user_email: email });
    
    if (!profile) {
      throw new Error("User profile not found");
    }

    // Check if existing verification is pending
    const existing = await VerificationRequest.findOne({
      user_email: email,
      status: { $in: ["pending", "in_progress"] },
    });

    if (existing) {
      return {
        success: false,
        message: "Verification already in progress",
        verification: existing,
      };
    }

    // Create new verification request
    const verification = new VerificationRequest({
      user_email: email,
      verification_type: verificationType,
      status: "pending",
      verification_level: "none",
      verification_history: [{
        action: "verification_initiated",
        timestamp: new Date(),
        details: `Started ${verificationType} verification`,
        performed_by: email,
      }],
    });

    await verification.save();

    return {
      success: true,
      message: "Verification initiated successfully",
      verification: verification,
    };
  } catch (error) {
    console.error("Error initializing verification:", error);
    throw error;
  }
}

/**
 * Submit ID document for verification
 */
export async function submitIDDocument(email, documentData) {
  try {
    const verification = await VerificationRequest.findOne({
      user_email: email,
      status: { $in: ["pending", "in_progress"] },
    });

    if (!verification) {
      throw new Error("No active verification request found");
    }

    // Validate document expiry
    const expiryDate = new Date(documentData.expiry_date);
    const isExpired = expiryDate < new Date();

    // Update ID document data
    verification.id_document = {
      front_url: documentData.front_url,
      back_url: documentData.back_url,
      document_type: documentData.document_type,
      document_number: documentData.document_number,
      full_name: documentData.full_name,
      date_of_birth: documentData.date_of_birth,
      expiry_date: documentData.expiry_date,
      issuing_country: documentData.issuing_country,
      verified_data: {
        name_match: false, // Will be validated
        dob_match: false,
        document_valid: !isExpired,
        not_expired: !isExpired,
      },
    };

    // Add to history
    verification.verification_history.push({
      action: "id_document_submitted",
      timestamp: new Date(),
      details: `Submitted ${documentData.document_type} for verification`,
      performed_by: email,
    });

    await verification.save();

    return {
      success: true,
      message: "ID document submitted for verification",
      verification: verification,
    };
  } catch (error) {
    console.error("Error submitting ID document:", error);
    throw error;
  }
}

/**
 * Verify phone number with OTP
 */
export async function sendPhoneVerificationCode(email, phoneNumber, countryCode) {
  try {
    const verification = await VerificationRequest.findOne({ user_email: email });

    if (!verification) {
      throw new Error("No verification request found");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code (in production, use Redis with TTL)
    verification.phone_verification = {
      phone_number: phoneNumber,
      country_code: countryCode,
      verified: false,
      verification_code: crypto.createHash('sha256').update(otp).digest('hex'),
    };

    await verification.save();

    // TODO: Send SMS via Twilio/MessageBird
    // For now, log OTP (remove in production)
    console.log(`Phone OTP for ${phoneNumber}: ${otp}`);

    return {
      success: true,
      message: "Verification code sent to your phone",
      test_otp: process.env.NODE_ENV === "development" ? otp : undefined,
    };
  } catch (error) {
    console.error("Error sending phone verification:", error);
    throw error;
  }
}

/**
 * Verify phone OTP code
 */
export async function verifyPhoneCode(email, otp) {
  try {
    const verification = await VerificationRequest.findOne({ user_email: email });

    if (!verification || !verification.phone_verification) {
      throw new Error("No phone verification in progress");
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const isValid = hashedOtp === verification.phone_verification.verification_code;

    if (!isValid) {
      throw new Error("Invalid verification code");
    }

    // Mark as verified
    verification.phone_verification.verified = true;
    verification.phone_verification.verified_at = new Date();
    verification.phone_verification.verification_code = undefined; // Clear OTP

    // Add badge
    addVerificationBadge(verification, "phone_verified");

    // Add to history
    verification.verification_history.push({
      action: "phone_verified",
      timestamp: new Date(),
      details: "Phone number verified successfully",
      performed_by: email,
    });

    await verification.save();

    return {
      success: true,
      message: "Phone number verified successfully",
    };
  } catch (error) {
    console.error("Error verifying phone code:", error);
    throw error;
  }
}

/**
 * Submit social media accounts for verification
 */
export async function submitSocialAccounts(email, socialAccounts) {
  try {
    const verification = await VerificationRequest.findOne({ user_email: email });

    if (!verification) {
      throw new Error("No verification request found");
    }

    // Update social accounts
    verification.social_accounts = {
      facebook: socialAccounts.facebook || verification.social_accounts?.facebook,
      instagram: socialAccounts.instagram || verification.social_accounts?.instagram,
      twitter: socialAccounts.twitter || verification.social_accounts?.twitter,
      linkedin: socialAccounts.linkedin || verification.social_accounts?.linkedin,
    };

    // Mark as unverified initially
    Object.keys(verification.social_accounts).forEach(platform => {
      if (verification.social_accounts[platform]?.url) {
        verification.social_accounts[platform].verified = false;
      }
    });

    // Add to history
    verification.verification_history.push({
      action: "social_accounts_submitted",
      timestamp: new Date(),
      details: "Social media accounts submitted for verification",
      performed_by: email,
    });

    await verification.save();

    return {
      success: true,
      message: "Social accounts submitted for verification",
    };
  } catch (error) {
    console.error("Error submitting social accounts:", error);
    throw error;
  }
}

/**
 * Submit video verification
 */
export async function submitVideoVerification(email, videoData) {
  try {
    const verification = await VerificationRequest.findOne({ user_email: email });

    if (!verification) {
      throw new Error("No verification request found");
    }

    verification.video_verification = {
      video_url: videoData.video_url,
      duration_seconds: videoData.duration,
      verification_phrase: videoData.phrase,
      facial_match_score: 0, // Will be calculated by AI service
      liveness_check: false, // Will be performed by AI service
    };

    // Add to history
    verification.verification_history.push({
      action: "video_verification_submitted",
      timestamp: new Date(),
      details: "Video verification submitted",
      performed_by: email,
    });

    await verification.save();

    return {
      success: true,
      message: "Video verification submitted",
    };
  } catch (error) {
    console.error("Error submitting video verification:", error);
    throw error;
  }
}

/**
 * Perform AI-powered fraud detection
 */
export async function performFraudDetection(verification, requestData) {
  try {
    const fraudScore = calculateFraudRiskScore(verification, requestData);
    
    verification.fraud_detection = {
      risk_score: fraudScore.score,
      risk_factors: fraudScore.factors,
      image_manipulation_detected: fraudScore.imageManipulation,
      multiple_accounts_detected: fraudScore.multipleAccounts,
      suspicious_patterns: fraudScore.suspiciousPatterns,
      ip_analysis: {
        ip_address: requestData.ip || "unknown",
        country: requestData.country || "unknown",
        city: requestData.city || "unknown",
        is_vpn: requestData.isVpn || false,
        is_proxy: requestData.isProxy || false,
      },
    };

    return fraudScore;
  } catch (error) {
    console.error("Error performing fraud detection:", error);
    return { score: 50, factors: ["Error in fraud detection"] };
  }
}

/**
 * Calculate fraud risk score (simplified version)
 */
function calculateFraudRiskScore(verification, requestData) {
  let score = 0; // 0 = low risk, 100 = high risk
  const factors = [];
  const suspiciousPatterns = [];
  
  // Check IP reputation
  if (requestData.isVpn) {
    score += 20;
    factors.push("Using VPN");
  }
  
  if (requestData.isProxy) {
    score += 25;
    factors.push("Using proxy");
  }

  // Check device fingerprint (implement proper check in production)
  if (!requestData.deviceFingerprint) {
    score += 15;
    factors.push("No device fingerprint");
  }

  // Check for multiple submissions
  if (verification.verification_history.length > 10) {
    score += 30;
    factors.push("Multiple verification attempts");
    suspiciousPatterns.push("Excessive retries");
  }

  // Image manipulation detection (would use AI service in production)
  const imageManipulation = false; // Implement with AI service
  
  // Multiple accounts check (check IP/email patterns)
  const multipleAccounts = false; // Implement database check

  return {
    score: Math.min(score, 100),
    factors,
    imageManipulation,
    multipleAccounts,
    suspiciousPatterns,
  };
}

/**
 * Add verification badge
 */
function addVerificationBadge(verification, badgeType) {
  const existingBadge = verification.verification_badges.find(
    b => b.badge_type === badgeType
  );

  if (!existingBadge) {
    verification.verification_badges.push({
      badge_type: badgeType,
      awarded_at: new Date(),
      expires_at: null, // Badges don't expire by default
    });
  }
}

/**
 * Calculate verification level based on completed verifications
 */
export function calculateVerificationLevel(verification) {
  let level = "none";
  const badges = verification.verification_badges.map(b => b.badge_type);

  // Basic: Email or phone verified
  if (badges.includes("email_verified") || badges.includes("phone_verified")) {
    level = "basic";
  }

  // Verified: Photo + ID verified
  if (badges.includes("photo_verified") && badges.includes("id_verified")) {
    level = "verified";
  }

  // Enhanced: All of above + social + video
  if (
    level === "verified" &&
    badges.includes("social_verified") &&
    badges.includes("video_verified")
  ) {
    level = "enhanced";
  }

  // Premium Verified: All + background check
  if (
    level === "enhanced" &&
    badges.includes("background_checked")
  ) {
    level = "premium_verified";
  }

  return level;
}

/**
 * Approve verification after review
 */
export async function approveVerification(email, reviewerEmail, confidenceScore = 85) {
  try {
    const verification = await VerificationRequest.findOne({
      user_email: email,
      status: { $in: ["pending", "in_progress"] },
    });

    if (!verification) {
      throw new Error("No verification request found");
    }

    // Calculate final verification level
    const finalLevel = calculateVerificationLevel(verification);

    // Update verification status
    verification.status = "approved";
    verification.reviewed_at = new Date();
    verification.verification_level = finalLevel;
    verification.admin_review = {
      reviewed_by: reviewerEmail,
      reviewed_at: new Date(),
      confidence_score: confidenceScore,
      notes: `Approved with ${finalLevel} level`,
    };

    // Set expiration (1 year from now)
    verification.expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Update user profile
    const profile = await UserProfile.findOne({ user_email: email });
    if (profile) {
      profile.is_verified = true;
      
      if (finalLevel === "premium_verified") {
        profile.is_personality_verified = true;
      }
      
      await profile.save();
    }

    // Add to history
    verification.verification_history.push({
      action: "verification_approved",
      timestamp: new Date(),
      details: `Approved with level: ${finalLevel}`,
      performed_by: reviewerEmail,
    });

    await verification.save();

    return {
      success: true,
      message: "Verification approved successfully",
      verification_level: finalLevel,
    };
  } catch (error) {
    console.error("Error approving verification:", error);
    throw error;
  }
}

/**
 * Reject verification
 */
export async function rejectVerification(email, reviewerEmail, reason) {
  try {
    const verification = await VerificationRequest.findOne({
      user_email: email,
      status: { $in: ["pending", "in_progress"] },
    });

    if (!verification) {
      throw new Error("No verification request found");
    }

    verification.status = "rejected";
    verification.reviewed_at = new Date();
    verification.rejection_reason = reason;
    verification.admin_review = {
      reviewed_by: reviewerEmail,
      reviewed_at: new Date(),
      notes: `Rejected: ${reason}`,
    };

    // Add to history
    verification.verification_history.push({
      action: "verification_rejected",
      timestamp: new Date(),
      details: reason,
      performed_by: reviewerEmail,
    });

    await verification.save();

    return {
      success: true,
      message: "Verification rejected",
    };
  } catch (error) {
    console.error("Error rejecting verification:", error);
    throw error;
  }
}

/**
 * Get verification status
 */
export async function getVerificationStatus(email) {
  try {
    const verification = await VerificationRequest.findOne({ user_email: email })
      .sort({ createdAt: -1 });

    if (!verification) {
      return {
        success: true,
        has_verification: false,
        status: "none",
      };
    }

    return {
      success: true,
      has_verification: true,
      status: verification.status,
      level: verification.verification_level,
      badges: verification.verification_badges,
      expires_at: verification.expires_at,
      rejection_reason: verification.rejection_reason,
    };
  } catch (error) {
    console.error("Error getting verification status:", error);
    throw error;
  }
}

import mongoose from "mongoose";

const verificationRequestSchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true },
    // Selfie verification
    selfie_url: { type: String },
    // Deep verification components
    verification_type: {
      type: String,
      enum: ["basic", "id_verification", "social_verification", "comprehensive", "background_check"],
      default: "basic",
    },
    // ID Document verification
    id_document: {
      front_url: String,
      back_url: String,
      document_type: { 
        type: String, 
        enum: ["passport", "drivers_license", "national_id", "residence_permit"] 
      },
      document_number: String,
      full_name: String,
      date_of_birth: Date,
      expiry_date: Date,
      issuing_country: String,
      verified_data: {
        name_match: Boolean,
        dob_match: Boolean,
        document_valid: Boolean,
        not_expired: Boolean,
      },
    },
    // Social media verification
    social_accounts: {
      facebook: { url: String, verified: Boolean, username: String },
      instagram: { url: String, verified: Boolean, username: String },
      twitter: { url: String, verified: Boolean, username: String },
      linkedin: { url: String, verified: Boolean, username: String },
    },
    // Phone verification
    phone_verification: {
      phone_number: String,
      country_code: String,
      verified: Boolean,
      verification_code: String,
      verified_at: Date,
    },
    // Email verification
    email_verification: {
      email: String,
      verified: Boolean,
      verification_token: String,
      verified_at: Date,
    },
    // Video verification
    video_verification: {
      video_url: String,
      duration_seconds: Number,
      verification_phrase: String, // User reads specific phrase
      facial_match_score: Number,
      liveness_check: Boolean,
    },
    // Background check (optional, premium feature)
    background_check: {
      criminal_records: { status: String, checked_at: Date, result: String },
      sex_offender_registry: { status: String, checked_at: Date, result: String },
      identity_confirmed: { status: String, checked_at: Date, result: String },
      professional_license: { status: String, checked_at: Date, license_number: String },
    },
    // AI-powered fraud detection
    fraud_detection: {
      risk_score: Number, // 0-100, lower is better
      risk_factors: [String],
      image_manipulation_detected: Boolean,
      multiple_accounts_detected: Boolean,
      suspicious_patterns: [String],
      device_fingerprint: String,
      ip_analysis: {
        ip_address: String,
        country: String,
        city: String,
        is_vpn: Boolean,
        is_proxy: Boolean,
      },
    },
    // Verification badges/levels
    verification_level: {
      type: String,
      enum: ["none", "basic", "verified", "enhanced", "premium_verified"],
      default: "none",
    },
    verification_badges: [{
      badge_type: { 
        type: String, 
        enum: ["photo_verified", "id_verified", "phone_verified", "email_verified", 
               "social_verified", "video_verified", "background_checked", "trusted_user"] 
      },
      awarded_at: Date,
      expires_at: Date,
    }],
    // Manual review
    admin_review: {
      reviewed_by: String,
      reviewed_at: Date,
      notes: String,
      confidence_score: Number, // Admin confidence in verification (0-100)
    },
    // Status tracking
    status: {
      type: String,
      enum: ["pending", "in_progress", "approved", "rejected", "expired", "flagged"],
      default: "pending",
    },
    reviewed_at: { type: Date },
    rejection_reason: { type: String },
    // Expiration and renewal
    expires_at: Date,
    renewed_at: Date,
    verification_history: [{
      action: String,
      timestamp: Date,
      details: String,
      performed_by: String,
    }],
  },
  { timestamps: true }
);

// Indexes for efficient queries
verificationRequestSchema.index({ user_email: 1 });
verificationRequestSchema.index({ status: 1 });
verificationRequestSchema.index({ verification_level: 1 });
verificationRequestSchema.index({ 'fraud_detection.risk_score': 1 });
verificationRequestSchema.index({ createdAt: -1 });

export default mongoose.model("VerificationRequest", verificationRequestSchema);

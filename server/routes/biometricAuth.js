import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";

const router = Router();

// In-memory store for challenges (use Redis in production)
const challenges = new Map();

// Helper to get RP ID
const getRpId = (req) => {
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  const hostname = req.hostname;
  // If it's an IP address, WebAuthn might have issues with rp.id, 
  // but for localhost it's fine.
  return hostname === "127.0.0.1" ? "localhost" : hostname;
};

// Generate WebAuthn challenge
const generateChallenge = () => {
  return crypto.randomBytes(32);
};

// POST /api/auth/biometric/register - Start registration process
router.post("/register", async (req, res) => {
  try {
    const { email, user_id } = req.body;

    if (!email || !user_id) {
      return res.status(400).json({ error: "Email and user ID required" });
    }

    // Verify user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate challenge
    const challenge = generateChallenge();
    const challengeId = crypto.randomBytes(16).toString("hex");
    
    // Store challenge with expiration (5 minutes)
    challenges.set(challengeId, {
      challenge: challenge.toString("hex"),
      email: email.toLowerCase(),
      userId: user_id,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // Create public key credential creation options
    const publicKey = {
      rp: {
        name: "AURAsync",
        id: getRpId(req),
      },
      user: {
        id: Buffer.from(user_id).toString("base64"),
        name: email.toLowerCase(),
        displayName: email.split("@")[0],
      },
      challenge: challenge.toString("base64"),
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      timeout: 60000,
      attestation: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Use platform authenticator (fingerprint/face)
        requireResidentKey: false,
        residentKey: "preferred",
        userVerification: "required",
      },
    };

    res.json({ 
      publicKey,
      challengeId 
    });
  } catch (error) {
    console.error("Biometric registration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/biometric/verify-registration - Verify registration
router.post("/verify-registration", async (req, res) => {
  try {
    const { credential_id, raw_id, type, attestation_object, client_data_json, email } = req.body;

    if (!credential_id || !raw_id || !client_data_json) {
      return res.status(400).json({ error: "Missing credential data" });
    }

    // Find and validate challenge
    const challengeEntry = Array.from(challenges.entries()).find(
      ([_, entry]) => entry.email === email.toLowerCase()
    );

    if (!challengeEntry) {
      return res.status(400).json({ error: "No registration challenge found" });
    }

    const [challengeId, challengeData] = challengeEntry;

    // Check expiration
    if (Date.now() > challengeData.expiresAt) {
      challenges.delete(challengeId);
      return res.status(400).json({ error: "Challenge expired" });
    }

    // Parse client data
    const clientData = JSON.parse(Buffer.from(client_data_json, "base64").toString());
    
    // Verify challenge matches
    const expectedChallenge = Buffer.from(challengeData.challenge, "hex").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    if (clientData.challenge !== expectedChallenge) {
      return res.status(400).json({ error: "Invalid challenge" });
    }

    // Verify type
    if (clientData.type !== "webauthn.create") {
      return res.status(400).json({ error: "Invalid operation type" });
    }

    // TODO: In a real implementation, you would:
    // 1. Verify attestation object
    // 2. Validate public key
    // 3. Store credential in database

    // For now, we'll mark the user as having biometric enabled
    await UserProfile.findOneAndUpdate(
      { user_email: email.toLowerCase() },
      { 
        $set: { 
          has_biometric: true,
          biometric_registered_at: new Date()
        } 
      },
      { upsert: false }
    );

    // Clean up challenge
    challenges.delete(challengeId);

    res.json({ 
      success: true, 
      message: "Biometric credential registered successfully" 
    });
  } catch (error) {
    console.error("Registration verification error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/biometric/authenticate - Start authentication
router.post("/authenticate", async (req, res) => {
  try {
    // Generate challenge
    const challenge = generateChallenge();
    const challengeId = crypto.randomBytes(16).toString("hex");
    
    // Store challenge
    challenges.set(challengeId, {
      challenge: challenge.toString("hex"),
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // Get all users with biometrics (in production, filter by context)
    const usersWithBiometrics = await UserProfile.find({ has_biometric: true });
    
    // Create allowCredentials list
    const allowCredentials = usersWithBiometrics.map((profile) => ({
      id: Buffer.from(profile.user_email).toString("base64"),
      type: "public-key",
      transports: ["internal"],
    }));

    const publicKey = {
      challenge: challenge.toString("base64"),
      timeout: 60000,
      userVerification: "required",
      allowCredentials,
      rpId: getRpId(req),
    };

    res.json({ 
      publicKey,
      challengeId 
    });
  } catch (error) {
    console.error("Authentication initiation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/biometric/verify-authentication - Verify authentication
router.post("/verify-authentication", async (req, res) => {
  try {
    const { credential_id, raw_id, user_handle, client_data_json, signature } = req.body;

    if (!credential_id || !raw_id || !client_data_json) {
      return res.status(400).json({ error: "Missing credential data" });
    }

    // Decode user handle to get email
    const email = user_handle ? Buffer.from(user_handle, "base64").toString() : null;
    
    if (!email) {
      return res.status(400).json({ error: "Could not identify user" });
    }

    // Find and validate challenge
    const challengeEntry = Array.from(challenges.entries()).find(
      ([_, entry]) => entry.email === email.toLowerCase()
    );

    if (!challengeEntry) {
      return res.status(400).json({ error: "No authentication challenge found" });
    }

    const [challengeId, challengeData] = challengeEntry;

    // Check expiration
    if (Date.now() > challengeData.expiresAt) {
      challenges.delete(challengeId);
      return res.status(400).json({ error: "Challenge expired" });
    }

    // Parse client data
    const clientData = JSON.parse(Buffer.from(client_data_json, "base64").toString());
    
    // Verify challenge matches
    const expectedChallenge = Buffer.from(challengeData.challenge, "hex").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    if (clientData.challenge !== expectedChallenge) {
      return res.status(400).json({ error: "Invalid challenge" });
    }

    // Verify type
    if (clientData.type !== "webauthn.get") {
      return res.status(400).json({ error: "Invalid operation type" });
    }

    // Verify user has biometric enabled
    const profile = await UserProfile.findOne({ user_email: email.toLowerCase() });
    if (!profile || !profile.has_biometric) {
      return res.status(403).json({ error: "Biometric authentication not enabled for this user" });
    }

    // TODO: In a real implementation, you would:
    // 1. Verify signature using stored public key
    // 2. Verify authenticator data
    // 3. Check counter for replay attacks

    // Generate JWT token
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Clean up challenge
    challenges.delete(challengeId);

    res.json({ 
      success: true,
      token,
      email: user.email 
    });
  } catch (error) {
    console.error("Authentication verification error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/biometric/check/:email - Check if user has biometric enabled
router.get("/check/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    const profile = await UserProfile.findOne({ user_email: email.toLowerCase() });
    
    res.json({ 
      has_biometric: !!(profile && profile.has_biometric),
      registered_at: profile?.biometric_registered_at || null
    });
  } catch (error) {
    console.error("Check biometric error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

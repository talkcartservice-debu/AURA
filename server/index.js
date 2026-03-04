import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";

import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profiles.js";
import matchRoutes from "./routes/matches.js";
import messageRoutes from "./routes/messages.js";
import groupRoutes from "./routes/groups.js";
import eventRoutes from "./routes/events.js";
import likeRoutes from "./routes/likes.js";
import verificationRoutes from "./routes/verification.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import uploadRoutes from "./routes/upload.js";
import blindDateRoutes from "./routes/blindDates.js";
import privacyRoutes from "./routes/privacy.js";
import dateEventRoutes from "./routes/dateEvents.js";
import callRoutes from "./routes/calls.js";
import biometricAuthRoutes from "./routes/biometricAuth.js";
import locationRoutes from "./routes/location.js";
import deepVerificationRoutes from "./routes/deepVerification.js";
import relationshipCoachRoutes from "./routes/relationshipCoach.js";
import { initializeSocketIO } from "./signaling.js";

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocketIO(httpServer);

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/biometric", biometricAuthRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/deep-verification", deepVerificationRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/blind-dates", blindDateRoutes);
app.use("/api/privacy", privacyRoutes);
app.use("/api/date-events", dateEventRoutes);
app.use("/api/coach", relationshipCoachRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/location", locationRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

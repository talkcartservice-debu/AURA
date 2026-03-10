import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import SystemSetting from "../models/SystemSetting.js";
import auth from "../middleware/auth.js";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const registrationSetting = await SystemSetting.findOne({ key: 'allow_registration' });
    if (registrationSetting && registrationSetting.value === false) {
      return res.status(403).json({ error: "Registration is currently disabled by the administrator." });
    }

    const { email, password, username, display_name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      password: hashed,
      username: normalizedUsername,
    });

    // Create initial profile with optional display name
    await UserProfile.create({
      user_email: user.email,
      display_name: display_name || username,
    });

    const token = jwt.sign(
      { email: user.email, id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      token,
      email: user.email,
      id: user._id,
      username: user.username,
      display_name: display_name || username,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    // Special handling for super admin email
    if (user.email === "nshayn00@gmail.com" && user.role !== "super_admin") {
      user.role = "super_admin";
    }

    user.last_login = new Date();
    await user.save();

    const token = jwt.sign(
      { email: user.email, id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token,
      email: user.email,
      id: user._id,
      username: user.username,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the latest user data to include username and role
    const user = await User.findOne({ email: decoded.email }).select("email _id username role");
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    res.json({
      email: user.email,
      id: user._id,
      username: user.username,
      role: user.role,
    });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.put("/update-password", async (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { currentPassword, newPassword } = req.body;

    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: "Incorrect current password" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/push-subscription", auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Subscription required" });
    }

    // Upsert subscription (if endpoint exists, replace; if not, add)
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { push_subscriptions: { endpoint: subscription.endpoint } }
    });
    
    await User.findByIdAndUpdate(req.user.id, {
      $push: { push_subscriptions: subscription },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

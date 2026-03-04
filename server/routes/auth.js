import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email: email.toLowerCase(), password: hashed });

    // Create empty profile
    await UserProfile.create({ user_email: user.email });

    const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, email: user.email });
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
    res.json({ email: decoded.email });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;

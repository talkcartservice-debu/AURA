import express from 'express';
import User from '../models/User.js';
import UserProfile from '../models/UserProfile.js';
import Message from '../models/Message.js';
import Match from '../models/Match.js';
import Report from '../models/Report.js';
import Subscription from '../models/Subscription.js';
import Transaction from '../models/Transaction.js';
import Event from '../models/Event.js';
import VerificationRequest from '../models/VerificationRequest.js';
import SystemSetting from '../models/SystemSetting.js';
import AdminLog from '../models/AdminLog.js';
import adminAuth from '../middleware/adminAuth.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import axios from 'axios';

const router = express.Router();
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Helper for logging admin actions
const logAdminAction = async (admin, action, targetId, targetType, details) => {
  try {
    await AdminLog.create({
      adminId: admin._id,
      adminEmail: admin.email,
      action,
      targetId,
      targetType,
      details
    });
  } catch (err) {
    console.error("Failed to log admin action", err);
  }
};

const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const checkRateLimit = (ip) => {
  const now = Date.now();
  const attempts = (loginAttempts.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW);
  if (attempts.length >= MAX_ATTEMPTS) return false;
  attempts.push(now);
  loginAttempts.set(ip, attempts);
  return true;
};

// Admin Login
router.post('/login', async (req, res) => {
  try {
    if (!checkRateLimit(req.ip)) {
      return res.status(429).json({ error: "Too many attempts. Please try again in 15 minutes." });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    // Special handling for super admin email
    if (user.email === "nshayn00@gmail.com" && user.role !== "super_admin") {
      user.role = "super_admin";
      await user.save();
    }

    if (!["super_admin", "admin", "moderator", "support"].includes(user.role)) {
      return res.status(403).json({ error: "Access denied: Not an administrator" });
    }

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

// Protected admin stats
router.get('/stats', adminAuth(['super_admin', 'admin', 'support']), async (req, res) => {
  try {
    const [totalUsers, activeUsers, premiumUsers, casualUsers, totalMessages, totalMatches] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ last_login: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Subscription.countDocuments({ plan: 'premium', is_active: true }),
      Subscription.countDocuments({ casual_addon: true, is_active: true }),
      Message.countDocuments(),
      Match.countDocuments()
    ]);

    res.json({
      totalUsers,
      activeUsers,
      premiumUsers,
      casualUsers,
      totalMessages,
      totalMatches,
      revenue: 0 
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

// User Management
router.get('/users', adminAuth(['super_admin', 'admin']), async (req, res) => {
  try {
    const [users, profiles, reports] = await Promise.all([
      User.find().select('-password').lean(),
      UserProfile.find().lean(),
      Report.find().lean()
    ]);
    
    const combined = users.map(user => {
      const profile = profiles.find(p => p.user_email === user.email) || {};
      
      const userReports = reports.filter(r => r.reported_email === user.email);
      let riskScore = userReports.length * 20;
      if (user.status === 'suspended') riskScore += 30;
      if (user.status === 'banned') riskScore = 100;
      riskScore = Math.min(riskScore, 100);

      return {
        ...user,
        risk_score: riskScore,
        profile
      };
    });

    res.json(combined);
  } catch (err) {
    console.error("Admin users fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/role', adminAuth(['super_admin']), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    
    await logAdminAction(req.user, 'update_role', user._id, 'User', { newRole: role });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/status', adminAuth(['super_admin']), async (req, res) => {
  try {
    const { status } = req.body; // e.g., 'active', 'suspended', 'banned'
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    await logAdminAction(req.user, 'update_status', user._id, 'User', { newStatus: status });
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/warn', adminAuth(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    
    // In a real app, send email or push notification here
    await logAdminAction(req.user, 'warn_user', user._id, 'User', { reason });
    
    res.json({ message: 'Warning sent to user' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/force-verification', adminAuth(['super_admin', 'admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    await UserProfile.findOneAndUpdate(
      { user_email: user.email },
      { is_verified: false }
    );
    
    await logAdminAction(req.user, 'force_verification', user._id, 'User', {});
    
    res.json({ message: 'User forced to re-verify' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/grant-premium', adminAuth(['super_admin', 'support']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    await Subscription.findOneAndUpdate(
      { user_email: user.email },
      { 
        plan: 'premium', 
        is_active: true, 
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      },
      { upsert: true }
    );
    
    await logAdminAction(req.user, 'grant_premium', user._id, 'User', { duration: '30 days' });
    
    res.json({ message: 'Premium granted for 30 days' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Logs
router.get('/logs', adminAuth(['super_admin']), async (req, res) => {
  try {
    const logs = await AdminLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Moderation - Reports
router.get('/reports', adminAuth(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/reports/:id', adminAuth(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    await logAdminAction(req.user, 'resolve_report', report._id, 'Report', { newStatus: status });
    
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Moderation - Verifications
router.get('/verifications', adminAuth(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const verifications = await VerificationRequest.find().sort({ createdAt: -1 });
    res.json(verifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/verifications/:id', adminAuth(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const { status, reason } = req.body;
    const verification = await VerificationRequest.findByIdAndUpdate(
      req.params.id, 
      { status, rejection_reason: reason, reviewed_at: new Date() }, 
      { new: true }
    );
    
    if (status === 'approved') {
      await UserProfile.findOneAndUpdate(
        { user_email: verification.user_email },
        { is_verified: true }
      );
    }
    
    await logAdminAction(req.user, 'resolve_verification', verification._id, 'VerificationRequest', { newStatus: status });
    
    res.json(verification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/revenue', adminAuth(['super_admin', 'admin']), async (req, res) => {
  try {
    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const subs = await Subscription.find();
    const premiumCount = subs.filter(s => s.plan === 'premium').length;
    const casualCount = subs.filter(s => s.casual_addon).length;

    // Monthly trend
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        monthNum: d.getMonth()
      });
    }

    const revenueTrend = await Promise.all(months.map(async m => {
      const start = new Date(m.year, m.monthNum, 1);
      const end = new Date(m.year, m.monthNum + 1, 0);
      const rev = await Transaction.aggregate([
        { $match: { status: 'success', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      return { month: m.month, revenue: rev[0]?.total || 0 };
    }));

    const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(50);

    res.json({
      total: totalRevenue[0]?.total || 0,
      premiumCount,
      casualCount,
      revenueTrend,
      transactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transactions/:id/refund', adminAuth(['super_admin']), async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    
    // Call Paystack Refund API here...
    tx.status = 'refunded';
    tx.refund_details = {
      amount: amount || tx.amount,
      reason: reason || "Admin refund",
      refunded_at: new Date(),
      refund_reference: `REF-${tx.reference}`
    };
    await tx.save();
    
    await logAdminAction(req.user, 'refund_transaction', tx._id, 'Transaction', { amount, reason });
    
    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/extend-premium', adminAuth(['super_admin', 'support']), async (req, res) => {
  try {
    const { days } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const sub = await Subscription.findOne({ user_email: user.email });
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });

    const currentExpiry = sub.expires_at > new Date() ? sub.expires_at : new Date();
    sub.expires_at = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);
    sub.is_active = true;
    await sub.save();

    await logAdminAction(req.user, 'extend_premium', user._id, 'User', { days });

    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Events Management
router.get('/events', adminAuth(['super_admin', 'admin']), async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/events', adminAuth(['super_admin', 'admin']), async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      creator_email: req.user.email
    });
    await logAdminAction(req.user, 'create_event', event._id, 'Event', { title: event.title });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/events/:id', adminAuth(['super_admin', 'admin']), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAdminAction(req.user, 'update_event', event._id, 'Event', { title: event.title });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/events/:id', adminAuth(['super_admin', 'admin']), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user, 'delete_event', event?._id, 'Event', { title: event?.title });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revenue Dashboard - Transactions
router.get('/transactions', adminAuth(['super_admin', 'support']), async (req, res) => {
  try {
    const response = await axios.get('https://api.paystack.co/transaction', {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`
      }
    });
    res.json(response.data.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transactions/:id/refund', adminAuth(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.post('https://api.paystack.co/refund', 
      { transaction: id },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json"
        }
      }
    );
    await logAdminAction(req.user, 'refund_transaction', id, 'Transaction', { refundId: response.data.data.id });
    res.json(response.data.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.message || err.message });
  }
});

// Events Management - Metrics
router.get('/events/:id/metrics', adminAuth(['super_admin', 'admin']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    // Calculate engagement: matches created by attendees within 24h of event
    const eventStart = new Date(event.event_date);
    const eventEnd = new Date(eventStart.getTime() + 24 * 60 * 60 * 1000);
    
    const matchesCount = await Match.countDocuments({
      createdAt: { $gte: eventStart, $lte: eventEnd },
      $or: [
        { user1_email: { $in: event.rsvp_emails } },
        { user2_email: { $in: event.rsvp_emails } }
      ]
    });

    res.json({
      attendees: event.rsvp_emails.length,
      capacity: event.capacity,
      engagement: event.upvote_count || 0,
      matchesCreated: matchesCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Settings
router.get('/settings', adminAuth(['super_admin', 'admin']), async (req, res) => {
  try {
    const settings = await SystemSetting.find();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/settings/:key', adminAuth(['super_admin']), async (req, res) => {
  try {
    const { value } = req.body;
    const setting = await SystemSetting.findOneAndUpdate(
      { key: req.params.key },
      { value, updatedBy: req.user._id },
      { new: true, upsert: true }
    );
    
    await logAdminAction(req.user, 'update_setting', setting._id, 'SystemSetting', { key: setting.key, value });
    
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

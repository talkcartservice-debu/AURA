import { Router } from "express";
import auth from "../middleware/auth.js";
import Group from "../models/Group.js";
import UserProfile from "../models/UserProfile.js";
import GroupMessage from "../models/GroupMessage.js";
import { emitToUsers } from "../signaling.js";

const router = Router();

router.get("/", auth, async (req, res) => {
  try {
    const groups = await Group.find({ is_public: true }).sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Group Messaging - Moved UP to avoid potential shadowing
router.get("/:id/messages", auth, async (req, res) => {
  try {
    console.log(`GET /groups/${req.params.id}/messages - User: ${req.user.email}`);
    
    // Explicitly check for valid ObjectId to avoid crashes
    if (req.params.id.length !== 24) {
       return res.status(400).json({ error: "Invalid Group ID format" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      console.warn(`Group not found: ${req.params.id}`);
      return res.status(404).json({ error: `Group ${req.params.id} not found in this database. It may have been deleted.` });
    }
    
    // Check if user is a member
    if (!group.member_emails.includes(req.user.email)) {
      console.warn(`User ${req.user.email} is not a member of group ${req.params.id}`);
      return res.status(403).json({ error: "Must be a member to see messages" });
    }

    const messages = await GroupMessage.find({ group_id: req.params.id, deleted: false })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    console.error(`Error in GET /groups/${req.params.id}/messages:`, err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/messages", auth, async (req, res) => {
  try {
    console.log(`POST /groups/${req.params.id}/messages - User: ${req.user.email}`);
    const { content, image_url, reply_to } = req.body;
    
    if (!content && !image_url) {
      return res.status(400).json({ error: "Content or image_url is required" });
    }

    if (req.params.id.length !== 24) {
       return res.status(400).json({ error: "Invalid Group ID format" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      console.warn(`Group not found: ${req.params.id}`);
      return res.status(404).json({ error: `Group ${req.params.id} not found in this database.` });
    }

    if (!group.member_emails.includes(req.user.email)) {
      console.warn(`User ${req.user.email} is not a member of group ${req.params.id}`);
      return res.status(403).json({ error: "Must be a member to post messages" });
    }

    const message = await GroupMessage.create({
      group_id: group._id,
      sender_email: req.user.email,
      content,
      image_url,
      reply_to: reply_to || null,
    });

    // Notify all members except sender
    try {
      const otherMembers = group.member_emails.filter(e => e !== req.user.email);
      emitToUsers(otherMembers, "group_message_received", {
        group_id: group._id.toString(),
        message,
      });
    } catch (notifyErr) {
      console.error("Group message signaling error:", notifyErr);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error(`Error in POST /groups/${req.params.id}/messages:`, err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/messages/:messageId", auth, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await GroupMessage.findOne({ _id: req.params.messageId, group_id: req.params.id });
    
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.sender_email !== req.user.email) {
      return res.status(403).json({ error: "Can only edit your own messages" });
    }

    message.content = content;
    message.edited = true;
    await message.save();

    // Notify all members
    const group = await Group.findById(req.params.id);
    if (group) {
      const otherMembers = group.member_emails.filter(e => e !== req.user.email);
      emitToUsers(otherMembers, "group_message_edited", {
        group_id: group._id.toString(),
        message_id: message._id.toString(),
        content
      });
    }

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id/messages/:messageId", auth, async (req, res) => {
  try {
    const message = await GroupMessage.findOne({ _id: req.params.messageId, group_id: req.params.id });
    
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.sender_email !== req.user.email) {
      return res.status(403).json({ error: "Can only delete your own messages" });
    }

    message.deleted = true;
    await message.save();

    // Notify all members
    const group = await Group.findById(req.params.id);
    if (group) {
      const otherMembers = group.member_emails.filter(e => e !== req.user.email);
      emitToUsers(otherMembers, "group_message_deleted", {
        group_id: group._id.toString(),
        message_id: message._id.toString()
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const group = await Group.create({
      ...req.body,
      creator_email: req.user.email,
      member_emails: [req.user.email],
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/members", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (!group.member_emails.includes(req.user.email)) {
      return res.status(403).json({ error: "Must be a member to see member list" });
    }

    const profiles = await UserProfile.find({
      user_email: { $in: group.member_emails }
    }).select("display_name photos user_email age bio location");

    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/join", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    
    // Check if user is already a member
    if (group.member_emails.includes(req.user.email)) {
      return res.status(400).json({ error: "You are already a member of this group" });
    }

    // Check if group is full
    if (group.max_members && group.member_emails.length >= group.max_members) {
      return res.status(400).json({ error: "Group is full" });
    }

    // Add to pending if not already there
    if (!group.pending_member_emails.includes(req.user.email)) {
      group.pending_member_emails.push(req.user.email);
      await group.save();
    }
    
    res.json({ message: "Join request sent to group creator", group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve join request
router.post("/:id/requests/approve", auth, async (req, res) => {
  try {
    const { user_email } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Only creator can approve
    if (group.creator_email !== req.user.email) {
      return res.status(403).json({ error: "Only group creator can approve requests" });
    }

    if (!group.pending_member_emails.includes(user_email)) {
      return res.status(400).json({ error: "User has no pending request" });
    }

    // Check capacity again
    if (group.max_members && group.member_emails.length >= group.max_members) {
      return res.status(400).json({ error: "Group is full" });
    }

    // Move from pending to member
    group.pending_member_emails = group.pending_member_emails.filter(e => e !== user_email);
    if (!group.member_emails.includes(user_email)) {
      group.member_emails.push(user_email);
    }
    await group.save();

    res.json({ message: "Request approved", group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject join request
router.post("/:id/requests/reject", auth, async (req, res) => {
  try {
    const { user_email } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Only creator can reject
    if (group.creator_email !== req.user.email) {
      return res.status(403).json({ error: "Only group creator can reject requests" });
    }

    // Remove from pending
    group.pending_member_emails = group.pending_member_emails.filter(e => e !== user_email);
    await group.save();

    res.json({ message: "Request rejected", group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/leave", auth, async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { $pull: { member_emails: req.user.email } },
      { new: true }
    );
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Group (Creator only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    // Only creator can delete
    if (group.creator_email !== req.user.email) {
      return res.status(403).json({ error: "Only the group creator can delete this group" });
    }

    // Clean up: delete group messages
    await GroupMessage.deleteMany({ group_id: req.params.id });
    
    // Optionally delete the group itself
    await Group.findByIdAndDelete(req.params.id);

    res.json({ message: "Group and its messages deleted successfully" });
  } catch (err) {
    console.error("Delete group error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Edit Group (Creator only)
router.put("/:id", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (group.creator_email !== req.user.email) {
      return res.status(403).json({ error: "Only the group creator can edit this group" });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedGroup);
  } catch (err) {
    console.error("Edit group error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

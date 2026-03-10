import { Router } from "express";
import auth from "../middleware/auth.js";
import Event from "../models/Event.js";
import UserProfile from "../models/UserProfile.js";
import EventMessage from "../models/EventMessage.js";
import { emitToUsers } from "../signaling.js";

const router = Router();

router.get("/", auth, async (req, res) => {
  try {
    const filter = req.query.group_id ? { group_id: req.query.group_id } : {};
    const events = await Event.find(filter).sort({ event_date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      creator_email: req.user.email,
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/rsvp", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const isCreator = event.creator_email === req.user.email;
    if (isCreator) return res.status(400).json({ error: "Creator is already attending" });

    const idx = event.rsvp_emails.indexOf(req.user.email);
    const pendingIdx = event.pending_rsvp_emails.indexOf(req.user.email);

    if (idx > -1) {
      // Already an attendee, "leave" the event
      event.rsvp_emails.splice(idx, 1);
    } else if (pendingIdx > -1) {
      // Cancel pending request
      event.pending_rsvp_emails.splice(pendingIdx, 1);
    } else {
      // New RSVP
      if (event.capacity && event.rsvp_emails.length >= event.capacity) {
        return res.status(400).json({ error: "Event is full" });
      }

      // If it's a private event, it needs approval. If public, join immediately.
      // (Using is_public field as a toggle for approval requirement)
      if (event.is_public === false) {
        event.pending_rsvp_emails.push(req.user.email);
        
        // Notify creator
        try {
          emitToUsers([event.creator_email], "event_join_request", {
            event_id: event._id.toString(),
            event_title: event.title,
            user_email: req.user.email
          });
        } catch {}
      } else {
        event.rsvp_emails.push(req.user.email);
      }
    }
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/requests/approve", auth, async (req, res) => {
  try {
    const { user_email } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.creator_email !== req.user.email) {
      return res.status(403).json({ error: "Only creator can approve requests" });
    }

    const pendingIdx = event.pending_rsvp_emails.indexOf(user_email);
    if (pendingIdx === -1) return res.status(400).json({ error: "Request not found" });

    if (event.capacity && event.rsvp_emails.length >= event.capacity) {
      return res.status(400).json({ error: "Event is full" });
    }

    event.pending_rsvp_emails.splice(pendingIdx, 1);
    event.rsvp_emails.push(user_email);
    await event.save();

    // Notify user
    try {
      emitToUsers([user_email], "event_request_approved", {
        event_id: event._id.toString(),
        event_title: event.title
      });
    } catch {}

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/requests/reject", auth, async (req, res) => {
  try {
    const { user_email } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.creator_email !== req.user.email) {
      return res.status(403).json({ error: "Only creator can reject requests" });
    }

    const pendingIdx = event.pending_rsvp_emails.indexOf(user_email);
    if (pendingIdx === -1) return res.status(400).json({ error: "Request not found" });

    event.pending_rsvp_emails.splice(pendingIdx, 1);
    await event.save();

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/attendees", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const profiles = await UserProfile.find({
      user_email: { $in: event.rsvp_emails }
    }).select("display_name photos user_email age bio location");

    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Event Messaging
router.get("/:id/messages", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    
    // Check if user has RSVP'd (unless they are the creator)
    const isCreator = event.creator_email === req.user.email;
    const isAttendee = event.rsvp_emails.includes(req.user.email);
    
    if (!isCreator && !isAttendee) {
      return res.status(403).json({ error: "Must RSVP to see event chat" });
    }

    const messages = await EventMessage.find({ event_id: req.params.id, deleted: false })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/messages", auth, async (req, res) => {
  try {
    const { content, image_url, reply_to } = req.body;
    
    if (!content && !image_url) {
      return res.status(400).json({ error: "Content or image_url is required" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const isCreator = event.creator_email === req.user.email;
    const isAttendee = event.rsvp_emails.includes(req.user.email);

    if (!isCreator && !isAttendee) {
      return res.status(403).json({ error: "Must RSVP to post messages" });
    }

    const message = await EventMessage.create({
      event_id: event._id,
      sender_email: req.user.email,
      content,
      image_url,
      reply_to: reply_to || null,
    });

    // Notify all attendees + creator except sender
    try {
      const recipients = [...new Set([...event.rsvp_emails, event.creator_email])].filter(e => e !== req.user.email);
      emitToUsers(recipients, "event_message_received", {
        event_id: event._id.toString(),
        message,
      });
    } catch (notifyErr) {
      console.error("Event message signaling error:", notifyErr);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/messages/:messageId", auth, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await EventMessage.findOne({ _id: req.params.messageId, event_id: req.params.id });
    
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.sender_email !== req.user.email) {
      return res.status(403).json({ error: "Can only edit your own messages" });
    }

    message.content = content;
    message.edited = true;
    await message.save();

    // Notify all attendees + creator except sender
    const event = await Event.findById(req.params.id);
    if (event) {
      const recipients = [...new Set([...event.rsvp_emails, event.creator_email])].filter(e => e !== req.user.email);
      emitToUsers(recipients, "event_message_edited", {
        event_id: event._id.toString(),
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
    console.log(`Attempting to delete message ${req.params.messageId} from event ${req.params.id}`);
    const message = await EventMessage.findOne({ _id: req.params.messageId, event_id: req.params.id });
    
    if (!message) {
      console.warn(`Message ${req.params.messageId} not found for event ${req.params.id}`);
      return res.status(404).json({ error: "Message not found" });
    }
    if (message.sender_email !== req.user.email) {
      return res.status(403).json({ error: "Can only delete your own messages" });
    }

    message.deleted = true;
    await message.save();

    // Notify all attendees + creator except sender
    const event = await Event.findById(req.params.id);
    if (event) {
      const recipients = [...new Set([...event.rsvp_emails, event.creator_email])].filter(e => e !== req.user.email);
      emitToUsers(recipients, "event_message_deleted", {
        event_id: event._id.toString(),
        message_id: message._id.toString()
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete event message error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

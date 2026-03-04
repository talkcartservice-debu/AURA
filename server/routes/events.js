import { Router } from "express";
import auth from "../middleware/auth.js";
import Event from "../models/Event.js";

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

    const idx = event.rsvp_emails.indexOf(req.user.email);
    if (idx > -1) {
      event.rsvp_emails.splice(idx, 1);
    } else {
      if (event.capacity && event.rsvp_emails.length >= event.capacity) {
        return res.status(400).json({ error: "Event is full" });
      }
      event.rsvp_emails.push(req.user.email);
    }
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

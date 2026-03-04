import { Router } from "express";
import auth from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";

const router = Router();

// Upload a single image
router.post("/", auth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ url: req.file.path });
});

// Upload multiple images (up to 6)
router.post("/multiple", auth, upload.array("files", 6), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: "No files uploaded" });
  const urls = req.files.map((f) => f.path);
  res.json({ urls });
});

export default router;

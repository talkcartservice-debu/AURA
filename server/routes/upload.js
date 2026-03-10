import { Router } from "express";
import auth from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";

const router = Router();

// Upload a single file (image or video)
router.post("/", auth, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Multer/Cloudinary Upload Error:", err);
      return res.status(500).json({ 
        error: "Failed to upload file to Cloudinary.", 
        details: err.message,
        code: err.code,
        suggestion: "Ensure your file is not too large and is a supported format. Check Cloudinary credentials in .env."
      });
    }
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: req.file.path });
  });
});

// Upload multiple images (up to 6)
router.post("/multiple", auth, (req, res, next) => {
  upload.array("files", 6)(req, res, (err) => {
    if (err) {
      console.error("Multer/Cloudinary Multiple Upload Error:", err);
      return res.status(500).json({ 
        error: "Failed to upload images to Cloudinary", 
        details: err.message,
        suggestion: "Please check your Cloudinary configuration in the .env file."
      });
    }
    if (!req.files?.length) return res.status(400).json({ error: "No files uploaded" });
    const urls = req.files.map((f) => f.path);
    res.json({ urls });
  });
});

export default router;

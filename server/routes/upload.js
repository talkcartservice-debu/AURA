import { Router } from "express";
import auth from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";

const router = Router();

// Upload a single image
router.post("/", auth, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Multer/Cloudinary Upload Error:", err);
      const isCloudinaryError = !process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME.includes('your_');
      return res.status(500).json({ 
        error: isCloudinaryError ? "Cloudinary is not configured. Please set your credentials in .env" : "Failed to upload image. Please check your internet connection.", 
        details: err.message,
        suggestion: isCloudinaryError ? "Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your server/.env file." : "Try a smaller file or different image format."
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

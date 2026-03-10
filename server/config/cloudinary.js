import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
  console.warn("⚠️  Cloudinary Cloud Name is not configured in .env");
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: "aura",
      resource_type: isVideo ? "video" : "image",
      transformation: isVideo ? [] : [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
      format: isVideo ? "webm" : undefined, // Force webm for recordings if needed, or keep original
    };
  },
});

export const upload = multer({ storage });
export default cloudinary;

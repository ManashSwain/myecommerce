import multer from "multer";

// Keep uploaded files in memory as buffers so they can be streamed
// directly to Cloudinary without writing to disk
const storage = multer.memoryStorage();

export const upload = multer({ storage: storage });

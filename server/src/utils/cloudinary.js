import { v2 as cloudinary } from "cloudinary";

// Config is applied lazily (at request time) because ES module imports are
// evaluated before dotenv.config() runs in index.js
const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

// Streams an in-memory buffer straight to Cloudinary (no disk writes)
export const uploadToCloudinary = (buffer, folder = "ecommerce") => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

export default cloudinary;

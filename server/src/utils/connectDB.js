import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Database");

    // connection event
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected");
    });

    // Error event
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB error:", err);
    });

    // Disconnected event
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};



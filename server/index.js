import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import { connectDb } from "./src/utils/connectDB.js";

// DNS SETUP
import dns from 'dns'
dns.setServers(["1.1.1.1","8.8.8.8"])

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Hello world!");
});

// Database CALL 
connectDb();

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});

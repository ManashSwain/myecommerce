import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { connectDb } from "./src/utils/connectDB.js";


// Route imports
import categoryrouter from "./src/Routes/category.route.js";
import userrouter from "./src/Routes/user.route.js";
import subcategoryrouter from "./src/Routes/subcategory.route.js"

// DNS SETUP
import dns from "dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const PORT = 3000;

// Middlewares
// Route Middlewares
app.use("/api", userrouter);
// Express middlewares
app.use(express.json());
// Route Middlewares
// categories middleware 
app.use("/api/categories", categoryrouter);
// subcategories middleware 
app.use("/api/subcategories",subcategoryrouter)

app.get("/", (req, res) => {
  res.json({ message: "Hello world!" });
});

// Database CALL
connectDb();

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});

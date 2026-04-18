import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { connectDb } from "./src/utils/connectDB.js";

// Multer import 
import { upload } from "./src/utils/multer.js";

// Route imports
import categoryrouter from "./src/Routes/category.route.js";
import userrouter from "./src/Routes/user.route.js";
import subcategoryrouter from "./src/Routes/subcategory.route.js"
import productrouter from "./src/Routes/product.route.js"
import reviewrouter from "./src/Routes/review.route.js"
import addressrouter from "./src/Routes/address.route.js"

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
// product middleware
app.use("/api/products", productrouter)
// review middleware
app.use("/api/reviews",reviewrouter)
//address middleware
app.use("/api/address",addressrouter)

// Test multer route 
app.post("/photos/upload", upload.array('photos'), (req,res,next)=>{
   console.log(req.files, req.body)
   res.json({
    messsage : "Uploaded",
    files:req.files
   })
})
app.get("/", (req, res) => {
  res.json({ message: "Hello world!" });
});

// Database CALL
connectDb();

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});

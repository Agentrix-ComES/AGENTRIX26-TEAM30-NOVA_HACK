const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Use environment variable for MongoDB connection. For development,
// fallback to a local MongoDB instance if `MONGO_URI` is not provided.
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/govai";

mongoose.connect(MONGO_URI, {
  // these options are safe defaults for mongoose v6+
})
  .then(() => {
    console.log("MongoDB Connected ->", MONGO_URI.includes("127.0.0.1") ? "local" : "remote");
  })
  .catch(err => {
    console.error("MongoDB connection error:", err.message || err);
    console.error("Ensure MONGO_URI is set or MongoDB is running locally.");
  });

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});
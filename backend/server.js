const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(
"mongodb+srv://admin1:1234@cluster0.cknkjbf.mongodb.net/?appName=Cluster0"
)
.then(() => {
  console.log("MongoDB Connected");
})
.catch(err => {
  console.log(err);
});

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

app.listen(5000, () => {
  console.log("Server Running");
});
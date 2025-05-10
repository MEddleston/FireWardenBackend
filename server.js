const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const fireWardenRoutes = require("./routes/fireWardenRoutes");

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/api", authRoutes);
app.use("/api", fireWardenRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));


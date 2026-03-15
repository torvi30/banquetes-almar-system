require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const quoteRoutes = require("./routes/quotes.routes");
const galleryRoutes = require("./routes/gallery.routes");
const servicesRoutes = require("./routes/services.routes");
const app = express();

app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Backend Banquetes Almar funcionando 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/services", servicesRoutes);
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
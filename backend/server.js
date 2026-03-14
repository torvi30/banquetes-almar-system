require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const quoteRoutes = require("./routes/quotes.routes");

const app = express();

app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET", "POST", "DELETE"]
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend Banquetes Almar funcionando 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/quotes", quoteRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
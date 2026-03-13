const express = require("express");
const db = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM cotizaciones ORDER BY id DESC"
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error al obtener cotizaciones"
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nombre, telefono, evento, personas, mensaje } = req.body;

    await db.query(
      "INSERT INTO cotizaciones (nombre, telefono, evento, personas, mensaje) VALUES (?, ?, ?, ?, ?)",
      [nombre, telefono, evento, personas, mensaje]
    );

    res.json({
      message: "Cotización guardada"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error al guardar cotización"
    });
  }
});

module.exports = router;
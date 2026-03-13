const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

/**
 * Crear cotización pública
 */
router.post("/", async (req, res) => {
  try {
    const { nombre, telefono, evento, personas, mensaje } = req.body;

    if (!nombre || !telefono || !evento || !personas || !mensaje) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    const [result] = await pool.query(
      `INSERT INTO cotizaciones (nombre, telefono, evento, personas, mensaje)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, telefono, evento, personas, mensaje]
    );

    return res.status(201).json({
      message: "Cotización guardada correctamente.",
      id: result.insertId
    });
  } catch (error) {
    console.error("Error creando cotización:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

/**
 * Ver cotizaciones solo admin
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM cotizaciones ORDER BY created_at DESC"
    );

    return res.json(rows);
  } catch (error) {
    console.error("Error obteniendo cotizaciones:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

module.exports = router;
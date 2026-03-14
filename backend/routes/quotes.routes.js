const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM cotizaciones ORDER BY id DESC"
    );

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET QUOTES:", error);
    res.status(500).json({
      message: "Error al obtener cotizaciones"
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nombre, telefono, evento, personas, mensaje } = req.body;

    if (!nombre || !telefono || !evento || !personas) {
      return res.status(400).json({
        message: "Nombre, teléfono, evento y personas son obligatorios"
      });
    }

    if (Number(personas) <= 0) {
      return res.status(400).json({
        message: "La cantidad de personas debe ser mayor a 0"
      });
    }

    await db.query(
      `INSERT INTO cotizaciones (nombre, telefono, evento, personas, mensaje)
       VALUES (?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        telefono.trim(),
        evento.trim(),
        Number(personas),
        mensaje ? mensaje.trim() : ""
      ]
    );

    res.json({
      message: "Cotización guardada"
    });
  } catch (error) {
    console.log("ERROR POST QUOTE:", error);
    res.status(500).json({
      message: "Error al guardar cotización"
    });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "DELETE FROM cotizaciones WHERE id = ?",
      [id]
    );

    res.json({
      message: "Cotización eliminada"
    });
  } catch (error) {
    console.log("ERROR DELETE QUOTE:", error);
    res.status(500).json({
      message: "Error al eliminar cotización"
    });
  }
});

module.exports = router;
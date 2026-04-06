const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// 🔥 DASHBOARD (cotizaciones + reservas)
router.get("/", verifyToken, async (req, res) => {
  try {
    const [quotes] = await db.query(`
      SELECT 
        id,
        nombre,
        telefono,
        evento AS tipo_evento,
        personas,
        mensaje,
        estado,
        id AS created_at,
        'cotizacion' AS origen
      FROM cotizaciones
    `);

    const [reservas] = await db.query(`
      SELECT 
        id,
        cliente AS nombre,
        telefono,
        tipo_evento,
        personas,
        observaciones AS mensaje,
        estado,
        fecha_evento AS created_at,
        'reserva' AS origen
      FROM reservas
    `);

    const data = [...quotes, ...reservas].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.json(data);

  } catch (error) {
    console.log("ERROR GET QUOTES:", error);
    res.status(500).json({
      message: "Error cargando datos"
    });
  }
});

// CREAR COTIZACIÓN
router.post("/", async (req, res) => {
  try {
    const { nombre, telefono, evento, personas, mensaje } = req.body;

    if (!nombre || !telefono || !evento || !personas) {
      return res.status(400).json({
        message: "Datos obligatorios faltantes"
      });
    }

    await db.query(
      `INSERT INTO cotizaciones (nombre, telefono, evento, personas, mensaje, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        telefono,
        evento,
        personas,
        mensaje || "",
        "Nuevo"
      ]
    );

    res.json({
      message: "Cotización guardada"
    });

  } catch (error) {
    console.log("ERROR POST:", error);
    res.status(500).json({
      message: "Error al guardar"
    });
  }
});

// ACTUALIZAR ESTADO
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    await db.query(
      "UPDATE cotizaciones SET estado = ? WHERE id = ?",
      [estado, id]
    );

    res.json({
      message: "Estado actualizado"
    });

  } catch (error) {
    console.log("ERROR UPDATE:", error);
    res.status(500).json({
      message: "Error al actualizar"
    });
  }
});

// ELIMINAR
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "DELETE FROM cotizaciones WHERE id = ?",
      [id]
    );

    res.json({
      message: "Eliminado"
    });

  } catch (error) {
    console.log("ERROR DELETE:", error);
    res.status(500).json({
      message: "Error al eliminar"
    });
  }
});

module.exports = router;
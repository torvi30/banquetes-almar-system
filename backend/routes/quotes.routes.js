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
      `INSERT INTO cotizaciones (nombre, telefono, evento, personas, mensaje, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        telefono.trim(),
        evento.trim(),
        Number(personas),
        mensaje ? mensaje.trim() : "",
        "Nuevo"
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

router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ["Nuevo", "Contactado", "Confirmado", "Cancelado", "Convertido"];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        message: "Estado no válido"
      });
    }

    await db.query(
      "UPDATE cotizaciones SET estado = ? WHERE id = ?",
      [estado, id]
    );

    res.json({
      message: "Estado actualizado correctamente"
    });
  } catch (error) {
    console.log("ERROR UPDATE STATUS:", error);
    res.status(500).json({
      message: "Error al actualizar estado"
    });
  }
});

router.post("/:id/convert", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM cotizaciones WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Cotización no encontrada"
      });
    }

    const cotizacion = rows[0];

    await db.query(
      `INSERT INTO eventos
      (cliente, telefono, tipo_evento, fecha_evento, lugar, personas, valor_total, abono, saldo, estado, observaciones)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cotizacion.nombre,
        cotizacion.telefono,
        cotizacion.evento,
        null,
        "Por definir",
        cotizacion.personas || 0,
        0,
        0,
        0,
        "Nuevo",
        cotizacion.mensaje || ""
      ]
    );

    await db.query(
      "UPDATE cotizaciones SET estado = 'Convertido' WHERE id = ?",
      [id]
    );

    res.json({
      message: "Cotización convertida a evento"
    });
  } catch (error) {
    console.log("ERROR CONVERT QUOTE:", error);
    res.status(500).json({
      message: "Error al convertir cotización en evento"
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
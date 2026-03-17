const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// Obtener todos los eventos
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT *, (valor_total - abono) AS saldo FROM eventos ORDER BY fecha_evento DESC"
    );

    res.json(rows);
  } catch (error) {
    console.log("ERROR EVENTOS:", error);
    res.status(500).json({ message: "Error al obtener eventos" });
  }
});

// Crear evento
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      cliente,
      telefono,
      tipo_evento,
      fecha_evento,
      lugar,
      personas,
      valor_total,
      abono,
      estado,
      observaciones
    } = req.body;

    const totalNumero = Number(valor_total || 0);
    const abonoNumero = Number(abono || 0);
    const saldo = totalNumero - abonoNumero;

    await db.query(
      `INSERT INTO eventos 
      (cliente, telefono, tipo_evento, fecha_evento, lugar, personas, valor_total, abono, saldo, estado, observaciones)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente,
        telefono,
        tipo_evento,
        fecha_evento,
        lugar,
        personas,
        totalNumero,
        abonoNumero,
        saldo,
        estado,
        observaciones
      ]
    );

    res.json({ message: "Evento creado" });
  } catch (error) {
    console.log("ERROR CREAR EVENTO:", error);
    res.status(500).json({ message: "Error al crear evento" });
  }
});

// Editar evento
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      cliente,
      telefono,
      tipo_evento,
      fecha_evento,
      lugar,
      personas,
      valor_total,
      abono,
      estado,
      observaciones
    } = req.body;

    const totalNumero = Number(valor_total || 0);
    const abonoNumero = Number(abono || 0);
    const saldo = totalNumero - abonoNumero;

    await db.query(
      `UPDATE eventos SET
        cliente = ?,
        telefono = ?,
        tipo_evento = ?,
        fecha_evento = ?,
        lugar = ?,
        personas = ?,
        valor_total = ?,
        abono = ?,
        saldo = ?,
        estado = ?,
        observaciones = ?
      WHERE id = ?`,
      [
        cliente,
        telefono,
        tipo_evento,
        fecha_evento,
        lugar,
        personas,
        totalNumero,
        abonoNumero,
        saldo,
        estado,
        observaciones,
        id
      ]
    );

    res.json({ message: "Evento actualizado correctamente" });
  } catch (error) {
    console.log("ERROR EDITAR EVENTO:", error);
    res.status(500).json({ message: "Error al editar evento" });
  }
});

// Eliminar evento
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "DELETE FROM eventos WHERE id = ?",
      [id]
    );

    res.json({ message: "Evento eliminado" });
  } catch (error) {
    console.log("ERROR DELETE EVENTO:", error);
    res.status(500).json({ message: "Error al eliminar evento" });
  }
});

module.exports = router;
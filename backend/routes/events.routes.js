const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// =========================
// MULTER
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// =========================
// HELPERS
// =========================
function calcularSaldo(valorTotal, abono) {
  const total = Number(valorTotal || 0);
  const pago = Number(abono || 0);
  const saldo = total - pago;
  return saldo < 0 ? 0 : saldo;
}

// =========================
// GET TODOS
// =========================
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM eventos
      ORDER BY
        CASE
          WHEN fecha_evento IS NULL THEN 1
          ELSE 0
        END,
        fecha_evento ASC,
        id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET EVENTS:", error);
    res.status(500).json({
      message: "Error al obtener eventos"
    });
  }
});

// =========================
// GET UNO
// =========================
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM eventos WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.log("ERROR GET EVENT:", error);
    res.status(500).json({
      message: "Error al obtener evento"
    });
  }
});

// =========================
// POST CREAR
// =========================
router.post("/", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const {
      cliente_id,
      cliente,
      telefono,
      tipo_evento,
      fecha_evento,
      lugar,
      personas,
      valor_total,
      abono,
      observaciones
    } = req.body;

    if (!cliente || !String(cliente).trim()) {
      return res.status(400).json({
        message: "El cliente es obligatorio"
      });
    }

    if (!tipo_evento || !String(tipo_evento).trim()) {
      return res.status(400).json({
        message: "El tipo de evento es obligatorio"
      });
    }

    const total = Number(valor_total || 0);
    const pago = Number(abono || 0);

    if (pago > total) {
      return res.status(400).json({
        message: "El abono no puede ser mayor al valor total"
      });
    }

    const saldo = calcularSaldo(total, pago);
    const imagen = req.file ? req.file.filename : null;

    await db.query(
      `
      INSERT INTO eventos
      (
        cliente_id,
        cliente,
        telefono,
        tipo_evento,
        fecha_evento,
        lugar,
        personas,
        valor_total,
        abono,
        saldo,
        estado,
        observaciones,
        imagen
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        cliente_id || null,
        String(cliente).trim(),
        telefono ? String(telefono).trim() : "",
        String(tipo_evento).trim(),
        fecha_evento || null,
        lugar ? String(lugar).trim() : "",
        Number(personas || 0),
        total,
        pago,
        saldo,
        "Pendiente",
        observaciones ? String(observaciones).trim() : "",
        imagen
      ]
    );

    res.json({
      message: "Evento creado correctamente"
    });
  } catch (error) {
    console.log("ERROR POST EVENT:", error);
    res.status(500).json({
      message: "Error al crear evento"
    });
  }
});

// =========================
// PUT ACTUALIZAR
// =========================
router.put("/:id", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const { id } = req.params;

    const {
      cliente_id,
      cliente,
      telefono,
      tipo_evento,
      fecha_evento,
      lugar,
      personas,
      valor_total,
      abono,
      observaciones,
      estado
    } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM eventos WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    const actual = rows[0];

    const clienteFinal = cliente !== undefined ? String(cliente).trim() : actual.cliente;
    const telefonoFinal = telefono !== undefined ? String(telefono).trim() : actual.telefono;
    const tipoEventoFinal = tipo_evento !== undefined ? String(tipo_evento).trim() : actual.tipo_evento;
    const fechaFinal = fecha_evento !== undefined ? (fecha_evento || null) : actual.fecha_evento;
    const lugarFinal = lugar !== undefined ? String(lugar).trim() : actual.lugar;
    const personasFinal = personas !== undefined ? Number(personas || 0) : Number(actual.personas || 0);
    const totalFinal = valor_total !== undefined ? Number(valor_total || 0) : Number(actual.valor_total || 0);
    const abonoFinal = abono !== undefined ? Number(abono || 0) : Number(actual.abono || 0);
    const observacionesFinal = observaciones !== undefined ? String(observaciones).trim() : actual.observaciones;
    const estadoFinal = estado !== undefined ? estado : (actual.estado || "Pendiente");
    const clienteIdFinal = cliente_id !== undefined ? (cliente_id || null) : actual.cliente_id;

    if (!clienteFinal) {
      return res.status(400).json({
        message: "El cliente es obligatorio"
      });
    }

    if (!tipoEventoFinal) {
      return res.status(400).json({
        message: "El tipo de evento es obligatorio"
      });
    }

    if (abonoFinal > totalFinal) {
      return res.status(400).json({
        message: "El abono no puede ser mayor al valor total"
      });
    }

    const saldoFinal = calcularSaldo(totalFinal, abonoFinal);
    const imagenFinal = req.file ? req.file.filename : actual.imagen;

    await db.query(
      `
      UPDATE eventos
      SET
        cliente_id = ?,
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
        observaciones = ?,
        imagen = ?
      WHERE id = ?
      `,
      [
        clienteIdFinal,
        clienteFinal,
        telefonoFinal,
        tipoEventoFinal,
        fechaFinal,
        lugarFinal,
        personasFinal,
        totalFinal,
        abonoFinal,
        saldoFinal,
        estadoFinal,
        observacionesFinal,
        imagenFinal,
        id
      ]
    );

    res.json({
      message: "Evento actualizado correctamente"
    });
  } catch (error) {
    console.log("ERROR PUT EVENT:", error);
    res.status(500).json({
      message: "Error al actualizar evento"
    });
  }
});

// =========================
// DELETE
// =========================
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM eventos WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Evento no encontrado"
      });
    }

    await db.query(
      "DELETE FROM eventos WHERE id = ?",
      [id]
    );

    res.json({
      message: "Evento eliminado correctamente"
    });
  } catch (error) {
    console.log("ERROR DELETE EVENT:", error);
    res.status(500).json({
      message: "Error al eliminar evento"
    });
  }
});

module.exports = router;
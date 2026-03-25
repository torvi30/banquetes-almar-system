const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

async function recalcularEvento(eventoId) {
  const [eventRows] = await db.query(
    "SELECT id, valor_total FROM eventos WHERE id = ?",
    [eventoId]
  );

  if (!eventRows.length) return;

  const evento = eventRows[0];
  const valorTotal = Number(evento.valor_total || 0);

  const [paymentRows] = await db.query(
    "SELECT COALESCE(SUM(monto), 0) AS total_pagado FROM pagos WHERE evento_id = ?",
    [eventoId]
  );

  const abono = Number(paymentRows[0].total_pagado || 0);
  const saldo = Math.max(valorTotal - abono, 0);

  let estado = "Pendiente";
  if (abono > 0 && saldo > 0) estado = "Confirmado";
  if (valorTotal > 0 && saldo === 0) estado = "Pagado";

  await db.query(
    "UPDATE eventos SET abono = ?, saldo = ?, estado = ? WHERE id = ?",
    [abono, saldo, estado, eventoId]
  );
}

// Obtener pagos de un evento
router.get("/event/:eventoId", async (req, res) => {
  try {
    const { eventoId } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM pagos WHERE evento_id = ? ORDER BY id DESC",
      [eventoId]
    );

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET PAGOS:", error);
    res.status(500).json({ message: "Error al obtener pagos" });
  }
});

// Obtener resumen del evento
router.get("/event/:eventoId/summary", async (req, res) => {
  try {
    const { eventoId } = req.params;

    const [rows] = await db.query(
      `SELECT
        id,
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
        observaciones
      FROM eventos
      WHERE id = ?`,
      [eventoId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.log("ERROR GET RESUMEN EVENTO:", error);
    res.status(500).json({ message: "Error al obtener resumen del evento" });
  }
});

// Crear pago
router.post("/", verifyToken, async (req, res) => {
  try {
    const { evento_id, monto, metodo, nota } = req.body;

    if (!evento_id) {
      return res.status(400).json({ message: "El evento es obligatorio" });
    }

    const valorMonto = Number(monto || 0);

    if (valorMonto <= 0) {
      return res.status(400).json({ message: "El monto debe ser mayor a 0" });
    }

    const [eventRows] = await db.query(
      "SELECT id FROM eventos WHERE id = ?",
      [evento_id]
    );

    if (!eventRows.length) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    await db.query(
      "INSERT INTO pagos (evento_id, monto, metodo, nota) VALUES (?, ?, ?, ?)",
      [evento_id, valorMonto, metodo || "", nota || ""]
    );

    await recalcularEvento(evento_id);

    res.json({ message: "Pago registrado correctamente" });
  } catch (error) {
    console.log("ERROR POST PAGO:", error);
    res.status(500).json({ message: "Error al registrar pago" });
  }
});

// Editar pago
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, metodo, nota } = req.body;

    const valorMonto = Number(monto || 0);

    if (valorMonto <= 0) {
      return res.status(400).json({ message: "El monto debe ser mayor a 0" });
    }

    const [rows] = await db.query(
      "SELECT * FROM pagos WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    const pagoActual = rows[0];

    await db.query(
      "UPDATE pagos SET monto = ?, metodo = ?, nota = ? WHERE id = ?",
      [valorMonto, metodo || "", nota || "", id]
    );

    await recalcularEvento(pagoActual.evento_id);

    res.json({ message: "Pago actualizado correctamente" });
  } catch (error) {
    console.log("ERROR PUT PAGO:", error);
    res.status(500).json({ message: "Error al actualizar pago" });
  }
});

// Eliminar pago
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM pagos WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    const pagoActual = rows[0];

    await db.query("DELETE FROM pagos WHERE id = ?", [id]);
    await recalcularEvento(pagoActual.evento_id);

    res.json({ message: "Pago eliminado correctamente" });
  } catch (error) {
    console.log("ERROR DELETE PAGO:", error);
    res.status(500).json({ message: "Error al eliminar pago" });
  }
});

module.exports = router;
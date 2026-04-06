const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// LISTAR RESERVAS
router.get("/", verifyToken, async (req, res) => {
  try {
    const { fecha, estado, q } = req.query;

    let sql = `
      SELECT *
      FROM reservas
      WHERE 1 = 1
    `;
    const params = [];

    if (fecha) {
      sql += ` AND fecha_evento = ?`;
      params.push(fecha);
    }

    if (estado) {
      sql += ` AND estado = ?`;
      params.push(estado);
    }

    if (q) {
      sql += ` AND (
        cliente LIKE ?
        OR telefono LIKE ?
        OR tipo_evento LIKE ?
        OR lugar LIKE ?
      )`;
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    sql += ` ORDER BY fecha_evento ASC, id DESC`;

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.log("ERROR GET RESERVAS:", error);
    res.status(500).json({
      message: "Error al obtener reservas"
    });
  }
});

// OBTENER UNA RESERVA
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM reservas WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Reserva no encontrada"
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.log("ERROR GET RESERVA:", error);
    res.status(500).json({
      message: "Error al obtener reserva"
    });
  }
});

// CREAR RESERVA
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      cliente_id,
      cliente,
      telefono,
      tipo_evento,
      fecha_evento,
      lugar,
      personas,
      estado,
      observaciones
    } = req.body;

    if (!cliente || !cliente.trim()) {
      return res.status(400).json({
        message: "El cliente es obligatorio"
      });
    }

    if (!tipo_evento || !tipo_evento.trim()) {
      return res.status(400).json({
        message: "El tipo de evento es obligatorio"
      });
    }

    if (!fecha_evento) {
      return res.status(400).json({
        message: "La fecha del evento es obligatoria"
      });
    }

    await db.query(
      `
      INSERT INTO reservas
      (
        cliente_id,
        cliente,
        telefono,
        tipo_evento,
        fecha_evento,
        lugar,
        personas,
        estado,
        observaciones
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        cliente_id || null,
        cliente.trim(),
        telefono ? telefono.trim() : "",
        tipo_evento.trim(),
        fecha_evento,
        lugar ? lugar.trim() : "",
        Number(personas || 0),
        estado || "Pendiente",
        observaciones ? observaciones.trim() : ""
      ]
    );

    res.json({
      message: "Reserva creada correctamente"
    });
  } catch (error) {
    console.log("ERROR POST RESERVA:", error);
    res.status(500).json({
      message: "Error al crear reserva"
    });
  }
});

// ACTUALIZAR RESERVA
router.put("/:id", verifyToken, async (req, res) => {
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
      estado,
      observaciones
    } = req.body;

    if (!cliente || !cliente.trim()) {
      return res.status(400).json({
        message: "El cliente es obligatorio"
      });
    }

    if (!tipo_evento || !tipo_evento.trim()) {
      return res.status(400).json({
        message: "El tipo de evento es obligatorio"
      });
    }

    if (!fecha_evento) {
      return res.status(400).json({
        message: "La fecha del evento es obligatoria"
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM reservas WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Reserva no encontrada"
      });
    }

    await db.query(
      `
      UPDATE reservas
      SET
        cliente_id = ?,
        cliente = ?,
        telefono = ?,
        tipo_evento = ?,
        fecha_evento = ?,
        lugar = ?,
        personas = ?,
        estado = ?,
        observaciones = ?
      WHERE id = ?
      `,
      [
        cliente_id || null,
        cliente.trim(),
        telefono ? telefono.trim() : "",
        tipo_evento.trim(),
        fecha_evento,
        lugar ? lugar.trim() : "",
        Number(personas || 0),
        estado || "Pendiente",
        observaciones ? observaciones.trim() : "",
        id
      ]
    );

    res.json({
      message: "Reserva actualizada correctamente"
    });
  } catch (error) {
    console.log("ERROR PUT RESERVA:", error);
    res.status(500).json({
      message: "Error al actualizar reserva"
    });
  }
});

// ELIMINAR RESERVA
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM reservas WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Reserva no encontrada"
      });
    }

    await db.query(
      "DELETE FROM reservas WHERE id = ?",
      [id]
    );

    res.json({
      message: "Reserva eliminada correctamente"
    });
  } catch (error) {
    console.log("ERROR DELETE RESERVA:", error);
    res.status(500).json({
      message: "Error al eliminar reserva"
    });
  }
});

// CONVERTIR RESERVA A EVENTO
router.post("/:id/convert", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM reservas WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Reserva no encontrada"
      });
    }

    const reserva = rows[0];

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
        observaciones
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        reserva.cliente_id || null,
        reserva.cliente,
        reserva.telefono || "",
        reserva.tipo_evento,
        reserva.fecha_evento,
        reserva.lugar || "Por definir",
        Number(reserva.personas || 0),
        0,
        0,
        0,
        "Pendiente",
        reserva.observaciones || ""
      ]
    );

    await db.query(
      "UPDATE reservas SET estado = 'Convertida' WHERE id = ?",
      [id]
    );

    res.json({
      message: "Reserva convertida a evento correctamente"
    });
  } catch (error) {
    console.log("ERROR CONVERT RESERVA:", error);
    res.status(500).json({
      message: "Error al convertir reserva"
    });
  }
});

module.exports = router;
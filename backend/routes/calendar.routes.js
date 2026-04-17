const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// GET CALENDARIO (RESERVAS + EVENTOS)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { month, year } = req.query;

    let reservasSql = `
      SELECT
        id,
        cliente,
        telefono,
        tipo_evento,
        fecha_evento,
        lugar,
        personas,
        estado,
        observaciones,
        'reserva' AS origen
      FROM reservas
      WHERE fecha_evento IS NOT NULL
    `;

    let eventosSql = `
      SELECT
        id,
        cliente,
        telefono,
        tipo_evento,
        fecha_evento,
        lugar,
        personas,
        estado,
        observaciones,
        'evento' AS origen
      FROM eventos
      WHERE fecha_evento IS NOT NULL
    `;

    const reservasParams = [];
    const eventosParams = [];

    if (month && year) {
      reservasSql += ` AND MONTH(fecha_evento) = ? AND YEAR(fecha_evento) = ?`;
      eventosSql += ` AND MONTH(fecha_evento) = ? AND YEAR(fecha_evento) = ?`;

      reservasParams.push(Number(month), Number(year));
      eventosParams.push(Number(month), Number(year));
    }

    reservasSql += ` ORDER BY fecha_evento ASC, id DESC`;
    eventosSql += ` ORDER BY fecha_evento ASC, id DESC`;

    const [reservas] = await db.query(reservasSql, reservasParams);
    const [eventos] = await db.query(eventosSql, eventosParams);

    res.json({
      reservas,
      eventos
    });

  } catch (error) {
    console.error("❌ ERROR CALENDARIO:", error);
    res.status(500).json({
      message: "Error cargando calendario"
    });
  }
});

module.exports = router;
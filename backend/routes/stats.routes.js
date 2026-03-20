const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const [[eventosRow]] = await db.query(
      "SELECT COUNT(*) AS totalEventos FROM eventos"
    );

    const [[confirmadosRow]] = await db.query(
      `SELECT COUNT(*) AS confirmados
       FROM eventos
       WHERE estado IN ('Confirmado', 'Pagado')`
    );

    const [[dineroRow]] = await db.query(
      `SELECT
         COALESCE(SUM(abono), 0) AS ingresos,
         COALESCE(SUM(saldo), 0) AS pendiente
       FROM eventos`
    );

    res.json({
      totalEventos: Number(eventosRow.totalEventos || 0),
      confirmados: Number(confirmadosRow.confirmados || 0),
      ingresos: Number(dineroRow.ingresos || 0),
      pendiente: Number(dineroRow.pendiente || 0)
    });
  } catch (error) {
    console.log("ERROR STATS:", error);
    res.status(500).json({
      message: "Error al obtener estadísticas"
    });
  }
});

module.exports = router;
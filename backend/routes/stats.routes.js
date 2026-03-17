const express = require("express");
const db = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {

  try {

    const [totalEventos] = await db.query(
      "SELECT COUNT(*) as total FROM eventos"
    );

    const [confirmados] = await db.query(
      "SELECT COUNT(*) as total FROM eventos WHERE estado = 'Confirmado'"
    );

    const [ingresos] = await db.query(
      "SELECT SUM(valor_total) as total FROM eventos"
    );

    const [pendiente] = await db.query(
      "SELECT SUM(valor_total - abono) as total FROM eventos"
    );

    res.json({
      totalEventos: totalEventos[0].total,
      confirmados: confirmados[0].total,
      ingresos: ingresos[0].total || 0,
      pendiente: pendiente[0].total || 0
    });

  } catch (error) {

    console.log("ERROR STATS:", error);
    res.status(500).json({ message: "Error stats" });

  }

});

module.exports = router;
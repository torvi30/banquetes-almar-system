const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

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

    await db.query(
      `INSERT INTO eventos
      (cliente,telefono,tipo_evento,fecha_evento,lugar,personas,valor_total,abono,estado,observaciones)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
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
      ]
    );

    res.json({ message: "Evento creado" });

  } catch (error) {

    console.log("ERROR CREAR EVENTO:", error);
    res.status(500).json({ message: "Error al crear evento" });

  }

});

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
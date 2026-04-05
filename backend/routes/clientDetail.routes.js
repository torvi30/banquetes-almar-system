const express = require("express");
const db = require("../config/db");

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [clientes] = await db.query(
      "SELECT * FROM clientes WHERE id = ?",
      [id]
    );

    if (!clientes.length) {
      return res.status(404).json({
        message: "Cliente no encontrado"
      });
    }

    const cliente = clientes[0];

    const [eventos] = await db.query(
      `
      SELECT
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
        observaciones,
        imagen
      FROM eventos
      WHERE cliente_id = ?
      ORDER BY fecha_evento DESC, id DESC
      `,
      [id]
    );

    const [pagos] = await db.query(
      `
      SELECT
        p.id,
        p.evento_id,
        p.monto,
        p.metodo,
        p.nota,
        p.created_at,
        e.cliente,
        e.tipo_evento,
        e.fecha_evento
      FROM pagos p
      INNER JOIN eventos e ON p.evento_id = e.id
      WHERE e.cliente_id = ?
      ORDER BY p.created_at DESC, p.id DESC
      `,
      [id]
    );

    const totalEventos = eventos.reduce(
      (acc, e) => acc + Number(e.valor_total || 0),
      0
    );

    const totalPagado = pagos.reduce(
      (acc, p) => acc + Number(p.monto || 0),
      0
    );

    const saldo = Math.max(totalEventos - totalPagado, 0);

    res.json({
      cliente,
      eventos,
      pagos,
      resumen: {
        totalEventos,
        totalPagado,
        saldo
      }
    });
  } catch (error) {
    console.log("ERROR CLIENT DETAIL:", error);
    res.status(500).json({
      message: "Error cargando detalle del cliente"
    });
  }
});

module.exports = router;
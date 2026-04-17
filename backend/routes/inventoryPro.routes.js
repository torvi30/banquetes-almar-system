const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

/**
 * CATEGORIAS
 */

// listar categorías
router.get("/categories", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM categorias_inventario
      ORDER BY nombre ASC
    `);

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET CATEGORIES:", error);
    res.status(500).json({ message: "Error al obtener categorías" });
  }
});

// crear categoría
router.post("/categories", verifyToken, async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    await db.query(
      `INSERT INTO categorias_inventario (nombre) VALUES (?)`,
      [nombre.trim()]
    );

    res.json({ message: "Categoría creada correctamente" });
  } catch (error) {
    console.log("ERROR POST CATEGORY:", error);
    res.status(500).json({ message: "Error al crear categoría" });
  }
});

/**
 * INVENTARIO
 */

// listar inventario
router.get("/items", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        i.*,
        c.nombre AS categoria_nombre
      FROM inventario i
      LEFT JOIN categorias_inventario c ON i.categoria_id = c.id
      ORDER BY i.id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET ITEMS:", error);
    res.status(500).json({ message: "Error al obtener inventario" });
  }
});

// crear item
router.post("/items", verifyToken, async (req, res) => {
  try {
    const {
      categoria_id,
      nombre,
      descripcion,
      cantidad_total,
      activo
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    if (Number(cantidad_total) < 0) {
      return res.status(400).json({ message: "La cantidad no puede ser negativa" });
    }

    await db.query(
      `
      INSERT INTO inventario
      (categoria_id, nombre, descripcion, cantidad_total, activo)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        categoria_id || null,
        nombre.trim(),
        descripcion ? descripcion.trim() : "",
        Number(cantidad_total || 0),
        activo === 0 || activo === false ? 0 : 1
      ]
    );

    res.json({ message: "Item creado correctamente" });
  } catch (error) {
    console.log("ERROR POST ITEM:", error);
    res.status(500).json({ message: "Error al crear item" });
  }
});

// actualizar item
router.put("/items/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      categoria_id,
      nombre,
      descripcion,
      cantidad_total,
      activo
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    if (Number(cantidad_total) < 0) {
      return res.status(400).json({ message: "La cantidad no puede ser negativa" });
    }

    await db.query(
      `
      UPDATE inventario
      SET
        categoria_id = ?,
        nombre = ?,
        descripcion = ?,
        cantidad_total = ?,
        activo = ?
      WHERE id = ?
      `,
      [
        categoria_id || null,
        nombre.trim(),
        descripcion ? descripcion.trim() : "",
        Number(cantidad_total || 0),
        activo === 0 || activo === false ? 0 : 1,
        id
      ]
    );

    res.json({ message: "Item actualizado correctamente" });
  } catch (error) {
    console.log("ERROR PUT ITEM:", error);
    res.status(500).json({ message: "Error al actualizar item" });
  }
});

// eliminar item
router.delete("/items/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(`DELETE FROM inventario WHERE id = ?`, [id]);

    res.json({ message: "Item eliminado correctamente" });
  } catch (error) {
    console.log("ERROR DELETE ITEM:", error);
    res.status(500).json({ message: "Error al eliminar item" });
  }
});

/**
 * DISPONIBILIDAD POR FECHA
 */
router.get("/availability", verifyToken, async (req, res) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ message: "La fecha es obligatoria" });
    }

    const [items] = await db.query(`
      SELECT
        i.id,
        i.nombre,
        i.cantidad_total,
        i.activo,
        c.nombre AS categoria_nombre
      FROM inventario i
      LEFT JOIN categorias_inventario c ON i.categoria_id = c.id
      ORDER BY i.nombre ASC
    `);

    const [usado] = await db.query(
      `
      SELECT
        rd.inventario_id,
        SUM(rd.cantidad) AS reservado
      FROM reserva_detalle rd
      INNER JOIN reservas r ON rd.reserva_id = r.id
      WHERE r.fecha_evento = ?
        AND r.estado IN ('Pendiente', 'Confirmada', 'Convertida')
      GROUP BY rd.inventario_id
      `,
      [fecha]
    );

    const usadoMap = new Map();
    usado.forEach(row => {
      usadoMap.set(Number(row.inventario_id), Number(row.reservado || 0));
    });

    const resultado = items.map(item => {
      const reservado = usadoMap.get(Number(item.id)) || 0;
      const disponible = Number(item.cantidad_total || 0) - reservado;

      return {
        ...item,
        reservado,
        disponible: disponible < 0 ? 0 : disponible
      };
    });

    res.json(resultado);
  } catch (error) {
    console.log("ERROR AVAILABILITY:", error);
    res.status(500).json({ message: "Error al calcular disponibilidad" });
  }
});

/**
 * DETALLE DE RESERVA
 */

// listar detalle de una reserva
router.get("/reservation-items/:reservaId", verifyToken, async (req, res) => {
  try {
    const { reservaId } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        rd.id,
        rd.reserva_id,
        rd.inventario_id,
        rd.cantidad,
        i.nombre,
        i.descripcion
      FROM reserva_detalle rd
      INNER JOIN inventario i ON rd.inventario_id = i.id
      WHERE rd.reserva_id = ?
      ORDER BY rd.id DESC
      `,
      [reservaId]
    );

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET RESERVATION ITEMS:", error);
    res.status(500).json({ message: "Error al obtener detalle de reserva" });
  }
});

// guardar detalle de reserva completo
router.post("/reservation-items/:reservaId", verifyToken, async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { reservaId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Items inválidos" });
    }

    const [reservas] = await connection.query(
      `SELECT * FROM reservas WHERE id = ?`,
      [reservaId]
    );

    if (!reservas.length) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    const reserva = reservas[0];
    const fecha = reserva.fecha_evento;

    await connection.beginTransaction();

    await connection.query(
      `DELETE FROM reserva_detalle WHERE reserva_id = ?`,
      [reservaId]
    );

    for (const item of items) {
      const inventarioId = Number(item.inventario_id);
      const cantidad = Number(item.cantidad || 0);

      if (!inventarioId || cantidad <= 0) continue;

      const [inventarioRows] = await connection.query(
        `SELECT * FROM inventario WHERE id = ?`,
        [inventarioId]
      );

      if (!inventarioRows.length) {
        throw new Error("Item de inventario no encontrado");
      }

      const inv = inventarioRows[0];

      const [usoRows] = await connection.query(
        `
        SELECT COALESCE(SUM(rd.cantidad), 0) AS reservado
        FROM reserva_detalle rd
        INNER JOIN reservas r ON rd.reserva_id = r.id
        WHERE rd.inventario_id = ?
          AND r.fecha_evento = ?
          AND r.estado IN ('Pendiente', 'Confirmada', 'Convertida')
          AND r.id <> ?
        `,
        [inventarioId, fecha, reservaId]
      );

      const reservado = Number(usoRows[0].reservado || 0);
      const disponible = Number(inv.cantidad_total || 0) - reservado;

      if (cantidad > disponible) {
        throw new Error(`No hay stock suficiente para ${inv.nombre}. Disponible: ${disponible}`);
      }

      await connection.query(
        `
        INSERT INTO reserva_detalle (reserva_id, inventario_id, cantidad)
        VALUES (?, ?, ?)
        `,
        [reservaId, inventarioId, cantidad]
      );
    }

    await connection.commit();

    res.json({ message: "Detalle de reserva guardado correctamente" });
  } catch (error) {
    await connection.rollback();
    console.log("ERROR SAVE RESERVATION ITEMS:", error);
    res.status(500).json({ message: error.message || "Error al guardar detalle de reserva" });
  } finally {
    connection.release();
  }
});

module.exports = router;
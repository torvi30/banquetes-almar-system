const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// LISTAR / BUSCAR CLIENTES
router.get("/", verifyToken, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      const [rows] = await db.query(`
        SELECT *
        FROM clientes
        ORDER BY id DESC
      `);

      return res.json(rows);
    }

    const like = `%${q}%`;
    const idNumero = Number(q);
    const esNumero = !Number.isNaN(idNumero) && q !== "";

    let sql = `
      SELECT *
      FROM clientes
      WHERE
        nombre LIKE ?
        OR telefono LIKE ?
        OR email LIKE ?
        OR documento LIKE ?
    `;

    const params = [like, like, like, like];

    if (esNumero) {
      sql += ` OR id = ?`;
      params.push(idNumero);
    }

    sql += ` ORDER BY id DESC`;

    const [rows] = await db.query(sql, params);

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET CLIENTES:", error);
    res.status(500).json({
      message: "Error al obtener clientes"
    });
  }
});

// OBTENER UN CLIENTE
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM clientes WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Cliente no encontrado"
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.log("ERROR GET CLIENTE:", error);
    res.status(500).json({
      message: "Error al obtener cliente"
    });
  }
});

// CREAR CLIENTE
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      nombre,
      telefono,
      email,
      documento,
      direccion,
      tipo_cliente
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        message: "El nombre es obligatorio"
      });
    }

    await db.query(
      `
      INSERT INTO clientes
      (nombre, telefono, email, documento, direccion, tipo_cliente)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        nombre.trim(),
        telefono ? telefono.trim() : "",
        email ? email.trim() : "",
        documento ? documento.trim() : "",
        direccion ? direccion.trim() : "",
        tipo_cliente ? tipo_cliente.trim() : "Cliente"
      ]
    );

    res.json({
      message: "Cliente creado correctamente"
    });
  } catch (error) {
    console.log("ERROR POST CLIENTE:", error);
    res.status(500).json({
      message: "Error al crear cliente"
    });
  }
});

// ACTUALIZAR CLIENTE
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      telefono,
      email,
      documento,
      direccion,
      tipo_cliente
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        message: "El nombre es obligatorio"
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM clientes WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Cliente no encontrado"
      });
    }

    await db.query(
      `
      UPDATE clientes
      SET
        nombre = ?,
        telefono = ?,
        email = ?,
        documento = ?,
        direccion = ?,
        tipo_cliente = ?
      WHERE id = ?
      `,
      [
        nombre.trim(),
        telefono ? telefono.trim() : "",
        email ? email.trim() : "",
        documento ? documento.trim() : "",
        direccion ? direccion.trim() : "",
        tipo_cliente ? tipo_cliente.trim() : "Cliente",
        id
      ]
    );

    res.json({
      message: "Cliente actualizado correctamente"
    });
  } catch (error) {
    console.log("ERROR PUT CLIENTE:", error);
    res.status(500).json({
      message: "Error al actualizar cliente"
    });
  }
});

// ELIMINAR CLIENTE
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM clientes WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Cliente no encontrado"
      });
    }

    await db.query(
      "DELETE FROM clientes WHERE id = ?",
      [id]
    );

    res.json({
      message: "Cliente eliminado correctamente"
    });
  } catch (error) {
    console.log("ERROR DELETE CLIENTE:", error);
    res.status(500).json({
      message: "Error al eliminar cliente"
    });
  }
});

module.exports = router;
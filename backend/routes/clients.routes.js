const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// Obtener todos los clientes
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM clientes ORDER BY id DESC"
    );

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET CLIENTES:", error);
    res.status(500).json({ message: "Error al obtener clientes" });
  }
});

// Obtener un cliente por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM clientes WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.log("ERROR GET CLIENTE:", error);
    res.status(500).json({ message: "Error al obtener cliente" });
  }
});

// Crear cliente
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      nombre,
      telefono,
      email,
      documento,
      direccion,
      tipo_cliente,
      observaciones
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    if (!telefono || !telefono.trim()) {
      return res.status(400).json({ message: "El teléfono es obligatorio" });
    }

    await db.query(
      `INSERT INTO clientes
      (nombre, telefono, email, documento, direccion, tipo_cliente, observaciones)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        telefono.trim(),
        email || "",
        documento || "",
        direccion || "",
        tipo_cliente || "Persona",
        observaciones || ""
      ]
    );

    res.json({ message: "Cliente creado correctamente" });
  } catch (error) {
    console.log("ERROR POST CLIENTE:", error);
    res.status(500).json({ message: "Error al crear cliente" });
  }
});

// Editar cliente
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      telefono,
      email,
      documento,
      direccion,
      tipo_cliente,
      observaciones
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    if (!telefono || !telefono.trim()) {
      return res.status(400).json({ message: "El teléfono es obligatorio" });
    }

    const [rows] = await db.query(
      "SELECT * FROM clientes WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    await db.query(
      `UPDATE clientes SET
        nombre = ?,
        telefono = ?,
        email = ?,
        documento = ?,
        direccion = ?,
        tipo_cliente = ?,
        observaciones = ?
      WHERE id = ?`,
      [
        nombre.trim(),
        telefono.trim(),
        email || "",
        documento || "",
        direccion || "",
        tipo_cliente || "Persona",
        observaciones || "",
        id
      ]
    );

    res.json({ message: "Cliente actualizado correctamente" });
  } catch (error) {
    console.log("ERROR PUT CLIENTE:", error);
    res.status(500).json({ message: "Error al actualizar cliente" });
  }
});

// Eliminar cliente
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM clientes WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    await db.query(
      "DELETE FROM clientes WHERE id = ?",
      [id]
    );

    res.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.log("ERROR DELETE CLIENTE:", error);
    res.status(500).json({ message: "Error al eliminar cliente" });
  }
});

module.exports = router;
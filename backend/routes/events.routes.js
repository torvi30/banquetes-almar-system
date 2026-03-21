const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

const router = express.Router();

const uploadsPath = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, name);
  }
});

const upload = multer({ storage });

function calcularEstado(total, abono) {
  const valorTotal = Number(total || 0);
  const valorAbono = Number(abono || 0);
  const saldo = valorTotal - valorAbono;

  if (valorTotal > 0 && saldo <= 0) return "Pagado";
  if (valorAbono > 0) return "Confirmado";
  return "Pendiente";
}

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM eventos ORDER BY id DESC"
    );

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET EVENTOS:", error);
    res.status(500).json({ message: "Error al obtener eventos" });
  }
});

router.post("/", upload.single("imagen"), async (req, res) => {
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
      observaciones
    } = req.body;

    const total = Number(valor_total || 0);
    const pago = Number(abono || 0);
    const saldo = total - pago;
    const estado = calcularEstado(total, pago);
    const imagen = req.file ? req.file.filename : null;

    await db.query(
      `INSERT INTO eventos
      (cliente, telefono, tipo_evento, fecha_evento, lugar, personas, valor_total, abono, saldo, estado, observaciones, imagen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente || "",
        telefono || "",
        tipo_evento || "",
        fecha_evento || null,
        lugar || "",
        Number(personas || 0),
        total,
        pago,
        saldo,
        estado,
        observaciones || "",
        imagen
      ]
    );

    res.json({ message: "Evento creado correctamente" });
  } catch (error) {
    console.log("ERROR POST EVENTO:", error);
    res.status(500).json({
      message: error.sqlMessage || "Error al crear evento"
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      cliente,
      telefono,
      tipo_evento,
      fecha_evento,
      lugar,
      personas,
      valor_total,
      abono,
      observaciones
    } = req.body;

    const total = Number(valor_total || 0);
    const pago = Number(abono || 0);
    const saldo = total - pago;
    const estado = calcularEstado(total, pago);

    const [rows] = await db.query(
      "SELECT * FROM eventos WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    await db.query(
      `UPDATE eventos SET
        cliente = ?,
        telefono = ?,
        tipo_evento = ?,
        fecha_evento = ?,
        lugar = ?,
        personas = ?,
        valor_total = ?,
        abono = ?,
        saldo = ?,
        estado = ?,
        observaciones = ?
      WHERE id = ?`,
      [
        cliente || "",
        telefono || "",
        tipo_evento || "",
        fecha_evento || null,
        lugar || "",
        Number(personas || 0),
        total,
        pago,
        saldo,
        estado,
        observaciones || "",
        id
      ]
    );

    res.json({ message: "Evento actualizado correctamente" });
  } catch (error) {
    console.log("ERROR PUT EVENTO:", error);
    res.status(500).json({
      message: error.sqlMessage || "Error al actualizar evento"
    });
  }
});

router.put("/:id/imagen", upload.single("imagen"), async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM eventos WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    const actual = rows[0];

    if (!req.file) {
      return res.status(400).json({ message: "Debes enviar una imagen" });
    }

    const nuevaImagen = req.file.filename;

    if (actual.imagen) {
      const viejaRuta = path.join(uploadsPath, actual.imagen);
      if (fs.existsSync(viejaRuta)) {
        fs.unlinkSync(viejaRuta);
      }
    }

    await db.query(
      "UPDATE eventos SET imagen = ? WHERE id = ?",
      [nuevaImagen, id]
    );

    res.json({ message: "Imagen actualizada correctamente" });
  } catch (error) {
    console.log("ERROR PUT IMAGEN EVENTO:", error);
    res.status(500).json({
      message: error.sqlMessage || "Error al actualizar imagen"
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM eventos WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    const actual = rows[0];

    if (actual.imagen) {
      const rutaImagen = path.join(uploadsPath, actual.imagen);
      if (fs.existsSync(rutaImagen)) {
        fs.unlinkSync(rutaImagen);
      }
    }

    await db.query(
      "DELETE FROM eventos WHERE id = ?",
      [id]
    );

    res.json({ message: "Evento eliminado" });
  } catch (error) {
    console.log("ERROR DELETE EVENTO:", error);
    res.status(500).json({
      message: error.sqlMessage || "Error al eliminar evento"
    });
  }
});

module.exports = router;
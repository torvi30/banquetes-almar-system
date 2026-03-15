const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, name);
  }
});

const upload = multer({ storage });

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM servicios ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.log("ERROR GET SERVICIOS:", error);
    res.status(500).json({ message: "Error al obtener servicios" });
  }
});

router.post("/", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const { titulo, descripcion } = req.body;

    if (!titulo || !descripcion || !req.file) {
      return res.status(400).json({
        message: "Título, descripción e imagen son obligatorios"
      });
    }

    const imagen = req.file.filename;

    await db.query(
      "INSERT INTO servicios (titulo, descripcion, imagen) VALUES (?, ?, ?)",
      [titulo, descripcion, imagen]
    );

    res.json({ message: "Servicio creado correctamente" });
  } catch (error) {
    console.log("ERROR POST SERVICIO:", error);
    res.status(500).json({ message: "Error al crear servicio" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "DELETE FROM servicios WHERE id = ?",
      [id]
    );

    res.json({ message: "Servicio eliminado" });
  } catch (error) {
    console.log("ERROR DELETE SERVICIO:", error);
    res.status(500).json({ message: "Error al eliminar servicio" });
  }
});

module.exports = router;
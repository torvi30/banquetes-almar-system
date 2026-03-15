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
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM galeria ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.log("ERROR GET GALERIA:", error);
    res.status(500).json({ message: "Error al obtener galería" });
  }
});

router.post("/", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const { titulo } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Debes subir una imagen" });
    }

    const imagen = req.file.filename;

    await db.query(
      "INSERT INTO galeria (titulo, imagen) VALUES (?, ?)",
      [titulo || "Imagen Banquetes Almar", imagen]
    );

    res.json({ message: "Imagen subida correctamente" });
  } catch (error) {
    console.log("ERROR POST GALERIA:", error);
    res.status(500).json({ message: "Error al subir imagen" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "DELETE FROM galeria WHERE id = ?",
      [id]
    );

    res.json({ message: "Imagen eliminada" });
  } catch (error) {
    console.log("ERROR DELETE GALERIA:", error);
    res.status(500).json({ message: "Error al eliminar imagen" });
  }
});

module.exports = router;
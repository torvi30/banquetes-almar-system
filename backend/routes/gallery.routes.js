const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

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

router.get("/categories", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nombre, created_at FROM categorias_galeria ORDER BY nombre ASC"
    );
    res.json(rows);
  } catch (error) {
    console.log("ERROR GET CATEGORIAS GALERIA:", error);
    res.status(500).json({ message: "Error al obtener categorías" });
  }
});

router.post("/categories", verifyToken, async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre de la categoría es obligatorio" });
    }

    const categoria = nombre.trim();

    await db.query(
      "INSERT INTO categorias_galeria (nombre) VALUES (?)",
      [categoria]
    );

    res.json({ message: "Categoría creada correctamente" });
  } catch (error) {
    console.log("ERROR POST CATEGORIA GALERIA:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Esa categoría ya existe" });
    }

    res.status(500).json({ message: "Error al crear categoría" });
  }
});

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        g.id,
        g.titulo,
        g.imagen,
        g.created_at,
        c.id AS categoria_id,
        c.nombre AS categoria
      FROM galeria g
      INNER JOIN categorias_galeria c ON g.categoria_id = c.id
      ORDER BY c.nombre ASC, g.id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET GALERIA:", error);
    res.status(500).json({ message: "Error al obtener galería" });
  }
});

router.post("/", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const { titulo, categoria_id } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ message: "El título es obligatorio" });
    }

    if (!categoria_id) {
      return res.status(400).json({ message: "La categoría es obligatoria" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "La imagen es obligatoria" });
    }

    await db.query(
      "INSERT INTO galeria (titulo, categoria_id, imagen) VALUES (?, ?, ?)",
      [titulo.trim(), Number(categoria_id), req.file.filename]
    );

    res.json({ message: "Imagen agregada correctamente" });
  } catch (error) {
    console.log("ERROR POST GALERIA:", error);
    res.status(500).json({ message: "Error al crear imagen de galería" });
  }
});

router.put("/:id", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, categoria_id } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ message: "El título es obligatorio" });
    }

    if (!categoria_id) {
      return res.status(400).json({ message: "La categoría es obligatoria" });
    }

    const [rows] = await db.query(
      "SELECT * FROM galeria WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Imagen no encontrada" });
    }

    const actual = rows[0];
    let nuevaImagen = actual.imagen;

    if (req.file) {
      nuevaImagen = req.file.filename;

      if (actual.imagen) {
        const viejaImagenPath = path.join(uploadsPath, actual.imagen);
        if (fs.existsSync(viejaImagenPath)) {
          fs.unlinkSync(viejaImagenPath);
        }
      }
    }

    await db.query(
      "UPDATE galeria SET titulo = ?, categoria_id = ?, imagen = ? WHERE id = ?",
      [titulo.trim(), Number(categoria_id), nuevaImagen, id]
    );

    res.json({ message: "Imagen actualizada correctamente" });
  } catch (error) {
    console.log("ERROR PUT GALERIA:", error);
    res.status(500).json({ message: "Error al actualizar imagen de galería" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM galeria WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Imagen no encontrada" });
    }

    const item = rows[0];

    if (item.imagen) {
      const imagePath = path.join(uploadsPath, item.imagen);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.query(
      "DELETE FROM galeria WHERE id = ?",
      [id]
    );

    res.json({ message: "Imagen eliminada correctamente" });
  } catch (error) {
    console.log("ERROR DELETE GALERIA:", error);
    res.status(500).json({ message: "Error al eliminar imagen" });
  }
});

module.exports = router;
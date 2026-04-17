const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// =========================
// MULTER
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// =========================
// ASEGURAR TABLAS
// =========================
async function ensureTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS gallery_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS gallery_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      categoria_id INT NULL,
      titulo VARCHAR(180) NOT NULL,
      descripcion TEXT NULL,
      imagen VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_gallery_categoria
        FOREIGN KEY (categoria_id) REFERENCES gallery_categories(id)
        ON DELETE SET NULL
    )
  `);
}

ensureTables().catch((error) => {
  console.log("ERROR ENSURE GALLERY TABLES:", error);
});

// =========================
// CATEGORIAS PUBLICAS
// =========================
router.get("/categories", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM gallery_categories
      ORDER BY nombre ASC
    `);

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET GALLERY CATEGORIES:", error);
    res.status(500).json({
      message: "Error al obtener categorías"
    });
  }
});

// =========================
// RESUMEN PUBLICO POR SECCIONES
// =========================
router.get("/public/sections", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        gc.id,
        gc.nombre,
        COUNT(gi.id) AS total_fotos,
        MIN(gi.id) AS portada_id
      FROM gallery_categories gc
      LEFT JOIN gallery_items gi ON gi.categoria_id = gc.id
      GROUP BY gc.id, gc.nombre
      ORDER BY gc.nombre ASC
    `);

    const sections = [];

    for (const row of rows) {
      let portada = null;

      if (row.portada_id) {
        const [coverRows] = await db.query(
          `SELECT imagen FROM gallery_items WHERE id = ? LIMIT 1`,
          [row.portada_id]
        );
        portada = coverRows.length ? coverRows[0].imagen : null;
      }

      sections.push({
        id: row.id,
        nombre: row.nombre,
        total_fotos: Number(row.total_fotos || 0),
        portada
      });
    }

    res.json(sections);
  } catch (error) {
    console.log("ERROR GET PUBLIC SECTIONS:", error);
    res.status(500).json({
      message: "Error al obtener secciones públicas"
    });
  }
});

// =========================
// ITEMS PUBLICOS POR CATEGORIA
// =========================
router.get("/public/items", async (req, res) => {
  try {
    const { categoria_id } = req.query;

    let sql = `
      SELECT
        gi.*,
        gc.nombre AS categoria_nombre
      FROM gallery_items gi
      LEFT JOIN gallery_categories gc ON gi.categoria_id = gc.id
      WHERE 1 = 1
    `;
    const params = [];

    if (categoria_id) {
      sql += ` AND gi.categoria_id = ?`;
      params.push(categoria_id);
    }

    sql += ` ORDER BY gi.id DESC`;

    const [rows] = await db.query(sql, params);

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET PUBLIC ITEMS:", error);
    res.status(500).json({
      message: "Error al obtener imágenes públicas"
    });
  }
});

// =========================
// CREAR CATEGORIA (ADMIN)
// =========================
router.post("/categories", verifyToken, async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({
        message: "El nombre de la categoría es obligatorio"
      });
    }

    await db.query(
      `INSERT INTO gallery_categories (nombre) VALUES (?)`,
      [String(nombre).trim()]
    );

    res.json({
      message: "Categoría creada correctamente"
    });
  } catch (error) {
    console.log("ERROR POST GALLERY CATEGORY:", error);
    res.status(500).json({
      message: "Error al crear categoría"
    });
  }
});

// =========================
// LISTAR GALERIA PUBLICA/ADMIN
// =========================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        gi.*,
        gc.nombre AS categoria_nombre
      FROM gallery_items gi
      LEFT JOIN gallery_categories gc ON gi.categoria_id = gc.id
      ORDER BY gi.id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET GALLERY:", error);
    res.status(500).json({
      message: "Error al obtener galería"
    });
  }
});

// =========================
// CREAR ITEM (ADMIN)
// =========================
router.post("/", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const { categoria_id, titulo, descripcion } = req.body;

    if (!titulo || !String(titulo).trim()) {
      return res.status(400).json({
        message: "El título es obligatorio"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "La imagen es obligatoria"
      });
    }

    await db.query(
      `
      INSERT INTO gallery_items (categoria_id, titulo, descripcion, imagen)
      VALUES (?, ?, ?, ?)
      `,
      [
        categoria_id || null,
        String(titulo).trim(),
        descripcion ? String(descripcion).trim() : "",
        req.file.filename
      ]
    );

    res.json({
      message: "Imagen subida correctamente"
    });
  } catch (error) {
    console.log("ERROR POST GALLERY ITEM:", error);
    res.status(500).json({
      message: "Error al guardar imagen"
    });
  }
});

// =========================
// ACTUALIZAR ITEM (ADMIN)
// =========================
router.put("/:id", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria_id, titulo, descripcion } = req.body;

    const [rows] = await db.query(
      `SELECT * FROM gallery_items WHERE id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Elemento no encontrado"
      });
    }

    const actual = rows[0];

    const tituloFinal = titulo !== undefined ? String(titulo).trim() : actual.titulo;
    const descripcionFinal = descripcion !== undefined ? String(descripcion).trim() : actual.descripcion;
    const categoriaFinal = categoria_id !== undefined ? (categoria_id || null) : actual.categoria_id;
    const imagenFinal = req.file ? req.file.filename : actual.imagen;

    if (!tituloFinal) {
      return res.status(400).json({
        message: "El título es obligatorio"
      });
    }

    await db.query(
      `
      UPDATE gallery_items
      SET
        categoria_id = ?,
        titulo = ?,
        descripcion = ?,
        imagen = ?
      WHERE id = ?
      `,
      [categoriaFinal, tituloFinal, descripcionFinal, imagenFinal, id]
    );

    res.json({
      message: "Elemento actualizado correctamente"
    });
  } catch (error) {
    console.log("ERROR PUT GALLERY ITEM:", error);
    res.status(500).json({
      message: "Error al actualizar elemento"
    });
  }
});

// =========================
// ELIMINAR ITEM (ADMIN)
// =========================
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM gallery_items WHERE id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Elemento no encontrado"
      });
    }

    await db.query(
      `DELETE FROM gallery_items WHERE id = ?`,
      [id]
    );

    res.json({
      message: "Elemento eliminado correctamente"
    });
  } catch (error) {
    console.log("ERROR DELETE GALLERY ITEM:", error);
    res.status(500).json({
      message: "Error al eliminar elemento"
    });
  }
});

module.exports = router;
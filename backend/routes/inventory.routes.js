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
      "SELECT id, nombre FROM categorias_inventario ORDER BY nombre ASC"
    );
    res.json(rows);
  } catch (error) {
    console.log("ERROR GET CATEGORIAS INVENTARIO:", error);
    res.status(500).json({ message: "Error al obtener categorías de inventario" });
  }
});

router.post("/categories", verifyToken, async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    await db.query(
      "INSERT INTO categorias_inventario (nombre) VALUES (?)",
      [nombre.trim()]
    );

    res.json({ message: "Categoría creada correctamente" });
  } catch (error) {
    console.log("ERROR POST CATEGORIA INVENTARIO:", error);

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
        i.id,
        i.nombre,
        i.cantidad_total,
        i.cantidad_disponible,
        (i.cantidad_total - i.cantidad_disponible) AS cantidad_alquilada,
        i.descripcion,
        i.imagen,
        i.created_at,
        c.id AS categoria_id,
        c.nombre AS categoria
      FROM inventario i
      INNER JOIN categorias_inventario c ON i.categoria_id = c.id
      ORDER BY c.nombre ASC, i.nombre ASC
    `);

    res.json(rows);
  } catch (error) {
    console.log("ERROR GET INVENTARIO:", error);
    res.status(500).json({ message: "Error al obtener inventario" });
  }
});

router.post("/", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const {
      nombre,
      categoria_id,
      cantidad_total,
      cantidad_disponible,
      descripcion
    } = req.body;

    const total = Number(cantidad_total || 0);
    const disponible = Number(cantidad_disponible || 0);

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    if (!categoria_id) {
      return res.status(400).json({ message: "La categoría es obligatoria" });
    }

    if (total < 0 || disponible < 0) {
      return res.status(400).json({ message: "Las cantidades no pueden ser negativas" });
    }

    if (disponible > total) {
      return res.status(400).json({ message: "La cantidad disponible no puede ser mayor que la total" });
    }

    const imagen = req.file ? req.file.filename : null;

    await db.query(
      `INSERT INTO inventario
      (nombre, categoria_id, cantidad_total, cantidad_disponible, descripcion, imagen)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        Number(categoria_id),
        total,
        disponible,
        descripcion || "",
        imagen
      ]
    );

    res.json({ message: "Item de inventario creado correctamente" });
  } catch (error) {
    console.log("ERROR POST INVENTARIO:", error);
    res.status(500).json({ message: "Error al crear item de inventario" });
  }
});

router.put("/:id", verifyToken, upload.single("imagen"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      categoria_id,
      cantidad_total,
      cantidad_disponible,
      descripcion
    } = req.body;

    const total = Number(cantidad_total || 0);
    const disponible = Number(cantidad_disponible || 0);

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    if (!categoria_id) {
      return res.status(400).json({ message: "La categoría es obligatoria" });
    }

    if (total < 0 || disponible < 0) {
      return res.status(400).json({ message: "Las cantidades no pueden ser negativas" });
    }

    if (disponible > total) {
      return res.status(400).json({ message: "La cantidad disponible no puede ser mayor que la total" });
    }

    const [rows] = await db.query(
      "SELECT * FROM inventario WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Item no encontrado" });
    }

    const actual = rows[0];
    let nuevaImagen = actual.imagen || null;

    if (req.file) {
      nuevaImagen = req.file.filename;

      if (actual.imagen) {
        const viejaRuta = path.join(uploadsPath, actual.imagen);
        if (fs.existsSync(viejaRuta)) {
          fs.unlinkSync(viejaRuta);
        }
      }
    }

    await db.query(
      `UPDATE inventario SET
        nombre = ?,
        categoria_id = ?,
        cantidad_total = ?,
        cantidad_disponible = ?,
        descripcion = ?,
        imagen = ?
      WHERE id = ?`,
      [
        nombre.trim(),
        Number(categoria_id),
        total,
        disponible,
        descripcion || "",
        nuevaImagen,
        id
      ]
    );

    res.json({ message: "Item actualizado correctamente" });
  } catch (error) {
    console.log("ERROR PUT INVENTARIO:", error);
    res.status(500).json({ message: "Error al actualizar item" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM inventario WHERE id = ?",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Item no encontrado" });
    }

    const actual = rows[0];

    if (actual.imagen) {
      const rutaImagen = path.join(uploadsPath, actual.imagen);
      if (fs.existsSync(rutaImagen)) {
        fs.unlinkSync(rutaImagen);
      }
    }

    await db.query("DELETE FROM inventario WHERE id = ?", [id]);

    res.json({ message: "Item eliminado correctamente" });
  } catch (error) {
    console.log("ERROR DELETE INVENTARIO:", error);
    res.status(500).json({ message: "Error al eliminar item" });
  }
});

module.exports = router;
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verifyToken = require("../middleware/auth");

const router = express.Router();

const uploadsPath = path.join(__dirname, "../uploads");
const filePath = path.join(__dirname, "../data/galeria.json");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, "[]");
}

function leerGaleria() {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data || "[]");
}

function guardarGaleria(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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

router.get("/", (req, res) => {
  try {
    const galeria = leerGaleria();
    res.json(galeria);
  } catch (error) {
    console.log("ERROR GET GALERIA:", error);
    res.status(500).json({ message: "Error al obtener galería" });
  }
});

router.post("/", verifyToken, upload.single("imagen"), (req, res) => {
  try {
    const { titulo, seccion } = req.body;

    if (!titulo || !seccion || !req.file) {
      return res.status(400).json({
        message: "Título, sección e imagen son obligatorios"
      });
    }

    const galeria = leerGaleria();

    const nuevaImagen = {
      id: Date.now(),
      titulo: titulo.trim(),
      seccion: seccion.trim(),
      imagen: req.file.filename
    };

    galeria.push(nuevaImagen);
    guardarGaleria(galeria);

    res.json({
      message: "Imagen agregada correctamente",
      item: nuevaImagen
    });
  } catch (error) {
    console.log("ERROR POST GALERIA:", error);
    res.status(500).json({ message: "Error al crear imagen de galería" });
  }
});

router.put("/:id", verifyToken, upload.single("imagen"), (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, seccion } = req.body;

    if (!titulo || !seccion) {
      return res.status(400).json({
        message: "Título y sección son obligatorios"
      });
    }

    const galeria = leerGaleria();
    const index = galeria.findIndex(item => String(item.id) === String(id));

    if (index === -1) {
      return res.status(404).json({ message: "Imagen no encontrada" });
    }

    const actual = galeria[index];
    let nuevaImagen = actual.imagen;

    if (req.file) {
      nuevaImagen = req.file.filename;

      const viejaImagenPath = path.join(uploadsPath, actual.imagen);
      if (fs.existsSync(viejaImagenPath)) {
        fs.unlinkSync(viejaImagenPath);
      }
    }

    galeria[index] = {
      ...actual,
      titulo: titulo.trim(),
      seccion: seccion.trim(),
      imagen: nuevaImagen
    };

    guardarGaleria(galeria);

    res.json({
      message: "Imagen actualizada correctamente",
      item: galeria[index]
    });
  } catch (error) {
    console.log("ERROR PUT GALERIA:", error);
    res.status(500).json({ message: "Error al actualizar imagen de galería" });
  }
});

router.delete("/:id", verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const galeria = leerGaleria();

    const item = galeria.find(g => String(g.id) === String(id));
    if (!item) {
      return res.status(404).json({ message: "Imagen no encontrada" });
    }

    const nuevaLista = galeria.filter(g => String(g.id) !== String(id));

    const imagePath = path.join(uploadsPath, item.imagen);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    guardarGaleria(nuevaLista);

    res.json({ message: "Imagen eliminada correctamente" });
  } catch (error) {
    console.log("ERROR DELETE GALERIA:", error);
    res.status(500).json({ message: "Error al eliminar imagen" });
  }
});

module.exports = router;
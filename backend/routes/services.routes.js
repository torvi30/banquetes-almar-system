const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const verifyToken = require("../middleware/auth");

const router = express.Router();

const uploadsPath = path.join(__dirname, "../uploads");
const filePath = path.join(__dirname, "../data/servicios.json");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, "[]");
}

function leerServicios() {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data || "[]");
}

function guardarServicios(data) {
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
    const servicios = leerServicios();
    res.json(servicios);
  } catch (error) {
    console.log("ERROR GET SERVICIOS:", error);
    res.status(500).json({ message: "Error al obtener servicios" });
  }
});

router.post("/", verifyToken, upload.single("imagen"), (req, res) => {
  try {
    const { titulo, descripcion } = req.body;

    if (!titulo || !descripcion || !req.file) {
      return res.status(400).json({
        message: "Título, descripción e imagen son obligatorios"
      });
    }

    const servicios = leerServicios();

    const nuevoServicio = {
      id: Date.now(),
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      imagen: req.file.filename
    };

    servicios.push(nuevoServicio);
    guardarServicios(servicios);

    res.json({
      message: "Servicio creado correctamente",
      servicio: nuevoServicio
    });
  } catch (error) {
    console.log("ERROR POST SERVICIO:", error);
    res.status(500).json({ message: "Error al crear servicio" });
  }
});

router.put("/:id", verifyToken, upload.single("imagen"), (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;

    if (!titulo || !descripcion) {
      return res.status(400).json({
        message: "Título y descripción son obligatorios"
      });
    }

    const servicios = leerServicios();
    const index = servicios.findIndex(s => String(s.id) === String(id));

    if (index === -1) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    const servicioActual = servicios[index];
    let nuevaImagen = servicioActual.imagen;

    if (req.file) {
      nuevaImagen = req.file.filename;

      const viejaImagenPath = path.join(uploadsPath, servicioActual.imagen);
      if (fs.existsSync(viejaImagenPath)) {
        fs.unlinkSync(viejaImagenPath);
      }
    }

    servicios[index] = {
      ...servicioActual,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      imagen: nuevaImagen
    };

    guardarServicios(servicios);

    res.json({
      message: "Servicio actualizado correctamente",
      servicio: servicios[index]
    });
  } catch (error) {
    console.log("ERROR PUT SERVICIO:", error);
    res.status(500).json({ message: "Error al actualizar servicio" });
  }
});

router.delete("/:id", verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const servicios = leerServicios();

    const servicio = servicios.find(s => String(s.id) === String(id));
    if (!servicio) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    const nuevaLista = servicios.filter(s => String(s.id) !== String(id));

    const imagePath = path.join(uploadsPath, servicio.imagen);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    guardarServicios(nuevaLista);

    res.json({ message: "Servicio eliminado correctamente" });
  } catch (error) {
    console.log("ERROR DELETE SERVICIO:", error);
    res.status(500).json({ message: "Error al eliminar servicio" });
  }
});

module.exports = router;
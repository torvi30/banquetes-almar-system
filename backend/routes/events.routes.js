const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsPath = path.join(__dirname, "../uploads");
const filePath = path.join(__dirname, "../data/eventos.json");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, "[]");
}

function leerEventos() {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data || "[]");
}

function guardarEventos(data) {
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
    const eventos = leerEventos();
    res.json(eventos);
  } catch (error) {
    console.log("ERROR GET EVENTOS:", error);
    res.status(500).json({ message: "Error al obtener eventos" });
  }
});

router.post("/", upload.single("imagen"), (req, res) => {
  try {
    const { nombre, fecha, tipo, personas, estado, descripcion } = req.body;

    const eventos = leerEventos();

    const nuevoEvento = {
      id: Date.now(),
      nombre: nombre || "",
      fecha: fecha || "",
      tipo: tipo || "",
      personas: Number(personas || 0),
      estado: estado || "Pendiente",
      descripcion: descripcion || "",
      imagen: req.file ? req.file.filename : ""
    };

    eventos.push(nuevoEvento);
    guardarEventos(eventos);

    res.json(nuevoEvento);
  } catch (error) {
    console.log("ERROR POST EVENTO:", error);
    res.status(500).json({ message: "Error al crear evento" });
  }
});

router.put("/:id", upload.single("imagen"), (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, fecha, tipo, personas, estado, descripcion } = req.body;

    let eventos = leerEventos();
    const index = eventos.findIndex((ev) => String(ev.id) === String(id));

    if (index === -1) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }

    const actual = eventos[index];
    let nuevaImagen = actual.imagen || "";

    if (req.file) {
      nuevaImagen = req.file.filename;

      if (actual.imagen) {
        const viejaRuta = path.join(uploadsPath, actual.imagen);
        if (fs.existsSync(viejaRuta)) {
          fs.unlinkSync(viejaRuta);
        }
      }
    }

    eventos[index] = {
      ...actual,
      nombre: nombre || "",
      fecha: fecha || "",
      tipo: tipo || "",
      personas: Number(personas || 0),
      estado: estado || "Pendiente",
      descripcion: descripcion || "",
      imagen: nuevaImagen
    };

    guardarEventos(eventos);

    res.json({ message: "Evento actualizado", evento: eventos[index] });
  } catch (error) {
    console.log("ERROR PUT EVENTO:", error);
    res.status(500).json({ message: "Error al actualizar evento" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;

    let eventos = leerEventos();
    const actual = eventos.find((ev) => String(ev.id) === String(id));

    if (actual && actual.imagen) {
      const rutaImagen = path.join(uploadsPath, actual.imagen);
      if (fs.existsSync(rutaImagen)) {
        fs.unlinkSync(rutaImagen);
      }
    }

    eventos = eventos.filter((ev) => String(ev.id) !== String(id));
    guardarEventos(eventos);

    res.json({ message: "Evento eliminado" });
  } catch (error) {
    console.log("ERROR DELETE EVENTO:", error);
    res.status(500).json({ message: "Error al eliminar evento" });
  }
});

module.exports = router;
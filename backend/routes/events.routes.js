const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/eventos.json");

function leerEventos() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]");
  }

  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data || "[]");
}

function guardarEventos(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

router.get("/", (req, res) => {
  try {
    const eventos = leerEventos();
    res.json(eventos);
  } catch (error) {
    console.log("ERROR GET EVENTOS:", error);
    res.status(500).json({ message: "Error al obtener eventos" });
  }
});

router.post("/", (req, res) => {
  try {
    const {
      cliente,
      telefono,
      tipo,
      fecha,
      lugar,
      personas,
      valorTotal,
      abono
    } = req.body;

    const eventos = leerEventos();

    const nuevoEvento = {
      id: Date.now(),
      cliente: cliente || "",
      telefono: telefono || "",
      tipo: tipo || "",
      fecha: fecha || "",
      lugar: lugar || "",
      personas: Number(personas || 0),
      valorTotal: Number(valorTotal || 0),
      abono: Number(abono || 0)
    };

    eventos.push(nuevoEvento);
    guardarEventos(eventos);

    res.json(nuevoEvento);
  } catch (error) {
    console.log("ERROR POST EVENTO:", error);
    res.status(500).json({ message: "Error al crear evento" });
  }
});

router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const {
      cliente,
      telefono,
      tipo,
      fecha,
      lugar,
      personas,
      valorTotal,
      abono
    } = req.body;

    let eventos = leerEventos();

    eventos = eventos.map((ev) =>
      String(ev.id) === String(id)
        ? {
            ...ev,
            cliente: cliente || "",
            telefono: telefono || "",
            tipo: tipo || "",
            fecha: fecha || "",
            lugar: lugar || "",
            personas: Number(personas || 0),
            valorTotal: Number(valorTotal || 0),
            abono: Number(abono || 0)
          }
        : ev
    );

    guardarEventos(eventos);

    res.json({ message: "Evento actualizado" });
  } catch (error) {
    console.log("ERROR PUT EVENTO:", error);
    res.status(500).json({ message: "Error al actualizar evento" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;

    let eventos = leerEventos();
    eventos = eventos.filter((ev) => String(ev.id) !== String(id));

    guardarEventos(eventos);

    res.json({ message: "Evento eliminado" });
  } catch (error) {
    console.log("ERROR DELETE EVENTO:", error);
    res.status(500).json({ message: "Error al eliminar evento" });
  }
});

module.exports = router;
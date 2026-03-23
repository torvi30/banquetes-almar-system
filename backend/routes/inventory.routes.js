const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("inventario funcionando 🔥");
});

module.exports = router;
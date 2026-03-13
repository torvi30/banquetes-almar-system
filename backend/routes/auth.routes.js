const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const db = require("../config/db")

const router = express.Router()

router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body

    const [rows] = await db.query(
      "SELECT * FROM admins WHERE email = ? LIMIT 1",
      [email]
    )

    if (rows.length === 0) {
      return res.status(401).json({ message: "Usuario no encontrado" })
    }

    const admin = rows[0]

    const validPassword = await bcrypt.compare(password, admin.password)

    if (!validPassword) {
      return res.status(401).json({ message: "Contraseña incorrecta" })
    }

    const token = jwt.sign(
      { id: admin.id },
      "secreto_banquetes",
      { expiresIn: "8h" }
    )

    res.json({
      token,
      admin
    })

  } catch (error) {

    console.log(error)

    res.status(500).json({
      message: "Error interno del servidor"
    })

  }

})

module.exports = router
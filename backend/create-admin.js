const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function createAdmin() {
  try {
    const nombre = "Administrador";
    const email = "admin@almar.com";
    const plainPassword = "Admin123";

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await db.query(
      "INSERT INTO admins (nombre, email, password) VALUES (?, ?, ?)",
      [nombre, email, hashedPassword]
    );

    console.log("Admin creado correctamente");
    console.log("Correo:", email);
    console.log("Clave:", plainPassword);
    process.exit();
  } catch (error) {
    console.error("Error creando admin:", error);
    process.exit(1);
  }
}

createAdmin();
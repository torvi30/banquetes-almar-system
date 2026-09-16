/**
 * Script de Creación y Verificación de Administrador en Firebase Auth
 * Uso: node scripts/create-firebase-admin.mjs [email] [password] [displayName]
 * Ejemplo: node scripts/create-firebase-admin.mjs admin@almar.com Admin123* "Alejandro Almar"
 */

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBLOJlgqSaCNdqNJ3S_JWcOUZNVewn1Zt4",
  authDomain: "banquetes-almar.firebaseapp.com",
  projectId: "banquetes-almar",
  storageBucket: "banquetes-almar.firebasestorage.app",
  messagingSenderId: "772135966887",
  appId: "1:772135966887:web:00edc9b908cbbaa7842382",
  measurementId: "G-BY74DG0FTE"
};

const args = process.argv.slice(2);
const email = args[0] || "admin@almar.com";
const password = args[1] || "Admin123*";
const displayName = args[2] || "Alejandro Almar";

console.log("====================================================");
console.log("🔥 BANQUETES ALMAR - PROVISIONING FIREBASE ADMIN");
console.log(`Proyecto Firebase: ${firebaseConfig.projectId}`);
console.log(`Email a verificar/crear: ${email}`);
console.log("====================================================");

async function setupAdmin() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  try {
    // Intentar inicio de sesión primero para ver si ya existe
    console.log("🔍 Comprobando si el usuario ya existe en Firebase Auth...");
    const existing = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ El usuario administrador YA EXISTE y sus credenciales son válidas:");
    console.log(`   UID: ${existing.user.uid}`);
    console.log(`   Email: ${existing.user.email}`);
    console.log(`   Nombre: ${existing.user.displayName || displayName}`);
    console.log("🎉 Listo para iniciar sesión en /admin/login.html");
    process.exit(0);
  } catch (err) {
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      console.log("ℹ️ El usuario no existe aún o contraseña diferente. Intentando crear en Firebase...");
      try {
        const created = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(created.user, { displayName });
        console.log("🎉 ¡Usuario Administrador Creado con Éxito en Firebase Auth!");
        console.log(`   UID: ${created.user.uid}`);
        console.log(`   Email: ${created.user.email}`);
        console.log(`   Nombre: ${displayName}`);
        console.log("👉 Ahora puedes iniciar sesión en el panel de Banquetes Almar.");
        process.exit(0);
      } catch (createErr) {
        if (createErr.code === "auth/email-already-in-use") {
          console.log("⚠️ El correo ya está registrado en Firebase Auth con otra contraseña.");
          console.log("   Puedes restablecerla desde Firebase Console o ejecutar con la contraseña actual.");
        } else {
          console.error("❌ Error al crear usuario:", createErr.code, createErr.message);
        }
        process.exit(1);
      }
    } else {
      console.error("❌ Error al verificar cuenta:", err.code, err.message);
      process.exit(1);
    }
  }
}

setupAdmin();

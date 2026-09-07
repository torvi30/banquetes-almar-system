/**
 * Controlador de Inicio de Sesión Administrativo - Banquetes Almar
 * Utiliza authService compatible con Firebase Auth y modo autónomo.
 */

import { authService } from "./firebase/auth.js";

const form = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor ingresa tu correo y contraseña."
      });
      return;
    }

    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = "Verificando acceso...";
    }

    try {
      const user = await authService.login(email, password);

      Swal.fire({
        icon: "success",
        title: `¡Bienvenido, ${user.nombre}!`,
        text: "Acceso autorizado al sistema de Banquetes Almar.",
        timer: 1400,
        showConfirmButton: false
      }).then(() => {
        window.location.href = "dashboard.html";
      });

    } catch (error) {
      console.error("Error en login:", error);
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: error.message || "Usuario o contraseña inválidos."
      });
    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = "Ingresar al Panel";
      }
    }
  });
}
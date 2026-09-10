/**
 * Banquetes Almar - Sistema Global de Alertas de Gala & Notificaciones VIP
 * Transforma todas las alertas, confirmaciones y avisos en experiencias de lujo SweetAlert2.
 * Estilo obsidian dark (#18181b), acentos en oro gala (#d4af37) y tipografía de alta costura.
 */

(function () {
  "use strict";

  // Objeto de conveniencia global para todo el proyecto
  const AlmarAlert = {
    /**
     * Muestra una alerta de éxito de gala (como la de Anuncio Publicado con Éxito)
     * @param {string} title Título de la alerta
     * @param {string} message Mensaje o HTML explicativo
     * @param {object} options Opciones adicionales de SweetAlert2
     */
    success(title, message = "", options = {}) {
      if (!window.Swal) {
        alert(message ? `${title}\n\n${message}` : title);
        return Promise.resolve({ isConfirmed: true });
      }

      const isHtml = typeof message === "string" && (message.includes("<") || message.includes("\n"));
      return Swal.fire({
        icon: "success",
        title: title || "¡Operación Exitosa!",
        [isHtml ? "html" : "text"]: isHtml && !message.includes("<") 
          ? message.replace(/\n/g, "<br>") 
          : message,
        confirmButtonText: options.confirmButtonText || "Entendido",
        ...options
      });
    },

    /**
     * Muestra una alerta de advertencia / atención de gala
     */
    warning(title, message = "", options = {}) {
      if (!window.Swal) {
        alert(message ? `${title}\n\n${message}` : title);
        return Promise.resolve({ isConfirmed: true });
      }

      const isHtml = typeof message === "string" && (message.includes("<") || message.includes("\n"));
      return Swal.fire({
        icon: "warning",
        title: title || "Aviso Importante",
        [isHtml ? "html" : "text"]: isHtml && !message.includes("<") 
          ? message.replace(/\n/g, "<br>") 
          : message,
        confirmButtonText: options.confirmButtonText || "Entendido",
        ...options
      });
    },

    /**
     * Muestra una alerta de error / problema de gala
     */
    error(title, message = "", options = {}) {
      if (!window.Swal) {
        alert(message ? `${title}\n\n${message}` : title);
        return Promise.resolve({ isConfirmed: true });
      }

      const isHtml = typeof message === "string" && (message.includes("<") || message.includes("\n"));
      return Swal.fire({
        icon: "error",
        title: title || "Atención",
        [isHtml ? "html" : "text"]: isHtml && !message.includes("<") 
          ? message.replace(/\n/g, "<br>") 
          : message,
        confirmButtonText: options.confirmButtonText || "Aceptar",
        ...options
      });
    },

    /**
     * Muestra una alerta informativa de gala
     */
    info(title, message = "", options = {}) {
      if (!window.Swal) {
        alert(message ? `${title}\n\n${message}` : title);
        return Promise.resolve({ isConfirmed: true });
      }

      const isHtml = typeof message === "string" && (message.includes("<") || message.includes("\n"));
      return Swal.fire({
        icon: "info",
        title: title || "Información",
        [isHtml ? "html" : "text"]: isHtml && !message.includes("<") 
          ? message.replace(/\n/g, "<br>") 
          : message,
        confirmButtonText: options.confirmButtonText || "Entendido",
        ...options
      });
    },

    /**
     * Diálogo de confirmación interactivo de gala
     */
    async confirm(title, message = "", confirmText = "Confirmar", cancelText = "Cancelar", isDestructive = false) {
      if (!window.Swal) {
        return window.confirm(message ? `${title}\n\n${message}` : title);
      }

      const res = await Swal.fire({
        icon: isDestructive ? "warning" : "question",
        title,
        text: message,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
        confirmButtonColor: isDestructive ? "#dc2626" : "#d4af37"
      });

      return res.isConfirmed;
    },

    /**
     * Notificación toast flotante de lujo (arriba a la derecha)
     */
    toast(title, icon = "success", durationMs = 2800) {
      if (!window.Swal) return;
      return Swal.fire({
        toast: true,
        position: "top-end",
        icon,
        title,
        showConfirmButton: false,
        timer: durationMs,
        timerProgressBar: true
      });
    }
  };

  // Exponer globalmente
  window.AlmarAlert = AlmarAlert;

  // Interceptar window.alert nativo para que cualquier alerta inesperada sea de gala
  const _nativeAlert = window.alert;
  window.alert = function (message) {
    if (window.Swal) {
      Swal.fire({
        icon: "info",
        title: "Banquetes Almar",
        text: String(message || ""),
        confirmButtonText: "Entendido"
      });
    } else {
      _nativeAlert(message);
    }
  };

  // Interceptar window.confirm nativo cuando se pueda (fallback suave)
  console.log("💎 Sistema de Alertas de Gala Banquetes Almar inicializado.");
})();

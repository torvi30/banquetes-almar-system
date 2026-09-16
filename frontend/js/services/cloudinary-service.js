/**
 * Cloudinary Storage Service - Banquetes Almar
 * Provides client-side direct uploads to Cloudinary CDN with automatic optimization.
 */

const CLOUDINARY_STORAGE_KEY = "almar_cloudinary_config";

// Default configuration with local override support
const DEFAULT_CONFIG = {
  cloudName: "banquetes-almar",
  uploadPreset: "banquetes_almar_preset",
  folder: "banquetes-almar"
};

/**
 * Retrieve current Cloudinary configuration from localStorage or defaults
 * @returns {{cloudName: string, uploadPreset: string, folder: string}}
 */
export function getCloudinaryConfig() {
  try {
    const stored = localStorage.getItem(CLOUDINARY_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (err) {
    console.warn("Cloudinary config read error:", err);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Save Cloudinary configuration
 * @param {{cloudName: string, uploadPreset: string, folder?: string}} config
 */
export function saveCloudinaryConfig(config) {
  const current = getCloudinaryConfig();
  const updated = {
    ...current,
    cloudName: (config.cloudName || current.cloudName).trim(),
    uploadPreset: (config.uploadPreset || current.uploadPreset).trim(),
    folder: (config.folder || current.folder).trim()
  };
  localStorage.setItem(CLOUDINARY_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Check if Cloudinary credentials are set
 * @returns {boolean}
 */
export function isCloudinaryConfigured() {
  const cfg = getCloudinaryConfig();
  return Boolean(cfg.cloudName && cfg.uploadPreset);
}

/**
 * Upload an image file or base64 data string to Cloudinary
 * @param {File|Blob|string} fileSource - File instance, Blob, or base64 data URL
 * @param {Object} [options]
 * @param {string} [options.folder] - Specific subfolder (e.g. 'galeria', 'inventario', 'comprobantes')
 * @param {Function} [options.onProgress] - Optional upload progress callback
 * @returns {Promise<{success: boolean, url: string, publicId: string, format: string, width: number, height: number}>}
 */
export async function uploadImageToCloudinary(fileSource, options = {}) {
  const config = getCloudinaryConfig();

  if (!config.cloudName || !config.uploadPreset) {
    throw new Error(
      "Cloudinary no está configurado. Por favor ingresa tu Cloud Name y Upload Preset."
    );
  }

  const targetFolder = options.folder
    ? `${config.folder}/${options.folder}`
    : config.folder;

  const formData = new FormData();
  formData.append("file", fileSource);
  formData.append("upload_preset", config.uploadPreset);
  if (targetFolder) {
    formData.append("folder", targetFolder);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMsg = result?.error?.message || "Error al subir imagen a Cloudinary.";
      console.error("Cloudinary upload failed:", result);
      throw new Error(errorMsg);
    }

    // Apply auto-format and auto-quality transformation to secure URL
    let optimizedUrl = result.secure_url;
    if (optimizedUrl && optimizedUrl.includes("/upload/")) {
      optimizedUrl = optimizedUrl.replace("/upload/", "/upload/f_auto,q_auto/");
    }

    return {
      success: true,
      url: optimizedUrl,
      rawUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };
  } catch (error) {
    console.error("Cloudinary Upload Exception:", error);
    throw error;
  }
}

/**
 * Cloudinary configuration prompt modal via SweetAlert2
 */
export async function openCloudinaryConfigModal() {
  const current = getCloudinaryConfig();

  if (typeof Swal === "undefined") {
    alert(`Cloudinary actual: Cloud Name: ${current.cloudName}, Preset: ${current.uploadPreset}`);
    return;
  }

  const { value: formValues } = await Swal.fire({
    title: "Configuración de Cloudinary",
    html: `
      <div style="text-align: left; font-size: 0.9rem; color: #ccc;">
        <p style="margin-bottom: 1rem;">Ingresa tus credenciales de Cloudinary para el almacenamiento en la nube de imágenes.</p>
        <div style="margin-bottom: 0.8rem;">
          <label style="display: block; margin-bottom: 0.3rem; font-weight: 600; color: #d4af37;">Cloud Name:</label>
          <input id="swal-cloud-name" class="swal2-input" style="width: 100%; margin: 0; box-sizing: border-box; background: #1a1a1f; color: #fff; border: 1px solid #444;" value="${current.cloudName || ""}" placeholder="Ej: banquetes-almar" />
        </div>
        <div style="margin-bottom: 0.8rem;">
          <label style="display: block; margin-bottom: 0.3rem; font-weight: 600; color: #d4af37;">Upload Preset (Unsigned):</label>
          <input id="swal-upload-preset" class="swal2-input" style="width: 100%; margin: 0; box-sizing: border-box; background: #1a1a1f; color: #fff; border: 1px solid #444;" value="${current.uploadPreset || ""}" placeholder="Ej: banquetes_almar_preset" />
        </div>
        <div>
          <label style="display: block; margin-bottom: 0.3rem; font-weight: 600; color: #d4af37;">Carpeta Raíz:</label>
          <input id="swal-folder" class="swal2-input" style="width: 100%; margin: 0; box-sizing: border-box; background: #1a1a1f; color: #fff; border: 1px solid #444;" value="${current.folder || "banquetes-almar"}" placeholder="banquetes-almar" />
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Guardar Credenciales",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d4af37",
    background: "#121214",
    color: "#fff",
    preConfirm: () => {
      const cloudName = document.getElementById("swal-cloud-name").value.trim();
      const uploadPreset = document.getElementById("swal-upload-preset").value.trim();
      const folder = document.getElementById("swal-folder").value.trim() || "banquetes-almar";

      if (!cloudName || !uploadPreset) {
        Swal.showValidationMessage("Debes ingresar el Cloud Name y el Upload Preset.");
        return false;
      }
      return { cloudName, uploadPreset, folder };
    }
  });

  if (formValues) {
    saveCloudinaryConfig(formValues);
    Swal.fire({
      icon: "success",
      title: "Configuración Guardada",
      text: "Las credenciales de Cloudinary se han actualizado correctamente.",
      background: "#121214",
      color: "#fff",
      confirmButtonColor: "#d4af37"
    });
  }
}

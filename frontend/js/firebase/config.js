/**
 * Configuración Oficial del SDK de Firebase para Banquetes Almar (Marinilla, Antioquia).
 * Conectado en vivo al proyecto: banquetes-almar
 */

export const firebaseConfig = {
  apiKey: "AIzaSyBLOJlgqSaCNdqNJ3S_JWcOUZNVewn1Zt4",
  authDomain: "banquetes-almar.firebaseapp.com",
  projectId: "banquetes-almar",
  storageBucket: "banquetes-almar.firebasestorage.app",
  messagingSenderId: "772135966887",
  appId: "1:772135966887:web:00edc9b908cbbaa7842382",
  measurementId: "G-BY74DG0FTE"
};

export const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith("AIzaSy");
};

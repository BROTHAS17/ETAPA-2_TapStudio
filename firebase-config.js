/**
 * firebase-config.js
 * -------------------------------------------------------------------------
 * Configuración COMPARTIDA de Firebase para el proyecto "Tiendita".
 * Este archivo se incluye (con <script>) ANTES de js/ventas.js en ventas.html,
 * y expone la instancia de Firestore como window.db para que cualquier
 * módulo del equipo (ventas, productos, usuarios, etc.) pueda reutilizarla.
 *
 * ⚠️ IMPORTANTE PARA EL EQUIPO:
 * Reemplacen los valores de firebaseConfig por los reales del proyecto en
 * la Consola de Firebase (Configuración del proyecto > Tus apps > SDK).
 * Si ya existe un archivo de configuración compartido en el repositorio,
 * usen ese en su lugar y eliminen este bloque para evitar dos inicializaciones.
 * -------------------------------------------------------------------------
 */
 
// TODO: reemplazar con la configuración real del proyecto Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID",
};
 
// Evita reinicializar la app si este archivo llegara a incluirse más de una vez
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
 
// Instancia de Firestore compartida por todo el proyecto
const db = firebase.firestore();
 
// Nombres de colecciones centralizados (evita "strings mágicos" repetidos)
const COLECCIONES = {
  PRODUCTOS: "tiendita_productos",
  VENTAS: "tiendita_ventas",
};
 
// Se exponen en window para que ventas.js (script clásico, no módulo) los use
window.db = db;
window.COLECCIONES = COLECCIONES;
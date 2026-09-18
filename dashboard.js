// =========================
// CONTROL DE SESIÓN
// =========================
const sesion = JSON.parse(localStorage.getItem("tiendita_sesion"));

if (!sesion) {
    window.location.href = "login.html";
}

// Mostrar usuario
document.getElementById("userName").textContent = `${sesion.nombre} (${sesion.rol})`;

// Ocultar elementos admin si es vendedor
if (sesion.rol === "vendedor") {
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("tiendita_sesion");
    window.location.href = "login.html";
});

// =========================
// NAVBAR RESPONSIVA
// =========================
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
});

// =========================
// CÁLCULO DE KPIs
// =========================
const ventas = JSON.parse(localStorage.getItem("tiendita_ventas")) || [];
const catalogo = JSON.parse(localStorage.getItem("tiendita_catalogo")) || [];

const hoy = new Date().toISOString().slice(0, 10);

// Ventas del día
const totalDia = ventas
    .filter(v => v.fecha.startsWith(hoy))
    .reduce((acc, v) => acc + v.total, 0);

// Transacciones
const transacciones = ventas.length;

// Productos activos
const productosActivos = catalogo.length;

// Stock crítico
const stockCritico = catalogo.filter(p => p.stock <= p.minimo).length;

// =========================
// RENDER KPIs
// =========================
document.getElementById("kpiVentasDia").textContent = `$${totalDia.toFixed(2)}`;
document.getElementById("kpiTransacciones").textContent = transacciones;
document.getElementById("kpiProductos").textContent = productosActivos;
document.getElementById("kpiStockCritico").textContent = stockCritico;

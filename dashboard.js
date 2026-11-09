const sesion = JSON.parse(localStorage.getItem("tiendita_sesion"));

if (!sesion) {
    window.location.href = "login.html";
}

document.getElementById("userName").textContent = `${sesion.nombre} (${sesion.rol})`;

if (sesion.rol === "vendedor") {
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");
}

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("tiendita_sesion");
    window.location.href = "login.html";
});

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
});

const ventas = JSON.parse(localStorage.getItem("tiendita_ventas")) || [];
const catalogo = JSON.parse(localStorage.getItem("tiendita_catalogo")) || [];

const hoy = new Date().toISOString().slice(0, 10);

const totalDia = ventas
    .filter(v => v.fecha.startsWith(hoy))
    .reduce((acc, v) => acc + v.total, 0);

const transacciones = ventas.length;

const productosActivos = catalogo.length;

const stockCritico = catalogo.filter(p => p.stock <= p.minimo).length;

document.getElementById("kpiVentasDia").textContent = `$${totalDia.toFixed(2)}`;
document.getElementById("kpiTransacciones").textContent = transacciones;
document.getElementById("kpiProductos").textContent = productosActivos;
document.getElementById("kpiStockCritico").textContent = stockCritico;

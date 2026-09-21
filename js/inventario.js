const sesion = JSON.parse(localStorage.getItem("tiendita_sesion"));

if (!sesion) {
    window.location.href = "MiTiendita/login.html";
} else {
    document.getElementById("userName").textContent = `${sesion.nombre} (${sesion.rol})`;

    if (sesion.rol === "vendedor") {
        document.querySelectorAll(".admin-only").forEach(function (elemento) {
            elemento.style.display = "none";
        });
    }

    document.getElementById("logoutBtn").addEventListener("click", function () {
        localStorage.removeItem("tiendita_sesion");
        window.location.href = "MiTiendita/login.html";
    });
}

let productos = JSON.parse(localStorage.getItem("tiendita_productos")) || [];

const tablaInventario = document.getElementById("tablaInventario");
const valorInventario = document.getElementById("valorInventario");
const productosAlerta = document.getElementById("productosAlerta");
const productoEntrada = document.getElementById("productoEntrada");
const cantidadEntrada = document.getElementById("cantidadEntrada");
const formEntrada = document.getElementById("formEntrada");

function mostrarInventario() {
    tablaInventario.innerHTML = "";
    productos.forEach(function (producto) {
        const fila = document.createElement("tr");
        const critico = Number(producto.stock) <= Number(producto.stockMinimo);
        fila.innerHTML = `
            <td>${producto.nombre}</td>
            <td>${producto.categoria}</td>
            <td>$${Number(producto.costo).toFixed(2)}</td>
            <td>${producto.stock}</td>
            <td>${producto.stockMinimo}</td>
            <td><span class="badge ${critico ? "bg-danger" : "bg-success"}">${critico ? "Stock Crítico" : "Nivel Normal"}</span></td>
        `;
        tablaInventario.appendChild(fila);
    });
}

function actualizarIndicadores() {
    const valorTotal = productos.reduce((total, producto) =>
        total + (Number(producto.stock) * Number(producto.costo)), 0);
    const cantidadAlertas = productos.filter(producto =>
        Number(producto.stock) <= Number(producto.stockMinimo)).length;

    valorInventario.textContent = "$" + valorTotal.toFixed(2);
    productosAlerta.textContent = cantidadAlertas;
}

function cargarProductos() {
    productoEntrada.innerHTML = '<option value="">Selecciona un producto</option>';
    productos.forEach(function (producto) {
        const opcion = document.createElement("option");
        opcion.value = producto.id;
        opcion.textContent = `${producto.nombre} - Stock actual: ${producto.stock}`;
        productoEntrada.appendChild(opcion);
    });
}

formEntrada.addEventListener("submit", function (event) {
    event.preventDefault();

    const idProducto = Number(productoEntrada.value);
    const cantidad = Number(cantidadEntrada.value);

    if (!idProducto) {
        alert("Selecciona un producto.");
        return;
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        alert("La cantidad debe ser un número entero positivo.");
        return;
    }

    const producto = productos.find(producto => Number(producto.id) === idProducto);

    if (!producto) {
        alert("No se encontró el producto.");
        return;
    }

    producto.stock = Number(producto.stock) + cantidad;
    localStorage.setItem("tiendita_productos", JSON.stringify(productos));

    mostrarInventario();
    actualizarIndicadores();
    cargarProductos();
    formEntrada.reset();

    alert(`Entrada registrada correctamente.\n\nProducto: ${producto.nombre}\nCantidad ingresada: ${cantidad}\nNuevo stock: ${producto.stock}`);
});

mostrarInventario();
actualizarIndicadores();
cargarProductos();
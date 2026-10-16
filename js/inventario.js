
"use strict";

const LS_SESION = "tiendita_sesion";
const LS_PRODUCTOS = "tiendita_productos";

// Obtener la sesión actual de forma segura.
function obtenerSesion() {
    try {
        return JSON.parse(localStorage.getItem(LS_SESION));
    } catch (error) {
        console.error("No se pudo leer la sesión:", error);
        return null;
    }
}

const sesion = obtenerSesion();

// Validar sesión y configurar la navegación.
if (!sesion) {
    window.location.href = "MiTiendita/login.html";
} else {
    document.getElementById("userName").textContent =
        `${sesion.nombre} (${sesion.rol})`;

    if (sesion.rol === "vendedor") {
        document.querySelectorAll(".admin-only").forEach(elemento => {
            elemento.style.display = "none";
        });
    }

    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem(LS_SESION);
        window.location.href = "MiTiendita/login.html";
    });
}

// Inicializar el módulo únicamente si existe una sesión.
if (sesion) {
    iniciarInventario();
}

function iniciarInventario() {
    const tablaInventario = document.getElementById("tablaInventario");
    const valorInventario = document.getElementById("valorInventario");
    const productosAlerta = document.getElementById("productosAlerta");
    const productoEntrada = document.getElementById("productoEntrada");
    const cantidadEntrada = document.getElementById("cantidadEntrada");
    const formEntrada = document.getElementById("formEntrada");
    const mensajeEntrada = document.getElementById("mensajeEntrada");

    let productos = [];

    // Leer los productos almacenados.
    function leerProductos() {
        try {
            const datos = JSON.parse(
                localStorage.getItem(LS_PRODUCTOS)
            );

            return Array.isArray(datos) ? datos : [];
        } catch (error) {
            console.error("No se pudieron leer los productos:", error);
            return [];
        }
    }

    // Mostrar mensajes de validación y confirmación.
    function mostrarMensaje(texto, tipo = "success") {
        mensajeEntrada.textContent = texto;
        mensajeEntrada.className = `alert alert-${tipo} mt-3`;
    }

    function limpiarMensaje() {
        mensajeEntrada.textContent = "";
        mensajeEntrada.className = "mt-3";
    }

    function limpiarErrores() {
        productoEntrada.classList.remove("is-invalid", "is-valid");
        cantidadEntrada.classList.remove("is-invalid", "is-valid");
        limpiarMensaje();
    }

    // Guardar los cambios sin modificar otras claves del almacenamiento.
    function guardarProductos() {
        try {
            localStorage.setItem(
                LS_PRODUCTOS,
                JSON.stringify(productos)
            );

            return true;
        } catch (error) {
            console.error("Error al guardar el inventario:", error);

            mostrarMensaje(
                "No se pudieron guardar los cambios. Verifica el almacenamiento disponible.",
                "danger"
            );

            return false;
        }
    }

    // Dibujar la tabla de existencias.
    function mostrarInventario() {
        tablaInventario.innerHTML = "";

        if (productos.length === 0) {
            const fila = document.createElement("tr");
            const celda = document.createElement("td");

            celda.colSpan = 6;
            celda.className = "text-center text-muted py-4";
            celda.textContent = "No hay productos registrados.";

            fila.appendChild(celda);
            tablaInventario.appendChild(fila);
            return;
        }

        productos.forEach(producto => {
            const fila = document.createElement("tr");

            const nombre = document.createElement("td");
            nombre.textContent = producto.nombre ?? "";

            const categoria = document.createElement("td");
            categoria.textContent = producto.categoria ?? "";

            const costo = document.createElement("td");
            const costoNumerico = Number(producto.costo);

            costo.textContent = Number.isFinite(costoNumerico)
                ? `$${costoNumerico.toFixed(2)}`
                : "No disponible";

            const stock = document.createElement("td");
            stock.textContent = producto.stock ?? 0;

            const minimo = document.createElement("td");
            minimo.textContent = producto.stockMinimo ?? 0;

            const estado = document.createElement("td");
            const stockNumerico = Number(producto.stock);
            const minimoNumerico = Number(producto.stockMinimo);

            const critico =
                Number.isFinite(stockNumerico) &&
                Number.isFinite(minimoNumerico) &&
                stockNumerico <= minimoNumerico;

            const insignia = document.createElement("span");
            insignia.className =
                `badge ${critico ? "bg-danger" : "bg-success"}`;

            insignia.textContent = critico
                ? "Stock Crítico"
                : "Nivel Normal";

            estado.appendChild(insignia);

            [
                nombre,
                categoria,
                costo,
                stock,
                minimo,
                estado
            ].forEach(celda => fila.appendChild(celda));

            tablaInventario.appendChild(fila);
        });
    }

    // Calcular el valor del inventario y las alertas.
    function actualizarIndicadores() {
        const valorTotal = productos.reduce((total, producto) => {
            const stock = Number(producto.stock);
            const costo = Number(producto.costo);

            if (
                Number.isFinite(stock) &&
                Number.isFinite(costo)
            ) {
                return total + stock * costo;
            }

            return total;
        }, 0);

        const cantidadAlertas = productos.filter(producto => {
            const stock = Number(producto.stock);
            const minimo = Number(producto.stockMinimo);

            return (
                Number.isFinite(stock) &&
                Number.isFinite(minimo) &&
                stock <= minimo
            );
        }).length;

        valorInventario.textContent = `$${valorTotal.toFixed(2)}`;
        productosAlerta.textContent = cantidadAlertas;
    }

    // Cargar productos disponibles en el selector.
    function cargarProductos() {
        productoEntrada.innerHTML = "";

        const opcionInicial = document.createElement("option");
        opcionInicial.value = "";
        opcionInicial.textContent = "Selecciona un producto";

        productoEntrada.appendChild(opcionInicial);

        productos.forEach(producto => {
            const opcion = document.createElement("option");

            opcion.value = String(producto.id);
            opcion.textContent =
                `${producto.nombre} - Stock actual: ${producto.stock}`;

            productoEntrada.appendChild(opcion);
        });
    }

    // Actualizar la información que se muestra en pantalla.
    function refrescarInventario() {
        productos = leerProductos();

        mostrarInventario();
        actualizarIndicadores();
        cargarProductos();
    }

    // Validar la selección del producto.
    productoEntrada.addEventListener("change", () => {
        productoEntrada.classList.toggle(
            "is-invalid",
            productoEntrada.value === ""
        );

        limpiarMensaje();
    });

    // Validar la cantidad ingresada.
    cantidadEntrada.addEventListener("input", () => {
        const cantidadTexto = cantidadEntrada.value.trim();
        const cantidad = Number(cantidadTexto);

        const invalida =
            cantidadTexto === "" ||
            !Number.isSafeInteger(cantidad) ||
            cantidad <= 0;

        cantidadEntrada.classList.toggle("is-invalid", invalida);

        limpiarMensaje();
    });

    // Procesar el registro de una entrada de inventario.
    formEntrada.addEventListener("submit", event => {
        event.preventDefault();
        limpiarErrores();

        const idSeleccionado = productoEntrada.value;
        const cantidadTexto = cantidadEntrada.value.trim();
        const cantidad = Number(cantidadTexto);

        let valido = true;

        if (idSeleccionado === "") {
            productoEntrada.classList.add("is-invalid");
            valido = false;
        }

        if (
            cantidadTexto === "" ||
            !Number.isSafeInteger(cantidad) ||
            cantidad <= 0
        ) {
            cantidadEntrada.classList.add("is-invalid");
            valido = false;
        }

        if (!valido) {
            mostrarMensaje(
                "Corrige los campos señalados antes de continuar.",
                "danger"
            );

            return;
        }

        // Leer nuevamente los productos antes de actualizar el stock.
        productos = leerProductos();

        const producto = productos.find(
            elemento => String(elemento.id) === idSeleccionado
        );

        if (!producto) {
            refrescarInventario();
            productoEntrada.classList.add("is-invalid");

            mostrarMensaje(
                "El producto ya no está disponible. Selecciónalo nuevamente.",
                "danger"
            );

            return;
        }

        const stockActual = Number(producto.stock);

        if (
            !Number.isSafeInteger(stockActual) ||
            stockActual < 0 ||
            !Number.isSafeInteger(stockActual + cantidad)
        ) {
            mostrarMensaje(
                "No se puede registrar la entrada porque las existencias no son válidas o exceden el límite permitido.",
                "danger"
            );

            return;
        }

        // Actualizar las existencias.
        const stockAnterior = producto.stock;
        producto.stock = stockActual + cantidad;

        // Si no se puede guardar, restaurar el valor en memoria.
        if (!guardarProductos()) {
            producto.stock = stockAnterior;
            return;
        }

        const nombreProducto = producto.nombre;
        const nuevoStock = producto.stock;

        // Actualizar tabla, indicadores y selector.
        refrescarInventario();

        formEntrada.reset();
        limpiarErrores();

        mostrarMensaje(
            `Entrada registrada correctamente: ${cantidad} unidades de ${nombreProducto}. Nuevo stock: ${nuevoStock}.`,
            "success"
        );
    });

    // Carga inicial del módulo.
    refrescarInventario();
}

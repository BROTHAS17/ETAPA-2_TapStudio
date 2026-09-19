// =========================
// CONTROL DE SESIÓN
// =========================

const sesion = JSON.parse(localStorage.getItem("tiendita_sesion"));

if (!sesion) {
    window.location.href = "login.html";
}

// Mostrar usuario
document.getElementById("userName").textContent =
    `${sesion.nombre} (${sesion.rol})`;

// Ocultar elementos de administrador si es vendedor
if (sesion.rol === "vendedor") {
    document.querySelectorAll(".admin-only").forEach(function (elemento) {
        elemento.style.display = "none";
    });
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem("tiendita_sesion");
    window.location.href = "login.html";
});


// =========================
// DATOS DEL INVENTARIO
// =========================

let productos =
    JSON.parse(localStorage.getItem("tiendita_productos")) || [];


// =========================
// ELEMENTOS DEL HTML
// =========================

const tablaInventario =
    document.getElementById("tablaInventario");

const valorInventario =
    document.getElementById("valorInventario");

const productosAlerta =
    document.getElementById("productosAlerta");

const productoEntrada =
    document.getElementById("productoEntrada");

const cantidadEntrada =
    document.getElementById("cantidadEntrada");

const formEntrada =
    document.getElementById("formEntrada");


// =========================
// MOSTRAR PRODUCTOS EN LA TABLA
// =========================

function mostrarInventario() {

    tablaInventario.innerHTML = "";

    productos.forEach(function (producto) {

        const fila = document.createElement("tr");

        let estado;
        let claseEstado;

        if (producto.stock <= producto.stockMinimo) {

            estado = "Stock Crítico";
            claseEstado = "bg-danger";

        } else {

            estado = "Nivel Normal";
            claseEstado = "bg-success";
        }

        fila.innerHTML = `
            <td>${producto.nombre}</td>

            <td>${producto.categoria}</td>

            <td>$${producto.costo.toFixed(2)}</td>

            <td>${producto.stock}</td>

            <td>${producto.stockMinimo}</td>

            <td>
                <span class="badge ${claseEstado}">
                    ${estado}
                </span>
            </td>
        `;

        tablaInventario.appendChild(fila);
    });
}


// =========================
// CALCULAR INDICADORES
// =========================

function actualizarIndicadores() {

    // Valor total del inventario
    const valorTotal = productos.reduce(function (total, producto) {

        return total + (producto.stock * producto.costo);

    }, 0);


    // Productos con stock crítico
    const cantidadAlertas = productos.filter(function (producto) {

        return producto.stock <= producto.stockMinimo;

    }).length;


    // Mostrar resultados
    valorInventario.textContent =
        `$${valorTotal.toFixed(2)}`;

    productosAlerta.textContent =
        cantidadAlertas;
}


// =========================
// CARGAR PRODUCTOS EN SELECT
// =========================

function cargarProductos() {

    productoEntrada.innerHTML = `
        <option value="">
            Selecciona un producto
        </option>
    `;

    productos.forEach(function (producto) {

        const opcion = document.createElement("option");

        opcion.value = producto.id;
        opcion.textContent =
            `${producto.nombre} - Stock actual: ${producto.stock}`;

        productoEntrada.appendChild(opcion);
    });
}


// =========================
// REGISTRAR ENTRADA DE MERCANCÍA
// =========================

formEntrada.addEventListener("submit", function (event) {

    event.preventDefault();

    const idProducto = Number(productoEntrada.value);
    const cantidad = Number(cantidadEntrada.value);


    // Validar producto
    if (!idProducto) {

        alert("Selecciona un producto.");

        return;
    }


    // Validar cantidad
    if (!Number.isInteger(cantidad) || cantidad <= 0) {

        alert("La cantidad debe ser un número entero positivo.");

        return;
    }


    // Buscar producto
    const producto = productos.find(function (producto) {

        return producto.id === idProducto;

    });


    if (!producto) {

        alert("No se encontró el producto.");

        return;
    }


    // Aumentar stock
    producto.stock += cantidad;


    // Guardar cambios
    localStorage.setItem(
        "tiendita_productos",
        JSON.stringify(productos)
    );


    // Actualizar interfaz
    mostrarInventario();
    actualizarIndicadores();
    cargarProductos();


    // Limpiar formulario
    formEntrada.reset();


    alert(
        `Entrada registrada correctamente.\n\n` +
        `Producto: ${producto.nombre}\n` +
        `Cantidad ingresada: ${cantidad}\n` +
        `Nuevo stock: ${producto.stock}`
    );

});


// =========================
// INICIALIZAR INVENTARIO
// =========================

mostrarInventario();
actualizarIndicadores();
cargarProductos();
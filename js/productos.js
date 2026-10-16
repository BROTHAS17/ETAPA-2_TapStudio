
"use strict";

const LS_PRODUCTOS = "tiendita_productos";
const LS_SESION = "tiendita_sesion";

function leerProductos() {
    try {
        const datos = JSON.parse(localStorage.getItem(LS_PRODUCTOS));
        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
}

function guardarProductos(productos) {
    localStorage.setItem(LS_PRODUCTOS, JSON.stringify(productos));
}

let sesion;

try {
    sesion = JSON.parse(localStorage.getItem(LS_SESION));
} catch {
    sesion = null;
}

if (!sesion) {
    window.location.href = "login.html";
} else {
    let productos = leerProductos();
    let productoEditando = null;

    const listaProductos = document.getElementById("listaProductos");
    const formProducto = document.getElementById("formProducto");
    const buscador = document.getElementById("buscador");
    const modalElemento = document.getElementById("modalProducto");
    const modal = bootstrap.Modal.getOrCreateInstance(modalElemento);
    const tituloModal = document.getElementById("tituloModal");
    const botonGuardar = formProducto.querySelector(
        'button[type="submit"]'
    );

    const campos = {
        nombre: document.getElementById("nombre"),
        categoria: document.getElementById("categoria"),
        costo: document.getElementById("costo"),
        precio: document.getElementById("precio"),
        stock: document.getElementById("stock"),
        stockMinimo: document.getElementById("stockMinimo")
    };

    function limpiarErrores() {
        Object.values(campos).forEach(campo => {
            campo.classList.remove("is-invalid");
            campo.setCustomValidity("");
        });
    }

    function marcarError(campo, mensaje) {
        campo.classList.add("is-invalid");
        campo.setCustomValidity(mensaje);
    }

    function validarFormulario() {
        limpiarErrores();

        let valido = true;

        const nombre = campos.nombre.value.trim();
        const categoria = campos.categoria.value;
        const costoTexto = campos.costo.value.trim();
        const precioTexto = campos.precio.value.trim();
        const stockTexto = campos.stock.value.trim();
        const minimoTexto = campos.stockMinimo.value.trim();

        const costo = Number(costoTexto);
        const precio = Number(precioTexto);
        const stock = Number(stockTexto);
        const stockMinimo = Number(minimoTexto);

        if (!nombre) {
            marcarError(campos.nombre, "Ingresa el nombre del producto.");
            valido = false;
        } else {
            const duplicado = productos.some(producto =>
                producto.nombre.trim().toLocaleLowerCase() ===
                    nombre.toLocaleLowerCase() &&
                Number(producto.id) !== Number(productoEditando)
            );

            if (duplicado) {
                marcarError(
                    campos.nombre,
                    "Ya existe un producto con ese nombre."
                );
                valido = false;
            }
        }

        if (!categoria) {
            marcarError(campos.categoria, "Selecciona una categoría.");
            valido = false;
        }

        if (
            costoTexto === "" ||
            !Number.isFinite(costo) ||
            costo <= 0
        ) {
            marcarError(campos.costo, "El costo debe ser mayor que cero.");
            valido = false;
        }

        if (
            precioTexto === "" ||
            !Number.isFinite(precio) ||
            precio <= 0
        ) {
            marcarError(
                campos.precio,
                "El precio debe ser mayor que cero."
            );
            valido = false;
        } else if (
            costoTexto !== "" &&
            Number.isFinite(costo) &&
            costo > 0 &&
            precio <= costo
        ) {
            marcarError(
                campos.precio,
                "El precio debe ser mayor que el costo."
            );
            valido = false;
        }

        if (
            stockTexto === "" ||
            !Number.isInteger(stock) ||
            stock < 0
        ) {
            marcarError(
                campos.stock,
                "El stock debe ser un entero no negativo."
            );
            valido = false;
        }

        if (
            minimoTexto === "" ||
            !Number.isInteger(stockMinimo) ||
            stockMinimo < 0
        ) {
            marcarError(
                campos.stockMinimo,
                "El stock mínimo debe ser un entero no negativo."
            );
            valido = false;
        }

        return valido;
    }

    function crearElemento(etiqueta, texto, clase = "") {
        const elemento = document.createElement(etiqueta);
        elemento.textContent = texto;

        if (clase) {
            elemento.className = clase;
        }

        return elemento;
    }

    function mostrarProductos(lista = productos) {
        listaProductos.replaceChildren();

        if (lista.length === 0) {
            const columna = document.createElement("div");
            columna.className = "col-12";

            columna.appendChild(
                crearElemento(
                    "p",
                    productos.length === 0
                        ? "Todavía no hay productos registrados."
                        : "No se encontraron productos.",
                    "text-muted"
                )
            );

            listaProductos.appendChild(columna);
            return;
        }

        lista.forEach(producto => {
            const columna = document.createElement("div");
            columna.className = "col-md-4";

            const tarjeta = document.createElement("div");
            tarjeta.className = "card h-100 shadow-sm";

            const cuerpo = document.createElement("div");
            cuerpo.className = "card-body";

            cuerpo.appendChild(
                crearElemento("h5", producto.nombre, "card-title")
            );
            cuerpo.appendChild(
                crearElemento(
                    "p",
                    `Categoría: ${producto.categoria}`,
                    "card-text"
                )
            );
            cuerpo.appendChild(
                crearElemento(
                    "p",
                    `Costo: $${Number(producto.costo).toFixed(2)}`,
                    "card-text"
                )
            );
            cuerpo.appendChild(
                crearElemento(
                    "p",
                    `Precio: $${Number(producto.precio).toFixed(2)}`,
                    "card-text"
                )
            );
            cuerpo.appendChild(
                crearElemento(
                    "p",
                    `Margen: $${(
                        Number(producto.precio) -
                        Number(producto.costo)
                    ).toFixed(2)}`,
                    "card-text"
                )
            );
            cuerpo.appendChild(
                crearElemento("p", `Stock: ${producto.stock}`, "card-text")
            );
            cuerpo.appendChild(
                crearElemento(
                    "p",
                    `Stock mínimo: ${producto.stockMinimo}`,
                    "card-text"
                )
            );

            const acciones = document.createElement("div");
            acciones.className = "d-flex gap-2";

            const botonEditar = crearElemento(
                "button",
                "Editar",
                "btn btn-warning"
            );
            botonEditar.type = "button";
            botonEditar.addEventListener("click", () => {
                editarProducto(producto.id);
            });

            const botonEliminar = crearElemento(
                "button",
                "Eliminar",
                "btn btn-danger"
            );
            botonEliminar.type = "button";
            botonEliminar.addEventListener("click", () => {
                eliminarProducto(producto.id);
            });

            acciones.append(botonEditar, botonEliminar);
            cuerpo.appendChild(acciones);
            tarjeta.appendChild(cuerpo);
            columna.appendChild(tarjeta);
            listaProductos.appendChild(columna);
        });
    }

    function abrirNuevoProducto() {
        productoEditando = null;
        formProducto.reset();
        limpiarErrores();

        tituloModal.textContent = "Nuevo producto";
        botonGuardar.textContent = "Guardar producto";
    }

    function editarProducto(id) {
        const producto = productos.find(
            elemento => Number(elemento.id) === Number(id)
        );

        if (!producto) {
            alert("No se encontró el producto.");
            return;
        }

        productoEditando = producto.id;

        campos.nombre.value = producto.nombre;
        campos.categoria.value = producto.categoria;
        campos.costo.value = producto.costo;
        campos.precio.value = producto.precio;
        campos.stock.value = producto.stock;
        campos.stockMinimo.value = producto.stockMinimo;

        limpiarErrores();

        tituloModal.textContent = "Editar producto";
        botonGuardar.textContent = "Guardar cambios";

        modal.show();
    }

    function eliminarProducto(id) {
        const producto = productos.find(
            elemento => Number(elemento.id) === Number(id)
        );

        if (!producto) {
            alert("No se encontró el producto.");
            return;
        }

        if (!confirm(`¿Deseas eliminar "${producto.nombre}"?`)) {
            return;
        }

        const actualizados = productos.filter(
            elemento => Number(elemento.id) !== Number(id)
        );

        try {
            guardarProductos(actualizados);
            productos = actualizados;
            mostrarProductos(
                productos.filter(producto =>
                    producto.nombre.toLocaleLowerCase().includes(
                        buscador.value.trim().toLocaleLowerCase()
                    )
                )
            );
        } catch (error) {
            console.error(error);
            alert("No se pudo guardar el cambio. Intenta nuevamente.");
        }
    }

    formProducto.addEventListener("submit", function (evento) {
        evento.preventDefault();

        if (!validarFormulario()) {
            const primerError = formProducto.querySelector(".is-invalid");
            primerError?.focus();
            return;
        }

        const datos = {
            nombre: campos.nombre.value.trim(),
            categoria: campos.categoria.value,
            costo: Number(campos.costo.value),
            precio: Number(campos.precio.value),
            stock: Number(campos.stock.value),
            stockMinimo: Number(campos.stockMinimo.value)
        };

        let actualizados;

        if (productoEditando !== null) {
            actualizados = productos.map(producto =>
                Number(producto.id) === Number(productoEditando)
                    ? { ...producto, ...datos }
                    : producto
            );
        } else {
            actualizados = [
                ...productos,
                { id: Date.now(), ...datos }
            ];
        }

        try {
            guardarProductos(actualizados);
            productos = actualizados;

            const textoBusqueda = buscador.value
                .trim()
                .toLocaleLowerCase();

            mostrarProductos(
                productos.filter(producto =>
                    producto.nombre.toLocaleLowerCase().includes(textoBusqueda)
                )
            );

            formProducto.reset();
            limpiarErrores();
            productoEditando = null;
            modal.hide();
        } catch (error) {
            console.error(error);
            alert("No se pudo guardar el producto. Intenta nuevamente.");
        }
    });

    buscador.addEventListener("input", function () {
        const texto = buscador.value.trim().toLocaleLowerCase();

        mostrarProductos(
            productos.filter(producto =>
                producto.nombre.toLocaleLowerCase().includes(texto)
            )
        );
    });

    Object.values(campos).forEach(campo => {
        campo.addEventListener("input", () => {
            campo.classList.remove("is-invalid");
            campo.setCustomValidity("");
        });

        campo.addEventListener("change", () => {
            campo.classList.remove("is-invalid");
            campo.setCustomValidity("");
        });
    });

    modalElemento.addEventListener("hidden.bs.modal", () => {
        formProducto.reset();
        limpiarErrores();
        productoEditando = null;
        tituloModal.textContent = "Nuevo producto";
        botonGuardar.textContent = "Guardar producto";
    });

    document
        .querySelector('[data-bs-target="#modalProducto"]')
        .addEventListener("click", abrirNuevoProducto);

    mostrarProductos();
}

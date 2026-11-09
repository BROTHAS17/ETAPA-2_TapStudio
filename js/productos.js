"use strict";

const LS_PRODUCTOS = "tiendita_productos";
const LS_SESION = "tiendita_sesion";

const CATEGORIAS_VALIDAS = [
    "Abarrotes",
    "Bebidas",
    "Snacks",
    "Lácteos",
    "Dulces",
    "Limpieza",
    "Higiene",
    "Otros"
];

function leerProductos() {
    try {
        const datos = JSON.parse(localStorage.getItem(LS_PRODUCTOS));
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        console.error("Error al leer productos de localStorage:", error);
        return [];
    }
}

function guardarProductos(productos) {
    try {
        localStorage.setItem(LS_PRODUCTOS, JSON.stringify(productos));

        if (typeof window !== "undefined") {
            window.dispatchEvent(
                new CustomEvent("tienditaDatosActualizados", {
                    detail: { clave: LS_PRODUCTOS }
                })
            );
        }

        return true;
    } catch (error) {
        console.error("Error al guardar productos en localStorage:", error);
        return false;
    }
}

function obtenerSesion() {
    try {
        return JSON.parse(localStorage.getItem(LS_SESION));
    } catch (error) {
        console.error("Error al leer la sesion:", error);
        return null;
    }
}

function cerrarSesionUsuario() {
    localStorage.removeItem(LS_SESION);
    window.location.href = "MiTiendita/login.html";
}

function validarProducto(producto, productosExistentes = [], idEditando = null) {
    const errores = {};

    const nombre = String(producto.nombre || "").trim();
    const categoria = String(producto.categoria || "").trim();
    const costo = Number(producto.costo);
    const precio = Number(producto.precio);
    const stock = Number(producto.stock);
    const stockMinimo = Number(producto.stockMinimo);

    if (!nombre) {
        errores.nombre = "Ingresa el nombre del producto.";
    } else {
        const duplicado = productosExistentes.some(p =>
            p.nombre.trim().toLowerCase() === nombre.toLowerCase() &&
            String(p.id) !== String(idEditando)
        );

        if (duplicado) {
            errores.nombre = "Ya existe un producto registrado con ese mismo nombre.";
        }
    }

    if (!categoria) {
        errores.categoria = "Selecciona una categoría válida.";
    }

    if (producto.costo === "" || producto.costo === null || isNaN(costo) || costo <= 0) {
        errores.costo = "El costo debe ser un número mayor a $0.00.";
    }

    if (producto.precio === "" || producto.precio === null || isNaN(precio) || precio <= 0) {
        errores.precio = "El precio de venta debe ser mayor a $0.00.";
    } else if (!isNaN(costo) && costo > 0 && precio <= costo) {
        errores.precio = "El precio de venta debe ser estrictamente mayor que el costo de adquisición.";
    }

    if (producto.stock === "" || producto.stock === null || !Number.isInteger(stock) || stock < 0) {
        errores.stock = "El stock debe ser un número entero mayor o igual a 0.";
    }

    if (producto.stockMinimo === "" || producto.stockMinimo === null || !Number.isInteger(stockMinimo) || stockMinimo < 0) {
        errores.stockMinimo = "El stock mínimo debe ser un número entero mayor o igual a 0.";
    }

    return {
        valido: Object.keys(errores).length === 0,
        errores: errores
    };
}

if (typeof window !== "undefined") {
    window.LS_PRODUCTOS = LS_PRODUCTOS;
    window.LS_SESION = LS_SESION;
    window.CATEGORIAS_VALIDAS = CATEGORIAS_VALIDAS;
    window.leerProductos = leerProductos;
    window.guardarProductos = guardarProductos;
    window.obtenerSesion = obtenerSesion;
    window.cerrarSesionUsuario = cerrarSesionUsuario;
    window.validarProducto = validarProducto;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        LS_PRODUCTOS,
        LS_SESION,
        CATEGORIAS_VALIDAS,
        leerProductos,
        guardarProductos,
        obtenerSesion,
        cerrarSesionUsuario,
        validarProducto
    };
}

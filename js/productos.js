/**
 * Mi Tiendita - Módulo de Productos (Capa de Datos y Consumo de API)
 * Funciones de almacenamiento, validaciones y consumo de Open Food Facts.
 * Compatible con la verificación de sintaxis de Node.js (node --check).
 */

"use strict";

const LS_PRODUCTOS = "tiendita_productos";
const LS_SESION = "tiendita_sesion";

/**
 * Categorías estándar admitidas por el sistema
 */
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

/**
 * Lee la lista de productos de localStorage de forma segura
 * @returns {Array} Arreglo de productos o lista vacía
 */
function leerProductos() {
    try {
        const datos = JSON.parse(localStorage.getItem(LS_PRODUCTOS));
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        console.error("Error al leer productos de localStorage:", error);
        return [];
    }
}

/**
 * Guarda la lista de productos en localStorage
 * @param {Array} productos Arreglo de productos a guardar
 * @returns {boolean} true si se guardó con éxito
 */
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

/**
 * Obtiene los datos de la sesión actual
 * @returns {Object|null}
 */
function obtenerSesion() {
    try {
        return JSON.parse(localStorage.getItem(LS_SESION));
    } catch (error) {
        console.error("Error al leer la sesión:", error);
        return null;
    }
}

/**
 * Cierra la sesión activa y redirige al login
 */
function cerrarSesionUsuario() {
    localStorage.removeItem(LS_SESION);
    window.location.href = "MiTiendita/login.html";
}

/**
 * Mapea las categorías de Open Food Facts a una categoría del sistema
 * @param {string} categoriasTexto Cadena con categorías devueltas por la API
 * @returns {string} Categoría asignada
 */
function mapearCategoriaOpenFoodFacts(categoriasTexto) {
    if (!categoriasTexto || typeof categoriasTexto !== "string") {
        return "Otros";
    }

    const texto = categoriasTexto.toLowerCase();

    if (texto.includes("beverage") || texto.includes("boisson") || texto.includes("bebida") || texto.includes("juice") || texto.includes("soda") || texto.includes("water") || texto.includes("agua")) {
        return "Bebidas";
    }
    if (texto.includes("snack") || texto.includes("chips") || texto.includes("biscuit") || texto.includes("galleta") || texto.includes("papas") || texto.includes("fritura")) {
        return "Snacks";
    }
    if (texto.includes("dairy") || texto.includes("lait") || texto.includes("leche") || texto.includes("cheese") || texto.includes("queso") || texto.includes("yogurt") || texto.includes("yogur")) {
        return "Lácteos";
    }
    if (texto.includes("sweet") || texto.includes("chocolate") || texto.includes("candy") || texto.includes("dulce") || texto.includes("confectionery") || texto.includes("caramelo")) {
        return "Dulces";
    }
    if (texto.includes("cleaning") || texto.includes("limpieza") || texto.includes("detergent") || texto.includes("soap") || texto.includes("jabón")) {
        return "Limpieza";
    }
    if (texto.includes("hygiene") || texto.includes("higiene") || texto.includes("shampoo") || texto.includes("toothpaste") || texto.includes("dental") || texto.includes("papel")) {
        return "Higiene";
    }
    if (texto.includes("grocery") || texto.includes("groceries") || texto.includes("rice") || texto.includes("arroz") || texto.includes("oil") || texto.includes("aceite") || texto.includes("pasta") || texto.includes("flour") || texto.includes("harina") || texto.includes("cereal") || texto.includes("grain") || texto.includes("pan") || texto.includes("bread")) {
        return "Abarrotes";
    }

    return "Otros";
}

/**
 * Realiza la consulta a la API externa de Open Food Facts por código de barras.
 * Muestra cómo consumir una API REST real con fetch y manejo de errores.
 *
 * @param {string} codigoBarras Código de barras a buscar (numérico)
 * @returns {Promise<Object>} Resultado con { exito, producto, mensaje, tipoError }
 */
async function consultarOpenFoodFacts(codigoBarras) {
    const codigoLimpio = String(codigoBarras || "").trim();

    if (!codigoLimpio) {
        return {
            exito: false,
            producto: null,
            mensaje: "Por favor ingresa un código de barras para realizar la búsqueda.",
            tipoError: "validacion"
        };
    }

    // Endpoint oficial de Open Food Facts v2
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigoLimpio)}.json`;

    try {
        // Configuramos fetch con un timeout de 8 segundos para no bloquear la interfaz
        const controlador = new AbortController();
        const temporizador = setTimeout(() => controlador.abort(), 8000);

        const respuesta = await fetch(url, {
            signal: controlador.signal,
            headers: {
                "Accept": "application/json"
            }
        });

        clearTimeout(temporizador);

        if (!respuesta.ok) {
            return {
                exito: false,
                producto: null,
                mensaje: `El servidor de Open Food Facts respondió con código de estado ${respuesta.status}.`,
                tipoError: "http"
            };
        }

        const data = await respuesta.json();

        // Open Food Facts devuelve status: 1 cuando el producto existe en su base de datos
        if (data.status === 1 && data.product) {
            const p = data.product;

            // Extraemos los datos más relevantes para el proyecto
            const nombreEncontrado = p.product_name_es || p.product_name || p.generic_name || "Producto sin nombre registrado";
            const marca = p.brands || "";
            const nombreCompleto = marca ? `${nombreEncontrado} (${marca})` : nombreEncontrado;
            const categoriaSugerida = mapearCategoriaOpenFoodFacts(p.categories || p.categories_tags?.join(",") || "");
            const imagenUrl = p.image_front_small_url || p.image_url || "";
            const cantidad = p.quantity || "";

            return {
                exito: true,
                producto: {
                    codigo: data.code || codigoLimpio,
                    nombre: nombreCompleto.trim(),
                    marca: marca,
                    categoria: categoriaSugerida,
                    cantidad: cantidad,
                    imagen: imagenUrl
                },
                mensaje: "Producto encontrado con éxito."
            };
        } else {
            // El producto no existe en la base de datos (status === 0)
            return {
                exito: false,
                producto: null,
                mensaje: `No se encontró ningún artículo con el código "${codigoLimpio}". Puedes ingresar los datos manualmente.`,
                tipoError: "no_encontrado"
            };
        }
    } catch (error) {
        console.error("Error al consultar:", error);

        if (error.name === "AbortError") {
            return {
                exito: false,
                producto: null,
                mensaje: "La consulta tardó demasiado tiempo en responder (tiempo de espera agotado).",
                tipoError: "timeout"
            };
        }

        return {
            exito: false,
            producto: null,
            mensaje: "No fue posible conectar con el catálogo en línea. Revisa tu conexión a internet.",
            tipoError: "red"
        };
    }
}

/**
 * Mapea las categorías y títulos de DummyJSON Groceries a las categorías del sistema
 * @param {Object} p Objeto producto devuelto por DummyJSON
 * @returns {string} Categoría asignada
 */
function mapearCategoriaDummyJSON(p) {
    if (!p) return "Otros";
    const title = String(p.title || "").toLowerCase();
    const cat = String(p.category || "").toLowerCase();

    if (title.includes("juice") || title.includes("drink") || title.includes("water") || title.includes("coffee") || title.includes("tea") || title.includes("beverage")) {
        return "Bebidas";
    }
    if (title.includes("milk") || title.includes("cheese") || title.includes("yogurt") || title.includes("butter")) {
        return "Lácteos";
    }
    if (title.includes("ice cream") || title.includes("candy") || title.includes("chocolate") || title.includes("honey")) {
        return "Dulces";
    }
    if (title.includes("snack") || title.includes("chips") || title.includes("cookie") || title.includes("biscuit")) {
        return "Snacks";
    }
    if (title.includes("tissue") || title.includes("paper") || title.includes("soap") || title.includes("shampoo")) {
        return "Higiene";
    }
    if (cat === "groceries" || title.includes("oil") || title.includes("rice") || title.includes("egg") || title.includes("apple") || title.includes("meat") || title.includes("steak") || title.includes("fish")) {
        return "Abarrotes";
    }
    return "Otros";
}

/**
 * Consulta la API externa DummyJSON Groceries por nombre, categoría o código de barras.
 * Permite autocompletar productos de abarrotes reales con fotografías en alta resolución.
 *
 * @param {string} termino Texto de búsqueda o código de barras
 * @returns {Promise<Object>} Resultado con { exito, producto, mensaje, tipoError, fuente }
 */
async function consultarDummyJSON(termino) {
    const terminoLimpio = String(termino || "").trim();
    if (!terminoLimpio) {
        return {
            exito: false,
            producto: null,
            mensaje: "Por favor ingresa un nombre o código de barras para buscar.",
            tipoError: "validacion"
        };
    }

    // Diccionario de traducción de términos comunes español -> inglés
    const DICCIONARIO = {
        "leche": "milk",
        "cafe": "coffee",
        "café": "coffee",
        "aceite": "oil",
        "arroz": "rice",
        "agua": "water",
        "manzana": "apple",
        "jugo": "juice",
        "refresco": "drinks",
        "gaseosa": "drinks",
        "soda": "drinks",
        "huevo": "egg",
        "huevos": "egg",
        "carne": "meat",
        "pollo": "chicken",
        "pescado": "fish",
        "helado": "ice cream",
        "miel": "honey",
        "pepino": "cucumber",
        "fresa": "strawberry",
        "papa": "potato",
        "papas": "potatoes",
        "limon": "lemon",
        "limón": "lemon",
        "cebolla": "onion",
        "papel": "tissue"
    };

    const terminoMinuscula = terminoLimpio.toLowerCase();
    const terminoBusqueda = DICCIONARIO[terminoMinuscula] || terminoLimpio;

    try {
        const controlador = new AbortController();
        const temporizador = setTimeout(() => controlador.abort(), 7000);

        // 1. Consultamos el catálogo de groceries oficial
        const urlGroceries = "https://dummyjson.com/products/category/groceries";
        const respuesta = await fetch(urlGroceries, {
            signal: controlador.signal
        });
        clearTimeout(temporizador);

        if (!respuesta.ok) {
            return {
                exito: false,
                producto: null,
                mensaje: "El servidor de consulta no respondió correctamente.",
                tipoError: "http"
            };
        }

        const data = await respuesta.json();
        const lista = Array.isArray(data.products) ? data.products : [];

        // Buscamos coincidencia en la lista por código de barras, SKU o título
        let encontrado = lista.find(p => {
            const barcode = String(p.meta?.barcode || "").toLowerCase();
            const sku = String(p.sku || "").toLowerCase();
            const title = String(p.title || "").toLowerCase();
            const q = terminoMinuscula;
            const qEn = terminoBusqueda.toLowerCase();

            return barcode === q ||
                   sku === q ||
                   title === q ||
                   title.includes(qEn) ||
                   title.includes(q);
        });

        // 2. Si no se encontró en groceries y no es puramente numérico, buscamos en el endpoint general
        if (!encontrado && !/^\d+$/.test(terminoLimpio)) {
            const urlSearch = `https://dummyjson.com/products/search?q=${encodeURIComponent(terminoBusqueda)}`;
            const resSearch = await fetch(urlSearch);
            if (resSearch.ok) {
                const dataSearch = await resSearch.json();
                if (dataSearch.products && dataSearch.products.length > 0) {
                    encontrado = dataSearch.products[0];
                }
            }
        }

        if (encontrado) {
            const precioVenta = Number(encontrado.price) || 1.99;
            const costoSugerido = (precioVenta * 0.65).toFixed(2);
            const categoria = mapearCategoriaDummyJSON(encontrado);
            const codigo = encontrado.meta?.barcode || encontrado.sku || String(encontrado.id);

            return {
                exito: true,
                producto: {
                    codigo: codigo,
                    nombre: encontrado.title,
                    categoria: categoria,
                    costo: costoSugerido,
                    precio: precioVenta.toFixed(2),
                    stock: encontrado.stock || 12,
                    stockMinimo: 5,
                    descripcion: encontrado.description || ""
                },
                mensaje: `Producto encontrado: ${encontrado.title}`,
                fuente: "Catálogo sugerido"
            };
        }

        return {
            exito: false,
            producto: null,
            mensaje: `No se encontró ningún artículo para "${terminoLimpio}" en el catálogo sugerido.`,
            tipoError: "no_encontrado"
        };
    } catch (error) {
        console.error("Error al consultar:", error);
        return {
            exito: false,
            producto: null,
            mensaje: "No fue posible conectar con el catálogo en línea. Revisa tu conexión a internet.",
            tipoError: "red"
        };
    }
}

/**
 * Consulta unificada que consulta DummyJSON Groceries como fuente principal,
 * y utiliza Open Food Facts como respaldo si se introduce un código de barras.
 *
 * @param {string} consulta Nombre, palabra clave o código de barras
 * @returns {Promise<Object>} Resultado unificado
 */
async function consultarProductoExterno(consulta) {
    const query = String(consulta || "").trim();
    if (!query) {
        return {
            exito: false,
            producto: null,
            mensaje: "Ingresa un nombre o código de barras para consultar.",
            tipoError: "validacion"
        };
    }

    // 1. Intentamos primero con DummyJSON (Opción 1: Groceries)
    const resDummy = await consultarDummyJSON(query);
    if (resDummy.exito) {
        return resDummy;
    }

    // 2. Si es un código numérico y no se halló en DummyJSON, consultamos Open Food Facts
    if (/^\d{8,14}$/.test(query)) {
        const resOff = await consultarOpenFoodFacts(query);
        if (resOff.exito) {
            return {
                ...resOff,
                fuente: "Open Food Facts"
            };
        }
    }

    return resDummy;
}

/**
 * Valida los campos de un producto antes de guardarlo.
 * Conserva todas las reglas de negocio originales del proyecto:
 * - Nombre requerido y no duplicado.
 * - Categoría requerida.
 * - Costo numérico > 0.
 * - Precio numérico > costo.
 * - Stock entero >= 0.
 * - Stock mínimo entero >= 0.
 *
 * @param {Object} producto Datos del producto a validar
 * @param {Array} productosExistentes Lista actual de productos
 * @param {string|number|null} idEditando ID del producto que se está editando (si aplica)
 * @returns {Object} { valido: boolean, errores: Object }
 */
function validarProducto(producto, productosExistentes = [], idEditando = null) {
    const errores = {};

    const nombre = String(producto.nombre || "").trim();
    const categoria = String(producto.categoria || "").trim();
    const costo = Number(producto.costo);
    const precio = Number(producto.precio);
    const stock = Number(producto.stock);
    const stockMinimo = Number(producto.stockMinimo);

    // Validación del nombre
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

    // Validación de categoría
    if (!categoria) {
        errores.categoria = "Selecciona una categoría válida.";
    }

    // Validación de costo
    if (producto.costo === "" || producto.costo === null || isNaN(costo) || costo <= 0) {
        errores.costo = "El costo debe ser un número mayor a $0.00.";
    }

    // Validación de precio
    if (producto.precio === "" || producto.precio === null || isNaN(precio) || precio <= 0) {
        errores.precio = "El precio de venta debe ser mayor a $0.00.";
    } else if (!isNaN(costo) && costo > 0 && precio <= costo) {
        errores.precio = "El precio de venta debe ser estrictamente mayor que el costo de adquisición.";
    }

    // Validación de stock
    if (producto.stock === "" || producto.stock === null || !Number.isInteger(stock) || stock < 0) {
        errores.stock = "El stock debe ser un número entero mayor o igual a 0.";
    }

    // Validación de stock mínimo
    if (producto.stockMinimo === "" || producto.stockMinimo === null || !Number.isInteger(stockMinimo) || stockMinimo < 0) {
        errores.stockMinimo = "El stock mínimo debe ser un número entero mayor o igual a 0.";
    }

    return {
        valido: Object.keys(errores).length === 0,
        errores: errores
    };
}

// Exportamos en el entorno global para su uso en navegadores o pruebas
if (typeof window !== "undefined") {
    window.LS_PRODUCTOS = LS_PRODUCTOS;
    window.LS_SESION = LS_SESION;
    window.CATEGORIAS_VALIDAS = CATEGORIAS_VALIDAS;
    window.leerProductos = leerProductos;
    window.guardarProductos = guardarProductos;
    window.obtenerSesion = obtenerSesion;
    window.cerrarSesionUsuario = cerrarSesionUsuario;
    window.consultarOpenFoodFacts = consultarOpenFoodFacts;
    window.consultarDummyJSON = consultarDummyJSON;
    window.consultarProductoExterno = consultarProductoExterno;
    window.validarProducto = validarProducto;
    window.mapearCategoriaOpenFoodFacts = mapearCategoriaOpenFoodFacts;
    window.mapearCategoriaDummyJSON = mapearCategoriaDummyJSON;
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
        consultarOpenFoodFacts,
        consultarDummyJSON,
        consultarProductoExterno,
        validarProducto,
        mapearCategoriaOpenFoodFacts,
        mapearCategoriaDummyJSON
    };
}

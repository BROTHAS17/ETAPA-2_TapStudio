/**
 * Servicio de API Externa para DummyJSON Groceries y Open Food Facts
 * Mi Tiendita - Etapa 2
 */

export function mapearCategoriaDummyJSON(p) {
    if (!p) return "Otros";
    const title = String(p.title || "").toLowerCase();
    const cat = String(p.category || "").toLowerCase();

    if (title.includes("juice") || title.includes("drink") || title.includes("water") || title.includes("coffee") || title.includes("tea") || title.includes("beverage")) {
        return "Bebidas";
    }
    if (title.includes("milk") || title.includes("cheese") || title.includes("yogurt") || title.includes("butter")) {
        return "Lacteos";
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

export async function consultarDummyJSON(termino) {
    const terminoLimpio = String(termino || "").trim();
    if (!terminoLimpio) {
        return {
            exito: false,
            producto: null,
            mensaje: "Por favor ingresa un nombre o codigo de barras para buscar.",
            tipoError: "validacion"
        };
    }

    const DICCIONARIO = {
        "leche": "milk",
        "cafe": "coffee",
        "cafe": "coffee",
        "aceite": "oil",
        "arroz": "rice",
        "agua": "water",
        "manzana": "apple",
        "jugo": "juice",
        "refresco": "drinks",
        "huevo": "egg",
        "huevos": "egg",
        "carne": "meat",
        "helado": "ice cream",
        "miel": "honey"
    };

    const terminoMinuscula = terminoLimpio.toLowerCase();
    const terminoBusqueda = DICCIONARIO[terminoMinuscula] || terminoLimpio;

    try {
        const urlGroceries = "https://dummyjson.com/products/category/groceries";
        const respuesta = await fetch(urlGroceries);

        if (!respuesta.ok) {
            return {
                exito: false,
                producto: null,
                mensaje: `Error en el servidor de DummyJSON (${respuesta.status}).`,
                tipoError: "http"
            };
        }

        const data = await respuesta.json();
        const lista = Array.isArray(data.products) ? data.products : [];

        let encontrado = lista.find(p => {
            const barcode = String(p.meta?.barcode || "").toLowerCase();
            const sku = String(p.sku || "").toLowerCase();
            const title = String(p.title || "").toLowerCase();
            const q = terminoMinuscula;
            const qEn = terminoBusqueda.toLowerCase();

            return barcode === q || sku === q || title === q || title.includes(qEn) || title.includes(q);
        });

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
            const imagen = encontrado.thumbnail || (encontrado.images && encontrado.images[0]) || "";

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
                    imagen: imagen,
                    descripcion: encontrado.description || ""
                },
                mensaje: `Producto encontrado en DummyJSON: ${encontrado.title}`,
                fuente: "DummyJSON Groceries"
            };
        }

        return {
            exito: false,
            producto: null,
            mensaje: `No se encontro ningun producto para "${terminoLimpio}" en DummyJSON Groceries.`,
            tipoError: "no_encontrado"
        };
    } catch (error) {
        return {
            exito: false,
            producto: null,
            mensaje: "Error de conexion con la API externa.",
            tipoError: "red"
        };
    }
}

/**
 * Servicio Centralizado para la API Externa Open Food Facts
 * Mi Tiendita - Etapa 2
 *
 * Permite consultar información nutricional y datos generales de productos por código de barras.
 */

/**
 * Mapea las categorías recibidas de Open Food Facts a las categorías estándar de Mi Tiendita
 * @param {string} categoriasTexto Cadena con categorías devueltas por la API
 * @returns {string} Categoría asignada
 */
export function mapearCategoriaOpenFoodFacts(categoriasTexto) {
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
 * Consulta la API pública de Open Food Facts v2 por código de barras.
 * Maneja los estados de éxito, producto no encontrado, error HTTP y error de conexión.
 *
 * @param {string} codigoBarras Código numérico de barras del producto
 * @returns {Promise<Object>} { exito: boolean, producto: Object|null, mensaje: string, tipoError: string|null }
 */
export async function consultarOpenFoodFacts(codigoBarras) {
  const codigoLimpio = String(codigoBarras || "").trim();

  if (!codigoLimpio) {
    return {
      exito: false,
      producto: null,
      mensaje: "Por favor ingresa un código de barras para realizar la búsqueda.",
      tipoError: "validacion"
    };
  }

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigoLimpio)}.json`;

  try {
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

    if (data.status === 1 && data.product) {
      const p = data.product;
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
        mensaje: "Producto encontrado con éxito en Open Food Facts."
      };
    } else {
      return {
        exito: false,
        producto: null,
        mensaje: `No se encontró ningún producto con el código "${codigoLimpio}". Puedes ingresar los datos manualmente.`,
        tipoError: "no_encontrado"
      };
    }
  } catch (error) {
    console.error("Error al consultar Open Food Facts:", error);

    if (error.name === "AbortError") {
      return {
        exito: false,
        producto: null,
        mensaje: "La consulta a Open Food Facts tardó demasiado tiempo en responder (tiempo de espera agotado).",
        tipoError: "timeout"
      };
    }

    return {
      exito: false,
      producto: null,
      mensaje: "No fue posible conectar con el servidor de Open Food Facts. Revisa tu conexión a internet.",
      tipoError: "red"
    };
  }
}

(function () {
  "use strict";

  function mapearCategoriaOpenFoodFacts(categoriasTexto) {
    if (!categoriasTexto || typeof categoriasTexto !== "string") {
      return "Otros";
    }

    const texto = categoriasTexto.toLowerCase();

    if (
      texto.includes("beverage") ||
      texto.includes("boisson") ||
      texto.includes("bebida") ||
      texto.includes("juice") ||
      texto.includes("soda") ||
      texto.includes("water") ||
      texto.includes("agua")
    ) {
      return "Bebidas";
    }
    if (
      texto.includes("snack") ||
      texto.includes("chips") ||
      texto.includes("biscuit") ||
      texto.includes("galleta") ||
      texto.includes("papas") ||
      texto.includes("fritura")
    ) {
      return "Snacks";
    }
    if (
      texto.includes("dairy") ||
      texto.includes("lait") ||
      texto.includes("leche") ||
      texto.includes("cheese") ||
      texto.includes("queso") ||
      texto.includes("yogurt") ||
      texto.includes("yogur")
    ) {
      return "Lácteos";
    }
    if (
      texto.includes("sweet") ||
      texto.includes("chocolate") ||
      texto.includes("candy") ||
      texto.includes("dulce") ||
      texto.includes("confectionery") ||
      texto.includes("caramelo")
    ) {
      return "Dulces";
    }
    if (
      texto.includes("cleaning") ||
      texto.includes("limpieza") ||
      texto.includes("detergent") ||
      texto.includes("soap") ||
      texto.includes("jabón")
    ) {
      return "Limpieza";
    }
    if (
      texto.includes("hygiene") ||
      texto.includes("higiene") ||
      texto.includes("shampoo") ||
      texto.includes("toothpaste") ||
      texto.includes("dental") ||
      texto.includes("papel")
    ) {
      return "Higiene";
    }
    if (
      texto.includes("grocery") ||
      texto.includes("groceries") ||
      texto.includes("rice") ||
      texto.includes("arroz") ||
      texto.includes("oil") ||
      texto.includes("aceite") ||
      texto.includes("pasta") ||
      texto.includes("flour") ||
      texto.includes("harina") ||
      texto.includes("cereal") ||
      texto.includes("grain") ||
      texto.includes("pan") ||
      texto.includes("bread")
    ) {
      return "Abarrotes";
    }

    return "Otros";
  }

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

    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigoLimpio)}.json`;

    try {
      const controlador = new AbortController();
      const temporizador = setTimeout(() => controlador.abort(), 8000);

      const respuesta = await fetch(url, {
        signal: controlador.signal,
        headers: {
          Accept: "application/json"
        }
      });

      clearTimeout(temporizador);

      if (!respuesta.ok) {
        return {
          exito: false,
          producto: null,
          mensaje: `El servicio de consulta respondió con estado ${respuesta.status}.`,
          tipoError: "http"
        };
      }

      const data = await respuesta.json();

      if (data.status === 1 && data.product) {
        const p = data.product;
        const nombreEncontrado =
          p.product_name_es ||
          p.product_name ||
          p.generic_name ||
          "Producto sin nombre registrado";
        const marca = p.brands || "";
        const nombreCompleto = marca ? `${nombreEncontrado} (${marca})` : nombreEncontrado;
        const categoriaSugerida = mapearCategoriaOpenFoodFacts(
          p.categories || (p.categories_tags ? p.categories_tags.join(",") : "")
        );
        const cantidad = p.quantity || "";

        return {
          exito: true,
          producto: {
            codigo: data.code || codigoLimpio,
            nombre: nombreCompleto.trim(),
            marca: marca,
            categoria: categoriaSugerida,
            cantidad: cantidad
          },
          mensaje: "Producto encontrado con éxito."
        };
      }

      return {
        exito: false,
        producto: null,
        mensaje: `No se encontró ningún artículo con el código "${codigoLimpio}". Puedes ingresar los datos manualmente.`,
        tipoError: "no_encontrado"
      };
    } catch (error) {
      if (error && error.name === "AbortError") {
        return {
          exito: false,
          producto: null,
          mensaje: "La consulta tardó demasiado tiempo en responder.",
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

  function mapearCategoriaDummyJSON(p) {
    if (!p) return "Otros";
    const title = String(p.title || "").toLowerCase();
    const cat = String(p.category || "").toLowerCase();

    if (
      title.includes("juice") ||
      title.includes("drink") ||
      title.includes("water") ||
      title.includes("coffee") ||
      title.includes("tea") ||
      title.includes("beverage")
    ) {
      return "Bebidas";
    }
    if (
      title.includes("milk") ||
      title.includes("cheese") ||
      title.includes("yogurt") ||
      title.includes("butter")
    ) {
      return "Lácteos";
    }
    if (
      title.includes("ice cream") ||
      title.includes("candy") ||
      title.includes("chocolate") ||
      title.includes("honey")
    ) {
      return "Dulces";
    }
    if (
      title.includes("snack") ||
      title.includes("chips") ||
      title.includes("cookie") ||
      title.includes("biscuit")
    ) {
      return "Snacks";
    }
    if (
      title.includes("tissue") ||
      title.includes("paper") ||
      title.includes("soap") ||
      title.includes("shampoo")
    ) {
      return "Higiene";
    }
    if (
      cat === "groceries" ||
      title.includes("oil") ||
      title.includes("rice") ||
      title.includes("egg") ||
      title.includes("apple") ||
      title.includes("meat") ||
      title.includes("steak") ||
      title.includes("fish")
    ) {
      return "Abarrotes";
    }
    return "Otros";
  }

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

    const DICCIONARIO = {
      leche: "milk",
      cafe: "coffee",
      café: "coffee",
      aceite: "oil",
      arroz: "rice",
      agua: "water",
      manzana: "apple",
      jugo: "juice",
      refresco: "drinks",
      gaseosa: "drinks",
      soda: "drinks",
      huevo: "egg",
      huevos: "egg",
      carne: "meat",
      pollo: "chicken",
      pescado: "fish",
      helado: "ice cream",
      miel: "honey",
      pepino: "cucumber",
      fresa: "strawberry",
      papa: "potato",
      papas: "potatoes",
      limon: "lemon",
      limón: "lemon",
      cebolla: "onion",
      papel: "tissue"
    };

    const terminoMinuscula = terminoLimpio.toLowerCase();
    const terminoBusqueda = DICCIONARIO[terminoMinuscula] || terminoLimpio;

    try {
      const controlador = new AbortController();
      const temporizador = setTimeout(() => controlador.abort(), 7000);

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

      let encontrado = lista.find(p => {
        const barcode = String((p.meta && p.meta.barcode) || "").toLowerCase();
        const sku = String(p.sku || "").toLowerCase();
        const title = String(p.title || "").toLowerCase();
        const q = terminoMinuscula;
        const qEn = terminoBusqueda.toLowerCase();

        return (
          barcode === q ||
          sku === q ||
          title === q ||
          title.includes(qEn) ||
          title.includes(q)
        );
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
        const codigo =
          (encontrado.meta && encontrado.meta.barcode) ||
          encontrado.sku ||
          String(encontrado.id);

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
      return {
        exito: false,
        producto: null,
        mensaje: "No fue posible conectar con el catálogo en línea. Revisa tu conexión a internet.",
        tipoError: "red"
      };
    }
  }

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

    const resDummy = await consultarDummyJSON(query);
    if (resDummy.exito) {
      return resDummy;
    }

    if (/^\d{8,14}$/.test(query)) {
      const resOff = await consultarOpenFoodFacts(query);
      if (resOff.exito) {
        return {
          ...resOff,
          fuente: "Catálogo por código"
        };
      }
    }

    return resDummy;
  }

  if (typeof window !== "undefined") {
    window.mapearCategoriaOpenFoodFacts = mapearCategoriaOpenFoodFacts;
    window.consultarOpenFoodFacts = consultarOpenFoodFacts;
    window.mapearCategoriaDummyJSON = mapearCategoriaDummyJSON;
    window.consultarDummyJSON = consultarDummyJSON;
    window.consultarProductoExterno = consultarProductoExterno;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      mapearCategoriaOpenFoodFacts,
      consultarOpenFoodFacts,
      mapearCategoriaDummyJSON,
      consultarDummyJSON,
      consultarProductoExterno
    };
  }
})();

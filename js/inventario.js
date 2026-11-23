(function () {
  "use strict";

  const LS_SESION = "tiendita_sesion";
  const LS_PRODUCTOS = "tiendita_productos";
  const LS_MOVIMIENTOS = "tiendita_movimientos";

  function obtenerSesion() {
    if (typeof window.verificarAcceso === "function") {
      return window.verificarAcceso(false);
    }
    try {
      const sesion = JSON.parse(localStorage.getItem(LS_SESION));
      if (!sesion) {
        window.location.href = "MiTiendita/login.html";
        return null;
      }
      return sesion;
    } catch (e) {
      window.location.href = "MiTiendita/login.html";
      return null;
    }
  }

  const sesion = obtenerSesion();
  if (!sesion) return;

  const mountNode = document.getElementById("inventario-root");
  if (!mountNode || !window.React || !window.ReactDOM) return;

  const { createElement: h, useState, useEffect, Fragment } = window.React;

  function leerLista(clave) {
    try {
      const datos = JSON.parse(localStorage.getItem(clave) || "[]");
      return Array.isArray(datos) ? datos : [];
    } catch (e) {
      return [];
    }
  }

  function moneda(valor) {
    const num = Number(valor);
    return "$" + (Number.isFinite(num) ? num : 0).toFixed(2);
  }

  function AppInventario() {
    const esAdmin = sesion.rol === "admin";
    const [productos, setProductos] = useState(function () {
      return leerLista(LS_PRODUCTOS);
    });
    const [productoId, setProductoId] = useState("");
    const [cantidad, setCantidad] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [categoriaFiltro, setCategoriaFiltro] = useState("");
    const [errores, setErrores] = useState({});
    const [mensaje, setMensaje] = useState(null);

    useEffect(function () {
      function recargar() {
        setProductos(leerLista(LS_PRODUCTOS));
      }

      window.addEventListener("tienditaDatosActualizados", recargar);
      window.addEventListener("storage", recargar);

      return function () {
        window.removeEventListener("tienditaDatosActualizados", recargar);
        window.removeEventListener("storage", recargar);
      };
    }, []);

    const valorTotal = productos.reduce(function (total, p) {
      const stock = Number(p.stock);
      const costo = Number(p.costo);
      if (Number.isFinite(stock) && Number.isFinite(costo)) {
        return total + stock * costo;
      }
      return total;
    }, 0);

    const cantidadAlertas = productos.filter(function (p) {
      return Number(p.stock) <= Number(p.stockMinimo ?? 5);
    }).length;

    const categorias = Array.from(
      new Set(
        productos
          .map(function (p) {
            return p.categoria || "";
          })
          .filter(Boolean)
      )
    ).sort();

    const productosFiltrados = productos.filter(function (p) {
      const q = busqueda.trim().toLowerCase();
      const coincideTexto =
        !q ||
        String(p.nombre || "").toLowerCase().includes(q) ||
        String(p.categoria || "").toLowerCase().includes(q);
      const coincideCategoria = !categoriaFiltro || p.categoria === categoriaFiltro;
      return coincideTexto && coincideCategoria;
    });

    function registrarEntrada(e) {
      e.preventDefault();
      setMensaje(null);

      const nuevosErrores = {};
      const cantidadNum = Number(String(cantidad).trim());

      if (!productoId) {
        nuevosErrores.productoId = "Selecciona un producto.";
      }

      if (
        String(cantidad).trim() === "" ||
        !Number.isSafeInteger(cantidadNum) ||
        cantidadNum <= 0
      ) {
        nuevosErrores.cantidad = "Ingresa una cantidad entera mayor a 0.";
      }

      if (Object.keys(nuevosErrores).length > 0) {
        setErrores(nuevosErrores);
        setMensaje({
          tipo: "danger",
          texto: "Corrige los campos señalados antes de continuar."
        });
        return;
      }

      setErrores({});
      const listaActual = leerLista(LS_PRODUCTOS);
      const producto = listaActual.find(function (item) {
        return String(item.id) === String(productoId);
      });

      if (!producto) {
        setProductos(listaActual);
        setMensaje({
          tipo: "danger",
          texto: "El producto ya no está disponible. Selecciónalo nuevamente."
        });
        return;
      }

      const stockActual = Number(producto.stock) || 0;
      const nuevoStock = stockActual + cantidadNum;

      if (!Number.isSafeInteger(nuevoStock)) {
        setMensaje({
          tipo: "danger",
          texto: "Las existencias exceden el límite permitido."
        });
        return;
      }

      producto.stock = nuevoStock;

      try {
        localStorage.setItem(LS_PRODUCTOS, JSON.stringify(listaActual));

        const movimientos = leerLista(LS_MOVIMIENTOS);
        const costoUnitario = Number(producto.costo) || 0;
        movimientos.unshift({
          id: "ent-" + Date.now(),
          tipo: "compra",
          productoId: producto.id,
          productoNombre: producto.nombre,
          cantidad: cantidadNum,
          costoUnitario: costoUnitario,
          total: Math.round(costoUnitario * cantidadNum * 100) / 100,
          proveedorNombre: "Entrada de inventario",
          usuario: sesion.nombre || "Administrador",
          fecha: new Date().toISOString()
        });
        localStorage.setItem(LS_MOVIMIENTOS, JSON.stringify(movimientos));
      } catch (err) {
        setMensaje({
          tipo: "danger",
          texto: "No se pudieron guardar los cambios. Verifica el almacenamiento disponible."
        });
        return;
      }

      setProductos(listaActual);
      setProductoId("");
      setCantidad("");

      window.dispatchEvent(
        new CustomEvent("tienditaDatosActualizados", {
          detail: { clave: LS_PRODUCTOS }
        })
      );
      window.dispatchEvent(new CustomEvent("compraRegistrada"));

      const textoExito =
        "Entrada registrada correctamente: " +
        cantidadNum +
        " unidades de " +
        producto.nombre +
        ". Nuevo stock: " +
        nuevoStock +
        ".";

      setMensaje({ tipo: "success", texto: textoExito });

      if (typeof window.mostrarExito === "function") {
        window.mostrarExito(textoExito, "Entrada registrada");
      }
    }

    return h(
      Fragment,
      null,
      h(
        "div",
        { className: "view-head view-head-row" },
        h(
          "div",
          null,
          h("h2", null, "Gestión de Inventario"),
          h("p", null, "Consulta las existencias y registra entradas de mercancía en bodega.")
        ),
        h(
          "a",
          { href: "productos.html", className: "btn btn-accent", style: { width: "auto" } },
          "Catálogo de productos"
        )
      ),
      h(
        "div",
        { className: "kpi-grid mb-4" },
        esAdmin
          ? h(
              "div",
              { className: "kpi-card" },
              h("div", { className: "kpi-num", id: "valorInventario" }, moneda(valorTotal)),
              h("div", { className: "kpi-label" }, "Valor total de inventario (costo)")
            )
          : h(
              "div",
              { className: "kpi-card" },
              h("div", { className: "kpi-num" }, String(productos.length)),
              h("div", { className: "kpi-label" }, "Productos registrados")
            ),
        h(
          "div",
          { className: "kpi-card tone-warning" },
          h("div", { className: "kpi-num", id: "productosAlerta" }, String(cantidadAlertas)),
          h("div", { className: "kpi-label" }, "Productos en stock mínimo o crítico")
        )
      ),
      esAdmin
        ? h(
            "section",
            { className: "panel-box mb-4" },
            h("h3", { className: "mb-3" }, "Registrar entrada de mercancía"),
            h(
              "form",
              { id: "formEntrada", onSubmit: registrarEntrada, noValidate: true },
              h(
                "div",
                { className: "row g-3 align-items-end" },
                h(
                  "div",
                  { className: "col-md-6 field mb-0" },
                  h("label", { htmlFor: "productoEntrada" }, "Producto *"),
                  h(
                    "select",
                    {
                      id: "productoEntrada",
                      className: errores.productoId ? "campo-invalido" : "",
                      value: productoId,
                      onChange: function (e) {
                        setProductoId(e.target.value);
                        setErrores(function (prev) {
                          return { ...prev, productoId: "" };
                        });
                        setMensaje(null);
                      }
                    },
                    h("option", { value: "" }, "Selecciona un producto"),
                    productos.map(function (p) {
                      return h(
                        "option",
                        { key: String(p.id), value: String(p.id) },
                        p.nombre + " - Stock actual: " + (p.stock ?? 0)
                      );
                    })
                  )
                ),
                h(
                  "div",
                  { className: "col-md-3 field mb-0" },
                  h("label", { htmlFor: "cantidadEntrada" }, "Cantidad *"),
                  h("input", {
                    type: "number",
                    id: "cantidadEntrada",
                    className: errores.cantidad ? "campo-invalido" : "",
                    min: "1",
                    step: "1",
                    placeholder: "Ej. 12",
                    value: cantidad,
                    onChange: function (e) {
                      setCantidad(e.target.value);
                      setErrores(function (prev) {
                        return { ...prev, cantidad: "" };
                      });
                      setMensaje(null);
                    }
                  })
                ),
                h(
                  "div",
                  { className: "col-md-3" },
                  h(
                    "button",
                    { type: "submit", className: "btn btn-accent w-100 py-2" },
                    "Registrar entrada"
                  )
                )
              ),
              mensaje
                ? h(
                    "div",
                    { id: "mensajeEntrada", className: "alert alert-" + mensaje.tipo + " mt-3 mb-0" },
                    mensaje.texto
                  )
                : null
            )
          )
        : null,
      h(
        "section",
        { className: "view-head mt-4" },
        h("h3", null, "Existencias de inventario"),
        h("p", null, "Lista consolidada de artículos, existencias actuales y estado de reabastecimiento.")
      ),
      h(
        "div",
        { className: "toolbar" },
        h("input", {
          type: "text",
          placeholder: "Buscar producto...",
          value: busqueda,
          onChange: function (e) {
            setBusqueda(e.target.value);
          }
        }),
        h(
          "select",
          {
            value: categoriaFiltro,
            onChange: function (e) {
              setCategoriaFiltro(e.target.value);
            }
          },
          h("option", { value: "" }, "Todas las categorías"),
          categorias.map(function (cat) {
            return h("option", { key: cat, value: cat }, cat);
          })
        )
      ),
      h(
        "div",
        { className: "card-table-wrap u-scroll" },
        h(
          "table",
          null,
          h(
            "thead",
            null,
            h(
              "tr",
              null,
              h("th", null, "Producto"),
              h("th", null, "Categoría"),
              esAdmin ? h("th", null, "Costo") : null,
              h("th", null, "Existencias"),
              h("th", null, "Stock mínimo"),
              h("th", null, "Estado")
            )
          ),
          h(
            "tbody",
            { id: "tablaInventario" },
            productosFiltrados.length === 0
              ? h(
                  "tr",
                  null,
                  h(
                    "td",
                    { colSpan: esAdmin ? 6 : 5, className: "text-center text-muted py-4" },
                    "No hay productos registrados."
                  )
                )
              : productosFiltrados.map(function (p) {
                  const stockNum = Number(p.stock);
                  const minNum = Number(p.stockMinimo ?? 0);
                  const critico = Number.isFinite(stockNum) && Number.isFinite(minNum) && stockNum <= minNum;
                  return h(
                    "tr",
                    { key: p.id, className: stockNum === 0 ? "out" : critico ? "low" : "" },
                    h("td", null, p.nombre || ""),
                    h("td", null, p.categoria || ""),
                    esAdmin ? h("td", null, moneda(p.costo)) : null,
                    h("td", null, String(p.stock ?? 0)),
                    h("td", null, String(p.stockMinimo ?? 0)),
                    h(
                      "td",
                      null,
                      h(
                        "span",
                        { className: "badge " + (critico ? "bg-danger" : "bg-success") },
                        critico ? "Stock Crítico" : "Nivel Normal"
                      )
                    )
                  );
                })
          )
        )
      )
    );
  }

  window.ReactDOM.createRoot(mountNode).render(h(AppInventario));
})();

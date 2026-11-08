/**
 * ventas.js
 * Módulo de Punto de Venta en React 18 para La Tiendita.
 * Cumple con la distribución de trabajo del Integrante 3:
 * - Selección de producto y validación en tiempo real de existencias.
 * - Descuento automático de inventario y prevención de venta mayor al stock.
 * - Resumen reactivo de cobro e historial de operaciones.
 * - Disparo de eventos para sincronización con Reportes e Inventario.
 * - Cero emojis y cero tecnicismos para el usuario.
 */

(function () {
  "use strict";

  const LS_PRODUCTOS = "tiendita_productos";
  const LS_VENTAS = "tiendita_ventas";
  const LS_MOVIMIENTOS = "tiendita_movimientos";
  const LS_SESION = "tiendita_sesion";

  const mountNode = document.getElementById("ventas-root");

  if (!mountNode || !window.React || !window.ReactDOM) {
    if (mountNode) {
      mountNode.innerHTML =
        '<div class="alert alert-danger m-3">No se pudo inicializar el módulo de ventas. Verifique las dependencias del sistema.</div>';
    }
    return;
  }

  const { createElement: h, useState, useEffect, useCallback } = window.React;

  function leerLista(clave) {
    try {
      const data = localStorage.getItem(clave);
      if (data === null) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error(`Error al leer ${clave}:`, e);
      return [];
    }
  }

  function moneda(val) {
    const num = Number(val);
    return "$" + (Number.isFinite(num) ? num : 0).toFixed(2);
  }

  function formatearFecha(iso) {
    const f = new Date(iso);
    if (Number.isNaN(f.getTime())) return "—";
    return f.toLocaleDateString("es-SV", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function obtenerSesionUsuario() {
    try {
      const sesion = JSON.parse(localStorage.getItem(LS_SESION));
      if (sesion && sesion.nombre) return sesion;
      return { nombre: "Vendedor de Turno", rol: "vendedor", id: 1 };
    } catch {
      return { nombre: "Vendedor de Turno", rol: "vendedor", id: 1 };
    }
  }

  function FormularioVenta({
    productos,
    productoSeleccionado,
    productoId,
    setProductoId,
    cantidad,
    setCantidad,
    mensaje,
    enviando,
    onSubmit
  }) {
    const stockDisponible = productoSeleccionado ? Number(productoSeleccionado.stock || 0) : 0;
    const cantidadNum = Number(cantidad);
    const superaStock = productoSeleccionado && cantidadNum > stockDisponible;
    const puedeVender =
      Boolean(productoSeleccionado) &&
      Number.isSafeInteger(cantidadNum) &&
      cantidadNum >= 1 &&
      !superaStock &&
      stockDisponible > 0 &&
      !enviando;

    return h(
      "section",
      { className: "panel-box" },
      h("h3", { className: "mb-3" }, "Registrar venta"),
      h(
        "form",
        { onSubmit, noValidate: true },
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "selectProducto" }, "Producto *"),
          h(
            "select",
            {
              id: "selectProducto",
              value: productoId,
              onChange: e => setProductoId(e.target.value),
              required: true
            },
            h(
              "option",
              { value: "" },
              productos.length ? "Selecciona un producto" : "No hay productos disponibles"
            ),
            productos.map(p =>
              h(
                "option",
                { key: String(p.id), value: String(p.id), disabled: Number(p.stock) <= 0 },
                `${p.nombre} — ${moneda(p.precio)} (Existencias: ${p.stock ?? 0})`
              )
            )
          ),
          h(
            "div",
            { className: "small text-muted mt-1" },
            `Existencias disponibles: ${productoSeleccionado ? stockDisponible : "—"}`
          )
        ),
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "inputCantidad" }, "Cantidad *"),
          h("input", {
            type: "number",
            id: "inputCantidad",
            min: "1",
            max: stockDisponible > 0 ? String(stockDisponible) : undefined,
            step: "1",
            value: cantidad,
            onChange: e => setCantidad(e.target.value),
            required: true
          })
        ),
        superaStock &&
          h(
            "div",
            { className: "alert alert-warning py-2 px-3 small my-2" },
            `La cantidad ingresada (${cantidadNum}) supera las existencias disponibles (${stockDisponible}).`
          ),
        mensaje &&
          mensaje.texto &&
          h(
            "div",
            { className: `alert alert-${mensaje.tipo} py-2 px-3 small my-2` },
            mensaje.texto
          ),
        h(
          "button",
          {
            type: "submit",
            id: "btnConfirmarVenta",
            className: "btn btn-accent w-100 py-2 mt-3",
            disabled: !puedeVender
          },
          enviando ? "Procesando venta..." : "Confirmar venta"
        )
      )
    );
  }

  function ResumenCobro({ productoSeleccionado, cantidad, sesion }) {
    const cantidadNum = Number(cantidad);
    const precioUnitario = productoSeleccionado ? Number(productoSeleccionado.precio || 0) : 0;
    const esCantidadValida = Number.isSafeInteger(cantidadNum) && cantidadNum >= 1;
    const total = productoSeleccionado && esCantidadValida ? precioUnitario * cantidadNum : 0;

    return h(
      "section",
      { className: "panel-box d-flex flex-column justify-content-between" },
      h(
        "div",
        null,
        h("h3", { className: "mb-3 border-bottom pb-2" }, "Resumen de cobro"),
        h(
          "div",
          { className: "d-flex justify-content-between py-2 border-bottom" },
          h("span", { className: "text-secondary" }, "Producto:"),
          h("strong", { className: "text-end" }, productoSeleccionado ? productoSeleccionado.nombre : "—")
        ),
        h(
          "div",
          { className: "d-flex justify-content-between py-2 border-bottom" },
          h("span", { className: "text-secondary" }, "Precio unitario:"),
          h("span", null, moneda(precioUnitario))
        ),
        h(
          "div",
          { className: "d-flex justify-content-between py-2 border-bottom" },
          h("span", { className: "text-secondary" }, "Cantidad:"),
          h("span", null, esCantidadValida ? String(cantidadNum) : "0")
        ),
        h(
          "div",
          { className: "d-flex justify-content-between align-items-baseline pt-4 mt-3 border-top border-2" },
          h("span", { className: "fs-5 fw-semibold" }, "Total a cobrar:"),
          h(
            "span",
            { className: "display-6 fw-bold", style: { color: "var(--accent-ink)" } },
            moneda(total)
          )
        )
      ),
      h(
        "div",
        { className: "text-end text-muted small mt-4 pt-3 border-top" },
        "Atendido por: ",
        h("strong", { className: "text-dark" }, sesion.nombre || "Usuario")
      )
    );
  }

  function HistorialVentas({ ventas }) {
    return h(
      "section",
      { className: "panel-box mt-4" },
      h("h3", { className: "mb-3" }, "Historial de ventas registradas"),
      h(
        "div",
        { className: "card-table-wrap u-scroll" },
        h(
          "table",
          { className: "w-100" },
          h(
            "thead",
            null,
            h(
              "tr",
              null,
              h("th", null, "Fecha"),
              h("th", null, "Producto"),
              h("th", null, "Cant."),
              h("th", null, "Precio U."),
              h("th", null, "Total"),
              h("th", null, "Vendedor")
            )
          ),
          h(
            "tbody",
            null,
            ventas.length === 0
              ? h(
                  "tr",
                  null,
                  h(
                    "td",
                    { colSpan: 6, className: "text-center py-4 text-muted" },
                    "No hay ventas registradas aún."
                  )
                )
              : ventas
                  .slice()
                  .reverse()
                  .slice(0, 25)
                  .map((venta, idx) =>
                    h(
                      "tr",
                      { key: venta.id || idx },
                      h("td", null, formatearFecha(venta.fecha)),
                      h("td", null, venta.producto || "—"),
                      h("td", null, venta.cantidad || 0),
                      h("td", null, moneda(venta.precioUnitario || 0)),
                      h("td", { className: "fw-semibold" }, moneda(venta.total || 0)),
                      h("td", null, venta.usuario || "—")
                    )
                  )
          )
        )
      ),
      h(
        "p",
        { className: "small text-muted mt-3 mb-0" },
        `Total de ventas registradas: ${ventas.length}`
      )
    );
  }

  function AplicacionVentas() {
    const [productos, setProductos] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [productoId, setProductoId] = useState("");
    const [cantidad, setCantidad] = useState("1");
    const [mensaje, setMensaje] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const sesion = obtenerSesionUsuario();

    const cargarDatos = useCallback(() => {
      setProductos(leerLista(LS_PRODUCTOS));
      setVentas(leerLista(LS_VENTAS));
    }, []);

    useEffect(() => {
      cargarDatos();

      const handleActualizacion = () => cargarDatos();
      window.addEventListener("tienditaDatosActualizados", handleActualizacion);
      window.addEventListener("ventaRegistrada", handleActualizacion);
      window.addEventListener("storage", handleActualizacion);

      return () => {
        window.removeEventListener("tienditaDatosActualizados", handleActualizacion);
        window.removeEventListener("ventaRegistrada", handleActualizacion);
        window.removeEventListener("storage", handleActualizacion);
      };
    }, [cargarDatos]);

    const productoSeleccionado = productos.find(p => String(p.id) === String(productoId)) || null;

    async function handleConfirmarVenta(e) {
      e.preventDefault();
      setMensaje(null);

      if (!productoSeleccionado) {
        setMensaje({ tipo: "warning", texto: "Selecciona un producto de la lista." });
        return;
      }

      const cantidadNum = Number(cantidad);
      if (!Number.isSafeInteger(cantidadNum) || cantidadNum < 1) {
        setMensaje({ tipo: "warning", texto: "Ingresa una cantidad entera válida (mínimo 1)." });
        return;
      }

      setEnviando(true);
      const claves = [LS_PRODUCTOS, LS_VENTAS, LS_MOVIMIENTOS];
      const respaldos = {};

      try {
        claves.forEach(c => {
          respaldos[c] = localStorage.getItem(c);
        });

        // Relectura de datos frescos para consistencia concurrente
        const productosActuales = leerLista(LS_PRODUCTOS);
        const ventasActuales = leerLista(LS_VENTAS);
        const movimientosActuales = leerLista(LS_MOVIMIENTOS);

        const productoActual = productosActuales.find(p => String(p.id) === String(productoId));
        if (!productoActual) {
          throw new Error("El producto seleccionado ya no se encuentra en el catálogo.");
        }

        const stockActual = Number(productoActual.stock || 0);
        if (stockActual < cantidadNum) {
          throw new Error(
            `Existencias insuficientes. Se solicitaron ${cantidadNum} unidades, pero solo hay ${stockActual} disponibles.`
          );
        }

        const precioUnitario = Number(productoActual.precio || 0);
        const costoUnitario = Number(productoActual.costo || 0);
        const total = Math.round(precioUnitario * cantidadNum * 100) / 100;
        const utilidad = Math.round((precioUnitario - costoUnitario) * cantidadNum * 100) / 100;

        const fechaIso = new Date().toISOString();
        const idVenta = Date.now();

        const nuevaVenta = {
          id: idVenta,
          fecha: fechaIso,
          usuario: sesion.nombre,
          usuarioId: sesion.id,
          productoId: productoActual.id,
          producto: productoActual.nombre,
          precioUnitario,
          cantidad: cantidadNum,
          total
        };

        const nuevoMovimiento = {
          id: idVenta,
          tipo: "venta",
          productoId: productoActual.id,
          productoNombre: productoActual.nombre,
          cantidad: cantidadNum,
          precioUnitario,
          total,
          utilidad,
          usuario: sesion.nombre,
          fecha: fechaIso
        };

        productoActual.stock = stockActual - cantidadNum;
        ventasActuales.push(nuevaVenta);
        movimientosActuales.unshift(nuevoMovimiento);

        try {
          localStorage.setItem(LS_PRODUCTOS, JSON.stringify(productosActuales));
          localStorage.setItem(LS_VENTAS, JSON.stringify(ventasActuales));
          localStorage.setItem(LS_MOVIMIENTOS, JSON.stringify(movimientosActuales));
        } catch (storageErr) {
          claves.forEach(c => {
            const ant = respaldos[c];
            if (ant === null) localStorage.removeItem(c);
            else if (ant !== undefined) localStorage.setItem(c, ant);
          });
          throw storageErr;
        }

        setProductos(productosActuales);
        setVentas(ventasActuales);
        setCantidad("1");
        setProductoId("");

        // Disparar sincronización para Reportes, Panel e Inventario
        window.dispatchEvent(
          new CustomEvent("tienditaDatosActualizados", {
            detail: { clave: LS_VENTAS }
          })
        );
        window.dispatchEvent(
          new CustomEvent("ventaRegistrada", {
            detail: { venta: nuevaVenta }
          })
        );

        setMensaje({
          tipo: "success",
          texto: `Venta registrada: ${cantidadNum} unidades de ${productoActual.nombre} por ${moneda(total)}.`
        });

        if (typeof window.mostrarExito === "function") {
          await window.mostrarExito(
            `Se vendieron ${cantidadNum} unidades de ${productoActual.nombre} por ${moneda(total)}. Existencias restantes: ${productoActual.stock}.`,
            "Venta registrada"
          );
        }
      } catch (err) {
        setMensaje({ tipo: "danger", texto: err.message || "No se pudo registrar la venta." });
        if (typeof window.mostrarError === "function") {
          await window.mostrarError(err.message, "No se pudo registrar la venta");
        }
        cargarDatos();
      } finally {
        setEnviando(false);
      }
    }

    return h(
      React.Fragment,
      null,
      h(
        "div",
        { className: "view-head" },
        h("h2", null, "Punto de Venta"),
        h(
          "p",
          null,
          "Registra ventas de mostrador y descuenta el inventario automáticamente."
        )
      ),
      h(
        "div",
        { className: "two-col" },
        h(FormularioVenta, {
          productos,
          productoSeleccionado,
          productoId,
          setProductoId,
          cantidad,
          setCantidad,
          mensaje,
          enviando,
          onSubmit: handleConfirmarVenta
        }),
        h(ResumenCobro, {
          productoSeleccionado,
          cantidad,
          sesion
        })
      ),
      h(HistorialVentas, { ventas })
    );
  }

  try {
    window.ReactDOM.createRoot(mountNode).render(h(AplicacionVentas));
  } catch (e) {
    mountNode.innerHTML = `<div class="alert alert-danger m-3">Error al inicializar el punto de venta: ${e.message}</div>`;
  }
})();

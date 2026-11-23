(function () {
  "use strict";

  const LS_PRODUCTOS = "tiendita_productos";
  const LS_MOVIMIENTOS = "tiendita_movimientos";
  const LS_VENTAS = "tiendita_ventas";
  const LS_COMPRAS = "tiendita_compras";
  const LS_SESION = "tiendita_sesion";

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

  const sesionActual = obtenerSesion();
  if (!sesionActual) return;

  const mountNode = document.getElementById("panel-root");
  if (!mountNode || !window.React || !window.ReactDOM) return;

  const { createElement: h, useState, useEffect, Fragment } = window.React;

  function leerLista(clave) {
    try {
      const data = JSON.parse(localStorage.getItem(clave) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function obtenerMovimientos() {
    const movs = leerLista(LS_MOVIMIENTOS);
    if (movs.length > 0) return movs;

    const ventas = leerLista(LS_VENTAS).map(function (v) {
      return {
        id: v.id,
        tipo: "venta",
        productoId: v.productoId,
        productoNombre: v.producto || v.productoNombre || "Producto",
        cantidad: Number(v.cantidad) || 1,
        total: Number(v.total) || 0,
        fecha: v.fecha
      };
    });

    const compras = leerLista(LS_COMPRAS).map(function (c) {
      return {
        id: c.id,
        tipo: "compra",
        productoId: c.productoId,
        productoNombre: c.producto || c.productoNombre || "Producto",
        cantidad: Number(c.cantidad) || 1,
        total: Number(c.total) || 0,
        fecha: c.fecha
      };
    });

    return ventas.concat(compras).sort(function (a, b) {
      return new Date(b.fecha) - new Date(a.fecha);
    });
  }

  function moneda(valor) {
    return "$" + (Number(valor) || 0).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function tiempoRelativo(iso) {
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return "—";
    const horas = (Date.now() - fecha.getTime()) / 3600000;
    if (horas < 1) return "hace un momento";
    if (horas < 24) return "hace " + Math.floor(horas) + " h";
    const dias = Math.floor(horas / 24);
    if (dias === 1) return "ayer";
    if (dias < 7) return "hace " + dias + " días";
    return fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  }

  function detectarVista() {
    return window.location.hash.toLowerCase() === "#view-alertas" ? "alertas" : "panel";
  }

  function iconoMovimiento(tipo) {
    if (tipo === "compra") {
      return h(
        "svg",
        { width: 15, height: 15, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
        h("path", { d: "M10 2v10" }),
        h("path", { d: "M5 8l5 5 5-5" }),
        h("path", { d: "M3 17h14" })
      );
    }
    return h(
      "svg",
      { width: 15, height: 15, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
      h("path", { d: "M10 18V8" }),
      h("path", { d: "M5 12l5-5 5 5" }),
      h("path", { d: "M3 3h14" })
    );
  }

  function VistaPanel({ sesion, productos, movimientos, stockBajo }) {
    const esAdmin = sesion.rol === "admin";
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const ventasHoy = movimientos.filter(function (m) {
      return m.tipo === "venta" && new Date(m.fecha).getTime() >= inicioHoy.getTime();
    });

    const totalVentasHoy = ventasHoy.reduce(function (suma, m) {
      return suma + (Number(m.total) || 0);
    }, 0);

    const unidadesHoy = ventasHoy.reduce(function (suma, m) {
      return suma + (Number(m.cantidad) || 0);
    }, 0);

    const valorInventario = productos.reduce(function (suma, p) {
      return suma + (Number(p.stock) || 0) * (Number(p.costo) || 0);
    }, 0);

    const fechaHoyTexto = new Date().toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

    const kpis = esAdmin
      ? [
          { num: String(productos.length), label: "Productos activos", tone: "" },
          { num: moneda(valorInventario), label: "Valor de inventario", tone: "" },
          { num: moneda(totalVentasHoy), label: "Ventas de hoy", tone: "success" },
          {
            num: String(stockBajo.length),
            label: stockBajo.length === 1 ? "Producto en alerta" : "Productos en alerta",
            tone: stockBajo.length > 0 ? "warning" : ""
          }
        ]
      : [
          { num: moneda(totalVentasHoy), label: "Ventas de hoy", tone: "success" },
          { num: String(unidadesHoy), label: "Unidades vendidas hoy", tone: "" },
          {
            num: String(stockBajo.length),
            label: stockBajo.length === 1 ? "Producto en alerta" : "Productos en alerta",
            tone: stockBajo.length > 0 ? "warning" : ""
          }
        ];

    const recientes = movimientos
      .slice()
      .sort(function (a, b) {
        return new Date(b.fecha) - new Date(a.fecha);
      })
      .slice(0, 6);

    const alertasResumen = stockBajo.slice(0, 6);

    return h(
      "section",
      { className: "view", id: "view-panel" },
      h(
        "div",
        { className: "view-head" },
        h("h2", null, "Hola, " + (sesion.nombre || "Usuario")),
        h("p", null, fechaHoyTexto)
      ),
      h(
        "div",
        { className: "kpi-grid" },
        kpis.map(function (k, idx) {
          return h(
            "div",
            { key: idx, className: "kpi-card" + (k.tone ? " tone-" + k.tone : "") },
            h("div", { className: "kpi-num" }, k.num),
            h("div", { className: "kpi-label" }, k.label)
          );
        })
      ),
      h(
        "div",
        { className: "two-col" },
        h(
          "div",
          { className: "panel-box" },
          h("h3", null, "Movimientos recientes"),
          recientes.length === 0
            ? h("div", { className: "empty-state" }, "Aún no hay movimientos.")
            : h(
                "ul",
                { className: "mini-list" },
                recientes.map(function (m, idx) {
                  const sub =
                    (m.tipo === "compra" ? "Compra · " : "Venta · ") +
                    (m.cantidad || 0) +
                    " u · " +
                    tiempoRelativo(m.fecha);
                  return h(
                    "li",
                    { key: m.id || idx, className: "mini-row" },
                    h("span", { className: "move-icon " + m.tipo }, iconoMovimiento(m.tipo)),
                    h(
                      "span",
                      { className: "mi-main" },
                      h("div", { className: "mi-name" }, m.productoNombre || "Producto"),
                      h("div", { className: "mi-sub" }, sub)
                    ),
                    h("span", { className: "mi-val" }, moneda(m.total))
                  );
                })
              )
        ),
        h(
          "div",
          { className: "panel-box" },
          h(
            "div",
            { className: "d-flex justify-content-between align-items-center mb-2" },
            h("h3", { className: "mb-0" }, "Stock bajo"),
            stockBajo.length > 0
              ? h("a", { href: "#view-alertas", className: "btn btn-ghost btn-small" }, "Ver alertas")
              : null
          ),
          alertasResumen.length === 0
            ? h("div", { className: "empty-state" }, "Todo el inventario está en niveles saludables.")
            : h(
                "ul",
                { className: "mini-list" },
                alertasResumen.map(function (p) {
                  const clasePunto = Number(p.stock) === 0 ? "danger" : "warn";
                  return h(
                    "li",
                    { key: p.id, className: "mini-row" },
                    h("span", { className: "dot " + clasePunto }),
                    h(
                      "span",
                      { className: "mi-main" },
                      h("div", { className: "mi-name" }, p.nombre),
                      h("div", { className: "mi-sub" }, p.categoria || "General")
                    ),
                    h("span", { className: "mi-val" }, (p.stock ?? 0) + " / " + (p.stockMinimo ?? 5))
                  );
                })
              )
        )
      )
    );
  }

  function VistaAlertas({ sesion, stockBajo }) {
    const esAdmin = sesion.rol === "admin";

    return h(
      "section",
      { className: "view", id: "view-alertas" },
      h(
        "div",
        { className: "view-head view-head-row" },
        h(
          "div",
          null,
          h("h2", null, "Alertas de stock"),
          h("p", null, "Productos en o por debajo de su stock mínimo")
        ),
        h("a", { href: "#view-panel", className: "btn btn-ghost btn-small" }, "Volver al panel")
      ),
      stockBajo.length === 0
        ? h(
            "div",
            { className: "panel-box empty-state" },
            "Todo el inventario está en niveles saludables. No hay alertas por ahora."
          )
        : h(
            "div",
            { className: "alert-grid" },
            stockBajo.map(function (p) {
              const agotado = Number(p.stock) === 0;
              const clase = agotado ? "crit" : "warn";
              return h(
                "div",
                { key: p.id, className: "alert-card " + clase },
                h("span", { className: "alert-tag " + clase }, agotado ? "Agotado" : "Stock bajo"),
                h("h4", null, p.nombre),
                h("div", { className: "cat" }, p.categoria || "General"),
                h(
                  "div",
                  { className: "alert-stock" },
                  h("b", null, String(p.stock ?? 0)),
                  " de " + (p.stockMinimo ?? 5) + " unidades mínimas"
                ),
                esAdmin
                  ? h(
                      "a",
                      {
                        href: "compras.html?productoId=" + encodeURIComponent(p.id),
                        className: "btn btn-ghost btn-small"
                      },
                      "Registrar compra"
                    )
                  : h("span", { className: "hint" }, "Notifica al administrador/a")
              );
            })
          )
    );
  }

  function AppPanel() {
    const [vista, setVista] = useState(detectarVista);
    const [productos, setProductos] = useState(function () {
      return leerLista(LS_PRODUCTOS);
    });
    const [movimientos, setMovimientos] = useState(obtenerMovimientos);

    useEffect(function () {
      function recargarDatos() {
        setProductos(leerLista(LS_PRODUCTOS));
        setMovimientos(obtenerMovimientos());
      }

      function cambiarVista() {
        setVista(detectarVista());
      }

      window.addEventListener("hashchange", cambiarVista);
      window.addEventListener("tienditaDatosActualizados", recargarDatos);
      window.addEventListener("ventaRegistrada", recargarDatos);
      window.addEventListener("compraRegistrada", recargarDatos);
      window.addEventListener("storage", recargarDatos);

      return function () {
        window.removeEventListener("hashchange", cambiarVista);
        window.removeEventListener("tienditaDatosActualizados", recargarDatos);
        window.removeEventListener("ventaRegistrada", recargarDatos);
        window.removeEventListener("compraRegistrada", recargarDatos);
        window.removeEventListener("storage", recargarDatos);
      };
    }, []);

    const stockBajo = productos
      .filter(function (p) {
        return Number(p.stock) <= Number(p.stockMinimo ?? 5);
      })
      .sort(function (a, b) {
        return (Number(a.stock) - Number(a.stockMinimo ?? 5)) - (Number(b.stock) - Number(b.stockMinimo ?? 5));
      });

    return h(
      Fragment,
      null,
      vista === "alertas"
        ? h(VistaAlertas, { sesion: sesionActual, stockBajo: stockBajo })
        : h(VistaPanel, {
            sesion: sesionActual,
            productos: productos,
            movimientos: movimientos,
            stockBajo: stockBajo
          })
    );
  }

  window.ReactDOM.createRoot(mountNode).render(h(AppPanel));
})();

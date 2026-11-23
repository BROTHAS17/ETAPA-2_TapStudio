(function () {
  "use strict";

  const LS_MOVIMIENTOS = "tiendita_movimientos";
  const LS_VENTAS = "tiendita_ventas";
  const LS_COMPRAS = "tiendita_compras";
  const LS_SESION = "tiendita_sesion";

  function validarAdmin() {
    if (typeof window.verificarAcceso === "function") {
      return window.verificarAcceso(true);
    }
    try {
      const sesion = JSON.parse(localStorage.getItem(LS_SESION));
      if (!sesion) {
        window.location.href = "MiTiendita/login.html";
        return null;
      }
      if (sesion.rol !== "admin") {
        window.location.href = "index.html";
        return null;
      }
      return sesion;
    } catch (e) {
      window.location.href = "MiTiendita/login.html";
      return null;
    }
  }

  const sesion = validarAdmin();
  if (!sesion) return;

  const mountNode = document.getElementById("reportes-root");
  if (!mountNode || !window.React || !window.ReactDOM) return;

  const { createElement: h, useState, useEffect, useRef, Fragment } = window.React;

  const RANGOS = [
    { id: "hoy", etiqueta: "Hoy" },
    { id: "semana", etiqueta: "Semana" },
    { id: "mes", etiqueta: "Mes" },
    { id: "todo", etiqueta: "Todo" }
  ];

  function leerDatos(clave) {
    try {
      const data = JSON.parse(localStorage.getItem(clave) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function formatoMoneda(valor) {
    return "$" + (Number(valor) || 0).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function fechaFormateada(iso) {
    const f = new Date(iso);
    return Number.isNaN(f.getTime())
      ? "—"
      : f.toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        });
  }

  function obtenerMovimientosConsolidados() {
    const movs = leerDatos(LS_MOVIMIENTOS);
    if (movs.length > 0) return movs;

    const ventas = leerDatos(LS_VENTAS).map(function (v) {
      return {
        id: v.id,
        tipo: "venta",
        fecha: v.fecha,
        productoId: v.productoId,
        productoNombre: v.producto || v.productoNombre || "Producto",
        cantidad: Number(v.cantidad) || 1,
        total: Number(v.total) || 0,
        utilidad: (Number(v.total) || 0) * 0.3
      };
    });

    const compras = leerDatos(LS_COMPRAS).map(function (c) {
      return {
        id: c.id,
        tipo: "compra",
        fecha: c.fecha,
        productoId: c.productoId,
        productoNombre: c.producto || "Producto",
        cantidad: Number(c.cantidad) || 1,
        total: Number(c.total) || 0,
        utilidad: 0
      };
    });

    return ventas.concat(compras);
  }

  function filtrarPorRango(movimientos, rango) {
    const ahora = Date.now();
    let limite = 0;

    if (rango === "hoy") {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      limite = d.getTime();
    } else if (rango === "semana") {
      limite = ahora - 7 * 86400000;
    } else if (rango === "mes") {
      limite = ahora - 30 * 86400000;
    }

    return movimientos.filter(function (m) {
      return new Date(m.fecha).getTime() >= limite;
    });
  }

  function AppReportes() {
    const [movimientos, setMovimientos] = useState(obtenerMovimientosConsolidados);
    const [rango, setRango] = useState("todo");
    const [tipoFiltro, setTipoFiltro] = useState("");

    const refCanvasVentas = useRef(null);
    const refCanvasProductos = useRef(null);
    const chartVentasRef = useRef(null);
    const chartProductosRef = useRef(null);

    useEffect(function () {
      function recargar() {
        setMovimientos(obtenerMovimientosConsolidados());
      }

      window.addEventListener("ventaRegistrada", recargar);
      window.addEventListener("compraRegistrada", recargar);
      window.addEventListener("tienditaDatosActualizados", recargar);
      window.addEventListener("storage", recargar);

      return function () {
        window.removeEventListener("ventaRegistrada", recargar);
        window.removeEventListener("compraRegistrada", recargar);
        window.removeEventListener("tienditaDatosActualizados", recargar);
        window.removeEventListener("storage", recargar);
      };
    }, []);

    const movsRango = filtrarPorRango(movimientos, rango);
    const ventasRango = movsRango.filter(function (m) {
      return m.tipo === "venta";
    });
    const comprasRango = movsRango.filter(function (m) {
      return m.tipo === "compra";
    });

    const totalVentas = ventasRango.reduce(function (s, m) {
      return s + (Number(m.total) || 0);
    }, 0);
    const totalCompras = comprasRango.reduce(function (s, m) {
      return s + (Number(m.total) || 0);
    }, 0);
    const utilidad = ventasRango.reduce(function (s, m) {
      return s + (Number(m.utilidad) || 0);
    }, 0);
    const ticketPromedio = ventasRango.length ? totalVentas / ventasRango.length : 0;

    const mapaTop = {};
    ventasRango.forEach(function (v) {
      const nombre = v.productoNombre || "Producto";
      mapaTop[nombre] = (mapaTop[nombre] || 0) + (Number(v.cantidad) || 0);
    });

    const topProductos = Object.keys(mapaTop)
      .map(function (k) {
        return { nombre: k, cantidad: mapaTop[k] };
      })
      .sort(function (a, b) {
        return b.cantidad - a.cantidad;
      })
      .slice(0, 6);

    const historial = movsRango
      .filter(function (m) {
        return !tipoFiltro || m.tipo === tipoFiltro;
      })
      .slice()
      .sort(function (a, b) {
        return new Date(b.fecha) - new Date(a.fecha);
      })
      .slice(0, 50);

    useEffect(
      function () {
        const canvas = refCanvasVentas.current;
        if (!canvas || typeof window.Chart === "undefined") return;

        const todasVentas = movimientos.filter(function (m) {
          return m.tipo === "venta";
        });

        const ultimosSieteDias = [];
        for (let i = 6; i >= 0; i--) {
          const fecha = new Date();
          fecha.setDate(fecha.getDate() - i);
          const fechaClave = fecha.toLocaleDateString("en-CA");

          const totalDia = todasVentas
            .filter(function (venta) {
              if (!venta.fecha) return false;
              const fVenta = new Date(venta.fecha);
              return (
                !Number.isNaN(fVenta.getTime()) &&
                fVenta.toLocaleDateString("en-CA") === fechaClave
              );
            })
            .reduce(function (suma, venta) {
              return suma + (Number(venta.total) || 0);
            }, 0);

          ultimosSieteDias.push({
            fecha: fecha.toLocaleDateString("es-SV", { day: "2-digit", month: "short" }),
            total: totalDia
          });
        }

        if (chartVentasRef.current) {
          chartVentasRef.current.destroy();
        }

        chartVentasRef.current = new window.Chart(canvas, {
          type: "bar",
          data: {
            labels: ultimosSieteDias.map(function (d) {
              return d.fecha;
            }),
            datasets: [
              {
                label: "Ventas ($)",
                data: ultimosSieteDias.map(function (d) {
                  return d.total;
                }),
                backgroundColor: "#D9A62E",
                borderRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function (val) {
                    return "$" + val;
                  }
                }
              }
            }
          }
        });

        return function () {
          if (chartVentasRef.current) {
            chartVentasRef.current.destroy();
            chartVentasRef.current = null;
          }
        };
      },
      [movimientos]
    );

    useEffect(
      function () {
        const canvas = refCanvasProductos.current;
        if (!canvas || typeof window.Chart === "undefined") return;

        if (chartProductosRef.current) {
          chartProductosRef.current.destroy();
        }

        const labels = topProductos.map(function (p) {
          return p.nombre;
        });
        const data = topProductos.map(function (p) {
          return p.cantidad;
        });

        chartProductosRef.current = new window.Chart(canvas, {
          type: "bar",
          data: {
            labels: labels.length ? labels : ["Sin datos"],
            datasets: [
              {
                label: "Unidades vendidas",
                data: data.length ? data : [0],
                backgroundColor: "#3C6E47",
                borderRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { precision: 0 }
              }
            }
          }
        });

        return function () {
          if (chartProductosRef.current) {
            chartProductosRef.current.destroy();
            chartProductosRef.current = null;
          }
        };
      },
      [movimientos, rango]
    );

    return h(
      Fragment,
      null,
      h(
        "div",
        { className: "view-head view-head-row" },
        h(
          "div",
          null,
          h("h2", null, "Reportes y Estadísticas"),
          h("p", null, "Métricas consolidadas de ventas, compras y productos más demandados.")
        ),
        h(
          "div",
          { className: "segmented", id: "rangeSeg" },
          RANGOS.map(function (item) {
            return h(
              "button",
              {
                key: item.id,
                type: "button",
                className: rango === item.id ? "active" : "",
                onClick: function () {
                  setRango(item.id);
                }
              },
              item.etiqueta
            );
          })
        )
      ),
      h(
        "div",
        { className: "kpi-grid mb-4" },
        h(
          "div",
          { className: "kpi-card tone-success" },
          h("div", { className: "kpi-num", id: "kpiTotalVentas" }, formatoMoneda(totalVentas)),
          h("div", { className: "kpi-label" }, "Ventas totales")
        ),
        h(
          "div",
          { className: "kpi-card" },
          h("div", { className: "kpi-num", id: "kpiTotalCompras" }, formatoMoneda(totalCompras)),
          h("div", { className: "kpi-label" }, "Compras totales")
        ),
        h(
          "div",
          { className: "kpi-card tone-warning" },
          h("div", { className: "kpi-num", id: "kpiUtilidad" }, formatoMoneda(utilidad)),
          h("div", { className: "kpi-label" }, "Margen / Utilidad estimada")
        ),
        h(
          "div",
          { className: "kpi-card" },
          h("div", { className: "kpi-num", id: "kpiTicketPromedio" }, formatoMoneda(ticketPromedio)),
          h("div", { className: "kpi-label" }, "Ticket promedio por venta")
        )
      ),
      h(
        "section",
        { className: "panel-box mb-4" },
        h("h3", { className: "mb-3" }, "Resumen de ventas de los últimos 7 días"),
        h(
          "div",
          { style: { position: "relative", height: "260px", width: "100%" } },
          h("canvas", { id: "graficaVentas", ref: refCanvasVentas })
        )
      ),
      h(
        "div",
        { className: "two-col" },
        h(
          "section",
          { className: "panel-box" },
          h("h3", { className: "mb-3" }, "Productos más vendidos"),
          h(
            "div",
            { style: { position: "relative", height: "320px", width: "100%" } },
            h("canvas", { id: "graficaProductos", ref: refCanvasProductos })
          )
        ),
        h(
          "section",
          { className: "panel-box" },
          h(
            "div",
            { className: "d-flex justify-content-between align-items-center mb-3" },
            h("h3", { className: "m-0" }, "Historial reciente"),
            h(
              "select",
              {
                id: "histTipo",
                value: tipoFiltro,
                onChange: function (e) {
                  setTipoFiltro(e.target.value);
                },
                style: {
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  fontSize: "0.85rem"
                }
              },
              h("option", { value: "" }, "Todos"),
              h("option", { value: "venta" }, "Ventas"),
              h("option", { value: "compra" }, "Compras")
            )
          ),
          h(
            "ul",
            {
              className: "list-unstyled u-scroll m-0 p-0",
              id: "histList",
              style: { maxHeight: "320px", overflowY: "auto" }
            },
            historial.length === 0
              ? h(
                  "li",
                  { className: "text-muted p-3 text-center" },
                  "No hay movimientos en este periodo."
                )
              : historial.map(function (m, idx) {
                  const esVenta = m.tipo === "venta";
                  const color = esVenta ? "var(--success)" : "var(--accent)";
                  const textoColor = esVenta ? "#fff" : "var(--accent-ink)";
                  return h(
                    "li",
                    {
                      key: m.id || idx,
                      className: "d-flex justify-content-between align-items-center py-2 px-3 border-bottom"
                    },
                    h(
                      "div",
                      null,
                      h(
                        "span",
                        {
                          className: "badge",
                          style: { backgroundColor: color, color: textoColor }
                        },
                        esVenta ? "Venta" : "Compra"
                      ),
                      h("strong", { className: "ms-2" }, m.productoNombre || "Producto"),
                      h(
                        "div",
                        { className: "small text-muted" },
                        (m.cantidad || 0) + " unidades · " + fechaFormateada(m.fecha)
                      )
                    ),
                    h("div", { className: "fw-bold" }, formatoMoneda(m.total))
                  );
                })
          )
        )
      )
    );
  }

  window.ReactDOM.createRoot(mountNode).render(h(AppReportes));
})();

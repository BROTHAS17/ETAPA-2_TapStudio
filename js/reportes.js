(function () {
  "use strict";

  const LS_MOVIMIENTOS = "tiendita_movimientos";
  const LS_VENTAS = "tiendita_ventas";
  const LS_COMPRAS = "tiendita_compras";

  let rangoSeleccionado = "todo";
  let tipoFiltro = "";
  let chartInstancia = null;
  let graficaVentasChart = null;

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
    return isNaN(f.getTime())
      ? "—"
      : f.toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        });
  }

  function obtenerMovimientosConsolidados() {
    let movs = leerDatos(LS_MOVIMIENTOS);

    if (!movs.length) {
      const ventas = leerDatos(LS_VENTAS);
      const compras = leerDatos(LS_COMPRAS);

      movs = [
        ...ventas.map(v => ({
          id: v.id,
          tipo: "venta",
          fecha: v.fecha,
          productoId: v.productoId,
          productoNombre: v.producto || v.productoNombre || "Producto",
          cantidad: Number(v.cantidad) || 1,
          total: Number(v.total) || 0,
          utilidad: (Number(v.total) || 0) * 0.3
        })),
        ...compras.map(c => ({
          id: c.id,
          tipo: "compra",
          fecha: c.fecha,
          productoId: c.productoId,
          productoNombre: c.producto || "Producto",
          cantidad: Number(c.cantidad) || 1,
          total: Number(c.total) || 0,
          utilidad: 0
        }))
      ];
    }

    return movs;
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

    return movimientos.filter(m => new Date(m.fecha).getTime() >= limite);
  }

  function renderizarReporte() {
    const todosMovs = obtenerMovimientosConsolidados();
    const movs = filtrarPorRango(todosMovs, rangoSeleccionado);

    const ventas = movs.filter(m => m.tipo === "venta");
    const compras = movs.filter(m => m.tipo === "compra");

    const totalVentas = ventas.reduce((s, m) => s + (Number(m.total) || 0), 0);
    const totalCompras = compras.reduce((s, m) => s + (Number(m.total) || 0), 0);
    const utilidad = ventas.reduce((s, m) => s + (Number(m.utilidad) || 0), 0);
    const ticketPromedio = ventas.length ? totalVentas / ventas.length : 0;

    const elVentas = document.getElementById("kpiTotalVentas");
    const elCompras = document.getElementById("kpiTotalCompras");
    const elUtilidad = document.getElementById("kpiUtilidad");
    const elTicket = document.getElementById("kpiTicketPromedio");

    if (elVentas) elVentas.textContent = formatoMoneda(totalVentas);
    if (elCompras) elCompras.textContent = formatoMoneda(totalCompras);
    if (elUtilidad) elUtilidad.textContent = formatoMoneda(utilidad);
    if (elTicket) elTicket.textContent = formatoMoneda(ticketPromedio);

    const topMap = {};
    ventas.forEach(v => {
      const nombre = v.productoNombre || "Producto";
      topMap[nombre] = (topMap[nombre] || 0) + (Number(v.cantidad) || 0);
    });

    const topArr = Object.keys(topMap)
      .map(k => ({ nombre: k, cantidad: topMap[k] }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 6);

    dibujarGraficaProductos(topArr);
    renderizarHistorial(movs);
  }

  function dibujarGraficaProductos(topProductos) {
    const canvas = document.getElementById("graficaProductos");
    if (!canvas || typeof Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    if (chartInstancia) {
      chartInstancia.destroy();
    }

    const labels = topProductos.map(p => p.nombre);
    const data = topProductos.map(p => p.cantidad);

    chartInstancia = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels.length ? labels : ["Sin datos"],
        datasets: [
          {
            label: "Unidades vendidas",
            data: data.length ? data : [0],
            backgroundColor: "#6D8F72",
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  function actualizarGraficaVentas() {
    const canvas = document.getElementById("graficaVentas");
    if (!canvas || typeof Chart === "undefined") return;

    const todosMovs = obtenerMovimientosConsolidados();
    const ventas = todosMovs.filter(m => m.tipo === "venta");

    const ultimosSieteDias = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const fechaClave = fecha.toLocaleDateString("en-CA");

      const total = ventas
        .filter(venta => {
          if (!venta.fecha) return false;
          const fechaVenta = new Date(venta.fecha);
          return (
            !Number.isNaN(fechaVenta.getTime()) &&
            fechaVenta.toLocaleDateString("en-CA") === fechaClave
          );
        })
        .reduce((suma, venta) => suma + Number(venta.total || 0), 0);

      ultimosSieteDias.push({
        fecha: fecha.toLocaleDateString("es-SV", {
          day: "2-digit",
          month: "short"
        }),
        total
      });
    }

    if (graficaVentasChart) {
      graficaVentasChart.destroy();
    }

    graficaVentasChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: ultimosSieteDias.map(dia => dia.fecha),
        datasets: [
          {
            label: "Ventas ($)",
            data: ultimosSieteDias.map(dia => dia.total),
            backgroundColor: "#2563eb",
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
  }

  function renderizarHistorial(movs) {
    const contenedor = document.getElementById("histList");
    if (!contenedor) return;

    let lista = movs;
    if (tipoFiltro) {
      lista = lista.filter(m => m.tipo === tipoFiltro);
    }

    lista = lista
      .slice()
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 50);

    if (!lista.length) {
      contenedor.innerHTML =
        '<li class="text-muted p-3 text-center">No hay movimientos en este periodo.</li>';
      return;
    }

    contenedor.innerHTML = lista
      .map(m => {
        const esVenta = m.tipo === "venta";
        const color = esVenta ? "var(--success)" : "var(--accent)";
        const labelTipo = esVenta ? "Venta" : "Compra";
        return `
          <li class="d-flex justify-content-between align-items-center py-2 px-3 border-bottom">
            <div>
              <span class="badge" style="background-color: ${color}; color: #fff;">${labelTipo}</span>
              <strong class="ms-2">${m.productoNombre || "Producto"}</strong>
              <div class="small text-muted">${m.cantidad} unidades · ${fechaFormateada(m.fecha)}</div>
            </div>
            <div class="fw-bold">${formatoMoneda(m.total)}</div>
          </li>
        `;
      })
      .join("");
  }

  function inicializar() {
    const botonesRango = document.querySelectorAll("#rangeSeg button");
    botonesRango.forEach(btn => {
      btn.addEventListener("click", () => {
        botonesRango.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        rangoSeleccionado = btn.dataset.range;
        renderizarReporte();
      });
    });

    const selectTipo = document.getElementById("histTipo");
    if (selectTipo) {
      selectTipo.addEventListener("change", e => {
        tipoFiltro = e.target.value;
        renderizarReporte();
      });
    }

    renderizarReporte();
    actualizarGraficaVentas();

    window.addEventListener("reportesVistaMostrada", () => {
      if (graficaVentasChart) {
        graficaVentasChart.resize();
      }
      if (chartInstancia) {
        chartInstancia.resize();
      }
    });

    window.addEventListener("ventaRegistrada", () => {
      renderizarReporte();
      actualizarGraficaVentas();
    });

    window.addEventListener("compraRegistrada", () => {
      renderizarReporte();
      actualizarGraficaVentas();
    });

    window.addEventListener("tienditaDatosActualizados", () => {
      renderizarReporte();
      actualizarGraficaVentas();
    });

    window.addEventListener("resize", () => {
      if (graficaVentasChart) graficaVentasChart.resize();
      if (chartInstancia) chartInstancia.resize();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar);
  } else {
    inicializar();
  }
})();

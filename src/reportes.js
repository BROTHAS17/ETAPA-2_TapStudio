
import Chart from 'chart.js/auto';
import { leerMovimientosConsolidados } from './storage.js';

let graficaVentas = null;

function actualizarGraficaVentas() {
  const canvas = document.getElementById('graficaVentas');

  if (!canvas) return;

  const movimientos = leerMovimientosConsolidados();

  const ventas = movimientos.filter(
    movimiento => movimiento.tipo === 'venta'
  );

  const ultimosSieteDias = [];

  for (let i = 6; i >= 0; i--) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - i);

    const fechaClave = fecha.toLocaleDateString('en-CA');

    const total = ventas
      .filter(venta => {
        if (!venta.fecha) return false;

        const fechaVenta = new Date(venta.fecha);

        return !Number.isNaN(fechaVenta.getTime()) &&
          fechaVenta.toLocaleDateString('en-CA') === fechaClave;
      })
      .reduce((suma, venta) => suma + Number(venta.total || 0), 0);

    ultimosSieteDias.push({
      fecha: fecha.toLocaleDateString('es-SV', {
        day: '2-digit',
        month: 'short'
      }),
      total
    });
  }

  if (graficaVentas) {
    graficaVentas.destroy();
  }

  const texto = getComputedStyle(canvas).getPropertyValue('--ink-soft').trim();
  graficaVentas = new Chart(canvas, {
    type: 'line',
    data: {
      labels: ultimosSieteDias.map(dia => dia.fecha),
      datasets: [{
        label: 'Ventas ($)',
        data: ultimosSieteDias.map(dia => dia.total),
        backgroundColor: '#6D8F72',
        borderColor: '#6D8F72',
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true, labels: { color: texto }
        }
      },
      scales: {
        x: { ticks: { color: texto } },
        y: {
          beginAtZero: true, ticks: { color: texto }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarGraficaVentas();

    window.addEventListener('reportesVistaMostrada', () => {
    if (graficaVentas) {
      graficaVentas.resize();
    }
  });

  window.addEventListener(
    'ventaRegistrada',
    actualizarGraficaVentas
  );
});

let graficaCategorias = null;
window.addEventListener('reporteActualizado', ({ detail }) => {
  const canvas = document.getElementById('graficaCategorias');
  if (!canvas) return;

  const categorias = detail.categorias;
  graficaCategorias?.destroy();
  graficaCategorias = null;
  canvas.parentElement.hidden = categorias.length === 0;
  document.getElementById('categoriasSinDatos').hidden = categorias.length > 0;
  if (!categorias.length) return;

  canvas.setAttribute('aria-label', categorias.map(([nombre, cantidad]) => `${nombre}: ${cantidad}`).join(', '));
  const texto = getComputedStyle(canvas).getPropertyValue('--ink-soft').trim();
  graficaCategorias = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: categorias.map(([nombre]) => nombre),
      datasets: [{ data: categorias.map(([, cantidad]) => cantidad) }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: texto } } }
    }
  });
});
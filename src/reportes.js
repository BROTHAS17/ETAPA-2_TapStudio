
import Chart from 'chart.js/auto';


let graficaVentas = null;

export function serieVentas(ventas, periodo, hoy = new Date()) {
  const fechas = new Map();
  const porHora = periodo === 'hoy';
  const porMes = periodo === 'todo';
  const clave = fecha => porHora
    ? fecha.getHours()
    : porMes
      ? fecha.getFullYear() * 12 + fecha.getMonth()
      : new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();

  if (!porMes) {
    const inicio = periodo === 'semana' ? hoy.getDate() - 6 : 1;
    const cantidad = porHora ? 24 : periodo === 'semana' ? 7 : hoy.getDate();
    for (let i = 0; i < cantidad; i++) {
      const fecha = porHora
        ? new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), i)
        : new Date(hoy.getFullYear(), hoy.getMonth(), inicio + i);
      fechas.set(clave(fecha), { fecha, total: 0 });
    }
  }

  for (const venta of ventas) {
    const fecha = new Date(venta.fecha);
    if (Number.isNaN(fecha.getTime())) continue;
    const indice = clave(fecha);
    if (!fechas.has(indice)) {
      if (!porMes) continue;
      fechas.set(indice, { fecha, total: 0 });
    }
    fechas.get(indice).total += Number(venta.total) || 0;
  }

  return Array.from(fechas.entries()).sort(([a], [b]) => a - b).map(([, { fecha, total }]) => ({
    etiqueta: porHora
      ? `${String(fecha.getHours()).padStart(2, '0')}:00`
      : fecha.toLocaleDateString('es-SV', porMes
        ? { month: 'short', year: 'numeric' }
        : { day: 'numeric', month: 'short' }),
    total
  }));
}

function actualizarGraficaVentas(ventas, periodo) {
  const canvas = document.getElementById('graficaVentas');
  if (!canvas) return;

  const titulos = {
    hoy: 'Ventas de hoy por hora',
    semana: 'Ventas de los últimos 7 días',
    mes: 'Ventas del mes por día',
    todo: 'Ventas de todo el historial por mes'
  };
  document.getElementById('tituloGraficaVentas').textContent = titulos[periodo];
  const serie = serieVentas(ventas, periodo);
  if (graficaVentas) {
    graficaVentas.destroy();
  }

  const texto = getComputedStyle(canvas).getPropertyValue('--ink-soft').trim();
  graficaVentas = new Chart(canvas, {
    type: 'line',
    data: {
      labels: serie.map(punto => punto.etiqueta),
      datasets: [{
        label: 'Ventas ($)',
        data: serie.map(punto => punto.total),
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

let graficaCategorias = null;
window.addEventListener('reporteActualizado', ({ detail }) => {
  actualizarGraficaVentas(detail.ventas, detail.periodo);
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

import Chart from 'chart.js/auto';

let graficaVentas = null;

function obtenerMovimientos() {
  try {
    const datos = JSON.parse(
      localStorage.getItem('tiendita_movimientos') || '[]'
    );

    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    return [];
  }
}

function actualizarGraficaVentas() {
  const canvas = document.getElementById('graficaVentas');

  if (!canvas) return;

  const movimientos = obtenerMovimientos();

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

  graficaVentas = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ultimosSieteDias.map(dia => dia.fecha),
      datasets: [{
        label: 'Ventas ($)',
        data: ultimosSieteDias.map(dia => dia.total),
        backgroundColor: '#6D8F72',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarGraficaVentas();

  window.addEventListener(
    'tienditaDatosActualizados',
    actualizarGraficaVentas
  );

  window.addEventListener(
    'ventaRegistrada',
    actualizarGraficaVentas
  );
});

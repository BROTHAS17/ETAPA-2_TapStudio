
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { CLAVES, leerDatos } from './storage.js';

function Reportes() {
  const [movimientos, setMovimientos] = useState([]);
  const [periodo, setPeriodo] = useState('todo');

  const barrasRef = useRef(null);
  const circularRef = useRef(null);
  const barrasChart = useRef(null);
  const circularChart = useRef(null);

  useEffect(() => {
    const cargarMovimientos = () => {
      const datos = leerDatos(CLAVES.movimientos, []);
      setMovimientos(Array.isArray(datos) ? datos : []);
    };

    cargarMovimientos();

    window.addEventListener(
      'tienditaDatosActualizados',
      cargarMovimientos
    );

    return () => {
      window.removeEventListener(
        'tienditaDatosActualizados',
        cargarMovimientos
      );
    };
  }, []);

  const movimientosFiltrados = useMemo(() => {
    const ahora = new Date();

    let fechaInicio = new Date(0);

    if (periodo === 'hoy') {
      fechaInicio = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
      );
    } else if (periodo === 'semana') {
      fechaInicio = new Date(Date.now() - 7 * 86400000);
    } else if (periodo === 'mes') {
      fechaInicio = new Date(Date.now() - 30 * 86400000);
    }

    return movimientos.filter(m => {
      const fecha = new Date(m.fecha).getTime();
      return Number.isFinite(fecha) && fecha >= fechaInicio.getTime();
    });
  }, [movimientos, periodo]);

  const ventas = movimientosFiltrados.filter(
    m => m.tipo === 'venta'
  );

  const compras = movimientosFiltrados.filter(
    m => m.tipo === 'compra'
  );

  const totalVentas = ventas.reduce(
    (suma, venta) => suma + Number(venta.total || 0),
    0
  );

  const totalCompras = compras.reduce(
    (suma, compra) => suma + Number(compra.total || 0),
    0
  );

  const utilidad = ventas.reduce(
    (suma, venta) => suma + Number(venta.utilidad || 0),
    0
  );

  const ticketPromedio = ventas.length
    ? totalVentas / ventas.length
    : 0;

  const productosVendidos = {};

  ventas.forEach(venta => {
    const id = String(venta.productoId);

    if (!productosVendidos[id]) {
      productosVendidos[id] = {
        nombre: venta.productoNombre || 'Producto sin nombre',
        cantidad: 0,
        total: 0
      };
    }

    productosVendidos[id].cantidad += Number(venta.cantidad || 0);
    productosVendidos[id].total += Number(venta.total || 0);
  });

  const topProductos = Object.values(productosVendidos)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const formatoMoneda = valor =>
    '$' + Number(valor || 0).toFixed(2);

  // Crear y actualizar las gráficas
  useEffect(() => {
    if (!barrasRef.current || !circularRef.current) return;

    if (barrasChart.current) {
      barrasChart.current.destroy();
    }

    if (circularChart.current) {
      circularChart.current.destroy();
    }

    barrasChart.current = new Chart(barrasRef.current, {
      type: 'bar',
      data: {
        labels: topProductos.map(p => p.nombre),
        datasets: [{
          label: 'Unidades vendidas',
          data: topProductos.map(p => p.cantidad),
          backgroundColor: '#6C63FF',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });

    circularChart.current = new Chart(circularRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Ventas', 'Compras'],
        datasets: [{
          data: [totalVentas, totalCompras],
          backgroundColor: ['#16A34A', '#F59E0B'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

    return () => {
      if (barrasChart.current) {
        barrasChart.current.destroy();
        barrasChart.current = null;
      }

      if (circularChart.current) {
        circularChart.current.destroy();
        circularChart.current = null;
      }
    };
  }, [topProductos, totalVentas, totalCompras]);

  return (
    <section className="reportes">
      <h2>Reportes de ventas</h2>

      <label>Periodo:</label>

      <select
        value={periodo}
        onChange={e => setPeriodo(e.target.value)}
      >
        <option value="hoy">Hoy</option>
        <option value="semana">Últimos 7 días</option>
        <option value="mes">Últimos 30 días</option>
        <option value="todo">Todo</option>
      </select>

      <div className="reporte-kpis">
        <article>
          <h3>Total ventas</h3>
          <p>{formatoMoneda(totalVentas)}</p>
        </article>

        <article>
          <h3>Total compras</h3>
          <p>{formatoMoneda(totalCompras)}</p>
        </article>

        <article>
          <h3>Utilidad bruta</h3>
          <p>{formatoMoneda(utilidad)}</p>
        </article>

        <article>
          <h3>Ticket promedio</h3>
          <p>{formatoMoneda(ticketPromedio)}</p>
        </article>
      </div>

      <h3>Productos más vendidos</h3>

      {topProductos.length === 0 ? (
        <p>No hay ventas registradas en este periodo.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Unidades vendidas</th>
              <th>Total vendido</th>
            </tr>
          </thead>

          <tbody>
            {topProductos.map((producto, index) => (
              <tr key={index}>
                <td>{producto.nombre}</td>
                <td>{producto.cantidad}</td>
                <td>{formatoMoneda(producto.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Unidades vendidas por producto</h3>
      <div style={{ position: 'relative', height: '300px' }}>
        <canvas ref={barrasRef}></canvas>
      </div>

      <h3>Comparación de ventas y compras</h3>
      <div style={{ position: 'relative', height: '300px' }}>
        <canvas ref={circularRef}></canvas>
      </div>
    </section>
  );
}

export default Reportes;

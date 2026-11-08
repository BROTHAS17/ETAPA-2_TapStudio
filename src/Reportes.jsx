
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

  // Cargar movimientos y escuchar actualizaciones
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

    window.addEventListener(
      'ventaRegistrada',
      cargarMovimientos
    );

    window.addEventListener(
      'reportesVistaMostrada',
      cargarMovimientos
    );

    return () => {
      window.removeEventListener(
        'tienditaDatosActualizados',
        cargarMovimientos
      );

      window.removeEventListener(
        'ventaRegistrada',
        cargarMovimientos
      );

      window.removeEventListener(
        'reportesVistaMostrada',
        cargarMovimientos
      );
    };
  }, []);

  // Filtrar movimientos según el periodo seleccionado
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
      fechaInicio = new Date(
        Date.now() - 7 * 86400000
      );
    } else if (periodo === 'mes') {
      fechaInicio = new Date(
        Date.now() - 30 * 86400000
      );
    }

    return movimientos.filter(movimiento => {
      const fecha = new Date(movimiento.fecha).getTime();

      return (
        Number.isFinite(fecha) &&
        fecha >= fechaInicio.getTime()
      );
    });
  }, [movimientos, periodo]);

  // Separar ventas y compras
  const ventas = useMemo(
    () => movimientosFiltrados.filter(m => m.tipo === 'venta'),
    [movimientosFiltrados]
  );

  const compras = useMemo(
    () => movimientosFiltrados.filter(m => m.tipo === 'compra'),
    [movimientosFiltrados]
  );

  // Calcular indicadores
  const totalVentas = useMemo(
    () => ventas.reduce(
      (suma, venta) => suma + Number(venta.total || 0),
      0
    ),
    [ventas]
  );

  const totalCompras = useMemo(
    () => compras.reduce(
      (suma, compra) => suma + Number(compra.total || 0),
      0
    ),
    [compras]
  );

  const utilidad = useMemo(
    () => ventas.reduce(
      (suma, venta) => suma + Number(venta.utilidad || 0),
      0
    ),
    [ventas]
  );

  const ticketPromedio = ventas.length > 0
    ? totalVentas / ventas.length
    : 0;

  // Obtener productos más vendidos
  const topProductos = useMemo(() => {
    const productosVendidos = {};

    ventas.forEach(venta => {
      const id = String(venta.productoId);

      if (!productosVendidos[id]) {
        productosVendidos[id] = {
          nombre:
            venta.productoNombre ||
            venta.producto ||
            'Producto sin nombre',
          cantidad: 0,
          total: 0
        };
      }

      productosVendidos[id].cantidad += Number(
        venta.cantidad || 0
      );

      productosVendidos[id].total += Number(
        venta.total || 0
      );
    });

    return Object.values(productosVendidos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [ventas]);

  // Formato de moneda
  const formatoMoneda = valor =>
    '$' + Number(valor || 0).toFixed(2);

  // Crear y actualizar las gráficas
  useEffect(() => {
    if (!barrasRef.current || !circularRef.current) {
      return;
    }

    if (barrasChart.current) {
      barrasChart.current.destroy();
      barrasChart.current = null;
    }

    if (circularChart.current) {
      circularChart.current.destroy();
      circularChart.current = null;
    }

    // Gráfica de productos más vendidos
    barrasChart.current = new Chart(barrasRef.current, {
      type: 'bar',

      data: {
        labels: topProductos.map(producto => producto.nombre),

        datasets: [{
          label: 'Unidades vendidas',
          data: topProductos.map(producto => producto.cantidad),
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

    // Gráfica de comparación de ventas y compras
    circularChart.current = new Chart(circularRef.current, {
      type: 'doughnut',

      data: {
        labels: ['Ventas', 'Compras'],

        datasets: [{
          data: [totalVentas, totalCompras],

          backgroundColor: [
            '#16A34A',
            '#F59E0B'
          ],

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

  // Ajustar gráficas cuando se muestra la sección
  useEffect(() => {
    const ajustarGraficas = () => {
      if (barrasChart.current) {
        barrasChart.current.resize();
      }

      if (circularChart.current) {
        circularChart.current.resize();
      }
    };

    window.addEventListener(
      'reportesVistaMostrada',
      ajustarGraficas
    );

    return () => {
      window.removeEventListener(
        'reportesVistaMostrada',
        ajustarGraficas
      );
    };
  }, []);

  return (
    <section className="reportes">

      <div className="view-head">
        <h2>Reportes de ventas</h2>
        <p>Resumen de ventas y compras de la tienda</p>
      </div>

      {/* FILTRO DE PERIODO */}
      <div className="panel-box">
        <label htmlFor="periodoReporte">
          Periodo del reporte:
        </label>

        <select
          id="periodoReporte"
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
        >
          <option value="hoy">Hoy</option>
          <option value="semana">Últimos 7 días</option>
          <option value="mes">Últimos 30 días</option>
          <option value="todo">Todo</option>
        </select>
      </div>

      {/* INDICADORES PRINCIPALES */}
      <div className="reporte-kpis">

        <article className="panel-box">
          <h3>Total ventas</h3>
          <p>{formatoMoneda(totalVentas)}</p>
        </article>

        <article className="panel-box">
          <h3>Total compras</h3>
          <p>{formatoMoneda(totalCompras)}</p>
        </article>

        <article className="panel-box">
          <h3>Utilidad bruta</h3>
          <p>{formatoMoneda(utilidad)}</p>
        </article>

        <article className="panel-box">
          <h3>Ticket promedio</h3>
          <p>{formatoMoneda(ticketPromedio)}</p>
        </article>

      </div>

      {/* PRODUCTOS MAS VENDIDOS */}
      <div className="panel-box">
        <h3>Productos más vendidos</h3>

        {topProductos.length === 0 ? (
          <p>
            No hay ventas registradas en este periodo.
          </p>
        ) : (
          <div className="tabla-contenedor">
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
                    <td>
                      {formatoMoneda(producto.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GRAFICA DE PRODUCTOS */}
      <div className="panel-box">
        <h3>Unidades vendidas por producto</h3>

        <div
          style={{
            position: 'relative',
            height: '300px',
            width: '100%'
          }}
        >
          <canvas ref={barrasRef}></canvas>
        </div>
      </div>

      {/* GRAFICA DE COMPRAS Y VENTAS */}
      <div className="panel-box">
        <h3>Comparación de ventas y compras</h3>

        <div
          style={{
            position: 'relative',
            height: '300px',
            width: '100%'
          }}
        >
          <canvas ref={circularRef}></canvas>
        </div>
      </div>

      {/* RESUMEN */}
      <div className="panel-box">
        <h3>Resumen de operaciones</h3>

        <p>
          Operaciones de venta: <strong>{ventas.length}</strong>
        </p>

        <p>
          Operaciones de compra: <strong>{compras.length}</strong>
        </p>

        <p>
          Total de movimientos: <strong>{movimientosFiltrados.length}</strong>
        </p>
      </div>

    </section>
  );
}

export default Reportes;

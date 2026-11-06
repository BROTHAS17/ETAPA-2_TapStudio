
import React, { useEffect, useState } from 'react';
import { CLAVES, leerDatos } from './storage.js';

function Reportes() {
  const [movimientos, setMovimientos] = useState([]);
  const [periodo, setPeriodo] = useState('todo');

  const cargarMovimientos = () => {
    const datos = leerDatos(CLAVES.movimientos, []);
    setMovimientos(Array.isArray(datos) ? datos : []);
  };

  useEffect(() => {
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

  const obtenerFechaInicio = () => {
    const ahora = new Date();

    if (periodo === 'hoy') {
      return new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
      );
    }

    if (periodo === 'semana') {
      return new Date(Date.now() - 7 * 86400000);
    }

    if (periodo === 'mes') {
      return new Date(Date.now() - 30 * 86400000);
    }

    return new Date(0);
  };

  const fechaInicio = obtenerFechaInicio();

  const movimientosFiltrados = movimientos.filter(m =>
    new Date(m.fecha).getTime() >= fechaInicio.getTime()
  );

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
        nombre: venta.productoNombre,
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
    '$' + Number(valor).toFixed(2);

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
    </section>
  );
}

export default Reportes;


import React, { useEffect, useState } from 'react';

function HistorialVentas() {
  const [ventas, setVentas] = useState([]);

  const cargarVentas = () => {
    try {
      const datos = JSON.parse(
        localStorage.getItem('tiendita_ventas') || '[]'
      );

      setVentas(Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error('Error al cargar el historial:', error);
      setVentas([]);
    }
  };

  useEffect(() => {
    cargarVentas();

    window.addEventListener('ventaRegistrada', cargarVentas);
    window.addEventListener('tienditaDatosActualizados', cargarVentas);

    return () => {
      window.removeEventListener('ventaRegistrada', cargarVentas);
      window.removeEventListener('tienditaDatosActualizados', cargarVentas);
    };
  }, []);

  const formatoMoneda = valor =>
    '$' + Number(valor || 0).toFixed(2);

  const formatoFecha = fecha => {
    const fechaVenta = new Date(fecha);

    if (Number.isNaN(fechaVenta.getTime())) {
      return 'Fecha no disponible';
    }

    return fechaVenta.toLocaleString('es-SV');
  };

  return (
    <section className="historial-ventas">
      <h2>Historial de ventas</h2>

      {ventas.length === 0 ? (
        <p>Aún no hay ventas registradas.</p>
      ) : (
        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Total</th>
                <th>Vendedor</th>
              </tr>
            </thead>

            <tbody>
              {ventas
                .slice()
                .reverse()
                .map((venta, indice) => (
                  <tr key={venta.id ?? indice}>
                    <td>{formatoFecha(venta.fecha)}</td>
                    <td>{venta.producto}</td>
                    <td>{venta.cantidad}</td>
                    <td>{formatoMoneda(venta.precioUnitario)}</td>
                    <td>{formatoMoneda(venta.total)}</td>
                    <td>{venta.usuario}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <p>
        Total de operaciones: <strong>{ventas.length}</strong>
      </p>
    </section>
  );
}

export default HistorialVentas;


import React, { useEffect, useState } from 'react';

function Ventas() {
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const datos = JSON.parse(
      localStorage.getItem('tiendita_productos') || '[]'
    );
    setProductos(datos);
  }, []);

  const productoSeleccionado = productos.find(
    p => Number(p.id) === Number(productoId)
  );

  const total = productoSeleccionado
    ? Number(productoSeleccionado.precio) * Number(cantidad)
    : 0;

  const registrarVenta = () => {
    if (!productoSeleccionado || !Number.isSafeInteger(Number(cantidad)) || Number(cantidad) < 1) {
      setMensaje('Seleccione un producto e ingrese una cantidad válida.');
      return;
    }

    const productosActualizados = JSON.parse(
      localStorage.getItem('tiendita_productos') || '[]'
    );

    const productoActual = productosActualizados.find(
      p => Number(p.id) === Number(productoId)
    );

    if (!productoActual || Number(productoActual.stock) < Number(cantidad)) {
      setMensaje('No hay existencias suficientes.');
      return;
    }

    const ventas = JSON.parse(
      localStorage.getItem('tiendita_ventas') || '[]'
    );

    const sesion = JSON.parse(
      localStorage.getItem('tiendita_sesion') || 'null'
    );

    if (!sesion || !sesion.nombre || sesion.id == null) {
      setMensaje('Debe iniciar sesión para registrar una venta.');
      return;
    }

    const precio = Number(productoActual.precio);
    const totalVenta = precio * Number(cantidad);

    if (!Number.isFinite(totalVenta)) {
      setMensaje('No se pudo calcular el total.');
      return;
    }

    const venta = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      usuario: sesion.nombre,
      usuarioId: sesion.id,
      productoId: productoActual.id,
      producto: productoActual.nombre,
      precioUnitario: precio,
      cantidad: Number(cantidad),
      total: totalVenta
    };

    productoActual.stock = Number(productoActual.stock) - Number(cantidad);
    ventas.push(venta);

    try {
      localStorage.setItem(
        'tiendita_productos',
        JSON.stringify(productosActualizados)
      );
      localStorage.setItem(
        'tiendita_ventas',
        JSON.stringify(ventas)
      );

      setProductos(productosActualizados);
      setCantidad(1);
      setProductoId('');
      setMensaje('Venta registrada correctamente.');
      window.dispatchEvent(new Event('ventaRegistrada'));
    } catch (error) {
      setMensaje('Error al guardar la venta.');
    }
  };

  return (
    <div>
      <h2>Registrar venta</h2>

      <label>Producto</label>
      <select
        value={productoId}
        onChange={e => setProductoId(e.target.value)}
      >
        <option value="">Seleccione un producto</option>
        {productos.filter(p => Number(p.stock) > 0).map(p => (
          <option key={p.id} value={p.id}>
            {p.nombre} - ${Number(p.precio).toFixed(2)}
            (Stock: {p.stock})
          </option>
        ))}
      </select>

      <p>
        Stock disponible: {productoSeleccionado?.stock ?? '—'}
      </p>

      <label>Cantidad</label>
      <input
        type="number"
        min="1"
        step="1"
        value={cantidad}
        onChange={e => setCantidad(e.target.value)}
      />

      <h3>Total: ${total.toFixed(2)}</h3>

      <button onClick={registrarVenta}>
        Confirmar venta
      </button>

      <p>{mensaje}</p>
    </div>
  );
}

export default Ventas;

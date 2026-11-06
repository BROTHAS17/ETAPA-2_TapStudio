
import React, { useEffect, useState } from 'react';

function Ventas() {
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState('');

  const leerStorage = (clave, valorInicial) => {
    try {
      const datos = JSON.parse(localStorage.getItem(clave) || JSON.stringify(valorInicial));
      return datos;
    } catch {
      return valorInicial;
    }
  };

  useEffect(() => {
    const datos = leerStorage('tiendita_productos', []);
    setProductos(Array.isArray(datos) ? datos : []);
  }, []);

  const productoSeleccionado = productos.find(
    p => String(p.id) === String(productoId)
  );

  const total = productoSeleccionado
    ? Number(productoSeleccionado.precio) * Number(cantidad)
    : 0;

  const registrarVenta = () => {
    const cantidadVenta = Number(cantidad);

    if (
      !productoSeleccionado ||
      !Number.isSafeInteger(cantidadVenta) ||
      cantidadVenta < 1
    ) {
      setMensaje('Seleccione un producto e ingrese una cantidad válida.');
      return;
    }

    const productosActualizados = leerStorage('tiendita_productos', []);
    const ventas = leerStorage('tiendita_ventas', []);
    const movimientos = leerStorage('tiendita_movimientos', []);
    const sesion = leerStorage('tiendita_sesion', null);

    if (
      !Array.isArray(productosActualizados) ||
      !Array.isArray(ventas) ||
      !Array.isArray(movimientos)
    ) {
      setMensaje('No se pudieron leer correctamente los datos.');
      return;
    }

    const productoActual = productosActualizados.find(
      p => String(p.id) === String(productoId)
    );

    if (!productoActual || Number(productoActual.stock) < cantidadVenta) {
      setMensaje('No hay existencias suficientes.');
      return;
    }

    if (!sesion || !sesion.nombre || sesion.id == null) {
      setMensaje('Debe iniciar sesión para registrar una venta.');
      return;
    }

    const precio = Number(productoActual.precio);
    const costo = Number(productoActual.costo);

    if (
      !Number.isFinite(precio) ||
      precio < 0 ||
      !Number.isFinite(costo) ||
      costo < 0
    ) {
      setMensaje('El precio o costo del producto no es válido.');
      return;
    }

    const totalVenta = Math.round(precio * cantidadVenta * 100) / 100;
    const utilidad = Math.round(
      (precio - costo) * cantidadVenta * 100
    ) / 100;

    const fecha = new Date().toISOString();
    const idVenta = Date.now();

    const venta = {
      id: idVenta,
      fecha,
      usuario: sesion.nombre,
      usuarioId: sesion.id,
      productoId: productoActual.id,
      producto: productoActual.nombre,
      precioUnitario: precio,
      cantidad: cantidadVenta,
      total: totalVenta
    };

    const movimiento = {
      id: idVenta,
      tipo: 'venta',
      productoId: productoActual.id,
      productoNombre: productoActual.nombre,
      cantidad: cantidadVenta,
      precioUnitario: precio,
      total: totalVenta,
      utilidad,
      usuario: sesion.nombre,
      fecha
    };

    productoActual.stock = Number(productoActual.stock) - cantidadVenta;

    ventas.push(venta);
    movimientos.unshift(movimiento);

    const claves = [
      'tiendita_productos',
      'tiendita_ventas',
      'tiendita_movimientos'
    ];

    const respaldos = {};

    claves.forEach(clave => {
      respaldos[clave] = localStorage.getItem(clave);
    });

    try {
      localStorage.setItem(
        'tiendita_productos',
        JSON.stringify(productosActualizados)
      );

      localStorage.setItem(
        'tiendita_ventas',
        JSON.stringify(ventas)
      );

      localStorage.setItem(
        'tiendita_movimientos',
        JSON.stringify(movimientos)
      );

      setProductos(productosActualizados);
      setCantidad(1);
      setProductoId('');
      setMensaje('Venta registrada correctamente.');

      window.dispatchEvent(new Event('ventaRegistrada'));

    } catch (error) {
      claves.forEach(clave => {
        try {
          if (respaldos[clave] === null) {
            localStorage.removeItem(clave);
          } else {
            localStorage.setItem(clave, respaldos[clave]);
          }
        } catch (errorRestauracion) {
          console.error('Error al restaurar datos:', errorRestauracion);
        }
      });

      setMensaje('Error al guardar la venta. No se pudo completar la operación.');
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

        {productos
          .filter(p => Number(p.stock) > 0)
          .map(p => (
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

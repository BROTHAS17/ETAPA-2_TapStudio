
import React, { useEffect, useState } from 'react';
import { CLAVES, leerDatos, guardarDatos } from './storage.js';

function Ventas() {
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [mensaje, setMensaje] = useState('');

  const cargarProductos = () => {
    const datos = leerDatos(CLAVES.productos, []);
    setProductos(Array.isArray(datos) ? datos : []);
  };

  useEffect(() => {
    cargarProductos();

    const actualizar = () => cargarProductos();

    window.addEventListener('tienditaDatosActualizados', actualizar);

    return () => {
      window.removeEventListener('tienditaDatosActualizados', actualizar);
    };
  }, []);

  const productoSeleccionado = productos.find(
    p => String(p.id) === String(productoId)
  );

  const cantidadVenta = Number(cantidad);

  const total = productoSeleccionado && Number.isSafeInteger(cantidadVenta)
    ? Number(productoSeleccionado.precio) * cantidadVenta
    : 0;

  const registrarVenta = () => {
    const cantidadConfirmada = Number(cantidad);

    if (
      !productoSeleccionado ||
      !Number.isSafeInteger(cantidadConfirmada) ||
      cantidadConfirmada < 1
    ) {
      setMensaje('Seleccione un producto e ingrese una cantidad válida.');
      return;
    }

    const productosActualizados = leerDatos(CLAVES.productos, []);
    const ventas = leerDatos(CLAVES.ventas, []);
    const movimientos = leerDatos(CLAVES.movimientos, []);
    const sesion = leerDatos(CLAVES.sesion, null);

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

    if (
      !productoActual ||
      !Number.isSafeInteger(Number(productoActual.stock)) ||
      Number(productoActual.stock) < cantidadConfirmada
    ) {
      setMensaje('No hay existencias suficientes.');
      cargarProductos();
      return;
    }

    if (!sesion || !sesion.nombre || sesion.id == null) {
      setMensaje('Debe iniciar sesión para registrar una venta.');
      return;
    }

    const precio = Number(productoActual.precio);
    const costo = Number(productoActual.costo ?? 0);

    if (
      !Number.isFinite(precio) ||
      precio < 0 ||
      !Number.isFinite(costo) ||
      costo < 0
    ) {
      setMensaje('El precio o costo del producto no es válido.');
      return;
    }

    const totalVenta = Math.round(
      precio * cantidadConfirmada * 100
    ) / 100;

    const utilidad = Math.round(
      (precio - costo) * cantidadConfirmada * 100
    ) / 100;

    if (!Number.isFinite(totalVenta) || !Number.isFinite(utilidad)) {
      setMensaje('No se pudo calcular correctamente la venta.');
      return;
    }

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
      cantidad: cantidadConfirmada,
      total: totalVenta
    };

    const movimiento = {
      id: idVenta,
      tipo: 'venta',
      productoId: productoActual.id,
      productoNombre: productoActual.nombre,
      cantidad: cantidadConfirmada,
      precioUnitario: precio,
      total: totalVenta,
      utilidad,
      usuario: sesion.nombre,
      fecha
    };

    productoActual.stock =
      Number(productoActual.stock) - cantidadConfirmada;

    ventas.push(venta);
    movimientos.unshift(movimiento);

    const claves = [
      CLAVES.productos,
      CLAVES.ventas,
      CLAVES.movimientos
    ];

    const respaldos = {};

    claves.forEach(clave => {
      respaldos[clave] = localStorage.getItem(clave);
    });

    try {
      guardarDatos(CLAVES.productos, productosActualizados);
      guardarDatos(CLAVES.ventas, ventas);
      guardarDatos(CLAVES.movimientos, movimientos);

      setProductos(productosActualizados);
      setCantidad('1');
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

      cargarProductos();
      setMensaje('Error al guardar la venta. No se pudo completar la operación.');
    }
  };

  return (
    <div className="panel-box">
      <h2>Registrar venta</h2>

      <label htmlFor="productoVenta">Producto</label>

      <select
        id="productoVenta"
        value={productoId}
        onChange={e => {
          setProductoId(e.target.value);
          setMensaje('');
        }}
      >
        <option value="">Seleccione un producto</option>

        {productos
          .filter(p => Number(p.stock) > 0)
          .map(p => (
            <option key={p.id} value={p.id}>
              {p.nombre} - ${Number(p.precio).toFixed(2)}
              {' '}(Stock: {p.stock})
            </option>
          ))}
      </select>

      <p>
        Stock disponible: {productoSeleccionado?.stock ?? '—'}
      </p>

      <label htmlFor="cantidadVenta">Cantidad</label>

      <input
        id="cantidadVenta"
        type="number"
        min="1"
        step="1"
        value={cantidad}
        onChange={e => {
          setCantidad(e.target.value);
          setMensaje('');
        }}
      />

      <h3>
        Total: ${Number.isFinite(total) ? total.toFixed(2) : '0.00'}
      </h3>

      <button
        type="button"
        onClick={registrarVenta}
      >
        Confirmar venta
      </button>

      <p role="status">{mensaje}</p>
    </div>
  );
}

export default Ventas;

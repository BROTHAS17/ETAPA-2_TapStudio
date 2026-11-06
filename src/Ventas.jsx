
import React, { useEffect, useState } from 'react';
import { CLAVES, leerDatos, guardarDatos } from './storage.js';

function Ventas() {
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const datos = leerDatos(CLAVES.productos, []);
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

    // Validar producto y cantidad
    if (
      !productoSeleccionado ||
      !Number.isSafeInteger(cantidadVenta) ||
      cantidadVenta < 1
    ) {
      setMensaje('Seleccione un producto e ingrese una cantidad válida.');
      return;
    }

    // Leer los datos actuales
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

    // Buscar nuevamente el producto
    const productoActual = productosActualizados.find(
      p => String(p.id) === String(productoId)
    );

    // Validar existencias
    if (
      !productoActual ||
      !Number.isFinite(Number(productoActual.stock)) ||
      Number(productoActual.stock) < cantidadVenta
    ) {
      setMensaje('No hay existencias suficientes.');
      return;
    }

    // Validar sesión
    if (!sesion || !sesion.nombre || sesion.id == null) {
      setMensaje('Debe iniciar sesión para registrar una venta.');
      return;
    }

    // Obtener precio y costo
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

    // Calcular total y utilidad
    const totalVenta = Math.round(
      precio * cantidadVenta * 100
    ) / 100;

    const utilidad = Math.round(
      (precio - costo) * cantidadVenta * 100
    ) / 100;

    const fecha = new Date().toISOString();
    const idVenta = Date.now();

    // Registro para el historial de ventas React
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

    // Registro compatible con los reportes existentes
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

    // Actualizar inventario
    productoActual.stock =
      Number(productoActual.stock) - cantidadVenta;

    ventas.push(venta);
    movimientos.unshift(movimiento);

    // Guardar respaldo para poder restaurar si ocurre un error
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
      // Guardar los tres registros
      guardarDatos(CLAVES.productos, productosActualizados);
      guardarDatos(CLAVES.ventas, ventas);
      guardarDatos(CLAVES.movimientos, movimientos);

      // Actualizar la interfaz
      setProductos(productosActualizados);
      setCantidad(1);
      setProductoId('');
      setMensaje('Venta registrada correctamente.');

      // Avisar al historial de React
      window.dispatchEvent(new Event('ventaRegistrada'));

    } catch (error) {
      // Restaurar los datos anteriores si falla el guardado
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

      setMensaje(
        'Error al guardar la venta. No se pudo completar la operación.'
      );
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

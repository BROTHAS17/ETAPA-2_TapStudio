
export const CLAVES = {
  productos: 'tiendita_productos',
  ventas: 'tiendita_ventas',
  compras: 'tiendita_compras',
  movimientos: 'tiendita_movimientos',
  sesion: 'tiendita_sesion'
};

export function leerDatos(clave, valorInicial = []) {
  try {
    const contenido = localStorage.getItem(clave);

    if (contenido === null) {
      return valorInicial;
    }

    return JSON.parse(contenido);
  } catch (error) {
    console.error(`Error al leer ${clave}:`, error);
    return valorInicial;
  }
}

export function guardarDatos(clave, datos) {
  try {
    const contenido = JSON.stringify(datos);

    if (contenido === undefined) {
      throw new Error('Los datos no se pueden convertir a JSON.');
    }

    localStorage.setItem(clave, contenido);

    window.dispatchEvent(
      new CustomEvent('tienditaDatosActualizados', {
        detail: { clave }
      })
    );

    return true;
  } catch (error) {
    console.error(`Error al guardar ${clave}:`, error);
    throw error;
  }
}

function leerRegistros(clave) {
  const datos = leerDatos(clave);
  return Array.isArray(datos)
    ? datos.filter(registro => registro && typeof registro === 'object')
    : [];
}

function claveOperacion(tipo, registro) {
  return registro.id == null ? null : `${tipo}:${registro.id}`;
}

export function leerMovimientosConsolidados() {
  const movimientos = leerRegistros(CLAVES.movimientos);
  const ids = new Set(movimientos.map(movimiento => claveOperacion(movimiento.tipo, movimiento)));

  // El flujo antiguo de ventas asignaba IDs distintos a los dos registros.
  const ventasRegistradas = new Set(
    movimientos.filter(movimiento => movimiento.tipo === 'venta').map(claveVentaHistorica)
  );

  for (const tipo of ['venta', 'compra']) {
    const clave = tipo === 'venta' ? CLAVES.ventas : CLAVES.compras;
    for (const registro of leerRegistros(clave)) {
      const id = claveOperacion(tipo, registro);
      if (id !== null && ids.has(id)) continue;
      if (tipo === 'venta' && ventasRegistradas.has(claveVentaHistorica(registro))) continue;

      if (id !== null) ids.add(id);
      movimientos.push({
        ...registro,
        tipo,
        productoNombre: registro.productoNombre || registro.producto || 'Producto'
      });
    }
  }
  return movimientos;
}

function claveVentaHistorica(venta) {
  return JSON.stringify([
    venta.fecha,
    String(venta.productoId),
    Number(venta.cantidad),
    Number(venta.total),
    venta.usuario
  ]);
}
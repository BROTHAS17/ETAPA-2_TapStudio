
export const CLAVES = {
  productos: 'tiendita_productos',
  ventas: 'tiendita_ventas',
  movimientos: 'tiendita_movimientos',
  sesion: 'tiendita_sesion'
};

export function leerDatos(clave, valorInicial = []) {
  try {
    const datos = JSON.parse(
      localStorage.getItem(clave) || JSON.stringify(valorInicial)
    );

    return datos;
  } catch (error) {
    console.error(`Error al leer ${clave}:`, error);
    return valorInicial;
  }
}

export function guardarDatos(clave, datos) {
  localStorage.setItem(clave, JSON.stringify(datos));

  window.dispatchEvent(
    new CustomEvent('tienditaDatosActualizados', {
      detail: { clave }
    })
  );
}


export const CLAVES = {
  productos: 'tiendita_productos',
  ventas: 'tiendita_ventas',
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

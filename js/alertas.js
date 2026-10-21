/*
 * Mi Tiendita - Alertas con SweetAlert2
 * Funciones reutilizables para mostrar mensajes.
 */

// Mostrar mensaje de éxito
function mostrarExito(mensaje, titulo = '¡Correcto!') {
    return Swal.fire({
        title: titulo,
        text: mensaje,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#2563eb'
    });
}

// Mostrar mensaje de error
function mostrarError(mensaje, titulo = 'Ha ocurrido un error') {
    return Swal.fire({
        title: titulo,
        text: mensaje,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc2626'
    });
}

// Mostrar mensaje de advertencia
function mostrarAdvertencia(mensaje, titulo = 'Atención') {
    return Swal.fire({
        title: titulo,
        text: mensaje,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#d97706'
    });
}

// Confirmar una acción antes de ejecutarla
async function confirmarAccion({
    titulo = '¿Estás seguro?',
    mensaje = 'Esta acción requiere tu confirmación.',
    textoConfirmar = 'Sí, continuar',
    textoCancelar = 'Cancelar'
} = {}) {
    const resultado = await Swal.fire({
        title: titulo,
        text: mensaje,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: textoConfirmar,
        cancelButtonText: textoCancelar,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
        focusCancel: true
    });

    return resultado.isConfirmed;
}
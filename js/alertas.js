function mostrarExito(mensaje, titulo = '¡Correcto!') {
    return Swal.fire({
        title: titulo,
        text: mensaje,
        icon: 'success',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#D9A62E'
    });
}

function mostrarError(mensaje, titulo = 'Ha ocurrido un error') {
    return Swal.fire({
        title: titulo,
        text: mensaje,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#A8432B'
    });
}

function mostrarAdvertencia(mensaje, titulo = 'Atención') {
    return Swal.fire({
        title: titulo,
        text: mensaje,
        icon: 'warning',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#B4791E'
    });
}

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
        confirmButtonColor: '#A8432B',
        cancelButtonColor: '#52655A',
        reverseButtons: true,
        focusCancel: true
    });

    return resultado.isConfirmed;
}
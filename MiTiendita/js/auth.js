// =====================================================
// AUTENTICACIÓN - MI TIENDITA
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const formLogin = document.getElementById("formLogin");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const mensajeError = document.getElementById("mensajeError");

    // Si no estamos en la página de login, no ejecutar
    if (!formLogin || !emailInput || !passwordInput) {
        return;
    }

    // =====================================================
    // EXPRESIÓN REGULAR PARA VALIDAR EMAIL
    // =====================================================

    const EMAIL_REGEX =
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;


    // =====================================================
    // ENVÍO DEL FORMULARIO
    // =====================================================

    formLogin.addEventListener("submit", function (e) {

        e.preventDefault();

        limpiarValidaciones();

        let valido = true;

        const email = emailInput.value.trim();
        const password = passwordInput.value;


        // =================================================
        // VALIDAR CORREO
        // =================================================

        if (email === "") {

            mostrarError(
                emailInput,
                "Ingrese su correo electrónico."
            );

            valido = false;

        } else if (!EMAIL_REGEX.test(email)) {

            mostrarError(
                emailInput,
                "Ingrese un correo electrónico válido."
            );

            valido = false;
        }


        // =================================================
        // VALIDAR CONTRASEÑA
        // =================================================

        if (password === "") {

            mostrarError(
                passwordInput,
                "Ingrese su contraseña."
            );

            valido = false;

        } else if (password.length < 6) {

            mostrarError(
                passwordInput,
                "La contraseña debe tener al menos 6 caracteres."
            );

            valido = false;
        }


        // Si hay errores, detener el proceso
        if (!valido) {
            return;
        }


        // =================================================
        // OBTENER USUARIOS
        // =================================================

        const usuarios =
            JSON.parse(
                localStorage.getItem("tiendita_usuarios")
            ) || [];


        // =================================================
        // BUSCAR USUARIO
        // =================================================

        const usuario = usuarios.find(function (u) {

            return (
                u.email.toLowerCase() === email.toLowerCase() &&
                u.password === password
            );

        });


        // =================================================
        // LOGIN CORRECTO
        // =================================================

        if (usuario) {

            // Guardar solamente los datos necesarios
            // para mantener la sesión
            const sesion = {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            };

            localStorage.setItem(
                "tiendita_sesion",
                JSON.stringify(sesion)
            );


            // Redirigir al dashboard
            window.location.href = "dashboard.html";


        } else {

            // =================================================
            // LOGIN INCORRECTO
            // =================================================

            mensajeError.innerHTML = `
                <div class="alert alert-danger">
                    Correo o contraseña incorrectos.
                </div>
            `;

            passwordInput.value = "";
            passwordInput.focus();
        }

    });


    // =====================================================
    // MOSTRAR ERROR DE CAMPO
    // =====================================================

    function mostrarError(campo, mensaje) {

        campo.classList.add("is-invalid");

        const feedback =
            campo.parentElement.querySelector(".invalid-feedback");

        if (feedback) {
            feedback.textContent = mensaje;
        }
    }


    // =====================================================
    // LIMPIAR VALIDACIONES
    // =====================================================

    function limpiarValidaciones() {

        mensajeError.innerHTML = "";

        document
            .querySelectorAll(".form-control")
            .forEach(function (campo) {

                campo.classList.remove("is-invalid");
                campo.classList.remove("is-valid");

            });

        document
            .querySelectorAll(".invalid-feedback")
            .forEach(function (div) {

                div.textContent = "";

            });
    }

});


// =====================================================
// CERRAR SESIÓN
// =====================================================

function cerrarSesion() {

    localStorage.removeItem("tiendita_sesion");

    window.location.href = "login.html";
}

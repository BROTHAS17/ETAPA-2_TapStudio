document.addEventListener("DOMContentLoaded", function () {

    const formLogin = document.getElementById("formLogin");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const mensajeError = document.getElementById("mensajeError");

    if (!formLogin || !emailInput || !passwordInput) {
        return;
    }

    const EMAIL_REGEX =
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    formLogin.addEventListener("submit", function (e) {

        e.preventDefault();

        limpiarValidaciones();

        let valido = true;

        const email = emailInput.value.trim();
        const password = passwordInput.value;

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

        if (!valido) {
            return;
        }

        const usuarios =
            JSON.parse(
                localStorage.getItem("tiendita_usuarios")
            ) || [];

        const usuario = usuarios.find(function (u) {

            return (
                u.email.toLowerCase() === email.toLowerCase() &&
                u.password === password
            );

        });

        if (usuario) {

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

            window.location.href = "../index.html";

        } else {

            mensajeError.innerHTML = `
                <div class="alert alert-danger">
                    Correo o contraseña incorrectos.
                </div>
            `;

            passwordInput.value = "";
            passwordInput.focus();
        }

    });

    function mostrarError(campo, mensaje) {

        campo.classList.add("is-invalid");

        const feedback =
            campo.parentElement.querySelector(".invalid-feedback");

        if (feedback) {
            feedback.textContent = mensaje;
        }
    }

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

function cerrarSesion() {

    localStorage.removeItem("tiendita_sesion");

    window.location.href = "login.html";
}

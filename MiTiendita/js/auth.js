(function () {
  "use strict";

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  function fechaHaceDias(dias) {
    return new Date(Date.now() - dias * 86400000).toISOString();
  }

  function cargarDatosIniciales() {
    if (!localStorage.getItem("tiendita_usuarios")) {
      const usuarios = [
        {
          id: 1,
          nombre: "Admin General",
          email: "nathz93@hotmail.com",
          password: "Password123*",
          rol: "admin"
        },
        {
          id: 2,
          nombre: "Marilyn (Cajero)",
          email: "nathzvlz@gmail.com",
          password: "Password123*",
          rol: "vendedor"
        }
      ];
      localStorage.setItem("tiendita_usuarios", JSON.stringify(usuarios));
    }

    if (!localStorage.getItem("tiendita_productos")) {
      const productos = [
        {
          id: 1,
          codigo: "7411001001",
          nombre: "Agua Cristal 500ml",
          categoria: "Bebidas",
          costo: 0.50,
          precio: 1.00,
          stock: 5,
          stockMinimo: 24
        },
        {
          id: 2,
          codigo: "7411001002",
          nombre: "Coca-Cola 2.5L",
          categoria: "Bebidas",
          costo: 2.00,
          precio: 2.50,
          stock: 8,
          stockMinimo: 10
        },
        {
          id: 3,
          codigo: "7411001003",
          nombre: "Quesitos Diana 45g",
          categoria: "Snacks",
          costo: 0.15,
          precio: 0.25,
          stock: 12,
          stockMinimo: 20
        },
        {
          id: 4,
          codigo: "7411001004",
          nombre: "Leche Entera Salud 1L",
          categoria: "Lácteos",
          costo: 1.30,
          precio: 2.00,
          stock: 8,
          stockMinimo: 10
        },
        {
          id: 5,
          codigo: "7411001005",
          nombre: "Arroz Blanco 1kg",
          categoria: "Abarrotes",
          costo: 1.10,
          precio: 1.65,
          stock: 22,
          stockMinimo: 10
        },
        {
          id: 6,
          codigo: "7411001006",
          nombre: "Aceite Vegetal 1L",
          categoria: "Abarrotes",
          costo: 1.85,
          precio: 2.60,
          stock: 16,
          stockMinimo: 8
        }
      ];
      localStorage.setItem("tiendita_productos", JSON.stringify(productos));
    }

    if (!localStorage.getItem("tiendita_proveedores")) {
      const proveedores = [
        {
          id: 101,
          nombre: "Distribuidora Central",
          telefono: "2255-4400",
          correo: "ventas@distcentral.com",
          empresa: "Central S.A. de C.V.",
          direccion: "Boulevard del Ejército, San Salvador"
        },
        {
          id: 102,
          nombre: "Lácteos del Norte",
          telefono: "2288-9100",
          correo: "pedidos@lacteosnorte.com",
          empresa: "Lácteos del Norte",
          direccion: "Colonia Escalón, San Salvador"
        }
      ];
      localStorage.setItem("tiendita_proveedores", JSON.stringify(proveedores));
    }

    if (!localStorage.getItem("tiendita_compras")) {
      const compras = [
        {
          id: "c-1001",
          fecha: fechaHaceDias(5),
          proveedorId: 101,
          proveedor: "Distribuidora Central",
          productoId: 1,
          producto: "Agua Cristal 500ml",
          cantidad: 24,
          costoUnitario: 0.50,
          total: 12.00,
          usuario: "Admin General"
        },
        {
          id: "c-1002",
          fecha: fechaHaceDias(3),
          proveedorId: 102,
          proveedor: "Lácteos del Norte",
          productoId: 4,
          producto: "Leche Entera Salud 1L",
          cantidad: 15,
          costoUnitario: 1.30,
          total: 19.50,
          usuario: "Admin General"
        }
      ];
      localStorage.setItem("tiendita_compras", JSON.stringify(compras));
    }

    if (!localStorage.getItem("tiendita_ventas")) {
      const ventas = [
        {
          id: 2001,
          fecha: fechaHaceDias(4),
          usuario: "Marilyn (Cajero)",
          usuarioId: 2,
          productoId: 1,
          producto: "Agua Cristal 500ml",
          precioUnitario: 1.00,
          cantidad: 12,
          total: 12.00
        },
        {
          id: 2002,
          fecha: fechaHaceDias(2),
          usuario: "Marilyn (Cajero)",
          usuarioId: 2,
          productoId: 2,
          producto: "Coca-Cola 2.5L",
          precioUnitario: 2.50,
          cantidad: 6,
          total: 15.00
        },
        {
          id: 2003,
          fecha: fechaHaceDias(1),
          usuario: "Admin General",
          usuarioId: 1,
          productoId: 4,
          producto: "Leche Entera Salud 1L",
          precioUnitario: 2.00,
          cantidad: 5,
          total: 10.00
        },
        {
          id: 2004,
          fecha: fechaHaceDias(0),
          usuario: "Marilyn (Cajero)",
          usuarioId: 2,
          productoId: 3,
          producto: "Quesitos Diana 45g",
          precioUnitario: 0.25,
          cantidad: 16,
          total: 4.00
        }
      ];
      localStorage.setItem("tiendita_ventas", JSON.stringify(ventas));
    }

    if (!localStorage.getItem("tiendita_movimientos")) {
      const movimientos = [
        {
          id: 2004,
          tipo: "venta",
          productoId: 3,
          productoNombre: "Quesitos Diana 45g",
          cantidad: 16,
          precioUnitario: 0.25,
          total: 4.00,
          utilidad: 1.60,
          usuario: "Marilyn (Cajero)",
          fecha: fechaHaceDias(0)
        },
        {
          id: 2003,
          tipo: "venta",
          productoId: 4,
          productoNombre: "Leche Entera Salud 1L",
          cantidad: 5,
          precioUnitario: 2.00,
          total: 10.00,
          utilidad: 3.50,
          usuario: "Admin General",
          fecha: fechaHaceDias(1)
        },
        {
          id: 2002,
          tipo: "venta",
          productoId: 2,
          productoNombre: "Coca-Cola 2.5L",
          cantidad: 6,
          precioUnitario: 2.50,
          total: 15.00,
          utilidad: 3.00,
          usuario: "Marilyn (Cajero)",
          fecha: fechaHaceDias(2)
        },
        {
          id: "c-1002",
          tipo: "compra",
          productoId: 4,
          productoNombre: "Leche Entera Salud 1L",
          cantidad: 15,
          costoUnitario: 1.30,
          total: 19.50,
          proveedorNombre: "Lácteos del Norte",
          usuario: "Admin General",
          fecha: fechaHaceDias(3)
        },
        {
          id: 2001,
          tipo: "venta",
          productoId: 1,
          productoNombre: "Agua Cristal 500ml",
          cantidad: 12,
          precioUnitario: 1.00,
          total: 12.00,
          utilidad: 6.00,
          usuario: "Marilyn (Cajero)",
          fecha: fechaHaceDias(4)
        },
        {
          id: "c-1001",
          tipo: "compra",
          productoId: 1,
          productoNombre: "Agua Cristal 500ml",
          cantidad: 24,
          costoUnitario: 0.50,
          total: 12.00,
          proveedorNombre: "Distribuidora Central",
          usuario: "Admin General",
          fecha: fechaHaceDias(5)
        }
      ];
      localStorage.setItem("tiendita_movimientos", JSON.stringify(movimientos));
    }
  }

  cargarDatosIniciales();

  window.cerrarSesion = function () {
    localStorage.removeItem("tiendita_sesion");
    window.location.href = "login.html";
  };

  const mountNode = document.getElementById("login-root");
  if (!mountNode || !window.React || !window.ReactDOM) return;

  const { createElement: h, useState } = window.React;

  function AppLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errores, setErrores] = useState({});
    const [mensajeGeneral, setMensajeGeneral] = useState("");

    function cambiarEmail(e) {
      setEmail(e.target.value);
      setMensajeGeneral("");
      if (errores.email) {
        setErrores(function (prev) {
          return { ...prev, email: "" };
        });
      }
    }

    function cambiarPassword(e) {
      setPassword(e.target.value);
      setMensajeGeneral("");
      if (errores.password) {
        setErrores(function (prev) {
          return { ...prev, password: "" };
        });
      }
    }

    function handleSubmit(e) {
      e.preventDefault();
      setMensajeGeneral("");

      const nuevosErrores = {};
      const correoLimpio = email.trim();

      if (correoLimpio === "") {
        nuevosErrores.email = "Ingrese su correo electrónico.";
      } else if (!EMAIL_REGEX.test(correoLimpio)) {
        nuevosErrores.email = "Ingrese un correo electrónico válido.";
      }

      if (password === "") {
        nuevosErrores.password = "Ingrese su contraseña.";
      } else if (password.length < 6) {
        nuevosErrores.password = "La contraseña debe tener al menos 6 caracteres.";
      }

      if (Object.keys(nuevosErrores).length > 0) {
        setErrores(nuevosErrores);
        return;
      }

      setErrores({});

      let usuarios = [];
      try {
        usuarios = JSON.parse(localStorage.getItem("tiendita_usuarios")) || [];
      } catch (err) {
        usuarios = [];
      }

      const usuario = usuarios.find(function (u) {
        return (
          String(u.email || "").toLowerCase() === correoLimpio.toLowerCase() &&
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
        localStorage.setItem("tiendita_sesion", JSON.stringify(sesion));
        window.location.href = "../index.html";
      } else {
        setMensajeGeneral("Correo o contraseña incorrectos.");
        setPassword("");
      }
    }

    return h(
      "div",
      { id: "accessScreen" },
      h(
        "div",
        { className: "access-card" },
        h(
          "div",
          { className: "access-mark" },
          h(
            "svg",
            {
              width: 34,
              height: 34,
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: 1.5,
              strokeLinecap: "round",
              strokeLinejoin: "round"
            },
            h("path", { d: "M4 9l1-5h14l1 5" }),
            h("path", { d: "M3 9h18" }),
            h("path", { d: "M5 9v10h14V9" }),
            h("path", { d: "M9 19v-6h6v6" })
          )
        ),
        h("h1", null, "La Tiendita"),
        h("p", { className: "access-sub" }, "Sistema de inventario, compras y ventas"),
        mensajeGeneral
          ? h("div", { className: "alerta-login", role: "alert" }, mensajeGeneral)
          : null,
        h(
          "form",
          { id: "formLogin", onSubmit: handleSubmit, noValidate: true },
          h(
            "div",
            { className: "field" },
            h("label", { htmlFor: "email" }, "Correo electrónico"),
            h("input", {
              type: "email",
              id: "email",
              className: errores.email ? "campo-invalido" : "",
              placeholder: "Ingrese su correo",
              autoComplete: "username",
              value: email,
              onChange: cambiarEmail
            }),
            errores.email ? h("div", { className: "texto-error" }, errores.email) : null
          ),
          h(
            "div",
            { className: "field" },
            h("label", { htmlFor: "password" }, "Contraseña"),
            h("input", {
              type: "password",
              id: "password",
              className: errores.password ? "campo-invalido" : "",
              placeholder: "Ingrese su contraseña",
              autoComplete: "current-password",
              value: password,
              onChange: cambiarPassword
            }),
            errores.password ? h("div", { className: "texto-error" }, errores.password) : null
          ),
          h("button", { type: "submit", className: "btn btn-accent" }, "Ingresar")
        ),
        h(
          "div",
          { className: "footer-licencia" },
          "Licencia ",
          h(
            "a",
            {
              href: "https://creativecommons.org/licenses/by/4.0/deed.es",
              target: "_blank",
              rel: "noopener noreferrer"
            },
            "CC BY 4.0"
          )
        )
      )
    );
  }

  window.ReactDOM.createRoot(mountNode).render(h(AppLogin));
})();

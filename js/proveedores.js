(function () {
  "use strict";

  const LS_PROVEEDORES = "tiendita_proveedores";
  const LS_SESION = "tiendita_sesion";

  function obtenerSesion() {
    if (typeof window.verificarAcceso === "function") {
      return window.verificarAcceso(false);
    }
    try {
      const sesion = JSON.parse(localStorage.getItem(LS_SESION));
      if (!sesion) {
        window.location.href = "MiTiendita/login.html";
        return null;
      }
      return sesion;
    } catch (e) {
      window.location.href = "MiTiendita/login.html";
      return null;
    }
  }

  const sesion = obtenerSesion();
  if (!sesion) return;

  const mountNode = document.getElementById("proveedores-root");
  if (!mountNode || !window.React || !window.ReactDOM) return;

  const { createElement: h, useState, useEffect, useRef, Fragment } = window.React;

  const ESTADO_VACIO = {
    id: "",
    nombre: "",
    telefono: "",
    correo: "",
    empresa: "",
    direccion: ""
  };

  function leerProveedores() {
    try {
      const dato = localStorage.getItem(LS_PROVEEDORES);
      if (dato === null) return [];
      const lista = JSON.parse(dato);
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      return [];
    }
  }

  function guardarProveedores(lista) {
    localStorage.setItem(LS_PROVEEDORES, JSON.stringify(lista));
    window.dispatchEvent(
      new CustomEvent("tienditaDatosActualizados", {
        detail: { clave: LS_PROVEEDORES }
      })
    );
  }

  function FormularioProveedor({
    formulario,
    errores,
    mensaje,
    onCambiar,
    onSubmit,
    onLimpiar,
    formRef
  }) {
    const editando = Boolean(formulario.id);

    return h(
      "section",
      { className: "panel-box", ref: formRef },
      h("h3", { id: "tituloFormulario", className: "mb-3" }, editando ? "Editar proveedor" : "Registrar proveedor"),
      h(
        "form",
        { id: "formProveedor", onSubmit: onSubmit, noValidate: true },
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "nombreProveedor" }, "Nombre del proveedor *"),
          h("input", {
            type: "text",
            id: "nombreProveedor",
            maxLength: 100,
            className: errores.nombre ? "campo-invalido" : "",
            value: formulario.nombre,
            onChange: function (e) {
              onCambiar("nombre", e.target.value);
            }
          }),
          errores.nombre ? h("div", { className: "texto-error" }, errores.nombre) : null
        ),
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "telefonoProveedor" }, "Teléfono *"),
          h("input", {
            type: "tel",
            id: "telefonoProveedor",
            maxLength: 20,
            className: errores.telefono ? "campo-invalido" : "",
            value: formulario.telefono,
            onChange: function (e) {
              onCambiar("telefono", e.target.value);
            }
          }),
          errores.telefono ? h("div", { className: "texto-error" }, errores.telefono) : null
        ),
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "correoProveedor" }, "Correo electrónico"),
          h("input", {
            type: "email",
            id: "correoProveedor",
            maxLength: 120,
            className: errores.correo ? "campo-invalido" : "",
            value: formulario.correo,
            onChange: function (e) {
              onCambiar("correo", e.target.value);
            }
          }),
          errores.correo ? h("div", { className: "texto-error" }, errores.correo) : null
        ),
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "empresaProveedor" }, "Empresa"),
          h("input", {
            type: "text",
            id: "empresaProveedor",
            maxLength: 100,
            value: formulario.empresa,
            onChange: function (e) {
              onCambiar("empresa", e.target.value);
            }
          })
        ),
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "direccionProveedor" }, "Dirección"),
          h("textarea", {
            id: "direccionProveedor",
            rows: 3,
            maxLength: 250,
            value: formulario.direccion,
            onChange: function (e) {
              onCambiar("direccion", e.target.value);
            }
          })
        ),
        mensaje
          ? h("div", { className: "alert alert-" + mensaje.tipo + " mb-3" }, mensaje.texto)
          : null,
        h(
          "div",
          { className: "d-flex gap-2 mt-4" },
          h(
            "button",
            { type: "submit", className: "btn btn-accent flex-grow-1 py-2", id: "btnGuardarProveedor" },
            editando ? "Guardar cambios" : "Guardar proveedor"
          ),
          h(
            "button",
            { type: "button", className: "btn btn-ghost", id: "btnCancelarEdicion", onClick: onLimpiar },
            "Limpiar"
          )
        )
      )
    );
  }

  function TablaProveedores({ proveedores, busqueda, onBuscar, onEditar, onEliminar }) {
    return h(
      "section",
      { className: "panel-box" },
      h("h3", { className: "mb-3" }, "Proveedores registrados"),
      h(
        "div",
        { className: "field mb-3" },
        h("label", { htmlFor: "buscarProveedor" }, "Buscar proveedor"),
        h("input", {
          type: "search",
          id: "buscarProveedor",
          placeholder: "Buscar por nombre, empresa o teléfono",
          value: busqueda,
          onChange: function (e) {
            onBuscar(e.target.value);
          }
        })
      ),
      h(
        "div",
        { id: "estadoProveedores", className: "hint mb-3 small text-muted" },
        proveedores.length
          ? proveedores.length + " proveedor(es) encontrado(s)."
          : "No hay proveedores que mostrar."
      ),
      h(
        "div",
        { className: "card-table-wrap u-scroll" },
        h(
          "table",
          { className: "w-100" },
          h(
            "thead",
            null,
            h(
              "tr",
              null,
              h("th", null, "Proveedor"),
              h("th", null, "Contacto"),
              h("th", null, "Empresa"),
              h("th", null, "Acciones")
            )
          ),
          h(
            "tbody",
            { id: "tablaProveedores" },
            proveedores.length === 0
              ? h(
                  "tr",
                  null,
                  h(
                    "td",
                    { colSpan: 4, className: "text-center text-muted py-4" },
                    "No hay proveedores registrados."
                  )
                )
              : proveedores.map(function (p) {
                  return h(
                    "tr",
                    { key: p.id },
                    h("td", null, p.nombre || "—"),
                    h(
                      "td",
                      null,
                      h("div", null, p.telefono || "—"),
                      p.correo ? h("div", { className: "small text-muted" }, p.correo) : null
                    ),
                    h("td", null, p.empresa || "—"),
                    h(
                      "td",
                      null,
                      h(
                        "div",
                        { className: "d-flex flex-wrap gap-1" },
                        h(
                          "button",
                          {
                            type: "button",
                            className: "btn btn-ghost btn-small",
                            onClick: function () {
                              onEditar(p);
                            }
                          },
                          "Editar"
                        ),
                        h(
                          "button",
                          {
                            type: "button",
                            className: "btn btn-ghost btn-small text-danger",
                            onClick: function () {
                              onEliminar(p);
                            }
                          },
                          "Eliminar"
                        )
                      )
                    )
                  );
                })
          )
        )
      )
    );
  }

  function AppProveedores() {
    const [proveedores, setProveedores] = useState(leerProveedores);
    const [formulario, setFormulario] = useState(ESTADO_VACIO);
    const [errores, setErrores] = useState({});
    const [mensaje, setMensaje] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const formRef = useRef(null);

    useEffect(function () {
      function recargar() {
        setProveedores(leerProveedores());
      }

      window.addEventListener("tienditaDatosActualizados", recargar);
      window.addEventListener("storage", recargar);

      return function () {
        window.removeEventListener("tienditaDatosActualizados", recargar);
        window.removeEventListener("storage", recargar);
      };
    }, []);

    function cambiarCampo(campo, valor) {
      setFormulario(function (prev) {
        return { ...prev, [campo]: valor };
      });
      if (errores[campo]) {
        setErrores(function (prev) {
          return { ...prev, [campo]: "" };
        });
      }
      setMensaje(null);
    }

    function limpiarFormulario() {
      setFormulario(ESTADO_VACIO);
      setErrores({});
      setMensaje(null);
    }

    function validar() {
      const nuevosErrores = {};
      const nombreLimpio = formulario.nombre.trim();
      const telefonoLimpio = formulario.telefono.trim();
      const correoLimpio = formulario.correo.trim();

      if (!nombreLimpio) {
        nuevosErrores.nombre = "El nombre es obligatorio.";
      } else {
        const duplicado = proveedores.some(function (p) {
          return (
            String(p.nombre || "").trim().toLowerCase() === nombreLimpio.toLowerCase() &&
            String(p.id) !== String(formulario.id)
          );
        });
        if (duplicado) {
          nuevosErrores.nombre = "Ya existe un proveedor con ese nombre.";
        }
      }

      if (
        !telefonoLimpio ||
        !/^[0-9+\s()-]{7,20}$/.test(telefonoLimpio) ||
        !/\d{7,}/.test(telefonoLimpio.replace(/\D/g, ""))
      ) {
        nuevosErrores.telefono = "Ingresa un teléfono con al menos 7 dígitos.";
      }

      if (correoLimpio && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
        nuevosErrores.correo = "Ingresa un correo electrónico válido.";
      }

      setErrores(nuevosErrores);
      return Object.keys(nuevosErrores).length === 0;
    }

    function guardar(e) {
      e.preventDefault();
      setMensaje(null);

      if (!validar()) {
        setMensaje({
          tipo: "warning",
          texto: "Revisa los campos marcados antes de continuar."
        });
        return;
      }

      const registro = {
        id: formulario.id || Date.now(),
        nombre: formulario.nombre.trim(),
        telefono: formulario.telefono.trim(),
        correo: formulario.correo.trim(),
        empresa: formulario.empresa.trim(),
        direccion: formulario.direccion.trim()
      };

      try {
        const nuevos = formulario.id
          ? proveedores.map(function (p) {
              return String(p.id) === String(formulario.id) ? registro : p;
            })
          : proveedores.concat(registro);

        guardarProveedores(nuevos);
        setProveedores(nuevos);
        limpiarFormulario();

        if (typeof window.mostrarExito === "function") {
          window.mostrarExito("El proveedor se guardó correctamente.", "Proveedor guardado");
        }
      } catch (err) {
        setMensaje({
          tipo: "danger",
          texto: "No se pudo guardar el proveedor. Verifica el almacenamiento disponible."
        });
      }
    }

    function editar(proveedor) {
      setFormulario({
        id: String(proveedor.id),
        nombre: proveedor.nombre || "",
        telefono: proveedor.telefono || "",
        correo: proveedor.correo || "",
        empresa: proveedor.empresa || "",
        direccion: proveedor.direccion || ""
      });
      setErrores({});
      setMensaje(null);
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    async function eliminar(proveedor) {
      let confirmado = false;
      if (typeof window.confirmarAccion === "function") {
        confirmado = await window.confirmarAccion({
          titulo: "¿Eliminar proveedor?",
          mensaje: 'Se eliminará "' + proveedor.nombre + '".',
          textoConfirmar: "Sí, eliminar",
          textoCancelar: "Cancelar"
        });
      } else {
        confirmado = window.confirm('¿Eliminar "' + proveedor.nombre + '"?');
      }

      if (!confirmado) return;

      try {
        const nuevos = proveedores.filter(function (item) {
          return String(item.id) !== String(proveedor.id);
        });
        guardarProveedores(nuevos);
        setProveedores(nuevos);
        if (String(formulario.id) === String(proveedor.id)) {
          limpiarFormulario();
        }
        if (typeof window.mostrarExito === "function") {
          window.mostrarExito("El proveedor se eliminó correctamente.", "Proveedor eliminado");
        }
      } catch (err) {
        setMensaje({
          tipo: "danger",
          texto: "No se pudo eliminar el proveedor."
        });
      }
    }

    const filtro = busqueda.trim().toLowerCase();
    const filtrados = proveedores.filter(function (p) {
      return [p.nombre, p.empresa, p.telefono, p.correo].some(function (valor) {
        return String(valor || "").toLowerCase().includes(filtro);
      });
    });

    return h(
      Fragment,
      null,
      h(
        "div",
        { className: "view-head" },
        h("h2", null, "Proveedores"),
        h("p", null, "Registra y administra los proveedores oficiales de la tienda.")
      ),
      h(
        "div",
        { className: "two-col" },
        h(FormularioProveedor, {
          formulario: formulario,
          errores: errores,
          mensaje: mensaje,
          onCambiar: cambiarCampo,
          onSubmit: guardar,
          onLimpiar: limpiarFormulario,
          formRef: formRef
        }),
        h(TablaProveedores, {
          proveedores: filtrados,
          busqueda: busqueda,
          onBuscar: setBusqueda,
          onEditar: editar,
          onEliminar: eliminar
        })
      )
    );
  }

  window.ReactDOM.createRoot(mountNode).render(h(AppProveedores));
})();

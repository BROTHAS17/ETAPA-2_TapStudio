
(function () {
  "use strict";

  const LS_PROVEEDORES = "tiendita_proveedores";
  const LS_SESION = "tiendita_sesion";

  const form = document.getElementById("formProveedor");
  const proveedorId = document.getElementById("proveedorId");
  const nombre = document.getElementById("nombreProveedor");
  const telefono = document.getElementById("telefonoProveedor");
  const correo = document.getElementById("correoProveedor");
  const empresa = document.getElementById("empresaProveedor");
  const direccion = document.getElementById("direccionProveedor");
  const mensaje = document.getElementById("mensajeProveedor");
  const tabla = document.getElementById("tablaProveedores");
  const buscar = document.getElementById("buscarProveedor");
  const estado = document.getElementById("estadoProveedores");
  const titulo = document.getElementById("tituloFormulario");
  const btnGuardar = document.getElementById("btnGuardarProveedor");
  const btnLimpiar = document.getElementById("btnCancelarEdicion");

  let proveedores = [];

  function obtenerSesion() {
    try {
      return JSON.parse(localStorage.getItem(LS_SESION));
    } catch {
      return null;
    }
  }

  function leerProveedores() {
    const dato = localStorage.getItem(LS_PROVEEDORES);

    if (dato === null) return [];

    const lista = JSON.parse(dato);

    if (!Array.isArray(lista)) {
      throw new Error("Los datos de proveedores no tienen un formato válido.");
    }

    return lista;
  }

  function guardarProveedores(lista) {
    localStorage.setItem(LS_PROVEEDORES, JSON.stringify(lista));
  }

  function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "alert alert-" + tipo;
  }

  function limpiarMensaje() {
    mensaje.textContent = "";
    mensaje.className = "alert d-none";
  }

  function limpiarFormulario() {
    form.reset();
    proveedorId.value = "";
    titulo.textContent = "Registrar proveedor";
    btnGuardar.textContent = "Guardar proveedor";
    [nombre, telefono, correo].forEach(campo => {
      campo.classList.remove("is-invalid");
      campo.setCustomValidity("");
    });
    limpiarMensaje();
  }

  function validarFormulario() {
    let valido = true;

    [nombre, telefono, correo].forEach(campo => {
      campo.classList.remove("is-invalid");
      campo.setCustomValidity("");
    });

    if (!nombre.value.trim()) {
      nombre.setCustomValidity("El nombre es obligatorio.");
      nombre.classList.add("is-invalid");
      valido = false;
    }

    const numero = telefono.value.trim();

    if (!numero || !/^[0-9+\s()-]{7,20}$/.test(numero) ||
        !/\d{7,}/.test(numero.replace(/\D/g, ""))) {
      telefono.setCustomValidity("Ingresa un teléfono con al menos 7 dígitos.");
      telefono.classList.add("is-invalid");
      valido = false;
    }

    if (correo.value.trim() && !correo.checkValidity()) {
      correo.classList.add("is-invalid");
      valido = false;
    }

    const nombreNormalizado = nombre.value.trim().toLocaleLowerCase();

    const duplicado = proveedores.some(p =>
      String(p.nombre || "").trim().toLocaleLowerCase() === nombreNormalizado &&
      String(p.id) !== proveedorId.value
    );

    if (duplicado) {
      nombre.setCustomValidity("Ya existe un proveedor con ese nombre.");
      nombre.classList.add("is-invalid");
      mostrarMensaje("Ya existe un proveedor con ese nombre.", "warning");
      valido = false;
    }

    return valido;
  }

  function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto || "—";
    return celda;
  }

  function renderizarProveedores() {
    const filtro = buscar.value.trim().toLocaleLowerCase();

    const lista = proveedores.filter(p =>
      [p.nombre, p.empresa, p.telefono, p.correo]
        .some(valor => String(valor || "").toLocaleLowerCase().includes(filtro))
    );

    tabla.replaceChildren();

    lista.forEach(p => {
      const fila = document.createElement("tr");
      fila.append(
        crearCelda(p.nombre),
        crearCelda([p.telefono, p.correo].filter(Boolean).join("\n")),
        crearCelda(p.empresa)
      );

      const acciones = document.createElement("td");

      const editar = document.createElement("button");
      editar.type = "button";
      editar.className = "btn btn-sm btn-outline-primary me-1 mb-1";
      editar.textContent = "Editar";
      editar.addEventListener("click", () => editarProveedor(p.id));

      const eliminar = document.createElement("button");
      eliminar.type = "button";
      eliminar.className = "btn btn-sm btn-outline-danger mb-1";
      eliminar.textContent = "Eliminar";
      eliminar.addEventListener("click", () => eliminarProveedor(p.id));

      acciones.append(editar, eliminar);
      fila.appendChild(acciones);
      tabla.appendChild(fila);
    });

    estado.textContent = lista.length
      ? `${lista.length} proveedor(es) encontrado(s).`
      : "No hay proveedores que mostrar.";
  }

  function editarProveedor(id) {
    const p = proveedores.find(item => String(item.id) === String(id));
    if (!p) return;

    proveedorId.value = p.id;
    nombre.value = p.nombre || "";
    telefono.value = p.telefono || "";
    correo.value = p.correo || "";
    empresa.value = p.empresa || "";
    direccion.value = p.direccion || "";

    titulo.textContent = "Editar proveedor";
    btnGuardar.textContent = "Guardar cambios";
    limpiarMensaje();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function eliminarProveedor(id) {
    const p = proveedores.find(item => String(item.id) === String(id));
    if (!p) return;

    if (!confirm(`¿Deseas eliminar al proveedor "${p.nombre}"?`)) return;

    try {
      const nuevas = proveedores.filter(item => String(item.id) !== String(id));
      guardarProveedores(nuevas);
      proveedores = nuevas;
      renderizarProveedores();
      limpiarFormulario();
      mostrarMensaje("Proveedor eliminado correctamente.", "success");
    } catch (error) {
      mostrarMensaje("No se pudo guardar el cambio: " + error.message, "danger");
    }
  }

  form.addEventListener("submit", evento => {
    evento.preventDefault();
    limpiarMensaje();

    if (!validarFormulario()) {
      form.classList.add("was-validated");
      if (!mensaje.classList.contains("d-none")) return;
      mostrarMensaje("Revisa los campos marcados antes de continuar.", "warning");
      return;
    }

    const id = proveedorId.value;
    const proveedor = {
      id: id || Date.now(),
      nombre: nombre.value.trim(),
      telefono: telefono.value.trim(),
      correo: correo.value.trim(),
      empresa: empresa.value.trim(),
      direccion: direccion.value.trim()
    };

    try {
      const nuevos = id
        ? proveedores.map(p => String(p.id) === id ? proveedor : p)
        : [...proveedores, proveedor];

      guardarProveedores(nuevos);
      proveedores = nuevos;
      limpiarFormulario();
      renderizarProveedores();
      mostrarMensaje("Proveedor guardado correctamente.", "success");
    } catch (error) {
      mostrarMensaje("No se pudo guardar el proveedor. Verifica el almacenamiento disponible.", "danger");
      console.error(error);
    }
  });

  btnLimpiar.addEventListener("click", limpiarFormulario);
  buscar.addEventListener("input", renderizarProveedores);

  const sesion = obtenerSesion();

  if (!sesion) {
    window.location.href = "MiTiendita/login.html";
    return;
  }

  try {
    proveedores = leerProveedores();
    renderizarProveedores();
  } catch (error) {
    mostrarMensaje(error.message, "danger");
  }
})();

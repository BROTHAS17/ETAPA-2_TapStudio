(function () {
  "use strict";

  const LS_PRODUCTOS = "tiendita_productos";
  const LS_VENTAS = "tiendita_ventas";
  const LS_SESION = "tiendita_sesion";

  const formVenta = document.getElementById("formVenta");
  const selectProducto = document.getElementById("selectProducto");
  const infoStock = document.getElementById("infoStock");
  const inputCantidad = document.getElementById("inputCantidad");
  const advertenciaStock = document.getElementById("advertenciaStock");
  const btnConfirmarVenta = document.getElementById("btnConfirmarVenta");
  const mensajeResultado = document.getElementById("mensajeResultado");
  const estadoCarga = document.getElementById("estadoCarga");
  const resumenProducto = document.getElementById("resumenProducto");
  const resumenPrecio = document.getElementById("resumenPrecio");
  const resumenCantidad = document.getElementById("resumenCantidad");
  const resumenTotal = document.getElementById("resumenTotal");
  const nombreVendedor = document.getElementById("nombreVendedor");

  let productosDisponibles = [];
  let ventaEnProceso = false;

  // Lee una lista de localStorage y comprueba que sea un arreglo.
  function leerLista(clave) {
    try {
      const contenido = localStorage.getItem(clave);

      if (contenido === null) {
        return [];
      }

      const datos = JSON.parse(contenido);
      return Array.isArray(datos) ? datos : [];
    } catch (error) {
      console.error(`No se pudo leer ${clave}:`, error);
      return [];
    }
  }

  // Guarda una lista. Si falla, el error se comunica a quien la invoca.
  function guardarLista(clave, lista) {
    localStorage.setItem(clave, JSON.stringify(lista));
  }

  function formatearMoneda(valor) {
    const numero = Number(valor);
    return "$" + (Number.isFinite(numero) ? numero : 0).toFixed(2);
  }

  function obtenerSesion() {
    try {
      const sesion = JSON.parse(localStorage.getItem(LS_SESION));

      if (
        !sesion ||
        typeof sesion !== "object" ||
        !sesion.nombre ||
        sesion.id === undefined ||
        sesion.id === null
      ) {
        return null;
      }

      return sesion;
    } catch (error) {
      return null;
    }
  }

  function obtenerProductoSeleccionado() {
    const id = Number(selectProducto.value);

    if (!selectProducto.value) {
      return null;
    }

    return (
      productosDisponibles.find(
        producto => Number(producto.id) === id
      ) || null
    );
  }

  function mostrarMensaje(texto, tipo) {
    mensajeResultado.textContent = texto;
    mensajeResultado.className =
      "mensaje " + (tipo === "error" ? "error" : "exito");
  }

  function limpiarMensaje() {
    mensajeResultado.textContent = "";
    mensajeResultado.className = "mensaje";
  }

  function mostrarAdvertencia(texto) {
    advertenciaStock.textContent = texto;
    advertenciaStock.classList.add("visible");
  }

  function ocultarAdvertencia() {
    advertenciaStock.textContent = "";
    advertenciaStock.classList.remove("visible");
  }

  function productoValido(producto) {
    if (!producto || typeof producto !== "object") {
      return false;
    }

    const precio = Number(producto.precio);
    const stock = Number(producto.stock);

    return (
      producto.id !== undefined &&
      producto.id !== null &&
      typeof producto.nombre === "string" &&
      producto.nombre.trim() !== "" &&
      Number.isFinite(precio) &&
      precio > 0 &&
      Number.isSafeInteger(stock) &&
      stock >= 0
    );
  }

  function renderizarProductos() {
    selectProducto.innerHTML = "";

    const disponibles = productosDisponibles.filter(producto =>
      productoValido(producto) && Number(producto.stock) > 0
    );

    if (!disponibles.length) {
      const opcion = document.createElement("option");
      opcion.value = "";
      opcion.disabled = true;
      opcion.selected = true;
      opcion.textContent = "No hay productos con existencias disponibles";
      selectProducto.appendChild(opcion);
      return;
    }

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.disabled = true;
    opcionInicial.selected = true;
    opcionInicial.textContent = "Seleccione un producto…";
    selectProducto.appendChild(opcionInicial);

    disponibles.forEach(producto => {
      const opcion = document.createElement("option");
      opcion.value = String(producto.id);
      opcion.textContent =
        `${producto.nombre} — ${formatearMoneda(producto.precio)} ` +
        `(stock: ${producto.stock})`;

      selectProducto.appendChild(opcion);
    });
  }

  function cargarProductos() {
    estadoCarga.textContent = "";

    productosDisponibles = leerLista(LS_PRODUCTOS);
    renderizarProductos();
    actualizarResumenYValidacion();
  }

  function actualizarResumenYValidacion() {
    const producto = obtenerProductoSeleccionado();
    const cantidad = Number(inputCantidad.value);

    limpiarMensaje();
    btnConfirmarVenta.disabled = true;

    if (!producto || !productoValido(producto)) {
      resumenProducto.textContent = "—";
      resumenPrecio.textContent = formatearMoneda(0);
      resumenCantidad.textContent = "0";
      resumenTotal.textContent = formatearMoneda(0);
      infoStock.textContent = "Existencias disponibles: —";
      ocultarAdvertencia();
      return;
    }

    const precio = Number(producto.precio);
    const stock = Number(producto.stock);
    const cantidadValida =
      inputCantidad.value.trim() !== "" &&
      Number.isSafeInteger(cantidad) &&
      cantidad >= 1;

    infoStock.textContent = `Existencias disponibles: ${stock}`;
    resumenProducto.textContent = producto.nombre;
    resumenPrecio.textContent = formatearMoneda(precio);
    resumenCantidad.textContent = cantidadValida ? String(cantidad) : "0";
    resumenTotal.textContent = formatearMoneda(
      cantidadValida ? precio * cantidad : 0
    );

    if (!cantidadValida) {
      mostrarAdvertencia(
        "Ingrese una cantidad válida (entero mayor o igual a 1)."
      );
      return;
    }
    if (cantidad > stock) {
    mostrarAdvertencia(
        `La cantidad solicitada (${cantidad}) supera el stock disponible (${stock}).`
    );
    if (typeof mostrarError === "function") {
        mostrarError(
            `Solicitaste ${cantidad} unidades, pero solo hay ${stock} disponibles.`,
            "Stock insuficiente"
        );
    }
    return;
}

    ocultarAdvertencia();
    btnConfirmarVenta.disabled = ventaEnProceso;
  }

  function restaurarDato(clave, contenidoOriginal) {
    if (contenidoOriginal === null) {
      localStorage.removeItem(clave);
    } else {
      localStorage.setItem(clave, contenidoOriginal);
    }
  }

  function confirmarVenta(evento) {
    evento.preventDefault();

    if (ventaEnProceso) {
      return;
    }

    const sesion = obtenerSesion();

    if (!sesion) {
      window.location.href = "MiTiendita/login.html";
      return;
    }

    const productoSeleccionado = obtenerProductoSeleccionado();
    const cantidad = Number(inputCantidad.value);

    if (
      !productoSeleccionado ||
      !Number.isSafeInteger(cantidad) ||
      inputCantidad.value.trim() === "" ||
      cantidad < 1
    ) {
      mostrarMensaje(
        "Seleccione un producto e ingrese una cantidad válida.",
        "error"
      );
      actualizarResumenYValidacion();
      return;
    }

    ventaEnProceso = true;
    btnConfirmarVenta.disabled = true;
    limpiarMensaje();

    // Conserva el contenido original para intentar restaurarlo
    // si alguno de los guardados falla.
    let productosOriginales = null;
    let ventasOriginales = null;
    let guardadoIniciado = false;

    try {
      productosOriginales = localStorage.getItem(LS_PRODUCTOS);
      ventasOriginales = localStorage.getItem(LS_VENTAS);

      const productos = leerLista(LS_PRODUCTOS);
      const ventas = leerLista(LS_VENTAS);

      const productoActual = productos.find(
        producto =>
          Number(producto.id) === Number(productoSeleccionado.id)
      );

      // Se vuelve a validar con los datos almacenados al confirmar.
      if (!productoValido(productoActual)) {
        throw new Error(
          "El producto ya no existe o sus datos son inválidos. Recargue la pantalla."
        );
      }

      const stockActual = Number(productoActual.stock);
      const precioActual = Number(productoActual.precio);

      if (stockActual < cantidad) {
        throw new Error(
          `Stock insuficiente. Existencias actuales: ${stockActual}.`
        );
      }

      const total = precioActual * cantidad;

      if (!Number.isFinite(total)) {
        throw new Error("No se pudo calcular el total de la venta.");
      }

      const venta = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        usuario: sesion.nombre,
        usuarioId: sesion.id,
        productoId: productoActual.id,
        producto: productoActual.nombre,
        precioUnitario: precioActual,
        cantidad: cantidad,
        total: total
      };

      // Prepara ambos cambios antes de guardarlos.
      productoActual.stock = stockActual - cantidad;
      ventas.push(venta);

      guardadoIniciado = true;

      // Si el segundo guardado falla, se intenta restaurar el primero.
      guardarLista(LS_PRODUCTOS, productos);
      guardarLista(LS_VENTAS, ventas);

      mostrarMensaje(
    `Venta registrada: ${cantidad} × ${productoActual.nombre} = ${formatearMoneda(total)}.`,
    "exito"
);

if (typeof mostrarExito === "function") {
    mostrarExito(
        `Se vendieron ${cantidad} unidades de ${productoActual.nombre} por ${formatearMoneda(total)}.`,
        "¡Venta registrada!"
    );
}

      formVenta.reset();
      inputCantidad.value = "1";

      cargarProductos();
    } catch (error) {
      console.error("Error al registrar la venta:", error);

      if (guardadoIniciado) {
        try {
          restaurarDato(LS_PRODUCTOS, productosOriginales);
          restaurarDato(LS_VENTAS, ventasOriginales);
        } catch (errorRestauracion) {
          console.error(
            "No fue posible restaurar todos los datos originales:",
            errorRestauracion
          );

          mostrarMensaje(
            "Ocurrió un error al guardar y no se pudo confirmar la restauración de los datos. Verifique el inventario y el historial de ventas antes de continuar.",
            "error"
          );

          cargarProductos();
          return;
        }
      }

      mostrarMensaje(
        error.message || "No se pudo registrar la venta.",
        "error"
      );

      cargarProductos();
    } finally {
      ventaEnProceso = false;
      actualizarResumenYValidacion();
    }
  }

  const sesion = obtenerSesion();

  if (!sesion) {
    window.location.href = "MiTiendita/login.html";
    return;
  }

  nombreVendedor.textContent = sesion.nombre;

  selectProducto.addEventListener(
    "change",
    actualizarResumenYValidacion
  );

  inputCantidad.addEventListener(
    "input",
    actualizarResumenYValidacion
  );

  formVenta.addEventListener("submit", confirmarVenta);

  cargarProductos();
})();

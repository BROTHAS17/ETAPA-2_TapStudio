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

  function leerLista(clave) {
    try {
      return JSON.parse(localStorage.getItem(clave)) || [];
    } catch {
      return [];
    }
  }

  function guardarLista(clave, lista) {
    localStorage.setItem(clave, JSON.stringify(lista));
  }

  function formatearMoneda(valor) {
    return "$" + (Number(valor) || 0).toFixed(2);
  }

  function obtenerSesion() {
    try { return JSON.parse(localStorage.getItem(LS_SESION)); }
    catch { return null; }
  }

  function obtenerProductoSeleccionado() {
    const id = Number(selectProducto.value);
    return productosDisponibles.find(producto => Number(producto.id) === id) || null;
  }

  function mostrarMensaje(texto, tipo) {
    mensajeResultado.textContent = texto;
    mensajeResultado.className = "mensaje " + (tipo === "error" ? "error" : "exito");
  }

  function limpiarMensaje() {
    mensajeResultado.textContent = "";
    mensajeResultado.className = "mensaje";
  }

  function renderizarProductos() {
    selectProducto.innerHTML = "";
    const disponibles = productosDisponibles.filter(p => Number(p.stock) > 0);

    if (!disponibles.length) {
      selectProducto.innerHTML = '<option value="" disabled selected>No hay productos con existencias disponibles</option>';
      return;
    }

    selectProducto.innerHTML = '<option value="" disabled selected>Seleccione un producto…</option>';
    disponibles.forEach(producto => {
      const option = document.createElement("option");
      option.value = producto.id;
      option.textContent = `${producto.nombre} — ${formatearMoneda(producto.precio)} (stock: ${producto.stock})`;
      selectProducto.appendChild(option);
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

    if (!producto) {
      resumenProducto.textContent = "—";
      resumenPrecio.textContent = formatearMoneda(0);
      resumenCantidad.textContent = "0";
      resumenTotal.textContent = formatearMoneda(0);
      infoStock.textContent = "Existencias disponibles: —";
      advertenciaStock.classList.remove("visible");
      btnConfirmarVenta.disabled = true;
      return;
    }

    const cantidadValida = Number.isInteger(cantidad) && cantidad >= 1;
    infoStock.textContent = `Existencias disponibles: ${producto.stock}`;
    resumenProducto.textContent = producto.nombre;
    resumenPrecio.textContent = formatearMoneda(producto.precio);
    resumenCantidad.textContent = cantidadValida ? String(cantidad) : "0";
    resumenTotal.textContent = formatearMoneda(cantidadValida ? producto.precio * cantidad : 0);

    if (!cantidadValida) {
      advertenciaStock.textContent = "Ingrese una cantidad válida (entero mayor o igual a 1).";
      advertenciaStock.classList.add("visible");
      btnConfirmarVenta.disabled = true;
      return;
    }

    if (cantidad > Number(producto.stock)) {
      advertenciaStock.textContent = `La cantidad solicitada (${cantidad}) supera el stock disponible (${producto.stock}).`;
      advertenciaStock.classList.add("visible");
      btnConfirmarVenta.disabled = true;
      return;
    }

    advertenciaStock.classList.remove("visible");
    btnConfirmarVenta.disabled = false;
  }

  function confirmarVenta(evento) {
    evento.preventDefault();
    if (ventaEnProceso) return;

    const sesion = obtenerSesion();
    if (!sesion) {
      window.location.href = "MiTiendita/login.html";
      return;
    }

    const producto = obtenerProductoSeleccionado();
    const cantidad = Number(inputCantidad.value);

    if (!producto || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > Number(producto.stock)) {
      mostrarMensaje("Seleccione un producto y una cantidad válida.", "error");
      actualizarResumenYValidacion();
      return;
    }

    ventaEnProceso = true;
    btnConfirmarVenta.disabled = true;

    try {
      const productos = leerLista(LS_PRODUCTOS);
      const productoActual = productos.find(p => Number(p.id) === Number(producto.id));

      if (!productoActual || Number(productoActual.stock) < cantidad) {
        throw new Error("El stock cambió. Actualice la pantalla e intente nuevamente.");
      }

      productoActual.stock = Number(productoActual.stock) - cantidad;
      guardarLista(LS_PRODUCTOS, productos);

      const ventas = leerLista(LS_VENTAS);
      const venta = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        usuario: sesion.nombre,
        usuarioId: sesion.id,
        productoId: productoActual.id,
        producto: productoActual.nombre,
        precioUnitario: Number(productoActual.precio),
        cantidad,
        total: Number(productoActual.precio) * cantidad
      };

      ventas.push(venta);
      guardarLista(LS_VENTAS, ventas);

      mostrarMensaje(`Venta registrada: ${cantidad} × ${productoActual.nombre} = ${formatearMoneda(venta.total)}.`, "exito");
      formVenta.reset();
      inputCantidad.value = 1;
      cargarProductos();
    } catch (error) {
      console.error("Error al registrar la venta:", error);
      mostrarMensaje(error.message || "No se pudo registrar la venta.", "error");
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
  selectProducto.addEventListener("change", actualizarResumenYValidacion);
  inputCantidad.addEventListener("input", actualizarResumenYValidacion);
  formVenta.addEventListener("submit", confirmarVenta);
  cargarProductos();
})();
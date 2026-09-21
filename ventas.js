/**
 * js/ventas.js
 * -------------------------------------------------------------------------
 * Módulo 5.4 — Punto de Venta Ágil (Cobro Directo) y Deducción de Existencias
 * Autor de la tarea: Walber Ernesto Echegoyen Diaz (ED262823)
 * Rama: feature/punto-venta
 *
 * Responsabilidades de este archivo:
 *   1. Cargar en el <select> los productos con existencias > 0.
 *   2. Calcular en tiempo real el total (precio unitario × cantidad).
 *   3. Validar que la cantidad no supere el stock, deshabilitando el botón
 *      "Confirmar Venta" y mostrando una advertencia cuando corresponda.
 *   4. Al confirmar la venta: deducir existencias en tiendita_productos,
 *      registrar la venta en tiendita_ventas y sincronizar localStorage.
 *
 * Depende de js/firebase-config.js, que debe cargarse ANTES que este
 * archivo y expone window.db y window.COLECCIONES.
 * -------------------------------------------------------------------------
 */
 
(function () {
  "use strict";
 
  // ---------------------------------------------------------------------
  // Referencias a Firebase / colecciones (definidas en firebase-config.js)
  // ---------------------------------------------------------------------
  const db = window.db;
  const COLECCIONES = window.COLECCIONES || {
    PRODUCTOS: "tiendita_productos",
    VENTAS: "tiendita_ventas",
  };
 
  // Claves de localStorage usadas por este módulo
  const LS_PRODUCTOS_CACHE = "tiendita_productos_cache";
  const LS_VENTAS_LOCAL = "tiendita_ventas_local";
  // Clave que se asume la establece el módulo de inicio de sesión del equipo.
  // Ajustar aquí si el compañero encargado del login usa otro nombre de clave.
  const LS_USUARIO_ACTIVO = "usuarioActivo";
 
  // ---------------------------------------------------------------------
  // Referencias al DOM
  // ---------------------------------------------------------------------
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
 
  // Estado en memoria: lista de productos actualmente disponibles (existencias > 0)
  let productosDisponibles = [];
  let ventaEnProceso = false;
 
  // ---------------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------------
 
  function formatearMoneda(valor) {
    const numero = Number(valor) || 0;
    return "$" + numero.toFixed(2);
  }
 
  function obtenerVendedorActivo() {
    try {
      const crudo = localStorage.getItem(LS_USUARIO_ACTIVO);
      if (!crudo) return "Invitado";
      // Soporta que el módulo de login guarde un string simple o un objeto JSON
      try {
        const obj = JSON.parse(crudo);
        return obj?.nombre || obj?.usuario || obj?.email || "Invitado";
      } catch {
        return crudo;
      }
    } catch (error) {
      console.warn("No se pudo leer el usuario activo de localStorage:", error);
      return "Invitado";
    }
  }
 
  function guardarProductosEnCache(productos) {
    try {
      localStorage.setItem(LS_PRODUCTOS_CACHE, JSON.stringify(productos));
    } catch (error) {
      console.warn("No se pudo actualizar el caché de productos:", error);
    }
  }
 
  function leerProductosDeCache() {
    try {
      const crudo = localStorage.getItem(LS_PRODUCTOS_CACHE);
      return crudo ? JSON.parse(crudo) : [];
    } catch (error) {
      console.warn("No se pudo leer el caché de productos:", error);
      return [];
    }
  }
 
  function guardarVentaLocal(venta) {
    try {
      const historial = JSON.parse(localStorage.getItem(LS_VENTAS_LOCAL) || "[]");
      historial.push(venta);
      localStorage.setItem(LS_VENTAS_LOCAL, JSON.stringify(historial));
    } catch (error) {
      console.warn("No se pudo guardar la venta en el historial local:", error);
    }
  }
 
  function mostrarMensaje(texto, tipo) {
    mensajeResultado.textContent = texto;
    mensajeResultado.className = "mensaje " + (tipo === "error" ? "error" : "exito");
  }
 
  function limpiarMensaje() {
    mensajeResultado.textContent = "";
    mensajeResultado.className = "mensaje";
  }
 
  function obtenerProductoSeleccionado() {
    const id = selectProducto.value;
    return productosDisponibles.find((p) => p.id === id) || null;
  }
 
  // ---------------------------------------------------------------------
  // Carga de productos disponibles (existencias > 0) en el <select>
  // ---------------------------------------------------------------------
 
  async function cargarProductosDisponibles() {
    estadoCarga.textContent = "Cargando productos…";
    selectProducto.disabled = true;
 
    try {
      const snapshot = await db
        .collection(COLECCIONES.PRODUCTOS)
        .where("existencias", ">", 0)
        .get();
 
      productosDisponibles = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre,
          precio: Number(data.precio) || 0,
          existencias: Number(data.existencias) || 0,
        };
      });
 
      guardarProductosEnCache(productosDisponibles);
      estadoCarga.textContent = "";
    } catch (error) {
      console.error("Error al cargar productos desde Firestore:", error);
      // Resiliencia: si Firestore no responde, se usa el último caché local
      productosDisponibles = leerProductosDeCache().filter((p) => p.existencias > 0);
      estadoCarga.textContent = productosDisponibles.length
        ? "No se pudo conectar a la base de datos. Mostrando el último catálogo guardado localmente."
        : "No se pudo cargar el catálogo de productos.";
    }
 
    renderizarSelectProductos();
    selectProducto.disabled = false;
    actualizarResumenYValidacion();
  }
 
  function renderizarSelectProductos() {
    selectProducto.innerHTML = "";
 
    if (productosDisponibles.length === 0) {
      const opcion = document.createElement("option");
      opcion.value = "";
      opcion.textContent = "No hay productos con existencias disponibles";
      opcion.disabled = true;
      opcion.selected = true;
      selectProducto.appendChild(opcion);
      return;
    }
 
    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Seleccione un producto…";
    opcionInicial.disabled = true;
    opcionInicial.selected = true;
    selectProducto.appendChild(opcionInicial);
 
    productosDisponibles.forEach((producto) => {
      const opcion = document.createElement("option");
      opcion.value = producto.id;
      opcion.textContent = ${producto.nombre} — ${formatearMoneda(producto.precio)} (stock: ${producto.existencias});
      selectProducto.appendChild(opcion);
    });
  }
 
  // ---------------------------------------------------------------------
  // Cálculo en tiempo real + validación estricta de stock
  // ---------------------------------------------------------------------
 
  function actualizarResumenYValidacion() {
    const producto = obtenerProductoSeleccionado();
    const cantidadTexto = inputCantidad.value.trim();
    const cantidad = Number(cantidadTexto);
    const cantidadEsEntera = Number.isInteger(cantidad);
 
    limpiarMensaje();
 
    if (!producto) {
      resumenProducto.textContent = "—";
      resumenPrecio.textContent = formatearMoneda(0);
      resumenCantidad.textContent = "0";
      resumenTotal.textContent = formatearMoneda(0);
      infoStock.textContent = "Existencias disponibles: —";
      ocultarAdvertencia();
      btnConfirmarVenta.disabled = true;
      return;
    }
 
    infoStock.textContent = Existencias disponibles: ${producto.existencias};
 
    const cantidadValida = cantidadEsEntera && cantidad >= 1;
    const total = cantidadValida ? producto.precio * cantidad : 0;
 
    resumenProducto.textContent = producto.nombre;
    resumenPrecio.textContent = formatearMoneda(producto.precio);
    resumenCantidad.textContent = cantidadValida ? String(cantidad) : "0";
    resumenTotal.textContent = formatearMoneda(total);
 
    // Validación estricta: la cantidad no puede superar el stock registrado
    if (!cantidadValida) {
      mostrarAdvertencia("Ingrese una cantidad válida (número entero mayor o igual a 1).");
      btnConfirmarVenta.disabled = true;
      return;
    }
 
    if (cantidad > producto.existencias) {
      mostrarAdvertencia(
        ⚠️ La cantidad solicitada (${cantidad}) supera las existencias disponibles (${producto.existencias}).
      );
      btnConfirmarVenta.disabled = true;
      return;
    }
 
    ocultarAdvertencia();
    btnConfirmarVenta.disabled = false;
  }
 
  function mostrarAdvertencia(texto) {
    advertenciaStock.textContent = texto;
    advertenciaStock.classList.add("visible");
  }
 
  function ocultarAdvertencia() {
    advertenciaStock.classList.remove("visible");
  }
 
  // ---------------------------------------------------------------------
  // Confirmar venta: transacción atómica en Firestore + sincronización local
  // ---------------------------------------------------------------------
 
  async function confirmarVenta(evento) {
    evento.preventDefault();
    if (ventaEnProceso) return;
 
    const producto = obtenerProductoSeleccionado();
    const cantidad = Number(inputCantidad.value);
 
    // Revalidación estricta justo antes de enviar (por si el stock cambió
    // en Firestore desde que se cargó la lista, ej. otra caja vendiendo a la vez)
    if (!producto || !Number.isInteger(cantidad) || cantidad < 1) {
      mostrarMensaje("Seleccione un producto y una cantidad válida antes de confirmar.", "error");
      return;
    }
    if (cantidad > producto.existencias) {
      mostrarMensaje("La cantidad solicitada supera las existencias disponibles.", "error");
      actualizarResumenYValidacion();
      return;
    }
 
    ventaEnProceso = true;
    btnConfirmarVenta.disabled = true;
    btnConfirmarVenta.textContent = "Procesando venta…";
    limpiarMensaje();
 
    const vendedor = obtenerVendedorActivo();
    const total = producto.precio * cantidad;
    const productoRef = db.collection(COLECCIONES.PRODUCTOS).doc(producto.id);
    const ventaRef = db.collection(COLECCIONES.VENTAS).doc(); // ID autogenerado
 
    try {
      await db.runTransaction(async (transaction) => {
        const productoSnap = await transaction.get(productoRef);
 
        if (!productoSnap.exists) {
          throw new Error("El producto seleccionado ya no existe en el catálogo.");
        }
 
        const existenciasActuales = Number(productoSnap.data().existencias) || 0;
 
        // Validación estricta también dentro de la transacción (evita condiciones
        // de carrera si dos cajas venden el mismo producto al mismo tiempo)
        if (cantidad > existenciasActuales) {
          throw new Error(
            Existencias insuficientes: quedan ${existenciasActuales} unidad(es).
          );
        }
 
        const nuevasExistencias = existenciasActuales - cantidad;
 
        // 1) Deducir existencias en tiendita_productos
        transaction.update(productoRef, { existencias: nuevasExistencias });
 
        // 2) Registrar la venta en tiendita_ventas
        transaction.set(ventaRef, {
          id: ventaRef.id,
          fecha: firebase.firestore.FieldValue.serverTimestamp(),
          fechaLocal: new Date().toISOString(),
          usuario: vendedor,
          productoId: producto.id,
          producto: producto.nombre,
          precioUnitario: producto.precio,
          cantidad: cantidad,
          total: total,
        });
      });
 
      // 3) Sincronizar localStorage (caché de productos + historial de ventas)
      const nuevasExistencias = producto.existencias - cantidad;
      productosDisponibles = productosDisponibles
        .map((p) => (p.id === producto.id ? { ...p, existencias: nuevasExistencias } : p))
        .filter((p) => p.existencias > 0);
      guardarProductosEnCache(productosDisponibles);
 
      guardarVentaLocal({
        id: ventaRef.id,
        fecha: new Date().toISOString(),
        usuario: vendedor,
        productoId: producto.id,
        producto: producto.nombre,
        precioUnitario: producto.precio,
        cantidad: cantidad,
        total: total,
      });
 
      mostrarMensaje(
        ✅ Venta registrada: ${cantidad} × ${producto.nombre} = ${formatearMoneda(total)}.,
        "exito"
      );
 
      // Refrescar el select (el stock pudo llegar a 0 y el producto debe desaparecer)
      renderizarSelectProductos();
      formVenta.reset();
      inputCantidad.value = 1;
      actualizarResumenYValidacion();
    } catch (error) {
      console.error("Error al confirmar la venta:", error);
      mostrarMensaje(
        "No se pudo registrar la venta: " + (error.message || "intente nuevamente."),
        "error"
      );
      // Si el error fue por stock insuficiente, refrescamos datos desde Firestore
      // para que el usuario vea las existencias reales actualizadas.
      await cargarProductosDisponibles();
    } finally {
      ventaEnProceso = false;
      btnConfirmarVenta.textContent = "Confirmar Venta";
      actualizarResumenYValidacion();
    }
  }
 
  // ---------------------------------------------------------------------
  // Eventos
  // ---------------------------------------------------------------------
 
  selectProducto.addEventListener("change", actualizarResumenYValidacion);
  inputCantidad.addEventListener("input", actualizarResumenYValidacion);
  formVenta.addEventListener("submit", confirmarVenta);
 
  // ---------------------------------------------------------------------
  // Inicialización
  // ---------------------------------------------------------------------
 
  document.addEventListener("DOMContentLoaded", () => {
    nombreVendedor.textContent = obtenerVendedorActivo();
    cargarProductosDisponibles();
  });
})();
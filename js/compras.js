
(function () {
  "use strict";

  const LS_PRODUCTOS = "tiendita_productos";
  const LS_PROVEEDORES = "tiendita_proveedores";
  const LS_COMPRAS = "tiendita_compras";
  const LS_SESION = "tiendita_sesion";

  const form = document.getElementById("formCompra");
  const selectProveedor = document.getElementById("selectProveedor");
  const selectProducto = document.getElementById("selectProducto");
  const inputCantidad = document.getElementById("inputCantidad");
  const inputCosto = document.getElementById("inputCosto");
  const totalCompra = document.getElementById("totalCompra");
  const mensaje = document.getElementById("mensajeCompra");
  const tabla = document.getElementById("tablaCompras");
  const estado = document.getElementById("estadoCompras");
  const btnRegistrar = document.getElementById("btnRegistrarCompra");

  let productos = [];
  let proveedores = [];
  let registrando = false;

  function leerLista(clave) {
    const dato = localStorage.getItem(clave);

    if (dato === null) return [];

    const lista = JSON.parse(dato);

    if (!Array.isArray(lista)) {
      throw new Error(`Los datos de ${clave} no tienen un formato válido.`);
    }

    return lista;
  }

  function moneda(valor) {
    return "$" + (Number(valor) || 0).toFixed(2);
  }

  function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = `alert alert-${tipo}`;
  }

  function limpiarMensaje() {
    mensaje.textContent = "";
    mensaje.className = "alert d-none";
  }

  function llenarProveedores() {
    selectProveedor.replaceChildren();

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = proveedores.length
      ? "Selecciona un proveedor"
      : "Primero registra un proveedor";

    selectProveedor.appendChild(inicial);

    proveedores.forEach(proveedor => {
      const opcion = document.createElement("option");
      opcion.value = String(proveedor.id);
      opcion.textContent = proveedor.nombre;
      selectProveedor.appendChild(opcion);
    });

    selectProveedor.disabled = proveedores.length === 0;
  }

  function llenarProductos() {
    selectProducto.replaceChildren();

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = productos.length
      ? "Selecciona un producto"
      : "Primero registra un producto";

    selectProducto.appendChild(inicial);

    productos.forEach(producto => {
      const opcion = document.createElement("option");
      opcion.value = String(producto.id);
      opcion.textContent =
        `${producto.nombre} (stock actual: ${producto.stock})`;
      selectProducto.appendChild(opcion);
    });

    selectProducto.disabled = productos.length === 0;
  }

  function actualizarTotal() {
    const cantidad = Number(inputCantidad.value);
    const costo = Number(inputCosto.value);

    const cantidadValida =
      inputCantidad.value.trim() !== "" &&
      Number.isSafeInteger(cantidad) &&
      cantidad > 0;

    const costoValido =
      inputCosto.value.trim() !== "" &&
      Number.isFinite(costo) &&
      costo > 0;

    const total = cantidadValida && costoValido
      ? cantidad * costo
      : 0;

    totalCompra.textContent =
      Number.isFinite(total) ? moneda(total) : "$0.00";
  }

  function renderizarHistorial() {
    let compras;

    try {
      compras = leerLista(LS_COMPRAS);
    } catch (error) {
      tabla.replaceChildren();
      estado.textContent = error.message;
      return;
    }

    tabla.replaceChildren();

    compras.slice().reverse().forEach(compra => {
      const fila = document.createElement("tr");
      const fecha = new Date(compra.fecha);

      const celdaFecha = document.createElement("td");
      celdaFecha.textContent = Number.isNaN(fecha.getTime())
        ? "—"
        : fecha.toLocaleDateString("es-SV");

      const celdaProveedor = document.createElement("td");
      celdaProveedor.textContent = compra.proveedor || "—";

      const celdaTotal = document.createElement("td");
      celdaTotal.textContent = moneda(compra.total);

      fila.append(celdaFecha, celdaProveedor, celdaTotal);
      tabla.appendChild(fila);
    });

    estado.textContent = compras.length
      ? `${compras.length} compra(s) registrada(s).`
      : "Todavía no hay compras registradas.";
  }

  function cargarDatos() {
    try {
      productos = leerLista(LS_PRODUCTOS);
      proveedores = leerLista(LS_PROVEEDORES);

      llenarProveedores();
      llenarProductos();
      renderizarHistorial();

      if (proveedores.length === 0) {
        mostrarMensaje(
          "Registra primero un proveedor en Gestión de proveedores.",
          "warning"
        );
      } else if (productos.length === 0) {
        mostrarMensaje(
          "Registra primero los productos que vas a comprar.",
          "warning"
        );
      } else {
        limpiarMensaje();
      }
    } catch (error) {
      mostrarMensaje(
        "No se pudieron cargar los datos: " + error.message,
        "danger"
      );
    }
  }

  
function validarCompra() {
    const errores = [];

    const proveedor = proveedores.find(
        p => String(p.id) === selectProveedor.value
    );

    const producto = productos.find(
        p => String(p.id) === selectProducto.value
    );

    const cantidadTexto = inputCantidad.value.trim();
    const costoTexto = inputCosto.value.trim();

    const cantidad = Number(cantidadTexto);
    const costo = Number(costoTexto);
    const total = cantidad * costo;

    if (!proveedor) {
        errores.push("Seleccioná un proveedor.");
    }

    if (!producto) {
        errores.push("Seleccioná un producto.");
    }

    if (
        cantidadTexto === "" ||
        !Number.isSafeInteger(cantidad) ||
        cantidad <= 0
    ) {
        errores.push(
            "La cantidad comprada debe ser un entero mayor que cero."
        );
    }

    if (
        costoTexto === "" ||
        !Number.isFinite(costo) ||
        costo <= 0
    ) {
        errores.push(
            "El precio unitario de compra debe ser mayor que cero."
        );
    }

    if (
        cantidad > 0 &&
        costo > 0 &&
        (!Number.isFinite(total) || total <= 0)
    ) {
        errores.push("El total de la compra debe ser válido y mayor que cero.");
    }

    if (errores.length > 0) {
        throw new Error(errores.join("\n"));
    }

    return { proveedor, producto, cantidad, costo, total };
}

  form.addEventListener("submit", async evento => {
    evento.preventDefault();

    if (registrando) return;

    limpiarMensaje();

    let datos;

   try {
    datos = validarCompra();
} catch (error) {
    if (typeof mostrarError === "function") {
        await mostrarError(
            error.message,
            "Revisá los datos de la compra"
        );
    } else {
        mostrarMensaje(error.message, "warning");
    }
    return;
}
    registrando = true;
    btnRegistrar.disabled = true;

    const claves = [LS_PRODUCTOS, LS_COMPRAS];
    const originales = {};

    try {
      claves.forEach(clave => {
        originales[clave] = localStorage.getItem(clave);
      });

      // Leer nuevamente los datos guardados antes de modificar el stock.
      const productosActuales = leerLista(LS_PRODUCTOS);
      const comprasActuales = leerLista(LS_COMPRAS);

      const productoActual = productosActuales.find(
        p => String(p.id) === String(datos.producto.id)
      );

      if (!productoActual) {
        throw new Error("El producto ya no existe. Recarga la página.");
      }

      const stockActual = Number(productoActual.stock);
      const nuevoStock = stockActual + datos.cantidad;

      if (
        !Number.isSafeInteger(stockActual) ||
        stockActual < 0 ||
        !Number.isSafeInteger(nuevoStock)
      ) {
        throw new Error("El stock actual no es válido o la cantidad excede el límite permitido.");
      }

      const compra = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fecha: new Date().toISOString(),
        proveedorId: datos.proveedor.id,
        proveedor: datos.proveedor.nombre,
        productoId: productoActual.id,
        producto: productoActual.nombre,
        cantidad: datos.cantidad,
        costoUnitario: datos.costo,
        total: datos.total,
        usuario: obtenerNombreUsuario()
      };

      productoActual.stock = nuevoStock;

      comprasActuales.push(compra);

      // Si falla alguna escritura, se intenta restaurar el estado anterior.
      localStorage.setItem(LS_COMPRAS, JSON.stringify(comprasActuales));
      localStorage.setItem(LS_PRODUCTOS, JSON.stringify(productosActuales));

      productos = productosActuales;
      llenarProductos();
      renderizarHistorial();

      form.reset();
      totalCompra.textContent = "$0.00";
      form.classList.remove("was-validated");

        mostrarMensaje(
        `Compra registrada. Se agregaron ${datos.cantidad} unidades de ${compra.producto} al inventario.`,
        "success"
      );

      if (typeof mostrarExito === "function") {
        mostrarExito(
          `Se agregaron ${datos.cantidad} unidades de ${compra.producto} al inventario.`,
          "¡Compra registrada!"
        );
      }

    } catch (error) {
      let restauracionCorrecta = true;

      claves.forEach(clave => {
        try {
          const valorAnterior = originales[clave];

          if (valorAnterior === null) {
            localStorage.removeItem(clave);
          } else if (valorAnterior !== undefined) {
            localStorage.setItem(clave, valorAnterior);
          }
        } catch {
          restauracionCorrecta = false;
        }
      });

      cargarDatos();

      mostrarMensaje(
        restauracionCorrecta
          ? "No se pudo registrar la compra: " + error.message
          : "Ocurrió un error y no fue posible restaurar todos los datos. Revisa el inventario y el historial antes de volver a intentarlo.",
        "danger"
      );

      console.error("Error al registrar compra:", error);
    } finally {
      registrando = false;
      btnRegistrar.disabled = false;
    }
  });

  function obtenerNombreUsuario() {
    try {
      const sesion = JSON.parse(localStorage.getItem(LS_SESION));
      return sesion && sesion.nombre ? sesion.nombre : "Usuario";
    } catch {
      return "Usuario";
    }
  }

  inputCantidad.addEventListener("input", actualizarTotal);
  inputCosto.addEventListener("input", actualizarTotal);

  form.addEventListener("reset", () => {
    setTimeout(() => {
      limpiarMensaje();
      actualizarTotal();
    }, 0);
  });

  try {
    const sesion = JSON.parse(localStorage.getItem(LS_SESION));

    if (!sesion) {
      window.location.href = "MiTiendita/login.html";
      return;
    }

    cargarDatos();
  } catch (error) {
    mostrarMensaje("No se pudo iniciar el módulo: " + error.message, "danger");
  }
})();

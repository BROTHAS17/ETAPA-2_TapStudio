(function () {
  "use strict";

  const LS_PRODUCTOS = "tiendita_productos";
  const LS_PROVEEDORES = "tiendita_proveedores";
  const LS_COMPRAS = "tiendita_compras";
  const LS_SESION = "tiendita_sesion";

  const mountNode = document.getElementById("compras-root");

  if (!mountNode || !window.React || !window.ReactDOM) {
    if (mountNode) {
      mountNode.textContent = "No se pudo iniciar el módulo de compras.";
    }
    return;
  }

  const { createElement: h, useCallback, useEffect, useState } = window.React;

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

  function nombreUsuario() {
    try {
      const sesion = JSON.parse(localStorage.getItem(LS_SESION));
      return sesion && sesion.nombre ? sesion.nombre : "Usuario";
    } catch {
      return "Usuario";
    }
  }

  function FormularioCompra({
    proveedores,
    productos,
    formulario,
    setFormulario,
    mensaje,
    enviando,
    onSubmit,
    onLimpiar
  }) {
    const cantidad = Number(formulario.cantidad);
    const costo = Number(formulario.costo);
    const cantidadValida =
      formulario.cantidad.trim() !== "" &&
      Number.isSafeInteger(cantidad) &&
      cantidad > 0;
    const costoValido =
      formulario.costo.trim() !== "" &&
      Number.isFinite(costo) &&
      costo > 0;
    const total = cantidadValida && costoValido ? cantidad * costo : 0;

    function actualizar(campo, valor) {
      setFormulario(actual => ({ ...actual, [campo]: valor }));
    }

    return h(
      "section",
      { className: "card shadow-sm" },
      h(
        "div",
        { className: "card-body" },
        h("h2", { className: "h5" }, "Datos de la compra"),
        h(
          "form",
          { onSubmit, noValidate: true },
          h(
            "div",
            { className: "mb-3" },
            h("label", { htmlFor: "selectProveedor", className: "form-label" }, "Proveedor *"),
            h(
              "select",
              {
                id: "selectProveedor",
                className: "form-select",
                value: formulario.proveedorId,
                onChange: event => actualizar("proveedorId", event.target.value),
                required: true,
                disabled: proveedores.length === 0
              },
              h("option", { value: "" }, proveedores.length ? "Selecciona un proveedor" : "Primero registra un proveedor"),
              proveedores.map(proveedor =>
                h("option", { key: String(proveedor.id), value: String(proveedor.id) }, proveedor.nombre || "Proveedor sin nombre")
              )
            ),
            h("div", { className: "invalid-feedback" }, "Selecciona un proveedor.")
          ),
          h(
            "div",
            { className: "mb-3" },
            h("label", { htmlFor: "selectProducto", className: "form-label" }, "Producto *"),
            h(
              "select",
              {
                id: "selectProducto",
                className: "form-select",
                value: formulario.productoId,
                onChange: event => actualizar("productoId", event.target.value),
                required: true,
                disabled: productos.length === 0
              },
              h("option", { value: "" }, productos.length ? "Selecciona un producto" : "Primero registra un producto"),
              productos.map(producto =>
                h(
                  "option",
                  { key: String(producto.id), value: String(producto.id) },
                  `${producto.nombre || "Producto sin nombre"} (stock actual: ${producto.stock ?? 0})`
                )
              )
            ),
            h("div", { className: "invalid-feedback" }, "Selecciona un producto.")
          ),
          h(
            "div",
            { className: "mb-3" },
            h("label", { htmlFor: "inputCantidad", className: "form-label" }, "Cantidad comprada *"),
            h("input", {
              type: "number",
              id: "inputCantidad",
              className: "form-control",
              min: "1",
              step: "1",
              value: formulario.cantidad,
              onChange: event => actualizar("cantidad", event.target.value),
              required: true
            }),
            h("div", { className: "invalid-feedback" }, "Ingresa una cantidad entera mayor que cero.")
          ),
          h(
            "div",
            { className: "mb-3" },
            h("label", { htmlFor: "inputCosto", className: "form-label" }, "Costo unitario de compra ($) *"),
            h("input", {
              type: "number",
              id: "inputCosto",
              className: "form-control",
              min: "0.01",
              step: "0.01",
              value: formulario.costo,
              onChange: event => actualizar("costo", event.target.value),
              placeholder: "0.00",
              required: true
            }),
            h("div", { className: "invalid-feedback" }, "Ingresa un costo mayor que cero.")
          ),
          h(
            "div",
            { className: "alert alert-light border" },
            h("span", { className: "fw-semibold" }, "Total de compra: "),
            h("span", { className: "fs-4 fw-bold", "aria-live": "polite" }, moneda(total))
          ),
          mensaje && h(
            "div",
            { className: `alert alert-${mensaje.tipo}`, role: "alert", "aria-live": "polite" },
            mensaje.texto
          ),
          h(
            "button",
            {
              type: "submit",
              className: "btn btn-primary me-2",
              disabled: enviando || proveedores.length === 0 || productos.length === 0
            },
            enviando ? "Registrando…" : "Registrar compra"
          ),
          h("button", { type: "button", className: "btn btn-outline-secondary", onClick: onLimpiar }, "Limpiar")
        )
      )
    );
  }

  function HistorialCompras({ compras }) {
    const filas = compras.slice().reverse();

    return h(
      "section",
      { className: "card shadow-sm" },
      h(
        "div",
        { className: "card-body" },
        h("h2", { className: "h5" }, "Historial de compras"),
        h(
          "div",
          { className: "table-responsive" },
          h(
            "table",
            { className: "table table-striped align-middle" },
            h(
              "thead",
              null,
              h("tr", null,
                h("th", { scope: "col" }, "Fecha"),
                h("th", { scope: "col" }, "Proveedor"),
                h("th", { scope: "col" }, "Total")
              )
            ),
            h(
              "tbody",
              null,
              filas.length
                ? filas.map((compra, index) => {
                    const fecha = new Date(compra.fecha);
                    const fechaTexto = Number.isNaN(fecha.getTime())
                      ? "—"
                      : fecha.toLocaleDateString("es-SV");
                    return h("tr", { key: compra.id || `${compra.fecha}-${index}` },
                      h("td", null, fechaTexto),
                      h("td", null, compra.proveedor || "—"),
                      h("td", null, moneda(compra.total))
                    );
                  })
                : h("tr", null, h("td", { colSpan: 3, className: "text-secondary" }, "Todavía no hay compras registradas."))
            )
          )
        ),
        h("p", { className: "text-secondary small mb-0", "aria-live": "polite" },
          filas.length ? `${filas.length} compra(s) registrada(s).` : ""
        )
      )
    );
  }

  function AplicacionCompras() {
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [compras, setCompras] = useState([]);
    const [formulario, setFormulario] = useState({
      proveedorId: "",
      productoId: "",
      cantidad: "1",
      costo: ""
    });
    const [mensaje, setMensaje] = useState(null);
    const [enviando, setEnviando] = useState(false);

    const cargarDatos = useCallback(() => {
      try {
        setProductos(leerLista(LS_PRODUCTOS));
        setProveedores(leerLista(LS_PROVEEDORES));
        setCompras(leerLista(LS_COMPRAS));
      } catch (error) {
        setMensaje({ tipo: "danger", texto: "No se pudieron cargar los datos: " + error.message });
      }
    }, []);

    useEffect(() => {
      cargarDatos();
      const alCambiarAlmacenamiento = event => {
        if (!event.key || [LS_PRODUCTOS, LS_PROVEEDORES, LS_COMPRAS].includes(event.key)) {
          cargarDatos();
        }
      };
      window.addEventListener("storage", alCambiarAlmacenamiento);
      return () => window.removeEventListener("storage", alCambiarAlmacenamiento);
    }, [cargarDatos]);

    function limpiarFormulario() {
      setFormulario({ proveedorId: "", productoId: "", cantidad: "1", costo: "" });
      setMensaje(null);
    }

    async function registrarCompra(event) {
      event.preventDefault();
      if (enviando) return;
      setMensaje(null);

      const cantidadTexto = formulario.cantidad.trim();
      const costoTexto = formulario.costo.trim();
      const cantidad = Number(cantidadTexto);
      const costo = Number(costoTexto);
      const total = cantidad * costo;

      if (!proveedores.some(item => String(item.id) === formulario.proveedorId)) {
        setMensaje({ tipo: "warning", texto: "Selecciona un proveedor válido." });
        return;
      }
      if (!productos.some(item => String(item.id) === formulario.productoId)) {
        setMensaje({ tipo: "warning", texto: "Selecciona un producto válido." });
        return;
      }
      if (cantidadTexto === "" || !Number.isSafeInteger(cantidad) || cantidad <= 0) {
        setMensaje({ tipo: "warning", texto: "La cantidad debe ser un entero mayor que cero." });
        return;
      }
      if (costoTexto === "" || !Number.isFinite(costo) || costo <= 0 || !Number.isFinite(total) || total <= 0) {
        setMensaje({ tipo: "warning", texto: "El costo unitario y el total deben ser importes válidos mayores que cero." });
        return;
      }

      setEnviando(true);
      const claves = [LS_PRODUCTOS, LS_COMPRAS];
      const originales = {};

      try {
        claves.forEach(clave => { originales[clave] = localStorage.getItem(clave); });

        // Volver a leer los datos guardados para no sobrescribir cambios recientes.
        const productosActuales = leerLista(LS_PRODUCTOS);
        const proveedoresActuales = leerLista(LS_PROVEEDORES);
        const comprasActuales = leerLista(LS_COMPRAS);
        const proveedorActual = proveedoresActuales.find(item => String(item.id) === formulario.proveedorId);
        const productoActual = productosActuales.find(item => String(item.id) === formulario.productoId);

        if (!proveedorActual) throw new Error("El proveedor ya no existe. Recarga la página y selecciónalo nuevamente.");
        if (!productoActual) throw new Error("El producto ya no existe. Recarga la página y selecciónalo nuevamente.");

        const stockActual = Number(productoActual.stock);
        const nuevoStock = stockActual + cantidad;
        if (!Number.isSafeInteger(stockActual) || stockActual < 0 || !Number.isSafeInteger(nuevoStock)) {
          throw new Error("El stock actual no es válido o la cantidad excede el límite permitido.");
        }

        const compra = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          fecha: new Date().toISOString(),
          proveedorId: proveedorActual.id,
          proveedor: proveedorActual.nombre,
          productoId: productoActual.id,
          producto: productoActual.nombre,
          cantidad,
          costoUnitario: costo,
          total,
          usuario: nombreUsuario()
        };

        productoActual.stock = nuevoStock;
        comprasActuales.push(compra);

        try {
          localStorage.setItem(LS_COMPRAS, JSON.stringify(comprasActuales));
          localStorage.setItem(LS_PRODUCTOS, JSON.stringify(productosActuales));
        } catch (error) {
          claves.forEach(clave => {
            const valorAnterior = originales[clave];
            if (valorAnterior === null) localStorage.removeItem(clave);
            else if (valorAnterior !== undefined) localStorage.setItem(clave, valorAnterior);
          });
          throw error;
        }

        setProductos(productosActuales);
        setCompras(comprasActuales);
        limpiarFormulario();
        setMensaje({
          tipo: "success",
          texto: `Compra registrada. Se agregaron ${cantidad} unidades de ${productoActual.nombre} al inventario.`
        });
        if (typeof window.mostrarExito === "function") {
          await window.mostrarExito(
            `Se agregaron ${cantidad} unidades de ${productoActual.nombre} al inventario.`,
            "¡Compra registrada!"
          );
        }
      } catch (error) {
        setMensaje({ tipo: "danger", texto: "No se pudo registrar la compra: " + error.message });
        if (typeof window.mostrarError === "function") {
          await window.mostrarError(error.message, "No se pudo registrar la compra");
        }
        cargarDatos();
      } finally {
        setEnviando(false);
      }
    }

    return h(
      React.Fragment,
      null,
      h("h1", null, "Registro de compras"),
      h("p", { className: "text-secondary" }, "Registra las compras a proveedores y actualiza las existencias."),
      (proveedores.length === 0 || productos.length === 0) && h(
        "div",
        { className: "alert alert-warning", role: "status" },
        proveedores.length === 0
          ? "Registra primero un proveedor en Gestión de proveedores."
          : "Registra primero los productos que vas a comprar."
      ),
      h(
        "div",
        { className: "row g-4" },
        h("div", { className: "col-lg-7" }, h(FormularioCompra, {
          proveedores,
          productos,
          formulario,
          setFormulario,
          mensaje,
          enviando,
          onSubmit: registrarCompra,
          onLimpiar: limpiarFormulario
        })),
        h("div", { className: "col-lg-5" }, h(HistorialCompras, { compras }))
      )
    );
  }

  try {
    const sesion = JSON.parse(localStorage.getItem(LS_SESION));
    if (!sesion) {
      window.location.href = "MiTiendita/login.html";
      return;
    }

    window.ReactDOM.createRoot(mountNode).render(h(AplicacionCompras));
  } catch (error) {
    mountNode.textContent = "No se pudo iniciar el módulo: " + error.message;
  }
})();

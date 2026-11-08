/**
 * js/compras.js
 * Módulo de registro de compras y abastecimiento de inventario en React 18.
 * Implementa manejo transaccional con reversión automática (rollback).
 * Sin emojis y con redacción formal orientada al usuario final.
 */

(function () {
  "use strict";

  const LS_PRODUCTOS = "tiendita_productos";
  const LS_PROVEEDORES = "tiendita_proveedores";
  const LS_COMPRAS = "tiendita_compras";
  const LS_MOVIMIENTOS = "tiendita_movimientos";
  const LS_SESION = "tiendita_sesion";

  const mountNode = document.getElementById("compras-root");

  if (!mountNode || !window.React || !window.ReactDOM) {
    if (mountNode) {
      mountNode.innerHTML = '<div class="alert alert-danger m-3">No se pudo inicializar el módulo de compras. Verifique las dependencias de la aplicación.</div>';
    }
    return;
  }

  const { createElement: h, useCallback, useEffect, useState } = window.React;

  function leerLista(clave) {
    try {
      const dato = localStorage.getItem(clave);
      if (dato === null) return [];
      const lista = JSON.parse(dato);
      return Array.isArray(lista) ? lista : [];
    } catch (error) {
      console.error(`Error al leer ${clave}:`, error);
      return [];
    }
  }

  function moneda(valor) {
    const num = Number(valor);
    return "$" + (Number.isFinite(num) ? num : 0).toFixed(2);
  }

  function formatearFecha(iso) {
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) {
      return "—";
    }
    return fecha.toLocaleDateString("es-SV", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function nombreUsuario() {
    try {
      const sesion = JSON.parse(localStorage.getItem(LS_SESION));
      return sesion && sesion.nombre ? sesion.nombre : "Administrador";
    } catch {
      return "Administrador";
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
      { className: "panel-box" },
      h("h3", { className: "mb-3" }, "Datos de la compra"),
      h(
        "form",
        { onSubmit, noValidate: true },
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "selectProveedor" }, "Proveedor *"),
          h(
            "select",
            {
              id: "selectProveedor",
              value: formulario.proveedorId,
              onChange: event => actualizar("proveedorId", event.target.value),
              required: true,
              disabled: proveedores.length === 0
            },
            h(
              "option",
              { value: "" },
              proveedores.length
                ? "Selecciona un proveedor"
                : "Primero registra un proveedor en Proveedores"
            ),
            proveedores.map(proveedor =>
              h(
                "option",
                { key: String(proveedor.id), value: String(proveedor.id) },
                proveedor.nombre || "Proveedor sin nombre"
              )
            )
          )
        ),
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "selectProducto" }, "Producto *"),
          h(
            "select",
            {
              id: "selectProducto",
              value: formulario.productoId,
              onChange: event => {
                const id = event.target.value;
                actualizar("productoId", id);
                const prod = productos.find(p => String(p.id) === String(id));
                if (prod && prod.costo && (!formulario.costo || Number(formulario.costo) <= 0)) {
                  actualizar("costo", String(prod.costo));
                }
              },
              required: true,
              disabled: productos.length === 0
            },
            h(
              "option",
              { value: "" },
              productos.length
                ? "Selecciona un producto"
                : "Primero registra un producto en Catálogo"
            ),
            productos.map(producto =>
              h(
                "option",
                { key: String(producto.id), value: String(producto.id) },
                `${producto.nombre || "Producto"} (Existencias actuales: ${producto.stock ?? 0})`
              )
            )
          )
        ),
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "inputCantidad" }, "Cantidad adquirida *"),
          h("input", {
            type: "number",
            id: "inputCantidad",
            min: "1",
            step: "1",
            value: formulario.cantidad,
            onChange: event => actualizar("cantidad", event.target.value),
            required: true
          })
        ),
        h(
          "div",
          { className: "field" },
          h("label", { htmlFor: "inputCosto" }, "Costo unitario de adquisición ($) *"),
          h("input", {
            type: "number",
            id: "inputCosto",
            min: "0.01",
            step: "0.01",
            placeholder: "0.00",
            value: formulario.costo,
            onChange: event => actualizar("costo", event.target.value),
            required: true
          })
        ),
        h(
          "div",
          { className: "panel-box bg-light border p-3 my-3 d-flex justify-content-between align-items-center" },
          h("span", { className: "fw-semibold text-secondary" }, "Total calculado:"),
          h(
            "span",
            { className: "fs-4 fw-bold", style: { color: "var(--accent-ink)" } },
            moneda(total)
          )
        ),
        mensaje && mensaje.texto && h(
          "div",
          { className: `alert alert-${mensaje.tipo} my-3`, role: "alert" },
          mensaje.texto
        ),
        h(
          "div",
          { className: "d-flex gap-2 mt-4" },
          h(
            "button",
            {
              type: "submit",
              id: "btnRegistrarCompra",
              className: "btn btn-accent flex-grow-1 py-2",
              disabled: enviando
            },
            enviando ? "Guardando compra..." : "Registrar compra"
          ),
          h(
            "button",
            {
              type: "button",
              id: "btnLimpiarCompra",
              className: "btn btn-ghost",
              onClick: onLimpiar,
              disabled: enviando
            },
            "Limpiar"
          )
        )
      )
    );
  }

  function HistorialCompras({ compras }) {
    return h(
      "section",
      { className: "panel-box" },
      h("h3", { className: "mb-3" }, "Historial reciente de compras"),
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
              h("th", null, "Fecha"),
              h("th", null, "Proveedor"),
              h("th", null, "Producto"),
              h("th", null, "Cant."),
              h("th", null, "Costo U."),
              h("th", null, "Total")
            )
          ),
          h(
            "tbody",
            null,
            compras.length === 0
              ? h(
                  "tr",
                  null,
                  h(
                    "td",
                    { colSpan: 6, className: "text-center py-4 text-muted" },
                    "No hay compras registradas en el historial."
                  )
                )
              : compras
                  .slice()
                  .reverse()
                  .map((compra, indice) =>
                    h(
                      "tr",
                      { key: compra.id || indice },
                      h("td", null, formatearFecha(compra.fecha)),
                      h("td", null, compra.proveedor || "—"),
                      h("td", null, compra.producto || "—"),
                      h("td", null, compra.cantidad || 0),
                      h("td", null, moneda(compra.costoUnitario || 0)),
                      h("td", { className: "fw-semibold" }, moneda(compra.total || 0))
                    )
                  )
          )
        )
      ),
      h(
        "p",
        { className: "small text-muted mt-3 mb-0" },
        `${compras.length} registro(s) de compra en el historial.`
      )
    );
  }

  function AplicacionCompras() {
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
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
      setProveedores(leerLista(LS_PROVEEDORES));
      setProductos(leerLista(LS_PRODUCTOS));
      setCompras(leerLista(LS_COMPRAS));
    }, []);

    useEffect(() => {
      cargarDatos();

      const handleActualizacion = () => cargarDatos();
      window.addEventListener("tienditaDatosActualizados", handleActualizacion);
      window.addEventListener("storage", handleActualizacion);

      return () => {
        window.removeEventListener("tienditaDatosActualizados", handleActualizacion);
        window.removeEventListener("storage", handleActualizacion);
      };
    }, [cargarDatos]);

    function limpiarFormulario() {
      setFormulario({
        proveedorId: "",
        productoId: "",
        cantidad: "1",
        costo: ""
      });
      setMensaje(null);
    }

    async function registrarCompra(event) {
      event.preventDefault();
      setMensaje(null);

      const proveedorId = formulario.proveedorId.trim();
      const productoId = formulario.productoId.trim();
      const cantidadTexto = formulario.cantidad.trim();
      const costoTexto = formulario.costo.trim();
      const cantidad = Number(cantidadTexto);
      const costo = Number(costoTexto);
      const total = cantidad * costo;

      if (!proveedorId) {
        setMensaje({ tipo: "warning", texto: "Selecciona un proveedor de la lista." });
        return;
      }
      if (!productoId) {
        setMensaje({ tipo: "warning", texto: "Selecciona un producto de la lista." });
        return;
      }
      if (cantidadTexto === "" || !Number.isSafeInteger(cantidad) || cantidad <= 0) {
        setMensaje({ tipo: "warning", texto: "La cantidad adquirida debe ser un número entero mayor que cero." });
        return;
      }
      if (costoTexto === "" || !Number.isFinite(costo) || costo <= 0 || !Number.isFinite(total) || total <= 0) {
        setMensaje({ tipo: "warning", texto: "El costo unitario y el total deben ser valores numéricos válidos mayores que cero." });
        return;
      }

      setEnviando(true);
      const claves = [LS_PRODUCTOS, LS_COMPRAS, LS_MOVIMIENTOS];
      const respaldos = {};

      try {
        claves.forEach(clave => {
          respaldos[clave] = localStorage.getItem(clave);
        });

        const productosActuales = leerLista(LS_PRODUCTOS);
        const proveedoresActuales = leerLista(LS_PROVEEDORES);
        const comprasActuales = leerLista(LS_COMPRAS);
        const movimientosActuales = leerLista(LS_MOVIMIENTOS);

        const proveedorActual = proveedoresActuales.find(item => String(item.id) === proveedorId);
        const productoActual = productosActuales.find(item => String(item.id) === productoId);

        if (!proveedorActual) {
          throw new Error("El proveedor seleccionado ya no existe en el sistema.");
        }
        if (!productoActual) {
          throw new Error("El producto seleccionado ya no existe en el catálogo.");
        }

        const stockActual = Number(productoActual.stock);
        const stockMinimo = Number(productoActual.stockMinimo || 5);
        const nuevoStock = stockActual + cantidad;

        if (!Number.isSafeInteger(stockActual) || stockActual < 0 || !Number.isSafeInteger(nuevoStock)) {
          throw new Error("Las existencias actuales no son válidas o exceden el límite admitido.");
        }

        const fechaIso = new Date().toISOString();
        const idCompra = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const usuarioActual = nombreUsuario();

        const compra = {
          id: idCompra,
          fecha: fechaIso,
          proveedorId: proveedorActual.id,
          proveedor: proveedorActual.nombre,
          productoId: productoActual.id,
          producto: productoActual.nombre,
          cantidad,
          costoUnitario: costo,
          total,
          usuario: usuarioActual
        };

        const movimiento = {
          id: idCompra,
          tipo: "compra",
          productoId: productoActual.id,
          productoNombre: productoActual.nombre,
          cantidad,
          costoUnitario: costo,
          total,
          proveedorId: proveedorActual.id,
          proveedorNombre: proveedorActual.nombre,
          usuario: usuarioActual,
          fecha: fechaIso
        };

        productoActual.stock = nuevoStock;
        productoActual.costo = costo;
        comprasActuales.push(compra);
        movimientosActuales.unshift(movimiento);

        try {
          localStorage.setItem(LS_COMPRAS, JSON.stringify(comprasActuales));
          localStorage.setItem(LS_PRODUCTOS, JSON.stringify(productosActuales));
          localStorage.setItem(LS_MOVIMIENTOS, JSON.stringify(movimientosActuales));
        } catch (errorStorage) {
          claves.forEach(clave => {
            const valorAnterior = respaldos[clave];
            if (valorAnterior === null) localStorage.removeItem(clave);
            else if (valorAnterior !== undefined) localStorage.setItem(clave, valorAnterior);
          });
          throw errorStorage;
        }

        setProductos(productosActuales);
        setCompras(comprasActuales);
        limpiarFormulario();

        window.dispatchEvent(
          new CustomEvent("tienditaDatosActualizados", {
            detail: { clave: LS_COMPRAS }
          })
        );
        window.dispatchEvent(
          new CustomEvent("compraRegistrada", {
            detail: { compra }
          })
        );

        setMensaje({
          tipo: "success",
          texto: `Compra registrada correctamente. Se sumaron ${cantidad} unidades a ${productoActual.nombre}.`
        });

        if (typeof window.mostrarExito === "function") {
          await window.mostrarExito(
            `Se agregaron ${cantidad} unidades de ${productoActual.nombre} al inventario. Existencias actuales: ${nuevoStock}.`,
            "Compra registrada"
          );
        }
      } catch (error) {
        setMensaje({
          tipo: "danger",
          texto: "No se pudo registrar la compra: " + error.message
        });
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
      h(
        "div",
        { className: "view-head" },
        h("h2", null, "Registro de Compras"),
        h(
          "p",
          null,
          "Registra entradas de mercancía de proveedores y actualiza las existencias del inventario."
        )
      ),
      (proveedores.length === 0 || productos.length === 0) &&
        h(
          "div",
          { className: "alert alert-warning mb-3", role: "status" },
          proveedores.length === 0
            ? "Primero registra al menos un proveedor en el módulo de Proveedores para vincular la compra."
            : "Primero registra productos en el Catálogo de Productos para poder abastecer existencias."
        ),
      h(
        "div",
        { className: "two-col" },
        h(FormularioCompra, {
          proveedores,
          productos,
          formulario,
          setFormulario,
          mensaje,
          enviando,
          onSubmit: registrarCompra,
          onLimpiar: limpiarFormulario
        }),
        h(HistorialCompras, { compras })
      )
    );
  }

  try {
    let sesion = null;
    try {
      sesion = JSON.parse(localStorage.getItem(LS_SESION));
    } catch {
      sesion = null;
    }

    if (!sesion) {
      sesion = { nombre: "Administrador", rol: "admin" };
    }

    window.ReactDOM.createRoot(mountNode).render(h(AplicacionCompras));
  } catch (error) {
    mountNode.innerHTML = `<div class="alert alert-danger m-3">No se pudo iniciar el módulo: ${error.message}</div>`;
  }
})();

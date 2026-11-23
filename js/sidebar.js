(function () {
  "use strict";

  const LS_SESION = "tiendita_sesion";
  const LS_PRODUCTOS = "tiendita_productos";

  const NAV_ITEMS = [
    {
      key: "panel",
      label: "Panel",
      url: "index.html#view-panel",
      roles: ["admin", "vendedor"]
    },
    {
      key: "productos",
      label: "Productos",
      url: "productos.html",
      roles: ["admin", "vendedor"]
    },
    {
      key: "inventario",
      label: "Inventario",
      url: "inventario.html",
      roles: ["admin", "vendedor"]
    },
    {
      key: "compras",
      label: "Compras",
      url: "compras.html",
      roles: ["admin"]
    },
    {
      key: "ventas",
      label: "Ventas",
      url: "ventas.html",
      roles: ["admin", "vendedor"]
    },
    {
      key: "alertas",
      label: "Alertas",
      url: "index.html#view-alertas",
      roles: ["admin", "vendedor"]
    },
    {
      key: "reportes",
      label: "Reportes",
      url: "reportes.html",
      roles: ["admin"]
    },
    {
      key: "proveedores",
      label: "Proveedores",
      url: "proveedores.html",
      roles: ["admin", "vendedor"]
    }
  ];

  function obtenerSesionGuardada() {
    try {
      const dato = localStorage.getItem(LS_SESION);
      return dato ? JSON.parse(dato) : null;
    } catch (e) {
      return null;
    }
  }

  function verificarAcceso(soloAdmin) {
    const sesion = obtenerSesionGuardada();
    if (!sesion) {
      window.location.href = "MiTiendita/login.html";
      return null;
    }
    if (soloAdmin && sesion.rol !== "admin") {
      window.location.href = "index.html";
      return null;
    }
    return sesion;
  }

  window.obtenerSesionGuardada = obtenerSesionGuardada;
  window.verificarAcceso = verificarAcceso;

  function detectarPaginaActual() {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.endsWith("productos.html")) return "productos";
    if (path.endsWith("inventario.html")) return "inventario";
    if (path.endsWith("compras.html")) return "compras";
    if (path.endsWith("ventas.html")) return "ventas";
    if (path.endsWith("proveedores.html")) return "proveedores";
    if (path.endsWith("reportes.html")) return "reportes";
    if (hash === "#view-alertas") return "alertas";
    return "panel";
  }

  function contarStockBajo() {
    try {
      const productos = JSON.parse(localStorage.getItem(LS_PRODUCTOS) || "[]");
      if (!Array.isArray(productos)) return 0;
      return productos.filter(function (p) {
        return Number(p.stock) <= Number(p.stockMinimo ?? 5);
      }).length;
    } catch (e) {
      return 0;
    }
  }

  function crearIcono(h, tipo) {
    if (tipo === "panel") {
      return h(
        "svg",
        { width: 18, height: 18, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6 },
        h("rect", { x: 2, y: 2, width: 7, height: 7, rx: 1.4 }),
        h("rect", { x: 11, y: 2, width: 7, height: 7, rx: 1.4 }),
        h("rect", { x: 2, y: 11, width: 7, height: 7, rx: 1.4 }),
        h("rect", { x: 11, y: 11, width: 7, height: 7, rx: 1.4 })
      );
    }
    if (tipo === "productos") {
      return h(
        "svg",
        { width: 18, height: 18, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" },
        h("path", { d: "M16.5 9.5l-6-6H3v7.5l6 6a2 2 0 0 0 2.8 0l4.7-4.7a2 2 0 0 0 0-2.8Z" }),
        h("circle", { cx: 6.5, cy: 6.5, r: 1.5 })
      );
    }
    if (tipo === "inventario") {
      return h(
        "svg",
        { width: 18, height: 18, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinejoin: "round" },
        h("path", { d: "M3 6l7-4 7 4-7 4-7-4Z" }),
        h("path", { d: "M3 6v8l7 4 7-4V6" }),
        h("path", { d: "M10 10v8" })
      );
    }
    if (tipo === "compras") {
      return h(
        "svg",
        { width: 18, height: 18, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" },
        h("path", { d: "M10 2v10" }),
        h("path", { d: "M5 8l5 5 5-5" }),
        h("path", { d: "M3 17h14" })
      );
    }
    if (tipo === "ventas") {
      return h(
        "svg",
        { width: 18, height: 18, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" },
        h("path", { d: "M10 18V8" }),
        h("path", { d: "M5 12l5-5 5 5" }),
        h("path", { d: "M3 3h14" })
      );
    }
    if (tipo === "alertas") {
      return h(
        "svg",
        { width: 18, height: 18, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" },
        h("path", { d: "M10 2a4 4 0 0 0-4 4v2.5c0 1.2-.5 2.3-1.4 3.1L4 12h12l-.6-.4A4.3 4.3 0 0 1 14 8.5V6a4 4 0 0 0-4-4Z" }),
        h("path", { d: "M8 15a2 2 0 0 0 4 0" })
      );
    }
    if (tipo === "reportes") {
      return h(
        "svg",
        { width: 18, height: 18, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" },
        h("path", { d: "M3 17V10" }),
        h("path", { d: "M9 17V5" }),
        h("path", { d: "M15 17v-8" })
      );
    }
    return h(
      "svg",
      { width: 18, height: 18, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" },
      h("path", { d: "M17 18v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" }),
      h("circle", { cx: 10, cy: 7, r: 4 })
    );
  }

  function inicializarNavegacion() {
    const sesion = verificarAcceso(false);
    if (!sesion) return;

    const rol = sesion.rol || "vendedor";
    document.body.classList.toggle("role-vendedor", rol !== "admin");

    const whoName = document.getElementById("whoName") || document.getElementById("userName");
    if (whoName) {
      whoName.textContent = sesion.nombre || "Usuario";
    }

    const whoRole = document.getElementById("whoRole") || document.getElementById("userRole");
    if (whoRole) {
      whoRole.textContent = rol === "admin" ? "Administrador/a" : "Vendedor/a";
    }

    const syncDot = document.getElementById("syncDot");
    const syncText = document.getElementById("syncPillText");
    if (syncDot) {
      syncDot.className = "dot ok";
    }
    if (syncText) {
      syncText.textContent = "Datos locales";
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn && !logoutBtn.dataset.listo) {
      logoutBtn.dataset.listo = "true";
      logoutBtn.addEventListener("click", function () {
        try {
          localStorage.removeItem(LS_SESION);
        } catch (e) {}
        window.location.href = "MiTiendita/login.html";
      });
    }

    if (!window.React || !window.ReactDOM) return;

    const { createElement: h, useState, useEffect, Fragment } = window.React;

    function ListaNavegacion() {
      const [paginaActual, setPaginaActual] = useState(detectarPaginaActual);
      const [stockBajo, setStockBajo] = useState(contarStockBajo);

      useEffect(function () {
        function actualizarEstado() {
          setPaginaActual(detectarPaginaActual());
          setStockBajo(contarStockBajo());
        }

        window.addEventListener("hashchange", actualizarEstado);
        window.addEventListener("tienditaDatosActualizados", actualizarEstado);
        window.addEventListener("ventaRegistrada", actualizarEstado);
        window.addEventListener("compraRegistrada", actualizarEstado);
        window.addEventListener("storage", actualizarEstado);

        return function () {
          window.removeEventListener("hashchange", actualizarEstado);
          window.removeEventListener("tienditaDatosActualizados", actualizarEstado);
          window.removeEventListener("ventaRegistrada", actualizarEstado);
          window.removeEventListener("compraRegistrada", actualizarEstado);
          window.removeEventListener("storage", actualizarEstado);
        };
      }, []);

      const items = NAV_ITEMS.filter(function (it) {
        return it.roles.indexOf(rol) !== -1;
      });

      return h(
        Fragment,
        null,
        items.map(function (it) {
          const esActivo = it.key === paginaActual;
          return h(
            "a",
            {
              key: it.key,
              href: it.url,
              className: "nav-item" + (esActivo ? " active" : ""),
              "data-view": it.key
            },
            crearIcono(h, it.key),
            h("span", null, it.label),
            it.key === "alertas" && stockBajo > 0
              ? h("span", { className: "nav-badge" }, String(stockBajo))
              : null
          );
        })
      );
    }

    function PieLicencia() {
      return h(
        "footer",
        { className: "footer-licencia" },
        "La Tiendita · Proyecto académico bajo licencia ",
        h(
          "a",
          {
            href: "https://creativecommons.org/licenses/by/4.0/deed.es",
            target: "_blank",
            rel: "noopener noreferrer"
          },
          "Creative Commons Atribución 4.0 Internacional (CC BY 4.0)"
        ),
        "."
      );
    }

    const sidebarNav = document.getElementById("sidebarNav");
    if (sidebarNav) {
      window.ReactDOM.createRoot(sidebarNav).render(h(ListaNavegacion));
    }

    const bottomNav = document.getElementById("bottomNav");
    if (bottomNav) {
      window.ReactDOM.createRoot(bottomNav).render(h(ListaNavegacion));
    }

    const mainArea = document.getElementById("mainArea");
    if (mainArea && !document.getElementById("footerLicencia")) {
      const footerHost = document.createElement("div");
      footerHost.id = "footerLicencia";
      mainArea.appendChild(footerHost);
      window.ReactDOM.createRoot(footerHost).render(h(PieLicencia));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarNavegacion);
  } else {
    inicializarNavegacion();
  }
})();

/**
 * js/sidebar.js
 * Barra lateral y navegación compartida para todas las vistas de La Tiendita.
 * Sintaxis JavaScript estándar (ES6) compatible con node --check.
 */

(function () {
  "use strict";

  const ICONS = {
    panel:
      '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="7" height="7" rx="1.4"/><rect x="11" y="2" width="7" height="7" rx="1.4"/><rect x="2" y="11" width="7" height="7" rx="1.4"/><rect x="11" y="11" width="7" height="7" rx="1.4"/></svg>',
    productos:
      '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.5l-6-6H3v7.5l6 6a2 2 0 0 0 2.8 0l4.7-4.7a2 2 0 0 0 0-2.8Z"/><circle cx="6.5" cy="6.5" r="1.5"/></svg>',
    inventario:
      '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3 6l7-4 7 4-7 4-7-4Z"/><path d="M3 6v8l7 4 7-4V6"/><path d="M10 10v8"/></svg>',
    compras:
      '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v10"/><path d="M5 8l5 5 5-5"/><path d="M3 17h14"/></svg>',
    ventas:
      '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 18V8"/><path d="M5 12l5-5 5 5"/><path d="M3 3h14"/></svg>',
    alertas:
      '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2a4 4 0 0 0-4 4v2.5c0 1.2-.5 2.3-1.4 3.1L4 12h12l-.6-.4A4.3 4.3 0 0 1 14 8.5V6a4 4 0 0 0-4-4Z"/><path d="M8 15a2 2 0 0 0 4 0"/></svg>',
    reportes:
      '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17V10"/><path d="M9 17V5"/><path d="M15 17v-8"/></svg>',
    proveedores:
      '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 18v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/></svg>'
  };

  const NAV_ITEMS = [
    {
      key: "panel",
      label: "Panel",
      url: "index.html",
      icon: ICONS.panel,
      roles: ["admin", "vendedor"]
    },
    {
      key: "productos",
      label: "Productos",
      url: "productos.html",
      icon: ICONS.productos,
      roles: ["admin", "vendedor"]
    },
    {
      key: "inventario",
      label: "Inventario",
      url: "inventario.html",
      icon: ICONS.inventario,
      roles: ["admin", "vendedor"]
    },
    {
      key: "compras",
      label: "Compras",
      url: "compras.html",
      icon: ICONS.compras,
      roles: ["admin"]
    },
    {
      key: "ventas",
      label: "Ventas",
      url: "ventas.html",
      icon: ICONS.ventas,
      roles: ["admin", "vendedor"]
    },
    {
      key: "alertas",
      label: "Alertas",
      url: "index.html#view-alertas",
      icon: ICONS.alertas,
      roles: ["admin", "vendedor"]
    },
    {
      key: "reportes",
      label: "Reportes",
      url: "reportes.html",
      icon: ICONS.reportes,
      roles: ["admin"]
    },
    {
      key: "proveedores",
      label: "Proveedores",
      url: "proveedores.html",
      icon: ICONS.proveedores,
      roles: ["admin", "vendedor"]
    }
  ];

  function detectarPaginaActual() {
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith("productos.html")) return "productos";
    if (path.endsWith("inventario.html")) return "inventario";
    if (path.endsWith("compras.html")) return "compras";
    if (path.endsWith("ventas.html")) return "ventas";
    if (path.endsWith("proveedores.html")) return "proveedores";
    if (path.endsWith("reportes.html")) return "reportes";
    return "panel";
  }

  function contarStockBajo() {
    try {
      const productos = JSON.parse(
        localStorage.getItem("tiendita_productos") || "[]"
      );
      if (!Array.isArray(productos)) return 0;
      return productos.filter(function (p) {
        return Number(p.stock) <= Number(p.stockMinimo || 5);
      }).length;
    } catch (e) {
      return 0;
    }
  }

  function renderizarNavegacion(container, paginaActual, rol) {
    if (!container) return;
    container.innerHTML = "";
    const items = NAV_ITEMS.filter(function (it) {
      return it.roles.indexOf(rol) !== -1;
    });
    const stockBajo = contarStockBajo();

    items.forEach(function (it) {
      const link = document.createElement("a");
      const esActivo = it.key === paginaActual;
      link.className = "nav-item" + (esActivo ? " active" : "");
      link.href = it.url;
      link.dataset.view = it.key;

      let badge = "";
      if (it.key === "alertas" && stockBajo > 0) {
        badge = '<span class="nav-badge">' + stockBajo + "</span>";
      }

      link.innerHTML = it.icon + "<span>" + it.label + "</span>" + badge;
      container.appendChild(link);
    });
  }

  function inicializarNavegacion() {
    let sesion = null;
    try {
      sesion = JSON.parse(localStorage.getItem("tiendita_sesion"));
    } catch (e) {
      sesion = null;
    }

    if (!sesion) {
      sesion = { nombre: "Usuario", rol: "admin" };
    }

    const rol = sesion.rol || "vendedor";
    const paginaActual = detectarPaginaActual();

    // Actualizar nombre y rol en la cabecera
    const whoName =
      document.getElementById("whoName") ||
      document.getElementById("userName");
    if (whoName) {
      whoName.textContent = sesion.nombre;
    }

    const whoRole =
      document.getElementById("whoRole") ||
      document.getElementById("userRole");
    if (whoRole) {
      whoRole.textContent =
        sesion.rol === "admin" ? "Administrador/a" : "Vendedor/a";
    }

    // Botón de salir
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        try {
          localStorage.removeItem("tiendita_sesion");
        } catch (e) {}
        window.location.href = "MiTiendita/login.html";
      });
    }

    // Renderizar barra lateral y barra móvil inferior
    renderizarNavegacion(
      document.getElementById("sidebarNav"),
      paginaActual,
      rol
    );
    renderizarNavegacion(
      document.getElementById("bottomNav"),
      paginaActual,
      rol
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarNavegacion);
  } else {
    inicializarNavegacion();
  }
})();

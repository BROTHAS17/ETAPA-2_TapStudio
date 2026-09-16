(function cargarDatosIniciales() {
  if (!localStorage.getItem("tiendita_usuarios")) {
    const usuarios = [
      { id: 1, nombre: "Admin General", email: "admin@granofacil.com", password: "Password123", rol: "admin" },
      { id: 2, nombre: "Carlos Mendoza (Cajero)", email: "carlos.m@granofacil.com", password: "Password123", rol: "vendedor" }
    ];
    localStorage.setItem("tiendita_usuarios", JSON.stringify(usuarios));
    }

  if (!localStorage.getItem("tiendita_productos")) {
    const productos = [
      { id: 1, nombre: "Agua Mineral Manantial 500ml", categoria: "Bebidas", costo: 0.32, precio: 0.85, stock: 5, stockMinimo: 24 },
      { id: 2, nombre: "Coca-Cola 2.5L", categoria: "Bebidas", costo: 2.15, precio: 2.75, stock: 8, stockMinimo: 10 },
      { id: 3, nombre: "Papas Fritas Natural 45g", categoria: "Snacks", costo: 0.72, precio: 1.20, stock: 12, stockMinimo: 15 },
      { id: 4, nombre: "Leche Entera 1L", categoria: "Lácteos", costo: 1.28, precio: 1.50, stock: 5, stockMinimo: 8 }
    ];
    localStorage.setItem("tiendita_productos", JSON.stringify(productos));
  }
})();  

(function cargarDatosIniciales() {
  if (!localStorage.getItem("tiendita_usuarios")) {
    const usuarios = [
      { id: 1, nombre: "Admin General", email: "admin@granofacil.com", password: "Password123", rol: "admin" },
      { id: 2, nombre: "Carlos Mendoza (Cajero)", email: "carlos.m@granofacil.com", password: "Password123", rol: "vendedor" }
    ];

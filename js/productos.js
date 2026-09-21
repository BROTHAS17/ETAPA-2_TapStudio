const sesion = JSON.parse(localStorage.getItem("tiendita_sesion"));

if (!sesion) {
    window.location.href = "MiTiendita/login.html";
} else {
    // El CRUD utiliza la misma fuente de productos que inventario y punto de venta.
    let productos = JSON.parse(localStorage.getItem("tiendita_productos")) || [];
    let productoEditando = null;

    const listaProductos = document.getElementById("listaProductos");
    const formProducto = document.getElementById("formProducto");
    const buscador = document.getElementById("buscador");

    function mostrarProductos(productosMostrar = productos) {
        listaProductos.innerHTML = "";

        productosMostrar.forEach(function(producto) {
            const tarjeta = document.createElement("div");
            tarjeta.classList.add("col-md-4");

            tarjeta.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${producto.nombre}</h5>
                        <p class="card-text">Categoría: ${producto.categoria}</p>
                        <p class="card-text">Costo: $${Number(producto.costo).toFixed(2)}</p>
                        <p class="card-text">Precio: $${Number(producto.precio).toFixed(2)}</p>
                        <p class="card-text">Margen: $${(Number(producto.precio) - Number(producto.costo)).toFixed(2)}</p>
                        <p class="card-text">Stock: ${producto.stock}</p>
                        <p class="card-text">Stock mínimo: ${producto.stockMinimo}</p>
                        <div class="d-flex gap-2">
                            <button class="btn btn-warning" onclick="editarProducto(${producto.id})">Editar</button>
                            <button class="btn btn-danger" onclick="eliminarProducto(${producto.id})">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;

            listaProductos.appendChild(tarjeta);
        });
    }

    function editarProducto(id) {
        const producto = productos.find(function(producto) {
            return Number(producto.id) === Number(id);
        });

        if (!producto) return;

        productoEditando = id;
        document.getElementById("nombre").value = producto.nombre;
        document.getElementById("categoria").value = producto.categoria;
        document.getElementById("costo").value = producto.costo;
        document.getElementById("precio").value = producto.precio;
        document.getElementById("stock").value = producto.stock;
        document.getElementById("stockMinimo").value = producto.stockMinimo;

        const modal = new bootstrap.Modal(document.getElementById("modalProducto"));
        modal.show();
    }

    function eliminarProducto(id) {
        if (!confirm("¿Deseas eliminar este producto?")) return;

        productos = productos.filter(function(producto) {
            return Number(producto.id) !== Number(id);
        });

        localStorage.setItem("tiendita_productos", JSON.stringify(productos));
        mostrarProductos();
    }

    formProducto.addEventListener("submit", function(event) {
        event.preventDefault();

        const nombreInput = document.getElementById("nombre");
        const categoriaInput = document.getElementById("categoria");
        const costoInput = document.getElementById("costo");
        const precioInput = document.getElementById("precio");
        const stockInput = document.getElementById("stock");
        const stockMinimoInput = document.getElementById("stockMinimo");

        const nombre = nombreInput.value.trim();
        const categoria = categoriaInput.value;
        const costo = Number(costoInput.value);
        const precio = Number(precioInput.value);
        const stock = Number(stockInput.value);
        const stockMinimo = Number(stockMinimoInput.value);

        let valido = true;

        document.querySelectorAll(".is-invalid").forEach(function(campo) {
            campo.classList.remove("is-invalid");
        });

        if (nombre === "") { nombreInput.classList.add("is-invalid"); valido = false; }
        if (categoria === "") { categoriaInput.classList.add("is-invalid"); valido = false; }
        if (costo <= 0) { costoInput.classList.add("is-invalid"); valido = false; }
        if (precio <= costo) { precioInput.classList.add("is-invalid"); valido = false; }
        if (stock < 0) { stockInput.classList.add("is-invalid"); valido = false; }
        if (stockMinimo < 0) { stockMinimoInput.classList.add("is-invalid"); valido = false; }

        if (!valido) return;

        if (productoEditando !== null) {
            const producto = productos.find(function(producto) {
                return Number(producto.id) === Number(productoEditando);
            });

            if (!producto) return;

            producto.nombre = nombre;
            producto.categoria = categoria;
            producto.costo = costo;
            producto.precio = precio;
            producto.stock = stock;
            producto.stockMinimo = stockMinimo;
            productoEditando = null;
        } else {
            productos.push({
                id: Date.now(),
                nombre,
                categoria,
                costo,
                precio,
                stock,
                stockMinimo
            });
        }

        localStorage.setItem("tiendita_productos", JSON.stringify(productos));
        mostrarProductos();
        formProducto.reset();
    });

    buscador.addEventListener("input", function() {
        const texto = buscador.value.toLowerCase();
        mostrarProductos(productos.filter(function(producto) {
            return producto.nombre.toLowerCase().includes(texto);
        }));
    });

    mostrarProductos();
}
/**
 * Componente de Productos para Vite
 * Mi Tiendita - Etapa 2
 * Integrante 1: Productos, catalogo sugerido e Inventario
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CLAVES, leerDatos, guardarDatos } from '../storage.js';
import { consultarDummyJSON } from '../services/apiProductos.js';
import { consultarOpenFoodFacts } from '../services/openFoodFacts.js';

const CATEGORIAS_VALIDAS = [
    "Abarrotes",
    "Bebidas",
    "Snacks",
    "Lacteos",
    "Dulces",
    "Limpieza",
    "Higiene",
    "Otros"
];

function validarProducto(producto, productosExistentes = [], idEditando = null) {
    const errores = {};
    const nombre = String(producto.nombre || "").trim();
    const categoria = String(producto.categoria || "").trim();
    const costo = Number(producto.costo);
    const precio = Number(producto.precio);
    const stock = Number(producto.stock);
    const stockMinimo = Number(producto.stockMinimo);

    if (!nombre) {
        errores.nombre = "Ingresa el nombre del producto.";
    } else {
        const duplicado = productosExistentes.some(p =>
            p.nombre.trim().toLowerCase() === nombre.toLowerCase() &&
            String(p.id) !== String(idEditando)
        );
        if (duplicado) {
            errores.nombre = "Ya existe un producto registrado con ese mismo nombre.";
        }
    }

    if (!categoria) errores.categoria = "Selecciona una categoria valida.";
    if (producto.costo === "" || producto.costo === null || isNaN(costo) || costo <= 0)
        errores.costo = "El costo debe ser un numero mayor a $0.00.";
    if (producto.precio === "" || producto.precio === null || isNaN(precio) || precio <= 0)
        errores.precio = "El precio de venta debe ser mayor a $0.00.";
    else if (!isNaN(costo) && costo > 0 && precio <= costo)
        errores.precio = "El precio de venta debe ser estrictamente mayor que el costo.";
    if (producto.stock === "" || producto.stock === null || !Number.isInteger(stock) || stock < 0)
        errores.stock = "El stock debe ser un numero entero mayor o igual a 0.";
    if (producto.stockMinimo === "" || producto.stockMinimo === null || !Number.isInteger(stockMinimo) || stockMinimo < 0)
        errores.stockMinimo = "El stock minimo debe ser un numero entero mayor o igual a 0.";

    return { valido: Object.keys(errores).length === 0, errores };
}

// ============================================================================
// COMPONENTE: Modal Formulario de Producto (Con estilo nativo de La Tiendita)
// ============================================================================
function FormularioProductoModal({
    abierto,
    onCerrar,
    onGuardar,
    productoEditando,
    productosExistentes,
    terminoInicialParaBuscar
}) {
    const estadoInicial = {
        codigo: "", nombre: "", categoria: "", costo: "", precio: "",
        stock: "0", stockMinimo: "5"
    };

    const [formData, setFormData] = useState(estadoInicial);
    const [errores, setErrores] = useState({});
    const [busquedaSugerida, setBusquedaSugerida] = useState("");
    const [estadoConsulta, setEstadoConsulta] = useState("idle");
    const [mensajeConsulta, setMensajeConsulta] = useState("");
    const [productoEncontrado, setProductoEncontrado] = useState(null);
    const inputCostoRef = useRef(null);
    const inputSugeridaRef = useRef(null);

    useEffect(() => {
        if (!abierto) return;

        if (productoEditando) {
            setFormData({
                codigo: productoEditando.codigo || "",
                nombre: productoEditando.nombre || "",
                categoria: productoEditando.categoria || "",
                costo: String(productoEditando.costo ?? ""),
                precio: String(productoEditando.precio ?? ""),
                stock: String(productoEditando.stock ?? "0"),
                stockMinimo: String(productoEditando.stockMinimo ?? "5")
            });
            setBusquedaSugerida(productoEditando.nombre || productoEditando.codigo || "");
            setEstadoConsulta("idle");
            setMensajeConsulta("");
            setProductoEncontrado(null);
        } else {
            setFormData(estadoInicial);
            setErrores({});
            setProductoEncontrado(null);

            if (terminoInicialParaBuscar && terminoInicialParaBuscar.trim()) {
                const term = terminoInicialParaBuscar.trim();
                setBusquedaSugerida(term);
                ejecutarConsulta(term);
            } else {
                setBusquedaSugerida("");
                setEstadoConsulta("idle");
                setMensajeConsulta("");
                setTimeout(() => {
                    if (inputSugeridaRef.current) inputSugeridaRef.current.focus();
                }, 100);
            }
        }
    }, [abierto, productoEditando, terminoInicialParaBuscar]);

    if (!abierto) return null;

    const esEdicion = Boolean(productoEditando && productoEditando.id);

    const ejecutarConsulta = async (termino) => {
        const query = String(termino || "").trim();
        if (!query) {
            setEstadoConsulta("error");
            setMensajeConsulta("Escribe el nombre de un producto para buscar sugerencias.");
            return;
        }

        setEstadoConsulta("cargando");
        setMensajeConsulta("");
        setProductoEncontrado(null);

        let resultado = await consultarDummyJSON(query);
        if (!resultado.exito && /^\d{8,14}$/.test(query)) {
            resultado = await consultarOpenFoodFacts(query);
        }

        if (resultado.exito && resultado.producto) {
            const prod = resultado.producto;
            setEstadoConsulta("encontrado");
            setProductoEncontrado(prod);
            setMensajeConsulta("Informacion sugerida cargada. Revisa o modifica los valores.");

            setFormData((prev) => {
                const act = { ...prev };
                if (prod.codigo) act.codigo = prod.codigo;
                if (prod.nombre) act.nombre = prod.nombre;
                if (prod.categoria) act.categoria = prod.categoria;
                if (prod.costo) act.costo = String(prod.costo);
                if (prod.precio) act.precio = String(prod.precio);
                if (prod.stock) act.stock = String(prod.stock);
                return act;
            });

            setTimeout(() => {
                if (inputCostoRef.current) inputCostoRef.current.focus();
            }, 150);
        } else if (resultado.tipoError === "no_encontrado") {
            setEstadoConsulta("no_encontrado");
            setMensajeConsulta("No se encontro informacion para \"" + query + "\" en el catalogo sugerido.");
        } else {
            setEstadoConsulta("error");
            setMensajeConsulta("No fue posible conectar con el catalogo en linea.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errores[name]) {
            setErrores((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validacion = validarProducto(formData, productosExistentes, esEdicion ? productoEditando.id : null);
        if (!validacion.valido) {
            setErrores(validacion.errores);
            return;
        }

        const productoFinal = {
            id: esEdicion ? productoEditando.id : Date.now(),
            codigo: formData.codigo.trim(),
            nombre: formData.nombre.trim(),
            categoria: formData.categoria,
            costo: Number(formData.costo),
            precio: Number(formData.precio),
            stock: Number(formData.stock),
            stockMinimo: Number(formData.stockMinimo)
        };
        onGuardar(productoFinal);
    };

    const costoNum = Number(formData.costo);
    const precioNum = Number(formData.precio);
    const margen = !isNaN(costoNum) && !isNaN(precioNum) && precioNum > costoNum
        ? (precioNum - costoNum).toFixed(2)
        : null;

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
            <div className="product-modal modal-wide">
                <div className="product-modal-head">
                    <h3>{esEdicion ? "Editar producto" : "Registrar producto"}</h3>
                    <button type="button" className="icon-btn" onClick={onCerrar} title="Cerrar" aria-label="Cerrar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    {!esEdicion && (
                        <div
                            style={{
                                background: "var(--surface-2)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-m)",
                                padding: "16px 18px",
                                marginBottom: "20px"
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--ink)" }}>
                                    Buscar en catalogo sugerido
                                </span>
                                <span
                                    className="badge"
                                    style={{
                                        background: "var(--surface)",
                                        border: "1px solid var(--border)",
                                        color: "var(--ink-soft)",
                                        fontSize: "0.72rem"
                                    }}
                                >
                                    Asistente
                                </span>
                            </div>
                            <p className="hint mb-2">
                                Escribe el nombre o codigo de un articulo (ejemplo: Leche, Cafe, Aceite, Arroz, Jugo) para autocompletar sugerencias.
                            </p>
                            <div className="d-flex gap-2 mb-2">
                                <input
                                    ref={inputSugeridaRef}
                                    type="text"
                                    style={{
                                        flex: 1,
                                        padding: "9px 12px",
                                        borderRadius: "var(--radius-s)",
                                        border: "1px solid var(--border)",
                                        background: "var(--surface)",
                                        color: "var(--ink)"
                                    }}
                                    placeholder="Buscar producto o codigo..."
                                    value={busquedaSugerida}
                                    onChange={(e) => setBusquedaSugerida(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ejecutarConsulta(busquedaSugerida); } }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-accent"
                                    style={{ width: "auto", padding: "9px 16px" }}
                                    onClick={() => ejecutarConsulta(busquedaSugerida)}
                                    disabled={estadoConsulta === "cargando"}
                                >
                                    {estadoConsulta === "cargando" ? "Buscando..." : "Buscar"}
                                </button>
                            </div>

                            <div className="d-flex flex-wrap gap-1 mb-2">
                                <span className="hint me-1">Sugerencias:</span>
                                {[
                                    { l: "Leche", q: "leche" },
                                    { l: "Cafe", q: "cafe" },
                                    { l: "Aceite", q: "aceite" },
                                    { l: "Arroz", q: "arroz" },
                                    { l: "Huevos", q: "huevos" }
                                ].map(item => (
                                    <button
                                        key={item.q}
                                        type="button"
                                        className="btn btn-ghost btn-small"
                                        style={{ borderRadius: "20px", padding: "3px 10px", fontSize: "0.76rem" }}
                                        onClick={() => { setBusquedaSugerida(item.q); ejecutarConsulta(item.q); }}
                                    >
                                        {item.l}
                                    </button>
                                ))}
                            </div>

                            {estadoConsulta === "encontrado" && productoEncontrado && (
                                <div style={{ background: "var(--success-bg)", border: "1px solid var(--success)", borderRadius: "var(--radius-s)", padding: "12px", color: "var(--ink)" }}>
                                    <div style={{ fontWeight: 600, color: "var(--success)", fontSize: "0.85rem" }}>Informacion sugerida cargada</div>
                                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{productoEncontrado.nombre}</div>
                                    <div style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                                        Categoria: {productoEncontrado.categoria} | Precio sugerido: ${productoEncontrado.precio}
                                    </div>
                                    <div className="hint" style={{ color: "var(--ink-soft)", marginTop: "4px" }}>
                                        Se completaron los campos abajo. Ajusta los valores para tu tienda.
                                    </div>
                                </div>
                            )}

                            {estadoConsulta === "no_encontrado" && (
                                <div style={{ background: "var(--warning-bg)", border: "1px solid var(--warning)", borderRadius: "var(--radius-s)", padding: "10px 12px", fontSize: "0.83rem", color: "var(--warning)" }}>
                                    {mensajeConsulta}
                                </div>
                            )}
                            {estadoConsulta === "error" && (
                                <div style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)", borderRadius: "var(--radius-s)", padding: "10px 12px", fontSize: "0.83rem", color: "var(--danger)" }}>
                                    {mensajeConsulta}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="row g-3 mx-0">
                        <div className="field col-12 col-sm-6">
                            <label htmlFor="vCodigo">Codigo de barras / Identificador</label>
                            <input type="text" id="vCodigo" name="codigo" value={formData.codigo} onChange={handleChange} />
                        </div>
                        <div className="field col-12 col-sm-6">
                            <label htmlFor="vCategoria">Categoria *</label>
                            <select id="vCategoria" name="categoria" value={formData.categoria} onChange={handleChange}>
                                <option value="">Selecciona categoria</option>
                                {CATEGORIAS_VALIDAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            {errores.categoria && <p className="inline-error">{errores.categoria}</p>}
                        </div>
                        <div className="field col-12">
                            <label htmlFor="vNombre">Nombre *</label>
                            <input type="text" id="vNombre" name="nombre" value={formData.nombre} onChange={handleChange} />
                            {errores.nombre && <p className="inline-error">{errores.nombre}</p>}
                        </div>
                        <div className="field col-12 col-sm-6">
                            <label htmlFor="vCosto">Costo ($) *</label>
                            <input ref={inputCostoRef} type="number" step="0.01" min="0.01" id="vCosto" name="costo" value={formData.costo} onChange={handleChange} />
                            {errores.costo && <p className="inline-error">{errores.costo}</p>}
                        </div>
                        <div className="field col-12 col-sm-6">
                            <label htmlFor="vPrecio">Precio ($) *</label>
                            <input type="number" step="0.01" min="0.01" id="vPrecio" name="precio" value={formData.precio} onChange={handleChange} />
                            {errores.precio && <p className="inline-error">{errores.precio}</p>}
                        </div>
                        {margen !== null && (
                            <div className="col-12">
                                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-s)", padding: "8px 12px", fontSize: "0.83rem" }}>
                                    Margen estimado: <strong>${margen}</strong> por unidad.
                                </div>
                            </div>
                        )}
                        <div className="field col-12 col-sm-6">
                            <label htmlFor="vStock">Stock *</label>
                            <input type="number" step="1" min="0" id="vStock" name="stock" value={formData.stock} onChange={handleChange} />
                            {errores.stock && <p className="inline-error">{errores.stock}</p>}
                        </div>
                        <div className="field col-12 col-sm-6">
                            <label htmlFor="vStockMin">Stock minimo *</label>
                            <input type="number" step="1" min="0" id="vStockMin" name="stockMinimo" value={formData.stockMinimo} onChange={handleChange} />
                            {errores.stockMinimo && <p className="inline-error">{errores.stockMinimo}</p>}
                        </div>
                    </div>

                    <div className="modal-foot">
                        <button type="button" className="btn btn-ghost" onClick={onCerrar}>Cancelar</button>
                        <button type="submit" className="btn btn-accent">
                            {esEdicion ? "Guardar cambios" : "Guardar producto"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================================================
// COMPONENTE: Tarjeta Individual de Producto (Sin imagen)
// ============================================================================
function TarjetaProducto({ producto, onEditar, onEliminar }) {
    const stockNum = Number(producto.stock);
    const minNum = Number(producto.stockMinimo);
    const esCritico = stockNum <= minNum;
    const margen = (Number(producto.precio) - Number(producto.costo)).toFixed(2);

    return (
        <div className="col-12 col-md-6 col-lg-4">
            <div className="panel-box h-100 p-3 d-flex flex-column justify-content-between position-relative">
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge" style={{ background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--border)" }}>
                            {producto.categoria}
                        </span>
                        {producto.codigo && (
                            <span className="badge font-monospace" style={{ background: "var(--surface-2)", color: "var(--ink-soft)", border: "1px solid var(--border)" }}>
                                {producto.codigo}
                            </span>
                        )}
                    </div>
                    <h5 className="fw-bold mb-3">{producto.nombre}</h5>
                    <div className="row g-2 small text-secondary mb-3 p-2 rounded" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        <div className="col-6"><span>Costo:</span> ${Number(producto.costo).toFixed(2)}</div>
                        <div className="col-6"><span>Precio:</span> <strong style={{ color: "var(--accent-ink)" }}>${Number(producto.precio).toFixed(2)}</strong></div>
                        <div className="col-6"><span>Margen:</span> ${margen}</div>
                        <div className="col-6"><span>Stock min:</span> {producto.stockMinimo}</div>
                    </div>
                </div>
                <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                    <span className="badge" style={{ background: esCritico ? "var(--danger-bg)" : "var(--success-bg)", color: esCritico ? "var(--danger)" : "var(--success)" }}>
                        {producto.stock} uds.
                    </span>
                    <div className="d-flex gap-1">
                        <button className="btn btn-ghost btn-small" onClick={() => onEditar(producto)}>Editar</button>
                        <button className="btn btn-ghost btn-small text-danger" onClick={() => onEliminar(producto)}>Eliminar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function Productos() {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [categoriaFiltro, setCategoriaFiltro] = useState("");
    const [modalAbierto, setModalAbierto] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);
    const [terminoParaBuscar, setTerminoParaBuscar] = useState("");

    useEffect(() => {
        setProductos(leerDatos(CLAVES.PRODUCTOS));
    }, []);

    const actualizarProductos = (lista) => {
        setProductos(lista);
        guardarDatos(CLAVES.PRODUCTOS, lista);
    };

    const handleAbrirNuevo = () => {
        setProductoEditando(null);
        setTerminoParaBuscar("");
        setModalAbierto(true);
    };

    const handleAbrirConTermino = (term) => {
        setProductoEditando(null);
        setTerminoParaBuscar(term || "");
        setModalAbierto(true);
    };

    const handleEditar = (p) => {
        setProductoEditando(p);
        setTerminoParaBuscar("");
        setModalAbierto(true);
    };

    const handleGuardar = (data) => {
        const existe = productos.some(p => String(p.id) === String(data.id));
        const lista = existe
            ? productos.map(p => String(p.id) === String(data.id) ? { ...p, ...data } : p)
            : [data, ...productos];
        actualizarProductos(lista);
        setModalAbierto(false);
        setProductoEditando(null);
        setTerminoParaBuscar("");
    };

    const handleEliminar = (producto) => {
        if (!window.confirm('Deseas eliminar "' + producto.nombre + '"?')) return;
        actualizarProductos(productos.filter(p => String(p.id) !== String(producto.id)));
    };

    const productosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return productos.filter(p => {
            const coincideTexto = !texto ||
                p.nombre.toLowerCase().includes(texto) ||
                (p.codigo && p.codigo.toLowerCase().includes(texto)) ||
                (p.categoria && p.categoria.toLowerCase().includes(texto));
            return coincideTexto && (!categoriaFiltro || p.categoria === categoriaFiltro);
        });
    }, [productos, busqueda, categoriaFiltro]);

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Catalogo de Productos</h2>
                    <p className="text-muted mb-0">Administracion y control de productos del inventario</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-ghost" onClick={() => handleAbrirConTermino("")}>
                        Buscar sugerencias
                    </button>
                    <button className="btn btn-accent" onClick={handleAbrirNuevo}>
                        + Nuevo producto
                    </button>
                </div>
            </div>

            <div className="card shadow-sm border-0 p-3 mb-4">
                <div className="row g-3">
                    <div className="col-12 col-md-7">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por nombre, codigo o categoria..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    <div className="col-12 col-md-5">
                        <select className="form-select" value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                            <option value="">Todas las categorias</option>
                            {CATEGORIAS_VALIDAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {productosFiltrados.map(p => (
                    <TarjetaProducto
                        key={p.id}
                        producto={p}
                        onEditar={handleEditar}
                        onEliminar={handleEliminar}
                    />
                ))}
            </div>

            <FormularioProductoModal
                abierto={modalAbierto}
                onCerrar={() => { setModalAbierto(false); setProductoEditando(null); setTerminoParaBuscar(""); }}
                onGuardar={handleGuardar}
                productoEditando={productoEditando}
                productosExistentes={productos}
                terminoInicialParaBuscar={terminoParaBuscar}
            />
        </div>
    );
}

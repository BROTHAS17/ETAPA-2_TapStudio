(function(){
  "use strict";

  /* ============ ICONOS ============ */
  var ICONS = {
    panel:'<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="7" height="7" rx="1.4"/><rect x="11" y="2" width="7" height="7" rx="1.4"/><rect x="2" y="11" width="7" height="7" rx="1.4"/><rect x="11" y="11" width="7" height="7" rx="1.4"/></svg>',
    inventario:'<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3 6l7-4 7 4-7 4-7-4Z"/><path d="M3 6v8l7 4 7-4V6"/><path d="M10 10v8"/></svg>',
    compras:'<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v10"/><path d="M5 8l5 5 5-5"/><path d="M3 17h14"/></svg>',
    ventas:'<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 18V8"/><path d="M5 12l5-5 5 5"/><path d="M3 3h14"/></svg>',
    alertas:'<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2a4 4 0 0 0-4 4v2.5c0 1.2-.5 2.3-1.4 3.1L4 12h12l-.6-.4A4.3 4.3 0 0 1 14 8.5V6a4 4 0 0 0-4-4Z"/><path d="M8 15a2 2 0 0 0 4 0"/></svg>',
    reportes:'<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17V10"/><path d="M9 17V5"/><path d="M15 17v-8"/></svg>',
    edit:'<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5Z"/></svg>',
    trash:'<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h12"/><path d="M8 6V4h4v2"/><path d="M6 6l1 10h6l1-10"/></svg>'
  };

  var NAV_ITEMS = [
    {key:'panel', label:'Panel', icon:ICONS.panel, roles:['admin','vendedor']},
    {key:'inventario', label:'Inventario', icon:ICONS.inventario, roles:['admin','vendedor']},
    {key:'compras', label:'Compras', icon:ICONS.compras, roles:['admin']},
    {key:'ventas', label:'Ventas', icon:ICONS.ventas, roles:['admin','vendedor']},
    {key:'alertas', label:'Alertas', icon:ICONS.alertas, roles:['admin','vendedor']},
    {key:'reportes', label:'Reportes', icon:ICONS.reportes, roles:['admin']}
  ];

  /* ============ ESTADO ============ */
  var STORE_PRODUCTS = 'tiendita_productos';
  var STORE_MOVEMENTS = 'tiendita_movimientos';
  var STORE_USER = 'tiendita_sesion';

  var state = {
    products: [],
    movements: [],
    user: null,
    currentView: 'panel',
    reportRange: 'todo',
    histTipo: ''
  };

  var db = null;
  var usingSharedDb = false;

  function uid(){ return Date.now() + Math.floor(Math.random() * 1000); }
  function round2(n){ return Math.round(n * 100) / 100; }
  function daysAgo(n){ return new Date(Date.now() - n*86400000).toISOString(); }
  function money(n){ return '$' + (Number(n)||0).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2}); }
  function fmtDate(iso){ return new Date(iso).toLocaleDateString('es-MX', {day:'numeric', month:'short', year:'numeric'}); }
  function fmtDateTime(iso){ return new Date(iso).toLocaleDateString('es-MX', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}); }
  function relTime(iso){
    var diffMs = Date.now() - new Date(iso).getTime();
    var h = diffMs/3600000;
    if(h < 1) return 'hace un momento';
    if(h < 24) return 'hace ' + Math.floor(h) + ' h';
    var d = Math.floor(h/24);
    if(d === 1) return 'ayer';
    if(d < 7) return 'hace ' + d + ' días';
    return fmtDate(iso);
  }
  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function saveProductsLocal(){ try{ localStorage.setItem(STORE_PRODUCTS, JSON.stringify(state.products)); }catch(e){} }
  function saveMovementsLocal(){ try{ localStorage.setItem(STORE_MOVEMENTS, JSON.stringify(state.movements)); }catch(e){} }
  function saveUser(){ try{ localStorage.setItem(STORE_USER, JSON.stringify(state.user)); }catch(e){} }

  /* ============ LÓGICA DE NEGOCIO CENTRAL (funciones puras) ============ */
  function findProduct(id){
    for(var i=0;i<state.products.length;i++){ if(state.products[i].id === id) return state.products[i]; }
    return null;
  }

  // Calcula el nuevo stock y el costo promedio ponderado tras una compra. No muta nada.
  function calcCompra(product, cantidad, costoUnitario){
    if(!(cantidad > 0)) throw new Error('La cantidad debe ser mayor a cero.');
    if(!(costoUnitario >= 0)) throw new Error('El costo unitario no puede ser negativo.');
    var nuevoStock = product.stock + cantidad;
    var nuevoCosto = nuevoStock > 0 ? ((product.stock*product.costo) + (cantidad*costoUnitario)) / nuevoStock : costoUnitario;
    return { nuevoStock: nuevoStock, nuevoCosto: round2(nuevoCosto) };
  }

  // Calcula el nuevo stock y la utilidad de una venta, validando existencia. No muta nada.
  function calcVenta(product, cantidad, precioUnitario){
    if(!(cantidad > 0)) throw new Error('La cantidad debe ser mayor a cero.');
    if(cantidad > product.stock) throw new Error('Solo hay ' + product.stock + ' unidades disponibles de ' + product.nombre + '.');
    if(!(precioUnitario >= 0)) throw new Error('El precio no puede ser negativo.');
    var utilidad = round2((precioUnitario - product.costo) * cantidad);
    return { nuevoStock: product.stock - cantidad, utilidad: utilidad };
  }

  function buildMovimientoCompra(product, cantidad, costoUnitario, fecha, proveedor, usuario){
    return { tipo:'compra', productoId: product.id, productoNombre: product.nombre, cantidad: cantidad,
      costoUnitario: round2(costoUnitario), total: round2(cantidad*costoUnitario), proveedor: proveedor || '', usuario: usuario, fecha: fecha };
  }
  function buildMovimientoVenta(product, cantidad, precioUnitario, fecha, usuario, utilidad){
    return { tipo:'venta', productoId: product.id, productoNombre: product.nombre, cantidad: cantidad,
      precioUnitario: round2(precioUnitario), total: round2(cantidad*precioUnitario), utilidad: utilidad, usuario: usuario, fecha: fecha };
  }

  function lowStockProducts(){
    return state.products.filter(function(p){ return p.stock <= p.stockMinimo; })
      .sort(function(a,b){ return (a.stock - a.stockMinimo) - (b.stock - b.stockMinimo); });
  }

  function inventoryValue(){
    return state.products.reduce(function(sum,p){ return sum + p.stock*p.costo; }, 0);
  }

  function rangeStart(rangeKey){
    var now = new Date();
    if(rangeKey === 'hoy'){ var d=new Date(now.getFullYear(),now.getMonth(),now.getDate()); return d.getTime(); }
    if(rangeKey === 'semana'){ return Date.now() - 7*86400000; }
    if(rangeKey === 'mes'){ return Date.now() - 30*86400000; }
    return 0;
  }

  function reportData(rangeKey){
    var start = rangeStart(rangeKey);
    var movs = state.movements.filter(function(m){ return new Date(m.fecha).getTime() >= start; });
    var ventas = movs.filter(function(m){ return m.tipo === 'venta'; });
    var compras = movs.filter(function(m){ return m.tipo === 'compra'; });
    var totalVentas = ventas.reduce(function(s,m){ return s+m.total; },0);
    var totalCompras = compras.reduce(function(s,m){ return s+m.total; },0);
    var utilidad = ventas.reduce(function(s,m){ return s+(m.utilidad||0); },0);
    var ticketProm = ventas.length ? totalVentas/ventas.length : 0;

    var porProducto = {};
    ventas.forEach(function(m){
      if(!porProducto[m.productoId]) porProducto[m.productoId] = {nombre:m.productoNombre, cantidad:0, total:0};
      porProducto[m.productoId].cantidad += m.cantidad;
      porProducto[m.productoId].total += m.total;
    });
    var top = Object.keys(porProducto).map(function(k){ return porProducto[k]; })
      .sort(function(a,b){ return b.cantidad - a.cantidad; }).slice(0,5);

    return {movs: movs, totalVentas:totalVentas, totalCompras:totalCompras, utilidad:utilidad, ticketProm:ticketProm, top:top, countVentas:ventas.length};
  }

  /* ============ DATOS DE EJEMPLO (compartidos entre modo local y modo en equipo) ============ */
  var SEED_DEFS = [
    {key:'coca', nombre:'Coca-Cola 600ml', categoria:'Bebidas', costo:12, precio:18, stockMinimo:20},
    {key:'agua', nombre:'Agua Ciel 1L', categoria:'Bebidas', costo:6, precio:10, stockMinimo:30},
    {key:'pan', nombre:'Pan Bimbo Blanco', categoria:'Panadería', costo:28, precio:38, stockMinimo:10},
    {key:'leche', nombre:'Leche Lala 1L', categoria:'Lácteos', costo:22, precio:27, stockMinimo:15},
    {key:'huevo', nombre:'Huevo San Juan 30pz', categoria:'Abarrotes', costo:68, precio:85, stockMinimo:8},
    {key:'arroz', nombre:'Arroz Verde Valle 1kg', categoria:'Abarrotes', costo:24, precio:32, stockMinimo:10},
    {key:'aceite', nombre:'Aceite 123 1L', categoria:'Abarrotes', costo:30, precio:40, stockMinimo:8},
    {key:'deter', nombre:'Detergente Foca 1kg', categoria:'Limpieza', costo:35, precio:48, stockMinimo:6},
    {key:'papel', nombre:'Papel Higiénico Suavel 4pz', categoria:'Higiene', costo:26, precio:36, stockMinimo:10},
    {key:'galletas', nombre:'Galletas Marías Gamesa', categoria:'Snacks', costo:14, precio:20, stockMinimo:15},
    {key:'cafe', nombre:'Café Legal 100g', categoria:'Abarrotes', costo:32, precio:45, stockMinimo:6},
    {key:'jabon', nombre:'Jabón Zote', categoria:'Limpieza', costo:10, precio:15, stockMinimo:12}
  ];
  var SEED_COMPRAS = [
    {key:'coca',cantidad:60,dias:12},{key:'agua',cantidad:80,dias:12},{key:'pan',cantidad:25,dias:12},
    {key:'leche',cantidad:40,dias:12},{key:'huevo',cantidad:12,dias:12},{key:'arroz',cantidad:30,dias:12},
    {key:'aceite',cantidad:20,dias:12},{key:'deter',cantidad:15,dias:12},{key:'papel',cantidad:24,dias:12},
    {key:'galletas',cantidad:35,dias:12},{key:'cafe',cantidad:10,dias:12},{key:'jabon',cantidad:28,dias:12}
  ];
  var SEED_VENTAS = [
    {key:'coca', cantidad:15, dias:6}, {key:'coca', cantidad:15, dias:4}, {key:'coca', cantidad:15, dias:1},
    {key:'agua', cantidad:8, dias:5}, {key:'agua', cantidad:7, dias:3}, {key:'agua', cantidad:5, dias:0},
    {key:'pan', cantidad:5, dias:3}, {key:'pan', cantidad:3, dias:1}, {key:'pan', cantidad:2, dias:0},
    {key:'leche', cantidad:12, dias:4}, {key:'leche', cantidad:10, dias:2},
    {key:'huevo', cantidad:4, dias:3}, {key:'huevo', cantidad:3, dias:1},
    {key:'arroz', cantidad:7, dias:5}, {key:'arroz', cantidad:5, dias:2},
    {key:'aceite', cantidad:5, dias:4}, {key:'aceite', cantidad:4, dias:1},
    {key:'deter', cantidad:6, dias:6},
    {key:'papel', cantidad:6, dias:5}, {key:'papel', cantidad:4, dias:2},
    {key:'galletas', cantidad:9, dias:3}, {key:'galletas', cantidad:5, dias:1},
    {key:'cafe', cantidad:6, dias:5}, {key:'cafe', cantidad:4, dias:2},
    {key:'jabon', cantidad:5, dias:4}, {key:'jabon', cantidad:4, dias:1}
  ];

  function seedLocalData(){
    var byKey = {};
    var products = SEED_DEFS.map(function(d){
      var p = {id:uid(), nombre:d.nombre, categoria:d.categoria, costo:d.costo, precio:d.precio, stock:0, stockMinimo:d.stockMinimo};
      byKey[d.key] = p;
      return p;
    });
    var movements = [];
    SEED_COMPRAS.forEach(function(sc){
      var p = byKey[sc.key];
      var calc = calcCompra(p, sc.cantidad, p.costo);
      var mv = buildMovimientoCompra(p, sc.cantidad, p.costo, daysAgo(sc.dias), 'Distribuidora Central', 'Marilyn');
      p.stock = calc.nuevoStock; p.costo = calc.nuevoCosto;
      mv.id = uid();
      movements.push(mv);
    });
    SEED_VENTAS.forEach(function(sv){
      var p = byKey[sv.key];
      var calc = calcVenta(p, sv.cantidad, p.precio);
      var mv = buildMovimientoVenta(p, sv.cantidad, p.precio, daysAgo(sv.dias), 'Marilyn', calc.utilidad);
      p.stock = calc.nuevoStock;
      mv.id = uid();
      movements.push(mv);
    });
    movements.sort(function(a,b){ return new Date(b.fecha) - new Date(a.fecha); });
    state.products = products;
    state.movements = movements;
    saveProductsLocal(); saveMovementsLocal();
  }

  async function seedShared(){
    var byKey = {};
    for(var i=0;i<SEED_DEFS.length;i++){
      var d = SEED_DEFS[i];
      var body = {nombre:d.nombre, categoria:d.categoria, costo:d.costo, precio:d.precio, stock:0, stockMinimo:d.stockMinimo};
      var ref = await db.collection('products').add(body);
      byKey[d.key] = Object.assign({id:ref.id}, body);
    }
    for(var j=0;j<SEED_COMPRAS.length;j++){
      var sc = SEED_COMPRAS[j];
      var p = byKey[sc.key];
      var calc = calcCompra(p, sc.cantidad, p.costo);
      var mv = buildMovimientoCompra(p, sc.cantidad, p.costo, daysAgo(sc.dias), 'Distribuidora Central', 'Marilyn');
      p.stock = calc.nuevoStock; p.costo = calc.nuevoCosto;
      await db.doc('products/'+p.id).update({stock:p.stock, costo:p.costo});
      await db.collection('movements').add(mv);
    }
    for(var k=0;k<SEED_VENTAS.length;k++){
      var sv = SEED_VENTAS[k];
      var p2 = byKey[sv.key];
      var calc2 = calcVenta(p2, sv.cantidad, p2.precio);
      var mv2 = buildMovimientoVenta(p2, sv.cantidad, p2.precio, daysAgo(sv.dias), 'Marilyn', calc2.utilidad);
      p2.stock = calc2.nuevoStock;
      await db.doc('products/'+p2.id).update({stock:p2.stock});
      await db.collection('movements').add(mv2);
    }
  }

  /* ============ CAPA DE DATOS: local (por dispositivo) o compartida (por equipo) ============ */
  function setSyncStatus(mode){
    var dot = document.getElementById('syncDot');
    var text = document.getElementById('syncPillText');
    if(!dot || !text) return;
    dot.className = 'dot ' + (mode==='shared' ? 'ok' : mode==='local' ? 'warn' : 'neutral');
    text.textContent = mode==='shared' ? 'Datos compartidos con el equipo' : mode==='local' ? 'Datos guardados en este navegador' : 'Cargando…';
  }

  function onDataChanged(){
    if(state.user){
      renderNav();
      renderCurrentView();
    }
  }

  function loadLocalFallback(){
    var hasProducts = localStorage.getItem(STORE_PRODUCTS);
    if(!hasProducts){
      seedLocalData();
    } else {
      try{ state.products = JSON.parse(localStorage.getItem(STORE_PRODUCTS)) || []; }catch(e){ state.products = []; }
      try{ state.movements = JSON.parse(localStorage.getItem(STORE_MOVEMENTS)) || []; }catch(e){ state.movements = []; }
      
      // Migrate old ventas if not already migrated
      if (!localStorage.getItem('tiendita_migrated_ventas')) {
         var oldVentas = JSON.parse(localStorage.getItem('tiendita_ventas')) || [];
         oldVentas.forEach(function(v) {
             state.movements.push({
                 id: uid(),
                 tipo: 'venta',
                 productoId: v.productoId,
                 productoNombre: v.producto,
                 cantidad: v.cantidad,
                 precioUnitario: v.precioUnitario,
                 total: v.total,
                 utilidad: 0,
                 usuario: v.usuario,
                 fecha: v.fecha
             });
         });
         state.movements.sort(function(a,b){ return new Date(b.fecha) - new Date(a.fecha); });
         saveMovementsLocal();
         localStorage.setItem('tiendita_migrated_ventas', 'true');
      }
    }
  }

  function subscribeShared(){
    db.collection('products').onSnapshot(function(snap){
      state.products = snap.docs.map(function(d){ var v=d.data(); v.id=d.id; return v; });
      onDataChanged();
    }, function(err){ console.error('products snapshot error', err); });

    db.collection('movements').orderBy('fecha','desc').limit(300).onSnapshot(function(snap){
      state.movements = snap.docs.map(function(d){ var v=d.data(); v.id=d.id; return v; });
      onDataChanged();
    }, function(err){ console.error('movements snapshot error', err); });
  }

  async function maybeSeedShared(){
    try{
      var snap = await db.collection('products').limit(1).get();
      if(!snap.empty) return;
      var lockRef = db.doc('meta/seedLock');
      var res = await lockRef.acquire({holder:'seed-'+uid(), ttlMs:20000});
      if(!res.acquired) return;
      var snap2 = await db.collection('products').limit(1).get();
      if(!snap2.empty) return;
      await seedShared();
    }catch(e){ /* la siembra es de mejor esfuerzo; si falla, la tienda arranca vacía */ }
  }

  async function initDataLayer(){
    try{
      if(window.claude && typeof window.claude.use === 'function'){
        db = await window.claude.use('db');
      }
    }catch(e){ db = null; }

    if(db){
      usingSharedDb = true;
      setSyncStatus('shared');
      subscribeShared();
      maybeSeedShared();
    } else {
      usingSharedDb = false;
      setSyncStatus('local');
      loadLocalFallback();
      onDataChanged();
    }
  }

  /* ============ ESCRITURAS: compra / venta / producto ============ */
  async function commitCompra(product, cantidad, costoUnitario, proveedor){
    var calc = calcCompra(product, cantidad, costoUnitario);
    var mv = buildMovimientoCompra(product, cantidad, costoUnitario, new Date().toISOString(), proveedor, state.user.nombre);
    if(usingSharedDb){
      await db.doc('products/'+product.id).update({stock:calc.nuevoStock, costo:calc.nuevoCosto});
      await db.collection('movements').add(mv);
    } else {
      product.stock = calc.nuevoStock; product.costo = calc.nuevoCosto;
      mv.id = uid();
      state.movements.unshift(mv);
      saveProductsLocal(); saveMovementsLocal();
      onDataChanged();
    }
  }

  async function commitVenta(product, cantidad, precioUnitario){
    var calc = calcVenta(product, cantidad, precioUnitario);
    var mv = buildMovimientoVenta(product, cantidad, precioUnitario, new Date().toISOString(), state.user.nombre, calc.utilidad);
    if(usingSharedDb){
      await db.doc('products/'+product.id).update({stock:calc.nuevoStock});
      await db.collection('movements').add(mv);
    } else {
      product.stock = calc.nuevoStock;
      mv.id = uid();
      state.movements.unshift(mv);
      saveProductsLocal(); saveMovementsLocal();
      
      try {
        var oldVentas = JSON.parse(localStorage.getItem('tiendita_ventas')) || [];
        oldVentas.push({
          id: Date.now(),
          fecha: mv.fecha,
          usuario: state.user.nombre,
          usuarioId: state.user.id || 1,
          productoId: mv.productoId,
          producto: mv.productoNombre,
          precioUnitario: mv.precioUnitario,
          cantidad: mv.cantidad,
          total: mv.total
        });
        localStorage.setItem('tiendita_ventas', JSON.stringify(oldVentas));
      } catch(e) {}
      
      onDataChanged();
    }
  }

  async function commitNuevoProducto(data){
    var body = {nombre:data.nombre, categoria:data.categoria, costo:data.costo, precio:data.precio, stock:0, stockMinimo:data.stockMinimo};
    if(usingSharedDb){
      var ref = await db.collection('products').add(body);
      if(data.stockInicial > 0){
        var temp = Object.assign({id:ref.id}, body);
        var calc = calcCompra(temp, data.stockInicial, data.costo);
        var mv = buildMovimientoCompra(temp, data.stockInicial, data.costo, new Date().toISOString(), 'Alta de inventario', state.user.nombre);
        await ref.update({stock:calc.nuevoStock, costo:calc.nuevoCosto});
        await db.collection('movements').add(mv);
      }
    } else {
      var np = Object.assign({id:uid()}, body);
      state.products.push(np);
      if(data.stockInicial > 0){
        var calc2 = calcCompra(np, data.stockInicial, data.costo);
        var mv2 = buildMovimientoCompra(np, data.stockInicial, data.costo, new Date().toISOString(), 'Alta de inventario', state.user.nombre);
        np.stock = calc2.nuevoStock; np.costo = calc2.nuevoCosto;
        mv2.id = uid();
        state.movements.unshift(mv2);
        saveMovementsLocal();
      }
      saveProductsLocal();
      onDataChanged();
    }
  }

  async function commitEditarProducto(id, patch){
    if(usingSharedDb){
      await db.doc('products/'+id).update(patch);
    } else {
      var p = findProduct(id);
      if(p) Object.assign(p, patch);
      saveProductsLocal();
      onDataChanged();
    }
  }

  async function commitEliminarProducto(id){
    if(usingSharedDb){
      await db.doc('products/'+id).delete();
    } else {
      state.products = state.products.filter(function(x){ return x.id !== id; });
      saveProductsLocal();
      onDataChanged();
    }
  }

  /* ============ TOAST ============ */
  function showToast(msg){
    var host = document.getElementById('toastHost');
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(function(){ t.remove(); }, 2600);
  }

  /* ============ NAVEGACIÓN ============ */
  function isAdmin(){ return state.user && state.user.rol === 'admin'; }

  function buildNav(container){
    container.innerHTML = '';
    var role = state.user ? state.user.rol : 'vendedor';
    NAV_ITEMS.filter(function(it){ return it.roles.indexOf(role) !== -1; }).forEach(function(it){
      var btn = document.createElement('button');
      btn.className = 'nav-item' + (state.currentView === it.key ? ' active' : '');
      btn.dataset.view = it.key;
      var badge = '';
      if(it.key === 'alertas'){
        var n = lowStockProducts().length;
        if(n > 0) badge = '<span class="nav-badge">' + n + '</span>';
      }
      btn.innerHTML = it.icon + '<span>' + it.label + '</span>' + badge;
      btn.addEventListener('click', function(){ setView(it.key); });
      container.appendChild(btn);
    });
  }

  function renderNav(){
    buildNav(document.getElementById('sidebarNav'));
    buildNav(document.getElementById('bottomNav'));
  }

  function setView(key){
    state.currentView = key;
    document.querySelectorAll('.view').forEach(function(v){ v.classList.add('hidden'); });
    var target = document.getElementById('view-' + key);
    if(target) target.classList.remove('hidden');
    renderNav();
    renderCurrentView();
    if(window.innerWidth > 860) document.getElementById('mainArea').scrollTop = 0;
  }

  function renderCurrentView(){
    if(state.currentView === 'panel') renderPanel();
    else if(state.currentView === 'inventario') renderInventario();
    else if(state.currentView === 'compras') renderCompras();
    else if(state.currentView === 'ventas') renderVentas();
    else if(state.currentView === 'alertas') renderAlertas();
    else if(state.currentView === 'reportes') renderReportes();
  }

  /* ============ RENDER: PANEL ============ */
  function renderPanel(){
    document.getElementById('panelGreeting').textContent = 'Hola, ' + state.user.nombre;
    document.getElementById('panelDate').textContent = new Date().toLocaleDateString('es-MX', {weekday:'long', day:'numeric', month:'long'});

    var hoy = reportData('hoy');
    var kpis = [];
    if(isAdmin()){
      kpis.push({num: state.products.length, label:'Productos activos', tone:''});
      kpis.push({num: money(inventoryValue()), label:'Valor de inventario', tone:''});
      kpis.push({num: money(hoy.totalVentas), label:'Ventas de hoy', tone:'success'});
      var lows = lowStockProducts().length;
      kpis.push({num: lows, label: lows===1 ? 'Producto en alerta' : 'Productos en alerta', tone: lows>0 ? 'warning':''});
    } else {
      var cantHoy = hoy.movs.filter(function(m){return m.tipo==='venta';}).reduce(function(s,m){return s+m.cantidad;},0);
      kpis.push({num: money(hoy.totalVentas), label:'Ventas de hoy', tone:'success'});
      kpis.push({num: cantHoy, label:'Unidades vendidas hoy', tone:''});
      var lows2 = lowStockProducts().length;
      kpis.push({num: lows2, label: lows2===1 ? 'Producto en alerta' : 'Productos en alerta', tone: lows2>0 ? 'warning':''});
    }
    document.getElementById('panelKpis').innerHTML = kpis.map(function(k){
      return '<div class="kpi-card' + (k.tone ? ' tone-'+k.tone : '') + '"><div class="kpi-num">' + k.num + '</div><div class="kpi-label">' + k.label + '</div></div>';
    }).join('');

    var recent = state.movements.slice(0,6);
    var recentHtml = recent.map(function(m){
      var icon = m.tipo === 'compra' ? ICONS.compras : ICONS.ventas;
      var sub = (m.tipo==='compra' ? 'Compra · ' : 'Venta · ') + m.cantidad + ' u · ' + relTime(m.fecha);
      return '<li class="mini-row"><span class="move-icon ' + m.tipo + '">' + icon + '</span>' +
        '<span class="mi-main"><div class="mi-name">' + escapeHtml(m.productoNombre) + '</div><div class="mi-sub">' + sub + '</div></span>' +
        '<span class="mi-val">' + money(m.total) + '</span></li>';
    }).join('');
    document.getElementById('panelRecent').innerHTML = recentHtml || '<div class="empty-state">Aún no hay movimientos.</div>';

    var lowList = lowStockProducts().slice(0,6);
    var lowHtml = lowList.map(function(p){
      var cls = p.stock === 0 ? 'danger' : 'warn';
      return '<li class="mini-row"><span class="dot ' + cls + '"></span>' +
        '<span class="mi-main"><div class="mi-name">' + escapeHtml(p.nombre) + '</div><div class="mi-sub">' + escapeHtml(p.categoria) + '</div></span>' +
        '<span class="mi-val">' + p.stock + ' / ' + p.stockMinimo + '</span></li>';
    }).join('');
    document.getElementById('panelLowStock').innerHTML = lowHtml || '<div class="empty-state">Todo el inventario está en niveles saludables.</div>';
  }

  /* ============ RENDER: INVENTARIO ============ */
  function populateCategoriaFilter(){
    var sel = document.getElementById('invCategoria');
    var current = sel.value;
    var cats = Array.from(new Set(state.products.map(function(p){ return p.categoria; }))).sort();
    sel.innerHTML = '<option value="">Todas las categorías</option>' + cats.map(function(c){ return '<option value="'+escapeHtml(c)+'">'+escapeHtml(c)+'</option>'; }).join('');
    sel.value = current;
  }

  function renderInventario(){
    populateCategoriaFilter();
    var q = (document.getElementById('invSearch').value || '').toLowerCase();
    var cat = document.getElementById('invCategoria').value;
    var admin = isAdmin();

    var rows = state.products.filter(function(p){
      var matchesQ = p.nombre.toLowerCase().indexOf(q) !== -1;
      var matchesCat = !cat || p.categoria === cat;
      return matchesQ && matchesCat;
    }).sort(function(a,b){ return a.nombre.localeCompare(b.nombre); });

    var body = document.getElementById('invBody');
    if(!rows.length){
      body.innerHTML = '<tr><td colspan="6"><div class="empty-state">No se encontraron productos con esos filtros.</div></td></tr>';
      return;
    }
    body.innerHTML = rows.map(function(p){
      var rowCls = p.stock === 0 ? 'out' : (p.stock <= p.stockMinimo ? 'low' : '');
      var dotCls = p.stock === 0 ? 'danger' : (p.stock <= p.stockMinimo ? 'warn' : 'ok');
      var actions = admin ? (
        '<div class="row-actions">' +
        '<button class="icon-btn" data-action="edit-product" data-id="'+p.id+'" title="Editar">'+ICONS.edit+'</button>' +
        '<button class="icon-btn" data-action="delete-product" data-id="'+p.id+'" title="Eliminar">'+ICONS.trash+'</button>' +
        '</div>') : '';
      return '<tr class="'+rowCls+'">' +
        '<td>'+escapeHtml(p.nombre)+'</td>' +
        '<td>'+escapeHtml(p.categoria)+'</td>' +
        '<td><span class="stock-cell"><span class="dot '+dotCls+'"></span>'+p.stock+'</span></td>' +
        (admin ? '<td>'+money(p.costo)+'</td>' : '') +
        '<td>'+money(p.precio)+'</td>' +
        (admin ? '<td>'+actions+'</td>' : '') +
        '</tr>';
    }).join('');
  }

  /* ============ RENDER: COMPRAS ============ */
  function populateProductSelect(sel){
    var opts = state.products.slice().sort(function(a,b){return a.nombre.localeCompare(b.nombre);}).map(function(p){
      return '<option value="'+p.id+'">'+escapeHtml(p.nombre)+' (stock: '+p.stock+')</option>';
    });
    sel.innerHTML = opts.join('');
  }

  function renderCompras(){
    var sel = document.getElementById('compraProducto');
    var prevVal = sel.value;
    populateProductSelect(sel);
    if(prevVal) sel.value = prevVal;
    var costoInput = document.getElementById('compraCosto');
    if(!costoInput.value) syncCompraCosto();

    var body = document.getElementById('comprasBody');
    var rows = state.movements.filter(function(m){ return m.tipo === 'compra'; }).slice(0,25);
    body.innerHTML = rows.length ? rows.map(function(m){
      return '<tr><td>'+fmtDateTime(m.fecha)+'</td><td>'+escapeHtml(m.productoNombre)+'</td><td>'+m.cantidad+'</td><td>'+money(m.costoUnitario)+'</td><td>'+money(m.total)+'</td><td>'+escapeHtml(m.proveedor||'—')+'</td></tr>';
    }).join('') : '<tr><td colspan="6"><div class="empty-state">Aún no hay compras registradas.</div></td></tr>';
  }

  function syncCompraCosto(){
    var sel = document.getElementById('compraProducto');
    var p = findProduct(sel.value);
    if(p) document.getElementById('compraCosto').value = p.costo;
  }

  /* ============ RENDER: VENTAS ============ */
  function renderVentas(){
    var sel = document.getElementById('ventaProducto');
    var prevVal = sel.value;
    populateProductSelect(sel);
    if(prevVal) sel.value = prevVal;
    var precioInput = document.getElementById('ventaPrecio');
    if(!precioInput.value) syncVentaPrecio();

    var admin = isAdmin();
    var body = document.getElementById('ventasBody');
    var rows = state.movements.filter(function(m){ return m.tipo === 'venta'; }).slice(0,25);
    body.innerHTML = rows.length ? rows.map(function(m){
      return '<tr><td>'+fmtDateTime(m.fecha)+'</td><td>'+escapeHtml(m.productoNombre)+'</td><td>'+m.cantidad+'</td><td>'+money(m.precioUnitario)+'</td><td>'+money(m.total)+'</td>' +
        (admin ? '<td>'+money(m.utilidad)+'</td>' : '') + '</tr>';
    }).join('') : '<tr><td colspan="6"><div class="empty-state">Aún no hay ventas registradas.</div></td></tr>';
  }

  function syncVentaPrecio(){
    var sel = document.getElementById('ventaProducto');
    var p = findProduct(sel.value);
    if(p) document.getElementById('ventaPrecio').value = p.precio;
  }

  /* ============ RENDER: ALERTAS ============ */
  function renderAlertas(){
    var lows = lowStockProducts();
    var grid = document.getElementById('alertGrid');
    if(!lows.length){
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">Todo el inventario está en niveles saludables. No hay alertas por ahora.</div>';
      return;
    }
    grid.innerHTML = lows.map(function(p){
      var crit = p.stock === 0;
      return '<div class="alert-card ' + (crit?'crit':'warn') + '">' +
        '<span class="alert-tag ' + (crit?'crit':'warn') + '">' + (crit ? 'Agotado' : 'Stock bajo') + '</span>' +
        '<h4>'+escapeHtml(p.nombre)+'</h4>' +
        '<div class="cat">'+escapeHtml(p.categoria)+'</div>' +
        '<div class="alert-stock"><b>'+p.stock+'</b> de '+p.stockMinimo+' unidades mínimas</div>' +
        (isAdmin() ? '<button class="btn btn-ghost btn-small" data-action="goto-compra" data-id="'+p.id+'">Registrar compra</button>' : '<span class="hint">Notifica al administrador/a</span>') +
        '</div>';
    }).join('');
  }

  /* ============ RENDER: REPORTES ============ */
  function renderReportes(){
    var data = reportData(state.reportRange);
    var kpis = [
      {num: money(data.totalVentas), label:'Total en ventas', tone:'success'},
      {num: money(data.totalCompras), label:'Total en compras', tone:''},
      {num: money(data.utilidad), label:'Utilidad bruta', tone: data.utilidad>=0?'success':'danger'},
      {num: money(data.ticketProm), label:'Ticket promedio', tone:''}
    ];
    document.getElementById('reporteKpis').innerHTML = kpis.map(function(k){
      return '<div class="kpi-card' + (k.tone?' tone-'+k.tone:'') + '"><div class="kpi-num">' + k.num + '</div><div class="kpi-label">' + k.label + '</div></div>';
    }).join('');

    var maxCant = data.top.length ? Math.max.apply(null, data.top.map(function(t){return t.cantidad;})) : 1;
    var topHtml = data.top.map(function(t){
      var pct = Math.round((t.cantidad/maxCant)*100);
      return '<div class="bar-row"><div class="bar-top"><span class="nom">'+escapeHtml(t.nombre)+'</span><span>'+t.cantidad+' u · '+money(t.total)+'</span></div><div class="bar-track"><div class="bar-fill" style="width:'+pct+'%;"></div></div></div>';
    }).join('');
    document.getElementById('topProductos').innerHTML = topHtml || '<div class="empty-state">Sin ventas en este periodo.</div>';

    var tipo = state.histTipo;
    var hist = data.movs.filter(function(m){ return !tipo || m.tipo === tipo; })
      .sort(function(a,b){ return new Date(b.fecha) - new Date(a.fecha); }).slice(0,60);
    document.getElementById('histList').innerHTML = hist.length ? hist.map(function(m){
      var icon = m.tipo === 'compra' ? ICONS.compras : ICONS.ventas;
      var sub = (m.tipo==='compra'?'Compra':'Venta') + ' · ' + m.cantidad + ' u · ' + fmtDateTime(m.fecha);
      return '<li class="mini-row"><span class="move-icon ' + m.tipo + '">' + icon + '</span>' +
        '<span class="mi-main"><div class="mi-name">' + escapeHtml(m.productoNombre) + '</div><div class="mi-sub">' + sub + '</div></span>' +
        '<span class="mi-val">' + money(m.total) + '</span></li>';
    }).join('') : '<div class="empty-state">Sin movimientos en este periodo.</div>';
  }

  /* ============ MODAL PRODUCTO ============ */
  var editingProductId = null;

  function openProductModal(product){
    editingProductId = product ? product.id : null;
    document.getElementById('productModalTitle').textContent = product ? 'Editar producto' : 'Nuevo producto';
    document.getElementById('pNombre').value = product ? product.nombre : '';
    document.getElementById('pCategoria').value = product ? product.categoria : '';
    document.getElementById('pCosto').value = product ? product.costo : '';
    document.getElementById('pPrecio').value = product ? product.precio : '';
    document.getElementById('pStockMin').value = product ? product.stockMinimo : 5;
    document.getElementById('pStockInicial').value = 0;
    document.getElementById('pStockInicialWrap').classList.toggle('hidden', !!product);
    document.getElementById('pStockNote').textContent = product ? ('Stock actual: ' + product.stock + ' unidades · se actualiza desde Compras y Ventas.') : 'El stock inicial genera automáticamente una compra de alta.';
    document.getElementById('productError').classList.remove('show');

    var cats = Array.from(new Set(state.products.map(function(p){return p.categoria;}))).sort();
    document.getElementById('catList').innerHTML = cats.map(function(c){ return '<option value="'+escapeHtml(c)+'">'; }).join('');

    document.getElementById('productModalOverlay').classList.remove('hidden');
    document.getElementById('pNombre').focus();
  }
  function closeProductModal(){
    document.getElementById('productModalOverlay').classList.add('hidden');
    editingProductId = null;
  }

  async function handleProductSubmit(e){
    e.preventDefault();
    var nombre = document.getElementById('pNombre').value.trim();
    var categoria = document.getElementById('pCategoria').value.trim() || 'General';
    var costo = parseFloat(document.getElementById('pCosto').value);
    var precio = parseFloat(document.getElementById('pPrecio').value);
    var stockMin = parseInt(document.getElementById('pStockMin').value, 10);
    var stockInicial = parseInt(document.getElementById('pStockInicial').value, 10) || 0;
    var errEl = document.getElementById('productError');

    if(!nombre){ errEl.textContent = 'El nombre es obligatorio.'; errEl.classList.add('show'); return; }
    var dup = state.products.some(function(p){ return p.nombre.toLowerCase() === nombre.toLowerCase() && p.id !== editingProductId; });
    if(dup){ errEl.textContent = 'Ya existe un producto con ese nombre.'; errEl.classList.add('show'); return; }
    if(isNaN(costo) || costo < 0){ errEl.textContent = 'Indica un costo válido.'; errEl.classList.add('show'); return; }
    if(isNaN(precio) || precio < 0){ errEl.textContent = 'Indica un precio válido.'; errEl.classList.add('show'); return; }
    if(isNaN(stockMin) || stockMin < 0){ errEl.textContent = 'Indica un stock mínimo válido.'; errEl.classList.add('show'); return; }
    errEl.classList.remove('show');

    try{
      if(editingProductId){
        await commitEditarProducto(editingProductId, {nombre:nombre, categoria:categoria, costo:round2(costo), precio:round2(precio), stockMinimo:stockMin});
        showToast('Producto actualizado');
      } else {
        await commitNuevoProducto({nombre:nombre, categoria:categoria, costo:round2(costo), precio:round2(precio), stockMinimo:stockMin, stockInicial:stockInicial});
        showToast('Producto agregado');
      }
      closeProductModal();
      renderCurrentView();
    }catch(err){
      errEl.textContent = 'No se pudo guardar: ' + err.message;
      errEl.classList.add('show');
    }
  }

  async function handleDeleteProduct(id){
    var p = findProduct(id);
    if(!p) return;
    var ok = confirm('¿Eliminar "' + p.nombre + '" del catálogo? Esta acción no se puede deshacer.');
    if(!ok) return;
    try{
      await commitEliminarProducto(id);
      showToast('Producto eliminado');
      renderCurrentView();
    }catch(err){ showToast('No se pudo eliminar: ' + err.message); }
  }

  /* ============ EVENTOS: COMPRAS / VENTAS ============ */
  async function handleCompraSubmit(e){
    e.preventDefault();
    var errEl = document.getElementById('compraError');
    errEl.textContent = '';
    var pid = document.getElementById('compraProducto').value;
    var p = findProduct(pid);
    var cantidad = parseInt(document.getElementById('compraCantidad').value, 10);
    var costo = parseFloat(document.getElementById('compraCosto').value);
    var proveedor = document.getElementById('compraProveedor').value.trim();
    if(!p){ errEl.textContent = 'Selecciona un producto.'; return; }
    try{
      await commitCompra(p, cantidad, costo, proveedor);
      showToast('Compra registrada');
      document.getElementById('compraCantidad').value = 1;
      document.getElementById('compraProveedor').value = '';
      document.getElementById('compraCosto').value = '';
      renderCurrentView();
      renderNav();
    }catch(err){ errEl.textContent = err.message; }
  }

  async function handleVentaSubmit(e){
    e.preventDefault();
    var errEl = document.getElementById('ventaError');
    errEl.textContent = '';
    var pid = document.getElementById('ventaProducto').value;
    var p = findProduct(pid);
    var cantidad = parseInt(document.getElementById('ventaCantidad').value, 10);
    var precio = parseFloat(document.getElementById('ventaPrecio').value);
    if(!p){ errEl.textContent = 'Selecciona un producto.'; return; }
    try{
      await commitVenta(p, cantidad, precio);
      showToast('Venta registrada');
      document.getElementById('ventaCantidad').value = 1;
      document.getElementById('ventaPrecio').value = '';
      renderCurrentView();
      renderNav();
    }catch(err){ errEl.textContent = err.message; }
  }

  /* ============ ACCESO ============ */
  function handleAccessSubmit(e){
    e.preventDefault();
    var name = document.getElementById('accName').value.trim();
    var errEl = document.getElementById('accessError');
    if(!name){ errEl.classList.add('show'); return; }
    errEl.classList.remove('show');
    var rol = document.querySelector('input[name="rol"]:checked').value;
    var existingUser = state.user || {};
    state.user = {id: existingUser.id || Date.now(), nombre:name, email: existingUser.email || (name.toLowerCase().replace(/\s+/g,'') + '@tiendita.com'), password: existingUser.password || 'Password123*', rol:rol};
    saveUser();
    enterApp();
  }

  function enterApp(){
    document.getElementById('appShell').classList.remove('hidden');
    document.body.classList.toggle('role-vendedor', state.user.rol !== 'admin');
    document.getElementById('whoName').textContent = state.user.nombre;
    document.getElementById('whoRole').textContent = state.user.rol === 'admin' ? 'Administrador/a' : 'Vendedor/a';
    var allowedViews = NAV_ITEMS.filter(function(it){ return it.roles.indexOf(state.user.rol) !== -1; }).map(function(it){return it.key;});
    if(allowedViews.indexOf(state.currentView) === -1) state.currentView = 'panel';
    setView(state.currentView);
  }

  function handleLogout(){
    state.user = null;
    try{ localStorage.removeItem(STORE_USER); }catch(e){}
    document.getElementById('appShell').classList.add('hidden');
    window.location.href = 'MiTiendita/login.html';
  }

  /* ============ INICIALIZACIÓN ============ */
  function init(){
    try{ state.user = JSON.parse(localStorage.getItem(STORE_USER)) || null; }catch(e){ state.user = null; }
    if(!state.user){ window.location.href = 'MiTiendita/login.html'; return; }
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    document.getElementById('invSearch').addEventListener('input', renderInventario);
    document.getElementById('invCategoria').addEventListener('change', renderInventario);
    document.getElementById('newProductBtn').addEventListener('click', function(){ openProductModal(null); });
    document.getElementById('invBody').addEventListener('click', function(e){
      var editBtn = e.target.closest('[data-action="edit-product"]');
      var delBtn = e.target.closest('[data-action="delete-product"]');
      if(editBtn) openProductModal(findProduct(editBtn.dataset.id));
      if(delBtn) handleDeleteProduct(delBtn.dataset.id);
    });
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    document.getElementById('productCancelBtn').addEventListener('click', closeProductModal);
    document.getElementById('productModalOverlay').addEventListener('click', function(e){
      if(e.target.id === 'productModalOverlay') closeProductModal();
    });

    document.getElementById('compraForm').addEventListener('submit', handleCompraSubmit);
    document.getElementById('compraProducto').addEventListener('change', syncCompraCosto);

    document.getElementById('ventaForm').addEventListener('submit', handleVentaSubmit);
    document.getElementById('ventaProducto').addEventListener('change', syncVentaPrecio);

    document.getElementById('alertGrid').addEventListener('click', function(e){
      var btn = e.target.closest('[data-action="goto-compra"]');
      if(btn){
        setView('compras');
        setTimeout(function(){ document.getElementById('compraProducto').value = btn.dataset.id; syncCompraCosto(); }, 0);
      }
    });

    document.getElementById('rangeSeg').addEventListener('click', function(e){
      var btn = e.target.closest('button[data-range]');
      if(!btn) return;
      state.reportRange = btn.dataset.range;
      document.querySelectorAll('#rangeSeg button').forEach(function(b){ b.classList.toggle('active', b===btn); });
      renderReportes();
    });
    document.getElementById('histTipo').addEventListener('change', function(){
      state.histTipo = this.value;
      renderReportes();
    });

    initDataLayer();

    if(state.user){
      enterApp();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

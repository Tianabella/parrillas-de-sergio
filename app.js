// Landing de pedidos Las Parrillas de Sergio (copia de MR CRIOLLO). JavaScript sin framework.
// El navegador solo muestra precios: el total que vale es el que calcula el servidor.
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const API = (window.MRC && window.MRC.api) || '';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduceMov = matchMedia('(prefers-reduced-motion: reduce)');
  const esWeb = matchMedia('(min-width: 960px)');

  // ── Fotos: si un archivo todavía no existe, se muestra un plato dibujado ──
  const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  const foto = (slug) => `img/platos/${slug}.jpg`;
  function sinFoto(img) {
    if (img.dataset.cayo) return;
    img.dataset.cayo = '1';
    img.src = PIXEL;
    img.classList.add('sin-foto');
  }
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') sinFoto(e.target); }, true);
  $$('img').forEach((img) => { if (img.complete && img.naturalWidth === 0 && !img.src.startsWith('data:')) sinFoto(img); });

  // ── Guardado local: comodidad, la página funciona sin él ──
  const leer = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } };
  const guardar = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };

  // ── Tasa BCV y moneda dinámica (USD / VES) ──
  let tasaBCV = Number(leer('sergio_tasa_bcv', 886.23)) || 886.23;
  let monedaActual = 'usd'; // 'usd' o 'ves'

  const formatearUSD = (cents) => '$' + (cents / 100).toFixed(2);
  const formatearVES = (cents) => {
    const bs = (cents / 100) * tasaBCV;
    return 'Bs. ' + new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(bs);
  };
  const dinero = (c, mon = monedaActual) => mon === 'ves' ? formatearVES(c) : formatearUSD(c);
  const dineroHTML = (cents, extraClase = '') => {
    return `<span class="precio-animado${extraClase ? ' ' + extraClase : ''}" data-cents="${cents}">${dinero(cents, monedaActual)}</span>`;
  };

  // ── Textos ES / EN ──
  const T = {
    es: {
      saltar: 'Ir al menú', saludo: '¡Hola! Bienvenido 👋', lema: 'El sabor de la brasa.', buscarLabel: 'Buscar en el menú', buscar: 'Busca tu plato favorito…',
      nMenu: 'Menú', nCombos: 'Parrillas', nComo: 'Cómo pedir', nMiPedido: 'Mi pedido', nInicio: 'Inicio', nPedido: 'Pedido',
      k1: 'Carne en vara', h1a: 'El sabor', h1b: 'de la brasa.', b1: 'Carne, pollo y chorizo a la brasa. Sencilla o mixta, a tu gusto.',
      k2: 'Parrillas', h2a: 'Con yuca', h2b: 'y ensalada.', b2: '200 g de carne, pollo o chorizo, sencilla o mixta.',
      k3: 'Pepito', h3a: '16 cm,', h3b: '150 g de proteína.', b3: 'Carne, pollo o chorizo con ensalada y salsas de la casa. Sencillo o mixto.',
      k4: 'Pepito', h4a: '32 cm,', h4b: '300 g de proteína.', b4: 'El grande, con ensalada y salsas de la casa. Sencillo o mixto.',
      pedirAhora: 'Pedir ahora', duoFoto: 'Hecho en la brasa.', kOferta: 'Hamburguesa', verOferta: 'Toca para verla', ofertaA: 'Lechuga, tomate', ofertaB: 'y salsas de la casa',
      menuA: 'Nuestro', menuB: 'menú', populares: 'Los más pedidos', verCombos: 'Ver parrillas', cargando: 'Cargando el menú…', todo: 'Todo', favoritos: 'Favoritos',
      comoA: 'Pide fácil,', comoB: 'come rico.', r1: 'Sin llamar', r1d: 'Tu pedido llega directo a la cocina desde el teléfono.',
      r2: 'A tu gusto', r2d: 'Quita o agrega ingredientes con un toque.', r3: 'Te avisamos', r3d: 'Mira en vivo cuándo entra a cocina y cuándo está listo.',
      r4: 'Pagas al recoger', r4d: 'Precios en dólares. Trabajamos a tasa BCV.',
      kFranja: 'Pepitos', franjaA: 'Pepito de', franjaB: '32 cm', franjaD: '300 g de proteína, ensalada y salsas de la casa.',
      pieTexto: 'Precios en dólares · Trabajamos a tasa BCV', enTuPedido: 'en tu pedido', verPedido: 'Ver pedido',
      notaAbrir: 'Agregar una nota para la cocina', notaLabel: 'Nota para la cocina', agregar: 'Agregar', actualizar: 'Guardar cambios',
      tuPedido: 'Tu pedido', seguirPidiendo: 'Seguir pidiendo', comoLoQuieres: '¿Cómo lo quieres?', recoger: 'Para llevar', aqui: 'Comer aquí',
      propina: 'Propina para el equipo', sinPropina: 'Sin propina', nombre: 'Tu nombre', nombreAyuda: 'Así te llamamos cuando esté listo.', telefono: 'Teléfono',
      notaGeneral: 'Nota del pedido (opcional)', enviar: 'Enviar pedido', enviando: 'Enviando…', pagoNota: 'Pagas al recoger. Trabajamos a tasa BCV.',
      tuNumero: 'Tu número', pRecibido: 'Recibido', pCocina: 'En cocina', pListo: 'Listo', pEntregado: 'Entregado', otroPedido: 'Hacer otro pedido',
      eligeUno: 'Obligatorio', quitarT: 'Lo puedes pedir sin', agregarT: 'Agrégale', sin: 'Sin', masPedido: 'Más pedido', combo: 'Combo',
      ahorras: 'Ahorras {monto}', agotado: 'Agotado hoy', agotadoAviso: '{plato} se agotó por hoy.', minutos: '{n} min',
      subtotal: 'Subtotal', impuesto: 'Impuesto ({pct} %)', propinaL: 'Propina', total: 'Total',
      errNombre: 'Escribe tu nombre para llamarte.', errTel: 'Revisa el teléfono: 10 dígitos, por ejemplo (414) 555-0123.',
      errRed: 'No hay conexión con el restaurante. Revisa tu internet y vuelve a enviar.', errMenu: 'No pudimos cargar el menú. Revisa tu conexión y recarga la página.',
      hola: 'Gracias, {nombre}.', pedidoNum: 'Pedido número {n}',
      est_nuevo: 'Recibimos tu pedido. La cocina lo toma en un momento.', est_preparando: 'Tu pedido está en la cocina.',
      est_listo: '¡Está listo! Pasa por el mostrador y di tu nombre.', est_entregado: 'Entregado. ¡Buen provecho!',
      est_cancelado: 'El restaurante canceló este pedido. Si tienes dudas, llámanos.',
      antes: 'Hay {n} pedidos antes del tuyo.', antes1: 'Hay 1 pedido antes del tuyo.', siguiente: 'Tu pedido es el siguiente.',
      banda: 'Tu pedido <b>#{n}</b>: {estado}. Ver estado', vacio: 'Tu pedido está vacío. Agrega algo del menú.', sinPedido: 'Todavía no tienes un pedido en curso.',
      quitarLinea: 'Quitar', editar: 'Toca para cambiarlo', agregado: '{plato} agregado al pedido.', resultados: 'Resultados para «{q}»', sinResultados: 'No encontramos «{q}». Prueba con parrilla, pepito o hamburguesa.',
      corto_nuevo: 'recibido', corto_preparando: 'en cocina', corto_listo: '¡listo para recoger!', platos: '{n} platos',
      idiomaBtn: 'EN', idiomaAria: 'Change language to English', cerrar: 'Cerrar', menos: 'Menos', mas: 'Más', cantidad: 'Cantidad', fav: 'Guardar en favoritos',
    },
    en: {
      saltar: 'Skip to menu', saludo: 'Hi there! Welcome 👋', lema: 'The taste of the grill.', buscarLabel: 'Search the menu', buscar: 'Search your favorite dish…',
      nMenu: 'Menu', nCombos: 'Grill platters', nComo: 'How it works', nMiPedido: 'My order', nInicio: 'Home', nPedido: 'Order',
      k1: 'Carne en vara', h1a: 'The taste', h1b: 'of the grill.', b1: 'Grilled beef, chicken and chorizo. Single or mixed, your way.',
      k2: 'Grill platters', h2a: 'With cassava', h2b: 'and salad.', b2: '200 g of beef, chicken or chorizo, single or mixed.',
      k3: 'Pepito', h3a: '16 cm,', h3b: '150 g of protein.', b3: 'Beef, chicken or chorizo with salad and house sauces. Single or mixed.',
      k4: 'Pepito', h4a: '32 cm,', h4b: '300 g of protein.', b4: 'The big one, with salad and house sauces. Single or mixed.',
      pedirAhora: 'Order now', duoFoto: 'Made on the grill.', kOferta: 'Burger', verOferta: 'Tap to see it', ofertaA: 'Lettuce, tomato', ofertaB: 'and house sauces',
      menuA: 'Our', menuB: 'menu', populares: 'Customer favorites', verCombos: 'See platters', cargando: 'Loading the menu…', todo: 'All', favoritos: 'Favorites',
      comoA: 'Easy to order,', comoB: 'good to eat.', r1: 'No phone calls', r1d: 'Your order goes straight to the kitchen from your phone.',
      r2: 'Your way', r2d: 'Remove or add ingredients with one tap.', r3: 'We let you know', r3d: 'Watch live when it starts cooking and when it is ready.',
      r4: 'Pay at pickup', r4d: 'Prices in US dollars at the BCV rate.',
      kFranja: 'Pepitos', franjaA: '32 cm', franjaB: 'pepito', franjaD: '300 g of protein, salad and house sauces.',
      pieTexto: 'Prices in US dollars · BCV exchange rate', enTuPedido: 'in your order', verPedido: 'View order',
      notaAbrir: 'Add a note for the kitchen', notaLabel: 'Note for the kitchen', agregar: 'Add', actualizar: 'Save changes',
      tuPedido: 'Your order', seguirPidiendo: 'Keep ordering', comoLoQuieres: 'How do you want it?', recoger: 'To go', aqui: 'Dine in',
      propina: 'Tip for the team', sinPropina: 'No tip', nombre: 'Your name', nombreAyuda: 'We call this name when it is ready.', telefono: 'Phone',
      notaGeneral: 'Order note (optional)', enviar: 'Send order', enviando: 'Sending…', pagoNota: 'Pay at pickup, at the BCV rate.',
      tuNumero: 'Your number', pRecibido: 'Received', pCocina: 'Cooking', pListo: 'Ready', pEntregado: 'Picked up', otroPedido: 'Start a new order',
      eligeUno: 'Required', quitarT: 'You can ask without', agregarT: 'Add extras', sin: 'No', masPedido: 'Bestseller', combo: 'Combo',
      ahorras: 'Save {monto}', agotado: 'Sold out today', agotadoAviso: '{plato} is sold out for today.', minutos: '{n} min',
      subtotal: 'Subtotal', impuesto: 'Tax ({pct}%)', propinaL: 'Tip', total: 'Total',
      errNombre: 'Add your name so we can call you.', errTel: 'Check the phone number: 10 digits, like (414) 555-0123.',
      errRed: 'We could not reach the restaurant. Check your connection and send again.', errMenu: 'We could not load the menu. Check your connection and reload the page.',
      hola: 'Thanks, {nombre}.', pedidoNum: 'Order number {n}',
      est_nuevo: 'We got your order. The kitchen will start it in a moment.', est_preparando: 'Your order is cooking.',
      est_listo: 'It is ready! Come to the counter and say your name.', est_entregado: 'Picked up. Enjoy your meal!',
      est_cancelado: 'The restaurant canceled this order. Call us if you have questions.',
      antes: '{n} orders ahead of yours.', antes1: '1 order ahead of yours.', siguiente: 'Your order is next.',
      banda: 'Your order <b>#{n}</b>: {estado}. See status', vacio: 'Your order is empty. Add something from the menu.', sinPedido: 'You do not have an order in progress yet.',
      quitarLinea: 'Remove', editar: 'Tap to change it', agregado: '{plato} added to your order.', resultados: 'Results for “{q}”', sinResultados: 'Nothing found for “{q}”. Try parrilla, pepito or burger.',
      corto_nuevo: 'received', corto_preparando: 'cooking', corto_listo: 'ready for pickup!', platos: '{n} dishes',
      idiomaBtn: 'ES', idiomaAria: 'Cambiar idioma a español', cerrar: 'Close', menos: 'Less', mas: 'More', cantidad: 'Quantity', fav: 'Save to favorites',
    },
  };
  let lang = leer('mrc_idioma', null) || ((navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en');
  const t = (k, p = {}) => (T[lang][k] ?? T.es[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => (p[x] ?? ''));
  const tx = (texto) => (texto && (texto[lang] || texto.es)) || '';

  // ── Estado ──
  let negocio = { impuesto_bp: 0, propinas: [], espera_min: 20 };
  let categorias = [];
  let platos = {};
  let orden = [];
  let carrito = leer('mrc_carrito', []);
  let favoritos = new Set(leer('mrc_favoritos', []));
  let filtro = 'todo';
  let busqueda = '';
  let propinaPct = 0;
  const FOTO_CAT = {
    todo: 'todo', parrillas: 'parrilla', pepitos: 'pepito', hamburguesas: 'hamburguesa',
  };
  const utm = (() => {
    const q = new URLSearchParams(location.search);
    const v = { utm_source: q.get('utm_source') || '', utm_campaign: q.get('utm_campaign') || '' };
    try {
      if (v.utm_source) sessionStorage.setItem('mrc_utm', JSON.stringify(v));
      return JSON.parse(sessionStorage.getItem('mrc_utm') || 'null') || v;
    } catch (e) { return v; }
  })();

  // ── Idioma ──
  function aplicarIdioma() {
    document.documentElement.lang = lang;
    $$('[data-t]').forEach((el) => { if (el.dataset.t !== 'pieTexto') el.textContent = t(el.dataset.t); });
    $$('[data-buscar]').forEach((i) => { i.placeholder = t('buscar'); });
    $$('[data-idioma]').forEach((b) => { b.textContent = t('idiomaBtn'); b.setAttribute('aria-label', t('idiomaAria')); });
    $$('.hoja-cerrar').forEach((x) => x.setAttribute('aria-label', t('cerrar')));
    $('#hp-menos').setAttribute('aria-label', t('menos'));
    $('#hp-mas').setAttribute('aria-label', t('mas'));
    $('.cantidad').setAttribute('aria-label', t('cantidad'));
    pintarPrecios();
    pintarNotaBCV();
  }
  $$('[data-idioma]').forEach((b) => b.addEventListener('click', () => {
    lang = lang === 'es' ? 'en' : 'es';
    guardar('mrc_idioma', lang);
    aplicarIdioma();
    if (orden.length) pintarTodo();
    pintarBarra();
    if (!$('#hoja-carrito').hidden) pintarCarrito();
    if (pedidoVisto) pintarSeguimiento(pedidoVisto);
    actualizarBanda();
  }));

  // ── Avisos ──
  const vivo = document.createElement('p');
  vivo.className = 'sr'; vivo.setAttribute('aria-live', 'polite');
  document.body.appendChild(vivo);
  const anunciar = (msg) => { vivo.textContent = ''; setTimeout(() => { vivo.textContent = msg; }, 50); };
  let avisoTimer;
  function aviso(msg) {
    const a = $('#aviso');
    a.textContent = msg; a.hidden = false;
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => { a.hidden = true; }, 3200);
  }

  // ── Precios en el navegador (solo para mostrar) ──
  function unitario(p, opciones) {
    let c = p.precio_cents;
    p.grupos.forEach((g) => g.opciones.forEach((o) => { if (opciones.includes(o.slug)) c += o.precio_cents; }));
    return c;
  }
  function totales() {
    const sub = carrito.reduce((a, l) => a + (platos[l.plato] ? unitario(platos[l.plato], l.opciones) * l.cantidad : 0), 0);
    const imp = Math.round(sub * negocio.impuesto_bp / 10000);
    const prop = Math.round(sub * propinaPct / 100);
    return { sub, imp, prop, total: sub + imp + prop };
  }
  const ahorro = (p) => (p.suelto_cents ? p.suelto_cents - p.precio_cents : 0);

  // ── Carga del menú ──
  async function cargarMenu() {
    try {
      const r = await fetch(API + '/api/public/menu', { cache: 'no-store' });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      negocio = j.data.negocio;
      categorias = j.data.categorias;
      platos = {};
      orden = j.data.platos.map((p) => { platos[p.slug] = p; return p.slug; });
      carrito = carrito.filter((l) => {
        const p = platos[l.plato];
        if (!p) return false;
        const validas = new Set(p.grupos.flatMap((g) => g.opciones.map((o) => o.slug)));
        return l.opciones.every((o) => validas.has(o)) && l.cantidad > 0;
      });
      guardar('mrc_carrito', carrito);
      aplicarIdioma();
      pintarTodo();
      pintarBarra();
      return true;
    } catch (e) {
      $('#carta').innerHTML = `<p class="cargando">${esc(t('errMenu'))}</p>`;
      $('#carta').setAttribute('aria-busy', 'false');
      return false;
    }
  }
  function pintarPrecios() {
    $$('[data-precio]').forEach((el) => {
      const p = platos[el.dataset.precio];
      if (p) {
        el.innerHTML = dineroHTML(p.precio_cents);
        el.dataset.cents = p.precio_cents;
      }
    });
    $$('[data-ahorro]').forEach((el) => {
      const p = platos[el.dataset.ahorro];
      el.textContent = p && ahorro(p) ? t('ahorras', { monto: dinero(ahorro(p)) }) : '';
      el.hidden = !el.textContent;
    });
  }

  // ── Tarjetas ──
  function enCarrito(slug) { return carrito.reduce((a, l) => a + (l.plato === slug ? l.cantidad : 0), 0); }
  function selloHTML(p) {
    if (p.agotado) return `<span class="sello sello-gris t-sello">${esc(t('agotado'))}</span>`;
    if (ahorro(p)) return `<span class="sello sello-verde t-sello">${esc(t('ahorras', { monto: dinero(ahorro(p)) }))}</span>`;
    return '';
  }
  function tarjetaHTML(p) {
    const n = enCarrito(p.slug);
    const fav = favoritos.has(p.slug);
    const clase = ['tarjeta', p.agotado ? 'agotado' : '', n ? 'en-carrito' : ''].join(' ');
    return `<article class="${clase}">
      ${selloHTML(p)}
      <button type="button" class="corazon" data-fav="${esc(p.slug)}" aria-pressed="${fav}" aria-label="${esc(t('fav'))}: ${esc(p.nombre)}"><svg class="ico"><use href="#i-corazon"/></svg></button>
      <button type="button" class="t-abrir" data-plato="${esc(p.slug)}" ${p.agotado ? 'aria-disabled="true"' : ''}>
        <span class="t-foto"><img src="${foto(p.slug)}" alt="" loading="lazy" width="600" height="600"></span>
        <span class="t-nombre">${esc(p.nombre)}</span>
        <span class="t-desc">${esc(tx(p.desc))}</span>
        <span class="t-meta"><svg class="ico"><use href="#i-reloj"/></svg>${esc(t('minutos', { n: p.minutos }))}</span>
        <span class="t-pie">
          <span class="t-precio">${dineroHTML(p.precio_cents)}${ahorro(p) ? `<s>${dineroHTML(p.suelto_cents)}</s>` : ''}</span>
          <span class="t-mas" aria-hidden="true">${p.agotado ? '–' : n ? n : '+'}</span>
        </span>
      </button>
    </article>`;
  }

  function pintarCats() {
    const lista = [{ slug: 'todo', nombre: t('todo') }];
    if (favoritos.size) lista.push({ slug: 'favoritos', nombre: t('favoritos') });
    categorias.forEach((c) => lista.push({ slug: c.slug, nombre: tx(c.nombre) }));
    if (!lista.some((c) => c.slug === filtro)) filtro = 'todo';
    $('#cats').innerHTML = lista.map((c) => {
      const circulo = c.slug === 'favoritos' ? '<svg class="ico"><use href="#i-corazon"/></svg>'
        : `<img src="${foto(FOTO_CAT[c.slug] || c.slug)}" alt="" loading="lazy" width="160" height="160">`;
      return `<button type="button" class="cat" role="tab" data-cat="${esc(c.slug)}" aria-selected="${c.slug === filtro}">
        <span class="cat-circulo">${circulo}</span>${esc(c.nombre)}</button>`;
    }).join('');
  }

  function pintarCarta() {
    const q = busqueda.trim().toLowerCase();
    const caja = $('#carta');
    const visibles = orden.map((s) => platos[s]).filter((p) => {
      if (q) return (p.nombre + ' ' + tx(p.desc) + ' ' + p.desc.es).toLowerCase().includes(q);
      if (filtro === 'favoritos') return favoritos.has(p.slug);
      return filtro === 'todo' || p.categoria === filtro;
    });
    $('#populares-caja').hidden = !!q || filtro !== 'todo';
    if (q) {
      caja.innerHTML = visibles.length
        ? `<div class="bloque"><h3>${esc(t('resultados', { q: busqueda.trim() }))}</h3><div class="rejilla">${visibles.map(tarjetaHTML).join('')}</div></div>`
        : `<p class="vacio-busqueda">${esc(t('sinResultados', { q: busqueda.trim() }))}</p>`;
    } else if (filtro === 'todo') {
      caja.innerHTML = categorias.map((c) => {
        const ps = visibles.filter((p) => p.categoria === c.slug);
        return `<div class="bloque" id="cat-${esc(c.slug)}"><h3>${esc(tx(c.nombre))} <small>${esc(t('platos', { n: ps.length }))}</small></h3>
          <div class="rejilla">${ps.map(tarjetaHTML).join('')}</div></div>`;
      }).join('');
    } else {
      const nombre = filtro === 'favoritos' ? t('favoritos') : tx((categorias.find((c) => c.slug === filtro) || {}).nombre);
      caja.innerHTML = `<div class="bloque"><h3>${esc(nombre)} <small>${esc(t('platos', { n: visibles.length }))}</small></h3><div class="rejilla">${visibles.map(tarjetaHTML).join('')}</div></div>`;
    }
    caja.setAttribute('aria-busy', 'false');
  }

  function pintarPopulares() {
    $('#populares').innerHTML = orden.map((s) => platos[s]).filter((p) => p.destacado).map(tarjetaHTML).join('');
  }
  function pintarTodo() { pintarCats(); pintarPopulares(); pintarCarta(); pintarPrecios(); }

  // Delegación: abrir plato, favoritos, categorías.
  document.addEventListener('click', (e) => {
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      const s = fav.dataset.fav;
      favoritos.has(s) ? favoritos.delete(s) : favoritos.add(s);
      guardar('mrc_favoritos', [...favoritos]);
      $$(`[data-fav="${CSS.escape(s)}"]`).forEach((b) => {
        b.setAttribute('aria-pressed', String(favoritos.has(s)));
        b.classList.remove('late'); void b.offsetWidth; b.classList.add('late');
      });
      pintarCats();
      if (filtro === 'favoritos') pintarCarta();
      return;
    }
    const pl = e.target.closest('[data-plato]');
    if (pl) {
      const p = platos[pl.dataset.plato];
      if (p.agotado) { aviso(t('agotadoAviso', { plato: p.nombre })); return; }
      abrirPlato(p.slug, null, pl);
      return;
    }
    const cat = e.target.closest('[data-cat]');
    if (cat) { elegirCategoria(cat.dataset.cat, false); return; }
    const ir = e.target.closest('[data-ir-cat]');
    if (ir) { e.preventDefault(); elegirCategoria(ir.dataset.irCat, true); return; }
    const ab = e.target.closest('[data-abrir]');
    if (ab) {
      const p = platos[ab.dataset.abrir];
      if (p && !p.agotado) abrirPlato(p.slug, null, ab);
      else document.getElementById('menu').scrollIntoView();
      return;
    }
    if (e.target.closest('[data-abrir-carrito]')) { pintarCarrito(); abrirHoja('hoja-carrito', e.target.closest('[data-abrir-carrito]')); return; }
    if (e.target.closest('[data-mi-pedido]')) {
      e.preventDefault();
      if (leer('mrc_pedido', null)) abrirSeguimiento(); else aviso(t('sinPedido'));
    }
  });
  function elegirCategoria(slug, desplazar) {
    filtro = slug;
    busqueda = '';
    $$('[data-buscar]').forEach((i) => { i.value = ''; });
    pintarCats(); pintarCarta();
    const activo = $(`.cat[data-cat="${CSS.escape(slug)}"]`);
    if (activo) activo.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduceMov.matches ? 'auto' : 'smooth' });
    if (desplazar) document.getElementById('menu').scrollIntoView({ behavior: reduceMov.matches ? 'auto' : 'smooth' });
  }
  let buscarTimer;
  $$('[data-buscar]').forEach((inp) => inp.addEventListener('input', () => {
    busqueda = inp.value;
    $$('[data-buscar]').forEach((o) => { if (o !== inp) o.value = inp.value; });
    clearTimeout(buscarTimer);
    buscarTimer = setTimeout(() => {
      pintarCarta();
      if (busqueda && !esWeb.matches) document.getElementById('menu').scrollIntoView({ behavior: 'auto' });
    }, 160);
  }));

  // ── Carrusel de la portada ──
  (() => {
    const c = $('#carrusel');
    const laminas = $$('.lamina', c);
    const puntos = $('#puntos');
    puntos.innerHTML = laminas.map((_, i) => `<button type="button" role="tab" aria-label="${i + 1} / ${laminas.length}" aria-selected="${i === 0}"></button>`).join('');
    const botones = $$('button', puntos);
    let actual = 0;
    const ir = (i) => c.scrollTo({ left: i * c.clientWidth, behavior: reduceMov.matches ? 'auto' : 'smooth' });
    botones.forEach((b, i) => b.addEventListener('click', () => { ir(i); pausar(); }));
    c.addEventListener('scroll', () => {
      const i = Math.round(c.scrollLeft / c.clientWidth);
      if (i !== actual) { actual = i; botones.forEach((b, k) => b.setAttribute('aria-selected', String(k === i))); }
    }, { passive: true });
    // Avanza solo cada 6 s; se detiene en cuanto la persona lo toca.
    let timer = null;
    const pausar = () => { clearInterval(timer); timer = null; };
    if (!reduceMov.matches) timer = setInterval(() => { if (!document.hidden && !hojaAbierta) ir((actual + 1) % laminas.length); }, 4500);
    ['pointerdown', 'wheel', 'focusin'].forEach((ev) => c.addEventListener(ev, pausar, { passive: true }));
  })();

  // Barra inferior: marca la sección donde está la persona.
  (() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (!en.isIntersecting) return;
        const nav = en.target.id === 'menu' ? 'menu' : 'inicio';
        $$('.barra-app a').forEach((a) => a.toggleAttribute('aria-current', a.dataset.nav === nav));
        $$('.barra-app a[aria-current]').forEach((a) => a.setAttribute('aria-current', 'page'));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['.portada', '#menu', '.duo'].forEach((s) => { const el = $(s); if (el) io.observe(el); });
  })();

  // ── Hojas (diálogos) con botón Atrás del teléfono ──
  let hojaAbierta = null;
  let desdeFoco = null;
  function abrirHoja(id, origen, reemplazar) {
    const h = document.getElementById(id);
    if (hojaAbierta && hojaAbierta !== h) cerrarHojaYa(true);
    desdeFoco = origen || document.activeElement;
    $('#velo').hidden = false;
    h.hidden = false;
    h.classList.remove('cerrando');
    hojaAbierta = h;
    document.body.classList.add('bloqueado');
    h.querySelector('.hoja-cuerpo').scrollTop = 0;
    const titulo = h.querySelector('h2');
    titulo.setAttribute('tabindex', '-1');
    setTimeout(() => titulo.focus({ preventScroll: true }), 30);
    const st = { hoja: id };
    if (reemplazar || (history.state && history.state.hoja)) history.replaceState(st, '');
    else history.pushState(st, '');
  }
  function cerrarHojaYa(sinAnimacion) {
    const h = hojaAbierta;
    if (!h) return;
    hojaAbierta = null;
    $('#velo').hidden = true;
    document.body.classList.remove('bloqueado');
    if (sinAnimacion || reduceMov.matches) h.hidden = true;
    else {
      h.classList.add('cerrando');
      setTimeout(() => { h.hidden = true; h.classList.remove('cerrando'); }, 220);
    }
    if (desdeFoco && desdeFoco.isConnected && !sinAnimacion) desdeFoco.focus({ preventScroll: true });
  }
  function cerrarHoja() {
    if (history.state && history.state.hoja) history.back();
    else cerrarHojaYa();
  }
  window.addEventListener('popstate', () => { if (hojaAbierta) cerrarHojaYa(); });
  $('#velo').addEventListener('click', cerrarHoja);
  $$('[data-cerrar]').forEach((b) => b.addEventListener('click', cerrarHoja));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hojaAbierta) cerrarHoja();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-plato][role=button]')) { e.preventDefault(); e.target.click(); }
  });

  // ── Hoja del plato ──
  let editando = null;
  function abrirPlato(slug, lineaId, origen) {
    const p = platos[slug];
    const linea = lineaId ? carrito.find((l) => l.id === lineaId) : null;
    editando = { slug, lineaId, cantidad: linea ? linea.cantidad : 1, volverAlCarrito: !!lineaId };
    const marcadas = linea ? linea.opciones : [];
    const caja = $('#hp-foto');
    caja.innerHTML = `<img src="${foto(p.slug)}" alt="" width="800" height="800">`;
    $('#hp-nombre').textContent = p.nombre;
    $('#hp-desc').textContent = tx(p.desc);
    $('#hp-meta').innerHTML = `<svg class="ico"><use href="#i-reloj"/></svg>${esc(t('minutos', { n: p.minutos }))}`
      + (ahorro(p) ? ` <span class="sello sello-verde">${esc(t('ahorras', { monto: dinero(ahorro(p)) }))}</span>` : '');
    // Sergio: la hoja solo explica cómo se puede pedir el plato; no hay nada que marcar.
    $('#hp-grupos').innerHTML = p.grupos.map((g) => {
      const items = g.opciones.map((o) => {
        if (g.tipo === 'quitar') return `<li><span class="sin">${esc(t('sin'))}</span> ${esc(tx(o.nombre).toLowerCase())}</li>`;
        const precio = g.tipo === 'uno' && g.slug === 'tamano' && !p.precio_pendiente ? `<b>${dineroHTML(p.precio_cents + o.precio_cents)}</b>` : '';
        return `<li>${esc(tx(o.nombre))}${precio}</li>`;
      }).join('');
      const titulo = g.tipo === 'quitar' ? t('quitarT') : tx(g.nombre);
      return `<section class="grupo-info grupo-${esc(g.tipo)}"><h3>${esc(titulo)}</h3><ul>${items}</ul></section>`;
    }).join('');
    const nota = $('#hp-nota');
    nota.value = linea ? linea.nota || '' : '';
    nota.hidden = !nota.value;
    $('#hp-nota-abrir').hidden = !!nota.value;
    $('#hp-agregar-txt').textContent = lineaId ? t('actualizar') : t('agregar');
    precioHoja(false);
    abrirHoja('hoja-plato', origen, !!lineaId);
  }
  const opcionesMarcadas = () => $$('#hp-grupos input:checked').map((i) => i.value);
  function precioHoja(animar = true) {
    const p = platos[editando.slug];
    $('#hp-cant').textContent = editando.cantidad;
    const el = $('#hp-precio');
    const cents = unitario(p, opcionesMarcadas()) * editando.cantidad;
    el.dataset.cents = cents;
    const nuevo = dinero(cents, monedaActual);
    if (el.textContent !== nuevo) {
      el.textContent = nuevo;
      if (animar) { el.classList.remove('tic'); void el.offsetWidth; el.classList.add('tic'); }
    }
  }
  $('#hp-grupos').addEventListener('change', () => precioHoja());
  $('#hp-menos').addEventListener('click', () => { if (editando.cantidad > 1) { editando.cantidad--; precioHoja(); } });
  $('#hp-mas').addEventListener('click', () => { if (editando.cantidad < 20) { editando.cantidad++; precioHoja(); } });
  $('#hp-nota-abrir').addEventListener('click', () => { $('#hp-nota').hidden = false; $('#hp-nota-abrir').hidden = true; $('#hp-nota').focus(); });

  $('#hp-agregar').addEventListener('click', () => {
    const p = platos[editando.slug];
    const opciones = opcionesMarcadas().sort();
    const nota = $('#hp-nota').value.trim().slice(0, 140);
    const clave = (l) => l.plato + '|' + l.opciones.join(',') + '|' + (l.nota || '');
    if (editando.lineaId) {
      const l = carrito.find((x) => x.id === editando.lineaId);
      if (l) Object.assign(l, { opciones, nota, cantidad: editando.cantidad });
    } else {
      const nueva = { id: Math.random().toString(36).slice(2, 10), plato: p.slug, opciones, nota, cantidad: editando.cantidad };
      const igual = carrito.find((l) => clave(l) === clave(nueva));
      if (igual) igual.cantidad = Math.min(20, igual.cantidad + nueva.cantidad);
      else carrito.push(nueva);
      volar($('#hp-agregar'));
      anunciar(t('agregado', { plato: p.nombre }));
    }
    guardar('mrc_carrito', carrito);
    const volver = editando.volverAlCarrito;
    pintarPopulares(); pintarCarta();
    if (volver) { pintarCarrito(); abrirHoja('hoja-carrito', null, true); }
    else { cerrarHoja(); pintarBarra(true); }
  });

  // Un punto dorado viaja hasta el botón del pedido: enseña dónde quedó lo agregado.
  function destinoCarrito() {
    return esWeb.matches ? $('.web-nav .boton-carrito') : $('.barra-app .nav-centro');
  }
  function volar(desde) {
    const meta = destinoCarrito();
    if (reduceMov.matches || !meta) return;
    const a = desde.getBoundingClientRect();
    const b = meta.getBoundingClientRect();
    const d = document.createElement('span');
    d.className = 'vuela';
    d.style.left = (a.left + a.width / 2 - 10) + 'px';
    d.style.top = (a.top + a.height / 2 - 10) + 'px';
    document.body.appendChild(d);
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
    const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
    d.animate([
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${dx * 0.55}px, ${Math.min(dy, 0) - 90}px) scale(1.3)`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.5)` },
    ], { duration: 650, easing: 'cubic-bezier(.3,.6,.4,1)' }).onfinish = () => d.remove();
  }

  // ── Contadores del pedido ──
  function pintarBarra(saltar) {
    const n = carrito.reduce((a, l) => a + l.cantidad, 0);
    $$('[data-cuenta]').forEach((el) => {
      el.textContent = n;
      if (el.classList.contains('burbuja')) el.hidden = n === 0;
    });
    $('#tira').hidden = n === 0;
    $('#tira-total').textContent = dinero(totales().sub);
    if (saltar && n && !reduceMov.matches) {
      const meta = destinoCarrito();
      setTimeout(() => { meta.classList.remove('salta'); void meta.offsetWidth; meta.classList.add('salta'); }, 600);
    }
  }

  // ── Hoja del carrito ──
  function modsTexto(l) {
    const p = platos[l.plato];
    const partes = [];
    p.grupos.forEach((g) => g.opciones.forEach((o) => {
      if (!l.opciones.includes(o.slug)) return;
      if (g.tipo === 'quitar') partes.push(`<span class="m-sin">${esc(t('sin'))} ${esc(tx(o.nombre).toLowerCase())}</span>`);
      else if (g.tipo === 'agregar') partes.push(`<span class="m-mas">+ ${esc(tx(o.nombre))}</span>`);
      else partes.push(esc(tx(o.nombre)));
    }));
    if (l.nota) partes.push(`“${esc(l.nota)}”`);
    return partes.join(' · ');
  }
  function pintarCarrito() {
    const ul = $('#hc-lineas');
    if (!carrito.length) {
      ul.innerHTML = `<li class="linea-vacia">${esc(t('vacio'))}</li>`;
    } else {
      ul.innerHTML = carrito.map((l) => {
        const p = platos[l.plato];
        const mods = modsTexto(l);
        return `<li class="linea" data-linea="${esc(l.id)}">
          <span class="linea-foto"><img src="${foto(p.slug)}" alt="" width="120" height="120" loading="lazy"></span>
          <button type="button" class="linea-nombre" data-editar title="${esc(t('editar'))}">${esc(p.nombre)}</button>
          <span class="linea-precio">${dinero(unitario(p, l.opciones) * l.cantidad)}</span>
          ${mods ? `<p class="linea-mods">${mods}</p>` : ''}
          <div class="linea-cant">
            <button type="button" data-delta="-1" aria-label="${esc(t('menos'))}">−</button>
            <b>${l.cantidad}</b>
            <button type="button" data-delta="1" aria-label="${esc(t('mas'))}">+</button>
            <button type="button" class="linea-quitar" data-quitar>${esc(t('quitarLinea'))}</button>
          </div></li>`;
      }).join('');
    }
    const fs = $('#propinas');
    const sub = totales().sub;
    fs.querySelectorAll('label').forEach((x) => x.remove());
    [0, ...negocio.propinas].forEach((pct) => {
      const lab = document.createElement('label');
      lab.className = 'chip';
      lab.innerHTML = `<input type="radio" name="propina" value="${pct}" ${pct === propinaPct ? 'checked' : ''}>
        <span>${pct ? `${pct}% <small>${dinero(Math.round(sub * pct / 100))}</small>` : esc(t('sinPropina'))}</span>`;
      fs.appendChild(lab);
    });
    pintarTotales();
    $('#enviar').disabled = !carrito.length;
  }
  function pintarTotales() {
    const x = totales();
    const pct = (negocio.impuesto_bp / 100).toLocaleString(lang === 'es' ? 'es-US' : 'en-US', { maximumFractionDigits: 2 });
    $('#totales').innerHTML = `<dt>${esc(t('subtotal'))}</dt><dd>${dinero(x.sub)}</dd>
      ${negocio.impuesto_bp ? `<dt>${esc(t('impuesto', { pct }))}</dt><dd>${dinero(x.imp)}</dd>` : ''}
      ${propinaPct ? `<dt>${esc(t('propinaL'))}</dt><dd>${dinero(x.prop)}</dd>` : ''}
      <dt class="t-total">${esc(t('total'))}</dt><dd class="t-total">${dinero(x.total)}</dd>`;
    const el = $('#enviar-total');
    const nuevo = dinero(x.total);
    if (el.textContent !== nuevo) { el.textContent = nuevo; el.classList.remove('tic'); void el.offsetWidth; el.classList.add('tic'); }
  }
  $('#propinas').addEventListener('change', (e) => { propinaPct = Number(e.target.value) || 0; pintarTotales(); });
  $('#hc-lineas').addEventListener('click', (e) => {
    const li = e.target.closest('[data-linea]');
    if (!li) return;
    const l = carrito.find((x) => x.id === li.dataset.linea);
    if (!l) return;
    if (e.target.closest('[data-editar]')) { abrirPlato(l.plato, l.id); return; }
    const b = e.target.closest('[data-delta]');
    if (b) l.cantidad = Math.max(0, Math.min(20, l.cantidad + Number(b.dataset.delta)));
    if (e.target.closest('[data-quitar]')) l.cantidad = 0;
    carrito = carrito.filter((x) => x.cantidad > 0);
    guardar('mrc_carrito', carrito);
    pintarCarrito(); pintarBarra(); pintarPopulares(); pintarCarta();
  });

  // ── Enviar ──
  const datos = leer('mrc_cliente', {});
  if (datos.nombre) $('#f-nombre').value = datos.nombre;
  if (datos.telefono) $('#f-tel').value = datos.telefono;
  $('#f-tel').addEventListener('input', (e) => {
    if (e.inputType && e.inputType.startsWith('delete')) return;
    const d = e.target.value.replace(/\D/g, '').replace(/^1(?=\d{10})/, '').slice(0, 10);
    if (d.length >= 7) e.target.value = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    else if (d.length >= 4) e.target.value = `(${d.slice(0, 3)}) ${d.slice(3)}`;
  });
  function errorForm(msg, campo) {
    const p = $('#error-form');
    p.textContent = msg; p.hidden = false;
    $$('#form-pedido [aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
    if (campo) { campo.setAttribute('aria-invalid', 'true'); campo.focus(); }
    else p.scrollIntoView({ block: 'nearest' });
  }
  $('#form-pedido').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#error-form').hidden = true;
    $$('.linea.marcada').forEach((x) => x.classList.remove('marcada'));
    const nombre = $('#f-nombre').value.trim();
    const tel = $('#f-tel').value.replace(/\D/g, '');
    if (!nombre) return errorForm(t('errNombre'), $('#f-nombre'));
    if (tel.length < 10) return errorForm(t('errTel'), $('#f-tel'));
    const boton = $('#enviar');
    boton.disabled = true;
    boton.firstElementChild.textContent = t('enviando');
    const cuerpo = {
      nombre, telefono: tel, modo: $('input[name=modo]:checked').value, nota: $('#f-nota').value.trim(),
      propina_pct: propinaPct, ...utm,
      lineas: carrito.map((l) => ({ plato: l.plato, cantidad: l.cantidad, opciones: l.opciones, nota: l.nota || '' })),
    };
    try {
      const r = await fetch(API + '/api/public/pedido', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
      const j = await r.json().catch(() => ({ ok: false }));
      if (!j.ok) {
        errorForm(j.error || t('errRed'));
        if (j.plato) {
          carrito.filter((l) => l.plato === j.plato).forEach((l) => {
            const li = document.querySelector(`[data-linea="${CSS.escape(l.id)}"]`);
            if (li) li.classList.add('marcada');
          });
          cargarMenu();
        }
        return;
      }
      guardar('mrc_cliente', { nombre, telefono: $('#f-tel').value });
      guardar('mrc_pedido', { token: j.data.token, numero: j.data.numero, nombre, at: Date.now() });
      carrito = [];
      guardar('mrc_carrito', carrito);
      $('#f-nota').value = '';
      propinaPct = 0;
      pintarBarra(); pintarPopulares(); pintarCarta();
      cerrarHojaYa(true);
      if (history.state && history.state.hoja) history.replaceState(null, '');
      abrirSeguimiento();
    } catch (err) {
      errorForm(t('errRed'));
    } finally {
      boton.disabled = !carrito.length;
      boton.firstElementChild.textContent = t('enviar');
    }
  });

  // ── Seguimiento del pedido ──
  let pedidoVisto = null;
  let sondeo = null;
  const ORDEN_EST = ['nuevo', 'preparando', 'listo', 'entregado'];
  async function consultar() {
    const g = leer('mrc_pedido', null);
    if (!g) return null;
    try {
      const r = await fetch(API + '/api/public/pedido/' + encodeURIComponent(g.token), { cache: 'no-store' });
      if (r.status === 404) { guardar('mrc_pedido', null); return null; }
      const j = await r.json();
      return j.ok ? j.data : null;
    } catch (e) { return pedidoVisto; }
  }
  function pintarSeguimiento(d) {
    const anterior = pedidoVisto && pedidoVisto.estado;
    pedidoVisto = d;
    const s = $('#seguimiento');
    s.dataset.estado = d.estado;
    $('#sg-hola').textContent = t('hola', { nombre: d.nombre });
    $('#sg-num').textContent = '#' + d.numero;
    $('#sg-num').setAttribute('aria-label', t('pedidoNum', { n: d.numero }));
    $('#sg-estado').textContent = t('est_' + d.estado);
    const i = ORDEN_EST.indexOf(d.estado);
    $$('#sg-pasos li').forEach((li, k) => {
      li.classList.toggle('hecho', i >= 0 && k <= i);
      li.classList.toggle('actual', k === i && d.estado !== 'entregado');
    });
    let detalle = '';
    if (d.estado === 'nuevo' || d.estado === 'preparando') detalle = d.antes === 0 ? t('siguiente') : d.antes === 1 ? t('antes1') : t('antes', { n: d.antes });
    $('#sg-detalle').textContent = detalle;
    $('#sg-lineas').innerHTML = d.lineas.map((l) => {
      const mods = [...l.elegido.map((x) => x.nombre), ...l.sin.map((x) => t('sin') + ' ' + x.toLowerCase()), ...l.extras.map((x) => '+ ' + x.nombre)];
      if (l.nota) mods.push('“' + l.nota + '”');
      return `<li><b>${l.cantidad}×</b> ${esc(l.nombre)} — ${dinero(l.total_cents)}${mods.length ? `<small>${esc(mods.join(' · '))}</small>` : ''}</li>`;
    }).join('');
    $('#sg-total').textContent = `${t('total')}: ${dinero(d.totales.total_cents)} · ${t('r4')}`;
    if (anterior && anterior !== d.estado && d.estado === 'listo') {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      document.title = `¡#${d.numero}! · Las Parrillas de Sergio`;
    }
  }
  async function abrirSeguimiento() {
    const d = await consultar();
    if (!d) { actualizarBanda(); aviso(t('sinPedido')); return; }
    pintarSeguimiento(d);
    $('#seguimiento').hidden = false;
    document.body.classList.add('bloqueado');
    $('#sg-num').setAttribute('tabindex', '-1');
    $('#sg-num').focus();
    clearInterval(sondeo);
    sondeo = setInterval(async () => {
      if (document.hidden) return;
      const n = await consultar();
      if (n) pintarSeguimiento(n);
      if (n && (n.estado === 'entregado' || n.estado === 'cancelado')) clearInterval(sondeo);
    }, 5000);
  }
  function cerrarSeguimiento() {
    $('#seguimiento').hidden = true;
    document.body.classList.remove('bloqueado');
    clearInterval(sondeo);
    document.title = 'Las Parrillas de Sergio · Carta';
    if (pedidoVisto && (pedidoVisto.estado === 'entregado' || pedidoVisto.estado === 'cancelado')) guardar('mrc_pedido', null);
    actualizarBanda();
  }
  $('#sg-cerrar').addEventListener('click', cerrarSeguimiento);
  $('#sg-otro').addEventListener('click', () => { cerrarSeguimiento(); document.getElementById('menu').scrollIntoView(); });

  let bandaTimer = null;
  async function actualizarBanda() {
    const banda = $('#banda-pedido');
    const g = leer('mrc_pedido', null);
    if (!g || Date.now() - g.at > 12 * 3600 * 1000) { banda.hidden = true; guardar('mrc_pedido', null); return; }
    const d = (pedidoVisto && pedidoVisto.numero === g.numero) ? pedidoVisto : await consultar();
    if (!d || !['nuevo', 'preparando', 'listo'].includes(d.estado)) { banda.hidden = true; return; }
    banda.innerHTML = t('banda', { n: d.numero, estado: esc(t('corto_' + d.estado)) });
    banda.hidden = false;
    clearTimeout(bandaTimer);
    bandaTimer = setTimeout(async () => { if ($('#seguimiento').hidden) { pedidoVisto = await consultar() || pedidoVisto; actualizarBanda(); } }, 15000);
  }
  $('#banda-pedido').addEventListener('click', (e) => { e.preventDefault(); abrirSeguimiento(); });

  // ── Animación y actualización de moneda (USD / BCV) ──
  function alternarMoneda() {
    monedaActual = monedaActual === 'usd' ? 'ves' : 'usd';
    const precios = $$('.precio-animado, #hp-precio[data-cents]');
    precios.forEach((p) => p.classList.add('rotar-fuera'));

    setTimeout(() => {
      precios.forEach((p) => {
        const cents = Number(p.dataset.cents);
        if (Number.isFinite(cents)) {
          p.textContent = dinero(cents, monedaActual);
        }
        p.classList.remove('rotar-fuera');
        p.classList.add('rotar-prep');
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          precios.forEach((p) => p.classList.remove('rotar-prep'));
        });
      });
    }, 220);
  }

  function pintarNotaBCV() {
    const formateada = tasaBCV.toLocaleString(lang === 'es' ? 'es-VE' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    $$('.nota-bcv').forEach((el) => {
      const linea1 = lang === 'es' ? 'Precios en dólares y bolívares' : 'Prices in US Dollars and Bolívares';
      const linea2 = lang === 'es'
        ? `Tasa oficial BCV: <b>${formateada} Bs/$</b>`
        : `Official BCV rate: <b>${formateada} Bs/$</b>`;
      el.innerHTML = `<span>${linea1}</span><span class="nota-tasa">${linea2}</span>`;
      el.style.cursor = 'pointer';
      el.title = lang === 'es' ? 'Toca para alternar entre dólares y bolívares' : 'Tap to switch between USD and Bs.';
    });
  }

  async function cargarTasaBCV() {
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
      if (res.ok) {
        const data = await res.json();
        if (data && data.promedio) {
          tasaBCV = Number(data.promedio);
          guardar('sergio_tasa_bcv', tasaBCV);
          pintarNotaBCV();
          $$('.precio-animado, #hp-precio[data-cents]').forEach((p) => {
            const cents = Number(p.dataset.cents);
            if (Number.isFinite(cents)) p.textContent = dinero(cents, monedaActual);
          });
        }
      }
    } catch (e) {
      console.warn('Usando tasa guardada de referencia BCV:', e);
    }
  }

  // Animación continua con delay de 4.5 segundos
  let temporizadorMoneda = setInterval(alternarMoneda, 4500);

  // Tocar cualquier precio o la nota BCV para alternar de inmediato
  document.addEventListener('click', (e) => {
    if (e.target.closest('.t-precio, .precio-animado, .nota-bcv, .oferta-precio, #hp-precio')) {
      clearInterval(temporizadorMoneda);
      alternarMoneda();
      temporizadorMoneda = setInterval(alternarMoneda, 4500);
    }
  });

  // ── Arranque ──
  aplicarIdioma();
  cargarMenu();
  actualizarBanda();
  pintarNotaBCV();
  cargarTasaBCV();
})();

// Polyfill del panel para Las Parrillas de Sergio.
// La landing es la misma de MR CRIOLLO y espera una API (/api/public/...). Sergio todavía no
// tiene panel: este archivo responde esas llamadas en el navegador con la carta de Sergio y
// guarda los pedidos de prueba en localStorage. Cuando exista un panel real, se borra este
// archivo y config.js apunta a su URL; app.js no cambia. Carta solo visual: sin pedidos.
(() => {
  'use strict';

  const t = (es, en) => ({ es, en });
  const op = (slug, es, en, precio_cents = 0) => ({ slug, nombre: t(es, en), precio_cents });
  const proteina = () => ({ slug: 'proteina', nombre: t('Elige tu carne', 'Pick your meat'), tipo: 'uno', opciones: [
    op('carne', 'Carne', 'Beef'),
    op('pollo', 'Pollo', 'Chicken'),
    op('chorizo', 'Chorizo', 'Chorizo'),
    op('mixta', 'Mixta', 'Mixed'),
  ] });
  const quitar = (...opciones) => ({ slug: 'quitar', nombre: t('Quitar', 'Remove'), tipo: 'quitar', opciones });

  // Precios en centavos de USD; se cobran a tasa BCV.
  // PENDIENTE (contenido.md): el peso de la parrilla de $11 y qué precio ($7 / $11) va con
  // cada tamaño de pepito. Los valores de abajo son provisionales hasta que Sergio confirme.
  const MENU = {
    negocio: { nombre: 'Las Parrillas de Sergio', impuesto_bp: 0, propinas: [], espera_min: 20, moneda: 'USD' },
    categorias: [
      { slug: 'parrillas', nombre: t('Parrillas', 'Grill platters') },
      { slug: 'pepitos', nombre: t('Pepitos', 'Pepitos') },
      { slug: 'hamburguesas', nombre: t('Hamburguesas', 'Burgers') },
    ],
    platos: [
      { slug: 'parrilla', categoria: 'parrillas', nombre: 'Parrilla', precio_cents: 800, destacado: true, minutos: 20, suelto_cents: 0, agotado: false,
        desc: t('Con yuca y ensalada. Carne, pollo o chorizo; sencilla o mixta, a tu gusto.', 'With cassava and salad. Beef, chicken or chorizo; single or mixed.'),
        grupos: [
          { slug: 'tamano', nombre: t('Tamaño', 'Size'), tipo: 'uno', opciones: [
            op('parrilla-200', '200 g', '200 g'),
            op('parrilla-grande', 'Grande', 'Large', 300),
          ] },
          proteina(),
          quitar(op('sin-yuca', 'Yuca', 'Cassava'), op('sin-ensalada', 'Ensalada', 'Salad')),
        ] },
      { slug: 'pepito', categoria: 'pepitos', nombre: 'Pepito', precio_cents: 700, precio_pendiente: true, destacado: true, minutos: 15, suelto_cents: 0, agotado: false,
        desc: t('Carne, pollo o chorizo con ensalada y salsas de la casa. Sencillo o mixto.', 'Beef, chicken or chorizo with salad and house sauces. Single or mixed.'),
        grupos: [
          { slug: 'tamano', nombre: t('Tamaño', 'Size'), tipo: 'uno', opciones: [
            op('pepito-16', '16 cm', '16 cm'),
            op('pepito-32', '32 cm', '32 cm', 400),
          ] },
          proteina(),
          quitar(op('sin-ensalada-p', 'Ensalada', 'Salad'), op('sin-salsas-p', 'Salsas', 'Sauces')),
        ] },
      { slug: 'hamburguesa', categoria: 'hamburguesas', nombre: 'Hamburguesa', precio_cents: 500, destacado: false, minutos: 12, suelto_cents: 0, agotado: false,
        desc: t('Carne, pollo o chorizo con lechuga, tomate y salsas de la casa. Sencilla o mixta.', 'Beef, chicken or chorizo with lettuce, tomato and house sauces.'),
        grupos: [
          proteina(),
          quitar(op('sin-lechuga', 'Lechuga', 'Lettuce'), op('sin-tomate', 'Tomate', 'Tomato'), op('sin-salsas-h', 'Salsas', 'Sauces')),
        ] },
    ],
  };
  const platos = Object.fromEntries(MENU.platos.map((p) => [p.slug, p]));

  const KEY = 'sergio_pedidos';
  const leer = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const guardar = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };
  const responder = (cuerpo, status = 200) => Promise.resolve(new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } }));

  function linea(sel) {
    const p = platos[sel.plato];
    if (!p) throw { error: 'Ese plato ya no está en la carta.', plato: sel.plato };
    const l = { plato: p.slug, nombre: p.nombre, cantidad: sel.cantidad, elegido: [], sin: [], extras: [], nota: sel.nota || '', unitario_cents: p.precio_cents };
    p.grupos.forEach((g) => {
      const marcadas = g.opciones.filter((o) => sel.opciones.includes(o.slug));
      if (g.tipo === 'uno' && marcadas.length !== 1) throw { error: `Elige ${g.nombre.es.toLowerCase()} para ${p.nombre}.`, plato: p.slug };
      marcadas.forEach((o) => {
        l.unitario_cents += o.precio_cents;
        if (g.tipo === 'uno') l.elegido.push({ nombre: o.nombre.es, precio_cents: o.precio_cents });
        else if (g.tipo === 'quitar') l.sin.push(o.nombre.es);
        else l.extras.push({ nombre: o.nombre.es, precio_cents: o.precio_cents });
      });
    });
    l.total_cents = l.unitario_cents * l.cantidad;
    return l;
  }

  // Avance simulado: recibido → en cocina (20 s) → listo (60 s) → entregado (5 min).
  function estado(pedido) {
    const s = (Date.now() - pedido.creado) / 1000;
    return s < 20 ? 'nuevo' : s < 60 ? 'preparando' : s < 300 ? 'listo' : 'entregado';
  }

  const fetchOriginal = window.fetch.bind(window);
  window.fetch = (url, opts = {}) => {
    const ruta = new URL(String(url), location.href).pathname;
    if (ruta.endsWith('/api/public/menu')) return responder({ ok: true, data: MENU });

    return fetchOriginal(url, opts);
  };
})();

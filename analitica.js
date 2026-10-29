// Medición con PostHog (proyecto compartido: todos los eventos llevan sitio = "parrillas-de-sergio").
// La clave phc_ es pública por diseño. Mide visitas, tiempo, clics, scroll y repetición de visitas.
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('phc_mP5WvqGk4v2WnUsj4bdcvjwQSeM9rDgpSNmXiEqCJPB8', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2026-08-30',
  person_profiles: 'always'
});
posthog.register({ sitio: 'parrillas-de-sergio' });

(() => {
  'use strict';
  const ev = (nombre, props) => { try { posthog.capture(nombre, props || {}); } catch (e) { /* sin medición */ } };

  document.addEventListener('click', (e) => {
    const t = e.target;
    const enlace = t.closest('a[href]');
    if (enlace) {
      const h = enlace.getAttribute('href');
      if (/wa\.me|whatsapp/i.test(h)) ev('whatsapp_click', { destino: h });
      else if (/instagram\.com/i.test(h)) ev('instagram_click', { destino: h });
    }
    const plato = t.closest('[data-plato]');
    if (plato) ev('plato_abierto', { plato: plato.dataset.plato, desde: plato.id === 'oferta' ? 'bloque_hamburguesa' : 'tarjeta' });
    const lamina = t.closest('[data-plato-lamina]');
    if (lamina) ev('lamina_click', { plato: lamina.dataset.platoLamina, lamina: [...lamina.parentNode.children].indexOf(lamina) + 1 });
    if (t.tagName === 'IMG') ev('foto_click', { foto: (t.currentSrc || t.src || '').split('/').pop().split('?')[0] });
    const cat = t.closest('[data-cat], [data-ir-cat]');
    if (cat) ev('categoria_click', { categoria: cat.dataset.cat || cat.dataset.irCat });
    if (t.closest('[data-idioma]')) ev('idioma_cambio', { idioma_antes: document.documentElement.lang });
    if (t.closest('.puntos button')) ev('carrusel_punto_click');
  }, true);

  // Qué lámina del carrusel se vio (una vez por lámina y visita).
  const vistas = new Set();
  const obs = new IntersectionObserver((entradas) => entradas.forEach((en) => {
    if (!en.isIntersecting) return;
    const l = en.target, n = [...l.parentNode.children].indexOf(l) + 1;
    if (vistas.has(n)) return;
    vistas.add(n);
    ev('carrusel_lamina_vista', { lamina: n, plato: l.dataset.platoLamina });
  }), { threshold: 0.6 });
  const iniciar = () => document.querySelectorAll('#carrusel .lamina').forEach((l) => obs.observe(l));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', iniciar) : iniciar();

  // Hasta dónde bajó (25, 50, 75 y 100 %).
  const marcas = [25, 50, 75, 100], hechas = new Set();
  addEventListener('scroll', () => {
    const d = document.documentElement, p = Math.round((scrollY + innerHeight) / d.scrollHeight * 100);
    marcas.forEach((m) => { if (p >= m && !hechas.has(m)) { hechas.add(m); ev('scroll_profundidad', { porcentaje: m }); } });
  }, { passive: true });

  // Tiempo activo en la carta al salir (segundos con la pestaña visible).
  let inicio = Date.now(), activo = 0, enviado = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { activo += Date.now() - inicio; if (!enviado) { enviado = true; ev('tiempo_en_carta', { segundos: Math.round(activo / 1000) }); } }
    else { inicio = Date.now(); enviado = false; }
  });
})();

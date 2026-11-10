// tools/replicar.js
export function render(plantilla, vals) {
  let out = plantilla;
  for (const [k, v] of Object.entries(vals)) out = out.split(`{{${k}}}`).join(String(v));
  const restantes = out.match(/\{\{[A-Z0-9_]+\}\}/g);
  if (restantes) throw new Error(`tokens sin valor: ${[...new Set(restantes)].join(', ')}`);
  return out;
}

export function recortarBloque(html, nombre, conservar) {
  const ini = `<!-- ${nombre}:INICIO -->`, fin = `<!-- ${nombre}:FIN -->`;
  const i = html.indexOf(ini), j = html.indexOf(fin);
  if (i === -1 || j === -1 || j < i) throw new Error(`marcador ${nombre} ausente o mal cerrado`);
  if (conservar) return html.slice(0, i) + html.slice(i + ini.length, j) + html.slice(j + fin.length);
  return html.slice(0, i) + html.slice(j + fin.length);
}

export function valores(n) {
  return {
    SLUG: n.slug, NOMBRE: n.nombre, NOMBRE_CORTO: n.nombreCorto, LEMA: n.lema,
    WHATSAPP: n.whatsapp, WHATSAPP_BONITO: `0${n.whatsapp.slice(2, 5)}-${n.whatsapp.slice(5)}`,
    INSTAGRAM: n.instagram, SITIO_POSTHOG: n.sitioPosthog, API_URL: n.apiUrl,
    TASA_FALLBACK: String(n.tasaFallback),
    SPLASH_TITULO: n.splash.titulo, SPLASH_LEMA: n.splash.lema, SPLASH_DURACION: String(n.splash.duracionMs),
    COLOR_FONDO: n.colores.fondo, COLOR_TEXTO: n.colores.texto,
    COLOR_PRIMARIO: n.colores.primario, COLOR_ACENTO: n.colores.acento,
  };
}

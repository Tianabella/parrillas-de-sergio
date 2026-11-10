// tools/replicar.js
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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

const ASSETS = ['img/logo-chef.png', 'img/hero/hero-1.jpg', 'img/hero/hero-2.jpg', 'img/hero/hero-3.jpg', 'img/hero/hero-4.jpg'];

export function generar(origen, destino, n) {
  mkdirSync(destino, { recursive: true });
  cpSync(origen, destino, { recursive: true,
    filter: (s) => !/\.git|node_modules|plantillas|tools|docs|negocio\.ejemplo\.json/.test(s) });
  for (const a of ASSETS) {
    if (!existsSync(join(destino, a))) throw new Error(`asset obligatorio ausente: ${a}`);
  }
  const v = valores(n);
  const p = (f) => readFileSync(join(origen, 'plantillas', f), 'utf8');
  let html = p('index.plantilla.html');
  html = recortarBloque(html, 'SPLASH_SCRIPT', n.splash.activado);
  html = recortarBloque(html, 'SPLASH', n.splash.activado);
  writeFileSync(join(destino, 'index.html'), render(html, v));
  writeFileSync(join(destino, 'estilos.css'), render(p('estilos.plantilla.css'), v));
  writeFileSync(join(destino, 'app.js'), render(p('app.plantilla.js'), v));
  writeFileSync(join(destino, 'analitica.js'), render(p('analitica.plantilla.js'), v));
  writeFileSync(join(destino, 'config.js'), render(p('config.plantilla.js'), v));
}

if (process.argv[1] && process.argv[1].endsWith('replicar.js')) {
  const [, , cfg, destino] = process.argv;
  if (!cfg || !destino) { console.error('uso: node tools/replicar.js <negocio.json> <destino>'); process.exit(1); }
  generar(new URL('..', import.meta.url).pathname, destino, JSON.parse(readFileSync(cfg, 'utf8')));
  console.log(`Sitio generado en ${destino}`);
}

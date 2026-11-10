// tools/replicar.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URLS = (r) => new URL(r, import.meta.url);

test('negocio.ejemplo.json tiene el contrato completo', () => {
  const n = JSON.parse(readFileSync(URLS('../negocio.ejemplo.json'), 'utf8'));
  for (const k of ['slug','nombre','nombreCorto','lema','whatsapp','instagram','sitioPosthog','apiUrl','tasaFallback','splash','colores'])
    assert.ok(k in n, `falta ${k}`);
  for (const k of ['activado','titulo','lema','duracionMs']) assert.ok(k in n.splash, `falta splash.${k}`);
  for (const k of ['fondo','texto','primario','acento']) assert.match(n.colores[k], /^#[0-9A-Fa-f]{6}$/, `colores.${k} no es hex`);
  assert.equal(typeof n.splash.activado, 'boolean');
  assert.match(n.whatsapp, /^58\d{10}$/);
});

import { render, recortarBloque, valores, generar } from './replicar.js';

const N = JSON.parse(readFileSync(URLS('../negocio.ejemplo.json'), 'utf8'));

test('render sustituye tokens y falla si queda alguno', () => {
  assert.equal(render('Hola {{NOMBRE}}', { NOMBRE: 'Ana' }), 'Hola Ana');
  assert.throws(() => render('Hola {{NOMBRE}}', {}), /tokens sin valor: \{\{NOMBRE\}\}/);
});

test('recortarBloque conserva o elimina según el flag', () => {
  const html = '<p>a</p><!-- SPLASH:INICIO --><div>splash</div><!-- SPLASH:FIN --><p>b</p>';
  assert.ok(recortarBloque(html, 'SPLASH', true).includes('splash'));
  const sin = recortarBloque(html, 'SPLASH', false);
  assert.ok(!sin.includes('splash') && sin.includes('<p>b</p>'));
  assert.throws(() => recortarBloque('<p>sin marcas</p>', 'SPLASH', true), /marcador/);
});

test('valores deriva el teléfono bonito y aplana splash/colores', () => {
  const v = valores(N);
  assert.equal(v.WHATSAPP_BONITO, '0412-4652676');
  assert.equal(v.COLOR_FONDO, '#F8F0E4');
  assert.equal(v.SPLASH_TITULO, 'LAS PARRILLAS DE SERGIO');
  assert.equal(v.SPLASH_DURACION, '4600');
});

test('las plantillas pequeñas compilan sin tokens residuales', () => {
  const v = valores(N);
  for (const f of ['config.plantilla.js', 'analitica.plantilla.js', 'app.plantilla.js']) {
    const salida = render(readFileSync(URLS(`../plantillas/${f}`), 'utf8'), v);
    assert.ok(!salida.includes('{{'), `${f} dejó tokens`);
  }
  const cfg = render(readFileSync(URLS('../plantillas/config.plantilla.js'), 'utf8'), v);
  assert.ok(cfg.includes("window.MRC = { api: '' };"));
  const an = render(readFileSync(URLS('../plantillas/analitica.plantilla.js'), 'utf8'), v);
  assert.ok(an.includes("sitio: 'parrillas-de-sergio'"));
  const app = render(readFileSync(URLS('../plantillas/app.plantilla.js'), 'utf8'), v);
  assert.ok(app.includes("leer('parrillas-de-sergio_tasa_bcv', 886.23)) || 886.23"));
  assert.ok(app.includes("guardar('parrillas-de-sergio_tasa_bcv'"));
});

test('estilos compilan con la paleta del negocio', () => {
  const css = render(readFileSync(URLS('../plantillas/estilos.plantilla.css'), 'utf8'), valores(N));
  assert.ok(css.includes(':root{') || css.includes(':root {'));
  assert.ok(css.includes('--fondo:#F8F0E4') || css.includes('--fondo: #F8F0E4'));
  assert.ok(css.includes('var(--primario)'), 'el cuerpo debe usar var(--primario)');
  assert.ok(!css.includes('{{'));
});

test('index compila con y sin splash', () => {
  const v = valores(N);
  let html = readFileSync(URLS('../plantillas/index.plantilla.html'), 'utf8');
  html = recortarBloque(html, 'SPLASH_SCRIPT', N.splash.activado);
  html = recortarBloque(html, 'SPLASH', N.splash.activado);
  const con = render(html, v);
  assert.ok(con.includes('wa.me/584124652676'));
  assert.ok(con.includes('instagram.com/lasparrillasdesergio'));
  assert.ok(con.includes('LAS PARRILLAS DE SERGIO')); // splash visible

  let html2 = readFileSync(URLS('../plantillas/index.plantilla.html'), 'utf8');
  html2 = recortarBloque(html2, 'SPLASH_SCRIPT', false);
  html2 = recortarBloque(html2, 'SPLASH', false);
  const sin = render(html2, v);
  assert.ok(!sin.includes('splash-overlay'), 'el splash debió recortarse');
  assert.ok(sin.includes('app-cabeza'), 'la cabecera queda intacta');
});

test('generar produce el sitio completo de un negocio nuevo', () => {
  const destino = mkdtempSync(join(tmpdir(), 'replica-'));
  try {
    const pollo = { ...N, slug: 'pollos-la-esquina', nombre: 'Pollos La Esquina', nombreCorto: 'POLLOS LA ESQUINA', whatsapp: '584141112233', instagram: 'polloslaesquina', sitioPosthog: 'pollos-la-esquina', splash: { ...N.splash, activado: false }, colores: { fondo: '#FFFFFF', texto: '#1A1A1A', primario: '#D97706', acento: '#0F766E' } };
    generar(new URL('..', import.meta.url).pathname, destino, pollo);
    const html = readFileSync(join(destino, 'index.html'), 'utf8');
    assert.ok(html.includes('Pollos La Esquina') && html.includes('wa.me/584141112233'));
    assert.ok(!html.includes('splash-overlay'), 'splash desactivado');
    assert.ok(!html.includes('584124652676'), 'no queda el número viejo');
    const css = readFileSync(join(destino, 'estilos.css'), 'utf8');
    assert.ok(css.includes('--primario:#D97706') || css.includes('--primario: #D97706'));
  } finally { rmSync(destino, { recursive: true, force: true }); }
});

test('generar falla si falta un asset obligatorio', () => {
  const destino = mkdtempSync(join(tmpdir(), 'replica-'));
  const origen = mkdtempSync(join(tmpdir(), 'origen-'));
  try {
    writeFileSync(join(origen, 'index.html'), 'x'); // origen sin img/
    assert.throws(() => generar(origen, destino, N), /asset obligatorio/);
  } finally { rmSync(destino, { recursive: true, force: true }); rmSync(origen, { recursive: true, force: true }); }
});

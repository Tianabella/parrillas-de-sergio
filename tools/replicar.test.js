// tools/replicar.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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

import { render, recortarBloque, valores } from './replicar.js';

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

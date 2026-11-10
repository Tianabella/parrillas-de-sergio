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

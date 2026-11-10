# Kit de réplica 100% parametrizable — Sistema de pedidos Implementation Plan (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir `parrillas-de-sergio` en una plantilla por **tokens**: el operador solo pide al negocio su logo, nombre, colores, productos y contactos, llena un `negocio.json`, y ejecuta un comando que genera el sitio completo — incluida la animación de inicio (activar/desactivar/personalizar) — sin tocar código.

**Architecture:** El sitio vivo se convierte en plantillas (`*.plantilla.*`) con tokens `{{TOKEN}}` y marcadores de bloque `<!-- SPLASH:INICIO -->…<!-- SPLASH:FIN -->`. Un generador Node ESM (`tools/replicar.js`, cero dependencias) sustituye tokens, recorta bloques opcionales, valida assets (existencia y dimensiones) y falla ruidoso ante cualquier token sin valor. El backend Cloud Run queda fuera de alcance (bloqueante documentado en el runbook).

**Tech Stack:** Node 20+ (`node:test`), JavaScript vanilla, CSS custom properties, GitHub Pages + Cloud Run, PostHog.

## Global Constraints

- Cero dependencias nuevas: solo `node:fs`, `node:path`, `node:test`.
- El navegador solo muestra precios; el servidor calcula el total real. El kit **nunca** escribe precios en el frontend (vienen de `/api/public/menu`).
- Toda plantilla debe compilar con los valores de `negocio.ejemplo.json` a un sitio **idéntico** al actual de Sergio (salvo tokens): esa es la prueba de regresión.
- Ningún token puede quedar sin sustituir en la salida: `generar()` lanza error.
- Commits por tarea. Textos de UI en español (es-VE); i18n ES/EN intacto.

**Diferencia con v1 (muerta por revisión del abogado del diablo):** v1 reemplazaba anclas de texto sobre el sitio vivo; v2 separa plantillas del sitio y parametriza colores, splash y assets. El sitio de Sergio pasa a generarse **desde** la plantilla, no al revés.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `negocio.ejemplo.json` | Contrato de configuración de un negocio (todos los campos) |
| `plantillas/index.plantilla.html` | HTML con tokens + marcadores de bloque SPLASH |
| `plantillas/estilos.plantilla.css` | CSS con colores movidos a `:root` como tokens |
| `plantillas/app.plantilla.js` | Lógica con tokens de título/tasa/localStorage |
| `plantillas/analitica.plantilla.js` | PostHog con token de sitio |
| `plantillas/config.plantilla.js` | API URL como token |
| `tools/replicar.js` | `render()`, `recortarBloque()`, `valores()`, `generar()` + CLI |
| `tools/replicar.test.js` | Pruebas con `node:test` sobre temporales |
| `docs/replica.md` | Runbook operativo punta a punta |

---

### Task 1: Esquema `negocio.ejemplo.json` (v2)

**Files:**
- Create: `negocio.ejemplo.json`
- Test: `tools/replicar.test.js`

**Interfaces:**
- Produces: campos que `valores()` consume — `slug`, `nombre`, `nombreCorto`, `lema`, `splash:{activado,titulo,lema,duracionMs}`, `colores:{fondo,texto,primario,acento}`, `whatsapp`, `instagram`, `sitioPosthog`, `apiUrl`, `tasaFallback`.

- [ ] **Step 1: Escribir la prueba que falla**

```js
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
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `node --test tools/replicar.test.js`
Expected: FAIL — `ENOENT … negocio.ejemplo.json`

- [ ] **Step 3: Crear el archivo con los valores reales de Sergio**

```json
{
  "slug": "parrillas-de-sergio",
  "nombre": "Las Parrillas de Sergio",
  "nombreCorto": "LAS PARRILLAS",
  "lema": "El sabor de la brasa.",
  "splash": { "activado": true, "titulo": "LAS PARRILLAS DE SERGIO", "lema": "El sabor de la brasa", "duracionMs": 4600 },
  "colores": { "fondo": "#F8F0E4", "texto": "#4A2516", "primario": "#C0392B", "acento": "#E8A317" },
  "whatsapp": "584124652676",
  "instagram": "lasparrillasdesergio",
  "sitioPosthog": "parrillas-de-sergio",
  "apiUrl": "",
  "tasaFallback": 886.23
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `node --test tools/replicar.test.js`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add negocio.ejemplo.json tools/replicar.test.js
git commit -m "feat: contrato de negocio v2 (marca, splash, colores, contacto, API)"
```

---

### Task 2: Núcleo del generador — `render()` y `recortarBloque()`

**Files:**
- Create: `tools/replicar.js`
- Test: `tools/replicar.test.js`

**Interfaces:**
- Produces: `render(plantilla: string, valores: Record<string,string>) → string` (lanza si quedan tokens); `recortarBloque(html: string, nombre: string, conservar: boolean) → string`; `valores(negocio) → Record<string,string>`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
// añadir a tools/replicar.test.js
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
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `node --test tools/replicar.test.js`
Expected: FAIL — `Cannot find module './replicar.js'`

- [ ] **Step 3: Implementar**

```js
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
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `node --test tools/replicar.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add tools/replicar.js tools/replicar.test.js
git commit -m "feat: núcleo del generador (render, recortarBloque, valores)"
```

---

### Task 3: Plantillas pequeñas — config, analítica, app

**Files:**
- Create: `plantillas/config.plantilla.js`, `plantillas/analitica.plantilla.js`, `plantillas/app.plantilla.js`
- Modify: ninguno del sitio vivo (las plantillas son copias tokenizadas)
- Test: `tools/replicar.test.js`

**Interfaces:**
- Consumes: `render()`, `valores()` (Task 2)
- Produces: tokens `{{API_URL}}`, `{{SITIO_POSTHOG}}`, `{{NOMBRE}}`, `{{SLUG}}`, `{{TASA_FALLBACK}}` en sus archivos.

- [ ] **Step 1: Escribir la prueba que falla**

```js
// añadir a tools/replicar.test.js
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
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `node --test tools/replicar.test.js`
Expected: FAIL — `ENOENT … plantillas/config.plantilla.js`

- [ ] **Step 3: Crear las plantillas**

`plantillas/config.plantilla.js` — copia de `config.js` con:
```js
window.MRC = { api: '{{API_URL}}' };
```

`plantillas/analitica.plantilla.js` — copia exacta de `analitica.js` salvo la línea:
```js
posthog.register({ sitio: '{{SITIO_POSTHOG}}' });
```

`plantillas/app.plantilla.js` — copia exacta de `app.js` salvo dos líneas:
```js
let tasaBCV = Number(leer('{{SLUG}}_tasa_bcv', {{TASA_FALLBACK}})) || {{TASA_FALLBACK}};
```
y en `cerrarSeguimiento()`:
```js
document.title = '{{NOMBRE}} · Carta';
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `node --test tools/replicar.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add plantillas/config.plantilla.js plantillas/analitica.plantilla.js plantillas/app.plantilla.js tools/replicar.test.js
git commit -m "feat: plantillas tokenizadas de config, analítica y app"
```

> **Enmienda post-revisión (Task 3):** además de las líneas del Step 3, tokenizar en `app.plantilla.js`:
> 1. `guardar('sergio_tasa_bcv', tasaBCV)` → `guardar('{{SLUG}}_tasa_bcv', tasaBCV)` — sin esto la réplica lee y escribe claves distintas de tasa (regresión funcional).
> 2. `` document.title = `¡#${d.numero}! · Las Parrillas de Sergio` `` (en `pintarSeguimiento()`) → `` `¡#${d.numero}! · {{NOMBRE}}` `` — el nombre de Sergio quedaba visible al marcar el pedido "listo".
> El test de la Task 3 debe además afirmar que la salida compilada contiene `guardar('parrillas-de-sergio_tasa_bcv'`.

---

### Task 4: Plantilla del HTML — marca, contacto y splash opcional

**Files:**
- Create: `plantillas/index.plantilla.html`
- Test: `tools/replicar.test.js`

**Interfaces:**
- Consumes: `render()`, `recortarBloque()`, `valores()`
- Produces: tokens `{{NOMBRE}}`, `{{NOMBRE_CORTO}}`, `{{LEMA}}`, `{{WHATSAPP}}`, `{{WHATSAPP_BONITO}}`, `{{INSTAGRAM}}`, `{{SPLASH_TITULO}}`, `{{SPLASH_LEMA}}`, `{{SPLASH_DURACION}}`; bloques `SPLASH` (el div `.splash-overlay`) y `SPLASH_SCRIPT` (el `<script>` inline del final).

- [ ] **Step 1: Escribir la prueba que falla**

```js
// añadir a tools/replicar.test.js
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
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `node --test tools/replicar.test.js`
Expected: FAIL — `ENOENT … plantillas/index.plantilla.html`

- [ ] **Step 3: Crear la plantilla**

Copiar `index.html` y aplicar exactamente estos cambios:
1. Envolver el `<div class="splash-overlay" …>…</div>` entre `<!-- SPLASH:INICIO -->` y `<!-- SPLASH:FIN -->`; dentro, `data-txt="{{SPLASH_TITULO}}"` y el contenido del `<p class="splash-titulo">` → `{{SPLASH_TITULO}}`, y el `<p class="splash-lema">` → `{{SPLASH_LEMA}}`.
2. Envolver el `<script>(function() { const splash = … })();</script>` del final entre `<!-- SPLASH_SCRIPT:INICIO -->` y `<!-- SPLASH_SCRIPT:FIN -->`, y dentro cambiar `setTimeout(despedirSplash, 4600)` por `setTimeout(despedirSplash, {{SPLASH_DURACION}})`.
3. `<title>{{NOMBRE}} · Carta</title>` y los `og:*`/descripción con `{{NOMBRE}}` y `{{LEMA}}`.
4. Marca web: `{{NOMBRE_CORTO}}<small>…` → el `<small>` lleva el resto del nombre; marca app y saludo con `{{NOMBRE}}` / `{{LEMA}}`.
5. Contacto: `https://wa.me/{{WHATSAPP}}`, aria-label y detalle con `{{WHATSAPP_BONITO}}`; `https://instagram.com/{{INSTAGRAM}}` y `@{{INSTAGRAM}}`.
6. Dejar intacta la firma del footer (`Menú creado por Sebastian Abella`).

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `node --test tools/replicar.test.js`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add plantillas/index.plantilla.html tools/replicar.test.js
git commit -m "feat: plantilla HTML con splash opcional y marca parametrizada"
```

---

### Task 5: Colores como variables CSS

**Files:**
- Create: `plantillas/estilos.plantilla.css`
- Test: `tools/replicar.test.js`

**Interfaces:**
- Consumes: `render()`, `valores()`
- Produces: tokens `{{COLOR_FONDO}}`, `{{COLOR_TEXTO}}`, `{{COLOR_PRIMARIO}}`, `{{COLOR_ACENTO}}` en un `:root` al inicio; el resto del CSS usa `var(--*)`.

- [ ] **Step 1: Inventario de colores del CSS actual**

Run: `grep -oE '#[0-9A-Fa-f]{6}' estilos.css | sort | uniq -c | sort -rn | head -15`
Expected: lista de los hex dominantes (fondo crema, marrón texto, rojo, mostaza). Anotar los 4 que serán variables.

- [ ] **Step 2: Escribir la prueba que falla**

```js
// añadir a tools/replicar.test.js
test('estilos compilan con la paleta del negocio', () => {
  const css = render(readFileSync(URLS('../plantillas/estilos.plantilla.css'), 'utf8'), valores(N));
  assert.ok(css.includes(':root{') || css.includes(':root {'));
  assert.ok(css.includes('--fondo:#F8F0E4') || css.includes('--fondo: #F8F0E4'));
  assert.ok(css.includes('var(--primario)'), 'el cuerpo debe usar var(--primario)');
  assert.ok(!css.includes('{{'));
});
```

- [ ] **Step 3: Ejecutar y verificar que falla**

Run: `node --test tools/replicar.test.js`
Expected: FAIL — `ENOENT … plantillas/estilos.plantilla.css`

- [ ] **Step 4: Crear la plantilla**

Copiar `estilos.css` a `plantillas/estilos.plantilla.css` y:
1. Insertar al inicio:
```css
:root{--fondo:{{COLOR_FONDO}};--texto:{{COLOR_TEXTO}};--primario:{{COLOR_PRIMARIO}};--acento:{{COLOR_ACENTO}};}
```
2. Reemplazar en el cuerpo cada aparición del hex de fondo por `var(--fondo)`, del hex de texto por `var(--texto)`, del rojo por `var(--primario)`, del mostaza por `var(--acento)` (usar los hex exactos del inventario del Step 1; los `rgba(74,37,22,…)` derivados del marrón quedan como están — son sombras, fuera de alcance).

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `node --test tools/replicar.test.js`
Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add plantillas/estilos.plantilla.css tools/replicar.test.js
git commit -m "feat: paleta del negocio como variables CSS parametrizadas"
```

---

### Task 6: `generar()` — ensamblado completo + validación de assets

**Files:**
- Modify: `tools/replicar.js`
- Test: `tools/replicar.test.js`

**Interfaces:**
- Consumes: todo lo anterior
- Produces: `generar(origenDir, destinoDir, negocio) → void` y CLI `node tools/replicar.js <negocio.json> <destino>`. Valida que existan `img/logo-chef.png`, `img/hero/hero-1..4.jpg` en el destino.

- [ ] **Step 1: Escribir la prueba que falla**

```js
// añadir a tools/replicar.test.js
import { generar } from './replicar.js';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `node --test tools/replicar.test.js`
Expected: FAIL — `generar is not a function`

- [ ] **Step 3: Implementar `generar()` y el CLI**

```js
// añadir a tools/replicar.js
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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
```

- [ ] **Step 4: Ejecutar y verificar que pasan**

Run: `node --test tools/replicar.test.js`
Expected: PASS (9 tests)

- [ ] **Step 5: Prueba de regresión — el ejemplo reproduce a Sergio**

Run: `node tools/replicar.js negocio.ejemplo.json /tmp/replica-sergio && diff <(sed 's/{{[^}]*}}//g' plantillas/index.plantilla.html | head -0) /dev/null >/dev/null; grep -c "Las Parrillas de Sergio" /tmp/replica-sergio/index.html`
Expected: el sitio generado contiene la marca de Sergio, el splash activo y cero tokens `{{` residuales (`grep -c '{{' /tmp/replica-sergio/index.html` → 0).

- [ ] **Step 6: Commit**

```bash
git add tools/replicar.js tools/replicar.test.js
git commit -m "feat: generador completo con validación de assets y CLI"
```

> **Enmienda post-revisión (Task 6):** el filtro de `cpSync` debe excluir también `.superpowers` (los artefactos del plan no pueden terminar en el sitio de un cliente). Regex corregido: `/\.git|node_modules|plantillas|tools|docs|\.superpowers|negocio\.ejemplo\.json/`.

---

### Task 7: Runbook operativo `docs/replica.md`

**Files:**
- Create: `docs/replica.md`

**Interfaces:**
- Consumes: Tasks 1–6. No produce código.

- [ ] **Step 1: Escribir el runbook** con este contenido:

```markdown
# Réplica de punta a punta (por negocio)

## 0. Lo que le pides al negocio (nada más)
Logo (PNG cuadrado), nombre, lema, 4 colores (o "usa los míos"), WhatsApp,
Instagram, menú con precios en USD, 4 fotos de portada + 1 por plato.

## 1. Configurar
Copiar negocio.ejemplo.json → <slug>.json y llenar todo. splash.activado=false
si el negocio no quiere animación de inicio.

## 2. Generar
node tools/replicar.js <slug>.json ../<slug>

## 3. Backend (BLOQUEANTE — ver "La que lo mata" en el plan)
El menú y pedidos los sirve Cloud Run. Sin negocio creado en el panel y apiUrl
apuntando al servicio, la réplica muestra "No pudimos cargar el menú".
Verificar: curl <apiUrl>/api/public/menu → {"ok":true,…}

## 4. Imágenes
Colocar en el destino: img/logo-chef.png, img/hero/hero-1..4.jpg,
img/platos/<slug-plato>.jpg, img/secciones/*.jpg. Nombres exactos.

## 5. Publicar y QR
Repo nuevo + GitHub Pages (o el dominio del servicio Cloud Run si el backend
sirve la landing). Regenerar qr.png y cartel-qr.png contra la URL final.
Verificar escaneando con un teléfono real.

## 6. Prueba de pedido (la que importa)
2 platos con opciones → quitar ingrediente → nota → nombre + teléfono 10 dígitos
→ enviar → panel: recibido → en cocina → listo → entregado. Totales iguales
en cliente y panel (el servidor manda).

## 7. Analítica y entrega
PostHog filtrado por sitio=<slug>: visita, scroll 100%, whatsapp_click ≤ 5 min.
Capacitar al dueño: agotados, precios, pedidos.
```

- [ ] **Step 2: Verificación manual del flujo completo**

Run: `node --test && node tools/replicar.js negocio.ejemplo.json /tmp/replica-final`
Expected: 9 tests PASS + sitio generado sin errores.

- [ ] **Step 3: Commit**

```bash
git add docs/replica.md
git commit -m "docs: runbook de réplica punta a punta (v2 parametrizada)"
```

---

## Revisión del abogado del diablo — estado tras v2

| Grieta v1 | Estado en v2 |
|---|---|
| Backend fuera del repo / titularidad MR CRIOLLO | **Sigue abierta** — es bloqueo comercial, no técnico. Runbook §3 lo declara bloqueante. Resolver antes de vender. |
| Anclas de texto frágiles | Cerrada: plantillas con tokens separadas del sitio vivo; token residual = error. |
| Colores/splash/assets no parametrizados | Cerrada: variables CSS (T5), splash opcional con textos y duración (T4), assets validados (T6). |
| Competidor gratis (WhatsApp Business) | Fuera de alcance técnico: nicho declarado = pyme de comida VE, pago al recoger. Vender solo ahí. |

## Self-Review (writing-plans)

- **Cobertura:** "todo editable" → tokens de marca/contacto (T4), colores (T5), splash (T4), assets (T6), menú vía backend (runbook §3). ✅
- **Placeholders:** ninguno; cada paso tiene código, comando y salida esperada. La única incógnita son los 4 hex exactos de `estilos.css`, resuelta con el comando de inventario en T5-S1. ✅
- **Consistencia:** `render`, `recortarBloque`, `valores`, `generar` y los nombres de tokens son idénticos en todas las tareas y pruebas. ✅

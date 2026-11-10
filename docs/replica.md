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

// POS-iaDoS Relay — Cloudflare Worker
// Sirve como puente entre el POS local y los clientes en internet.
// KV namespace binding: POS_RELAY
//
// Endpoints:
//   POST /sync/:slug          — POS sube snapshot (api_key en body)
//   GET  /snapshot/:slug      — JSON snapshot público
//   GET  /menu/:slug          — Página HTML del menú (solo consulta)
//   GET  /s/:slug/:mesa       — Página HTML self-order (con carrito)
//   POST /order/:slug/:mesa   — Cliente envía pedido
//   GET  /orders/:slug        — POS descarga pedidos pendientes (x-api-key header)
//   POST /orders/:slug/:id/ack — POS confirma recepción del pedido (x-api-key header)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  });
}

function htmlRes(body, status = 200) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeJson(obj) {
  return JSON.stringify(obj).replace(/<\/script>/gi, '<\\/script>');
}

async function getSnap(env, slug) {
  const raw = await env.POS_RELAY.get('snap:' + slug);
  return raw ? JSON.parse(raw) : null;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    const url = new URL(request.url);
    const parts = url.pathname.replace(/^\/+/, '').split('/');
    const [route, p1, p2, p3] = parts;

    try {
      if (route === 'sync')     return handleSync(request, env, p1);
      if (route === 'snapshot') return handleSnapshot(env, p1);
      if (route === 'menu')     return handleMenuPage(request, env, p1);
      if (route === 's')        return handleSelfOrderPage(request, env, p1, p2);
      if (route === 'order')    return handleCreateOrder(request, env, p1, p2);
      if (route === 'orders') {
        if (p3 === 'ack') return handleAckOrder(request, env, p1, p2);
        return handleGetOrders(request, env, p1);
      }
      if (route === 'img') {
        if (request.method === 'PUT') return handlePutImage(request, env, p1);
        return handleGetImage(env, p1);
      }
      return jsonRes({ service: 'POS-iaDoS Relay', version: '1.0' });
    } catch (e) {
      return jsonRes({ error: e.message }, 500);
    }
  },
};

// ─────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────

async function handleSync(request, env, slug) {
  const body = await request.json();
  if (!body.api_key) return jsonRes({ error: 'api_key requerido' }, 400);
  await env.POS_RELAY.put('snap:' + slug, JSON.stringify(body), {
    expirationTtl: 86400 * 30,
  });
  return jsonRes({ ok: true });
}

async function handleSnapshot(env, slug) {
  const snap = await getSnap(env, slug);
  if (!snap) return jsonRes({ error: 'Menu no encontrado' }, 404);
  const { api_key, ...pub } = snap;
  return jsonRes(pub);
}

async function handleMenuPage(request, env, slug) {
  const snap = await getSnap(env, slug);
  if (!snap) return htmlRes(errorHtml('Menú no disponible', 'Este enlace no es válido o el menú fue desactivado.'), 404);
  if (!snap.is_active) return htmlRes(errorHtml('Menú inactivo', 'Este menú está temporalmente desactivado.'), 404);
  return htmlRes(buildMenuHtml(snap));
}

async function handleSelfOrderPage(request, env, slug, mesa) {
  const snap = await getSnap(env, slug);
  if (!snap) return htmlRes(errorHtml('Mesa no disponible', 'Este enlace no es válido.'), 404);
  if (!snap.is_active) return htmlRes(errorHtml('Servicio no disponible', 'El restaurante tiene el servicio temporalmente desactivado.'), 404);
  return htmlRes(buildSelfOrderHtml(snap, slug, mesa, new URL(request.url).origin));
}

async function handleCreateOrder(request, env, slug, mesa) {
  const snap = await getSnap(env, slug);
  if (!snap) return jsonRes({ error: 'Tienda no encontrada' }, 404);
  if (!snap.is_active) return jsonRes({ error: 'Servicio no disponible' }, 400);

  const body = await request.json();
  if (!body.items?.length) return jsonRes({ error: 'Carrito vacío' }, 400);
  if (!body.cliente_nombre?.trim()) return jsonRes({ error: 'Nombre requerido' }, 400);

  const id = crypto.randomUUID();
  const ts = Date.now();

  const order = {
    id,
    slug,
    mesa_numero: isNaN(Number(mesa)) ? mesa : Number(mesa),
    cliente_nombre: body.cliente_nombre.trim(),
    items: body.items,
    subtotal: body.total,
    total: body.total,
    notas: body.notas || null,
    created_at: new Date(ts).toISOString(),
    status: 'pending',
  };

  // Clave con timestamp para ordenar cronológicamente
  const key = 'ord:' + slug + ':' + String(ts).padStart(16, '0') + ':' + id;
  await env.POS_RELAY.put(key, JSON.stringify(order), { expirationTtl: 86400 });

  // Push inmediato al backend (más rápido que esperar polling)
  if (snap.cloud_url) {
    try {
      const api = snap.cloud_url.replace(/\/$/, '');
      const r = await fetch(`${api}/api/public/self-order/s/${encodeURIComponent(slug)}/${order.mesa_numero}/pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_nombre: order.cliente_nombre,
          items: order.items,
          subtotal: order.total,
          total: order.total,
          notas: order.notas,
        }),
      });
      if (r.ok) {
        // ACK inmediato — el polling no necesita procesarlo
        await env.POS_RELAY.delete(key);
      }
    } catch {
      // Backend unreachable — polling lo jalará después
    }
  }

  return jsonRes({ ok: true, id, numero: id.slice(0, 6).toUpperCase() });
}

async function handleGetOrders(request, env, slug) {
  const snap = await getSnap(env, slug);
  if (!snap) return jsonRes({ error: 'Tienda no encontrada' }, 404);

  const apiKey = request.headers.get('x-api-key');
  if (snap.api_key !== apiKey) return jsonRes({ error: 'API key inválida' }, 401);

  const list = await env.POS_RELAY.list({ prefix: 'ord:' + slug + ':' });
  const orders = await Promise.all(
    list.keys.map(async (k) => {
      const val = await env.POS_RELAY.get(k.name);
      return val ? JSON.parse(val) : null;
    })
  );
  return jsonRes(orders.filter(Boolean));
}

async function handleAckOrder(request, env, slug, orderId) {
  const snap = await getSnap(env, slug);
  if (!snap) return jsonRes({ error: 'Tienda no encontrada' }, 404);

  const apiKey = request.headers.get('x-api-key');
  if (snap.api_key !== apiKey) return jsonRes({ error: 'API key inválida' }, 401);

  const list = await env.POS_RELAY.list({ prefix: 'ord:' + slug + ':' });
  for (const k of list.keys) {
    const val = await env.POS_RELAY.get(k.name);
    if (val && JSON.parse(val).id === orderId) {
      await env.POS_RELAY.delete(k.name);
      return jsonRes({ ok: true });
    }
  }
  return jsonRes({ error: 'Pedido no encontrado' }, 404);
}

// ─────────────────────────────────────────────
// Image handlers
// ─────────────────────────────────────────────

async function handleGetImage(env, hash) {
  if (!hash) return new Response('Not found', { status: 404 });
  const kv = await env.POS_RELAY.getWithMetadata('img:' + hash, { type: 'arrayBuffer' });
  if (!kv.value) return new Response('Not found', { status: 404 });
  return new Response(kv.value, {
    headers: {
      'Content-Type': kv.metadata?.ct || 'image/jpeg',
      'Cache-Control': 'public, max-age=2592000',
      ...CORS,
    },
  });
}

async function handlePutImage(request, env, hash) {
  if (!hash) return jsonRes({ error: 'hash requerido' }, 400);
  const ct = request.headers.get('content-type') || 'image/jpeg';
  const body = await request.arrayBuffer();
  if (!body.byteLength) return jsonRes({ error: 'body vacío' }, 400);
  await env.POS_RELAY.put('img:' + hash, body, {
    expirationTtl: 86400 * 90,
    metadata: { ct },
  });
  return jsonRes({ ok: true, hash, url: '/img/' + hash });
}

// ─────────────────────────────────────────────
// HTML helpers
// ─────────────────────────────────────────────

const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0f172a;--card:#1e293b;--border:#334155;--accent:#6366f1;--green:#4ade80;--text:#f1f5f9;--muted:#94a3b8}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh}
img{display:block}
button{cursor:pointer;font-family:inherit}
a{color:var(--accent)}
`;

function errorHtml(title, msg) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${BASE_CSS}
.box{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center}
h1{font-size:22px;font-weight:800;margin-bottom:8px}p{color:var(--muted);font-size:14px}
</style></head><body><div class="box"><div style="font-size:48px;margin-bottom:16px">🍽️</div>
<h1>${esc(title)}</h1><p>${esc(msg)}</p></div></body></html>`;
}

function isAbsUrl(u) { return u && (u.startsWith('http://') || u.startsWith('https://')); }

function productCardHtml(p, withCart) {
  const img = isAbsUrl(p.imagen_url)
    ? `<img src="${esc(p.imagen_url)}" alt="${esc(p.nombre)}" class="p-img" loading="lazy" onerror="this.style.display='none'">`
    : `<div class="p-img p-ph">🍽️</div>`;
  const actions = withCart
    ? `<div class="qty-wrap" id="qty-${p.id}"><button class="btn-add" onclick="add(${p.id})">+ Agregar</button></div>`
    : '';
  return `<div class="p-card">
  ${img}
  <div class="p-info">
    <div class="p-name">${esc(p.nombre)}</div>
    ${p.descripcion ? `<div class="p-desc">${esc(p.descripcion)}</div>` : ''}
    <div class="p-price">$${Number(p.precio).toFixed(2)}</div>
    ${actions}
  </div>
</div>`;
}

function categorySections(snap, withCart) {
  return snap.categorias.map(cat => {
    const prods = snap.productos.filter(p => p.categoria_id === cat.id);
    if (!prods.length) return '';
    return `<section class="cat-sec" id="cat-${cat.id}" data-cat="${cat.id}">
  <div class="sec-title">${esc(cat.nombre)}</div>
  <div class="p-grid">${prods.map(p => productCardHtml(p, withCart)).join('')}</div>
</section>`;
  }).join('');
}

function buildMenuHtml(snap) {
  const { tienda, categorias } = snap;
  const catTabs = categorias.map(c =>
    `<button class="cat-btn" data-id="${c.id}" onclick="goTo('cat-${c.id}',this)">${esc(c.nombre)}</button>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>${esc(tienda.nombre)} — Menú</title>
<style>
${BASE_CSS}
header{background:var(--card);border-bottom:1px solid var(--border);padding:12px 16px;position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:10px}
.logo{height:36px;border-radius:6px;object-fit:contain}
.t-name{font-weight:700;font-size:15px}.t-sub{font-size:11px;color:var(--muted)}
.cats{display:flex;gap:8px;padding:10px 16px;overflow-x:auto;scrollbar-width:none;background:var(--card);position:sticky;top:61px;z-index:9;border-bottom:1px solid var(--border)}
.cats::-webkit-scrollbar{display:none}
.cat-btn{padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--muted);white-space:nowrap;font-size:13px;transition:all .15s}
.cat-btn:hover,.cat-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}
.sec-title{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;padding:16px 16px 8px}
.p-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px 16px}
.p-card{background:var(--card);border-radius:12px;overflow:hidden}
.p-img{width:100%;aspect-ratio:1;object-fit:cover;background:var(--border)}
.p-ph{display:flex;align-items:center;justify-content:center;font-size:32px;color:var(--muted)}
.p-info{padding:10px}
.p-name{font-size:13px;font-weight:600;line-height:1.3;margin-bottom:4px}
.p-desc{font-size:11px;color:var(--muted);margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3}
.p-price{font-size:15px;font-weight:700;color:var(--green)}
footer{text-align:center;padding:24px 16px;color:var(--muted);font-size:11px}
</style>
</head>
<body>
<header>
  ${isAbsUrl(tienda.logo_url) ? `<img src="${esc(tienda.logo_url)}" class="logo" alt="logo">` : ''}
  <div><div class="t-name">${esc(tienda.nombre)}</div><div class="t-sub">${esc(tienda.empresa_nombre || '')}</div></div>
</header>
<nav class="cats">
  <button class="cat-btn active" data-id="all" onclick="goTo(null,this)">Todos</button>
  ${catTabs}
</nav>
${categorySections(snap, false)}
<footer>Powered by POS-iaDoS</footer>
<script>
function goTo(id, btn){
  document.querySelectorAll('.cat-btn').forEach(function(b){b.classList.remove('active')});
  if(btn) btn.classList.add('active');
  if(!id){
    document.querySelectorAll('.cat-sec').forEach(function(s){s.style.display='';});
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }
  document.querySelectorAll('.cat-sec').forEach(function(s){s.style.display='';});
  var el=document.getElementById(id);
  if(el){var top=el.getBoundingClientRect().top+window.scrollY-120;window.scrollTo({top:top,behavior:'smooth'});}
}
var obs=new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(e.isIntersecting){
      var id=e.target.id.replace('cat-','');
      document.querySelectorAll('.cat-btn').forEach(function(b){b.classList.toggle('active',b.dataset.id===id)});
    }
  });
},{rootMargin:'-120px 0px -60% 0px'});
document.querySelectorAll('.cat-sec').forEach(function(s){obs.observe(s)});
</script>
</body>
</html>`;
}

function buildSelfOrderHtml(snap, slug, mesa, workerOrigin) {
  const { tienda, categorias } = snap;

  const catTabs = categorias.map(c =>
    `<button class="cat-btn" data-id="${c.id}" onclick="filterCat(${c.id})">${esc(c.nombre)}</button>`
  ).join('');

  // Productos renderizados server-side (igual que buildMenuHtml) — sin dependencia de JS
  const menuBody = categorySections(snap, true);

  // Solo los datos de precio/nombre/sku necesarios para el carrito (no categorías)
  const cartData = safeJson(snap.productos.map(p => ({
    id: p.id, nombre: p.nombre, sku: p.sku || null, precio: Number(p.precio)
  })));

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Mesa ${esc(String(mesa))} — ${esc(tienda.nombre)}</title>
<style>
${BASE_CSS}
header{background:var(--card);border-bottom:1px solid var(--border);padding:12px 16px;position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between}
.logo{height:32px;border-radius:6px;object-fit:contain}
.t-name{font-weight:700;font-size:14px}.t-sub{font-size:11px;color:var(--muted)}
.mesa-badge{background:var(--accent);color:#fff;padding:3px 12px;border-radius:20px;font-size:13px;font-weight:700;white-space:nowrap}
.cats{display:flex;gap:8px;padding:10px 16px;overflow-x:auto;scrollbar-width:none;background:var(--card);position:sticky;top:57px;z-index:9;border-bottom:1px solid var(--border)}
.cats::-webkit-scrollbar{display:none}
.cat-btn{padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--muted);white-space:nowrap;font-size:13px;transition:all .15s}
.cat-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}
.steps{display:flex;padding:10px 16px;background:var(--card);border-bottom:1px solid var(--border)}
.step{flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative;padding:0 2px}
.step-icon{width:26px;height:26px;border-radius:50%;background:var(--border);color:var(--muted);font-size:11px;display:flex;align-items:center;justify-content:center;margin-bottom:3px;transition:all .25s;font-weight:700}
.step-lbl{font-size:9px;color:var(--muted);line-height:1.2;transition:color .25s}
.step.active .step-icon{background:var(--accent);color:#fff;box-shadow:0 0 0 3px rgba(99,102,241,.25)}
.step.active .step-lbl{color:var(--text);font-weight:600}
.step.done .step-icon{background:#22c55e;color:#fff}
.step.done .step-lbl{color:#4ade80}
.sec-title{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;padding:16px 16px 8px}
.p-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px 16px}
.p-card{background:var(--card);border-radius:12px;overflow:hidden}
.p-img{width:100%;aspect-ratio:1;object-fit:cover;background:var(--border)}
.p-ph{display:flex;align-items:center;justify-content:center;font-size:32px;color:var(--muted)}
.p-info{padding:10px}
.p-name{font-size:13px;font-weight:600;line-height:1.3;margin-bottom:4px}
.p-desc{font-size:11px;color:var(--muted);margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3}
.p-price{font-size:15px;font-weight:700;color:var(--green)}
.qty-wrap{margin-top:8px}
.btn-add{width:100%;padding:7px 0;border-radius:8px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:600;cursor:pointer}
.qty-ctrl{display:flex;align-items:center;gap:8px;justify-content:center}
.qty-btn{width:30px;height:30px;border-radius:8px;border:none;background:var(--accent);color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer}
.qty-num{font-weight:700;min-width:20px;text-align:center}
.fab{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;border:none;border-radius:40px;padding:14px 24px;font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(99,102,241,.5);z-index:20;white-space:nowrap;cursor:pointer}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:30;display:none}
.panel{position:fixed;bottom:0;left:0;right:0;background:var(--card);border-radius:20px 20px 0 0;z-index:31;padding:20px 16px 16px;max-height:85vh;display:flex;flex-direction:column;transform:translateY(100%);transition:transform .3s ease}
.panel.open{transform:translateY(0)}
.panel-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.close-btn{width:32px;height:32px;border-radius:50%;background:var(--border);border:none;color:var(--text);font-size:20px;display:flex;align-items:center;justify-content:center;cursor:pointer}
.cart-list{flex:1;overflow-y:auto;margin-bottom:12px}
.ci{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)}
.ci-name{font-size:13px;font-weight:600}.ci-price{font-size:12px;color:var(--muted)}
.total-row{font-size:18px;font-weight:700;text-align:right;margin-bottom:14px}
.total-row span{color:var(--green)}
.lbl{font-size:12px;color:var(--muted);margin-bottom:4px;display:block}
.inp{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:10px 12px;color:var(--text);font-size:14px;margin-bottom:12px}
.btn-primary{width:100%;background:var(--accent);color:#fff;border:none;border-radius:12px;padding:14px;font-size:16px;font-weight:700;cursor:pointer}
.btn-primary:disabled{opacity:.5}
.confirm{text-align:center;padding:40px 16px}
footer{text-align:center;padding:16px;color:var(--muted);font-size:11px}
body{padding-bottom:80px}
</style>
</head>
<body>
<header>
  <div style="display:flex;align-items:center;gap:10px">
    ${isAbsUrl(tienda.logo_url) ? `<img src="${esc(tienda.logo_url)}" class="logo" alt="">` : ''}
    <div><div class="t-name">${esc(tienda.nombre)}</div><div class="t-sub">${esc(tienda.empresa_nombre || '')}</div></div>
  </div>
  <span class="mesa-badge">Mesa ${esc(String(mesa))}</span>
</header>
<nav class="cats">
  <button class="cat-btn active" data-id="all" onclick="filterCat('all')">Todos</button>
  ${catTabs}
</nav>
<div class="steps" id="steps">
  <div class="step active" id="step1"><div class="step-icon">1</div><div class="step-lbl">Elige tus platillos</div></div>
  <div class="step" id="step2"><div class="step-icon">2</div><div class="step-lbl">Revisa tu pedido</div></div>
  <div class="step" id="step3"><div class="step-icon">3</div><div class="step-lbl">Confirma y envía</div></div>
</div>
<div id="menu-body">
${menuBody}
</div>
<footer>Powered by POS-iaDoS</footer>
<button class="fab" id="fab" style="display:none" onclick="openCart()">
  <span>🛒</span><span id="fab-txt">Ver carrito</span>
</button>
<div class="overlay" id="overlay" onclick="closeCart()"></div>
<div class="panel" id="panel">
  <div class="panel-hdr">
    <h3 style="font-size:17px;font-weight:700">Tu pedido</h3>
    <button class="close-btn" onclick="closeCart()">×</button>
  </div>
  <div class="cart-list" id="cart-list"></div>
  <div class="total-row" id="total-row">Total: <span>$0.00</span></div>
  <label class="lbl">Tu nombre *</label>
  <input id="inp-nombre" class="inp" type="text" placeholder="¿Cómo te llamas?" autocomplete="given-name">
  <label class="lbl">Notas (opcional)</label>
  <input id="inp-notas" class="inp" type="text" placeholder="Sin cebolla, extra salsa...">
  <button id="btn-ok" class="btn-primary" onclick="submit()">Confirmar pedido</button>
</div>
<script>
var PRODS = ${cartData};
var SLUG = ${JSON.stringify(slug)};
var MESA = ${JSON.stringify(mesa)};
var WORKER = ${JSON.stringify(workerOrigin)};
var cart = {};
var cartOpened = false;

function p(id){return PRODS.find(function(x){return x.id===id});}
function qty(id){return cart[id]?cart[id].q:0;}
function total(){return Object.values(cart).reduce(function(s,i){return s+i.q*i.precio;},0);}
function count(){return Object.values(cart).reduce(function(s,i){return s+i.q;},0);}

function updateSteps(){
  var c=count();
  var s1=document.getElementById('step1');
  var s2=document.getElementById('step2');
  var s3=document.getElementById('step3');
  if(!s1)return;
  if(cartOpened){
    s1.className='step done';s2.className='step done';s3.className='step active';
  } else if(c>0){
    s1.className='step done';s2.className='step active';s3.className='step';
  } else {
    s1.className='step active';s2.className='step';s3.className='step';
  }
}

function add(id){
  var pr=p(id);if(!pr)return;
  if(!cart[id])cart[id]={id:pr.id,nombre:pr.nombre,sku:pr.sku||null,precio:pr.precio,q:0};
  cart[id].q++;
  refreshQty(id);refreshFab();updateSteps();
}
function rem(id){
  if(!cart[id])return;
  cart[id].q--;
  if(cart[id].q<=0)delete cart[id];
  refreshQty(id);refreshFab();updateSteps();
}
function refreshQty(id){
  var el=document.getElementById('qty-'+id);if(!el)return;
  var q=qty(id);
  if(q>0){
    el.innerHTML='<div class="qty-ctrl"><button class="qty-btn" onclick="rem('+id+')">−</button><span class="qty-num">'+q+'</span><button class="qty-btn" onclick="add('+id+')">+</button></div>';
  } else {
    el.innerHTML='<button class="btn-add" onclick="add('+id+')">+ Agregar</button>';
  }
}
function refreshFab(){
  var c=count();
  var fab=document.getElementById('fab');
  if(c>0){
    fab.style.display='flex';
    document.getElementById('fab-txt').textContent='Ver carrito ('+c+') — $'+total().toFixed(2);
  } else {
    fab.style.display='none';
  }
}

function filterCat(id){
  document.querySelectorAll('.cat-btn').forEach(function(b){b.classList.toggle('active',b.dataset.id==id);});
  document.querySelectorAll('.cat-sec').forEach(function(s){
    s.style.display=(id==='all'||s.dataset.cat==id)?'block':'none';
  });
}

function openCart(){
  cartOpened=true;updateSteps();
  renderCartList();
  document.getElementById('overlay').style.display='block';
  setTimeout(function(){document.getElementById('panel').classList.add('open');},10);
}
function closeCart(){
  document.getElementById('panel').classList.remove('open');
  setTimeout(function(){document.getElementById('overlay').style.display='none';},300);
}
function renderCartList(){
  var items=Object.values(cart);
  if(!items.length){
    document.getElementById('cart-list').innerHTML='<p style="color:var(--muted);text-align:center;padding:20px">Carrito vacío</p>';
    document.getElementById('total-row').innerHTML='Total: <span>$0.00</span>';
    return;
  }
  var h='';
  for(var i=0;i<items.length;i++){
    var it=items[i];
    h+='<div class="ci"><div><div class="ci-name">'+escHtml(it.nombre)+'</div><div class="ci-price">$'+Number(it.precio).toFixed(2)+' c/u</div></div>';
    h+='<div class="qty-ctrl"><button class="qty-btn" onclick="rem('+it.id+');renderCartList()">−</button><span class="qty-num">'+it.q+'</span><button class="qty-btn" onclick="add('+it.id+');renderCartList()">+</button></div></div>';
  }
  document.getElementById('cart-list').innerHTML=h;
  document.getElementById('total-row').innerHTML='Total: <span>$'+total().toFixed(2)+'</span>';
}
function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

async function submit(){
  var nombre=document.getElementById('inp-nombre').value.trim();
  var notas=document.getElementById('inp-notas').value.trim();
  if(!nombre){alert('Por favor ingresa tu nombre');return;}
  if(!count()){alert('Agrega al menos un producto');return;}
  var btn=document.getElementById('btn-ok');
  btn.disabled=true;btn.textContent='Enviando...';
  var items=Object.values(cart).map(function(i){return{producto_id:i.id,nombre:i.nombre,sku:i.sku,precio:i.precio,cantidad:i.q};});
  try{
    var res=await fetch(WORKER+'/order/'+SLUG+'/'+MESA,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({cliente_nombre:nombre,items:items,total:total(),notas:notas||null})
    });
    var data=await res.json();
    if(!res.ok)throw new Error(data.error||'Error al enviar');
    closeCart();
    document.getElementById('menu-body').innerHTML=
      '<div class="confirm"><div style="font-size:64px;margin-bottom:16px">&#x2705;</div>'+
      '<h2 style="font-size:22px;font-weight:800;margin-bottom:8px">&#xA1;Pedido enviado!</h2>'+
      '<p style="color:var(--muted);margin-bottom:16px">Tu pedido ya est&#xE1; en camino.</p>'+
      '<div style="background:var(--card);border-radius:12px;display:inline-block;padding:16px 32px">'+
      '<p style="font-size:11px;color:var(--muted)">N&#xFA;mero de pedido</p>'+
      '<p style="font-size:32px;font-weight:900;color:var(--accent)">'+data.numero+'</p></div>'+
      '<p style="color:var(--muted);font-size:13px;margin-top:16px">Mesa '+MESA+' &middot; '+escHtml(nombre)+'</p></div>';
    document.getElementById('fab').style.display='none';
    document.querySelectorAll('.cats,.steps,footer').forEach(function(e){e.style.display='none';});
  }catch(e){
    btn.disabled=false;btn.textContent='Confirmar pedido';
    alert('Error: '+e.message);
  }
}
</script>
</body>
</html>`;
}

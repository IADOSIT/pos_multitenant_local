import{c as A,u as L,r as o,N as $,l as T,j as e,W as B,X as q,V as S,n as I,af as D}from"./index-CJ6mLCfg.js";import{s as K}from"./puenteLocal-xC1wHQ_h.js";import{e as O}from"./ean13-nDy4hHOn.js";import{S as z}from"./search-dESsrkgl.js";import{S as R}from"./shopping-basket-4ujuP0pS.js";import{P as V}from"./printer-D1ag8ITw.js";import{C as W}from"./check-circle-CEDj9gKD.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=A("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);function U(s){var j;const a=s.label_width_mm||50,n=s.label_height_mm||25,r=Math.max(a,n),d=Math.min(a,n),c=document.createElement("iframe");c.style.cssText="position:fixed;top:-10000px;left:-10000px;width:0;height:0;",document.body.appendChild(c);const b=u=>String(u).replace(/</g,"&lt;").replace(/>/g,"&gt;"),y=Math.max(20,r-5),v=Math.min(12,Math.max(6,Math.round(d*.3))),f=O(s.barcode,`${y}mm`,`${v}mm`),m=Math.min(1.2,Math.max(.72,r/50)),h=u=>`${(u*m).toFixed(1)}pt`,x=`<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: ${r}mm ${d}mm landscape; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 1.2mm 2mm;
    width: ${r}mm;
    height: ${d}mm;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    overflow: hidden;
  }
  .nombre {
    font-size: ${h(8)};
    font-weight: bold;
    line-height: 1.05;
    max-height: 2.1em;
    overflow: hidden;
  }
  /* Fila horizontal: a la izquierda el peso por precio, a la derecha el importe. */
  .fila {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1.5mm;
  }
  .detalle { font-size: ${h(7)}; white-space: nowrap; overflow: hidden; }
  .total { font-size: ${h(13)}; font-weight: bold; line-height: 1; white-space: nowrap; }
  .barras { flex-shrink: 0; margin-top: auto; }
  .codigo { font-size: ${h(6)}; letter-spacing: 0.4px; line-height: 1.4; }
  svg { display: block; margin: 0 auto; }
</style>
</head>
<body>
  <div class="nombre">${b(s.producto_nombre)}</div>
  <div class="fila">
    <div class="detalle">${s.peso_kg.toFixed(3)} kg x $${Number(s.precio_kg).toFixed(2)}/kg</div>
    <div class="total">$${Number(s.precio_total).toFixed(2)}</div>
  </div>
  <div class="barras">
    ${f}
    <div class="codigo">${b(s.barcode)}</div>
  </div>
</body>
</html>`,p=c.contentDocument||((j=c.contentWindow)==null?void 0:j.document);if(!p){document.body.removeChild(c);return}p.open(),p.write(x),p.close(),setTimeout(()=>{var u;(u=c.contentWindow)==null||u.print(),setTimeout(()=>{try{document.body.removeChild(c)}catch{}},2e3)},250)}const G=[["1","2","3","4","5","6","7","8","9","0"],["Q","W","E","R","T","Y","U","I","O","P"],["A","S","D","F","G","H","J","K","L","Ñ"],["Z","X","C","V","B","N","M"]];function X({onKey:s,onBackspace:a,onSpace:n,onClose:r}){return e.jsx("div",{className:"fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t border-slate-700 p-3",children:e.jsxs("div",{className:"mx-auto w-full max-w-[1100px] space-y-2",children:[G.map((d,c)=>e.jsx("div",{className:"flex justify-center gap-1.5 md:gap-2",children:d.map(b=>e.jsx("button",{onClick:()=>s(b),className:"flex-1 basis-0 min-w-0 max-w-[96px] h-11 md:h-12 rounded-lg bg-slate-800 hover:bg-slate-700 text-base md:text-lg font-bold active:scale-95 transition-transform",children:b},b))},c)),e.jsxs("div",{className:"flex justify-center gap-1.5 md:gap-2",children:[e.jsx("button",{onClick:n,className:"flex-1 basis-0 min-w-0 max-w-[600px] h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-base font-bold",children:"Espacio"}),e.jsx("button",{onClick:a,className:"flex-1 basis-0 min-w-0 max-w-[150px] h-11 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center",children:e.jsx(D,{size:20})}),e.jsx("button",{onClick:r,className:"flex-1 basis-0 min-w-0 max-w-[200px] h-11 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-base font-bold",children:"Listo"})]})]})})}function ae(){const{user:s}=L(),a=s==null?void 0:s.tienda_id,[n,r]=o.useState("grid"),[d,c]=o.useState([]),[b,y]=o.useState(!0),[v,f]=o.useState(!1),[m,h]=o.useState(null),[x,p]=o.useState(0),[j,u]=o.useState(null),[g,N]=o.useState(""),[w,k]=o.useState(!1),F=o.useRef(null);o.useEffect(()=>{a&&$.getProductos(a).then(({data:t})=>c(t||[])).catch(()=>{}).finally(()=>y(!1))},[a]),o.useEffect(()=>{if(!a)return;const t="/api".replace("/api","")||"https://posapi.iados.online",i=T(`${t}/bascula`,{transports:["websocket"]});return F.current=i,i.on("connect",()=>{f(!0),i.emit("kiosk-join",{tienda_id:a})}),i.on("disconnect",()=>f(!1)),i.on("weight-update",l=>p(l.peso_kg||0)),()=>{i.disconnect()}},[a]),o.useEffect(()=>K(t=>{p(t.peso_kg||0),f(!0)}),[]);const _=o.useMemo(()=>{if(!g.trim())return d;const t=g.trim().toLowerCase();return d.filter(i=>i.nombre.toLowerCase().includes(t))},[d,g]),P=m?x*Number(m.precio):0,E=t=>{h(t),p(0),r("weighing")},C=()=>{r("grid"),h(null),u(null),p(0)},M=async()=>{var t,i;if(!(!m||!a||x<=0)){r("printing");try{const{data:l}=await $.registrarPesaje({tienda_id:a,producto_id:m.id,peso_kg:x});u({barcode:l.barcode,precio_total:l.precio_total}),l.printer_modo==="navegador"&&U({producto_nombre:l.producto_nombre??m.nombre,peso_kg:Number(l.peso_kg??x),precio_kg:Number(l.precio_kg??m.precio),precio_total:Number(l.precio_total),barcode:l.barcode,label_width_mm:l.label_width_mm,label_height_mm:l.label_height_mm}),r("done"),setTimeout(C,6e3)}catch(l){alert(((i=(t=l.response)==null?void 0:t.data)==null?void 0:i.message)||"Error al registrar el pesaje. Intenta de nuevo."),r("weighing")}}};return a?e.jsxs("div",{className:"min-h-screen bg-slate-950 text-white select-none",style:{fontFamily:"system-ui, sans-serif"},children:[e.jsxs("div",{className:"bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(B,{size:24,className:"text-amber-400"}),e.jsx("h1",{className:"text-xl font-bold",children:"Báscula — Frutas y Verduras"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:`w-2 h-2 rounded-full ${v?"bg-green-500":"bg-yellow-500 animate-pulse"}`}),e.jsx("span",{className:"text-xs text-slate-500",children:v?"Báscula conectada":"Conectando..."})]})]}),n==="grid"&&e.jsxs("div",{className:`p-6 ${w?"pb-64":""}`,children:[e.jsxs("div",{className:"relative max-w-md mx-auto mb-6",children:[e.jsx(z,{size:18,className:"absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"}),e.jsx("input",{value:g,onFocus:()=>k(!0),onChange:t=>N(t.target.value),readOnly:!0,placeholder:"Buscar producto...",className:"w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-11 py-3 text-base outline-none cursor-pointer"}),g&&e.jsx("button",{onClick:()=>N(""),className:"absolute right-4 top-1/2 -translate-y-1/2 text-slate-500",children:e.jsx(q,{size:18})})]}),b?e.jsx("div",{className:"flex items-center justify-center py-24 text-slate-500",children:e.jsx(S,{size:32,className:"animate-spin"})}):d.length===0?e.jsxs("div",{className:"flex flex-col items-center justify-center py-24 text-slate-500 gap-3",children:[e.jsx(R,{size:48,className:"opacity-30"}),e.jsx("p",{children:'No hay productos configurados como "vendido por kg" en esta tienda.'}),e.jsx("p",{className:"text-xs",children:'Configúralos en Catálogos → Productos, unidad "kg".'})]}):_.length===0?e.jsxs("div",{className:"flex flex-col items-center justify-center py-24 text-slate-500 gap-3",children:[e.jsx(z,{size:40,className:"opacity-30"}),e.jsxs("p",{children:['Sin resultados para "',g,'"']})]}):e.jsx("div",{className:"grid grid-cols-3 md:grid-cols-4 gap-4",children:_.map(t=>e.jsxs("button",{onClick:()=>E(t),className:"bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95",children:[t.imagen_url?e.jsx("img",{src:I(t.imagen_url),alt:t.nombre,className:"w-20 h-20 object-cover rounded-xl"}):e.jsx("div",{className:"w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center text-3xl",children:"🥬"}),e.jsx("p",{className:"text-sm font-semibold text-center",children:t.nombre}),e.jsxs("p",{className:"text-xs text-amber-400 font-bold",children:["$",Number(t.precio).toFixed(2)," / kg"]})]},t.id))}),w&&e.jsx(X,{onKey:t=>N(i=>i+t),onBackspace:()=>N(t=>t.slice(0,-1)),onSpace:()=>N(t=>t+" "),onClose:()=>k(!1)})]}),(n==="weighing"||n==="printing")&&m&&e.jsxs("div",{className:"flex flex-col items-center justify-center py-16 px-6 gap-6",children:[e.jsxs("button",{onClick:C,className:"absolute top-24 left-6 text-slate-500 flex items-center gap-1 text-sm",children:[e.jsx(H,{size:16})," Volver"]}),e.jsx("p",{className:"text-2xl font-bold",children:m.nombre}),e.jsxs("div",{className:"bg-slate-900 border border-slate-800 rounded-3xl px-12 py-10 flex flex-col items-center gap-2",children:[e.jsx("p",{className:"text-xs text-slate-500 uppercase tracking-widest",children:"Peso"}),e.jsxs("p",{className:"text-6xl font-black tabular-nums",children:[x.toFixed(3)," ",e.jsx("span",{className:"text-2xl text-slate-500",children:"kg"})]})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("p",{className:"text-xs text-slate-500 uppercase tracking-widest",children:"Total a pagar"}),e.jsxs("p",{className:"text-5xl font-black text-amber-400",children:["$",P.toFixed(2)]})]}),e.jsx("button",{onClick:M,disabled:x<=0||n==="printing",className:"w-full max-w-xs py-4 rounded-2xl font-bold text-lg bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-40 flex items-center justify-center gap-2",children:n==="printing"?e.jsxs(e.Fragment,{children:[e.jsx(S,{size:20,className:"animate-spin"})," Imprimiendo..."]}):e.jsxs(e.Fragment,{children:[e.jsx(V,{size:20})," Imprimir etiqueta"]})}),x<=0&&n==="weighing"&&e.jsx("p",{className:"text-xs text-slate-500",children:"Coloca el producto en la báscula..."})]}),n==="done"&&j&&e.jsxs("div",{className:"flex flex-col items-center justify-center py-24 gap-4",children:[e.jsx(W,{size:64,className:"text-green-400"}),e.jsx("p",{className:"text-2xl font-bold",children:"¡Etiqueta impresa!"}),e.jsx("p",{className:"text-slate-400",children:"Pega la etiqueta en tu producto y pasa a caja a pagar."}),e.jsxs("p",{className:"text-4xl font-black text-amber-400 mt-2",children:["$",Number(j.precio_total).toFixed(2)]})]})]}):e.jsx("div",{className:"min-h-screen bg-slate-950 flex items-center justify-center text-slate-400",children:"Debes iniciar sesión en el POS antes de abrir la báscula."})}export{ae as default};

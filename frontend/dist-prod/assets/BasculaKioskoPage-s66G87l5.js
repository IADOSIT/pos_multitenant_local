import{c as T,u as B,r as a,N as z,l as q,j as e,W as I,X as R,V as P,n as D,ah as O}from"./index-q8xgByGv.js";import{s as K}from"./puenteLocal-D-C1tWxr.js";import{l as V,a as W,b as H}from"./basculaOrigen-r8kjSEOo.js";import{e as U}from"./ean13-nDy4hHOn.js";import{S as F}from"./search-BaGuHwd6.js";import{S as G}from"./shopping-basket-cdGEs2JD.js";import{P as X}from"./printer-O879SZqO.js";import{C as Y}from"./check-circle-DhQBuMN5.js";/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J=T("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);function Q(o){var j;const l=o.label_width_mm||50,i=o.label_height_mm||25,r=Math.max(l,i),d=Math.min(l,i),c=document.createElement("iframe");c.style.cssText="position:fixed;top:-10000px;left:-10000px;width:0;height:0;",document.body.appendChild(c);const h=u=>String(u).replace(/</g,"&lt;").replace(/>/g,"&gt;"),w=Math.max(20,r-5),y=Math.min(12,Math.max(6,Math.round(d*.3))),g=U(o.barcode,`${w}mm`,`${y}mm`),m=Math.min(1.2,Math.max(.72,r/50)),b=u=>`${(u*m).toFixed(1)}pt`,x=`<!DOCTYPE html>
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
    font-size: ${b(8)};
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
  .detalle { font-size: ${b(7)}; white-space: nowrap; overflow: hidden; }
  .total { font-size: ${b(13)}; font-weight: bold; line-height: 1; white-space: nowrap; }
  .barras { flex-shrink: 0; margin-top: auto; }
  .codigo { font-size: ${b(6)}; letter-spacing: 0.4px; line-height: 1.4; }
  svg { display: block; margin: 0 auto; }
</style>
</head>
<body>
  <div class="nombre">${h(o.producto_nombre)}</div>
  <div class="fila">
    <div class="detalle">${o.peso_kg.toFixed(3)} kg x $${Number(o.precio_kg).toFixed(2)}/kg</div>
    <div class="total">$${Number(o.precio_total).toFixed(2)}</div>
  </div>
  <div class="barras">
    ${g}
    <div class="codigo">${h(o.barcode)}</div>
  </div>
</body>
</html>`,p=c.contentDocument||((j=c.contentWindow)==null?void 0:j.document);if(!p){document.body.removeChild(c);return}p.open(),p.write(x),p.close(),setTimeout(()=>{var u;(u=c.contentWindow)==null||u.print(),setTimeout(()=>{try{document.body.removeChild(c)}catch{}},2e3)},250)}const Z=[["1","2","3","4","5","6","7","8","9","0"],["Q","W","E","R","T","Y","U","I","O","P"],["A","S","D","F","G","H","J","K","L","Ñ"],["Z","X","C","V","B","N","M"]];function ee({onKey:o,onBackspace:l,onSpace:i,onClose:r}){return e.jsx("div",{className:"fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t border-slate-700 p-3",children:e.jsxs("div",{className:"mx-auto w-full max-w-[1100px] space-y-2",children:[Z.map((d,c)=>e.jsx("div",{className:"flex justify-center gap-1.5 md:gap-2",children:d.map(h=>e.jsx("button",{onClick:()=>o(h),className:"flex-1 basis-0 min-w-0 max-w-[96px] h-11 md:h-12 rounded-lg bg-slate-800 hover:bg-slate-700 text-base md:text-lg font-bold active:scale-95 transition-transform",children:h},h))},c)),e.jsxs("div",{className:"flex justify-center gap-1.5 md:gap-2",children:[e.jsx("button",{onClick:i,className:"flex-1 basis-0 min-w-0 max-w-[600px] h-11 rounded-lg bg-slate-800 hover:bg-slate-700 text-base font-bold",children:"Espacio"}),e.jsx("button",{onClick:l,className:"flex-1 basis-0 min-w-0 max-w-[150px] h-11 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center",children:e.jsx(O,{size:20})}),e.jsx("button",{onClick:r,className:"flex-1 basis-0 min-w-0 max-w-[200px] h-11 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-base font-bold",children:"Listo"})]})]})})}function ce(){const{user:o}=B(),l=o==null?void 0:o.tienda_id,[i,r]=a.useState("grid"),[d,c]=a.useState([]),[h,w]=a.useState(!0),[y,g]=a.useState(!1),[m,b]=a.useState(null),[x,p]=a.useState(0),[j,u]=a.useState(null),[f,N]=a.useState(""),[_,C]=a.useState(!1),E=a.useRef(null),[v]=a.useState(()=>V()),k=a.useRef(!1);a.useEffect(()=>{l&&z.getProductos(l).then(({data:t})=>c(t||[])).catch(()=>{}).finally(()=>w(!1))},[l]),a.useEffect(()=>{if(!l||v.modo==="apagado")return;const t="/api".replace("/api","")||"https://posapi.iados.online",n=q(`${t}/bascula`,{transports:["websocket"],auth:{token:localStorage.getItem("pos_token")||""}});return E.current=n,n.on("connect",()=>{g(!0),n.emit("kiosk-join",{tienda_id:l})}),n.on("kiosk-error",s=>{console.warn("[bascula] escucha rechazada:",s==null?void 0:s.message),g(!1)}),n.on("disconnect",()=>g(!1)),n.on("weight-update",s=>{W(v,s.estacion,k.current)&&p(s.peso_kg||0)}),()=>{n.disconnect()}},[l,v]),a.useEffect(()=>{if(!H(v)){k.current=!1;return}return K(t=>{p(t.peso_kg||0),g(!0)},t=>{k.current=t})},[v]);const S=a.useMemo(()=>{if(!f.trim())return d;const t=f.trim().toLowerCase();return d.filter(n=>n.nombre.toLowerCase().includes(t))},[d,f]),M=m?x*Number(m.precio):0,L=t=>{b(t),p(0),r("weighing")},$=()=>{r("grid"),b(null),u(null),p(0)},A=async()=>{var t,n;if(!(!m||!l||x<=0)){r("printing");try{const{data:s}=await z.registrarPesaje({tienda_id:l,producto_id:m.id,peso_kg:x});u({barcode:s.barcode,precio_total:s.precio_total}),s.printer_modo==="navegador"&&Q({producto_nombre:s.producto_nombre??m.nombre,peso_kg:Number(s.peso_kg??x),precio_kg:Number(s.precio_kg??m.precio),precio_total:Number(s.precio_total),barcode:s.barcode,label_width_mm:s.label_width_mm,label_height_mm:s.label_height_mm}),r("done"),setTimeout($,6e3)}catch(s){alert(((n=(t=s.response)==null?void 0:t.data)==null?void 0:n.message)||"Error al registrar el pesaje. Intenta de nuevo."),r("weighing")}}};return l?e.jsxs("div",{className:"min-h-screen bg-slate-950 text-white select-none",style:{fontFamily:"system-ui, sans-serif"},children:[e.jsxs("div",{className:"bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(I,{size:24,className:"text-amber-400"}),e.jsx("h1",{className:"text-xl font-bold",children:"Báscula — Frutas y Verduras"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:`w-2 h-2 rounded-full ${y?"bg-green-500":"bg-yellow-500 animate-pulse"}`}),e.jsx("span",{className:"text-xs text-slate-500",children:y?"Báscula conectada":"Conectando..."})]})]}),i==="grid"&&e.jsxs("div",{className:`p-6 ${_?"pb-64":""}`,children:[e.jsxs("div",{className:"relative max-w-md mx-auto mb-6",children:[e.jsx(F,{size:18,className:"absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"}),e.jsx("input",{value:f,onFocus:()=>C(!0),onChange:t=>N(t.target.value),readOnly:!0,placeholder:"Buscar producto...",className:"w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-11 py-3 text-base outline-none cursor-pointer"}),f&&e.jsx("button",{onClick:()=>N(""),className:"absolute right-4 top-1/2 -translate-y-1/2 text-slate-500",children:e.jsx(R,{size:18})})]}),h?e.jsx("div",{className:"flex items-center justify-center py-24 text-slate-500",children:e.jsx(P,{size:32,className:"animate-spin"})}):d.length===0?e.jsxs("div",{className:"flex flex-col items-center justify-center py-24 text-slate-500 gap-3",children:[e.jsx(G,{size:48,className:"opacity-30"}),e.jsx("p",{children:'No hay productos configurados como "vendido por kg" en esta tienda.'}),e.jsx("p",{className:"text-xs",children:'Configúralos en Catálogos → Productos, unidad "kg".'})]}):S.length===0?e.jsxs("div",{className:"flex flex-col items-center justify-center py-24 text-slate-500 gap-3",children:[e.jsx(F,{size:40,className:"opacity-30"}),e.jsxs("p",{children:['Sin resultados para "',f,'"']})]}):e.jsx("div",{className:"grid grid-cols-3 md:grid-cols-4 gap-4",children:S.map(t=>e.jsxs("button",{onClick:()=>L(t),className:"bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all active:scale-95",children:[t.imagen_url?e.jsx("img",{src:D(t.imagen_url),alt:t.nombre,className:"w-20 h-20 object-cover rounded-xl"}):e.jsx("div",{className:"w-20 h-20 rounded-xl bg-slate-800 flex items-center justify-center text-3xl",children:"🥬"}),e.jsx("p",{className:"text-sm font-semibold text-center",children:t.nombre}),e.jsxs("p",{className:"text-xs text-amber-400 font-bold",children:["$",Number(t.precio).toFixed(2)," / kg"]})]},t.id))}),_&&e.jsx(ee,{onKey:t=>N(n=>n+t),onBackspace:()=>N(t=>t.slice(0,-1)),onSpace:()=>N(t=>t+" "),onClose:()=>C(!1)})]}),(i==="weighing"||i==="printing")&&m&&e.jsxs("div",{className:"flex flex-col items-center justify-center py-16 px-6 gap-6",children:[e.jsxs("button",{onClick:$,className:"absolute top-24 left-6 text-slate-500 flex items-center gap-1 text-sm",children:[e.jsx(J,{size:16})," Volver"]}),e.jsx("p",{className:"text-2xl font-bold",children:m.nombre}),e.jsxs("div",{className:"bg-slate-900 border border-slate-800 rounded-3xl px-12 py-10 flex flex-col items-center gap-2",children:[e.jsx("p",{className:"text-xs text-slate-500 uppercase tracking-widest",children:"Peso"}),e.jsxs("p",{className:"text-6xl font-black tabular-nums",children:[x.toFixed(3)," ",e.jsx("span",{className:"text-2xl text-slate-500",children:"kg"})]})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("p",{className:"text-xs text-slate-500 uppercase tracking-widest",children:"Total a pagar"}),e.jsxs("p",{className:"text-5xl font-black text-amber-400",children:["$",M.toFixed(2)]})]}),e.jsx("button",{onClick:A,disabled:x<=0||i==="printing",className:"w-full max-w-xs py-4 rounded-2xl font-bold text-lg bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-40 flex items-center justify-center gap-2",children:i==="printing"?e.jsxs(e.Fragment,{children:[e.jsx(P,{size:20,className:"animate-spin"})," Imprimiendo..."]}):e.jsxs(e.Fragment,{children:[e.jsx(X,{size:20})," Imprimir etiqueta"]})}),x<=0&&i==="weighing"&&e.jsx("p",{className:"text-xs text-slate-500",children:"Coloca el producto en la báscula..."})]}),i==="done"&&j&&e.jsxs("div",{className:"flex flex-col items-center justify-center py-24 gap-4",children:[e.jsx(Y,{size:64,className:"text-green-400"}),e.jsx("p",{className:"text-2xl font-bold",children:"¡Etiqueta impresa!"}),e.jsx("p",{className:"text-slate-400",children:"Pega la etiqueta en tu producto y pasa a caja a pagar."}),e.jsxs("p",{className:"text-4xl font-black text-amber-400 mt-2",children:["$",Number(j.precio_total).toFixed(2)]})]})]}):e.jsx("div",{className:"min-h-screen bg-slate-950 flex items-center justify-center text-slate-400",children:"Debes iniciar sesión en el POS antes de abrir la báscula."})}export{ce as default};

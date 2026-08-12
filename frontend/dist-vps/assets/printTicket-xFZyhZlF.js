const T="ru.a402d.rawbtprinter";function _(e,o={}){const n=Math.max(1,Math.min(o.copias||1,5)),a=o.cortar!==!1,m=new TextEncoder,r=[27,64];for(let c=0;c<n;c++)r.push(...Array.from(m.encode(e))),r.push(10,10,10,10),a&&r.push(29,86,1);return new Uint8Array(r)}function M(e){let o="";for(let n=0;n<e.length;n++)o+=String.fromCharCode(e[n]);return btoa(o)}function S(e,o={}){const n=_(e,o),a=M(n);window.location.href=`intent:base64,${a}#Intent;scheme=rawbt;package=${T};end;`}function v(e,o=80,n="Consolas",a=11,m,r="centro",c=1,y="navegador"){var x;if(y==="rawbt"){S(e,{copias:c});return}const t=document.createElement("iframe");t.style.cssText="position:fixed;top:-10000px;left:-10000px;width:0;height:0;",document.body.appendChild(t);const g=o===58?"58mm":"80mm",s=n||"Consolas",h=a||11,b=r==="izquierda"?"left":"center",$=e.replace(/</g,"&lt;").replace(/>/g,"&gt;"),l=m?`<div style="text-align:${b};margin-bottom:4px;">
        <img src="${m}" style="max-height:30mm;max-width:100%;object-fit:contain;" />
       </div>`:"",p=Math.max(1,Math.min(c||1,5));let u="";for(let i=0;i<p;i++)u+=`${l}<pre>${$}</pre>`,i<p-1&&(u+='<div style="border-top:1px dashed #999;margin:4mm 0;"></div>');const C=`<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: ${g} auto; margin: 0; }
  body {
    margin: 0;
    padding: 2mm;
    font-family: '${s}', monospace;
    font-size: ${h}pt;
    line-height: 1.3;
    width: ${g};
  }
  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: inherit;
    font-size: inherit;
  }
</style>
</head>
<body>${u}</body>
</html>`,d=t.contentDocument||((x=t.contentWindow)==null?void 0:x.document);if(!d){document.body.removeChild(t);return}d.open(),d.write(C),d.close();let w=!1;const f=()=>{var i;w||(w=!0,(i=t.contentWindow)==null||i.print(),setTimeout(()=>{try{document.body.removeChild(t)}catch{}},2e3))};if(m){const i=d.querySelector("img");i?(i.onload=()=>setTimeout(f,100),i.onerror=()=>setTimeout(f,100),setTimeout(f,1500)):setTimeout(f,250)}else setTimeout(f,250)}function A(e,o){const n=o.comanda_ancho||80,a=n===58?32:42,m=(o.comanda_header||"ORDEN").toUpperCase(),r=s=>{const h=Math.max(0,Math.floor((a-s.length)/2));return" ".repeat(h)+s},c="=".repeat(a),y="-".repeat(a),t=[];t.push(c),t.push(r(m));const g=new Date().toLocaleString("es-MX",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit",year:"2-digit"});t.push(r(g)),t.push(c),e.mesa&&t.push(`Mesa: ${e.mesa}`),e.usuario_nombre&&t.push(`Mesero: ${e.usuario_nombre}`),e.tipo_servicio==="para_llevar"&&t.push("*** PARA LLEVAR ***"),e.folio&&t.push(`Folio: ${e.folio}`),t.push(y);for(const s of e.items){const h=String(s.cantidad).padStart(2),b=o.comanda_mostrar_precio&&s.precio!=null,$=b?a-10:a-4,l=(s.nombre||"").substring(0,$);if(b){const p=`$${((s.precio??0)*s.cantidad).toFixed(0)}`,u=Math.max(1,a-h.length-1-l.length-p.length);t.push(`${h} ${l}${" ".repeat(u)}${p}`)}else t.push(`${h} ${l}`);s.notas&&t.push(`   > ${s.notas}`)}t.push(c),e.notas&&t.push(`NOTAS: ${e.notas}`),v(t.join(`
`),n,o.fuente_familia||"Consolas",o.fuente_tamano||11,null,"centro",o.comanda_copias||1,o.modo_impresion||"navegador")}export{A as a,v as p};

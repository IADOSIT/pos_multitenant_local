const C="ru.a402d.rawbtprinter";function T(t,n={}){const o=Math.max(1,Math.min(n.copias||1,5)),a=n.cortar!==!1,m=new TextEncoder,r=[27,64];for(let c=0;c<o;c++)r.push(...Array.from(m.encode(t))),r.push(10,10,10,10),a&&r.push(29,86,1);return new Uint8Array(r)}function M(t){let n="";for(let o=0;o<t.length;o++)n+=String.fromCharCode(t[o]);return btoa(n)}function S(t,n={}){const o=T(t,n),a=M(o);window.location.href=`intent:base64,${a}#Intent;scheme=rawbt;package=${C};end;`}function v(t,n=80,o="Consolas",a=11,m,r="centro",c=1,y="navegador"){var w;if(y==="rawbt"){S(t,{copias:c});return}const e=document.createElement("iframe");e.style.cssText="position:fixed;top:-10000px;left:-10000px;width:0;height:0;",document.body.appendChild(e);const b=n===58?"58mm":"80mm",i=o||"Consolas",l=a||11,g=r==="izquierda"?"left":"center",$=t.replace(/</g,"&lt;").replace(/>/g,"&gt;"),h=m?`<div style="text-align:${g};margin-bottom:4px;">
        <img src="${m}" style="max-height:30mm;max-width:100%;object-fit:contain;" />
       </div>`:"",u=Math.max(1,Math.min(c||1,5));let p="";for(let s=0;s<u;s++)p+=`${h}<pre>${$}</pre>`,s<u-1&&(p+='<div style="border-top:1px dashed #999;margin:4mm 0;"></div>');const x=`<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: ${b} auto; margin: 0; }
  body {
    margin: 0;
    padding: 2mm;
    font-family: '${i}', monospace;
    font-size: ${l}pt;
    line-height: 1.3;
    width: ${b};
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
<body>${p}</body>
</html>`,f=e.contentDocument||((w=e.contentWindow)==null?void 0:w.document);if(!f){document.body.removeChild(e);return}f.open(),f.write(x),f.close();let _=!1;const d=()=>{var s;_||(_=!0,(s=e.contentWindow)==null||s.print(),setTimeout(()=>{try{document.body.removeChild(e)}catch{}},2e3))};if(m){const s=f.querySelector("img");s?(s.onload=()=>setTimeout(d,100),s.onerror=()=>setTimeout(d,100),setTimeout(d,1500)):setTimeout(d,250)}else setTimeout(d,250)}function A(t,n){const o=n.comanda_ancho||80,a=o===58?32:42,m=(n.comanda_header||"ORDEN").toUpperCase(),r=i=>{const l=Math.max(0,Math.floor((a-i.length)/2));return" ".repeat(l)+i},c="=".repeat(a),y="-".repeat(a),e=[];e.push(c),e.push(r(m));const b=new Date().toLocaleString("es-MX",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit",year:"2-digit"});e.push(r(b)),e.push(c),t.mesa&&e.push(`Mesa: ${t.mesa}`),t.usuario_nombre&&e.push(`Mesero: ${t.usuario_nombre}`),t.tipo_servicio==="para_llevar"&&e.push("*** PARA LLEVAR ***"),t.folio&&e.push(`Folio: ${t.folio}`),n.comanda_mostrar_cliente===!0&&(t.cliente_nombre&&e.push(`Cliente: ${t.cliente_nombre}`),t.cliente_telefono&&e.push(`Tel: ${t.cliente_telefono}`),t.cliente_direccion&&e.push(`Dir: ${t.cliente_direccion}`)),e.push(y);for(const i of t.items){const l=String(i.cantidad).padStart(2),g=n.comanda_mostrar_precio&&i.precio!=null,$=g?a-10:a-4,h=(i.nombre||"").substring(0,$);if(g){const u=`$${((i.precio??0)*i.cantidad).toFixed(0)}`,p=Math.max(1,a-l.length-1-h.length-u.length);e.push(`${l} ${h}${" ".repeat(p)}${u}`)}else e.push(`${l} ${h}`);i.notas&&e.push(`   > ${i.notas}`)}e.push(c),t.notas&&e.push(`NOTAS: ${t.notas}`),v(e.join(`
`),o,n.fuente_familia||"Consolas",n.fuente_tamano||11,null,"centro",n.comanda_copias||1,n.modo_impresion||"navegador")}export{A as a,v as p};

function T(e,s=80,d="Consolas",i=11,l,f="centro",h=1){var w;const a=document.createElement("iframe");a.style.cssText="position:fixed;top:-10000px;left:-10000px;width:0;height:0;",document.body.appendChild(a);const t=s===58?"58mm":"80mm",$=d||"Consolas",o=i||11,r=f==="izquierda"?"left":"center",g=e.replace(/</g,"&lt;").replace(/>/g,"&gt;"),y=l?`<div style="text-align:${r};margin-bottom:4px;">
        <img src="${l}" style="max-height:30mm;max-width:100%;object-fit:contain;" />
       </div>`:"",m=Math.max(1,Math.min(h||1,5));let c="";for(let n=0;n<m;n++)c+=`${y}<pre>${g}</pre>`,n<m-1&&(c+='<div style="border-top:1px dashed #999;margin:4mm 0;"></div>');const b=`<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: ${t} auto; margin: 0; }
  body {
    margin: 0;
    padding: 2mm;
    font-family: '${$}', monospace;
    font-size: ${o}pt;
    line-height: 1.3;
    width: ${t};
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
<body>${c}</body>
</html>`,p=a.contentDocument||((w=a.contentWindow)==null?void 0:w.document);if(!p){document.body.removeChild(a);return}p.open(),p.write(b),p.close();let x=!1;const u=()=>{var n;x||(x=!0,(n=a.contentWindow)==null||n.print(),setTimeout(()=>{try{document.body.removeChild(a)}catch{}},2e3))};if(l){const n=p.querySelector("img");n?(n.onload=()=>setTimeout(u,100),n.onerror=()=>setTimeout(u,100),setTimeout(u,1500)):setTimeout(u,250)}else setTimeout(u,250)}function _(e,s){const d=s.comanda_ancho||80,i=d===58?32:42,l=(s.comanda_header||"ORDEN").toUpperCase(),f=o=>{const r=Math.max(0,Math.floor((i-o.length)/2));return" ".repeat(r)+o},h="=".repeat(i),a="-".repeat(i),t=[];t.push(h),t.push(f(l));const $=new Date().toLocaleString("es-MX",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit",year:"2-digit"});t.push(f($)),t.push(h),e.mesa&&t.push(`Mesa: ${e.mesa}`),e.usuario_nombre&&t.push(`Mesero: ${e.usuario_nombre}`),e.tipo_servicio==="para_llevar"&&t.push("*** PARA LLEVAR ***"),e.folio&&t.push(`Folio: ${e.folio}`),t.push(a);for(const o of e.items){const r=String(o.cantidad).padStart(2),g=s.comanda_mostrar_precio&&o.precio!=null,y=g?i-10:i-4,m=(o.nombre||"").substring(0,y);if(g){const c=`$${((o.precio??0)*o.cantidad).toFixed(0)}`,b=Math.max(1,i-r.length-1-m.length-c.length);t.push(`${r} ${m}${" ".repeat(b)}${c}`)}else t.push(`${r} ${m}`);o.notas&&t.push(`   > ${o.notas}`)}t.push(h),e.notas&&t.push(`NOTAS: ${e.notas}`),T(t.join(`
`),d,s.fuente_familia||"Consolas",s.fuente_tamano||11,null,"centro",s.comanda_copias||1)}export{_ as a,T as p};

// Tema do mês (2.22): uma paleta por mês, destaque legível (contraste ≥ 4,5:1 sobre o fundo, o branco e o tom claro). node app/testes/tema.cjs
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const css=fs.readFileSync(path.join(__dirname,'../src/Estilos.html'),'utf8');
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.substr(i,2),16)/255).map(x=>x<=.03928?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05);};
for(let m=1;m<=12;m++){const r=css.match(new RegExp('html\\[data-theme=light\\]\\[data-campanha="'+m+'"\\]\\{([^}]+)\\}'));assert.ok(r,'mês '+m+' sem paleta');
  const v=Object.fromEntries(r[1].split(';').map(x=>x.split(':').map(y=>y.trim())));for(const k of ['--blue','--pale','--bg','--focus','--soft'])assert.match(v[k]||'',/^#[0-9a-f]{6}$/i,m+' '+k);
  for(const fundo of ['#ffffff',v['--pale'],v['--bg'],v['--soft']])assert.ok(cr(v['--blue'],fundo)>=4.5,`mês ${m}: destaque ${v['--blue']} sobre ${fundo} = ${cr(v['--blue'],fundo).toFixed(2)}`);}
console.log('PASS: tema do mês — 12 paletas, destaque com contraste ≥ 4,5:1 sobre branco, fundo e tom claro (texto, links e botões legíveis).');

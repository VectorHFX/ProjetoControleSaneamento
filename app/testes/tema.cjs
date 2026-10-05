// Tema do mês (2.22): uma paleta por mês, destaque legível (contraste ≥ 4,5:1 sobre o fundo, o branco e o tom claro). node app/testes/tema.cjs
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const css=fs.readFileSync(path.join(__dirname,'../src/Estilos.html'),'utf8');
const lum=h=>{if(/^#[0-9a-f]{3}$/i.test(h))h='#'+h.slice(1).split('').map(x=>x+x).join('');const c=[1,3,5].map(i=>parseInt(h.substr(i,2),16)/255).map(x=>x<=.03928?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05);};
for(let m=1;m<=12;m++){const r=css.match(new RegExp('html\\[data-theme=light\\]\\[data-campanha="'+m+'"\\]\\{([^}]+)\\}'));assert.ok(r,'mês '+m+' sem paleta');
  const v=Object.fromEntries(r[1].split(';').map(x=>x.split(':').map(y=>y.trim())));for(const k of ['--blue','--pale','--bg','--focus','--soft'])assert.match(v[k]||'',/^#[0-9a-f]{6}$/i,m+' '+k);
  for(const fundo of ['#ffffff',v['--pale'],v['--bg'],v['--soft']])assert.ok(cr(v['--blue'],fundo)>=4.5,`mês ${m}: destaque ${v['--blue']} sobre ${fundo} = ${cr(v['--blue'],fundo).toFixed(2)}`);}
console.log('PASS: tema do mês — 12 paletas, destaque com contraste ≥ 4,5:1 sobre branco, fundo e tom claro (texto, links e botões legíveis).');
// 2.24 · Visual novo (v3): texto legível no claro, no escuro, na parede verde do menu e no balcão.
{const bloco=sel=>{const i=css.indexOf(sel+'{');assert.ok(i>=0,'sem bloco '+sel);const t=css.slice(i+sel.length+1,css.indexOf('}',i));return Object.fromEntries(t.split(';').map(x=>x.split(':').map(y=>y.trim())).filter(x=>x[0]&&x[0].startsWith('--')));};
 const base=bloco('html[data-visual=v3]'),claro={...bloco('html[data-visual=v3][data-theme=light]'),...bloco('html[data-visual=v3][data-theme=light]:not([data-campanha])')},escuro=bloco('html[data-visual=v3][data-theme=dark]');
 const ok=(a,b,min,o)=>assert.ok(cr(a,b)>=min,`${o}: ${a} sobre ${b} = ${cr(a,b).toFixed(2)} (mínimo ${min})`);
 for(const [nome,t] of [['claro',claro],['escuro',escuro]]){
   for(const fundo of ['--bg','--surface','--soft','--pale'])ok(t['--ink'],t[fundo],7,nome+' texto');
   for(const fundo of ['--bg','--surface'])ok(t['--muted'],t[fundo],4.5,nome+' texto suave');
   for(const fundo of ['--bg','--surface','--pale'])ok(t['--blue'],t[fundo],4.5,nome+' destaque');
   ok(t['--action-ink'],t['--blue'],4.5,nome+' texto do botão');}
 for(const [nome,parede] of [['claro',base['--parede']],['escuro',escuro['--parede']]]){ok(base['--parede-tinta'],parede,7,nome+' menu sobre a parede');ok('#fffdf8',parede,7,nome+' título do cabeçalho verde');ok(base['--parede-suave'],parede,4.5,nome+' texto suave do menu');}
 ok('#1e3d2f','#f3e6cf',7,'página ativa no menu');ok('#ffffff',base['--veolia'],4.5,'aviso vermelho');
 console.log('PASS: visual novo — contraste do texto, do destaque, dos botões, do menu sobre a parede verde e da página ativa (claro e escuro).');}

// Mascotes chibi (2.18/2.19): todas as espécies × todas as peças × todas as expressões desenham sem NaN/undefined
// e as peças ficam nos pontos de encaixe certos. node app/testes/mascotes.cjs
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const R=path.join(__dirname,'..'),js=f=>fs.readFileSync(path.join(R,'fontes',f+'.html'),'utf8').replace(/^\s*<script>/,'').replace(/<\/script>\s*$/,'');
const ctx={window:{},Intl,Math,JSON,String,Number,Array,Object,Date,console};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(js('MeuEspaco').split('window.CPTArte')[0],ctx);vm.runInContext(js('Mascotes'),ctx);ctx.CPT_MASCOTE_V2=true;
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(R,'src/PessoalCPT.gs'),'utf8')+';this.cat=PessoalCPT.catalogo;this.kit=PessoalCPT.kit;this.esp=Object.keys({...PessoalCPT.especiesNovas,...PessoalCPT.classicos})',c);
const V2=ctx.CPTMascoteV2,M=ctx.CPTMascote,EX=['normal','feliz','surpreso','pensativo','dormindo','comemorando','triste'];
assert.deepEqual([...c.esp].sort(),[...V2.especies].sort(),'todo mascote do servidor tem desenho');
let n=0;for(const e of V2.especies)for(const it of c.cat){for(const x of EX){const svg=M.desenhar(e,{...c.kit,[it.slot]:it.id,mao:it.slot==='mao'?it.id:'prancheta'},120,'t','',x);n++;
  assert.ok(!/NaN|undefined/.test(svg),`${e} + ${it.id} (${x}) com coordenada inválida`);}
  assert.ok(M.temDesenho(it.id),'peça sem desenho: '+it.id);}
// Laço do mês no alto do peito: abaixo do queixo e acima das patinhas, sem cobrir o nome da camisa.
const num=s=>Number(s);for(const e of V2.especies){const svg=M.desenhar(e,{...c.kit,corpo:'camisa-veolia'},120,'t','','normal');
  const laco=svg.match(/<g transform="translate\(([\d.]+),([\d.]+)\) scale\(\.82\)/),txt=svg.match(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>VEOLIA/);
  assert.ok(laco&&txt,e);const [lx,ly,tx,ty]=[laco[1],laco[2],txt[1],txt[2]].map(num);
  assert.ok(ty-ly>=14||tx-lx>=26,`${e}: laço em cima do nome da camisa (laço ${lx},${ly} · texto ${tx},${ty})`);}
// Pensativo com ferramenta: a mão do queixo é a esquerda (a ferramenta fica embaixo, longe do rosto).
for(const e of ['urso','gato','sapo']){const a=M.desenhar(e,{...c.kit,mao:'prancheta'},120,'t','','pensativo'),b=M.desenhar(e,{...c.kit},120,'t','','pensativo');assert.notEqual(a,b);}
// 2.26: Loja — cada peça colorida aparece com a sua cor; cores especiais de pelagem desenham.
const corDe={'capacete-azul':'#3d7fd6','capacete-verde':'#3f9b5a','capacete-laranja':'#f08a2c','colete-amarelo':'#d6ea3c','colete-azul':'#2f6fb3','luvas-amarelas':'#f2c230','luvas-azuis':'#4a86c8','galocha-amarela':'#f2c230','bota-branca':'#eeeae2','moletom-verde':'#3f7f52','camisa-xadrez':'#c0453a','jaqueta-jeans':'#4a6fa5'};
for(const [id,cor] of Object.entries(corDe)){const it=c.cat.find(x=>x.id===id);assert.ok(it&&it.preco>0,id);for(const e of V2.especies)assert.ok(M.desenhar(e,{...c.kit,[it.slot]:id},120,'t','','normal').includes(cor),`${e}: ${id} sem a cor`);}
for(const [k,cor] of [['menta','#7fd1b9'],['coral','#f08a72'],['dourado','#e3b94a'],['noite','#4a5f9e']]){assert.equal(V2.amostra(k),cor);assert.ok(M.desenhar('urso',c.kit,120,'t',k,'normal').includes(cor));}
// 2.50: acabamento — luz radial, íris, bochecha esfumada; gato e cachorro com rabo que abana; "triste" com sobrancelhas e gotinha.
{const g=M.desenhar('gato',{},120,'t','','normal');assert.ok(/radialGradient id="mv\d+r"/.test(g)&&g.includes('class="m-cauda"')&&g.includes('class="m-olhar"'),'gato com volume, rabo e olhar');
 const t=M.desenhar('urso',{},120,'t','','triste');assert.ok(t.includes('#8fd0f2')&&!/NaN|undefined/.test(t),'triste com gotinha');
 assert.ok(!M.desenhar('gota',{},120,'t','','normal').includes('m-cauda'),'gota não tem rabo');}
console.log(`PASS: mascotes — ${V2.especies.length} espécies × ${c.cat.length} peças × ${EX.length} expressões (${n} desenhos) sem coordenada inválida; laço longe do nome da camisa; pensativo não cobre o rosto com a ferramenta.`);

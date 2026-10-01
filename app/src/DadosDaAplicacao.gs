/** DadosDaAplicacao 2.2.0. Somente leitura; compatível com a base Campo 4.0 importada. */
class DadosDaAplicacao {
  constructor(base, perfil) { this.perfil=perfil; this.base = base; this.fuso = base.getSpreadsheetTimeZone(); }
  static norm(v) { return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' '); }
  static json(v) {
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(x => this.json(x));
    if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).map(k => [k, this.json(v[k])]));
    return v == null ? '' : v;
  }
  static get colunas() { return ['ID','Procedimento','Data do procedimento','Mês','Carimbo do envio','Origem','ID legado','Bairro','Bairro ID','Obra de referência','Obra ID','Responsável','Área','Atividade','Público informado','Protocolo informado','Situação do vínculo','Pesquisa','Conferência dos campos','Hash','Detalhes JSON']; }
  static get colunasAtd() { return ['Protocolo','Protocolo principal','Situação do protocolo','Status','Data de abertura','Data de conclusão','Nome','Assunto','Endereço','Frente de obra','Área responsável','Responsável','Próxima ação','Atualização operacional','Documento','PDF','Origem','Pesquisa','Hash','Detalhes JSON']; }
  tabela(nome, h) {
    const a = this.base.getSheetByName(nome);
    if (!a || a.getRange(1,1,1,h.length).getValues()[0].some((x,i) => x !== h[i])) throw new Error('A estrutura da tabela ' + nome + ' precisa ser conferida pelo administrador.');
    return a;
  }
  // Consulta comum a toda a equipe (requisito): nenhum tipo de registro é ocultado por perfil.
  permitido(r){return true;}
  registros() { return this._reg || (this._reg = this.tabela('Registros', DadosDaAplicacao.colunas)); }
  atendimentos() { return this._atd || (this._atd = this.tabela('Atendimentos', DadosDaAplicacao.colunasAtd)); }
  mes(v) { const s = String(v || ''); if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) throw new Error('Escolha um mês válido.'); return s; }
  mesCelula(v) { return v instanceof Date ? Utilities.formatDate(v,this.fuso,'yyyy-MM') : String(v || ''); }
  data(v) { return v instanceof Date ? Utilities.formatDate(v,this.fuso,'yyyy-MM-dd') : String(v || '').slice(0,10); }
  texto(v) { return String(v == null ? '' : v); }
  ler(a, largura) { const n = a.getLastRow()-1; return n > 0 ? a.getRange(2,1,n,largura).getValues() : []; }
  registro(r) { return {id:this.texto(r[0]),procedimento:this.texto(r[1]),data:this.data(r[2]),mes:this.mesCelula(r[3]),origem:this.texto(r[5]),bairro:this.texto(r[7]),bairroId:this.texto(r[8]),obra:this.texto(r[9]),obraId:this.texto(r[10]),responsavel:this.texto(r[11]),area:this.texto(r[12]),atividade:this.texto(r[13]),publico:r[14] === '' ? null : /^\d+$/.test(String(r[14])) ? Number(r[14]) : null,protocolo:this.texto(r[15]),conferencia:this.texto(r[18])}; }
  encerrado(r) { return /conclu|encerrad|finaliz/.test(DadosDaAplicacao.norm(r[3])); }
  principal(r) { return !!r[0] && (!r[1] || r[1] === r[0]) && !/incorporad|mesclad/.test(DadosDaAplicacao.norm(r[2])); }
  atendimento(r) { return {protocolo:this.texto(r[0]),principal:this.texto(r[1] || r[0]),status:this.texto(r[3]),abertura:this.data(r[4]),conclusao:this.data(r[5]),nome:this.texto(r[6]),assunto:this.texto(r[7]),endereco:this.texto(r[8]),obra:this.texto(r[9]),area:this.texto(r[10]),responsavel:this.texto(r[11]),proximaAcao:this.texto(r[12]),atualizacao:DadosDaAplicacao.json(r[13]),documento:this.url(r[14]),pdf:this.url(r[15]),origem:this.texto(r[16]),concluido:this.encerrado(r),incorporado:!this.principal(r)}; }
  url(v) { const s = String(v || ''); return /^https:\/\/(?:docs|drive)\.google\.com\//i.test(s) ? s : ''; }
  filtros(p) {
    p = p || {}; if (typeof p !== 'object' || Array.isArray(p)) throw new Error('Filtros inválidos.');
    const f={}; ['mes','busca','procedimento','bairro','estado','obra','pendencia'].forEach(k => { if(p[k] != null && (typeof p[k] !== 'string' || p[k].length > 200))throw new Error('Filtro inválido.'); f[k]=String(p[k] || '').trim(); });
    if(f.mes)this.mes(f.mes);
    return f;
  }
  /** Visão do mês. Cache compartilhado por 10 min, invalidado por linha nova; atualizar=true recalcula. */
  inicio(mes, atualizar) {
    const reg = this.registros(), atd = this.atendimentos();
    const chave = 'inicio:'+this.base.getId()+':'+mes+':'+reg.getLastRow()+':'+atd.getLastRow();
    const salvo = atualizar ? null : CacheCPT.ler(chave);
    if (salvo) return {...salvo, cache: true};
    const r = this.calcularInicio(mes, reg, atd);
    CacheCPT.gravar(chave, r, 600); CacheCPT.gravar('inicio:ultimo:'+mes, r, 21600);
    return r;
  }
  calcularInicio(mes, reg, atd) {
    const linhas=this.ler(reg,19).filter(r=>this.permitido(r)), fichas=this.ler(atd,18).filter(r=>this.principal(r));
    const periodo=linhas.filter(r=>r[0]&&this.mesCelula(r[3])===mes), tipos=new Map(), dias=new Map();
    let participacoes=0, semPublico=0;
    periodo.forEach(r=>{tipos.set(String(r[1]),(tipos.get(String(r[1]))||0)+1);const dia=this.data(r[2]);if(dia.startsWith(mes))dias.set(dia,(dias.get(dia)||0)+1);
      if(DadosDaAplicacao.norm(r[1])==='relato de atividade'){if(r[14]!==''&&/^\d+$/.test(String(r[14])))participacoes+=Number(r[14]);else semPublico++;}});
    const concluidas=fichas.filter(r=>this.encerrado(r)), inicio=this.base.getSheetByName('Início');
    const formulario=inicio?this.url(inicio.getRange(3,2).getValue()):'';
    const anterior=new Date(mes+'-15T12:00:00Z');anterior.setUTCMonth(anterior.getUTCMonth()-1);const mesAnterior=anterior.toISOString().slice(0,7);
    const resultado={comparacao:{mesAnterior,anterior:linhas.filter(r=>r[0]&&this.mesCelula(r[3])===mesAnterior).length},mes,atualizadoEm:new Date().toISOString(),cache:false,
      indicadores:{bairros:new Set(periodo.map(r=>r[7]).filter(Boolean)).size,obras:new Set(periodo.map(r=>r[9]).filter(Boolean)).size,registros:periodo.length,participacoes,relatosSemPublico:semPublico,abertos:fichas.length-concluidas.length,concluidos:concluidas.length,
        concluidosNoMes:concluidas.filter(r=>this.data(r[5]).startsWith(mes)).length},
      procedimentos:[...tipos].map(([nome,quantidade])=>({nome,quantidade})).sort((a,b)=>b.quantidade-a.quantidade),
      dias:[...dias].map(([data,quantidade])=>({data,quantidade})).sort((a,b)=>a.data.localeCompare(b.data)),
      recentes:periodo.slice(-5).reverse().map(r=>this.registro(r)),
      filtros:{procedimentos:[...new Set(linhas.map(r=>String(r[1])).filter(Boolean))].sort(),bairros:[...new Set(linhas.map(r=>String(r[7])).filter(Boolean))].sort(),obras:[...new Set(linhas.map(r=>String(r[9])).filter(Boolean))].sort()},
      links:{formulario},notaCarteira:'Estado atual das fichas importadas. O mês filtra os registros de campo.'};
    resultado.satisfacao=this.satisfacao(periodo,mes);
    return resultado;
  }
  /** Pesquisas de satisfação: total do mês (meta 60) e semana atual de segunda a domingo (meta 15), só quando o mês é o corrente. */
  satisfacao(periodo,mes){
    const datas=periodo.filter(r=>/satisfac/.test(DadosDaAplicacao.norm(r[1]))).map(r=>this.data(r[2])).filter(d=>d.startsWith(mes));
    const hoje=Utilities.formatDate(new Date(),this.fuso,'yyyy-MM-dd');let semana=null;
    if(hoje.startsWith(mes)){const d=new Date(hoje+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));const de=d.toISOString().slice(0,10);d.setUTCDate(d.getUTCDate()+6);const ate=d.toISOString().slice(0,10);
      semana={de,ate,total:datas.filter(x=>x>=de&&x<=ate).length,meta:15};}
    return {mes:datas.length,meta:60,semana};
  }
  buscar(p) {
    p=p||{};const f=this.filtros(p), a=this.registros(), limite=24;
    const assinatura=JSON.stringify(f);let linha=a.getLastRow(),topo=linha;
    if(p.cursor){let c;try{c=JSON.parse(p.cursor);}catch(_){throw new Error('Reinicie a busca.');}
      if(c.filtro!==assinatura||!Number.isInteger(c.linha)||!Number.isInteger(c.topo)||c.linha<1||c.linha>c.topo||c.topo>a.getLastRow())throw new Error('Os filtros mudaram. Reinicie a busca.');linha=c.linha;topo=c.topo;}
    const itens=[];let lidos=0;
    while(linha>1&&itens.length<limite&&lidos<2000){const n=Math.min(200,linha-1,2000-lidos),primeira=linha-n+1,bloco=a.getRange(primeira,1,n,19).getValues();
      for(let i=bloco.length-1;i>=0;i--){const r=bloco[i];linha=primeira+i-1;lidos++;
        if(r[0]&&this.permitido(r)&&(!f.mes||this.mesCelula(r[3])===f.mes)&&(!f.procedimento||r[1]===f.procedimento)&&(!f.bairro||r[7]===f.bairro)&&(!f.obra||r[9]===f.obra)&&(!f.pendencia||(f.pendencia==='publico'&&DadosDaAplicacao.norm(r[1])==='relato de atividade'&&(r[14]===''||!/^\d+$/.test(String(r[14])))))&&
          (!f.busca||DadosDaAplicacao.norm(r[17]+' '+r[0]).includes(DadosDaAplicacao.norm(f.busca))))itens.push(this.registro(r));
        if(itens.length===limite)break;}}
    return {itens,proximoCursor:linha>1?JSON.stringify({linha,topo,filtro:assinatura}):null};
  }
  localizar(a,id) {const ids=this.ler(a,1);const encontrados=[];ids.forEach((r,i)=>{if(String(r[0])===id)encontrados.push(i+2);});if(encontrados.length!==1)throw new Error('Registro não encontrado ou identidade repetida.');return encontrados[0];}
  detalhe(id) {
    if(typeof id!=='string'||!/^REG-[a-f0-9]{24}$/.test(id))throw new Error('ID de registro inválido.');
    const a=this.registros(),r=a.getRange(this.localizar(a,id),1,1,21).getValues()[0];if(!this.permitido(r))throw new Error('Seu perfil não permite consultar este registro.');let d=JSON.parse(r[20]);
    if(d.arquivoDetalhesId)d=JSON.parse(DriveApp.getFileById(d.arquivoDetalhesId).getBlob().getDataAsString('UTF-8'));else d=d.conteudo||d;
    const campos=[],anexos=[];
    if(Array.isArray(d.campos))d.campos.forEach(x=>{if(x.valor!==''&&x.valor!=null&&!(Array.isArray(x.valor)&&!x.valor.length))campos.push({titulo:x.titulo,valor:DadosDaAplicacao.json(x.valor),secao:x.secao||'',tipo:x.tipo||''});});
    // Compatibilidade com o JSON preservado da migração 1.0/2.0/3.0.
    if(d.consolidado&&d.consolidado.campos)Object.entries(d.consolidado.campos).forEach(([titulo,valor])=>{if(valor!==''&&valor!=null)campos.push({titulo,valor:DadosDaAplicacao.json(valor),secao:'Registro original',tipo:''});});
    const vistos=new Set();const incluir=(valor,titulo)=>{const s=String(valor||''),m=s.match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{10,})/);const fid=m?m[1]:/^[A-Za-z0-9_-]{10,}$/.test(s)?s:'';
      if(fid&&!vistos.has(fid)){vistos.add(fid);anexos.push({id:fid,titulo,url:'https://drive.google.com/file/d/'+fid+'/view',previa:'https://drive.google.com/file/d/'+fid+'/preview'});}};
    [d.consolidado,...(d.respostas30||[])].filter(Boolean).forEach(fonte=>Object.entries(fonte.links||{}).forEach(([titulo,urls])=>{if(/foto|imagem|imagens|arquivo|video/.test(DadosDaAplicacao.norm(titulo)))(Array.isArray(urls)?urls:[urls]).forEach(u=>incluir(u,titulo));}));
    (d.anexos||[]).forEach(x=>incluir(x.arquivoId||x.url,x.titulo||'Anexo do registro'));
    campos.filter(x=>x.tipo==='FILE_UPLOAD'||/foto|imagem|imagens|arquivo|video/.test(DadosDaAplicacao.norm(x.titulo))).forEach(x=>{
      const valores=Array.isArray(x.valor)?x.valor:[x.valor];valores.forEach(v=>{const urls=String(v).match(/https:\/\/[^\s,;]+/g);if(urls)urls.forEach(u=>incluir(u,x.titulo));else if(x.tipo==='FILE_UPLOAD')incluir(v,x.titulo);});});
    return {registro:this.registro(r),campos,anexos,fonte:d.consolidado?'Histórico consolidado':'Formulário 4.0'};
  }
  carteira(p) {
    p=p||{};const f=this.filtros(p);if(f.estado&&!['abertos','concluidos'].includes(f.estado))throw new Error('Situação inválida.');
    const todos=this.ler(this.atendimentos(),18), associados=new Map(), porId=new Map(todos.map(r=>[String(r[0]),r]));
    todos.forEach(r=>{let atual=r, vistos=new Set();while(atual&&atual[1]&&atual[1]!==atual[0]){if(vistos.has(atual[0]))return;vistos.add(atual[0]);atual=porId.get(String(atual[1]));}if(atual)associados.set(String(atual[0]),(associados.get(String(atual[0]))||'')+' '+r[0]);});
    const selecionados=todos.filter(r=>this.principal(r)&&(!f.estado||(f.estado==='concluidos')===this.encerrado(r))&&
      (!f.busca||DadosDaAplicacao.norm(r[17]+' '+r[0]+' '+r[6]+' '+r[7]+' '+r[8]+' '+(associados.get(String(r[0]))||'')).includes(DadosDaAplicacao.norm(f.busca))));
    selecionados.sort((a,b)=>String(b[0]).localeCompare(String(a[0])));
    const pagina=p.pagina==null?0:Number(p.pagina);if(!Number.isInteger(pagina)||pagina<0)throw new Error('Página inválida.');
    return {itens:selecionados.slice(pagina*24,pagina*24+24).map(r=>this.atendimento(r)),total:selecionados.length,proximaPagina:(pagina+1)*24<selecionados.length?pagina+1:null};
  }
  ficha(protocolo) {
    if(typeof protocolo!=='string'||!protocolo||protocolo.length>100)throw new Error('Protocolo inválido.');
    const a=this.atendimentos(),todos=this.ler(a,18),mapa=new Map();todos.forEach(r=>{if(mapa.has(String(r[0])))throw new Error('Protocolo duplicado na base.');mapa.set(String(r[0]),r);});
    const vistos=new Set();let atual=protocolo,r;
    while(true){if(vistos.has(atual))throw new Error('Vínculo circular de protocolos.');vistos.add(atual);r=mapa.get(atual);if(!r)throw new Error('Protocolo não encontrado.');if(!r[1]||r[1]===atual)break;atual=String(r[1]);}
    return {protocoloConsultado:protocolo,ficha:this.atendimento(r)};
  }
  historicoFicha(p){
    p=p||{};const principal=this.ficha(p.protocolo).ficha.protocolo;
    const todos=this.ler(this.atendimentos(),18),mapa=new Map(todos.map(r=>[String(r[0]),r])),ids=new Set([principal]);
    for(const row of todos){let id=String(row[0]);const vistos=new Set();while(mapa.has(id)&&!vistos.has(id)){vistos.add(id);if(id===principal){ids.add(String(row[0]));break;}const linha=mapa.get(id);if(!linha[1]||String(linha[1])===id)break;id=String(linha[1]);}}
    const a=this.base.getSheetByName('Movimentações');if(!a)return {itens:[],aviso:'A tabela de movimentações importadas ainda não está disponível.'};
    const h=['ID','Protocolo','Data e hora','Tipo','Status','Autor','Resumo','Origem'];if(a.getRange(1,1,1,8).getValues()[0].some((v,i)=>v!==h[i]))throw new Error('Confira os cabeçalhos de Movimentações.');
    const topo=a.getLastRow();let linha=p.cursor==null?topo:Number(p.cursor);if(!Number.isInteger(linha)||linha<1||linha>topo)throw new Error('Página de histórico inválida.');const itens=[];let lidas=0;
    while(linha>1&&itens.length<30&&lidas<2000){const inicio=Math.max(2,linha-199),rows=a.getRange(inicio,1,linha-inicio+1,8).getValues();for(let i=rows.length-1;i>=0;i--){const row=rows[i];linha=inicio+i-1;lidas++;if(ids.has(String(row[1])))itens.push({id:String(row[0]),protocolo:String(row[1]),data:row[2] instanceof Date?Utilities.formatDate(row[2],this.fuso,'dd/MM/yyyy HH:mm'):String(row[2]||''),tipo:String(row[3]||''),status:String(row[4]||''),autor:String(row[5]||''),resumo:String(row[6]||''),origem:String(row[7]||'')});if(itens.length===30)break;}}
    return {itens,proximoCursor:linha>1?linha:null,protocoloPrincipal:principal};
  }

}

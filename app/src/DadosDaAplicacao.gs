/** DadosDaAplicacao 2.6.0. Somente leitura; compatível com a base Campo 4.0 importada. */
class DadosDaAplicacao {
  constructor(base, perfil) { this.perfil=perfil; this.base = base; this.fuso = base.getSpreadsheetTimeZone(); }
  /** 2.27: utilidades que eram do fechamento do relatório e continuam em uso (legendas, lembrete do contrato, metas de pesquisa). */
  static get metaSemanal() { return 15; }
  static get metaMensal() { return 60; }
  static br(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d || '') ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : (d || ''); }
  static mesExtenso(m) { const n = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']; return n[Number(m.slice(5, 7)) - 1] + ' de ' + m.slice(0, 4); }
  /** Campos do formulário guardados no registro (sem abrir arquivos do Drive). */
  static campos(json) {
    let d; try { d = JSON.parse(json || '{}'); } catch (_) { return null; }
    if (d.arquivoDetalhesId) return null;
    d = d.conteudo || d; const out = [];
    if (Array.isArray(d.campos)) d.campos.forEach(c => out.push([c.titulo, c.valor]));
    if (d.consolidado && d.consolidado.campos) Object.entries(d.consolidado.campos).forEach(e => out.push(e));
    return out;
  }
  /** Valor do primeiro campo cujo título combine com re (vazio se não houver). */
  static valor(campos, re) {
    if (!campos) return '';
    const achado = campos.find(([t, v]) => re.test(DadosDaAplicacao.norm(t)) && v !== '' && v != null && !(Array.isArray(v) && !v.length));
    return achado ? (Array.isArray(achado[1]) ? achado[1].join(', ') : String(achado[1])) : '';
  }
  static mesValido(v) { const s = String(v || ''); if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) throw new Error('Escolha um mês válido.'); return s; }
  static mesAnterior(m) { const d = new Date(m + '-15T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); }
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
  ler(a, largura) { const n = a.getLastRow()-1, v = n > 0 ? a.getRange(2,1,n,largura).getValues() : []; return a === this._reg && largura >= 11 ? v.map(r => this.vincular(r)) : v; }
  /** "Outra obra" vinculada pela gerência: a obra entra na leitura (J e K); a linha da base não é alterada. */
  vincular(r) { if (typeof ObrasDoDiaCPT === 'undefined' || String(r[10] || '')) return r; const v = ObrasDoDiaCPT.mapaVinculos().get(String(r[0])); if (v) { r[9] = v.rotulo; r[10] = v.id; } return r; }
  registro(r) { return {id:this.texto(r[0]),procedimento:this.texto(r[1]),data:this.data(r[2]),mes:this.mesCelula(r[3]),origem:this.texto(r[5]),bairro:this.texto(r[7]),bairroId:this.texto(r[8]),obra:this.texto(r[9]),obraId:this.texto(r[10]),responsavel:this.texto(r[11]),area:this.texto(r[12]),atividade:this.texto(r[13]),publico:r[14] === '' ? null : /^\d+$/.test(String(r[14])) ? Number(r[14]) : null,protocolo:this.texto(r[15]),conferencia:this.texto(r[18])}; }
  encerrado(r) { return /conclu|encerrad|finaliz/.test(DadosDaAplicacao.norm(r[3])); }
  principal(r) { return !!r[0] && (!r[1] || r[1] === r[0]) && !/incorporad|mesclad/.test(DadosDaAplicacao.norm(r[2])); }
  /** 2.26.6: número curto do caso ("Caso 17") a partir do protocolo ATD+ano+sequência; o protocolo continua o identificador oficial. */
  static numeroCaso(p) { const m = String(p || '').match(/^ATD(\d{4})(\d{4})$/); return m ? {ano: m[1], n: Number(m[2])} : null; }
  /** Busca por número de caso: "17", "caso 17", "#17", "17/25". null se o texto não é um número de caso. */
  static buscaCaso(t) { const m = DadosDaAplicacao.norm(t).match(/^(?:caso\s*|#\s*)?0*(\d{1,4})(?:\s*\/\s*(\d{2}|\d{4}))?$/); return m ? {n: Number(m[1]), ano: m[2] ? (m[2].length === 2 ? '20' + m[2] : m[2]) : ''} : null; }
  /** Anos em que cada número aparece (a sequência do protocolo recomeça a cada ano): uma leitura da coluna A por pedido. */
  anosPorNumero() {
    if (this._anosCaso) return this._anosCaso; const a = this.atendimentos(), n = a.getLastRow() - 1, m = new Map();
    if (n > 0) a.getRange(2, 1, n, 1).getValues().forEach(([p]) => { const c = DadosDaAplicacao.numeroCaso(p); if (c) { if (!m.has(c.n)) m.set(c.n, new Set()); m.get(c.n).add(c.ano); } });
    return (this._anosCaso = m);
  }
  /** "Caso 17"; com o ano ("Caso 17/25") só quando o mesmo número existe em mais de um ano. */
  caso(p) { const c = DadosDaAplicacao.numeroCaso(p); if (!c) return ''; const anos = this.anosPorNumero().get(c.n); return 'Caso ' + c.n + (anos && anos.size > 1 ? '/' + c.ano.slice(2) : ''); }
  atendimento(r) { return {caso:this.caso(r[0]),protocolo:this.texto(r[0]),principal:this.texto(r[1] || r[0]),status:this.texto(r[3]),abertura:this.data(r[4]),conclusao:this.data(r[5]),nome:this.texto(r[6]),assunto:this.texto(r[7]),endereco:this.texto(r[8]),obra:this.texto(r[9]),area:this.texto(r[10]),responsavel:this.texto(r[11]),proximaAcao:this.texto(r[12]),atualizacao:DadosDaAplicacao.json(r[13]),documento:this.url(r[14]),pdf:this.url(r[15]),origem:this.texto(r[16]),concluido:this.encerrado(r),incorporado:!this.principal(r),dias:this.dias(r)}; }
  /** Dias corridos em aberto (até a conclusão, se concluído). */
  dias(r) { const a=r[4] instanceof Date?r[4]:null; if(!a)return null; const fim=this.encerrado(r)&&r[5] instanceof Date?r[5]:new Date(); return Math.max(0,Math.floor((fim-a)/864e5)); }
  url(v) { const s = String(v || ''); return /^https:\/\/(?:docs|drive)\.google\.com\//i.test(s) ? s : ''; }
  filtros(p) {
    p = p || {}; if (typeof p !== 'object' || Array.isArray(p)) throw new Error('Filtros inválidos.');
    const f={}; ['mes','busca','procedimento','bairro','estado','obra','pendencia','com'].forEach(k => { if(p[k] != null && (typeof p[k] !== 'string' || p[k].length > 200))throw new Error('Filtro inválido.'); f[k]=String(p[k] || '').trim(); });
    if(f.mes)this.mes(f.mes);
    return f;
  }
  /** Visão do mês. Cache compartilhado por 10 min, invalidado por linha nova; atualizar=true recalcula. */
  inicio(mes, atualizar) {
    const reg = this.registros(), atd = this.atendimentos();
    // CPT_ATD_VERSAO sobe a cada ação em um caso (linhas editadas não mudam a última linha).
    // Movimentações cobre o que o Campo 4.0 grava (retorno da Execução), que é outro projeto.
    const mov = this.base.getSheetByName('Movimentações');
    const chave = 'inicio:'+this.base.getId()+':'+mes+':'+reg.getLastRow()+':'+atd.getLastRow()+':'+(mov?mov.getLastRow():0)+':'+(PropertiesService.getScriptProperties().getProperty('CPT_ATD_VERSAO')||0)+':'+(PropertiesService.getScriptProperties().getProperty('CPT_ENTREGAS_VERSAO')||0);
    const salvo = atualizar ? null : CacheCPT.ler(chave);
    if (salvo) return {...salvo, cache: true};
    const r = this.calcularInicio(mes, reg, atd);
    CacheCPT.gravar(chave, r, 600); CacheCPT.gravar('inicio:ultimo:'+mes, r, 21600);
    return r;
  }
  /**
   * Visão do mês 2.6: os números que o relatório usa (frase de totais do item 3, frentes, diagnósticos do item 2,
   * balanço de manifestações do item 10) e o preparo por item. Contagem bruta de registros sai do destaque.
   */
  calcularInicio(mes, reg, atd) {
    const linhas=this.ler(reg,19).filter(r=>this.permitido(r)), fichas=this.ler(atd,18).filter(r=>this.principal(r));
    const periodo=linhas.filter(r=>r[0]&&this.mesCelula(r[3])===mes), tipos=new Map(), dias=new Map(), destinos=new Map(), frentes=new Set(), bairros=new Set(), entregas=this.situacoesEntregas();
    let acoes=0, pessoas=0, semPublico=0, diagnosticos=0;
    const contar=(item,id)=>{const e=entregas.get(id)||{};if(e.destino&&item!=='2'&&SocioambientalCPT.item(e.destino))item=e.destino;const d=destinos.get(item)||{quantidade:0,prontos:0};d.quantidade++;if(e.situacao==='pronto')d.prontos++;destinos.set(item,d);};
    periodo.forEach(r=>{tipos.set(String(r[1]),(tipos.get(String(r[1]))||0)+1);
      const destino=SocioambientalCPT.destino(r[1],r[13],r[17]);if(!destino)return;
      if(destino==='2'){diagnosticos++;contar('2',String(r[0]));return;}
      acoes++;contar(destino,String(r[0]));if(r[14]!==''&&/^\d+$/.test(String(r[14])))pessoas+=Number(r[14]);else semPublico++;
      const dia=this.data(r[2]);if(dia.startsWith(mes))dias.set(dia,(dias.get(dia)||0)+1);
      const f=SocioambientalCPT.frente(r[9]);if(f)frentes.add(f);if(r[7])bairros.add(String(r[7]));});
    const concluidas=fichas.filter(r=>this.encerrado(r)), inicio=this.base.getSheetByName('Início');
    const formulario=inicio?this.url(inicio.getRange(3,2).getValue()):'';
    const anterior=new Date(mes+'-15T12:00:00Z');anterior.setUTCMonth(anterior.getUTCMonth()-1);const mesAnterior=anterior.toISOString().slice(0,7);
    const acoesAnterior=linhas.filter(r=>r[0]&&this.mesCelula(r[3])===mesAnterior&&!['2',null].includes(SocioambientalCPT.destino(r[1],r[13],r[17]))).length;
    const resultado={comparacao:{mesAnterior,anterior:acoesAnterior},mes,atualizadoEm:new Date().toISOString(),cache:false,
      indicadores:{acoes,pessoas,frentes:frentes.size,diagnosticos,bairros:bairros.size,obras:frentes.size,registros:periodo.length,participacoes:pessoas,relatosSemPublico:semPublico,abertos:fichas.length-concluidas.length,concluidos:concluidas.length,
        recebidasNoMes:fichas.filter(r=>this.data(r[4]).startsWith(mes)).length,concluidosNoMes:concluidas.filter(r=>this.data(r[5]).startsWith(mes)).length,
        frase:'Foram contabilizadas '+acoes+' ações socioambientais, totalizando '+pessoas+' pessoas alcançadas.'},
      destinos:SocioambientalCPT.itens.filter(x=>x.tipo!=='consolidado'||destinos.has(x.item)).map(x=>({item:x.item,titulo:x.titulo,tipo:x.tipo,quantidade:(destinos.get(x.item)||{}).quantidade||0,prontos:(destinos.get(x.item)||{}).prontos||0})),
      procedimentos:[...tipos].map(([nome,quantidade])=>({nome,quantidade})).sort((a,b)=>b.quantidade-a.quantidade),
      dias:[...dias].map(([data,quantidade])=>({data,quantidade})).sort((a,b)=>a.data.localeCompare(b.data)),
      recentes:periodo.slice(-5).reverse().map(r=>this.registro(r)),
      filtros:{procedimentos:[...new Set(linhas.map(r=>String(r[1])).filter(Boolean))].sort(),bairros:[...new Set(linhas.map(r=>String(r[7])).filter(Boolean))].sort(),obras:[...new Set(linhas.map(r=>String(r[9])).filter(Boolean))].sort()},
      links:{formulario},notaCarteira:'Estado atual das fichas importadas. O mês filtra os registros de campo.'};
    resultado.satisfacao=this.satisfacao(periodo,mes);
    return resultado;
  }
  /** Situação e destino escolhido na última revisão de cada relato/diagnóstico (vazio se a agenda não estiver configurada). */
  situacoesEntregas(){
    const out=new Map();
    try{const id=AplicacaoCPT.config().agendaId;if(!id)return out;const a=planilhaCPT_(id).getSheetByName('Entregas');
      if(a&&a.getLastRow()>1)a.getRange(2,1,a.getLastRow()-1,6).getValues().forEach(r=>{try{const e=JSON.parse(r[5]);out.set(String(r[0]),{situacao:String(e.situacao||''),destino:String(e.destino||'')});}catch(_){}});}catch(_){}
    return out;
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
    p=p||{};const f=this.filtros(p), a=this.registros(), limite=50; // 2.13: 50 por vez (lista em linhas)
    const assinatura=JSON.stringify(f);let linha=a.getLastRow(),topo=linha;
    if(p.cursor){let c;try{c=JSON.parse(p.cursor);}catch(_){throw new Error('Reinicie a busca.');}
      if(c.filtro!==assinatura||!Number.isInteger(c.linha)||!Number.isInteger(c.topo)||c.linha<1||c.linha>c.topo||c.topo>a.getLastRow())throw new Error('Os filtros mudaram. Reinicie a busca.');linha=c.linha;topo=c.topo;}
    const itens=[];let lidos=0;
    while(linha>1&&itens.length<limite&&lidos<2000){const n=Math.min(200,linha-1,2000-lidos),primeira=linha-n+1,bloco=a.getRange(primeira,1,n,19).getValues();
      for(let i=bloco.length-1;i>=0;i--){const r=this.vincular(bloco[i]);linha=primeira+i-1;lidos++;
        if(r[0]&&this.permitido(r)&&(!f.mes||this.mesCelula(r[3])===f.mes)&&(!f.procedimento||r[1]===f.procedimento)&&(!f.bairro||r[7]===f.bairro)&&(!f.obra||r[9]===f.obra)&&(!f.pendencia||(f.pendencia==='publico'&&DadosDaAplicacao.norm(r[1])==='relato de atividade'&&(r[14]===''||!/^\d+$/.test(String(r[14])))))&&
          (!f.busca||DadosDaAplicacao.norm(r[17]+' '+r[0]).includes(DadosDaAplicacao.norm(f.busca))))itens.push(this.registro(r));
        if(itens.length===limite)break;}}
    return {itens,proximoCursor:linha>1?JSON.stringify({linha,topo,filtro:assinatura}):null};
  }
  localizar(a,id) {const ids=this.ler(a,1);const encontrados=[];ids.forEach((r,i)=>{if(String(r[0])===id)encontrados.push(i+2);});if(encontrados.length!==1)throw new Error('Registro não encontrado ou identidade repetida.');return encontrados[0];}
  /** Detalhes JSON de um registro (coluna "Detalhes JSON"). Registros grandes guardam os detalhes num arquivo à parte (arquivoDetalhesId). */
  static lerDetalhes(celula) {
    let d = typeof celula === 'string' ? JSON.parse(celula || '{}') : (celula || {});
    return d.arquivoDetalhesId ? JSON.parse(DriveApp.getFileById(d.arquivoDetalhesId).getBlob().getDataAsString('UTF-8')) : (d.conteudo || d);
  }
  /**
   * Todos os arquivos de um registro, sem repetir, em qualquer formato salvo: link do Drive, código puro do Formulário 4.0,
   * lista de anexos do Campo 4.0 e links do histórico migrado. Usado pelo detalhe do registro e pela galeria (um lugar só).
   * Cada item: {id, titulo (pergunta), tipo: 'FILE_UPLOAD' | 'campo' | 'anexo' | 'historico'}.
   */
  static arquivosDoRegistro(d) {
    const out = [], vistos = new Set(), eArquivo = t => /foto|imagem|imagens|arquivo|video/.test(DadosDaAplicacao.norm(t));
    const incluir = (valor, titulo, tipo) => { const s = String(valor || ''), m = s.match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{10,})/), fid = m ? m[1] : /^[A-Za-z0-9_-]{10,}$/.test(s) ? s : '';
      if (fid && !vistos.has(fid)) { vistos.add(fid); out.push({id: fid, titulo, tipo}); } };
    [d.consolidado, ...(d.respostas30 || [])].filter(Boolean).forEach(fonte => Object.entries(fonte.links || {}).forEach(([titulo, urls]) => { if (eArquivo(titulo)) (Array.isArray(urls) ? urls : [urls]).forEach(u => incluir(u, titulo, 'historico')); }));
    const campos = (Array.isArray(d.campos) ? d.campos : []).concat(d.consolidado && d.consolidado.campos ? Object.entries(d.consolidado.campos).map(([titulo, valor]) => ({titulo, valor, tipo: ''})) : []);
    campos.filter(x => x.tipo === 'FILE_UPLOAD' || eArquivo(x.titulo)).forEach(x => {
      const v = DadosDaAplicacao.json(x.valor);
      (Array.isArray(v) ? v : [v]).forEach(item => { const urls = String(item).match(/https:\/\/[^\s,;"]+/g); if (urls) urls.forEach(u => incluir(u, x.titulo, x.tipo === 'FILE_UPLOAD' ? 'FILE_UPLOAD' : 'campo')); else if (x.tipo === 'FILE_UPLOAD') incluir(item, x.titulo, 'FILE_UPLOAD'); });
    });
    (d.anexos || []).forEach(x => incluir(x.arquivoId || x.url, x.titulo || 'Anexo do registro', 'anexo'));
    return out;
  }
  detalhe(id) {
    if(typeof id!=='string'||!/^REG-[a-f0-9]{24}$/.test(id))throw new Error('ID de registro inválido.');
    const a=this.registros(),r=this.vincular(a.getRange(this.localizar(a,id),1,1,21).getValues()[0]);if(!this.permitido(r))throw new Error('Seu perfil não permite consultar este registro.');const d=DadosDaAplicacao.lerDetalhes(r[20]);
    const campos=[];
    if(Array.isArray(d.campos))d.campos.forEach(x=>{if(x.valor!==''&&x.valor!=null&&!(Array.isArray(x.valor)&&!x.valor.length))campos.push({titulo:x.titulo,valor:DadosDaAplicacao.json(x.valor),secao:x.secao||'',tipo:x.tipo||''});});
    // Compatibilidade com o JSON preservado da migração 1.0/2.0/3.0.
    if(d.consolidado&&d.consolidado.campos)Object.entries(d.consolidado.campos).forEach(([titulo,valor])=>{if(valor!==''&&valor!=null)campos.push({titulo,valor:DadosDaAplicacao.json(valor),secao:'Registro original',tipo:''});});
    const anexos=DadosDaAplicacao.arquivosDoRegistro(d).map(x=>({id:x.id,titulo:x.titulo,url:'https://drive.google.com/file/d/'+x.id+'/view',previa:'https://drive.google.com/file/d/'+x.id+'/preview'}));
    return {registro:this.registro(r),campos,anexos,fonte:d.consolidado?'Histórico consolidado':'Formulário 4.0'};
  }
  carteira(p) {
    p=p||{};const f=this.filtros(p);if(f.estado&&!['abertos','concluidos'].includes(f.estado))throw new Error('Situação inválida.');if(f.com&&!['Execução','Atendimento'].includes(f.com))throw new Error('Filtro inválido.');
    const todos=this.ler(this.atendimentos(),18), associados=new Map(), porId=new Map(todos.map(r=>[String(r[0]),r]));
    todos.forEach(r=>{let atual=r, vistos=new Set();while(atual&&atual[1]&&atual[1]!==atual[0]){if(vistos.has(atual[0]))return;vistos.add(atual[0]);atual=porId.get(String(atual[1]));}if(atual)associados.set(String(atual[0]),(associados.get(String(atual[0]))||'')+' '+r[0]);});
    // 2.26.6: "17", "caso 17" ou "17/25" acham o caso pelo número (o próprio protocolo ou um incorporado a ele).
    const bc=f.busca?DadosDaAplicacao.buscaCaso(f.busca):null,ehCaso=p=>{const c=DadosDaAplicacao.numeroCaso(p);return !!c&&c.n===bc.n&&(!bc.ano||c.ano===bc.ano);};
    const selecionados=todos.filter(r=>this.principal(r)&&(!f.estado||(f.estado==='concluidos')===this.encerrado(r))&&(!f.com||(!this.encerrado(r)&&String(r[10])===f.com))&&
      (!f.busca||(bc?[String(r[0])].concat(String(associados.get(String(r[0]))||'').split(' ').filter(Boolean)).some(ehCaso):DadosDaAplicacao.norm(r[17]+' '+r[0]+' '+r[6]+' '+r[7]+' '+r[8]+' '+(associados.get(String(r[0]))||'')).includes(DadosDaAplicacao.norm(f.busca)))));
    // Com filtro de responsável, os mais antigos primeiro (fila de trabalho); sem filtro, os mais novos.
    selecionados.sort((a,b)=>f.com?String(a[0]).localeCompare(String(b[0])):String(b[0]).localeCompare(String(a[0])));
    const pagina=p.pagina==null?0:Number(p.pagina);if(!Number.isInteger(pagina)||pagina<0)throw new Error('Página inválida.');
    // 2.13: 50 por página (a lista em linhas mostra mais casos por tela).
    const POR=50;return {itens:selecionados.slice(pagina*POR,pagina*POR+POR).map(r=>this.atendimento(r)),total:selecionados.length,proximaPagina:(pagina+1)*POR<selecionados.length?pagina+1:null};
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

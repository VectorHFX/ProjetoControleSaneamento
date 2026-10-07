/**
 * DiagnosticosCPT 2.47.0. Diagnósticos de área como na Central CPT 4.0 (pedido do Victor em 07/10/2026).
 * - Um diagnóstico por vez: o registro de campo (por blocos, nunca alterado) e a revisão — título, síntese, próximos passos,
 *   os 24 campos da ficha oficial (já preenchidos pelo formulário) e até 12 fotos com legenda. Cada salvamento é uma versão.
 * - Situação: Rascunho → Em revisão → Revisado. Revisado (aprovação) é com a Gestão ou o Administrativo.
 * - Gera a FICHA SABESP (cópia do modelo oficial, só preenchida) e a APRESENTAÇÃO (Google Slides no desenho da Central),
 *   as duas com PDF, em "CPT • Diagnósticos/AAAA/MM - mês". Gerar de novo guarda a anterior em "Versões anteriores".
 * - Se o registro de campo mudar depois da revisão, aparece "Mudou no campo" e é preciso salvar de novo antes de gerar.
 * - Por obra (só consulta): a tabela-resumo de cada obra do catálogo; diagnóstico sem obra é vinculado pela gerência.
 * - Desempenho (2.46.1): índice persistente do resumo de cada diagnóstico; a revisão lê só a linha do diagnóstico aberto.
 */
class DiagnosticosCPT {
  static get aba() { return 'Revisão dos diagnósticos'; }
  static get nomeRaiz() { return 'CPT • Diagnósticos'; }
  static get maxFotos() { return 12; }
  static get situacoes() { return [['rascunho', 'Rascunho'], ['revisao', 'Em revisão'], ['revisado', 'Revisado']]; }
  static rotuloSituacao(s) { const x = DiagnosticosCPT.situacoes.find(y => y[0] === s); return x ? x[1] : s; }
  static podeRevisar(p) { return RelatosRelatorioCPT.pode(p); }
  static norm(v) { return DadosDaAplicacao.norm(v); }
  /** Campos do formulário de diagnóstico, por bloco do documento. Campo vazio não aparece. */
  static get grupos() {
    return [
      ['Território', [['Intervalo de numeração', /^intervalo de numeracao/], ['Padrão construtivo', /^padrao ou padroes construtivos/], ['Pavimento', /^tipo de pavimento/], ['Calçadas', /^tipo de calcadas/],
        ['Condições da via', /^condicoes da via/], ['Tráfego de veículos', /^trafego de veiculos/], ['Tráfego de pedestres', /^trafego de pedestres/], ['Muitas construções no trecho', /^ha muitas construcoes/],
        ['Praças no trecho', /^ha presenca de pracas/], ['Locais possíveis para a tenda', /^possiveis locais para instalacao de tenda/]]],
      ['Equipamentos do entorno', [['Pontos de ônibus', /^existem pontos de onibus/], ['Frequência dos ônibus', /^com qual frequencia passam/], ['Escolas', /^existem escolas/],
        ['Escolas públicas (quantidade)', /^quantidade de escolas/], ['Escolas identificadas', /^escolas e equipamentos de educacao/], ['UBS ou hospitais', /^existe ubs ou hospitais/],
        ['UBS (quantidade)', /^quantidade de ubs/], ['UBS ou hospitais identificados', /^ubs ou hospitais identificados/], ['Centros comunitários ou ONGs', /^existem centros comunitarios/],
        ['Centros e ONGs identificados', /^centros comunitarios, ongs/]]],
      ['Infraestrutura sanitária', [['Infraestrutura identificada', /^infraestrutura sanitaria identificada/], ['Observações', /^observacoes sobre a infraestrutura/]]],
      ['População', [['Faixas etárias predominantes', /^faixas etarias predominantes/], ['Grupos etários', /^observacoes sobre grupos etarios/], ['Perfil socioeconômico', /^perfil socioeconomico/],
        ['Indicadores do perfil', /^indicadores utilizados para classificar/], ['IPVS', /^indice paulista de vulnerabilidade|\bipvs\b/], ['Lideranças no território', /^foram identificadas liderancas/]]],
      ['Imóveis e pontos de atenção', [['Imóveis residenciais', /^quantidade de imoveis residenciais/], ['Imóveis comerciais', /^quantidade de imoveis comerciais/], ['Pontos críticos', /^pontos criticos/],
        ['Ocorrências na região', /^ocorrencias observadas/]]]
    ];
  }
  /** Resumo curto (64 bits em hex) de um texto, para chave de cache e para saber se a obra mudou desde o documento. */
  static resumo(s) { let a = 5381, b = 52711; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = (a * 33) ^ c; b = (b * 31) ^ c; a |= 0; b |= 0; } return (a >>> 0).toString(16) + (b >>> 0).toString(16); }
  static eDiagnostico(r) { return /diagnost/.test(DiagnosticosCPT.norm(r[1])); }

  constructor(ctx) { this.ctx = ctx; if (!ctx.base) ctx.base = planilhaCPT_(ctx.config.baseId); this.dados = new DadosDaAplicacao(ctx.base, ctx.perfil); this.revisoes = new ColecaoCPT(ctx, DiagnosticosCPT.aba, 'RDG'); }
  catalogo() { if (!this._obras) { const o = new ObrasCPT(this.ctx); this._obras = o.ler().linhas.map(x => o.publico(x)); } return this._obras; }
  /** Linhas dos diagnósticos (A:T, com os vínculos de obra aplicados) e o número da linha na planilha. */
  linhas() {
    if (!this._linhas) this._linhas = this.dados.ler(this.dados.registros(), 20).map((r, i) => ({r, linha: i + 2})).filter(x => x.r[0] && DiagnosticosCPT.eDiagnostico(x.r));
    return this._linhas;
  }
  /** Detalhes do registro: os campos do formulário (na célula ou no arquivo à parte) e o texto bruto (para achar as fotos). */
  static detalhes(celula) {
    const D = DadosDaAplicacao; let bruto = String(celula || ''), c = D.campos(bruto);
    if (!c && /arquivoDetalhesId/.test(bruto)) try { bruto = JSON.stringify(D.lerDetalhes(bruto)); c = D.campos(bruto); } catch (_) { c = null; }
    return {v: re => D.valor(c, re), c, bruto};
  }
  static fotosDe(bruto) { return [...new Set((bruto.match(/(?:\/d\/|[?&]id=)[A-Za-z0-9_-]{25,}/g) || []).map(s => s.replace(/^(?:\/d\/|[?&]id=)/, '')))]; }
  /** O que a lista e a tabela-resumo usam dos detalhes (vai para o índice). */
  static extrair(celula) {
    const {v, bruto} = DiagnosticosCPT.detalhes(celula);
    return {frente: v(/^titulo da frente/).slice(0, 300), endereco: v(/^endereco da frente|^endereco completo/).slice(0, 300), ipvs: v(/^indice paulista de vulnerabilidade|\bipvs\b/).slice(0, 200),
      perfil: v(/^perfil socioeconomico/).slice(0, 300), residenciais: v(/^quantidade de imoveis residenciais/).slice(0, 60), comerciais: v(/^quantidade de imoveis comerciais/).slice(0, 60),
      escolas: (v(/^quantidade de escolas/) || v(/^existem escolas/)).slice(0, 100), ubs: (v(/^quantidade de ubs/) || v(/^existe ubs ou hospitais/)).slice(0, 100), pontos: v(/^pontos criticos/).slice(0, 300), nFotos: DiagnosticosCPT.fotosDe(bruto).length};
  }
  /** Colunas da base (sempre atuais) + o resumo do índice. */
  static item(x, dados, resumo) {
    const r = x.r; return {id: String(r[0]), linha: x.linha, data: dados.data(r[2]), bairro: String(r[7] || ''), obraTexto: SocioambientalCPT.frente(r[9]), obraId: String(r[10] || ''), responsavel: String(r[11] || ''), hash: String(r[19] || ''), ...resumo};
  }
  // Índice dos diagnósticos (planilha de dados da aplicação), como o dos relatos: os detalhes de cada registro são lidos uma vez
  // só; o registro que mudar (hash) é relido. Pode ser apagado sem perda: refaz sozinho.
  static get abaIndice() { return 'Índice dos diagnósticos'; }
  static chave(r) { return String(r[19] || '') + '|1'; }
  lerIndice() {
    const out = new Map(); let a = null; try { a = planilhaCPT_(this.ctx.config.agendaId).getSheetByName(DiagnosticosCPT.abaIndice); } catch (_) { return out; }
    if (!a || a.getLastRow() < 2) return out;
    a.getRange(2, 1, a.getLastRow() - 1, 3).getValues().forEach(r => { if (r[0]) try { out.set(String(r[0]), {chave: String(r[1]), x: JSON.parse(r[2])}); } catch (_) {} });
    return out;
  }
  gravarIndice(lista, indice) {
    const ss = planilhaCPT_(this.ctx.config.agendaId); let a = ss.getSheetByName(DiagnosticosCPT.abaIndice);
    if (!a) { a = ss.insertSheet(DiagnosticosCPT.abaIndice); a.getRange(1, 1, 1, 3).setValues([['ID do registro', 'Chave', 'Resumo para a tela (pode apagar: refaz sozinho)']]); a.setFrozenRows(1); }
    const linhas = lista.map(x => { const e = indice.get(String(x.r[0])); return [String(x.r[0]), e.chave, JSON.stringify(e.x)]; });
    const sobra = a.getLastRow() - 1 - linhas.length; if (linhas.length) a.getRange(2, 1, linhas.length, 3).setValues(linhas);
    if (sobra > 0) a.getRange(linhas.length + 2, 1, sobra, 3).clearContent();
  }
  /**
   * Todos os diagnósticos (resumo). Cache de 10 minutos pela última linha da base e pelos vínculos de obra (como os relatos):
   * a consulta em cache não lê a aba Registros; registro editado aparece em até 10 minutos. Só os novos ou alterados leem
   * os detalhes (índice).
   */
  diagnosticos() {
    if (this._diag) return this._diag;
    const chave = 'diag3:' + this.ctx.config.baseId + ':' + this.dados.registros().getLastRow() + ':' + ObrasDoDiaCPT.versaoVinculos();
    return (this._diag = CacheCPT.obter(chave, 600, () => {
      const l = this.linhas();
      const indice = this.lerIndice(), faltam = l.filter(x => { const e = indice.get(String(x.r[0])); return !e || e.chave !== DiagnosticosCPT.chave(x.r); }).sort((a, b) => a.linha - b.linha);
      if (faltam.length) {
        const a = this.dados.registros();
        // Faixas de linhas próximas numa leitura só (buracos de até 3 linhas): poucas chamadas mesmo com muitos diagnósticos novos.
        // Muitas faixas (primeira montagem com centenas de diagnósticos): uma leitura só, do primeiro ao último.
        const faixas = faltam.filter((x, k) => k === 0 || x.linha - faltam[k - 1].linha > 4).length, gap = faixas > 40 ? Infinity : 4;
        for (let i = 0; i < faltam.length;) {
          let j = i; while (j + 1 < faltam.length && faltam[j + 1].linha - faltam[j].linha <= gap) j++;
          const v = a.getRange(faltam[i].linha, 21, faltam[j].linha - faltam[i].linha + 1, 1).getValues();
          for (let k = i; k <= j; k++) indice.set(String(faltam[k].r[0]), {chave: DiagnosticosCPT.chave(faltam[k].r), x: DiagnosticosCPT.extrair(v[faltam[k].linha - faltam[i].linha][0])});
          i = j + 1;
        }
        try { this.gravarIndice(l, indice); } catch (e) { console.warn('Índice dos diagnósticos: ' + e.message); }
      }
      return l.map(x => DiagnosticosCPT.item(x, this.dados, indice.get(String(x.r[0])).x));
    }));
  }
  /** Um diagnóstico com todos os blocos (lê a linha dele): tela de detalhe e documento. */
  completo(d) {
    const r = this.dados.registros().getRange(d.linha, 1, 1, 21).getValues()[0];
    if (String(r[0]) !== d.id) throw new Error('A base mudou de ordem. Atualize a página.');
    const {v, c: pares, bruto} = DiagnosticosCPT.detalhes(r[20]);
    const campos = DiagnosticosCPT.grupos.map(([titulo, lista]) => [titulo, lista.map(([rot, re]) => [rot, v(re).slice(0, 2000)]).filter(([, val]) => val)]).filter(([, l]) => l.length);
    return {...d, hash: String(r[19] || ''), relato: v(/^relato do diagnostico|^relato da atividade/).slice(0, 12000), observacao: v(/^observacao final/).slice(0, 4000), campos, fotos: DiagnosticosCPT.fotosDe(bruto), pares: pares || []};
  }
  /** Obra do catálogo de um diagnóstico: pelo ID; senão pelo nome da obra ou pelo título da frente. */
  obraDe(d, porId, porNome) {
    if (d.obraId && porId.has(d.obraId)) return porId.get(d.obraId);
    return [d.obraTexto, d.frente].map(n => porNome.get(PaineisGestaoCPT.chaveObra(n))).find(Boolean) || null;
  }
  agrupar() {
    const obras = this.catalogo(), porId = new Map(obras.map(o => [o.id, o])), porNome = new Map(obras.flatMap(o => ObrasCPT.nomesConhecidos(o).map(n => [PaineisGestaoCPT.chaveObra(n), o])));
    const grupos = new Map(), sem = [];
    this.diagnosticos().forEach(d => { const o = this.obraDe(d, porId, porNome); if (!o) { sem.push(d); return; } if (!grupos.has(o.id)) grupos.set(o.id, {obra: o, lista: []}); grupos.get(o.id).lista.push(d); });
    grupos.forEach(g => g.lista.sort((a, b) => a.data.localeCompare(b.data)));
    return {grupos, sem: sem.sort((a, b) => b.data.localeCompare(a.data)), obras};
  }
  static linhaResumo(d) { return {id: d.id, data: d.data, trecho: d.endereco || d.frente || d.bairro, ipvs: d.ipvs, perfil: d.perfil, residenciais: d.residenciais, comerciais: d.comerciais, escolas: d.escolas, ubs: d.ubs, pontos: d.pontos, responsavel: d.responsavel, fotos: d.nFotos}; }
  /** Situação da revisão de um diagnóstico para a lista (sem = ainda não revisado). */
  static situacao(rev, d) { return !rev ? {situacao: 'sem', mudou: false} : {situacao: rev.situacao, mudou: rev.hashOrigem !== d.hash, ficha: rev.arquivos && rev.arquivos.ficha || null, slides: rev.arquivos && rev.arquivos.slides || null, por: rev.nome || '', em: rev.alteradoEm || ''}; }
  listar() {
    const {grupos, sem, obras} = this.agrupar(), revs = new Map(this.revisoes.itens().map(x => [x.registroId, x])), vincula = ObrasDoDiaCPT.pode(this.ctx.perfil), c = AplicacaoCPT.config();
    const obraDoId = new Map(); grupos.forEach(g => g.lista.forEach(d => obraDoId.set(d.id, g.obra.exibir)));
    const lista = this.diagnosticos().map(d => ({...DiagnosticosCPT.linhaResumo(d), bairro: d.bairro, obra: obraDoId.get(d.id) || d.obraTexto || '', semObra: !obraDoId.has(d.id), ...DiagnosticosCPT.situacao(revs.get(d.id), d)}))
      .sort((a, b) => b.data.localeCompare(a.data));
    const porObra = [...grupos.values()].map(({obra: o, lista: l}) => ({obraId: o.id, nome: o.exibir, situacao: o.situacao || 'A confirmar', bairros: o.bairros, total: l.length, primeiro: l[0].data, ultimo: l[l.length - 1].data, linhas: l.map(DiagnosticosCPT.linhaResumo)}))
      .sort((a, b) => b.ultimo.localeCompare(a.ultimo) || a.nome.localeCompare(b.nome, 'pt-BR'));
    return {diagnosticos: lista, obras: porObra, semObra: sem.map(d => ({...DiagnosticosCPT.linhaResumo(d), obraTexto: d.obraTexto, bairro: d.bairro})), total: lista.length,
      podeRevisar: DiagnosticosCPT.podeRevisar(this.ctx.perfil), podeAprovar: PerfisCPT.gerencia(this.ctx.perfil), podeVincular: vincula,
      pasta: c.diagnosticosPastaId ? 'https://drive.google.com/drive/folders/' + c.diagnosticosPastaId : '',
      catalogo: vincula ? obras.map(o => ({id: o.id, exibir: o.exibir, situacao: o.situacao})).sort((a, b) => (a.situacao === 'Finalizada') - (b.situacao === 'Finalizada') || a.exibir.localeCompare(b.exibir, 'pt-BR')) : []};
  }
  linhaDe(id) { const d = this.diagnosticos().find(x => x.id === String(id || '')); if (!d) throw new Error('Diagnóstico não encontrado. Atualize a página.'); return d; }
  static thumbs(ids) { return ids.map(f => ({id: f, url: 'https://drive.google.com/file/d/' + f + '/view', thumb: 'https://drive.google.com/thumbnail?id=' + f + '&sz=w320'})); }
  /** Um diagnóstico: o registro de campo (blocos) e, para quem revisa, a revisão atual ou a sugestão tirada do formulário. */
  abrir(id) {
    const d = this.completo(this.linhaDe(id)), out = {...d, fotos: DiagnosticosCPT.thumbs(d.fotos)};
    delete out.pares; if (!DiagnosticosCPT.podeRevisar(this.ctx.perfil)) return out;
    const rev = this.revisoes.obter('RDG-' + d.id), sug = DiagnosticoOficialCPT.sugestao(d);
    out.revisao = rev ? {titulo: rev.titulo, texto: rev.texto, encaminhamentos: rev.encaminhamentos, oficiais: rev.oficiais, fotos: rev.fotos, situacao: rev.situacao, versao: rev.versao, nome: rev.nome, em: rev.alteradoEm,
      mudou: rev.hashOrigem !== d.hash, arquivos: rev.arquivos || {}} : null;
    out.sugestao = {titulo: sug.titulo, texto: d.relato, encaminhamentos: '', oficiais: sug.oficiais, fotos: [], situacao: 'rascunho'};
    out.camposFicha = DiagnosticoOficialCPT.campos.map(f => ({chave: f[0], rotulo: f[3]})); out.limite = DiagnosticosCPT.maxFotos; out.podeAprovar = PerfisCPT.gerencia(this.ctx.perfil);
    out.historico = rev ? this.revisoes.historico('RDG-' + d.id).slice(0, 12).map(x => ({versao: x.versao, situacao: x.situacao, nome: x.nome, em: x.alteradoEm, gerou: x.gerou || ''})) : [];
    return out;
  }
  /** Salva a revisão (cada salvamento é uma versão; o registro de campo nunca muda). "Revisado" é com a Gestão ou o Administrativo. */
  salvar(p) {
    if (!DiagnosticosCPT.podeRevisar(this.ctx.perfil)) throw new Error('A revisão dos diagnósticos é com Socioambiental, Comunicação, Gestão e Administrativo.');
    p = p || {}; const d = this.completo(this.linhaDe(p.id)), T = ColecaoCPT.texto, antigo = this.revisoes.obter('RDG-' + d.id);
    if (Number(p.versao || 0) !== (antigo ? antigo.versao : 0)) throw new Error('Outra pessoa salvou este diagnóstico agora há pouco. Copie seu texto, reabra e confira antes de salvar.');
    if (!DiagnosticosCPT.situacoes.some(s => s[0] === p.situacao)) throw new Error('Escolha a situação: Rascunho, Em revisão ou Revisado.');
    if (p.situacao === 'revisado' && !PerfisCPT.gerencia(this.ctx.perfil)) throw new Error(antigo && antigo.situacao === 'revisado' ? 'Este diagnóstico já foi aprovado. Para mudar, salve como "Em revisão" e peça nova aprovação.' : 'Marcar como Revisado é com a Gestão ou o Administrativo. Salve "Em revisão" para pedir a aprovação.');
    const fotos = Array.isArray(p.fotos) ? p.fotos : [];
    if (fotos.length > DiagnosticosCPT.maxFotos || new Set(fotos.map(f => f && f.id)).size !== fotos.length) throw new Error('Escolha no máximo ' + DiagnosticosCPT.maxFotos + ' fotos diferentes.');
    const oficiais = {}, o = p.oficiais && typeof p.oficiais === 'object' ? p.oficiais : {};
    DiagnosticoOficialCPT.chaves().forEach(k => { oficiais[k] = T(o[k], 2000, DiagnosticoOficialCPT.rotulo(k)); });
    const item = {registroId: d.id, data: d.data, titulo: T(p.titulo, 180, 'título', true), texto: T(p.texto, 20000, 'síntese', true), encaminhamentos: T(p.encaminhamentos, 5000, 'próximos passos'), oficiais,
      fotos: fotos.map(f => { if (!d.fotos.includes(String(f.id))) throw new Error('Uma das fotos não pertence a este diagnóstico. Atualize a página.'); return {id: String(f.id), legenda: T(f.legenda, 300, 'legenda')}; }),
      situacao: p.situacao, hashOrigem: d.hash, nome: this.ctx.perfil.nome, arquivos: antigo && antigo.arquivos || {}, gerou: ''};
    const e = this.revisoes.gravar(item, antigo ? antigo.versao : 0, p.operacaoId, 'RDG-' + d.id);
    return {resultado: 'Revisão ' + e.versao + ' salva (' + DiagnosticosCPT.rotuloSituacao(e.situacao) + '). O registro de campo continua como veio.', revisao: {...item, versao: e.versao, em: e.alteradoEm, mudou: false}};
  }

  vincular(p) {
    p = p || {}; const livres = new Set(this.agrupar().sem.filter(d => !d.obraId).map(d => d.id));
    if (!livres.has(String(p.registroId || ''))) throw new Error('Este diagnóstico já está numa obra ou não foi encontrado. Atualize a página.');
    return new ObrasDoDiaCPT(this.ctx).vincular(p, id => livres.has(id));
  }

  // ---------------- Ficha Sabesp e apresentação (como na Central CPT 4.0) ----------------
  raiz() {
    const c = AplicacaoCPT.config(); let raiz = null;
    if (c.diagnosticosPastaId) try { raiz = DriveApp.getFolderById(c.diagnosticosPastaId); } catch (_) {}
    if (!raiz) { raiz = DriveApp.createFolder(DiagnosticosCPT.nomeRaiz); const a = AplicacaoCPT.config(); a.diagnosticosPastaId = raiz.getId(); PropertiesService.getScriptProperties().setProperty(AplicacaoCPT.chave, JSON.stringify(a)); }
    return raiz;
  }
  /** "CPT • Diagnósticos/AAAA/MM - mês". */
  pastaDo(dia) { const S = RelatosRelatorioCPT.subpasta; return S(S(this.raiz(), dia.slice(0, 4)), dia.slice(5, 7) + ' - ' + DadosDaAplicacao.mesExtenso(dia.slice(0, 7)).split(' ')[0]); }
  static limpo(s) { return String(s).replace(/[\\/:*?"<>|\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70); }
  static nome(d, rev, tipo) { return [d.data.split('-').reverse().join('-'), DiagnosticosCPT.limpo(rev.titulo.replace(/^Diagn[oó]stico local:\s*/i, '')), tipo].filter(Boolean).join(' — '); }
  static url(tipo, id) { return tipo === 'pdf' ? 'https://drive.google.com/file/d/' + id + '/view' : tipo === 'slides' ? 'https://docs.google.com/presentation/d/' + id + '/edit' : 'https://docs.google.com/document/d/' + id + '/edit'; }
  static pdf(id, nome, pasta) { const f = pasta.createFile(DriveApp.getFileById(id).getAs(MimeType.PDF).setName(nome + '.pdf')); return DiagnosticosCPT.url('pdf', f.getId()); }
  /** Gera a ficha Sabesp (modelo oficial, só preenchido) ou a apresentação (Slides), com PDF, a partir da revisão salva. */
  gerar(p) {
    if (!DiagnosticosCPT.podeRevisar(this.ctx.perfil)) throw new Error('Os documentos do diagnóstico são gerados por Socioambiental, Comunicação, Gestão ou Administrativo.');
    p = p || {}; if (!['ficha', 'slides'].includes(p.tipo)) throw new Error('Escolha a ficha Sabesp ou a apresentação.');
    const d = this.completo(this.linhaDe(p.id)), rev = this.revisoes.obter('RDG-' + d.id);
    if (!rev) throw new Error('Salve a revisão antes de gerar.');
    if (rev.hashOrigem !== d.hash) throw new Error('O registro de campo mudou depois da revisão. Reabra, confira e salve de novo antes de gerar.');
    const pasta = this.pastaDo(d.data), avisos = [], v = p.tipo === 'ficha' ? this.ficha(d, rev, pasta) : this.slides(d, rev, pasta, avisos), anterior = (rev.arquivos || {})[p.tipo];
    if (anterior) { const velhas = RelatosRelatorioCPT.subpasta(pasta, 'Versões anteriores'); [anterior.doc, anterior.pdf].map(u => (String(u || '').match(/\/d\/([A-Za-z0-9_-]{20,})/) || [])[1]).filter(Boolean).forEach(id => { try { DriveApp.getFileById(id).moveTo(velhas); } catch (_) {} }); }
    const arquivo = {...v, revisao: rev.versao, em: new Date().toISOString(), por: this.ctx.perfil.nome}, arquivos = {...(rev.arquivos || {}), [p.tipo]: arquivo};
    const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('O documento foi gerado, mas não foi registrado agora. Gere de novo em instantes.');
    try { this.revisoes.gravar({...rev, arquivos, gerou: p.tipo}, rev.versao, p.operacaoId, rev.id); } finally { lock.releaseLock(); }
    return {resultado: (p.tipo === 'ficha' ? 'Ficha Sabesp' : 'Apresentação') + ' gerada (Google ' + (p.tipo === 'ficha' ? 'Docs' : 'Slides') + ' e PDF) a partir da revisão ' + rev.versao + '.' + (avisos.length ? ' Atenção: ' + avisos.join(' ') : ''), arquivos};
  }
  /** Ficha oficial: cópia do modelo Sabesp, só preenchida. OBSERVAÇÕES = síntese + próximos passos. */
  ficha(d, rev, pasta) {
    const c = AplicacaoCPT.config(), modelo = c.modeloDiagnosticoId || DiagnosticoOficialCPT.modeloPadrao, nome = DiagnosticosCPT.nome(d, rev, 'FICHA SABESP');
    DiagnosticoOficialCPT.tabela(DocumentApp.openById(modelo));
    const copia = DriveApp.getFileById(modelo).makeCopy(nome, pasta), doc = DocumentApp.openById(copia.getId()), t = DiagnosticoOficialCPT.tabela(doc), o = rev.oficiais || {};
    DiagnosticoOficialCPT.campos.forEach(f => t.getRow(f[1]).getCell(f[2] + 1).editAsText().setText(o[f[0]] || 'Não informado'));
    t.getRow(6).getCell(2).editAsText().setText([rev.texto, rev.encaminhamentos ? 'Próximos passos\n' + rev.encaminhamentos : ''].filter(Boolean).join('\n\n') || 'Não informado');
    doc.saveAndClose();
    return {doc: DiagnosticosCPT.url('doc', copia.getId()), pdf: DiagnosticosCPT.pdf(copia.getId(), nome, pasta)};
  }
  /** Páginas da apresentação, igual à Central: capa, leitura do território, perfil com indicadores, temas, próximos passos e fotos. */
  static paginas(d, rev) {
    const o = rev.oficiais || {}, c = re => DadosDaAplicacao.valor(d.pares, re), legendas = {}; (rev.fotos || []).forEach(f => { legendas[f.id] = f.legenda; });
    const grupo = (titulo, ks) => ({titulo, texto: ks.filter(k => o[k]).map(k => DiagnosticoOficialCPT.rotulo(k) + ': ' + o[k]).join('\n\n')});
    const perfil = grupo('Moradia e perfil social', ['perfil', 'padrao']);
    perfil.texto = [perfil.texto, [c(/^faixas etarias predominantes/), c(/^observacoes sobre grupos etarios/)].filter(Boolean).join(' ')].filter(Boolean).join('\n\n');
    perfil.kpis = [['Residências', o.residencias || 'Não informado'], ['Comércios', o.comercios || 'Não informado'], ['IPVS informado', o.ipvs || 'Não informado']];
    const blocos = [{titulo: 'Leitura do território', texto: rev.texto || d.relato}, perfil, grupo('Infraestrutura e circulação', ['pavimento', 'condicao', 'veiculos', 'pedestres', 'onibus']),
      {titulo: 'Condições sanitárias', texto: [c(/^infraestrutura sanitaria identificada/), c(/^observacoes sobre a infraestrutura/)].filter(Boolean).join('\n\n')}, grupo('Pontos de atenção', ['impactos', 'criticos']),
      grupo('Rede local e mobilização', ['liderancas', 'escolas', 'ubs', 'ongs', 'comunicacao']), {titulo: 'Próximos passos', texto: rev.encaminhamentos || ''}];
    const fotos = (rev.fotos || []).map(f => f.id), paginas = [{titulo: rev.titulo || o.frente || d.bairro, texto: [o.endereco || d.endereco, d.bairro, DadosDaAplicacao.br(d.data), d.id].filter(Boolean).join('\n'), capa: true}]; let foto = 0;
    blocos.filter(b => b.texto || b.kpis).forEach(b => {
      const usar = !b.kpis && foto < fotos.length && DiagnosticosCPT.paginar(b.texto, 42, 11).length === 1, partes = DiagnosticosCPT.paginar(b.texto, usar ? 42 : 82, b.kpis ? 6 : 11);
      (partes.length ? partes : ['']).forEach((t, i) => { const pg = {titulo: b.titulo + (i ? ' · continuação' : ''), texto: t}; if (b.kpis && !i) pg.kpis = b.kpis; if (usar && !i) pg.foto = fotos[foto++]; paginas.push(pg); });
    });
    while (foto < fotos.length) { const id = fotos[foto++]; paginas.push({titulo: 'Registro do território', texto: legendas[id] || 'Registro fotográfico do diagnóstico.', foto: id}); }
    return {paginas, legendas};
  }
  static paginar(texto, largura, linhas) {
    const todas = []; String(texto || '').split(/\n/).forEach(p => { let l = ''; p.split(/\s+/).filter(Boolean).forEach(w => { while (w.length > largura) { if (l) { todas.push(l); l = ''; } todas.push(w.slice(0, largura)); w = w.slice(largura); } if (l.length + w.length + 1 > largura) { todas.push(l); l = ''; } l += (l ? ' ' : '') + w; }); todas.push(l); });
    const out = []; for (let i = 0; i < todas.length; i += linhas) { const t = todas.slice(i, i + linhas).join('\n').trim(); if (t) out.push(t); } return out;
  }
  /** Foto para a apresentação; a que não abre vira aviso (a página sai sem ela). */
  static blob(id, avisos, n) {
    try { const f = DriveApp.getFileById(id), tipo = String(f.getMimeType()); if (!/^image\//.test(tipo)) { avisos.push('Foto ' + n + ' não é imagem.'); return null; } return /^image\/(jpeg|png|gif)$/.test(tipo) && f.getSize() <= 8e6 ? f.getBlob() : f.getThumbnail(); }
    catch (e) { avisos.push('Foto ' + n + ' não abriu.'); return null; }
  }
  /** Apresentação no desenho da Central: capa azul-marinho, faixa vermelha, indicadores coloridos e foto ao lado do texto. */
  slides(d, rev, pasta, avisos) {
    const nome = DiagnosticosCPT.nome(d, rev, 'APRESENTAÇÃO'), deck = SlidesApp.create(nome), id = deck.getId(); DriveApp.getFileById(id).moveTo(pasta);
    const {paginas, legendas} = DiagnosticosCPT.paginas(d, rev), fotos = new Map((rev.fotos || []).map((f, i) => [f.id, DiagnosticosCPT.blob(f.id, avisos, i + 1)]));
    const velhos = deck.getSlides(), sx = deck.getPageWidth() / 720, sy = deck.getPageHeight() / 405;
    paginas.forEach((p, i) => {
      const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK), tinta = p.capa ? '#FFFFFF' : '#173747'; s.getBackground().setSolidFill(p.capa ? '#083952' : '#F3F7FA');
      const caixa = (t, x, y, bw, bh, tam, cor, neg) => { const z = s.insertTextBox(String(t || ''), x * sx, y * sy, bw * sx, bh * sy); z.getText().getTextStyle().setFontFamily('Arial').setFontSize(tam * Math.min(sx, sy)).setForegroundColor(cor).setBold(!!neg); return z; };
      const ret = (x, y, bw, bh, cor) => { const z = s.insertShape(SlidesApp.ShapeType.RECTANGLE, x * sx, y * sy, bw * sx, bh * sy); z.getFill().setSolidFill(cor); z.getBorder().setTransparent(); return z; };
      ret(0, 0, 720, 5, '#E51C35');
      if (p.capa) { caixa('DIAGNÓSTICO TERRITORIAL', 40, 38, 600, 25, 12, '#45D3EF', true); caixa(p.titulo, 40, 102, 635, 112, 33, '#FFFFFF', true); caixa(p.texto, 40, 237, 630, 105, 17, '#D6EBF4'); }
      else {
        caixa(p.titulo, 30, 24, 660, 60, 25, tinta, true); ret(32, 84, 52, 4, ['#009FE3', '#15987E', '#7D61BF', '#E3912E'][i % 4]);
        const blob = p.foto ? fotos.get(p.foto) : null;
        if (p.kpis) { p.kpis.forEach((k, j) => { const x = 32 + j * 225; ret(x, 106, 210, 108, ['#E3F3FA', '#E1F4EE', '#EEE9F8'][j]); caixa(k[1], x + 12, 113, 186, 65, String(k[1]).length > 10 ? 17 : 40, ['#1687B8', '#148B70', '#795BB4'][j], true); caixa(k[0], x + 12, 181, 186, 24, 12, '#536D7A', true); }); caixa(p.texto, 32, 233, 658, 130, 15, tinta); }
        else caixa(p.texto, 30, 105, blob ? 354 : 658, 246, 16, tinta);
        if (blob) { ret(410, 107, 278, 213, '#E2EDF3'); const im = s.insertImage(blob), iw = im.getWidth(), ih = im.getHeight(), k = Math.min(278 * sx / iw, 213 * sy / ih);
          im.setWidth(iw * k); im.setHeight(ih * k); im.setLeft(410 * sx + (278 * sx - iw * k) / 2); im.setTop(107 * sy + (213 * sy - ih * k) / 2); caixa(legendas[p.foto] || 'Registro de campo', 410, 325, 278, 37, 10, '#536D7A'); }
      }
      caixa('Consórcio Performance Tamanduateí    ' + d.id + '    ' + (i + 1) + '/' + paginas.length, 30, 379, 658, 18, 9, p.capa ? '#A9D8EA' : '#536D7A');
    });
    velhos.forEach(s => s.remove()); deck.saveAndClose();
    return {doc: DiagnosticosCPT.url('slides', id), pdf: DiagnosticosCPT.pdf(id, nome, pasta)};
  }
}

/** Mapa da tabela oficial do DIAGNÓSTICO LOCAL (23 linhas): [chave, linha, coluna do rótulo, rótulo]. O valor vai na célula à direita. */
class DiagnosticoOficialCPT {
  static get modeloPadrao() { return '1QT0ly_LVwYpl6CtYHadNKc-SQZflbSa7Lvp6avkrY4g'; }
  static get campos() {
    return [
      ['frente', 1, 0, 'FRENTE/CT'], ['pvInicio', 1, 2, 'PV INÍCIO'], ['pvFim', 1, 4, 'PV FIM'],
      ['metodo', 2, 0, 'MÉTODO CONSTRUTIVO'], ['extensao', 2, 2, 'EXTENSÃO'],
      ['endereco', 3, 0, 'RUA/AVENIDA'], ['perfil', 5, 0, 'PERFIL SOCIOECONÔMICO'],
      ['pavimento', 6, 0, 'TIPO DO PAVIMENTO'], ['condicao', 7, 0, 'CONDIÇÃO DO PAVIMENTO'],
      ['impacto', 8, 0, 'NÍVEL DE IMPACTO'], ['impactos', 9, 0, 'IMPACTOS IDENTIFICADOS'],
      ['veiculos', 10, 0, 'TRÁFEGO DE VEÍCULOS'], ['pedestres', 11, 0, 'TRÁFEGO DE PEDESTRES'],
      ['residencias', 12, 0, 'IMÓVEIS RESIDENCIAIS'], ['comercios', 13, 0, 'IMÓVEIS COMERCIAIS'],
      ['padrao', 14, 0, 'PADRÃO CONSTRUTIVO'], ['ipvs', 15, 0, 'VULNERABILIDADE'],
      ['liderancas', 16, 0, 'HOUVE IDENTIFICAÇÃO DE LIDERANÇAS'], ['escolas', 17, 0, 'ESCOLAS PÚBLICAS'],
      ['ubs', 18, 0, 'UBS NO ENTORNO'], ['ongs', 19, 0, 'CENTROS COMUNITÁRIOS'],
      ['onibus', 20, 0, 'PONTOS DE ÔNIBUS'], ['comunicacao', 21, 0, 'OPORTUNIDADES DE COMUNICAÇÃO'],
      ['criticos', 22, 0, 'PONTOS CRÍTICOS']
    ];
  }
  static chaves() { return DiagnosticoOficialCPT.campos.map(f => f[0]); }
  static rotulo(k) { const f = DiagnosticoOficialCPT.campos.find(x => x[0] === k); return f ? f[3] : k; }
  /** Primeira versão da ficha a partir das respostas do formulário (quem revisa ajusta tudo antes de gerar). */
  static sugestao(d) {
    const c = (...res) => { for (const re of res) { const v = DadosDaAplicacao.valor(d.pares, re); if (v) return v; } return ''; }, juntar = (...v) => v.filter(Boolean).join(' · ');
    const oficiais = {
      frente: c(/^frente\/ct/, /^titulo da frente/) || d.obraTexto, pvInicio: c(/^pv (de )?inicio/), pvFim: c(/^pv (fim|final)/), metodo: c(/^metodo construtivo/), extensao: c(/^extensao/),
      endereco: juntar(c(/^endereco da frente/, /^endereco completo/, /^rua\/avenida/), c(/^intervalo de numeracao/)), perfil: c(/^perfil socioeconomico/), pavimento: c(/^tipo de pavimento/),
      condicao: c(/^condicoes da via/, /^condicao do pavimento/), impacto: c(/^nivel de impacto/), impactos: c(/^impactos identificados/, /^ocorrencias observadas/),
      veiculos: c(/^trafego de veiculos/), pedestres: c(/^trafego de pedestres/), residencias: c(/^quantidade de imoveis residenciais/), comercios: c(/^quantidade de imoveis comerciais/),
      padrao: c(/^padrao ou padroes construtivos/), ipvs: c(/^indice paulista de vulnerabilidade/, /\bipvs\b/), liderancas: juntar(c(/^foram identificadas liderancas/), c(/^onde encontrar essas liderancas/)),
      escolas: c(/^escolas e equipamentos de educacao/, /^existem escolas/), ubs: c(/^ubs ou hospitais identificados/, /^existe ubs ou hospitais/),
      ongs: c(/^centros comunitarios, ongs/, /^existem centros comunitarios/), onibus: juntar(c(/^existem pontos de onibus/), c(/^com qual frequencia passam/)),
      comunicacao: c(/^oportunidades de comunicacao/), criticos: c(/^pontos criticos/)};
    return {titulo: 'Diagnóstico local: ' + (oficiais.frente || d.bairro || d.id), oficiais};
  }
  /** Confere o modelo antes de preencher: uma guia, uma tabela de 23 linhas, rótulos no lugar e nada fora dos campos. */
  static tabela(doc) {
    if (typeof doc.getTabs === 'function' && (doc.getTabs().length !== 1 || doc.getTabs()[0].getChildTabs().length)) throw new Error('O modelo do diagnóstico deve ter uma única guia.');
    const tabelas = doc.getBody().getTables();
    if (tabelas.length !== 1) throw new Error('O modelo precisa ter só a tabela oficial do diagnóstico. Encontradas: ' + tabelas.length + '.');
    const t = tabelas[0]; if (t.getNumRows() !== 23) throw new Error('O modelo tem ' + t.getNumRows() + ' linhas. Esperadas 23.');
    const comeca = (r, c, texto) => DadosDaAplicacao.norm(t.getRow(r).getCell(c).getText()).startsWith(DadosDaAplicacao.norm(texto));
    if (!comeca(0, 0, 'DIAGNÓSTICO LOCAL') || !comeca(4, 0, 'INFORMAÇÕES DO ENTORNO DAS OBRAS') || !comeca(5, 2, 'OBSERVAÇÕES')) throw new Error('Cabeçalhos do modelo oficial não reconhecidos.');
    const mapeadas = new Set(['0:0', '4:0', '5:2', '6:2']);
    DiagnosticoOficialCPT.campos.forEach(f => {
      if (t.getRow(f[1]).getNumCells() <= f[2] + 1 || !comeca(f[1], f[2], f[3])) throw new Error('Campo não reconhecido no modelo: ' + f[3] + ' (linha ' + (f[1] + 1) + ').');
      mapeadas.add(f[1] + ':' + f[2]); mapeadas.add(f[1] + ':' + (f[2] + 1));
    });
    for (let r = 0; r < 23; r++) for (let c = 0; c < t.getRow(r).getNumCells(); c++)
      if (!mapeadas.has(r + ':' + c) && t.getRow(r).getCell(c).getText().trim()) throw new Error('O modelo tem texto fora dos campos (linha ' + (r + 1) + ', coluna ' + (c + 1) + '). Confira o modelo antes de gerar.');
    return t;
  }
}

/** Missão: para a Gestão e o Administrativo, diagnósticos "Em revisão" esperando aprovação; para quem revisa, os ainda sem revisão. */
DiagnosticosCPT.missoes = function (ctx) {
  if (!DiagnosticosCPT.podeRevisar(ctx.perfil)) return [];
  const dg = new DiagnosticosCPT(ctx), ger = PerfisCPT.gerencia(ctx.perfil), revs = dg.revisoes.itens();
  const chave = 'missao-diag:' + ctx.config.baseId + ':' + dg.dados.registros().getLastRow() + ':' + revs.length + ':' + revs.reduce((s, x) => s + x.versao, 0) + ':' + (ger ? 'g' : 's');
  const n = CacheCPT.obter(chave, 1800, () => { const m = new Map(revs.map(x => [x.registroId, x])); return {aprovar: revs.filter(x => x.situacao === 'revisao').length, sem: dg.diagnosticos().filter(d => !m.has(d.id)).length}; });
  const out = [];
  if (ger && n.aprovar) out.push({id: 'diagnosticos-aprovar', titulo: n.aprovar + (n.aprovar === 1 ? ' diagnóstico em revisão aguardando aprovação' : ' diagnósticos em revisão aguardando aprovação'), texto: 'Confira a síntese e a ficha oficial e marque como Revisado.', rota: 'registros', aba: 'diagnosticos', tipo: 'rota'});
  if (!ger && n.sem) out.push({id: 'diagnosticos-revisar', titulo: n.sem + (n.sem === 1 ? ' diagnóstico sem revisão' : ' diagnósticos sem revisão'), texto: 'Revise a síntese, confira a ficha oficial e escolha as fotos.', rota: 'registros', aba: 'diagnosticos', tipo: 'rota'});
  return out;
};

function listarDiagnosticosCPT() { return AplicacaoCPT.executar((d, ctx) => new DiagnosticosCPT(ctx).listar(), 'diagnosticos.listar'); }
function abrirDiagnosticoCPT(p) { return AplicacaoCPT.executar((d, ctx) => new DiagnosticosCPT(ctx).abrir(p && p.id), 'diagnosticos.abrir'); }
function salvarDiagnosticoCPT(p) { return ColecaoCPT.executar('diagnosticos.salvar', ctx => new DiagnosticosCPT(ctx).salvar(p), true); }
function gerarDocumentoDiagnosticoCPT(p) { return AplicacaoCPT.executar((d, ctx) => new DiagnosticosCPT(ctx).gerar(p), 'diagnosticos.gerar'); }
function vincularDiagnosticoCPT(p) { return ColecaoCPT.executar('diagnosticos.vincular', ctx => new DiagnosticosCPT(ctx).vincular(p), true); }

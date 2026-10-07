/**
 * DiagnosticosCPT 2.46.0. Diagnósticos de área organizados por obra.
 * - Toda a equipe consulta: cada obra do catálogo com os seus diagnósticos e a tabela-resumo (data, trecho, IPVS, perfil,
 *   imóveis, escolas, UBS e pontos críticos).
 * - Diagnóstico sem obra (ou com obra fora do catálogo): a Gestão e o Administrativo vinculam a uma obra, pelo mesmo
 *   vínculo de "outra obra" (a linha da base não muda).
 * - Socioambiental, Comunicação, Gestão e Administrativo geram um Google Docs por obra, num modelo limpo montado pela
 *   aplicação (dados da obra, tabela-resumo e um bloco por diagnóstico, com até 4 fotos cada), na pasta
 *   "CPT • Diagnósticos/<obra>". Gerar de novo cria outra versão; a anterior vai para "Versões anteriores".
 * - Se entrar diagnóstico novo ou um registro mudar depois do documento, a obra aparece como "Mudou desde o documento".
 */
class DiagnosticosCPT {
  static get aba() { return 'Diagnósticos por obra'; }
  static get nomeRaiz() { return 'CPT • Diagnósticos'; }
  static get fotosPorDiagnostico() { return 4; }
  static podeGerar(p) { return RelatosRelatorioCPT.pode(p); }
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

  constructor(ctx) { this.ctx = ctx; if (!ctx.base) ctx.base = planilhaCPT_(ctx.config.baseId); this.dados = new DadosDaAplicacao(ctx.base, ctx.perfil); this.col = new ColecaoCPT(ctx, DiagnosticosCPT.aba, 'DGO'); }
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
    const {v, bruto} = DiagnosticosCPT.detalhes(r[20]);
    const campos = DiagnosticosCPT.grupos.map(([titulo, lista]) => [titulo, lista.map(([rot, re]) => [rot, v(re).slice(0, 2000)]).filter(([, val]) => val)]).filter(([, l]) => l.length);
    return {...d, hash: String(r[19] || ''), relato: v(/^relato do diagnostico|^relato da atividade/).slice(0, 12000), observacao: v(/^observacao final/).slice(0, 4000), campos, fotos: DiagnosticosCPT.fotosDe(bruto)};
  }
  /** Obra do catálogo de um diagnóstico: pelo ID; senão pelo nome da obra ou pelo título da frente. */
  obraDe(d, porId, porNome) {
    if (d.obraId && porId.has(d.obraId)) return porId.get(d.obraId);
    return [d.obraTexto, d.frente].map(n => porNome.get(PaineisGestaoCPT.chaveObra(n))).find(Boolean) || null;
  }
  static hashObra(lista) { return DiagnosticosCPT.resumo(lista.map(d => d.id + '|' + d.hash).sort().join(';')); }
  agrupar() {
    const obras = this.catalogo(), porId = new Map(obras.map(o => [o.id, o])), porNome = new Map(obras.flatMap(o => ObrasCPT.nomesConhecidos(o).map(n => [PaineisGestaoCPT.chaveObra(n), o])));
    const grupos = new Map(), sem = [];
    this.diagnosticos().forEach(d => { const o = this.obraDe(d, porId, porNome); if (!o) { sem.push(d); return; } if (!grupos.has(o.id)) grupos.set(o.id, {obra: o, lista: []}); grupos.get(o.id).lista.push(d); });
    grupos.forEach(g => g.lista.sort((a, b) => a.data.localeCompare(b.data)));
    return {grupos, sem: sem.sort((a, b) => b.data.localeCompare(a.data)), obras};
  }
  static linhaResumo(d) { return {id: d.id, data: d.data, trecho: d.endereco || d.frente || d.bairro, ipvs: d.ipvs, perfil: d.perfil, residenciais: d.residenciais, comerciais: d.comerciais, escolas: d.escolas, ubs: d.ubs, pontos: d.pontos, responsavel: d.responsavel, fotos: d.nFotos}; }
  listar() {
    const {grupos, sem, obras} = this.agrupar(), docs = new Map(this.col.itens().map(x => [x.obraId, x])), c = AplicacaoCPT.config(), vincula = ObrasDoDiaCPT.pode(this.ctx.perfil);
    const lista = [...grupos.values()].map(({obra: o, lista: l}) => {
      const g = docs.get(o.id), hash = DiagnosticosCPT.hashObra(l);
      return {obraId: o.id, nome: o.exibir, situacao: o.situacao || 'A confirmar', bairros: o.bairros, total: l.length, primeiro: l[0].data, ultimo: l[l.length - 1].data, linhas: l.map(DiagnosticosCPT.linhaResumo),
        doc: g && g.doc || '', versaoDoc: g && g.versaoDoc || 0, geradoPor: g && g.nome || '', geradoEm: g && g.geradoEm || '', situacaoDoc: !g || !g.doc ? 'sem' : g.hashOrigem !== hash ? 'mudou' : 'ok'};
    }).sort((a, b) => b.ultimo.localeCompare(a.ultimo) || a.nome.localeCompare(b.nome, 'pt-BR'));
    return {obras: lista, semObra: sem.map(d => ({...DiagnosticosCPT.linhaResumo(d), obraTexto: d.obraTexto, bairro: d.bairro})), total: lista.reduce((s, o) => s + o.total, 0) + sem.length,
      podeGerar: DiagnosticosCPT.podeGerar(this.ctx.perfil), podeVincular: vincula, pasta: c.diagnosticosPastaId ? 'https://drive.google.com/drive/folders/' + c.diagnosticosPastaId : '',
      catalogo: vincula ? obras.map(o => ({id: o.id, exibir: o.exibir, situacao: o.situacao})).sort((a, b) => (a.situacao === 'Finalizada') - (b.situacao === 'Finalizada') || a.exibir.localeCompare(b.exibir, 'pt-BR')) : []};
  }
  /** Um diagnóstico completo (todos os blocos), para a tela de detalhe. */
  abrir(id) { const r = this.diagnosticos().find(x => x.id === String(id || '')); if (!r) throw new Error('Diagnóstico não encontrado. Atualize a página.'); const d = this.completo(r); return {...d, fotos: d.fotos.map(f => ({id: f, url: 'https://drive.google.com/file/d/' + f + '/view', thumb: 'https://drive.google.com/thumbnail?id=' + f + '&sz=w320'}))}; }
  /** Vincula um diagnóstico sem obra do catálogo (e sem Obra ID na base), pelo mesmo vínculo de "outra obra". */
  vincular(p) {
    p = p || {}; const livres = new Set(this.agrupar().sem.filter(d => !d.obraId).map(d => d.id));
    if (!livres.has(String(p.registroId || ''))) throw new Error('Este diagnóstico já está numa obra ou não foi encontrado. Atualize a página.');
    return new ObrasDoDiaCPT(this.ctx).vincular(p, id => livres.has(id));
  }

  // ---------------- Documento por obra ----------------
  raiz() {
    const c = AplicacaoCPT.config(); let raiz = null;
    if (c.diagnosticosPastaId) try { raiz = DriveApp.getFolderById(c.diagnosticosPastaId); } catch (_) {}
    if (!raiz) { raiz = DriveApp.createFolder(DiagnosticosCPT.nomeRaiz); const a = AplicacaoCPT.config(); a.diagnosticosPastaId = raiz.getId(); PropertiesService.getScriptProperties().setProperty(AplicacaoCPT.chave, JSON.stringify(a)); }
    return raiz;
  }
  static limpo(s) { return String(s).replace(/[\\/:*?"<>|\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80); }
  gerar(p) {
    if (!DiagnosticosCPT.podeGerar(this.ctx.perfil)) throw new Error('O documento dos diagnósticos é gerado por Socioambiental, Comunicação, Gestão ou Administrativo.');
    p = p || {}; const {grupos} = this.agrupar(), g = grupos.get(String(p.obraId || ''));
    if (!g) throw new Error('Esta obra não tem diagnósticos. Atualize a página.');
    const o = g.obra, antigo = this.col.obter('DGO-' + o.id), versaoDoc = (antigo && antigo.versaoDoc || 0) + 1, br = DadosDaAplicacao.br;
    const pasta = RelatosRelatorioCPT.subpasta(this.raiz(), DiagnosticosCPT.limpo(o.exibir) || o.id), hoje = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd-MM-yyyy');
    const completos = g.lista.map(d => this.completo(d)); // lê antes de criar o documento: se a base mudou, nada fica pela metade
    const doc = DocumentApp.create('Diagnóstico socioambiental · ' + DiagnosticosCPT.limpo(o.exibir) + ' · ' + hoje + (versaoDoc > 1 ? ' · v' + versaoDoc : ''));
    const avisos = DiagnosticosCPT.montar(doc, o, completos, br(g.lista[0].data) + ' a ' + br(g.lista[g.lista.length - 1].data) + ' · ' + o.id + ' · ' + FichaOficialCPT.empresa);
    doc.saveAndClose();
    const arquivo = DriveApp.getFileById(doc.getId()); arquivo.moveTo(pasta);
    const url = 'https://docs.google.com/document/d/' + doc.getId() + '/edit';
    if (antigo && antigo.doc) { const velho = (antigo.doc.match(/\/d\/([A-Za-z0-9_-]{20,})/) || [])[1]; if (velho) try { DriveApp.getFileById(velho).moveTo(RelatosRelatorioCPT.subpasta(pasta, 'Versões anteriores')); } catch (_) {} }
    const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('O documento foi gerado, mas não foi registrado agora. Gere de novo em instantes.');
    let e; try { e = this.col.gravar({obraId: o.id, obra: o.exibir, doc: url, versaoDoc, diagnosticos: g.lista.length, hashOrigem: DiagnosticosCPT.hashObra(completos), geradoPor: this.ctx.email, nome: this.ctx.perfil.nome, geradoEm: new Date().toISOString()}, antigo ? antigo.versao : 0, p.operacaoId, 'DGO-' + o.id); }
    finally { lock.releaseLock(); }
    return {resultado: 'Documento gerado com ' + g.lista.length + (g.lista.length === 1 ? ' diagnóstico' : ' diagnósticos') + ' na pasta ' + DiagnosticosCPT.nomeRaiz + '/' + (DiagnosticosCPT.limpo(o.exibir) || o.id) + '.' + (avisos.length ? ' Atenção: ' + avisos.join(' ') : ''),
      doc: url, versaoDoc, geradoPor: e.nome, geradoEm: e.geradoEm};
  }
  /** Modelo limpo: A4, Arial, cores da aplicação; tabelas com rótulo à esquerda; blocos vazios ficam de fora. */
  static montar(doc, o, lista, referencia) {
    const b = doc.getBody(), avisos = [], br = DadosDaAplicacao.br, AZUL = '#073B56', TEXTO = '#172F43', FUNDO = '#EAF4F8', BORDA = '#D9E3EA';
    b.setPageWidth(595.28).setPageHeight(841.89).setMarginTop(42).setMarginBottom(42).setMarginLeft(48).setMarginRight(48);
    const para = (t, size, bold, color) => { const x = b.appendParagraph(t); x.setSpacingAfter(6).setLineSpacing(1.15); x.editAsText().setFontFamily('Arial').setFontSize(size || 10.5).setBold(!!bold).setForegroundColor(color || TEXTO); return x; };
    const estilo = (t, cab) => { t.setBorderColor(BORDA).setBorderWidth(0.5);
      for (let r = 0; r < t.getNumRows(); r++) { const linha = t.getRow(r); for (let c = 0; c < linha.getNumCells(); c++) { const cel = linha.getCell(c); cel.setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(6).setPaddingRight(6); cel.editAsText().setFontFamily('Arial').setFontSize(cab ? 8.5 : 9.5).setForegroundColor(TEXTO).setBold(cab ? r === 0 : c === 0); if (cab ? r === 0 : c === 0) cel.setBackgroundColor(FUNDO); } } return t; };
    const pares = l => { const t = estilo(b.appendTable(l.map(([k, v]) => [k, String(v)])), false); for (let r = 0; r < t.getNumRows(); r++) { t.getCell(r, 0).setWidth(150); t.getCell(r, 1).setWidth(349); } return t; };
    para('CONSÓRCIO PERFORMANCE TAMANDUATEÍ', 9, true, AZUL); para('Diagnóstico socioambiental', 24, true, '#000000').setHeading(DocumentApp.ParagraphHeading.TITLE); para(o.exibir, 14, true, AZUL);
    pares([['Obra', o.exibir + (o.nome && o.nome !== o.exibir ? ' (' + o.nome + ')' : '')], ['Bairros', o.bairros.join(', ') || 'Não informado'], ['Situação da obra', o.situacao || 'A confirmar'],
      ['Endereço da frente', o.endereco || o.logradouroPAC16 || 'Não informado'], ['Diagnósticos', lista.length + ' · de ' + br(lista[0].data) + ' a ' + br(lista[lista.length - 1].data)]]);
    para('Resumo dos diagnósticos', 14, true, '#000000').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    const traco = v => v || '—';
    estilo(b.appendTable([['Data', 'Trecho', 'IPVS', 'Perfil socioeconômico', 'Imóveis (res. / com.)', 'Escolas', 'UBS', 'Pontos críticos']].concat(lista.map(d => [br(d.data), traco(d.endereco || d.frente || d.bairro), traco(d.ipvs), traco(d.perfil),
      (d.residenciais || '—') + ' / ' + (d.comerciais || '—'), traco(d.escolas), traco(d.ubs), traco(d.pontos)]))), true);
    lista.forEach((d, i) => {
      b.appendPageBreak();
      para('Diagnóstico ' + (i + 1) + ' · ' + br(d.data), 14, true, '#000000').setHeading(DocumentApp.ParagraphHeading.HEADING1);
      para([d.endereco || d.frente, d.bairro].filter(Boolean).join(' · ') + (d.responsavel ? ' · Equipe: ' + d.responsavel : ''), 9.5, false, '#526C7B');
      if (d.relato) { para('Relato do diagnóstico', 12, true, AZUL); para(d.relato); }
      d.campos.forEach(([titulo, l]) => { para(titulo, 12, true, AZUL); pares(l); });
      if (d.observacao) { para('Observação final', 12, true, AZUL); para(d.observacao); }
      const fotos = DiagnosticosCPT.blobs(d.fotos, DiagnosticosCPT.fotosPorDiagnostico, avisos, 'Diagnóstico ' + (i + 1));
      if (fotos.length) { para('Registro fotográfico', 12, true, AZUL); DiagnosticosCPT.grade(b, fotos, br(d.data), d.endereco || d.bairro); }
    });
    try { const p0 = b.getChild(0); if (p0.getType() === DocumentApp.ElementType.PARAGRAPH && !p0.asParagraph().getText()) p0.removeFromParent(); } catch (_) {}
    const foot = doc.addFooter(); foot.appendParagraph(referencia).editAsText().setFontFamily('Arial').setFontSize(8).setForegroundColor('#526C7B');
    return avisos;
  }
  /** Até max fotos, na ordem do registro; a que não abre vira aviso e a seguinte entra no lugar. */
  static blobs(ids, max, avisos, rotulo) {
    const out = [];
    ids.forEach((id, k) => { if (out.length >= max) return; try { const f = DriveApp.getFileById(id), tipo = String(f.getMimeType()), blob = /^image\/(jpeg|png|gif)$/.test(tipo) && f.getSize() <= 8000000 ? f.getBlob() : f.getThumbnail(); if (blob) out.push(blob); else avisos.push(rotulo + ', foto ' + (k + 1) + ': sem prévia.'); }
      catch (e) { avisos.push(rotulo + ', foto ' + (k + 1) + ' não abriu.'); } });
    return out;
  }
  /** Fotos em grade de 2 colunas, legenda "dd/mm/aaaa - Endereço - Diagnóstico" (a do item 2 do relatório). */
  static grade(b, blobs, data, endereco) {
    for (let i = 0; i < blobs.length; i += 2) {
      const t = b.appendTable([['', ''], ['', '']]); t.setBorderColor('#D9E3EA').setBorderWidth(0.5);
      for (let k = 0; k < 2; k++) {
        for (let row = 0; row < 2; row++) t.getCell(row, k).setWidth(249).setPaddingTop(5).setPaddingBottom(5).setPaddingLeft(6).setPaddingRight(6);
        const blob = blobs[i + k]; if (!blob) continue;
        const p = t.getCell(0, k).getChild(0).asParagraph(), im = p.appendInlineImage(blob), e = Math.min(230 / im.getWidth(), 175 / im.getHeight(), 1); im.setWidth(Math.round(im.getWidth() * e)).setHeight(Math.round(im.getHeight() * e));
        p.setAlignment(DocumentApp.HorizontalAlignment.CENTER); t.getCell(1, k).setText([data, endereco, 'Diagnóstico'].filter(Boolean).join(' - '));
        t.getCell(1, k).editAsText().setFontFamily('Arial').setFontSize(8.5).setForegroundColor('#526C7B');
      }
    }
  }
}

function listarDiagnosticosCPT() { return AplicacaoCPT.executar((d, ctx) => new DiagnosticosCPT(ctx).listar(), 'diagnosticos.listar'); }
function abrirDiagnosticoCPT(p) { return AplicacaoCPT.executar((d, ctx) => new DiagnosticosCPT(ctx).abrir(p && p.id), 'diagnosticos.abrir'); }
function vincularDiagnosticoCPT(p) { return ColecaoCPT.executar('diagnosticos.vincular', ctx => new DiagnosticosCPT(ctx).vincular(p), true); }
function gerarDiagnosticoObraCPT(p) { return AplicacaoCPT.executar((d, ctx) => new DiagnosticosCPT(ctx).gerar(p), 'diagnosticos.gerar'); }

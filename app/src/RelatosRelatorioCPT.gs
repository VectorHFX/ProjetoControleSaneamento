/**
 * RelatosRelatorioCPT 2.43.0. Relatos ilustrados para o relatório mensal, a partir dos relatos de atividade do Campo 4.0.
 * - Entram os relatos dos tipos: Ação social externa, Ação social interna, Articulação institucional e CAO ou DDS.
 * - Cada um nasce "Pendente de revisão". Socioambiental, Comunicação, Gestão e Administrativo revisam o texto (pode usar o
 *   prompt para o Gemini, sem nomes de moradores; a revisão humana é sempre obrigatória) e escolhem as fotos.
 * - 2.48 (como na Central CPT 4.0): o relato ilustrado sai no layout da Central — faixa "Relato da atividade", quadro de 6
 *   linhas, Objetivo, Relato e Resultados, e até 2 fotos lado a lado com legenda. Revisado → FINAL (revisado) e, na primeira
 *   vez, ORIGINAL (como veio do campo), cada um em Google Docs + PDF, na pasta "CPT • Relatos do relatório/AAAA/MM - mês".
 *   Revisar de novo refaz o FINAL; o anterior vai para "Versões anteriores".
 * - Se o registro de origem mudar depois da revisão, o relato aparece como "Mudou na origem" para conferir.
 */
class RelatosRelatorioCPT {
  static get aba() { return 'Relatos do relatório'; }
  static get nomeRaiz() { return 'CPT • Relatos do relatório'; }
  static get maxFotos() { return 2; } // como na Central: até 2 fotos lado a lado, com legenda
  static pode(p) { return p.papeis.some(x => ['administrador', 'administrativo', 'gestao', 'socioambiental', 'comunicacao'].includes(x)); }
  static norm(v) { return DadosDaAplicacao.norm(v); }
  /** Tipo do relato para o relatório pela atividade escolhida no formulário; vazio se não entra. */
  static tipo(atividade) {
    const a = RelatosRelatorioCPT.norm(atividade);
    if (/acao social externa/.test(a)) return 'Ação social externa';
    if (/acao social interna/.test(a)) return 'Ação social interna';
    if (/articulacao/.test(a)) return 'Articulação institucional';
    if (/\bcao\b|comissao de acompanhamento|\bdds\b|dialogo diario/.test(a)) return 'CAO ou DDS';
    return '';
  }
  constructor(ctx) {
    if (!RelatosRelatorioCPT.pode(ctx.perfil)) throw new Error('Os relatos do relatório ficam com Socioambiental, Comunicação, Gestão e Administrativo.');
    this.ctx = ctx; if (!ctx.base) ctx.base = planilhaCPT_(ctx.config.baseId);
    this.dados = new DadosDaAplicacao(ctx.base, ctx.perfil); this.col = new ColecaoCPT(ctx, RelatosRelatorioCPT.aba, 'RRL');
  }
  /** Relatos elegíveis do mês com a situação da revisão. */
  listar(mes) {
    mes = DadosDaAplicacao.mesValido(mes);
    const D = this.dados, rows = D.ler(D.registros(), 20), revisoes = new Map(this.col.itens().map(x => [x.registroId, x]));
    const itens = rows.filter(r => r[0] && D.mesCelula(r[3]) === mes && /relato de atividade/.test(RelatosRelatorioCPT.norm(r[1])) && RelatosRelatorioCPT.tipo(r[13])).map(r => {
      const v = revisoes.get(String(r[0])), mudou = !!(v && v.doc && v.hashOrigem !== String(r[19] || ''));
      return {id: String(r[0]), data: D.data(r[2]), tipo: RelatosRelatorioCPT.tipo(r[13]), atividade: String(r[13]), bairro: String(r[7] || ''), frente: SocioambientalCPT.frente(r[9]), responsavel: String(r[11] || ''),
        publico: r[14] !== '' && /^\d+$/.test(String(r[14])) ? Number(r[14]) : null, situacao: !v || !v.doc ? 'pendente' : mudou ? 'mudou' : 'revisado',
        doc: v && v.doc || '', pdf: v && v.pdf || '', revisadoPor: v && v.nome || '', revisadoEm: v && v.revisadoEm || ''};
    }).sort((a, b) => a.data.localeCompare(b.data));
    const c = AplicacaoCPT.config();
    return {mes, itens, tipos: ['Ação social externa', 'Ação social interna', 'Articulação institucional', 'CAO ou DDS'], pasta: c.relatosRelatorioPastaId ? 'https://drive.google.com/drive/folders/' + c.relatosRelatorioPastaId : ''};
  }
  linha(id) {
    const D = this.dados, a = D.registros(), linha = D.localizar(a, String(id || '')), r = a.getRange(linha, 1, 1, 21).getValues()[0];
    if (!RelatosRelatorioCPT.tipo(r[13]) || !/relato de atividade/.test(RelatosRelatorioCPT.norm(r[1]))) throw new Error('Este registro não é um relato para o relatório.');
    return r;
  }
  /** Campos do documento a partir do registro de origem. */
  origem(r) {
    const D = DadosDaAplicacao; let bruto = String(r[20] || ''), c = D.campos(bruto);
    if (!c && /arquivoDetalhesId/.test(bruto)) try { bruto = JSON.stringify(D.lerDetalhes(r[20])); c = D.campos(bruto); } catch (_) { c = null; }
    const v = re => D.valor(c, re), dia = this.dados.data(r[2]), br = dia.split('-').reverse().join('/');
    const entrada = v(/^horario de entrada/), saida = v(/^horario de saida/), apoio = v(/^colaboradores de apoio/), frente = v(/^titulo da frente/) || SocioambientalCPT.frente(r[9]);
    const participantes = r[14] !== '' ? String(r[14]) : v(/^total de participantes/), interrompeu = /^sim/.test(RelatosRelatorioCPT.norm(v(/^houve interrupcao/)));
    const fotos = [...new Set((bruto.match(/(?:\/d\/|[?&]id=)[A-Za-z0-9_-]{25,}/g) || []).map(x => x.replace(/^(?:\/d\/|[?&]id=)/, '')))];
    return {titulo: v(/^complemento da atividade/) || frente || String(r[13]), atividade: String(r[13]), local: frente, endereco: [v(/^endereco da frente|^endereco completo/), r[7]].filter(Boolean).join(' · '),
      dataHorario: br + (entrada ? ' · ' + entrada + (saida ? ' às ' + saida : '') : ''), mediacao: String(r[11] || ''), equipe: [r[11], apoio].filter(Boolean).join(', '),
      publico: [v(/^publico-alvo|^publico alvo/), participantes ? participantes + ' participantes informados' : ''].filter(Boolean).join(' · '),
      objetivo: v(/^objetivo da atividade/), relato: v(/^relato da atividade/), resultados: v(/^observacao final/),
      interrupcao: interrompeu ? [v(/^descreva qual foi a interru|^qual foi a interrupcao/), v(/^indique os horarios da interrupcao|^informe o horario de inicio e fim da interrupcao/)].filter(Boolean).join(' · ') || 'Houve interrupção (sem descrição).' : '',
      fotos, dia};
  }
  abrir(id) {
    const r = this.linha(id), o = this.origem(r), v = this.col.obter('RRL-' + r[0]);
    // 2.43 guardava só os IDs das fotos; 2.48 guarda {id, legenda}.
    const campos = v ? {...o, ...v.campos, fotos: o.fotos} : o, salvas = v ? (v.fotos || []).map(f => typeof f === 'string' ? {id: f, legenda: ''} : f) : o.fotos.slice(0, RelatosRelatorioCPT.maxFotos).map(id => ({id, legenda: ''}));
    const legenda = new Map(salvas.map(f => [f.id, f.legenda || ''])), padrao = RelatosRelatorioCPT.legendaPadrao(o, RelatosRelatorioCPT.tipo(r[13]));
    return {id: String(r[0]), tipo: RelatosRelatorioCPT.tipo(r[13]), campos, original: o, legendaPadrao: padrao,
      fotos: o.fotos.map(f => ({id: f, url: 'https://drive.google.com/file/d/' + f + '/view', thumb: 'https://drive.google.com/thumbnail?id=' + f + '&sz=w320', escolhida: legenda.has(f), legenda: legenda.get(f) || ''})),
      max: RelatosRelatorioCPT.maxFotos, revisao: v ? {nome: v.nome, em: v.revisadoEm, doc: v.doc, pdf: v.pdf || '', arquivos: v.arquivos || {}, versao: v.versaoDoc, mudou: v.hashOrigem !== String(r[19] || '')} : null, prompt: RelatosRelatorioCPT.prompt(o), versao: v ? v.versao : 0};
  }
  /** Legenda no padrão do relatório (dd/mm/aaaa - Evento - Local), usada quando a foto fica sem legenda. */
  static legendaPadrao(o, tipo) { return [o.dataHorario.split(' · ')[0], tipo === 'CAO ou DDS' ? 'DDS' : tipo === 'Articulação institucional' ? 'Reunião' : 'Evento', (o.local || o.endereco || '').split(' · ')[0]].filter(Boolean).join(' - '); }
  /** Prompt para o Gemini revisar o texto (sem nomes de moradores; sem inventar). */
  static prompt(o) {
    return ['Revise o texto de um relato de atividade social para o relatório mensal da Sabesp. Escreva em português formal e claro, na terceira pessoa, sem citar nomes de moradores ou de pessoas atendidas.',
      'Regras: mantenha só os fatos que estão abaixo; não invente números, lugares, falas nem resultados; corrija ortografia e repetições; seja objetivo. Se faltar informação, não complete.',
      'Devolva três blocos, cada um em um parágrafo:\nObjetivo: <texto>\nRelato da atividade: <texto>\nResultados e encaminhamentos: <texto>',
      '--- DADOS ---', 'Atividade: ' + o.atividade + (o.titulo && o.titulo !== o.atividade ? ' — ' + o.titulo : ''), 'Data: ' + o.dataHorario, 'Local: ' + [o.local, o.endereco].filter(Boolean).join(' · '),
      'Público: ' + (o.publico || 'não informado'), 'Objetivo informado: ' + (o.objetivo || 'não informado'), 'Relato informado: ' + (o.relato || 'não informado'), 'Observação final: ' + (o.resultados || 'nenhuma')].join('\n\n');
  }

  // ---------------- Documentos (como na Central CPT 4.0) ----------------
  static subpasta(pai, nome) { const it = pai.getFoldersByName(nome); return it.hasNext() ? it.next() : pai.createFolder(nome); }
  raiz() {
    const c = AplicacaoCPT.config(); let raiz = null;
    if (c.relatosRelatorioPastaId) try { raiz = DriveApp.getFolderById(c.relatosRelatorioPastaId); } catch (_) {}
    if (!raiz) { raiz = DriveApp.createFolder(RelatosRelatorioCPT.nomeRaiz); const a = AplicacaoCPT.config(); a.relatosRelatorioPastaId = raiz.getId(); PropertiesService.getScriptProperties().setProperty(AplicacaoCPT.chave, JSON.stringify(a)); }
    return raiz;
  }
  /** "CPT • Relatos do relatório/AAAA/MM - mês" (a pasta do mês, como na Central). */
  pastaDo(dia) { const S = RelatosRelatorioCPT.subpasta; return S(S(this.raiz(), dia.slice(0, 4)), dia.slice(5, 7) + ' - ' + DadosDaAplicacao.mesExtenso(dia.slice(0, 7)).split(' ')[0]); }
  static url(tipo, id) { return tipo === 'pdf' ? 'https://drive.google.com/file/d/' + id + '/view' : 'https://docs.google.com/document/d/' + id + '/edit'; }
  static idDe(u) { return (String(u || '').match(/\/d\/([A-Za-z0-9_-]{20,})/) || [])[1] || ''; }
  /** Parágrafo no estilo da Central (Arial, azul-escuro); título de seção em HEADING2. */
  static par(corpo, texto, titulo, tamanho) {
    const p = corpo.appendParagraph(String(texto || '')); if (titulo) p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    p.editAsText().setFontFamily('Arial').setFontSize(tamanho || 11).setForegroundColor('#173747').setBold(!!titulo); p.setSpacingAfter(8).setLineSpacing(1.15); return p;
  }
  /**
   * Relato ilustrado igual ao da Central: faixa "Relato da atividade", subtítulo, quadro de 6 linhas, Objetivo, Relato da
   * atividade e Resultados (só o que tiver texto) e o registro fotográfico com até 2 fotos lado a lado, cada uma com legenda.
   */
  static render(doc, m, fotos, rodape) {
    const b = doc.getBody(); b.clear(); b.setPageWidth(595.28).setPageHeight(841.89).setMarginTop(34).setMarginBottom(36).setMarginLeft(42).setMarginRight(42);
    const h = b.appendTable([['Relato da atividade']]); h.setBorderWidth(0); h.getRow(0).getCell(0).setWidth(511).editAsText().setFontFamily('Arial').setFontSize(23).setBold(true).setForegroundColor('#083952');
    RelatosRelatorioCPT.par(b, m.titulo, false, 12).editAsText().setForegroundColor('#536D7A');
    const linhas = [['Atividade', m.atividade], ['Local', m.local], ['Endereço e bairro', m.endereco], ['Data e horário', m.dataHorario], ['Mediação', m.mediacao], ['Público', m.publico]];
    const t = b.appendTable(linhas.map(a => [a[0], a[1] || 'Não informado'])); t.setBorderColor('#CFDDE5').setBorderWidth(0.5);
    linhas.forEach((_, i) => { for (let j = 0; j < 2; j++) { const c = t.getRow(i).getCell(j); c.setWidth(j ? 391 : 120).setPaddingTop(6).setPaddingBottom(6).setPaddingLeft(8).setPaddingRight(8); c.editAsText().setFontFamily('Arial').setFontSize(10).setForegroundColor('#173747').setBold(!j); if (!j) c.setBackgroundColor('#EAF4F8'); } });
    [['Objetivo', m.objetivo], ['Relato da atividade', m.relato], ['Resultados e encaminhamentos', m.resultados]].forEach(a => { if (!a[1]) return; RelatosRelatorioCPT.par(b, a[0], true, 13).setSpacingBefore(12); String(a[1]).split(/\n+/).filter(x => x.trim()).forEach(x => RelatosRelatorioCPT.par(b, x.trim(), false, 11)); });
    if (fotos.length) {
      RelatosRelatorioCPT.par(b, 'Registro fotográfico', true, 13).setSpacingBefore(12);
      const pt = b.appendTable([fotos.map(() => '')]); pt.setBorderWidth(0);
      fotos.forEach((f, i) => {
        const cel = pt.getRow(0).getCell(i); cel.setWidth(511 / fotos.length);
        const p = cel.getChild(0).asParagraph(), im = p.appendInlineImage(f.blob), k = Math.min(495 / fotos.length / im.getWidth(), 220 / im.getHeight());
        im.setWidth(Math.round(im.getWidth() * k)).setHeight(Math.round(im.getHeight() * k)); p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        RelatosRelatorioCPT.par(cel, f.legenda || 'Registro ' + (i + 1), false, 9).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      });
    }
    const pe = doc.getFooter() || doc.addFooter(); pe.clear(); pe.appendParagraph(rodape).editAsText().setFontFamily('Arial').setFontSize(8).setForegroundColor('#536D7A');
  }
  /** Fotos escolhidas (até 2); a que não abre vira aviso. */
  static blobs(fotos, avisos) {
    const out = [];
    fotos.forEach((f, i) => { try { const a = DriveApp.getFileById(f.id), tipo = String(a.getMimeType()); const blob = /^image\/(jpeg|png|gif)$/.test(tipo) && a.getSize() <= 8000000 ? a.getBlob() : a.getThumbnail(); if (blob) out.push({blob, legenda: f.legenda}); else avisos.push('Foto ' + (i + 1) + ' sem prévia.'); }
      catch (e) { avisos.push('Foto ' + (i + 1) + ' não abriu.'); } });
    return out;
  }
  /** Um documento (Docs + PDF) na pasta; o anterior com o mesmo papel vai para "Versões anteriores". */
  documento(nome, m, fotos, rodape, pasta, anterior) {
    const d = DocumentApp.create(nome), id = d.getId(); DriveApp.getFileById(id).moveTo(pasta);
    RelatosRelatorioCPT.render(d, m, fotos, rodape); d.saveAndClose();
    const pdf = pasta.createFile(DriveApp.getFileById(id).getAs(MimeType.PDF).setName(nome + '.pdf'));
    if (anterior) { const velhas = RelatosRelatorioCPT.subpasta(pasta, 'Versões anteriores'); [anterior.doc, anterior.pdf].map(RelatosRelatorioCPT.idDe).filter(Boolean).forEach(x => { try { DriveApp.getFileById(x).moveTo(velhas); } catch (_) {} }); }
    return {doc: RelatosRelatorioCPT.url('doc', id), pdf: RelatosRelatorioCPT.url('pdf', pdf.getId())};
  }

  // ---------------- Revisar e gerar ----------------
  /**
   * Revisado → FINAL (o texto revisado) em Docs + PDF; na primeira vez, também o ORIGINAL (como veio do campo), com as mesmas
   * fotos. Revisar de novo refaz só o FINAL; o anterior vai para "Versões anteriores".
   */
  revisar(p) {
    p = p || {}; const r = this.linha(p.id), o = this.origem(r), T = ColecaoCPT.texto, tipo = RelatosRelatorioCPT.tipo(r[13]);
    const campos = {titulo: T(p.titulo, 200, 'título', true), atividade: T(p.atividade, 200, 'atividade', true), local: T(p.local, 200, 'local'), endereco: T(p.endereco, 300, 'endereço'), dataHorario: T(p.dataHorario, 120, 'data e horário', true),
      mediacao: T(p.mediacao, 200, 'mediação'), publico: T(p.publico, 300, 'público'), objetivo: T(p.objetivo, 2000, 'objetivo'), relato: T(p.relato, 12000, 'relato', true), resultados: T(p.resultados, 4000, 'resultados')};
    if (campos.relato.split(/\s+/).length < 15) throw new Error('O relato está curto demais para o relatório (menos de 15 palavras). Complete antes de gerar.');
    const lista = (Array.isArray(p.fotos) ? p.fotos : []).map(f => typeof f === 'string' ? {id: f, legenda: ''} : f || {});
    if (lista.length > RelatosRelatorioCPT.maxFotos || new Set(lista.map(f => String(f.id))).size !== lista.length) throw new Error('Escolha no máximo ' + RelatosRelatorioCPT.maxFotos + ' fotos diferentes.');
    const fotos = lista.map(f => { if (!o.fotos.includes(String(f.id))) throw new Error('Uma das fotos não pertence a este relato. Atualize a página.'); return {id: String(f.id), legenda: T(f.legenda, 300, 'legenda') || RelatosRelatorioCPT.legendaPadrao(o, tipo)}; });
    const id = 'RRL-' + r[0], antigo = this.col.obter(id), pasta = this.pastaDo(o.dia), versaoDoc = (antigo && antigo.versaoDoc || 0) + 1, avisos = [], blobs = RelatosRelatorioCPT.blobs(fotos, avisos);
    const limpo = s => String(s).replace(/[\\/:*?"<>|\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70), base = o.dia.split('-').reverse().join('-') + ' — ' + tipo + ' — ' + limpo(campos.titulo);
    const rodape = o.dia.split('-').reverse().join('/') + ' · ' + FichaOficialCPT.empresa, arquivos = {...(antigo && antigo.arquivos || {})};
    if (!arquivos.final && antigo && antigo.doc) arquivos.final = {doc: antigo.doc, pdf: antigo.pdf || ''}; // revisado na 2.43: o documento de antes vai para Versões anteriores
    arquivos.final = this.documento(base + ' — FINAL' + (versaoDoc > 1 ? ' v' + versaoDoc : ''), campos, blobs, rodape, pasta, arquivos.final);
    if (!arquivos.original) arquivos.original = this.documento(base + ' — ORIGINAL', o, blobs, rodape, pasta, null);
    const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('Os documentos foram gerados, mas a revisão não foi registrada agora. Revise de novo em instantes.');
    let e; try { e = this.col.gravar({registroId: String(r[0]), mes: o.dia.slice(0, 7), tipo, campos, fotos, doc: arquivos.final.doc, pdf: arquivos.final.pdf, arquivos, versaoDoc, hashOrigem: String(r[19] || ''), revisadoPor: this.ctx.email, nome: this.ctx.perfil.nome, revisadoEm: new Date().toISOString()}, antigo ? antigo.versao : 0, p.operacaoId, id); }
    finally { lock.releaseLock(); }
    return {resultado: 'Revisado. Relato FINAL' + (antigo && antigo.arquivos && antigo.arquivos.original ? '' : ' e ORIGINAL') + ' gerados (Docs e PDF) na pasta ' + o.dia.slice(0, 4) + '/' + o.dia.slice(5, 7) + '.' + (avisos.length ? ' Atenção: ' + avisos.join(' ') : ''),
      doc: arquivos.final.doc, revisao: {nome: e.nome, em: e.revisadoEm, doc: arquivos.final.doc, pdf: arquivos.final.pdf, arquivos, versao: versaoDoc, mudou: false}};
  }
}

/** Missão para quem revisa: relatos do mês (e do anterior, até o dia 10) ainda pendentes. Em cache pela base e pelas revisões. */
RelatosRelatorioCPT.missoes = function (ctx) {
  if (!RelatosRelatorioCPT.pode(ctx.perfil)) return [];
  const rr = new RelatosRelatorioCPT(ctx), hoje = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd'), meses = AnexosCPT.mesesParaGravar(hoje, '');
  const chave = 'missao-relatorio:' + ctx.config.baseId + ':' + hoje + ':' + rr.dados.registros().getLastRow() + ':' + rr.col.itens().length + ':' + rr.col.itens().reduce((s, x) => s + x.versao, 0);
  const n = CacheCPT.obter(chave, 1800, () => ({n: meses.reduce((s, m) => s + rr.listar(m).itens.filter(x => x.situacao !== 'revisado').length, 0)})).n;
  return n ? [{id: 'relatos-relatorio', titulo: n + (n === 1 ? ' relato para o relatório aguardando revisão' : ' relatos para o relatório aguardando revisão'), texto: 'Ação social, articulação institucional, CAO e DDS: revise o texto e gere o documento.', rota: 'registros', aba: 'relatorio', tipo: 'rota'}] : [];
};

function listarRelatosRelatorioCPT(p) { return AplicacaoCPT.executar((d, ctx) => new RelatosRelatorioCPT(ctx).listar(String(p && p.mes || '')), 'relatorio.listar'); }
function abrirRelatoRelatorioCPT(p) { return AplicacaoCPT.executar((d, ctx) => new RelatosRelatorioCPT(ctx).abrir(String(p && p.id || '')), 'relatorio.abrir'); }
function revisarRelatoRelatorioCPT(p) { return AplicacaoCPT.executar((d, ctx) => new RelatosRelatorioCPT(ctx).revisar(p), 'relatorio.revisar'); }

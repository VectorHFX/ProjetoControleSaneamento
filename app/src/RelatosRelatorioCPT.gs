/**
 * RelatosRelatorioCPT 2.43.0. Relatos ilustrados para o relatório mensal, a partir dos relatos de atividade do Campo 4.0.
 * - Entram os relatos dos tipos: Ação social externa, Ação social interna, Articulação institucional e CAO ou DDS.
 * - Cada um nasce "Pendente de revisão". Socioambiental, Comunicação, Gestão e Administrativo revisam o texto (pode usar o
 *   prompt para o Gemini, sem nomes de moradores; a revisão humana é sempre obrigatória) e escolhem as fotos.
 * - Revisado → Google Docs no modelo do relato ilustrado (os mesmos marcadores {{TITULO}}, {{RELATO}}, {{FOTOS}}…), na pasta
 *   "CPT • Relatos do relatório/AAAA/MM - mês/Tipo". Revisar de novo cria outra versão; a anterior vai para "Versões anteriores".
 * - Se o registro de origem mudar depois da revisão, o relato aparece como "Mudou na origem" para conferir.
 * O modelo é criado uma vez pela aplicação (igual ao modelo de antes) e pode ser ajustado no Docs, sem tirar os marcadores.
 */
class RelatosRelatorioCPT {
  static get aba() { return 'Relatos do relatório'; }
  static get nomeRaiz() { return 'CPT • Relatos do relatório'; }
  static get marcadores() { return ['TITULO', 'ATIVIDADE', 'LOCAL', 'ENDERECO', 'DATA_HORARIO', 'MEDIACAO', 'EQUIPE', 'PUBLICO', 'OBJETIVO', 'RELATO', 'RESULTADOS', 'INTERRUPCAO', 'FOTOS']; }
  static get maxFotos() { return 8; }
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
        doc: v && v.doc || '', revisadoPor: v && v.nome || '', revisadoEm: v && v.revisadoEm || ''};
    }).sort((a, b) => a.data.localeCompare(b.data));
    const c = AplicacaoCPT.config();
    return {mes, itens, tipos: ['Ação social externa', 'Ação social interna', 'Articulação institucional', 'CAO ou DDS'], pasta: c.relatosRelatorioPastaId ? 'https://drive.google.com/drive/folders/' + c.relatosRelatorioPastaId : '',
      modelo: c.modeloRelatoId ? 'https://docs.google.com/document/d/' + c.modeloRelatoId + '/edit' : ''};
  }
  linha(id) {
    const D = this.dados, a = D.registros(), linha = D.localizar(a, String(id || '')), r = a.getRange(linha, 1, 1, 21).getValues()[0];
    if (!RelatosRelatorioCPT.tipo(r[13]) || !/relato de atividade/.test(RelatosRelatorioCPT.norm(r[1]))) throw new Error('Este registro não é um relato para o relatório.');
    return r;
  }
  /** Campos do documento a partir do registro de origem. */
  origem(r) {
    const D = DadosDaAplicacao; let c = D.campos(r[20]);
    if (!c && /arquivoDetalhesId/.test(String(r[20] || ''))) try { c = D.campos(JSON.stringify(D.lerDetalhes(r[20]))); } catch (_) { c = null; }
    const v = re => D.valor(c, re), dia = this.dados.data(r[2]), br = dia.split('-').reverse().join('/');
    const entrada = v(/^horario de entrada/), saida = v(/^horario de saida/), apoio = v(/^colaboradores de apoio/), frente = v(/^titulo da frente/) || SocioambientalCPT.frente(r[9]);
    const participantes = r[14] !== '' ? String(r[14]) : v(/^total de participantes/), interrompeu = /^sim/.test(RelatosRelatorioCPT.norm(v(/^houve interrupcao/)));
    const fotos = [...new Set((String(r[20] || '').match(/(?:\/d\/|[?&]id=)[A-Za-z0-9_-]{25,}/g) || []).map(x => x.replace(/^(?:\/d\/|[?&]id=)/, '')))];
    return {titulo: v(/^complemento da atividade/) || frente || String(r[13]), atividade: String(r[13]), local: frente, endereco: [v(/^endereco da frente|^endereco completo/), r[7]].filter(Boolean).join(' · '),
      dataHorario: br + (entrada ? ' · ' + entrada + (saida ? ' às ' + saida : '') : ''), mediacao: String(r[11] || ''), equipe: [r[11], apoio].filter(Boolean).join(', '),
      publico: [v(/^publico-alvo|^publico alvo/), participantes ? participantes + ' participantes informados' : ''].filter(Boolean).join(' · '),
      objetivo: v(/^objetivo da atividade/), relato: v(/^relato da atividade/), resultados: v(/^observacao final/),
      interrupcao: interrompeu ? [v(/^descreva qual foi a interru|^qual foi a interrupcao/), v(/^indique os horarios da interrupcao|^informe o horario de inicio e fim da interrupcao/)].filter(Boolean).join(' · ') || 'Houve interrupção (sem descrição).' : '',
      fotos, dia};
  }
  abrir(id) {
    const r = this.linha(id), o = this.origem(r), v = this.col.obter('RRL-' + r[0]);
    const campos = v ? {...o, ...v.campos, fotos: o.fotos} : o, escolhidas = v ? v.fotos : o.fotos.slice(0, RelatosRelatorioCPT.maxFotos);
    return {id: String(r[0]), tipo: RelatosRelatorioCPT.tipo(r[13]), campos, fotos: o.fotos.map(f => ({id: f, url: 'https://drive.google.com/file/d/' + f + '/view', thumb: 'https://drive.google.com/thumbnail?id=' + f + '&sz=w320', escolhida: escolhidas.includes(f)})),
      max: RelatosRelatorioCPT.maxFotos, revisao: v ? {nome: v.nome, em: v.revisadoEm, doc: v.doc, versao: v.versaoDoc, mudou: v.hashOrigem !== String(r[19] || '')} : null, prompt: RelatosRelatorioCPT.prompt(o), versao: v ? v.versao : 0};
  }
  /** Prompt para o Gemini revisar o texto (sem nomes de moradores; sem inventar). */
  static prompt(o) {
    return ['Revise o texto de um relato de atividade social para o relatório mensal da Sabesp. Escreva em português formal e claro, na terceira pessoa, sem citar nomes de moradores ou de pessoas atendidas.',
      'Regras: mantenha só os fatos que estão abaixo; não invente números, lugares, falas nem resultados; corrija ortografia e repetições; seja objetivo. Se faltar informação, não complete.',
      'Devolva três blocos, cada um em um parágrafo:\nObjetivo: <texto>\nRelato da atividade: <texto>\nResultados e encaminhamentos: <texto>',
      '--- DADOS ---', 'Atividade: ' + o.atividade + (o.titulo && o.titulo !== o.atividade ? ' — ' + o.titulo : ''), 'Data: ' + o.dataHorario, 'Local: ' + [o.local, o.endereco].filter(Boolean).join(' · '),
      'Público: ' + (o.publico || 'não informado'), 'Objetivo informado: ' + (o.objetivo || 'não informado'), 'Relato informado: ' + (o.relato || 'não informado'), 'Observação final: ' + (o.resultados || 'nenhuma')].join('\n\n');
  }

  // ---------------- Pastas e modelo ----------------
  static subpasta(pai, nome) { const it = pai.getFoldersByName(nome); return it.hasNext() ? it.next() : pai.createFolder(nome); }
  raiz() {
    const c = AplicacaoCPT.config(); let raiz = null;
    if (c.relatosRelatorioPastaId) try { raiz = DriveApp.getFolderById(c.relatosRelatorioPastaId); } catch (_) {}
    if (!raiz) { raiz = DriveApp.createFolder(RelatosRelatorioCPT.nomeRaiz); const a = AplicacaoCPT.config(); a.relatosRelatorioPastaId = raiz.getId(); PropertiesService.getScriptProperties().setProperty(AplicacaoCPT.chave, JSON.stringify(a)); }
    return raiz;
  }
  pastaDo(dia, tipo) {
    const mes = dia.slice(0, 7), nome = dia.slice(5, 7) + ' - ' + DadosDaAplicacao.mesExtenso(mes).split(' ')[0];
    return RelatosRelatorioCPT.subpasta(RelatosRelatorioCPT.subpasta(RelatosRelatorioCPT.subpasta(this.raiz(), dia.slice(0, 4)), nome), tipo);
  }
  modelo() {
    const c = AplicacaoCPT.config();
    if (c.modeloRelatoId) try { const d = DocumentApp.openById(c.modeloRelatoId); RelatosRelatorioCPT.conferirModelo(d); return c.modeloRelatoId; } catch (e) { if (/Marcador/.test(e.message)) throw e; }
    const d = DocumentApp.create('MODELO - Relato ilustrado da atividade social'); RelatosRelatorioCPT.montarModelo(d); d.saveAndClose();
    DriveApp.getFileById(d.getId()).moveTo(this.raiz());
    const a = AplicacaoCPT.config(); a.modeloRelatoId = d.getId(); PropertiesService.getScriptProperties().setProperty(AplicacaoCPT.chave, JSON.stringify(a));
    return d.getId();
  }
  static conferirModelo(doc) {
    const t = doc.getBody().getText(); RelatosRelatorioCPT.marcadores.forEach(k => { if (!t.includes('{{' + k + '}}')) throw new Error('Marcador {{' + k + '}} ausente no modelo do relato. Restaure-o no Docs antes de gerar.'); });
  }
  /** Mesmo modelo do relato ilustrado de antes (A4, Arial, tabela de dados, fotos em páginas próprias). */
  static montarModelo(doc) {
    const b = doc.getBody(); b.clear(); b.setPageWidth(595.28).setPageHeight(841.89).setMarginTop(42).setMarginBottom(42).setMarginLeft(48).setMarginRight(48);
    const para = (text, size, bold, color) => { const p = b.appendParagraph(text); p.setSpacingAfter(7).setLineSpacing(1.15); p.editAsText().setFontFamily('Arial').setFontSize(size || 11).setBold(!!bold).setForegroundColor(color || '#172F43'); return p; };
    para('CONSÓRCIO PERFORMANCE TAMANDUATEÍ', 10, true, '#073B56'); para('Relato da atividade', 24, true, '#000000').setHeading(DocumentApp.ParagraphHeading.TITLE); para('{{TITULO}}', 14, true, '#073B56');
    const rows = [['Atividade', '{{ATIVIDADE}}'], ['Local', '{{LOCAL}}'], ['Endereço e bairro', '{{ENDERECO}}'], ['Data e horário', '{{DATA_HORARIO}}'], ['Mediação', '{{MEDIACAO}}'], ['Equipe registrada', '{{EQUIPE}}'], ['Público', '{{PUBLICO}}']];
    const t = b.appendTable(rows); t.setBorderColor('#D9E3EA').setBorderWidth(0.5);
    for (let r = 0; r < t.getNumRows(); r++) { t.getCell(r, 0).setWidth(113).setBackgroundColor('#EAF4F8'); t.getCell(r, 1).setWidth(386); for (let c = 0; c < 2; c++) { const cell = t.getCell(r, c); cell.setPaddingTop(6).setPaddingBottom(6).setPaddingLeft(8).setPaddingRight(8); cell.editAsText().setFontFamily('Arial').setFontSize(10).setForegroundColor('#172F43').setBold(c === 0); } }
    para('Objetivo', 14, true, '#000000'); para('{{OBJETIVO}}'); para('Relato da atividade', 14, true, '#000000'); para('{{RELATO}}'); para('Resultados e encaminhamentos', 14, true, '#000000'); para('{{RESULTADOS}}'); para('Interrupção informada', 14, true, '#000000'); para('{{INTERRUPCAO}}');
    b.appendPageBreak(); para('Registro fotográfico', 20, true, '#000000'); para('{{FOTOS}}');
    const foot = doc.addFooter(); foot.appendParagraph('{{REFERENCIA}}').editAsText().setFontFamily('Arial').setFontSize(8).setForegroundColor('#526C7B');
  }
  static substituir(container, token, valor) {
    const todos = [], padrao = '\\{\\{' + token + '\\}\\}'; let m = container.findText(padrao); while (m) { todos.push(m); m = container.findText(padrao, m); }
    todos.reverse().forEach(x => { const t = x.getElement().asText(), a = x.getStartOffset(), b = x.getEndOffsetInclusive(); t.deleteText(a, b); if (valor) t.insertText(a, valor); });
  }
  /** Preenche o documento; fotos que não abrirem são puladas (avisos). */
  static preencher(doc, c, fotos, referencia) {
    const b = doc.getBody(), avisos = [], valores = {TITULO: c.titulo || c.atividade, ATIVIDADE: c.atividade, LOCAL: c.local || 'Não informado', ENDERECO: c.endereco || 'Não informado', DATA_HORARIO: c.dataHorario,
      MEDIACAO: c.mediacao || 'Não informada', EQUIPE: c.equipe || 'Não informada', PUBLICO: c.publico || 'Não informado', OBJETIVO: c.objetivo || 'Não informado.', RELATO: c.relato, RESULTADOS: c.resultados, INTERRUPCAO: c.interrupcao};
    ['RESULTADOS', 'INTERRUPCAO'].forEach(k => { if (valores[k]) return; const m = b.findText('\\{\\{' + k + '\\}\\}'); if (m) { const par = m.getElement().getParent(), ant = par.getPreviousSibling(); if (ant && ant.getType() === DocumentApp.ElementType.PARAGRAPH) ant.removeFromParent(); par.removeFromParent(); } });
    Object.keys(valores).forEach(k => RelatosRelatorioCPT.substituir(b, k, valores[k]));
    if (doc.getFooter()) RelatosRelatorioCPT.substituir(doc.getFooter(), 'REFERENCIA', referencia);
    const m = b.findText('\\{\\{FOTOS\\}\\}'); if (!m) throw new Error('Marcador {{FOTOS}} ausente no modelo.');
    const par = m.getElement().getParent(); let at = b.getChildIndex(par); par.asParagraph().clear();
    const blobs = []; fotos.forEach((id, i) => { try { const f = DriveApp.getFileById(id), tipo = String(f.getMimeType()); const blob = /^image\/(jpeg|png|gif)$/.test(tipo) && f.getSize() <= 8000000 ? f.getBlob() : f.getThumbnail(); if (blob) blobs.push({blob, video: /^video\//.test(tipo)}); else avisos.push('Foto ' + (i + 1) + ' sem prévia.'); } catch (e) { avisos.push('Foto ' + (i + 1) + ' não abriu (' + e.message + ').'); } });
    if (!blobs.length) { b.insertParagraph(at, 'Nenhuma foto vinculada a este relato.'); return avisos; }
    for (let i = 0; i < blobs.length; i += 2) {
      const t = b.insertTable(at++, [['', ''], ['', '']]); t.setBorderColor('#D9E3EA').setBorderWidth(0.5);
      for (let k = 0; k < 2; k++) {
        for (let row = 0; row < 2; row++) t.getCell(row, k).setWidth(249).setPaddingTop(6).setPaddingBottom(6).setPaddingLeft(7).setPaddingRight(7);
        const f = blobs[i + k]; if (!f) continue;
        const p = t.getCell(0, k).getChild(0).asParagraph(), im = p.appendInlineImage(f.blob), e = Math.min(230 / im.getWidth(), 180 / im.getHeight(), 1); im.setWidth(Math.round(im.getWidth() * e)).setHeight(Math.round(im.getHeight() * e));
        p.setAlignment(DocumentApp.HorizontalAlignment.CENTER); t.getCell(1, k).setText((f.video ? 'Prévia de vídeo ' : 'Foto ') + (i + k + 1) + ' · ' + c.dataHorario.split(' · ')[0]);
        t.getCell(1, k).editAsText().setFontFamily('Arial').setFontSize(9).setForegroundColor('#526C7B');
      }
      b.insertParagraph(at++, '').setSpacingAfter(4); if (i + 2 < blobs.length && (i + 2) % 4 === 0) b.insertPageBreak(at++);
    }
    return avisos;
  }

  // ---------------- Revisar e gerar ----------------
  revisar(p) {
    p = p || {}; const r = this.linha(p.id), o = this.origem(r), T = ColecaoCPT.texto, tipo = RelatosRelatorioCPT.tipo(r[13]);
    const campos = {titulo: T(p.titulo, 200, 'título', true), local: T(p.local, 200, 'local'), endereco: T(p.endereco, 300, 'endereço'), mediacao: T(p.mediacao, 200, 'mediação'), equipe: T(p.equipe, 400, 'equipe'),
      publico: T(p.publico, 300, 'público'), objetivo: T(p.objetivo, 2000, 'objetivo'), relato: T(p.relato, 12000, 'relato', true), resultados: T(p.resultados, 4000, 'resultados'), interrupcao: T(p.interrupcao, 1000, 'interrupção')};
    if (campos.relato.split(/\s+/).length < 15) throw new Error('O relato está curto demais para o relatório (menos de 15 palavras). Complete antes de gerar.');
    const fotos = [...new Set((Array.isArray(p.fotos) ? p.fotos : []).map(String))].filter(f => o.fotos.includes(f)); if (fotos.length > RelatosRelatorioCPT.maxFotos) throw new Error('Escolha no máximo ' + RelatosRelatorioCPT.maxFotos + ' fotos.');
    const id = 'RRL-' + r[0], antigo = this.col.obter(id), modelo = this.modelo(), pasta = this.pastaDo(o.dia, tipo), versaoDoc = (antigo && antigo.versaoDoc || 0) + 1;
    const limpo = s => String(s).replace(/[\\/:*?"<>|\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70);
    const nome = o.dia.split('-').reverse().join('-') + ' · ' + tipo + ' · ' + limpo(campos.titulo) + (versaoDoc > 1 ? ' · v' + versaoDoc : '');
    const copia = DriveApp.getFileById(modelo).makeCopy(nome, pasta), doc = DocumentApp.openById(copia.getId());
    const avisos = RelatosRelatorioCPT.preencher(doc, {...o, ...campos, atividade: o.atividade, dataHorario: o.dataHorario}, fotos, o.dataHorario.split(' · ')[0] + ' · ' + String(r[0]).slice(0, 12) + ' · ' + FichaOficialCPT.empresa);
    doc.saveAndClose();
    const url = 'https://docs.google.com/document/d/' + copia.getId() + '/edit';
    if (antigo && antigo.doc) { const velho = (antigo.doc.match(/\/d\/([A-Za-z0-9_-]{20,})/) || [])[1]; if (velho) try { DriveApp.getFileById(velho).moveTo(RelatosRelatorioCPT.subpasta(pasta, 'Versões anteriores')); } catch (_) {} }
    const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('O documento foi gerado, mas a revisão não foi registrada agora. Revise de novo em instantes.');
    let e; try { e = this.col.gravar({registroId: String(r[0]), mes: o.dia.slice(0, 7), tipo, campos, fotos, doc: url, versaoDoc, hashOrigem: String(r[19] || ''), revisadoPor: this.ctx.email, nome: this.ctx.perfil.nome, revisadoEm: new Date().toISOString()}, antigo ? antigo.versao : 0, p.operacaoId, id); }
    finally { lock.releaseLock(); }
    return {resultado: 'Revisado. O relato virou documento na pasta ' + o.dia.slice(0, 4) + '/' + o.dia.slice(5, 7) + '/' + tipo + '.' + (avisos.length ? ' Atenção: ' + avisos.join(' ') : ''), doc: url, revisao: {nome: e.nome, em: e.revisadoEm, doc: url, versao: versaoDoc, mudou: false}};
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

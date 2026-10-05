/**
 * FichaOficialCPT 1.0.0. Ficha de Atendimento no modelo oficial Sabesp (Google Docs) e PDF, gerados pela aplicação.
 * - Preenche o MESMO modelo e a mesma diagramação das Fichas Oficiais 3.2.1 (duas tabelas, Arial 12, texto preto, grade de fotos).
 *   O modelo não é redesenhado: só recebe os dados.
 * - Dados: casos novos (formulário 4.0 + execuções + conclusão) e migrados (ficha oficial antiga + o que aconteceu depois).
 * - Só gera de novo quando o conteúdo muda (hash). A versão anterior vai para "Versões anteriores"; nada é apagado.
 * - 2.27: o pacote do mês (ANEXO 4) saiu da aplicação junto com o fechamento do relatório; a ficha de cada caso continua.
 */
class FichaOficialCPT {
  static get modeloPadrao() { return '11wGNtV2E0O-PhSv6XOnVo5KPCB6GPi18rRKEYG6HN54'; }
  static get versaoModelo() { return 'CPT-1'; }
  static get empresa() { return 'Consórcio Performance Tamanduateí'; }
  static get limiteFotos() { return 12; }

  constructor(ctx) { this.ctx = ctx; this.ciclo = new CicloAtendimentoCPT(ctx); this.fuso = this.ciclo.fuso; }
  config() { return AplicacaoCPT.config(); }
  salvarConfig(c) { PropertiesService.getScriptProperties().setProperty(AplicacaoCPT.chave, JSON.stringify(c)); }
  /** Pasta CPT • Fichas oficiais com Documentos, PDFs e Versões anteriores. Guardada na configuração (pode ser movida no Drive). */
  pasta(sub) {
    const c = this.config(); let raiz = null;
    if (c.pastaFichasId) { try { raiz = DriveApp.getFolderById(c.pastaFichasId); } catch (_) {} }
    if (!raiz) { raiz = DriveApp.createFolder('CPT • Fichas oficiais'); c.pastaFichasId = raiz.getId(); this.salvarConfig(c); }
    if (!sub) return raiz;
    const it = raiz.getFoldersByName(sub); return it.hasNext() ? it.next() : raiz.createFolder(sub);
  }
  data(v, f) { const d = v instanceof Date ? v : (v ? new Date(v) : null); return d && !isNaN(d) ? Utilities.formatDate(d, this.fuso, f || 'dd/MM/yyyy') : String(v || ''); }
  hora(v) {
    if (v instanceof Date || /^\d{4}-\d{2}-\d{2}T/.test(String(v))) return this.data(v, 'HH:mm');
    const m = String(v || '').match(/(\d{1,2}):(\d{2})/); return m ? m[1].padStart(2, '0') + ':' + m[2] : '';
  }
  /** Registro com os campos da ficha oficial, a partir da linha do caso. */
  registro(r) {
    const d = CicloAtendimentoCPT.json(r[19]), c = CicloAtendimentoCPT.campos(d, r);
    const execucoes = (d.execucoes || []).map(e => (e.data ? this.data(e.data + 'T12:00:00') + ': ' : '') + String(e.feito || '').trim()).filter(x => x.trim());
    const fotosSolucao = [c.fotosSolucaoAnterior].concat((d.execucoes || []).map(e => e.evidencias || '')).filter(Boolean).join(' ');
    return {protocolo: String(r[0]), dataAbertura: this.data(r[4]), horario: this.hora(c.horario), local: c.local || c.canal, responsavel: c.responsavel, assunto: c.assunto, tipo: c.tipo,
      nome: c.nome, telefone: c.telefone, email: c.email, endereco: c.endereco, solicitacao: c.solicitacao, descricao: c.descricao,
      solucao: [c.solucaoAnterior].concat(execucoes).filter(Boolean).join('\n\n'), finalizacao: String(d.conclusao || c.finalizacaoAnterior || ''),
      concluido: /conclu/i.test(String(r[3])), fotos: FichaOficialCPT.ids(c.fotosAbertura).concat(FichaOficialCPT.ids(fotosSolucao)).filter((x, i, a) => a.indexOf(x) === i)};
  }
  static ids(texto) {
    const out = []; String(texto || '').replace(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{20,})/g, (_, id) => { out.push(id); return _; }); return out;
  }
  hash(reg) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify([FichaOficialCPT.versaoModelo, this.modelo(), reg]), Utilities.Charset.UTF_8).map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join(''); }
  modelo() { return this.config().modeloFichaId || FichaOficialCPT.modeloPadrao; }

  /** Gera (ou reaproveita) a ficha de um protocolo. Retorna {documento, pdf, gerada}. */
  gerar(protocolo, forcar) {
    const {r} = this.ciclo.localizar(String(protocolo || '')), reg = this.registro(r), d = CicloAtendimentoCPT.json(r[19]), hash = this.hash(reg);
    if (!reg.nome || !reg.solicitacao) throw new Error('A ficha ' + reg.protocolo + ' precisa de nome e solicitação. Use Corrigir dados da ficha.');
    if (!forcar && d.fichaHash === hash && r[14] && r[15]) return {protocolo: reg.protocolo, documento: String(r[14]), pdf: String(r[15]), gerada: false};
    const copia = DriveApp.getFileById(this.modelo()).makeCopy(reg.protocolo + ' Ficha de Atendimento', this.pasta('Documentos'));
    const doc = DocumentApp.openById(copia.getId());
    new DocumentoFichaCPT(doc, reg, this.fuso).preencher();
    doc.saveAndClose();
    const pdf = this.pasta('PDFs').createFile(copia.getAs(MimeType.PDF).setName(reg.protocolo + '_Ficha_Atendimento.pdf'));
    const docUrl = 'https://docs.google.com/document/d/' + copia.getId() + '/edit', pdfUrl = 'https://drive.google.com/file/d/' + pdf.getId() + '/view';
    // Grava só os links e o hash: não muda a versão do caso (ninguém perde o que está digitando).
    const lock = LockService.getScriptLock(); if (!lock.tryLock(20000)) throw new Error('A base está ocupada. A ficha foi criada e será vinculada na próxima tentativa.');
    let anteriores = [];
    try {
      const atual = this.ciclo.localizar(reg.protocolo), dd = CicloAtendimentoCPT.json(atual.r[19]);
      anteriores = [atual.r[14], atual.r[15]].map(u => (String(u).match(/\/d\/([A-Za-z0-9_-]{20,})/) || [])[1]).filter(Boolean);
      dd.fichaHash = hash; dd.fichaGeradaEm = new Date().toISOString();
      atual.a.getRange(atual.linha, 15, 1, 2).setValues([[docUrl, pdfUrl]]);
      atual.a.getRange(atual.linha, 20).setValue(JSON.stringify(dd).slice(0, 49000));
      this.ciclo.aba('Movimentações').appendRow(['MOV-FICHA-' + hash.slice(0, 20), reg.protocolo, new Date(), 'Ficha oficial gerada', String(atual.r[3]), this.ctx.perfil.nome + ' <' + this.ctx.email + '>',
        'Documento e PDF no modelo oficial' + (reg.fotos.length ? ' · ' + Math.min(reg.fotos.length, FichaOficialCPT.limiteFotos) + ' foto(s)' : ''), 'Aplicação CPT', '', '{}']);
    } finally { lock.releaseLock(); }
    const versoes = this.pasta('Versões anteriores');
    anteriores.filter(id => id !== copia.getId() && id !== pdf.getId()).forEach(id => { try { DriveApp.getFileById(id).moveTo(versoes); } catch (_) {} });
    return {protocolo: reg.protocolo, documento: docUrl, pdf: pdfUrl, gerada: true};
  }
}

/** Preenchimento do modelo oficial. Mesma estrutura das Fichas Oficiais 3.2.1. */
class DocumentoFichaCPT {
  constructor(doc, reg, fuso) { this.doc = doc; this.reg = reg; this.fuso = fuso; }
  corpo() { return typeof this.doc.getActiveTab === 'function' ? this.doc.getActiveTab().asDocumentTab().getBody() : this.doc.getBody(); }
  preencher() {
    const corpo = this.corpo(), t = corpo.getTables(), R = this.reg;
    if (t.length < 2) throw new Error('O modelo oficial perdeu suas duas tabelas principais. Nenhuma ficha foi gerada.');
    const topo = t[0].getCell(0, 0), cel = t[1].getCell(0, 0), ou = (v, s) => String(v || '').trim() || s;
    topo.clear();
    this.campo(topo, 'Empresa contratada: ', FichaOficialCPT.empresa);
    this.campo(topo, 'Responsável pelo atendimento: ', ou(R.responsavel, 'Não informado'));
    const p = topo.appendParagraph(''); this.estilo(p.appendText('Data: '), true); this.estilo(p.appendText(ou(R.dataAbertura, 'Não informado')), false);
    this.estilo(p.appendText('      Horário: '), true); this.estilo(p.appendText(ou(R.horario, 'Não informado')), false); p.setSpacingAfter(0).setLineSpacing(1.0);
    this.campo(topo, 'Local: ', ou(R.local, 'Não informado'));
    this.campo(topo, 'Assunto: ', ou(R.assunto, 'Não informado'));
    this.campo(topo, 'Tipo de manifestação: ', ou(R.tipo, 'Não informado'));
    cel.clear();
    this.titulo(cel, 'Dados do cliente', false, false);
    this.campo(cel, 'Nome: ', ou(R.nome, 'Não fornecido'));
    this.campo(cel, 'Telefones: ', ou(R.telefone, 'Não fornecido'));
    this.campo(cel, 'E-mail: ', ou(R.email, 'Não fornecido'));
    this.campo(cel, 'Endereço: ', ou(R.endereco, 'Não fornecido'));
    this.espaco(cel);
    this.titulo(cel, 'Solicitação:', false, false);
    this.longo(cel, R.solicitacao);
    if (R.descricao && DadosDaAplicacao.norm(R.descricao) !== DadosDaAplicacao.norm(R.solicitacao)) this.longo(cel, R.descricao);
    this.espaco(cel); this.narrativo(cel, 'Providências realizadas: ', R.solucao);
    this.espaco(cel); this.narrativo(cel, 'Conclusão: ', R.finalizacao);
    this.espaco(cel); this.titulo(cel, 'Registro Fotográfico', true, true);
    const fotos = this.fotos(); if (fotos.length) this.grade(cel, fotos);
    this.espaco(cel);
    const s = cel.appendParagraph(''); this.estilo(s.appendText('Status: '), true); this.estilo(s.appendText(R.concluido ? 'Atendimento encerrado.' : 'Atendimento em andamento.'), false); s.setSpacingAfter(0).setLineSpacing(1.0);
    try { const tx = corpo.editAsText(); if (tx.getText()) tx.setForegroundColor('#000000'); } catch (_) {}
  }
  estilo(t, negrito) { t.setFontFamily('Arial').setFontSize(12).setBold(!!negrito).setForegroundColor('#000000').setUnderline(false); try { t.setLinkUrl(null); } catch (_) {} return t; }
  campo(c, rotulo, valor) { const p = c.appendParagraph(''); this.estilo(p.appendText(rotulo), true); this.estilo(p.appendText(String(valor)), false); p.setSpacingAfter(0).setLineSpacing(1.0); return p; }
  titulo(c, texto, centro, sublinhado) { const p = c.appendParagraph(''); this.estilo(p.appendText(texto), true).setUnderline(!!sublinhado); if (centro) p.setAlignment(DocumentApp.HorizontalAlignment.CENTER); p.setSpacingAfter(0).setLineSpacing(1.0); }
  espaco(c) { c.appendParagraph('').setSpacingAfter(4); }
  longo(c, v) {
    const blocos = String(v || '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
    (blocos.length ? blocos : ['Não informado.']).forEach(b => { const p = c.appendParagraph(''); this.estilo(p.appendText(b), false); p.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY).setSpacingAfter(8).setLineSpacing(1.15); });
  }
  narrativo(c, rotulo, v) {
    const blocos = String(v || '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean), p = c.appendParagraph('');
    this.estilo(p.appendText(rotulo), true); this.estilo(p.appendText(blocos.length ? blocos.shift() : 'Não informado.'), false);
    p.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY).setSpacingAfter(8).setLineSpacing(1.15);
    blocos.forEach(b => { const q = c.appendParagraph(''); this.estilo(q.appendText(b), false); q.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY).setSpacingAfter(8).setLineSpacing(1.15); });
  }
  fotos() {
    const out = [];
    for (const id of this.reg.fotos) {
      if (out.length >= FichaOficialCPT.limiteFotos) break;
      try { const b = DriveApp.getFileById(id).getBlob(); if (String(b.getContentType()).indexOf('image/') === 0) out.push(b); } catch (_) { /* sem acesso: segue sem a foto */ }
    }
    return out;
  }
  grade(c, fotos) {
    const linhas = []; for (let i = 0; i < fotos.length; i += 2) linhas.push(['', ''], ['', '']);
    const g = c.appendTable(linhas); g.setBorderWidth(1).setBorderColor('#000000');
    fotos.forEach((blob, i) => {
      const cell = g.getCell(Math.floor(i / 2) * 2, i % 2); cell.clear(); cell.setVerticalAlignment(DocumentApp.VerticalAlignment.CENTER);
      const p = cell.appendParagraph(''); p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      const img = p.appendInlineImage(blob), w = img.getWidth(), h = img.getHeight();
      if (w && h) { const e = Math.min(235 / w, 185 / h, 1); img.setWidth(Math.round(w * e)); img.setHeight(Math.round(h * e)); }
    });
  }
}

function gerarFichaOficialCPT(p) {
  return AplicacaoCPT.executar((d, ctx) => {
    if (!CicloAtendimentoCPT.podeConduzir(ctx.perfil)) throw new Error('Seu perfil não gera a ficha oficial.');
    const r = new FichaOficialCPT(ctx).gerar(String((p && p.protocolo) || ''), !!(p && p.forcar)); CicloAtendimentoCPT.invalidar();
    return {...r, resultado: r.gerada ? 'Ficha oficial gerada.' : 'A ficha já estava atualizada.'};
  }, 'atendimentos.fichaOficial');
}

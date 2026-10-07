/**
 * FichaOficialCPT 1.0.0. Ficha de Atendimento no modelo oficial Sabesp (Google Docs) e PDF, gerados pela aplicação.
 * - Preenche o MESMO modelo e a mesma diagramação das Fichas Oficiais 3.2.1 (duas tabelas, Arial 12, texto preto, grade de fotos).
 *   O modelo não é redesenhado: só recebe os dados.
 * - Dados: casos novos (formulário 4.0 + execuções + conclusão) e migrados (ficha oficial antiga + o que aconteceu depois).
 * - Só gera de novo quando o conteúdo muda (hash). A versão anterior vai para "Versões anteriores"; nada é apagado.
 * - 2.27: o pacote do mês (ANEXO 4) saiu da aplicação junto com o fechamento do relatório; a ficha de cada caso continua.
 * - 2.38: pasta organizada "CPT • Fichas oficiais da Sabesp": Casos (a ficha atual de cada caso, Docs + PDF, com o número
 *   do caso no nome), Versões anteriores e Pacotes/AAAA-MM. Fichas antigas que já estão em dia são MOVIDAS para Casos (não
 *   refeitas); só são geradas as que faltam ou mudaram. "Atualizar todas" trabalha por tempo (lotes) e continua de onde parou.
 *   Pacote do mês: cópias congeladas dos PDFs dos casos abertos no mês, concluídos no mês e em andamento no fim do mês, mais
 *   um índice em PDF. A rotina (acionadores das 12h e 0h) mantém as fichas em dia.
 */
class FichaOficialCPT {
  static get modeloPadrao() { return '11wGNtV2E0O-PhSv6XOnVo5KPCB6GPi18rRKEYG6HN54'; }
  static get versaoModelo() { return 'CPT-1'; }
  static get empresa() { return 'Consórcio Performance Tamanduateí'; }
  static get limiteFotos() { return 12; }

  constructor(ctx) { this.ctx = ctx; this.ciclo = new CicloAtendimentoCPT(ctx); this.fuso = this.ciclo.fuso; }
  config() { return AplicacaoCPT.config(); }
  salvarConfig(c) { PropertiesService.getScriptProperties().setProperty(AplicacaoCPT.chave, JSON.stringify(c)); }
  static get nomeRaiz() { return 'CPT • Fichas oficiais da Sabesp'; }
  /** 2.38: pasta organizada (Casos, Versões anteriores, Pacotes). Guardada na configuração (pode ser movida no Drive). */
  pasta(sub) {
    if (!this._raiz) {
      const c = this.config(); let raiz = null;
      if (c.pastaFichasV2Id) { try { raiz = DriveApp.getFolderById(c.pastaFichasV2Id); } catch (_) {} }
      if (!raiz) { raiz = DriveApp.createFolder(FichaOficialCPT.nomeRaiz); c.pastaFichasV2Id = raiz.getId(); this.salvarConfig(c); }
      this._raiz = raiz; this._subs = {};
    }
    if (!sub) return this._raiz;
    return this._subs[sub] || (this._subs[sub] = FichaOficialCPT.subpasta(this._raiz, sub));
  }
  static subpasta(pai, nome) { const it = pai.getFoldersByName(nome); return it.hasNext() ? it.next() : pai.createFolder(nome); }
  /** Nome com o número curto do caso: "Caso 12 · ATD20260012". */
  nome(protocolo) { let caso = ''; try { caso = this.ciclo.dados.caso(protocolo); } catch (_) {} return (caso ? caso.replace('/', '-') + ' · ' : '') + protocolo; }
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
  modelo() { return this._modelo || (this._modelo = this.config().modeloFichaId || FichaOficialCPT.modeloPadrao); }

  /** Gera (ou reaproveita) a ficha de um protocolo. Retorna {documento, pdf, gerada}. */
  gerar(protocolo, forcar) {
    const {r} = this.ciclo.localizar(String(protocolo || '')), reg = this.registro(r), d = CicloAtendimentoCPT.json(r[19]), hash = this.hash(reg);
    if (!reg.nome || !reg.solicitacao) throw new Error('A ficha ' + reg.protocolo + ' precisa de nome e solicitação. Use Corrigir dados da ficha.');
    if (!forcar && d.fichaHash === hash && r[14] && r[15]) return {protocolo: reg.protocolo, documento: String(r[14]), pdf: String(r[15]), gerada: false};
    const nome = this.nome(reg.protocolo), casos = this.pasta('Casos');
    const copia = DriveApp.getFileById(this.modelo()).makeCopy(nome + ' · Ficha de Atendimento', casos);
    const doc = DocumentApp.openById(copia.getId());
    new DocumentoFichaCPT(doc, reg, this.fuso).preencher();
    doc.saveAndClose();
    const pdf = casos.createFile(copia.getAs(MimeType.PDF).setName(nome + ' · Ficha de Atendimento.pdf'));
    const docUrl = 'https://docs.google.com/document/d/' + copia.getId() + '/edit', pdfUrl = 'https://drive.google.com/file/d/' + pdf.getId() + '/view';
    // Grava só os links e o hash: não muda a versão do caso (ninguém perde o que está digitando).
    const lock = LockService.getScriptLock(); if (!lock.tryLock(20000)) throw new Error('A base está ocupada. A ficha foi criada e será vinculada na próxima tentativa.');
    let anteriores = [], eraNaPastaNova = false;
    try {
      const atual = this.ciclo.localizar(reg.protocolo), dd = CicloAtendimentoCPT.json(atual.r[19]);
      anteriores = [atual.r[14], atual.r[15]].map(u => (String(u).match(/\/d\/([A-Za-z0-9_-]{20,})/) || [])[1]).filter(Boolean);
      eraNaPastaNova = dd.fichaPasta === 'v2';
      dd.fichaHash = hash; dd.fichaGeradaEm = new Date().toISOString(); dd.fichaPasta = 'v2';
      atual.a.getRange(atual.linha, 15, 1, 2).setValues([[docUrl, pdfUrl]]);
      atual.a.getRange(atual.linha, 20).setValue(JSON.stringify(dd).slice(0, 49000));
      this.ciclo.aba('Movimentações').appendRow(['MOV-FICHA-' + hash.slice(0, 20), reg.protocolo, new Date(), 'Ficha oficial gerada', String(atual.r[3]), this.ctx.perfil.nome + ' <' + this.ctx.email + '>',
        'Documento e PDF no modelo oficial' + (reg.fotos.length ? ' · ' + Math.min(reg.fotos.length, FichaOficialCPT.limiteFotos) + ' foto(s)' : ''), 'Aplicação CPT', '', '{}']);
    } finally { lock.releaseLock(); }
    // Versão anterior que já estava na pasta nova vai para "Versões anteriores"; as da pasta antiga ficam onde estão
    // (a pasta antiga pode ser apagada inteira quando tudo estiver na nova).
    if (eraNaPastaNova) { const versoes = this.pasta('Versões anteriores'); anteriores.filter(id => id !== copia.getId() && id !== pdf.getId()).forEach(id => { try { DriveApp.getFileById(id).moveTo(versoes); } catch (_) {} }); }
    return {protocolo: reg.protocolo, documento: docUrl, pdf: pdfUrl, gerada: true};
  }

  // ---------------- 2.38: todas as fichas e o pacote do mês ----------------
  /** Casos principais com a situação da ficha: ok · gerar (falta ou mudou) · mover (em dia, mas fora da pasta nova) · corrigir (sem nome/solicitação). */
  carteira() {
    const D = this.ciclo.dados, a = D.atendimentos(), linhas = D.ler(a, 20);
    return linhas.map((r, i) => ({r, linha: i + 2})).filter(x => D.principal(x.r)).map(x => {
      const reg = this.registro(x.r), d = CicloAtendimentoCPT.json(x.r[19]), at = D.atendimento(x.r);
      // Ficha do sistema antigo (sem hash) de um caso que não mudou na aplicação: vale como está — é movida, não refeita.
      const legado = !d.fichaHash && x.r[14] && x.r[15] && FichaOficialCPT.intocado(d);
      const situacao = !reg.nome || !reg.solicitacao ? 'corrigir' : (d.fichaHash !== this.hash(reg) && !legado) || !x.r[14] || !x.r[15] ? 'gerar' : d.fichaPasta !== 'v2' ? 'mover' : 'ok';
      return {protocolo: reg.protocolo, caso: at.caso, abertura: at.abertura, conclusao: at.conclusao, concluido: at.concluido, nome: at.nome, assunto: at.assunto, status: at.status, area: at.area,
        situacao, documento: String(x.r[14] || ''), pdf: String(x.r[15] || ''), naAntiga: !!(x.r[14] || x.r[15]) && d.fichaPasta !== 'v2'};
    });
  }
  /** Caso migrado sem nenhuma ação feita na aplicação (execução, conclusão, correção, incorporação ou reabertura). */
  static intocado(d) { return !(d.execucoes || []).length && !d.conclusao && !d.corrigido && !(d.incorporados || []).length && !(d.reaberturas || []).length; }
  static idDe(url) { return (String(url || '').match(/\/d\/([A-Za-z0-9_-]{20,})/) || [])[1] || ''; }
  /** Ficha em dia, mas na pasta antiga: move o Docs e o PDF para Casos (com o número do caso no nome) e marca. */
  mover(c) {
    const casos = this.pasta('Casos'), nome = this.nome(c.protocolo);
    [[c.documento, nome + ' · Ficha de Atendimento'], [c.pdf, nome + ' · Ficha de Atendimento.pdf']].forEach(([u, n]) => { const id = FichaOficialCPT.idDe(u); if (!id) return; const f = DriveApp.getFileById(id); f.moveTo(casos); f.setName(n); });
    const lock = LockService.getScriptLock(); if (!lock.tryLock(20000)) throw new Error('A base está ocupada; tente de novo.');
    try { const atual = this.ciclo.localizar(c.protocolo), dd = CicloAtendimentoCPT.json(atual.r[19]); dd.fichaPasta = 'v2'; /* base para refazer quando mudar */ if (!dd.fichaHash) dd.fichaHash = this.hash(this.registro(atual.r)); atual.a.getRange(atual.linha, 20).setValue(JSON.stringify(dd).slice(0, 49000)); }
    finally { lock.releaseLock(); }
  }
  /** Põe em dia as fichas da lista (gera as que faltam/mudaram, move as da pasta antiga) até o prazo. */
  emDia(lista, prazo) {
    const out = {geradas: 0, movidas: 0, erros: [], faltam: 0};
    lista.filter(c => c.situacao === 'gerar' || c.situacao === 'mover').forEach(c => {
      if (Date.now() > prazo) { out.faltam++; return; }
      try { if (c.situacao === 'gerar') { c.pdf = this.gerar(c.protocolo, false).pdf; out.geradas++; } else { try { this.mover(c); out.movidas++; } catch (e) { if (/ocupada/.test(e.message)) throw e; c.pdf = this.gerar(c.protocolo, true).pdf; out.geradas++; } } c.situacao = 'ok'; c.naAntiga = false; }
      catch (e) { out.erros.push((c.caso || c.protocolo) + ': ' + e.message); }
    });
    if (out.geradas) CicloAtendimentoCPT.invalidar();
    return out;
  }
  static ordem(c) { return c.situacao === 'gerar' && !c.concluido ? 0 : c.situacao === 'mover' ? 1 : 2; }
  resumo(lista) {
    const n = s => lista.filter(c => c.situacao === s).length, c = this.config();
    return {total: lista.length, ok: n('ok'), gerar: n('gerar'), mover: n('mover'), corrigir: lista.filter(x => x.situacao === 'corrigir').slice(0, 30).map(x => ({caso: x.caso, protocolo: x.protocolo})),
      nCorrigir: n('corrigir'), naPastaAntiga: lista.filter(x => x.naAntiga).length, pasta: c.pastaFichasV2Id ? 'https://drive.google.com/drive/folders/' + c.pastaFichasV2Id : '', pastaAntiga: c.pastaFichasId ? 'https://drive.google.com/drive/folders/' + c.pastaFichasId : ''};
  }
  /** "Atualizar todas as fichas": abertos primeiro, depois as que só mudam de pasta, depois as concluídas. Continua de onde parou. */
  atualizarTodas(segundos) {
    return FichaOficialCPT.sozinho(segundos, () => {
      const lista = this.carteira().sort((a, b) => FichaOficialCPT.ordem(a) - FichaOficialCPT.ordem(b)), r = this.emDia(lista, Date.now() + segundos * 1000);
      return {...r, ...this.resumo(lista)};
    });
  }
  /** Um lote de fichas por vez (tela, pacote ou rotina): dois lotes juntos gerariam a mesma ficha duas vezes. Não usa a trava da base. */
  static sozinho(segundos, fn) {
    const cache = CacheService.getScriptCache(), chave = 'CPT_FICHAS_LOTE', ja = cache.get(chave);
    if (ja) throw new Error('As fichas já estão sendo atualizadas (desde ' + ja + '). Tente de novo em alguns minutos.');
    cache.put(chave, Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'HH:mm'), Math.min(21600, segundos + 120));
    try { return fn(); } finally { cache.remove(chave); }
  }
  /** Casos do pacote: abertos no mês, concluídos no mês e em andamento no fim do mês. */
  static doPacote(c, mes) {
    const fim = mes + '-31';
    return !!c.abertura && c.abertura <= fim && (c.abertura.startsWith(mes) || (c.concluido && c.conclusao.startsWith(mes)) || !c.concluido || c.conclusao > fim);
  }
  static grupo(c, mes) { return c.abertura.startsWith(mes) ? 'Aberto no mês' : c.concluido && c.conclusao.startsWith(mes) ? 'Concluído no mês' : 'Em andamento'; }
  /** Pacote do mês: pasta Pacotes/AAAA-MM com cópias dos PDFs (congeladas) e um índice em PDF. Refazer só troca o que mudou. */
  pacote(mes, segundos) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(mes || ''))) throw new Error('Escolha um mês válido.');
    return FichaOficialCPT.sozinho(segundos, () => this.montarPacote(mes, segundos));
  }
  montarPacote(mes, segundos) {
    const prazo = Date.now() + segundos * 1000, lista = this.carteira().filter(c => FichaOficialCPT.doPacote(c, mes));
    const conserto = this.emDia(lista, prazo - 60000);
    const pasta = FichaOficialCPT.subpasta(this.pasta('Pacotes'), mes), existentes = {};
    const it = pasta.getFiles(); while (it.hasNext()) { const f = it.next(); existentes[f.getName()] = f; }
    let substituidas = null; const tirar = f => { substituidas = substituidas || FichaOficialCPT.subpasta(pasta, 'Substituídas'); f.moveTo(substituidas); };
    let copiadas = 0, iguais = 0, semPdf = 0, faltam = 0;
    lista.forEach(c => {
      if (Date.now() > prazo) { faltam++; return; }
      const id = c.situacao === 'ok' ? FichaOficialCPT.idDe(c.pdf) : '';
      if (!id) { semPdf++; return; }
      const nome = this.nome(c.protocolo) + '.pdf', ja = existentes[nome];
      if (ja && ja.getDescription() === id) { iguais++; return; }
      if (ja) tirar(ja);
      DriveApp.getFileById(id).makeCopy(nome, pasta).setDescription(id); copiadas++;
    });
    const grupos = {'Aberto no mês': 0, 'Concluído no mês': 0, 'Em andamento': 0}; lista.forEach(c => grupos[FichaOficialCPT.grupo(c, mes)]++);
    const indiceNome = '00 · Índice do pacote ' + mes + '.pdf'; if (existentes[indiceNome]) tirar(existentes[indiceNome]);
    pasta.createFile(Utilities.newBlob(this.indiceHtml(lista, mes, grupos), 'text/html', indiceNome).getAs(MimeType.PDF).setName(indiceNome));
    return {mes, pasta: pasta.getUrl(), casos: lista.length, grupos, copiadas, iguais, pendentes: semPdf, faltam, geradas: conserto.geradas, movidas: conserto.movidas, erros: conserto.erros,
      completo: !semPdf && !faltam};
  }
  indiceHtml(lista, mes, grupos) {
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]), br = d => d ? d.split('-').reverse().join('/') : '—', n = (q, um, varios) => q + ' ' + (q === 1 ? um : varios);
    const nomeMes = DadosDaAplicacao.mesExtenso ? DadosDaAplicacao.mesExtenso(mes) : mes;
    const linhas = lista.slice().sort((a, b) => a.abertura.localeCompare(b.abertura) || a.protocolo.localeCompare(b.protocolo))
      .map(c => '<tr><td>' + esc(c.caso || '') + '</td><td>' + esc(c.protocolo) + '</td><td>' + esc(c.nome) + '</td><td>' + esc(c.assunto) + '</td><td>' + br(c.abertura) + '</td><td>' + (c.concluido ? br(c.conclusao) : '—') + '</td><td>' + esc(FichaOficialCPT.grupo(c, mes)) + '</td></tr>').join('');
    return '<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:10pt;color:#111}h1{font-size:15pt;margin:0 0 4px}p{margin:2px 0 10px;color:#444}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:4px 6px;text-align:left;vertical-align:top}th{background:#eef3f0}</style></head><body>' +
      '<h1>Fichas de atendimento · ' + esc(nomeMes) + '</h1><p>' + esc(FichaOficialCPT.empresa) + ' · ' + n(lista.length, 'caso', 'casos') + ': ' + n(grupos['Aberto no mês'], 'aberto', 'abertos') + ' no mês, ' + n(grupos['Concluído no mês'], 'concluído', 'concluídos') + ' no mês e ' + grupos['Em andamento'] + ' em andamento no fim do mês.</p>' +
      '<table><thead><tr><th>Caso</th><th>Protocolo</th><th>Munícipe</th><th>Assunto</th><th>Abertura</th><th>Conclusão</th><th>Situação no mês</th></tr></thead><tbody>' + linhas + '</tbody></table></body></html>';
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

function estadoFichasCPT() {
  return AplicacaoCPT.executar((d, ctx) => { if (!CicloAtendimentoCPT.podeConduzir(ctx.perfil)) throw new Error('As fichas oficiais ficam com Atendimento, Comunicação, Gestão e Administrativo.'); const f = new FichaOficialCPT(ctx); return {...f.resumo(f.carteira()), rotina: RotinaCPT.ultima()}; }, 'fichas.estado');
}
function atualizarFichasCPT() {
  return AplicacaoCPT.executar((d, ctx) => { if (!CicloAtendimentoCPT.podeConduzir(ctx.perfil)) throw new Error('As fichas oficiais ficam com Atendimento, Comunicação, Gestão e Administrativo.'); return new FichaOficialCPT(ctx).atualizarTodas(240); }, 'fichas.atualizarTodas');
}
function montarPacoteFichasCPT(p) {
  return AplicacaoCPT.executar((d, ctx) => { if (!CicloAtendimentoCPT.podeConduzir(ctx.perfil)) throw new Error('As fichas oficiais ficam com Atendimento, Comunicação, Gestão e Administrativo.'); return new FichaOficialCPT(ctx).pacote(String(p && p.mes || ''), 270); }, 'fichas.pacote');
}
function gerarFichaOficialCPT(p) {
  return AplicacaoCPT.executar((d, ctx) => {
    if (!CicloAtendimentoCPT.podeConduzir(ctx.perfil)) throw new Error('Seu perfil não gera a ficha oficial.');
    const r = new FichaOficialCPT(ctx).gerar(String((p && p.protocolo) || ''), !!(p && p.forcar)); CicloAtendimentoCPT.invalidar();
    return {...r, resultado: r.gerada ? 'Ficha oficial gerada.' : 'A ficha já estava atualizada.'};
  }, 'atendimentos.fichaOficial');
}

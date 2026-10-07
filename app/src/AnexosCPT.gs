/**
 * AnexosCPT 2.39.0. Planilha oficial "Anexos do relatório" (conector "anexos") mantida pela aplicação, sem mexer na formatação.
 * - Controle de manisfestações (grafia da planilha): os dados oficiais da ficha de cada caso principal, nas 10 colunas.
 *   · cada linha guarda o protocolo na nota da Data (CPT_ATD_ID=…); linhas antigas sem nota são reconhecidas pelo conteúdo
 *     (data, nome, endereço e histórico) e ganham a nota;
 *   · caso presente é atualizado no lugar; caso novo vai para o fim (com a formatação e as listas da linha de cima);
 *   · nenhuma linha é apagada nem reordenada; célula com fórmula não é tocada; Providência e Obs. escritas à mão não são
 *     trocadas por vazio; linhas que a aplicação não conhece (escritas à mão) ficam como estão.
 * - Indicadores 2026: só as linhas automáticas, na coluna do mês (linha 3: datas "mês.ano", ex. 10.26), com uma nota de fonte.
 *   O resto da aba é preenchido à mão. Escreve o mês atual e, até o dia 10, o anterior — nunca meses antes da ativação
 *   (anexosDesde, gravado na primeira atualização), para não trocar números já entregues. Rótulo da linha diferente do
 *   esperado → a linha é pulada e avisada (a planilha mudou de lugar).
 * - Matriz de Contatos: não é alterada aqui; só é contada (linha 15 dos Indicadores = contatos da Matriz).
 * Rotina das 12h/0h e botão "Atualizar agora" (Gestão e Administrativo). Conferir mostra tudo sem gravar.
 */
class AnexosCPT {
  static get abaControle() { return 'Controle de manisfestações'; }
  static get abaIndicadores() { return 'Indicadores 2026'; }
  static get chaveUltima() { return 'CPT_ANEXOS_ULTIMA'; }
  static get diaVirada() { return 10; }
  static pode(p) { return PerfisCPT.gerencia(p); }
  static norm(v) { return DadosDaAplicacao.norm(v); }
  /** Linhas automáticas dos Indicadores: [linha, conferência do rótulo (coluna B), chave do número, fonte]. */
  static get linhas() {
    return [
      [9, /abertas/, 'abertas', 'fichas abertas no mês'],
      [10, /^solicita/, 'solicitacao', 'fichas abertas no mês do tipo Solicitação'],
      [11, /^reclama/, 'reclamacao', 'fichas abertas no mês do tipo Reclamação'],
      [12, /^elogio/, 'elogio', 'fichas abertas no mês do tipo Elogio'],
      [13, /^conclu/, 'concluidas', 'fichas concluídas no mês'],
      [14, /nao procedente/, 'naoProcedente', 'fichas abertas no mês com procedência "Não procedente"'],
      [15, /parceiros/, 'parceiros', 'contatos cadastrados na Matriz de Contatos desta planilha'],
      [28, /participantes/, 'participantes', 'pessoas alcançadas nas ações socioambientais do mês (Visão do mês)'],
      [29, /total de acoes/, 'acoes', 'ações socioambientais do mês (Visão do mês)'],
      [31, /vistoria cautelar/, 'vistorias', 'registros "Acompanhamento de Vistoria Cautelar" do mês'],
      [32, /publicac/, 'publicacoes', 'Materiais concluídos no mês: publicações em rede social e na mídia'],
      [33, /ferramentas/, 'ferramentas', 'Materiais concluídos no mês: impresso, vídeo, arte e apresentação'],
      [34, /impress/, 'panfletos', 'panfletos entregues informados nos relatos do mês'],
      [43, /total de atendimentos/, 'tenda', 'pessoas alcançadas nas ações do mês com Tenda/UMS como ferramenta (relatos)']
    ];
  }

  constructor(ctx) { this.ctx = ctx; this.dados = new DadosDaAplicacao(ctx.base, ctx.perfil); this.fuso = 'America/Sao_Paulo'; }
  /** O arquivo antigo (Excel no Drive) foi trocado pela Planilha Google em 07/10/2026: se ainda estiver salvo, vale o novo. */
  static id() { const id = ConectoresCPT.id('anexos'); return id === '1Et4M0nr4CxlRj7J6EDoru91aC4PJ-G2Y' ? ConectoresCPT.item('anexos').padrao : id; }
  static links() {
    const b = 'https://docs.google.com/spreadsheets/d/' + AnexosCPT.id();
    return {planilha: b + '/edit', xlsx: b + '/export?format=xlsx'};
  }
  abrir() {
    try { return SpreadsheetApp.openById(AnexosCPT.id()); }
    catch (e) {
      let tipo = ''; try { tipo = DriveApp.getFileById(AnexosCPT.id()).getMimeType(); } catch (_) {}
      if (tipo && tipo !== MimeType.GOOGLE_SHEETS) throw new Error('A planilha dos Anexos está no Drive como Excel (.xlsx), e a aplicação só escreve em Planilha Google. Abra o arquivo no Drive → Arquivo → Salvar como Planilhas Google e informe o novo endereço em Conectores e pastas.');
      throw new Error('A planilha dos Anexos não abriu com a conta proprietária. Confira em Conectores e pastas.');
    }
  }
  static aba(ss, nome, teste) {
    const exata = ss.getSheetByName(nome); if (exata) return exata;
    const achada = ss.getSheets().find(a => teste(AnexosCPT.norm(a.getName())));
    if (!achada) throw new Error('A aba "' + nome + '" não foi encontrada na planilha dos Anexos. Nada foi alterado.');
    return achada;
  }

  // ---------------- Controle de manifestações ----------------
  static dia(v) {
    if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, 'America/Sao_Paulo', 'yyyy-MM-dd');
    const s = String(v == null ? '' : v).trim(), m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
    return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : 'texto:' + s;
  }
  static identidade(r) { return JSON.stringify([AnexosCPT.dia(r[0]), r[1], r[2], r[6]].map((x, i) => i ? AnexosCPT.norm(x) : x)); }
  static idNota(nota) { const m = String(nota || '').match(/(?:^|\n)CPT_ATD_ID=([^\n]+)/); return m ? decodeURIComponent(m[1]).trim() : ''; }
  static nota(nota, id) { return (String(nota || '').replace(/(?:^|\n)CPT_ATD_ID=[^\n]*/g, '').trim() + '\nCPT_ATD_ID=' + encodeURIComponent(id)).trim(); }
  static concluido(v) { return /^conclu/.test(AnexosCPT.norm(v)); }
  static valor(v) { return typeof v === 'string' && /^\s*[=+@-]/.test(v) ? "'" + v : v; }
  static igual(a, b) { return a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : String(a == null ? '' : a) === String(b == null ? '' : b); }
  /** Categoria da lista da planilha a partir do tipo, assunto e solicitação (mesma regra das Fichas Oficiais 3.2.1). */
  static tipo(reg) {
    const t = AnexosCPT.norm([reg.tipo, reg.assunto, reg.solicitacao].join(' '));
    if (/dano.*calcada|calcada.*dano|paviment|buraco/.test(t)) return 'Danos à calçada';
    if (/ligacao.*esgoto|esgoto.*ligacao/.test(t)) return 'Ligações de Esgoto';
    if (/limpeza.*via|sujeira.*via|residuo.*via/.test(t)) return 'Danos e limpeza da via';
    if (/dano.*edific|rachadura|trinca|portao|muro|fachada|imovel|vidro/.test(t)) return 'Danos à edificação';
    if (/dano.*veiculo|veiculo.*dano|carro.*danific|danific.*carro|moto.*danific/.test(t)) return 'Danos a veículos';
    if (/transtorno|acesso|barulho|poeira|odor|cheiro|alag|vazamento|esgoto|tapume/.test(t)) return 'Transtornos causados pela obra';
    if (/elogio/.test(t)) return 'Elogio';
    if (/reclam/.test(t)) return 'Reclamação';
    if (/solicit/.test(t)) return 'Solicitação';
    if (/inform|duvida|neutra|nao qualific/.test(t)) return 'Informação';
    return 'Outros';
  }
  /** Texto para o cliente: sem rótulos internos nem respostas vazias ("NI", "Não informado"). */
  static publico(v) {
    return String(v == null ? '' : v).split(/\n/).map(l => l.trim().replace(/^Canal(?:\s+interno)?:\s*.*?(?=Resultado:|$)/i, '').trim().replace(/^(Devolutiva ao cliente|Resultado|Comentário|Observação|Observações):\s*/i, ''))
      .filter(l => l && !/^(ni|n\/i|n[ãa]o informado[.!]?|nenhuma observa[çc][ãa]o(?: extra| adicional)?[.!]?|outro[.!]?)$/i.test(l)).join('\n');
  }
  /** Casos principais com nome, na ordem de abertura, já nas 10 colunas; e a leitura das fichas para os indicadores. */
  fichas() {
    if (this._fichas) return this._fichas;
    const D = this.dados, f = new FichaOficialCPT(this.ctx), a = D.atendimentos(), dia = v => v instanceof Date ? v.getTime() : 0;
    const linhas = D.ler(a, 20).filter(r => D.principal(r)).sort((x, y) => dia(x[4]) - dia(y[4]) || String(x[0]).localeCompare(String(y[0])));
    return this._fichas = linhas.map(r => {
      const reg = f.registro(r), j = CicloAtendimentoCPT.json(r[19]), c = CicloAtendimentoCPT.campos(j, r);
      const frente = String(r[9] || '').replace(/\s*\[OBR-\d+\]\s*$/, '').split(' — ')[0];
      return {id: String(r[0]), abertura: D.data(r[4]), conclusao: D.data(r[5]), concluido: D.encerrado(r), tipo: AnexosCPT.norm(c.tipo), procedencia: String(j.procedencia || ''),
        temNome: !!String(reg.nome || '').trim(),
        valores: [r[4] instanceof Date ? r[4] : reg.dataAbertura || '', reg.nome, reg.endereco, c.canal || 'Não informado', AnexosCPT.tipo(reg), frente, reg.solicitacao,
          AnexosCPT.publico(reg.solucao), reg.concluido ? 'Concluído' : 'Em andamento', AnexosCPT.publico(reg.finalizacao)].map(v => v == null ? '' : v)};
    });
  }
  /** Plano (sem gravar): o que atualiza e o que entra. Erro só quando a planilha está ambígua (duplicidade). */
  static planejar(linhas, notas, formulas, registros) {
    const porId = new Map(), porConteudo = new Map(), usadas = new Set(), atualizar = [], incluir = [], avisos = []; let iguais = 0;
    linhas.forEach((r, i) => {
      if (!r.some(v => v !== '' && v != null)) return;
      const id = AnexosCPT.idNota((notas[i] || [])[0]);
      if (id) { if (porId.has(id)) throw new Error('O protocolo ' + id + ' aparece em duas linhas do Controle. Confira a planilha; nada foi alterado.'); porId.set(id, i); }
      const k = AnexosCPT.identidade(r); if (!porConteudo.has(k)) porConteudo.set(k, []); porConteudo.get(k).push(i);
    });
    registros.forEach(x => {
      let i = porId.get(x.id);
      if (i === undefined) {
        const cands = (porConteudo.get(AnexosCPT.identidade(x.valores)) || []).filter(k => !usadas.has(k) && !AnexosCPT.idNota((notas[k] || [])[0]));
        if (cands.length > 1) throw new Error('Mais de uma linha do Controle corresponde ao protocolo ' + x.id + '. Confira a duplicidade; nada foi alterado.');
        if (cands.length === 1) i = cands[0];
      }
      if (i === undefined) { incluir.push(x); return; }
      usadas.add(i);
      const antiga = linhas[i], f = formulas[i] || [];
      if (AnexosCPT.concluido(antiga[8]) && !AnexosCPT.concluido(x.valores[8])) avisos.push('O caso ' + x.id + ' foi reaberto: na planilha volta para "Em andamento" (a linha continua no lugar).');
      const novos = x.valores.map((v, j) => f[j] ? antiga[j] : ([7, 9].includes(j) && !String(v).trim() && String(antiga[j] || '').trim()) ? antiga[j] : v);
      const muda = novos.some((v, j) => !f[j] && !AnexosCPT.igual(v, antiga[j]) && !AnexosCPT.igual(AnexosCPT.valor(v), antiga[j]));
      const notaMuda = AnexosCPT.idNota((notas[i] || [])[0]) !== x.id;
      if (muda || notaMuda) atualizar.push({indice: i, id: x.id, valores: novos, nota: AnexosCPT.nota((notas[i] || [])[0], x.id), muda, notaMuda}); else iguais++;
    });
    return {atualizar, incluir, iguais, avisos};
  }
  lerControle(ss) {
    const aba = AnexosCPT.aba(ss, AnexosCPT.abaControle, n => n.includes('controle') && /manis?fest/.test(n)), ult = Math.max(1, aba.getLastRow()), faixa = aba.getRange(1, 1, ult, 10);
    const valores = faixa.getValues(), notas = faixa.getNotes(), formulas = faixa.getFormulas();
    const cab = valores.slice(0, 15).findIndex(r => { const c = r.map(AnexosCPT.norm); return c.includes('data') && c.includes('nome') && c.includes('status'); });
    if (cab < 0) throw new Error('O cabeçalho do Controle de manifestações (Data, Nome, Status) não foi encontrado. Nada foi alterado.');
    let ultima = cab + 1; valores.forEach((r, i) => { if (i > cab && r.some(v => v !== '' && v != null)) ultima = i + 1; });
    return {aba, cab, ultima, corpo: valores.slice(cab + 1), notas: notas.slice(cab + 1), formulas: formulas.slice(cab + 1)};
  }
  controle(ss, gravar) {
    const l = this.lerControle(ss), casos = this.fichas().filter(x => x.temNome), plano = AnexosCPT.planejar(l.corpo, l.notas, l.formulas, casos), a = l.aba, primeira = l.cab + 2;
    if (gravar) {
      plano.atualizar.forEach(u => {
        const linha = primeira + u.indice;
        if (u.muda) a.getRange(linha, 1, 1, 10).setValues([u.valores.map((v, j) => l.formulas[u.indice][j] || AnexosCPT.valor(v))]);
        if (u.notaMuda) a.getRange(linha, 1).setNote(u.nota);
      });
      if (plano.incluir.length) {
        const ini = l.ultima + 1, n = plano.incluir.length;
        if (a.getMaxRows() < ini + n - 1) a.insertRowsAfter(a.getMaxRows(), ini + n - 1 - a.getMaxRows());
        const destino = a.getRange(ini, 1, n, 10);
        if (l.ultima > l.cab + 1) { const modelo = a.getRange(l.ultima, 1, 1, 10); modelo.copyTo(destino, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false); modelo.copyTo(destino, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false); }
        destino.setValues(plano.incluir.map(x => x.valores.map(AnexosCPT.valor)));
        destino.offset(0, 0, n, 1).setNotes(plano.incluir.map(x => [AnexosCPT.nota('', x.id)]));
      }
    }
    return {casos: casos.length, semNome: this.fichas().length - casos.length, linhas: l.ultima - l.cab - 1 + (gravar ? plano.incluir.length : 0),
      novos: plano.incluir.map(x => x.id), atualizados: plano.atualizar.filter(x => x.muda).map(x => x.id), marcados: plano.atualizar.filter(x => !x.muda).length, iguais: plano.iguais, avisos: plano.avisos};
  }

  // ---------------- Indicadores 2026 ----------------
  /** Mês de uma célula da linha 3. A planilha mostra "mês.ano" (10.26 = outubro de 2026): o valor é uma data cujo DIA é o ano
   * com dois dígitos (ex.: 26/10/2026 → outubro de 2026; 25/08/2026 → agosto de 2025). Também aceita o texto "10.26". */
  static mesDaCelula(v, fuso) {
    if (v instanceof Date && !isNaN(v)) { const s = Utilities.formatDate(v, fuso, 'MM-dd'); return '20' + s.slice(3, 5) + '-' + s.slice(0, 2); }
    const m = String(v == null ? '' : v).trim().match(/^(\d{1,2})[./-](\d{2})$/); return m ? '20' + m[2] + '-' + m[1].padStart(2, '0') : '';
  }
  /** Coluna (1-based) do mês na linha 3; 0 se não houver. */
  static colunaDoMes(cab, mes, fuso) { const i = cab.findIndex(v => AnexosCPT.mesDaCelula(v, fuso) === mes); return i < 0 ? 0 : i + 1; }
  /** Meses que a aplicação escreve hoje: o atual e, até o dia 10, o anterior; nunca antes da ativação. */
  static mesesParaGravar(hoje, desde) {
    const atual = hoje.slice(0, 7), out = Number(hoje.slice(8, 10)) <= AnexosCPT.diaVirada ? [DadosDaAplicacao.mesAnterior(atual), atual] : [atual];
    return out.filter(m => !desde || m >= desde);
  }
  numeros(mes) {
    const D = this.dados, fichas = this.fichas(), N = AnexosCPT.norm, abertas = fichas.filter(x => x.abertura.startsWith(mes));
    const ini = D.inicio(mes, false).indicadores, reg = D.registros(), linhas = D.ler(reg, 4);
    const mat = MateriaisCPT.resumo(new ColecaoCPT(this.ctx, 'Materiais', 'MAT').itens(), mes);
    const relatos = PaineisGestaoCPT.relatosDoMes(D, this.ctx, mes).itens;
    return {abertas: abertas.length, solicitacao: abertas.filter(x => x.tipo.startsWith('solicit')).length, reclamacao: abertas.filter(x => x.tipo.startsWith('reclam')).length,
      elogio: abertas.filter(x => x.tipo.startsWith('elogio')).length, concluidas: fichas.filter(x => x.concluido && x.conclusao.startsWith(mes)).length,
      naoProcedente: abertas.filter(x => N(x.procedencia) === 'nao procedente').length, participantes: ini.pessoas, acoes: ini.acoes,
      vistorias: linhas.filter(r => r[0] && D.mesCelula(r[3]) === mes && /vistoria cautelar/.test(N(r[1]))).length,
      publicacoes: mat.publicacoes, ferramentas: mat.ferramentas, panfletos: relatos.reduce((s, r) => s + (r.panfletos || 0), 0),
      // Atendimento em tenda/UMS: cada ação que usou a tenda como ferramenta conta as pessoas daquele dia.
      tenda: relatos.filter(r => /tenda|\bums\b|unidade movel/.test(N(r.ferramenta + ' ' + r.atividade))).reduce((s, r) => s + (r.publico || 0), 0),
      parceiros: this.contatosDaMatriz()};
  }
  /** Contatos da Matriz (só leitura): linhas abaixo de um cabeçalho "PESSOA DE CONTATO" com ao menos dois campos preenchidos;
   *  títulos de seção (um campo só) e os próprios cabeçalhos não contam. */
  static contarMatriz(valores) {
    let dentro = false, n = 0;
    valores.forEach(r => {
      const cel = r.slice(1, 8).map(v => String(v == null ? '' : v).trim()), cheios = cel.filter(Boolean).length;
      if (/pessoa de contato/.test(AnexosCPT.norm(cel[1]))) { dentro = true; return; }
      if (dentro && cheios >= 2) n++;
    });
    return n;
  }
  contatosDaMatriz() {
    if (this._matriz != null) return this._matriz;
    const a = AnexosCPT.aba(this._ss, 'Matriz de Contatos', n => n.includes('matriz') && n.includes('contato')), ult = a.getLastRow();
    return this._matriz = ult ? AnexosCPT.contarMatriz(a.getRange(1, 1, ult, 8).getValues()) : 0;
  }
  static notaFonte(fonte) { return 'CPT: automático · Fonte: ' + fonte + '. Preenchido pela Aplicação CPT (não editar à mão: a próxima atualização sobrescreve).'; }
  indicadores(ss, meses, gravar) {
    const a = AnexosCPT.aba(ss, AnexosCPT.abaIndicadores, n => n.startsWith('indicadores')), larg = Math.max(3, a.getLastColumn()), cab = a.getRange(3, 1, 1, larg).getValues()[0];
    const textos = a.getRange(1, 2, 45, 1).getValues().map(r => String(r[0] == null ? '' : r[0]).trim()), rotulos = textos.map(AnexosCPT.norm), out = [];
    meses.forEach(mes => {
      const col = AnexosCPT.colunaDoMes(cab, mes, ss.getSpreadsheetTimeZone ? ss.getSpreadsheetTimeZone() : this.fuso);
      if (!col) { out.push({mes, erro: 'A coluna de ' + DadosDaAplicacao.mesExtenso(mes) + ' não foi encontrada na linha 3 dos Indicadores.', linhas: []}); return; }
      const faixa = a.getRange(1, col, 45, 1), atuais = faixa.getValues(), formulas = faixa.getFormulas(), notas = faixa.getNotes(), n = this.numeros(mes), linhas = [];
      AnexosCPT.linhas.forEach(([linha, rotulo, chave, fonte]) => {
        const item = {linha, rotulo: textos[linha - 1] || '', valor: n[chave], atual: atuais[linha - 1][0], fonte};
        if (!rotulo.test(rotulos[linha - 1] || '')) { item.situacao = 'pulada'; item.aviso = 'Rótulo diferente do esperado na linha ' + linha + ': a planilha mudou? Nada foi escrito nela.'; }
        else if (formulas[linha - 1][0]) { item.situacao = 'formula'; item.aviso = 'A célula tem fórmula; não foi alterada.'; }
        else {
          const igual = String(item.atual) === String(item.valor), nota = AnexosCPT.notaFonte(fonte), notaIgual = String(notas[linha - 1][0] || '') === nota;
          item.situacao = igual && notaIgual ? 'igual' : 'muda';
          if (gravar && !igual) a.getRange(linha, col).setValue(item.valor);
          if (gravar && !notaIgual) a.getRange(linha, col).setNote(nota);
        }
        linhas.push(item);
      });
      out.push({mes, coluna: col, linhas});
    });
    return out;
  }

  // ---------------- Conferir / atualizar ----------------
  rodar(gravar) {
    const c = AplicacaoCPT.config(), hoje = Utilities.formatDate(new Date(), this.fuso, 'yyyy-MM-dd');
    const desde = c.anexosDesde || hoje.slice(0, 7), ss = this._ss = this.abrir(), meses = AnexosCPT.mesesParaGravar(hoje, desde);
    const r = {em: new Date().toISOString(), gravado: !!gravar, desde, controle: this.controle(ss, gravar), indicadores: this.indicadores(ss, meses, gravar), links: AnexosCPT.links()};
    if (gravar) {
      // Ativação: a primeira gravação que deu certo marca o mês; meses anteriores nunca são escritos.
      if (!c.anexosDesde) { const atual = AplicacaoCPT.config(); atual.anexosDesde = desde; PropertiesService.getScriptProperties().setProperty(AplicacaoCPT.chave, JSON.stringify(atual)); }
      PropertiesService.getScriptProperties().setProperty(AnexosCPT.chaveUltima, JSON.stringify(AnexosCPT.resumir(r)));
    }
    return r;
  }
  /** Resumo curto (guardado e mostrado na rotina). */
  static resumir(r) {
    const ind = r.indicadores.map(m => ({mes: m.mes, erro: m.erro || '', mudaram: m.linhas.filter(x => x.situacao === 'muda').length, puladas: m.linhas.filter(x => x.situacao === 'pulada' || x.situacao === 'formula').length}));
    return {em: r.em, novos: r.controle.novos.length, atualizados: r.controle.atualizados.length, avisos: r.controle.avisos.length, indicadores: ind};
  }
  static texto(s) {
    return s.novos + ' caso(s) novo(s), ' + s.atualizados + ' atualizado(s) no Controle; Indicadores: ' + s.indicadores.map(m => m.erro ? m.mes + ' sem coluna' : m.mes + ' ' + m.mudaram + ' linha(s)').join(', ') + (s.avisos ? '; ' + s.avisos + ' aviso(s)' : '');
  }
  static ultima() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(AnexosCPT.chaveUltima) || 'null'); } catch (_) { return null; } }
  /** Uma atualização por vez (tela ou rotina). */
  static sozinho(fn) {
    const cache = CacheService.getScriptCache(), chave = 'CPT_ANEXOS_LOTE', ja = cache.get(chave);
    if (ja) throw new Error('Os Anexos já estão sendo atualizados (desde ' + ja + '). Tente de novo em alguns minutos.');
    cache.put(chave, Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'HH:mm'), 600);
    try { return fn(); } finally { cache.remove(chave); }
  }
}

function conferirAnexosCPT() {
  return AplicacaoCPT.executar((d, ctx) => { if (!AnexosCPT.pode(ctx.perfil)) throw new Error('Os Anexos do relatório ficam com a Gestão e o Administrativo.'); return {...new AnexosCPT(ctx).rodar(false), ultima: AnexosCPT.ultima()}; }, 'anexos.conferir');
}
function atualizarAnexosCPT() {
  return AplicacaoCPT.executar((d, ctx) => {
    if (!AnexosCPT.pode(ctx.perfil)) throw new Error('Os Anexos do relatório ficam com a Gestão e o Administrativo.');
    return AnexosCPT.sozinho(() => ({...new AnexosCPT(ctx).rodar(true), ultima: AnexosCPT.ultima()}));
  }, 'anexos.atualizar');
}

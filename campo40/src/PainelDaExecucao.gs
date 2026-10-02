/**
 * PainelDaExecucao — 1.1.0 — PERMANENTE.
 * Aba "CPT • Painel da Execução" na planilha compartilhada com a engenharia (Concrejato): é o que o cliente vê.
 * - Faixa de título, quatro indicadores, e três quadros: com a Execução (mais antigas primeiro),
 *   aguardando o Atendimento e concluídas nos últimos 30 dias.
 * - Situação com cor: Recebida = vermelho, Em andamento = amarelo, Concluída = verde.
 *   Dias em aberto: até 29 verde, 30 a 59 amarelo, 60 ou mais vermelho.
 * - Montada de uma vez (valores, cores e mesclagens em lote) e refeita só quando o conteúdo muda.
 * - Gerada pela Base: protegida com aviso; edições manuais são substituídas.
 * - 1.1: coluna "Ficha oficial" com links Ver · Baixar do PDF, e aba "CPT • Fichas oficiais" com todos os casos
 *   (substitui a aba antiga "Fichas Oficiais", que não atualiza mais). O PDF continua no Drive do CPT:
 *   a engenharia precisa ter acesso de Leitor à pasta dos PDFs.
 */
class PainelDaExecucao {
  static get NOME() { return 'CPT • Painel da Execução'; }
  static get COLUNAS() { return 11; }
  static get LARGURAS() { return [112, 92, 62, 116, 240, 210, 170, 120, 270, 150, 116]; }
  static get COR() {
    return {marinho: '#0F3D5E', marinhoTexto: '#C9DCEA', tinta: '#1F2933', cinza: '#6B7785', linha: '#D9E2EA', faixa: '#F6F8FA', cartao: '#F1F5F8',
      vermelho: ['#FDE4E2', '#A3221B'], amarelo: ['#FFF2C2', '#7A5600'], verde: ['#DCF3E4', '#1D6B3C']};
  }
  static situacao(status) { const n = String(status || '').toLowerCase(); return /conclu/.test(n) ? 'verde' : /receb/.test(n) ? 'vermelho' : 'amarelo'; }
  static faixaDias(d) { return d === '' || d == null ? null : d >= 60 ? 'vermelho' : d >= 30 ? 'amarelo' : 'verde'; }
  static get NOME_FICHAS() { return 'CPT • Fichas oficiais'; }
  static get LARGURAS_FICHAS() { return [112, 92, 116, 92, 190, 260, 210, 150, 116]; }
  /** Links do PDF da ficha (id do arquivo no Drive): ver no navegador e baixar. */
  static linksFicha(pdf) {
    return pdf ? [{texto: 'Ver', url: 'https://drive.google.com/file/d/' + pdf + '/view'}, {texto: 'Baixar', url: 'https://drive.google.com/uc?export=download&id=' + pdf}] : null;
  }
  /** Célula da ficha: "Ver · Baixar" com links, ou aviso cinza quando o PDF ainda não foi gerado. */
  static celulaFicha(r, c, pdf) {
    const ln = this.linksFicha(pdf);
    if (ln) { r.ln[c] = ln; r.v[c] = ln.map(x => x.texto).join(' · '); r.fc[c] = '#1A5FB4'; r.fw[c] = 'bold'; }
    else { r.v[c] = 'não gerada'; r.fc[c] = this.COR.cinza; r.it[c] = 'italic'; }
    r.ha[c] = 'center';
  }
  static limpo(v) { const t = String(v == null ? '' : v).trim(); return !t || /^n[ãa]o (fornecido|informado)\.?$/i.test(t) ? '—' : t; }

  /** Modelo da aba: linhas com valores e estilos por célula, mesclagens e alturas. Sem chamadas ao Google (testável). */
  static montar(casos, agora, fuso) {
    const C = this.COR, N = this.COLUNAS, linhas = [], mesclas = [], bordas = [], cartoes = [];
    const data = d => d ? Utilities.formatDate(d instanceof Date ? d : new Date(d), fuso, 'dd/MM/yyyy') : '—';
    const nova = (altura, base) => { const l = {altura, v: Array(N).fill(''), bg: Array(N).fill(base.bg || '#FFFFFF'), fc: Array(N).fill(base.fc || C.tinta), fw: Array(N).fill(base.fw || 'normal'),
      fs: Array(N).fill(base.fs || 10), ha: Array(N).fill(base.ha || 'left'), it: Array(N).fill('normal'), wrap: Array(N).fill(!!base.wrap), ln: Array(N).fill(null)}; linhas.push(l); return l; };
    const mescla = (l, c1, c2) => mesclas.push([linhas.indexOf(l) + 1, c1 + 1, 1, c2 - c1 + 1]);
    const exec = casos.abertos.filter(x => x.area === 'Execução'), atend = casos.abertos.filter(x => x.area !== 'Execução');
    const porIdade = (a, b) => (a.abertura || 0) - (b.abertura || 0);

    let l = nova(46, {bg: C.marinho, fc: '#FFFFFF', fw: 'bold', fs: 18}); l.v[0] = '  Painel de Atendimentos · Execução'; mescla(l, 0, N - 1);
    l = nova(24, {bg: C.marinho, fc: C.marinhoTexto, fs: 10}); mescla(l, 0, N - 1);
    l.v[0] = '  Consórcio Performance Tamanduateí · atualizado em ' + Utilities.formatDate(agora, fuso, "dd/MM/yyyy 'às' HH:mm") + ' · aba gerada automaticamente: não edite';
    nova(14, {});
    // Indicadores: rótulo, número, nota.
    const kpis = [[0, 1, 'COM A EXECUÇÃO', exec.length, 'aguardando providência', C.marinho], [2, 3, 'HÁ 30 DIAS OU MAIS', exec.filter(x => x.dias >= 30).length, 'com a Execução', C.vermelho[1]],
      [4, 4, 'AGUARDANDO O ATENDIMENTO', atend.length, 'contato ou conferência', C.amarelo[1]], [5, 5, 'CONCLUÍDAS EM 30 DIAS', casos.concluidas.length, 'encerradas pelo Atendimento', C.verde[1]]];
    const k1 = nova(22, {}), k2 = nova(40, {}), k3 = nova(22, {});
    kpis.forEach(([a, b, rot, num, nota, cor]) => {
      for (let c = a; c <= b; c++) { [k1, k2, k3].forEach(k => { k.bg[c] = C.cartao; }); }
      k1.v[a] = '  ' + rot; k1.fc[a] = C.cinza; k1.fw[a] = 'bold'; k1.fs[a] = 8;
      k2.v[a] = '  ' + num; k2.fc[a] = cor; k2.fw[a] = 'bold'; k2.fs[a] = 24;
      k3.v[a] = '  ' + nota; k3.fc[a] = C.cinza; k3.fs[a] = 9;
      if (b > a) [k1, k2, k3].forEach(k => mescla(k, a, b));
      cartoes.push([linhas.indexOf(k1) + 1, a + 1, 3, b - a + 1]);
    });
    k1.v[7] = 'Como ler'; k1.fw[7] = 'bold'; k1.fc[7] = C.marinho; k1.fs[7] = 9; mescla(k1, 7, 10);
    k2.v[7] = 'Responda pelo formulário de Execução, escolhendo o protocolo na lista. Situação: vermelho = recebida, aguardando a primeira providência; amarelo = em andamento; verde = concluída. Ficha oficial: Ver abre o PDF, Baixar salva. Todas as fichas estão na aba "' + this.NOME_FICHAS + '".';
    k2.fc[7] = C.cinza; k2.fs[7] = 9; k2.wrap[7] = true; mesclas.push([linhas.indexOf(k2) + 1, 8, 2, 4]);
    nova(16, {});

    const tabela = (titulo, subtitulo, cab, itens, celulas, vazio, encerradas) => {
      let t = nova(30, {fc: C.marinho, fw: 'bold', fs: 12}); t.v[0] = titulo; t.v[5] = subtitulo; t.fw[5] = 'normal'; t.fs[5] = 9; t.fc[5] = C.cinza; t.ha[5] = 'right';
      mescla(t, 0, 4); mescla(t, 5, N - 1);
      const h = nova(28, {bg: C.marinho, fc: '#FFFFFF', fw: 'bold', fs: 9, ha: 'center'}); cab.forEach((x, i) => { h.v[i] = x; });
      const inicio = linhas.length;
      if (!itens.length) { const e = nova(30, {fc: C.cinza, ha: 'center'}); e.v[0] = vazio; e.it.fill('italic'); mescla(e, 0, N - 1); }
      itens.forEach((x, i) => {
        const r = nova(34, {bg: i % 2 ? C.faixa : '#FFFFFF', wrap: true}); celulas(x).forEach((v, c) => { r.v[c] = v; });
        r.fw[0] = 'bold'; r.fc[0] = C.marinho; [1, 2, 3].forEach(c => { r.ha[c] = 'center'; });
        const s = C[encerradas ? 'verde' : this.situacao(x.status)]; r.bg[3] = s[0]; r.fc[3] = s[1]; r.fw[3] = 'bold';
        const fd = this.faixaDias(x.dias); if (fd && !encerradas) { r.bg[2] = C[fd][0]; r.fc[2] = C[fd][1]; r.fw[2] = 'bold'; }
        this.celulaFicha(r, N - 1, x.pdf);
      });
      bordas.push([inicio, linhas.length - inicio + 1]);
      nova(18, {});
    };
    const aberta = x => [x.protocolo, data(x.abertura), x.dias === '' ? '—' : x.dias, x.status || 'Recebida', this.limpo(x.proxima), this.limpo(x.assunto), this.limpo(x.nome), this.limpo(x.telefone), this.limpo(x.endereco), this.limpo(x.frente)];
    const cabAberta = ['Protocolo', 'Aberta em', 'Dias', 'Situação', 'Próxima ação', 'Assunto', 'Morador', 'Telefone', 'Endereço', 'Frente de obra', 'Ficha oficial'];
    tabela('Com a Execução', 'das mais antigas para as mais novas', cabAberta, exec.slice().sort(porIdade), aberta, 'Nenhuma ordem com a Execução no momento.');
    tabela('Aguardando o Atendimento', 'retorno ao morador, complemento de informação ou conferência', cabAberta, atend.slice().sort(porIdade), aberta, 'Nada aguardando o Atendimento.');
    tabela('Concluídas nos últimos 30 dias', 'para conferência; não precisam de resposta', ['Protocolo', 'Aberta em', 'Dias', 'Situação', 'Concluída em', 'Assunto', 'Morador', '', 'Endereço', 'Frente de obra', 'Ficha oficial'],
      casos.concluidas.slice().sort((a, b) => (b.conclusao || 0) - (a.conclusao || 0)),
      x => [x.protocolo, data(x.abertura), x.dias === '' ? '—' : x.dias, 'Concluída', data(x.conclusao), this.limpo(x.assunto), this.limpo(x.nome), '', this.limpo(x.endereco), this.limpo(x.frente)], 'Nenhuma conclusão nos últimos 30 dias.', true);
    l = nova(24, {fc: C.cinza, fs: 9}); l.v[0] = 'Dúvidas sobre um caso: fale com o Atendimento do CPT. Telefones e endereços são de uso exclusivo para a execução do serviço.'; l.it.fill('italic'); mescla(l, 0, N - 1);
    return this.fechar({linhas, mesclas, bordas, cartoes, colunas: N, larguras: this.LARGURAS});
  }
  /** Textos que começam com =, +, - ou @ não viram fórmula. */
  static fechar(modelo) {
    modelo.linhas.forEach(r => { r.v = r.v.map(v => typeof v === 'string' && /^[=+@-]/.test(v) ? "'" + v : v); });
    return modelo;
  }

  /** Aba "CPT • Fichas oficiais": todos os casos principais, dos mais novos para os mais antigos, com o PDF da ficha. */
  static montarFichas(casos, agora, fuso) {
    const C = this.COR, N = this.LARGURAS_FICHAS.length, linhas = [], mesclas = [], bordas = [];
    const data = d => d ? Utilities.formatDate(d instanceof Date ? d : new Date(d), fuso, 'dd/MM/yyyy') : '—';
    const nova = (altura, base) => { const l = {altura, v: Array(N).fill(''), bg: Array(N).fill(base.bg || '#FFFFFF'), fc: Array(N).fill(base.fc || C.tinta), fw: Array(N).fill(base.fw || 'normal'),
      fs: Array(N).fill(base.fs || 10), ha: Array(N).fill(base.ha || 'left'), it: Array(N).fill('normal'), wrap: Array(N).fill(!!base.wrap), ln: Array(N).fill(null)}; linhas.push(l); return l; };
    const mescla = (l, c1, c2) => mesclas.push([linhas.indexOf(l) + 1, c1 + 1, 1, c2 - c1 + 1]);
    const todos = (casos.todos || []).slice().sort((a, b) => b.protocolo.localeCompare(a.protocolo, undefined, {numeric: true}));
    const comPdf = todos.filter(x => x.pdf).length;
    let l = nova(46, {bg: C.marinho, fc: '#FFFFFF', fw: 'bold', fs: 18}); l.v[0] = '  Fichas oficiais de atendimento'; mescla(l, 0, N - 1);
    l = nova(24, {bg: C.marinho, fc: C.marinhoTexto, fs: 10}); mescla(l, 0, N - 1);
    l.v[0] = '  ' + comPdf + ' de ' + todos.length + ' ficha(s) com PDF · atualizado em ' + Utilities.formatDate(agora, fuso, "dd/MM/yyyy 'às' HH:mm") + ' · aba gerada automaticamente: não edite';
    l = nova(34, {fc: C.cinza, fs: 9, wrap: true}); mescla(l, 0, N - 1);
    l.v[0] = 'Ver abre o PDF no navegador; Baixar salva o arquivo. Use Ctrl+F para achar um protocolo ou morador. "não gerada": o Atendimento ainda não gerou a ficha no modelo oficial; peça pelo Atendimento do CPT.';
    const h = nova(28, {bg: C.marinho, fc: '#FFFFFF', fw: 'bold', fs: 9, ha: 'center'});
    ['Protocolo', 'Aberta em', 'Situação', 'Concluída em', 'Morador', 'Endereço', 'Assunto', 'Frente de obra', 'Ficha oficial'].forEach((x, i) => { h.v[i] = x; });
    const inicio = linhas.length;
    if (!todos.length) { const e = nova(30, {fc: C.cinza, ha: 'center'}); e.v[0] = 'Nenhum caso na Base.'; e.it.fill('italic'); mescla(e, 0, N - 1); }
    todos.forEach((x, i) => {
      const r = nova(30, {bg: i % 2 ? C.faixa : '#FFFFFF', wrap: true});
      [x.protocolo, data(x.abertura), x.concluida ? 'Concluída' : (x.status || 'Recebida'), x.concluida ? data(x.conclusao) : '—', this.limpo(x.nome), this.limpo(x.endereco), this.limpo(x.assunto), this.limpo(x.frente)]
        .forEach((v, c) => { r.v[c] = v; });
      r.fw[0] = 'bold'; r.fc[0] = C.marinho; [1, 2, 3].forEach(c => { r.ha[c] = 'center'; });
      const s = C[x.concluida ? 'verde' : this.situacao(x.status)]; r.bg[2] = s[0]; r.fc[2] = s[1]; r.fw[2] = 'bold';
      this.celulaFicha(r, N - 1, x.pdf);
    });
    bordas.push([inicio, linhas.length - inicio + 1]);
    return this.fechar({linhas, mesclas, bordas, cartoes: [], colunas: N, larguras: this.LARGURAS_FICHAS, congelar: 4});
  }

  /** Desenha a aba (cria, renomeia a antiga "Ordens em aberto" ou reaproveita). Retorna a aba. */
  static desenhar(planilha, modelo, nome) {
    const C = this.COR, N = modelo.colunas || this.COLUNAS, n = modelo.linhas.length, alvo = nome || this.NOME;
    let aba = planilha.getSheetByName(alvo);
    if (!aba) {
      const antiga = alvo === this.NOME ? planilha.getSheetByName('CPT • Ordens em aberto') : null;
      aba = antiga ? antiga.setName(alvo) : planilha.insertSheet(alvo);
      try { aba.protect().setWarningOnly(true).setDescription('Gerada pela Base CPT. Alterações aqui são substituídas.'); } catch (_) {}
    }
    if (aba.getMaxRows() < n) aba.insertRowsAfter(aba.getMaxRows(), n - aba.getMaxRows());
    if (aba.getMaxColumns() < N) aba.insertColumnsAfter(aba.getMaxColumns(), N - aba.getMaxColumns());
    const tudo = aba.getRange(1, 1, aba.getMaxRows(), aba.getMaxColumns());
    tudo.breakApart(); tudo.clear(); aba.setFrozenRows(0);
    const r = aba.getRange(1, 1, n, N), col = k => modelo.linhas.map(l => l[k]);
    r.setNumberFormat('@').setValues(col('v')).setBackgrounds(col('bg')).setFontColors(col('fc')).setFontWeights(col('fw')).setFontSizes(col('fs'))
      .setHorizontalAlignments(col('ha')).setFontStyles(col('it')).setWraps(col('wrap')).setFontFamily('Arial').setVerticalAlignment('middle');
    this.links(aba, modelo);
    modelo.mesclas.forEach(([a, b, c, d]) => aba.getRange(a, b, c, d).merge());
    modelo.bordas.forEach(([inicio, qtd]) => aba.getRange(inicio, 1, qtd, N).setBorder(true, true, true, true, true, true, C.linha, SpreadsheetApp.BorderStyle.SOLID));
    // Indicadores separados por uma moldura branca grossa.
    (modelo.cartoes || []).forEach(([a, b, c, d]) => aba.getRange(a, b, c, d).setBorder(true, true, true, true, null, null, '#FFFFFF', SpreadsheetApp.BorderStyle.SOLID_THICK));
    modelo.linhas.forEach((l, i) => aba.setRowHeight(i + 1, l.altura));
    (modelo.larguras || this.LARGURAS).forEach((w, i) => aba.setColumnWidth(i + 1, w));
    if (aba.getMaxColumns() > N) aba.hideColumns(N + 1, aba.getMaxColumns() - N);
    aba.setFrozenRows(modelo.congelar || 2); aba.setHiddenGridlines(true); aba.setTabColor(C.marinho);
    return aba;
  }

  /** Colunas com links (Ver · Baixar): texto rico em uma chamada por coluna, mantendo a fonte da célula. */
  static links(aba, modelo) {
    const N = modelo.colunas || this.COLUNAS, estilos = {};
    const estilo = (fc, fs, negrito, sublinhado) => {
      const k = [fc, fs, negrito, sublinhado].join('|');
      return estilos[k] || (estilos[k] = SpreadsheetApp.newTextStyle().setFontFamily('Arial').setFontSize(fs).setBold(negrito).setUnderline(sublinhado).setForegroundColor(fc).build());
    };
    for (let c = 0; c < N; c++) {
      if (!modelo.linhas.some(l => l.ln && l.ln[c])) continue;
      const ricos = modelo.linhas.map(l => {
        const texto = String(l.v[c] == null ? '' : l.v[c]), rt = SpreadsheetApp.newRichTextValue().setText(texto);
        if (texto) rt.setTextStyle(estilo(l.fc[c], l.fs[c], l.fw[c] === 'bold', false));
        let pos = 0;
        (l.ln[c] || []).forEach(x => { const i = texto.indexOf(x.texto, pos); if (i < 0) return; rt.setLinkUrl(i, i + x.texto.length, x.url); rt.setTextStyle(i, i + x.texto.length, estilo(l.fc[c], l.fs[c], true, true)); pos = i + x.texto.length; });
        return [rt.build()];
      });
      aba.getRange(1, c + 1, ricos.length, 1).setRichTextValues(ricos);
    }
  }

  /**
   * Coloca o painel como primeira aba e oculta (uma vez) as abas do sistema antigo, que não atualizam mais.
   * Nada é apagado: para reexibir, clique com o botão direito na barra de abas → Mostrar.
   */
  static organizar(planilha, aba, c) {
    const fichas = planilha.getSheetByName(this.NOME_FICHAS);
    if (fichas) { planilha.setActiveSheet(fichas); planilha.moveActiveSheet(1); }
    planilha.setActiveSheet(aba); planilha.moveActiveSheet(1);
    if (c.legadoOculto) return [];
    const ocultas = [];
    ['Dashboard', 'Fichas Oficiais', 'Acompanhamento diário', 'Base Executiva', 'Rastreabilidade Executiva', 'Configuração do Painel'].forEach(nome => {
      const s = planilha.getSheetByName(nome); if (s && !s.isSheetHidden()) { s.hideSheet(); ocultas.push(nome); }
    });
    c.legadoOculto = true;
    return ocultas;
  }
}

/**
 * ExecucaoDaEngenharia — 1.2.0 — PERMANENTE.
 * Liga a Base 4.0 ao formulário "Execução de Atendimentos", que a engenharia (Concrejato) responde.
 * O formulário e a planilha de respostas continuam separados e compartilhados com a engenharia.
 * Nenhuma pergunta muda: só a lista da pergunta "Qual o número de protocolo?" passa a vir da Base.
 *
 * O que acontece a cada resposta (gatilho do formulário) e de hora em hora (retomada):
 * 1. Execução: a resposta vira uma movimentação "Execução" no caso, com a regra da Central 4.9
 *    (resolvida ou não procedente → volta ao Atendimento para conferir e finalizar).
 *    Resposta para caso concluído fica registrada sem reabrir. Protocolo desconhecido vai para conferência.
 * 2. Abertura pela engenharia ("Você está abrindo..."): vira um caso novo com protocolo da sequência.
 * 3. Comunicação entre Áreas: mensagens escritas pela Execução viram movimentações "Comunicação".
 * 4. Lista de protocolos do formulário: casos em aberto da Base ("ATD… | Nome").
 * 5. Aba "CPT • Painel da Execução" na planilha da engenharia (PainelDaExecucao): visual para o cliente,
 *    com o PDF da ficha oficial (Ver · Baixar), e aba "CPT • Fichas oficiais" com todos os casos.
 * 6. Avisos por e-mail à engenharia quando o Atendimento encaminha um caso para a Execução (desligado até ativar).
 * Só entram respostas a partir da instalação (respostas antigas já estão no Controle antigo).
 * Idempotente: o ID de cada movimentação vem do conteúdo da resposta. Roda na trava do Campo 4.0.
 * Depende de ConfiguracaoDaBase, RepositorioDosRegistros e AberturaDeAtendimentos.
 */
class ExecucaoDaEngenharia {
  static get PROP() { return 'CAMPO40_EXECUCAO'; }
  static get PROP_ULTIMO() { return 'CAMPO40_EXECUCAO_ULTIMO'; }
  static get padrao() {
    return {formId: '1TXAPh6z6Y6MX6JLVoY_KhO-u24Fi8TqnbDHUdrkeecE', planilhaId: '1Y5zioMOTaJDtp78OPBovXeHhvuns_ZEG6SMyHqng-Uk',
      emails: ['Andre.neves@concrejato.com.br', 'gustavo.ferreira@concrejato.com.br', 'erinaldo.silva@concrejato.com.br'], avisos: false};
  }
  static get PERGUNTA() { return 'Qual o número de protocolo?'; }
  static get MODO() { return 'Você está abrindo ou executando uma ficha?'; }
  static get ORIGEM() { return 'Formulário de Execução'; }
  static get ABA_ORDENS() { return 'CPT • Painel da Execução'; }
  static get ABA_COMUNICACAO() { return 'Comunicação entre Áreas'; }
  static get ABA_AVISOS() { return 'Avisos à engenharia'; }
  static get CAB_AVISOS() { return ['Chave', 'Protocolo', 'Motivo', 'Detectado em', 'Estado', 'Atualizado em']; }
  static get VAZIO() { return 'Nenhuma ordem de serviço em aberto. Consulte o Atendimento.'; }
  static get POR() { return ['Identifique-se, quem fez a execução', 'Identique-se, quem fez a execução', 'Indentique-se, quem fez a execução', 'Indentifique-se, quem fez a execução', 'Responsável pela execução', 'Endereço de e-mail', 'E-mail']; }

  static lerConfig() { return JSON.parse(PropertiesService.getScriptProperties().getProperty(this.PROP) || 'null'); }
  static config() { const c = this.lerConfig(); if (!c) throw new Error('Execute instalarExecucaoDaEngenhariaCampo40 primeiro.'); return c; }
  static salvarConfig(c) { PropertiesService.getScriptProperties().setProperty(this.PROP, JSON.stringify(c)); }
  /** Título comparável: sem acentos, minúsculo, sem pontuação final. */
  static N(v) { return RepositorioDosRegistros.normalizar(v).replace(/[\s:?.!*]+$/, ''); }
  static txt(v) { return v instanceof Date ? v.toISOString() : String(v == null ? '' : v).trim(); }
  static json(v) { try { return JSON.parse(v || '{}') || {}; } catch (_) { return {}; } }
  static dataBr(v) { const d = v instanceof Date ? v : (v ? new Date(v) : null); return d && !isNaN(d) ? Utilities.formatDate(d, 'America/Sao_Paulo', 'dd/MM/yyyy') : this.txt(v); }
  static celula(v) { const t = this.txt(v); return /^[=+@-]/.test(t) ? "'" + t : t; }

  /** Abas de respostas da planilha da engenharia (o Forms já criou mais de uma com ordens de colunas diferentes). */
  static fontes(planilha) {
    return planilha.getSheets().map(aba => {
      if ([this.ABA_ORDENS, 'CPT • Ordens em aberto', this.ABA_COMUNICACAO].includes(aba.getName()) || aba.getLastRow() < 2 || aba.getLastColumn() < 2) return null;
      const dados = aba.getDataRange().getValues(), mapa = {};
      dados[0].forEach((h, i) => { const k = this.N(h); if (k && !(k in mapa)) mapa[k] = i; });
      if (!('carimbo de data/hora' in mapa) || !((this.N(this.PERGUNTA) in mapa) || (this.N(this.MODO) in mapa))) return null;
      return {nome: aba.getName(), dados, mapa};
    }).filter(Boolean);
  }
  static campo(linha, mapa, nomes) {
    for (const n of nomes) { const i = mapa[this.N(n)]; if (i !== undefined && this.txt(linha[i])) return linha[i]; }
    return '';
  }
  /** Separa execuções e aberturas a partir de `desde` (ms). */
  static ler(fontes, desde) {
    const execucoes = [], aberturas = [], vistos = new Set();
    fontes.forEach(f => f.dados.slice(1).forEach(linha => {
      const c = nomes => this.campo(linha, f.mapa, nomes), T = v => this.txt(c(v));
      const carimbo = c(['Carimbo de data/hora']), quando = carimbo instanceof Date ? carimbo : new Date(carimbo);
      if (!carimbo || isNaN(quando) || quando.getTime() < desde) return;
      const evid = T(['Fotos da execução e documentos quando houver']), por = T(this.POR);
      if (/abrindo|novo atendimento/.test(this.N(c([this.MODO])))) {
        const endereco = T(['Endereço completo', 'Endereço onde o serviço foi executado']), solicitacao = T(['Qual foi a solicitação ou reclamação?']), assunto = T(['Assunto']);
        if (!endereco && !solicitacao && !assunto) return;
        const contato = this.contato(T(['Se sim coloque nome completo e telefone ou email de solicitantes']));
        const chave = RepositorioDosRegistros.hash(['EXEC_ABERTURA', quando.toISOString(), endereco, solicitacao, contato.nome]);
        if (vistos.has(chave)) return; vistos.add(chave);
        const dataInf = c(['Data de abertura do atendimento', 'Data da abertura da ficha', 'Data do atendimento']);
        aberturas.push({chave, quando, data: dataInf instanceof Date ? dataInf : quando, por, endereco, solicitacao, assunto, contato, evid,
          tipo: T(['Tipo de Manifestação']), segmento: T(['A demanda deve ser encaminhada para qual segmento do Consórcio?']), tratativa: T(['Qual trabalho ou providências foram realizadas?'])});
        return;
      }
      const protocolo = T([this.PERGUNTA, 'Informe o número de protocolo', 'Número do protocolo', 'Protocolo do atendimento']).split('|')[0].trim().toUpperCase();
      const titulo = T(['Título da execução']);
      const relato = T(['Relado detalhado do que foi executado ou proposto junto ao morador', 'Relato detalhado do que foi executado ou proposto junto ao morador', 'Qual trabalho ou providências foram realizadas?']);
      const naoProcedente = T(['Relato detalhado explicando a não procedência']);
      const chave = RepositorioDosRegistros.hash(['EXEC', quando.toISOString(), protocolo, titulo, relato, naoProcedente]);
      if (vistos.has(chave)) return; vistos.add(chave);
      const dataAt = c(['Data da atuação', 'Data da execução']);
      execucoes.push({chave, quando, protocolo, titulo, relato, naoProcedente, evid, por,
        data: dataAt instanceof Date ? dataAt : (dataAt ? this.txt(dataAt) : ''),
        procedencia: T(['A demanda é procedente?']), resolvida: T(['A demanda foi resolvida?']), pendencias: T(['Há pendências restantes?']),
        retorno: T(['Necessidade de retorno imediato do atendimento?']), obs: T(['Observações para o seguimento da ficha']),
        morador: T(['Nome do morador que acompanhou a execução']), local: T(['Endereço onde o serviço foi executado'])});
    }));
    const ordem = (a, b) => a.quando - b.quando;
    return {execucoes: execucoes.sort(ordem), aberturas: aberturas.sort(ordem)};
  }
  static contato(valor) {
    const email = (valor.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [''])[0];
    const tel = (valor.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4}[-.\s]?\d{4}/) || [''])[0].trim();
    let nome = valor; if (email) nome = nome.replace(email, ' '); if (tel) nome = nome.replace(tel, ' ');
    return {nome: nome.replace(/[|;,/]+/g, ' ').replace(/\s+/g, ' ').trim(), telefone: tel, email};
  }
  static procedencia(v) {
    const n = this.N(v);
    if (/possivel.*nao procedente/.test(n)) return {valor: 'Em análise', informada: 'Possivelmente não procedente'};
    if (n === 'nao' || /nao procedente|improcedente/.test(n)) return {valor: 'Não procedente', informada: 'Não procedente'};
    if (n === 'sim' || (n.includes('procedente') && !n.includes('nao'))) return {valor: 'Procedente', informada: 'Procedente'};
    return {valor: 'Em análise', informada: this.txt(v)};
  }
  /** Mesma regra da Central 4.9: com quem o caso fica depois do retorno. */
  static regra(e, procedencia) {
    const N = v => this.N(v), ret = N(e.retorno), pend = N(e.pendencias), res = N(e.resolvida);
    const precisaAtendimento = /^sim\b/.test(ret) || /morador.*requer|mais informac|retorno imediato/.test(ret) || /morador.*requer|mais alguma tratativa/.test(pend);
    const semPendencias = /^nao\b/.test(pend) || /servico finalizado/.test(pend);
    const resolvida = /^(sim|concluida|concluido|resolvida|resolvido)$/.test(res) || /demanda resolvida|servico finalizado|totalmente resolvid/.test(res) || (!res && semPendencias);
    if (procedencia === 'Não procedente' || resolvida) return {area: 'Atendimento', proxima: 'Conferir execução e finalizar ficha', resolvida: true};
    if (precisaAtendimento) return {area: 'Atendimento', proxima: 'Contatar o morador e complementar as informações para a Execução', resolvida: false};
    return {area: 'Execução', proxima: 'Concluir a providência e registrar novo retorno', resolvida: false};
  }
  static relato(e, proc) {
    const b = [];
    if (e.titulo) b.push('Execução: ' + e.titulo + '.');
    if (e.relato || e.naoProcedente) b.push(e.relato || e.naoProcedente);
    if (e.morador) b.push('Acompanhamento no local: ' + e.morador + '.');
    if (e.local) b.push('Local da execução: ' + e.local + '.');
    const meta = ['Procedência informada: ' + (proc.informada || 'não informada'), e.resolvida ? 'Resolvida: ' + e.resolvida : '', e.pendencias ? 'Pendências: ' + e.pendencias : '',
      e.retorno ? 'Retorno do Atendimento: ' + e.retorno : '', e.obs ? 'Para o seguimento: ' + e.obs : '', 'Executado por ' + (e.por || 'não identificado') + (e.data ? ' em ' + this.dataBr(e.data) : ''),
      e.evid ? 'Evidências: ' + e.evid : ''].filter(Boolean);
    return (b.join('\n\n') + '\n' + meta.join('\n')).trim();
  }

  static tabelas(base) {
    const {a, m} = AberturaDeAtendimentos.tabelas(base);
    const n = a.getLastRow() - 1, linhas = n > 0 ? a.getRange(2, 1, n, 20).getValues() : [];
    const k = m.getLastRow() - 1, movs = k > 0 ? m.getRange(2, 1, k, 8).getValues() : [];
    return {a, m, linhas, movs, pos: new Map(linhas.map((r, i) => [String(r[0]), i])), ids: new Set(movs.map(x => String(x[0])))};
  }
  /** Índice do caso principal (um protocolo incorporado aponta para o principal). */
  static principal(t, protocolo) {
    let i = t.pos.get(protocolo); if (i === undefined) return -1;
    const r = t.linhas[i], p = String(r[1] || '');
    if (p && p !== String(r[0]) && t.pos.has(p)) i = t.pos.get(p);
    return i;
  }

  static aplicarExecucoes(base, lista, res) {
    if (!lista.length) return;
    const t = this.tabelas(base), novas = [], alteradas = new Set(), agora = new Date();
    lista.forEach(e => {
      const id = 'MOV-EXT-' + e.chave.slice(0, 24); if (t.ids.has(id)) return;
      const i = this.principal(t, e.protocolo);
      if (i < 0) { res.conferir.push({resposta: this.dataBr(e.quando), protocolo: e.protocolo || '(sem protocolo)', motivo: 'Protocolo não encontrado na Base. A resposta continua no formulário.'}); return; }
      const r = t.linhas[i], d = this.json(r[19]), proc = this.procedencia(e.procedencia), autor = (e.por || 'Execução') + ' (engenharia)';
      t.ids.add(id);
      if (/conclu/i.test(String(r[3]))) {
        novas.push([id, r[0], e.quando, 'Execução após conclusão', r[3], autor, this.relato(e, proc).slice(0, 1000), this.ORIGEM, '', JSON.stringify({resposta: e.quando.toISOString()})]);
        res.aposConclusao.push(String(r[0])); return;
      }
      const regra = this.regra(e, proc.valor);
      r[3] = 'Em andamento'; r[10] = regra.area; r[12] = regra.proxima; r[13] = agora;
      if (proc.valor !== 'Em análise') d.procedencia = proc.valor;
      d.execucoes = (d.execucoes || []).concat([{data: e.data instanceof Date ? Utilities.formatDate(e.data, 'America/Sao_Paulo', 'yyyy-MM-dd') : String(e.data || ''), por: e.por, feito: [e.titulo, e.relato || e.naoProcedente].filter(Boolean).join('. ').slice(0, 1500), evidencias: (e.evid.match(/https:\/\/[^\s,;]+/g) || []).join(' '), registradoPor: this.ORIGEM}]).slice(-20);
      r[19] = JSON.stringify(d).slice(0, 49000); alteradas.add(i);
      novas.push([id, r[0], e.quando, 'Execução', r[3], autor, this.relato(e, proc).slice(0, 1000), this.ORIGEM, '', JSON.stringify({procedencia: proc, area: regra.area, proxima: regra.proxima, evidencias: e.evid})]);
      res.execucoes.push(String(r[0]));
    });
    alteradas.forEach(i => t.a.getRange(i + 2, 1, 1, 20).setValues([t.linhas[i]]));
    if (novas.length) t.m.getRange(t.m.getLastRow() + 1, 1, novas.length, 10).setValues(novas);
  }

  static abrirCasos(base, lista, res) {
    if (!lista.length) return;
    const {a} = AberturaDeAtendimentos.tabelas(base), idx = AberturaDeAtendimentos.indice(a);
    lista.forEach(e => {
      const registroId = 'REG-' + e.chave.slice(0, 24);
      const linha = []; linha[0] = registroId; linha[2] = e.data; linha[9] = ''; linha[11] = e.por;
      const campos = [['Nome do solicitante', e.contato.nome], ['Telefone', e.contato.telefone], ['E-mail', e.contato.email], ['Endereço completo', e.endereco], ['Assunto', e.assunto],
        ['Tipo de manifestação', e.tipo], ['Solicitação', e.solicitacao], ['Segmento', e.segmento], ['Tratativa inicial', e.tratativa], ['Fotos e documentos', e.evid]]
        .filter(([, v]) => v).map(([titulo, valor]) => ({titulo, valor}));
      const r = AberturaDeAtendimentos.abrir(base, linha, {campos}, idx, this.ORIGEM);
      if (r.novo) res.aberturas.push(r.protocolo);
    });
  }

  /** Mensagens da Execução na aba Comunicação entre Áreas viram movimentações (não mudam o caso). */
  static importarComunicacoes(base, planilha, desde, res) {
    const aba = planilha.getSheetByName(this.ABA_COMUNICACAO); if (!aba || aba.getLastRow() < 2) return;
    const dados = aba.getDataRange().getValues(), mapa = {}; dados[0].forEach((h, i) => { mapa[this.N(h)] = i; });
    if (['chave do evento', 'protocolo', 'data e hora', 'area autora', 'mensagem'].some(k => !(k in mapa))) { res.erros.push('Comunicação entre Áreas: cabeçalhos diferentes do esperado; mensagens não importadas.'); return; }
    const t = this.tabelas(base), novas = [];
    dados.slice(1).forEach(l => {
      const g = k => l[mapa[k]], quando = g('data e hora') instanceof Date ? g('data e hora') : new Date(g('data e hora'));
      if (this.N(g('area autora')) !== 'execucao' || !this.txt(g('chave do evento')) || isNaN(quando) || quando.getTime() < desde) return;
      const id = 'MOV-COM-' + RepositorioDosRegistros.hash(['COM', this.txt(g('chave do evento'))]).slice(0, 24); if (t.ids.has(id)) return;
      const i = this.principal(t, this.txt(g('protocolo')).toUpperCase());
      if (i < 0) { res.conferir.push({resposta: this.dataBr(quando), protocolo: this.txt(g('protocolo')) || '(sem protocolo)', motivo: 'Comunicação da Execução com protocolo não encontrado.'}); return; }
      const r = t.linhas[i], titulo = 'titulo do item' in mapa ? this.txt(g('titulo do item')) : '';
      t.ids.add(id);
      novas.push([id, r[0], quando, 'Comunicação', r[3], ('registrado por' in mapa ? this.txt(g('registrado por')) : '') || 'Execução', [titulo, this.txt(g('mensagem'))].filter(Boolean).join(' · ').slice(0, 1000), this.ABA_COMUNICACAO, '', '{}']);
    });
    if (novas.length) t.m.getRange(t.m.getLastRow() + 1, 1, novas.length, 10).setValues(novas);
    res.comunicacoes = novas.length;
  }

  /** Telefone do caso em qualquer formato (aberto pelo 4.0, migrado do Controle antigo, corrigido na aplicação). */
  static telefone(d) {
    const c = d.corrigido || {}; if (Object.prototype.hasOwnProperty.call(c, 'telefone')) return this.txt(c.telefone);
    const o = ((d.oficiais || [])[0] || {}).campos || {}, m = ((d.manuais || []).slice(-1)[0] || {}).dados || {}, a = ((d.aberturas || [])[0] || {}).campos || {};
    return this.txt(d.telefone || o['Telefone'] || m.telefone || a['Telefones']);
  }
  /** ID no Drive do PDF da ficha oficial: o gerado pela aplicação (coluna PDF) ou o da ficha antiga migrada. */
  static pdf(r, d) {
    const id = v => (this.txt(v).match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{20,})/) || [])[1] || (/^[A-Za-z0-9_-]{20,}$/.test(this.txt(v)) ? this.txt(v) : '');
    const o = ((d.oficiais || [])[0] || {}).campos || {};
    return id(r[15]) || id(o['ID do PDF atual']) || id(o['Baixar PDF']) || '';
  }
  /** Casos principais em aberto, concluídos nos últimos 30 dias e a última movimentação que não veio da engenharia. */
  static casos(base) {
    const t = this.tabelas(base), agora = Date.now(), ultimo = new Map(), data = v => { const x = v instanceof Date ? v : (v ? new Date(v) : null); return x && !isNaN(x) ? x : null; };
    t.movs.forEach(m => { if (![this.ORIGEM, this.ABA_COMUNICACAO].includes(String(m[7]))) ultimo.set(String(m[1]), {id: String(m[0]), tipo: String(m[3]), resumo: this.txt(m[6])}); });
    const todos = t.linhas.filter(r => r[0] && (!r[1] || String(r[1]) === String(r[0]))).map(r => {
      const d = this.json(r[19]), ab = data(r[4]), fim = data(r[5]), concluida = /conclu/i.test(String(r[3]));
      // "Atendimento" na frente de obra é herança do Controle antigo (sem frente definida).
      const frente = this.txt(r[9]).replace(/^atendimento$/i, '');
      return {protocolo: String(r[0]), nome: this.txt(r[6]), assunto: this.txt(r[7]), endereco: this.txt(r[8]), frente, area: this.txt(r[10]), proxima: this.txt(r[12]), status: this.txt(r[3]),
        concluida, conclusao: fim, abertura: ab, dias: ab ? Math.max(0, Math.floor(((concluida && fim ? fim.getTime() : agora) - ab.getTime()) / 864e5)) : '',
        atualizado: r[13], telefone: this.telefone(d), pdf: this.pdf(r, d), ultimo: ultimo.get(String(r[0])) || null};
    });
    return {todos, abertos: todos.filter(x => !x.concluida), concluidas: todos.filter(x => x.concluida && x.conclusao && agora - x.conclusao.getTime() <= 30 * 864e5)};
  }

  static atualizarLista(c, casos) {
    const form = FormApp.openById(c.formId), alvo = this.N(this.PERGUNTA);
    const itens = form.getItems().filter(i => this.N(i.getTitle()) === alvo);
    if (itens.length !== 1) throw new Error('O formulário de Execução precisa ter exatamente uma pergunta "' + this.PERGUNTA + '".');
    if (itens[0].getType() !== FormApp.ItemType.LIST) throw new Error('A pergunta "' + this.PERGUNTA + '" precisa ser Lista suspensa.');
    const item = itens[0].asListItem();
    const opcoes = casos.abertos.slice().sort((a, b) => a.protocolo.localeCompare(b.protocolo, undefined, {numeric: true}))
      .map(x => x.protocolo + ' | ' + (x.nome.replace(/[\r\n|]+/g, ' ').trim() || 'Nome não informado'));
    const valores = opcoes.length ? opcoes : [this.VAZIO];
    if (JSON.stringify(item.getChoices().map(x => x.getValue())) !== JSON.stringify(valores)) item.setChoiceValues(valores);
    return opcoes.length;
  }

  /** Painel do cliente (PainelDaExecucao). Refeito quando o conteúdo muda; a hora do título não conta como mudança. */
  static atualizarOrdens(c, planilha, casos) {
    const agora = new Date(), fuso = 'America/Sao_Paulo', dia = Utilities.formatDate(agora, fuso, 'yyyy-MM-dd');
    const modelo = PainelDaExecucao.montar(casos, agora, fuso), fichas = PainelDaExecucao.montarFichas(casos, agora, fuso);
    const assina = (nome, m, de) => RepositorioDosRegistros.hash([nome, m.linhas.slice(de).map(l => [l.v, l.ln]), dia]);
    const assinatura = assina(PainelDaExecucao.NOME, modelo, 2), assinaturaFichas = assina(PainelDaExecucao.NOME_FICHAS, fichas, 2);
    const existe = planilha.getSheetByName(PainelDaExecucao.NOME), existeFichas = planilha.getSheetByName(PainelDaExecucao.NOME_FICHAS);
    const comPdf = casos.todos.filter(x => x.pdf).length, resumoFichas = '; fichas oficiais: ' + comPdf + ' de ' + casos.todos.length + ' com PDF';
    if (existe && existeFichas && c.ordensAssinatura === assinatura && c.fichasAssinatura === assinaturaFichas && c.legadoOculto) return 'sem mudança' + resumoFichas;
    if (!existeFichas || c.fichasAssinatura !== assinaturaFichas) { PainelDaExecucao.desenhar(planilha, fichas, PainelDaExecucao.NOME_FICHAS); c.fichasAssinatura = assinaturaFichas; }
    const aba = PainelDaExecucao.desenhar(planilha, modelo), ocultas = PainelDaExecucao.organizar(planilha, aba, c);
    c.ordensAssinatura = assinatura; this.salvarConfig(c);
    return casos.abertos.length + ' em aberto, ' + casos.concluidas.length + ' concluída(s) em 30 dias' + resumoFichas + (ocultas.length ? '; abas antigas ocultas: ' + ocultas.join(', ') : '');
  }

  static abaAvisos(base) {
    let a = base.getSheetByName(this.ABA_AVISOS);
    if (!a) { a = base.insertSheet(this.ABA_AVISOS); a.getRange(1, 1, 1, this.CAB_AVISOS.length).setValues([this.CAB_AVISOS]); a.setFrozenRows(1); }
    return a;
  }
  /** Encaminhamentos para a Execução. Na instalação (referencia=true) os atuais ficam só como referência. */
  static avisar(c, base, casos, referencia) {
    const aba = this.abaAvisos(base), n = aba.getLastRow() - 1, linhas = n > 0 ? aba.getRange(2, 1, n, 6).getValues() : [], agora = new Date();
    const vistos = new Set(linhas.map(l => String(l[0]))), porProtocolo = new Map(casos.abertos.map(x => [x.protocolo, x])), novos = [];
    casos.abertos.filter(x => x.area === 'Execução').forEach(x => {
      const chave = 'AV|' + (x.ultimo ? x.ultimo.id : 'ABERTURA|' + x.protocolo); if (vistos.has(chave)) return;
      novos.push([chave, x.protocolo, this.celula(x.ultimo ? (x.ultimo.tipo + ': ' + x.ultimo.resumo).slice(0, 300) : 'Encaminhado para a Execução'), agora, referencia ? 'REFERÊNCIA' : 'PENDENTE', agora]);
    });
    if (novos.length) aba.getRange(aba.getLastRow() + 1, 1, novos.length, 6).setValues(novos);
    if (referencia || !c.avisos) return novos.length + ' registrado(s)' + (c.avisos ? '' : '; envio desligado');
    const todas = linhas.concat(novos), pendentes = [];
    todas.forEach((l, i) => {
      if (l[4] !== 'PENDENTE') return;
      const caso = porProtocolo.get(String(l[1]));
      if (!caso || caso.area !== 'Execução') { aba.getRange(i + 2, 5, 1, 2).setValues([['DISPENSADO', agora]]); return; }
      pendentes.push({i, caso, motivo: this.txt(l[2])});
    });
    if (!pendentes.length) return 'nenhum aviso novo';
    const emails = (c.emails || []).filter(e => /@/.test(e)); if (!emails.length) return 'sem destinatários';
    if (MailApp.getRemainingDailyQuota() < emails.length) throw new Error('Cota de e-mail do dia esgotada. Os avisos ficam pendentes.');
    const form = FormApp.openById(c.formId), planilha = SpreadsheetApp.openById(c.planilhaId), esc = s => String(s).replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]));
    const texto = pendentes.map(p => [p.caso.protocolo + ' | ' + p.caso.nome, 'Endereço: ' + p.caso.endereco, 'Telefone: ' + (p.caso.telefone || 'não informado'), 'Assunto: ' + p.caso.assunto, 'Próxima ação: ' + p.caso.proxima, 'Encaminhamento: ' + p.motivo].join('\n')).join('\n\n');
    const tabela = '<table border="1" cellpadding="6" style="border-collapse:collapse;font-family:Arial;font-size:13px"><tr><th>Protocolo</th><th>Nome</th><th>Endereço</th><th>Telefone</th><th>Assunto</th><th>Próxima ação</th><th>Encaminhamento</th></tr>' +
      pendentes.map(p => '<tr>' + [p.caso.protocolo, p.caso.nome, p.caso.endereco, p.caso.telefone || '—', p.caso.assunto, p.caso.proxima, p.motivo].map(v => '<td>' + esc(v) + '</td>').join('') + '</tr>').join('') + '</table>';
    const links = 'Responder pelo formulário de Execução: ' + form.getPublishedUrl() + '\nTodas as ordens em aberto: ' + planilha.getUrl() + ' (aba ' + this.ABA_ORDENS + ')';
    MailApp.sendEmail({to: emails.join(','), name: 'Consórcio Performance Tamanduateí', subject: 'CPT | ' + pendentes.length + ' ficha(s) encaminhada(s) à Execução',
      body: 'Olá, equipe.\n\nO Atendimento encaminhou para a Execução:\n\n' + texto + '\n\n' + links + '\n\nAo responder, escolha o protocolo na lista do formulário.',
      htmlBody: '<p>Olá, equipe.</p><p>O Atendimento encaminhou para a Execução:</p>' + tabela + '<p>' + esc(links).replace(/\n/g, '<br>') + '</p><p>Ao responder, escolha o protocolo na lista do formulário.</p>'});
    pendentes.forEach(p => aba.getRange(p.i + 2, 5, 1, 2).setValues([['ENVIADO', agora]]));
    return pendentes.length + ' aviso(s) enviado(s)';
  }

  /** Um ciclo completo. Chamar dentro de ConfiguracaoDaBase.comTrava. */
  static sincronizar(referencia) {
    const c = this.config(), base = SpreadsheetApp.openById(ConfiguracaoDaBase.exigirInstalacao().baseId), planilha = SpreadsheetApp.openById(c.planilhaId);
    const res = {execucoes: [], aberturas: [], comunicacoes: 0, aposConclusao: [], conferir: [], erros: []}, desde = new Date(c.desde).getTime();
    const {execucoes, aberturas} = this.ler(this.fontes(planilha), desde);
    this.abrirCasos(base, aberturas, res);
    this.aplicarExecucoes(base, execucoes, res);
    try { this.importarComunicacoes(base, planilha, desde, res); } catch (e) { res.erros.push('Comunicação entre Áreas: ' + e.message); }
    const casos = this.casos(base);
    try { res.lista = this.atualizarLista(c, casos) + ' protocolo(s) na lista'; } catch (e) { res.erros.push('Lista do formulário: ' + e.message); }
    try { res.ordens = this.atualizarOrdens(c, planilha, casos); } catch (e) { res.erros.push('Ordens em aberto: ' + e.message); }
    try { res.avisos = this.avisar(c, base, casos, referencia); } catch (e) { res.erros.push('Avisos: ' + e.message); }
    res.em = new Date().toISOString();
    PropertiesService.getScriptProperties().setProperty(this.PROP_ULTIMO, JSON.stringify(res).slice(0, 8000));
    return res;
  }
}

/** EXECUTE UMA VEZ, no corte: liga o formulário de Execução à Base. Repetir é seguro (mantém a data de início). */
function instalarExecucaoDaEngenhariaCampo40() {
  return ConfiguracaoDaBase.comTrava(() => {
    const E = ExecucaoDaEngenharia, c = Object.assign({}, E.padrao, E.lerConfig() || {});
    if (!c.desde) c.desde = new Date().toISOString();
    E.salvarConfig(c);
    const nome = 'aoReceberExecucaoCampo40', atuais = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === nome);
    if (!atuais.length) ScriptApp.newTrigger(nome).forForm(c.formId).onFormSubmit().create(); else atuais.slice(1).forEach(t => ScriptApp.deleteTrigger(t));
    const r = E.sincronizar(true);
    const saida = {resultado: r.erros.length ? 'INSTALADO COM AVISOS' : 'EXECUÇÃO DA ENGENHARIA LIGADA À BASE', respostasAPartirDe: c.desde, lista: r.lista, ordens: r.ordens, avisos: r.avisos, erros: r.erros,
      proximoPasso: 'Desligue os acionadores do Controle de Atendimentos antigo e depois execute ativarAvisosEngenhariaCampo40.'};
    console.log(JSON.stringify(saida, null, 2)); return saida;
  });
}
/** AUTOMÁTICA (gatilho do formulário de Execução). Se a trava estiver ocupada, a retomada de hora em hora conclui. */
function aoReceberExecucaoCampo40() {
  try { return ConfiguracaoDaBase.comTrava(() => ExecucaoDaEngenharia.sincronizar(false)); }
  catch (erro) { console.error('Execução: ' + String(erro.message || erro)); return null; }
}
/** EXECUTE para sincronizar agora e ver o resultado (o que entrou, o que precisa de conferência). */
function sincronizarExecucaoDaEngenhariaCampo40() {
  const r = ConfiguracaoDaBase.comTrava(() => ExecucaoDaEngenharia.sincronizar(false));
  console.log(JSON.stringify(r, null, 2)); return r;
}
/** EXECUTE depois de desligar o Controle antigo: a engenharia passa a receber e-mail quando um caso é encaminhado a ela. */
function ativarAvisosEngenhariaCampo40() {
  return ConfiguracaoDaBase.comTrava(() => {
    const c = ExecucaoDaEngenharia.config(); c.avisos = true; ExecucaoDaEngenharia.salvarConfig(c);
    const r = {resultado: 'AVISOS À ENGENHARIA ATIVOS', destinatarios: c.emails}; console.log(JSON.stringify(r, null, 2)); return r;
  });
}
function pausarAvisosEngenhariaCampo40() {
  return ConfiguracaoDaBase.comTrava(() => {
    const c = ExecucaoDaEngenharia.config(); c.avisos = false; ExecucaoDaEngenharia.salvarConfig(c);
    const r = {resultado: 'AVISOS À ENGENHARIA PAUSADOS'}; console.log(JSON.stringify(r, null, 2)); return r;
  });
}
/** Hora em hora, chamada pela retomada. Silenciosa se ainda não instalado. */
function sincronizarExecucaoDaEngenhariaCampo40_() {
  if (!ExecucaoDaEngenharia.lerConfig()) return null;
  try { return ConfiguracaoDaBase.comTrava(() => ExecucaoDaEngenharia.sincronizar(false)); }
  catch (erro) { console.error('Execução da engenharia adiada: ' + String(erro.message || erro)); return null; }
}

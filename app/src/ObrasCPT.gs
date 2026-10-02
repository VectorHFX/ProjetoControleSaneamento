/**
 * ObrasCPT 2.1.0. Cadastro de obras dentro da aplicação.
 * Fonte única: aba Obras da Base Campo 4.0 (a mesma que alimenta o formulário).
 * - Consulta: toda a equipe.  Edição: Administração técnica, Administrativo e Gestão.
 * - Colunas A:S (PAC16) são preservadas; a aplicação grava B, C, D, T:Z e o bloco próprio AF:AI.
 * - Depois de salvar, marca a aba para o projeto Campo 4.0 atualizar as listas do formulário (em até 1 hora).
 */
class ObrasCPT {
  static get situacoes() { return ['Em andamento', 'Paralisada', 'Finalizada', 'A confirmar']; }
  static get impactos() { return ['Alto', 'Médio', 'Baixo']; }
  /** Bloco próprio da aplicação, depois da área de controle (AB:AD) usada pelo Campo 4.0. */
  static get colunasApp() { return {inicio: 32, cabecalho: ['Tipo de obra', 'Término da obra', 'Endereço da frente', 'Atualizado por']}; }
  static get marcador() { return 'PENDENTE — alterado pela aplicação'; }

  constructor(ctx) { this.ctx = ctx; this.fuso = ctx.base.getSpreadsheetTimeZone(); }
  aba(nome) { const a = this.ctx.base.getSheetByName(nome); if (!a) throw new Error('A aba ' + nome + ' não foi encontrada na base.'); return a; }
  static norm(v) { return DadosDaAplicacao.norm(v); }
  data(v) { return v instanceof Date ? Utilities.formatDate(v, this.fuso, 'yyyy-MM-dd') : /^\d{4}-\d{2}-\d{2}/.test(String(v || '')) ? String(v).slice(0, 10) : ''; }
  instante(v) { return v instanceof Date ? v.toISOString() : String(v || ''); }

  bairros() {
    const a = this.aba('Bairros'), n = a.getLastRow() - 1;
    return (n > 0 ? a.getRange(2, 1, n, 5).getValues() : []).filter(r => r[0] && r[1])
      .map(r => ({id: String(r[0]).trim(), nome: String(r[1]).trim(), noFormulario: r[2] === true, especial: String(r[4]) === 'Opção especial'}));
  }
  /** Lê A:Z e o bloco AF:AI. Uma linha inválida não impede a consulta das demais. */
  ler() {
    const a = this.aba('Obras'), n = a.getLastRow() - 1;
    if (n < 1) return {aba: a, linhas: []};
    const largura = Math.min(a.getMaxColumns(), 26), base = a.getRange(2, 1, n, largura).getValues();
    const c = ObrasCPT.colunasApp, extra = a.getMaxColumns() >= c.inicio + 3 ? a.getRange(2, c.inicio, n, 4).getValues() : base.map(() => ['', '', '', '']);
    const linhas = base.map((r, i) => ({linha: i + 2, r, x: extra[i]})).filter(o => String(o.r[0] || '').trim());
    return {aba: a, linhas};
  }
  publico(o) {
    const r = o.r, x = o.x, situacao = String(r[19] || '');
    return {id: String(r[0]).trim(), nome: String(r[1] || ''), bairros: String(r[2] || '').split(';').map(s => s.trim()).filter(Boolean),
      noFormulario: r[3] === true, noFormularioAgora: r[3] === true && ['Em andamento', 'Paralisada'].includes(situacao),
      situacao, inicioObra: this.data(r[20]), inicioComunicacao: this.data(r[21]), publico: String(r[22] || ''), impacto: String(r[23] || ''),
      observacao: String(r[24] || ''), atualizadoEm: this.instante(r[25]), logradouroPAC16: String(r[8] || ''), metodoPAC16: String(r[6] || ''),
      latitude: r[9] === '' ? null : Number(r[9]), longitude: r[10] === '' ? null : Number(r[10]), referencia: String(r[12] || ''),
      tipo: String(x[0] || ''), termino: this.data(x[1]), endereco: String(x[2] || ''), atualizadoPor: String(x[3] || '')};
  }
  listar() {
    const {linhas} = this.ler(), obras = linhas.map(o => this.publico(o));
    const ordem = {'Em andamento': 0, 'Paralisada': 1, 'A confirmar': 2, '': 3, 'Finalizada': 4};
    obras.sort((a, b) => (ordem[a.situacao] ?? 3) - (ordem[b.situacao] ?? 3) || b.inicioObra.localeCompare(a.inicioObra) || a.nome.localeCompare(b.nome, 'pt-BR'));
    return {obras, bairros: this.bairros().filter(b => !b.especial).map(b => b.nome).sort((a, b) => a.localeCompare(b, 'pt-BR')),
      situacoes: ObrasCPT.situacoes, impactos: ObrasCPT.impactos, podeEditar: PerfisCPT.gerencia(this.ctx.perfil), formulario: this.statusFormulario()};
  }
  /** Mensagem do último salvamento das listas do formulário (área de controle AB5:AB6 do Campo 4.0). */
  statusFormulario() {
    try {
      const a = this.aba('Obras'); if (a.getMaxColumns() < 30 || String(a.getRange(1, 28).getValue()) !== 'ATUALIZAR FORMULÁRIO') return {situacao: 'desconhecida', texto: 'Controle do formulário não encontrado na aba Obras.'};
      const [[texto], [quando]] = a.getRange(5, 28, 2, 1).getValues(), q = String(quando || '');
      if (q.startsWith(ObrasCPT.marcador)) return {situacao: 'pendente', texto: 'Alterações aguardando o formulário (atualiza em até 1 hora).'};
      return {situacao: /não foi possível|falha/i.test(String(texto)) ? 'erro' : 'ok', texto: String(texto || ''), quando: quando instanceof Date ? quando.toISOString() : q};
    } catch (e) { return {situacao: 'desconhecida', texto: e.message}; }
  }

  static texto(v, max, campo, obrigatorio = false) {
    if (v == null) v = '';
    if (typeof v !== 'string' || v.length > max || (obrigatorio && !v.trim())) throw new Error('Confira o campo ' + campo + (obrigatorio ? ' (obrigatório)' : '') + '.');
    return v.trim();
  }
  static dataValida(v, campo) {
    if (!v) return '';
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || new Date(v + 'T12:00:00Z').toISOString().slice(0, 10) !== v) throw new Error('Data inválida em ' + campo + '.');
    return v;
  }
  garantirColunas(a) {
    const c = ObrasCPT.colunasApp, fim = c.inicio + c.cabecalho.length - 1;
    if (a.getMaxColumns() < fim) a.insertColumnsAfter(a.getMaxColumns(), fim - a.getMaxColumns());
    const atual = a.getRange(1, c.inicio, 1, c.cabecalho.length).getValues()[0];
    if (atual.every(v => v === '')) a.getRange(1, c.inicio, 1, c.cabecalho.length).setValues([c.cabecalho]).setFontWeight('bold').setBackground('#12678f').setFontColor('#ffffff');
    else if (atual.some((v, i) => v !== c.cabecalho[i])) throw new Error('As colunas AF:AI da aba Obras têm outro conteúdo. Nada foi gravado.');
  }
  salvar(p) {
    if (!PerfisCPT.gerencia(this.ctx.perfil)) throw new Error('A atualização de obras é feita pelo Administrativo ou pela Gestão.');
    if (!p || typeof p !== 'object') throw new Error('Dados da obra inválidos.');
    const T = ObrasCPT.texto, D = ObrasCPT.dataValida;
    const nome = T(p.nome, 200, 'Nome da obra', true), situacao = T(p.situacao, 20, 'Situação', true);
    if (!ObrasCPT.situacoes.includes(situacao)) throw new Error('Escolha uma situação da lista.');
    const impacto = T(p.impacto, 10, 'Impacto'); if (impacto && !ObrasCPT.impactos.includes(impacto)) throw new Error('Impacto deve ser Alto, Médio ou Baixo.');
    const publico = T(p.publico, 20, 'Público (A, B, C…)').toUpperCase(); if (publico && !/^[A-E](\s*,\s*[A-E])*$/.test(publico)) throw new Error('Público: use letras de A a E separadas por vírgula (ex.: A, B).');
    const inicioObra = D(p.inicioObra, 'Início da obra'), inicioComunicacao = D(p.inicioComunicacao, 'Início da comunicação'), termino = D(p.termino, 'Término da obra');
    if (termino && inicioObra && termino < inicioObra) throw new Error('O término não pode ser antes do início da obra.');
    if (situacao === 'Finalizada' && !termino) throw new Error('Informe a data de término para marcar a obra como finalizada.');
    const cadastrados = new Map(this.bairros().filter(b => !b.especial).map(b => [ObrasCPT.norm(b.nome), b.nome]));
    if (!Array.isArray(p.bairros)) throw new Error('Bairros inválidos.');
    const bairros = [...new Set(p.bairros.map(b => { const nomeB = cadastrados.get(ObrasCPT.norm(b)); if (!nomeB) throw new Error('Bairro não cadastrado: ' + b); return nomeB; }))];
    const noFormulario = p.noFormulario === true;
    const tipo = T(p.tipo, 120, 'Tipo de obra'), endereco = T(p.endereco, 300, 'Endereço da frente'), observacao = T(p.observacao, 1000, 'Observação');

    const {aba, linhas} = this.ler();
    this.garantirColunas(aba);
    const agora = new Date();
    let alvo = null, anterior = null, id = '';
    if (p.id) {
      alvo = linhas.find(o => String(o.r[0]).trim() === p.id);
      if (!alvo) throw new Error('Obra não encontrada.');
      anterior = this.publico(alvo);
      if (String(p.atualizadoEm || '') !== anterior.atualizadoEm) throw new Error('Esta obra foi alterada por outra pessoa ou na planilha. Feche e abra de novo para ver a versão atual.');
      id = p.id;
    } else {
      if (linhas.some(o => ObrasCPT.norm(o.r[1]) === ObrasCPT.norm(nome))) throw new Error('Já existe uma obra com este nome. Abra a existente para editar.');
      const maior = linhas.reduce((m, o) => Math.max(m, Number((String(o.r[0]).match(/^OBR-(\d+)$/) || [0, 0])[1])), 0);
      id = 'OBR-' + String(maior + 1).padStart(4, '0');
    }
    const linha = alvo ? alvo.linha : aba.getLastRow() + 1;
    if (!alvo) aba.getRange(linha, 1, 1, 19).setValues([[id, '', '', false, '', '', '', 'Santo André', '', '', '', '', '', 'Aplicação CPT', '', '', '', '', 'Cadastrada na aplicação por ' + this.ctx.email]]);
    aba.getRange(linha, 2, 1, 3).setValues([[nome, bairros.join('; '), noFormulario]]);
    aba.getRange(linha, 20, 1, 7).setValues([[situacao, inicioObra ? new Date(inicioObra + 'T12:00:00') : '', inicioComunicacao ? new Date(inicioComunicacao + 'T12:00:00') : '',
      publico, impacto, observacao, agora]]);
    aba.getRange(linha, ObrasCPT.colunasApp.inicio, 1, 4).setValues([[tipo, termino ? new Date(termino + 'T12:00:00') : '', endereco, this.ctx.email]]);
    this.marcarSincronizacao(aba);
    const atual = this.publico({linha, r: aba.getRange(linha, 1, 1, 26).getValues()[0], x: aba.getRange(linha, ObrasCPT.colunasApp.inicio, 1, 4).getValues()[0]});
    this.historico(anterior, atual);
    const aviso = noFormulario && !['Em andamento', 'Paralisada'].includes(situacao) ? ' Como está "' + situacao + '", ela não aparece no formulário.' : '';
    return {resultado: (alvo ? 'Obra atualizada.' : 'Obra ' + id + ' cadastrada.') + ' O formulário recebe a mudança em até 1 hora.' + aviso, obra: atual};
  }
  /** Revisão diária: confirma que a situação continua a mesma, sem mudar os dados. */
  confirmar(p) {
    if (!PerfisCPT.gerencia(this.ctx.perfil)) throw new Error('A revisão de obras é feita pelo Administrativo ou pela Gestão.');
    const {aba, linhas} = this.ler(), alvo = linhas.find(o => String(o.r[0]).trim() === String(p && p.id || ''));
    if (!alvo) throw new Error('Obra não encontrada.');
    const anterior = this.publico(alvo);
    if (String(p.atualizadoEm || '') !== anterior.atualizadoEm) throw new Error('Esta obra mudou desde que você abriu a lista. Atualize a página.');
    this.garantirColunas(aba);
    aba.getRange(alvo.linha, 26).setValue(new Date());
    aba.getRange(alvo.linha, ObrasCPT.colunasApp.inicio + 3).setValue(this.ctx.email);
    const atual = this.publico({linha: alvo.linha, r: aba.getRange(alvo.linha, 1, 1, 26).getValues()[0], x: aba.getRange(alvo.linha, ObrasCPT.colunasApp.inicio, 1, 4).getValues()[0]});
    this.historico(anterior, atual, 'Situação confirmada');
    return {resultado: 'Situação confirmada hoje.', obra: atual};
  }
  /** O Campo 4.0 lê esta célula de hora em hora e atualiza as listas do formulário. */
  marcarSincronizacao(aba) {
    if (aba.getMaxColumns() < 30) return;
    if (String(aba.getRange(1, 28).getValue()) !== 'ATUALIZAR FORMULÁRIO') return;
    aba.getRange(6, 28).setValue(ObrasCPT.marcador + ' em ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm'));
  }
  historico(antes, depois, acao) {
    const ss = ObservacoesCPT.planilha(this.ctx.config), cab = ['Alterado em', 'Alterado por', 'Obra', 'Ação', 'Antes', 'Depois'];
    let a = ss.getSheetByName('Histórico de obras');
    if (!a) { a = ss.insertSheet('Histórico de obras'); a.getRange(1, 1, 1, cab.length).setValues([cab]); a.setFrozenRows(1); }
    a.getRange(a.getLastRow() + 1, 1, 1, cab.length).setValues([[new Date(), this.ctx.email, depois.id, acao || (antes ? 'Edição' : 'Cadastro'),
      antes ? JSON.stringify(antes) : '', JSON.stringify(depois)]]);
  }
}

function listarObrasCPT() { return AplicacaoCPT.executar((d, ctx) => new ObrasCPT(ctx).listar(), 'obras.listar'); }
function salvarObraCPT(p) {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('Há outro salvamento em andamento. Seus dados continuam na tela: tente novamente.');
  try { return AplicacaoCPT.executar((d, ctx) => new ObrasCPT(ctx).salvar(p), 'obras.salvar'); } finally { lock.releaseLock(); }
}
function confirmarObraCPT(p) {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('Tente novamente em instantes.');
  try { return AplicacaoCPT.executar((d, ctx) => new ObrasCPT(ctx).confirmar(p), 'obras.confirmar'); } finally { lock.releaseLock(); }
}

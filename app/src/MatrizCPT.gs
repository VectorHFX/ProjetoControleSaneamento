/**
 * MatrizCPT 2.40.0. Matriz de Contatos da Sabesp (aba "Matriz de Contatos" da planilha dos Anexos), com a aplicação como fonte.
 * - Contatos "Matriz Sabesp" ficam separados dos contatos internos (coleção "Matriz Sabesp" na planilha de dados da aplicação).
 * - Importar (uma vez, Gestão/Administrativo): lê a aba e cria um contato aprovado por linha, com a seção de origem.
 * - Qualquer pessoa da equipe propõe: contato novo, alteração ou inativar. Nada vale até a Gestão ou o Administrativo
 *   aprovar; recusar pede o motivo. Cada passo fica no histórico do contato (quem, quando, o quê) e cada versão fica
 *   na coleção — auditável, porque a Matriz é um documento do cliente.
 * - Aprovado → escrito na planilha: alteração no lugar (a linha é achada pelo nome e pessoa de contato gravados da última vez);
 *   contato novo entra no fim da sua seção, com a formatação da linha de cima; a coluna ATUALIZAÇÃO recebe a data.
 *   Nenhuma linha é apagada: inativar escreve "Inativo desde dd/mm/aaaa." na observação. Se a planilha não abrir
 *   ou a linha não for achada, o contato fica "a gravar" e a rotina das 12h/0h tenta de novo.
 */
class MatrizCPT {
  static get aba() { return 'Matriz Sabesp'; }
  static get campos() { return ['nome', 'pessoa', 'endereco', 'telefone', 'email', 'observacao']; }
  static get rotulos() { return {nome: 'Nome / função / cargo', pessoa: 'Pessoa de contato', endereco: 'Endereço', telefone: 'Telefone', email: 'E-mail', observacao: 'Observação'}; }
  static pode(p) { return PerfisCPT.gerencia(p); }
  static norm(v) { return DadosDaAplicacao.norm(v); }
  static chave(c) { return MatrizCPT.norm(c.nome) + '|' + MatrizCPT.norm(c.pessoa); }
  constructor(ctx) { this.ctx = ctx; this.col = new ColecaoCPT(ctx, MatrizCPT.aba, 'MSP'); }
  hoje() { return ColecaoCPT.hoje(); }
  evento(acao, detalhe) { return {em: new Date().toISOString(), por: this.ctx.email, nome: this.ctx.perfil.nome, acao, detalhe: detalhe || ''}; }

  // ---------------- Planilha ----------------
  abaPlanilha() { const ss = AnexosCPT.abrirPlanilha(); return AnexosCPT.aba(ss, 'Matriz de Contatos', n => n.includes('matriz') && n.includes('contato')); }
  /**
   * Lê a aba: seções (títulos de uma célula só antes dos contatos), contatos (abaixo de um cabeçalho "PESSOA DE CONTATO",
   * com ao menos dois campos) e a última linha de cada seção. Colunas B a H.
   */
  static ler(valores) {
    const secoes = [], contatos = [], usados = new Map(); let titulos = [], atual = null, dentro = false;
    const nova = () => {
      const base = titulos.filter(t => !/^matriz de contatos$/.test(MatrizCPT.norm(t))).join(' · ') || (atual ? atual.nome : 'Sem seção');
      const n = (usados.get(base) || 0) + 1; usados.set(base, n);
      atual = {nome: n > 1 ? base + ' (' + n + ')' : base, ultima: 0}; secoes.push(atual); titulos = [];
    };
    valores.forEach((r, i) => {
      const cel = r.slice(1, 8).map(v => v instanceof Date ? v : String(v == null ? '' : v).trim()), cheios = cel.filter(v => v !== '').length, linha = i + 1;
      if (/pessoa de contato/.test(MatrizCPT.norm(cel[1]))) { dentro = true; if (titulos.length || !atual) nova(); atual.ultima = linha; return; }
      if (cheios === 1 && cel[0]) { titulos.push(String(cel[0])); return; }
      if (dentro && cheios >= 2) {
        if (titulos.length) nova();
        atual.ultima = linha;
        contatos.push({linha, secao: atual.nome, nome: String(cel[0]), pessoa: String(cel[1]), endereco: String(cel[2]), telefone: String(cel[3]), email: String(cel[4]), observacao: String(cel[5]),
          atualizacao: cel[6] instanceof Date ? Utilities.formatDate(cel[6], 'America/Sao_Paulo', 'yyyy-MM-dd') : String(cel[6])});
      }
    });
    return {secoes: secoes.filter(s => s.ultima), contatos};
  }
  lerPlanilha(a) { const ult = a.getLastRow(); return MatrizCPT.ler(ult ? a.getRange(1, 1, ult, 8).getValues() : []); }
  /** Escreve um contato aprovado. Devolve o texto do que aconteceu; lança erro se não achar onde escrever. */
  escrever(a, c) {
    const m = this.lerPlanilha(a), chave = c.planilha && c.planilha.chave;
    const valores = [c.nome, c.pessoa, c.endereco, c.telefone, c.email, c.observacao, c.atualizacao ? new Date(c.atualizacao + 'T12:00:00Z') : ''].map(AnexosCPT.valor);
    if (chave) {
      const achados = m.contatos.filter(x => MatrizCPT.chave(x) === chave), noLugar = achados.filter(x => x.secao === c.secao), alvo = noLugar.length === 1 ? noLugar[0] : achados.length === 1 ? achados[0] : null;
      if (!alvo) throw new Error(achados.length ? 'O contato aparece em mais de uma linha da Matriz.' : 'A linha do contato não foi achada na Matriz (o nome foi mudado à mão?).');
      a.getRange(alvo.linha, 2, 1, 7).setValues([valores]); return 'linha ' + alvo.linha + ' atualizada';
    }
    const s = m.secoes.find(x => x.nome === c.secao); if (!s) throw new Error('A seção "' + c.secao + '" não foi achada na Matriz.');
    a.insertRowAfter(s.ultima); a.getRange(s.ultima, 2, 1, 7).copyTo(a.getRange(s.ultima + 1, 2, 1, 7), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    a.getRange(s.ultima + 1, 2, 1, 7).setValues([valores]); return 'incluído na linha ' + (s.ultima + 1);
  }
  /** Grava na planilha e registra o resultado no contato (sem lançar: falhas ficam "a gravar"). */
  gravarNaPlanilha(c, a) {
    let r;
    try { a = a || this.abaPlanilha(); const feito = this.escrever(a, c); r = {...c, planilha: {chave: MatrizCPT.chave(c), gravadoEm: new Date().toISOString(), pendente: false, erro: ''}, historico: (c.historico || []).concat([this.evento('Gravado na Matriz', feito)])}; }
    catch (e) { r = {...c, planilha: {...(c.planilha || {}), pendente: true, erro: e.message}}; }
    return this.col.gravar(r, c.versao, 'OP-MSP-' + Utilities.getUuid());
  }

  // ---------------- Leitura ----------------
  publico(c) {
    const pode = MatrizCPT.pode(this.ctx.perfil);
    return {id: c.id, versao: c.versao, secao: c.secao, nome: c.nome, pessoa: c.pessoa, endereco: c.endereco, telefone: c.telefone, email: c.email, observacao: c.observacao, atualizacao: c.atualizacao,
      ativo: c.ativo !== false, situacao: c.situacao, proposta: c.proposta || null, historico: c.historico || [], aGravar: !!(c.planilha && c.planilha.pendente), erroPlanilha: pode && c.planilha ? c.planilha.erro || '' : ''};
  }
  listar() {
    const itens = this.col.itens(), secoes = [...new Set(itens.filter(c => c.situacao !== 'recusado').map(c => c.secao))];
    const config = AplicacaoCPT.config();
    return {itens: itens.filter(c => c.situacao !== 'recusado').map(c => this.publico(c)).sort((x, y) => (x.nome || '').localeCompare(y.nome || '', 'pt-BR')), secoes: (config.matrizSecoes || secoes),
      importada: !!config.matrizImportadaEm, importadaEm: config.matrizImportadaEm || '', podeAprovar: MatrizCPT.pode(this.ctx.perfil), campos: MatrizCPT.rotulos};
  }
  /** Para a busca geral e as ferramentas: só os aprovados e ativos, com o essencial. */
  static busca(ctx) {
    try { return new ColecaoCPT(ctx, MatrizCPT.aba, 'MSP').itens().filter(c => c.situacao === 'aprovado' && c.ativo !== false).map(c => ({id: c.id, nome: c.nome, pessoa: c.pessoa, telefone: c.telefone, email: c.email, secao: c.secao})); }
    catch (_) { return []; }
  }

  // ---------------- Importar (uma vez) ----------------
  importar() {
    if (!MatrizCPT.pode(this.ctx.perfil)) throw new Error('Importar a Matriz é da Gestão e do Administrativo.');
    const config = AplicacaoCPT.config(); if (config.matrizImportadaEm || this.col.itens().length) throw new Error('A Matriz já foi importada. A partir de agora, a aplicação é a fonte: proponha as mudanças por aqui.');
    const m = this.lerPlanilha(this.abaPlanilha()); if (!m.contatos.length) throw new Error('Nenhum contato foi achado na aba Matriz de Contatos. Nada foi importado.');
    const lote = m.contatos.map(x => ({idFixo: 'MSP-' + Utilities.getUuid(), item: {secao: x.secao, nome: x.nome, pessoa: x.pessoa, endereco: x.endereco, telefone: x.telefone, email: x.email, observacao: x.observacao,
      atualizacao: /^\d{4}-\d{2}-\d{2}$/.test(x.atualizacao) ? x.atualizacao : '', atualizacaoTexto: /^\d{4}-\d{2}-\d{2}$/.test(x.atualizacao) ? '' : x.atualizacao, ativo: true, situacao: 'aprovado', proposta: null,
      planilha: {chave: MatrizCPT.chave(x), gravadoEm: '', pendente: false, erro: ''}, historico: [this.evento('Importado da planilha', 'linha ' + x.linha + ' · ' + x.secao)]}}));
    this.col.gravarLote(lote, 'OP-MSP-IMPORT-' + Utilities.getUuid());
    const atual = AplicacaoCPT.config(); atual.matrizImportadaEm = new Date().toISOString(); atual.matrizSecoes = m.secoes.map(s => s.nome);
    PropertiesService.getScriptProperties().setProperty(AplicacaoCPT.chave, JSON.stringify(atual));
    return {resultado: m.contatos.length + ' contatos importados de ' + m.secoes.length + ' seções.', importados: m.contatos.length, secoes: m.secoes.length};
  }

  // ---------------- Propor, aprovar, recusar ----------------
  validar(p) {
    const T = ColecaoCPT.texto, c = {nome: T(p.nome, 200, 'nome, função ou cargo', true), pessoa: T(p.pessoa, 160, 'pessoa de contato'), endereco: T(p.endereco, 300, 'endereço'),
      telefone: T(p.telefone, 80, 'telefone'), email: T(p.email, 160, 'e-mail').toLowerCase(), observacao: T(p.observacao, 1000, 'observação')};
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) throw new Error('Confira o e-mail.');
    if (!c.pessoa && !c.telefone && !c.email && !c.endereco) throw new Error('Informe ao menos a pessoa de contato, o telefone, o e-mail ou o endereço.');
    return c;
  }
  /** p: {id?, tipo: 'novo'|'alteracao'|'inativar'|'reativar', secao?, campos..., motivo?, versao, operacaoId}. */
  propor(p) {
    p = p || {}; const tipo = ColecaoCPT.opcao(p.tipo, ['novo', 'alteracao', 'inativar', 'reativar'], 'tipo de proposta'), motivo = ColecaoCPT.texto(p.motivo, 500, 'motivo', tipo === 'inativar');
    const proposta = {tipo, por: this.ctx.email, nome: this.ctx.perfil.nome, em: new Date().toISOString(), motivo};
    if (tipo === 'novo') {
      const secoes = this.listar().secoes; if (!secoes.includes(p.secao)) throw new Error('Escolha a seção da Matriz.');
      proposta.campos = this.validar(p); proposta.secao = p.secao;
      const dup = this.col.itens().find(x => x.situacao !== 'recusado' && MatrizCPT.chave(x.situacao === 'pendente' && x.proposta ? x.proposta.campos : x) === MatrizCPT.chave(proposta.campos));
      if (dup) throw new Error('Esse contato já está na Matriz (ou aguardando aprovação). Proponha a alteração nele.');
      const e = this.col.gravar({secao: p.secao, nome: '', pessoa: '', endereco: '', telefone: '', email: '', observacao: '', atualizacao: '', ativo: true, situacao: 'pendente', proposta, planilha: {chave: '', pendente: false},
        historico: [this.evento('Proposto', 'Contato novo em ' + p.secao + (motivo ? ' · ' + motivo : ''))]}, 0, p.operacaoId);
      return {resultado: 'Contato proposto. Ele entra na Matriz quando a Gestão ou o Administrativo aprovar.', contato: this.publico(e)};
    }
    const c = this.col.obter(String(p.id || '')); if (!c || c.situacao !== 'aprovado') throw new Error('Contato não encontrado.');
    if (c.proposta) throw new Error('Este contato já tem uma proposta aguardando aprovação.');
    if (tipo === 'alteracao') {
      proposta.campos = this.validar(p); const mudou = MatrizCPT.campos.filter(k => String(proposta.campos[k] || '') !== String(c[k] || ''));
      if (!mudou.length) throw new Error('Nada mudou em relação ao contato atual.');
    }
    if (tipo === 'inativar' && c.ativo === false) throw new Error('O contato já está inativo.');
    if (tipo === 'reativar' && c.ativo !== false) throw new Error('O contato já está ativo.');
    const e = this.col.gravar({...c, proposta, historico: (c.historico || []).concat([this.evento('Proposto', {alteracao: 'Alteração', inativar: 'Inativar', reativar: 'Reativar'}[tipo] + (motivo ? ' · ' + motivo : ''))])}, p.versao, p.operacaoId);
    return {resultado: 'Proposta enviada para aprovação da Gestão ou do Administrativo.', contato: this.publico(e)};
  }
  static diferencas(antes, depois) { return MatrizCPT.campos.filter(k => String(depois[k] || '') !== String(antes[k] || '')).map(k => MatrizCPT.rotulos[k] + ': "' + (antes[k] || '—') + '" → "' + (depois[k] || '—') + '"'); }
  decidir(p) {
    if (!MatrizCPT.pode(this.ctx.perfil)) throw new Error('Aprovar contatos da Matriz é da Gestão e do Administrativo.');
    p = p || {}; const c = this.col.obter(String(p.id || '')); if (!c || !c.proposta) throw new Error('Não há proposta para decidir neste contato.');
    const aprovar = p.decisao === 'aprovar', pr = c.proposta;
    if (!aprovar) {
      const motivo = ColecaoCPT.texto(p.motivo, 500, 'motivo da recusa', true);
      const e = this.col.gravar({...c, proposta: null, situacao: pr.tipo === 'novo' ? 'recusado' : c.situacao, historico: (c.historico || []).concat([this.evento('Recusado', motivo)])}, p.versao, p.operacaoId);
      return {resultado: 'Proposta recusada. O motivo ficou no histórico.', contato: this.publico(e)};
    }
    let novo = {...c, proposta: null, situacao: 'aprovado', atualizacao: this.hoje()}, detalhe = '';
    if (pr.tipo === 'novo') { novo = {...novo, ...pr.campos, secao: pr.secao}; detalhe = 'Contato novo de ' + (pr.nome || pr.por); }
    if (pr.tipo === 'alteracao') { detalhe = MatrizCPT.diferencas(c, pr.campos).join('; '); novo = {...novo, ...pr.campos}; }
    const data = this.hoje().split('-').reverse().join('/');
    // A observação de antes fica guardada: reativar devolve exatamente o que estava.
    if (pr.tipo === 'inativar') { novo.ativo = false; novo.observacaoAtiva = c.observacao || ''; novo.observacao = ('Inativo desde ' + data + '.' + (pr.motivo ? ' ' + pr.motivo.replace(/[.\s]+$/, '') + '.' : '') + ' ' + (c.observacao || '')).trim().slice(0, 1000); detalhe = 'Inativado' + (pr.motivo ? ': ' + pr.motivo : ''); }
    if (pr.tipo === 'reativar') { novo.ativo = true; novo.observacao = c.observacaoAtiva != null ? c.observacaoAtiva : String(c.observacao || '').replace(/^Inativo desde [^.]*\.\s*/, ''); delete novo.observacaoAtiva; detalhe = 'Reativado'; }
    novo.historico = (c.historico || []).concat([this.evento('Aprovado', detalhe + ' · proposto por ' + (pr.nome || pr.por))]);
    const e = this.col.gravar(novo, p.versao, p.operacaoId), g = this.gravarNaPlanilha(e);
    return {resultado: g.planilha.pendente ? 'Aprovado. A planilha não foi atualizada agora (' + g.planilha.erro + '); a rotina tenta de novo.' : 'Aprovado e gravado na Matriz.', contato: this.publico(g)};
  }
  /** Rotina: tenta de novo os aprovados que ficaram "a gravar". */
  gravarPendentes() {
    const lista = this.col.itens().filter(c => c.situacao === 'aprovado' && c.planilha && c.planilha.pendente); if (!lista.length) return {gravados: 0, faltam: 0};
    let a = null; try { a = this.abaPlanilha(); } catch (e) { return {gravados: 0, faltam: lista.length, erro: e.message}; }
    const r = lista.map(c => this.gravarNaPlanilha(c, a)); return {gravados: r.filter(c => !c.planilha.pendente).length, faltam: r.filter(c => c.planilha.pendente).length};
  }
}

function listarMatrizCPT() { return ColecaoCPT.executar('matriz.listar', ctx => new MatrizCPT(ctx).listar()); }
function importarMatrizCPT() { return ColecaoCPT.executar('matriz.importar', ctx => new MatrizCPT(ctx).importar(), true); }
function proporMatrizCPT(p) { return ColecaoCPT.executar('matriz.propor', ctx => new MatrizCPT(ctx).propor(p), true); }
function decidirMatrizCPT(p) { return ColecaoCPT.executar('matriz.decidir', ctx => new MatrizCPT(ctx).decidir(p), true); }

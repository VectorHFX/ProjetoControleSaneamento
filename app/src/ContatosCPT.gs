/**
 * ContatosCPT 2.8.0. Matriz de contatos comum: todos consultam e cadastram.
 * Cada contato tem uma observação interna e o "caderno de registros" (cada conversa feita: data, canal e resumo),
 * que só cresce. Edita o cadastro: quem criou, a Comunicação, a Gestão e o Administrativo.
 * Dados ficam na planilha de dados da aplicação (não no GitHub e não em planilhas soltas).
 */
class ContatosCPT {
  static get tipos() { return ['Equipe interna', 'Consórcio / Concrejato', 'Sabesp', 'Poder público', 'Equipamento público (escola, UBS, CRAS)', 'Liderança comunitária', 'Comércio', 'Imprensa', 'Morador', 'Fornecedor', 'Outro']; }
  static get canais() { return ['Telefone', 'WhatsApp', 'E-mail', 'Presencial', 'Reunião', 'Outro']; }
  static get cores() { return ['azul', 'verde', 'amarelo', 'vermelho', 'cinza']; }
  constructor(ctx) { this.ctx = ctx; this.col = new ColecaoCPT(ctx, 'Contatos', 'CON'); }
  podeEditar(c) { return !c || c.criadoPor === this.ctx.email || PerfisCPT.gerencia(this.ctx.perfil) || this.ctx.perfil.papeis.includes('comunicacao'); }
  publico(c) { return {...c, podeEditar: this.podeEditar(c)}; }
  listar() {
    const itens = this.col.itens().filter(c => !c.arquivado).map(c => this.publico(c)).sort((a, b) => (a.nome || a.instituicao).localeCompare(b.nome || b.instituicao, 'pt-BR'));
    return {itens, tipos: ContatosCPT.tipos, canais: ContatosCPT.canais, podeCadastrar: true};
  }
  salvar(p) {
    p = p || {}; const antigo = p.id ? this.col.obter(String(p.id)) : null;
    if (p.id && !antigo) throw new Error('Contato não encontrado.');
    if (antigo && !this.podeEditar(antigo)) throw new Error('Este cadastro é editado por quem criou, pela Comunicação ou pela Gestão. Você pode registrar uma conversa nele.');
    const T = ColecaoCPT.texto, c = {
      nome: T(p.nome, 120, 'nome'), instituicao: T(p.instituicao, 200, 'instituição, função ou cargo'), tipo: ColecaoCPT.opcao(p.tipo, ContatosCPT.tipos, 'tipo'),
      telefone: T(p.telefone, 60, 'telefone'), email: T(p.email, 160, 'e-mail').toLowerCase(), endereco: T(p.endereco, 300, 'endereço'), bairro: T(p.bairro, 120, 'bairro'),
      frente: T(p.frente, 200, 'frente de obra'), etiquetas: T(p.etiquetas, 200, 'etiquetas'), observacao: T(p.observacao, 2000, 'observação interna'),
      cor: ContatosCPT.cores.includes(p.cor) ? p.cor : 'azul', arquivado: p.arquivado === true, registros: antigo ? antigo.registros || [] : []};
    if (!c.nome && !c.instituicao) throw new Error('Informe o nome da pessoa ou a instituição.');
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) throw new Error('Confira o e-mail.');
    if (!antigo) { const n = DadosDaAplicacao.norm, chave = n(c.nome + '|' + c.instituicao), dup = this.col.itens().find(x => !x.arquivado && n(x.nome + '|' + x.instituicao) === chave);
      if (dup && p.confirmarDuplicado !== true) throw new Error('Já existe um contato com este nome e instituição. Procure na lista antes de cadastrar de novo.'); }
    const e = this.col.gravar({...c, id: antigo ? antigo.id : ''}, antigo ? Number(p.versao) : 0, p.operacaoId);
    return {resultado: c.arquivado ? 'Contato arquivado (continua no histórico).' : 'Contato salvo.', contato: this.publico(e)};
  }
  /** Registro de uma conversa com o contato. Qualquer pessoa da equipe pode registrar. */
  registrar(p) {
    p = p || {}; const c = this.col.obter(String(p.id || '')); if (!c) throw new Error('Contato não encontrado.');
    const novo = {...c, registros: (c.registros || []).concat([{em: ColecaoCPT.data(p.data, 'data', true), canal: ColecaoCPT.opcao(p.canal, ContatosCPT.canais, 'canal'),
      texto: ColecaoCPT.texto(p.texto, 1500, 'resumo da conversa', true), autor: this.ctx.email, nome: this.ctx.perfil.nome, registradoEm: new Date().toISOString()}])};
    return {resultado: 'Conversa registrada no contato.', contato: this.publico(this.col.gravar(novo, c.versao, p.operacaoId))};
  }
}

function listarContatosCPT() { return ColecaoCPT.executar('contatos.listar', ctx => new ContatosCPT(ctx).listar()); }
function salvarContatoCPT(p) { return ColecaoCPT.executar('contatos.salvar', ctx => new ContatosCPT(ctx).salvar(p), true); }
function registrarConversaContatoCPT(p) { return ColecaoCPT.executar('contatos.registrar', ctx => new ContatosCPT(ctx).registrar(p), true); }

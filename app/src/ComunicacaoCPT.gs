/**
 * ComunicacaoCPT. Ferramentas que vieram da antiga Comunicação:
 * - LembretesCPT: tarefas com data "para quem" (2.30: entram no checklist do Meu espaço).
 * - MateriaisCPT: pasta de links e materiais (título, link, observação, responsável, prazo, situação).
 */
/**
 * LembretesCPT 2.30: tarefa com data "para quem" (uma pessoa ou uma frente), que entra no checklist do Meu espaço.
 * Todo o time cria e recebe. Quem recebe marca no próprio checklist (pontua como qualquer tarefa); aí o lembrete fica feito.
 * Lembretes antigos (Social/Comunicação, sem responsável) aparecem para quem é dessas frentes.
 */
class LembretesCPT {
  static pode() { return true; }
  static get tipos() { return {acao: 'Ação socioambiental', material: 'Material de comunicação'}; }
  constructor(ctx) { this.ctx = ctx; this.col = new ColecaoCPT(ctx, 'Lembretes', 'LEM'); this.papeis = ctx.perfil.papeis.filter(x => x !== 'administrador'); }
  /** Para mim: eu sou o responsável, ou não tem responsável e é da minha frente. */
  paraMim(l) { return l.responsavel ? l.responsavel === this.ctx.email : (l.frentes || []).some(f => this.papeis.includes(f)); }
  visivel(l) { return this.paraMim(l) || l.criadoPor === this.ctx.email; }
  listar() { return {itens: this.col.itens().filter(l => this.visivel(l)).sort((a, b) => (a.data || '9999').localeCompare(b.data || '9999')), pessoas: ColecaoCPT.pessoas(this.ctx), hoje: ColecaoCPT.hoje(), tipos: LembretesCPT.tipos}; }
  /** Os do dia (e, hoje, também os atrasados que ainda não foram feitos), prontos para o checklist. */
  doDia(dia) {
    const hoje = ColecaoCPT.hoje(), pessoas = ColecaoCPT.pessoas(this.ctx), nome = e => (pessoas.find(x => x.email === e) || {nome: e ? e.split('@')[0] : ''}).nome;
    const NOMES = {atendimento: 'Atendimento', socioambiental: 'Socioambiental', comunicacao: 'Comunicação', comercializacao: 'Comercialização', gestao: 'Gestão', administrativo: 'Administrativo'};
    return this.col.itens().filter(l => this.visivel(l) && (l.data === dia || (dia === hoje && l.data < hoje && l.situacao !== 'feito')))
      .sort((a, b) => a.data.localeCompare(b.data))
      .map(l => ({id: l.id, titulo: l.titulo, data: l.data, feito: l.situacao === 'feito', feitoPor: l.feitoPor ? nome(l.feitoPor) : '', meu: l.feitoPor === this.ctx.email, atrasado: l.data < hoje && l.situacao !== 'feito',
        de: l.criadoPor && l.criadoPor !== this.ctx.email ? (l.nomeAutor || nome(l.criadoPor)) : '', para: this.paraMim(l) ? '' : (l.responsavel ? nome(l.responsavel) : (l.frentes || []).map(f => NOMES[f] || f).join(', '))}));
  }
  salvar(p) {
    p = p || {}; const antigo = p.id ? this.col.obter(String(p.id)) : null; if (p.id && !antigo) throw new Error('Lembrete não encontrado.');
    if (antigo && antigo.criadoPor !== this.ctx.email) throw new Error('Só quem criou pode mudar este lembrete.');
    const pessoas = ColecaoCPT.pessoas(this.ctx).map(x => x.email), T = ColecaoCPT.texto;
    if (p.responsavel && !pessoas.includes(p.responsavel)) throw new Error('Escolha a pessoa na lista.');
    const frentes = p.responsavel ? [] : [...new Set(Array.isArray(p.frentes) ? p.frentes : [])].filter(f => RecadosCPT.frentes.includes(f));
    if (!p.responsavel && !frentes.length) throw new Error('Escolha para quem é a tarefa: uma pessoa ou uma frente.');
    const l = {tipo: p.tipo ? ColecaoCPT.opcao(p.tipo, Object.keys(LembretesCPT.tipos), 'tipo') : 'acao', titulo: T(p.titulo, 140, 'tarefa', true), data: ColecaoCPT.data(p.data, 'data', true),
      detalhe: T(p.detalhe, 1500, 'detalhes'), material: T(p.material, 600, 'materiais necessários'), frentes, responsavel: p.responsavel || '', nomeAutor: antigo ? antigo.nomeAutor || '' : this.ctx.perfil.nome,
      evento: antigo ? antigo.evento || null : null, situacao: antigo ? antigo.situacao : 'pendente', feitoEm: antigo ? antigo.feitoEm || '' : '', feitoPor: antigo ? antigo.feitoPor || '' : ''};
    return {resultado: 'Tarefa enviada. Aparece no checklist de quem recebe, no dia marcado.', lembrete: this.col.gravar({...l, id: antigo ? antigo.id : ''}, antigo ? Number(p.versao) : 0, p.operacaoId)};
  }
  /** Feito ou desfeito (pelo checklist de quem recebe). Desfazer só quem fez. */
  concluir(p) {
    p = p || {}; const l = this.col.obter(String(p.id || '')); if (!l || !this.visivel(l)) throw new Error('Lembrete não encontrado.');
    const feito = p.feito !== false;
    if ((l.situacao === 'feito') === feito) return {resultado: 'Sem mudança.', lembrete: l};
    if (!feito && l.feitoPor && l.feitoPor !== this.ctx.email) throw new Error('Quem marcou como feito foi outra pessoa.');
    const novo = {...l, situacao: feito ? 'feito' : 'pendente', feitoEm: feito ? new Date().toISOString() : '', feitoPor: feito ? this.ctx.email : ''};
    return {resultado: feito ? 'Feito! Lembrete concluído.' : 'Lembrete voltou para pendente.', lembrete: this.col.gravar(novo, l.versao, p.operacaoId || 'OP-' + Utilities.getUuid())};
  }
  /** Para o contador do menu: os meus, pendentes, de hoje ou atrasados. */
  pendentesHoje() { const hoje = ColecaoCPT.hoje(); return this.col.itens().filter(l => this.paraMim(l) && l.situacao !== 'feito' && l.data && l.data <= hoje).length; }
}

class MateriaisCPT {
  static pode(p) { return PerfisCPT.gerencia(p) || p.papeis.includes('comunicacao'); }
  static get tipos() { return ['Publicação em rede social', 'Matéria na mídia (jornal, rádio, TV, site)', 'Material impresso', 'Vídeo', 'Arte / peça digital', 'Apresentação', 'Referência / pasta de arquivos', 'Outro']; }
  static get situacoes() { return {afazer: 'A fazer', producao: 'Em produção', concluido: 'Concluído'}; }
  // 2.29: Materiais é Ferramenta extra — todo o time vê; criar, editar e concluir continua com a Comunicação e a Gestão.
  constructor(ctx) { this.ctx = ctx; this.col = new ColecaoCPT(ctx, 'Materiais', 'MAT');
  }
  /** Competência do material: quando foi publicado/entregue; antes disso, o prazo. */
  static mes(m) { return String(m.publicadoEm || m.prazo || m.criadoEm || '').slice(0, 7); }
  listar(mes) {
    const itens = this.col.itens().filter(m => !m.arquivado).sort((a, b) => (a.situacao === 'concluido') - (b.situacao === 'concluido') || (a.prazo || '9999').localeCompare(b.prazo || '9999'));
    return {itens, pessoas: ColecaoCPT.pessoas(this.ctx), tipos: MateriaisCPT.tipos, situacoes: MateriaisCPT.situacoes, resumo: MateriaisCPT.resumo(itens, mes), hoje: ColecaoCPT.hoje(), podeEditar: MateriaisCPT.pode(this.ctx.perfil)};
  }
  salvar(p) {
    if (!MateriaisCPT.pode(this.ctx.perfil)) throw new Error('Criar e editar materiais é da Comunicação e da Gestão.');
    p = p || {}; const antigo = p.id ? this.col.obter(String(p.id)) : null; if (p.id && !antigo) throw new Error('Material não encontrado.');
    const T = ColecaoCPT.texto, pessoas = ColecaoCPT.pessoas(this.ctx).map(x => x.email);
    if (p.responsavel && !pessoas.includes(p.responsavel)) throw new Error('Escolha o responsável na lista.');
    const n = (v, campo) => { const s = String(v == null ? '' : v).trim().replace(/\./g, ''); if (!s) return null; if (!/^\d{1,9}$/.test(s)) throw new Error(campo + ': use só números inteiros.'); return Number(s); };
    const situacao = ColecaoCPT.opcao(p.situacao || 'afazer', Object.keys(MateriaisCPT.situacoes), 'situação');
    const m = {titulo: T(p.titulo, 160, 'título', true), url: ColecaoCPT.url(p.url, 'link'), tipo: ColecaoCPT.opcao(p.tipo, MateriaisCPT.tipos, 'tipo'), observacao: T(p.observacao, 2000, 'observação'),
      canal: T(p.canal, 120, 'onde foi publicado'), responsavel: p.responsavel || '', prazo: ColecaoCPT.data(p.prazo, 'prazo'), situacao,
      publicadoEm: ColecaoCPT.data(p.publicadoEm, 'data de publicação ou entrega'), alcance: n(p.alcance, 'Pessoas alcançadas'), quantidade: n(p.quantidade, 'Quantidade entregue'),
      concluidoEm: situacao === 'concluido' ? (antigo && antigo.concluidoEm) || new Date().toISOString() : '', arquivado: p.arquivado === true};
    if (situacao === 'concluido' && !m.publicadoEm) m.publicadoEm = ColecaoCPT.hoje();
    return {resultado: m.arquivado ? 'Material arquivado (continua no histórico).' : situacao === 'concluido' ? 'Material concluído e guardado no mês.' : 'Material salvo.', material: this.col.gravar({...m, id: antigo ? antigo.id : ''}, antigo ? Number(p.versao) : 0, p.operacaoId)};
  }
  /** O que a Comunicação fez no mês (só concluídos): números do Programa Parceiros (linhas 32 a 34) e dos Anexos. */
  static resumo(itens, mes) {
    const feitos = itens.filter(m => m.situacao === 'concluido' && !m.arquivado && MateriaisCPT.mes(m) === mes), t = MateriaisCPT.tipos;
    const pub = feitos.filter(m => m.tipo === t[0] || m.tipo === t[1]);
    return {mes, concluidos: feitos.length, publicacoes: pub.length, alcance: pub.reduce((s, m) => s + (m.alcance || 0), 0), semAlcance: pub.filter(m => m.alcance == null).length,
      temas: pub.map(m => m.titulo + (m.canal ? ' (' + m.canal + ')' : '')), impressos: feitos.filter(m => m.tipo === t[2]).reduce((s, m) => s + (m.quantidade || 0), 0),
      videos: feitos.filter(m => m.tipo === t[3]).length, ferramentas: feitos.filter(m => [t[2], t[3], t[4], t[5]].includes(m.tipo)).length};
  }
}

function salvarLembreteCPT(p) { return ColecaoCPT.executar('lembretes.salvar', ctx => new LembretesCPT(ctx).salvar(p), true); }
function listarMateriaisCPT(mes) { return ColecaoCPT.executar('materiais.listar', ctx => new MateriaisCPT(ctx).listar(/^\d{4}-\d{2}$/.test(String(mes)) ? String(mes) : ColecaoCPT.hoje().slice(0, 7))); }
function salvarMaterialCPT(p) { return ColecaoCPT.executar('materiais.salvar', ctx => new MateriaisCPT(ctx).salvar(p), true); }

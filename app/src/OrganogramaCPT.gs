/**
 * OrganogramaCPT 2.26.0. Organograma da equipe (página "Organograma"): quem é quem, em que área, e a quem responde.
 * - Coleção "Organograma" (IDs ORG-…) na planilha de dados da aplicação: os nomes ficam lá, nunca no GitHub.
 * - Todos da equipe veem (serve para orientar quem chega). Editam: Gestão e Administrativo.
 *   Período de testes: a página inteira é só do proprietário (como o Álbum e o Mapa), até liberarConfiguracaoCPT.
 * - "Trazer da equipe": cria um cartão para cada pessoa ativa de Equipe e acessos que ainda não está no organograma.
 * - Os downloads (imagem PNG, SVG e PDF pela impressão) são feitos no navegador, a partir do mesmo desenho da tela.
 */
class OrganogramaCPT {
  static get aba() { return 'Organograma'; }
  static get areas() {
    return {gestao: 'Gestão', administrativo: 'Administrativo', socioambiental: 'Socioambiental', comunicacao: 'Comunicação', atendimento: 'Atendimento',
      comercializacao: 'Comercialização', campo: 'Campo e mobilização', parceiros: 'Consórcio e parceiros'};
  }
  constructor(ctx) { this.ctx = ctx; this.col = ColecaoCPT.de(ctx, OrganogramaCPT.aba, 'ORG'); }
  podeEditar() { return PerfisCPT.gerencia(this.ctx.perfil) && (!PerfisCPT.travada() || this.ctx.perfil.papeis.includes('administrador')); }
  exigirEditar() {
    if (!PerfisCPT.gerencia(this.ctx.perfil)) throw new Error('O organograma é editado pela Gestão e pelo Administrativo.');
    PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Editar o organograma');
  }
  itens() { return ColecaoCPT.existe(this.ctx, OrganogramaCPT.aba) ? this.col.itens() : []; }
  static publico(x) { return {id: x.id, versao: x.versao, nome: x.nome, cargo: x.cargo, area: x.area, chefia: x.chefia || '', desde: x.desde || '', ordem: Number(x.ordem) || 0, alteradoEm: x.alteradoEm}; }
  carregar() {
    if (PerfisCPT.travada() && !this.ctx.perfil.papeis.includes('administrador')) throw new Error('O organograma está reservado à administração técnica durante o período de testes.');
    const todos = this.itens(), ativos = todos.filter(x => x.ativo !== false), emails = new Set(todos.map(x => x.email).filter(Boolean));
    const fora = this.podeEditar() ? PerfisCPT.lista(this.ctx.config).filter(p => p.ativo && !emails.has(p.email)).length : 0;
    const atualizado = ativos.map(x => x.alteradoEm || '').sort().pop() || '';
    return {pessoas: ativos.map(OrganogramaCPT.publico).sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR')), areas: OrganogramaCPT.areas,
      podeEditar: this.podeEditar(), atualizadoEm: atualizado, foraDoOrganograma: fora};
  }
  salvar(p) {
    this.exigirEditar(); p = p || {};
    const antigo = p.id ? this.col.obter(String(p.id)) : null; if (p.id && !antigo) throw new Error('Pessoa não encontrada no organograma. Atualize a página.');
    const T = ColecaoCPT.texto, item = {
      nome: T(p.nome, 80, 'nome', true), cargo: T(p.cargo, 80, 'cargo ou função', true), area: ColecaoCPT.opcao(p.area, Object.keys(OrganogramaCPT.areas), 'área'),
      chefia: T(p.chefia, 80, 'responde a'), desde: T(p.desde, 30, 'desde quando'), ordem: Math.max(0, Math.min(99, Number(p.ordem) || 0)),
      ativo: p.ativo !== false, email: antigo ? antigo.email || '' : ''};
    if (item.chefia) {
      const ativos = this.itens().filter(x => x.ativo !== false), mapa = new Map(ativos.map(x => [x.id, x]));
      if (!mapa.has(item.chefia)) throw new Error('Escolha a quem a pessoa responde entre as pessoas do organograma.');
      if (antigo && item.chefia === antigo.id) throw new Error('A pessoa não pode responder a ela mesma.');
      // sem ciclos: subindo pela chefia, não pode voltar à própria pessoa
      let c = item.chefia, passos = 0; while (antigo && c && passos++ < 200) { if (c === antigo.id) throw new Error('Essa escolha forma um ciclo (alguém acabaria respondendo a si mesmo).'); c = (mapa.get(c) || {}).chefia; }
    }
    if (antigo && !item.ativo && this.itens().some(x => x.ativo !== false && x.chefia === antigo.id)) throw new Error('Antes de tirar esta pessoa, mude quem responde a ela.');
    const e = this.col.gravar({...item, id: antigo ? antigo.id : ''}, antigo ? Number(p.versao) : 0, p.operacaoId);
    return {resultado: item.ativo ? 'Organograma atualizado.' : 'Pessoa tirada do organograma (fica no histórico).', pessoa: OrganogramaCPT.publico(e)};
  }
  /** Cria um cartão para cada pessoa ativa da equipe que ainda não está no organograma (cargo pela função principal). */
  importar(p) {
    this.exigirEditar(); p = p || {};
    if (typeof p.operacaoId !== 'string' || !/^OP-[\w-]{8,60}$/.test(p.operacaoId)) throw new Error('Operação inválida. Recarregue a página.');
    const emails = new Set(this.itens().map(x => x.email).filter(Boolean)), N = PerfisCPT.nomes, adm = this.ctx.config.administrador;
    const novos = PerfisCPT.lista(this.ctx.config).filter(x => x.ativo && !emails.has(x.email));
    novos.forEach((x, i) => {
      const papel = x.email === adm ? 'administrativo' : (x.papeis.find(k => k !== 'administrador') || 'administrativo');
      this.col.gravar({nome: x.nome, cargo: N[papel] || 'Equipe', area: OrganogramaCPT.areas[papel] ? papel : 'administrativo', chefia: '', desde: '', ordem: 0, ativo: true, email: x.email}, 0, p.operacaoId + '-' + i);
    });
    return {resultado: novos.length ? novos.length + (novos.length === 1 ? ' pessoa entrou' : ' pessoas entraram') + ' no organograma. Agora ajuste cargo e a quem cada uma responde.' : 'Toda a equipe já está no organograma.', ...this.carregar()};
  }
}

function carregarOrganogramaCPT() { return ColecaoCPT.executar('organograma.carregar', ctx => new OrganogramaCPT(ctx).carregar()); }
function salvarOrganogramaCPT(p) { return ColecaoCPT.executar('organograma.salvar', ctx => new OrganogramaCPT(ctx).salvar(p), true); }
function importarOrganogramaCPT(p) { return ColecaoCPT.executar('organograma.importar', ctx => new OrganogramaCPT(ctx).importar(p), true); }

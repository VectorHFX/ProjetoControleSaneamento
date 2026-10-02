/**
 * PerfisCPT 2.7.0. Cadastro de pessoas e papéis (Script Properties: CPT_PESSOA:<email>).
 * administrador  = administração técnica: SÓ o proprietário (concede acessos). Não se atribui a outras pessoas.
 * administrativo = todas as ferramentas de trabalho, sem conceder acessos.
 * gestao         = mesmos poderes do Administrativo: vê e faz tudo (acompanha, cobra e ensina a equipe).
 *                  O que difere são as visões pessoais e, no futuro, ferramentas próprias (pauta, caderno).
 * A engenharia (Concrejato) não entra na aplicação: usa o formulário de Execução e a planilha compartilhada.
 * 2.7: trava de configuração (CPT_TRAVA_CONFIG, ligada por padrão). Enquanto ligada, SÓ o proprietário altera
 *      cadastros e papéis, o catálogo de obras, os conectores e publica nas planilhas oficiais.
 *      Desligar: executar liberarConfiguracaoCPT no editor (não há botão na tela para isso).
 */
class PerfisCPT {
  static get papeis() { return ['administrador', 'administrativo', 'gestao', 'atendimento', 'socioambiental', 'comunicacao', 'comercializacao']; }
  /** Papéis que podem ser dados à equipe em Equipe e acessos. */
  static get atribuiveis() { return ['administrativo', 'gestao', 'atendimento', 'socioambiental', 'comunicacao', 'comercializacao']; }
  static get nomes() { return {administrador: 'Administração técnica', administrativo: 'Administrativo', gestao: 'Gestão', atendimento: 'Atendimento',
    socioambiental: 'Socioambiental', comunicacao: 'Comunicação', comercializacao: 'Comercialização'}; }
  static todos() {
    const p = PropertiesService.getScriptProperties().getProperties();
    return Object.keys(p).filter(k => k.startsWith('CPT_PESSOA:')).map(k => JSON.parse(p[k])).map(x => ({...x, papeis: (x.papeis || []).filter(y => this.atribuiveis.includes(y))})).sort((a, b) => a.nome.localeCompare(b.nome));
  }
  /** O proprietário sempre entra com todos os papéis. Os demais, pelo cadastro ativo. */
  static obter(email, c) {
    if (email === c.administrador) {
      const raw = PropertiesService.getScriptProperties().getProperty('CPT_PESSOA:' + email);
      const nome = raw ? JSON.parse(raw).nome : (c.nomeAdministrador || email.split('@')[0]);
      return {email, nome, papeis: this.papeis.slice(), ativo: true, versao: raw ? JSON.parse(raw).versao : 0};
    }
    const raw = PropertiesService.getScriptProperties().getProperty('CPT_PESSOA:' + email);
    const p = raw ? JSON.parse(raw) : null;
    // Papéis antigos (Execução, administração dada a terceiros) deixam de valer sem precisar recadastrar.
    if (p) p.papeis = (p.papeis || []).filter(x => this.atribuiveis.includes(x));
    if (!p || !p.ativo) throw new Error('Sua conta (' + email + ') ainda não está cadastrada ou está inativa. Peça à administração técnica para liberar seu acesso em Equipe e acessos.');
    return p;
  }
  /** Quem vê e faz tudo: Administrativo, Gestão (e o proprietário). */
  static gerencia(p) { return p.papeis.some(x => ['administrador', 'administrativo', 'gestao'].includes(x)); }
  static visaoCompleta(p) { return this.gerencia(p); }
  /** Período de testes: a configuração fica só com o proprietário até ele liberar no editor. */
  static travada() { return PropertiesService.getScriptProperties().getProperty('CPT_TRAVA_CONFIG') !== 'liberada'; }
  static exigirConfiguracao(p, oQue) {
    if (p.papeis.includes('administrador')) return;
    if (this.travada()) throw new Error(oQue + ' está reservado à administração técnica durante o período de testes.');
  }
  static admin(p) { if (!p.papeis.includes('administrador')) throw new Error('Esta ação é exclusiva da administração técnica.'); }
  static lista(c) { return [this.obter(c.administrador, c), ...this.todos().filter(p => p.email !== c.administrador)]; }
  static salvar(ctx, p) {
    this.admin(ctx.perfil);
    if (!p || typeof p.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim()) || p.email.length > 180) throw new Error('Informe um e-mail válido.');
    const email = p.email.trim().toLowerCase();
    if (ctx.config.dominio && !email.endsWith('@' + ctx.config.dominio)) throw new Error('Cadastre a conta @' + ctx.config.dominio + ' da pessoa.');
    if (typeof p.nome !== 'string' || !p.nome.trim() || p.nome.length > 100 || !Array.isArray(p.papeis) || !p.papeis.length ||
      typeof p.ativo !== 'boolean') throw new Error('Confira o nome, as funções e a situação do acesso.');
    if (email === ctx.config.administrador) { if (!p.ativo) throw new Error('O proprietário permanece ativo e com administração técnica.'); p.papeis = this.papeis.slice(); }
    else if (p.papeis.some(x => !this.atribuiveis.includes(x))) throw new Error('Escolha entre Administrativo, Gestão, Atendimento, Socioambiental, Comunicação e Comercialização.');
    const key = 'CPT_PESSOA:' + email, props = PropertiesService.getScriptProperties();
    const anterior = JSON.parse(props.getProperty(key) || 'null'), versao = (anterior?.versao || 0) + 1;
    if (Number(p.versao || 0) !== (anterior?.versao || 0)) throw new Error('Este cadastro mudou. Reabra a equipe antes de salvar.');
    const novo = {email, nome: p.nome.trim(), papeis: [...new Set(p.papeis)], ativo: p.ativo, versao, alteradoEm: new Date().toISOString(), alteradoPor: ctx.email};
    props.setProperty(key, JSON.stringify(novo));
    // Histórico de acessos fica na planilha de dados da aplicação (não nas propriedades, que têm limite de tamanho).
    try { ObservacoesCPT.registrarAcesso(ctx.config, anterior, novo); } catch (e) { console.log('Histórico de acesso não registrado: ' + e.message); }
    return {resultado: 'Acesso salvo.', pessoa: novo};
  }
}

/** Execute no editor quando terminar os testes: Gestão e Administrativo voltam a editar obras e publicar entregas oficiais. Cadastros e papéis continuam só com o proprietário. */
function liberarConfiguracaoCPT() { PropertiesService.getScriptProperties().setProperty('CPT_TRAVA_CONFIG', 'liberada'); return {resultado: 'Configuração liberada para Gestão e Administrativo (obras e publicações oficiais). Cadastros e papéis continuam só com você.'}; }
/** Execute no editor para voltar a travar. */
function travarConfiguracaoCPT() { PropertiesService.getScriptProperties().deleteProperty('CPT_TRAVA_CONFIG'); return {resultado: 'Configuração travada: só você altera cadastros, obras, conectores e publicações oficiais.'}; }

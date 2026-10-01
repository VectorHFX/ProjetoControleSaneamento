/**
 * PerfisCPT 2.0.0. Cadastro de pessoas e papéis (Script Properties: CPT_PESSOA:<email>).
 * administrador  = administração técnica: concede acessos. Não é um papel de trabalho.
 * administrativo = todas as ferramentas de trabalho, sem conceder acessos.
 */
class PerfisCPT {
  static get papeis() { return ['administrador', 'administrativo', 'gestao', 'atendimento', 'execucao', 'socioambiental', 'comunicacao', 'comercializacao']; }
  static get nomes() { return {administrador: 'Administração técnica', administrativo: 'Administrativo', gestao: 'Gestão', atendimento: 'Atendimento', execucao: 'Execução',
    socioambiental: 'Socioambiental', comunicacao: 'Comunicação', comercializacao: 'Comercialização'}; }
  static todos() {
    const p = PropertiesService.getScriptProperties().getProperties();
    return Object.keys(p).filter(k => k.startsWith('CPT_PESSOA:')).map(k => JSON.parse(p[k])).sort((a, b) => a.nome.localeCompare(b.nome));
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
    if (!p || !p.ativo) throw new Error('Sua conta (' + email + ') ainda não está cadastrada ou está inativa. Peça à administração técnica para liberar seu acesso em Equipe e acessos.');
    return p;
  }
  /** Gestão e Administrativo têm visão completa do trabalho. */
  static gerencia(p) { return p.papeis.some(x => ['administrador', 'administrativo', 'gestao'].includes(x)); }
  static admin(p) { if (!p.papeis.includes('administrador')) throw new Error('Esta ação é exclusiva da administração técnica.'); }
  static lista(c) { return [this.obter(c.administrador, c), ...this.todos().filter(p => p.email !== c.administrador)]; }
  static salvar(ctx, p) {
    this.admin(ctx.perfil);
    if (!p || typeof p.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim()) || p.email.length > 180) throw new Error('Informe um e-mail válido.');
    const email = p.email.trim().toLowerCase();
    if (ctx.config.dominio && !email.endsWith('@' + ctx.config.dominio)) throw new Error('Cadastre a conta @' + ctx.config.dominio + ' da pessoa.');
    if (typeof p.nome !== 'string' || !p.nome.trim() || p.nome.length > 100 || !Array.isArray(p.papeis) || !p.papeis.length ||
      p.papeis.some(x => !this.papeis.includes(x)) || typeof p.ativo !== 'boolean') throw new Error('Confira o nome, as funções e a situação do acesso.');
    if (email === ctx.config.administrador && (!p.ativo || !p.papeis.includes('administrador'))) throw new Error('O proprietário permanece ativo e com administração técnica.');
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

/**
 * RelatosCPT 2.16.0. Qualidade dos relatos de atividade e devolutiva privada da gestão.
 * - Conferência automática (sem nota e sem ranking): cada relato mostra o que já tem e o que falta, com dica.
 *   O quê · Onde · Público · Resultado · Encaminhamento · Tamanho. É uma ajuda para escrever, não uma avaliação de pessoa.
 * - Devolutiva: a Gestão ou o Administrativo devolve um relato com comentário. Só quem escreveu e a gerência veem.
 *   Quem escreveu marca como visto e pode responder. A resposta original do formulário nunca é alterada.
 * - Período de testes: devolver e responder ficam só com o proprietário (PerfisCPT.exigirConfiguracao).
 * - Dados na coleção "Devolutivas de relato" (uma linha por revisão).
 * 2.34 — ferramenta Relatos: os relatos do mês em cartões para toda a equipe. Os pontos de melhoria (o que a conferência
 *   achou faltando) aparecem só para quem fez a atividade (responsável e "Colaboradores de apoio na atividade") e para a
 *   Gestão e o Administrativo, que veem todos. "Abrir no RDAS" procura a ficha do relato na hora do clique.
 */
class RelatosCPT {
  static get minimo() { return 400; }
  static get criterios() {
    return [
      {chave: 'oque', nome: 'O quê', dica: 'Diga que atividade foi feita e com que tema (ex.: "Roda de conversa sobre descarte de óleo").'},
      {chave: 'onde', nome: 'Onde', dica: 'Informe o local: rua, escola, praça ou equipamento, além do bairro.'},
      {chave: 'publico', nome: 'Público', dica: 'Quem participou (moradores, alunos, comerciantes…) e quantas pessoas, em número.'},
      {chave: 'resultado', nome: 'Resultado', dica: 'Conte o que aconteceu: dúvidas que surgiram, o que as pessoas entenderam, materiais entregues.'},
      {chave: 'encaminhamento', nome: 'Encaminhamento', dica: 'O que fica para depois: retorno combinado, demanda levada a outra área ou "sem encaminhamentos".'},
      {chave: 'tamanho', nome: 'Tamanho', dica: 'Escreva ao menos 5 linhas: o relato vira texto do relatório para a Sabesp.'}];
  }
  /** Só "Relato de atividade" passa pela conferência. */
  static ehRelato(procedimento) { return DadosDaAplicacao.norm(procedimento) === 'relato de atividade'; }
  /**
   * x: {atividade, complemento, texto, objetivo, observacao, bairro, endereco, publico (número|null), publicoAlvo}.
   * Devolve {itens: [{chave, nome, ok, dica}], faltam: n}. Regras simples e explicáveis (palavras-chave), para a pessoa entender o porquê.
   */
  static conferir(x) {
    const n = v => DadosDaAplicacao.norm(v || ''), texto = n(x.texto), tudo = texto + ' ' + n(x.observacao);
    const ok = {
      oque: !!String(x.atividade || '').trim() && (!!String(x.complemento || '').trim() || texto.length >= 60),
      onde: !!String(x.endereco || '').trim() || /\b(rua|r\.|av\.|avenida|escola|praca|emef|ubs|cras|igreja|associacao|centro|quadra|viela|travessa)\b/.test(texto),
      publico: x.publico != null && x.publico > 0 && (!!String(x.publicoAlvo || '').trim() || /morador|aluno|crianca|comerciant|lideranc|professor|familia|idos|jovens|colaborador|participant/.test(texto)),
      resultado: /resultad|participa|orient|esclarec|entreg|receb|sensibiliz|aprend|compreend|duvida|interess|adesao|engaj|avali|percebe|relataram|demonstr/.test(texto),
      encaminhamento: /encaminh|retorn|proxim|agend|combin|ficou de|sera |serao|pendent|demanda|acompanh|providenc|sem encaminhamento|nenhum encaminhamento|nao houve encaminhamento/.test(tudo),
      tamanho: String(x.texto || '').trim().length >= RelatosCPT.minimo};
    const itens = RelatosCPT.criterios.map(c => ({...c, ok: ok[c.chave]}));
    return {itens, faltam: itens.filter(i => !i.ok).length};
  }
  /** Lê os campos do registro (Detalhes JSON) e confere. */
  static doRegistro(r, campos) {
    const R = DadosDaAplicacao, v = re => R.valor(campos, re) || '';
    return RelatosCPT.conferir({atividade: r[13], complemento: v(/^complemento/), texto: v(/^relato|relato da atividade|descreva|como foi/), objetivo: v(/^objetivo/),
      observacao: v(/^observacao final/), bairro: r[7], endereco: v(/^endereco completo|^endereco da atividade|^local da atividade/),
      publico: r[14] !== '' && /^\d+$/.test(String(r[14])) ? Number(r[14]) : null, publicoAlvo: v(/^publico-alvo|^publico alvo/)});
  }
  /** Pessoa da equipe que escreveu o relato (o formulário guarda o nome). Sem correspondência exata, ninguém. */
  static autor(ctx, responsavel) {
    const alvo = DadosDaAplicacao.norm(responsavel); if (!alvo) return null;
    const p = PerfisCPT.lista(ctx.config).find(x => x.ativo && (DadosDaAplicacao.norm(x.nome) === alvo || x.email === String(responsavel).trim().toLowerCase()));
    return p ? {email: p.email, nome: p.nome} : null;
  }

  /** Nomes de um campo de pessoas ("Ana, Bia; Caio"), normalizados. */
  static nomes(v) { return String(v || '').split(/\s*[,;\n]\s*/).map(x => DadosDaAplicacao.norm(x)).filter(Boolean); }
  /** A pessoa fez a atividade: é a responsável ou está entre os colaboradores de apoio (nome igual ao do cadastro). */
  static participou(perfil, item) { const eu = DadosDaAplicacao.norm(perfil && perfil.nome); return !!eu && (DadosDaAplicacao.norm(item.responsavel) === eu || RelatosCPT.nomes(item.apoio).includes(eu)); }

  constructor(ctx) { this.ctx = ctx; this.col = new ColecaoCPT(ctx, 'Devolutivas de relato', 'DEV'); }
  /** Cartões do mês. Os pontos de melhoria e a devolutiva só vão para quem pode ver; o resto é igual para todos. */
  ferramenta(dados, mes) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(mes || ''))) throw new Error('Selecione um mês válido.');
    const ger = PerfisCPT.gerencia(this.ctx.perfil), devs = new Map(this.visiveis().map(d => [d.registroId, d]));
    const itens = PaineisGestaoCPT.relatosDoMes(dados, this.ctx, mes).itens.filter(r => RelatosCPT.ehRelato(r.procedimento)).map(r => {
      const meu = RelatosCPT.participou(this.ctx.perfil, r), ve = meu || ger, q = r.qualidade;
      return {id: r.id, data: r.data, atividade: r.atividade, bairro: r.bairro, frente: r.frente, responsavel: r.responsavel, apoio: r.apoio || '', publico: r.publico, fotos: r.fotos,
        resumo: r.resumo, meu, pontos: ve && q ? q.itens.filter(i => !i.ok).map(i => ({nome: i.nome, dica: i.dica})) : null, devolutiva: ve ? devs.get(r.id) || null : null};
    });
    // 2.49: o comentário privado da gestão sai da Visão do mês e fica nos cartões desta ferramenta (mesma regra de antes).
    let podeDevolver = ger; try { PerfisCPT.exigirConfiguracao(this.ctx.perfil, ''); } catch (_) { podeDevolver = false; }
    return {mes, itens, gerencia: ger, podeDevolver, bairros: [...new Set(itens.map(x => x.bairro).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))};
  }
  /** Link para a ficha do relato no RDAS (aba do dia, linha "FICHA n DE m | R4-xxxxxx | …"). Procura só quando alguém pede. */
  rdas(dados, id) {
    if (typeof id !== 'string' || !/^REG-[a-f0-9]{24}$/.test(id)) throw new Error('Relato inválido.');
    const a = dados.registros(), r = dados.registro(a.getRange(dados.localizar(a, id), 1, 1, 21).getValues()[0]);
    if (!RelatosCPT.ehRelato(r.procedimento)) throw new Error('O RDAS reúne os relatos de atividade.');
    const ssId = ConectoresCPT.id('rdas'), url = 'https://docs.google.com/spreadsheets/d/' + ssId + '/edit', dia = r.data, dm = dia.slice(8, 10) + '/' + dia.slice(5, 7);
    let ss; try { ss = SpreadsheetApp.openById(ssId); } catch (_) { return {url, achou: false, texto: 'Abri o RDAS: procure a aba do dia ' + dm + '.'}; }
    const aba = ss.getSheetByName('RDAS ' + dia.slice(8, 10) + '-' + dia.slice(5, 7) + '-' + dia.slice(0, 4));
    if (!aba) return {url, achou: false, texto: 'O dia ' + dm + ' ainda não está no RDAS (ele é montado logo depois do envio). Abri a planilha.'};
    const codigo = 'R4-' + id.replace(/^REG-/, '').slice(0, 6).toUpperCase(), cel = aba.createTextFinder(' | ' + codigo + ' | ').matchCase(true).findNext(), link = url + '#gid=' + aba.getSheetId();
    return cel ? {url: link + '&range=A' + cel.getRow(), achou: true, texto: 'Ficha do relato no RDAS.'} : {url: link, achou: false, texto: 'Abri a aba do dia ' + dm + '; a ficha deste relato não foi achada (relatos de antes do Campo 4.0 têm outro código).'};
  }
  static versao() { return Number(PropertiesService.getScriptProperties().getProperty('CPT_DEVOLUTIVAS_VERSAO') || 0); }
  static subirVersao() { const p = PropertiesService.getScriptProperties(); p.setProperty('CPT_DEVOLUTIVAS_VERSAO', String(RelatosCPT.versao() + 1)); }
  publica(d) { return d ? {registroId: d.registroId, data: d.data, atividade: d.atividade, comentario: d.comentario, situacao: d.situacao, resposta: d.resposta || '', autor: d.autor || '', autorNome: d.autorNome || '', por: d.por, em: d.criadoEm, versao: d.versao} : null; }
  /** Devolutivas que a pessoa pode ver: as suas (como autora) e, para a gerência, todas. Sem devolutiva gravada, nada é lido. */
  visiveis() {
    if (!RelatosCPT.versao()) return [];
    const ger = PerfisCPT.gerencia(this.ctx.perfil);
    return this.col.itens().filter(d => ger || d.autor === this.ctx.email).map(d => this.publica(d));
  }
  devolver(p) {
    if (!PerfisCPT.gerencia(this.ctx.perfil)) throw new Error('A devolutiva de relatos é feita pela Gestão ou pelo Administrativo.');
    PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Devolver relatos');
    if (!p || typeof p.registroId !== 'string' || !/^REG-[a-f0-9]{24}$/.test(p.registroId)) throw new Error('Relato inválido.');
    const comentario = ColecaoCPT.texto(p.comentario, 1500, 'comentário', true);
    if (!this.ctx.base) this.ctx.base = planilhaCPT_(this.ctx.config.baseId);
    const reg = new DadosDaAplicacao(this.ctx.base, this.ctx.perfil).detalhe(p.registroId).registro;
    if (!RelatosCPT.ehRelato(reg.procedimento)) throw new Error('A devolutiva é para relatos de atividade.');
    const autor = RelatosCPT.autor(this.ctx, reg.responsavel), atual = this.col.obter('DEV-' + p.registroId);
    const d = this.col.gravar({registroId: p.registroId, data: reg.data, atividade: reg.atividade || reg.procedimento, comentario, situacao: 'aberta', resposta: '',
      autor: autor ? autor.email : '', autorNome: autor ? autor.nome : String(reg.responsavel || ''), por: this.ctx.email}, atual ? atual.versao : 0, p.operacaoId, 'DEV-' + p.registroId);
    RelatosCPT.subirVersao();
    return {resultado: autor ? 'Comentário enviado só para ' + autor.nome.split(' ')[0] + '.' : 'Comentário guardado. Não achamos "' + reg.responsavel + '" na equipe: combine pessoalmente.', devolutiva: this.publica(d)};
  }
  responder(p) {
    PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Responder devolutivas');
    const atual = this.col.obter('DEV-' + String(p && p.registroId || ''));
    if (!atual || (atual.autor !== this.ctx.email && !PerfisCPT.gerencia(this.ctx.perfil))) throw new Error('Devolutiva não encontrada.');
    const resposta = ColecaoCPT.texto(p.resposta || '', 1000, 'resposta', false);
    const d = this.col.gravar({...atual, situacao: 'vista', resposta}, p.versao != null ? Number(p.versao) : atual.versao, p.operacaoId);
    RelatosCPT.subirVersao();
    return {resultado: 'Marcado como visto.' + (resposta ? ' Sua resposta foi para quem comentou.' : ''), devolutiva: this.publica(d)};
  }
}

function carregarRelatosCPT(p) { return AplicacaoCPT.executar((d, ctx) => new RelatosCPT(ctx).ferramenta(d, String(p && p.mes || '')), 'relatos.ferramenta'); }
function abrirNoRdasCPT(id) { return AplicacaoCPT.executar((d, ctx) => new RelatosCPT(ctx).rdas(d, String(id || '')), 'relatos.rdas'); }
function devolverRelatoCPT(p) { return ColecaoCPT.executar('relatos.devolver', ctx => new RelatosCPT(ctx).devolver(p), true); }
function responderDevolutivaCPT(p) { return ColecaoCPT.executar('relatos.responder', ctx => new RelatosCPT(ctx).responder(p), true); }

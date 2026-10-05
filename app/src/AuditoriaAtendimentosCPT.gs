/**
 * AuditoriaAtendimentosCPT 2.7.0. Conferência da carteira de atendimentos e números para acompanhar o serviço.
 * Só lê: aponta o que precisa de cuidado e leva à ficha, onde a correção é feita (com histórico).
 * Para quem conduz casos: Atendimento, Administrativo e Gestão.
 * Uma leitura da aba Atendimentos; resultado em cache até a próxima ação em um caso (CPT_ATD_VERSAO).
 */
class AuditoriaAtendimentosCPT {
  static get limites() { return {semAcaoDias: 3, prazoDias: 30}; }
  /** Cada verificação: id, título, explicação em português simples e o que fazer. */
  static get verificacoes() {
    return [
      {id: 'recebidaParada', titulo: 'Recebidos sem nenhuma ação há mais de 3 dias', ajuda: 'O caso ainda está como "Recebida". Faça a triagem: atualize a situação, a área e a próxima ação.', grave: true},
      {id: 'prazo', titulo: 'Em aberto há mais de 30 dias', ajuda: 'Confira com a área responsável o que falta e registre a próxima ação, ou finalize se já foi resolvido.', grave: true},
      {id: 'semProximaAcao', titulo: 'Em aberto sem próxima ação', ajuda: 'Sem próxima ação, ninguém sabe o passo seguinte. Use "Atualizar caso".'},
      {id: 'semArea', titulo: 'Em aberto sem área responsável', ajuda: 'Defina com quem o caso está (Atendimento, Execução…). Use "Atualizar caso".'},
      {id: 'incompleto', titulo: 'Ficha com dados faltando', ajuda: 'Nome, endereço, assunto ou tipo de manifestação em branco. Use "Corrigir dados da ficha".'},
      {id: 'datas', titulo: 'Datas inconsistentes', ajuda: 'Sem data de abertura, concluído sem data de conclusão ou conclusão antes da abertura. Corrija na ficha.'},
      {id: 'duplicado', titulo: 'Possíveis duplicados (mesmo endereço em aberto)', ajuda: 'Se for a mesma demanda, abra a ficha principal e use "Incorporar protocolo duplicado". Se forem demandas diferentes, nada a fazer.'},
      {id: 'semFicha', titulo: 'Sem ficha oficial em PDF', ajuda: 'A ficha oficial ainda não foi gerada. Abra o caso e use "Gerar ficha oficial" (ou o pacote do mês).'}
    ];
  }
  constructor(ctx) {
    this.ctx = ctx;
    if (!CicloAtendimentoCPT.podeConduzir(ctx.perfil)) throw new Error('A auditoria de atendimentos é do Atendimento, Administrativo e Gestão.');
    this.dados = new DadosDaAplicacao(ctx.base, ctx.perfil);
  }
  carregar(atualizar) {
    const a = this.dados.atendimentos(), chave = 'auditoria:' + this.ctx.base.getId() + ':' + a.getLastRow() + ':' + (PropertiesService.getScriptProperties().getProperty('CPT_ATD_VERSAO') || 0) + ':' + Utilities.formatDate(new Date(), this.dados.fuso, 'yyyy-MM-dd');
    return CacheCPT.obter(chave, 900, () => this.calcular(this.dados.ler(a, 20), Utilities.formatDate(new Date(), this.dados.fuso, 'yyyy-MM-dd')), atualizar === true);
  }
  /** Separado da leitura para ser testável. linhas = valores das 20 colunas da aba Atendimentos. */
  calcular(linhas, hoje) {
    const D = this.dados, N = DadosDaAplicacao.norm, L = AuditoriaAtendimentosCPT.limites;
    const casos = linhas.filter(r => D.principal(r)).map(r => {
      let json = {}; try { json = JSON.parse(r[19] || '{}') || {}; } catch (_) {}
      const f = CicloAtendimentoCPT.campos(json, r), c = D.atendimento(r);
      return {...c, tipo: String(f.tipo || ''), canal: String(f.canal || ''), procedencia: String(json.procedencia || ''), temPdf: !!c.pdf, atualizacaoTexto: undefined, atualizacao: undefined};
    });
    const abertos = casos.filter(c => !c.concluido), achados = {};
    AuditoriaAtendimentosCPT.verificacoes.forEach(v => achados[v.id] = []);
    const item = (c, detalhe) => ({caso: c.caso || '', protocolo: c.protocolo, nome: c.nome, assunto: c.assunto, dias: c.dias, area: c.area, status: c.concluido ? 'Concluído' : c.status, detalhe});
    abertos.forEach(c => {
      if (/receb/.test(N(c.status)) && c.dias != null && c.dias > L.semAcaoDias) achados.recebidaParada.push(item(c, c.dias + ' dias como Recebida'));
      if (c.dias != null && c.dias > L.prazoDias) achados.prazo.push(item(c, c.dias + ' dias em aberto'));
      if (!c.proximaAcao) achados.semProximaAcao.push(item(c, 'Próxima ação em branco'));
      if (!c.area) achados.semArea.push(item(c, 'Área responsável em branco'));
    });
    casos.forEach(c => {
      const falta = [['nome', 'nome'], ['endereco', 'endereço'], ['assunto', 'assunto'], ['tipo', 'tipo de manifestação']].filter(([k]) => !String(c[k] || '').trim()).map(x => x[1]);
      if (falta.length) achados.incompleto.push(item(c, 'Falta: ' + falta.join(', ')));
      const prob = !c.abertura ? 'Sem data de abertura' : c.concluido && !c.conclusao ? 'Concluído sem data de conclusão' : c.conclusao && c.conclusao < c.abertura ? 'Conclusão antes da abertura' : c.abertura > hoje ? 'Abertura no futuro' : '';
      if (prob) achados.datas.push(item(c, prob));
      if (!c.temPdf) achados.semFicha.push(item(c, c.concluido ? 'Concluído, sem PDF' : 'Em aberto, sem PDF'));
    });
    const porEndereco = new Map();
    abertos.forEach(c => { const k = N(c.endereco).replace(/[^a-z0-9 ]/g, '').replace(/\b(rua|r|avenida|av|travessa|tv|n|no|numero)\b/g, '').replace(/\s+/g, ' ').trim(); if (k.length < 8) return; porEndereco.set(k, (porEndereco.get(k) || []).concat([c])); });
    porEndereco.forEach(lista => { if (lista.length > 1) lista.forEach(c => achados.duplicado.push(item(c, 'Mesmo endereço que ' + lista.filter(x => x !== c).map(x => x.protocolo).join(', ')))); });
    Object.keys(achados).forEach(k => achados[k].sort((a, b) => (b.dias || 0) - (a.dias || 0)));

    // Números para acompanhar (infográficos).
    const mes = hoje.slice(0, 7), meses = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(mes + '-15T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() - i); meses.push(d.toISOString().slice(0, 7)); }
    const conta = (lista, f) => { const m = new Map(); lista.forEach(c => { const k = f(c) || 'Não informado'; m.set(k, (m.get(k) || 0) + 1); }); return [...m].map(([nome, quantidade]) => ({nome, quantidade})).sort((a, b) => b.quantidade - a.quantidade); };
    const faixa = d => d == null ? 'Sem data' : d <= 7 ? 'Até 7 dias' : d <= 15 ? '8 a 15 dias' : d <= 30 ? '16 a 30 dias' : 'Mais de 30 dias';
    const tipoNome = c => { const t = N(c.tipo || c.assunto); return /elogio/.test(t) ? 'Elogio' : /solicita/.test(t) ? 'Solicitação' : /reclama|transtorno|dano/.test(t) ? 'Reclamação' : /informa|duvida|orienta/.test(t) ? 'Informação' : c.tipo ? c.tipo : 'Não informado'; };
    const concluidos = casos.filter(c => c.concluido && c.conclusao && c.abertura && c.conclusao >= c.abertura);
    const prazoMedio = lista => lista.length ? Math.round(lista.reduce((n, c) => n + (Date.parse(c.conclusao + 'T12:00:00Z') - Date.parse(c.abertura + 'T12:00:00Z')) / 864e5, 0) / lista.length) : null;
    const numeros = {
      abertos: abertos.length, concluidos: casos.filter(c => c.concluido).length, total: casos.length,
      prazoMedio: prazoMedio(concluidos.filter(c => meses.includes(c.conclusao.slice(0, 7)))),
      porMes: meses.map(m => ({mes: m, recebidos: casos.filter(c => c.abertura.startsWith(m)).length, concluidos: casos.filter(c => c.concluido && c.conclusao.startsWith(m)).length})),
      porArea: conta(abertos, c => c.area), porIdade: ['Até 7 dias', '8 a 15 dias', '16 a 30 dias', 'Mais de 30 dias', 'Sem data'].map(nome => ({nome, quantidade: abertos.filter(c => faixa(c.dias) === nome).length})).filter(x => x.quantidade),
      porTipo: conta(abertos, tipoNome), porCanal: conta(casos.filter(c => meses.includes(c.abertura.slice(0, 7))), c => c.canal || c.origem).slice(0, 6),
      maisAntigos: abertos.slice().sort((a, b) => (b.dias || 0) - (a.dias || 0)).slice(0, 5).map(c => item(c, c.dias + ' dias'))
    };
    const verificacoes = AuditoriaAtendimentosCPT.verificacoes.map(v => ({...v, quantidade: achados[v.id].length, itens: achados[v.id].slice(0, 60)}));
    return {hoje, verificacoes, numeros, pendencias: verificacoes.filter(v => v.grave).reduce((n, v) => n + v.quantidade, 0), atualizadoEm: new Date().toISOString()};
  }
}

function auditarAtendimentosCPT(p) { return AplicacaoCPT.executar((d, ctx) => new AuditoriaAtendimentosCPT(ctx).carregar(!!(p && p.atualizar)), 'atendimentos.auditoria'); }

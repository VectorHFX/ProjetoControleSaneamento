/**
 * CorteDoControleAntigo — 1.0.0 — TEMPORÁRIO (usar no corte; pode ser apagado depois do primeiro mês).
 * Compara os casos da Base 4.0 com o Controle de Atendimentos antigo e, se pedido, traz o estado atual de lá.
 * - Lê "Base Fichas Oficiais" (estado oficial) e "Histórico" (procedência) do Controle antigo. Não altera o Controle.
 * - Guarda o maior número de protocolo do Controle antigo como piso da numeração (CAMPO40_PROTOCOLO_MINIMO),
 *   para a abertura automática nunca repetir um protocolo que só existe lá.
 * - Caso já movimentado na Aplicação ou pela engenharia depois da migração não é sobrescrito: vai para conferência.
 * Depende de ConfiguracaoDaBase, RepositorioDosRegistros, AberturaDeAtendimentos e ExecucaoDaEngenharia.
 */
class CorteDoControleAntigo {
  static get CONTROLE_ID() { return '1UHs_jFVD7jQRKgw7CVPCQ8R7sgvyhkJVv5rcj0v2K5g'; }
  static get PROP_MINIMO() { return 'CAMPO40_PROTOCOLO_MINIMO'; }
  static tabela(planilha, nome, exigidos) {
    const aba = planilha.getSheetByName(nome); if (!aba) throw new Error('Aba ' + nome + ' não encontrada no Controle antigo.');
    const dados = aba.getDataRange().getValues(), mapa = {}, N = v => ExecucaoDaEngenharia.N(v);
    dados[0].forEach((h, i) => { if (!(N(h) in mapa)) mapa[N(h)] = i; });
    const faltam = exigidos.filter(c => !(N(c) in mapa)); if (faltam.length) throw new Error(nome + ': faltam as colunas ' + faltam.join(', ') + '.');
    return dados.slice(1).filter(r => String(r[0] || '').trim()).map(r => k => r[mapa[N(k)]]);
  }
  static status(v) {
    const n = ExecucaoDaEngenharia.N(v);
    if (n === 'recebida') return 'Recebida';
    if (/^conclu|^encerrad/.test(n)) return 'Concluída';
    if (n === 'em andamento' || /aguardando/.test(n)) return 'Em andamento';
    return '';
  }
  static area(v, atual) {
    const n = ExecucaoDaEngenharia.N(v);
    if (/execucao|engenharia/.test(n)) return 'Execução';
    if (/atendimento/.test(n)) return 'Atendimento';
    return atual;
  }
  static dia(v) { return v instanceof Date ? Utilities.formatDate(v, 'America/Sao_Paulo', 'yyyy-MM-dd') : String(v || '').slice(0, 10); }

  static executar(aplicar) {
    const E = ExecucaoDaEngenharia, base = SpreadsheetApp.openById(ConfiguracaoDaBase.exigirInstalacao().baseId), antigo = SpreadsheetApp.openById(this.CONTROLE_ID);
    const oficiais = this.tabela(antigo, 'Base Fichas Oficiais', ['Protocolo', 'Status', 'Data de conclusão', 'Área responsável pela próxima ação', 'Próxima ação']);
    const procedencia = new Map();
    this.tabela(antigo, 'Histórico', ['ID', 'Data e hora', 'Procedência']).map(g => ({id: String(g('ID')), quando: g('Data e hora'), proc: String(g('Procedência') || '')}))
      .sort((a, b) => new Date(a.quando) - new Date(b.quando)).forEach(e => { if (e.proc) procedencia.set(e.id, e.proc); });
    const t = E.tabelas(base), tocados = new Set(t.movs.filter(m => /^MOV-(APP|EXT|COM)-/.test(String(m[0]))).map(m => String(m[1])));
    const res = {faltandoNaBase: [], aAjustar: [], ajustados: [], conferirNaAplicacao: [], semMudanca: 0, minimo: {}};
    const novas = [], agora = new Date();
    oficiais.forEach(g => {
      const p = String(g('Protocolo')).trim(), m = p.match(/^ATD(\d{4})(\d{4})$/);
      if (m) res.minimo[m[1]] = Math.max(res.minimo[m[1]] || 0, Number(m[2]));
      const i = t.pos.get(p); if (i === undefined) { res.faltandoNaBase.push(p); return; }
      const r = t.linhas[i]; if (r[1] && String(r[1]) !== p) return; // incorporado: segue o principal
      const d = E.json(r[19]), status = this.status(g('Status'));
      if (!status) { res.conferirNaAplicacao.push({protocolo: p, motivo: 'Situação desconhecida no Controle antigo: ' + g('Status')}); return; }
      const proc = E.procedencia(procedencia.get(p) || '').valor, conclusao = status === 'Concluída' ? this.dia(g('Data de conclusão')) : '';
      const novo = {status, area: this.area(g('Área responsável pela próxima ação'), String(r[10] || 'Atendimento')), proxima: status === 'Concluída' ? '' : String(g('Próxima ação') || r[12] || ''), conclusao, procedencia: proc === 'Em análise' ? (d.procedencia || 'Em análise') : proc};
      const atual = {status: String(r[3]), area: String(r[10] || ''), proxima: String(r[12] || ''), conclusao: this.dia(r[5]), procedencia: d.procedencia || 'Em análise'};
      const mudancas = Object.keys(novo).filter(k => novo[k] !== atual[k]).map(k => k + ': ' + (atual[k] || '—') + ' → ' + (novo[k] || '—'));
      if (!mudancas.length) { res.semMudanca++; return; }
      if (tocados.has(p)) { res.conferirNaAplicacao.push({protocolo: p, motivo: 'Já movimentado na Base depois da migração. Diferenças: ' + mudancas.join(' · ')}); return; }
      if (!aplicar) { res.aAjustar.push({protocolo: p, mudancas}); return; }
      r[3] = novo.status; r[10] = novo.area; r[12] = novo.proxima; r[5] = conclusao ? new Date(conclusao + 'T12:00:00') : ''; r[13] = agora; d.procedencia = novo.procedencia;
      r[19] = JSON.stringify(d).slice(0, 49000);
      t.a.getRange(i + 2, 1, 1, 20).setValues([r]);
      novas.push(['MOV-CORTE-' + RepositorioDosRegistros.hash([p, novo]).slice(0, 24), p, agora, 'Ajuste do corte', novo.status, 'Controle de Atendimentos antigo', mudancas.join(' · ').slice(0, 1000), 'Corte do Controle antigo', '', JSON.stringify({de: atual, para: novo})]);
      res.ajustados.push(p);
    });
    if (novas.length) t.m.getRange(t.m.getLastRow() + 1, 1, novas.length, 10).setValues(novas);
    PropertiesService.getScriptProperties().setProperty(this.PROP_MINIMO, JSON.stringify(res.minimo));
    return res;
  }
}

/** EXECUTE no corte, antes de abrir fichas: compara com o Controle antigo e protege a numeração. Não altera casos. */
function compararComControleAntigoCampo40() {
  const r = ConfiguracaoDaBase.comTrava(() => CorteDoControleAntigo.executar(false));
  const saida = {resultado: 'COMPARAÇÃO FEITA', numeracaoContinuaDepoisDe: r.minimo, iguais: r.semMudanca, aAjustar: r.aAjustar, conferirNaAplicacao: r.conferirNaAplicacao, faltandoNaBase: r.faltandoNaBase,
    proximoPasso: r.aAjustar.length ? 'Execute trazerEstadoDoControleAntigoCampo40 para aplicar os ajustes listados.' : 'Nada a ajustar.'};
  console.log(JSON.stringify(saida, null, 2)); return saida;
}
/** EXECUTE depois de conferir a comparação: aplica na Base o estado atual do Controle antigo (com movimentação "Ajuste do corte"). */
function trazerEstadoDoControleAntigoCampo40() {
  const r = ConfiguracaoDaBase.comTrava(() => CorteDoControleAntigo.executar(true));
  const saida = {resultado: 'ESTADO DO CONTROLE ANTIGO APLICADO', ajustados: r.ajustados, conferirNaAplicacao: r.conferirNaAplicacao, faltandoNaBase: r.faltandoNaBase};
  console.log(JSON.stringify(saida, null, 2)); return saida;
}

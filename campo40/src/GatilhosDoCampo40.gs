/**
 * GatilhosDoCampo40 — 1.0.0 — PERMANENTE.
 * Os gatilhos de que o Campo 4.0 precisa, num lugar só. O atualizador troca o código, mas NÃO cria nem apaga gatilhos.
 * - conferirGatilhosCampo40: lista o que existe, o que falta e o que sobra. Não altera nada.
 * - reinstalarGatilhosCampo40: cria os que faltam e apaga só as cópias repetidas. Gatilhos desconhecidos ficam (só aparecem na lista).
 * Só entram os gatilhos de etapas já instaladas (processamento, execução da engenharia, controles de obras).
 */
class GatilhosDoCampo40 {
  /** Gatilhos necessários agora: {funcao, tipo, origem, para}. */
  static necessarios() {
    const c = ConfiguracaoDaBase.exigirInstalacao(), out = [];
    const proc = ProcessamentoDosEnvios.estado();
    if (proc.instalado) {
      out.push({funcao: ProcessamentoDosEnvios.handler, tipo: 'ON_FORM_SUBMIT', origem: c.formId, para: 'Formulário Procedimentos de Campo 4.0: cada envio entra na Base (e no RDAS)'});
      out.push({funcao: ProcessamentoDosEnvios.gatilhoRetomada, tipo: 'CLOCK', origem: '', para: 'De hora em hora: retoma envios, casos, retornos da engenharia e dias do RDAS que ficaram para depois'});
    }
    const exec = ExecucaoDaEngenharia.lerConfig();
    if (exec && exec.formId) out.push({funcao: 'aoReceberExecucaoCampo40', tipo: 'ON_FORM_SUBMIT', origem: exec.formId, para: 'Formulário de Execução (Concrejato): retornos, aberturas e painel da planilha da engenharia'});
    if (c.controlesCatalogos)
      out.push({funcao: 'aoEditarCatalogosCampo40', tipo: 'ON_EDIT', origem: c.baseId, para: 'Abas Obras e Bairros: caixa "Salvar e atualizar formulário"'});
    return out;
  }
  static descrever(t) {
    let origem = ''; try { origem = t.getTriggerSourceId() || ''; } catch (_) {}
    return {funcao: t.getHandlerFunction(), tipo: String(t.getEventType()), origem};
  }
  static igual(t, n) { const d = this.descrever(t); return d.funcao === n.funcao && d.tipo === n.tipo && (n.tipo === 'CLOCK' || d.origem === n.origem); }

  static conferir() {
    const todos = ScriptApp.getProjectTriggers(), nec = this.necessarios();
    const presentes = [], faltando = [], repetidos = [];
    nec.forEach(n => {
      const achados = todos.filter(t => this.igual(t, n));
      (achados.length ? presentes : faltando).push(n.funcao + ' · ' + n.para);
      if (achados.length > 1) repetidos.push(n.funcao + ' (' + achados.length + ' cópias)');
    });
    const sobrando = todos.filter(t => !nec.some(n => this.igual(t, n))).map(t => { const d = this.descrever(t); return d.funcao + ' · ' + d.tipo; });
    return {resultado: faltando.length ? 'FALTAM GATILHOS: execute reinstalarGatilhosCampo40' : repetidos.length ? 'HÁ CÓPIAS REPETIDAS: execute reinstalarGatilhosCampo40' : 'GATILHOS EM ORDEM',
      necessarios: nec.length, presentes, faltando, repetidos,
      desconhecidos: sobrando, observacao: sobrando.length ? 'Gatilhos desconhecidos não são apagados. Se não souber o que fazem, mande o print antes de excluir.' : ''};
  }

  static reinstalar() {
    return ConfiguracaoDaBase.comTrava(() => {
      const criados = [], removidos = [];
      this.necessarios().forEach(n => {
        const achados = ScriptApp.getProjectTriggers().filter(t => this.igual(t, n));
        achados.slice(1).forEach(t => { ScriptApp.deleteTrigger(t); removidos.push(n.funcao); });
        if (achados.length) return;
        const b = ScriptApp.newTrigger(n.funcao);
        if (n.tipo === 'CLOCK') b.timeBased().everyHours(1).create();
        else if (n.tipo === 'ON_FORM_SUBMIT') b.forForm(n.origem).onFormSubmit().create();
        else b.forSpreadsheet(n.origem).onEdit().create();
        criados.push(n.funcao);
      });
      return {...this.conferir(), criados, copiasRemovidas: removidos};
    });
  }
}

/** EXECUTE para ver os gatilhos do Campo 4.0: presentes, faltando, repetidos e desconhecidos. Não altera nada. */
function conferirGatilhosCampo40() { const r = GatilhosDoCampo40.conferir(); console.log(JSON.stringify(r, null, 2)); return r; }
/** EXECUTE depois de apagar os gatilhos (ou se conferir apontar falta): recria só os necessários, sem duplicar. */
function reinstalarGatilhosCampo40() { const r = GatilhosDoCampo40.reinstalar(); console.log(JSON.stringify(r, null, 2)); return r; }

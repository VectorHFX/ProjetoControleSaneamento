/**
 * InventarioDriveCPT 1.0.0. Ferramenta de ADMINISTRAÇÃO (executar no editor). NÃO move nem apaga nada.
 * Lista planilhas, formulários, documentos e projetos de script que são seus no Drive e sugere o destino de cada um:
 *   EM USO (não mexer) · GERADO PELO SISTEMA (manter) · LEGADO (mover para 99_Legado) · REVISAR.
 * O resultado vai para uma planilha nova "CPT • Inventário do Drive AAAA-MM-DD" na raiz do seu Drive.
 */
class InventarioDriveCPT {
  /** Arquivos ligados ao sistema novo. IDs que mudarem ficam na configuração da aplicação. */
  static emUso() {
    const c = AplicacaoCPT.config(), m = new Map();
    const add = (id, motivo) => { if (id) m.set(String(id), motivo); };
    add(c.baseId, 'Base Campo 4.0 (fonte única dos registros e casos)');
    add(c.agendaId, 'Dados da aplicação (agenda, observações, históricos)');
    add(c.modeloFichaId || FichaOficialCPT.modeloPadrao, 'Modelo oficial da ficha Sabesp');
    add(ScriptApp.getScriptId(), 'Projeto da Aplicação CPT');
    [['1Y5zioMOTaJDtp78OPBovXeHhvuns_ZEG6SMyHqng-Uk', 'Planilha da engenharia (Execução) — compartilhada com a Concrejato'],
      ['1TXAPh6z6Y6MX6JLVoY_KhO-u24Fi8TqnbDHUdrkeecE', 'Formulário de Execução (engenharia)'],
      ['1QlNjWWIHhQYEVvw5fWrKGQmGVqGYmH5B2237ajwmedI', 'Pesquisa de satisfação (respostas)'],
      ['1Et4M0nr4CxlRj7J6EDoru91aC4PJ-G2Y', 'Anexos do relatório (Indicadores 2026)'],
      ['1UHs_jFVD7jQRKgw7CVPCQ8R7sgvyhkJVv5rcj0v2K5g', 'Controle de Atendimentos antigo — CONSULTA (PDFs das fichas antigas apontam para cá)']].forEach(([id, motivo]) => add(id, motivo));
    // Formulários ligados às planilhas em uso (Campo 4.0, Execução, Satisfação).
    [c.baseId, '1Y5zioMOTaJDtp78OPBovXeHhvuns_ZEG6SMyHqng-Uk', '1QlNjWWIHhQYEVvw5fWrKGQmGVqGYmH5B2237ajwmedI'].forEach(id => {
      try { const u = SpreadsheetApp.openById(id).getFormUrl(), f = u && FormApp.openByUrl(u); if (f) add(f.getId(), 'Formulário ligado a ' + (m.get(id) || 'planilha em uso').split(' (')[0]); } catch (_) {}
    });
    return m;
  }
  static tipo(mime) {
    return {'application/vnd.google-apps.spreadsheet': 'Planilha', 'application/vnd.google-apps.form': 'Formulário', 'application/vnd.google-apps.document': 'Documento', 'application/vnd.google-apps.script': 'Projeto de script'}[mime] || mime;
  }
  /** Sugestão por nome e uso. A decisão final é sua: a coluna "Sugestão" é só um ponto de partida. */
  static classificar(f, emUso, agora) {
    const nome = String(f.nome), dias = Math.floor((agora - f.alterado) / 864e5);
    if (emUso.has(f.id)) return ['EM USO', emUso.get(f.id)];
    if (/^ATD\d{8}[ _]Ficha|^CPT • |^\d{4}-\d{2}_|Relat[óo]rio Mensal|Controle de manifesta/i.test(nome)) return ['GERADO PELO SISTEMA', 'Entrega ou ficha gerada; fica onde está (é rastreio)'];
    if (/c[óo]pia de|texto colado|c[óo]digo colado|\bteste\b|\btest\b|sem t[íi]tulo|untitled|backup|v\d+(\.\d+)* final|final \(\d\)/i.test(nome)) return ['LEGADO', 'Cópia, teste ou rascunho'];
    if (/painel|central|procedimentos de campo 3|campo 3\.0|fichas oficiais|comunica[çc][ãa]o (do )?atendimento|rdas|diagn[óo]stico|relatos? (sociais|de atividade)|gest[ãa]o/i.test(nome))
      return [dias > 30 ? 'LEGADO' : 'REVISAR', dias > 30 ? 'Ferramenta antiga sem alteração há ' + dias + ' dias' : 'Ferramenta antiga alterada nos últimos 30 dias: confirme se ainda é usada'];
    if (dias > 120) return ['REVISAR', 'Sem alteração há ' + dias + ' dias'];
    return ['REVISAR', 'Não reconhecido pelo sistema'];
  }
  static executar() {
    const emUso = this.emUso(), agora = Date.now(), linhas = [];
    const q = "'me' in owners and trashed = false and (mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.form' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.script')";
    const it = DriveApp.searchFiles(q);
    while (it.hasNext() && linhas.length < 2000) {
      const a = it.next(), pais = a.getParents(), pasta = pais.hasNext() ? pais.next().getName() : '(raiz)';
      const f = {id: a.getId(), nome: a.getName(), mime: a.getMimeType(), alterado: a.getLastUpdated().getTime(), url: a.getUrl(), pasta};
      const [sugestao, motivo] = this.classificar(f, emUso, agora);
      linhas.push([sugestao, this.tipo(f.mime), f.nome, pasta, new Date(f.alterado), motivo, f.url]);
    }
    const ordem = {'EM USO': 0, 'GERADO PELO SISTEMA': 1, 'REVISAR': 2, 'LEGADO': 3};
    linhas.sort((a, b) => ordem[a[0]] - ordem[b[0]] || String(a[3]).localeCompare(String(b[3])) || String(a[2]).localeCompare(String(b[2])));
    const ss = SpreadsheetApp.create('CPT • Inventário do Drive ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd')), aba = ss.getSheets()[0];
    const cab = ['Sugestão', 'Tipo', 'Nome', 'Pasta', 'Última alteração', 'Motivo', 'Link', 'Sua decisão'];
    aba.setName('Inventário').getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold');
    if (linhas.length) aba.getRange(2, 1, linhas.length, 7).setValues(linhas);
    aba.setFrozenRows(1);
    const resumo = linhas.reduce((o, l) => { o[l[0]] = (o[l[0]] || 0) + 1; return o; }, {});
    return {resultado: 'INVENTÁRIO PRONTO (nada foi movido)', planilha: ss.getUrl(), resumo, emUsoNaoEncontrados: [...emUso.keys()].filter(id => !linhas.some(l => String(l[6]).includes(id))).length};
  }
}

/** EXECUTE no editor. Cria a planilha de inventário; não move nem apaga arquivos. */
function inventariarDriveCPT() {
  const r = InventarioDriveCPT.executar(); console.log(JSON.stringify(r, null, 2)); return r;
}

/**
 * AberturaDeAtendimentos — 1.0.0 — PERMANENTE.
 * Transforma cada envio de "Ficha de Atendimento" do formulário em um caso com protocolo sequencial
 * (ATD + ano da data de realização + 4 dígitos), continuando a numeração já existente na aba Atendimentos.
 * - O formulário não muda: o protocolo nasce aqui, não é digitado por ninguém.
 * - Idempotente: o caso guarda o ID do registro de origem; reprocessar não cria outro protocolo.
 * - Roda dentro da mesma trava do processamento de envios (numeração sem colisão).
 * - Os campos da ficha ficam integralmente no JSON do caso; as colunas recebem só o resumo.
 * Depende de ConfiguracaoDaBase e RepositorioDosRegistros.
 */
class AberturaDeAtendimentos {
  static get cabecalho() { return ['Protocolo', 'Protocolo principal', 'Situação do protocolo', 'Status', 'Data de abertura', 'Data de conclusão', 'Nome', 'Assunto', 'Endereço', 'Frente de obra', 'Área responsável', 'Responsável', 'Próxima ação', 'Atualização operacional', 'Documento', 'PDF', 'Origem', 'Pesquisa', 'Hash', 'Detalhes JSON']; }
  static get cabecalhoMovimentos() { return ['ID', 'Protocolo', 'Data e hora', 'Tipo', 'Status', 'Autor', 'Resumo', 'Origem', 'Hash', 'Detalhes JSON']; }
  /** Procedimento do formulário que abre um caso. Comparação sem acentos e sem maiúsculas. */
  static ehAbertura(procedimento) { return /^ficha de atendimento/.test(RepositorioDosRegistros.normalizar(procedimento)); }
  /** Títulos aceitos para cada informação (o roteiro do formulário foi preservado do 3.0). Vale o primeiro respondido. */
  static get mapa() {
    return {
      nome: /^nome( -| do| da)? ?(atendimento|solicitante|morador|municipe)|^nome completo|^nome$/,
      telefone: /telefone/, email: /e-?mail/,
      endereco: /endereco completo do solicitante|endereco do solicitante|^endereco completo|^endereco/,
      assunto: /^assunto/, tipo: /classificacao principal da manifestacao|tipo de manifestacao/,
      solicitacao: /breve relato|relato do solicitante|descricao detalhada da ocorrencia|^solicitacao/,
      canal: /canal de recebimento|^canal/, urgencia: /urgencia/, segmento: /segmento/,
      tratativa: /providencias ja realizadas|tratativa inicial/, acompanhamento: /responsavel do consorcio que esta acompanhando/,
      local: /^local( do atendimento)?$|ponto de referencia/, horario: /horario do recebimento/
    };
  }
  static extrair(campos) {
    const N = RepositorioDosRegistros.normalizar, out = {};
    const texto = v => Array.isArray(v) ? v.filter(Boolean).join(', ') : v == null ? '' : String(v).trim();
    Object.entries(this.mapa).forEach(([chave, re]) => {
      const c = (campos || []).find(x => re.test(N(String(x.titulo || '').replace(/[\s:?.!*]+$/, ''))) && texto(x.valor));
      out[chave] = c ? texto(c.valor) : '';
    });
    return out;
  }
  static tabelas(base) {
    const a = base.getSheetByName('Atendimentos'), m = base.getSheetByName('Movimentações');
    if (!a || !m) throw new Error('As abas Atendimentos e Movimentações são obrigatórias para abrir casos.');
    [[a, this.cabecalho], [m, this.cabecalhoMovimentos]].forEach(([aba, cab]) => {
      if (aba.getRange(1, 1, 1, cab.length).getValues()[0].some((v, i) => v !== cab[i])) throw new Error('Cabeçalho inesperado na aba ' + aba.getName() + '. Nenhum caso foi aberto.');
    });
    return {a, m};
  }
  /** Lê protocolos e origens já existentes (duas colunas, uma leitura). */
  static indice(a) {
    const n = a.getLastRow() - 1, porOrigem = new Map(), maiores = {};
    if (n > 0) a.getRange(2, 1, n, 17).getValues().forEach(r => {
      const p = String(r[0]), o = String(r[16]), m = p.match(/^ATD(\d{4})(\d{4})$/);
      if (m) maiores[m[1]] = Math.max(maiores[m[1]] || 0, Number(m[2]));
      const reg = o.match(/REG-[a-f0-9]{24}/); if (reg) porOrigem.set(reg[0], p);
    });
    return {porOrigem, maiores};
  }
  /**
   * Abre o caso de um registro. Retorna o protocolo (novo ou já existente).
   * @param {Spreadsheet} base
   * @param {Array} linhaRegistro linha da aba Registros (21 colunas) ou equivalente montado no processamento
   * @param {Object} detalhes JSON do registro (campos do formulário)
   * @param {Object} [idx] índice reaproveitado em lote
   */
  static abrir(base, linhaRegistro, detalhes, idx) {
    const {a, m} = this.tabelas(base); idx = idx || this.indice(a);
    const registroId = String(linhaRegistro[0]);
    if (idx.porOrigem.has(registroId)) return {protocolo: idx.porOrigem.get(registroId), novo: false};
    const campos = Array.isArray(detalhes.campos) ? detalhes.campos : [], f = this.extrair(campos), fuso = base.getSpreadsheetTimeZone();
    const dataReal = linhaRegistro[2] instanceof Date ? linhaRegistro[2] : (detalhes.carimbo ? new Date(detalhes.carimbo) : new Date());
    const ano = Utilities.formatDate(dataReal, fuso, 'yyyy');
    const numero = (idx.maiores[ano] || 0) + 1; idx.maiores[ano] = numero;
    const protocolo = 'ATD' + ano + String(numero).padStart(4, '0'), agora = new Date();
    const resumo = {registroId, aberturaPor: String(linhaRegistro[11] || ''), procedencia: 'Em análise', ...f, campos};
    const obra = String(linhaRegistro[9] || '').replace(/\s*\[OBR-\d+\]\s*$/, '');
    const linha = [protocolo, protocolo, 'Principal', 'Recebida', dataReal, '', f.nome, f.assunto || f.tipo, f.endereco || f.local, obra,
      'Atendimento', String(linhaRegistro[11] || f.acompanhamento || ''), 'Triagem do Atendimento', agora, '', '', 'Formulário 4.0 · ' + registroId,
      RepositorioDosRegistros.normalizar([protocolo, f.nome, f.assunto, f.tipo, f.endereco, f.solicitacao].join(' ')), RepositorioDosRegistros.hash(resumo), JSON.stringify(resumo).slice(0, 49000)];
    a.getRange(a.getLastRow() + 1, 1, 1, linha.length).setValues([linha]);
    const mov = ['MOV-' + RepositorioDosRegistros.hash([protocolo, 'Abertura', registroId]).slice(0, 24) + '-1', protocolo, agora, 'Abertura', 'Recebida',
      String(linhaRegistro[11] || 'Formulário'), (f.solicitacao || f.assunto || 'Ficha de atendimento recebida pelo formulário').slice(0, 500), 'Formulário 4.0', '', JSON.stringify({registroId})];
    m.getRange(m.getLastRow() + 1, 1, 1, mov.length).setValues([mov]);
    idx.porOrigem.set(registroId, protocolo);
    return {protocolo, novo: true};
  }
  /** Marca no registro o protocolo gerado (colunas Protocolo informado e Situação do vínculo). */
  static marcarRegistro(base, registroId, protocolo) {
    const r = base.getSheetByName('Registros'), n = r.getLastRow() - 1; if (n < 1) return;
    const ids = r.getRange(2, 1, n, 1).getValues(), i = ids.findIndex(x => String(x[0]) === registroId);
    if (i >= 0) r.getRange(i + 2, 16, 1, 2).setValues([[protocolo, 'Ficha aberta: ' + protocolo]]);
  }
  /**
   * Recupera fichas de atendimento já registradas que ainda não viraram caso (ex.: enviadas antes desta versão).
   * Seguro para repetir. Usado pela retomada de hora em hora e pela função manual abaixo.
   */
  static abrirPendentes(base) {
    const r = base.getSheetByName('Registros'), n = r.getLastRow() - 1; if (n < 1) return {abertos: [], conferidos: 0};
    const {a} = this.tabelas(base), idx = this.indice(a), abertos = [];
    const linhas = r.getRange(2, 1, n, 21).getValues();
    let conferidos = 0;
    linhas.forEach((linha, i) => {
      if (!linha[0] || !this.ehAbertura(linha[1]) || idx.porOrigem.has(String(linha[0]))) return;
      // Somente envios do formulário 4.0; o histórico importado já tem seus protocolos.
      if (String(linha[5]) !== 'Procedimentos de Campo 4.0') return;
      conferidos++;
      let d = {}; try { d = JSON.parse(linha[20] || '{}'); } catch (_) {}
      if (d.arquivoDetalhesId) d = JSON.parse(DriveApp.getFileById(d.arquivoDetalhesId).getBlob().getDataAsString('UTF-8'));
      const res = this.abrir(base, linha, d.conteudo || d, idx);
      if (res.novo) { r.getRange(i + 2, 16, 1, 2).setValues([[res.protocolo, 'Ficha aberta: ' + res.protocolo]]); abertos.push({registro: linha[0], protocolo: res.protocolo}); }
    });
    return {abertos, conferidos};
  }
}

/** EXECUTE UMA VEZ depois de instalar: abre os casos das fichas enviadas desde a migração que ficaram sem protocolo. Repetir é seguro. */
function abrirFichasSemProtocoloCampo40() {
  return ConfiguracaoDaBase.comTrava(() => {
    const c = ConfiguracaoDaBase.exigirInstalacao(), r = AberturaDeAtendimentos.abrirPendentes(SpreadsheetApp.openById(c.baseId));
    const saida = {resultado: r.abertos.length ? 'CASOS ABERTOS' : 'NENHUMA FICHA PENDENTE', abertos: r.abertos, fichasConferidas: r.conferidos};
    console.log(JSON.stringify(saida, null, 2)); return saida;
  });
}

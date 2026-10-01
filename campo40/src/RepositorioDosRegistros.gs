/**
 * RepositorioDosRegistros — 1.0.0 — PERMANENTE.
 * Identidade, tipos e escrita incremental na tabela Registros já importada.
 * Não depende dos módulos de migração; nunca limpa tabelas nem altera fichas.
 */
class RepositorioDosRegistros {
  static get versao() { return '1.0.0'; }
  static get cabecalhos() {
    return ['ID', 'Procedimento', 'Data do procedimento', 'Mês', 'Carimbo do envio',
      'Origem', 'ID legado', 'Bairro', 'Bairro ID', 'Obra de referência', 'Obra ID',
      'Responsável', 'Área', 'Atividade', 'Público informado', 'Protocolo informado',
      'Situação do vínculo', 'Pesquisa', 'Conferência dos campos', 'Hash', 'Detalhes JSON'];
  }
  static normalizar(v) {
    return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim().toLowerCase().replace(/\s+/g, ' ');
  }
  static serializar(v) {
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(x => this.serializar(x));
    if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, this.serializar(v[k])]));
    return v == null ? '' : v;
  }
  static hash(v) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
      JSON.stringify(this.serializar(v)), Utilities.Charset.UTF_8)
      .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
  }
  static texto(v) { return Array.isArray(v) ? v.map(x => this.texto(x)).join('; ') : String(v == null ? '' : v).trim(); }
  static literal(v) { return typeof v === 'string' && /^['=]/.test(v) ? "'" + v : v; }
  static dataCivil(v, fuso) {
    if (v instanceof Date && Number.isFinite(v.getTime())) return Utilities.formatDate(v, fuso, 'yyyy-MM-dd');
    const s = this.texto(v);
    if (/^\d{4}-\d{2}-\d{2}T/.test(s) && Number.isFinite(Date.parse(s))) return Utilities.formatDate(new Date(s), fuso, 'yyyy-MM-dd');
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) { const b = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if (b) m = [b[0], b[3], b[2], b[1]]; }
    if (!m) return '';
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
    return d.toISOString().slice(0, 10) === m[1] + '-' + m[2] + '-' + m[3] ? d.toISOString().slice(0, 10) : '';
  }
  static mes(v, fuso) {
    if (v instanceof Date) return Utilities.formatDate(v, fuso, 'yyyy-MM');
    const s = this.texto(v); return /^\d{4}-(0[1-9]|1[0-2])$/.test(s) ? s : '';
  }
  static exigirTabela(base) {
    const s = base.getSheetByName('Registros');
    if (!s) throw new Error('A tabela Registros importada não foi encontrada. Nenhuma aba será criada.');
    const h = s.getRange(1, 1, 1, this.cabecalhos.length).getValues()[0];
    if (h.some((v, i) => v !== this.cabecalhos[i])) throw new Error('Registros: cabeçalhos diferentes da base importada. Nenhuma alteração foi feita.');
    return s;
  }
  constructor(base) {
    this.base = base; this.fuso = base.getSpreadsheetTimeZone();
    this.aba = RepositorioDosRegistros.exigirTabela(base);
    const n = this.aba.getLastRow() - 1;
    // Apenas a identidade: não carrega centenas de textos, imagens ou JSONs.
    this.indice = new Map();
    const ids = n > 0 ? this.aba.getRange(2, 1, n, 1).getValues() : [];
    ids.forEach((r, i) => {
      if (!r[0]) throw new Error('Registros: linha ' + (i + 2) + ' sem ID; confira antes de continuar.');
      if (this.indice.has(String(r[0]))) throw new Error('Registros: ID repetido na base: ' + r[0]);
      this.indice.set(String(r[0]), i + 2);
    });
    this.proximaLinha = n + 2;
  }
  hashLinha(r) {
    const v = r.slice(0, 19);
    v[2] = RepositorioDosRegistros.dataCivil(v[2], this.fuso);
    v[3] = RepositorioDosRegistros.mes(v[3], this.fuso);
    // O Sheets pode arredondar milissegundos ao converter sua data numérica.
    // A precisão original do envio permanece integral no snapshot da resposta.
    if (v[4] instanceof Date) v[4] = new Date(Math.floor(v[4].getTime() / 1000) * 1000);
    return RepositorioDosRegistros.hash(v);
  }
  conferirExistente(id, hashResposta) {
    const numero = this.indice.get(id); if (!numero) return null;
    const r = this.aba.getRange(numero, 1, 1, 21).getValues()[0];
    if (this.aba.getRange(numero, 1, 1, 21).getFormulas()[0].some(Boolean)) throw new Error(id + ': há fórmula no registro; preservado para conferência.');
    let d; try { d = JSON.parse(r[20]); } catch (_) { throw new Error(id + ': detalhes inválidos; registro preservado.'); }
    if (!d.hashLinha || r[19] !== d.hashLinha || this.hashLinha(r) !== d.hashLinha) {
      throw new Error(id + ': o registro foi alterado na planilha. A automação preservou a alteração.');
    }
    return {linha: numero, hashResposta: d.hashResposta, igual: d.hashResposta === hashResposta};
  }
  gravar(linha, detalhes, pastaId) {
    const id = linha[0], existente = this.conferirExistente(id, detalhes.hashResposta);
    if (existente) {
      if (!existente.igual) throw new Error(id + ': resposta editada após o processamento; precisa de revisão, sem substituir o original.');
      return {resultado: 'JÁ PROCESSADO', id: id, linha: existente.linha, inserido: false};
    }
    const hashLinha = this.hashLinha(linha);
    let indice = {versao: RepositorioDosRegistros.versao, formularioId: detalhes.formularioId,
      respostaId: detalhes.respostaId, hashResposta: detalhes.hashResposta, hashLinha: hashLinha, conteudo: detalhes};
    let json = JSON.stringify(RepositorioDosRegistros.serializar(indice));
    if (json.length > 44000) {
      // O original não é cortado para caber numa célula do Sheets.
      const nome = 'Resposta_' + id + '_' + detalhes.hashResposta.slice(0, 12) + '.json';
      const pasta = DriveApp.getFolderById(pastaId), encontrados = pasta.getFilesByName(nome);
      const texto = JSON.stringify(RepositorioDosRegistros.serializar(detalhes));
      let arquivo;
      if (encontrados.hasNext()) {
        arquivo = encontrados.next();
        if (encontrados.hasNext() || arquivo.getBlob().getDataAsString('UTF-8') !== texto) throw new Error('Arquivo de resposta divergente: ' + id);
      } else arquivo = pasta.createFile(nome, texto, MimeType.PLAIN_TEXT);
      indice = {versao: indice.versao, formularioId: indice.formularioId, respostaId: indice.respostaId,
        hashResposta: indice.hashResposta, hashLinha: hashLinha, arquivoDetalhesId: arquivo.getId()};
      json = JSON.stringify(indice);
    }
    const r = linha.slice(0, 19).concat([hashLinha, json]);
    if (r.some(v => typeof v === 'string' && v.length > 45000)) throw new Error(id + ': campo excede o limite da célula; resposta original permanece no formulário.');
    const n = this.proximaLinha;
    if (n > this.aba.getMaxRows()) this.aba.insertRowsAfter(this.aba.getMaxRows(), 100);
    const faixa = this.aba.getRange(n, 1, 1, 21);
    // Formatação ANTES da escrita: impede a conversão de Mês e IDs em datas/números.
    faixa.setNumberFormat('@');
    this.aba.getRange(n, 3, 1, 1).setNumberFormat('dd/mm/yyyy');
    this.aba.getRange(n, 5, 1, 1).setNumberFormat('dd/mm/yyyy hh:mm');
    faixa.setValues([r.map(RepositorioDosRegistros.literal)]);
    this.indice.set(id, n); this.proximaLinha++;
    return {resultado: 'PROCESSADO', id: id, linha: n, inserido: true};
  }
}

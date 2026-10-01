/**
 * ConsultasDaBase — 1.0.0 — PERMANENTE.
 * Listas paginadas, resumo mensal e detalhe individual para a futura aplicação.
 * Não contém doGet, login ou publicação de dados. A autorização por perfil deve
 * ser aplicada antes de conectar estas consultas a uma aplicação publicada.
 * Depende somente de ConfiguracaoDaBase e RepositorioDosRegistros.
 */
class ConsultasDaBase {
  static base() { return SpreadsheetApp.openById(ConfiguracaoDaBase.exigirInstalacao().baseId); }
  static get cabecalhosAtendimentos() {
    return ['Protocolo', 'Protocolo principal', 'Situação do protocolo', 'Status', 'Data de abertura',
      'Data de conclusão', 'Nome', 'Assunto', 'Endereço', 'Frente de obra', 'Área responsável',
      'Responsável', 'Próxima ação', 'Atualização operacional', 'Documento', 'PDF', 'Origem', 'Pesquisa', 'Hash', 'Detalhes JSON'];
  }
  static tabelaAtendimentos(base) {
    const s = base.getSheetByName('Atendimentos');
    if (!s || s.getRange(1, 1, 1, 20).getValues()[0].some((x, i) => x !== this.cabecalhosAtendimentos[i])) {
      throw new Error('Atendimentos: tabela importada ausente ou estrutura diferente.');
    }
    return s;
  }
  static textoFiltro(v, nome) {
    if (v == null) return '';
    if (typeof v !== 'string' || v.length > 250) throw new Error('Filtro inválido: ' + nome);
    return v.trim();
  }
  static filtros(p) {
    if (p != null && (typeof p !== 'object' || Array.isArray(p))) throw new Error('Informe os filtros como objeto.');
    p = p || {};
    const f = Object.fromEntries(['mes', 'procedimento', 'bairroId', 'obraId', 'responsavel', 'busca']
      .map(k => [k, this.textoFiltro(p[k], k)]));
    if (f.mes && !/^\d{4}-(0[1-9]|1[0-2])$/.test(f.mes)) throw new Error('Mês inválido. Use AAAA-MM, por exemplo 2026-10.');
    const limite = p.limite == null ? 24 : Number(p.limite);
    if (!Number.isInteger(limite) || limite < 1 || limite > 50) throw new Error('O limite deve estar entre 1 e 50.');
    return {f: f, limite: limite, cursor: this.textoFiltro(p.cursor, 'cursor')};
  }
  static objetoRegistro(r, fuso) {
    const R = RepositorioDosRegistros;
    return {id: String(r[0]), procedimento: String(r[1]), data: R.dataCivil(r[2], fuso), mes: R.mes(r[3], fuso),
      carimbo: r[4] instanceof Date ? r[4].toISOString() : String(r[4]), origem: String(r[5]),
      bairro: String(r[7]), bairroId: String(r[8]), obra: String(r[9]), obraId: String(r[10]),
      responsavel: String(r[11]), area: String(r[12]), atividade: String(r[13]),
      publicoInformado: r[14] === '' ? null : /^\d+$/.test(String(r[14])) ? Number(r[14]) : null,
      protocoloInformado: String(r[15]), vinculo: String(r[16]), conferencia: String(r[18])};
  }
  static atende(r, f, fuso) {
    const R = RepositorioDosRegistros;
    return (!f.mes || R.mes(r[3], fuso) === f.mes) &&
      (!f.procedimento || R.normalizar(r[1]) === R.normalizar(f.procedimento)) &&
      (!f.bairroId || r[8] === f.bairroId) && (!f.obraId || r[10] === f.obraId) &&
      (!f.responsavel || R.normalizar(r[11]) === R.normalizar(f.responsavel)) &&
      (!f.busca || R.normalizar(r[17]).includes(R.normalizar(f.busca)));
  }
  static listar(p) {
    const inicio = Date.now(), base = this.base(), aba = RepositorioDosRegistros.exigirTabela(base);
    const params = this.filtros(p), fuso = base.getSpreadsheetTimeZone();
    const chave = RepositorioDosRegistros.hash([base.getId(), params.f]);
    let posicao = {v: 1, topo: aba.getLastRow(), linha: aba.getLastRow(), filtro: chave};
    if (params.cursor) {
      try { posicao = JSON.parse(params.cursor); } catch (_) { throw new Error('Cursor inválido; reinicie a busca.'); }
      if (posicao.v !== 1 || posicao.filtro !== chave || !Number.isInteger(posicao.topo) ||
          !Number.isInteger(posicao.linha) || posicao.linha < 1 || posicao.linha > posicao.topo ||
          posicao.topo > aba.getLastRow()) throw new Error('Os filtros ou a estrutura mudaram; reinicie a busca.');
    }
    const itens = []; let lidos = 0;
    // Até 2 mil linhas leves por chamada. O cursor continua até encontrar mais resultados.
    while (posicao.linha > 1 && itens.length < params.limite && lidos < 2000) {
      const tamanho = Math.min(200, posicao.linha - 1, 2000 - lidos), primeira = posicao.linha - tamanho + 1;
      const bloco = aba.getRange(primeira, 1, tamanho, 19).getValues();
      for (let i = bloco.length - 1; i >= 0; i--) {
        const r = bloco[i]; posicao.linha = primeira + i - 1; lidos++;
        if (r[0] && this.atende(r, params.f, fuso)) itens.push(this.objetoRegistro(r, fuso));
        if (itens.length >= params.limite) break;
      }
    }
    return {itens: itens, proximoCursor: posicao.linha > 1 ? JSON.stringify(posicao) : null,
      linhasExaminadas: lidos, tempoMs: Date.now() - inicio, ordem: 'Mais recentemente gravados primeiro'};
  }
  static localizar(aba, id) {
    const n = aba.getLastRow() - 1;
    const ids = n > 0 ? aba.getRange(2, 1, n, 1).getValues() : [];
    const encontrados = [];
    ids.forEach((r, i) => { if (String(r[0]) === id) encontrados.push(i + 2); });
    if (encontrados.length > 1) throw new Error('Identidade repetida na tabela: ' + id);
    if (!encontrados.length) throw new Error('Registro não encontrado: ' + id);
    return encontrados[0];
  }
  static detalhe(id) {
    if (typeof id !== 'string' || !/^REG-[a-f0-9]{24}$/.test(id)) throw new Error('ID de registro inválido.');
    const base = this.base(), aba = RepositorioDosRegistros.exigirTabela(base), n = this.localizar(aba, id);
    const r = aba.getRange(n, 1, 1, 21).getValues()[0];
    const indice = JSON.parse(r[20]);
    const detalhes = indice.arquivoDetalhesId ? JSON.parse(DriveApp.getFileById(indice.arquivoDetalhesId).getBlob().getDataAsString('UTF-8')) : indice.conteudo || indice;
    // JSON explícito: google.script.run não aceita Date como valor de retorno.
    return {registro: this.objetoRegistro(r, base.getSpreadsheetTimeZone()), detalhes: RepositorioDosRegistros.serializar(detalhes)};
  }
  static ficha(protocolo) {
    protocolo = this.textoFiltro(protocolo, 'protocolo');
    if (!protocolo) throw new Error('Informe o protocolo exato.');
    const base = this.base(), aba = this.tabelaAtendimentos(base);
    const vistos = new Set(); let atual = protocolo, r;
    while (true) {
      if (vistos.has(atual)) throw new Error('Vínculo circular entre protocolos; confira a ficha.');
      vistos.add(atual);
      r = aba.getRange(this.localizar(aba, atual), 1, 1, 20).getValues()[0];
      if (!r[1] || String(r[1]) === atual) break;
      atual = String(r[1]);
    }
    const ficha = Object.fromEntries(this.cabecalhosAtendimentos.slice(0, 18).map((h, i) => [h, RepositorioDosRegistros.serializar(r[i])]));
    return {protocoloConsultado: protocolo, protocoloPrincipal: atual, ficha: ficha, detalhes: JSON.parse(r[19])};
  }
  static resumo(mes) {
    const inicio = Date.now(), params = this.filtros({mes: mes}), base = this.base();
    const aba = RepositorioDosRegistros.exigirTabela(base), atd = this.tabelaAtendimentos(base), fuso = base.getSpreadsheetTimeZone();
    const cache = CacheService.getScriptCache();
    const chave = 'c40:resumo:' + RepositorioDosRegistros.hash([base.getId(), params.f.mes, aba.getLastRow(), atd.getLastRow()]);
    const salvo = cache.get(chave);
    if (salvo) { try { return {...JSON.parse(salvo), cache: true, tempoMs: Date.now() - inicio}; } catch (_) { cache.remove(chave); } }
    const procedimentos = new Map(), obras = new Map();
    let registros = 0, participacoesInformadas = 0, relatosSemPublico = 0;
    for (let primeira = 2; primeira <= aba.getLastRow(); primeira += 1000) {
      const linhas = aba.getRange(primeira, 1, Math.min(1000, aba.getLastRow() - primeira + 1), 19).getValues();
      linhas.forEach(r => {
        if (!r[0] || !this.atende(r, params.f, fuso)) return;
        registros++; procedimentos.set(String(r[1]), (procedimentos.get(String(r[1])) || 0) + 1);
        if (r[10]) obras.set(String(r[10]), (obras.get(String(r[10])) || 0) + 1);
        if (RepositorioDosRegistros.normalizar(r[1]) === 'relato de atividade') {
          if (r[14] !== '' && /^\d+$/.test(String(r[14]))) participacoesInformadas += Number(r[14]); else relatosSemPublico++;
        }
      });
    }
    const n = atd.getLastRow() - 1;
    const fichas = n > 0 ? atd.getRange(2, 1, n, 18).getValues() : [];
    let casosPrincipais = 0, casosAbertos = 0, casosConcluidos = 0, concluidosNoMes = 0;
    fichas.forEach(r => {
      if (!r[0] || r[1] && r[0] !== r[1] || /incorporad|mesclad/.test(RepositorioDosRegistros.normalizar(r[2]))) return;
      casosPrincipais++;
      const concluido = /conclu|encerrad|finaliz/.test(RepositorioDosRegistros.normalizar(r[3]));
      if (concluido) {
        casosConcluidos++;
        const data = RepositorioDosRegistros.dataCivil(r[5], fuso);
        if (data && (!params.f.mes || data.slice(0, 7) === params.f.mes)) concluidosNoMes++;
      } else casosAbertos++;
    });
    const lista = m => [...m].map(([nome, quantidade]) => ({nome: nome, quantidade: quantidade}))
      .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome));
    const r = {mes: params.f.mes || 'Todo o histórico', registros: registros,
      participacoesInformadas: participacoesInformadas, relatosSemPublico: relatosSemPublico,
      porProcedimento: lista(procedimentos), porObraId: lista(obras),
      carteiraAtual: {casosPrincipais: casosPrincipais, abertos: casosAbertos, concluidos: casosConcluidos},
      concluidosNoMes: concluidosNoMes, atualizadoEm: new Date().toISOString(),
      explicacoes: {registros: 'Envios no mês de realização do procedimento; não representa apenas ações socioambientais.',
        participacoes: 'Soma do público informado nos relatos de atividade; uma pessoa pode participar mais de uma vez.',
        carteira: 'Estado atual das fichas operacionais; não representa uma fotografia histórica do mês.',
        atendimentos: 'Novos envios do formulário são registros; este módulo não cria, conclui ou reabre fichas operacionais.'}};
    const texto = JSON.stringify(r); if (Utilities.newBlob(texto).getBytes().length < 90000) cache.put(chave, texto, 30);
    return {...r, cache: false, tempoMs: Date.now() - inicio};
  }
}

function consultarRegistrosCampo40(parametros) { return ConsultasDaBase.listar(parametros); }
function consultarDetalheCampo40(id) { return ConsultasDaBase.detalhe(id); }
function consultarFichaCampo40(protocolo) { return ConsultasDaBase.ficha(protocolo); }
function consultarResumoCampo40(mes) { return ConsultasDaBase.resumo(mes); }
/** Conferência opcional de leitura: não precisa informar parâmetros pelo editor. */
function conferirConsultasCampo40() {
  const base = ConsultasDaBase.base(), mes = Utilities.formatDate(new Date(), base.getSpreadsheetTimeZone(), 'yyyy-MM');
  const resumo = ConsultasDaBase.resumo(mes), pagina = ConsultasDaBase.listar({mes: mes, limite: 1});
  const r = {resultado: 'CONSULTAS CONFERIDAS', mes: mes, registrosNoMes: resumo.registros,
    carteiraAtual: resumo.carteiraAtual, tempoResumoMs: resumo.tempoMs, tempoPaginaMs: pagina.tempoMs,
    dadosAlterados: false, observacao: 'Tempos desta execução; não é uma promessa de velocidade da futura aplicação.'};
  console.log(JSON.stringify(r, null, 2)); return r;
}

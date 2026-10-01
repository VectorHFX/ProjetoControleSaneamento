/**
 * ImportacaoDosAtendimentos — 1.0.1
 * Preserva casos principais, protocolos incorporados, fichas e movimentações.
 * Não reexecuta correções, pedidos do painel, mensagens ou atualizações antigas.
 * A Base Fichas Oficiais é a referência do estado atual dos casos principais.
 */
class ImportacaoDosAtendimentos {
  static get cabecalhos() { return ['Protocolo', 'Protocolo principal', 'Situação do protocolo', 'Status', 'Data de abertura', 'Data de conclusão', 'Nome', 'Assunto', 'Endereço', 'Frente de obra', 'Área responsável', 'Responsável', 'Próxima ação', 'Atualização operacional', 'Documento', 'PDF', 'Origem', 'Pesquisa', 'Hash', 'Detalhes JSON']; }
  static get cabecalhosMovimentos() { return ['ID', 'Protocolo', 'Data e hora', 'Tipo', 'Status', 'Autor', 'Resumo', 'Origem', 'Hash', 'Detalhes JSON']; }
  /** O Excel abrevia nomes longos de abas. Identificar a tabela pelo esquema. */
  static identificar(base, especificacoes) {
    const D = DadosDaImportacao, abas = base.getSheets(), cache = new Map(), resultado = {};
    const corresponde = (aba, campos) => {
      if (!cache.has(aba)) {
        const n = Math.min(12, aba.getMaxRows()), m = Math.min(60, aba.getMaxColumns());
        const inicio = n && m ? aba.getRange(1, 1, n, m).getValues() : [];
        cache.set(aba, inicio.map(r => new Set(r.map(D.normalizar))));
      }
      return cache.get(aba).some(h => campos.every(c => h.has(D.normalizar(c))));
    };
    Object.keys(especificacoes).forEach(chave => {
      const [nome, campos] = especificacoes[chave], esperado = D.normalizar(nome);
      // Primeiro consulta nomes conhecidos, incluindo nomes completos após a abreviação.
      const preferidas = abas.filter(s => D.normalizar(s.getName()).startsWith(esperado));
      let candidatas = preferidas.filter(s => corresponde(s, campos));
      // Uma aba renomeada pode ser encontrada pelo conjunto de cabeçalhos.
      if (!candidatas.length) candidatas = abas.filter(s => corresponde(s, campos));
      if (candidatas.length !== 1) {
        if (candidatas.length > 1) throw new Error('Mais de uma tabela corresponde a ' + nome + ': ' + candidatas.map(s => s.getName()).join(', ') + '. Nenhum atendimento foi importado.');
        throw new Error('Tabela não identificada: ' + nome + '. Cabeçalhos esperados: ' + campos.join(', ') + '. Abas disponíveis: ' + abas.map(s => s.getName()).join(' | ') + '. Nenhum atendimento foi importado.');
      }
      resultado[chave] = candidatas[0];
    });
    return resultado;
  }
  static ler(base) {
    const D = DadosDaImportacao;
    const obrigatorias = {
      aberturas: ['Base de Atendimentos', ['Chave de origem', 'ID', 'Assunto']],
      oficiais: ['Base Fichas Oficiais', ['Chave do registro', 'Protocolo', 'Status', 'ID do documento']],
      historico: ['Histórico', ['ID', 'Data e hora', 'Status', 'Chave do evento']],
      manuais: ['Base Encerrados Manuais', ['Identificador', 'Dados do registro']],
      vinculos: ['Vínculos de protocolos', ['Protocolo incorporado', 'Protocolo principal', 'Estado']],
      correcoes: ['Correções da Ficha Final de Ate', ['Protocolo', 'Campo a corrigir', 'Chave de auditoria']]
    };
    // Confere todas as identidades antes das leituras completas de dados, links e fórmulas.
    const identificadas = this.identificar(base, obrigatorias);
    const t = {baseId: base.getId(), fuso: base.getSpreadsheetTimeZone()};
    Object.keys(obrigatorias).forEach(k => { const [, campos] = obrigatorias[k]; t[k] = D.ler(identificadas[k], campos); });
    // Arquivo de contexto: preserva a fila sem executá-la no novo sistema.
    t.contexto = [];
    [['Solicitações do Painel', ['ID', 'Ação', 'Dados']], ['Registro de avisos', ['Chave do aviso', 'Protocolo']],
      ['Configuração Fichas', ['Configuração', 'Valor']]].forEach(([nome, campos]) => {
      const aba = base.getSheetByName(nome); if (aba) t.contexto.push(D.ler(aba, campos));
    });
    return t;
  }
  static preparar(t) {
    const D = DadosDaImportacao, get = (o, ...chaves) => D.obter(o, ...chaves);
    const casos = new Map(), avisos = [], movimentos = [], ocorrencias = new Map();
    const caso = id => {
      id = D.texto(id);
      if (!id) throw new Error('Atendimento sem protocolo; confira a fonte.');
      if (!casos.has(id)) casos.set(id, {protocolo: id, baseOrigemId: t.baseId, aberturas: [], oficiais: [], manuais: [], historico: [], correcoes: [], vinculos: []});
      return casos.get(id);
    };
    let modelosIgnorados = 0;
    const guardar = (tabela, campo, destino) => {
      D.exigir(tabela, [campo]);
      tabela.linhas.forEach((r, i) => {
        const detalhe = D.detalhe(tabela, i), o = detalhe.campos, id = get(o, campo);
        if (!id && destino === 'correcoes' &&
            ['Campo a corrigir', 'Novo valor', 'Motivo da correção', 'Chave de auditoria', 'Aplicada em', 'Aplicada por'].every(k => !get(o, k)) &&
            get(o, 'Confirmar aplicação') !== true) { modelosIgnorados++; return; }
        if (!id) throw new Error(tabela.aba + ': linha ' + tabela.numeros[i] + ' sem protocolo.');
        caso(id)[destino].push(detalhe);
      });
    };
    guardar(t.aberturas, 'ID', 'aberturas'); guardar(t.oficiais, 'Protocolo', 'oficiais');
    guardar(t.historico, 'ID', 'historico'); guardar(t.correcoes, 'Protocolo', 'correcoes');
    t.manuais.linhas.forEach((r, i) => {
      const detalhe = D.detalhe(t.manuais, i), o = detalhe.campos;
      try { detalhe.dados = JSON.parse(get(o, 'Dados do registro')); } catch (_) { throw new Error('Cadastro encerrado manual: JSON inválido na linha ' + t.manuais.numeros[i]); }
      caso(get(o, 'Identificador')).manuais.push(detalhe);
    });
    const incorporados = new Map();
    t.vinculos.linhas.forEach((r, i) => {
      const detalhe = D.detalhe(t.vinculos, i), o = detalhe.campos;
      const id = D.texto(get(o, 'Protocolo incorporado')), principal = D.texto(get(o, 'Protocolo principal'));
      if (!id || !principal) throw new Error('Vínculo de protocolo incompleto.');
      caso(id).vinculos.push(detalhe); caso(principal);
      if (D.normalizar(get(o, 'Estado')) === 'ativa') {
        if (incorporados.has(id) && incorporados.get(id) !== principal) throw new Error('Protocolo incorporado a dois casos: ' + id);
        incorporados.set(id, principal);
      }
    });
    const principalDe = id => {
      const visitados = new Set(); let p = id;
      while (incorporados.has(p)) { if (visitados.has(p)) throw new Error('Vínculo circular de protocolos: ' + id); visitados.add(p); p = incorporados.get(p); }
      return p;
    };
    // Conteúdo + ocorrência conserva eventos repetidos, inclusive sem chave de auditoria.
    const adicionarMovimento = (id, detalhe, tipo, data, status, autor, resumo, origem, chave) => {
      const base = D.hash([t.baseId, origem, id, chave || '', detalhe.campos]);
      const numero = (ocorrencias.get(base) || 0) + 1; ocorrencias.set(base, numero);
      const comOrigem = {baseOrigemId: t.baseId, ...detalhe};
      const json = JSON.stringify(D.serializar(comOrigem));
      movimentos.push(['MOV-' + base.slice(0, 24) + '-' + numero, id, data || '', tipo, status || '', autor || '', resumo || '', origem, D.hash(comOrigem), json]);
    };
    let encerrados = 0, ativos = 0, semEstado = 0, documentos = 0, pdfs = 0;
    const linhas = [];
    [...casos.values()].sort((a, b) => a.protocolo.localeCompare(b.protocolo)).forEach(c => {
      if (c.oficiais.length > 1) throw new Error('Base Fichas Oficiais: protocolo repetido ' + c.protocolo);
      c.aberturas.sort((a, b) => String(get(a.campos, 'Carimbo de data/hora')).localeCompare(String(get(b.campos, 'Carimbo de data/hora'))));
      c.historico.sort((a, b) => String(get(a.campos, 'Data e hora')).localeCompare(String(get(b.campos, 'Data e hora'))));
      const oficial = c.oficiais.length ? c.oficiais[0].campos : null;
      const abertura = c.aberturas.length ? c.aberturas[0].campos : {};
      const manual = c.manuais.length ? c.manuais[c.manuais.length - 1].dados : {};
      const ultimo = c.historico.length ? c.historico[c.historico.length - 1].campos : {};
      const p = principalDe(c.protocolo), mesclado = p !== c.protocolo;
      if (!oficial && !mesclado && !c.aberturas.length && !c.manuais.length) throw new Error('Movimentação sem ficha de origem: ' + c.protocolo);
      const o = oficial || {};
      // O estado oficial tem prioridade. Não inferir conclusão a partir de uma abertura.
      const status = get(o, 'Status') || get(ultimo, 'Status') || (manual.dataConclusao ? 'Concluída' : 'Estado a conferir');
      const fechado = D.normalizar(status) === 'concluida';
      if (!mesclado) { if (fechado) encerrados++; else if (status === 'Estado a conferir') semEstado++; else ativos++; }
      if (!oficial && !mesclado) avisos.push('Sem ficha oficial atual: ' + c.protocolo);
      const nome = get(o, 'Nome') || manual.nome || get(abertura, 'Nome do solicitante');
      const assunto = get(o, 'Assunto') || manual.assunto || get(abertura, 'Assunto');
      const endereco = get(o, 'Endereço') || manual.endereco || get(abertura, 'Endereço do solicitante');
      const docId = D.texto(get(o, 'ID do documento')), pdfId = D.texto(get(o, 'ID do PDF atual'));
      const doc = docId ? 'https://docs.google.com/document/d/' + docId + '/edit' : '';
      const pdf = pdfId ? 'https://drive.google.com/file/d/' + pdfId + '/view' : '';
      if (doc) documentos++; if (pdf) pdfs++;
      const dataConclusao = get(o, 'Data de conclusão') || manual.dataConclusao || '';
      if (fechado && !dataConclusao) avisos.push('Conclusão sem data: ' + c.protocolo);
      const origem = oficial ? 'Base Fichas Oficiais' : c.manuais.length ? 'Base Encerrados Manuais' : 'Base de Atendimentos e Histórico';
      const json = JSON.stringify(D.serializar(c));
      linhas.push([c.protocolo, p, mesclado ? 'Incorporado' : 'Principal', status,
        get(o, 'Data de abertura') || manual.dataAbertura || get(abertura, 'Data do atendimento'), dataConclusao,
        nome, assunto, endereco, get(o, 'Frente de obra') || manual.frente || get(abertura, 'Ponto de referência'),
        get(o, 'Área responsável pela próxima ação') || get(ultimo, 'Área responsável pela próxima ação'),
        get(o, 'Responsável pelo atendimento') || manual.responsavel || get(abertura, 'Responsável pelo registro'),
        get(o, 'Próxima ação') || get(ultimo, 'Próxima ação'), get(o, 'Última atualização operacional') || get(ultimo, 'Data e hora'),
        doc, pdf, origem, D.normalizar([c.protocolo, p, nome, assunto, endereco].join(' ')), D.hash(c), json]);
      c.historico.forEach(d => { const h = d.campos; adicionarMovimento(c.protocolo, d, get(h, 'Tipo de evento') || 'Atualização', get(h, 'Data e hora'), get(h, 'Status'), get(h, 'Usuário'), get(h, 'Observação / tratativa'), t.historico.aba, get(h, 'Chave do evento')); });
      c.correcoes.forEach(d => { const h = d.campos; adicionarMovimento(c.protocolo, d, 'Correção de ficha', get(h, 'Aplicada em'), get(h, 'Situação'), get(h, 'Aplicada por'), get(h, 'Motivo aplicado', 'Motivo da correção'), t.correcoes.aba, get(h, 'Chave de auditoria')); });
      c.manuais.forEach(d => { const h = d.campos; adicionarMovimento(c.protocolo, d, 'Cadastro de histórico encerrado', get(h, 'Registrado em'), 'Registrado', get(h, 'Responsável pelo cadastro'), get(h, 'Motivo da revisão'), t.manuais.aba, get(h, 'Revisão')); });
      c.vinculos.forEach(d => { const h = d.campos; adicionarMovimento(c.protocolo, d, 'Vínculo de protocolos', get(h, 'Data'), get(h, 'Estado'), get(h, 'Autor'), get(h, 'Motivo'), t.vinculos.aba, get(h, 'Protocolo principal')); });
    });
    movimentos.sort((a, b) => String(a[2]).localeCompare(String(b[2])) || a[0].localeCompare(b[0]));
    return {tabelas: [D.tabela('Atendimentos', this.cabecalhos, linhas, [4, 5, 13]), D.tabela('Movimentações', this.cabecalhosMovimentos, movimentos, [2])],
      resumo: {protocolosPreservados: linhas.length, casosPrincipais: linhas.length - incorporados.size, protocolosIncorporados: incorporados.size,
        casosAtivos: ativos, casosConcluidos: encerrados, casosSemEstadoConfirmado: semEstado, documentos, pdfs,
        eventosDeHistorico: t.historico.linhas.length, correcoes: t.correcoes.linhas.length - modelosIgnorados, linhasModeloIgnoradas: modelosIgnorados, revisoesManuais: t.manuais.linhas.length,
        vinculos: t.vinculos.linhas.length, movimentacoes: movimentos.length, avisos}};
  }
}

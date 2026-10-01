/**
 * ImportacaoDosHistoricos — 1.0.2
 * Migração executada sob demanda, no projeto Campo 4.0 instalado.
 * Congela fontes em JSON na pasta existente; cria somente Registros,
 * Atendimentos e Movimentações. Respostas, fontes e gatilhos ficam intactos.
 * Depende de ConfiguracaoDaBase, CatalogosDeObrasEBairros,
 * AuditoriaDaImportacao e ImportacaoDosAtendimentos.
 */
class DadosDaImportacao {
  static normalizar(v) { return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' '); }
  static serializar(v) {
    if (v instanceof Date) return v.toISOString();
    if (Array.isArray(v)) return v.map(x => this.serializar(x));
    if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).map(k => [k, this.serializar(v[k])]));
    return v == null ? '' : v;
  }
  static hash(v) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(this.serializar(v)), Utilities.Charset.UTF_8)
      .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
  }
  static texto(v) { return String(v == null ? '' : v).trim(); }
  static data(v, fuso) {
    if (!v) return '';
    if (v instanceof Date) return Utilities.formatDate(v, fuso, 'yyyy-MM-dd');
    const s = this.texto(v);
    if (/^\d{4}-\d{2}-\d{2}T/.test(s) && Number.isFinite(Date.parse(s))) return Utilities.formatDate(new Date(s), fuso, 'yyyy-MM-dd');
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? m[3] + '-' + m[2] + '-' + m[1] : '';
  }
  static objeto(t, r) { return Object.fromEntries(t.cabecalhos.map((h, i) => [h, r[i] == null ? '' : r[i]])); }
  static obter(o, ...nomes) {
    const mapa = new Map(Object.keys(o).map(k => [this.normalizar(k), o[k]]));
    for (const n of nomes) { const v = mapa.get(this.normalizar(n)); if (v !== undefined && v !== '' && v !== null) return v; }
    return '';
  }
  static exigir(t, campos) {
    const nomes = new Set(t.cabecalhos.map(x => this.normalizar(x)));
    campos.forEach(x => { if (!nomes.has(this.normalizar(x))) throw new Error(t.aba + ': coluna obrigatória ausente: ' + x); });
    if (nomes.size !== t.cabecalhos.length) throw new Error(t.aba + ': cabeçalhos repetidos ou vazios.');
  }
  /** Lê em lote; conserva fórmulas e links reais, inclusive células “Abrir ficha”. */
  static ler(aba, campos) {
    if (!aba) throw new Error('Tabela necessária ausente: ' + campos.join(', '));
    const n = aba.getLastRow(), m = aba.getLastColumn();
    if (!n || !m) throw new Error('Tabela sem cabeçalho: ' + aba.getName());
    const valores = aba.getRange(1, 1, n, m).getValues();
    const norm = this.normalizar;
    const inicio = valores.slice(0, 12).findIndex(r => campos.every(c => r.some(v => norm(v) === norm(c))));
    if (inicio < 0) throw new Error(aba.getName() + ': cabeçalho não identificado.');
    let largura = valores[inicio].length;
    while (largura && !valores[inicio][largura - 1]) largura--;
    const cabecalhos = valores[inicio].slice(0, largura).map(v => String(v).trim());
    if (cabecalhos.some(x => !x)) throw new Error(aba.getName() + ': coluna sem nome.');
    const linhas = [], numeros = [], links = [], formulas = [];
    if (n > inicio + 1) {
      const faixa = aba.getRange(inicio + 2, 1, n - inicio - 1, largura);
      const rt = faixa.getRichTextValues(), ff = faixa.getFormulas();
      valores.slice(inicio + 1).forEach((r, i) => {
        r = r.slice(0, largura);
        // Checkboxes desmarcados em linhas-modelo não são registros.
        if (!r.some(v => v !== '' && v !== null && v !== false)) return;
        linhas.push(r); numeros.push(inicio + 2 + i);
        const ll = {}, f = {};
        cabecalhos.forEach((h, j) => {
          const item = rt[i][j], urls = new Set();
          if (item) { const u = item.getLinkUrl(); if (u) urls.add(u); item.getRuns().forEach(run => { const u = run.getLinkUrl(); if (u) urls.add(u); }); }
          if (urls.size) ll[h] = [...urls];
          if (ff[i][j]) f[h] = ff[i][j];
        });
        links.push(ll); formulas.push(f);
      });
    }
    const t = {aba: aba.getName(), id: aba.getSheetId(), cabecalhos, linhas, numeros, links, formulas};
    this.exigir(t, campos); return t;
  }
  static detalhe(t, i) { return {aba: t.aba, abaId: t.id, linha: t.numeros[i], campos: this.objeto(t, t.linhas[i]), links: t.links[i], formulas: t.formulas[i]}; }
  static tabela(nome, cabecalhos, linhas, datas) {
    const ids = new Set();
    linhas.forEach(r => {
      if (!r[0] || ids.has(r[0])) throw new Error(nome + ': identidade repetida ou vazia.');
      ids.add(r[0]);
      if (r.length !== cabecalhos.length) throw new Error(nome + ': largura incorreta.');
      r.forEach(v => { if (typeof v === 'string' && v.length > 45000) throw new Error(nome + ': detalhe excede 45 mil caracteres; nenhuma tabela será escrita.'); });
    });
    return {nome, cabecalhos, linhas: this.serializar(linhas), datas: datas || []};
  }
}

class ImportacaoDosHistoricos {
  static get cabecalhos() { return ['ID', 'Procedimento', 'Data do procedimento', 'Mês', 'Carimbo do envio', 'Origem', 'ID legado', 'Bairro', 'Bairro ID', 'Obra de referência', 'Obra ID', 'Responsável', 'Área', 'Atividade', 'Público informado', 'Protocolo informado', 'Situação do vínculo', 'Pesquisa', 'Conferência dos campos', 'Hash', 'Detalhes JSON']; }
  static preparar(fontes, catalogos, fuso) {
    const D = DadosDaImportacao, r = fontes.respostas, c = fontes.consolidada;
    const audit = AuditoriaDaImportacao.conferir(r, c);
    if (audit.conferenciasPendentes.length) throw new Error('Conferência da origem: ' + audit.conferenciasPendentes.join(' | '));
    const chave = o => D.hash([D.obter(o, 'Carimbo de data/hora'), D.obter(o, 'Selecione o procedimento a ser executado')]);
    const grupos = new Map();
    r.linhas.forEach((row, i) => { const o = D.objeto(r, row), k = chave(o); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(i); });
    const colunasConsolidadas = new Map(c.cabecalhos.map((h, i) => [D.normalizar(h), i]));
    const colunasCompartilhadas = r.cabecalhos.map((h, i) => ({h, i, j: colunasConsolidadas.get(D.normalizar(h))})).filter(x => x.j !== undefined);
    const nomes = lista => { const mapa = new Map(); lista.forEach(x => { const k = D.normalizar(x.nome); if (!mapa.has(k)) mapa.set(k, []); mapa.get(k).push(x.id); }); return mapa; };
    const bairros = nomes(catalogos.bairros), obras = nomes(catalogos.obras);
    const idExato = (mapa, nome) => { const ids = mapa.get(D.normalizar(nome)) || []; return ids.length === 1 ? ids[0] : ''; };
    const camposNumericos = new Set(['Total de participantes', 'Quantas pessoas estavam no veículo com você no inicio dessa atividade.', 'Quantidade de panfletos entregues'].map(D.normalizar));
    const mesmoNumero = (a, b, h) => camposNumericos.has(D.normalizar(h)) &&
      /^\d+(?:\.\d+)?$/.test(String(a)) && /^\d+(?:\.\d+)?$/.test(String(b)) && Number(a) === Number(b);
    let diferentes = 0, ambiguos = 0, formatosNumericos = 0;
    const linhas = c.linhas.map((row, i) => {
      const o = D.objeto(c, row), origem = D.texto(D.obter(o, 'Origem do registro')), legado = D.texto(D.obter(o, 'ID de migração'));
      const id = 'REG-' + D.hash([fontes.origemId, origem, legado]).slice(0, 24);
      const candidatos = D.normalizar(origem) === 'procedimentos de campo 3.0' ? (grupos.get(chave(o)) || []) : [];
      // Cabeçalhos compartilhados são comparados campo a campo, preservando ambas as versões.
      const comparar = j => {
        const raw = r.linhas[j], pares = [], formatos = [];
        colunasCompartilhadas.forEach(x => {
          if (JSON.stringify(D.serializar(raw[x.i])) === JSON.stringify(D.serializar(row[x.j]))) return;
          if (mesmoNumero(raw[x.i], row[x.j], x.h)) formatos.push(x.h); else pares.push(x.h);
        });
        return {j, campos: pares, formatos};
      };
      const comparacoes = candidatos.map(comparar), iguais = comparacoes.filter(x => !x.campos.length);
      const unico = comparacoes.length === 1 ? comparacoes[0] : iguais.length === 1 ? iguais[0] : null;
      let conferencia = 'Histórico de ' + origem;
      if (candidatos.length) {
        if (!unico) { conferencia = 'Correspondência ambígua; versões preservadas'; ambiguos++; }
        else if (unico.campos.length) { conferencia = 'Campos diferentes; versões preservadas'; diferentes++; }
        else conferencia = 'Campos compartilhados conferidos';
        if (unico && unico.formatos.length) { formatosNumericos++; if (!unico.campos.length) conferencia = 'Campos conferidos; formatos numéricos preservados'; }
      }
      const detalhe = {baseOrigemId: fontes.origemId, consolidado: D.detalhe(c, i), respostas30: (unico ? [unico.j] : candidatos).map(j => D.detalhe(r, j)), comparacao: comparacoes.map(x => ({linhaResposta: r.numeros[x.j], camposDiferentes: x.campos, formatosNumericosDiferentes: x.formatos}))};
      const data = D.data(D.obter(o, 'Data de realização do procedimento'), fuso);
      const bairro = D.texto(D.obter(o, 'Bairro de realização do procedimento'));
      const obra = D.texto(D.obter(o, 'Qual a obra de referência?', 'Título da frente de serviço'));
      const bairroId = idExato(bairros, bairro), obraId = idExato(obras, obra);
      const tipo = D.texto(D.obter(o, 'Selecione o procedimento a ser executado'));
      const pessoa = D.texto(D.obter(o, 'Colaborador responsável pelo registro'));
      const atividade = D.texto(D.obter(o, 'Atividade realizada'));
      const protocolo = D.texto(D.obter(o, 'Informe o ID do atendimento'));
      const publico = D.obter(o, 'Total de participantes');
      const json = JSON.stringify(D.serializar(detalhe));
      return [id, tipo, data ? data + 'T12:00:00.000Z' : '', data.slice(0, 7), D.obter(o, 'Carimbo de data/hora'), origem, legado, bairro, bairroId, obra, obraId, pessoa,
        D.obter(o, 'Área responsável pelo procedimento'), atividade, publico, protocolo,
        obraId ? 'Obra com nome exato' : 'Obra sem vínculo confirmado', D.normalizar([tipo, bairro, obra, pessoa, atividade, protocolo].join(' ')), conferencia, D.hash(detalhe), json];
    });
    return {tabela: D.tabela('Registros', this.cabecalhos, linhas, [2, 4]), auditoria: {...audit, registrosComCamposDiferentes: diferentes, registrosComFormatosNumericosDiferentes: formatosNumericos, correspondenciasAmbiguas: ambiguos}};
  }
}

/** Coordenação da migração. Checkpoint separado da configuração já instalada. */
class ExecucaoDaImportacao {
  static get chave() { return 'CAMPO40_MIGRACAO_1'; }
  static get atendimentoId() { return '1UHs_jFVD7jQRKgw7CVPCQ8R7sgvyhkJVv5rcj0v2K5g'; }
  static estado() { return JSON.parse(PropertiesService.getScriptProperties().getProperty(this.chave) || '{}'); }
  static salvar(e) { PropertiesService.getScriptProperties().setProperty(this.chave, JSON.stringify(e)); }
  static json(id) { return JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString('UTF-8')); }
  static criar(pasta, nome, dados) { return pasta.createFile(nome, JSON.stringify(DadosDaImportacao.serializar(dados)), MimeType.PLAIN_TEXT).getId(); }
  static fontes(config) {
    if (!config.origemImportacaoId || !config.auditoriaImportacaoId) throw new Error('Execute analisarImportacaoCampo40 primeiro.');
    if ([config.origemImportacaoId, this.atendimentoId].includes(config.baseId)) throw new Error('Origem e destino não podem coincidir.');
    const audit = this.json(config.auditoriaImportacaoId);
    if (audit.conferenciasPendentes.length) throw new Error('A conferência anterior tem pendências.');
    const antiga = SpreadsheetApp.openById(config.origemImportacaoId);
    const respostaInfo = audit.tabelas.find(x => /respostas/i.test(x.nome));
    if (!respostaInfo) throw new Error('A conferência não identifica a aba de respostas antiga.');
    const resposta = antiga.getSheets().find(s => s.getSheetId() === respostaInfo.id);
    const D = DadosDaImportacao;
    const fontes = {origemId: antiga.getId(), atendimentoId: this.atendimentoId, capturadoEm: new Date().toISOString(),
      fuso: antiga.getSpreadsheetTimeZone(),
      respostas: D.ler(resposta, ['Carimbo de data/hora', 'Selecione o procedimento a ser executado']),
      consolidada: D.ler(antiga.getSheetByName('Base Consolidada'), ['ID de migração', 'Origem do registro']),
      controle: ImportacaoDosAtendimentos.ler(SpreadsheetApp.openById(this.atendimentoId))};
    const nova = SpreadsheetApp.openById(config.baseId);
    fontes.catalogos = CatalogosDeObrasEBairros.ler(nova);
    return fontes;
  }
  static planejar(fontes) {
    const registros = ImportacaoDosHistoricos.preparar(fontes, fontes.catalogos, fontes.fuso);
    const atendimentos = ImportacaoDosAtendimentos.preparar(fontes.controle);
    return {versao: '1.0.0', capturadoEm: fontes.capturadoEm, origemId: fontes.origemId, atendimentoId: fontes.atendimentoId,
      tabelas: [registros.tabela, ...atendimentos.tabelas], registros: registros.auditoria, atendimento: atendimentos.resumo};
  }
  /** Equivalência de armazenamento, sem modificar o plano nem a linha existente. */
  static compararCelula(atual, esperado, coluna, tabela, fuso) {
    const D = DadosDaImportacao, h = tabela.cabecalhos[coluna];
    if (JSON.stringify(D.serializar(atual)) === JSON.stringify(D.serializar(esperado))) return {igual: true};
    const datas = tabela.datas || [];
    if (datas.includes(coluna) && typeof esperado === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(esperado)) {
      const instante = Date.parse(esperado);
      if (Number.isFinite(instante)) {
        // Datas são números decimais em Sheets. O ciclo de leitura pode variar 1 ms.
        if (atual instanceof Date && Math.abs(atual.getTime() - instante) <= 1) return {igual: true, conversao: 'Precisão de data (até 1 ms)'};
        if (typeof atual === 'number') {
          const parede = Utilities.formatDate(new Date(instante), fuso, "yyyy-MM-dd'T'HH:mm:ss.SSS");
          const serie = Date.parse(parede + 'Z') / 86400000 + 25569;
          if (Math.abs(atual - serie) * 86400000 <= 1) return {igual: true, conversao: 'Data em número serial'};
        }
      }
    }
    if (atual instanceof Date && typeof esperado === 'string') {
      if (h === 'Mês' && /^\d{4}-\d{2}$/.test(esperado) &&
          Utilities.formatDate(atual, fuso, 'yyyy-MM-dd HH:mm:ss.SSS') === esperado + '-01 00:00:00.000') return {igual: true, conversao: 'Mês convertido em data'};
      if (datas.includes(coluna) && ['Data de abertura', 'Data de conclusão'].includes(h) && /^\d{4}-\d{2}-\d{2}$/.test(esperado) &&
          Utilities.formatDate(atual, fuso, 'yyyy-MM-dd') === esperado) return {igual: true, conversao: 'Data de calendário'};
    }
    // Apenas quantidade: jamais converter protocolos, IDs, telefones ou textos.
    const numero = v => typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && /^\d+(?:\.\d+)?$/.test(v) ? Number(v) : null;
    if (h === 'Público informado' && numero(atual) !== null && numero(esperado) !== null && numero(atual) === numero(esperado)) return {igual: true, conversao: 'Quantidade convertida em número/texto'};
    return {igual: false};
  }
  static verificarDestino(base, tabela) {
    const aba = base.getSheetByName(tabela.nome);
    if (!aba) return {aba: null, faltantes: tabela.linhas};
    if (!aba.getLastRow()) return {aba, faltantes: tabela.linhas};
    const n = aba.getLastRow(), m = aba.getLastColumn();
    if (m !== tabela.cabecalhos.length) throw new Error(tabela.nome + ': estrutura diferente; nenhuma linha será sobrescrita.');
    const faixa = aba.getRange(1, 1, n, m), valores = faixa.getValues(), formulas = faixa.getFormulas();
    if (JSON.stringify(valores[0]) !== JSON.stringify(tabela.cabecalhos)) throw new Error(tabela.nome + ': cabeçalhos diferentes.');
    const ids = new Map(), esperados = new Map(tabela.linhas.map(r => [r[0], r])), conversoes = {};
    const fuso = base.getSpreadsheetTimeZone();
    valores.slice(1).forEach((r, indice) => {
      if (!r.some(v => v !== '')) return;
      if (!r[0] || ids.has(r[0])) throw new Error(tabela.nome + ': ID vazio ou repetido no destino.');
      ids.set(r[0], r);
      const esperado = esperados.get(r[0]);
      if (esperado) {
        const divergentes = [];
        r.forEach((atual, j) => {
          if (formulas[indice + 1][j]) { divergentes.push(tabela.cabecalhos[j] + ' (contém fórmula)'); return; }
          const c = this.compararCelula(atual, esperado[j], j, tabela, fuso);
          if (!c.igual) {
            const tipo = v => v instanceof Date ? 'Date' : typeof v;
            const precisao = atual instanceof Date && typeof esperado[j] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(esperado[j]) ? '; diferença de ' + (atual.getTime() - Date.parse(esperado[j])) + ' ms' : '';
            divergentes.push(tabela.cabecalhos[j] + ' (plano: ' + tipo(esperado[j]) + '; planilha: ' + tipo(atual) + precisao + ')');
          } else if (c.conversao) conversoes[c.conversao] = (conversoes[c.conversao] || 0) + 1;
        });
        if (divergentes.length) throw new Error(tabela.nome + ': registro ' + r[0] + ' foi alterado no destino ou sofreu conversão não equivalente. Linha ' + (indice + 2) + '. Colunas divergentes: ' + divergentes.join(' | ') + '. Nenhuma linha existente foi sobrescrita.');
      }
    });
    return {aba, faltantes: tabela.linhas.filter(r => !ids.has(r[0])), conversoes};
  }
  static gravar(base, t, inicio) {
    const D = DadosDaImportacao, v = this.verificarDestino(base, t);
    let aba = v.aba;
    if (!aba) aba = base.insertSheet(t.nome);
    if (aba.getMaxColumns() < t.cabecalhos.length) aba.insertColumnsAfter(aba.getMaxColumns(), t.cabecalhos.length - aba.getMaxColumns());
    if (!aba.getLastRow()) {
      aba.getRange(1, 1, 1, t.cabecalhos.length).setValues([t.cabecalhos]).setFontWeight('bold').setBackground('#153f4f').setFontColor('#ffffff');
      aba.setFrozenRows(1); aba.setColumnWidths(1, t.cabecalhos.length, 155);
      aba.setColumnWidth(t.cabecalhos.length, 220);
    }
    let escritos = 0;
    while (escritos < v.faltantes.length && Date.now() - inicio < 210000) {
      const lote = v.faltantes.slice(escritos, escritos + 50), linha = aba.getLastRow() + 1;
      if (aba.getMaxRows() < linha + lote.length - 1) aba.insertRowsAfter(aba.getMaxRows(), linha + lote.length - 1 - aba.getMaxRows());
      // Strings iniciadas por '=' continuam sendo texto, não uma fórmula executável.
      const celulas = lote.map(r => r.map((x, j) => t.datas.includes(j) && /^\d{4}-\d{2}-\d{2}T/.test(String(x)) ? new Date(x) : typeof x === 'string' && /^[=']/.test(x) ? "'" + x : x));
      const faixa = aba.getRange(linha, 1, lote.length, t.cabecalhos.length);
      // Protege mês, IDs e textos contra interpretação automática. Formatos não
      // alteram linhas anteriores; datas novas recebem formato antes da escrita.
      faixa.setNumberFormat('@');
      t.datas.forEach(j => aba.getRange(linha, j + 1, lote.length, 1).setNumberFormat(['Data do procedimento', 'Data de abertura', 'Data de conclusão'].includes(t.cabecalhos[j]) ? 'dd/mm/yyyy' : 'dd/mm/yyyy hh:mm'));
      faixa.setValues(celulas);
      escritos += lote.length;
    }
    const filtro = aba.getFilter();
    if (filtro && filtro.getRange().getNumRows() !== aba.getLastRow()) filtro.remove();
    if (aba.getLastRow() > 1 && !aba.getFilter()) aba.getRange(1, 1, aba.getLastRow(), t.cabecalhos.length).createFilter();
    // Colunas técnicas disponíveis para a aplicação, sem poluir a leitura na planilha.
    aba.hideColumns(t.cabecalhos.length - 1, 2);
    return escritos === v.faltantes.length;
  }
  static executar() {
    return ConfiguracaoDaBase.comTrava(() => {
      const inicio = Date.now(), config = ConfiguracaoDaBase.exigirInstalacao(), base = SpreadsheetApp.openById(config.baseId);
      const pasta = DriveApp.getFolderById(config.pastaId), e = this.estado();
      if (e.baseId && e.baseId !== config.baseId) throw new Error('Este checkpoint pertence a outra base.');
      if (!e.fontesId) {
        const fontes = this.fontes(config);
        // Preflight completo antes de qualquer escrita em tabelas de destino.
        const plano = this.planejar(fontes);
        e.baseId = config.baseId;
        e.fontesId = this.criar(pasta, 'Fontes_Migracao_Campo40_1.json', fontes);
        this.salvar(e);
        e.planoId = this.criar(pasta, 'Plano_Migracao_Campo40_1.json', plano);
        this.salvar(e);
      }
      if (!e.planoId) { e.planoId = this.criar(pasta, 'Plano_Migracao_Campo40_1.json', this.planejar(this.json(e.fontesId))); this.salvar(e); }
      const plano = this.json(e.planoId);
      plano.tabelas.forEach(t => this.verificarDestino(base, t));
      let completo = true;
      for (const t of plano.tabelas) {
        if (Date.now() - inicio >= 210000 || !this.gravar(base, t, inicio)) { completo = false; break; }
      }
      const conversoesConferidas = {};
      if (completo) plano.tabelas.forEach(t => {
        const v = this.verificarDestino(base, t);
        if (v.faltantes.length) throw new Error(t.nome + ': faltam registros após a escrita.');
        conversoesConferidas[t.nome] = v.conversoes || {};
      });
      const resumo = {resultado: completo ? 'IMPORTAÇÃO CONCLUÍDA E CONFERIDA' : 'IMPORTAÇÃO PARCIAL; execute importarHistoricosCampo40 novamente',
        capturadoEm: plano.capturadoEm, registros: plano.registros.consolidados, respostas30Conferidas: plano.registros.respostasAtuais,
        origens: plano.registros.origens, procedimentos: plano.registros.procedimentos,
        camposDiferentesPreservados: plano.registros.registrosComCamposDiferentes,
        formatosNumericosPreservados: plano.registros.registrosComFormatosNumericosDiferentes,
        correspondenciasAmbiguasPreservadas: plano.registros.correspondenciasAmbiguas,
        conversoesDeArmazenamento: conversoesConferidas,
        atendimento: plano.atendimento, tempoMs: Date.now() - inicio,
        fontes: 'https://drive.google.com/file/d/' + e.fontesId + '/view', destino: base.getUrl()};
      e.concluida = completo; e.executadoEm = new Date().toISOString();
      e.resultadoId = ConfiguracaoDaBase.gravarJson(pasta, e.resultadoId, 'Resultado_Migracao_Campo40_1.json', resumo);
      this.salvar(e); console.log(JSON.stringify(resumo, null, 2)); return resumo;
    });
  }
}

/** Execute. Se houver pausa, a mesma função retoma a partir das linhas presentes. */
function importarHistoricosCampo40() { return ExecucaoDaImportacao.executar(); }

/** Consulta o resultado salvo, sem reler fontes nem alterar planilhas. */
function verResultadoImportacaoCampo40() {
  const e = ExecucaoDaImportacao.estado();
  if (!e.resultadoId) throw new Error('Ainda não há resultado de importação salvo.');
  const r = ExecucaoDaImportacao.json(e.resultadoId); console.log(JSON.stringify(r, null, 2)); return r;
}

/**
 * ProgramaParceirosCPT 2.7.0. Respostas mensais do Programa Parceiros, no formato da "Máscara de lançamento".
 * - Cada pergunta é uma linha da máscara (linha 3 a 92, coluna B). O mês é um bloco de colunas (linha 2).
 * - A Gestão responde, marca o que conferiu e salva (versões, sem apagar nada) na planilha de dados da aplicação.
 * - Sugestões vêm dos registros e atendimentos do mês, sempre com a regra de cálculo, e nunca entram sozinhas.
 * - Publicar grava SÓ os campos conferidos na coluna do mês da máscara oficial (conector "parceiros"), sem tocar
 *   em fórmulas, e restaura os valores anteriores se algo falhar. Durante os testes, só o proprietário publica.
 */
class ProgramaParceirosCPT {
  static get aba() { return 'Programa Parceiros'; }
  static get cabecalho() { return ['Competência', 'Versão', 'Operação ID', 'Alterado em', 'Alterado por', 'Situação', 'Conteúdo JSON']; }
  /** Ano dos blocos da máscara que têm só o nome do mês (Junho, Julho…): a máscara começou em 2026. */
  static get anoPadrao() { return 2026; }
  static get grupos() {
    return [
      {id: 'social', nome: 'Social', quem: 'equipe', de: 3, ate: 31},
      {id: 'comunicacao', nome: 'Comunicação', quem: 'equipe', de: 32, ate: 35},
      {id: 'sinistro', nome: 'Sinistro', quem: 'equipe', de: 43, ate: 48},
      {id: 'viario', nome: 'Sistema viário', quem: 'engenharia', de: 36, ate: 38},
      {id: 'qualidade', nome: 'Qualidade', quem: 'engenharia', de: 39, ate: 42},
      {id: 'ambiental', nome: 'Ambiental', quem: 'engenharia', de: 49, ate: 92}
    ];
  }
  /** [linha, tipo, rótulo exatamente como na máscara]. Tipos: numero, nota (0 a 10), texto, marcar, simnao, titulo, escala. */
  static get perguntas() {
    return [
      [3, 'numero', 'Número de economias realizadas no período'],
      [4, 'numero', 'Número de mulheres contratadas DA COMUNIDADE'],
      [5, 'numero', 'Números de homens contratados DA COMUNIDADE'],
      [6, 'numero', 'Número de pessoas contratadas que preferem não identificar o gênero'],
      [7, 'numero', 'Número total de pessoas contratadas pelo consórcio para as obras do Integra Tietê'],
      [8, 'numero', 'Número de reuniões, abertas à comunidade, (podendo ser reuniões de informe de obras, ações socioambientais, educação socioambiental, dentre outras) realizadas nos últimos 30 dias.'],
      [9, 'numero', 'Número total de pessoas presentes nas reuniões abertas à comunidade'],
      [10, 'texto', 'Descreva os temas destas reuniões'],
      [11, 'numero', 'Número total de participantes no módulo 1 do curso de Economia Comportamental'],
      [12, 'nota', 'NPS dos participantes do módulo 1 de Economia Comportamental (média da nota de todos os participantes) (Seleciona de 0 a 10)'],
      [13, 'texto', 'Depoimentos dos participantes no módulo 1 do curso e Economia Comportamental'],
      [14, 'numero', 'Número total de participantes no módulo 2 de Economia Comportamental.'],
      [15, 'nota', 'NPS dos participantes sobre o módulo 2 do curso de Economia Comportamental (média da nota de todos os participantes). (Seleciona de 0 a 10)'],
      [16, 'texto', 'Depoimentos dos participantes no módulo 2'],
      [17, 'nota', 'De 0 a 10, quanto as pessoas estão satisfeitas com os serviços de saneamento? Média de todas as respostas.'],
      [18, 'texto', 'Transcreva os depoimentos dos participantes sobre os serviços de saneamento.'],
      [19, 'nota', 'De 0 a 10, quanto as pessoas percebem melhorias em sua qualidade de vida? Média de todas as respostas.'],
      [20, 'texto', 'Transcreva os depoimentos dos participantes sobre a qualidade de vida'],
      [21, 'numero', 'Número de pontos viciados de descarte de resíduos antes da obra:'],
      [22, 'numero', 'Número de pontos viciados de descarte de resíduos recuperados:'],
      [23, 'numero', 'Número de entradas de manifestações do tipo elogio.'],
      [24, 'numero', 'Número de manifestações concluídas do tipo elogio.'],
      [25, 'numero', 'Número de entradas de manifestações do tipo solicitação.'],
      [26, 'numero', 'Número de manifestações concluídas do tipo solicitação.'],
      [27, 'numero', 'Número de entradas de manifestações do tipo reclamação.'],
      [28, 'numero', 'Número de manifestações concluídas do tipo reclamação.'],
      [29, 'numero', 'Número de manifestações (reclamações) Não Procedentes.'],
      [30, 'numero', 'Número de manifestações de sinistro.'],
      [31, 'numero', 'Qual o prazo médio de atendimento dessas manifestações (em dias)?'],
      [32, 'numero', 'Número de publicações na mídia (jornal, rádio, TV, sites e redes sociais como LinkedIn, Youtube, Instagram, Whatsapp, etc...)'],
      [33, 'numero', 'Número total de pessoas alcançadas.'],
      [34, 'texto', 'Descreva os temas das comunicações feitas, com uma breve descrição da estratégia de divulgação e alcance de cada uma.'],
      [35, 'texto', 'Conte-nos, caso hajam, ações inovadoras executadas na obra. Descreva quais estão em fase de planejamento, quais em execução e compartilhe alguns resultados das que já foram implementadas nesse mês.'],
      [36, 'numero', 'Número de multas aplicadas pelo órgão gestor de tráfego em função do não atendimento a normas específicas.'],
      [37, 'numero', 'Número de laudos completos.'],
      [38, 'numero', 'Número de vias acabadas.'],
      [39, 'numero', 'Número total de não conformidades abertas (Qualidade).'],
      [40, 'numero', 'Número de não conformidades respondidas (Qualidade).'],
      [41, 'numero', 'Número de ensaios realizados.'],
      [42, 'numero', 'Número de ensaios conformes.'],
      [43, 'numero', 'Número de laudos de área de influência.'],
      [44, 'numero', 'Número de cartas de comunicação da necessidade de vistoria cautelar.'],
      [45, 'numero', 'Número de laudos de vistoria cautelar.'],
      [46, 'numero', 'Número de notas técnicas realizadas.'],
      [47, 'numero', 'Número de ocorrências de grande porte com pagamentos emergenciais e/ou acionamento da Defesa Civil.'],
      [48, 'numero', 'Número de ocorrências de Sinistro de grande porte com exposição à imprensa tradicional.'],
      [49, 'numero', 'Total de resíduos (em Toneladas)'],
      [50, 'numero', 'Destes, quantas toneladas de resíduos foram destinados corretamente?'],
      [51, 'numero', 'Volume total de efluentes (em m³)'],
      [52, 'numero', 'Volume de efluentes em conformidade (em m³)'],
      [53, 'numero', 'Nível de ruído dos equipamentos e veículos utilizados na obra (decibéis)'],
      [54, 'texto', 'Caso o nível de ruído tenha excedido os limites estabelecidos pela NBR 10.151/2019, favor justificar.'],
      [55, 'numero', 'Número de incidentes no transporte e manuseio de produtos perigosos'],
      [56, 'numero', 'Quantidade de produtos perigosos manuseados (em toneladas)'],
      [57, 'escala', 'Densidade da fumaça dos veículos (escala Ringelmann) NBR6016 (Selecione de 0 a 5)'],
      [58, 'titulo', 'Quais das seguintes ações foram executadas para mitigar e controlar a poeira na obra:'],
      [59, 'marcar', 'Umidificação de vias'], [60, 'marcar', 'Coberturas de cargas em caminhões'], [61, 'marcar', 'Barreiras físicas'],
      [62, 'marcar', 'Cobertura de materiais'], [63, 'marcar', 'Limpeza regular'], [64, 'marcar', 'Outra (dizer qual a outra opção)'],
      [65, 'texto', 'Descreva mais sobre a necessidade ou não da execução dessas ações'],
      [66, 'titulo', 'Marque quais treinamentos obrigatórios foram oferecidos aos empregados da obra nesse ultimo mês:'],
      [67, 'marcar', 'Módulo de Integração (admissional)'], [68, 'marcar', 'Aspectos pertinentes da legislação ambiental vigente aplicáveis à obra'],
      [69, 'marcar', 'Treinamentos em prevenção de incêndios florestais'], [70, 'marcar', 'Cuidados com a flora, fauna e patrimônio histórico'],
      [71, 'marcar', 'Separação, acondicionamento e destinação de resísuos sólidos'], [72, 'marcar', 'Prevenção e controle de erosão e assoreamento'],
      [73, 'marcar', 'Prevenção e controle de poluição e contaminação do meio ambiente'], [74, 'marcar', 'Programa de Emergência Ambiental (PEA)'],
      [75, 'marcar', 'Controle operacional de instalações industriais provisórias'], [76, 'marcar', 'Procedimentos de desativação de obras'],
      [77, 'simnao', 'Houve algum outro treinamento:'], [78, 'texto', 'Se sim, com qual tema?'],
      [79, 'numero', 'Número de condicionantes apresentadas'], [80, 'numero', 'Número de condicionantes cumpridas'],
      [81, 'numero', 'Número de não conformidades identificadas'], [82, 'numero', 'Número de não conformidades respondidas'],
      [83, 'simnao', 'Houve reuso de água na obra?'], [84, 'numero', 'Se sim, qual o volume de água reutilizada (em m³)'],
      [85, 'simnao', 'Houve implantação ou capacitação da economia circular na obra?'], [86, 'texto', 'Se sim, descreva as ações executadas no mês.'],
      [87, 'numero', 'Qual o consumo de energia elétrica do canteiro no mês? em kWh'], [88, 'numero', 'Qual o número de veículos e maquinários da obra?'],
      [89, 'numero', 'Gasolina utilizada este mês (em L)'], [90, 'numero', 'Etanol utilizado este mês (em L)'],
      [91, 'numero', 'Diesel utilizado este mês (em L)'], [92, 'numero', 'GNV utilizado este mês (m³)']
    ];
  }
  /** Campos com resposta (títulos e a escala de fumaça, que tem marcações próprias na máscara, ficam de fora). */
  static respondiveis() { return ProgramaParceirosCPT.perguntas.filter(p => !['titulo', 'escala'].includes(p[1])); }
  static definicoes() {
    return ProgramaParceirosCPT.grupos.map(g => ({...g, perguntas: ProgramaParceirosCPT.perguntas.filter(p => p[0] >= g.de && p[0] <= g.ate).map(([linha, tipo, rotulo]) => ({linha, tipo, rotulo}))}))
      .sort((a, b) => a.de - b.de);
  }
  static norm(v) { return DadosDaAplicacao.norm(v); }
  static naoAplica(v) { return /^nao (se )?aplica/.test(ProgramaParceirosCPT.norm(v)); }
  static mesAnterior(m) { const d = new Date(m + '-15T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); }
  static nomesMes() { return ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']; }
  /** "Agosto" → 2026-08 · "set/26", "setembro/2026" → 2026-09. Vazio se não for cabeçalho de mês. */
  static mesDoCabecalho(v) {
    const s = ProgramaParceirosCPT.norm(v).replace(/[.\/\-]/g, ' ').trim(); if (!s) return '';
    const m = s.match(/^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*\s*(\d{4}|\d{2})?$/); if (!m) return '';
    const ano = m[2] ? (m[2].length === 2 ? '20' + m[2] : m[2]) : String(ProgramaParceirosCPT.anoPadrao);
    return ano + '-' + String(['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'].indexOf(m[1]) + 1).padStart(2, '0');
  }

  constructor(ctx) {
    this.ctx = ctx;
    if (!PerfisCPT.gerencia(ctx.perfil)) throw new Error('O Programa Parceiros é respondido pela Gestão e pelo Administrativo.');
  }
  tabela(criar) {
    const ss = SpreadsheetApp.openById(this.ctx.config.agendaId); let a = ss.getSheetByName(ProgramaParceirosCPT.aba);
    if (!a && criar) { a = ss.insertSheet(ProgramaParceirosCPT.aba); a.getRange(1, 1, 1, 7).setValues([ProgramaParceirosCPT.cabecalho]); a.setFrozenRows(1); }
    return a;
  }
  linhas(a) { return a && a.getLastRow() > 1 ? a.getRange(2, 1, a.getLastRow() - 1, 7).getValues() : []; }
  static ler(r) { let v = {}; try { v = JSON.parse(r[6] || '{}') || {}; } catch (_) {} return {mes: String(r[0]), versao: Number(r[1]) || 0, operacao: String(r[2]), em: r[3] instanceof Date ? r[3].toISOString() : String(r[3]), por: String(r[4]), situacao: String(r[5]), campos: v.campos || {}, publicacao: v.publicacao || null}; }
  /** Última versão salva do mês (ou vazio). */
  atual(mes, rows) { const doMes = (rows || this.linhas(this.tabela(false))).filter(r => String(r[0]) === mes); return doMes.length ? ProgramaParceirosCPT.ler(doMes[doMes.length - 1]) : {mes, versao: 0, campos: {}, situacao: 'novo', publicacao: null}; }

  /** Máscara oficial: aba (por gid ou pelos rótulos), coluna do mês e valores atuais. */
  mascara() {
    const id = ConectoresCPT.id('parceiros'), ss = SpreadsheetApp.openById(id), gid = ConectoresCPT.item('parceiros').aba;
    const confere = s => ProgramaParceirosCPT.norm(s.getRange(3, 2).getValue()).startsWith('numero de economias');
    const s = ss.getSheets().find(x => x.getSheetId() === gid && confere(x)) || ss.getSheets().find(confere);
    if (!s) throw new Error('A aba da máscara (linha 3 = "Número de economias realizadas no período") não foi encontrada.');
    return {id, ss, s, url: 'https://docs.google.com/spreadsheets/d/' + id + '/edit#gid=' + s.getSheetId()};
  }
  /** Confere se cada linha que vai ser gravada ainda tem a mesma pergunta (evita gravar na linha errada se a máscara mudar). */
  static validarRotulos(s, linhas) {
    const rot = s.getRange(1, 2, 92, 1).getValues(), mapa = new Map(ProgramaParceirosCPT.perguntas.map(p => [p[0], p[2]]));
    linhas.forEach(l => { const a = ProgramaParceirosCPT.norm(rot[l - 1][0]).slice(0, 28), b = ProgramaParceirosCPT.norm(mapa.get(l)).slice(0, 28); if (a !== b) throw new Error('A máscara mudou na linha ' + l + ' (esperado "' + mapa.get(l).slice(0, 40) + '…"). Nada foi gravado.'); });
  }
  static blocos(s) {
    const ultima = s.getLastColumn(), cab = ultima >= 3 ? s.getRange(2, 3, 1, ultima - 2).getValues()[0] : [], out = [];
    cab.forEach((v, i) => { const m = ProgramaParceirosCPT.mesDoCabecalho(v); if (m) out.push({mes: m, coluna: i + 3}); });
    return out;
  }
  colunaDoMes(s, mes) {
    const achados = ProgramaParceirosCPT.blocos(s).filter(b => b.mes === mes);
    if (achados.length > 1) throw new Error('O mês aparece duas vezes na linha 2 da máscara. Corrija a máscara antes de publicar.');
    return achados.length ? achados[0].coluna : 0;
  }
  /** Novo bloco do mês copiando a formatação (mesclagens e caixas de seleção) do último bloco, sem conteúdo. */
  criarColuna(s, mes) {
    const blocos = ProgramaParceirosCPT.blocos(s); if (!blocos.length) throw new Error('Nenhum mês reconhecido na linha 2 da máscara.');
    const ini = blocos[blocos.length - 1].coluna, mescla = s.getRange(2, ini).getMergedRanges(), largura = mescla.length ? mescla[0].getNumColumns() : 1;
    const col = Math.max(s.getLastColumn(), ini + largura - 1) + 1;
    if (col + largura - 1 > s.getMaxColumns()) s.insertColumnsAfter(s.getMaxColumns(), col + largura - 1 - s.getMaxColumns());
    const origem = s.getRange(2, ini, 91, largura), destino = s.getRange(2, col, 91, largura);
    origem.copyTo(destino); destino.clearContent();
    for (let i = 0; i < largura; i++) s.setColumnWidth(col + i, s.getColumnWidth(ini + i));
    const n = ProgramaParceirosCPT.nomesMes()[Number(mes.slice(5)) - 1].replace('marco', 'março');
    s.getRange(2, col).setValue(n.charAt(0).toUpperCase() + n.slice(1) + '/' + mes.slice(0, 4));
    return col;
  }
  valoresDaMascara(m, mes) {
    const col = this.colunaDoMes(m.s, mes); if (!col) return {coluna: 0, valores: {}};
    const v = m.s.getRange(1, col, 92, 1).getValues(), f = m.s.getRange(1, col, 92, 1).getFormulas(), valores = {};
    ProgramaParceirosCPT.respondiveis().forEach(([l]) => { const x = v[l - 1][0]; if (x !== '' && x !== null) valores[l] = {valor: x instanceof Date ? x.toISOString().slice(0, 10) : x, formula: !!f[l - 1][0]}; });
    return {coluna: col, valores};
  }

  /** Sugestões calculadas dos registros e atendimentos do mês. Cada uma diz como foi calculada. */
  sugestoes(mes) {
    const reg = this.ctx.base.getSheetByName('Registros'), atd = this.ctx.base.getSheetByName('Atendimentos');
    const chave = 'parceiros:sug:' + mes + ':' + (reg ? reg.getLastRow() : 0) + ':' + (atd ? atd.getLastRow() : 0) + ':' + (PropertiesService.getScriptProperties().getProperty('CPT_ATD_VERSAO') || 0);
    const out = CacheCPT.obter(chave, 600, () => ProgramaParceirosCPT.calcularSugestoes(new RelatorioMensalCPT(this.ctx).coletar(mes)));
    // Comunicação (linhas 32 a 34): o que foi concluído no mês na pasta de materiais.
    try {
      const r = MateriaisCPT.resumo(new ColecaoCPT(this.ctx, 'Materiais', 'MAT').itens(), mes);
      if (r.publicacoes) {
        out[32] = {valor: r.publicacoes, regra: 'Publicações e matérias marcadas como concluídas no mês em Comunicação → Materiais e links.'};
        out[33] = {valor: r.alcance, regra: 'Soma das pessoas alcançadas informadas nessas publicações.' + (r.semAlcance ? ' ' + r.semAlcance + ' sem alcance informado.' : '')};
        out[34] = {valor: 'Foram realizadas ' + r.publicacoes + ' publicações: ' + r.temas.join('; ') + '.', regra: 'Títulos das publicações do mês. Complete com a estratégia de divulgação.'};
      }
    } catch (_) {}
    return out;
  }
  static calcularSugestoes(c) {
    const R = RelatorioMensalCPT, N = ProgramaParceirosCPT.norm, mes = c.mes, out = {};
    const media = l => { const v = l.filter(n => n !== null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : null; };
    const nota = v => { const n = Number(String(v).replace(',', '.')); return String(v).trim() !== '' && isFinite(n) && n >= 0 && n <= 10 ? n : null; };
    // Mesma regra do relatório (SocioambientalCPT.destino): ações dos itens 3, 4.x e 7. Fora: diagnósticos, DDS/ações internas e articulação institucional.
    const abertas = c.atividades.filter(r => ['3', '4.1', '4.2', '4.3', '4.4', '4.5', '7'].includes(SocioambientalCPT.destino(r.procedimento, r.atividade, r.texto)) && !/articulacao/.test(N(r.atividade)));
    if (c.atividades.length) {
      const semPublico = abertas.filter(r => r.publico == null).length;
      out[8] = {valor: abertas.length, regra: 'Ações do mês abertas à comunidade, pela regra do relatório (fora diagnósticos, DDS, ações internas e articulação institucional).'};
      out[9] = {valor: abertas.reduce((n, r) => n + (r.publico || 0), 0), regra: 'Soma do público informado nessas ações.' + (semPublico ? ' ' + semPublico + ' sem público informado: confira.' : '')};
      const temas = [...new Set(abertas.map(r => String(r.atividade || '').trim()).filter(Boolean))];
      if (temas.length) out[10] = {valor: temas.slice(0, 25).join('; ') + '.', regra: 'Títulos das ações abertas à comunidade. Reescreva em uma frase, se preferir.'};
    }
    const pesquisas = c.registros.filter(r => r.satisfacao && r.data.startsWith(mes));
    if (pesquisas.length) {
      const sat = media(pesquisas.map(r => nota(R.valor(r.campos, /satisfeito com os servicos de saneamento/)))), mel = media(pesquisas.map(r => nota(R.valor(r.campos, /percebeu melhorias/))));
      if (sat !== null) out[17] = {valor: sat, regra: 'Média das notas de ' + pesquisas.length + ' pesquisas de satisfação do mês.'};
      if (mel !== null) out[19] = {valor: mel, regra: 'Média das notas de melhoria na qualidade de vida das pesquisas do mês.'};
      const textos = re => [...new Set(pesquisas.map(r => R.valor(r.campos, re)).filter(t => t && t.split(/\s+/).length >= 4))].slice(0, 12);
      const d1 = textos(/aspectos observa|comentario|sugest/), d2 = textos(/mudancas na qualidade de vida|qualidade de vida/);
      if (d1.length) out[18] = {valor: d1.map(t => '"' + t.trim() + '"').join(' '), regra: d1.length + ' respostas abertas das pesquisas. Escolha as que representam o mês.'};
      if (d2.length) out[20] = {valor: d2.map(t => '"' + t.trim() + '"').join(' '), regra: d2.length + ' respostas sobre qualidade de vida.'};
    }
    const tipo = x => N(x.tipo || x.assunto), entrou = x => x.abertura && x.abertura.startsWith(mes), saiu = x => x.concluido && x.conclusao && x.conclusao.startsWith(mes);
    [[23, 24, /elogio/, 'elogio'], [25, 26, /solicita/, 'solicitação'], [27, 28, /reclama|transtorno|dano/, 'reclamação']].forEach(([e, s, re, nome]) => {
      out[e] = {valor: c.casos.filter(x => entrou(x) && re.test(tipo(x))).length, regra: 'Casos abertos no mês com tipo/assunto de ' + nome + '.'};
      out[s] = {valor: c.casos.filter(x => saiu(x) && re.test(tipo(x))).length, regra: 'Casos de ' + nome + ' concluídos no mês.'};
    });
    out[29] = {valor: c.casos.filter(x => (entrou(x) || saiu(x)) && R.statusManifestacao(x) === 'Não procede').length, regra: 'Casos do mês marcados como "não procede".'};
    out[30] = {valor: c.casos.filter(x => entrou(x) && /sinistro|avaria|rachadura|trinca|dano ao imovel|danos? (ao|no|em) (imovel|patrimonio|veiculo)/.test(N(x.tipo + ' ' + x.assunto))).length, regra: 'Casos abertos no mês que citam sinistro, avaria, trinca ou dano a imóvel. Confira.'};
    const prazos = c.casos.filter(saiu).map(x => (Date.parse(x.conclusao + 'T12:00:00Z') - Date.parse(x.abertura + 'T12:00:00Z')) / 864e5).filter(n => isFinite(n) && n >= 0);
    if (prazos.length) out[31] = {valor: Math.round(prazos.reduce((a, b) => a + b, 0) / prazos.length), regra: 'Média de dias entre abertura e conclusão dos ' + prazos.length + ' casos concluídos no mês.'};
    const cautelar = c.registros.filter(r => /vistoria cautelar/.test(N(r.procedimento))).length;
    if (cautelar) out[44] = {valor: cautelar, regra: 'Registros de acompanhamento de vistoria cautelar no mês (confira se cada um é uma carta).'};
    return out;
  }

  carregar(mes) {
    new DadosDaAplicacao(this.ctx.base, this.ctx.perfil).mes(mes);
    const rows = this.linhas(this.tabela(false)), atual = this.atual(mes, rows), avisos = [];
    let anterior = this.atual(ProgramaParceirosCPT.mesAnterior(mes), rows).campos, origemAnterior = 'Aplicação';
    let mascara = {ok: false, url: '', coluna: 0, valores: {}};
    try {
      const m = this.mascara(), v = this.valoresDaMascara(m, mes);
      mascara = {ok: true, url: m.url, coluna: v.coluna, valores: v.valores, titulo: m.ss.getName()};
      if (!Object.keys(anterior).length) { const p = this.valoresDaMascara(m, ProgramaParceirosCPT.mesAnterior(mes)).valores; anterior = {}; Object.keys(p).forEach(k => anterior[k] = {valor: p[k].valor}); origemAnterior = 'Máscara oficial'; }
    } catch (e) { avisos.push('Máscara oficial indisponível: ' + e.message + ' Você pode responder e salvar; a publicação fica para quando o conector estiver certo.'); }
    let sugestoes = {};
    try { sugestoes = this.sugestoes(mes); } catch (e) { avisos.push('Sugestões indisponíveis: ' + e.message); }
    return {mes, atual, anterior, origemAnterior, mascara, sugestoes, definicoes: ProgramaParceirosCPT.definicoes(), avisos,
      podePublicar: this.ctx.perfil.papeis.includes('administrador') || !PerfisCPT.travada()};
  }
  /** Normaliza e valida uma resposta pelo tipo da pergunta. */
  static valor(tipo, v, rotulo) {
    if (tipo === 'marcar') return v === true || v === 'true';
    const s = String(v == null ? '' : v).trim(); if (!s) return '';
    if (tipo === 'texto') { if (s.length > 5000) throw new Error('Texto acima de 5.000 caracteres: ' + rotulo.slice(0, 50)); return s; }
    if (tipo === 'simnao') { if (!['Sim', 'Não'].includes(s)) throw new Error('Responda Sim ou Não: ' + rotulo.slice(0, 50)); return s; }
    if (ProgramaParceirosCPT.naoAplica(s)) return 'Não aplicada';
    // 8,7 e 8.7 = oito vírgula sete · 29.839 e 29.839,5 = milhar com ponto.
    const num = s.includes(',') ? Number(s.replace(/\./g, '').replace(',', '.')) : /^\d{1,3}(\.\d{3})+$/.test(s) ? Number(s.replace(/\./g, '')) : Number(s);
    if (!/^[\d.,]+$/.test(s) || !isFinite(num) || num < 0) throw new Error('Use um número (ou "Não aplicada"): ' + rotulo.slice(0, 60));
    if (tipo === 'nota' && num > 10) throw new Error('A nota vai de 0 a 10: ' + rotulo.slice(0, 60));
    return num;
  }
  salvar(p) {
    const mes = new DadosDaAplicacao(this.ctx.base, this.ctx.perfil).mes(p && p.mes);
    if (typeof p.operacaoId !== 'string' || !/^OP-[\w-]{8,60}$/.test(p.operacaoId)) throw new Error('Operação inválida. Recarregue a página.');
    const a = this.tabela(true), rows = this.linhas(a), repetida = rows.find(r => String(r[2]) === p.operacaoId);
    if (repetida) return {resultado: 'Respostas já estavam salvas.', atual: ProgramaParceirosCPT.ler(repetida)};
    const atual = this.atual(mes, rows);
    if (Number(p.versao || 0) !== atual.versao) throw new Error('Outra pessoa salvou o Programa Parceiros deste mês. Suas respostas continuam na tela: copie o que for necessário e reabra.');
    const campos = {}, tipos = new Map(ProgramaParceirosCPT.respondiveis().map(x => [String(x[0]), x]));
    Object.keys(p.campos || {}).forEach(k => {
      const def = tipos.get(String(k)); if (!def) throw new Error('Campo fora da máscara (linha ' + k + ').');
      const x = p.campos[k] || {}, valor = ProgramaParceirosCPT.valor(def[1], x.valor, def[2]);
      if (valor === '' && !x.conferido) return;
      if (valor === '' && def[1] !== 'marcar') throw new Error('Campo marcado como conferido sem resposta: linha ' + k + '.');
      campos[k] = {valor, conferido: !!x.conferido};
    });
    const situacao = ['rascunho', 'conferido'].includes(p.situacao) ? p.situacao : 'rascunho', versao = atual.versao + 1;
    a.getRange(a.getLastRow() + 1, 1, 1, 7).setValues([[mes, versao, p.operacaoId, new Date(), this.ctx.email, situacao, JSON.stringify({campos, publicacao: atual.publicacao})]]);
    return {resultado: 'Respostas salvas (versão ' + versao + ').', atual: {mes, versao, em: new Date().toISOString(), por: this.ctx.email, situacao, campos, publicacao: atual.publicacao}};
  }
  publicar(p) {
    PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Publicar na máscara oficial do Programa Parceiros');
    const mes = new DadosDaAplicacao(this.ctx.base, this.ctx.perfil).mes(p && p.mes), a = this.tabela(true), atual = this.atual(mes, this.linhas(a));
    if (Number(p.versao || 0) !== atual.versao || !atual.versao) throw new Error('Salve as respostas antes de publicar (ou reabra: houve outra alteração).');
    const linhas = Object.keys(atual.campos).filter(k => atual.campos[k].conferido).map(Number).sort((x, y) => x - y);
    if (!linhas.length) throw new Error('Marque como conferido ao menos um campo para publicar.');
    const m = this.mascara(); ProgramaParceirosCPT.validarRotulos(m.s, linhas);
    let col = this.colunaDoMes(m.s, mes), criada = false; if (!col) { col = this.criarColuna(m.s, mes); criada = true; }
    const faixa = m.s.getRange(1, col, 92, 1), antes = faixa.getValues(), formulas = faixa.getFormulas();
    const comFormula = linhas.filter(l => formulas[l - 1][0]), gravar = linhas.filter(l => !formulas[l - 1][0] && antes[l - 1][0] !== atual.campos[l].valor);
    const literal = v => typeof v === 'string' && /^\s*[=+\-@]/.test(v) ? "'" + v : v, feitos = [];
    try { gravar.forEach(l => { feitos.push(l); m.s.getRange(l, col).setValue(literal(atual.campos[l].valor)); }); SpreadsheetApp.flush(); }
    catch (e) {
      let ok = true; feitos.reverse().forEach(l => { try { m.s.getRange(l, col).setValue(antes[l - 1][0]); } catch (_) { ok = false; } });
      throw new Error(ok ? 'A publicação falhou e os valores anteriores foram restaurados. ' + e.message : 'A publicação falhou e a restauração não foi completa: confira as linhas ' + feitos.join(', ') + '. ' + e.message);
    }
    const publicacao = {em: new Date().toISOString(), por: this.ctx.email, coluna: col, criada, linhas: gravar, mantidas: linhas.length - gravar.length - comFormula.length, comFormula, url: m.url, versao: atual.versao};
    const versao = atual.versao + 1;
    a.getRange(a.getLastRow() + 1, 1, 1, 7).setValues([[mes, versao, 'PUB-' + Utilities.getUuid(), new Date(), this.ctx.email, 'publicado', JSON.stringify({campos: atual.campos, publicacao})]]);
    return {resultado: gravar.length + ' resposta(s) gravada(s) na máscara oficial' + (criada ? ' (coluna do mês criada)' : '') + '.' + (comFormula.length ? ' Linhas com fórmula preservadas: ' + comFormula.join(', ') + '.' : ''),
      atual: {...atual, versao, situacao: 'publicado', publicacao}};
  }
  /** Planilha de conferência (nova a cada pedido) na pasta do mês: pergunta, resposta, conferido e origem. Não toca na máscara. */
  exportar(p) {
    const mes = new DadosDaAplicacao(this.ctx.base, this.ctx.perfil).mes(p && p.mes), atual = this.atual(mes);
    if (!atual.versao) throw new Error('Salve as respostas antes de exportar.');
    const nome = 'Programa Parceiros ' + mes + ' (v' + atual.versao + ')', ss = SpreadsheetApp.create(nome), s = ss.getSheets()[0];
    const linhas = [['Grupo', 'Linha da máscara', 'Pergunta', 'Resposta', 'Conferido']];
    ProgramaParceirosCPT.definicoes().forEach(g => g.perguntas.forEach(q => {
      if (q.tipo === 'titulo') { linhas.push([g.nome, q.linha, q.rotulo, '', '']); return; }
      const c = atual.campos[q.linha]; linhas.push([g.nome, q.linha, q.rotulo, c ? (c.valor === true ? 'Sim' : c.valor === false ? 'Não' : c.valor) : '', c && c.conferido ? 'Sim' : '']);
    }));
    s.setName('Respostas ' + mes); s.getRange(1, 1, linhas.length, 5).setValues(linhas);
    s.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#244636').setFontColor('#ffffff'); s.setFrozenRows(1);
    s.setColumnWidth(1, 110); s.setColumnWidth(2, 70); s.setColumnWidth(3, 460); s.setColumnWidth(4, 420); s.setColumnWidth(5, 80);
    s.getRange(1, 1, linhas.length, 5).setWrap(true).setVerticalAlignment('top');
    DriveApp.getFileById(ss.getId()).moveTo(RelatorioMensalCPT.prototype.pasta.call(null, mes));
    return {resultado: 'Planilha de conferência criada.', planilha: ss.getUrl(), xlsx: 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=xlsx', pdf: 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=pdf&portrait=false&fitw=true&gridlines=false'};
  }
}

function carregarParceirosCPT(mes) { return DesempenhoCPT.medir('parceiros.carregar', () => new ProgramaParceirosCPT(AplicacaoCPT.contexto()).carregar(String(mes || ''))); }
function salvarParceirosCPT(p) {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('Há outro salvamento em andamento. Tente novamente.');
  try { return DesempenhoCPT.medir('parceiros.salvar', () => new ProgramaParceirosCPT(AplicacaoCPT.contexto()).salvar(p || {})); } finally { lock.releaseLock(); }
}
function publicarParceirosCPT(p) {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('Há outra publicação em andamento. Tente novamente.');
  try { return DesempenhoCPT.medir('parceiros.publicar', () => new ProgramaParceirosCPT(AplicacaoCPT.contexto()).publicar(p || {})); } finally { lock.releaseLock(); }
}
function exportarParceirosCPT(p) { return DesempenhoCPT.medir('parceiros.exportar', () => new ProgramaParceirosCPT(AplicacaoCPT.contexto()).exportar(p || {})); }

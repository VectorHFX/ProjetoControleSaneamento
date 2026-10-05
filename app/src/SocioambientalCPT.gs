/**
 * SocioambientalCPT 2.6.0. Mesa do relatório e documentos socioambientais.
 * - destino(): em que item do relatório cada registro entra (anatomia do relatório nº 13, docs/ANATOMIA_DO_RELATORIO.md).
 * - mesa(mes): as atividades do mês por item, com o estado do preparo salvo em Entregas.
 * - DocumentosSocioambientaisCPT: relato ilustrado (Docs + PDF), ficha DIAGNÓSTICO LOCAL no modelo oficial Sabesp
 *   (só preenchida, nunca redesenhada) e apresentação do diagnóstico (Slides + PDF).
 * Regra (02/10): Ação Social Externa e CAO ganham relato no item 4, por eixo; DDS, treinamentos e campanhas internas
 * no item 9; tenda no item 7; diagnóstico no item 2. Todas as ações entram na tabela e na contagem do item 3.
 */
class SocioambientalCPT {
  static get papeis() { return ['administrador', 'administrativo', 'gestao', 'socioambiental', 'comunicacao']; }
  static get itens() {
    return [
      {item: '2', titulo: 'Diagnóstico das áreas de trabalho', tipo: 'diagnostico', legenda: 'dd/mm/aaaa - Endereço - Diagnóstico'},
      {item: '4.1', titulo: 'Reuniões, grupos de discussão e fóruns periódicos', tipo: 'relato', tema: 'reuniões, grupos de discussão e fóruns', legenda: 'dd/mm/aaaa - Evento - Local'},
      {item: '4.2', titulo: 'Ações sob eixo de gestão de resíduos sólidos', tipo: 'relato', tema: 'gestão de resíduos sólidos', legenda: 'dd/mm/aaaa - Evento - Local'},
      {item: '4.3', titulo: 'Ações preventivas às doenças de veiculação hídrica', tipo: 'relato', tema: 'prevenção às doenças de veiculação hídrica', legenda: 'dd/mm/aaaa - Evento - Local'},
      {item: '4.4', titulo: 'Ações de Educação Socioambiental', tipo: 'relato', tema: 'educação socioambiental', legenda: 'dd/mm/aaaa - Evento - Local'},
      {item: '4.5', titulo: 'Governança Colaborativa', tipo: 'relato', tema: 'governança colaborativa', legenda: 'dd/mm/aaaa - Evento - Local'},
      {item: '7', titulo: 'Atividades da Unidade Móvel Socioambiental (UMS)', tipo: 'relato', legenda: 'dd/mm/aaaa - UMS - Local'},
      {item: '9', titulo: 'Atividades Complementares (DDS, treinamentos e campanhas internas)', tipo: 'relato', legenda: 'dd/mm/aaaa - DDS - Tema - Local'},
      {item: '3', titulo: 'Atividades desenvolvidas no período (tabela e fotos por frente)', tipo: 'consolidado', legenda: 'dd/mm/aaaa - Endereço - Atividade'},
      {item: '5', titulo: 'Material audiovisual', tipo: 'consolidado', legenda: ''}
    ];
  }
  static item(codigo) { return SocioambientalCPT.itens.find(x => x.item === codigo) || null; }
  static norm(v) { return DadosDaAplicacao.norm(v); }
  /** Item do relatório. texto = atividade + complemento/tema/ferramenta, para sugerir o eixo. Null: não entra na mesa. */
  static destino(procedimento, atividade, texto) {
    const p = SocioambientalCPT.norm(procedimento), a = SocioambientalCPT.norm(atividade), t = SocioambientalCPT.norm([atividade, texto].join(' '));
    if (/diagnost/.test(p)) return '2';
    if (p !== 'relato de atividade') return null;
    if (/\bcao\b|comissao de acompanhamento/.test(a)) return /lideranc|comerciant|governanc|conselho|comite/.test(t) ? '4.5' : '4.1';
    if (/articulacao/.test(a)) return '4.5';
    if (/acao social externa/.test(a)) {
      if (/residu|oleo|pilha|bateria|recicl|descarte|coleta seletiva|ponto de coleta|lixo/.test(t)) return '4.2';
      if (/dengue|saude|hidric|doenca|higiene|leptosp|verminose|diarreia/.test(t)) return '4.3';
      if (/reuni|forum|roda de conversa|assembl/.test(t)) return '4.1';
      return '4.4';
    }
    if (/\bdds\b|dialogo diario|acao social interna|treinamento|capacitacao|campanha interna|visita tecnica/.test(a)) return '9';
    if (/tenda|\bums\b|unidade movel/.test(t)) return '7';
    if (/captacao/.test(a)) return '5';
    if (/manifestac/.test(a)) return null;
    return '3';
  }
  static get textoEixoVazio() { return 'No período de referência não foram realizadas ações específicas de {tema}. As atividades permanecem previstas no planejamento e serão retomadas conforme o cronograma.'; }

  constructor(ctx) {
    this.ctx = ctx;
    if (!ctx.perfil.papeis.some(p => SocioambientalCPT.papeis.includes(p))) throw new Error('A mesa socioambiental está disponível ao Administrativo, Gestão, Socioambiental e Comunicação.');
    this.dados = new DadosDaAplicacao(ctx.base, ctx.perfil);
  }
  /** Última revisão de cada registro preparado (relato ou diagnóstico). */
  static entregas(ctx) {
    const out = new Map();
    try {
      const a = planilhaCPT_(ctx.config.agendaId).getSheetByName('Entregas');
      if (a && a.getLastRow() > 1) a.getRange(2, 1, a.getLastRow() - 1, 6).getValues().forEach(r => { try { out.set(String(r[0]), JSON.parse(r[5])); } catch (_) {} });
    } catch (_) {}
    return out;
  }
  static arquivosDe(props, id) { try { return JSON.parse(props['CPT_DOC:' + id] || '{}'); } catch (_) { return {}; } }
  static arquivos(id) { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('CPT_DOC:' + id) || '{}'); } catch (_) { return {}; } }
  /** Frente pela obra de referência; "não se aplica" e vazio não contam como frente. */
  static frente(obra) { const s = String(obra || '').replace(/\s*\[OBR-\d+\]\s*$/, '').trim(); return !s || /nao se aplica|^atendimento$/.test(SocioambientalCPT.norm(s)) ? '' : s; }

  mesa(mes) {
    this.dados.mes(mes);
    const linhas = this.dados.ler(this.dados.registros(), 21).filter(r => r[0] && this.dados.mesCelula(r[3]) === mes);
    const entregas = SocioambientalCPT.entregas(this.ctx), itens = [], frentes = new Map();
    let acoes = 0, pessoas = 0, semPublico = 0, pesquisas = 0;
    // 2.26.1: os documentos gerados são lidos numa chamada só (antes era uma leitura de propriedade por relato).
    let props = {}; try { props = PropertiesService.getScriptProperties().getProperties() || {}; } catch (_) {}
    linhas.forEach(r => {
      const reg = this.dados.registro(r), campos = RelatorioMensalCPT.campos(r[20]) || [];
      if (/satisfac/.test(SocioambientalCPT.norm(reg.procedimento))) pesquisas++;
      const extra = [RelatorioMensalCPT.valor(campos, /complemento|tema|ferramenta|classificacao|objetivo/), String(r[17] || '')].join(' ');
      const sugerido = SocioambientalCPT.destino(reg.procedimento, reg.atividade, extra);
      if (!sugerido) return;
      const e = entregas.get(reg.id) || null, destino = e && e.destino && SocioambientalCPT.item(e.destino) ? e.destino : sugerido;
      const frente = SocioambientalCPT.frente(reg.obra);
      if (sugerido !== '2') {
        acoes++; if (reg.publico == null) semPublico++; else pessoas += reg.publico;
        const f = frentes.get(frente || 'Atividades sem obra específica') || {frente: frente || 'Atividades sem obra específica', acoes: 0, pessoas: 0, bairros: new Set(), semObra: !frente};
        f.acoes++; f.pessoas += reg.publico || 0; if (reg.bairro) f.bairros.add(reg.bairro); frentes.set(f.frente, f);
      }
      const arq = SocioambientalCPT.arquivosDe(props, reg.id);
      itens.push({id: reg.id, data: reg.data, atividade: reg.atividade || reg.procedimento, procedimento: reg.procedimento, bairro: reg.bairro, frente, responsavel: reg.responsavel,
        publico: reg.publico, sugerido, destino, situacao: e ? e.situacao : 'sem', versao: e ? e.versao : 0, titulo: e ? e.titulo : '', alteradoPor: e ? e.alteradoPor : '',
        documento: (arq.relato || arq.ficha || {}).pdf || ''});
    });
    itens.sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id));
    const grupos = SocioambientalCPT.itens.filter(g => g.tipo !== 'consolidado').map(g => {
      const lista = itens.filter(x => x.destino === g.item);
      return {...g, itens: lista, prontos: lista.filter(x => x.situacao === 'pronto').length,
        vazio: g.tema ? SocioambientalCPT.textoEixoVazio.replace('{tema}', g.tema) : ''};
    });
    const proprios = grupos.reduce((n, g) => n + g.itens.length, 0), prontos = grupos.reduce((n, g) => n + g.prontos, 0);
    return {mes, atualizadoEm: new Date().toISOString(),
      totais: {acoes, pessoas, semPublico, frentes: [...frentes.values()].filter(f => !f.semObra).length, diagnosticos: itens.filter(x => x.sugerido === '2').length, pesquisas, proprios, prontos,
        frase: 'Foram contabilizadas ' + acoes + ' ações socioambientais, totalizando ' + pessoas + ' pessoas alcançadas.'},
      grupos,
      frentes: [...frentes.values()].map(f => ({frente: f.frente, acoes: f.acoes, pessoas: f.pessoas, bairros: [...f.bairros].join(', '), semObra: f.semObra})).sort((a, b) => (a.semObra - b.semObra) || b.acoes - a.acoes),
      consolidados: itens.filter(x => ['3', '5'].includes(x.destino)).length,
      anexos: (() => { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('CPT_ANEXOS:' + mes) || 'null'); } catch (_) { return null; } })()};
  }
  /** Linhas do ANEXO 3: captações de conteúdo do mês (a Comunicação completa com peças e comunicados). */
  captacoes(mes) {
    return this.dados.ler(this.dados.registros(), 19).filter(r => r[0] && this.dados.mesCelula(r[3]) === mes && SocioambientalCPT.destino(r[1], r[13], r[17]) === '5')
      .map(r => { const reg = this.dados.registro(r); return [reg.atividade, reg.bairro].filter(Boolean).join(' - ') + ' (' + RelatorioMensalCPT.br(reg.data).slice(0, 5) + ')'; });
  }
}

/** Mapa da tabela oficial do DIAGNÓSTICO LOCAL (23 linhas): [chave, linha, coluna do rótulo, rótulo]. O valor vai na célula à direita. */
class DiagnosticoOficialCPT {
  static get modeloPadrao() { return '1QT0ly_LVwYpl6CtYHadNKc-SQZflbSa7Lvp6avkrY4g'; }
  static get campos() {
    return [
      ['frente', 1, 0, 'FRENTE/CT'], ['pvInicio', 1, 2, 'PV INÍCIO'], ['pvFim', 1, 4, 'PV FIM'],
      ['metodo', 2, 0, 'MÉTODO CONSTRUTIVO'], ['extensao', 2, 2, 'EXTENSÃO'],
      ['endereco', 3, 0, 'RUA/AVENIDA'], ['perfil', 5, 0, 'PERFIL SOCIOECONÔMICO'],
      ['pavimento', 6, 0, 'TIPO DO PAVIMENTO'], ['condicao', 7, 0, 'CONDIÇÃO DO PAVIMENTO'],
      ['impacto', 8, 0, 'NÍVEL DE IMPACTO'], ['impactos', 9, 0, 'IMPACTOS IDENTIFICADOS'],
      ['veiculos', 10, 0, 'TRÁFEGO DE VEÍCULOS'], ['pedestres', 11, 0, 'TRÁFEGO DE PEDESTRES'],
      ['residencias', 12, 0, 'IMÓVEIS RESIDENCIAIS'], ['comercios', 13, 0, 'IMÓVEIS COMERCIAIS'],
      ['padrao', 14, 0, 'PADRÃO CONSTRUTIVO'], ['ipvs', 15, 0, 'VULNERABILIDADE'],
      ['liderancas', 16, 0, 'HOUVE IDENTIFICAÇÃO DE LIDERANÇAS'], ['escolas', 17, 0, 'ESCOLAS PÚBLICAS'],
      ['ubs', 18, 0, 'UBS NO ENTORNO'], ['ongs', 19, 0, 'CENTROS COMUNITÁRIOS'],
      ['onibus', 20, 0, 'PONTOS DE ÔNIBUS'], ['comunicacao', 21, 0, 'OPORTUNIDADES DE COMUNICAÇÃO'],
      ['criticos', 22, 0, 'PONTOS CRÍTICOS']
    ];
  }
  static chaves() { return DiagnosticoOficialCPT.campos.map(f => f[0]); }
  /** Valor de uma pergunta do formulário pelo título (sem acento, caixa ou pontuação final). */
  static leitor(campos) {
    const n = t => SocioambientalCPT.norm(t).replace(/[\s:?.!*]+$/g, '');
    const mapa = new Map((campos || []).map(c => [n(c.titulo), Array.isArray(c.valor) ? c.valor.join(', ') : String(c.valor == null ? '' : c.valor)]));
    return (...titulos) => { for (const t of titulos) { const v = mapa.get(n(t)); if (v) return v; } return ''; };
  }
  /** Primeira versão da ficha a partir das respostas do formulário (a Gestão revisa tudo antes de gerar). */
  static sugestao(fonte) {
    const c = DiagnosticoOficialCPT.leitor(fonte.campos), r = fonte.registro, juntar = (...v) => v.filter(Boolean).join(' · ');
    const oficiais = {
      frente: c('Frente/CT', 'Título da frente de serviço') || SocioambientalCPT.frente(r.obra), pvInicio: c('PV início', 'PV de início'), pvFim: c('PV fim', 'PV final'),
      metodo: c('Método construtivo'), extensao: c('Extensão', 'Extensão do trecho'),
      endereco: juntar(c('Endereço da frente de serviço', 'Endereço completo', 'Rua/Avenida'), c('Intervalo de numeração observado no trecho')),
      perfil: c('Perfil socioeconômico observado no território'), pavimento: c('Tipo de pavimento predominante'), condicao: c('Condições da via', 'Condição do pavimento'),
      impacto: c('Nível de impacto'), impactos: c('Impactos identificados', 'Ocorrências observadas na região'),
      veiculos: c('Tráfego de Veículos'), pedestres: c('Tráfego de Pedestres'),
      residencias: c('Quantidade de Imóveis Residênciais no Traçado', 'Quantidade de Imóveis Residenciais no Traçado'), comercios: c('Quantidade de Imóveis Comerciais no Traçado'),
      padrao: c('Padrão ou padrões construtivos predominantemente observados'), ipvs: c('Índice Paulista de Vulnerabilidade Social — IPVS', 'Índice Paulista de Vulnerabilidade Social - IPVS', 'IPVS'),
      liderancas: juntar(c('Foram identificadas lideranças no território?'), c('Onde encontrar essas lideranças?')),
      escolas: c('Escolas e equipamentos de educação Identificados', 'Existem escolas ou equipamentos de educação no entorno?'),
      ubs: c('UBS ou Hospitais identificados', 'Existe UBS ou Hospitais no entorno?'),
      ongs: c('Centros comunitários, ONGs ou equipamentos identificados', 'Existem centros comunitários ou ONGs no entorno?'),
      onibus: juntar(c('Existem pontos de ônibus no traçado?'), c('Com qual frequência passam os ônibus?')),
      comunicacao: c('Oportunidades de comunicação no local'), criticos: c('Pontos críticos observados')};
    return {titulo: 'Diagnóstico local: ' + (oficiais.frente || r.bairro || r.id), oficiais, textoBase: DiagnosticoOficialCPT.textoBase(fonte)};
  }
  /** Texto-base por temas, para a Gestão reescrever com as próprias palavras (síntese do item 2). */
  static textoBase(fonte) {
    const c = DiagnosticoOficialCPT.leitor(fonte.campos);
    const grupos = [
      ['Registro de campo', ['Relato do Diagnóstico', 'Relato da atividade']],
      ['Perfil social', ['Perfil socioeconômico observado no território', 'Indicadores utilizados para classificar o perfil socioeconômico observado', 'Faixas etárias predominantes no trecho', 'Observações sobre grupos etários identificados']],
      ['Moradia e circulação', ['Quantidade de Imóveis Residênciais no Traçado', 'Quantidade de Imóveis Comerciais no Traçado', 'Padrão ou padrões construtivos predominantemente observados', 'Tipo de pavimento predominante', 'Condições da via', 'Tráfego de Veículos', 'Tráfego de Pedestres']],
      ['Infraestrutura e pontos de atenção', ['Infraestrutura sanitária identificada no diagnóstico', 'Observações sobre a infraestrutura sanitária', 'Ocorrências observadas na região', 'Pontos críticos observados']],
      ['Mobilização e próximos passos', ['Oportunidades de comunicação no local', 'Possíveis locais para instalação de tenda', 'Há alguma observação de cunho social, que possa ser estratégica para realizar ações e conscientização da população ao redor dessa intervenção?', 'Há alguma observação para a comunicação que possa ser estratégica para as ações?']]];
    return grupos.map(([titulo, ks]) => { const t = ks.map(k => { const v = c(k); return v ? (titulo === 'Registro de campo' ? v : k.replace(/\?$/, '') + ': ' + v) : ''; }).filter(Boolean).join('\n'); return t ? titulo.toUpperCase() + '\n' + t : ''; }).filter(Boolean).join('\n\n');
  }
  /** Confere o modelo antes de preencher: uma guia, uma tabela de 23 linhas, rótulos no lugar e nada fora dos campos. */
  static tabela(doc) {
    if (typeof doc.getTabs === 'function' && (doc.getTabs().length !== 1 || doc.getTabs()[0].getChildTabs().length)) throw new Error('O modelo do diagnóstico deve ter uma única guia.');
    const body = doc.getBody(), tabelas = body.getTables();
    if (tabelas.length !== 1) throw new Error('O modelo precisa ter só a tabela oficial do diagnóstico. Encontradas: ' + tabelas.length + '.');
    const t = tabelas[0]; if (t.getNumRows() !== 23) throw new Error('O modelo tem ' + t.getNumRows() + ' linhas. Esperadas 23.');
    const comeca = (r, c, texto) => SocioambientalCPT.norm(t.getRow(r).getCell(c).getText()).startsWith(SocioambientalCPT.norm(texto));
    if (!comeca(0, 0, 'DIAGNÓSTICO LOCAL') || !comeca(4, 0, 'INFORMAÇÕES DO ENTORNO DAS OBRAS') || !comeca(5, 2, 'OBSERVAÇÕES')) throw new Error('Cabeçalhos do modelo oficial não reconhecidos.');
    const mapeadas = new Set(['0:0', '4:0', '5:2', '6:2']);
    DiagnosticoOficialCPT.campos.forEach(f => {
      if (t.getRow(f[1]).getNumCells() <= f[2] + 1 || !comeca(f[1], f[2], f[3])) throw new Error('Campo não reconhecido no modelo: ' + f[3] + ' (linha ' + (f[1] + 1) + ').');
      mapeadas.add(f[1] + ':' + f[2]); mapeadas.add(f[1] + ':' + (f[2] + 1));
    });
    for (let r = 0; r < 23; r++) for (let c = 0; c < t.getRow(r).getNumCells(); c++)
      if (!mapeadas.has(r + ':' + c) && t.getRow(r).getCell(c).getText().trim()) throw new Error('O modelo tem texto fora dos campos (linha ' + (r + 1) + ', coluna ' + (c + 1) + '). Confira o modelo antes de gerar.');
    return t;
  }
}

/** Geração dos documentos. Cada geração cria arquivos novos; os anteriores vão para "Versões anteriores" (nada é apagado). */
class DocumentosSocioambientaisCPT {
  static get cores() { return {madeira: '#4A3426', madeiraClara: '#F4ECE2', verde: '#2F7D4F', verdeClaro: '#9ED3A8', vermelho: '#D9534A', tinta: '#2B211A', suave: '#7A6656'}; }
  constructor(ctx) { this.ctx = ctx; this.entregas = new EntregasCPT(ctx); }
  pasta(mes, sub) {
    const m = RelatorioMensalCPT.prototype.pasta.call(null, mes), it = m.getFoldersByName(sub);
    return it.hasNext() ? it.next() : m.createFolder(sub);
  }
  guardar(id, chave, v) {
    const p = PropertiesService.getScriptProperties(), atual = SocioambientalCPT.arquivos(id), anterior = atual[chave];
    atual[chave] = v; p.setProperty('CPT_DOC:' + id, JSON.stringify(atual));
    return anterior;
  }
  arquivar(mes, anterior) {
    if (!anterior) return;
    const versoes = this.pasta(mes, 'Versões anteriores');
    [anterior.doc, anterior.pdf].map(u => (String(u || '').match(/\/d\/([A-Za-z0-9_-]{20,})/) || [])[1]).filter(Boolean).forEach(id => { try { DriveApp.getFileById(id).moveTo(versoes); } catch (_) {} });
  }
  foto(id) {
    const f = DriveApp.getFileById(id);
    if (!/^image\//.test(f.getMimeType())) throw new Error('"' + f.getName() + '" não é foto. Desmarque e gere de novo.');
    return /^image\/(jpeg|png|gif)$/.test(f.getMimeType()) && f.getSize() <= 8e6 ? f.getBlob() : f.getThumbnail();
  }
  /** Revisão salva e conferida com a fonte atual. */
  revisao(id, tipo) {
    const d = this.entregas.carregar(id);
    if (!d.entrega) throw new Error('Salve a revisão antes de gerar o documento.');
    if (d.fonteAlterada) throw new Error('O registro original mudou. Reabra, confira e salve de novo antes de gerar.');
    if (d.tipo !== (tipo === 'relato' ? 'relato' : 'diagnostico')) throw new Error('Documento não corresponde a este registro.');
    return d;
  }
  url(tipo, id) { return tipo === 'pdf' ? 'https://drive.google.com/file/d/' + id + '/view' : tipo === 'slides' ? 'https://docs.google.com/presentation/d/' + id + '/edit' : 'https://docs.google.com/document/d/' + id + '/edit'; }
  static nome(r, t) { return [r.data, (r.atividade || r.procedimento || '').slice(0, 60), r.bairro, t].filter(Boolean).join(' - ').replace(/[\\/:*?"<>|]/g, ' '); }

  gerar(p) {
    if (!p || typeof p.id !== 'string' || !['relato', 'ficha', 'slides'].includes(p.tipo)) throw new Error('Escolha o registro e o documento.');
    const d = this.revisao(p.id, p.tipo), r = d.fonte.registro, e = d.entrega, mes = String(r.data || '').slice(0, 7) || r.mes;
    if (!/^\d{4}-\d{2}$/.test(mes)) throw new Error('O registro precisa de data válida para escolher a pasta do mês.');
    const pasta = this.pasta(mes, p.tipo === 'relato' ? 'Relatos' : 'Diagnósticos'), fotos = (e.fotos || []).map(f => ({...f, blob: this.foto(f.id)}));
    let v;
    if (p.tipo === 'relato') v = this.relato(r, e, fotos, pasta);
    else if (p.tipo === 'ficha') v = this.ficha(r, e, pasta);
    else v = this.slides(r, e, fotos, pasta);
    v = {...v, versao: e.versao, em: new Date().toISOString(), por: this.ctx.email};
    this.arquivar(mes, this.guardar(r.id, p.tipo, v));
    return {arquivo: v, arquivos: SocioambientalCPT.arquivos(r.id), resultado: 'Documento gerado a partir da revisão ' + e.versao + '.'};
  }
  pdf(id, nome, pasta) { const f = pasta.createFile(DriveApp.getFileById(id).getAs(MimeType.PDF).setName(nome + '.pdf')); return this.url('pdf', f.getId()); }
  /**
   * Relato no formato dos Anexos enviados à Sabesp (Central 4.x): faixa "Relato da atividade", quadro de 6 linhas,
   * Objetivo, Relato da atividade, Registro fotográfico (2 por linha) e Listas de presença.
   * Novidade pedida em 02/10: cada relato começa em página nova, com a faixa de título contornada, para não emendar no anterior.
   */
  escreverRelato(body, r, e, fotos, novaPagina) {
    const navy = '#083952', linha = '#CFDDE5', q = e.quadro || {};
    if (novaPagina) body.appendPageBreak();
    const estilo = (t, tam, cor, neg) => { t.editAsText().setFontFamily('Arial').setFontSize(tam).setForegroundColor(cor).setBold(!!neg); return t; };
    const faixa = body.appendTable([['Relato da atividade']]);
    faixa.setBorderColor(navy).setBorderWidth(1.5);
    const fc = faixa.getRow(0).getCell(0); fc.setPaddingTop(8).setPaddingBottom(8).setPaddingLeft(10).setBackgroundColor('#EAF4F8'); estilo(fc, 23, navy, true);
    const sub = body.appendParagraph([q.atividade || e.titulo, q.local].filter(Boolean).join(' · ')); estilo(sub, 12, '#536D7A', false); sub.setSpacingBefore(6).setSpacingAfter(8);
    const linhas = [['Atividade', q.atividade || e.titulo], ['Local', q.local], ['Endereço e bairro', q.endereco], ['Data e horário', q.dataHorario || RelatorioMensalCPT.br(r.data)], ['Mediação', q.mediacao], ['Público', q.publico]];
    const t = body.appendTable(linhas.map(x => [x[0], x[1] || 'Não informado'])); t.setBorderColor(linha).setBorderWidth(0.5);
    linhas.forEach((_, i) => { for (let j = 0; j < 2; j++) { const c = t.getRow(i).getCell(j); c.setPaddingTop(5).setPaddingBottom(5).setPaddingLeft(8); estilo(c, 10, '#173747', !j); if (!j) c.setBackgroundColor('#EAF4F8'); } });
    const titulo = texto => { const h = body.appendParagraph(texto); h.setHeading(DocumentApp.ParagraphHeading.HEADING2); estilo(h, 13, navy, true); h.setSpacingBefore(12); };
    const paragrafos = texto => String(texto || '').split(/\n+/).map(x => x.trim()).filter(Boolean).forEach(x => { const pp = body.appendParagraph(x); pp.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY).setSpacingAfter(8).setLineSpacing(1.15); estilo(pp, 11, '#173747', false); });
    if (q.objetivo) { titulo('Objetivo'); paragrafos(q.objetivo); }
    titulo('Relato da atividade'); paragrafos(e.texto);
    const grade = (lista, largura) => {
      for (let i = 0; i < lista.length; i += 2) {
        const par = lista.slice(i, i + 2), g = body.appendTable([par.map(() => ''), par.map(() => '')]); g.setBorderWidth(0);
        par.forEach((f, j) => {
          const cel = g.getRow(0).getCell(j), pp = cel.getChild(0).asParagraph(), img = pp.appendInlineImage(f.blob), k = Math.min(largura / img.getWidth(), (f.lista ? 330 : 185) / img.getHeight());
          img.setWidth(Math.round(img.getWidth() * k)).setHeight(Math.round(img.getHeight() * k)); pp.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
          const leg = g.getRow(1).getCell(j).getChild(0).asParagraph(); leg.setText(f.legenda || ''); leg.setAlignment(DocumentApp.HorizontalAlignment.CENTER); estilo(leg, 9, '#536D7A', false);
        });
      }
    };
    const registros = fotos.filter(f => !f.lista), listas = fotos.filter(f => f.lista);
    if (registros.length) { titulo('Registro fotográfico'); grade(registros, 235); }
    if (listas.length) { titulo('Listas de presença'); grade(listas, 235); }
  }
  relato(r, e, fotos, pasta) {
    const nome = DocumentosSocioambientaisCPT.nome(r, 'RELATO'), doc = DocumentApp.create(nome), body = doc.getBody(), id = doc.getId();
    DriveApp.getFileById(id).moveTo(pasta);
    body.setMarginLeft(42).setMarginRight(42).setMarginTop(34).setMarginBottom(36);
    this.escreverRelato(body, r, e, fotos, false);
    doc.saveAndClose();
    return {doc: this.url('doc', id), pdf: this.pdf(id, nome, pasta)};
  }
  /**
   * Anexos do mês, no formato enviado em setembro/2026: ANEXO 1 (item 4: ações socioambientais), ANEXO 2 (item 9:
   * atividades complementares, DDS) e ANEXO 3 (material audiovisual, lista para completar). Só entram relatos "Pronto".
   * Com modeloAnexosId configurado (Google Docs com cabeçalho e rodapé do consórcio), a cópia do modelo recebe o conteúdo.
   */
  anexos(mes) {
    const mesa = new SocioambientalCPT(this.ctx).mesa(mes), entregas = SocioambientalCPT.entregas(this.ctx);
    const prontos = itens => itens.filter(x => x.situacao === 'pronto').map(x => entregas.get(x.id)).filter(Boolean);
    const de = codigos => prontos(mesa.grupos.filter(g => codigos.includes(g.item)).reduce((a, g) => a.concat(g.itens), []).sort((a, b) => a.data.localeCompare(b.data)));
    const blocos = [['ANEXO 1', 'DESENVOLVIMENTO DE AÇÕES SOCIOAMBIENTAIS', de(['4.1', '4.2', '4.3', '4.4', '4.5', '7'])], ['ANEXO 2', 'ATIVIDADES COMPLEMENTARES', de(['9'])]];
    if (!blocos.some(b => b[2].length)) throw new Error('Nenhum relato do item 4 ou 9 está "Pronto" neste mês. Marque os relatos como prontos na mesa antes de gerar os anexos.');
    const c = AplicacaoCPT.config(), pasta = this.pasta(mes, 'Anexos'), nome = 'Anexos do Relatório ' + RelatorioMensalCPT.mesExtenso(mes) + ' - ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd-MM HH.mm');
    let id;
    if (c.modeloAnexosId) { id = DriveApp.getFileById(c.modeloAnexosId).makeCopy(nome, pasta).getId(); }
    else { const d = DocumentApp.create(nome); id = d.getId(); d.saveAndClose(); DriveApp.getFileById(id).moveTo(pasta); }
    const doc = DocumentApp.openById(id), body = doc.getBody(); body.clear();
    const avisos = []; let primeira = true;
    const capa = (n, t, linhas) => {
      if (!primeira) body.appendPageBreak(); primeira = false;
      const h = body.appendParagraph(n + '\n' + t); h.setHeading(DocumentApp.ParagraphHeading.HEADING1); h.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      h.editAsText().setFontFamily('Arial').setFontSize(16).setBold(true).setForegroundColor('#083952'); h.setSpacingAfter(14);
      linhas.forEach(l => { const li = body.appendListItem(l); li.setGlyphType(DocumentApp.GlyphType.BULLET); li.editAsText().setFontFamily('Arial').setFontSize(11).setForegroundColor('#173747').setBold(false); });
    };
    blocos.forEach(([n, t, lista]) => {
      if (!lista.length) return;
      capa(n, t, lista.map(e => 'Relato - ' + e.titulo + ((e.fotos || []).some(f => f.lista) ? ' + Lista de presença' : '') + ' (' + RelatorioMensalCPT.br(e.registro.data).slice(0, 5) + ')'));
      lista.forEach(e => {
        const fotos = [];
        (e.fotos || []).forEach(f => { try { fotos.push({...f, blob: this.foto(f.id)}); } catch (err) { avisos.push(e.titulo + ': ' + err.message); } });
        this.escreverRelato(body, e.registro, e, fotos, true);
      });
    });
    const audiovisual = mesa.grupos.length ? new SocioambientalCPT(this.ctx).captacoes(mes) : [];
    capa('ANEXO 3', 'MATERIAL AUDIOVISUAL', audiovisual.length ? audiovisual : ['[COMPLETAR] Peças, comunicados, convites e captações do mês.']);
    doc.saveAndClose();
    const r = {doc: this.url('doc', id), pdf: this.pdf(id, nome, pasta), avisos, relatos: blocos.reduce((n, b) => n + b[2].length, 0), em: new Date().toISOString(), por: this.ctx.email};
    PropertiesService.getScriptProperties().setProperty('CPT_ANEXOS:' + mes, JSON.stringify(r));
    return {...r, resultado: 'Anexos gerados com ' + r.relatos + ' relato(s), cada um em página própria.' + (avisos.length ? ' Atenção: ' + avisos.length + ' imagem(ns) não entraram.' : '')};
  }
  /** Ficha oficial: cópia do modelo Sabesp, só preenchida. Observações = síntese da Gestão + próximos passos. */
  ficha(r, e, pasta) {
    const c = AplicacaoCPT.config(), modelo = c.modeloDiagnosticoId || DiagnosticoOficialCPT.modeloPadrao, nome = DocumentosSocioambientaisCPT.nome(r, 'FICHA SABESP');
    DiagnosticoOficialCPT.tabela(DocumentApp.openById(modelo));
    const copia = DriveApp.getFileById(modelo).makeCopy(nome, pasta), doc = DocumentApp.openById(copia.getId()), t = DiagnosticoOficialCPT.tabela(doc), o = e.oficiais || {};
    DiagnosticoOficialCPT.campos.forEach(f => t.getRow(f[1]).getCell(f[2] + 1).editAsText().setText(o[f[0]] || 'Não informado'));
    t.getRow(6).getCell(2).editAsText().setText([e.texto, e.encaminhamentos ? 'Próximos passos\n' + e.encaminhamentos : ''].filter(Boolean).join('\n\n') || 'Não informado');
    doc.saveAndClose();
    return {doc: this.url('doc', copia.getId()), pdf: this.pdf(copia.getId(), nome, pasta)};
  }
  /** Páginas da apresentação: capa, leitura do território, temas e fotos. Texto longo continua na página seguinte. */
  static paginas(r, e) {
    const o = e.oficiais || {}, rot = k => DiagnosticoOficialCPT.campos.find(f => f[0] === k)[3];
    const grupo = (titulo, ks) => ({titulo, texto: ks.filter(k => o[k]).map(k => rot(k) + ': ' + o[k]).join('\n')});
    const blocos = [{titulo: 'Leitura do território', texto: e.texto || ''},
      {...grupo('Moradia e perfil social', ['perfil', 'padrao']), kpis: [['Residências', o.residencias || '—'], ['Comércios', o.comercios || '—'], ['IPVS', o.ipvs || '—']]},
      grupo('Via e circulação', ['pavimento', 'condicao', 'veiculos', 'pedestres', 'onibus']), grupo('Pontos de atenção', ['impacto', 'impactos', 'criticos']),
      grupo('Rede local e mobilização', ['liderancas', 'escolas', 'ubs', 'ongs', 'comunicacao']), {titulo: 'Próximos passos', texto: e.encaminhamentos || ''}];
    const paginas = [{capa: true, titulo: e.titulo || o.frente || r.bairro, texto: [o.endereco, r.bairro, RelatorioMensalCPT.br(r.data)].filter(Boolean).join('\n')}];
    let foto = 0; const fotos = e.fotos || [];
    blocos.filter(b => b.texto || b.kpis).forEach(b => {
      const usar = !b.kpis && foto < fotos.length && DocumentosSocioambientaisCPT.quebrar(b.texto, 44, 11).length === 1;
      const partes = DocumentosSocioambientaisCPT.quebrar(b.texto, usar ? 44 : 86, b.kpis ? 6 : 11);
      (partes.length ? partes : ['']).forEach((t, i) => { const pg = {titulo: b.titulo + (i ? ' (continuação)' : ''), texto: t}; if (b.kpis && !i) pg.kpis = b.kpis; if (usar && !i) pg.foto = foto++; paginas.push(pg); });
    });
    while (foto < fotos.length) { paginas.push({titulo: 'Registro do território', texto: fotos[foto].legenda || '', foto}); foto++; }
    return paginas;
  }
  static quebrar(texto, largura, linhas) {
    const todas = [];
    String(texto || '').split(/\n/).forEach(p => { let l = ''; p.split(/\s+/).filter(Boolean).forEach(w => { if (l && l.length + w.length + 1 > largura) { todas.push(l); l = ''; } l += (l ? ' ' : '') + w; }); todas.push(l); });
    const out = []; for (let i = 0; i < todas.length; i += linhas) { const t = todas.slice(i, i + linhas).join('\n').trim(); if (t) out.push(t); } return out;
  }
  /** Apresentação em madeira, verde e um toque de vermelho (paleta da Central). */
  slides(r, e, fotos, pasta) {
    const cor = DocumentosSocioambientaisCPT.cores, nome = DocumentosSocioambientaisCPT.nome(r, 'APRESENTAÇÃO'), deck = SlidesApp.create(nome), id = deck.getId();
    DriveApp.getFileById(id).moveTo(pasta);
    const w = deck.getPageWidth(), h = deck.getPageHeight(), sx = w / 720, sy = h / 405, paginas = DocumentosSocioambientaisCPT.paginas(r, e), velhos = deck.getSlides();
    paginas.forEach((p, i) => {
      const s = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK), tinta = p.capa ? '#FFFFFF' : cor.tinta;
      s.getBackground().setSolidFill(p.capa ? cor.madeira : cor.madeiraClara);
      const caixa = (t, x, y, bw, bh, tam, c, neg) => { const z = s.insertTextBox(String(t || ''), x * sx, y * sy, bw * sx, bh * sy); z.getText().getTextStyle().setFontFamily('Arial').setFontSize(tam * Math.min(sx, sy)).setForegroundColor(c).setBold(!!neg); return z; };
      const ret = (x, y, bw, bh, c) => { const z = s.insertShape(SlidesApp.ShapeType.RECTANGLE, x * sx, y * sy, bw * sx, bh * sy); z.getFill().setSolidFill(c); z.getBorder().setTransparent(); return z; };
      ret(0, 0, 720, 5, cor.vermelho);
      if (p.capa) { caixa('DIAGNÓSTICO LOCAL', 40, 40, 600, 25, 12, cor.verdeClaro, true); caixa(p.titulo, 40, 100, 640, 110, 32, '#FFFFFF', true); caixa(p.texto, 40, 235, 630, 100, 16, '#EADBC8'); }
      else {
        caixa(p.titulo, 30, 22, 660, 56, 24, cor.verde, true); ret(32, 82, 56, 4, cor.vermelho);
        const blob = p.foto != null ? fotos[p.foto] && fotos[p.foto].blob : null;
        if (p.kpis) { p.kpis.forEach((k, j) => { const x = 32 + j * 225; ret(x, 104, 210, 104, '#FFFFFF'); caixa(k[1], x + 12, 112, 186, 62, String(k[1]).length > 10 ? 16 : 36, cor.verde, true); caixa(k[0], x + 12, 178, 186, 22, 12, cor.suave, true); }); caixa(p.texto, 32, 226, 658, 140, 14, tinta); }
        else caixa(p.texto, 30, 102, blob ? 356 : 658, 250, 15, tinta);
        if (blob) { ret(410, 104, 278, 214, '#EADBC8'); const im = s.insertImage(blob), iw = im.getWidth(), ih = im.getHeight(), k = Math.min(278 * sx / iw, 214 * sy / ih);
          im.setWidth(iw * k).setHeight(ih * k).setLeft(410 * sx + (278 * sx - iw * k) / 2).setTop(104 * sy + (214 * sy - ih * k) / 2); caixa(fotos[p.foto].legenda || 'Registro de campo', 410, 322, 278, 34, 10, cor.suave); }
      }
      caixa('Consórcio Performance Tamanduateí    ' + (i + 1) + '/' + paginas.length, 30, 380, 658, 18, 9, p.capa ? '#CDB8A0' : cor.suave);
    });
    velhos.forEach(s => s.remove());
    deck.saveAndClose();
    return {doc: this.url('slides', id), pdf: this.pdf(id, nome, pasta)};
  }
}

function carregarMesaSocioambientalCPT(mes) { return DesempenhoCPT.medir('socioambiental.mesa', () => new SocioambientalCPT(AplicacaoCPT.contexto()).mesa(String(mes || ''))); }
function gerarAnexosDoMesCPT(mes) {
  const ctx = AplicacaoCPT.contexto(); new SocioambientalCPT(ctx);
  const lock = LockService.getScriptLock(), props = PropertiesService.getScriptProperties(), chave = 'CPT_GERANDO:anexos:' + mes;
  if (!lock.tryLock(10000)) throw new Error('Há outra gravação em andamento. Tente novamente.');
  try { if (Date.now() - Number(props.getProperty(chave) || 0) < 360000) throw new Error('Os anexos deste mês já estão sendo gerados. Aguarde alguns minutos.'); props.setProperty(chave, String(Date.now())); } finally { lock.releaseLock(); }
  try { return DesempenhoCPT.medir('socioambiental.anexos', () => new DocumentosSocioambientaisCPT(ctx).anexos(new DadosDaAplicacao(ctx.base, ctx.perfil).mes(String(mes || '')))); } finally { props.deleteProperty(chave); }
}
function gerarDocumentoSocioambientalCPT(p) {
  const ctx = AplicacaoCPT.contexto(); new SocioambientalCPT(ctx);
  const chave = 'CPT_GERANDO:' + String(p && p.id || ''), props = PropertiesService.getScriptProperties(), lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Há outra gravação em andamento. Tente novamente.');
  try { const t = Number(props.getProperty(chave) || 0); if (Date.now() - t < 300000) throw new Error('Este documento já está sendo gerado. Aguarde alguns minutos.'); props.setProperty(chave, String(Date.now())); } finally { lock.releaseLock(); }
  try { return DesempenhoCPT.medir('socioambiental.gerar', () => new DocumentosSocioambientaisCPT(ctx).gerar(p)); } finally { props.deleteProperty(chave); }
}

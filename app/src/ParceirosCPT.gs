/**
 * ParceirosCPT 2.41.0. Máscara de lançamento do Programa Parceiros (conector "parceiros"), sem mexer na formatação.
 * - Números automáticos na coluna do mês (bloco do mês na linha 2: "Junho", "Setembro/2026"…), com uma nota de fonte:
 *   8–9 ações abertas à comunidade e pessoas; 17 e 19 médias das pesquisas de satisfação; 23–29 manifestações; 31 prazo
 *   médio; 32 publicações. O resto da máscara é preenchido à mão. Mês atual e, até o dia 10, o anterior; nunca antes da
 *   ativação. Bloco do mês que ainda não existe é criado copiando a formatação do último (sem conteúdo).
 * - Depoimentos (linhas 18 e 20): a aplicação monta um prompt com as respostas abertas do mês, sem nomes, telefones ou
 *   e-mails ("Copiar prompt" para o Gemini). A Gestão revisa o texto, cola na tela e grava; quem e quando fica guardado.
 * - Rótulo da linha diferente do esperado ou célula com fórmula: a linha é pulada e avisada.
 */
class ParceirosCPT {
  static get anoPadrao() { return 2026; }
  static get chaveUltima() { return 'CPT_PARCEIROS_ULTIMA'; }
  static get aba() { return 'Programa Parceiros'; }
  static pode(p) { return PerfisCPT.gerencia(p); }
  static norm(v) { return DadosDaAplicacao.norm(v); }
  /** [linha, começo do rótulo (coluna B), chave, fonte]. */
  static get linhas() {
    return [
      [8, 'numero de reunioes, abertas a comunidade', 'reunioes', 'ações do mês abertas à comunidade (relatos; fora diagnósticos, DDS, ações internas e articulação institucional)'],
      [9, 'numero total de pessoas presentes nas reunioes', 'pessoas', 'soma do público informado nessas ações'],
      [17, 'de 0 a 10, quanto as pessoas estao satisfeitas', 'notaSaneamento', 'média das notas de satisfação com os serviços de saneamento nas pesquisas do mês'],
      [19, 'de 0 a 10, quanto as pessoas percebem melhorias', 'notaQualidade', 'média das notas de melhoria na qualidade de vida nas pesquisas do mês (só quem respondeu)'],
      [23, 'numero de entradas de manifestacoes do tipo elogio', 'elogioEntrada', 'fichas abertas no mês do tipo Elogio'],
      [24, 'numero de manifestacoes concluidas do tipo elogio', 'elogioConcluida', 'fichas do tipo Elogio concluídas no mês'],
      [25, 'numero de entradas de manifestacoes do tipo solicitacao', 'solicitacaoEntrada', 'fichas abertas no mês do tipo Solicitação'],
      [26, 'numero de manifestacoes concluidas do tipo solicitacao', 'solicitacaoConcluida', 'fichas do tipo Solicitação concluídas no mês'],
      [27, 'numero de entradas de manifestacoes do tipo reclamacao', 'reclamacaoEntrada', 'fichas abertas no mês do tipo Reclamação'],
      [28, 'numero de manifestacoes concluidas do tipo reclamacao', 'reclamacaoConcluida', 'fichas do tipo Reclamação concluídas no mês'],
      [29, 'numero de manifestacoes (reclamacoes) nao procedentes', 'naoProcedentes', 'reclamações abertas no mês com procedência "Não procedente"'],
      [31, 'qual o prazo medio de atendimento', 'prazoMedio', 'média de dias entre abertura e conclusão das fichas concluídas no mês'],
      [32, 'numero de publicacoes na midia', 'publicacoes', 'Materiais concluídos no mês: publicações em rede social e na mídia']
    ];
  }
  static get textos() { return {18: {chave: 'saneamento', rotulo: 'transcreva os depoimentos dos participantes sobre os servicos de saneamento'}, 20: {chave: 'qualidade', rotulo: 'transcreva os depoimentos dos participantes sobre a qualidade de vida'}}; }

  constructor(ctx) { this.ctx = ctx; this.dados = new DadosDaAplicacao(ctx.base, ctx.perfil); this.fuso = 'America/Sao_Paulo'; }
  static id() { return ConectoresCPT.id('parceiros'); }
  static link() { return 'https://docs.google.com/spreadsheets/d/' + ParceirosCPT.id() + '/edit'; }
  abrir() {
    let ss;
    try { ss = SpreadsheetApp.openById(ParceirosCPT.id()); }
    catch (e) {
      let tipo = ''; try { tipo = DriveApp.getFileById(ParceirosCPT.id()).getMimeType(); } catch (_) {}
      if (tipo && tipo !== MimeType.GOOGLE_SHEETS) throw new Error('A máscara do Programa Parceiros está no Drive como Excel (.xlsx), e a aplicação só escreve em Planilha Google. Abra o arquivo no Drive → Arquivo → Salvar como Planilhas Google e informe o novo endereço em Conectores e pastas.');
      throw new Error('A máscara do Programa Parceiros não abriu com a conta proprietária. Confira em Conectores e pastas.');
    }
    const confere = s => ParceirosCPT.norm(s.getRange(3, 2).getValue()).startsWith('numero de economias');
    const s = ss.getSheets().find(confere); if (!s) throw new Error('A aba da máscara (linha 3 = "Número de economias realizadas no período") não foi encontrada. Nada foi alterado.');
    return s;
  }
  /** "Agosto" → 2026-08 · "Setembro/2026", "set/26" → 2026-09. Vazio se não for mês. */
  static mesDoCabecalho(v) {
    const s = ParceirosCPT.norm(v).replace(/[./-]/g, ' ').trim(), m = s.match(/^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*\s*(\d{4}|\d{2})?$/); if (!m) return '';
    const ano = m[2] ? (m[2].length === 2 ? '20' + m[2] : m[2]) : String(ParceirosCPT.anoPadrao);
    return ano + '-' + String(['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'].indexOf(m[1]) + 1).padStart(2, '0');
  }
  static blocos(s) {
    const ult = s.getLastColumn(), cab = ult >= 3 ? s.getRange(2, 3, 1, ult - 2).getValues()[0] : [], out = [];
    cab.forEach((v, i) => { const m = ParceirosCPT.mesDoCabecalho(v); if (m) out.push({mes: m, coluna: i + 3}); });
    return out;
  }
  static colunaDoMes(blocos, mes) {
    const achados = blocos.filter(b => b.mes === mes);
    if (achados.length > 1) throw new Error('O mês ' + mes + ' aparece duas vezes na linha 2 da máscara. Corrija a máscara; nada foi alterado.');
    return achados.length ? achados[0].coluna : 0;
  }
  /** Novo bloco do mês: copia a formatação do último bloco (mesclagens e caixas de seleção), sem conteúdo nem notas. */
  criarBloco(s, mes) {
    const blocos = ParceirosCPT.blocos(s); if (!blocos.length) throw new Error('Nenhum mês reconhecido na linha 2 da máscara.');
    const ini = blocos[blocos.length - 1].coluna, mescla = s.getRange(2, ini).getMergedRanges(), largura = mescla.length ? mescla[0].getNumColumns() : 1;
    const col = Math.max(s.getLastColumn(), ini + largura - 1) + 1;
    if (col + largura - 1 > s.getMaxColumns()) s.insertColumnsAfter(s.getMaxColumns(), col + largura - 1 - s.getMaxColumns());
    const destino = s.getRange(2, col, 91, largura); s.getRange(2, ini, 91, largura).copyTo(destino); destino.clearContent(); destino.clearNote();
    for (let i = 0; i < largura; i++) s.setColumnWidth(col + i, s.getColumnWidth(ini + i));
    const n = DadosDaAplicacao.mesExtenso(mes).split(' ')[0]; s.getRange(2, col).setValue(n.charAt(0).toUpperCase() + n.slice(1) + '/' + mes.slice(0, 4));
    return col;
  }

  // ---------------- Números ----------------
  /** Pesquisas de satisfação do mês com os campos (detalhes lidos só dessas linhas). Em cache pela última linha da base. */
  pesquisas(mes) {
    const D = this.dados, a = D.registros(), chave = 'parceiros-pesquisas:' + this.ctx.base.getId() + ':' + mes + ':' + a.getLastRow();
    return CacheCPT.obter(chave, 1800, () => {
      const base = D.ler(a, 4), idx = []; base.forEach((r, i) => { if (r[0] && D.mesCelula(r[3]) === mes && /pesquisa de satisfa/.test(ParceirosCPT.norm(r[1]))) idx.push(i); });
      const out = [];
      for (let i = 0; i < idx.length;) {
        let j = i; while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++;
        a.getRange(idx[i] + 2, 21, idx[j] - idx[i] + 1, 1).getValues().forEach(x => {
          let c = DadosDaAplicacao.campos(x[0]); if (!c && /arquivoDetalhesId/.test(String(x[0]))) try { c = DadosDaAplicacao.campos(JSON.stringify(DadosDaAplicacao.lerDetalhes(x[0]))); } catch (_) { c = null; }
          const v = re => DadosDaAplicacao.valor(c, re);
          out.push({nome: v(/^nome - pesquisa/), saneamento: v(/satisfeito com os servicos de saneamento/), aspectos: v(/aspectos observa sobre os servicos de saneamento/), sugestao: v(/comentario ou sugestao para melhoria dos servicos/),
            mudancas: v(/notado mudancas na qualidade de vida/), qualidade: v(/percebeu melhorias na qualidade de vida/)});
        });
        i = j + 1;
      }
      return out;
    });
  }
  static nota(v) { const s = String(v == null ? '' : v).trim().replace(',', '.'), n = Number(s); return s !== '' && isFinite(n) && n >= 0 && n <= 10 ? n : null; }
  static media(l) { const v = l.filter(n => n !== null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10 : ''; }
  numeros(mes) {
    const N = ParceirosCPT.norm, relatos = PaineisGestaoCPT.relatosDoMes(this.dados, this.ctx, mes).itens, fichas = new AnexosCPT(this.ctx).fichas(), pesq = this.pesquisas(mes);
    // Mesma regra de antes: ações dos itens 3, 4.x e 7 abertas à comunidade (fora diagnósticos, DDS/ações internas e articulação).
    const abertas = relatos.filter(r => ['3', '4.1', '4.2', '4.3', '4.4', '4.5', '7'].includes(r.item) && !/articulacao/.test(N(r.atividade)));
    const entrou = x => x.abertura.startsWith(mes), saiu = x => x.concluido && x.conclusao.startsWith(mes), tipo = (x, re) => re.test(x.tipo);
    const prazos = fichas.filter(saiu).map(x => (Date.parse(x.conclusao + 'T12:00:00Z') - Date.parse(x.abertura + 'T12:00:00Z')) / 864e5).filter(n => isFinite(n) && n >= 0);
    const out = {reunioes: abertas.length, pessoas: abertas.reduce((s, r) => s + (r.publico || 0), 0),
      notaSaneamento: ParceirosCPT.media(pesq.map(p => ParceirosCPT.nota(p.saneamento))), notaQualidade: ParceirosCPT.media(pesq.map(p => ParceirosCPT.nota(p.qualidade))),
      naoProcedentes: fichas.filter(x => entrou(x) && tipo(x, /^reclam/) && N(x.procedencia) === 'nao procedente').length,
      prazoMedio: prazos.length ? Math.round(prazos.reduce((a, b) => a + b, 0) / prazos.length) : '',
      publicacoes: MateriaisCPT.resumo(new ColecaoCPT(this.ctx, 'Materiais', 'MAT').itens(), mes).publicacoes};
    [['elogio', /^elogio/], ['solicitacao', /^solicit/], ['reclamacao', /^reclam/]].forEach(([k, re]) => { out[k + 'Entrada'] = fichas.filter(x => entrou(x) && tipo(x, re)).length; out[k + 'Concluida'] = fichas.filter(x => saiu(x) && tipo(x, re)).length; });
    return out;
  }
  static notaFonte(fonte) { return 'CPT: automático · Fonte: ' + fonte + '. Preenchido pela Aplicação CPT (não editar à mão: a próxima atualização sobrescreve).'; }
  /** Escreve (ou só confere) os números dos meses na máscara. */
  gravarNumeros(s, meses, gravar) {
    const rotulos = s.getRange(1, 2, 92, 1).getValues().map(r => ParceirosCPT.norm(r[0])), textos = s.getRange(1, 2, 92, 1).getValues().map(r => String(r[0] || '').trim());
    let blocos = ParceirosCPT.blocos(s); const out = [];
    meses.forEach(mes => {
      let col = ParceirosCPT.colunaDoMes(blocos, mes), criado = false;
      if (!col && gravar) { col = this.criarBloco(s, mes); criado = true; blocos = ParceirosCPT.blocos(s); }
      const n = this.numeros(mes), linhas = [];
      const faixa = col ? s.getRange(1, col, 92, 1) : null, atuais = faixa ? faixa.getValues() : [], formulas = faixa ? faixa.getFormulas() : [], notas = faixa ? faixa.getNotes() : [];
      ParceirosCPT.linhas.forEach(([linha, rotulo, chave, fonte]) => {
        const item = {linha, rotulo: textos[linha - 1], valor: n[chave], atual: col ? atuais[linha - 1][0] : '', fonte};
        if (!rotulos[linha - 1].startsWith(rotulo)) { item.situacao = 'pulada'; item.aviso = 'Rótulo diferente do esperado na linha ' + linha + ': a máscara mudou? Nada foi escrito nela.'; }
        else if (col && formulas[linha - 1][0]) { item.situacao = 'formula'; item.aviso = 'A célula tem fórmula; não foi alterada.'; }
        else if (item.valor === '') { item.situacao = 'sem dado'; item.aviso = 'Sem dado no mês: a célula fica como está.'; }
        else {
          const igual = String(item.atual) === String(item.valor), nota = ParceirosCPT.notaFonte(fonte), notaIgual = col && String(notas[linha - 1][0] || '') === nota;
          item.situacao = igual && notaIgual ? 'igual' : 'muda';
          if (gravar && !igual) s.getRange(linha, col).setValue(item.valor);
          if (gravar && !notaIgual) s.getRange(linha, col).setNote(nota);
        }
        linhas.push(item);
      });
      out.push({mes, coluna: col, criado, semBloco: !col, linhas});
    });
    return out;
  }

  // ---------------- Depoimentos e prompt ----------------
  /** Tira nome do respondente, e-mails e telefones dos textos. */
  static limpar(t, nome) {
    let s = String(t || '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[e-mail]').replace(/(\+?55\s?)?\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}/g, '[telefone]');
    String(nome || '').split(/\s+/).filter(p => p.length >= 3).forEach(p => { s = s.replace(new RegExp('\\b' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'), '[nome]'); });
    return s.replace(/\s+/g, ' ').trim();
  }
  static util(t) { return t && t.split(/\s+/).length >= 2 && !/^(nao|não|nada|ni|n\/i|sem comentarios?|nenhum[a]?)[.!]?$/i.test(t.trim()); }
  depoimentos(mes) {
    const p = this.pesquisas(mes), L = ParceirosCPT.limpar, U = ParceirosCPT.util;
    const san = p.map(x => [x.aspectos, x.sugestao].map(t => L(t, x.nome)).filter(U).join(' / ')).filter(Boolean);
    const sim = p.filter(x => /^sim/.test(ParceirosCPT.norm(x.mudancas))).length, nao = p.filter(x => /^nao/.test(ParceirosCPT.norm(x.mudancas))).length;
    const notasQ = p.map(x => ParceirosCPT.nota(x.qualidade)).filter(n => n !== null), notasS = p.map(x => ParceirosCPT.nota(x.saneamento)).filter(n => n !== null);
    return {mes, pesquisas: p.length, saneamento: {notas: notasS.length, media: ParceirosCPT.media(notasS), respostas: san}, qualidade: {sim, nao, semResposta: p.length - sim - nao, notas: notasQ.length, media: ParceirosCPT.media(notasQ)}};
  }
  static prompt(d) {
    const mes = DadosDaAplicacao.mesExtenso(d.mes), q = d.qualidade, s = d.saneamento;
    return ['Você vai me ajudar a preencher o Programa Parceiros (Sabesp) de ' + mes + '. Escreva DOIS textos curtos (até 3 frases cada), em português, impessoais e sem nomes.',
      'Regras: use só o que está nos dados abaixo; não invente números, nomes, lugares nem fatos; não cite pessoas. Pode fazer abstrações a partir da ausência de dados — por exemplo, poucas ou nenhuma nota sobre qualidade de vida indica que os participantes não perceberam alterações no período. Não use listas nem aspas.',
      'Formato da resposta:\nServiços de saneamento: <texto>\nQualidade de vida: <texto>',
      '--- DADOS DO MÊS ---',
      'Pesquisas de satisfação realizadas: ' + d.pesquisas + '.',
      'Serviços de saneamento — notas de 0 a 10 respondidas: ' + s.notas + (s.media !== '' ? ' (média ' + s.media + ')' : '') + '.',
      'Respostas abertas sobre os serviços de saneamento (' + s.respostas.length + '):' + (s.respostas.length ? '\n' + s.respostas.slice(0, 60).map(t => '- ' + t).join('\n') : ' nenhuma.'),
      'Qualidade de vida — "tem notado mudanças?": ' + q.sim + ' sim, ' + q.nao + ' não, ' + q.semResposta + ' sem resposta. Notas de melhoria respondidas: ' + q.notas + (q.media !== '' ? ' (média ' + q.media + ')' : '') + '.'].join('\n\n');
  }
  colecao() { return new ColecaoCPT(this.ctx, ParceirosCPT.aba, 'PPT'); }
  /** Grava os textos revisados (linhas 18 e 20) na coluna do mês e guarda quem e quando. */
  gravarTextos(p) {
    if (!ParceirosCPT.pode(this.ctx.perfil)) throw new Error('O Programa Parceiros fica com a Gestão e o Administrativo.');
    p = p || {}; const mes = DadosDaAplicacao.mesValido(p.mes), T = ColecaoCPT.texto;
    const textos = {saneamento: T(p.saneamento, 3000, 'texto sobre os serviços de saneamento'), qualidade: T(p.qualidade, 3000, 'texto sobre a qualidade de vida')};
    if (!textos.saneamento && !textos.qualidade) throw new Error('Cole ao menos um dos textos revisados.');
    const s = this.abrir(), rot = s.getRange(1, 2, 92, 1).getValues().map(r => ParceirosCPT.norm(r[0]));
    Object.entries(ParceirosCPT.textos).forEach(([l, t]) => { if (!rot[l - 1].startsWith(t.rotulo)) throw new Error('A máscara mudou na linha ' + l + '. Nada foi gravado.'); });
    let col = ParceirosCPT.colunaDoMes(ParceirosCPT.blocos(s), mes); if (!col) col = this.criarBloco(s, mes);
    const f = s.getRange(18, col).getFormula() || s.getRange(20, col).getFormula(); if (f) throw new Error('As linhas 18/20 do mês têm fórmula. Nada foi gravado.');
    if (textos.saneamento) s.getRange(18, col).setValue(AnexosCPT.valor(textos.saneamento));
    if (textos.qualidade) s.getRange(20, col).setValue(AnexosCPT.valor(textos.qualidade));
    const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) throw new Error('Os textos foram gravados na máscara, mas o registro de quem gravou não foi salvo agora. Grave de novo em instantes.');
    let e; try { const col_ = this.colecao(), id = 'PPT-' + mes, antigo = col_.obter(id); e = col_.gravar({mes, ...textos, gravadoPor: this.ctx.email, nome: this.ctx.perfil.nome, gravadoEm: new Date().toISOString()}, antigo ? antigo.versao : 0, p.operacaoId, id); }
    finally { lock.releaseLock(); }
    return {resultado: 'Textos gravados na máscara (linhas 18 e 20 de ' + DadosDaAplicacao.mesExtenso(mes) + ').', textos: e};
  }

  // ---------------- Conferir / atualizar / tela ----------------
  rodar(gravar) {
    const c = AplicacaoCPT.config(), hoje = Utilities.formatDate(new Date(), this.fuso, 'yyyy-MM-dd'), desde = c.parceirosDesde || hoje.slice(0, 7);
    const s = this.abrir(), r = {em: new Date().toISOString(), gravado: !!gravar, desde, link: ParceirosCPT.link(), meses: this.gravarNumeros(s, AnexosCPT.mesesParaGravar(hoje, desde), gravar)};
    if (gravar) {
      if (!c.parceirosDesde) { const atual = AplicacaoCPT.config(); atual.parceirosDesde = desde; PropertiesService.getScriptProperties().setProperty(AplicacaoCPT.chave, JSON.stringify(atual)); }
      PropertiesService.getScriptProperties().setProperty(ParceirosCPT.chaveUltima, JSON.stringify({em: r.em, meses: r.meses.map(m => ({mes: m.mes, criado: m.criado, mudaram: m.linhas.filter(x => x.situacao === 'muda').length}))}));
    }
    return r;
  }
  static texto(r) { return r.meses.map(m => m.mes + ': ' + m.linhas.filter(x => x.situacao === 'muda').length + ' número(s)' + (m.criado ? ' (bloco do mês criado)' : '')).join(', '); }
  static ultima() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(ParceirosCPT.chaveUltima) || 'null'); } catch (_) { return null; } }
  /** Tela: números (conferidos, sem gravar), depoimentos do mês escolhido, prompt e textos já gravados. */
  carregar(mes) {
    mes = DadosDaAplicacao.mesValido(mes);
    let numeros = null, erro = '';
    try { numeros = this.rodar(false); } catch (e) { erro = e.message; }
    const d = this.depoimentos(mes), salvo = this.colecao().obter('PPT-' + mes);
    return {mes, numeros, erro, depoimentos: d, prompt: ParceirosCPT.prompt(d), textos: salvo ? {saneamento: salvo.saneamento, qualidade: salvo.qualidade, nome: salvo.nome, em: salvo.gravadoEm} : null, ultima: ParceirosCPT.ultima(), link: ParceirosCPT.link()};
  }
}

function carregarParceirosCPT(p) {
  return AplicacaoCPT.executar((d, ctx) => { if (!ParceirosCPT.pode(ctx.perfil)) throw new Error('O Programa Parceiros fica com a Gestão e o Administrativo.'); return new ParceirosCPT(ctx).carregar(String(p && p.mes || '')); }, 'parceiros.carregar');
}
function atualizarParceirosCPT() {
  return AplicacaoCPT.executar((d, ctx) => { if (!ParceirosCPT.pode(ctx.perfil)) throw new Error('O Programa Parceiros fica com a Gestão e o Administrativo.'); return AnexosCPT.sozinho(() => new ParceirosCPT(ctx).rodar(true), 'CPT_PARCEIROS_LOTE', 'A máscara do Programa Parceiros'); }, 'parceiros.atualizar');
}
function gravarTextosParceirosCPT(p) {
  return AplicacaoCPT.executar((d, ctx) => new ParceirosCPT(ctx).gravarTextos(p), 'parceiros.textos');
}

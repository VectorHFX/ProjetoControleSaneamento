/**
 * AnexosRelatorioCPT 2.26.0. "Anexos do relatório" = a planilha oficial (Matriz de Contatos, Controle de manisfestações
 * e Indicadores 2026), como na documentação anterior (Fichas Oficiais 3.2.1 e Painel de Gestão 3.2).
 * - Controle de manifestações: os casos do mês (abertos até o fim do mês e concluídos no mês, os mesmos do ANEXO 4)
 *   entram nas 10 colunas oficiais. Regra acumulativa da 3.2.1:
 *   · cada linha guarda o protocolo na nota da data (CPT_ATD_ID=…); sem nota, a linha é reconhecida pelo conteúdo
 *     (data, nome, endereço e histórico);
 *   · caso já presente é atualizado no lugar; caso novo vai para o fim; nada é apagado nem reordenado;
 *   · célula com fórmula não é sobrescrita; Providência e Obs. escritas à mão não são trocadas por texto vazio;
 *   · caso "Concluído" na planilha e aberto na base: para tudo e avisa (nada é reaberto).
 * - Matriz de Contatos e Indicadores 2026: a aplicação NÃO altera (só confere se as abas existem).
 * - Primeiro "Conferir" (prévia, nada é gravado); depois "Atualizar" (grava). Gravar é da gerência; nos testes, só do proprietário.
 * - Baixar: Excel (.xlsx) e PDF da planilha oficial inteira, pelos links de exportação do Google (com a conta de quem clica).
 */
class AnexosRelatorioCPT {
  static get abaControle() { return 'Controle de manisfestações'; } // grafia da planilha oficial
  static get tipos() { return ['Danos à calçada', 'Ligações de Esgoto', 'Danos e limpeza da via', 'Danos à edificação', 'Danos a veículos', 'Transtornos causados pela obra', 'Informação', 'Elogio', 'Outros', 'Reclamação', 'Solicitação']; }
  constructor(ctx) {
    if (!EntregasDoMesCPT.pode(ctx.perfil)) throw new Error('Os Anexos do relatório ficam com Socioambiental, Comunicação, Gestão e Administrativo.');
    this.ctx = ctx; this.fuso = 'America/Sao_Paulo';
  }
  static id() { return ConectoresCPT.id('anexos'); }
  static links() {
    const id = AnexosRelatorioCPT.id(), b = 'https://docs.google.com/spreadsheets/d/' + id;
    return {planilha: b + '/edit', xlsx: b + '/export?format=xlsx', pdf: b + '/export?format=pdf&portrait=false&fitw=true&gridlines=false&size=A4'};
  }
  abrir() {
    try { return SpreadsheetApp.openById(AnexosRelatorioCPT.id()); }
    catch (_) { throw new Error('A planilha dos Anexos não abriu com a conta proprietária. Confira em Conectores e pastas (precisa ser Planilha Google, não Excel).'); }
  }
  static norm(v) { return DadosDaAplicacao.norm(v); }
  static abaControleDe(ss) {
    const exata = ss.getSheetByName(AnexosRelatorioCPT.abaControle); if (exata) return exata;
    const achada = ss.getSheets().find(a => { const n = AnexosRelatorioCPT.norm(a.getName()); return n.includes('controle') && /manis?fest/.test(n); });
    if (!achada) throw new Error('A aba "Controle de manifestações" não foi encontrada na planilha dos Anexos. Nada foi alterado.');
    return achada;
  }
  /** Linha do cabeçalho (Data, Nome, Status) nas primeiras 15 linhas; -1 se não achar. */
  static cabecalho(valores) {
    return valores.slice(0, 15).findIndex(r => { const c = r.map(AnexosRelatorioCPT.norm); return c.includes('data') && c.includes('nome') && c.includes('status'); });
  }
  static dia(v) {
    if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, 'America/Sao_Paulo', 'yyyy-MM-dd');
    const s = String(v == null ? '' : v).trim(), m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
    return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : 'texto:' + s;
  }
  static identidade(r) { return JSON.stringify([AnexosRelatorioCPT.dia(r[0]), r[1], r[2], r[6]].map((x, i) => i ? AnexosRelatorioCPT.norm(x) : x)); }
  static idNota(nota) { const m = String(nota || '').match(/(?:^|\n)CPT_ATD_ID=([^\n]+)/); return m ? decodeURIComponent(m[1]) : ''; }
  static nota(nota, id) { return (String(nota || '').replace(/(?:^|\n)CPT_ATD_ID=[^\n]*/g, '').trim() + '\nCPT_ATD_ID=' + encodeURIComponent(id)).trim(); }
  static concluido(v) { return /^conclu/.test(AnexosRelatorioCPT.norm(v)); }
  static valor(v) { return typeof v === 'string' && /^\s*[=+@-]/.test(v) ? "'" + v : v; }
  static igual(a, b) { return a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : String(a == null ? '' : a) === String(b == null ? '' : b); }
  /** Categoria oficial dos Anexos a partir do tipo, assunto e solicitação (mesma regra da 3.2.1). */
  static tipo(reg) {
    const t = AnexosRelatorioCPT.norm([reg.tipo, reg.assunto, reg.solicitacao].join(' '));
    if (/dano.*calcada|calcada.*dano|paviment|buraco/.test(t)) return 'Danos à calçada';
    if (/ligacao.*esgoto|esgoto.*ligacao/.test(t)) return 'Ligações de Esgoto';
    if (/limpeza.*via|sujeira.*via|residuo.*via/.test(t)) return 'Danos e limpeza da via';
    if (/dano.*edific|rachadura|trinca|portao|muro|fachada|imovel|vidro/.test(t)) return 'Danos à edificação';
    if (/dano.*veiculo|veiculo.*dano|carro.*danific|danific.*carro|moto.*danific/.test(t)) return 'Danos a veículos';
    if (/transtorno|acesso|barulho|poeira|odor|cheiro|alag|vazamento|esgoto|tapume/.test(t)) return 'Transtornos causados pela obra';
    if (/elogio/.test(t)) return 'Elogio';
    if (/reclam/.test(t)) return 'Reclamação';
    if (/solicit/.test(t)) return 'Solicitação';
    if (/inform|duvida|neutra|nao qualific/.test(t)) return 'Informação';
    return 'Outros';
  }
  /** Texto para a planilha oficial: sem rótulos internos nem respostas vazias ("NI", "Não informado"). */
  static publico(v) {
    return String(v == null ? '' : v).split(/\n/).map(l => l.trim().replace(/^Canal(?:\s+interno)?:\s*.*?(?=Resultado:|$)/i, '').trim().replace(/^(Devolutiva ao cliente|Resultado|Comentário|Observação|Observações):\s*/i, ''))
      .filter(l => l && !/^(ni|n\/i|n[ãa]o informado[.!]?|nenhuma observa[çc][ãa]o(?: extra| adicional)?[.!]?|outro[.!]?)$/i.test(l)).join('\n');
  }
  /** As 10 colunas oficiais de um caso. */
  linha(r, reg, canal) {
    const data = r[4] instanceof Date ? r[4] : (reg.dataAbertura || '');
    const frente = String(r[9] || '').replace(/\s*\[OBR-\d+\]\s*$/, '').split(' — ')[0];
    return [data, reg.nome, reg.endereco, canal || 'Não informado', AnexosRelatorioCPT.tipo(reg), frente, reg.solicitacao,
      AnexosRelatorioCPT.publico(reg.solucao), reg.concluido ? 'Concluído' : 'Em andamento', AnexosRelatorioCPT.publico(reg.finalizacao)].map(v => v == null ? '' : v);
  }
  /** Casos do mês (abertos até o fim do mês e concluídos no mês), com as 10 colunas. */
  casos(mes) {
    const f = new FichaOficialCPT(this.ctx), ids = new Set(f.doMes(mes)), a = f.ciclo.aba('Atendimentos'), n = a.getLastRow() - 1;
    const dia = v => v instanceof Date ? v.getTime() : 0;
    return (n > 0 ? a.getRange(2, 1, n, 20).getValues() : []).filter(r => ids.has(String(r[0]))).sort((x, y) => dia(x[4]) - dia(y[4]) || String(x[0]).localeCompare(String(y[0])))
      .map(r => { const reg = f.registro(r), c = CicloAtendimentoCPT.campos(CicloAtendimentoCPT.json(r[19]), r); return {id: String(r[0]), valores: this.linha(r, reg, c.canal)}; });
  }
  /** Plano acumulativo (sem gravar): o que atualiza e o que entra. */
  static planejar(linhas, notas, formulas, registros) {
    const porId = new Map(), porConteudo = new Map(), usadas = new Set(), atualizar = [], incluir = [], vistos = new Set(); let iguais = 0;
    linhas.forEach((r, i) => {
      if (!r.some(v => v !== '' && v != null)) return;
      const id = AnexosRelatorioCPT.idNota((notas[i] || [])[0]);
      if (id) { if (porId.has(id)) throw new Error('O protocolo ' + id + ' aparece em duas linhas do Controle. Confira a planilha; nada foi alterado.'); porId.set(id, i); }
      const k = AnexosRelatorioCPT.identidade(r); if (!porConteudo.has(k)) porConteudo.set(k, []); porConteudo.get(k).push(i);
    });
    registros.forEach(x => {
      if (vistos.has(x.id)) return; vistos.add(x.id);
      let i = porId.get(x.id);
      if (i === undefined) {
        const cands = (porConteudo.get(AnexosRelatorioCPT.identidade(x.valores)) || []).filter(k => !usadas.has(k) && !AnexosRelatorioCPT.idNota((notas[k] || [])[0]));
        if (cands.length > 1) throw new Error('Mais de uma linha do Controle corresponde ao protocolo ' + x.id + '. Confira a duplicidade; nada foi alterado.');
        if (cands.length === 1) i = cands[0];
      }
      if (i === undefined) { incluir.push(x); return; }
      usadas.add(i);
      const antiga = linhas[i];
      if (AnexosRelatorioCPT.concluido(antiga[8]) && !AnexosRelatorioCPT.concluido(x.valores[8])) throw new Error('O caso ' + x.id + ' está "Concluído" na planilha e em aberto na base. Confira a divergência; nenhum caso foi reaberto e nada foi alterado.');
      // Texto manual de Providência e Obs. não é trocado por vazio; fórmulas ficam como estão.
      const novos = x.valores.map((v, j) => (formulas[i] || [])[j] ? antiga[j] : ([7, 9].includes(j) && !String(v).trim() && String(antiga[j] || '').trim()) ? antiga[j] : v);
      const muda = novos.some((v, j) => !(formulas[i] || [])[j] && !AnexosRelatorioCPT.igual(v, antiga[j]) && !AnexosRelatorioCPT.igual(AnexosRelatorioCPT.valor(v), antiga[j]));
      const notaNova = AnexosRelatorioCPT.nota((notas[i] || [])[0], x.id), notaMuda = notaNova !== String((notas[i] || [])[0] || '');
      if (muda || notaMuda) atualizar.push({indice: i, id: x.id, valores: novos, nota: notaNova, muda}); else iguais++;
    });
    return {atualizar, incluir, iguais};
  }
  ler(ss) {
    const aba = AnexosRelatorioCPT.abaControleDe(ss), ult = Math.max(1, aba.getLastRow()), faixa = aba.getRange(1, 1, ult, 10);
    const valores = faixa.getValues(), notas = faixa.getNotes(), formulas = faixa.getFormulas(), cab = AnexosRelatorioCPT.cabecalho(valores);
    if (cab < 0) throw new Error('O cabeçalho do Controle de manifestações (Data, Nome, Status) não foi encontrado. Nada foi alterado.');
    let ultima = cab + 1; valores.forEach((r, i) => { if (i > cab && r.some(v => v !== '' && v != null)) ultima = i + 1; });
    return {aba, cab, ultima, corpo: valores.slice(cab + 1), notas: notas.slice(cab + 1), formulas: formulas.slice(cab + 1)};
  }
  /** Abas oficiais encontradas (sem alterar nenhuma). */
  static abas(ss) {
    const nomes = ss.getSheets().map(a => a.getName()), n = AnexosRelatorioCPT.norm, tem = f => nomes.some(x => f(n(x)));
    return {controle: tem(x => x.includes('controle') && /manis?fest/.test(x)), matriz: tem(x => x.includes('matriz') && x.includes('contato')), indicadores: tem(x => x.includes('indicadores'))};
  }
  static ultimaSync(mes) { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('CPT_ANEXOS_SYNC:' + mes) || 'null'); } catch (_) { return null; } }
  podeGravar() { return PerfisCPT.gerencia(this.ctx.perfil) && (!PerfisCPT.travada() || this.ctx.perfil.papeis.includes('administrador')); }
  /** Cartão da tela: links, última atualização do mês e quem pode gravar. Não abre a planilha. */
  estado(mes) { mes = EntregasDoMesCPT.mes(mes); return {mes, links: AnexosRelatorioCPT.links(), ultima: AnexosRelatorioCPT.ultimaSync(mes), podeGravar: this.podeGravar()}; }
  /** Prévia: quantos casos entram, quantos mudam e quantos já estão iguais. Nada é gravado. */
  conferir(mes) {
    mes = EntregasDoMesCPT.mes(mes); const ss = this.abrir(), l = this.ler(ss), casos = this.casos(mes), plano = AnexosRelatorioCPT.planejar(l.corpo, l.notas, l.formulas, casos);
    return {mes, abas: AnexosRelatorioCPT.abas(ss), linhasNaPlanilha: l.ultima - l.cab - 1, casosDoMes: casos.length, novos: plano.incluir.map(x => x.id),
      atualizados: plano.atualizar.filter(x => x.muda).map(x => x.id), iguais: plano.iguais, links: AnexosRelatorioCPT.links(), podeGravar: this.podeGravar()};
  }
  /** Grava o plano: atualiza no lugar, acrescenta no fim. Nunca apaga, nunca reordena, nunca mexe em outras abas. */
  atualizar(p) {
    p = p || {}; const mes = EntregasDoMesCPT.mes(p.mes);
    if (!PerfisCPT.gerencia(this.ctx.perfil)) throw new Error('Atualizar a planilha oficial dos Anexos é da Gestão e do Administrativo.');
    PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Atualizar a planilha oficial dos Anexos');
    const lock = LockService.getScriptLock(); if (!lock.tryLock(20000)) throw new Error('Outra atualização dos Anexos está em andamento. Tente de novo em instantes.');
    try {
      const ss = this.abrir(), l = this.ler(ss), casos = this.casos(mes), plano = AnexosRelatorioCPT.planejar(l.corpo, l.notas, l.formulas, casos), a = l.aba, primeira = l.cab + 2;
      plano.atualizar.forEach(u => {
        const linha = primeira + u.indice;
        if (u.muda) a.getRange(linha, 1, 1, 10).setValues([u.valores.map((v, j) => l.formulas[u.indice][j] || AnexosRelatorioCPT.valor(v))]);
        a.getRange(linha, 1).setNote(u.nota);
      });
      if (plano.incluir.length) {
        const ini = l.ultima + 1, n = plano.incluir.length;
        if (ini + n - 1 > a.getMaxRows()) a.insertRowsAfter(a.getMaxRows(), ini + n - 1 - a.getMaxRows());
        if (l.ultima >= primeira) a.getRange(primeira, 1, 1, 10).copyFormatToRange(a, 1, 10, ini, ini + n - 1);
        a.getRange(ini, 1, n, 10).setValues(plano.incluir.map(x => x.valores.map(AnexosRelatorioCPT.valor))).setWrap(true).setVerticalAlignment('top');
        a.getRange(ini, 1, n, 1).setNumberFormat('dd/MM/yyyy').setNotes(plano.incluir.map(x => [AnexosRelatorioCPT.nota('', x.id)]));
      }
      SpreadsheetApp.flush();
      const r = {em: new Date().toISOString(), por: this.ctx.perfil.nome, incluidos: plano.incluir.length, atualizados: plano.atualizar.filter(x => x.muda).length, iguais: plano.iguais};
      PropertiesService.getScriptProperties().setProperty('CPT_ANEXOS_SYNC:' + mes, JSON.stringify(r));
      return {...r, mes, resultado: 'Controle de manifestações atualizado: ' + r.incluidos + ' caso(s) novo(s) e ' + r.atualizados + ' atualizado(s). Nada foi apagado; Matriz de Contatos e Indicadores 2026 não foram tocados.', links: AnexosRelatorioCPT.links()};
    } finally { lock.releaseLock(); }
  }
}

function estadoAnexosCPT(mes) { return ColecaoCPT.executar('anexos.estado', ctx => new AnexosRelatorioCPT(ctx).estado(String(mes || ''))); }
function conferirAnexosCPT(mes) { return AplicacaoCPT.executar((d, ctx) => new AnexosRelatorioCPT(ctx).conferir(String(mes || '')), 'anexos.conferir'); }
function atualizarAnexosCPT(p) { return AplicacaoCPT.executar((d, ctx) => new AnexosRelatorioCPT(ctx).atualizar(p), 'anexos.atualizar'); }

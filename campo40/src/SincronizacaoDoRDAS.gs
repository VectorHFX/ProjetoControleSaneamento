/**
 * SincronizacaoDoRDAS — 1.6.0 — PERMANENTE. Campo 4.0 → planilha RDAS (a mesma que a cliente acessa).
 *
 * Mantém a ficha diária "RDAS dd-MM-aaaa" no MESMO layout da Sincronização 1.5 (Procedimentos 3.0), para que
 * a cliente, o Painel do RDAS (Visão executiva e Banco de imagens) e o Painel de Gestão continuem lendo igual:
 * mesmas abas, mesmas células de cabeçalho, mesma tabela (ID, Período…), mesmas fichas "FICHA n DE m | ID | …",
 * mesmos rótulos e as legendas de foto com link para o original.
 *
 * Fontes de um dia:
 * - Campo 4.0: tabela Registros desta base, procedimento "Relato de atividade", origem "Procedimentos de Campo 4.0".
 * - Procedimentos 3.0 (só para dias anteriores a RDAS_SO_CAMPO40, padrão 05/10/2026): o formulário 3.0 e o
 *   histórico 2.0, exatamente como a Sincronização 1.5 lia. Assim, um relato atrasado entra no dia certo sem
 *   apagar os relatos que já estavam lá.
 *
 * Melhorias visuais 1.6 (sem mudar a estrutura lida pelos painéis):
 * - fotos maiores (área mais alta, margem menor) e legenda curta "Foto 1 de 5 | data | ID · abrir original ↗";
 * - linha de orientação abaixo de "REGISTRO FOTOGRÁFICO AUTOMÁTICO" com a quantidade de fotos;
 * - na tabela do dia, o ID leva direto à ficha do relato.
 *
 * Execução: depois de cada relato salvo (o dia fica marcado e é refeito em seguida) e na retomada de hora em hora.
 * Usa uma trava própria: a montagem das fotos nunca segura os envios do formulário.
 */
class SincronizacaoDoRDAS {
  static get C() {
    return Object.freeze({
      RDAS_ID: '176BymNYBSfVt7iQrkNR-IyT_NXdB9GC999mX9C2WtK4', PROCEDIMENTOS_30_ID: '1_6BKqeVbjzKm_hYdRsneU3YqEmd1rOWaVGCiV0LXtgQ',
      ABA_FORMS_30: 'Respostas ao formulário 1', ABA_HIST_30: 'Base Consolidada', ABA_HIST_30_RESERVA: 'Importação Histórica 2.0',
      SO_CAMPO40_PADRAO: '2026-10-05', PREFIXO: 'RDAS ', EMPRESA: 'Consórcio Performance Tamanduateí', CONTRATO: 'RFP 00725/24 - Pacote 16',
      PENDENTES: 'RDAS_DIAS_PENDENTES', ORIGEM_40: 'Procedimentos de Campo 4.0', FOTO_LINHAS: 7, FOTO_ALTURA: 32
    });
  }
  /** Dias a partir deste usam só o Campo 4.0 (o formulário 3.0 já foi desligado). Property: RDAS_SO_CAMPO40. */
  static soCampo40() { return PropertiesService.getScriptProperties().getProperty('RDAS_SO_CAMPO40') || this.C.SO_CAMPO40_PADRAO; }
  static norm(v) { return String(v == null ? '' : v).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  static tituloNorm(v) { return this.norm(v).replace(/[\s:?.!*]+$/g, ''); }

  // ---------------- Fila de dias ----------------
  static marcarPendente(dia) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dia || ''))) return;
    const p = PropertiesService.getScriptProperties(), atuais = JSON.parse(p.getProperty(this.C.PENDENTES) || '[]');
    if (!atuais.includes(dia)) { atuais.push(dia); p.setProperty(this.C.PENDENTES, JSON.stringify(atuais.slice(-60))); }
  }
  /** Refaz os dias marcados. Nunca lança erro para quem chamou (o envio do formulário já está salvo). */
  static processarPendentes() {
    const lock = LockService.getUserLock(); if (!lock.tryLock(1000)) return {resultado: 'RDAS JÁ ESTÁ SENDO ATUALIZADO'};
    try {
      const p = PropertiesService.getScriptProperties(), dias = JSON.parse(p.getProperty(this.C.PENDENTES) || '[]');
      if (!dias.length) return {resultado: 'NADA PENDENTE'};
      const feitos = [], falhas = [];
      dias.forEach(dia => { try { feitos.push(this.atualizarDia(dia)); } catch (e) { falhas.push(dia + ': ' + e.message); console.error('RDAS ' + dia + ': ' + e.message); } });
      const restam = JSON.parse(p.getProperty(this.C.PENDENTES) || '[]').filter(d => !feitos.some(f => f.dia === d));
      p.setProperty(this.C.PENDENTES, JSON.stringify(restam));
      return {resultado: falhas.length ? 'RDAS ATUALIZADO COM FALHAS' : 'RDAS ATUALIZADO', dias: feitos, falhas};
    } catch (e) { console.error('RDAS: ' + e.message); return {resultado: 'RDAS NÃO ATUALIZADO', erro: e.message}; }
    finally { lock.releaseLock(); }
  }

  // ---------------- Leitura do Campo 4.0 ----------------
  static base() { return SpreadsheetApp.openById(ConfiguracaoDaBase.exigirInstalacao().baseId); }
  static detalhes(json) {
    let d = {}; try { d = JSON.parse(json || '{}') || {}; } catch (_) { return {}; }
    if (d.arquivoDetalhesId) { try { d = JSON.parse(DriveApp.getFileById(d.arquivoDetalhesId).getBlob().getDataAsString('UTF-8')); } catch (_) { return {}; } }
    return d.conteudo || d;
  }
  /** Relatos do Campo 4.0 cujas datas estão em `dias` (Set de 'aaaa-mm-dd'); sem `dias`, todos. */
  static relatos40(dias) {
    const base = this.base(), fuso = base.getSpreadsheetTimeZone(), aba = base.getSheetByName('Registros'); if (!aba || aba.getLastRow() < 2) return [];
    const n = aba.getLastRow() - 1, linhas = aba.getRange(2, 1, n, 19).getValues(), out = [];
    const idx = []; linhas.forEach((r, i) => {
      if (this.norm(r[1]) !== 'relato de atividade' || String(r[5]) !== this.C.ORIGEM_40) return;
      const dia = r[2] instanceof Date ? Utilities.formatDate(r[2], fuso, 'yyyy-MM-dd') : String(r[2] || '').slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(dia) && (!dias || dias.has(dia))) idx.push({i, dia});
    });
    idx.forEach(({i, dia}) => {
      const r = linhas[i], d = this.detalhes(aba.getRange(i + 2, 21).getValue()), campos = new Map();
      (d.campos || []).forEach(c => { const k = this.tituloNorm(c.titulo); if (!campos.has(k)) campos.set(k, c.valor); });
      const get = (...t) => { for (const x of t) { const v = campos.get(this.tituloNorm(x)); if (v !== undefined && v !== null && String(v).trim() !== '') return Array.isArray(v) ? v.join(', ') : v; } return ''; };
      const fotos = []; const vistos = new Set(), add = u => { const id = (String(u || '').match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{10,})/) || [])[1]; if (id && !vistos.has(id)) { vistos.add(id); fotos.push('https://drive.google.com/file/d/' + id + '/view'); } };
      (d.anexos || []).forEach(a => add(a.url || a.arquivoId && 'https://drive.google.com/file/d/' + a.arquivoId + '/view'));
      (d.campos || []).filter(c => c.tipo === 'FILE_UPLOAD').forEach(c => (Array.isArray(c.valor) ? c.valor : [c.valor]).forEach(v => add(/^[A-Za-z0-9_-]{20,}$/.test(String(v)) ? 'https://drive.google.com/file/d/' + v + '/view' : v)));
      const obra = String(r[9] || '').replace(/\s*\[OBR-\d+\]\s*$/, '').trim(), semObra = /^nao se aplica|ainda nao cadastrada/.test(this.norm(obra));
      out.push({id: 'R4-' + String(r[0]).replace(/^REG-/, '').slice(0, 6).toUpperCase(), chaveData: dia, data: new Date(dia + 'T12:00:00'), registro: r[4] instanceof Date ? r[4] : null,
        origemRegistro: 'Campo 4.0', bairro: r[7] || get('Bairro de realização do procedimento'), area: r[12] || get('Área responsável pelo procedimento'),
        responsavel: r[11] || get('Colaborador responsável pelo registro'), atividade: r[13] || get('Atividade realizada'), complemento: get('Complemento da atividade'),
        frente: get('Título da frente de serviço') || (semObra ? '' : obra), endereco: get('Endereço da frente de serviço', 'Endereço completo'),
        classificacao: get('Classificação da atividade'), publico: get('Público-alvo da atividade'), participantes: r[14] !== '' ? r[14] : get('Total de participantes'),
        ferramentas: get('Ferramenta'), apoio: get('Colaboradores de apoio na atividade'), deslocamento: get('Como você chegou à atividade?', 'Como que você chegou na atividade?'),
        pessoasVeiculo: get('Quantas pessoas estavam no veículo com você no início dessa atividade?', 'Quantas pessoas estavam no veículo com você no inicio dessa atividade.'),
        entrada: get('Horário de entrada na atividade'), saida: get('Horário de saída na atividade'), clima: get('Clima e tempo durante a atividade'),
        panfletos: get('Quantidade de panfletos entregues'), interrupcao: get('Houve interrupção da atividade?'),
        motivoInterrupcao: get('Descreva qual foi a interrupção', 'Descreva qual foi a interrução', 'Qual foi a interrupção da atividade?'),
        horariosInterrupcao: get('Indique os horários da interrupção da atividade', 'Informe o horário de início e fim da interrupção'),
        objetivo: get('Objetivo da atividade'), relato: get('Relato da atividade'), observacao: get('Observação final do procedimento'), fotos: fotos.slice(0, 10)});
    });
    return out.map(x => this.completar(x, fuso));
  }

  // ---------------- Leitura do Procedimentos 3.0 (igual à Sincronização 1.5) ----------------
  static get campos30() {
    return {registro: 'Carimbo de data/hora', data: 'Data de realização do procedimento', bairro: 'Bairro de realização do procedimento', area: 'Área responsável pelo procedimento',
      responsavel: 'Colaborador responsável pelo registro', atividade: 'Atividade realizada', complemento: 'Complemento da atividade', frente: 'Título da frente de serviço',
      endereco: 'Endereço da frente de serviço', classificacao: 'Classificação da atividade', publico: 'Público-alvo da atividade', participantes: 'Total de participantes',
      ferramentas: 'Ferramenta', apoio: 'Colaboradores de apoio na atividade', deslocamento: 'Como que você chegou na atividade?',
      pessoasVeiculo: 'Quantas pessoas estavam no veículo com você no inicio dessa atividade.', entrada: 'Horário de entrada na atividade', saida: 'Horário de saída na atividade',
      clima: 'Clima e tempo durante a atividade', panfletos: 'Quantidade de panfletos entregues', interrupcao: 'Houve interrupção da atividade?',
      motivoInterrupcao: ['Descreva qual foi a interrução', 'Descreva qual foi a interrupção', 'Qual foi a interrupção da atividade?'],
      horariosInterrupcao: ['Indique os horários de entrada e saída da atividade', 'Indique os horários da interrupção da atividade', 'Informe o horário de início e fim da interrupção'],
      objetivo: 'Objetivo da atividade', relato: 'Relato da atividade', observacao: 'Observação final do procedimento', fotos: 'Adicione até 5 fotos com timestamp da atividade'};
  }
  static relatos30(dias) {
    let ss; try { ss = SpreadsheetApp.openById(this.C.PROCEDIMENTOS_30_ID); } catch (e) { throw new Error('Procedimentos 3.0 indisponível para a conta proprietária: ' + e.message); }
    const fuso = ss.getSpreadsheetTimeZone() || 'America/Sao_Paulo', out = [], vistos = {};
    const forms = ss.getSheetByName(this.C.ABA_FORMS_30); if (!forms) throw new Error('A aba "' + this.C.ABA_FORMS_30 + '" não foi encontrada no Procedimentos 3.0.');
    const fontes = [{aba: forms, historico: false}], hist = ss.getSheetByName(this.C.ABA_HIST_30) || ss.getSheetByName(this.C.ABA_HIST_30_RESERVA);
    if (hist) fontes.push({aba: hist, historico: true});
    fontes.forEach(f => {
      const intervalo = f.aba.getDataRange(), dados = intervalo.getValues(); if (dados.length < 2) return;
      let ricos = []; try { ricos = intervalo.getRichTextValues(); } catch (_) {}
      const mapa = {}; dados[0].forEach((h, i) => { const k = this.norm(h); if (k && mapa[k] === undefined) mapa[k] = i; });
      const col = t => { for (const x of [].concat(t)) { const i = mapa[this.norm(x)]; if (i !== undefined) return i; } return undefined; };
      const iProc = col('Selecione o procedimento a ser executado'), iOrigem = col('Origem do registro'), iId = col('ID de migração'), iFotos = col(this.campos30.fotos);
      if (iProc === undefined) throw new Error('Procedimentos 3.0: coluna do procedimento não encontrada.');
      for (let l = 1; l < dados.length; l++) {
        const v = dados[l];
        if (f.historico && iOrigem !== undefined && this.norm(v[iOrigem]) !== this.norm('Histórico 2.0')) continue;
        if (this.norm(v[iProc]) !== 'relato de atividade') continue;
        const r = {}; Object.keys(this.campos30).forEach(k => { const i = col(this.campos30[k]); r[k] = i === undefined ? '' : v[i]; });
        r.data = this.data(r.data); if (!r.data) continue;
        r.chaveData = Utilities.formatDate(r.data, fuso, 'yyyy-MM-dd'); if (dias && !dias.has(r.chaveData)) continue;
        r.registro = this.data(r.registro);
        const chave = [r.registro ? r.registro.getTime() : '', r.data.getTime(), this.norm(r.responsavel), this.norm(r.atividade), this.norm(r.complemento), this.norm(r.endereco), this.norm(r.relato)].join('|');
        if (vistos[chave]) continue; vistos[chave] = true;
        const idMig = iId === undefined ? '' : String(v[iId] || '').trim();
        r.id = f.historico ? (idMig || 'HIST-2.0-' + String(l + 1).padStart(4, '0')) : 'REL-' + String(l + 1).padStart(3, '0');
        r.origemRegistro = f.historico ? 'Histórico 2.0' : 'Forms 3.0';
        r.fotos = this.fotos30(iFotos === undefined ? '' : v[iFotos], ricos[l] && iFotos !== undefined ? ricos[l][iFotos] : null);
        out.push(this.completar(r, fuso));
      }
    });
    return out;
  }
  static fotos30(valor, rico) {
    const links = [], texto = t => (String(t || '').match(/https?:\/\/[^\s,;]+/gi) || []).forEach(x => links.push(x));
    texto(valor);
    if (rico) { try { if (rico.getLinkUrl()) links.push(rico.getLinkUrl()); } catch (_) {} try { rico.getRuns().forEach(t => { if (t.getLinkUrl()) links.push(t.getLinkUrl()); texto(t.getText()); }); } catch (_) {} }
    const vistos = {}, out = []; links.forEach(l => { const x = String(l || '').trim().replace(/[),.;]+$/, ''); if (x && !vistos[x]) { vistos[x] = true; out.push(x); } });
    return out.slice(0, 5);
  }

  // ---------------- Montagem (mesmas regras da 1.5) ----------------
  static data(v) {
    if (v instanceof Date && !isNaN(v.getTime())) return v;
    if (typeof v === 'number' && isFinite(v)) return new Date(Math.round((v - 25569) * 86400000));
    const t = String(v || '').trim(), br = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (br) return new Date(+br[3], +br[2] - 1, +br[1], +(br[4] || 0), +(br[5] || 0), +(br[6] || 0));
    const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3], 12);
    const d = new Date(t); return isNaN(d.getTime()) ? null : d;
  }
  static numero(v) { if (typeof v === 'number') return isFinite(v) ? v : 0; const m = String(v || '').replace(',', '.').match(/-?\d+(?:\.\d+)?/); return m ? Number(m[0]) : 0; }
  static minutos(v) {
    if (v instanceof Date && !isNaN(v.getTime())) return v.getHours() * 60 + v.getMinutes();
    if (typeof v === 'number' && isFinite(v) && v >= 0 && v < 1) return Math.round(v * 1440);
    const m = String(v || '').match(/(\d{1,2}):(\d{2})/); return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
  }
  static hhmm(m) { return m < 0 ? '' : String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  static intervalo(a, b) { const x = this.minutos(a), y = this.minutos(b); return x < 0 && y < 0 ? 'Não informado' : (this.hhmm(x) || '--:--') + ' - ' + (this.hhmm(y) || '--:--'); }
  static exibir(v) { if (v instanceof Date) return v; const t = String(v == null ? '' : v).trim(); return t || 'Não informado'; }
  static unicos(lista) { const vistos = {}, out = []; lista.forEach(v => { const t = String(v || '').replace(/\s+/g, ' ').trim(), k = this.norm(t); if (!t || k === 'nao informado' || k === 'sem observacoes' || vistos[k]) return; vistos[k] = true; out.push(t); }); return out; }
  static itens(lista) { const out = []; lista.forEach(v => String(v || '').split(/[,;\n]+/).forEach(p => { const t = p.replace(/\s+/g, ' ').trim(); if (t) out.push(t); })); return this.unicos(out); }
  static completar(r, fuso) {
    r.participantes = this.numero(r.participantes); r.pessoasVeiculo = this.numero(r.pessoasVeiculo); r.panfletos = this.numero(r.panfletos);
    const frente = String(r.frente || '').trim(), end = String(r.endereco || '').trim();
    r.local = frente && end && this.norm(frente) !== this.norm(end) ? frente + ' | ' + end : frente || end || 'Não informado';
    const at = String(r.atividade || '').trim(), comp = String(r.complemento || '').trim();
    r.atividadeCompleta = !comp || this.norm(comp) === 'sem complemento' ? at || 'Não informado' : at ? at + ' - ' + comp : comp;
    const resp = String(r.responsavel || '').trim(), apoio = String(r.apoio || '').trim();
    r.equipe = !apoio || this.norm(apoio).indexOf('nao houve') >= 0 ? resp || 'Não informado' : this.itens([resp, apoio]).join(', ') || 'Não informado';
    const ent = this.minutos(r.entrada); r.periodo = ent < 0 ? 'Não informado' : ent < 720 ? 'Manhã' : ent < 1080 ? 'Tarde' : 'Noite';
    let fim = this.minutos(r.saida); r.duracao = ent < 0 || fim < 0 ? 'Duração não informada' : (fim < ent && (fim += 1440), String(Math.floor((fim - ent) / 60)).padStart(2, '0') + 'h' + String((fim - ent) % 60).padStart(2, '0'));
    r.status = this.norm(r.interrupcao) === 'sim' ? 'Executado com interrupção' : 'Executado';
    const partes = [], obs = String(r.observacao || '').trim();
    if (obs && this.norm(obs) !== 'sem observacoes') partes.push('Observação final: ' + obs);
    partes.push('Público alcançado: ' + this.exibir(r.publico) + ' | Participantes: ' + r.participantes, 'Recursos utilizados: ' + this.exibir(r.ferramentas),
      'Deslocamento: ' + this.exibir(r.deslocamento) + ' | Pessoas no veículo: ' + r.pessoasVeiculo, 'Interrupção: ' + this.exibir(r.interrupcao));
    if (String(r.horariosInterrupcao || '').trim()) partes.push('Detalhes da interrupção: ' + r.horariosInterrupcao);
    if (String(r.motivoInterrupcao || '').trim()) partes.push('Motivo da interrupção: ' + r.motivoInterrupcao);
    r.observacaoCompleta = partes.join('\n'); r.fotos = r.fotos || [];
    return r;
  }
  static montarDia(chave, relatos) {
    relatos.sort((a, b) => this.minutos(a.entrada) - this.minutos(b.entrada) || (a.registro ? a.registro.getTime() : 0) - (b.registro ? b.registro.getTime() : 0) || a.id.localeCompare(b.id));
    const ents = relatos.map(x => this.minutos(x.entrada)).filter(v => v >= 0), sais = relatos.map(x => this.minutos(x.saida)).filter(v => v >= 0), cls = relatos.map(x => this.norm(x.classificacao));
    const dia = {chave, data: new Date(chave + 'T12:00:00'), relatos, totalExecucoes: relatos.length, participantes: relatos.reduce((s, x) => s + x.participantes, 0),
      externas: cls.filter(v => v.indexOf('externa') >= 0).length, internas: cls.filter(v => v.indexOf('interna') >= 0).length, panfletos: relatos.reduce((s, x) => s + x.panfletos, 0),
      interrupcoes: relatos.filter(x => this.norm(x.interrupcao) === 'sim').length, primeiraEntrada: ents.length ? Math.min(...ents) : -1, ultimaSaida: sais.length ? Math.max(...sais) : -1,
      comHorario: relatos.filter(x => this.minutos(x.entrada) >= 0 && this.minutos(x.saida) >= 0).length, climas: this.unicos(relatos.map(x => x.clima)),
      equipe: this.itens(relatos.map(x => x.equipe)), publicos: this.itens(relatos.map(x => x.publico)), fontes: this.unicos(relatos.map(x => x.origemRegistro))};
    dia.faixa = dia.primeiraEntrada < 0 ? 'Horários não informados' : this.hhmm(dia.primeiraEntrada) + ' - ' + (this.hhmm(dia.ultimaSaida) || '--:--') + ' | horários informados em ' + dia.comHorario + ' de ' + dia.totalExecucoes + ' execução(ões)';
    const midias = relatos.reduce((s, x) => s + x.fotos.length, 0), bairros = this.unicos(relatos.map(x => x.bairro)), semClasse = Math.max(0, dia.totalExecucoes - dia.externas - dia.internas), pl = (n, a, b) => n + ' ' + (n === 1 ? a : b);
    dia.sintese = ['EXECUÇÃO: ' + pl(dia.totalExecucoes, 'atividade', 'atividades') + ' — ' + pl(dia.externas, 'externa', 'externas') + ' e ' + pl(dia.internas, 'interna', 'internas') + (semClasse ? '; ' + semClasse + ' sem classificação' : '') + '.',
      'ALCANCE: ' + pl(dia.participantes, 'participante informado', 'participantes informados') + '; públicos: ' + (dia.publicos.join(', ') || 'não informado') + '.',
      'TERRITÓRIO: ' + (bairros.join(' · ') || 'Não informado') + '.',
      'OPERAÇÃO: ' + dia.faixa + '; clima: ' + (dia.climas.join(', ') || 'não informado') + '; ' + pl(dia.interrupcoes, 'relato', 'relatos') + ' com interrupção.',
      'EQUIPE E EVIDÊNCIAS: ' + pl(dia.equipe.length, 'colaborador citado', 'colaboradores citados') + '; ' + pl(midias, 'mídia vinculada', 'mídias vinculadas') + '.'].join('\n');
    return dia;
  }

  // ---------------- Atualização ----------------
  static relatosDoDia(dia) {
    const dias = new Set([dia]), lista = this.relatos40(dias);
    if (dia < this.soCampo40()) lista.push(...this.relatos30(dias));
    return lista;
  }
  static atualizarDia(dia) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dia))) throw new Error('Dia inválido: ' + dia);
    const relatos = this.relatosDoDia(dia), rdas = SpreadsheetApp.openById(this.C.RDAS_ID), nome = this.nomeAba(dia);
    // Sem relatos: a aba existente é preservada (nada é apagado por engano).
    if (!relatos.length) return {dia, aba: nome, relatos: 0, resultado: 'Sem relatos; aba existente preservada'};
    const r = new DesenhoDoRDAS(rdas, this.montarDia(dia, relatos)).desenhar();
    this.ordenarAbas(rdas); return {dia, ...r};
  }
  static nomeAba(dia) { return this.C.PREFIXO + dia.slice(8, 10) + '-' + dia.slice(5, 7) + '-' + dia.slice(0, 4); }
  /** Mais recente à esquerda, como na 1.5. Só mexe na ordem das abas RDAS dd-MM-aaaa. */
  static ordenarAbas(rdas) {
    const abas = rdas.getSheets().map(a => ({a, m: a.getName().match(/^RDAS (\d{2})-(\d{2})-(\d{4})$/)})).filter(x => x.m).map(x => ({a: x.a, k: x.m[3] + x.m[2] + x.m[1]})).sort((x, y) => y.k.localeCompare(x.k));
    abas.forEach((x, i) => { try { if (x.a.getIndex() !== i + 1) { rdas.setActiveSheet(x.a); rdas.moveActiveSheet(i + 1); } } catch (_) {} });
  }
}

/** Desenho de uma aba diária. Mesma grade de 12 colunas e as mesmas posições lidas pelos painéis. */
class DesenhoDoRDAS {
  constructor(rdas, dia) { this.rdas = rdas; this.dia = dia; this.C = SincronizacaoDoRDAS.C; this.balanco = {midias: 0, inseridas: 0, falhas: 0}; }
  desenhar() {
    const nome = SincronizacaoDoRDAS.nomeAba(this.dia.chave); let aba = this.rdas.getSheetByName(nome); if (!aba) aba = this.rdas.insertSheet(nome);
    this.aba = aba; this.preparar();
    this.garantir(this.linhasNecessarias(), 12);
    [105, 105, 120, 120, 105, 105, 120, 120, 105, 105, 120, 120].forEach((w, i) => aba.setColumnWidth(i + 1, w));
    aba.setRowHeights(1, aba.getMaxRows(), 24);
    aba.getRange(1, 1, aba.getMaxRows(), 12).setFontFamily('Arial').setFontSize(10).setBackground('#FFFFFF');
    aba.setTabColor('#0B8F87'); aba.setHiddenGridlines(true); aba.setFrozenRows(3); aba.setFrozenColumns(0);
    this.cabecalho(); let linha = this.resumo();
    this.titulo(aba.getRange(linha, 1, 1, 12).merge().setValue('FICHAS INDIVIDUAIS DOS RELATOS DO DIA'), '#123B5D'); linha += 2;
    const inicios = [];
    this.dia.relatos.forEach((r, i) => { inicios.push(linha); linha = this.ficha(r, i + 1, this.dia.relatos.length, linha); });
    this.ligarIds(inicios);
    const res = {aba: nome, layout: 'Clássico compacto 1.6', relatos: this.dia.relatos.length, midias: this.balanco.midias, previasInseridas: this.balanco.inseridas, falhas: this.balanco.falhas, ultimaLinha: linha};
    console.log(JSON.stringify({renderizacaoRDAS: res})); return res;
  }
  preparar() {
    const a = this.aba; if (a.getFilter()) a.getFilter().remove();
    try { a.getImages().forEach(i => i.remove()); } catch (_) {}
    a.getRange(1, 1, a.getMaxRows(), a.getMaxColumns()).breakApart(); a.clear(); a.setConditionalFormatRules([]);
  }
  garantir(l, c) { const a = this.aba; if (a.getMaxRows() < l) a.insertRowsAfter(a.getMaxRows(), l - a.getMaxRows()); if (a.getMaxColumns() < c) a.insertColumnsAfter(a.getMaxColumns(), c - a.getMaxColumns()); }
  linhasNecessarias() { let n = 34 + this.dia.relatos.length * 37; this.dia.relatos.forEach(r => { n += Math.ceil(r.fotos.length / 2) * (this.C.FOTO_LINHAS + 3); }); return Math.max(90, n); }
  par(rot, val, rotulo, valor) {
    const a = this.aba, borda = r => r.setBorder(true, true, true, true, false, false, '#AFC6D8', SpreadsheetApp.BorderStyle.SOLID);
    borda(a.getRange(rot).merge().setValue(rotulo).setBackground('#E5EEF5').setFontColor('#123B5D').setFontFamily('Arial').setFontSize(9).setFontWeight('bold').setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true));
    borda(a.getRange(val).merge().setValue(SincronizacaoDoRDAS.exibir(valor)).setBackground('#FFFFFF').setFontColor('#233247').setFontFamily('Arial').setFontSize(9).setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true));
  }
  titulo(r, cor) { return r.setBackground(cor).setFontColor('#FFFFFF').setFontFamily('Arial').setFontSize(10).setFontWeight('bold').setHorizontalAlignment('left').setVerticalAlignment('middle').setWrap(true).setBorder(true, true, true, true, false, false, cor, SpreadsheetApp.BorderStyle.SOLID); }
  caixa(r, fundo, cor) { return r.setBackground(fundo).setFontColor(cor).setFontFamily('Arial').setFontSize(10).setHorizontalAlignment('left').setVerticalAlignment('top').setWrap(true).setBorder(true, true, true, true, false, false, '#AFC6D8', SpreadsheetApp.BorderStyle.SOLID); }
  dataBR() { return this.dia.chave.split('-').reverse().join('/'); }
  cabecalho() {
    const a = this.aba, fonte = this.dia.fontes.some(f => f !== 'Campo 4.0') ? 'Procedimentos de Campo 3.0 e 4.0' : 'Procedimentos de Campo 4.0';
    a.getRange('A1:L1').merge().setValue('RELATO DIÁRIO DE ATIVIDADES SOCIOAMBIENTAIS');
    a.getRange('A2:L2').merge().setValue(this.C.EMPRESA);
    a.getRange('A3:L3').merge().setValue('Ficha consolidada de ' + this.dataBR() + ' e registros individuais produzidos a partir do ' + fonte + '.');
    a.getRange('A1:L3').setBackground('#123B5D').setFontColor('#FFFFFF').setFontFamily('Arial').setVerticalAlignment('middle');
    a.getRange('A1').setFontSize(20).setFontWeight('bold'); a.getRange('A2').setFontSize(11).setFontColor('#D8EAF5'); a.getRange('A3').setFontSize(9).setFontStyle('italic').setFontColor('#AFCBDB');
    a.setRowHeight(1, 42); a.setRowHeight(2, 26); a.setRowHeight(3, 28);
  }
  resumo() {
    const a = this.aba, d = this.dia, dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    this.par('A5:B5', 'C5:D5', 'Data', d.data); this.par('E5:F5', 'G5:H5', 'Dia da semana', dias[d.data.getDay()]); this.par('I5:J5', 'K5:L5', 'Contrato', this.C.CONTRATO);
    this.par('A6:B6', 'C6:F6', 'Condição climática', d.climas.join(', ') || 'Não informado'); this.par('G6:H6', 'I6:L6', 'Faixa de atuação', d.faixa);
    a.getRange('C5:D5').setNumberFormat('dd/MM/yyyy');
    [['A8:B8', 'A9:B10', 'EXECUÇÕES', d.totalExecucoes, '#1976A3'], ['C8:D8', 'C9:D10', 'PESSOAS', d.participantes, '#0B8F87'], ['E8:F8', 'E9:F10', 'EXTERNAS', d.externas, '#2F6EB3'],
      ['G8:H8', 'G9:H10', 'INTERNAS', d.internas, '#6C63A8'], ['I8:J8', 'I9:J10', 'PANFLETOS', d.panfletos, '#D18336'], ['K8:L8', 'K9:L10', 'INTERRUPÇÕES', d.interrupcoes, '#B44C43']].forEach(c => {
      a.getRange(c[0]).merge().setValue(c[2]).setBackground(c[4]).setFontColor('#FFFFFF').setFontFamily('Arial').setFontSize(9).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
      a.getRange(c[1]).merge().setValue(c[3]).setBackground('#FFFFFF').setFontColor(c[4]).setFontFamily('Arial').setFontSize(19).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle')
        .setBorder(true, true, true, true, false, false, '#CDD8E3', SpreadsheetApp.BorderStyle.SOLID);
    });
    a.getRange('C9').setNote('Soma dos participantes informados. A mesma pessoa pode aparecer em mais de um relato.');
    a.getRange('K9').setNote('Relatos com resposta “Sim” no campo de interrupção.');
    this.titulo(a.getRange('A12:L12').merge().setValue('LEITURA RÁPIDA DO DIA'), '#0B8F87');
    const caixa = this.caixa(a.getRange('A13:L17').merge().setValue(d.sintese), '#F3FAF8', '#244B48');
    const base = SpreadsheetApp.newTextStyle().setFontFamily('Arial').setFontSize(10).setBold(false).setForegroundColor('#244B48').build(), forte = SpreadsheetApp.newTextStyle().setBold(true).setForegroundColor('#08756F').build();
    const rt = SpreadsheetApp.newRichTextValue().setText(d.sintese).setTextStyle(base), re = /^(?:EXECUÇÃO|ALCANCE|TERRITÓRIO|OPERAÇÃO|EQUIPE E EVIDÊNCIAS):/gm; let m;
    while ((m = re.exec(d.sintese)) !== null) rt.setTextStyle(m.index, m.index + m[0].length, forte);
    caixa.getCell(1, 1).setRichTextValue(rt.build()); a.setRowHeights(13, 5, 25);
    this.titulo(a.getRange('A19:L19').merge().setValue('EXECUÇÕES REGISTRADAS NO DIA  ·  clique no ID para ir à ficha do relato'), '#123B5D');
    a.getRange(20, 1, 1, 12).setValues([['ID', 'Período', 'Horário', 'Local / obra', 'Responsáveis', 'Atividade', 'Público', 'Total', 'Clima', 'Classificação', 'Mídias', 'Situação']])
      .setBackground('#111111').setFontColor('#FFFFFF').setFontWeight('bold').setFontFamily('Arial').setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
    a.setRowHeight(20, 40);
    const linhas = d.relatos.map(r => [r.id, r.periodo, SincronizacaoDoRDAS.intervalo(r.entrada, r.saida), r.local, r.equipe, r.atividadeCompleta, SincronizacaoDoRDAS.exibir(r.publico),
      r.participantes, SincronizacaoDoRDAS.exibir(r.clima), SincronizacaoDoRDAS.exibir(r.classificacao), r.fotos.length, r.status]);
    if (linhas.length) {
      a.getRange(21, 1, linhas.length, 12).setValues(linhas).setFontFamily('Arial').setFontSize(9).setWrap(true).setVerticalAlignment('top').setBorder(true, true, true, true, true, true, '#B8C4CE', SpreadsheetApp.BorderStyle.SOLID);
      a.getRange(21, 1, linhas.length, 12).setBackgrounds(linhas.map((_, i) => new Array(12).fill(i % 2 ? '#F3F7FA' : '#FFFFFF')));
      a.getRange(21, 1, linhas.length, 3).setHorizontalAlignment('center'); a.getRange(21, 8, linhas.length, 1).setNumberFormat('0').setHorizontalAlignment('center');
      a.getRange(21, 11, linhas.length, 2).setHorizontalAlignment('center'); a.setRowHeights(21, linhas.length, 78);
    }
    return 22 + linhas.length;
  }
  /** O ID da tabela vira link para a linha da ficha (link interno; os painéis continuam lendo o texto do ID). */
  ligarIds(inicios) {
    const gid = this.aba.getSheetId(), estilo = SpreadsheetApp.newTextStyle().setBold(true).setForegroundColor('#1E5A8A').setUnderline(true).build();
    const rich = this.dia.relatos.map((r, i) => [SpreadsheetApp.newRichTextValue().setText(r.id).setLinkUrl('#gid=' + gid + '&range=A' + inicios[i]).setTextStyle(estilo).build()]);
    if (rich.length) this.aba.getRange(21, 1, rich.length, 1).setRichTextValues(rich);
  }
  ficha(r, n, total, linha) {
    const a = this.aba, L = k => linha + k, inicio = linha;
    this.titulo(a.getRange(linha, 1, 1, 12).merge().setValue('FICHA ' + n + ' DE ' + total + ' | ' + r.id + ' | ' + r.atividadeCompleta), '#2F6EB3'); a.setRowHeight(linha, 34);
    this.par('A' + L(1) + ':B' + L(1), 'C' + L(1) + ':D' + L(1), 'Data', r.data);
    this.par('E' + L(1) + ':F' + L(1), 'G' + L(1) + ':H' + L(1), 'Horário / duração', SincronizacaoDoRDAS.intervalo(r.entrada, r.saida) + ' | ' + r.duracao);
    this.par('I' + L(1) + ':J' + L(1), 'K' + L(1) + ':L' + L(1), 'Status', r.status); a.getRange('C' + L(1) + ':D' + L(1)).setNumberFormat('dd/MM/yyyy');
    this.par('A' + L(2) + ':B' + L(2), 'C' + L(2) + ':H' + L(2), 'Atividade', r.atividadeCompleta); this.par('I' + L(2) + ':J' + L(2), 'K' + L(2) + ':L' + L(2), 'Classificação', r.classificacao);
    this.par('A' + L(3) + ':B' + L(3), 'C' + L(3) + ':H' + L(3), 'Frente / endereço', r.local); this.par('I' + L(3) + ':J' + L(3), 'K' + L(3) + ':L' + L(3), 'Bairro', r.bairro);
    this.par('A' + L(4) + ':B' + L(4), 'C' + L(4) + ':H' + L(4), 'Equipe responsável', r.equipe); this.par('I' + L(4) + ':J' + L(4), 'K' + L(4) + ':L' + L(4), 'Área', r.area);
    this.par('A' + L(5) + ':B' + L(5), 'C' + L(5) + ':F' + L(5), 'Público / participantes', SincronizacaoDoRDAS.exibir(r.publico) + ' | ' + r.participantes); this.par('G' + L(5) + ':H' + L(5), 'I' + L(5) + ':L' + L(5), 'Clima', r.clima);
    this.par('A' + L(6) + ':B' + L(6), 'C' + L(6) + ':F' + L(6), 'Deslocamento', r.deslocamento); this.par('G' + L(6) + ':H' + L(6), 'I' + L(6) + ':L' + L(6), 'Pessoas no veículo', r.pessoasVeiculo);
    this.par('A' + L(7) + ':B' + L(7), 'C' + L(7) + ':H' + L(7), 'Ferramentas / materiais', r.ferramentas); this.par('I' + L(7) + ':J' + L(7), 'K' + L(7) + ':L' + L(7), 'Panfletos', r.panfletos);
    this.titulo(a.getRange(L(9), 1, 1, 12).merge().setValue('OBJETIVO DA ATIVIDADE'), '#596AA0');
    this.caixa(a.getRange(L(10), 1, 3, 12).merge().setValue(SincronizacaoDoRDAS.exibir(r.objetivo)), '#F0F2F8', '#3F4C70'); a.setRowHeights(L(10), 3, 30);
    this.titulo(a.getRange(L(14), 1, 1, 12).merge().setValue('RELATO DA EXECUÇÃO'), '#304C6D');
    this.caixa(a.getRange(L(15), 1, 7, 12).merge().setValue(SincronizacaoDoRDAS.exibir(r.relato)), '#F5F8FB', '#233247'); a.setRowHeights(L(15), 7, 30);
    this.titulo(a.getRange(L(23), 1, 1, 12).merge().setValue('OBSERVAÇÕES E RESULTADOS COMPLEMENTARES'), '#B06B2D');
    this.caixa(a.getRange(L(24), 1, 4, 12).merge().setValue(r.observacaoCompleta), '#FFF8EE', '#6E4B27');
    a.setRowHeights(L(24), 4, Math.max(30, Math.ceil(String(r.observacaoCompleta).split('\n').reduce((s, t) => s + Math.max(1, Math.ceil(t.length / 135)), 0) * 15 / 4) + 4));
    linha += 29;
    this.titulo(a.getRange(linha, 1, 1, 12).merge().setValue('REGISTRO FOTOGRÁFICO AUTOMÁTICO'), '#111111'); linha += 1;
    if (!r.fotos.length) {
      a.getRange(linha, 1, 3, 12).merge().setValue('Nenhuma foto foi enviada neste relato pelo formulário.').setBackground('#F4F7F9').setFontColor('#78909C').setFontFamily('Arial').setFontSize(10)
        .setFontStyle('italic').setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true, true, true, true, false, false, '#AFC6D8', SpreadsheetApp.BorderStyle.SOLID);
      a.setRowHeights(linha, 3, 28); linha += 4;
    } else {
      // Orientação curta, numa linha própria (a estrutura acima continua igual para os painéis).
      a.getRange(linha, 1, 1, 12).merge().setValue(r.fotos.length + (r.fotos.length === 1 ? ' foto' : ' fotos') + ' deste relato  ·  clique na legenda para abrir o original em tamanho real')
        .setFontFamily('Arial').setFontSize(8).setFontColor('#5B7083').setHorizontalAlignment('center').setVerticalAlignment('middle').setBackground('#FFFFFF');
      a.setRowHeight(linha, 20); linha += 1;
      for (let i = 0; i < r.fotos.length; i += 2) {
        const segunda = r.fotos[i + 1];
        if (segunda) { this.foto(r, r.fotos[i], i + 1, linha, 1); this.foto(r, segunda, i + 2, linha, 7); }
        else this.foto(r, r.fotos[i], i + 1, linha, 4);
        linha += this.C.FOTO_LINHAS + 3;
      }
    }
    a.getRange(linha, 1, 2, 12).merge().setValue('').setBackground('#E9EEF3'); linha += 2;
    a.getRange(inicio, 1, linha - inicio, 12).setFontFamily('Arial');
    return linha;
  }
  /** Moldura da foto: área branca mais alta (fotos maiores) e legenda curta com link para o original. */
  foto(r, url, numero, linha, coluna) {
    const a = this.aba, F = this.C.FOTO_LINHAS; this.garantir(linha + F + 3, 12);
    a.setRowHeights(linha, F, this.C.FOTO_ALTURA); a.setRowHeight(linha + F, 30); a.setRowHeight(linha + F + 1, 6); a.setRowHeight(linha + F + 2, 12);
    const area = a.getRange(linha, coluna, F, 6).merge().setValue('');
    area.setBackground('#FFFFFF').setFontColor('#78909C').setFontFamily('Arial').setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true)
      .setBorder(true, true, true, true, false, false, '#C9D7E3', SpreadsheetApp.BorderStyle.SOLID);
    let leitura = null;
    try { leitura = FotosDoRDAS.ler(url); FotosDoRDAS.inserir(a, leitura.blob, linha, coluna, F, 6, leitura.tipoMidia === 'Vídeo' ? 'Prévia de vídeo de campo' : 'Registro fotográfico de campo', url); }
    catch (e) {
      console.log(JSON.stringify({contexto: 'Foto RDAS', url, erro: e.message}));
      area.setValue('Prévia indisponível nesta atualização.\nO original está no link da legenda.').setFontColor('#9A5A18').setBackground('#FFF8EE').setNote('Diagnóstico da imagem: ' + e.message);
    }
    const tipo = leitura && leitura.tipoMidia === 'Vídeo' ? 'Prévia de vídeo' : 'Foto';
    const texto = tipo + ' ' + numero + ' de ' + r.fotos.length + ' | ' + r.chaveData.split('-').reverse().join('/') + ' | ' + r.id + '  ·  abrir original ↗';
    const leg = a.getRange(linha + F, coluna, 1, 6).merge();
    leg.setBackground('#F5F8FB').setFontColor('#1E5A8A').setFontFamily('Arial').setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true)
      .setBorder(true, true, true, true, false, false, '#C9D7E3', SpreadsheetApp.BorderStyle.SOLID);
    leg.getCell(1, 1).setRichTextValue(SpreadsheetApp.newRichTextValue().setText(texto).setLinkUrl(url).build());
    this.balanco.midias++; if (leitura) this.balanco.inseridas++; else this.balanco.falhas++;
  }
}

/** Leitura das fotos privadas do formulário e encaixe na grade (mesma lógica da 1.5: Fotos 1.2). Não altera compartilhamento. */
class FotosDoRDAS {
  static ref(valor) {
    const url = String(valor || '').trim().replace(/[),.;]+$/, '');
    if (!/^https:\/\/(?:drive|docs)\.google\.com\//i.test(url)) throw new Error('LINK: endereço de arquivo do Google Drive não reconhecido.');
    const m = url.match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{10,})/); if (!m) throw new Error('LINK: o endereço precisa identificar um arquivo, não uma pasta.');
    const k = url.match(/[?&]resourcekey=([^&#]+)/i); return {id: m[1], key: k ? decodeURIComponent(k[1]) : '', url};
  }
  static arquivo(ref) {
    let f; try { f = ref.key ? DriveApp.getFileByIdAndResourceKey(ref.id, ref.key) : DriveApp.getFileById(ref.id); } catch (e) { throw new Error('ACESSO: a conta executora não conseguiu ler o arquivo. ' + e.message); }
    for (let i = 0; f.getMimeType() === 'application/vnd.google-apps.shortcut'; i++) { if (i >= 3) throw new Error('ATALHO: destino não resolvido.'); const id = f.getTargetId(), key = f.getTargetResourceKey(); f = key ? DriveApp.getFileByIdAndResourceKey(id, key) : DriveApp.getFileById(id); }
    return f;
  }
  static dimensoes(bytes) {
    const n = bytes.length, u = i => (bytes[i] || 0) & 255, be = i => u(i) * 256 + u(i + 1), be32 = i => u(i) * 16777216 + u(i + 1) * 65536 + u(i + 2) * 256 + u(i + 3);
    if (n >= 24 && u(0) === 137 && u(1) === 80 && u(2) === 78 && u(3) === 71) return {largura: be32(16), altura: be32(20), mime: 'image/png'};
    if (n >= 10 && u(0) === 71 && u(1) === 73 && u(2) === 70) return {largura: u(6) + 256 * u(7), altura: u(8) + 256 * u(9), mime: 'image/gif'};
    if (n >= 4 && u(0) === 255 && u(1) === 216) {
      let i = 2;
      while (i + 3 < n) {
        if (u(i) !== 255) { i++; continue; } while (i < n && u(i) === 255) i++; const mk = u(i++);
        if (mk === 217 || mk === 218) break; if (mk === 0 || mk === 1 || (mk >= 208 && mk <= 215)) continue;
        const len = be(i); if (len < 2 || i + len > n) break;
        if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].indexOf(mk) >= 0 && len >= 7) return {altura: be(i + 3), largura: be(i + 5), mime: 'image/jpeg'};
        i += len;
      }
    }
    return null;
  }
  static validar(blob) {
    if (!blob) return {ok: false, motivo: 'Miniatura não disponível.'};
    const bytes = blob.getBytes(), dim = this.dimensoes(bytes);
    if (bytes.length > 2000000) return {ok: false, motivo: 'TAMANHO: ' + bytes.length + ' bytes excedem 2 MB.'};
    if (!dim || !dim.largura || !dim.altura) return {ok: false, motivo: 'FORMATO: cabeçalho JPEG, PNG ou GIF válido não localizado.'};
    if (dim.largura * dim.altura > 1000000) return {ok: false, motivo: 'PIXELS: ' + dim.largura + ' × ' + dim.altura + ' excedem 1 milhão de pixels.'};
    if (blob.getContentType() !== dim.mime) blob.setContentType(dim.mime);
    return {ok: true, blob, bytes: bytes.length, dim};
  }
  static miniaturaMenor(f, ref, erros) {
    const id = f.getId(), key = f.getResourceKey ? f.getResourceKey() : ref.key, headers = {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()};
    if (key) headers['X-Goog-Drive-Resource-Keys'] = id + '/' + key;
    const receber = url => { const r = UrlFetchApp.fetch(url, {headers, muteHttpExceptions: true, followRedirects: true}); if (r.getResponseCode() !== 200) throw new Error('HTTP ' + r.getResponseCode()); const c = this.validar(r.getBlob()); if (!c.ok) throw new Error(c.motivo); return c; };
    try {
      const meta = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '?fields=thumbnailLink&supportsAllDrives=true', {headers, muteHttpExceptions: true});
      if (meta.getResponseCode() !== 200) throw new Error('Metadados HTTP ' + meta.getResponseCode());
      const link = JSON.parse(meta.getContentText()).thumbnailLink;
      if (!/^https:\/\/(?:[a-z0-9-]+\.)*googleusercontent\.com\//i.test(String(link || ''))) throw new Error('Link de miniatura não disponível.');
      return receber(link.replace(/=s\d+(?:-[A-Za-z0-9]+)*(?=$|[?&])/, '=s900'));
    } catch (e) { erros.push('Miniatura autenticada: ' + e.message); }
    for (const w of [900, 600]) { try { return receber('https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + w + (key ? '&resourcekey=' + encodeURIComponent(key) : '')); } catch (e) { erros.push('Prévia ' + w + ': ' + e.message); } }
    return null;
  }
  static ler(url) {
    const ref = this.ref(url), f = this.arquivo(ref), mime = f.getMimeType(), size = f.getSize(), erros = []; let ok = null;
    const avaliar = (blob, nome) => { const r = this.validar(blob); if (r.ok) { ok = r; return true; } erros.push(nome + ': ' + r.motivo); return false; };
    if (/^image\/(png|jpeg|jpg|gif)$/i.test(mime) && size <= 2000000) { try { avaliar(f.getBlob(), 'Imagem original'); } catch (e) { erros.push('Original: ' + e.message); } }
    if (!ok) { try { avaliar(f.getThumbnail(), 'Miniatura do Drive'); } catch (e) { erros.push('Miniatura: ' + e.message); } }
    if (!ok) { try { ok = this.miniaturaMenor(f, ref, erros); } catch (e) { erros.push('Miniatura reduzida: ' + e.message); } }
    if (!ok) throw new Error('IMAGEM: nenhuma prévia compatível com 2 MB e 1 milhão de pixels. Original: ' + mime + ', ' + size + ' bytes. ' + erros.join(' | '));
    return {blob: ok.blob, tipoMidia: /^video\//.test(mime) ? 'Vídeo' : /^image\//.test(mime) ? 'Foto' : 'Arquivo', largura: ok.dim.largura, altura: ok.dim.altura};
  }
  /** Encaixa a imagem centralizada na área (margem 6 px: a foto ocupa quase toda a moldura). */
  static inserir(s, blob, linha, coluna, linhas, colunas, titulo, descricao) {
    let w = 0, h = 0, img = null; for (let c = coluna; c < coluna + colunas; c++) w += s.getColumnWidth(c); for (let r = linha; r < linha + linhas; r++) h += s.getRowHeight(r);
    try {
      img = s.insertImage(blob, coluna, linha);
      const pad = 6, k = Math.min(1, (w - 2 * pad) / img.getWidth(), (h - 2 * pad) / img.getHeight()), iw = Math.max(1, Math.floor(img.getWidth() * k)), ih = Math.max(1, Math.floor(img.getHeight() * k));
      let x = Math.max(pad, Math.floor((w - iw) / 2)), y = Math.max(pad, Math.floor((h - ih) / 2)), col = coluna, row = linha;
      while (col < coluna + colunas - 1 && x >= s.getColumnWidth(col)) { x -= s.getColumnWidth(col); col++; }
      while (row < linha + linhas - 1 && y >= s.getRowHeight(row)) { y -= s.getRowHeight(row); row++; }
      img.setWidth(iw).setHeight(ih).setAnchorCell(s.getRange(row, col)).setAnchorCellXOffset(x).setAnchorCellYOffset(y).setAltTextTitle(titulo).setAltTextDescription(descricao || '');
    } catch (e) { if (img) { try { img.remove(); } catch (_) {} } throw e; }
  }
}

// ---------------- Funções para o editor e menus ----------------
/** Refaz um dia: atualizarDiaRDASCampo40('2026-10-05'). */
function atualizarDiaRDASCampo40(dia) { return SincronizacaoDoRDAS.atualizarDia(String(dia || '')); }
/** Refaz os três dias mais recentes que têm relato do Campo 4.0. */
function atualizarRDASRecentesCampo40() {
  const dias = [...new Set(SincronizacaoDoRDAS.relatos40(null).map(r => r.chaveData))].sort().reverse().slice(0, 3);
  dias.forEach(d => SincronizacaoDoRDAS.marcarPendente(d)); return SincronizacaoDoRDAS.processarPendentes();
}
function processarRDASPendentesCampo40() { return SincronizacaoDoRDAS.processarPendentes(); }
/** Só leitura: quantos relatos do Campo 4.0 existem por dia, o que está pendente e o corte com o 3.0. */
function conferirRDASCampo40() {
  const porDia = {}; SincronizacaoDoRDAS.relatos40(null).forEach(r => { porDia[r.chaveData] = (porDia[r.chaveData] || 0) + 1; });
  let rdas = 'disponível'; try { SpreadsheetApp.openById(SincronizacaoDoRDAS.C.RDAS_ID).getName(); } catch (e) { rdas = 'INDISPONÍVEL: ' + e.message; }
  const r = {versao: '1.6.0', planilhaRDAS: rdas, soCampo40APartirDe: SincronizacaoDoRDAS.soCampo40(), relatosCampo40PorDia: porDia,
    pendentes: JSON.parse(PropertiesService.getScriptProperties().getProperty(SincronizacaoDoRDAS.C.PENDENTES) || '[]'), somenteLeitura: true};
  console.log(JSON.stringify(r, null, 2)); return r;
}

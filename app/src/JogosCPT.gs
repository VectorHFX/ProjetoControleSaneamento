/**
 * JogosCPT 2.21.0. Joguinhos do Meu espaço, desbloqueados por metas:
 * - Forca do saneamento: libera com 5 dias de checklist pontuado. Palavras do nosso trabalho, com dica. Até 6 erros.
 * - Quebra-cabeça: libera com 15 dias de checklist (2.29: o Álbum saiu). A foto do seu quadro (ou o seu mascote), 3×3, trocando peças.
 * Limite: 3 partidas por dia de cada jogo. A primeira vitória do dia em cada jogo vale 5 pontos (somados em PessoalCPT.pontos).
 * O servidor confere o resultado: refaz as letras da forca e as trocas do quebra-cabeça (não basta dizer "ganhei").
 * Partida começada e não terminada continua (abrir de novo não gasta outra). Coleção "Jogos" (JOG-email-dia-jogo-n).
 * Período de testes: só o proprietário (PessoalCPT.novo).
 * 2.51: "O caminho do esgoto", com o mascote, liberado desde o começo (em teste com a equipe):
 *   1. Casa: 8 itens, vai ou não vai pelo ralo (com o porquê); 2. Rua: girar os canos da ligação até o interceptor;
 *   3. Estação: as etapas do lodo ativado em ordem; depois, o rio. O servidor refaz as respostas, os giros e as escolhas.
 *   No fim, opinião opcional (diversão, aprendeu, o que mudaria), guardada na partida; o proprietário vê o resumo sem nomes.
 */
class JogosCPT {
  static get partidasPorDia() { return 3; }
  static get pontosVitoria() { return 5; }
  static get erros() { return 6; }
  static get metas() { return {forca: 5, quebra: 15, caminho: 0}; }
  static get jogos() { return ['caminho', 'forca', 'quebra']; }
  static pode(perfil) { return PessoalCPT.novo(perfil); }
  /** [palavra, dica] */
  static get palavras() {
    return [['ESGOTO', 'Água usada nas casas que vai pela rede até a estação de tratamento.'], ['CAPTAÇÃO', 'Primeira etapa do abastecimento: tirar água do rio ou da represa.'],
      ['ADUTORA', 'Tubulação grande que leva a água da captação até a estação ou os reservatórios.'], ['RESERVATÓRIO', 'Guarda a água tratada antes de ela chegar às casas.'],
      ['HIDRÔMETRO', 'Aparelho que mede quanta água a casa consumiu.'], ['SANEAMENTO', 'Água, esgoto, resíduos e drenagem: o nosso trabalho.'],
      ['MANANCIAL', 'Fonte de água usada para abastecimento, como uma represa.'], ['TAMANDUATEÍ', 'Rio que nasce em Mauá e atravessa Santo André.'],
      ['BILLINGS', 'Represa que recebe o Rio Grande, de Paranapiacaba.'], ['DECANTAÇÃO', 'Etapa em que os flocos de sujeira vão para o fundo do tanque.'],
      ['FLOCULAÇÃO', 'Mistura lenta que junta a sujeira em flocos.'], ['FILTRAÇÃO', 'A água passa por pedras, areia e carvão.'],
      ['DESINFECÇÃO', 'Etapa com cloro que elimina micro-organismos.'], ['FLUORETAÇÃO', 'Colocar flúor na água para proteger os dentes.'],
      ['GRADEAMENTO', 'Primeira etapa da estação de esgoto: segura objetos grandes.'], ['COLETOR TRONCO', 'Tubulação grande que recebe o esgoto de várias redes.'],
      ['INTERCEPTOR', 'Tubulação que corre ao longo do rio e leva o esgoto até a estação.'], ['LIGAÇÃO DE ESGOTO', 'Liga o encanamento da casa à rede pública.'],
      ['CAIXA DE GORDURA', 'Segura a gordura da pia antes de ir para a rede.'], ['RECICLAGEM', 'Transformar o material usado em matéria-prima de novo.'],
      ['COMPOSTAGEM', 'Transforma restos de comida e folhas em adubo.'], ['ECOPONTO', 'Local para levar entulho, móveis velhos e recicláveis.'],
      ['ATERRO SANITÁRIO', 'Destino final adequado do rejeito, com proteção do solo.'], ['COLETA SELETIVA', 'Separar papel, plástico, vidro e metal para reciclar.'],
      ['ÓLEO DE COZINHA', 'Não vai na pia: guarde numa garrafa e leve a um ponto de coleta.'], ['CAPACETE', 'EPI que protege a cabeça na obra.'],
      ['COLETE REFLETIVO', 'EPI para ser visto de longe, de dia e de noite.'], ['BOTINA', 'Calçado de segurança da obra.'],
      ['PARANAPIACABA', 'Vila de Santo André na serra, perto das nascentes do Rio Grande.'], ['NASCENTE', 'Lugar onde um rio começa.'],
      ['ENCHENTE', 'Quando a água da chuva sobe e invade ruas e casas.'], ['BUEIRO', 'Boca na rua que leva a água da chuva para a galeria.'],
      ['LODO ATIVADO', 'Tratamento de esgoto com micro-organismos e oxigênio.'], ['ESTAÇÃO DE TRATAMENTO', 'Onde a água ou o esgoto são tratados.'],
      ['CISTERNA', 'Reservatório que guarda água da chuva para reúso.'], ['TORNEIRA', 'Pingando, desperdiça cerca de 46 litros por dia.'],
      ['MORADORES', 'As pessoas que atendemos nos bairros.'], ['ATENDIMENTO', 'Ouvir, registrar e dar retorno às pessoas.'],
      ['EDUCAÇÃO AMBIENTAL', 'Oficinas e conversas sobre cuidar da água e do lixo.'], ['DRENAGEM', 'Escoamento da água da chuva pelas ruas e galerias.']];
  }
  static norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); }
  static de(ctx) { return ctx.jogosCPT || (ctx.jogosCPT = new JogosCPT(ctx)); }
  static pontos(ctx) { if (!JogosCPT.pode(ctx.perfil)) return 0; return JogosCPT.de(ctx).minhas().reduce((s, x) => s + (Number(x.pontos) || 0), 0); }
  constructor(ctx) { this.ctx = ctx; this.email = ctx.email; this.hoje = ColecaoCPT.hoje(); this.col = ColecaoCPT.de(ctx, 'Jogos', 'JOG'); }
  minhas() { const p = 'JOG-' + this.email + '-'; return this.col.itens().filter(x => x.id.startsWith(p)); }
  deHoje(jogo) { return this.minhas().filter(x => x.dia === this.hoje && x.jogo === jogo).sort((a, b) => a.n - b.n); }
  /** Metas: dias de checklist com tarefa pontuada (até hoje), para os dois jogos. */
  progresso() {
    if (this._prog) return this._prog;
    const pre = 'CHK-' + this.email + '-';
    const dias = ColecaoCPT.de(this.ctx, 'Checklist', 'CHK').itens().filter(l => l.id.startsWith(pre) && l.id.slice(-10) <= this.hoje && (l.itens || []).some(t => t.pontuado)).length;
    return (this._prog = {forca: dias, quebra: dias, caminho: dias});
  }
  estado() {
    const p = this.progresso(), um = jogo => { const h = this.deHoje(jogo), aberta = h.find(x => x.situacao === 'jogando');
      return {liberado: p[jogo] >= JogosCPT.metas[jogo], tem: p[jogo], precisa: JogosCPT.metas[jogo], partidasHoje: h.length, limite: JogosCPT.partidasPorDia,
        vitoriasHoje: h.filter(x => x.situacao === 'venceu').length, ganhouPontosHoje: h.some(x => x.pontos > 0), aberta: !!aberta}; };
    return {caminho: {...um('caminho'), teste: !!(this.ctx.perfil && (this.ctx.perfil.papeis || []).includes('administrador'))}, forca: um('forca'), quebra: um('quebra'), regras: {pontos: JogosCPT.pontosVitoria, erros: JogosCPT.erros}};
  }
  /** Começa (ou continua) uma partida. A forca recebe a palavra em código (a tela precisa dela para jogar sem esperar o servidor a cada letra; quem conferir os pontos é o servidor). */
  iniciar(p) {
    p = p || {}; PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Os joguinhos'); if (!JogosCPT.pode(this.ctx.perfil)) throw new Error('Os joguinhos ainda não estão disponíveis.');
    const jogo = ColecaoCPT.opcao(p.jogo, JogosCPT.jogos, 'jogo'), e = this.estado()[jogo];
    if (!e.liberado) throw new Error(jogo === 'forca' ? 'A forca libera com ' + e.precisa + ' dias de checklist (você tem ' + e.tem + ').' : 'O quebra-cabeça libera com ' + e.precisa + ' dias de checklist (você tem ' + e.tem + ').');
    let x = this.deHoje(jogo).find(y => y.situacao === 'jogando');
    if (!x) {
      const ja = this.col.porOperacao(p.operacaoId);
      if (ja) x = ja;
      else {
        if (e.partidasHoje >= JogosCPT.partidasPorDia) throw new Error('Você já jogou ' + JogosCPT.partidasPorDia + ' partidas hoje. Amanhã tem mais!');
        const n = e.partidasHoje + 1, semente = ConteudoSaneamentoCPT.hash(this.email + ':' + this.hoje + ':' + jogo + ':' + n);
        const novo = {jogo, dia: this.hoje, n, situacao: 'jogando', pontos: 0};
        if (jogo === 'forca') novo.palavra = this.escolherPalavra(semente);
        else if (jogo === 'caminho') Object.assign(novo, JogosCPT.montarCaminho(semente));
        else { novo.ordem = JogosCPT.embaralhar(semente); novo.foto = this.escolherFoto(semente); }
        x = this.col.gravar(novo, 0, p.operacaoId, 'JOG-' + this.email + '-' + this.hoje + '-' + jogo + '-' + n);
      }
    }
    return {partida: this.paraTela(x), estado: this.estado()};
  }
  /** Palavra que a pessoa ainda não jogou (recentes primeiro evitadas). */
  escolherPalavra(semente) {
    const usadas = new Set(this.minhas().filter(x => x.jogo === 'forca').map(x => x.palavra)), todas = JogosCPT.palavras.map(x => x[0]);
    const livres = todas.filter(w => !usadas.has(w)), lista = livres.length ? livres : todas;
    return lista[semente % lista.length];
  }
  /** A foto do quadro da pessoa (escolhida no Meu espaço); sem foto, o quebra-cabeça usa o mascote. */
  escolherFoto() {
    const q = (new PessoalCPT(this.ctx).perfil() || {}).quadro;
    return q && q.tipo === 'foto' && q.fileId ? {fileId: q.fileId, legenda: q.legenda || ''} : null;
  }
  /** Ordem inicial 3×3 (nunca já resolvida), a partir da semente. */
  static embaralhar(semente) {
    const o = [0, 1, 2, 3, 4, 5, 6, 7, 8]; let s = semente || 1;
    for (let i = o.length - 1; i > 0; i--) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; const j = s % (i + 1); [o[i], o[j]] = [o[j], o[i]]; }
    if (o.every((v, i) => v === i)) [o[0], o[1]] = [o[1], o[0]];
    return o;
  }
  paraTela(x) {
    const base = {id: x.id, jogo: x.jogo, situacao: x.situacao, n: x.n, versao: x.versao};
    if (x.jogo === 'caminho') return {...base, ...JogosCPT.telaCaminho(x)};
    if (x.jogo === 'forca') { const dica = (JogosCPT.palavras.find(w => w[0] === x.palavra) || [])[1] || ''; return {...base, dica, codigo: x.palavra.split('').reverse().map(c => c.charCodeAt(0) + 7), erros: JogosCPT.erros}; }
    return {...base, ordem: x.ordem, foto: x.foto ? {...x.foto, imagem: GaleriaCPT.miniatura(x.foto.fileId)} : null};
  }
  /** Termina a partida: o servidor refaz a jogada e decide se venceu. */
  terminar(p) {
    p = p || {}; PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Os joguinhos');
    const x = this.col.obter(String(p.partida || '')); if (!x || !x.id.startsWith('JOG-' + this.email + '-')) throw new Error('Partida não encontrada.');
    const ja = this.col.porOperacao(p.operacaoId); if (ja) return this.depois(ja);
    if (x.situacao !== 'jogando') throw new Error('Essa partida já terminou.');
    let venceu, resultado = null;
    if (x.jogo === 'caminho') { resultado = JogosCPT.avaliarCaminho(x, p); venceu = resultado.rede.chegou && resultado.estacao.completa; }
    else if (x.jogo === 'forca') {
      if (!Array.isArray(p.letras) || p.letras.length > 26) throw new Error('Jogada inválida.');
      const alvo = new Set(JogosCPT.norm(x.palavra).replace(/[^A-Z]/g, '').split('')), vistas = new Set(); let erros = 0; venceu = false;
      for (const l of p.letras) {
        const L = JogosCPT.norm(l); if (!/^[A-Z]$/.test(L) || vistas.has(L)) throw new Error('Jogada inválida.');
        vistas.add(L); if (!alvo.has(L)) erros++;
        if (erros >= JogosCPT.erros) break;
        if ([...alvo].every(a => vistas.has(a))) { venceu = true; break; }
      }
    } else {
      if (!Array.isArray(p.trocas) || p.trocas.length > 300) throw new Error('Jogada inválida.');
      const o = x.ordem.slice();
      p.trocas.forEach(t => { if (!Array.isArray(t) || t.length !== 2 || !t.every(i => Number.isInteger(i) && i >= 0 && i < 9)) throw new Error('Jogada inválida.'); [o[t[0]], o[t[1]]] = [o[t[1]], o[t[0]]]; });
      venceu = o.every((v, i) => v === i);
    }
    const jaGanhou = this.deHoje(x.jogo).some(y => y.pontos > 0), pontos = venceu && !jaGanhou ? JogosCPT.pontosVitoria : 0;
    const jogadas = x.jogo === 'caminho' ? p.casa.length + p.rede.length + p.estacao.length : x.jogo === 'forca' ? p.letras.length : p.trocas.length;
    const e = this.col.gravar({...x, situacao: venceu ? 'venceu' : 'perdeu', pontos, jogadas, ...(resultado ? {resultado} : {})}, x.versao, p.operacaoId, x.id);
    return this.depois(e);
  }
  depois(e) {
    const pe = new PessoalCPT(this.ctx);
    const fim = e.jogo === 'caminho' ? (e.situacao === 'venceu' ? 'O esgoto chegou tratado ao rio!' + (e.pontos ? ' +' + e.pontos + ' pontos' : '') : 'Partida encerrada.')
      : e.situacao === 'venceu' ? (e.pontos ? 'Venceu! +' + e.pontos + ' pontos' : 'Venceu!') : e.jogo === 'forca' ? 'Não foi dessa vez: a palavra era ' + e.palavra + '.' : 'Partida encerrada.';
    return {resultado: fim, situacao: e.situacao, pontosGanhos: e.pontos, palavra: e.jogo === 'forca' ? e.palavra : undefined, caminho: e.jogo === 'caminho' ? e.resultado : undefined,
      estado: this.estado(), pontos: pe.pontos(pe.perfil())};
  }

  // ---------- O caminho do esgoto (2.51) ----------
  /** Fase 1 · Na casa: [id, nome, vai pelo ralo?, por quê]. Do banco conferido (óleo C11, remédio C26, chuva C38, caixa de gordura C45) e da prática da equipe (Q095). */
  static get casa() {
    return [['banho', 'Água do banho', true, 'É esgoto da casa: segue pela rede até a estação de tratamento.'],
      ['louca', 'Água de lavar a louça', true, 'Pode ir, sem os restos de comida. A caixa de gordura segura a gordura antes da rede.'],
      ['maquina', 'Água da máquina de lavar', true, 'É esgoto da casa e vai pela rede até o tratamento.'],
      ['descarga', 'Descarga do vaso', true, 'É para isso que existe a rede de esgoto.'],
      ['oleo', 'Óleo de cozinha usado', false, 'Espere esfriar, guarde numa garrafa PET fechada e leve a um ponto de coleta. Na rede, ele gruda, entope e faz o esgoto voltar.'],
      ['fio', 'Fio dental', false, 'Vai no lixo: no esgoto, ele enrosca e forma bolos que entopem a rede.'],
      ['cotonete', 'Cotonete', false, 'Vai no lixo: no esgoto, ajuda a formar os bolos que entopem a rede.'],
      ['lenco', 'Lenço umedecido', false, 'Mesmo vendido como "descartável", vai no lixo: não se desfaz no esgoto e entope a rede.'],
      ['remedio', 'Remédio vencido', false, 'Leve a um ponto de coleta habilitado, como uma farmácia participante. No esgoto, ele contamina a água.'],
      ['restos', 'Restos de comida', false, 'Vão para o lixo orgânico ou para a compostagem: na pia, entopem o cano e a rede.'],
      ['cabelo', 'Cabelo do ralo', false, 'Vai no lixo: no cano, junta com a gordura e entope.'],
      ['bituca', 'Bituca de cigarro', false, 'Vai no lixo: tem substâncias tóxicas e não se desfaz na água.'],
      ['calha', 'Água da chuva da calha', false, 'Chuva vai para a galeria, não para o esgoto: calha ligada na rede faz o esgoto transbordar quando chove.']];
  }
  /** Fase 3 · Na estação (lodo ativado), na ordem certa: [id, nome, o que acontece]. Gradeamento (C13) e lodo ativado (C12) do banco conferido. */
  static get etapas() {
    return [['grade', 'Gradeamento', 'Grades seguram plásticos, panos e outros objetos que chegaram pela rede.'],
      ['areia', 'Caixa de areia', 'O esgoto anda devagar e a areia, que é pesada, vai para o fundo.'],
      ['decantador', 'Decantador primário', 'Num tanque calmo, a sujeira mais pesada assenta e vira lodo.'],
      ['aeracao', 'Tanque de aeração', 'Micro-organismos que precisam de oxigênio consomem a matéria orgânica do esgoto: é o lodo ativado.'],
      ['secundario', 'Decantador secundário', 'O lodo com os micro-organismos assenta e o esgoto tratado segue para o rio.']];
  }
  /** Fase 2 · Na rua: trajetos numa grade 5×4, da casa (entra pela esquerda da casa 0,0) até o interceptor (sai pela direita da casa 3,4). */
  static get trajetos() {
    return [[[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [3, 3], [3, 4]],
      [[0, 0], [1, 0], [1, 1], [1, 2], [1, 3], [2, 3], [3, 3], [3, 4]],
      [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2], [3, 3], [3, 4]]];
  }
  /** O cano engrossa pelo caminho: cada trecho recebe o esgoto de mais casas. */
  static get trechos() { return ['ligacao', 'rede', 'rede', 'coletor', 'coletor', 'coletor', 'interceptor', 'interceptor']; }
  /** Lados ligados de uma peça (0 cima, 1 direita, 2 baixo, 3 esquerda). Reta: lados opostos; curva: lados vizinhos. */
  static lados(tipo, giro) { return tipo === 'reta' ? [giro % 4, (giro + 2) % 4] : [giro % 4, (giro + 1) % 4]; }
  /** Peças do trajeto: tipo e o giro certo de cada uma. */
  static pecas(t) {
    const tr = JogosCPT.trajetos[t], dir = (a, b) => b[0] < a[0] ? 0 : b[1] > a[1] ? 1 : b[0] > a[0] ? 2 : 3;
    return tr.map((cel, i) => {
      const entra = i === 0 ? 3 : (dir(tr[i - 1], cel) + 2) % 4, sai = i === tr.length - 1 ? 1 : dir(cel, tr[i + 1]);
      if ((entra + 2) % 4 === sai) return {cel, tipo: 'reta', certo: entra % 2 === 0 ? 0 : 1};
      return {cel, tipo: 'curva', certo: [0, 1, 2, 3].find(k => JogosCPT.lados('curva', k).includes(entra) && JogosCPT.lados('curva', k).includes(sai))};
    });
  }
  /** A água entra pela esquerda da primeira peça e corre enquanto as peças se encaixam; chegou = saiu pela direita da última. */
  static correr(t, giros) {
    const P = JogosCPT.pecas(t), em = new Map(P.map((q, i) => [q.cel.join(','), i])), D = [[-1, 0], [0, 1], [1, 0], [0, -1]], fim = P[P.length - 1].cel;
    let cel = P[0].cel, entra = 3; const molhadas = [];
    for (let passo = 0; passo < 40; passo++) {
      const i = em.get(cel.join(',')); if (i == null) break;
      const l = JogosCPT.lados(P[i].tipo, giros[i]); if (!l.includes(entra)) break;
      molhadas.push(i); const sai = l[0] === entra ? l[1] : l[0];
      if (cel[0] === fim[0] && cel[1] === fim[1] && sai === 1) return {molhadas, chegou: true};
      cel = [cel[0] + D[sai][0], cel[1] + D[sai][1]]; entra = (sai + 2) % 4;
    }
    return {molhadas, chegou: false};
  }
  /** Menor número de toques (cada toque gira 90°); a reta fica igual depois de meia volta. */
  static minimo(t, giros) {
    return JogosCPT.pecas(t).reduce((s, q, i) => s + (q.tipo === 'reta' ? Math.min((q.certo - giros[i] + 4) % 4, (q.certo + 2 - giros[i] + 4) % 4) : (q.certo - giros[i] + 4) % 4), 0);
  }
  /** Partida nova a partir da semente: 3 itens que vão e 5 que não vão, um trajeto com pelo menos 5 peças fora do lugar e as etapas embaralhadas. */
  static montarCaminho(semente) {
    let s = (semente >>> 0) || 7; const rnd = n => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return (s >>> 8) % n; };
    const mistura = a => { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = rnd(i + 1); [o[i], o[j]] = [o[j], o[i]]; } return o; };
    const C = JogosCPT.casa, itens = mistura(mistura(C.filter(x => x[2]).map(x => x[0])).slice(0, 3).concat(mistura(C.filter(x => !x[2]).map(x => x[0])).slice(0, 5)));
    const trajeto = rnd(JogosCPT.trajetos.length), P = JogosCPT.pecas(trajeto), giros = P.map(() => rnd(4));
    const certa = i => P[i].tipo === 'reta' ? giros[i] % 2 === P[i].certo % 2 : giros[i] === P[i].certo;
    for (let i = 0; i < P.length && P.filter((_, k) => !certa(k)).length < 5; i++) if (certa(i)) giros[i] = (giros[i] + 1) % 4;
    const ordem = JogosCPT.etapas.map(x => x[0]); let etapas = mistura(ordem);
    if (etapas.every((v, i) => v === ordem[i])) etapas = [etapas[1], etapas[0]].concat(etapas.slice(2));
    return {itens, trajeto, giros, etapas};
  }
  /** O que a tela precisa para jogar (sem precisar do servidor a cada toque; quem decide o resultado é o servidor). */
  static telaCaminho(x) {
    const C = new Map(JogosCPT.casa.map(i => [i[0], i])), P = JogosCPT.pecas(x.trajeto);
    return {itens: x.itens.map(id => { const [, nome, vai, fato] = C.get(id); return {id, nome, vai, fato}; }),
      rede: {trajeto: P.map(q => q.cel), tipos: P.map(q => q.tipo), trechos: JogosCPT.trechos, giros: x.giros},
      etapas: JogosCPT.etapas.map(([id, nome, texto]) => ({id, nome, texto})), etapasMostrar: x.etapas};
  }
  /** Refaz a partida: respostas da casa (true = vai, false = não vai, null = o tempo acabou), toques nos canos e escolhas na estação. */
  static avaliarCaminho(x, p) {
    const C = new Map(JogosCPT.casa.map(i => [i[0], i])), it = x.itens, inval = () => { throw new Error('Jogada inválida.'); };
    if (!Array.isArray(p.casa) || p.casa.length !== it.length || p.casa.some(v => v !== true && v !== false && v !== null)) inval();
    if (!Array.isArray(p.rede) || p.rede.length > 300 || p.rede.some(i => !Number.isInteger(i) || i < 0 || i >= x.giros.length)) inval();
    const ordem = JogosCPT.etapas.map(e => e[0]);
    if (!Array.isArray(p.estacao) || p.estacao.length > 40 || p.estacao.some(v => !ordem.includes(v))) inval();
    const errados = it.filter((id, i) => p.casa[i] !== C.get(id)[2]), acertos = it.length - errados.length;
    const g = x.giros.slice(); p.rede.forEach(i => { g[i] = (g[i] + 1) % 4; });
    const chegou = JogosCPT.correr(x.trajeto, g).chegou, minimo = JogosCPT.minimo(x.trajeto, x.giros);
    let k = 0, erros = 0; const trocas = [];
    for (const v of p.estacao) { if (k >= ordem.length) break; if (v === ordem[k]) k++; else { erros++; trocas.push([ordem[k], v]); } }
    const estrelas = (otimo, bom) => otimo ? 3 : bom ? 2 : 1, completa = k === ordem.length;
    return {casa: {acertos, total: it.length, errados, estrelas: estrelas(acertos === it.length, acertos >= it.length - 2)},
      rede: {toques: p.rede.length, minimo, chegou, estrelas: chegou ? estrelas(p.rede.length <= minimo + 2, p.rede.length <= minimo + 8) : 0},
      estacao: {erros, trocas: trocas.slice(0, 10), completa, estrelas: completa ? estrelas(erros === 0, erros <= 2) : 0},
      segundos: Math.max(0, Math.min(3600, Math.round(Number(p.segundos) || 0)))};
  }
  /** Opinião de quem jogou (uma por partida terminada). Fica na própria partida; o resumo do proprietário não mostra nomes. */
  opinar(p) {
    p = p || {}; PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Os joguinhos');
    const x = this.col.obter(String(p.partida || ''));
    if (!x || !x.id.startsWith('JOG-' + this.email + '-') || x.jogo !== 'caminho') throw new Error('Partida não encontrada.');
    if (this.col.porOperacao(p.operacaoId)) return {resultado: 'Obrigado! Sua opinião vai sem o seu nome.'};
    if (x.situacao === 'jogando') throw new Error('Termine a partida antes de opinar.');
    if (x.opiniao) throw new Error('Você já opinou sobre esta partida. Obrigado!');
    const diversao = Number(p.diversao); if (!Number.isInteger(diversao) || diversao < 1 || diversao > 5) throw new Error('Escolha de 1 a 5 em "Quão divertido foi?".');
    const aprendeu = ColecaoCPT.opcao(p.aprendeu, ['sim', 'pouco', 'nao'], '"Aprendeu algo novo?"'), sugestao = ColecaoCPT.texto(String(p.sugestao || ''), 500, 'o que você mudaria', false);
    this.col.gravar({...x, opiniao: {diversao, aprendeu, sugestao, em: new Date().toISOString()}}, x.versao, p.operacaoId, x.id);
    return {resultado: 'Obrigado! Sua opinião vai sem o seu nome.'};
  }
  /** Resumo do teste para o proprietário: partidas terminadas de todo mundo, sem nomes nem e-mails. */
  resumoTeste() {
    PerfisCPT.admin(this.ctx.perfil);
    const todas = this.col.itens().filter(x => x.jogo === 'caminho' && x.situacao !== 'jogando' && x.resultado);
    const quem = x => (x.id.match(/^JOG-(.+)-\d{4}-\d{2}-\d{2}-caminho-\d+$/) || [])[1] || x.id, media = (l, f) => l.length ? Math.round(l.reduce((s, x) => s + f(x), 0) / l.length * 10) / 10 : null;
    const nomeItem = new Map(JogosCPT.casa.map(i => [i[0], i[1]])), nomeEtapa = new Map(JogosCPT.etapas.map(i => [i[0], i[1]]));
    const vezes = new Map(), erros = new Map(), trocas = new Map();
    todas.forEach(x => { x.itens.forEach(id => vezes.set(id, (vezes.get(id) || 0) + 1)); x.resultado.casa.errados.forEach(id => erros.set(id, (erros.get(id) || 0) + 1));
      x.resultado.estacao.trocas.forEach(([a, b]) => { const k = a + '>' + b; trocas.set(k, (trocas.get(k) || 0) + 1); }); });
    const ops = todas.filter(x => x.opiniao), seg = Math.round(media(todas, x => x.resultado.segundos) || 0), br = v => v == null ? '—' : String(v).replace('.', ',');
    return {partidas: todas.length, pessoas: new Set(todas.map(quem)).size, completas: todas.filter(x => x.situacao === 'venceu').length,
      tempo: Math.floor(seg / 60) + ':' + String(seg % 60).padStart(2, '0'),
      fases: [{nome: 'Casa', media: media(todas, x => x.resultado.casa.estrelas), nota: 'acertos médios: ' + br(media(todas, x => x.resultado.casa.acertos)) + ' de 8'},
        {nome: 'Rua', media: media(todas, x => x.resultado.rede.estrelas), nota: 'toques médios: ' + br(media(todas, x => x.resultado.rede.toques)) + ' (mínimo médio ' + br(media(todas, x => x.resultado.rede.minimo)) + ')'},
        {nome: 'Estação', media: media(todas, x => x.resultado.estacao.estrelas), nota: 'erros médios: ' + br(media(todas, x => x.resultado.estacao.erros))}],
      confusos: [...erros].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({nome: nomeItem.get(id) || id, erros: n, vezes: vezes.get(id) || n})),
      trocas: [...trocas].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => { const [a, b] = k.split('>'); return {esperada: nomeEtapa.get(a) || a, escolhida: nomeEtapa.get(b) || b, vezes: n}; }),
      opinioes: ops.length, diversao: media(ops, x => x.opiniao.diversao),
      aprendeu: {sim: ops.filter(x => x.opiniao.aprendeu === 'sim').length, pouco: ops.filter(x => x.opiniao.aprendeu === 'pouco').length, nao: ops.filter(x => x.opiniao.aprendeu === 'nao').length},
      comentarios: ops.filter(x => x.opiniao.sugestao).sort((a, b) => b.opiniao.em.localeCompare(a.opiniao.em)).slice(0, 30).map(x => ({texto: x.opiniao.sugestao, diversao: x.opiniao.diversao, dia: x.opiniao.em.slice(0, 10)}))};
  }
}

function iniciarJogoCPT(p) { return ColecaoCPT.executar('jogos.iniciar', ctx => JogosCPT.de(ctx).iniciar(p), true); }
function terminarJogoCPT(p) { return ColecaoCPT.executar('jogos.terminar', ctx => JogosCPT.de(ctx).terminar(p), true); }
function opinarJogoCPT(p) { return ColecaoCPT.executar('jogos.opinar', ctx => JogosCPT.de(ctx).opinar(p), true); }
function resumoTesteJogoCPT() { return ColecaoCPT.executar('jogos.teste', ctx => JogosCPT.de(ctx).resumoTeste()); }

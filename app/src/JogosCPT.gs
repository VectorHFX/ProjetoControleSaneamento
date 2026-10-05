/**
 * JogosCPT 2.21.0. Joguinhos do Meu espaço, desbloqueados por metas:
 * - Forca do saneamento: libera com 5 dias de checklist pontuado. Palavras do nosso trabalho, com dica. Até 6 erros.
 * - Quebra-cabeça: libera com 10 fotos favoritas (ativas) no Álbum. Foto do álbum da equipe (ou o seu mascote), 3×3, trocando peças.
 * Limite: 3 partidas por dia de cada jogo. A primeira vitória do dia em cada jogo vale 5 pontos (somados em PessoalCPT.pontos).
 * O servidor confere o resultado: refaz as letras da forca e as trocas do quebra-cabeça (não basta dizer "ganhei").
 * Partida começada e não terminada continua (abrir de novo não gasta outra). Coleção "Jogos" (JOG-email-dia-jogo-n).
 * Período de testes: só o proprietário (PessoalCPT.novo).
 */
class JogosCPT {
  static get partidasPorDia() { return 3; }
  static get pontosVitoria() { return 5; }
  static get erros() { return 6; }
  static get metas() { return {forca: 5, quebra: 10}; }
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
  constructor(ctx) { this.ctx = ctx; this.email = ctx.email; this.hoje = ColecaoCPT.hoje(); this.col = new ColecaoCPT(ctx, 'Jogos', 'JOG'); }
  minhas() { const p = 'JOG-' + this.email + '-'; return this.col.itens().filter(x => x.id.startsWith(p)); }
  deHoje(jogo) { return this.minhas().filter(x => x.dia === this.hoje && x.jogo === jogo).sort((a, b) => a.n - b.n); }
  /** Metas: dias de checklist com tarefa pontuada (até hoje) e fotos já favoritadas no Álbum. */
  progresso() {
    if (this._prog) return this._prog;
    const pre = 'CHK-' + this.email + '-', alb = 'ALB-' + this.email + '-';
    const dias = new ColecaoCPT(this.ctx, 'Checklist', 'CHK').itens().filter(l => l.id.startsWith(pre) && l.id.slice(-10) <= this.hoje && (l.itens || []).some(t => t.pontuado)).length;
    const favoritas = new ColecaoCPT(this.ctx, 'Álbum', 'ALB').itens().filter(x => x.ativo && x.id.startsWith(alb)).length; // só as ativas: marcar e desmarcar não infla a meta
    return (this._prog = {forca: dias, quebra: favoritas});
  }
  estado() {
    const p = this.progresso(), um = jogo => { const h = this.deHoje(jogo), aberta = h.find(x => x.situacao === 'jogando');
      return {liberado: p[jogo] >= JogosCPT.metas[jogo], tem: p[jogo], precisa: JogosCPT.metas[jogo], partidasHoje: h.length, limite: JogosCPT.partidasPorDia,
        vitoriasHoje: h.filter(x => x.situacao === 'venceu').length, ganhouPontosHoje: h.some(x => x.pontos > 0), aberta: !!aberta}; };
    return {forca: um('forca'), quebra: um('quebra'), regras: {pontos: JogosCPT.pontosVitoria, erros: JogosCPT.erros}};
  }
  /** Começa (ou continua) uma partida. A forca recebe a palavra em código (a tela precisa dela para jogar sem esperar o servidor a cada letra; quem conferir os pontos é o servidor). */
  iniciar(p) {
    p = p || {}; PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Os joguinhos'); if (!JogosCPT.pode(this.ctx.perfil)) throw new Error('Os joguinhos ainda não estão disponíveis.');
    const jogo = ColecaoCPT.opcao(p.jogo, ['forca', 'quebra'], 'jogo'), e = this.estado()[jogo];
    if (!e.liberado) throw new Error(jogo === 'forca' ? 'A forca libera com ' + e.precisa + ' dias de checklist (você tem ' + e.tem + ').' : 'O quebra-cabeça libera com ' + e.precisa + ' fotos favoritadas no Álbum (você tem ' + e.tem + ').');
    let x = this.deHoje(jogo).find(y => y.situacao === 'jogando');
    if (!x) {
      const ja = this.col.porOperacao(p.operacaoId);
      if (ja) x = ja;
      else {
        if (e.partidasHoje >= JogosCPT.partidasPorDia) throw new Error('Você já jogou ' + JogosCPT.partidasPorDia + ' partidas hoje. Amanhã tem mais!');
        const n = e.partidasHoje + 1, semente = ConteudoSaneamentoCPT.hash(this.email + ':' + this.hoje + ':' + jogo + ':' + n);
        const novo = {jogo, dia: this.hoje, n, situacao: 'jogando', pontos: 0};
        if (jogo === 'forca') novo.palavra = this.escolherPalavra(semente);
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
  /** Foto do álbum da equipe (favoritada por alguém); sem fotos, o quebra-cabeça usa o mascote da pessoa. */
  escolherFoto(semente) {
    const fotos = new ColecaoCPT(this.ctx, 'Álbum', 'ALB').itens().filter(x => x.ativo && x.fileId), vistos = new Map();
    fotos.forEach(f => vistos.set(f.fileId, {fileId: f.fileId, legenda: f.legenda || f.atividade || ''}));
    const lista = [...vistos.values()].sort((a, b) => a.fileId.localeCompare(b.fileId));
    return lista.length ? lista[semente % lista.length] : null;
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
    if (x.jogo === 'forca') { const dica = (JogosCPT.palavras.find(w => w[0] === x.palavra) || [])[1] || ''; return {...base, dica, codigo: x.palavra.split('').reverse().map(c => c.charCodeAt(0) + 7), erros: JogosCPT.erros}; }
    return {...base, ordem: x.ordem, foto: x.foto};
  }
  /** Termina a partida: o servidor refaz a jogada e decide se venceu. */
  terminar(p) {
    p = p || {}; PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'Os joguinhos');
    const x = this.col.obter(String(p.partida || '')); if (!x || !x.id.startsWith('JOG-' + this.email + '-')) throw new Error('Partida não encontrada.');
    const ja = this.col.porOperacao(p.operacaoId); if (ja) return this.depois(ja);
    if (x.situacao !== 'jogando') throw new Error('Essa partida já terminou.');
    let venceu;
    if (x.jogo === 'forca') {
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
    const e = this.col.gravar({...x, situacao: venceu ? 'venceu' : 'perdeu', pontos, jogadas: x.jogo === 'forca' ? p.letras.length : p.trocas.length}, x.versao, p.operacaoId, x.id);
    return this.depois(e);
  }
  depois(e) {
    const pe = new PessoalCPT(this.ctx);
    return {resultado: e.situacao === 'venceu' ? (e.pontos ? 'Venceu! +' + e.pontos + ' pontos' : 'Venceu!') : e.jogo === 'forca' ? 'Não foi dessa vez: a palavra era ' + e.palavra + '.' : 'Partida encerrada.',
      situacao: e.situacao, pontosGanhos: e.pontos, palavra: e.jogo === 'forca' ? e.palavra : undefined, estado: this.estado(), pontos: pe.pontos(pe.perfil())};
  }
}

function iniciarJogoCPT(p) { return ColecaoCPT.executar('jogos.iniciar', ctx => JogosCPT.de(ctx).iniciar(p), true); }
function terminarJogoCPT(p) { return ColecaoCPT.executar('jogos.terminar', ctx => JogosCPT.de(ctx).terminar(p), true); }

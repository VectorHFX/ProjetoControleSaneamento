/**
 * PessoalCPT 2.10.0. "Meu espaço": mascote, caderno e checklist de cada pessoa.
 * 2.10: capivara entre os mascotes e cor de cada mascote (lista fixa de cores, trocar a cor é livre e não gasta nada).
 * 2.18: elenco chibi (urso, águia, gato, cachorro, pato, capivara, sapinho, gota); dinossauro e abelha viram clássicos (150 pontos);
 *       kit EPI inicial (capacete branco, colete, luvas, bota preta) de todo mundo e já vestido nos mascotes novos.
 *       Período de testes: o elenco novo é só do proprietário (PessoalCPT.novo).
 * 2.23: placar da equipe (PlacarCPT, só totais da equipe) no Meu espaço.
 * 2.21: pontos dos joguinhos (JogosCPT) também somam; painel de joguinhos no Meu espaço.
 * 2.19: pontos do quiz (QuizCPT) somam aos do checklist; "Saber mais" no Meu espaço (curiosidade do dia, campanha do mês, quiz).
 * 2.26: quadro na parede do Meu espaço (foto mais favoritada do Álbum da equipe; sem foto, uma paisagem).
 * 2.26: Loja (bloco D) — EPI colorido (capacetes, coletes, luvas e botas), roupas novas e cores especiais de pelagem, por pontos.
 *       Só existem no elenco novo (desenho chibi); no período de testes, só o proprietário compra.
 * Privacidade: cada pessoa só lê e grava o próprio espaço (pelo e-mail da conta). Nem a Gestão vê pela aplicação.
 *
 * Regras das recompensas (calculadas no servidor; nada é concedido duas vezes):
 * - Primeiro mascote: escolhido ao entrar pela primeira vez (gratuito).
 * - Presente da semana: uma vez por semana (segunda a domingo), escolher um mascote novo OU uma peça comum.
 * - Caderno: a cada 5 dias com anotação (pelo menos 20 caracteres no dia), escolher uma peça comum.
 * - Checklist: cada tarefa própria marcada como feita vale 10 pontos uma única vez (desmarcar e marcar de novo
 *   não soma), até 8 tarefas pontuadas por dia e só no dia da tarefa ou depois. Pontos compram peças exclusivas.
 * - Recompensa resgatada fica registrada pela chave (semana:AAAA-Snn, caderno:5, caderno:10…): repetir não duplica.
 */
class PessoalCPT {
  /** Elenco anterior (quem ainda não está no elenco novo durante os testes continua com este). */
  static get especiesAntigas() { return {gato: 'Gato', aguia: 'Águia', pato: 'Pato', dinossauro: 'Dinossauro', abelha: 'Abelha', cachorro: 'Cachorro', capivara: 'Capivara'}; }
  /** 2.18: elenco chibi. Dinossauro e abelha viram clássicos: 150 pontos na loja, e quem já tem continua com eles. */
  static get especiesNovas() { return {urso: 'Urso', aguia: 'Águia', gato: 'Gato', cachorro: 'Cachorro', pato: 'Pato', capivara: 'Capivara', sapo: 'Sapinho', gota: "Gota d'água"}; }
  static get classicos() { return {dinossauro: 'Dinossauro', abelha: 'Abelha'}; }
  static get precoClassico() { return 150; }
  /** Peças que só existem no elenco novo (o desenho antigo não as tem). */
  static get pecasNovas() { return ['luvas', 'bota-preta', 'camisa-veolia', 'laco-do-mes'].concat(PessoalCPT.loja); }
  /** 2.26: peças da loja (só no desenho chibi). */
  static get loja() { return ['capacete-azul', 'capacete-verde', 'capacete-laranja', 'colete-amarelo', 'colete-azul', 'luvas-amarelas', 'luvas-azuis', 'galocha-amarela', 'bota-branca', 'moletom-verde', 'camisa-xadrez', 'jaqueta-jeans']; }
  /** 2.26: cores especiais de pelagem, compradas uma vez por pontos (depois trocar é livre). */
  static get coresEspeciais() { return {menta: 'Menta', coral: 'Coral', dourado: 'Dourado', noite: 'Azul-noite'}; }
  static get precoCor() { return 120; }
  /** 2.29: quadro atrás do mascote — cada pessoa escolhe um desenho pronto ou uma foto da Galeria. */
  static get paisagens() { return {'santo-andre': 'Santo André', rio: 'Beira do rio', 'por-do-sol': 'Pôr do sol', noite: 'Noite estrelada'}; }
  /** Kit EPI inicial: de todo mundo (não precisa ganhar) e já vestido em cada mascote novo. */
  static get kit() { return {cabeca: 'capacete-branco', corpo: 'colete', luvas: 'luvas', pes: 'bota-preta', broche: 'laco-do-mes'}; }
  /** Elenco novo: para todos depois de liberarConfiguracaoCPT; antes, só para o proprietário. */
  static novo(perfil) { return !PerfisCPT.travada() || perfil.papeis.includes('administrador'); }
  static especiesPara(perfil) { return PessoalCPT.novo(perfil) ? PessoalCPT.especiesNovas : PessoalCPT.especiesAntigas; }
  static get especies() { return PessoalCPT.especiesAntigas; }
  /** Cores possíveis do mascote. Sem cor escolhida, cada espécie usa a sua (o gato é laranja). */
  static get cores() {
    return {laranja: 'Laranja', caramelo: 'Caramelo', marrom: 'Marrom', creme: 'Creme', cinza: 'Cinza', grafite: 'Grafite', branco: 'Branco',
      amarelo: 'Amarelo', verde: 'Verde', azul: 'Azul', lilas: 'Lilás', rosa: 'Rosa'};
  }
  static cor(v) { return v === '' || v == null ? '' : ColecaoCPT.opcao(v, Object.keys(PessoalCPT.cores), 'cor do mascote'); }
  static get slots() { return {cabeca: 'Cabeça', rosto: 'Rosto', pescoco: 'Pescoço', corpo: 'Roupa', costas: 'Costas', broche: 'Broche', luvas: 'Luvas', mao: 'Na mão', pes: 'Pés'}; }
  /** [id, nome, parte, grupo, preço em pontos (0 = peça comum, ganha por semana ou caderno)] */
  static get catalogo() {
    return [
      ['capacete-amarelo', 'Capacete amarelo', 'cabeca', 'EPI', 0], ['capacete-branco', 'Capacete branco', 'cabeca', 'EPI', 0],
      ['colete', 'Colete refletivo', 'corpo', 'EPI', 0], ['oculos-protecao', 'Óculos de proteção', 'rosto', 'EPI', 0],
      ['abafador', 'Protetor auricular', 'cabeca', 'EPI', 0], ['botina', 'Botina de segurança', 'pes', 'EPI', 0],
      ['luvas', 'Luvas de proteção', 'luvas', 'EPI', 0], ['bota-preta', 'Bota preta', 'pes', 'EPI', 0],
      ['laco-do-mes', 'Laço da campanha do mês', 'broche', 'Campanhas', 0],
      ['camisa-timao', 'Camisa alvinegra listrada (Timão)', 'corpo', 'Futebol', 0], ['camisa-verdao', 'Camisa verde (Verdão)', 'corpo', 'Futebol', 0],
      ['camisa-tricolor', 'Camisa tricolor (São Paulo)', 'corpo', 'Futebol', 0], ['camisa-peixe', 'Camisa branca (Peixe)', 'corpo', 'Futebol', 0],
      ['camisa-cpt', 'Camiseta da equipe CPT', 'corpo', 'Roupas', 0], ['camisa-veolia', 'Camiseta Veolia', 'corpo', 'Roupas', 0],
      ['bone', 'Boné', 'cabeca', 'Acessórios', 0], ['laco', 'Laço', 'cabeca', 'Acessórios', 0], ['oculos-sol', 'Óculos escuros', 'rosto', 'Acessórios', 0],
      ['cachecol', 'Cachecol listrado', 'pescoco', 'Acessórios', 0], ['cracha', 'Crachá', 'pescoco', 'Acessórios', 0], ['fone', 'Fone de ouvido', 'cabeca', 'Acessórios', 0],
      ['prancheta', 'Prancheta', 'mao', 'Ferramentas', 0], ['trena', 'Trena', 'mao', 'Ferramentas', 0], ['camera', 'Câmera', 'mao', 'Ferramentas', 0],
      ['megafone', 'Megafone', 'mao', 'Ferramentas', 0], ['muda', 'Muda de planta', 'mao', 'Ferramentas', 0], ['chave', 'Chave inglesa', 'mao', 'Ferramentas', 0],
      ['capacete-dourado', 'Capacete dourado', 'cabeca', 'Exclusivos', 300], ['coroa-folhas', 'Coroa de folhas', 'cabeca', 'Exclusivos', 250],
      ['capa', 'Capa de herói da obra', 'costas', 'Exclusivos', 400], ['medalha', 'Medalha de ouro', 'pescoco', 'Exclusivos', 200],
      ['trofeu', 'Troféu', 'mao', 'Exclusivos', 350], ['colete-mestre', 'Colete de mestre de obras', 'corpo', 'Exclusivos', 300],
      ['capacete-azul', 'Capacete azul', 'cabeca', 'Loja · EPI colorido', 60], ['capacete-verde', 'Capacete verde', 'cabeca', 'Loja · EPI colorido', 60],
      ['capacete-laranja', 'Capacete laranja', 'cabeca', 'Loja · EPI colorido', 60], ['colete-amarelo', 'Colete amarelo-limão', 'corpo', 'Loja · EPI colorido', 80],
      ['colete-azul', 'Colete azul', 'corpo', 'Loja · EPI colorido', 80], ['luvas-amarelas', 'Luvas amarelas', 'luvas', 'Loja · EPI colorido', 50],
      ['luvas-azuis', 'Luvas azuis', 'luvas', 'Loja · EPI colorido', 50], ['galocha-amarela', 'Galocha amarela', 'pes', 'Loja · EPI colorido', 60],
      ['bota-branca', 'Bota branca', 'pes', 'Loja · EPI colorido', 60], ['moletom-verde', 'Moletom verde', 'corpo', 'Loja · Roupas', 90],
      ['camisa-xadrez', 'Camisa xadrez', 'corpo', 'Loja · Roupas', 90], ['jaqueta-jeans', 'Jaqueta jeans', 'corpo', 'Loja · Roupas', 120]
    ].map(([id, nome, slot, grupo, preco]) => ({id, nome, slot, grupo, preco}));
  }
  static get pontosPorTarefa() { return 10; }
  static get tarefasPontuadasPorDia() { return 8; }
  static get diasPorPeca() { return 5; }
  static get minimoCaderno() { return 20; }
  static item(id) { return PessoalCPT.catalogo.find(x => x.id === id) || null; }
  /** Semana de segunda a domingo, no formato 2026-S40 (ISO). */
  static semana(dia) {
    const d = new Date(dia + 'T12:00:00Z'), dow = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - dow + 3);
    const ano = d.getUTCFullYear(), primeira = new Date(Date.UTC(ano, 0, 4)), n = 1 + Math.round(((d - primeira) / 864e5 - 3 + ((primeira.getUTCDay() + 6) % 7)) / 7);
    return ano + '-S' + String(n).padStart(2, '0');
  }
  constructor(ctx) {
    this.ctx = ctx; this.email = ctx.email; this.hoje = ColecaoCPT.hoje();
    this.perfis = ColecaoCPT.de(ctx, 'Meu espaço', 'PES'); this.cadernos = ColecaoCPT.de(ctx, 'Caderno', 'CAD'); this.listas = ColecaoCPT.de(ctx, 'Checklist', 'CHK');
  }
  get idPerfil() { return 'PES-' + this.email; }
  idDia(prefixo, dia) { return prefixo + '-' + this.email + '-' + dia; }
  perfil() { return this.perfis.obter(this.idPerfil); }
  minhasNotas() { const p = 'CAD-' + this.email + '-'; return this.cadernos.itens().filter(x => x.id.startsWith(p)); }
  minhasListas() { const p = 'CHK-' + this.email + '-'; return this.listas.itens().filter(x => x.id.startsWith(p)); }
  diasEscritos() { return this.minhasNotas().filter(n => String(n.texto || '').trim().length >= PessoalCPT.minimoCaderno).length; }
  pontos(perfil) {
    const checklist = this.minhasListas().reduce((s, l) => s + Math.min(PessoalCPT.tarefasPontuadasPorDia, (l.itens || []).filter(t => t.pontuado).length) * PessoalCPT.pontosPorTarefa, 0);
    const quiz = QuizCPT.pontos(this.ctx), jogos = JogosCPT.pontos(this.ctx), ganhos = checklist + quiz + jogos, gastos = perfil ? (perfil.compras || []).reduce((s, c) => s + c.preco, 0) : 0;
    return {ganhos, gastos, saldo: ganhos - gastos, checklist, quiz, jogos};
  }
  pendentes(perfil) {
    if (!perfil) return [];
    const r = perfil.resgates || {}, out = [], semana = 'semana:' + PessoalCPT.semana(this.hoje);
    if (!r[semana]) out.push({chave: semana, tipo: 'semana', titulo: 'Presente da semana', texto: 'Escolha um mascote novo ou uma peça.'});
    const marcos = Math.floor(this.diasEscritos() / PessoalCPT.diasPorPeca);
    for (let i = 1; i <= marcos; i++) { const k = 'caderno:' + i * PessoalCPT.diasPorPeca; if (!r[k]) out.push({chave: k, tipo: 'caderno', titulo: i * PessoalCPT.diasPorPeca + ' dias de caderno', texto: 'Escolha uma peça nova.'}); }
    return out;
  }
  nota(dia) { const n = this.cadernos.obter(this.idDia('CAD', dia)); return n ? {data: dia, texto: n.texto, versao: n.versao, alteradoEm: n.alteradoEm} : {data: dia, texto: '', versao: 0}; }
  lista(dia) { const l = this.listas.obter(this.idDia('CHK', dia)); return l ? {data: dia, itens: l.itens, versao: l.versao} : {data: dia, itens: [], versao: 0}; }

  carregar(p) {
    const dia = ColecaoCPT.data((p && p.data) || this.hoje, 'data', true), perfil = this.perfil(), notas = this.minhasNotas();
    const novoElenco = PessoalCPT.novo(this.ctx.perfil), kit = Object.values(PessoalCPT.kit);
    const out = {hoje: this.hoje, data: dia, perfil, novoElenco, kit: novoElenco ? kit : [], classicos: novoElenco ? PessoalCPT.classicos : {}, precoClassico: PessoalCPT.precoClassico,
      catalogo: PessoalCPT.catalogo.filter(x => novoElenco || !PessoalCPT.pecasNovas.includes(x.id)), especies: PessoalCPT.especiesPara(this.ctx.perfil), cores: PessoalCPT.cores, slots: PessoalCPT.slots,
      coresEspeciais: novoElenco ? PessoalCPT.coresEspeciais : {}, precoCor: PessoalCPT.precoCor,
      pontos: this.pontos(perfil), pendentes: this.pendentes(perfil), nota: this.nota(dia), lista: this.lista(dia),
      caderno: {dias: this.diasEscritos(), porPeca: PessoalCPT.diasPorPeca, minimo: PessoalCPT.minimoCaderno,
        recentes: notas.filter(n => String(n.texto || '').trim()).map(n => ({data: n.id.slice(-10), trecho: String(n.texto).trim().slice(0, 90)})).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 12)},
      proximos: this.minhasListas().filter(l => l.id.slice(-10) > this.hoje && (l.itens || []).some(t => !t.feito)).map(l => ({data: l.id.slice(-10), pendentes: l.itens.filter(t => !t.feito).length})).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 5),
      regras: {pontosPorTarefa: PessoalCPT.pontosPorTarefa, tarefasPorDia: PessoalCPT.tarefasPontuadasPorDia}};
    if (QuizCPT.pode(this.ctx.perfil)) out.saber = this.saber();
    if (JogosCPT.pode(this.ctx.perfil)) out.jogos = JogosCPT.de(this.ctx).estado();
    out.quadro = this.quadro(perfil); out.paisagens = PessoalCPT.paisagens;
    if (PlacarCPT.pode(this.ctx.perfil)) { try { out.placar = new PlacarCPT(this.ctx).carregar(); } catch (e) { console.warn('Placar: ' + e.message); } }
    try { out.trabalho = {recados: new RecadosCPT(this.ctx).naoLidos().length}; if (LembretesCPT.pode(this.ctx.perfil)) out.trabalho.lembretes = new ColecaoCPT(this.ctx, 'Lembretes', 'LEM').itens().filter(l => l.situacao !== 'feito' && l.data && l.data <= this.hoje).length; } catch (_) { out.trabalho = {}; }
    return out;
  }
  /** "Saber mais": curiosidade do dia, campanha do mês e quiz (conteúdo em ConteudoSaneamentoCPT). */
  saber() {
    return {curiosidade: ConteudoSaneamentoCPT.curiosidadeDoDia(this.ctx, this.email, this.hoje), mes: ConteudoSaneamentoCPT.doMes(this.ctx, this.hoje), quiz: QuizCPT.de(this.ctx).estado()};
  }
  static nome(v) { const s = ColecaoCPT.texto(v, 30, 'nome do mascote', true); if (!/^[\p{L}\p{N} '\-]+$/u.test(s)) throw new Error('Use só letras, números e espaços no nome do mascote.'); return s; }
  /** Quadro escolhido (sem escolha: o desenho de Santo André). Foto: a miniatura vem pela aplicação (vale para quem não abre a pasta no Drive). */
  quadro(perfil) {
    const q = perfil && perfil.quadro;
    if (q && q.tipo === 'foto' && q.fileId) { const imagem = GaleriaCPT.miniatura(q.fileId); if (imagem) return {tipo: 'foto', fileId: q.fileId, legenda: q.legenda || '', imagem}; }
    return {tipo: 'paisagem', paisagem: q && PessoalCPT.paisagens[q.paisagem] ? q.paisagem : 'santo-andre'};
  }
  /** Ações do mascote: iniciar, nomear, colorir, ativar, vestir, resgatar, comprar, quadro. Tudo sobre o próprio perfil. */
  mascote(p) {
    p = p || {}; const atual = this.perfil(), acao = p.acao;
    if (!atual && acao !== 'iniciar') throw new Error('Escolha seu primeiro mascote.');
    let novo, resultado;
    if (acao === 'iniciar') {
      if (atual) return {resultado: 'Seu mascote já está aqui.', perfil: atual};
      ColecaoCPT.opcao(p.especie, Object.keys(PessoalCPT.especiesPara(this.ctx.perfil)), 'mascote');
      novo = {mascotes: [{especie: p.especie, nome: PessoalCPT.nome(p.nome), equipado: this.kitInicial(), cor: PessoalCPT.cor(p.cor)}], ativo: 0, pecas: [], resgates: {}, compras: []};
      resultado = 'Bem-vindo(a), ' + novo.mascotes[0].nome + '!';
    } else {
      novo = JSON.parse(JSON.stringify(atual)); const m = novo.mascotes[novo.ativo];
      if (acao === 'nomear') { m.nome = PessoalCPT.nome(p.nome); resultado = 'Agora seu mascote se chama ' + m.nome + '.'; }
      else if (acao === 'colorir') { m.cor = this.corDoPerfil(p.cor, novo); resultado = m.cor ? m.nome + ' agora está ' + (PessoalCPT.cores[m.cor] || PessoalCPT.coresEspeciais[m.cor]).toLowerCase() + '.' : m.nome + ' voltou à cor original.'; }
      else if (acao === 'ativar') { const i = Number(p.indice); if (!Number.isInteger(i) || !novo.mascotes[i]) throw new Error('Mascote não encontrado.'); novo.ativo = i; resultado = novo.mascotes[i].nome + ' está com você agora.'; }
      else if (acao === 'vestir') {
        const slot = ColecaoCPT.opcao(p.slot, Object.keys(PessoalCPT.slots), 'parte');
        if (!p.item) { delete m.equipado[slot]; resultado = 'Peça guardada.'; }
        else { const it = PessoalCPT.item(p.item); if (!it || it.slot !== slot || !(novo.pecas.includes(it.id) || this.doKit(it.id))) throw new Error('Essa peça ainda não é sua.'); m.equipado[slot] = it.id; resultado = it.nome + ' no ' + m.nome + '!'; }
      } else if (acao === 'resgatar') {
        const pend = this.pendentes(atual).find(x => x.chave === p.chave); if (!pend) throw new Error('Esse presente já foi resgatado.');
        if (p.escolha === 'mascote') {
          if (pend.tipo !== 'semana') throw new Error('Mascote novo é só no presente da semana.');
          ColecaoCPT.opcao(p.especie, Object.keys(PessoalCPT.especiesPara(this.ctx.perfil)), 'mascote');
          if (novo.mascotes.some(x => x.especie === p.especie)) throw new Error('Você já tem esse mascote. Escolha outro.');
          novo.mascotes.push({especie: p.especie, nome: PessoalCPT.nome(p.nome), equipado: this.kitInicial(), cor: PessoalCPT.cor(p.cor)}); novo.ativo = novo.mascotes.length - 1; resultado = 'Chegou ' + novo.mascotes[novo.ativo].nome + '!';
        } else {
          const it = PessoalCPT.item(p.item); if (!it || it.preco || (PessoalCPT.pecasNovas.includes(it.id) && !PessoalCPT.novo(this.ctx.perfil))) throw new Error('Escolha uma peça comum.');
          if (novo.pecas.includes(it.id) || this.doKit(it.id)) throw new Error('Você já tem essa peça. Escolha outra.');
          novo.pecas.push(it.id); m.equipado[it.slot] = it.id; resultado = 'Peça nova: ' + it.nome + '!';
        }
        novo.resgates[p.chave] = {em: new Date().toISOString(), escolha: p.escolha === 'mascote' ? 'mascote:' + p.especie : 'peca:' + p.item};
      } else if (acao === 'comprar') {
        const it = PessoalCPT.item(p.item); if (!it || !it.preco) throw new Error('Essa peça não é vendida por pontos.');
        if (PessoalCPT.pecasNovas.includes(it.id) && !PessoalCPT.novo(this.ctx.perfil)) throw new Error('A loja chega junto com o elenco novo.');
        if (novo.pecas.includes(it.id)) throw new Error('Você já tem essa peça.');
        if (this.pontos(atual).saldo < it.preco) throw new Error('Faltam pontos: complete tarefas do seu checklist ou responda o quiz.');
        novo.pecas.push(it.id); novo.compras.push({item: it.id, preco: it.preco, em: new Date().toISOString()}); m.equipado[it.slot] = it.id; resultado = 'Peça exclusiva: ' + it.nome + '!';
      } else if (acao === 'comprarCor') {
        if (!PessoalCPT.novo(this.ctx.perfil)) throw new Error('As cores especiais chegam junto com o elenco novo.');
        const k = ColecaoCPT.opcao(p.cor, Object.keys(PessoalCPT.coresEspeciais), 'cor especial'); novo.cores = novo.cores || [];
        if (novo.cores.includes(k)) throw new Error('Você já tem essa cor.');
        if (this.pontos(atual).saldo < PessoalCPT.precoCor) throw new Error('Faltam pontos: complete tarefas do seu checklist ou responda o quiz.');
        novo.cores.push(k); novo.compras.push({item: 'cor:' + k, preco: PessoalCPT.precoCor, em: new Date().toISOString()}); m.cor = k;
        resultado = 'Cor especial: ' + m.nome + ' agora está ' + PessoalCPT.coresEspeciais[k].toLowerCase() + '!';
      } else if (acao === 'comprarClassico') {
        // Clássicos (dinossauro e abelha): 150 pontos. Período de testes: só com o elenco novo (proprietário).
        if (!PessoalCPT.novo(this.ctx.perfil)) throw new Error('Os clássicos chegam junto com o elenco novo.');
        ColecaoCPT.opcao(p.especie, Object.keys(PessoalCPT.classicos), 'clássico');
        if (novo.mascotes.some(x => x.especie === p.especie)) throw new Error('Você já tem esse mascote.');
        if (this.pontos(atual).saldo < PessoalCPT.precoClassico) throw new Error('Faltam pontos: complete tarefas do seu checklist ou responda o quiz.');
        novo.mascotes.push({especie: p.especie, nome: PessoalCPT.nome(p.nome), equipado: this.kitInicial(), cor: ''}); novo.ativo = novo.mascotes.length - 1;
        novo.compras.push({item: 'mascote:' + p.especie, preco: PessoalCPT.precoClassico, em: new Date().toISOString()}); resultado = 'Clássico de volta: ' + novo.mascotes[novo.ativo].nome + '!';
      } else if (acao === 'quadro') {
        if (p.tipo === 'foto') {
          const id = String(p.fileId || ''); if (!/^[\w-]{10,80}$/.test(id)) throw new Error('Foto inválida.');
          if (!GaleriaCPT.miniatura(id)) throw new Error('Essa foto não abriu. Escolha outra da Galeria.');
          novo.quadro = {tipo: 'foto', fileId: id, legenda: ColecaoCPT.texto(p.legenda, 120, 'legenda')}; resultado = 'Foto nova no quadro!';
        } else { novo.quadro = {tipo: 'paisagem', paisagem: ColecaoCPT.opcao(p.paisagem, Object.keys(PessoalCPT.paisagens), 'desenho')}; resultado = 'Quadro trocado: ' + PessoalCPT.paisagens[novo.quadro.paisagem] + '.'; }
      } else throw new Error('Ação inválida.');
    }
    const e = this.perfis.gravar(novo, atual ? Number(p.versao) : 0, p.operacaoId, this.idPerfil);
    return {resultado, perfil: e, pontos: this.pontos(e), pendentes: this.pendentes(e)};
  }
  /** Cor comum (livre) ou especial (só depois de comprada, no elenco novo). */
  corDoPerfil(v, perfil) {
    if (v && PessoalCPT.coresEspeciais[v]) {
      if (!PessoalCPT.novo(this.ctx.perfil) || !(perfil.cores || []).includes(v)) throw new Error('Essa cor especial ainda não é sua. Ela fica na loja de cores.');
      return v;
    }
    return PessoalCPT.cor(v);
  }
  /** Mascote novo já vem com o kit EPI (só no elenco novo). */
  kitInicial() { return PessoalCPT.novo(this.ctx.perfil) ? {...PessoalCPT.kit} : {}; }
  /** Peças do kit são de todo mundo no elenco novo. */
  doKit(id) { return PessoalCPT.novo(this.ctx.perfil) && Object.values(PessoalCPT.kit).includes(id); }
  salvarNota(p) {
    p = p || {}; const dia = ColecaoCPT.data(p.data, 'data', true); if (dia > this.hoje) throw new Error('O caderno é para hoje e dias anteriores. Para planejar, use o checklist.');
    const id = this.idDia('CAD', dia), antes = this.diasEscritos();
    const e = this.cadernos.gravar({texto: ColecaoCPT.texto(p.texto, 10000, 'anotação')}, this.cadernos.obter(id) ? Number(p.versao) : 0, p.operacaoId, id);
    const dias = this.diasEscritos(), ganhou = Math.floor(dias / PessoalCPT.diasPorPeca) > Math.floor(antes / PessoalCPT.diasPorPeca);
    return {resultado: ganhou ? 'Caderno salvo. Você completou ' + dias + ' dias: tem peça nova esperando!' : 'Salvo.', nota: {data: dia, texto: e.texto, versao: e.versao, alteradoEm: e.alteradoEm}, dias, pendentes: this.pendentes(this.perfil())};
  }
  /** Lista do dia inteira. "pontuado" nunca sai de uma tarefa que já ganhou pontos (desmarcar não tira, remarcar não soma). */
  salvarLista(p) {
    p = p || {}; const dia = ColecaoCPT.data(p.data, 'data', true), id = this.idDia('CHK', dia), antiga = this.listas.obter(id);
    if (!Array.isArray(p.itens) || p.itens.length > 30) throw new Error('Use até 30 tarefas por dia.');
    const ant = new Map(((antiga && antiga.itens) || []).map(t => [t.id, t]));
    let pontuadas = [...ant.values()].filter(t => t.pontuado).length;
    const itens = p.itens.map(t => {
      const idT = /^T-[\w-]{4,40}$/.test(String(t.id)) ? t.id : 'T-' + Utilities.getUuid().slice(0, 8), velho = ant.get(idT), feito = t.feito === true;
      const x = {id: idT, texto: ColecaoCPT.texto(t.texto, 200, 'tarefa', true), feito, feitoEm: feito ? (velho && velho.feitoEm) || new Date().toISOString() : '', pontuado: !!(velho && velho.pontuado)};
      if (feito && !x.pontuado && dia <= this.hoje && pontuadas < PessoalCPT.tarefasPontuadasPorDia) { x.pontuado = true; pontuadas++; }
      return x;
    });
    // Tarefa que já pontuou continua contando mesmo se for apagada da lista.
    ant.forEach(t => { if (t.pontuado && !itens.some(x => x.id === t.id)) itens.push({...t, removido: true}); });
    const e = this.listas.gravar({itens}, antiga ? Number(p.versao) : 0, p.operacaoId, id), perfil = this.perfil();
    const novos = itens.filter(x => x.pontuado && !(ant.get(x.id) || {}).pontuado).length;
    return {resultado: novos ? '+' + novos * PessoalCPT.pontosPorTarefa + ' pontos!' : 'Checklist salvo.', lista: {data: dia, itens: e.itens, versao: e.versao}, pontos: this.pontos(perfil)};
  }
}

function carregarMeuEspacoCPT(p) { return ColecaoCPT.executar('pessoal.carregar', ctx => new PessoalCPT(ctx).carregar(p)); }
function salvarMascoteCPT(p) { return ColecaoCPT.executar('pessoal.mascote', ctx => new PessoalCPT(ctx).mascote(p), true); }
function salvarNotaCPT(p) { return ColecaoCPT.executar('pessoal.nota', ctx => new PessoalCPT(ctx).salvarNota(p), true); }
function salvarChecklistCPT(p) { return ColecaoCPT.executar('pessoal.checklist', ctx => new PessoalCPT(ctx).salvarLista(p), true); }

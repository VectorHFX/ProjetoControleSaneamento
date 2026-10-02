/**
 * PessoalCPT 2.9.0. "Meu espaço": mascote, caderno e checklist de cada pessoa.
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
  static get especies() { return {gato: 'Gato', aguia: 'Águia', pato: 'Pato', dinossauro: 'Dinossauro', abelha: 'Abelha', cachorro: 'Cachorro'}; }
  static get slots() { return {cabeca: 'Cabeça', rosto: 'Rosto', pescoco: 'Pescoço', corpo: 'Roupa', costas: 'Costas', mao: 'Na mão', pes: 'Pés'}; }
  /** [id, nome, parte, grupo, preço em pontos (0 = peça comum, ganha por semana ou caderno)] */
  static get catalogo() {
    return [
      ['capacete-amarelo', 'Capacete amarelo', 'cabeca', 'EPI', 0], ['capacete-branco', 'Capacete branco', 'cabeca', 'EPI', 0],
      ['colete', 'Colete refletivo', 'corpo', 'EPI', 0], ['oculos-protecao', 'Óculos de proteção', 'rosto', 'EPI', 0],
      ['abafador', 'Protetor auricular', 'cabeca', 'EPI', 0], ['botina', 'Botina de segurança', 'pes', 'EPI', 0],
      ['camisa-timao', 'Camisa alvinegra listrada (Timão)', 'corpo', 'Futebol', 0], ['camisa-verdao', 'Camisa verde (Verdão)', 'corpo', 'Futebol', 0],
      ['camisa-tricolor', 'Camisa tricolor (São Paulo)', 'corpo', 'Futebol', 0], ['camisa-peixe', 'Camisa branca (Peixe)', 'corpo', 'Futebol', 0],
      ['camisa-cpt', 'Camiseta da equipe CPT', 'corpo', 'Roupas', 0],
      ['bone', 'Boné', 'cabeca', 'Acessórios', 0], ['laco', 'Laço', 'cabeca', 'Acessórios', 0], ['oculos-sol', 'Óculos escuros', 'rosto', 'Acessórios', 0],
      ['cachecol', 'Cachecol listrado', 'pescoco', 'Acessórios', 0], ['cracha', 'Crachá', 'pescoco', 'Acessórios', 0], ['fone', 'Fone de ouvido', 'cabeca', 'Acessórios', 0],
      ['prancheta', 'Prancheta', 'mao', 'Ferramentas', 0], ['trena', 'Trena', 'mao', 'Ferramentas', 0], ['camera', 'Câmera', 'mao', 'Ferramentas', 0],
      ['megafone', 'Megafone', 'mao', 'Ferramentas', 0], ['muda', 'Muda de planta', 'mao', 'Ferramentas', 0], ['chave', 'Chave inglesa', 'mao', 'Ferramentas', 0],
      ['capacete-dourado', 'Capacete dourado', 'cabeca', 'Exclusivos', 300], ['coroa-folhas', 'Coroa de folhas', 'cabeca', 'Exclusivos', 250],
      ['capa', 'Capa de herói da obra', 'costas', 'Exclusivos', 400], ['medalha', 'Medalha de ouro', 'pescoco', 'Exclusivos', 200],
      ['trofeu', 'Troféu', 'mao', 'Exclusivos', 350], ['colete-mestre', 'Colete de mestre de obras', 'corpo', 'Exclusivos', 300]
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
    this.perfis = new ColecaoCPT(ctx, 'Meu espaço', 'PES'); this.cadernos = new ColecaoCPT(ctx, 'Caderno', 'CAD'); this.listas = new ColecaoCPT(ctx, 'Checklist', 'CHK');
  }
  get idPerfil() { return 'PES-' + this.email; }
  idDia(prefixo, dia) { return prefixo + '-' + this.email + '-' + dia; }
  perfil() { return this.perfis.obter(this.idPerfil); }
  minhasNotas() { const p = 'CAD-' + this.email + '-'; return this.cadernos.itens().filter(x => x.id.startsWith(p)); }
  minhasListas() { const p = 'CHK-' + this.email + '-'; return this.listas.itens().filter(x => x.id.startsWith(p)); }
  diasEscritos() { return this.minhasNotas().filter(n => String(n.texto || '').trim().length >= PessoalCPT.minimoCaderno).length; }
  pontos(perfil) {
    const ganhos = this.minhasListas().reduce((s, l) => s + Math.min(PessoalCPT.tarefasPontuadasPorDia, (l.itens || []).filter(t => t.pontuado).length) * PessoalCPT.pontosPorTarefa, 0);
    const gastos = perfil ? (perfil.compras || []).reduce((s, c) => s + c.preco, 0) : 0;
    return {ganhos, gastos, saldo: ganhos - gastos};
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
    const out = {hoje: this.hoje, data: dia, perfil, catalogo: PessoalCPT.catalogo, especies: PessoalCPT.especies, slots: PessoalCPT.slots,
      pontos: this.pontos(perfil), pendentes: this.pendentes(perfil), nota: this.nota(dia), lista: this.lista(dia),
      caderno: {dias: this.diasEscritos(), porPeca: PessoalCPT.diasPorPeca, minimo: PessoalCPT.minimoCaderno,
        recentes: notas.filter(n => String(n.texto || '').trim()).map(n => ({data: n.id.slice(-10), trecho: String(n.texto).trim().slice(0, 90)})).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 12)},
      proximos: this.minhasListas().filter(l => l.id.slice(-10) > this.hoje && (l.itens || []).some(t => !t.feito)).map(l => ({data: l.id.slice(-10), pendentes: l.itens.filter(t => !t.feito).length})).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 5),
      regras: {pontosPorTarefa: PessoalCPT.pontosPorTarefa, tarefasPorDia: PessoalCPT.tarefasPontuadasPorDia}};
    try { out.trabalho = {recados: new RecadosCPT(this.ctx).naoLidos().length}; if (LembretesCPT.pode(this.ctx.perfil)) out.trabalho.lembretes = new ColecaoCPT(this.ctx, 'Lembretes', 'LEM').itens().filter(l => l.situacao !== 'feito' && l.data && l.data <= this.hoje).length; } catch (_) { out.trabalho = {}; }
    return out;
  }
  static nome(v) { const s = ColecaoCPT.texto(v, 30, 'nome do mascote', true); if (!/^[\p{L}\p{N} '\-]+$/u.test(s)) throw new Error('Use só letras, números e espaços no nome do mascote.'); return s; }
  /** Ações do mascote: iniciar, nomear, ativar, vestir, resgatar, comprar. Tudo sobre o próprio perfil. */
  mascote(p) {
    p = p || {}; const atual = this.perfil(), acao = p.acao;
    if (!atual && acao !== 'iniciar') throw new Error('Escolha seu primeiro mascote.');
    let novo, resultado;
    if (acao === 'iniciar') {
      if (atual) return {resultado: 'Seu mascote já está aqui.', perfil: atual};
      ColecaoCPT.opcao(p.especie, Object.keys(PessoalCPT.especies), 'mascote');
      novo = {mascotes: [{especie: p.especie, nome: PessoalCPT.nome(p.nome), equipado: {}}], ativo: 0, pecas: [], resgates: {}, compras: []};
      resultado = 'Bem-vindo(a), ' + novo.mascotes[0].nome + '!';
    } else {
      novo = JSON.parse(JSON.stringify(atual)); const m = novo.mascotes[novo.ativo];
      if (acao === 'nomear') { m.nome = PessoalCPT.nome(p.nome); resultado = 'Agora seu mascote se chama ' + m.nome + '.'; }
      else if (acao === 'ativar') { const i = Number(p.indice); if (!Number.isInteger(i) || !novo.mascotes[i]) throw new Error('Mascote não encontrado.'); novo.ativo = i; resultado = novo.mascotes[i].nome + ' está com você agora.'; }
      else if (acao === 'vestir') {
        const slot = ColecaoCPT.opcao(p.slot, Object.keys(PessoalCPT.slots), 'parte');
        if (!p.item) { delete m.equipado[slot]; resultado = 'Peça guardada.'; }
        else { const it = PessoalCPT.item(p.item); if (!it || it.slot !== slot || !novo.pecas.includes(it.id)) throw new Error('Essa peça ainda não é sua.'); m.equipado[slot] = it.id; resultado = it.nome + ' no ' + m.nome + '!'; }
      } else if (acao === 'resgatar') {
        const pend = this.pendentes(atual).find(x => x.chave === p.chave); if (!pend) throw new Error('Esse presente já foi resgatado.');
        if (p.escolha === 'mascote') {
          if (pend.tipo !== 'semana') throw new Error('Mascote novo é só no presente da semana.');
          ColecaoCPT.opcao(p.especie, Object.keys(PessoalCPT.especies), 'mascote');
          if (novo.mascotes.some(x => x.especie === p.especie)) throw new Error('Você já tem esse mascote. Escolha outro.');
          novo.mascotes.push({especie: p.especie, nome: PessoalCPT.nome(p.nome), equipado: {}}); novo.ativo = novo.mascotes.length - 1; resultado = 'Chegou ' + novo.mascotes[novo.ativo].nome + '!';
        } else {
          const it = PessoalCPT.item(p.item); if (!it || it.preco) throw new Error('Escolha uma peça comum.');
          if (novo.pecas.includes(it.id)) throw new Error('Você já tem essa peça. Escolha outra.');
          novo.pecas.push(it.id); m.equipado[it.slot] = it.id; resultado = 'Peça nova: ' + it.nome + '!';
        }
        novo.resgates[p.chave] = {em: new Date().toISOString(), escolha: p.escolha === 'mascote' ? 'mascote:' + p.especie : 'peca:' + p.item};
      } else if (acao === 'comprar') {
        const it = PessoalCPT.item(p.item); if (!it || !it.preco) throw new Error('Essa peça não é vendida por pontos.');
        if (novo.pecas.includes(it.id)) throw new Error('Você já tem essa peça.');
        if (this.pontos(atual).saldo < it.preco) throw new Error('Faltam pontos: complete tarefas do seu checklist.');
        novo.pecas.push(it.id); novo.compras.push({item: it.id, preco: it.preco, em: new Date().toISOString()}); m.equipado[it.slot] = it.id; resultado = 'Peça exclusiva: ' + it.nome + '!';
      } else throw new Error('Ação inválida.');
    }
    const e = this.perfis.gravar(novo, atual ? Number(p.versao) : 0, p.operacaoId, this.idPerfil);
    return {resultado, perfil: e, pontos: this.pontos(e), pendentes: this.pendentes(e)};
  }
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

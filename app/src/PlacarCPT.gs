/**
 * PlacarCPT 2.23.0. Placar da equipe: só números somados da equipe na semana (segunda a domingo) e uma meta coletiva.
 * Nada por pessoa: não mostra nomes, mascotes, pontos de alguém nem quantas pessoas participaram.
 * Soma: tarefas pontuadas do checklist, acertos do quiz, vitórias nos joguinhos (com pontos) e fotos favoritadas no Álbum.
 * Lê as coleções já usadas pelo Meu espaço (ColecaoCPT.de: cada aba uma vez por pedido). Período de testes: só o proprietário.
 */
class PlacarCPT {
  static get meta() { return 400; }
  static get semanas() { return 4; }
  static pode(perfil) { return PessoalCPT.novo(perfil); }
  constructor(ctx) { this.ctx = ctx; this.hoje = ColecaoCPT.hoje(); }
  static segunda(dia, menos) { const d = new Date(dia + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7 - 7 * (menos || 0)); return d.toISOString().slice(0, 10); }
  /** Totais da equipe por semana (chave 2026-S41). */
  totais() {
    const t = {}, s = dia => { const k = PessoalCPT.semana(dia); return t[k] || (t[k] = {pontos: 0, tarefas: 0, acertos: 0, vitorias: 0, fotos: 0}); };
    ColecaoCPT.de(this.ctx, 'Checklist', 'CHK').itens().forEach(l => { const dia = l.id.slice(-10); if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || dia > this.hoje) return;
      const n = Math.min(PessoalCPT.tarefasPontuadasPorDia, (l.itens || []).filter(x => x.pontuado).length); if (n) { const x = s(dia); x.tarefas += n; x.pontos += n * PessoalCPT.pontosPorTarefa; } });
    ColecaoCPT.de(this.ctx, 'Quiz', 'QUI').itens().forEach(q => (q.respostas || []).forEach(r => { if (!r.acertou || !r.dia) return; const x = s(r.dia); x.acertos++; x.pontos += q.tipo === 'dia' ? QuizCPT.pontosDia : QuizCPT.pontosPergunta; }));
    ColecaoCPT.de(this.ctx, 'Jogos', 'JOG').itens().forEach(j => { if (j.situacao !== 'venceu' || !j.dia) return; const x = s(j.dia); x.vitorias++; x.pontos += Number(j.pontos) || 0; });
    ColecaoCPT.de(this.ctx, 'Álbum', 'ALB').itens().forEach(a => { if (a.ativo && a.dia) s(a.dia).fotos++; });
    return t;
  }
  carregar() {
    if (!PlacarCPT.pode(this.ctx.perfil)) throw new Error('O placar está reservado à administração técnica durante o período de testes.');
    const t = this.totais(), vazio = {pontos: 0, tarefas: 0, acertos: 0, vitorias: 0, fotos: 0}, atual = PessoalCPT.semana(this.hoje);
    const historico = Array.from({length: PlacarCPT.semanas}, (_, i) => { const seg = PlacarCPT.segunda(this.hoje, PlacarCPT.semanas - 1 - i), k = PessoalCPT.semana(seg); return {semana: k, inicio: seg, pontos: (t[k] || vazio).pontos, atual: k === atual}; });
    const sem = t[atual] || vazio;
    return {semana: atual, inicio: PlacarCPT.segunda(this.hoje), ...sem, meta: PlacarCPT.meta, atingiu: sem.pontos >= PlacarCPT.meta, historico};
  }
}

/**
 * QuizCPT 2.19.0. Pergunta do dia e quiz da semana sobre saneamento (perguntas em ConteudoSaneamentoCPT).
 * - Pergunta do dia: 1 pergunta, 2 pontos se acertar. Só hoje e uma vez.
 * - Quiz da semana (segunda a domingo): 5 perguntas, 10 pontos por acerto. Uma tentativa por pergunta.
 * - A resposta certa só sai do servidor depois que a pessoa responde.
 * - Sorteio estável (pessoa + dia/semana): recarregar a página não troca a pergunta. Evita repetir o que a pessoa
 *   já respondeu e a pergunta do dia nunca repete uma do quiz da semana.
 * Privacidade: cada pessoa só lê e grava as próprias respostas (coleção "Quiz", IDs QUI-email-...). Sem ranking.
 * Período de testes: só o proprietário (PessoalCPT.novo).
 */
class QuizCPT {
  static get pontosDia() { return 2; }
  static get pontosPergunta() { return 10; }
  static get porSemana() { return 5; }
  static pode(perfil) { return PessoalCPT.novo(perfil); }
  constructor(ctx) { this.ctx = ctx; this.email = ctx.email; this.hoje = ColecaoCPT.hoje(); this.colecao = new ColecaoCPT(ctx, 'Quiz', 'QUI'); }
  idDia(dia) { return 'QUI-' + this.email + '-D-' + dia; }
  idSemana(semana) { return 'QUI-' + this.email + '-S-' + semana; }
  meus() { const p = 'QUI-' + this.email + '-'; return this.colecao.itens().filter(x => x.id.startsWith(p)); }
  /** Pontos ganhos no quiz (somados aos do checklist em PessoalCPT.pontos). */
  static pontos(ctx) { if (!QuizCPT.pode(ctx.perfil)) return 0; const q = new QuizCPT(ctx); return q.meus().reduce((s, x) => s + (Number(x.pontos) || 0), 0); }
  static segunda(dia) { const d = new Date(dia + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10); }
  banco() { return ConteudoSaneamentoCPT.visiveis(ConteudoSaneamentoCPT.perguntas, this.ctx.perfil); }
  /** IDs respondidos antes de uma data (pelo dia da resposta). */
  respondidasAntes(dia) { const s = new Set(); this.meus().forEach(x => (x.respostas || []).forEach(r => { if (r.dia < dia) s.add(r.id); })); return s; }
  /** As 5 do quiz da semana: guardadas na primeira resposta; antes disso, sorteadas sem repetir semanas anteriores. */
  perguntasDaSemana(semana, segunda) {
    const r = this.colecao.obter(this.idSemana(semana)); if (r) return r.perguntas;
    const banco = this.banco(), ja = this.respondidasAntes(segunda), novas = banco.filter(q => !ja.has(q.id));
    const ordem = ConteudoSaneamentoCPT.embaralhar(novas.length >= QuizCPT.porSemana ? novas : banco, this.email + ':' + semana);
    return ordem.slice(0, QuizCPT.porSemana).map(q => q.id);
  }
  perguntaDoDia(dia) {
    const r = this.colecao.obter(this.idDia(dia)); if (r) return r.perguntas[0];
    const semana = PessoalCPT.semana(dia), daSemana = new Set(this.perguntasDaSemana(semana, QuizCPT.segunda(dia))), ja = this.respondidasAntes(dia);
    const banco = this.banco().filter(q => !daSemana.has(q.id)), novas = banco.filter(q => !ja.has(q.id));
    const q = ConteudoSaneamentoCPT.embaralhar(novas.length ? novas : banco, this.email + ':' + dia)[0];
    return q ? q.id : null;
  }
  /** Resultado de uma resposta para a tela (com a certa e a explicação). */
  resultado(r) {
    const q = ConteudoSaneamentoCPT.pergunta(r.id); if (!q) return null;
    return {...ConteudoSaneamentoCPT.semResposta(q, this.ctx.perfil), escolha: r.escolha, acertou: r.acertou, certa: q.certa, explica: q.explica, fonte: ConteudoSaneamentoCPT.fonte(q.fonte)};
  }
  /** Estado para o Meu espaço: pergunta do dia e quiz da semana (sem as respostas certas do que falta responder). */
  estado() {
    const dia = this.hoje, semana = PessoalCPT.semana(dia), rd = this.colecao.obter(this.idDia(dia)), rs = this.colecao.obter(this.idSemana(semana));
    const idDia = this.perguntaDoDia(dia), qd = idDia && ConteudoSaneamentoCPT.pergunta(idDia);
    const ids = this.perguntasDaSemana(semana, QuizCPT.segunda(dia)), feitas = (rs && rs.respostas) || [];
    const proxima = feitas.length < ids.length ? ConteudoSaneamentoCPT.pergunta(ids[feitas.length]) : null;
    return {
      regras: {pontosDia: QuizCPT.pontosDia, pontosPergunta: QuizCPT.pontosPergunta, porSemana: QuizCPT.porSemana},
      dia: qd ? {data: dia, versao: rd ? rd.versao : 0, pergunta: rd ? null : ConteudoSaneamentoCPT.semResposta(qd, this.ctx.perfil), resposta: rd ? this.resultado(rd.respostas[0]) : null} : null,
      semana: ids.length ? {semana, versao: rs ? rs.versao : 0, total: ids.length, respondidas: feitas.length, acertos: feitas.filter(r => r.acertou).length, pontos: rs ? rs.pontos : 0,
        indice: feitas.length, proxima: proxima ? ConteudoSaneamentoCPT.semResposta(proxima, this.ctx.perfil) : null, respostas: feitas.map(r => this.resultado(r)).filter(Boolean)} : null
    };
  }
  /** Responde a pergunta do dia (tipo 'dia') ou a próxima do quiz da semana (tipo 'semana'). */
  responder(p) {
    p = p || {}; PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'O quiz');
    if (!QuizCPT.pode(this.ctx.perfil)) throw new Error('O quiz ainda não está disponível.');
    const escolha = Number(p.escolha); if (!Number.isInteger(escolha) || escolha < 0 || escolha > 3) throw new Error('Escolha uma das alternativas.');
    const dia = this.hoje, agora = new Date().toISOString(), tipo = ColecaoCPT.opcao(p.tipo, ['dia', 'semana'], 'tipo');
    let id, antigo, ids, novo, pontos;
    if (tipo === 'dia') {
      id = this.idDia(dia); antigo = this.colecao.obter(id);
      ids = [this.perguntaDoDia(dia)]; pontos = QuizCPT.pontosDia;
    } else {
      const semana = PessoalCPT.semana(dia); id = this.idSemana(semana); antigo = this.colecao.obter(id); ids = this.perguntasDaSemana(semana, QuizCPT.segunda(dia)); pontos = QuizCPT.pontosPergunta;
    }
    const feitas = (antigo && antigo.respostas) || [], qid = ids[feitas.length];
    const ja = this.colecao.porOperacao(p.operacaoId); if (ja) return this.depois(tipo, ja);
    if (!qid) throw new Error(tipo === 'dia' ? 'Você já respondeu a pergunta de hoje. Volte amanhã!' : 'Você já fez o quiz desta semana. Na segunda tem outro!');
    if (p.id !== qid) throw new Error('A pergunta mudou. Atualize a página.');
    const q = ConteudoSaneamentoCPT.pergunta(qid), acertou = escolha === q.certa, respostas = feitas.concat([{id: qid, escolha, acertou, dia, em: agora}]);
    novo = {tipo, dia: tipo === 'dia' ? dia : '', perguntas: ids, respostas, pontos: respostas.filter(r => r.acertou).length * pontos};
    const e = this.colecao.gravar(novo, antigo ? Number(p.versao) : 0, p.operacaoId, id);
    return this.depois(tipo, e);
  }
  depois(tipo, e) {
    const ultima = e.respostas[e.respostas.length - 1], r = this.resultado(ultima), pts = tipo === 'dia' ? QuizCPT.pontosDia : QuizCPT.pontosPergunta;
    return {resultado: ultima.acertou ? 'Acertou! +' + pts + ' pontos' : 'Quase! Veja a explicação.', resposta: r, estado: this.estado(), pontos: (pe => pe.pontos(pe.perfil()))(new PessoalCPT(this.ctx))};
  }
}

function responderQuizCPT(p) { return ColecaoCPT.executar('quiz.responder', ctx => new QuizCPT(ctx).responder(p), true); }

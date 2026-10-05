/**
 * AlbumCPT 2.20.0. Álbum da equipe: cada pessoa escolhe até 2 fotos favoritas por dia, das fotos do mês (galeria),
 * e todos veem o álbum do mês e o destaque "Fotos da semana" (as mais favoritadas na semana).
 * - Destaque de fotos, não de pessoas: ninguém vê quem favoritou; cada pessoa só sabe das próprias favoritas.
 * - Só fotos (vídeos não entram) e só as que aparecem na galeria do mês escolhido.
 * - Desmarcar uma favorita de hoje libera a vaga de hoje. As de dias anteriores podem ser desmarcadas, sem devolver vaga.
 * Coleção "Álbum" (ALB-email-arquivo). Período de testes: só o proprietário (PessoalCPT.novo).
 */
class AlbumCPT {
  static get porDia() { return 2; }
  static get destaques() { return 6; }
  /** 2.26.2: "Escolha suas favoritas" mostra o mês escolhido e os dois anteriores (mais fotos para escolher, mais leitura da base). */
  static get mesesAtras() { return 2; }
  static mesesAte(mes) { const out = []; let [a, m] = mes.split('-').map(Number); for (let i = 0; i <= AlbumCPT.mesesAtras; i++) { out.push(a + '-' + String(m).padStart(2, '0')); if (--m < 1) { m = 12; a--; } } return out; }
  static pode(perfil) { return PessoalCPT.novo(perfil); }
  constructor(ctx) {
    if (!AlbumCPT.pode(ctx.perfil)) throw new Error('O álbum está reservado à administração técnica durante o período de testes.');
    this.ctx = ctx; this.email = ctx.email; this.hoje = ColecaoCPT.hoje(); this.col = ColecaoCPT.de(ctx, 'Álbum', 'ALB');
  }
  id(fileId) { return 'ALB-' + this.email + '-' + fileId; }
  ativos() { return this.col.itens().filter(x => x.ativo); }
  meus() { const p = 'ALB-' + this.email + '-'; return this.ativos().filter(x => x.id.startsWith(p)); }
  usadasHoje() { return this.meus().filter(x => x.dia === this.hoje).length; }
  /** Fotos do mês na galeria (sem vídeos). */
  fotos(mes) {
    if (!this.ctx.base) this.ctx.base = planilhaCPT_(this.ctx.config.baseId);
    return new GaleriaCPT(this.ctx, true).listar(mes).itens.filter(x => !x.video).map(x => ({fileId: x.fileId, data: x.data, atividade: x.atividade, local: x.local, legenda: x.legenda}));
  }
  /** Fotos do mês e dos meses anteriores (sem vídeos), da mais nova para a mais antiga. */
  fotosRecentes(mes) {
    if (!this.ctx.base) this.ctx.base = planilhaCPT_(this.ctx.config.baseId);
    return new GaleriaCPT(this.ctx, true).periodo(AlbumCPT.mesesAte(mes)).filter(x => !x.video).map(x => ({fileId: x.fileId, data: x.data, atividade: x.atividade, local: x.local, legenda: x.legenda}));
  }
  /** Agrupa favoritas por foto: quantos corações e se uma delas é minha (sem dizer de quem são as outras). */
  agrupar(lista) {
    const m = new Map(), eu = 'ALB-' + this.email + '-';
    lista.forEach(x => { const g = m.get(x.fileId) || {fileId: x.fileId, data: x.data, atividade: x.atividade, local: x.local, legenda: x.legenda, coracoes: 0, meu: false};
      g.coracoes++; if (x.id.startsWith(eu)) g.meu = true; m.set(x.fileId, g); });
    return [...m.values()].sort((a, b) => b.coracoes - a.coracoes || String(b.data).localeCompare(String(a.data)));
  }
  carregar(p) {
    const mes = String((p && p.mes) || this.hoje.slice(0, 7)); if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new Error('Escolha um mês válido.');
    const ativos = this.ativos(), semana = PessoalCPT.semana(this.hoje), daSemana = ativos.filter(x => PessoalCPT.semana(x.dia) === semana);
    const grupos = new Map(this.agrupar(ativos).map(g => [g.fileId, g]));
    return {mes, hoje: this.hoje, porDia: AlbumCPT.porDia, usadasHoje: this.usadasHoje(), minhas: this.meus().length,
      semana: {semana, fotos: this.agrupar(daSemana).slice(0, AlbumCPT.destaques)},
      // 2.26.2: entra no álbum do mês a foto do mês e também a foto antiga favoritada neste mês.
      album: this.agrupar(ativos.filter(x => String(x.data).slice(0, 7) === mes || String(x.dia || '').slice(0, 7) === mes)),
      meses: AlbumCPT.mesesAte(mes),
      fotos: this.fotosRecentes(mes).map(f => { const g = grupos.get(f.fileId); return {...f, coracoes: g ? g.coracoes : 0, meu: !!(g && g.meu)}; })};
  }
  /** 2.26: foto do quadro na parede do Meu espaço — a mais favoritada da semana (ou dos últimos 30 dias). Só a foto e a legenda. */
  quadro() {
    if (!ColecaoCPT.existe(this.ctx, 'Álbum')) return null;
    const ativos = this.ativos(), semana = PessoalCPT.semana(this.hoje), limite = new Date(Date.parse(this.hoje + 'T12:00:00Z') - 30 * 864e5).toISOString().slice(0, 10);
    const g = this.agrupar(ativos.filter(x => PessoalCPT.semana(x.dia) === semana))[0] || this.agrupar(ativos.filter(x => x.dia >= limite))[0];
    return g ? {fileId: g.fileId, legenda: g.atividade || g.legenda || '', local: g.local || '', data: g.data || ''} : null;
  }
  /**
   * 2.26.3: miniatura pela conta da aplicação, para foto que o navegador não abre no Drive (a conta de quem vê não tem
   * leitura na pasta). Só fotos que o próprio Álbum mostra (do período ou favoritas); no máximo 12 por pedido; cache de 6 h.
   */
  miniaturas(p) {
    p = p || {}; const ids = Array.isArray(p.ids) ? [...new Set(p.ids.map(String))].filter(x => /^[\w-]{10,80}$/.test(x)).slice(0, AlbumCPT.miniaturasPorPedido) : [];
    if (!ids.length) return {miniaturas: {}};
    const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(p.mes || '')) ? String(p.mes) : this.hoje.slice(0, 7);
    const permitidas = new Set(this.ativos().map(x => x.fileId));
    if (ids.some(id => !permitidas.has(id))) this.fotosRecentes(mes).forEach(f => permitidas.add(f.fileId));
    const out = {};
    ids.filter(id => permitidas.has(id)).forEach(id => {
      const chave = 'album:mini:' + id; let m = CacheCPT.ler(chave);
      if (!m) {
        try {
          const f = DriveApp.getFileById(id); if (!/^image\//.test(f.getMimeType())) return;
          const b = f.getThumbnail(); if (!b) return;
          m = {u: 'data:' + (b.getContentType() || 'image/png') + ';base64,' + Utilities.base64Encode(b.getBytes())};
          CacheCPT.gravar(chave, m, 21600);
        } catch (_) { return; }
      }
      out[id] = m.u;
    });
    return {miniaturas: out};
  }
  static get miniaturasPorPedido() { return 12; }
  /** Marca (ativo = true) ou desmarca uma favorita. */
  favoritar(p) {
    p = p || {}; PerfisCPT.exigirConfiguracao(this.ctx.perfil, 'O álbum');
    const fileId = String(p.fileId || ''); if (!/^[\w-]{10,80}$/.test(fileId)) throw new Error('Foto inválida.');
    const id = this.id(fileId), antigo = this.col.obter(id), ja = this.col.porOperacao(p.operacaoId);
    if (ja) return this.depois(ja, p.mes);
    const ativo = p.ativo === true;
    if (!ativo) {
      if (!antigo || !antigo.ativo) throw new Error('Essa foto já não está nas suas favoritas.');
      return this.depois(this.col.gravar({...antigo, ativo: false}, antigo.versao, p.operacaoId, id), p.mes);
    }
    if (antigo && antigo.ativo) throw new Error('Essa foto já está nas suas favoritas.');
    if (this.usadasHoje() >= AlbumCPT.porDia) throw new Error('Você já escolheu ' + AlbumCPT.porDia + ' favoritas hoje. Amanhã tem mais!');
    const mes = String(p.mes || ''), foto = /^\d{4}-(0[1-9]|1[0-2])$/.test(mes) ? this.fotos(mes).find(f => f.fileId === fileId) : null;
    if (!foto) throw new Error('Essa foto não está na galeria do mês. Atualize a página.');
    return this.depois(this.col.gravar({...foto, ativo: true, dia: this.hoje}, antigo ? antigo.versao : 0, p.operacaoId, id), mes);
  }
  depois(e, mes) {
    const g = this.agrupar(this.ativos().filter(x => x.fileId === e.fileId))[0];
    return {resultado: e.ativo ? 'Foto no álbum da equipe! ❤' : 'Foto tirada das suas favoritas.', fileId: e.fileId, meu: !!e.ativo, coracoes: g ? g.coracoes : 0,
      usadasHoje: this.usadasHoje(), minhas: this.meus().length, mes};
  }
}

function carregarAlbumCPT(p) { return ColecaoCPT.executar('album.carregar', ctx => new AlbumCPT(ctx).carregar(p)); }
function miniaturasAlbumCPT(p) { return ColecaoCPT.executar('album.miniaturas', ctx => new AlbumCPT(ctx).miniaturas(p)); }
function favoritarAlbumCPT(p) { return ColecaoCPT.executar('album.favoritar', ctx => new AlbumCPT(ctx).favoritar(p), true); }

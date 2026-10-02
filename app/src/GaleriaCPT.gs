/**
 * GaleriaCPT 2.8.0. Galeria de imagens do mês para Comunicação, Socioambiental e Gestão.
 * - Fotos e vídeos enviados nos registros do formulário (lidos dos detalhes das linhas do mês, sob demanda).
 * - Fotos extras: enviadas pela aplicação (do computador ou por link do Drive), numa pasta própria, com data,
 *   atividade, local e legenda no padrão do relatório. Nunca escreve no RDAS nem nos registros.
 * - Exportar: pacote .zip de até 15 imagens (20 MB), só de arquivos que aparecem na galeria do mês.
 * As miniaturas carregam no navegador de quem vê (precisa de leitura na pasta: ver Conectores e pastas).
 */
class GaleriaCPT {
  static pode(p) { return PerfisCPT.gerencia(p) || p.papeis.some(x => ['comunicacao', 'socioambiental'].includes(x)); }
  constructor(ctx) {
    if (!GaleriaCPT.pode(ctx.perfil)) throw new Error('A galeria é da Comunicação, do Socioambiental e da Gestão.');
    this.ctx = ctx; this.dados = new DadosDaAplicacao(ctx.base, ctx.perfil); this.col = new ColecaoCPT(ctx, 'Mídias extras', 'MID');
  }
  static legenda(data, atividade, local) { return [RelatorioMensalCPT.br(data), atividade, local].filter(Boolean).join(' - '); }
  static ids(texto) { return (String(texto || '').match(/https:\/\/[^\s,;"]+/g) || []).map(u => (u.match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{20,})/) || [])[1]).filter(Boolean); }
  listar(mes, atualizar) {
    this.dados.mes(mes);
    const a = this.dados.registros(), chave = 'galeria:' + this.ctx.base.getId() + ':' + mes + ':' + a.getLastRow();
    const doFormulario = CacheCPT.obter(chave, 3600, () => this.doFormulario(a, mes), atualizar === true);
    const extras = this.col.itens().filter(x => !x.arquivado && String(x.data).slice(0, 7) === mes).map(x => ({fileId: x.fileId, data: x.data, atividade: x.atividade, local: x.local, legenda: x.legenda,
      responsavel: x.nomeAutor || x.criadoPor, video: x.video, origem: 'Extra', id: x.id}));
    const itens = extras.concat(doFormulario).sort((x, y) => y.data.localeCompare(x.data));
    return {mes, itens, pasta: this.pastaUrl(), podeEnviar: true};
  }
  /** Lê só a coluna de detalhes das linhas do mês (faixas contínuas) e extrai os arquivos das perguntas de foto/vídeo. */
  doFormulario(a, mes) {
    const base = this.dados.ler(a, 14), idx = []; base.forEach((r, i) => { if (r[0] && this.dados.mesCelula(r[3]) === mes) idx.push(i); });
    const out = [], vistos = new Set();
    for (let i = 0; i < idx.length;) {
      let j = i; while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++;
      const v = a.getRange(idx[i] + 2, 21, idx[j] - idx[i] + 1, 1).getValues();
      v.forEach((x, k) => {
        const r = base[idx[i] + k]; let d; try { d = JSON.parse(x[0] || '{}'); } catch (_) { return; } d = d.conteudo || d;
        const campos = (d.campos || []).filter(c => c.tipo === 'FILE_UPLOAD' || /foto|imagem|video/.test(DadosDaAplicacao.norm(c.titulo)));
        const data = this.dados.data(r[2]), atividade = String(r[13] || r[1]), local = String(r[7] || '');
        campos.forEach(c => (Array.isArray(c.valor) ? c.valor : [c.valor]).forEach(val => GaleriaCPT.ids(val).forEach(id => {
          if (vistos.has(id)) return; vistos.add(id);
          out.push({fileId: id, data, atividade, local, legenda: GaleriaCPT.legenda(data, atividade, local), responsavel: String(r[11] || ''), video: /video/.test(DadosDaAplicacao.norm(c.titulo)), origem: 'Registro', registro: String(r[0])});
        })));
      });
      i = j + 1;
    }
    return out;
  }
  pasta() {
    const props = PropertiesService.getScriptProperties(), c = AplicacaoCPT.config();
    if (c.pastaExtrasId) { try { return DriveApp.getFolderById(c.pastaExtrasId); } catch (_) {} }
    const f = DriveApp.createFolder('CPT • Comunicação – Fotos extras'); c.pastaExtrasId = f.getId(); props.setProperty(AplicacaoCPT.chave, JSON.stringify(c)); return f;
  }
  pastaUrl() { const c = AplicacaoCPT.config(); return c.pastaExtrasId ? 'https://drive.google.com/drive/folders/' + c.pastaExtrasId : ''; }
  /** Uma foto por chamada. Se a conexão cair depois de criar o arquivo, repetir a mesma operação não cria outro. */
  enviar(p) {
    p = p || {}; const T = ColecaoCPT.texto, data = ColecaoCPT.data(p.data, 'data da atividade', true), atividade = T(p.atividade, 200, 'atividade', true), local = T(p.local, 200, 'local');
    if (typeof p.operacaoId !== 'string' || !/^OP-[\w-]{8,70}$/.test(p.operacaoId)) throw new Error('Operação inválida. Recarregue a página.');
    const ja = this.col.porOperacao(p.operacaoId);
    if (ja) return {resultado: 'Foto já estava guardada na galeria.', item: {...ja, origem: 'Extra', responsavel: ja.nomeAutor}};
    const props = PropertiesService.getScriptProperties(), pendente = 'CPT_ENVIO_' + p.operacaoId;
    let file = null, salvo = props.getProperty(pendente);
    if (salvo) file = DriveApp.getFileById(salvo);
    else if (p.link) {
      const id = GaleriaCPT.ids(p.link)[0]; if (!id) throw new Error('Cole o link de uma foto ou vídeo do Google Drive.');
      try { file = DriveApp.getFileById(id); } catch (_) { throw new Error('A aplicação não consegue abrir esse arquivo. Compartilhe com a conta da aplicação ou envie do computador.'); }
      if (!/^(image|video)\//.test(file.getMimeType())) throw new Error('O link precisa ser de uma foto ou de um vídeo.');
    } else {
      if (!/^image\/(jpeg|png|webp)$/.test(p.mime || '')) throw new Error('Envie fotos em JPG, PNG ou WEBP. Vídeos: envie ao Drive e cole o link.');
      if (typeof p.base64 !== 'string' || p.base64.length > 11200000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(p.base64)) throw new Error('Foto inválida ou acima de 8 MB.');
      const bytes = Utilities.base64Decode(p.base64); if (!bytes.length || bytes.length > 8388608) throw new Error('Use fotos de até 8 MB.');
      const nome = (data + ' - ' + atividade + (local ? ' - ' + local : '')).replace(/[\\/:*?"<>|]/g, ' ').slice(0, 150) + '.' + p.mime.split('/')[1].replace('jpeg', 'jpg');
      file = this.pasta().createFile(Utilities.newBlob(bytes, p.mime, nome)); props.setProperty(pendente, file.getId());
    }
    const m = {fileId: file.getId(), data, atividade, local, legenda: T(p.legenda, 300, 'legenda') || GaleriaCPT.legenda(data, atividade, local), video: /^video\//.test(file.getMimeType()), nomeAutor: this.ctx.perfil.nome, arquivado: false};
    const e = this.col.gravar(m, 0, p.operacaoId); props.deleteProperty(pendente);
    return {resultado: 'Foto guardada na galeria.', item: {...m, id: e.id, origem: 'Extra', responsavel: m.nomeAutor}};
  }
  /** Pacote .zip das fotos escolhidas (só as que estão na galeria do mês). */
  pacote(p) {
    p = p || {}; const mes = this.dados.mes(p.mes), ids = Array.isArray(p.ids) ? [...new Set(p.ids)] : [];
    if (!ids.length || ids.length > 15) throw new Error('Escolha de 1 a 15 fotos para baixar.');
    const permitidas = new Map(this.listar(mes).itens.map(x => [x.fileId, x])); let total = 0;
    const blobs = ids.map((id, i) => {
      const it = permitidas.get(id); if (!it) throw new Error('Uma das fotos não pertence à galeria deste mês.');
      const f = DriveApp.getFileById(id); if (!/^image\//.test(f.getMimeType())) throw new Error('Vídeos são baixados pelo Drive (botão Abrir).');
      total += f.getSize(); if (total > 20 * 1024 * 1024) throw new Error('O pacote passou de 20 MB. Escolha menos fotos.');
      const ext = (f.getName().match(/\.\w{2,4}$/) || ['.jpg'])[0];
      return f.getBlob().setName(String(i + 1).padStart(2, '0') + ' - ' + it.legenda.replace(/[\\/:*?"<>|]/g, ' ').slice(0, 120) + ext);
    });
    const zip = Utilities.zip(blobs, 'Fotos ' + mes + '.zip');
    return {nome: 'Fotos ' + mes + '.zip', base64: Utilities.base64Encode(zip.getBytes()), legendas: ids.map((id, i) => String(i + 1).padStart(2, '0') + ' - ' + permitidas.get(id).legenda).join('\n')};
  }
}

function listarGaleriaCPT(p) { return DesempenhoCPT.medir('galeria.listar', () => new GaleriaCPT(AplicacaoCPT.contexto()).listar(String(p && p.mes || ''), !!(p && p.atualizar))); }
function enviarFotoGaleriaCPT(p) {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(20000)) throw new Error('Outro envio está terminando. Tente esta foto de novo.');
  try { return DesempenhoCPT.medir('galeria.enviar', () => new GaleriaCPT(AplicacaoCPT.contexto()).enviar(p)); } finally { lock.releaseLock(); }
}
function baixarPacoteGaleriaCPT(p) { return DesempenhoCPT.medir('galeria.pacote', () => new GaleriaCPT(AplicacaoCPT.contexto()).pacote(p)); }

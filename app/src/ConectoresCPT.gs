/**
 * ConectoresCPT 2.7.0. Um único lugar para as fontes que ficam FORA da base (planilhas e pastas oficiais).
 * Os IDs ficam em Script Properties (CPT_CONECTORES); os valores "padrao" são os do Painel de Gestão 3.2 e só valem
 * enquanto nada for configurado. Só a administração técnica altera.
 * A conferência apenas LÊ: não compartilha nem move arquivos. Ela diz quais pastas a equipe precisa enxergar
 * (as fotos abrem no navegador com a conta de cada pessoa, não com a conta do proprietário).
 */
class ConectoresCPT {
  static get chave() { return 'CPT_CONECTORES'; }
  static get catalogo() {
    return [
      {chave: 'rdas', nome: 'RDAS — relatos diários', tipo: 'planilha', padrao: '176BymNYBSfVt7iQrkNR-IyT_NXdB9GC999mX9C2WtK4',
        uso: 'Continua uma planilha à parte, compartilhada com a equipe interna.'},
      {chave: 'central', nome: 'Central CPT 4.0', tipo: 'planilha', padrao: '18Hzcw0amILZBUcy8D952YwJarM6mj16Q8Vg_pei6UmU',
        uso: 'Consulta anterior do projeto (fica como referência).'},
      {chave: 'painelGestao', nome: 'Planilha do Painel de Gestão', tipo: 'planilha', padrao: '1mWROhF6jD4G9lz4PkSWGb6lSLO05SJMJwH8sJHqRYek',
        uso: 'Painel anterior da gestão. As visões dele agora estão na aplicação (Painel da gestão).'},
      {chave: 'contrato', nome: 'Planilha de controle do contrato', tipo: 'planilha', padrao: '1pQJ5B8wRzsdlU8udlh9ZzcWXozT3BOh4', aba: 733716505,
        uso: 'Preenchida 100% à mão pela Gestão, todo mês. A aplicação só abre o link e lembra (Visão do mês · Contrato); nunca escreve nela.'}
    ];
  }
  static salvos() { try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(this.chave) || '{}') || {}; } catch (_) { return {}; } }
  static item(chave) { const c = this.catalogo.find(x => x.chave === chave); if (!c) throw new Error('Conector desconhecido.'); return c; }
  /** ID configurado ou o padrão conhecido. */
  static id(chave) { const s = this.salvos()[chave]; return s && s.id ? s.id : this.item(chave).padrao; }
  static url(tipo, id) { return tipo === 'pasta' ? 'https://drive.google.com/drive/folders/' + id : 'https://docs.google.com/spreadsheets/d/' + id + '/edit'; }
  static acesso(arquivo) {
    try {
      const a = String(arquivo.getSharingAccess()), p = String(arquivo.getSharingPermission());
      if (/DOMAIN/.test(a)) return {equipeVe: /VIEW|COMMENT|EDIT/.test(p), texto: 'Compartilhada com o domínio (' + (/EDIT/.test(p) ? 'edição' : 'leitura') + ')'};
      if (/ANYONE/.test(a)) return {equipeVe: true, texto: 'Aberta para quem tiver o link'};
      const pessoas = arquivo.getViewers().length + arquivo.getEditors().length;
      return {equipeVe: false, texto: pessoas ? 'Restrita a ' + pessoas + ' pessoa(s)' : 'Só o proprietário'};
    } catch (_) { return {equipeVe: null, texto: 'Não foi possível ler o compartilhamento'}; }
  }
  constructor(ctx) { this.ctx = ctx; }

  /** Abre cada conector, mostra o nome real e o compartilhamento. */
  conferir() {
    PerfisCPT.admin(this.ctx.perfil);
    const salvos = ConectoresCPT.salvos();
    const conectores = ConectoresCPT.catalogo.map(c => {
      const id = ConectoresCPT.id(c.chave), r = {chave: c.chave, nome: c.nome, tipo: c.tipo, uso: c.uso, id, configurado: !!(salvos[c.chave] && salvos[c.chave].id), url: ConectoresCPT.url(c.tipo, id)};
      try {
        const f = c.tipo === 'pasta' ? DriveApp.getFolderById(id) : DriveApp.getFileById(id);
        r.titulo = f.getName(); r.ok = true; r.compartilhamento = ConectoresCPT.acesso(f).texto;
        if (c.tipo === 'planilha' && f.getMimeType && f.getMimeType() !== MimeType.GOOGLE_SHEETS) { r.ok = false; r.erro = 'O arquivo é ' + f.getMimeType() + '. Abra no Drive e use Arquivo > Salvar como Planilhas Google; depois informe o novo ID aqui.'; }
      } catch (e) { r.ok = false; r.erro = 'Sem acesso ou arquivo inexistente para a conta proprietária (' + e.message + ').'; }
      return r;
    });
    return {conectores, pastas: this.pastasParaCompartilhar(), travada: PerfisCPT.travada()};
  }
  /**
   * Pastas que a equipe precisa enxergar: onde o formulário guarda as fotos (amostra dos registros recentes)
   * e a pasta com o que a aplicação gerou até a 2.26 (relatórios, anexos e fichas).
   */
  pastasParaCompartilhar() {
    const out = new Map(), anotar = (pasta, motivo) => {
      if (!pasta) return; const id = pasta.getId(); if (out.has(id)) { out.get(id).arquivos++; return; }
      out.set(id, {id, nome: pasta.getName(), url: ConectoresCPT.url('pasta', id), motivo, arquivos: 1, ...ConectoresCPT.acesso(pasta)});
    };
    try {
      const a = this.ctx.base.getSheetByName('Registros'), n = a ? a.getLastRow() - 1 : 0;
      if (n > 0) {
        const qtd = Math.min(60, n), linhas = a.getRange(n - qtd + 2, 21, qtd, 1).getValues(), ids = new Set();
        linhas.forEach(r => { (String(r[0]).match(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{25,})/g) || []).forEach(m => ids.add(m.replace(/^.*(?:\/d\/|[?&]id=)/, ''))); });
        [...ids].slice(0, 25).forEach(id => {
          try { const it = DriveApp.getFileById(id).getParents(); if (it.hasNext()) { const p = it.next(); anotar(p, 'Fotos e arquivos enviados pelo formulário'); const avo = p.getParents(); if (avo.hasNext()) anotar(avo.next(), 'Pasta de respostas do formulário (contém a pasta de fotos)'); } } catch (_) {}
        });
      }
    } catch (_) {}
    try { const c = AplicacaoCPT.config(); if (c.pastaEntregasId) anotar(DriveApp.getFolderById(c.pastaEntregasId), 'Arquivo: relatórios, anexos e fichas gerados pela aplicação até a 2.26'); } catch (_) {}
    try { const c = AplicacaoCPT.config(); if (c.pastaExtrasId) anotar(DriveApp.getFolderById(c.pastaExtrasId), 'Fotos extras enviadas pela Comunicação na galeria'); } catch (_) {}
    return [...out.values()];
  }
  configurar(p) {
    PerfisCPT.admin(this.ctx.perfil);
    const c = ConectoresCPT.item(String(p && p.chave || '')), id = String(p && p.id || '').trim().replace(/^.*\/(?:d|folders)\/([A-Za-z0-9_-]+).*$/, '$1');
    if (!/^[A-Za-z0-9_-]{20,80}$/.test(id)) throw new Error('Cole o link ou o ID do arquivo/pasta do Google Drive.');
    try { (c.tipo === 'pasta' ? DriveApp.getFolderById(id) : DriveApp.getFileById(id)).getName(); }
    catch (_) { throw new Error('A conta proprietária não abre esse ' + (c.tipo === 'pasta' ? 'pasta' : 'arquivo') + '. Confira o link e o compartilhamento.'); }
    const s = ConectoresCPT.salvos(); s[c.chave] = {id, em: new Date().toISOString(), por: this.ctx.email};
    PropertiesService.getScriptProperties().setProperty(ConectoresCPT.chave, JSON.stringify(s));
    return {resultado: c.nome + ' atualizado.'};
  }
}

function conferirConectoresCPT() { return DesempenhoCPT.medir('conectores.conferir', () => new ConectoresCPT(AplicacaoCPT.contexto()).conferir()); }
function configurarConectorCPT(p) { return DesempenhoCPT.medir('conectores.configurar', () => new ConectoresCPT(AplicacaoCPT.identidade()).configurar(p)); }

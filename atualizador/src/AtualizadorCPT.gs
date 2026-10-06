/**
 * AtualizadorCPT 1.0.0 — projeto SEPARADO ("CPT • Atualizador"). Acaba com o copiar e colar.
 * Lê os arquivos do GitHub (VectorHFX/ProjetoControleSaneamento) e atualiza, pela API do Apps Script:
 *   - Aplicação CPT  ← app/src/      (e publica a nova versão no MESMO link /exec)
 *   - Campo 4.0      ← campo40/src/  (mantém o appsscript.json atual do projeto)
 * Segurança:
 *   - Antes de mudar, cria uma VERSÃO de segurança do projeto (Gerenciar implantações / Versões mostram).
 *   - Arquivos que só existem no Google são mantidos, exceto os APOSENTADOS de cada projeto (lista fixa abaixo),
 *     que saíram da aplicação de propósito e não podem continuar funcionando no Google (ex.: o fechamento do relatório na 2.27).
 *   - conferirAtualizacaoCPT() só mostra o que mudaria; nada é alterado.
 * Pré-requisitos (uma vez): API do Apps Script ligada em script.google.com/home/usersettings,
 * e um token de leitura do GitHub. Veja docs/ATUALIZACAO_AUTOMATICA.md.
 */
class AtualizadorCPT {
  static get REPO() { return 'VectorHFX/ProjetoControleSaneamento'; }
  static get PROP() { return 'CPT_ATUALIZADOR'; }
  static get projetos() {
    return {
      aplicacao: {nome: 'Aplicação CPT', pasta: 'app/src', scriptId: '1B2gVRbnDP9E4tdecW7lknY5Wq8QlRbmjXXenx-8cOPQX0wBmePmWUhML', publicar: true,
        // 2.27: fechamento do relatório retirado da aplicação (base do relatório, anexos, entregas do mês, Programa Parceiros, mesa).
        aposentados: ['RelatorioMensalCPT', 'EntregasDoMesCPT', 'AnexosRelatorioCPT', 'ProgramaParceirosCPT', 'EntregasCPT', 'Fechamento', 'Socioambiental', 'Entregas', 'AlbumCPT', 'Album']},
      campo40: {nome: 'Campo 4.0', pasta: 'campo40/src', scriptId: '', publicar: false}
    };
  }
  static config() {
    const c = JSON.parse(PropertiesService.getScriptProperties().getProperty(this.PROP) || '{}');
    if (!c.token) throw new Error('Falta o token do GitHub. Execute configurarAtualizadorCPT (veja o passo a passo).');
    return Object.assign({ramo: 'claude/keen-hamilton-pvmxi2'}, c);
  }

  // ---------- GitHub ----------
  static github(caminho, c, bruto) {
    const r = UrlFetchApp.fetch('https://api.github.com/repos/' + this.REPO + '/' + caminho, {muteHttpExceptions: true,
      headers: {Authorization: 'Bearer ' + c.token, Accept: bruto ? 'application/vnd.github.raw' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}});
    const code = r.getResponseCode();
    if (code === 401 || code === 403) throw new Error('O GitHub recusou o token (' + code + '). Gere um novo token com leitura do repositório.');
    if (code === 404) throw new Error('Não encontrado no GitHub: ' + caminho + '. Confira o ramo "' + c.ramo + '".');
    if (code >= 300) throw new Error('GitHub respondeu ' + code + ': ' + r.getContentText().slice(0, 200));
    return bruto ? r.getContentText('UTF-8') : JSON.parse(r.getContentText('UTF-8'));
  }
  /** Arquivos da pasta no formato da API do Apps Script. */
  static arquivosDoGitHub(pasta, c) {
    const ref = '?ref=' + encodeURIComponent(c.ramo);
    return this.github('contents/' + pasta + ref, c).filter(f => f.type === 'file' && /\.(gs|html|json)$/.test(f.name)).map(f => {
      const ext = f.name.split('.').pop(), nome = f.name.replace(/\.(gs|html|json)$/, '');
      return {name: nome, type: ext === 'gs' ? 'SERVER_JS' : ext === 'html' ? 'HTML' : 'JSON', source: this.github('contents/' + pasta + '/' + encodeURIComponent(f.name) + ref, c, true)};
    }).filter(f => f.type !== 'JSON' || f.name === 'appsscript');
  }
  static ultimosCommits(c) {
    try { return this.github('commits?per_page=5&sha=' + encodeURIComponent(c.ramo), c).map(x => x.commit.message.split('\n')[0] + ' (' + x.sha.slice(0, 7) + ')'); }
    catch (_) { return []; }
  }

  // ---------- Apps Script API ----------
  static api(metodo, caminho, corpo) {
    const r = UrlFetchApp.fetch('https://script.googleapis.com/v1/' + caminho, {method: metodo, muteHttpExceptions: true, contentType: 'application/json',
      headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()}, payload: corpo ? JSON.stringify(corpo) : undefined});
    const code = r.getResponseCode(), texto = r.getContentText();
    if (code === 403 && /has not been used in project|SERVICE_DISABLED|accessNotConfigured/i.test(texto)) {
      const proj = (texto.match(/project (\d+)/) || [])[1] || '';
      throw new Error('A API do Apps Script não está ativada no projeto do Google Cloud deste script' + (proj ? ' (nº ' + proj + ')' : '') + '. Ligue o Atualizador a um projeto do Google Cloud com a API ativada: veja docs/ATUALIZACAO_AUTOMATICA.md, passo 3B.');
    }
    if (code === 403 && /User has not enabled the Apps Script API/i.test(texto)) throw new Error('A API do Apps Script está desligada na sua conta. Ligue em https://script.google.com/home/usersettings e tente de novo.');
    if (code === 403 && /ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficient authentication scopes/i.test(texto)) throw new Error('Falta permissão para gerenciar projetos. No Atualizador: ⚙️ Configurações → marque "Mostrar o arquivo de manifesto appsscript.json"; substitua o appsscript.json pelo do GitHub (atualizador/src/appsscript.json), salve e execute configurarAtualizadorCPT de novo para autorizar.');
    if (code >= 300) throw new Error('Apps Script API respondeu ' + code + ': ' + texto.slice(0, 300));
    return texto ? JSON.parse(texto) : {};
  }

  /** Junta o que está no Google com o que veio do GitHub. GitHub vence; arquivos só do Google ficam, menos os aposentados. */
  static mesclar(atuais, novos, manterManifesto, aposentados) {
    const sair = new Set((aposentados || []).filter(n => !novos.some(f => f.name === n))), removidos = atuais.filter(f => sair.has(f.name)).map(f => f.name);
    const porNome = new Map(atuais.filter(f => !sair.has(f.name)).map(f => [f.name, {name: f.name, type: f.type, source: f.source}])), mudou = [], novosNomes = [];
    novos.forEach(f => {
      if (manterManifesto && f.name === 'appsscript') return;
      const a = porNome.get(f.name);
      if (!a) novosNomes.push(f.name); else if (a.source !== f.source || a.type !== f.type) mudou.push(f.name);
      porNome.set(f.name, {name: f.name, type: f.type, source: f.source});
    });
    const soNoGoogle = atuais.filter(f => !sair.has(f.name) && !novos.some(n => n.name === f.name)).map(f => f.name);
    // O manifesto precisa existir e vir primeiro.
    const files = [...porNome.values()].sort((a, b) => (a.name === 'appsscript' ? -1 : b.name === 'appsscript' ? 1 : 0));
    return {files, mudou, novos: novosNomes, soNoGoogle, removidos};
  }

  static plano(chave, c) {
    const p = this.projetos[chave], scriptId = (c.scriptIds || {})[chave] || p.scriptId;
    if (!scriptId) throw new Error('Falta o ID do projeto ' + p.nome + '. Execute configurarAtualizadorCPT com o ID (Configurações do projeto → IDs).');
    const atuais = this.api('get', 'projects/' + scriptId + '/content').files || [];
    const m = this.mesclar(atuais, this.arquivosDoGitHub(p.pasta, c), !p.publicar, p.aposentados);
    return {chave, nome: p.nome, scriptId, ...m};
  }

  static aplicar(chave, c) {
    const pl = this.plano(chave, c), p = this.projetos[chave];
    if (!pl.mudou.length && !pl.novos.length && !pl.removidos.length) return {projeto: pl.nome, resultado: 'Já estava atualizado.'};
    const quando = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm');
    const seguranca = this.api('post', 'projects/' + pl.scriptId + '/versions', {description: 'Segurança antes da atualização de ' + quando});
    this.api('put', 'projects/' + pl.scriptId + '/content', {scriptId: pl.scriptId, files: pl.files});
    const saida = {projeto: pl.nome, alterados: pl.mudou, criados: pl.novos, removidos: pl.removidos, mantidosSoNoGoogle: pl.soNoGoogle, versaoDeSeguranca: seguranca.versionNumber};
    if (p.publicar) {
      const nova = this.api('post', 'projects/' + pl.scriptId + '/versions', {description: 'Atualização do GitHub (' + c.ramo + ') em ' + quando});
      const imps = (this.api('get', 'projects/' + pl.scriptId + '/deployments').deployments || [])
        .filter(d => d.deploymentConfig && d.deploymentConfig.versionNumber && (d.entryPoints || []).some(e => e.entryPointType === 'WEB_APP'));
      if (!imps.length) saida.publicacao = 'Nenhuma implantação de aplicativo da Web encontrada: publique manualmente uma vez.';
      imps.forEach(d => this.api('put', 'projects/' + pl.scriptId + '/deployments/' + d.deploymentId, {deploymentConfig: {scriptId: pl.scriptId, versionNumber: nova.versionNumber, manifestFileName: 'appsscript', description: 'Versão ' + nova.versionNumber + ' · ' + quando}}));
      if (imps.length) saida.publicacao = 'Link /exec atualizado para a versão ' + nova.versionNumber + ' (' + imps.length + ' implantação).';
    }
    return saida;
  }
}

function configuracaoAtualizador_(alterar) {
  const props = PropertiesService.getScriptProperties(), c = JSON.parse(props.getProperty(AtualizadorCPT.PROP) || '{}');
  alterar(c); props.setProperty(AtualizadorCPT.PROP, JSON.stringify(c)); return c;
}
/**
 * EXECUTE UMA VEZ depois de editar as três linhas abaixo (o token não fica no código depois de salvo:
 * apague o valor das linhas e salve de novo; ele fica guardado nas propriedades do projeto).
 */
function configurarAtualizadorCPT() {
  const TOKEN_GITHUB = '';          // cole aqui o token (começa com github_pat_)
  const ID_PROJETO_CAMPO40 = '';    // Campo 4.0 → Configurações do projeto → ID do script
  const RAMO = '';                  // deixe vazio para usar o ramo atual de trabalho
  const c = configuracaoAtualizador_(c => {
    if (TOKEN_GITHUB) c.token = TOKEN_GITHUB.trim();
    if (ID_PROJETO_CAMPO40) c.scriptIds = Object.assign(c.scriptIds || {}, {campo40: ID_PROJETO_CAMPO40.trim()});
    if (RAMO) c.ramo = RAMO.trim();
  });
  const r = {resultado: 'ATUALIZADOR CONFIGURADO', token: c.token ? 'guardado' : 'FALTANDO', campo40: (c.scriptIds || {}).campo40 ? 'ok' : 'FALTANDO', ramo: c.ramo || 'claude/keen-hamilton-pvmxi2',
    proximoPasso: 'Apague o token das linhas acima e salve. Depois execute conferirAtualizacaoCPT.'};
  console.log(JSON.stringify(r, null, 2)); return r;
}
/** EXECUTE para ver o que mudaria. Não altera nada. */
function conferirAtualizacaoCPT() {
  const c = AtualizadorCPT.config(), saida = {ramo: c.ramo, ultimasMudancasNoGitHub: AtualizadorCPT.ultimosCommits(c), projetos: []};
  Object.keys(AtualizadorCPT.projetos).forEach(k => {
    try { const p = AtualizadorCPT.plano(k, c); saida.projetos.push({projeto: p.nome, alterar: p.mudou, criar: p.novos, remover: p.removidos, manterSoNoGoogle: p.soNoGoogle}); }
    catch (e) { saida.projetos.push({projeto: AtualizadorCPT.projetos[k].nome, erro: e.message}); }
  });
  console.log(JSON.stringify(saida, null, 2)); return saida;
}
/** EXECUTE para atualizar os dois projetos e publicar a Aplicação no mesmo link. */
function atualizarTudoCPT() {
  const c = AtualizadorCPT.config(), saida = {ramo: c.ramo, ultimasMudancasNoGitHub: AtualizadorCPT.ultimosCommits(c), resultados: []};
  Object.keys(AtualizadorCPT.projetos).forEach(k => {
    try { saida.resultados.push(AtualizadorCPT.aplicar(k, c)); }
    catch (e) { saida.resultados.push({projeto: AtualizadorCPT.projetos[k].nome, erro: e.message}); }
  });
  saida.lembrete = 'Se a mudança pedir uma função de instalação (o guia avisa), execute-a no projeto correspondente.';
  console.log(JSON.stringify(saida, null, 2)); return saida;
}
function atualizarSoAplicacaoCPT() { const r = AtualizadorCPT.aplicar('aplicacao', AtualizadorCPT.config()); console.log(JSON.stringify(r, null, 2)); return r; }
function atualizarSoCampo40CPT() { const r = AtualizadorCPT.aplicar('campo40', AtualizadorCPT.config()); console.log(JSON.stringify(r, null, 2)); return r; }

/** DesempenhoCPT 2.0.0: mede operações e confere volume, sem criar abas ou gatilhos. */
class DesempenhoCPT {
  static medir(operacao, executar) {
    const inicio = Date.now();
    try {
      const resultado = executar();
      const tempoServidorMs = Date.now() - inicio;
      // Caracteres serializados, não bytes. Nunca registra o conteúdo ou a identidade.
      const caracteres = JSON.stringify(resultado || {}).length;
      console.log(JSON.stringify({tipo:'CPT_METRICA',versao:VERSAO_CPT,operacao,
        tempoServidorMs,caracteres,resultado:'ok',revisar:tempoServidorMs>4000||caracteres>250000}));
      return JSON.parse(JSON.stringify({...resultado,tempoServidorMs}));
    } catch (erro) {
      console.log(JSON.stringify({tipo:'CPT_METRICA',versao:VERSAO_CPT,operacao,
        tempoServidorMs:Date.now()-inicio,resultado:'erro'}));
      throw erro;
    }
  }
  static volume(nome,quantidade,unidade,limiar,acao) {
    return {nome,quantidade,unidade,orientacao:quantidade>=limiar?acao:
      'Abaixo do ponto de revisão definido para este projeto. Acompanhe também o tempo das consultas.'};
  }
}
/** Somente administradores; lê contagens, sem varrer os conteúdos das fichas. */
function conferirSaudeCPT() {
  return DesempenhoCPT.medir('administracao.saude',()=>{
    const c=AplicacaoCPT.contexto();PerfisCPT.admin(c.perfil);
    const itens=[];
    for(const [aba,limiar] of [['Registros',10000],['Atendimentos',3000]]) {
      const s=c.base.getSheetByName(aba);if(!s)throw new Error('Tabela não encontrada: '+aba);
      itens.push(DesempenhoCPT.volume(aba,Math.max(0,s.getLastRow()-1),'linhas',limiar,
        'Planejar índices por mês e obra antes de ampliar as consultas. Este alerta não interrompe o uso.'));
    }
    const a=new CronogramaCPT(c).aba();
    itens.push(DesempenhoCPT.volume('Histórico da agenda',Math.max(0,a.getLastRow()-1),'revisões',5000,
      'Separar estado atual e histórico com migração validada. A agenda ainda lê todas as revisões.'));
    const propriedades=PropertiesService.getScriptProperties().getProperties();
    const tamanho=Object.values(propriedades).reduce((n,v)=>n+String(v).length,0);
    itens.push(DesempenhoCPT.volume('Configurações e histórico de acessos',tamanho,'caracteres',150000,
      'Migrar o histórico de acessos para um repositório próprio antes de novos cadastros em massa.'));
    // 2.37: coleções (histórico × retrato do estado atual) e índice dos relatos, na planilha de dados da aplicação.
    try{
      const ss=planilhaCPT_(c.config.agendaId),props=PropertiesService.getScriptProperties();
      ss.getSheets().forEach(sh=>{const nome=sh.getName();if(/ · atual$|^Índice dos relatos/.test(nome)||nome==='Eventos'||sh.getLastRow()<1)return; // Eventos = histórico da agenda (já tem linha própria)
        const cab=sh.getRange(1,1,1,6).getValues()[0];if(cab.join('|')!==ColecaoCPT.cabecalho.join('|'))return;
        const rev=Math.max(0,sh.getLastRow()-1),r=new ColecaoCPT(c,nome,'X').retrato(),cauda=r&&r.ate<=sh.getLastRow()?sh.getLastRow()-r.ate:rev;
        itens.push({nome:'Coleção · '+nome,quantidade:rev,unidade:'revisões',orientacao:r?'Leitura rápida: '+r.n+' itens no retrato + '+cauda+' revisões novas (o retrato é refeito sozinho a cada '+ColecaoCPT.limiteCauda+').':
          (rev>ColecaoCPT.limiteCauda?'O retrato do estado atual será criado na próxima gravação desta coleção.':'Pequena: lê tudo, sem retrato.')});});
      const indices=ss.getSheets().filter(sh=>/^Índice dos relatos · /.test(sh.getName())).map(sh=>sh.getName().slice(-7)).sort();
      itens.push({nome:'Índice dos relatos',quantidade:indices.length,unidade:'meses',orientacao:indices.length?'Meses com índice: '+indices.slice(-6).join(', ')+(indices.length>6?'…':'')+'. Pode apagar uma aba de índice: ela se refaz sozinha.':'Será criado ao abrir os relatos de um mês.'});
    }catch(e){itens.push({nome:'Coleções',quantidade:0,unidade:'',orientacao:'Não foi possível conferir: '+e.message});}
    return {itens,observacao:'Pontos de revisão do projeto, não limites oficiais do Google.'};
  });
}

/**
 * 2.37: aquecimento (opcional). Rodando por um gatilho de tempo, deixa prontos no cache os números do mês, os relatos (e o
 * índice dos relatos), o painel da gestão, os alertas e o cronograma — a primeira pessoa depois de cada registro novo não
 * espera o cálculo. Fora das 6h às 21h não faz nada. Não cria gatilho sozinho (não pede permissão nova): para ligar,
 * no editor do Apps Script → Acionadores → Adicionar acionador → função aquecerCPT → Baseado no tempo → A cada 10 minutos.
 * Para desligar, apague o acionador. Cada passo é independente: uma falha não impede os outros.
 */
function aquecerCPT() {
  const hora = Number(Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'H'));
  if (hora < 6 || hora >= 21) return {resultado: 'FORA DO HORÁRIO'};
  return DesempenhoCPT.medir('aquecimento', () => {
    const ctx = AplicacaoCPT.contexto(), mes = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM'), feitos = [], falhas = [];
    const passo = (nome, fn) => { try { fn(); feitos.push(nome); } catch (e) { falhas.push(nome + ': ' + e.message); } };
    const d = new DadosDaAplicacao(ctx.base, ctx.perfil);
    passo('inicio', () => d.inicio(mes, false));
    passo('relatos', () => PaineisGestaoCPT.relatosDoMes(d, ctx, mes));
    passo('painel', () => new PaineisGestaoCPT(ctx).carregar(mes, false));
    passo('alertas', () => new AlertasGestaoCPT(ctx).listar());
    passo('cronograma', () => new CronogramaCPT(ctx).atuaisLeitura());
    return {resultado: falhas.length ? 'AQUECIDO COM FALHAS' : 'AQUECIDO', feitos, falhas};
  });
}

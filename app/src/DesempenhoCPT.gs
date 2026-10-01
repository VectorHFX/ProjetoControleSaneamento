/** DesempenhoCPT 1.5.0: mede operações e confere volume, sem criar abas ou gatilhos. */
class DesempenhoCPT {
  static medir(operacao, executar) {
    const inicio = Date.now();
    try {
      const resultado = executar();
      const tempoServidorMs = Date.now() - inicio;
      // Caracteres serializados, não bytes. Nunca registra o conteúdo ou a identidade.
      const caracteres = JSON.stringify(resultado || {}).length;
      console.log(JSON.stringify({tipo:'CPT_METRICA',versao:'1.5.0',operacao,
        tempoServidorMs,caracteres,resultado:'ok',revisar:tempoServidorMs>4000||caracteres>250000}));
      return JSON.parse(JSON.stringify({...resultado,tempoServidorMs}));
    } catch (erro) {
      console.log(JSON.stringify({tipo:'CPT_METRICA',versao:'1.5.0',operacao,
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
    return {itens,observacao:'Pontos de revisão do projeto, não limites oficiais do Google.'};
  });
}

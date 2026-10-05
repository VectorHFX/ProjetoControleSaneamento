/**
 * SocioambientalCPT 2.27.0. Classificação das atividades por item (anatomia do relatório nº 13, docs/ANATOMIA_DO_RELATORIO.md).
 * - destino(): em que item cada registro entra; frente(): a frente pela obra de referência.
 * - Usada pela Visão do mês, pelo painel da gestão e pelo mapa para contar "ações socioambientais" sem contar duas vezes.
 * 2.27: a mesa do relatório, os documentos socioambientais e o diagnóstico em modelo oficial saíram da aplicação
 *       (o fechamento do relatório será refeito depois). Regra (02/10): Ação Social Externa e CAO no item 4, por eixo;
 *       DDS, treinamentos e campanhas internas no item 9; tenda no item 7; diagnóstico no item 2; o resto no item 3.
 */
class SocioambientalCPT {
  static get papeis() { return ['administrador', 'administrativo', 'gestao', 'socioambiental', 'comunicacao']; }
  static get itens() {
    return [
      {item: '2', titulo: 'Diagnóstico das áreas de trabalho', tipo: 'diagnostico', legenda: 'dd/mm/aaaa - Endereço - Diagnóstico'},
      {item: '4.1', titulo: 'Reuniões, grupos de discussão e fóruns periódicos', tipo: 'relato', tema: 'reuniões, grupos de discussão e fóruns', legenda: 'dd/mm/aaaa - Evento - Local'},
      {item: '4.2', titulo: 'Ações sob eixo de gestão de resíduos sólidos', tipo: 'relato', tema: 'gestão de resíduos sólidos', legenda: 'dd/mm/aaaa - Evento - Local'},
      {item: '4.3', titulo: 'Ações preventivas às doenças de veiculação hídrica', tipo: 'relato', tema: 'prevenção às doenças de veiculação hídrica', legenda: 'dd/mm/aaaa - Evento - Local'},
      {item: '4.4', titulo: 'Ações de Educação Socioambiental', tipo: 'relato', tema: 'educação socioambiental', legenda: 'dd/mm/aaaa - Evento - Local'},
      {item: '4.5', titulo: 'Governança Colaborativa', tipo: 'relato', tema: 'governança colaborativa', legenda: 'dd/mm/aaaa - Evento - Local'},
      {item: '7', titulo: 'Atividades da Unidade Móvel Socioambiental (UMS)', tipo: 'relato', legenda: 'dd/mm/aaaa - UMS - Local'},
      {item: '9', titulo: 'Atividades Complementares (DDS, treinamentos e campanhas internas)', tipo: 'relato', legenda: 'dd/mm/aaaa - DDS - Tema - Local'},
      {item: '3', titulo: 'Atividades desenvolvidas no período (tabela e fotos por frente)', tipo: 'consolidado', legenda: 'dd/mm/aaaa - Endereço - Atividade'},
      {item: '5', titulo: 'Material audiovisual', tipo: 'consolidado', legenda: ''}
    ];
  }
  static item(codigo) { return SocioambientalCPT.itens.find(x => x.item === codigo) || null; }
  static norm(v) { return DadosDaAplicacao.norm(v); }
  /** Item do relatório. texto = atividade + complemento/tema/ferramenta, para sugerir o eixo. Null: não entra na mesa. */
  static destino(procedimento, atividade, texto) {
    const p = SocioambientalCPT.norm(procedimento), a = SocioambientalCPT.norm(atividade), t = SocioambientalCPT.norm([atividade, texto].join(' '));
    if (/diagnost/.test(p)) return '2';
    if (p !== 'relato de atividade') return null;
    if (/\bcao\b|comissao de acompanhamento/.test(a)) return /lideranc|comerciant|governanc|conselho|comite/.test(t) ? '4.5' : '4.1';
    if (/articulacao/.test(a)) return '4.5';
    if (/acao social externa/.test(a)) {
      if (/residu|oleo|pilha|bateria|recicl|descarte|coleta seletiva|ponto de coleta|lixo/.test(t)) return '4.2';
      if (/dengue|saude|hidric|doenca|higiene|leptosp|verminose|diarreia/.test(t)) return '4.3';
      if (/reuni|forum|roda de conversa|assembl/.test(t)) return '4.1';
      return '4.4';
    }
    if (/\bdds\b|dialogo diario|acao social interna|treinamento|capacitacao|campanha interna|visita tecnica/.test(a)) return '9';
    if (/tenda|\bums\b|unidade movel/.test(t)) return '7';
    if (/captacao/.test(a)) return '5';
    if (/manifestac/.test(a)) return null;
    return '3';
  }
  /** Frente pela obra de referência; "não se aplica" e vazio não contam como frente. */
  static frente(obra) { const s = String(obra || '').replace(/\s*\[OBR-\d+\]\s*$/, '').trim(); return !s || /nao se aplica|^atendimento$/.test(SocioambientalCPT.norm(s)) ? '' : s; }
}

// Revisão 2026-09-10: otimização do mapeamento atual; demais rotinas preservadas.
/**
 * PROCEDIMENTOS DE CAMPO: INTEGRAÇÃO DAS VERSÕES 1.0, 2.0 E 3.0
 *
 * Fonte atual: aba vinculada ao Google Forms.
 * Fonte histórica 1.0: aba importada como "Importação Bruta 1.0"
 * ou com o nome original "Form responses 1".
 * Fonte histórica 2.0: "Importação Histórica 2.0".
 * Destino único dos demonstrativos: "Base Consolidada".
 *
 * A aba vinculada ao Forms nunca é alterada.
 * O código não usa fórmulas e não depende do separador regional.
 */
const CONFIG_INTEGRACAO = {
  ABAS_RESPOSTAS_ATUAIS: ['Respostas ao formulário 1', 'Form Responses 1'],
  ABAS_BRUTAS_1_0: ['Importação Bruta 1.0', 'Form responses 1'],
  ABA_IMPORTACAO_1_0: 'Importação Histórica 1.0',
  ABA_IMPORTACAO_2_0: 'Importação Histórica 2.0',
  ABA_BASE: 'Base Consolidada',
  ABA_AUDITORIA_1_0: 'Auditoria Migração 1.0',
  ABA_RESUMO: 'Resumo Integração 1.0 e 3.0',
  METADADOS: [
    'Origem do registro',
    'ID de migração',
    'Linha na origem',
    'E-mail do envio',
    'Validação',
    'Mês de referência',
    'Observação da migração'
  ],
  VALIDACOES_ACEITAS: ['Válido para consolidação', 'Registro atual preservado'],
  ABAS_TECNICAS: [
    'Importação Bruta 1.0',
    'Form responses 1',
    'Importação Histórica 1.0',
    'Importação Histórica 2.0',
    'Auditoria Migração 1.0',
    'Resumo Integração 1.0 e 3.0',
    'Base Consolidada'
  ]
};

function instalarIntegracaoProcedimentos1e3() {
  removerGatilhosIntegracao_(false);
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();

  ScriptApp.newTrigger('aoAbrirIntegracaoProcedimentos')
    .forSpreadsheet(arquivo)
    .onOpen()
    .create();

  ScriptApp.newTrigger('aoEnviarFormularioIntegracaoProcedimentos')
    .forSpreadsheet(arquivo)
    .onFormSubmit()
    .create();

  sincronizarBaseEProdutosProcedimentos();
  criarMenuIntegracaoProcedimentos_();
  avisarIntegracao_('Integração instalada e Base Consolidada atualizada.', 'Integração');
}

function aoAbrirIntegracaoProcedimentos(e) {
  criarMenuIntegracaoProcedimentos_();
}

function criarMenuIntegracaoProcedimentos_() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('Integração')
      .addItem('Sincronizar base e atualizar produtos', 'sincronizarBaseEProdutosProcedimentos')
      .addItem('Sincronizar somente a Base Consolidada', 'sincronizarBaseConsolidada1e3')
      .addSeparator()
      .addItem('Ocultar páginas técnicas', 'ocultarAbasTecnicasIntegracao')
      .addItem('Mostrar páginas técnicas', 'mostrarAbasTecnicasIntegracao')
      .addSeparator()
      .addItem('Instalar ou renovar automação', 'instalarIntegracaoProcedimentos1e3')
      .addItem('Remover automação', 'removerAutomacaoIntegracaoProcedimentos')
      .addToUi();
    return true;
  } catch (erro) {
    return false;
  }
}

function sincronizarBaseEProdutosProcedimentos() {
  const resultado = sincronizarBaseConsolidada1e3();
  atualizarProdutosAposIntegracao_();
  return resultado;
}

function sincronizarBaseConsolidada1e3(e) {
  const bloqueio = LockService.getDocumentLock();
  bloqueio.waitLock(30000);
  let resultado;

  try {
    const arquivo = SpreadsheetApp.getActiveSpreadsheet();
    const respostasAtuais = localizarAbaIntegracao_(arquivo, CONFIG_INTEGRACAO.ABAS_RESPOSTAS_ATUAIS);
    if (!respostasAtuais) {
      throw new Error('A aba vinculada ao Forms não foi encontrada.');
    }

    let base = arquivo.getSheetByName(CONFIG_INTEGRACAO.ABA_BASE);
    const cabecalhosDestino = construirCabecalhosDestinoIntegracao_(respostasAtuais, base);

    const linhasAtuais = construirLinhasAtuaisIntegracao_(respostasAtuais, cabecalhosDestino);
    const historico2 = lerHistoricoExistenteIntegracao_(
      arquivo.getSheetByName(CONFIG_INTEGRACAO.ABA_IMPORTACAO_2_0),
      cabecalhosDestino
    );

    const abaBruta1 = localizarAbaIntegracao_(arquivo, CONFIG_INTEGRACAO.ABAS_BRUTAS_1_0);
    let historico1;
    let auditoria1;
    if (abaBruta1) {
      const migracao1 = construirHistorico1Integracao_(abaBruta1, cabecalhosDestino);
      historico1 = migracao1.linhas;
      auditoria1 = migracao1.auditoria;
      escreverAbaImportacao1Integracao_(arquivo, cabecalhosDestino, historico1);
      escreverAuditoria1Integracao_(arquivo, auditoria1);
    } else {
      historico1 = lerHistoricoExistenteIntegracao_(
        arquivo.getSheetByName(CONFIG_INTEGRACAO.ABA_IMPORTACAO_1_0),
        cabecalhosDestino
      );
      auditoria1 = [];
    }

    const unificacao = unificarLinhasIntegracao_(
      cabecalhosDestino,
      historico1,
      historico2,
      linhasAtuais
    );

    if (!base) {
      base = arquivo.insertSheet(CONFIG_INTEGRACAO.ABA_BASE);
      base.setTabColor('#334E68');
    }
    const baseEstavaOculta = base.isSheetHidden();
    escreverAbaTabularIntegracao_(base, cabecalhosDestino, unificacao.linhas, '#334E68');
    if (baseEstavaOculta && !base.isSheetHidden()) base.hideSheet();

    resultado = {
      total: unificacao.linhas.length,
      atuais: linhasAtuais.length,
      historico1: contarLinhasValidasIntegracao_(historico1, cabecalhosDestino),
      historico2: contarLinhasValidasIntegracao_(historico2, cabecalhosDestino),
      duplicadas: unificacao.duplicadas.length,
      revisao: contarLinhasRevisaoIntegracao_(historico1, cabecalhosDestino)
    };

    escreverResumoIntegracao_(arquivo, resultado, auditoria1, abaBruta1);
    if (!e) {
      arquivo.toast(
        resultado.total + ' registro(s) disponíveis na Base Consolidada.',
        'Integração concluída',
        6
      );
    }
  } finally {
    bloqueio.releaseLock();
  }
  return resultado;
}

function construirCabecalhosDestinoIntegracao_(abaAtual, abaBase) {
  const metadadosNormalizados = {};
  CONFIG_INTEGRACAO.METADADOS.forEach(function (cabecalho) {
    metadadosNormalizados[normalizarTextoIntegracao_(cabecalho)] = true;
  });

  let cabecalhos = [];
  if (abaBase && abaBase.getLastColumn()) {
    cabecalhos = abaBase.getRange(1, 1, 1, abaBase.getLastColumn()).getValues()[0]
      .filter(function (cabecalho) {
        return valorPreenchidoIntegracao_(cabecalho) &&
          !metadadosNormalizados[normalizarTextoIntegracao_(cabecalho)];
      });
  }

  const cabecalhosAtuais = abaAtual.getRange(1, 1, 1, abaAtual.getLastColumn()).getValues()[0];
  cabecalhosAtuais.forEach(function (cabecalho, indice) {
    const nome = indice === 0 ? 'Carimbo de data/hora' : String(cabecalho || '').trim();
    if (!nome || nome === '-') return;
    const existe = cabecalhos.some(function (existente) {
      return normalizarTextoIntegracao_(existente) === normalizarTextoIntegracao_(nome);
    });
    if (!existe) cabecalhos.push(nome);
  });

  if (!cabecalhos.length) throw new Error('Não foi possível construir o cabeçalho consolidado.');
  cabecalhos[0] = 'Carimbo de data/hora';
  return cabecalhos.concat(CONFIG_INTEGRACAO.METADADOS);
}

function construirLinhasAtuaisIntegracao_(aba, cabecalhosDestino) {
  const dados = aba.getDataRange().getValues();
  if (dados.length < 2) return [];
  // Índices preparados uma vez. Preserva a primeira coluna de destino e
  // o primeiro valor preenchido entre cabeçalhos repetidos na origem.
  const mapaOrigem = montarMapaCabecalhosIntegracao_(dados[0]);
  const primeiroDestino = Object.create(null);
  const metas = new Set(CONFIG_INTEGRACAO.METADADOS.map(normalizarTextoIntegracao_));
  const campos = [];
  cabecalhosDestino.forEach(function(nome, indice) {
    const chave = normalizarTextoIntegracao_(nome);
    if (primeiroDestino[chave] === undefined) primeiroDestino[chave] = indice;
    if (!metas.has(chave)) campos.push({
      destino: primeiroDestino[chave],
      origens: chave === 'carimbo de data hora' ? [0] : (mapaOrigem[chave] || [])
    });
  });
  function definir(linha, nome, valor) {
    const indice = primeiroDestino[normalizarTextoIntegracao_(nome)];
    if (indice !== undefined && valorPreenchidoIntegracao_(valor) &&
        !valorPreenchidoIntegracao_(linha[indice])) linha[indice] = valor;
  }
  const dataIndice = primeiroDestino[normalizarTextoIntegracao_('Data de realização do procedimento')];
  const carimboIndice = primeiroDestino[normalizarTextoIntegracao_('Carimbo de data/hora')];
  return dados.slice(1).map(function(linha, indice) {
    const numeroLinha = indice + 2;
    const destino = criarLinhaVaziaIntegracao_(cabecalhosDestino);
    campos.forEach(function(campo) {
      if (valorPreenchidoIntegracao_(destino[campo.destino])) return;
      for (let j = 0; j < campo.origens.length; j++) {
        const valor = linha[campo.origens[j]];
        if (valorPreenchidoIntegracao_(valor)) {
          destino[campo.destino] = valor;
          break;
        }
      }
    });
    const data = valorPreenchidoIntegracao_(destino[dataIndice])
      ? destino[dataIndice] : destino[carimboIndice];
    definir(destino, 'Origem do registro', 'Procedimentos de Campo 3.0');
    definir(destino, 'ID de migração', 'ATUAL-3.0-' + String(numeroLinha).padStart(4, '0'));
    definir(destino, 'Linha na origem', numeroLinha);
    definir(destino, 'E-mail do envio', pegarCampoIntegracao_(linha, mapaOrigem,
      ['Endereço de e-mail', 'E-mail do envio']));
    definir(destino, 'Validação', 'Registro atual preservado');
    definir(destino, 'Mês de referência', mesReferenciaIntegracao_(data));
    definir(destino, 'Observação da migração',
      'Registro atual sincronizado automaticamente. O cabeçalho da coluna A é lido pela posição.');
    return destino;
  });
}

function construirHistorico1Integracao_(abaBruta, cabecalhosDestino) {
  const dados = abaBruta.getDataRange().getValues();
  if (dados.length < 2) return {linhas: [], auditoria: []};
  const mapa = montarMapaCabecalhosIntegracao_(dados[0]);
  const linhas = [];
  const auditoria = [];
  const impressoes = {};

  dados.slice(1).forEach(function (linha, indice) {
    const numeroLinha = indice + 2;
    const avaliacao = avaliarRegistro1Integracao_(linha, mapa);
    const destino = mapearRegistro1Integracao_(
      linha,
      mapa,
      cabecalhosDestino,
      numeroLinha,
      avaliacao
    );
    const impressao = construirImpressaoIntegracao_(destino, cabecalhosDestino);
    if (impressoes[impressao]) {
      avaliacao.motivos.push('Possível duplicidade da linha ' + impressoes[impressao]);
      definirCampoIntegracao_(destino, cabecalhosDestino, 'Validação', 'Revisar antes de consolidar');
    } else {
      impressoes[impressao] = numeroLinha;
    }
    linhas.push(destino);
    auditoria.push({
      id: pegarCampoLinhaDestinoIntegracao_(destino, cabecalhosDestino, ['ID de migração']),
      linha: numeroLinha,
      procedimentoOriginal: pegarCampoIntegracao_(linha, mapa, ['Qual procedimento será realizado:']),
      procedimentoFinal: pegarCampoLinhaDestinoIntegracao_(
        destino,
        cabecalhosDestino,
        ['Selecione o procedimento a ser executado']
      ),
      data: linha[0],
      referencia: referenciaPrincipal1Integracao_(linha, mapa),
      decisao: avaliacao.motivos.length ? 'Revisar antes de consolidar' : 'Válido para consolidação',
      motivos: avaliacao.motivos.join('\n')
    });
  });
  return {linhas: linhas, auditoria: auditoria};
}

function mapearRegistro1Integracao_(linha, mapa, cabecalhosDestino, numeroLinha, avaliacao) {
  const destino = criarLinhaVaziaIntegracao_(cabecalhosDestino);
  const campo = function () {
    return pegarCampoIntegracao_(linha, mapa, Array.prototype.slice.call(arguments));
  };
  const procedimentoOriginal = campo('Qual procedimento será realizado:');
  const procedimento = procedimentoCanonicoIntegracao_(procedimentoOriginal);
  const dataHora = linha[0];

  definirCampoIntegracao_(destino, cabecalhosDestino, 'Carimbo de data/hora', dataHora);
  definirCampoIntegracao_(destino, cabecalhosDestino, 'Selecione o procedimento a ser executado', procedimento);
  definirCampoIntegracao_(destino, cabecalhosDestino, 'Procedimento executado:', procedimento);
  definirCampoIntegracao_(destino, cabecalhosDestino, 'Data de realização do procedimento', dataSomenteIntegracao_(dataHora));
  definirCampoIntegracao_(
    destino,
    cabecalhosDestino,
    'Bairro de realização do procedimento',
    campo('Bairro do Morador', 'Bairro da atuação')
  );
  definirCampoIntegracao_(destino, cabecalhosDestino, 'Área responsável pelo procedimento', campo('Procedimento foi feito:'));
  definirCampoIntegracao_(destino, cabecalhosDestino, 'Colaborador responsável pelo registro', campo('Colaborador responsável:'));
  definirCampoIntegracao_(destino, cabecalhosDestino, 'Ponto de referência', campo('Obra de referência do procedimento'));

  mapearPesquisa1Integracao_(destino, cabecalhosDestino, campo);

  const tipo = normalizarTextoIntegracao_(procedimentoOriginal);
  if (tipo === 'acompanhamento de cautelar') {
    mapearCautelar1Integracao_(destino, cabecalhosDestino, campo);
  } else if (tipo === 'ficha de atendimento') {
    mapearAtendimento1Integracao_(destino, cabecalhosDestino, campo);
  } else if (tipo === 'acompanhamento de obra') {
    mapearRelato1Integracao_(destino, cabecalhosDestino, campo);
  } else if (tipo.indexOf('matriz de contato') !== -1) {
    mapearMatriz1Integracao_(destino, cabecalhosDestino, campo);
  }

  const complementos = construirComplementos1Integracao_(campo, tipo);
  definirCampoIntegracao_(destino, cabecalhosDestino, 'Observação final do procedimento', complementos);
  definirCampoIntegracao_(destino, cabecalhosDestino, 'Origem do registro', 'Procedimentos de Campo 1.0');
  definirCampoIntegracao_(
    destino,
    cabecalhosDestino,
    'ID de migração',
    'HIST-1.0-' + String(numeroLinha).padStart(4, '0')
  );
  definirCampoIntegracao_(destino, cabecalhosDestino, 'Linha na origem', numeroLinha);
  definirCampoIntegracao_(destino, cabecalhosDestino, 'E-mail do envio', '');
  definirCampoIntegracao_(
    destino,
    cabecalhosDestino,
    'Validação',
    avaliacao.motivos.length ? 'Revisar antes de consolidar' : 'Válido para consolidação'
  );
  definirCampoIntegracao_(destino, cabecalhosDestino, 'Mês de referência', mesReferenciaIntegracao_(dataHora));
  definirCampoIntegracao_(
    destino,
    cabecalhosDestino,
    'Observação da migração',
    'Mapeado da versão 1.0. O registro original permanece preservado na aba bruta.'
  );
  return destino;
}

function mapearPesquisa1Integracao_(destino, cabecalhos, campo) {
  const pares = [
    ['Nome - Pesquisa de Satisfação', campo('Nome do Munícipe para Pesquisa de Satisfação')],
    ['Telefone - Pesquisa de Satisfação', textoTelefoneIntegracao_(campo('Telefone'))],
    ['Já foi abordado anteriormente na pesquisa sobre as obras?', campo('Você já foi entrevistado sobre a obra antes?')],
    ['Perguntas finais direcionadas ao momento, indique se:', campo('Momento que ocorreu a pesquisa')],
    ['De 0 a 10, quanto está satisfeito com os serviços de saneamento de forma geral?', campo(
      'De 1 a 10, o quanto você está satisfeito com os serviços de saneamento?',
      'De 1 a 10, quanto você está satisfeito(a) com os serviços de saneamento realizados pela Sabesp?'
    )],
    ['De forma geral, quais aspectos observa sobre os serviços de saneamento?', campo(
      'Transcreva e desenvolva o depoimento do Entrevistado',
      'Transcreva e desenvolva a resposta do entrevistado sobre os serviços de saneamento:'
    )],
    ['Quer adicionar algum comentário ou sugestão para melhoria dos serviços?', campo(
      'Sugestão do entrevistado sobre os serviços em geral da Sabesp:',
      'Transcreva e desenvolva o relato do entrevistado em relação a satisfação com as obras e se houve melhoria na qualidade de vida das pessoas.'
    )],
    ['Se sim: De 0 a 10, quanto percebeu melhorias na qualidade de vida relacionadas ao saneamento?', campo(
      'De 1 a 10 quanto você percebe de melhorias na qualidade de vida após as obras:'
    )],
    ['De 0 a 10, o quanto está satisfeito com a chegada da obra?', campo('De 1 a 10 o quanto você está satisfeito com a chegada das obras?')],
    ['Tem algum comentário ou sugestão que ajude a causar menos impactos com chegada da obra?', campo('Transcreva o depoimento sobre a satisfação com a chegada das obras:')],
    ['De 0 a 10, como avalia o relacionamento entre a equipe de obras e a população?', campo('Como você avalia o relacionamento da equipe do consórcio e a população?')],
    ['De 0 a 10, o quanto está satisfeito com a execução da obra?', campo('De 1 a 10 quanto você esta satisfeito durante essa obra:')],
    ['Deseja relatar como as obras vem afetando seu dia a dia?', campo('Como você soube da obra e como ela vem afetado o seu dia a dia? Transcreva e discorra o relato.')],
    ['As obras atenderam as expectativas?', campo('A obra atendeu as suas expectativas?')],
    ['De 0 a 10, o quanto está satisfeito com o resultado da obra?', campo('De 1 a 10 quanto você esta satisfeito com o resultado da obra:')],
    ['De 0 a 10, como avalia o atendimento da Sabesp?', campo('Com qual nota você avalia o atendimento Sabesp:')],
    ['De 0 a 10, qual nota o munícipe atribui ao atendimento recebido?', campo('Qual a nota o municipe deu ao seu atendimento')],
    ['Algum último comentário ou sugestão?', campo('Pontos de melhoria no atendimento')]
  ];
  pares.forEach(function (par) {
    definirCampoIntegracao_(destino, cabecalhos, par[0], par[1]);
  });
}

function mapearCautelar1Integracao_(destino, cabecalhos, campo) {
  const endereco = campo('Endereço Completo da Cautelar');
  const morador = campo('Morador Presente');
  const permissao = campo('Houve permissão do morador');
  definirCampoIntegracao_(destino, cabecalhos, 'Endereço completo', endereco);
  definirCampoIntegracao_(destino, cabecalhos, 'Status da visita cautelar', campo('Qual a visita'));
  definirCampoIntegracao_(destino, cabecalhos, 'Foto de fachada e Registro relevante Cautelar', campo('Foto da Fachada'));
  definirCampoIntegracao_(destino, cabecalhos, 'Responsável técnico pela cautelar', campo('Responsável pela cautelar'));
  definirCampoIntegracao_(destino, cabecalhos, 'Vulnerabilidades e características observadas na cautelar', campo('Possíveis Vulnerabilidades e Caracteristicas Observadas'));
  definirCampoIntegracao_(destino, cabecalhos, 'De 0 a 10 classifique um grau de atenção da cautelar', campo('Grau de Atenção'));
  definirCampoIntegracao_(destino, cabecalhos, 'Comentário - Vistoria Cautelar', campo('Observações da Cautelar'));
  definirCampoIntegracao_(
    destino,
    cabecalhos,
    'Situação da Vistoria Cautelar',
    situacaoCautelarHistoricaIntegracao_(morador, permissao)
  );
}

function mapearAtendimento1Integracao_(destino, cabecalhos, campo) {
  const endereco = campo('Endereço do municipe');
  const solicitacao = campo('Solicitação em detalhes');
  definirCampoIntegracao_(destino, cabecalhos, 'Momento da Ficha de Atendimento', momentoAtendimentoHistoricoIntegracao_(campo('Momento do atendimento')));
  definirCampoIntegracao_(destino, cabecalhos, 'Nome - Atendimento', campo('Nome Completo do municipe'));
  definirCampoIntegracao_(destino, cabecalhos, 'Telefone ou Telefones - Atendimento', textoTelefoneIntegracao_(campo('Telefone(s) para contato do municipe')));
  definirCampoIntegracao_(destino, cabecalhos, 'Email - Atendimento', campo('Email do municipe'));
  definirCampoIntegracao_(destino, cabecalhos, 'Endereço Completo do Solicitante do Atendimento', endereco);
  definirCampoIntegracao_(destino, cabecalhos, 'Assunto Principal ', campo('Assunto'));
  definirCampoIntegracao_(destino, cabecalhos, 'Breve relato do solicitante', solicitacao);
  definirCampoIntegracao_(destino, cabecalhos, 'Imagens ou arquivos do acontecimento', campo('Fotos do ocorrido'));
  definirCampoIntegracao_(destino, cabecalhos, 'Nome do responsável do consórcio que está acompanhando o procedimento ', campo('Responsáveis do Consórcio pela finalização'));
  definirCampoIntegracao_(destino, cabecalhos, 'Endereço completo', endereco);
  definirCampoIntegracao_(destino, cabecalhos, 'Tipo do local', campo('Tipo de local para qual é aberto o atendimento'));
  definirCampoIntegracao_(destino, cabecalhos, 'Descrição detalhada da ocorrência ', solicitacao);
  definirCampoIntegracao_(destino, cabecalhos, 'Classificação principal da manifestação', campo('Tipo de manifestação', 'Classificação da abordagem'));
}

function mapearRelato1Integracao_(destino, cabecalhos, campo) {
  const atividade = campo('Nome da atividade');
  const endereco = campo('Endereço do inicio da atividade');
  definirCampoIntegracao_(destino, cabecalhos, 'Atividade realizada', atividade);
  definirCampoIntegracao_(destino, cabecalhos, 'Título da frente de serviço', atividade);
  definirCampoIntegracao_(destino, cabecalhos, 'Endereço da frente de serviço', endereco);
  definirCampoIntegracao_(destino, cabecalhos, 'Ferramenta', campo('Ferramentas a serem usadas'));
  definirCampoIntegracao_(destino, cabecalhos, 'Público-alvo da atividade', campo('Público Alvo'));
  definirCampoIntegracao_(destino, cabecalhos, 'Relato da atividade', campo('Observações de Campo'));
  definirCampoIntegracao_(destino, cabecalhos, 'Endereço completo', endereco);
}

function mapearMatriz1Integracao_(destino, cabecalhos, campo) {
  const endereco = campo('Endereço de Contato');
  definirCampoIntegracao_(destino, cabecalhos, 'Tipo de contato da matriz', campo('Tipo de contato:'));
  definirCampoIntegracao_(destino, cabecalhos, 'Função ou cargo do contato', campo('Nome/Função/Cargo'));
  definirCampoIntegracao_(destino, cabecalhos, 'Nome da pessoa de contato', campo('Pessoa de Contato caso Cargo ou Função'));
  definirCampoIntegracao_(destino, cabecalhos, 'Telefone do contato da matriz de contato', textoTelefoneIntegracao_(campo('Telefone de Contato')));
  definirCampoIntegracao_(destino, cabecalhos, 'E-mail do contato da matriz', campo('Email de Contato'));
  definirCampoIntegracao_(destino, cabecalhos, 'Objetivo e observações sobre o contato', campo('Observação desse Contato'));
  definirCampoIntegracao_(destino, cabecalhos, 'Está em contato direto com a pessoa cadastrada?', campo('Já houve contato com o Consórcio?'));
  definirCampoIntegracao_(destino, cabecalhos, 'Endereço completo', endereco);
}

function construirComplementos1Integracao_(campo, tipoNormalizado) {
  const itens = [
    rotularIntegracao_('Procedimento original', campo('Qual procedimento será realizado:')),
    rotularIntegracao_('Obra de referência', campo('Obra de referência do procedimento')),
    rotularIntegracao_('Sequência informada da pesquisa', campo('Sequencia, em que momento a pesquisa está sendo feita?')),
    rotularIntegracao_('Conhecimento prévio da obra', campo('Você já ouviu falar sobre a nova obra que está chegando?')),
    rotularIntegracao_('Expectativa sobre a obra', campo('Qual a sua expectativa sobre a obra:')),
    rotularIntegracao_('Informações do solicitante', campo('Informações do Solicitante'))
  ];
  if (tipoNormalizado !== 'ficha de atendimento') {
    itens.push(rotularIntegracao_('Classificação histórica da abordagem', campo('Classificação da abordagem')));
  }
  return juntarInformacoesIntegracao_(itens);
}

function avaliarRegistro1Integracao_(linha, mapa) {
  const procedimento = pegarCampoIntegracao_(linha, mapa, ['Qual procedimento será realizado:']);
  const tipo = normalizarTextoIntegracao_(procedimento);
  const motivos = [];
  const tem = function () {
    return valorPreenchidoIntegracao_(
      pegarCampoIntegracao_(linha, mapa, Array.prototype.slice.call(arguments))
    );
  };
  if (!valorPreenchidoIntegracao_(linha[0])) motivos.push('Sem carimbo de data e hora');
  if (!valorPreenchidoIntegracao_(procedimento)) motivos.push('Sem procedimento');

  if (tipo === 'acompanhamento de cautelar') {
    if (!tem('Endereço Completo da Cautelar')) motivos.push('Sem endereço da cautelar');
    if (!tem('Qual a visita')) motivos.push('Sem status da visita');
    if (!tem('Responsável pela cautelar')) motivos.push('Sem responsável técnico');
    if (!tem('Foto da Fachada')) motivos.push('Sem foto da fachada');
  } else if (tipo === 'pesquisa de satisfacao') {
    if (!tem('Nome do Munícipe para Pesquisa de Satisfação')) motivos.push('Sem nome do participante');
    if (!tem('Momento que ocorreu a pesquisa', 'Sequencia, em que momento a pesquisa está sendo feita?')) motivos.push('Sem momento da pesquisa');
  } else if (tipo === 'ficha de atendimento') {
    if (!tem('Nome Completo do municipe')) motivos.push('Sem nome do solicitante');
    if (!tem('Endereço do municipe')) motivos.push('Sem endereço do solicitante');
    if (!tem('Solicitação em detalhes')) motivos.push('Sem solicitação detalhada');
  } else if (tipo === 'acompanhamento de obra') {
    if (!tem('Nome da atividade')) motivos.push('Sem nome da atividade');
    if (!tem('Endereço do inicio da atividade')) motivos.push('Sem endereço da atividade');
    if (!tem('Observações de Campo')) motivos.push('Sem observação de campo');
  } else if (tipo.indexOf('matriz de contato') !== -1) {
    if (!tem('Nome/Função/Cargo')) motivos.push('Sem função ou contato');
    if (!tem('Telefone de Contato', 'Email de Contato')) motivos.push('Sem telefone ou e-mail');
  } else {
    motivos.push('Procedimento sem regra de migração');
  }

  const texto = normalizarTextoIntegracao_(linha.filter(valorPreenchidoIntegracao_).join(' | '));
  if (/\bteste\b|\btestando\b|\btest\b|\basdf\b|\baaaa\b|\bxxx\b/.test(texto)) {
    motivos.push('Texto de teste identificado');
  }
  return {motivos: motivos};
}

function procedimentoCanonicoIntegracao_(valor) {
  const texto = normalizarTextoIntegracao_(valor);
  if (texto === 'acompanhamento de cautelar') return 'Acompanhamento de Vistoria Cautelar';
  if (texto === 'pesquisa de satisfacao') return 'Pesquisa de Satisfação';
  if (texto === 'ficha de atendimento') return 'Ficha de Atendimento';
  if (texto === 'acompanhamento de obra') return 'Relato de atividade';
  if (texto.indexOf('matriz de contato') !== -1) return 'Matriz de Contato';
  return valor;
}

function situacaoCautelarHistoricaIntegracao_(morador, permissao) {
  const moradorTexto = normalizarTextoIntegracao_(morador);
  const permissaoTexto = normalizarTextoIntegracao_(permissao);
  if (moradorTexto === 'nao') return 'Registro histórico: morador ausente, tipo de vistoria não informado';
  if (permissaoTexto === 'sim') return 'Vistoria detalhada. Registro histórico: entrada autorizada';
  if (permissaoTexto === 'nao') return 'Registro histórico: entrada não autorizada, tipo de vistoria não informado';
  return 'Registro histórico: situação não detalhada no formulário 1.0';
}

function momentoAtendimentoHistoricoIntegracao_(valor) {
  const texto = normalizarTextoIntegracao_(valor);
  if (texto.indexOf('abertura') !== -1) return 'Abertura: Primeiro contato com o caso';
  if (texto.indexOf('finalizacao') !== -1 || texto.indexOf('encerramento') !== -1) {
    return 'Finalização: Retorno final com conclusão do atendimento';
  }
  if (texto.indexOf('atualizacao') !== -1 || texto.indexOf('retorno') !== -1) {
    return 'Atualização: Retorno e acompanhamento de demanda';
  }
  return valor;
}

function lerHistoricoExistenteIntegracao_(aba, cabecalhosDestino) {
  if (!aba || aba.getLastRow() < 2) return [];
  const dados = aba.getDataRange().getValues();
  const mapa = montarMapaCabecalhosIntegracao_(dados[0]);
  return dados.slice(1).map(function (linha) {
    const destino = criarLinhaVaziaIntegracao_(cabecalhosDestino);
    cabecalhosDestino.forEach(function (cabecalho) {
      definirCampoIntegracao_(
        destino,
        cabecalhosDestino,
        cabecalho,
        pegarCampoIntegracao_(linha, mapa, [cabecalho])
      );
    });
    return destino;
  });
}

function unificarLinhasIntegracao_(cabecalhos, historico1, historico2, atuais) {
  const linhas = [];
  const ids = {};
  const duplicadas = [];
  [historico1, historico2, atuais].forEach(function (grupo) {
    grupo.forEach(function (linha) {
      const validacao = pegarCampoLinhaDestinoIntegracao_(linha, cabecalhos, ['Validação']);
      if (!validacaoAceitaIntegracao_(validacao)) return;
      const id = String(pegarCampoLinhaDestinoIntegracao_(linha, cabecalhos, ['ID de migração']) || '').trim();
      if (!id) return;
      if (ids[id]) {
        duplicadas.push({id: id, mantida: ids[id]});
        return;
      }
      ids[id] = pegarCampoLinhaDestinoIntegracao_(linha, cabecalhos, ['Origem do registro']);
      linhas.push(linha);
    });
  });
  return {linhas: linhas, duplicadas: duplicadas};
}

function escreverAbaImportacao1Integracao_(arquivo, cabecalhos, linhas) {
  let aba = arquivo.getSheetByName(CONFIG_INTEGRACAO.ABA_IMPORTACAO_1_0);
  if (!aba) {
    aba = arquivo.insertSheet(CONFIG_INTEGRACAO.ABA_IMPORTACAO_1_0);
    aba.setTabColor('#6B7C93');
  }
  const oculta = aba.isSheetHidden();
  escreverAbaTabularIntegracao_(aba, cabecalhos, linhas, '#6B7C93');
  if (oculta && !aba.isSheetHidden()) aba.hideSheet();
}

function escreverAuditoria1Integracao_(arquivo, auditoria) {
  const cabecalhos = [
    'ID de migração', 'Linha na origem', 'Procedimento original', 'Procedimento consolidado',
    'Data do registro', 'Referência principal', 'Decisão', 'Motivos para revisão'
  ];
  const linhas = auditoria.map(function (item) {
    return [
      item.id, item.linha, item.procedimentoOriginal, item.procedimentoFinal,
      item.data, item.referencia, item.decisao, item.motivos
    ];
  });
  let aba = arquivo.getSheetByName(CONFIG_INTEGRACAO.ABA_AUDITORIA_1_0);
  if (!aba) {
    aba = arquivo.insertSheet(CONFIG_INTEGRACAO.ABA_AUDITORIA_1_0);
    aba.setTabColor('#B7791F');
  }
  const oculta = aba.isSheetHidden();
  escreverAbaTabularIntegracao_(aba, cabecalhos, linhas, '#B7791F');
  aba.setColumnWidth(1, 145);
  aba.setColumnWidth(3, 190);
  aba.setColumnWidth(4, 210);
  aba.setColumnWidth(6, 260);
  aba.setColumnWidth(7, 190);
  aba.setColumnWidth(8, 330);
  if (oculta && !aba.isSheetHidden()) aba.hideSheet();
}

function escreverResumoIntegracao_(arquivo, resultado, auditoria, abaBruta1) {
  let aba = arquivo.getSheetByName(CONFIG_INTEGRACAO.ABA_RESUMO);
  if (!aba) {
    aba = arquivo.insertSheet(CONFIG_INTEGRACAO.ABA_RESUMO);
    aba.setTabColor('#2B6CB0');
  }
  const oculta = aba.isSheetHidden();
  separarTodasCelulasIntegracao_(aba);
  aba.clear();
  garantirTamanhoAbaIntegracao_(aba, 22, 6);
  aba.setHiddenGridlines(true);
  aba.setFrozenRows(3);
  aba.setFrozenColumns(0);

  aba.getRange('A1:F1').merge().setValue('INTEGRAÇÃO DOS PROCEDIMENTOS 1.0, 2.0 E 3.0');
  aba.getRange('A2:F2').merge().setValue('Base Consolidada como fonte única dos demonstrativos');
  aba.getRange('A1:F2').setBackground('#234E70').setFontColor('#FFFFFF');
  aba.getRange('A1:F1').setFontSize(17).setFontWeight('bold').setHorizontalAlignment('center');
  aba.getRange('A2:F2').setFontSize(10).setHorizontalAlignment('center');

  const linhas = [
    ['INDICADOR', 'TOTAL', 'SITUAÇÃO', 'ORIGEM', 'AÇÃO', 'OBSERVAÇÃO'],
    ['Base Consolidada', resultado.total, 'Atualizada', 'Todas as fontes', 'Usar nos demonstrativos', 'Fonte única de consulta'],
    ['Registros atuais 3.0', resultado.atuais, 'Preservados', 'Google Forms', 'Automático', 'Inclui respostas atrasadas da base'],
    ['Histórico 2.0', resultado.historico2, 'Preservado', 'Importação Histórica 2.0', 'Automático', 'Mantém a migração já validada'],
    ['Histórico 1.0', resultado.historico1, abaBruta1 ? 'Mapeado' : 'Aguardando aba bruta', abaBruta1 ? abaBruta1.getName() : 'Não localizada', 'Auditado', 'Registros válidos entram na base'],
    ['Registros para revisão', resultado.revisao, resultado.revisao ? 'Revisar' : 'Sem pendências', 'Auditoria 1.0', 'Conferir se necessário', 'Não entram na Base Consolidada'],
    ['IDs repetidos', resultado.duplicadas, resultado.duplicadas ? 'Atenção' : 'Sem duplicidades', 'Todas as fontes', 'Controle automático', 'A primeira ocorrência é preservada']
  ];
  aba.getRange(4, 1, linhas.length, linhas[0].length).setValues(linhas);
  aba.getRange('A4:F4').setBackground('#2B6CB0').setFontColor('#FFFFFF').setFontWeight('bold');
  aba.getRange('A5:F10').setBackground('#FFFFFF').setWrap(true).setVerticalAlignment('middle');
  aba.getRange('A4:F10').setBorder(true, true, true, true, true, true, '#CBD5E0', SpreadsheetApp.BorderStyle.SOLID);
  aba.setColumnWidth(1, 210);
  aba.setColumnWidth(2, 95);
  aba.setColumnWidth(3, 150);
  aba.setColumnWidth(4, 210);
  aba.setColumnWidth(5, 190);
  aba.setColumnWidth(6, 280);
  aba.setRowHeights(5, 6, 42);

  aba.getRange('A12:F12').merge().setValue('ORIENTAÇÃO DE USO');
  aba.getRange('A12:F12').setBackground('#D9EAF7').setFontColor('#234E70').setFontWeight('bold');
  aba.getRange('A13:F16').merge().setValue(
    'Não inclua linhas históricas na aba vinculada ao Forms. A versão 1.0 permanece na aba bruta, ' +
    'a importação validada fica separada e a Base Consolidada reúne somente os registros aceitos. ' +
    'Os demonstrativos devem continuar lendo a Base Consolidada.'
  );
  aba.getRange('A13:F16').setBackground('#F7FAFC').setWrap(true).setVerticalAlignment('top');
  aba.getRange('A12:F16').setBorder(true, true, true, true, false, false, '#90A4B8', SpreadsheetApp.BorderStyle.SOLID);

  if (oculta && !aba.isSheetHidden()) aba.hideSheet();
}

function escreverAbaTabularIntegracao_(aba, cabecalhos, linhas, corCabecalho) {
  if (aba.getFilter()) aba.getFilter().remove();
  separarTodasCelulasIntegracao_(aba);
  aba.clear();
  garantirTamanhoAbaIntegracao_(aba, Math.max(20, linhas.length + 1), cabecalhos.length);
  aba.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
  if (linhas.length) aba.getRange(2, 1, linhas.length, cabecalhos.length).setValues(linhas);

  aba.setHiddenGridlines(true);
  aba.setFrozenRows(1);
  aba.setFrozenColumns(0);
  aba.getRange(1, 1, 1, cabecalhos.length)
    .setBackground(corCabecalho).setFontColor('#FFFFFF').setFontWeight('bold')
    .setWrap(true).setVerticalAlignment('middle').setHorizontalAlignment('center');
  aba.setRowHeight(1, 56);
  if (linhas.length) {
    aba.getRange(2, 1, linhas.length, cabecalhos.length)
      .setFontFamily('Arial').setFontSize(9).setVerticalAlignment('top').setWrap(true);
    aba.getRange(1, 1, linhas.length + 1, cabecalhos.length).createFilter();
  }

  const indiceCarimbo = primeiroIndiceCabecalhoIntegracao_(cabecalhos, 'Carimbo de data/hora');
  const indiceData = primeiroIndiceCabecalhoIntegracao_(cabecalhos, 'Data de realização do procedimento');
  if (indiceCarimbo !== -1 && linhas.length) {
    aba.getRange(2, indiceCarimbo + 1, linhas.length, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  }
  if (indiceData !== -1 && linhas.length) {
    aba.getRange(2, indiceData + 1, linhas.length, 1).setNumberFormat('dd/MM/yyyy');
  }
  aba.setColumnWidths(1, cabecalhos.length, 145);
  [
    'Relato da atividade',
    'Relato do Diagnóstico',
    'Descrição detalhada da ocorrência ',
    'Providências já realizadas no atendimento',
    'Observação final do procedimento',
    'Observação da migração'
  ].forEach(function (cabecalhoAmplo) {
    const indice = primeiroIndiceCabecalhoIntegracao_(cabecalhos, cabecalhoAmplo);
    if (indice !== -1) aba.setColumnWidth(indice + 1, 300);
  });
}

function construirImpressaoIntegracao_(linha, cabecalhos) {
  return [
    pegarCampoLinhaDestinoIntegracao_(linha, cabecalhos, ['Carimbo de data/hora']),
    pegarCampoLinhaDestinoIntegracao_(linha, cabecalhos, ['Selecione o procedimento a ser executado']),
    pegarCampoLinhaDestinoIntegracao_(linha, cabecalhos, ['Endereço completo', 'Endereço da frente de serviço']),
    pegarCampoLinhaDestinoIntegracao_(linha, cabecalhos, ['Nome - Pesquisa de Satisfação', 'Nome - Atendimento']),
    pegarCampoLinhaDestinoIntegracao_(linha, cabecalhos, ['Telefone - Pesquisa de Satisfação', 'Telefone ou Telefones - Atendimento'])
  ].map(normalizarTextoIntegracao_).join('|');
}

function referenciaPrincipal1Integracao_(linha, mapa) {
  return pegarCampoIntegracao_(linha, mapa, [
    'Endereço Completo da Cautelar',
    'Endereço do municipe',
    'Endereço do inicio da atividade',
    'Nome do Munícipe para Pesquisa de Satisfação',
    'Nome/Função/Cargo'
  ]);
}

function contarLinhasValidasIntegracao_(linhas, cabecalhos) {
  return linhas.filter(function (linha) {
    return validacaoAceitaIntegracao_(
      pegarCampoLinhaDestinoIntegracao_(linha, cabecalhos, ['Validação'])
    );
  }).length;
}

function contarLinhasRevisaoIntegracao_(linhas, cabecalhos) {
  return linhas.filter(function (linha) {
    const validacao = pegarCampoLinhaDestinoIntegracao_(linha, cabecalhos, ['Validação']);
    return valorPreenchidoIntegracao_(validacao) && !validacaoAceitaIntegracao_(validacao);
  }).length;
}

function validacaoAceitaIntegracao_(valor) {
  const texto = normalizarTextoIntegracao_(valor);
  return CONFIG_INTEGRACAO.VALIDACOES_ACEITAS.some(function (aceita) {
    return normalizarTextoIntegracao_(aceita) === texto;
  });
}

function criarLinhaVaziaIntegracao_(cabecalhos) {
  return new Array(cabecalhos.length).fill('');
}

function definirCampoIntegracao_(linha, cabecalhos, cabecalho, valor) {
  if (!valorPreenchidoIntegracao_(valor)) return;
  const indice = primeiroIndiceCabecalhoIntegracao_(cabecalhos, cabecalho);
  if (indice !== -1 && !valorPreenchidoIntegracao_(linha[indice])) linha[indice] = valor;
}

function pegarCampoLinhaDestinoIntegracao_(linha, cabecalhos, alternativas) {
  for (let i = 0; i < alternativas.length; i++) {
    const indice = primeiroIndiceCabecalhoIntegracao_(cabecalhos, alternativas[i]);
    if (indice !== -1 && valorPreenchidoIntegracao_(linha[indice])) return linha[indice];
  }
  return '';
}

function montarMapaCabecalhosIntegracao_(cabecalhos) {
  const mapa = {};
  cabecalhos.forEach(function (cabecalho, indice) {
    const chave = normalizarTextoIntegracao_(cabecalho);
    if (!chave) return;
    if (!mapa[chave]) mapa[chave] = [];
    mapa[chave].push(indice);
  });
  return mapa;
}

function primeiroIndiceCabecalhoIntegracao_(cabecalhos, cabecalho) {
  const procurado = normalizarTextoIntegracao_(cabecalho);
  for (let i = 0; i < cabecalhos.length; i++) {
    if (normalizarTextoIntegracao_(cabecalhos[i]) === procurado) return i;
  }
  return -1;
}

function pegarCampoIntegracao_(linha, mapa, alternativas) {
  for (let i = 0; i < alternativas.length; i++) {
    const indices = mapa[normalizarTextoIntegracao_(alternativas[i])] || [];
    for (let j = 0; j < indices.length; j++) {
      const valor = linha[indices[j]];
      if (valorPreenchidoIntegracao_(valor)) return valor;
    }
  }
  return '';
}

function localizarAbaIntegracao_(arquivo, nomes) {
  for (let i = 0; i < nomes.length; i++) {
    const aba = arquivo.getSheetByName(nomes[i]);
    if (aba) return aba;
  }
  return null;
}

function garantirTamanhoAbaIntegracao_(aba, linhas, colunas) {
  if (aba.getMaxRows() < linhas) aba.insertRowsAfter(aba.getMaxRows(), linhas - aba.getMaxRows());
  if (aba.getMaxColumns() < colunas) aba.insertColumnsAfter(aba.getMaxColumns(), colunas - aba.getMaxColumns());
}

function separarTodasCelulasIntegracao_(aba) {
  aba.getRange(1, 1, Math.max(1, aba.getMaxRows()), Math.max(1, aba.getMaxColumns())).breakApart();
}

function mesReferenciaIntegracao_(valor) {
  const data = converterDataIntegracao_(valor);
  if (!data) return '';
  return Utilities.formatDate(data, Session.getScriptTimeZone() || 'America/Sao_Paulo', 'yyyy-MM');
}

function dataSomenteIntegracao_(valor) {
  const data = converterDataIntegracao_(valor);
  if (!data) return valor;
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function converterDataIntegracao_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return new Date(valor.getTime());
  if (typeof valor === 'number' && isFinite(valor)) {
    if (valor > 20000 && valor < 80000) return new Date(Math.round((valor - 25569) * 86400000));
    if (valor > 100000000000) return new Date(valor);
  }
  const texto = String(valor === null || valor === undefined ? '' : valor).trim();
  if (!texto) return null;
  const brasileira = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (brasileira) {
    let ano = Number(brasileira[3]);
    if (ano < 100) ano += 2000;
    const data = new Date(
      ano,
      Number(brasileira[2]) - 1,
      Number(brasileira[1]),
      Number(brasileira[4] || 0),
      Number(brasileira[5] || 0)
    );
    return isNaN(data.getTime()) ? null : data;
  }
  const data = new Date(texto);
  return isNaN(data.getTime()) ? null : data;
}

function textoTelefoneIntegracao_(valor) {
  return valorPreenchidoIntegracao_(valor) ? String(valor).trim() : '';
}

function rotularIntegracao_(rotulo, valor) {
  return valorPreenchidoIntegracao_(valor) ? rotulo + ': ' + String(valor).trim() : '';
}

function juntarInformacoesIntegracao_(valores) {
  const vistas = {};
  return valores.filter(valorPreenchidoIntegracao_).map(function (valor) {
    return String(valor).trim();
  }).filter(function (valor) {
    const chave = normalizarTextoIntegracao_(valor);
    if (vistas[chave]) return false;
    vistas[chave] = true;
    return true;
  }).join('\n');
}

function valorPreenchidoIntegracao_(valor) {
  if (valor === null || valor === undefined) return false;
  if (valor instanceof Date) return !isNaN(valor.getTime());
  return String(valor).trim() !== '';
}

function normalizarTextoIntegracao_(valor) {
  return String(valor === null || valor === undefined ? '' : valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function atualizarProdutosAposIntegracao_() {
  const falhas = [];
  const produtos = [
    {
      nome: 'Relatos de Atividade',
      disponivel: typeof atualizarRelatosDeAtividade === 'function',
      executar: function () {
        atualizarRelatosDeAtividade({baseJaSincronizada: true, silencioso: true});
      }
    },
    {
      nome: 'Diagnósticos de Área',
      disponivel: typeof atualizarDiagnosticosDeArea === 'function',
      executar: function () {
        atualizarDiagnosticosDeArea({baseJaSincronizada: true, silencioso: true});
      }
    }
  ];

  produtos.forEach(function (produto) {
    if (!produto.disponivel) return;
    try {
      produto.executar();
    } catch (erro) {
      falhas.push(produto.nome + ': ' + erro.message);
    }
  });

  if (falhas.length) {
    avisarIntegracao_(
      'A Base Consolidada foi atualizada, mas houve falha em: ' + falhas.join(' | '),
      'Integração'
    );
  }
}

function aoEnviarFormularioIntegracaoProcedimentos(e) {
  sincronizarBaseConsolidada1e3(e || {origem: 'gatilho'});
  atualizarProdutosAposIntegracao_();
}

function ocultarAbasTecnicasIntegracao() {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();
  CONFIG_INTEGRACAO.ABAS_TECNICAS.forEach(function (nome) {
    const aba = arquivo.getSheetByName(nome);
    if (!aba || aba.isSheetHidden()) return;
    const outrasVisiveis = arquivo.getSheets().filter(function (outra) {
      return outra.getSheetId() !== aba.getSheetId() && !outra.isSheetHidden();
    });
    if (outrasVisiveis.length) aba.hideSheet();
  });
  avisarIntegracao_('As páginas técnicas foram ocultadas e continuam preservadas.', 'Integração');
}

function mostrarAbasTecnicasIntegracao() {
  const arquivo = SpreadsheetApp.getActiveSpreadsheet();
  CONFIG_INTEGRACAO.ABAS_TECNICAS.forEach(function (nome) {
    const aba = arquivo.getSheetByName(nome);
    if (aba && aba.isSheetHidden()) aba.showSheet();
  });
  avisarIntegracao_('As páginas técnicas estão visíveis.', 'Integração');
}

function removerAutomacaoIntegracaoProcedimentos() {
  removerGatilhosIntegracao_(false);
  avisarIntegracao_('Automação da integração removida.', 'Integração');
}

function removerGatilhosIntegracao_(mostrarAviso) {
  const funcoes = ['aoAbrirIntegracaoProcedimentos', 'aoEnviarFormularioIntegracaoProcedimentos'];
  let removidos = 0;
  ScriptApp.getProjectTriggers().forEach(function (gatilho) {
    if (funcoes.indexOf(gatilho.getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(gatilho);
      removidos++;
    }
  });
  if (mostrarAviso) avisarIntegracao_(removidos + ' gatilho(s) removido(s).', 'Integração');
  return removidos;
}

function avisarIntegracao_(mensagem, titulo) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(String(mensagem), titulo || 'Integração', 6);
  } catch (erro) {
    console.log((titulo || 'Integração') + ': ' + mensagem);
  }
}

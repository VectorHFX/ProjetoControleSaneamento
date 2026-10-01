# Atendimento • Acabamento Água 1.0

Atualização estética de 22/09/2026, baseada nos três códigos enviados nesta conversa.

## Instalar

1. Guarde uma cópia dos módulos atuais antes de substituir.
2. Abra Extensões → Apps Script na planilha correspondente.
3. Substitua TODO o conteúdo de cada módulo indicado abaixo pelo arquivo correspondente. Não cole no final e não mantenha uma segunda cópia das mesmas funções.
4. Salve o projeto, feche o painel que estiver aberto e abra novamente pelo menu habitual.

| Projeto | Arquivo completo para substituir |
| --- | --- |
| Controle de Atendimentos | 03_Painel_Atendimento_3_5_1.gs |
| Controle de Atendimentos | 05_Comunicacao_Atendimento_4_0_1.gs |
| Execução de Atendimentos | 04_Painel_Executivo_1_5_1.gs |

Os nomes dos arquivos identificam esta entrega visual. Os números de versão internos das rotinas operacionais foram preservados; podem continuar aparecendo nas janelas. Não é necessário executar instaladores, criar abas ou recriar gatilhos para esta atualização.

## O que mudou

- Fundo predominantemente branco, navegação clara, azuis vivos e detalhes curvos inspirados em água, construídos em CSS.
- Nenhuma imagem decorativa, logomarca, fonte remota ou biblioteca nova. Fotos que fazem parte das fichas continuam disponíveis como evidência.
- Painéis de Atendimento, Execução e Avisos com acabamento consistente.
- “Passar para outra área” passou para Ferramentas no painel de Atendimento; Avisos continua em Visão de trabalho.
- Menu horizontal com rolagem em telas pequenas, mantendo os nomes dos comandos. Formulários e indicadores se reorganizam conforme a largura. Tabelas largas mantêm rolagem horizontal para preservar a leitura dos campos.
- Hierarquia mais clara em cartões, cabeçalhos, botões, filtros e seleção de ficha; foco de teclado visível e respeito à preferência por movimento reduzido.
- Busca aguarda 140 ms após a última tecla antes de reconstruir a tabela. Os filtros de seleção continuam aplicados imediatamente, sem o disparo duplicado por input e change.

## O que foi preservado

Código de servidor, regras de atendimento, permissões, gravações, fila, e-mails, WhatsApp, PDFs, campos e rotinas de impressão foram mantidos. Esta entrega não executa nenhuma ação na planilha ou envia mensagens ao ser recebida.

## Verificação

Validação local de sintaxe dos três módulos e dos scripts efetivamente gerados em HTML; comparação do código fora das interfaces; IDs únicos e posição do menu; teste de busca com 30 teclas seguidas e aplicação imediata dos filtros. A comparação confirmou que o código fora das interfaces é idêntico às fontes enviadas.

Não houve implantação ou teste conectado ao Google Apps Script, nem validação visual em navegador nesta execução. Não foi medido ganho no tempo de resposta do Google: a otimização reduz renderizações locais durante a digitação.

Após substituir, confira uma ficha, os filtros, o encaminhamento em Ferramentas e os Avisos. Em uma janela estreita, role o menu lateral convertido em faixa horizontal. Para voltar, restaure os três módulos guardados antes da atualização.

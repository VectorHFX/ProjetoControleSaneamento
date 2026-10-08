# Ideias reservadas

Ideias aprovadas na conversa com o Victor que **ainda não entram na aplicação**: ficam guardadas aqui com o que precisam para sair do papel.

## Território vivo — painel de gestão para os clientes

**Situação:** reservado (08/10/2026). O Victor gostou do conceito e quer usá-lo como painel de gestão para os clientes. Ainda falta a equipe preencher os endereços completos.

**Conceito visual:** quadro "CPT — dois conceitos de front-end", conceito A (link privado do Victor: https://claude.ai/artifact/LSZq6TJRv7TPwBJU8vSWqr). Dados fictícios.

**O que mostra:**
- O mês pelo mapa da bacia do Tamanduateí, com camadas que ligam e desligam: frentes de obra, ações socioambientais, atendimentos abertos e diagnósticos.
- A linha do mês: ao tocar num dia, as ações daquele dia aparecem no mapa.
- O dossiê de cada frente: números do mês, ritmo por semana, último relato com os seis pontos, o que pede atenção e o próximo item do cronograma.
- "Pergunte ao território": um resumo em texto montado a partir dos relatos e atendimentos.
- O pulso do contrato: ações, pessoas alcançadas, pesquisas e atendimentos em aberto.

**Para os clientes, com cuidado:**
- Nada de dado pessoal de morador. Os atendimentos aparecem só somados (por frente ou bairro), nunca com nome, telefone ou endereço da casa.
- Os números são os mesmos já entregues nos Anexos do relatório e na Visão do mês. O painel não cria uma segunda versão dos números.
- Só ferramentas Google gratuitas: uma página do Apps Script só de leitura, ou o Looker Studio lendo uma planilha de resumo. A planilha de controle continua 100% à mão e fora disso.

**O que falta antes de construir:**
1. **Endereço completo nos registros de campo:** rua, número (ou referência) e bairro. Sem isso, os pontos caem no centro do bairro e o mapa engana.
2. **Medir a completude:** a conferência do relato já tem o ponto "Onde". Um número mensal de "registros com endereço completo" diz quando dá para ligar a camada de pontos. Sugestão: a partir de 80%.
3. **Até lá, dá para começar no nível de obra e bairro:** as posições de obras e bairros já existem (Mapa → Posicionar no mapa). O painel pode nascer assim e ganhar os pontos quando os endereços melhorarem.
4. **Endereço para coordenada:** o serviço de mapas do próprio Apps Script (geocodificação) faz isso, com limite diário de uso. A conversão roda uma vez por registro e o resultado fica guardado.

**Ajudas para a equipe preencher melhor** (podem vir antes do painel):
- Dica no formulário de campo: "Rua, número e bairro (ou uma referência: escola, praça)".
- Missão no Meu espaço para quem tiver registros sem endereço completo na semana, no mesmo tom das dicas de relato (sem nota e sem ranking).

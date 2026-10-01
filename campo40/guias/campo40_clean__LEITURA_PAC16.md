# PAC16 — catálogo territorial para a base 4.0

Fonte examinada: **PAC16_Planejamento 2026_26.04.2026 (1).xlsx**, com 43 abas. A data de referência usada é a do nome do documento: **26/04/2026**. O planejamento não informa a situação atual em setembro/outubro.

O catálogo completo e rastreável está em **Catalogo_PAC16.json**. O instalador inclui os campos necessários para preencher a aba Obras; o JSON preserva também as descrições alternativas e referências das revisões.

## Critérios aplicados

- **REV01-2026** foi a fonte principal: descrição, código EAP, método, competência, BM, status e observações.
- **TPF** foi usada para cotejar códigos e descrições. Não foram acrescentadas frentes já representadas pelo mesmo conjunto de códigos e uma correspondência única. As descrições alternativas foram preservadas no JSON. Isso não prova equivalência geográfica: elas precisam ser consideradas ao delimitar o traçado.
- Linhas de **BM total**, **glosa** e **pedido de medição** foram excluídas do cadastro de obras.
- **PRODUÇÃO** foi lida como acompanhamento por mês, com repetições, parcelas e status diferentes. Não foi somada ao catálogo como se cada linha fosse uma obra nova.
- **Registro, Mapa Geral e os modelos RG/MM** contêm exemplos do Rio de Janeiro. Não entraram no catálogo de Santo André.

Resultado: **142 frentes de referência**, com IDs **OBR-0001 a OBR-0142**. Uma consta como cancelada e começa fora da lista do formulário; as outras **141** ficam disponíveis para você ajustar. Uma mesma rua pode ter várias frentes legítimas: lado direito/esquerdo, metodologia, trecho ou código diferentes. Não houve fusão por simples semelhança do nome.

## Situação registrada no documento

| Status na fonte | Frentes |
|---|---:|
| FINALIZADO | 52 |
| ANDAMENTO | 9 |
| PENDENTE | 77 |
| CANCELADO | 1 |
| NA | 1 |
| Não informado | 2 |
| **Total** | **142** |

Esses status são um retrato da fonte. Não são usados para dizer que uma obra está atualmente em execução. A coluna **No formulário?** permite selecionar o que interessa ao registro de campo sem depender desse retrato antigo.

## Bairros e mapa: o que o arquivo permite afirmar

O planejamento não contém uma coluna confiável de bairro nem coordenadas das frentes. Nomes de ruas, cruzamentos, bacias e códigos EAP não permitem atribuir bairros com segurança, especialmente em trechos que atravessam limites.

Por isso, o cadastro de bairros conserva os **27 nomes** da pergunta 146 do formulário enviado, com **3 opções especiais**: Fora da área de atuação, Outro bairro e Múltiplos Bairros. A instalação lê as opções reais do formulário original, para preservar eventuais ajustes posteriores à exportação em Markdown.

O vínculo **obra ↔ bairro** fica reservado, inicialmente vazio. Latitude, longitude, ponto de referência e GeoJSON também ficam reservados. Não foram inventados pontos no mapa nem bairros por aproximação.

## Pendências identificadas

O JSON lista **15 alertas**, que podem se repetir em uma mesma frente:

- EAP ausente ou sem identificação utilizável. Esses casos recebem ID próprio, sem transformar textos como “NA” em códigos técnicos.
- Um código **SB-ME08-0419** aparece no planejamento do contrato de Santo André. Foi preservado e sinalizado; não foi substituído por um código SA por suposição.
- Datas truncadas, como **18/12/205** e **12/09/202**, não foram utilizadas como datas operacionais.

As 36 exclusões registradas no JSON incluem totais e lançamentos financeiros encontrados nas duas fontes comparadas; não representam 36 obras descartadas.

## Estrutura que serve para o futuro

- **OBR** identifica a frente; EAP permanece uma referência técnica, pois não é uma chave única suficiente.
- **BAI** identifica o bairro ou opção de preenchimento.
- A localização exata pode ser um ponto; o traçado pode ser uma linha ou polígono em GeoJSON. São informações diferentes.
- Alterar o nome de exibição não deve mudar o ID. O mesmo ID deverá ligar cronograma, levantamento, comunicado, diagnóstico, atendimento e relatório.
- O mapa de Santo André será construído depois de confirmar bairros e localização, usando o catálogo em vez de criar outra lista paralela.

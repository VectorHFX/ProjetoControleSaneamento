# Desempenho da Aplicação CPT (2.9.1)

Auditoria Lighthouse 13 na prévia (celular simulado, rede lenta), servida com gzip e com o perfil embutido na página, como na implantação real. Mediana de 3 rodadas.

| | Desempenho | Acessibilidade | Boas práticas | CLS (tela pulando) | TBT (travamento) | Maior conteúdo (LCP) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| 2.9.0 | 98 | 97 | 96 | 0,088 | 40 ms | 1,42 s |
| **2.9.1** | **100** | **100** | 96 | **0,024** | **2 ms** | **1,38 s** |

"Boas práticas" fica em 96 só porque a prévia local não tem ícone de aba (favicon). No Apps Script, quem serve o ícone é o Google.

## O que foi feito

| Item | Como ficou |
|---|---|
| Imagens comprimidas | As miniaturas já vêm reduzidas pelo Drive (320 a 360 px de largura). A foto ampliada usa 1000 px, porque vai para impressão e PDF. |
| Carregamento preguiçoso | Galeria e seleção de fotos com `loading="lazy"` e `decoding="async"`. A visualização do Drive na galeria também só carrega quando aparece. |
| JS e CSS reduzidos | Já saem minificados pelo compilador (Babel). Encurtar nomes de variáveis com Terser economizaria só 5% depois da compressão, por isso não foi adotado. |
| Cache das respostas | O cache do servidor (ScriptCache) agora comprime resultados grandes com gzip. Antes, o que passava de 95 KB não era guardado. Em teste, 331 KB viraram 13 KB. |
| Resultados caros em cache | Visão do mês, agenda e coleções (recados, contatos, caderno…) usam esse cache, que se invalida sozinho quando entra registro novo. |
| "Pool de conexões" | Cada planilha é aberta uma vez por consulta e reaproveitada. Antes, a planilha de dados chegava a ser aberta 3 ou 4 vezes. |
| Índice | As coleções procuram itens por ID num índice em memória, sem percorrer a lista. |
| Menos redesenhos | Visão do mês só redesenha quando os dados mudam (já era assim). Avisos de recados não são pedidos de novo a cada troca de aba do navegador. |
| Espera curta nas buscas (debounce) | Contatos, materiais, galeria e painel da gestão redesenham quando a pessoa para de digitar, sem perder letras nem o foco. |
| Paginação | Contatos de 60 em 60. Galeria de 24 em 24, atendimentos e registros por página (já eram assim). |
| Scripts não essenciais adiados | Os avisos de recados são pedidos 1,2 s depois, sem disputar com os dados do mês. |
| Esqueletos de carregamento | Em todas as páginas que antes mostravam só "Carregando…". |
| Tela sem pulos | O aviso e a faixa de visão aparecem antes dos dados. CLS de 0,088 para 0,024. |
| Contraste | Itens "sem ação" da mesa do relatório estavam claros demais para leitura. Corrigido (acessibilidade 100). |

## O que não se aplica a um Apps Script

| Item | Por quê |
|---|---|
| CDN | A página é servida pelo próprio Google, que já entrega por rede distribuída e com gzip. A aplicação não usa biblioteca externa. |
| Balanceador de carga | O Google executa cada chamada em servidores próprios e distribui sozinho. Não há servidor nosso para balancear. |
| Compressão das respostas | O Google já comprime as respostas. Comprimir de novo em base64 aumentaria o tamanho. |
| Índice de banco de dados e pool de conexões de verdade | Os dados ficam em Planilhas Google, que não têm índice nem conexão persistente. O equivalente possível foi feito acima. |
| Dividir o código em partes (code splitting) | O Apps Script entrega a página inteira de uma vez. Carregar módulos sob demanda exigiria reescrever a inicialização. Com tudo comprimido, são cerca de 80 KB de JavaScript; o ganho não compensa o risco agora. |

## Como repetir a auditoria

1. `python3 app/testes/gerar_previa.py`
2. Sirva `app/previa/` com gzip.
3. Rode o Lighthouse na prévia com `?inicial=1`, que simula o perfil embutido pelo servidor.

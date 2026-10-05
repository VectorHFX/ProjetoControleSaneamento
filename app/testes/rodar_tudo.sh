#!/usr/bin/env bash
# Roda toda a bateria de testes do projeto (servidor, atualizador, Campo 4.0 e telas) e mostra um resumo.
#   bash app/testes/rodar_tudo.sh          → tudo
#   bash app/testes/rodar_tudo.sh rapido   → sem os testes de tela (não precisa de navegador)
# As telas usam o Chromium em /tmp/cpt-chromium (ou CHROMIUM_EXECUTABLE_PATH) e a prévia gerada por gerar_previa.py.
set -u
cd "$(dirname "$0")/../.."
ok=0; falhas=(); log="$(mktemp -d)"
roda(){ local nome="$1"; shift; local arq="$log/${nome//\//_}.log"; if timeout 600 "$@" >"$arq" 2>&1; then ok=$((ok+1)); printf '  ok      %s\n' "$nome"; else falhas+=("$nome"); printf '  FALHOU  %s  (detalhes: %s)\n' "$nome" "$arq"; fi; }
echo "Servidor da aplicação"
for t in cronograma obras_relatorio inventario gestao comunicacao espaco quiz mascotes album jogos tema desempenho; do roda "app/$t" node "app/testes/$t.cjs"; done
echo "Atualizador"
roda atualizador node atualizador/testes/atualizador.cjs
roda cloudshell bash atualizador/testes/cloudshell.sh
echo "Campo 4.0"
for t in processamento abertura rdas execucao gatilhos catalogos; do roda "campo40/$t" node "campo40/testes/$t.cjs"; done
if [ "${1:-}" != "rapido" ]; then
  echo "Telas (prévia)"
  roda previa python3 app/testes/gerar_previa.py
  for t in acesso_ui modulos_ui inicio_ui atendimentos_ui visoes_ui comunicacao_ui espaco_ui desempenho_ui navegacao_ui listas_ui obras_dia_ui relatos_ui mapa_ui quiz_ui album_ui jogos_ui tema_ui visual_ui organograma_ui cronograma_ui; do roda "app/$t" node "app/testes/$t.cjs"; done
fi
echo
if [ ${#falhas[@]} -eq 0 ]; then echo "TUDO CERTO: $ok testes passaram."; exit 0; fi
echo "${#falhas[@]} FALHA(S): ${falhas[*]}  ·  $ok passaram."; exit 1

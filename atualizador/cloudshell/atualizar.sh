#!/usr/bin/env bash
# CPT • Atualização pelo Cloud Shell (não precisa de projeto do Google Cloud).
# Uso, no Cloud Shell (shell.cloud.google.com):
#   bash atualizar.sh conferir   → mostra o que mudaria (não altera nada)
#   bash atualizar.sh aplicar    → versão de segurança + atualiza + publica a Aplicação no mesmo link
# Na primeira vez pede o token do GitHub, o ID do Campo 4.0 e o login do Google (clasp).
# Arquivos que só existem no Google são mantidos; o appsscript.json do Campo 4.0 também.
set -euo pipefail

MODO="${1:-conferir}"
RAMO="${CPT_RAMO:-claude/keen-hamilton-pvmxi2}"
REPO_URL="github.com/VectorHFX/ProjetoControleSaneamento.git"
APP_ID="1B2gVRbnDP9E4tdecW7lknY5Wq8QlRbmjXXenx-8cOPQX0wBmePmWUhML"
CFG="${CPT_DIR:-$HOME/.cpt}"
CLASP="${CPT_CLASP:-npx --yes @google/clasp@3.4.1}"
QUANDO="$(TZ=America/Sao_Paulo date '+%d/%m/%Y %H:%M')"

[ "$MODO" = conferir ] || [ "$MODO" = aplicar ] || { echo "Use: bash atualizar.sh conferir | aplicar"; exit 2; }
mkdir -p "$CFG"; chmod 700 "$CFG"

if [ ! -s "$CFG/token" ]; then
  read -rsp "Cole o token do GitHub (github_pat_…) e tecle Enter: " T; echo
  printf '%s' "$T" > "$CFG/token"; chmod 600 "$CFG/token"
fi
if [ ! -s "$CFG/campo40" ]; then
  read -rp "Cole o ID do script do Campo 4.0 (Configurações do projeto → IDs): " C
  printf '%s' "$C" > "$CFG/campo40"
fi
CAMPO_ID="$(cat "$CFG/campo40")"

if [ ! -s "$HOME/.clasprc.json" ]; then
  echo
  echo "== Login no Google (uma vez) =="
  echo "1) Abra o link que aparecer, entre com a conta @veolia.com e autorize."
  echo "2) No fim, o navegador mostra uma página que não abre (localhost). Copie o endereço INTEIRO da barra e cole aqui."
  $CLASP login --no-localhost
fi

echo "== Baixando o código do GitHub (ramo $RAMO) =="
rm -rf "$CFG/repo"
git clone --quiet --depth 5 --branch "$RAMO" "${CPT_REPO_GIT:-https://x-access-token:$(cat "$CFG/token")@$REPO_URL}" "$CFG/repo" \
  || { echo "Não foi possível baixar do GitHub. Confira o token (rm $CFG/token e rode de novo)."; exit 1; }
echo "Últimas mudanças:"; git -C "$CFG/repo" log --format='  - %s (%h)' -5
# O próprio script se atualiza para a próxima execução.
[ -e "$CFG/repo/atualizador/cloudshell/atualizar.sh" ] && [ -w "$0" ] && cp "$CFG/repo/atualizador/cloudshell/atualizar.sh" "$0" 2>/dev/null || true

# sincronizar <nome> <scriptId> <pasta no repositório> <publicar: sim|nao>
sincronizar() {
  local nome="$1" id="$2" pasta="$3" publicar="$4" w="$CFG/trabalho/$1"
  echo; echo "== $nome =="
  rm -rf "$w"; mkdir -p "$w/src"
  printf '{"scriptId":"%s","rootDir":"src","scriptExtensions":[".gs"]}\n' "$id" > "$w/.clasp.json"
  (cd "$w" && $CLASP pull > /dev/null) || { echo "  Não consegui ler o projeto no Google (ID $id)."; return 1; }
  cp -r "$w/src" "$w/atual"
  local f
  for f in "$CFG/repo/$pasta"/*.gs "$CFG/repo/$pasta"/*.html; do [ -e "$f" ] && cp "$f" "$w/src/"; done
  if [ "$publicar" = sim ] && [ -e "$CFG/repo/$pasta/appsscript.json" ]; then cp "$CFG/repo/$pasta/appsscript.json" "$w/src/"; fi
  # Aposentados (2.27; 2.29: Álbum): saíram da aplicação de propósito; apagar no Google para que não continuem funcionando.
  local removeu="" a
  if [ "$pasta" = app/src ]; then
    for a in RelatorioMensalCPT.gs EntregasDoMesCPT.gs AnexosRelatorioCPT.gs ProgramaParceirosCPT.gs EntregasCPT.gs Fechamento.html Socioambiental.html Entregas.html AlbumCPT.gs Album.html; do
      [ -e "$CFG/repo/$pasta/$a" ] && continue
      [ -e "$w/src/$a" ] && rm -f "$w/src/$a" && removeu="$removeu $a"
    done
  fi
  local mudou criou mantidos
  # Diferenças só de espaços ou linhas em branco no fim não contam (o Google normaliza o texto).
  mudou="$(cd "$w/src" && for f in *; do [ -e "../atual/$f" ] && ! diff -qBZ "$f" "../atual/$f" > /dev/null && echo "$f"; done || true)"
  criou="$(cd "$w/src" && for f in *; do [ -e "../atual/$f" ] || echo "$f"; done || true)"
  mantidos="$(cd "$w/atual" && for f in *; do [ -e "$CFG/repo/$pasta/$f" ] || [ ! -e "$w/src/$f" ] || echo "$f"; done || true)"
  echo "  Alterar: ${mudou:-nada}" | tr '\n' ' '; echo
  echo "  Criar:   ${criou:-nada}" | tr '\n' ' '; echo
  echo "  Fica só no Google (mantido): ${mantidos:-nada}" | tr '\n' ' '; echo
  echo "  Remover (aposentados):${removeu:- nada}"
  # Um arquivo que só existe no Google e declara a mesma classe de um arquivo do GitHub quebra o projeto inteiro.
  local dup="" m c
  for m in $mantidos; do
    case "$m" in *.gs) ;; *) continue ;; esac
    for c in $(grep -oE '^class [A-Za-z0-9_]+' "$w/atual/$m" | cut -d' ' -f2); do
      grep -lqE "^class $c\b" "$CFG/repo/$pasta"/*.gs 2>/dev/null && dup="$dup $m(class $c)"
    done
  done
  if [ -n "$dup" ]; then echo "  ⚠ ATENÇÃO: no Google há arquivo(s) que repetem uma classe do GitHub:$dup"; echo "    Apague esse(s) arquivo(s) no editor (⋮ → Excluir). Com classe repetida, o projeto inteiro para de funcionar."; fi
  if [ -z "$mudou$criou$removeu" ]; then echo "  Já estava atualizado."; return 0; fi
  [ "$MODO" = aplicar ] || return 0
  (cd "$w" && $CLASP version "Segurança antes da atualização de $QUANDO" | tail -1 | sed 's/^/  Versão de segurança: /')
  (cd "$w" && $CLASP push --force > /dev/null) && echo "  Código atualizado."
  if [ "$publicar" = sim ]; then
    local v deps d
    v="$(cd "$w" && $CLASP version "Atualização do GitHub ($RAMO) em $QUANDO" | grep -o '[0-9]\+' | tail -1)"
    deps="$(cd "$w" && $CLASP deployments --json | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{for(const d of JSON.parse(s))if(d.versionNumber)console.log(d.deploymentId)})')"
    if [ -z "$deps" ]; then echo "  Nenhuma implantação publicada encontrada: publique manualmente uma vez."; fi
    for d in $deps; do (cd "$w" && $CLASP redeploy "$d" -V "$v" -d "Versão $v · $QUANDO" > /dev/null) && echo "  Link /exec atualizado para a versão $v."; done
  fi
}

sincronizar "Aplicação CPT" "$APP_ID" "app/src" sim
sincronizar "Campo 4.0" "$CAMPO_ID" "campo40/src" nao
echo
if [ "$MODO" = conferir ]; then echo "Nada foi alterado. Para aplicar: bash atualizar.sh aplicar"; else echo "Pronto. Se o guia pedir uma função de instalação, execute-a no projeto indicado."; fi

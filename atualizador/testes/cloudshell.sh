#!/usr/bin/env bash
# Teste do atualizar.sh com clasp simulado e repositório local. bash atualizador/testes/cloudshell.sh
set -euo pipefail
T="$(mktemp -d)"; RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
# Repositório falso com app/src e campo40/src
mkdir -p "$T/origem/app/src" "$T/origem/campo40/src"
echo 'nova' > "$T/origem/app/src/AplicacaoCPT.gs"; echo 'css' > "$T/origem/app/src/Estilos.html"; echo '{"m":2}' > "$T/origem/app/src/appsscript.json"
echo 'exec2' > "$T/origem/campo40/src/ExecucaoDaEngenharia.gs"; printf 'painel\nclass PainelDaExecucao {}\n' > "$T/origem/campo40/src/PainelDaExecucao.gs"
git -C "$T/origem" init -q -b ramo-teste && git -C "$T/origem" add -A && git -C "$T/origem" -c user.email=t@t -c user.name=t commit -qm "Mudança de teste"
# "Google": conteúdo atual de cada projeto
mkdir -p "$T/google/APP" "$T/google/CAMPO"
echo 'velha' > "$T/google/APP/AplicacaoCPT.gs"; echo 'css' > "$T/google/APP/Estilos.html"; echo '{"m":1}' > "$T/google/APP/appsscript.json"; echo 'x' > "$T/google/APP/SoNoGoogle.gs"
echo 'exec1' > "$T/google/CAMPO/ExecucaoDaEngenharia.gs"; printf 'class PainelDaExecucao {}\n' > "$T/google/CAMPO/PainelDeExecucao.gs"; echo '{"campo":1}' > "$T/google/CAMPO/appsscript.json"
# clasp simulado
cat > "$T/clasp" <<'S'
#!/usr/bin/env bash
id="$(grep -o '"scriptId":"[^"]*"' .clasp.json | cut -d'"' -f4)"; [ "$id" = APPID ] && P=APP || P=CAMPO
echo "$P $*" >> "$G/log"
case "$1" in
  pull) cp "$G/$P"/* src/ ;;
  push) rm -f "$G/$P"/*; cp src/* "$G/$P/" ;;
  version) n=$(( $(cat "$G/n" 2>/dev/null || echo 10) + 1 )); echo $n > "$G/n"; echo "Created version $n" ;;
  deployments) echo '[{"deploymentId":"HEAD","versionNumber":null},{"deploymentId":"WEB1","versionNumber":3}]' ;;
  redeploy) echo "ok" ;;
esac
S
chmod +x "$T/clasp"; echo '{}' > "$T/clasprc"
export G="$T/google" HOME="$T/home" CPT_DIR="$T/cfg" CPT_CLASP="$T/clasp" CPT_RAMO=ramo-teste CPT_REPO_GIT="$T/origem"
mkdir -p "$HOME" "$CPT_DIR"; echo '{}' > "$HOME/.clasprc.json"; printf tok > "$CPT_DIR/token"; printf CAMPOID > "$CPT_DIR/campo40"
sed 's/APP_ID="1B2g[^"]*"/APP_ID="APPID"/' "$RAIZ/atualizador/cloudshell/atualizar.sh" > "$T/atualizar.sh"
saida="$(bash "$T/atualizar.sh" conferir)"; echo "$saida" | grep -q "Alterar: AplicacaoCPT.gs appsscript.json" || { echo "$saida"; exit 1; }
grep -q velha "$G/APP/AplicacaoCPT.gs" || { echo "FALHA: conferir alterou"; exit 1; }
saida="$(bash "$T/atualizar.sh" aplicar)"
grep -q nova "$G/APP/AplicacaoCPT.gs"; grep -q x "$G/APP/SoNoGoogle.gs"; grep -q '"m":2' "$G/APP/appsscript.json"
grep -q '"campo":1' "$G/CAMPO/appsscript.json"; grep -q painel "$G/CAMPO/PainelDaExecucao.gs"
echo "$saida" | grep -q "Link /exec atualizado para a versão 12" || { echo "$saida"; exit 1; }
grep -q "APP redeploy WEB1 -V 12" "$G/log"; ! grep -q "redeploy HEAD" "$G/log"
grep -n "version Segurança" "$G/log" | head -1 | grep -q "APP version" ; [ "$(grep -n 'APP version Segurança' "$G/log" | cut -d: -f1)" -lt "$(grep -n 'APP push' "$G/log" | cut -d: -f1)" ]
echo "$saida" | grep -q "PainelDeExecucao.gs(class PainelDaExecucao)" || { echo "$saida"; exit 1; }
printf "\n\n" >> "$G/APP/AplicacaoCPT.gs"
saida="$(bash "$T/atualizar.sh" aplicar)"; echo "$saida" | grep -q "Já estava atualizado"
rm -rf "$T"; echo "PASS: Cloud Shell — conferir sem alterar, versão de segurança antes do envio, arquivos só do Google e manifesto do Campo mantidos, publicação no mesmo link, repetição sem efeito."

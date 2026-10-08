#!/bin/bash
# Uso: shot.sh <url> <saida.png> [largura] [altura] [espera_ms]
# Edge sem janela. Perfil temporário apagado no fim (o perfil do Edge enche o disco).
URL="$1"; OUT="$2"; W="${3:-1400}"; H="${4:-1900}"; WAIT="${5:-15000}"
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
PROF="$(dirname "$OUT")/edge_profile_$$"
mkdir -p "$PROF"
"$EDGE" --headless=new --disable-gpu-compositing --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist \
  --no-first-run --no-default-browser-check --hide-scrollbars --force-device-scale-factor=1 \
  --user-data-dir="$(cygpath -w "$PROF")" --window-size="$W,$H" --virtual-time-budget="$WAIT" \
  --screenshot="$(cygpath -w "$OUT")" "$URL" >/dev/null 2>&1
taskkill //F //IM msedge.exe //T >/dev/null 2>&1
sleep 1
rm -rf "$PROF"
ls -la "$OUT" 2>/dev/null

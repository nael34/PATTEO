#!/bin/sh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'Installer Node.js puis relancer. Version de référence : 24.14.0.'
  exit 1
fi
node -e 'if(Number(process.versions.node.split(".")[0])<20){console.error("Node.js 20 ou plus récent est nécessaire.");process.exit(1)}'
if [ ! -f node_modules/stripe/package.json ]; then
  npm ci
fi
printf '%s\n' 'Ouvrir http://localhost:4187 — Ctrl+C pour arrêter.'
exec npm run dev

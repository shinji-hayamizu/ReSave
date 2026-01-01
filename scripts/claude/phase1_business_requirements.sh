#!/usr/bin/env bash
set -euo pipefail

# Phase 1: サービス概要を差し込んだプロンプトを Claude Code に渡し、
# docs/requirements/business-requirements.md を生成します。
#
# 使い方:
#   bash scripts/claude/phase1_business_requirements.sh ./service-overview.md
#
# 前提:
# - `claude` コマンドが利用できること（Claude Code）

OVERVIEW_FILE="${1:-}"
if [[ -z "${OVERVIEW_FILE}" ]]; then
  echo "ERROR: サービス概要ファイルを指定してください。例: ./service-overview.md" >&2
  exit 1
fi
if [[ ! -f "${OVERVIEW_FILE}" ]]; then
  echo "ERROR: ファイルが見つかりません: ${OVERVIEW_FILE}" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROMPT_TEMPLATE="${ROOT_DIR}/prompts/requirements/phase1_business-requirements.prompt.md"
OUT_FILE="${ROOT_DIR}/docs/requirements/business-requirements.md"

mkdir -p "$(dirname "${OUT_FILE}")"

SERVICE_OVERVIEW="$(cat "${OVERVIEW_FILE}")"

PROMPT_CONTENT="$(perl -0777 -pe "s/\\{サービス概要をここに記述\\}/$ENV{SERVICE_OVERVIEW}/" "${PROMPT_TEMPLATE}")"

echo "==> Generating: ${OUT_FILE}"
echo "==> Using overview: ${OVERVIEW_FILE}"

# Claude Code にプロンプトを渡し、標準出力をファイルへ
SERVICE_OVERVIEW="${SERVICE_OVERVIEW}" claude -p "${PROMPT_CONTENT}" > "${OUT_FILE}"

echo "==> Done."



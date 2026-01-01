#!/usr/bin/env bash
set -euo pipefail

# Phase 2: Phase1 承認後に実行して、技術要件ドキュメント群を生成します。
#
# 使い方:
#   bash scripts/claude/phase2_tech_requirements.sh
#
# 前提:
# - `docs/requirements/business-requirements.md` が存在すること
# - `claude` コマンドが利用できること（Claude Code）

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BR_FILE="${ROOT_DIR}/docs/requirements/business-requirements.md"
PROMPT_FILE="${ROOT_DIR}/prompts/requirements/phase2_tech-requirements.prompt.md"

if [[ ! -f "${BR_FILE}" ]]; then
  echo "ERROR: Phase 1 の成果物が見つかりません: ${BR_FILE}" >&2
  echo "先に Phase 1 を実行してください: make claude-phase1 OVERVIEW_FILE=./service-overview.md" >&2
  exit 1
fi

mkdir -p "${ROOT_DIR}/docs/requirements" "${ROOT_DIR}/docs/architecture"

# Phase2 は「複数ファイルを作る」指示のため、Claude 側でファイル作成が必要です。
# Claude Code がリポジトリ編集可能な状態で実行してください。
echo "==> Running Phase 2 (will create/update docs/* files via Claude Code)"
claude -p "$(cat "${PROMPT_FILE}")"
echo "==> Done."



#!/bin/bash
# PreToolUse hook: developブランチでのReSaveプロジェクト内ファイル編集をブロック

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

if [[ "$CURRENT_BRANCH" == "develop" || "$CURRENT_BRANCH" == "master" ]]; then
  TOOL_INPUT=$(cat)
  FILE_PATH=$(echo "$TOOL_INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path', d.get('path', '')))" 2>/dev/null)

  # ReSaveプロジェクト外のファイルは無条件でスルー
  REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
  if [[ "$FILE_PATH" != "$REPO_ROOT/"* ]]; then
    exit 0
  fi

  # プロジェクト内の .claude/ 配下（フック・設定・スキル）は許可
  if [[ "$FILE_PATH" == "$REPO_ROOT/.claude/"* ]]; then
    exit 0
  fi

  cat << 'BLOCK'
{
  "decision": "block",
  "reason": "developブランチへの直接編集はブロックされました。\n\n機能開発を始めるには /dev-new-feature スキルを使用してください。\nworktreeが自動作成され、feature/ブランチで安全に作業できます。"
}
BLOCK
  exit 0
fi

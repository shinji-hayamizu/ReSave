#!/bin/bash
# PreToolUse hook: developブランチでのEdit/Write をブロック

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

if [[ "$CURRENT_BRANCH" == "develop" || "$CURRENT_BRANCH" == "master" ]]; then
  # .claude/ 配下のファイル（スキル・フック・設定）は編集を許可する
  TOOL_INPUT=$(cat)
  FILE_PATH=$(echo "$TOOL_INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path',''))" 2>/dev/null)

  if [[ "$FILE_PATH" == *"/.claude/"* || "$FILE_PATH" == *"/.claude/skills/"* ]]; then
    echo '{"decision": "approve"}'
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

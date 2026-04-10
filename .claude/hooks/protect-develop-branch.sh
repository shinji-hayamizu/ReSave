#!/bin/bash
# PreToolUse hook: developブランチでのEdit/Write をブロック

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

if [[ "$CURRENT_BRANCH" == "develop" || "$CURRENT_BRANCH" == "master" ]]; then
  cat << 'EOF'
{
  "decision": "block",
  "reason": "developブランチへの直接編集はブロックされました。\n\n機能開発を始めるには /dev-new-feature スキルを使用してください。\nworktreeが自動作成され、feature/ブランチで安全に作業できます。"
}
EOF
  exit 0
fi

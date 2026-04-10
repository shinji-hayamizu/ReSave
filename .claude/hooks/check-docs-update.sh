#!/bin/bash
# Stop hook: ドキュメント・HTMLモック更新チェック
# Claude が応答を終了しようとするたびに発火し、
# src/ 配下のコード変更があればブロックしてドキュメント更新を促す

INPUT=$(cat)

# 二重実行防止: stop_hook_active が true なら即終了許可
STOP_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_ACTIVE" = "true" ]; then
  exit 0
fi

# git diff で変更ファイル取得（develop からの差分、なければ直前コミットとの差分）
CHANGED=$(git diff --name-only develop...HEAD 2>/dev/null || git diff --name-only HEAD~1...HEAD 2>/dev/null || echo "")

# 変更なし → スキップ
if [ -z "$CHANGED" ]; then
  exit 0
fi

# src/ 配下のコード変更を抽出（テスト・設定ファイルを除外）
SRC_CHANGES=$(echo "$CHANGED" | grep -E '^apps/.*/src/' | grep -vE '\.(test|spec)\.(ts|tsx)$' | grep -vE '(tsconfig|package)\.json$' || true)

# src/ 配下の変更なし → スキップ
if [ -z "$SRC_CHANGES" ]; then
  exit 0
fi

# ドキュメント変更もある場合（すでにドキュメント更新済みの可能性） → スキップ
DOC_CHANGES=$(echo "$CHANGED" | grep -E '^docs/requirements/' || true)
if [ -n "$DOC_CHANGES" ]; then
  exit 0
fi

# src/ 配下の変更あり → ブロックして Claude に分析を促す
cat >&2 <<'INSTRUCTIONS'
ドキュメント・HTMLモックの更新チェックが必要です。

以下の手順で確認してください:
1. .claude/skills/validate-ui/mapping.json を読んで変更ファイルから関連仕様ID(F-XXX)を特定
2. 該当する仕様書(docs/requirements/functions/)を読み込み、実装コードとの差分を分析
3. HTMLモック(docs/screens/mock/v2/)との差分も確認
4. 更新が必要な場合はユーザーに提案して承認を得てから更新
5. 更新不要と判断した場合はその旨をユーザーに報告
INSTRUCTIONS

echo "" >&2
echo "変更されたソースファイル:" >&2
echo "$SRC_CHANGES" >&2
exit 2

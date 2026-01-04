---
name: validate-ui
description: 実行中のWebアプリをブラウザで検証し、機能仕様書と比較して不備をタスクリスト化。変更検知で関連機能を並列検証。
allowed-tools: Read, Glob, Grep, Bash, Task, TodoWrite, mcp__chrome-devtools__*
---

# UI仕様検証スキル

## 概要

Chrome DevTools MCPを使用して実行中のWebアプリを操作し、機能仕様書（docs/requirements/functions/）と比較。不備があればタスクリストとして出力する。

## 前提条件

- Webアプリが `localhost:3000` で起動中
- Chrome DevTools MCPが接続済み
- ブラウザでアプリが開かれている状態

## 使用方法

```bash
# 特定機能の検証
/validate-ui F-013-card-create

# カテゴリ全体の検証
/validate-ui card

# 変更検知モード（git diffベース）
/validate-ui --watch

# 全機能の検証
/validate-ui --all
```

## 実行フロー

### 通常モード（単一機能）

1. **仕様読み込み**: `docs/requirements/functions/{category}/{function-id}.md` を読み込み
2. **ブラウザ操作**: Chrome DevTools MCPで該当画面へ遷移
3. **スナップショット取得**: `take_snapshot` でUI要素を取得
4. **仕様比較**: 以下を検証
   - 受け入れ条件（AC）の充足
   - 入力フィールドの存在と属性
   - ボタン/アクションの動作
   - エラーケースの表示
5. **結果出力**: TodoWrite + レポートファイル

### 変更検知モード（--watch）

1. **変更検知**: `git diff --name-only HEAD` で変更ファイル取得
2. **仕様マッピング**: 変更ファイル → 関連仕様を特定
3. **並列検証**: 関連仕様ごとにsubAgentを起動
4. **結果集約**: 全subAgentの結果をマージして出力

## 仕様マッピング

変更されたファイルパスから関連する機能仕様を特定する。

### マッピングルール

```
apps/web/src/components/home/quick-input-form.tsx
  → F-013-card-create (クイック入力)

apps/web/src/app/(main)/cards/new/
  → F-013-card-create (詳細入力)

apps/web/src/app/(main)/cards/[id]/edit/
  → F-014-card-edit

apps/web/src/components/card/
  → F-013, F-014, F-015, F-016

apps/web/src/app/(main)/review/
  → F-020, F-021, F-022

apps/web/src/components/stats/
  → F-030-daily-stats

apps/web/src/app/(auth)/
  → F-001, F-002, F-003
```

詳細は `.claude/skills/validate-ui/mapping.json` を参照。

## 検証項目

### 1. UI要素の存在確認

仕様書の「画面要件」セクションから以下を検証:

- [ ] コンポーネントの存在
- [ ] 入力フィールドのid/placeholder/maxlength
- [ ] ボタンの存在とラベル
- [ ] 条件付き表示要素

### 2. 受け入れ条件（AC）の検証

仕様書の「受け入れ条件」セクションから:

```markdown
- [ ] AC-01: ホーム画面でテキストを入力してカードを作成できること
```

→ 実際にテキスト入力 → 保存 → 結果確認

### 3. エラーケースの検証

仕様書の「エラーケース」セクションから:

```markdown
| E-F013-01 | テキストが空 | テキストを入力してください |
```

→ 空のまま保存 → エラーメッセージ確認

### 4. ビジネスルールの検証

仕様書の「ビジネスルール」セクションから動作を検証。

## 出力形式

### TodoWrite（即時フィードバック）

```
- [pending] F-013 AC-01: 保存ボタンが動作しない
- [pending] F-013 AC-03: テキスト空でも保存ボタンが有効になっている
- [pending] F-014 UI: 削除ボタンが表示されていない
```

### レポートファイル

`.claude/state/ui-validation-{timestamp}.md` に保存:

```markdown
# UI検証レポート - 2026-01-04 12:00:00

## 検証対象
- F-013-card-create
- F-014-card-edit

## 結果サマリー
| 機能 | AC | UI | Error | Total |
|------|----|----|-------|-------|
| F-013 | 2/3 | 5/5 | 1/4 | 8/12 |
| F-014 | 3/3 | 4/5 | 2/3 | 9/11 |

## 詳細

### F-013-card-create

#### 不備
- [ ] AC-03: テキスト空でも保存ボタンが有効（期待: disabled）
- [ ] E-F013-01: エラーメッセージ未表示

#### スクリーンショット
[screenshot-f013-error.png]
```

## 並列実行（subAgent）

`--watch` モード時、関連機能ごとにsubAgentを起動:

```typescript
// 並列実行の疑似コード
const changedSpecs = detectChangedSpecs(gitDiff);
const agents = changedSpecs.map(spec =>
  Task({
    subagent_type: 'Explore',
    prompt: `Validate UI for ${spec.id} against spec...`,
    run_in_background: true
  })
);
await Promise.all(agents);
```

## Chrome DevTools MCP操作例

### スナップショット取得

```
mcp__chrome-devtools__take_snapshot
→ 各要素のuid、role、name、valueを取得
```

### フォーム入力テスト

```
mcp__chrome-devtools__fill({ uid: "input-text", value: "テスト" })
mcp__chrome-devtools__click({ uid: "btn-save" })
mcp__chrome-devtools__take_snapshot
→ 保存後の状態を確認
```

### エラー状態テスト

```
mcp__chrome-devtools__click({ uid: "btn-save" })  // 空のまま
mcp__chrome-devtools__take_snapshot
→ エラーメッセージの存在確認
```

## トラブルシューティング

### ブラウザが接続されていない

```
❌ Chrome DevTools MCP not connected

対処:
1. Chrome を起動
2. localhost:3000 を開く
3. Claude Code を再起動
```

### 要素が見つからない

```
❌ Element not found: uid="btn-save"

対処:
1. take_snapshot で現在の要素一覧を確認
2. 仕様書のidと実装のidを比較
3. 差分をタスクとして記録
```

## 関連ドキュメント

- [機能仕様一覧](../../../docs/requirements/functions/_index.md)
- [ビジネス要件](../../../docs/requirements/business-requirements.md)

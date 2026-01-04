# 変更検知オーケストレーター プロンプト

## 役割

git diffから変更ファイルを検知し、関連する機能仕様を特定して並列検証を実行する。

## 実行手順

### Step 1: 変更ファイルの検出

```bash
git diff --name-only HEAD
# または
git diff --name-only HEAD~1  # 直前コミットとの差分
```

### Step 2: 関連仕様の特定

`mapping.json` を使用して変更ファイル → 関連仕様をマッピング:

```javascript
// 疑似コード
const changedFiles = getChangedFiles();
const relatedSpecs = new Set();

for (const file of changedFiles) {
  const specs = findRelatedSpecs(file, mapping);
  specs.forEach(s => relatedSpecs.add(s));
}

return Array.from(relatedSpecs);
```

### Step 3: 並列subAgent起動

各仕様ごとにExploreエージェントを起動:

```
Task({
  subagent_type: 'Explore',
  prompt: `
    あなたはUI検証エージェントです。

    検証対象: ${specId}
    仕様書: ${specPath}
    画面URL: ${screenUrl}

    prompts/validation-agent.md の手順に従って検証を実行し、
    結果をJSON形式で返してください。
  `,
  run_in_background: true
})
```

### Step 4: 結果の集約

全subAgentの完了を待機し、結果をマージ:

```javascript
const allResults = await Promise.all(agents);
const mergedIssues = allResults.flatMap(r => r.issues);
const summary = {
  total: mergedIssues.length,
  bySpec: groupBy(mergedIssues, 'specId'),
  bySeverity: groupBy(mergedIssues, 'severity')
};
```

### Step 5: 出力

#### TodoWrite（即時フィードバック）

```
issues.forEach(issue => {
  TodoWrite.add({
    content: `${issue.specId} ${issue.type}: ${issue.description}`,
    status: 'pending'
  });
});
```

#### レポートファイル

`.claude/state/ui-validation-{timestamp}.md` に保存

## 変更ファイル → 仕様 マッピングロジック

```typescript
function findRelatedSpecs(filePath: string, mapping: Mapping): string[] {
  // 1. ファイル名から直接マッチ
  const fileName = path.basename(filePath, path.extname(filePath));

  for (const [category, config] of Object.entries(mapping.mappings)) {
    // パターンマッチ
    if (config.patterns.some(p => minimatch(filePath, p))) {
      // 具体的なファイル名マッチ
      if (config.specs[fileName]) {
        return config.specs[fileName];
      }
      // カテゴリのデフォルト
      return config.defaultSpecs;
    }
  }

  return [];
}
```

## 出力例

### コンソール出力

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UI検証結果 - 2026-01-04 12:00:00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

変更検知:
- apps/web/src/components/home/quick-input-form.tsx
- apps/web/src/components/cards/card-input-form.tsx

関連仕様:
- F-013-card-create
- F-014-card-edit

検証結果:
┌──────────────────────┬────────┬────────┬────────┐
│ 仕様                  │ Passed │ Failed │ Total  │
├──────────────────────┼────────┼────────┼────────┤
│ F-013-card-create    │ 10     │ 2      │ 12     │
│ F-014-card-edit      │ 8      │ 1      │ 9      │
├──────────────────────┼────────┼────────┼────────┤
│ Total                │ 18     │ 3      │ 21     │
└──────────────────────┴────────┴────────┴────────┘

不備一覧:
1. [HIGH] F-013 AC-03: 保存ボタンが空入力時にdisabledにならない
2. [MED]  F-013 UI: 文字数カウンターが表示されていない
3. [LOW]  F-014 UI: 削除確認ダイアログのテキストが仕様と異なる

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### レポートファイル

```markdown
# UI検証レポート

**実行日時**: 2026-01-04 12:00:00
**検証モード**: --watch (変更検知)

## 変更ファイル

- `apps/web/src/components/home/quick-input-form.tsx`
- `apps/web/src/components/cards/card-input-form.tsx`

## 検証対象仕様

| ID | 名称 | 画面URL |
|----|------|---------|
| F-013 | カード作成 | /, /cards/new |
| F-014 | カード編集 | /cards/{id}/edit |

## 結果サマリー

| 仕様 | AC | UI | Error | Total | Pass Rate |
|------|----|----|-------|-------|-----------|
| F-013 | 2/3 | 4/5 | 3/4 | 9/12 | 75% |
| F-014 | 3/3 | 4/5 | 1/1 | 8/9 | 89% |

## 不備詳細

### F-013-card-create

#### AC-03: 保存ボタンの無効化 [FAILED]

- **期待**: テキストが空の場合、保存ボタンが非活性になること
- **実際**: 保存ボタンが常に有効
- **重要度**: HIGH
- **修正案**: `QuickInputForm` で `text` が空の場合に `disabled` 属性を設定

#### UI: 文字数カウンター [FAILED]

- **期待**: 文字数カウンター（0/500）が表示されること
- **実際**: カウンター未表示
- **重要度**: MEDIUM

### F-014-card-edit

#### UI: 削除確認テキスト [FAILED]

- **期待**: 「このカードを削除しますか？」
- **実際**: 「削除しますか？」
- **重要度**: LOW

## スクリーンショット

- [f013-quick-input.png](.claude/state/screenshots/f013-quick-input.png)
- [f013-error-state.png](.claude/state/screenshots/f013-error-state.png)
```

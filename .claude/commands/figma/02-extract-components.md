---
description: Figmaの画面/コンポーネントを解析し、実装計画を生成
allowed-tools: Read, Write, Glob, mcp__figma__*
---

# Phase 2: コンポーネント抽出・実装計画

Figmaの特定ページ/フレームを解析し、必要なコンポーネントと実装計画を生成します。

## 使用方法

```bash
/figma/02-extract-components <page-or-frame-name>
```

## 引数

$ARGUMENTS

---

## 実行手順

### Step 1: Figmaノード取得

指定されたページ/フレームの情報を取得:

```
mcp__figma__get_node({
  fileKey: "<from-tokens>",
  nodeId: "<page-or-frame-id>"
})
```

### Step 2: コンポーネント分析

フレーム内の要素を分析し、以下を特定:

#### UI要素の洗い出し

| レイヤー名 | 種類 | 再利用性 | 既存対応 |
|-----------|------|----------|----------|
| Header | レイアウト | 共通 | components/layout/Header |
| CardList | コンテナ | 画面固有 | 新規作成 |
| Card | カード | 共通 | components/ui/Card |
| Button | ボタン | 共通 | components/ui/Button |

#### 階層構造

```
Page: ホーム画面
├── Header (既存)
├── QuickInputForm (画面固有)
│   ├── TextInput (既存 ui/Input)
│   └── SubmitButton (既存 ui/Button)
├── CardList (新規)
│   └── CardItem (新規) × N
│       ├── CardContent
│       └── CardActions
└── BottomNav (既存)
```

### Step 3: 必要なMock APIの特定

画面で必要なデータを分析:

```json
{
  "endpoints": [
    {
      "path": "/api/mock/cards",
      "method": "GET",
      "response": {
        "type": "array",
        "item": {
          "id": "string",
          "text": "string",
          "status": "new | learning | review | completed",
          "next_review_at": "date | null",
          "tags": ["Tag"]
        }
      }
    },
    {
      "path": "/api/mock/cards",
      "method": "POST",
      "body": { "text": "string", "tag_ids": ["string"] },
      "response": { "id": "string", "...": "..." }
    }
  ]
}
```

### Step 4: 実装計画生成

`.claude/state/figma-impl-plan-{page-name}.md`:

```markdown
# 実装計画: {page-name}

## 概要
- Figmaフレーム: {frame-id}
- 推定工数: 3タスク

## 実装順序

### Phase 1: Mock API
- [ ] GET /api/mock/cards - カード一覧
- [ ] POST /api/mock/cards - カード作成

### Phase 2: 共通コンポーネント
- [ ] components/cards/CardItem.tsx (新規)

### Phase 3: 画面固有コンポーネント
- [ ] components/home/CardList.tsx (新規)
- [ ] components/home/QuickInputForm.tsx (既存確認)

### Phase 4: ページ統合
- [ ] app/(main)/page.tsx の更新

## 依存関係
CardList → CardItem → Mock API
```

---

## 出力

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 コンポーネント分析完了: {page-name}

新規作成:
  - CardItem.tsx
  - CardList.tsx

Mock API:
  - GET /api/mock/cards
  - POST /api/mock/cards

実装計画: .claude/state/figma-impl-plan-{page-name}.md

次のステップ:
  /figma/03-create-mock-api {page-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

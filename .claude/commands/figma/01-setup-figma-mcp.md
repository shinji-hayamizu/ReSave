---
description: Figma MCP接続を設定し、デザイントークンを抽出
allowed-tools: Read, Write, Bash, Glob
---

# Phase 1: Figma MCP セットアップ

FigmaデザインをMCP経由でClaude Codeに接続し、デザイントークンを抽出します。

## 使用方法

```bash
/figma/01-setup-figma-mcp <figma-file-url>
```

## 引数

$ARGUMENTS

---

## 実行手順

### Step 1: Figma MCP接続確認

Figma MCPが接続されているか確認:

```bash
claude mcp list
```

接続されていない場合:

```bash
# Figma Dev Mode MCP Server を追加
claude mcp add figma-dev-mode
```

### Step 2: Figmaファイル情報取得

MCP経由でFigmaファイルの情報を取得:

```
mcp__figma__get_file({ fileKey: "<extracted-from-url>" })
```

### Step 3: デザイントークン抽出

Figmaから以下を抽出:

#### カラートークン
```json
{
  "colors": {
    "primary": "#3B82F6",
    "primary-foreground": "#FFFFFF",
    "background": "#FAFAFA",
    "foreground": "#1A1A1A",
    "muted": "#F4F4F5",
    "accent": "#F59E0B",
    "destructive": "#EF4444"
  }
}
```

#### タイポグラフィ
```json
{
  "typography": {
    "font-family": "Inter, system-ui, sans-serif",
    "heading-1": { "size": "2.25rem", "weight": 700, "lineHeight": 1.2 },
    "heading-2": { "size": "1.5rem", "weight": 600, "lineHeight": 1.3 },
    "body": { "size": "1rem", "weight": 400, "lineHeight": 1.5 },
    "caption": { "size": "0.875rem", "weight": 400, "lineHeight": 1.4 }
  }
}
```

#### スペーシング
```json
{
  "spacing": {
    "xs": "0.25rem",
    "sm": "0.5rem",
    "md": "1rem",
    "lg": "1.5rem",
    "xl": "2rem",
    "2xl": "3rem"
  }
}
```

### Step 4: トークンファイル生成

抽出したトークンを以下のファイルに保存:

`.claude/state/figma-tokens.json`:
```json
{
  "figma_file_url": "<url>",
  "extracted_at": "ISO8601",
  "tokens": {
    "colors": { ... },
    "typography": { ... },
    "spacing": { ... },
    "shadows": { ... },
    "radii": { ... }
  }
}
```

### Step 5: Tailwind設定の更新提案

抽出したトークンをTailwind configに反映する差分を提示:

```typescript
// tailwind.config.ts への追加提案
theme: {
  extend: {
    colors: {
      // Figmaから抽出
    }
  }
}
```

---

## 出力

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Figma MCP セットアップ完了

抽出したトークン:
  - カラー: 12色
  - タイポグラフィ: 4スタイル
  - スペーシング: 6サイズ
  - シャドウ: 3種類

保存先: .claude/state/figma-tokens.json

次のステップ:
  /figma/02-extract-components <page-name>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

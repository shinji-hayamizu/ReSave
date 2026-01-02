---
description: トップ画面のデザインサンプルを5パターン生成
allowed-tools: Read, Write, Edit, Glob, Grep, Task
---

# Phase 3a: デザインサンプル生成

## 目的
本番モック構築前に、トップ画面（ダッシュボード）のデザイン方向性を5パターン提示し、ステークホルダーの承認を得る。

---

## 参照ドキュメント
- docs/requirements/business-requirements.md（ブランドカラー確認）
- docs/screens/flow.md（トップ画面の特定）
- docs/screens/components.md（使用コンポーネント確認）

## 出力先
```
mock/sample/
├── pattern-1/
│   ├── index.html
│   └── style.css
├── pattern-2/
│   ├── index.html
│   └── style.css
├── pattern-3/
│   ├── index.html
│   └── style.css
├── pattern-4/
│   ├── index.html
│   └── style.css
├── pattern-5/
│   ├── index.html
│   └── style.css
└── README.md          # 各パターンの説明
```

---

## 5パターンの方向性

### Pattern 1: Professional Blue
- **テーマ**: 信頼感・ビジネス向け
- **Primary**: #2563eb（Blue 600）
- **Accent**: #0ea5e9（Sky 500）
- **Background**: #f8fafc（Slate 50）
- **Sidebar**: #1e293b（Slate 800）
- **特徴**: クリーンでフォーマル、企業向けSaaS風

### Pattern 2: Modern Dark
- **テーマ**: モダン・開発者向け
- **Primary**: #8b5cf6（Violet 500）
- **Accent**: #06b6d4（Cyan 500）
- **Background**: #0f172a（Slate 900）
- **Sidebar**: #1e1e2e（カスタムダーク）
- **特徴**: ダークモード、GitHub/VS Code風

### Pattern 3: Warm Gradient
- **テーマ**: 親しみやすさ・コンシューマー向け
- **Primary**: #f97316（Orange 500）
- **Accent**: #eab308（Yellow 500）
- **Background**: #fffbeb（Amber 50）
- **Sidebar**: #292524（Stone 800）
- **特徴**: 温かみのある配色、グラデーション活用

### Pattern 4: Minimal Green
- **テーマ**: クリーン・エコ・ヘルスケア向け
- **Primary**: #10b981（Emerald 500）
- **Accent**: #14b8a6（Teal 500）
- **Background**: #f0fdf4（Green 50）
- **Sidebar**: #ffffff（White、ボーダー区切り）
- **特徴**: ミニマル、余白重視、ライトサイドバー

### Pattern 5: Bold Contrast
- **テーマ**: インパクト・スタートアップ向け
- **Primary**: #ec4899（Pink 500）
- **Accent**: #a855f7（Purple 500）
- **Background**: #fafafa（Neutral 50）
- **Sidebar**: #18181b（Zinc 900）
- **特徴**: 大胆な配色、カード影強め、アニメーション

---

## 各パターン共通の実装内容

### 画面構成
- YouTube型レスポンシブサイドバー（3段階）
- ダッシュボードレイアウト（カード型グリッド）
- ヘッダー（ロゴ + ユーザーメニュー）
- サンプルデータ入りのカード3-4枚

### 必須要素
- [ ] レスポンシブ動作（モバイル/タブレット/PC）
- [ ] サイドバーホバー展開
- [ ] ボタン（Primary/Secondary）
- [ ] カードコンポーネント
- [ ] アクティブ状態のナビゲーション

---

## 実行手順

### Step 1: ドキュメント確認
```
Read docs/requirements/business-requirements.md
Read docs/screens/flow.md
```
→ トップ画面名とブランドカラー指定を確認

### Step 2: 共通テンプレート作成
基本HTML構造を定義（各パターンで色のみ変更）

### Step 3: subAgent で並列生成
各パターンを subAgent で並列実行:
```
Task: Pattern 1 生成 → mock/sample/pattern-1/
Task: Pattern 2 生成 → mock/sample/pattern-2/
Task: Pattern 3 生成 → mock/sample/pattern-3/
Task: Pattern 4 生成 → mock/sample/pattern-4/
Task: Pattern 5 生成 → mock/sample/pattern-5/
```

### Step 4: README.md 生成
各パターンの説明とプレビュー方法を記載

---

## subAgent への指示テンプレート

```
【パターン名】: Pattern N - [テーマ名]

【カラー定義】
- --color-primary: [値]
- --color-accent: [値]
- --bg-primary: [値]
- --bg-secondary: [値]
- --bg-sidebar: [値]
- --text-primary: [値]
- --text-secondary: [値]

【出力先】
mock/sample/pattern-N/

【実装内容】
1. index.html - ダッシュボード画面
2. style.css - パターン固有のスタイル

【必須機能】
- 3段階レスポンシブ
- サイドバーホバー展開
- サンプルカード表示
```

---

## 完了条件

- [ ] 5パターンすべてが生成されている
- [ ] 各パターンが独立して動作する
- [ ] レスポンシブが正しく動作する
- [ ] README.md に各パターンの説明がある
- [ ] ブラウザで直接開いて確認できる

---

## 次のステップ

デザイン承認後、Phase 3b で選択されたパターンを基に全画面を構築:
```
claude phase3b --pattern=N
```


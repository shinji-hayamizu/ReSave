# ReSave デザインサンプル

トップ画面（ダッシュボード）の5つのデザインパターンです。

## プレビュー方法

各パターンのフォルダ内にある `index.html` をブラウザで直接開いてください。

```bash
# VS Code Live Server 等を使用する場合
cd mock/sample/pattern-1
# ブラウザで index.html を開く

# Python を使用する場合
cd mock/sample
python -m http.server 8080
# http://localhost:8080/pattern-1/ にアクセス
```

---

## パターン一覧

### Pattern 1: Professional Blue
📁 `pattern-1/`

| 項目 | 値 |
|------|-----|
| **テーマ** | 信頼感・ビジネス向け |
| **Primary** | `#2563eb` (Blue 600) |
| **Accent** | `#0ea5e9` (Sky 500) |
| **Background** | `#f8fafc` (Slate 50) |
| **Sidebar** | `#1e293b` (Slate 800) |
| **特徴** | クリーンでフォーマル、企業向けSaaS風 |

**こんな場面に最適:**
- 企業向けの学習管理システム
- 信頼性を重視するサービス
- シンプルで使いやすいUIを求める場合

---

### Pattern 2: Modern Dark
📁 `pattern-2/`

| 項目 | 値 |
|------|-----|
| **テーマ** | モダン・開発者向け |
| **Primary** | `#8b5cf6` (Violet 500) |
| **Accent** | `#06b6d4` (Cyan 500) |
| **Background** | `#0f172a` (Slate 900) |
| **Sidebar** | `#1e1e2e` (カスタムダーク) |
| **特徴** | ダークモード、GitHub/VS Code風 |

**こんな場面に最適:**
- 開発者・エンジニア向けサービス
- 長時間使用するアプリ（目の負担軽減）
- モダンでスタイリッシュな印象を与えたい場合

---

### Pattern 3: Warm Gradient
📁 `pattern-3/`

| 項目 | 値 |
|------|-----|
| **テーマ** | 親しみやすさ・コンシューマー向け |
| **Primary** | `#f97316` (Orange 500) |
| **Accent** | `#eab308` (Yellow 500) |
| **Background** | `#fffbeb` (Amber 50) |
| **Sidebar** | `#292524` (Stone 800) |
| **特徴** | 温かみのある配色、グラデーション活用 |

**こんな場面に最適:**
- 一般消費者向け学習アプリ
- 親しみやすく、楽しい雰囲気を出したい場合
- モチベーションを高めるデザインが必要な場合

---

### Pattern 4: Minimal Green
📁 `pattern-4/`

| 項目 | 値 |
|------|-----|
| **テーマ** | クリーン・エコ・ヘルスケア向け |
| **Primary** | `#10b981` (Emerald 500) |
| **Accent** | `#14b8a6` (Teal 500) |
| **Background** | `#f0fdf4` (Green 50) |
| **Sidebar** | `#ffffff` (White、ボーダー区切り) |
| **特徴** | ミニマル、余白重視、ライトサイドバー |

**こんな場面に最適:**
- 健康・ウェルネス関連サービス
- シンプルで落ち着いたデザインを好むユーザー
- 余白を活かしたクリーンなUI

---

### Pattern 5: Bold Contrast
📁 `pattern-5/`

| 項目 | 値 |
|------|-----|
| **テーマ** | インパクト・スタートアップ向け |
| **Primary** | `#ec4899` (Pink 500) |
| **Accent** | `#a855f7` (Purple 500) |
| **Background** | `#fafafa` (Neutral 50) |
| **Sidebar** | `#18181b` (Zinc 900) |
| **特徴** | 大胆な配色、カード影強め、アニメーション |

**こんな場面に最適:**
- スタートアップ・若年層向けサービス
- インパクトのある第一印象を与えたい場合
- アニメーションで楽しさを演出したい場合

---

## 共通機能

すべてのパターンに以下の機能が実装されています：

- ✅ **3段階レスポンシブ対応**
  - モバイル（〜768px）: ボトムナビゲーション
  - タブレット（768px〜1024px）: アイコンサイドバー（ホバー展開）
  - デスクトップ（1024px〜）: フルサイドバー

- ✅ **ダッシュボードレイアウト**
  - 統計カード（今日の復習、連続学習、習熟率、総カード数）
  - 復習カード一覧
  - 最近のアクティビティ

- ✅ **インタラクション**
  - サイドバーホバー展開
  - ボタンホバーエフェクト
  - カードホバーアニメーション

---

## 選択のポイント

| パターン | ターゲット | 印象 |
|---------|-----------|------|
| Professional Blue | ビジネス・企業 | 信頼・安定 |
| Modern Dark | 開発者・テック系 | モダン・洗練 |
| Warm Gradient | 一般消費者 | 親しみ・楽しさ |
| Minimal Green | ヘルスケア・教育 | 落ち着き・集中 |
| Bold Contrast | スタートアップ・若年層 | インパクト・活力 |

---

## 次のステップ

1. 各パターンをブラウザで確認
2. ステークホルダーとデザインレビュー
3. 選択したパターンを基に全画面を構築

```bash
# 承認後、Phase 3b で全画面モックを生成
claude phase3b --pattern=N
```

---

## ファイル構成

```
mock/sample/
├── pattern-1/
│   ├── index.html    # Professional Blue
│   └── style.css
├── pattern-2/
│   ├── index.html    # Modern Dark
│   └── style.css
├── pattern-3/
│   ├── index.html    # Warm Gradient
│   └── style.css
├── pattern-4/
│   ├── index.html    # Minimal Green
│   └── style.css
├── pattern-5/
│   ├── index.html    # Bold Contrast
│   └── style.css
└── README.md         # このファイル
```

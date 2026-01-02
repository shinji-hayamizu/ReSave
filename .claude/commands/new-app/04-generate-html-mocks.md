---
description: Phase 2 ドキュメントからHTMLモックを並列生成
allowed-tools: Read, Write, Edit, Glob, Grep, Task, WebSearch, WebFetch
---

# Phase 3: HTMLモック生成（サブエージェント並列実行）

## 前提
以下のドキュメントが完了済みであること:
- `docs/requirements/business-requirements.md`
- `docs/architecture/architecture.md`
- `docs/screens/flow.md`
- `docs/screens/components.md`
- `docs/auth/roles.md`
- その他 Phase 2 で生成された全ドキュメント

---

## 参照ドキュメント（必須）
- docs/requirements/business-requirements.md
- docs/screens/flow.md
- docs/screens/components.md
- docs/auth/roles.md
- docs/api/endpoints/*.md

## 実行方法
- このタスクは **ultrathink** で実行すること
- 各HTMLファイルは **subAgent** で並列実行すること

## 出力先
`mock/` ディレクトリに出力

---

## 1. ファイル構成

```
/mock
├── index.html              # エントリーポイント（リダイレクト専用）
├── login.html              # ログイン画面
├── register.html           # 会員登録画面
├── dashboard.html          # ダッシュボード
├── [機能名].html           # 各機能画面
├── settings.html           # 設定画面
├── css/
│   └── style.css           # 共通スタイル
├── js/
│   └── main.js             # 共通JS（サイドバー開閉等）
└── components/             # 共通パーツ確認用（オプション）
    └── styleguide.html
```

※ 具体的なファイル名は `flow.md` の画面遷移図から決定すること

---

## 2. 固定仕様：YouTube型レスポンシブサイドバー

### レイアウト図
```
スマホ（~768px）         タブレット（768~1024px）   PC（1024px~）
┌──────────┐            ┌──────────────┐          ┌─────────────────┐
│  Header  │            │icon│          │          │icon Home   │    │
├──────────┤            │icon│   Main   │          │icon 機能1  │Main│
│          │            │icon│  Content │          │icon 機能2  │Content│
│   Main   │            │    │          │          │icon Settings│   │
│  Content │            └──────────────┘          └─────────────────┘
├──────────┤            アイコンのみ表示            ラベル付きサイドバー
│ NavBar   │            ホバーで展開
└──────────┘
ボトムナビ
```

### 実装要件
- スマホ: ボトムナビゲーション（3-5項目）
- タブレット: 左アイコンバー（ホバーで展開）
- PC: 左サイドバー（常時展開）

---

## 3. メインコンテンツレイアウト

各画面の特性に応じて以下から選択:

| 画面タイプ | レイアウト | 参考 |
|-----------|-----------|------|
| 一覧画面 | リスト型 or グリッド型 | YouTube Home |
| 詳細画面 | 2カラム（メイン + サイド） | 記事詳細 |
| フォーム画面 | センター寄せフォーム | 設定画面 |
| 管理画面 | テーブル型 | Airtable |
| ダッシュボード | カード型グリッド | 統計表示 |

---

## 4. デザイン仕様

### カラー
- `business-requirements.md` にブランドカラー指定があれば使用
- なければ: ニュートラルグレー + アクセントカラー（青系）

### コンポーネント
- `components.md` の定義に従う
- ボタン: Primary / Secondary / Danger
- フォーム要素: 定義されたバリデーションを視覚化
- モーダル / 通知: 定義に従って実装

### レスポンシブ設計
- モバイルファースト
- ブレークポイント: 768px / 1024px

---

## 5. 技術仕様

### CSS
- 外部ライブラリなし（Pure CSS）
- CSS Variables で色・サイズ管理
- BEM風の命名規則

### JavaScript
- Vanilla JS のみ
- サイドバー開閉
- モーダル制御
- フォームバリデーション表示（視覚的フィードバック）

---

## 6. チェックリスト（各画面共通）

### レイアウト
- [ ] 3段階レスポンシブ（スマホ/タブレット/PC）
- [ ] ハンバーガーメニュー開閉機能
- [ ] 現在ページのアクティブ状態ハイライト

### フォーム実装
- [ ] `entities.md` の属性定義に基づくフィールド
- [ ] `business-rules.md` のバリデーションを視覚的に表現
- [ ] エラー状態の表示

### 認証状態の表現
- [ ] ログイン前/後で異なるヘッダー表示
- [ ] ロール別の表示切替（コメントで明示）

---

## 7. 各ファイルの実装指示

### index.html
```html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=login.html">
</head>
<body></body>
</html>
```

### 認証画面（login.html, register.html）
- サイドバーなし
- センター配置のカード型フォーム
- ロゴ + フォーム + フッターリンク

### メイン画面（dashboard.html 等）
- YouTube型サイドバー適用
- ヘッダー: ロゴ + 検索（任意） + ユーザーメニュー
- メインコンテンツ: 画面タイプに応じたレイアウト

### コメント規約
```html
<!--
  画面: [画面名]
  機能: business-requirements.md (F-001)
  ロール: user, admin
  前の画面: login.html
  次の画面: [機能名].html
-->
```

---

## 8. 出力フォーマット

### css/style.css
```css
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-danger: #ef4444;
  --color-success: #22c55e;
  --color-warning: #f59e0b;

  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-sidebar: #1e293b;

  /* Text */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-inverse: #f8fafc;

  /* Spacing */
  --sidebar-width-collapsed: 64px;
  --sidebar-width-expanded: 240px;
  --header-height: 56px;
  --bottom-nav-height: 56px;

  /* Breakpoints */
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1024px;
}

/* Base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* Layout - Mobile First */
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 16px;
  padding-bottom: calc(var(--bottom-nav-height) + 16px);
}

/* Sidebar - Hidden on mobile */
.sidebar {
  display: none;
}

/* Bottom Navigation - Mobile only */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-nav-height);
  background: var(--bg-primary);
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

/* Tablet styles */
@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--sidebar-width-collapsed);
    background: var(--bg-sidebar);
    transition: width 0.2s;
    z-index: 100;
  }

  .sidebar:hover {
    width: var(--sidebar-width-expanded);
  }

  .sidebar__label {
    display: none;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .sidebar:hover .sidebar__label {
    display: inline;
    opacity: 1;
  }

  .main-content {
    margin-left: var(--sidebar-width-collapsed);
    padding-bottom: 16px;
  }
}

/* Desktop styles */
@media (min-width: 1024px) {
  .sidebar {
    width: var(--sidebar-width-expanded);
  }

  .sidebar__label {
    display: inline;
    opacity: 1;
  }

  .main-content {
    margin-left: var(--sidebar-width-expanded);
  }
}

/* Components */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn--primary {
  background: var(--color-primary);
  color: white;
}

.btn--secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid #e2e8f0;
}

.btn--danger {
  background: var(--color-danger);
  color: white;
}

/* Form elements */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 16px;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input--error {
  border-color: var(--color-danger);
}

.form-error {
  color: var(--color-danger);
  font-size: 12px;
  margin-top: 4px;
}

/* Cards */
.card {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Auth layout */
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### js/main.js
```javascript
document.addEventListener('DOMContentLoaded', function() {
  // Sidebar hover behavior (tablet)
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.addEventListener('mouseenter', function() {
      this.classList.add('sidebar--expanded');
    });
    sidebar.addEventListener('mouseleave', function() {
      this.classList.remove('sidebar--expanded');
    });
  }

  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function() {
      mobileMenu.classList.toggle('mobile-menu--open');
    });
  }

  // Form validation display
  const forms = document.querySelectorAll('form[data-validate]');
  forms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const inputs = form.querySelectorAll('[required]');
      let isValid = true;

      inputs.forEach(function(input) {
        const errorEl = input.parentElement.querySelector('.form-error');
        if (!input.value.trim()) {
          input.classList.add('form-input--error');
          if (errorEl) errorEl.style.display = 'block';
          isValid = false;
        } else {
          input.classList.remove('form-input--error');
          if (errorEl) errorEl.style.display = 'none';
        }
      });

      if (isValid) {
        alert('Form submitted (mock)');
      }
    });
  });

  // Active nav item
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link, .sidebar__link, .bottom-nav__link');
  navLinks.forEach(function(link) {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
    }
  });
});
```

---

## 9. subAgent への個別指示

各 subAgent には以下を渡すこと:

1. 対象ファイル名
2. 関連する設計ドキュメントの該当部分
3. 前後の画面情報（遷移先）
4. 使用するレイアウトパターン
5. 必要なコンポーネント一覧
6. css/style.css と js/main.js の内容（共通スタイル・JS）

---

## 完了条件

- [ ] すべての画面がHTMLファイルとして生成されている
- [ ] css/style.css が生成されている
- [ ] js/main.js が生成されている
- [ ] 3段階レスポンシブが動作する
- [ ] サイドバーのホバー展開が動作する
- [ ] 各画面冒頭にコメントで画面情報が記載されている
- [ ] flow.md の遷移図と整合している
- [ ] components.md の定義と整合している

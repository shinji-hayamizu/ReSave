# ReSave デザイン・UI/UX 改善計画

## 方針

- **デザイントーン**: 現状の青系（Sky Blue）を維持しつつ、細部を洗練
- **フォント**: 日本語対応フォント追加（Noto Sans JP推奨 - 青系との相性良好）
- **アプローチ**: Phase 1-3 で段階的に全体改善

---

## Phase 1: 基盤改善（高優先度）

### 1.1 フォント変更

**対象ファイル**: `apps/web/src/app/layout.tsx`

**現状**:
```typescript
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
```

**改善内容**:
- `Noto Sans JP` を日本語用に追加（本文）
- `Inter` は英数字用に維持
- Variable font で最適化

```typescript
import { Inter, Noto_Sans_JP } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-jp',
});
```

---

### 1.2 CSS変数の統一（StudyCard）

**対象ファイル**: `apps/web/src/components/ui/study-card.tsx`

**問題**: ハードコードされたTailwindカラー
```tsx
// 現状
className="bg-emerald-100 text-emerald-600"  // 緑
className="bg-rose-100 text-rose-500"        // 赤
```

**改善内容**:
```tsx
// 改善後 - CSS変数を使用
className="bg-success/10 text-success hover:bg-success/20"  // 緑
className="bg-destructive/10 text-destructive hover:bg-destructive/20"  // 赤
```

---

### 1.3 サイドバーに統計・ログアウト追加

**対象ファイル**: `apps/web/src/components/layout/app-sidebar.tsx`

**現状**:
```typescript
const navItems = [
  { title: 'ホーム', href: '/', icon: Home },
  { title: 'タグ', href: '/tags', icon: Tag },
  { title: '設定', href: '/settings', icon: Settings },
];
```

**改善内容**:
```typescript
const navItems = [
  { title: 'ホーム', href: '/', icon: Home },
  { title: 'タグ', href: '/tags', icon: Tag },
  { title: '統計', href: '/stats', icon: BarChart3 },
  { title: '設定', href: '/settings', icon: Settings },
];

// フッターにログアウトボタン追加
```

---

### 1.4 ログイン画面にブランドロゴ追加

**対象ファイル**: `apps/web/src/components/auth/login-form.tsx`

**改善内容**:
- CardHeader に「ReSave」ロゴ + アイコン追加
- サブタイトル追加（「記憶を科学する」）

---

### 1.5 モバイルナビにも統計追加

**対象ファイル**: `apps/web/src/components/layout/mobile-nav.tsx`

**改善内容**: 統計リンクを追加

---

## Phase 2: コンポーネント改善（中優先度）

### 2.1 タブUIの視認性向上

**対象ファイル**: `apps/web/src/components/home/card-tabs.tsx`

**改善内容**:
- アクティブタブに背景色追加（現在は下線のみ）
- バッジの色をCSS変数化
  - 未学習: `--warning` (amber系)
  - 復習中: `--primary` (blue系)
  - 完了: `--success` (green系)

---

### 2.2 アニメーション調整

**対象ファイル**: `apps/web/src/components/ui/study-card.tsx`

**改善内容**:
- `duration-100` → `duration-200` に延長
- ease-out のまま維持

---

### 2.3 空状態のビジュアル強化

**対象ファイル**: `apps/web/src/components/ui/empty-state.tsx`

**改善内容**:
- アイコンサイズ拡大
- 背景に薄いグラデーション追加
- 誘導ボタン追加（「カードを作成」）

---

### 2.4 ホーム画面に今日の進捗サマリー追加

**対象ファイル**: `apps/web/src/app/(main)/page.tsx`

**改善内容**:
- 上部に簡易統計カード追加
  - 今日学習したカード数
  - 連続学習日数（ストリーク）

---

## Phase 3: 細部の改善（低優先度）

### 3.1 背景にテクスチャ追加

**対象ファイル**: `apps/web/src/app/globals.css`

**改善内容**:
```css
body {
  background-image: linear-gradient(to bottom, hsl(var(--background)), hsl(210 40% 96%));
  background-attachment: fixed;
}
```

---

### 3.2 タッチターゲットサイズ確保

**対象**: 各種ボタンコンポーネント

**改善内容**:
- `h-8 w-8` → モバイルでは `h-11 w-11` (44px)
- `min-h-[44px] min-w-[44px]` をモバイル時に適用

---

### 3.3 prefers-reduced-motion 対応

**対象ファイル**: `apps/web/src/app/globals.css`

**改善内容**:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 3.4 コントラスト比改善

**対象ファイル**: `apps/web/src/app/globals.css`

**改善内容**:
- `--muted-foreground` の明度を下げて可読性向上
- 現状: `215.4 16.3% 46.9%` → 改善: `215.4 16.3% 40%`

---

## 修正対象ファイル一覧

| ファイル | Phase | 変更内容 |
|---------|-------|---------|
| `apps/web/src/app/layout.tsx` | 1 | フォント追加 |
| `apps/web/src/app/globals.css` | 1,3 | CSS変数追加、背景、motion対応 |
| `apps/web/src/components/ui/study-card.tsx` | 1,2 | カラー統一、アニメーション調整 |
| `apps/web/src/components/layout/app-sidebar.tsx` | 1 | 統計・ログアウト追加 |
| `apps/web/src/components/layout/mobile-nav.tsx` | 1 | 統計追加 |
| `apps/web/src/components/auth/login-form.tsx` | 1 | ブランドロゴ追加 |
| `apps/web/src/components/home/card-tabs.tsx` | 2 | 視認性向上 |
| `apps/web/src/components/ui/empty-state.tsx` | 2 | ビジュアル強化 |
| `apps/web/src/app/(main)/page.tsx` | 2 | 進捗サマリー追加 |
| `apps/web/tailwind.config.ts` | 1 | フォント変数追加 |

---

## 検証方法

1. **ビルド確認**: `pnpm build` が成功すること
2. **視覚確認**: 各画面をブラウザで確認
   - ログイン画面
   - ホーム画面（カードあり/なし）
   - タグ画面
   - 設定画面
3. **レスポンシブ確認**: モバイル/タブレット/デスクトップで表示確認
4. **ダークモード確認**: ダークモードでの表示確認
5. **E2Eテスト**: 既存テストが通ること

---

## 参照ファイル

- `apps/web/src/app/layout.tsx` - フォント設定
- `apps/web/src/app/globals.css` - CSS変数定義
- `apps/web/src/components/ui/study-card.tsx` - 学習カード
- `apps/web/src/components/layout/app-sidebar.tsx` - サイドバー
- `apps/web/src/components/layout/mobile-nav.tsx` - モバイルナビ
- `apps/web/src/components/auth/login-form.tsx` - ログインフォーム
- `apps/web/src/components/home/card-tabs.tsx` - タブUI
- `docs/screens/mock/sample/README.md` - デザインパターン候補

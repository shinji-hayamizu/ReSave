# 今後対応機能リスト / Future Features Roadmap

## 概要 / Overview

本ドキュメントは、ReSaveの今後のリリースで検討している機能をまとめたロードマップです。
優先度と実装難易度に基づいてフェーズ分けしています。

This document outlines the features planned for future releases of ReSave.
Features are organized by phase based on priority and implementation complexity.

---

## フェーズ定義 / Phase Definitions

| フェーズ / Phase | 時期 / Timeline | 説明 / Description |
|-----------------|----------------|-------------------|
| Phase 1 | MVP後すぐ / Post-MVP | ユーザーフィードバックに基づく改善 |
| Phase 2 | 3-6ヶ月後 / 3-6 months | 競争力強化機能 |
| Phase 3 | 6-12ヶ月後 / 6-12 months | 収益化・拡張機能 |
| Future | 検討中 / Under consideration | 長期的な検討事項 |

---

## Phase 1: MVP後改善 / Post-MVP Improvements

### 1.1 UX改善 / UX Improvements

| ID | 機能 / Feature | 説明 / Description | 優先度 / Priority |
|----|---------------|-------------------|------------------|
| P1-001 | ダークモード / Dark Mode | システム設定連動のダークテーマ | 高 / High |
| P1-002 | キーボードショートカット / Keyboard Shortcuts | 学習画面でのキーボード操作対応 | 高 / High |
| P1-003 | スワイプ操作 / Swipe Gestures | モバイルでカードをスワイプして評価 | 高 / High |
| P1-004 | オンボーディング / Onboarding | 初回利用時のチュートリアル | 中 / Medium |
| P1-005 | スケルトンローディング / Skeleton Loading | 読み込み中のUI改善 | 中 / Medium |

### 1.2 学習機能強化 / Learning Enhancements

| ID | 機能 / Feature | 説明 / Description | 優先度 / Priority |
|----|---------------|-------------------|------------------|
| P1-010 | カスタム学習目標 / Custom Goals | 1日の学習枚数目標設定 | 高 / High |
| P1-011 | 学習セッション終了画面 / Session Summary | 学習終了時の成績サマリー表示 | 高 / High |
| P1-012 | 復習優先度調整 / Review Priority | 期限切れカードの優先表示 | 中 / Medium |
| P1-013 | フィルター学習 / Filtered Study | タグ・難易度でカードをフィルタ | 中 / Medium |

### 1.3 通知改善 / Notification Improvements

| ID | 機能 / Feature | 説明 / Description | 優先度 / Priority |
|----|---------------|-------------------|------------------|
| P1-020 | スマート通知 / Smart Notifications | 学習パターンに基づく最適な通知時間 | 中 / Medium |
| P1-021 | 通知カスタマイズ / Notification Customization | 曜日・時間帯の詳細設定 | 中 / Medium |
| P1-022 | ウィジェット / Widgets | iOS/Android ホーム画面ウィジェット | 低 / Low |

---

## Phase 2: 競争力強化 / Competitive Features

### 2.1 コンテンツ作成支援 / Content Creation

| ID | 機能 / Feature | 説明 / Description | 優先度 / Priority |
|----|---------------|-------------------|------------------|
| P2-001 | AI カード生成 / AI Card Generation | テキストからカードを自動生成（GPT API） | 高 / High |
| P2-002 | 画像OCR / Image OCR | 画像からテキストを抽出してカード作成 | 中 / Medium |
| P2-003 | 音声入力 / Voice Input | 音声でカードを作成 | 低 / Low |
| P2-004 | PDF インポート / PDF Import | PDFからカードを一括生成 | 中 / Medium |
| P2-005 | Markdown サポート / Markdown Support | カード内でMarkdown記法を使用 | 中 / Medium |
| P2-006 | 数式サポート / Math Support | LaTeX/KaTeX での数式表示 | 中 / Medium |

### 2.2 ソーシャル機能 / Social Features

| ID | 機能 / Feature | 説明 / Description | 優先度 / Priority |
|----|---------------|-------------------|------------------|
| P2-010 | デッキ共有 / Deck Sharing | 公開URLでデッキを共有 | 高 / High |
| P2-011 | デッキマーケット / Deck Marketplace | 公開デッキの検索・コピー | 高 / High |
| P2-012 | フォロー機能 / Follow Users | 他ユーザーをフォローして新デッキを発見 | 中 / Medium |
| P2-013 | いいね・レビュー / Likes & Reviews | 公開デッキへの評価機能 | 中 / Medium |
| P2-014 | 共同編集 / Collaborative Editing | 複数人でデッキを編集 | 低 / Low |

### 2.3 ゲーミフィケーション / Gamification

| ID | 機能 / Feature | 説明 / Description | 優先度 / Priority |
|----|---------------|-------------------|------------------|
| P2-020 | バッジシステム / Badge System | 学習実績に応じてバッジ付与 | 中 / Medium |
| P2-021 | レベルシステム / Level System | 累計学習量でレベルアップ | 中 / Medium |
| P2-022 | リーダーボード / Leaderboard | 週間・月間ランキング | 低 / Low |
| P2-023 | チャレンジ / Challenges | 期間限定の学習チャレンジ | 低 / Low |

### 2.4 分析機能強化 / Advanced Analytics

| ID | 機能 / Feature | 説明 / Description | 優先度 / Priority |
|----|---------------|-------------------|------------------|
| P2-030 | 詳細統計 / Detailed Stats | 時間帯別・曜日別の学習パターン分析 | 中 / Medium |
| P2-031 | 予測機能 / Predictions | 習熟度到達日の予測 | 中 / Medium |
| P2-032 | 弱点分析 / Weakness Analysis | 苦手カード・タグの自動検出 | 中 / Medium |
| P2-033 | エクスポート / Export Stats | 統計データのCSV/PDFエクスポート | 低 / Low |

---

## Phase 3: 収益化・拡張 / Monetization & Extension

### 3.1 プレミアム機能 / Premium Features

| ID | 機能 / Feature | 説明 / Description | 価格帯 / Pricing |
|----|---------------|-------------------|-----------------|
| P3-001 | 無制限デッキ / Unlimited Decks | デッキ数の制限解除 | Premium |
| P3-002 | 無制限カード / Unlimited Cards | カード数の制限解除 | Premium |
| P3-003 | 高度なAI機能 / Advanced AI | AI生成の回数制限解除 | Premium |
| P3-004 | 優先サポート / Priority Support | 優先カスタマーサポート | Premium |
| P3-005 | カスタムテーマ / Custom Themes | 独自のカラーテーマ設定 | Premium |
| P3-006 | 広告非表示 / Ad-Free | 広告の非表示 | Premium |

### 3.2 決済・サブスクリプション / Payment & Subscription

| ID | 機能 / Feature | 説明 / Description | 優先度 / Priority |
|----|---------------|-------------------|------------------|
| P3-010 | Stripe 連携 / Stripe Integration | クレジットカード決済 | 必須 / Required |
| P3-011 | Apple IAP | App Store 課金 | 必須 / Required |
| P3-012 | Google Play Billing | Play Store 課金 | 必須 / Required |
| P3-013 | 年間プラン / Annual Plan | 年間割引プラン | 中 / Medium |
| P3-014 | ファミリープラン / Family Plan | 家族向け割引プラン | 低 / Low |

### 3.3 エンタープライズ / Enterprise

| ID | 機能 / Feature | 説明 / Description | 優先度 / Priority |
|----|---------------|-------------------|------------------|
| P3-020 | チーム管理 / Team Management | 組織単位でのユーザー管理 | 低 / Low |
| P3-021 | SSO連携 / SSO Integration | SAML/OIDC でのシングルサインオン | 低 / Low |
| P3-022 | 管理者ダッシュボード / Admin Dashboard | 学習進捗の組織横断レポート | 低 / Low |
| P3-023 | カスタムブランディング / Custom Branding | ロゴ・カラーのカスタマイズ | 低 / Low |

---

## Future: 長期検討事項 / Long-term Considerations

### 技術的拡張 / Technical Extensions

| ID | 機能 / Feature | 説明 / Description | 検討理由 / Rationale |
|----|---------------|-------------------|---------------------|
| F-001 | PWA対応 / PWA Support | オフライン対応・インストール可能化 | モバイルアプリ不要でインストール体験を提供 |
| F-002 | Apple Watch / Wear OS | ウェアラブルデバイス対応 | 隙間時間での学習促進 |
| F-003 | ブラウザ拡張 / Browser Extension | Webページからカードを直接作成 | カード作成の効率化 |
| F-004 | Notion連携 / Notion Integration | Notionからカードをインポート | 既存ナレッジベースの活用 |
| F-005 | Anki互換 / Anki Compatibility | Ankiデッキのインポート・エクスポート | Ankiユーザーの移行促進 |

### 学習科学の発展 / Learning Science Advances

| ID | 機能 / Feature | 説明 / Description | 検討理由 / Rationale |
|----|---------------|-------------------|---------------------|
| F-010 | アクティブリコール強化 / Active Recall | ヒント機能、穴埋め問題 | 記憶定着率の向上 |
| F-011 | インターリービング / Interleaving | 複数デッキの混合学習 | 転移学習の促進 |
| F-012 | 生成効果 / Generation Effect | 答えを自分で入力するモード | 記憶エンコーディングの強化 |
| F-013 | 睡眠学習連携 / Sleep Learning | 就寝前復習の最適化 | 睡眠中の記憶固定化を活用 |

### 新規プラットフォーム / New Platforms

| ID | 機能 / Feature | 説明 / Description | 検討理由 / Rationale |
|----|---------------|-------------------|---------------------|
| F-020 | デスクトップアプリ / Desktop App | Electron/Tauri でのネイティブアプリ | オフライン完全対応 |
| F-021 | CLI ツール / CLI Tool | コマンドラインでのカード管理 | 開発者向け効率化 |
| F-022 | API公開 / Public API | サードパーティ連携用API | エコシステム拡大 |

---

## 優先度の判断基準 / Priority Criteria

| 基準 / Criterion | 重み / Weight | 説明 / Description |
|-----------------|--------------|-------------------|
| ユーザー影響度 / User Impact | 40% | 多くのユーザーに恩恵があるか |
| 差別化効果 / Differentiation | 25% | 競合との差別化につながるか |
| 実装難易度 / Complexity | 20% | 開発・保守コストは適切か |
| 収益貢献 / Revenue Impact | 15% | 収益向上に寄与するか |

---

## 実装検討時のチェックリスト / Implementation Checklist

新機能を実装する前に、以下を確認すること:

- [ ] ユーザーストーリーが明確に定義されているか
- [ ] 技術的な実現可能性を検証したか
- [ ] 既存機能への影響を評価したか
- [ ] セキュリティ・プライバシーへの影響を検討したか
- [ ] パフォーマンスへの影響を見積もったか
- [ ] テスト計画を策定したか
- [ ] ドキュメント更新計画があるか
- [ ] ロールバック計画があるか

---

## 変更履歴 / Change History

| 日付 / Date | バージョン / Version | 変更内容 / Changes | 作成者 / Author |
|------------|---------------------|-------------------|----------------|
| 2026-01-02 | 1.0 | 初版作成 / Initial version | Claude Code |

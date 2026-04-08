# ReSave ドキュメント

> 最終更新: 2026-04-07

## 概要

ReSaveは、忘却曲線に基づいた間隔反復システム（SRS）を採用した記憶カードアプリです。本ディレクトリには、開発・運用に必要なドキュメントが格納されています。

## ドキュメント構成

```
docs/
├── README.md                    # 本ファイル
├── DEPLOYMENT.md                # デプロイガイド
│
├── requirements/                # 要件定義
│   ├── business-requirements.md # ビジネス要件
│   ├── functional-specification.md # 機能詳細仕様
│   ├── architecture.md          # システムアーキテクチャ
│   ├── non-functional.md        # 非機能要件
│   ├── future-features.md       # 今後対応機能リスト
│   └── functions/               # 機能別詳細仕様
│       ├── _index.md            # 機能一覧・設計方針
│       ├── auth/                # 認証関連 (F-001~003)
│       ├── card/                # カード管理 (F-013~016)
│       ├── tag/                 # タグ管理 (F-017~018)
│       ├── review/              # 学習・復習 (F-020~023)
│       ├── stats/               # 統計 (F-030)
│       └── sync/                # データ同期 (F-050)
│
├── screens/                     # 画面設計
│   ├── flow.md                  # 画面遷移図・UI構成
│   └── mock/                    # HTMLモック
│
├── operations/                  # 運用
│   ├── production-deploy-flow.md # 本番デプロイフロー
│   └── mobile-release.md        # モバイルリリース手順
│
└── plans/                       # 実装計画（セッション単位）
```

## クイックリンク

### 要件定義

| ドキュメント | 説明 |
|-------------|------|
| [ビジネス要件](./requirements/business-requirements.md) | ユーザーストーリー、機能要件、ビジネスリスク |
| [機能詳細仕様](./requirements/functional-specification.md) | SRSアルゴリズム、各機能の詳細仕様 |
| [アーキテクチャ](./requirements/architecture.md) | システム構成、技術スタック、DB設計、API設計 |
| [非機能要件](./requirements/non-functional.md) | パフォーマンス、可用性、セキュリティ要件 |
| [今後対応機能](./requirements/future-features.md) | ロードマップ、将来機能 |

### 機能別仕様

| ドキュメント | 説明 |
|-------------|------|
| [機能一覧](./requirements/functions/_index.md) | 全機能のインデックス、設計方針 |
| [認証 (F-001~003)](./requirements/functions/auth/) | ユーザー登録、ログイン、パスワードリセット |
| [カード管理 (F-013~016)](./requirements/functions/card/) | カードCRUD、タグ付け |
| [タグ管理 (F-017~018)](./requirements/functions/tag/) | タグCRUD、フィルタ・検索 |
| [学習・復習 (F-020~023)](./requirements/functions/review/) | 今日の復習、カード学習、自己評価、間隔スケジューリング |
| [統計 (F-030)](./requirements/functions/stats/) | 日別学習統計 |
| [データ同期 (F-050)](./requirements/functions/sync/) | Web/Mobile間の自動同期 |

### 画面設計・運用

| ドキュメント | 説明 |
|-------------|------|
| [画面遷移図](./screens/flow.md) | 画面フロー、UI構成、各画面のワイヤーフレーム |
| [デプロイガイド](./DEPLOYMENT.md) | Vercel + Supabase デプロイ設定 |
| [本番デプロイフロー](./operations/production-deploy-flow.md) | リリース手順、ロールバック |
| [モバイルリリース](./operations/mobile-release.md) | Expo ストア申請手順 |

## 機能ID対応表

| 機能ID | 機能名 | 関連仕様 |
|--------|--------|---------|
| F-001~F-003 | 認証・ユーザー管理 | [認証仕様](./requirements/functions/auth/) |
| F-013~F-016 | カード管理 | [カード仕様](./requirements/functions/card/) |
| F-017~F-018 | タグ管理 | [タグ仕様](./requirements/functions/tag/) |
| F-020~F-023 | 学習・復習 | [学習仕様](./requirements/functions/review/) |
| F-030 | 進捗・統計 | [統計仕様](./requirements/functions/stats/) |
| F-050 | データ同期 | [同期仕様](./requirements/functions/sync/) |

## 変更履歴

| 日付 | 内容 | 担当 |
|------|------|------|
| 2026-01-02 | 初版作成 | Claude Code |
| 2026-04-07 | 実在するドキュメントに合わせて構成を整理、存在しないリンクを削除 | Claude Code |

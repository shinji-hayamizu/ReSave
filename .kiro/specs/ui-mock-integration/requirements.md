# Requirements Document

## Project Description (Input)
UIをモックにしたがって全てつくり、APIとつなぎこむ

## Introduction
本仕様書は、ReSave（忘却曲線ベースの間隔反復記憶カードアプリ）のUI実装要件を定義する。HTMLモック（docs/screens/mock/v1/）を基準として、既存のServer Actions、API Routes、TanStack Queryフックと連携したReactコンポーネントを実装する。

### 対象範囲
- 認証画面（ログイン、新規登録、パスワードリセット）
- メインアプリケーションレイアウト（サイドバー、ヘッダー）
- ホーム画面（クイック入力、カードリスト、評価ボタン）
- カード入力/編集画面
- タグ管理画面
- 統計画面
- 設定画面

### 技術スタック
- Next.js 16 + React 19 + App Router
- Tailwind CSS + shadcn/ui
- TanStack Query（データフェッチ）
- Zod（バリデーション）
- Supabase Auth（認証）

---

## Requirements

### Requirement 1: 認証画面（Authentication Screens）
**Objective:** ユーザーとして、アカウントの作成・ログイン・パスワードリセットを行いたい。安全にアプリケーションを利用できるようにするため。

#### Acceptance Criteria
1. When ユーザーがログイン画面にアクセスした時, the LoginPage shall メールアドレスとパスワードの入力フォームを表示する
2. When ユーザーが正しい認証情報を入力してログインボタンをクリックした時, the LoginForm shall Supabase Authを使用して認証を行い、成功時にホーム画面へリダイレクトする
3. If 認証情報が不正な場合, the LoginForm shall 「メールアドレスまたはパスワードが正しくありません」というエラーメッセージを表示する
4. If メールアドレスが未確認の場合, the LoginForm shall 警告メッセージと確認メール再送リンクを表示する
5. When ユーザーがパスワード表示トグルをクリックした時, the PasswordInput shall パスワードの表示/非表示を切り替える
6. When ユーザーが「新規登録はこちら」リンクをクリックした時, the LoginPage shall 新規登録画面へ遷移する
7. When ユーザーが「パスワードを忘れた方」リンクをクリックした時, the LoginPage shall パスワードリセット画面へ遷移する
8. The GoogleLoginButton shall v1.1まで無効状態で表示する

#### 関連モック
- `login.html` - ログイン画面
- `register.html` - 新規登録画面
- `password-reset.html` - パスワードリセット画面

---

### Requirement 2: アプリケーションレイアウト（Application Layout）
**Objective:** ユーザーとして、統一されたナビゲーションとレイアウトでアプリを利用したい。直感的に各機能へアクセスできるようにするため。

#### Acceptance Criteria
1. The AppLayout shall 認証済みユーザーに対してサイドバーとヘッダーを含むレイアウトを表示する
2. When ユーザーがサイドバーのナビゲーション項目をクリックした時, the Sidebar shall 対応する画面へ遷移する
3. The Sidebar shall ホーム、タグ管理、統計、設定へのナビゲーションリンクを表示する
4. While 現在のページがアクティブな場合, the Sidebar shall 該当のナビゲーション項目をハイライト表示する
5. The Header shall ユーザーアバターまたはアイコンを右上に表示する
6. When モバイル画面幅の場合, the Layout shall レスポンシブなモバイルナビゲーションを表示する

#### 関連モック
- `index.html` - アプリケーションレイアウト（サイドバー、ヘッダー、コンテンツフレーム）

---

### Requirement 3: ホーム画面 - クイック入力（Home Page - Quick Input）
**Objective:** ユーザーとして、素早くカードを作成したい。学習の開始までの手間を最小化するため。

#### Acceptance Criteria
1. The QuickInputForm shall 「覚えたいこと」と「答え（任意）」の2つの入力フィールドを表示する
2. While 「覚えたいこと」フィールドが空の場合, the QuickInputForm shall 保存ボタンを無効化する
3. When ユーザーがテキストを入力して保存ボタンをクリックした時, the QuickInputForm shall `useCreateCard`フックを使用してカードを作成する
4. When カードが正常に作成された時, the QuickInputForm shall 入力フィールドをクリアし、カードリストを更新する
5. When ユーザーが「詳細入力」ボタンをクリックした時, the QuickInputForm shall カード入力画面へ遷移する
6. The テキスト入力フィールド shall 最大500文字の制限を持つ
7. The 隠しテキスト入力フィールド shall 最大2000文字の制限を持つ

#### 関連機能仕様
- F-013: カード作成

#### 関連モック
- `main.html` - QuickInputFormコンポーネント

---

### Requirement 4: ホーム画面 - カードタブとリスト（Home Page - Card Tabs & List）
**Objective:** ユーザーとして、カードを学習状態別に分類して表示したい。効率的に復習を管理できるようにするため。

#### Acceptance Criteria
1. The CardTabs shall 「未学習」「復習中」「完了」の3つのタブを表示する
2. The CardTabs shall 各タブに該当するカード数をバッジとして表示する
3. When ユーザーがタブをクリックした時, the CardTabs shall アクティブタブを切り替え、対応するカードリストを表示する
4. The CardList shall `useCards`フックを使用してカードデータを取得する
5. While データ読み込み中の場合, the CardList shall ローディングスケルトンを表示する
6. If カードが0件の場合, the CardList shall 「カードがありません」という空状態メッセージを表示する
7. The StudyCard shall カードのテキスト（質問）と付与されたタグを表示する
8. When ユーザーが「答えを見る」ボタンをクリックした時, the StudyCard shall 隠しテキスト（答え）を表示する
9. When 答えが表示されている時にトグルボタンをクリックした場合, the StudyCard shall 答えを非表示にする

#### 関連機能仕様
- F-021: カード学習

#### 関連モック
- `main.html` - CardTabs、CardList、StudyCardコンポーネント

---

### Requirement 5: ホーム画面 - 評価ボタン（Home Page - Rating Buttons）
**Objective:** ユーザーとして、カードの記憶度を自己評価したい。間隔反復スケジュールに反映させるため。

#### Acceptance Criteria
1. The RatingButtons shall 「OK」「覚えた」「もう一度」の3つの評価ボタンを表示する
2. The RatingButtons shall 各ボタンに次回復習までの間隔をプレビュー表示する（例：「3日後」「完了」「1日後」）
3. When ユーザーが「OK」ボタンをクリックした時, the RatingButtons shall `useSubmitAssessment`フックで`assessment: 'ok'`を送信する
4. When ユーザーが「覚えた」ボタンをクリックした時, the RatingButtons shall `useSubmitAssessment`フックで`assessment: 'remembered'`を送信する
5. When ユーザーが「もう一度」ボタンをクリックした時, the RatingButtons shall `useSubmitAssessment`フックで`assessment: 'again'`を送信する
6. When 評価が送信された時, the CardList shall カードリストを自動的に更新する
7. While カードが完了状態の場合, the StudyCard shall RatingButtonsを表示しない

#### 関連機能仕様
- F-022: 記憶度自己評価
- F-023: 固定間隔スケジューリング

#### 関連モック
- `main.html` - RatingButtonsコンポーネント

---

### Requirement 6: カード入力/編集画面（Card Input/Edit Page）
**Objective:** ユーザーとして、カードの詳細情報を入力・編集したい。タグやソースURLなどの追加情報を管理できるようにするため。

#### Acceptance Criteria
1. The CardInputPage shall 「テキスト」「隠しテキスト」の必須セクションを表示する
2. The CardInputPage shall 「タグ」「ソース」「リピート」のオプショナルセクションを表示する
3. While テキストフィールドが空の場合, the CardInputForm shall 保存ボタンを無効化する
4. The TextInput shall 文字数カウンターを表示し、上限に近づくと警告色に変化する
5. When ユーザーがタグセレクターをクリックした時, the TagSelector shall 選択可能なタグ一覧を表示する
6. The TagSelector shall 選択済みタグを削除可能なチップとして表示する
7. The TagSelector shall 最大10個までのタグ選択を許可する
8. The RepeatSelector shall 「間隔反復」「毎日」「毎週」「なし」のオプションを提供する
9. When ユーザーが保存ボタンをクリックした時, the CardInputForm shall `useCreateCard`または`useUpdateCard`フックを使用してデータを保存する
10. When 保存が成功した時, the CardInputPage shall ホーム画面へ遷移する
11. While 編集モードの場合, the CardInputPage shall 削除ボタンを含む危険セクションを表示する
12. When ユーザーが削除ボタンをクリックした時, the CardInputPage shall 削除確認ダイアログを表示する
13. When 削除が確認された時, the CardInputPage shall `useDeleteCard`フックを使用してカードを削除し、ホーム画面へ遷移する

#### 関連機能仕様
- F-013: カード作成
- F-014: カード編集
- F-015: カード削除
- F-016: カードへのタグ付け

#### 関連モック
- `card-input.html` - CardInputPage、CardInputForm、TagSelectorコンポーネント

---

### Requirement 7: タグ管理画面（Tag Management Page）
**Objective:** ユーザーとして、タグを作成・編集・削除したい。カードを効率的に分類・整理できるようにするため。

#### Acceptance Criteria
1. The TagManagementPage shall ページタイトルと「タグ追加」ボタンを含むヘッダーを表示する
2. The TagList shall `useTags`フックを使用してタグ一覧を取得する
3. The TagItem shall タグ名、色、紐付けられたカード数を表示する
4. The TagItem shall 編集ボタンと削除ボタンを表示する
5. When ユーザーが「タグ追加」ボタンをクリックした時, the TagManagementPage shall タグ作成モーダルを表示する
6. When ユーザーが編集ボタンをクリックした時, the TagManagementPage shall タグ編集モーダルを表示する
7. The TagFormModal shall タグ名入力フィールド（最大30文字）と色選択パレットを表示する
8. The 色選択パレット shall 8色（青、緑、紫、オレンジ、ピンク、シアン、黄、グレー）のオプションを提供する
9. When ユーザーがモーダルで保存ボタンをクリックした時, the TagFormModal shall `useCreateTag`または`useUpdateTag`フックを使用してデータを保存する
10. When ユーザーが削除ボタンをクリックした時, the TagManagementPage shall 削除確認モーダルを表示する
11. The DeleteConfirmModal shall タグ名と紐付けられたカード数を表示し、カードは削除されない旨を注意表示する
12. When 削除が確認された時, the TagManagementPage shall `useDeleteTag`フックを使用してタグを削除する
13. If タグが0件の場合, the TagList shall 「タグがありません」という空状態メッセージを表示する

#### 関連機能仕様
- F-017: タグ管理

#### 関連モック
- `tags.html` - TagManagementPage、TagList、TagFormModal、DeleteConfirmModalコンポーネント

---

### Requirement 8: 統計画面（Statistics Page）
**Objective:** ユーザーとして、学習の進捗を確認したい。モチベーションを維持し、学習パターンを把握できるようにするため。

#### Acceptance Criteria
1. The TodaySummary shall 今日の学習カード数、正答率、学習時間、連続学習日数を表示する
2. The TodaySummary shall `useTodayStats`フックを使用してデータを取得する
3. The PeriodTabs shall 「今日」「週間」「月間」の期間切り替えタブを表示する
4. When ユーザーが期間タブをクリックした時, the StatsPage shall 選択された期間の統計データを表示する
5. The StatsChart shall 過去7日間の日別学習カード数を棒グラフで表示する
6. The StatsChart shall `useDailyStats`フックを使用してデータを取得する
7. The CumulativeStats shall 総カード数、総復習回数、最長ストリーク、平均正答率を表示する
8. The CumulativeStats shall `useSummaryStats`フックを使用してデータを取得する
9. While データ読み込み中の場合, the StatsPage shall ローディングスケルトンを表示する

#### 関連機能仕様
- F-030: 日別学習統計

#### 関連モック
- `stats.html` - StatsPage、TodaySummary、PeriodTabs、StatsChart、CumulativeStatsコンポーネント

---

### Requirement 9: 設定画面（Settings Page）
**Objective:** ユーザーとして、アプリの動作やアカウントを設定したい。学習体験をカスタマイズできるようにするため。

#### Acceptance Criteria
1. The LearningSettings shall 「1日の新規カード上限」の数値入力フィールドを表示する
2. The LearningSettings shall 「復習間隔」の詳細設定リンクを表示する
3. The NotificationSettings shall 「復習リマインダー」と「通知時間帯」の設定項目を表示する（v1.2まで無効状態）
4. The AccountSettings shall 現在のメールアドレスを表示する
5. The AccountSettings shall パスワード変更リンクを表示する
6. The AccountSettings shall ログアウトボタンを表示する
7. When ユーザーがログアウトボタンをクリックした時, the AccountSettings shall Supabase Authからログアウトし、ログイン画面へリダイレクトする
8. The DataManagement shall 「データエクスポート」と「データインポート」の設定項目を表示する（v1.3まで無効状態）
9. The AppInfo shall バージョン情報と利用規約・プライバシーポリシーへのリンクを表示する

#### 関連モック
- `settings.html` - SettingsPage、LearningSettings、NotificationSettings、AccountSettings、DataManagement、AppInfoコンポーネント

---

### Requirement 10: 共通UI要件（Common UI Requirements）
**Objective:** ユーザーとして、一貫性のある使いやすいUIを利用したい。学習に集中できる環境を提供するため。

#### Acceptance Criteria
1. The UI shall Tailwind CSSとshadcn/uiコンポーネントを使用してスタイリングする
2. The UI shall HTMLモックのCSSクラス名とデザイントークンに準拠する
3. While API呼び出し中の場合, the UI shall 適切なローディング状態を表示する
4. If API呼び出しが失敗した場合, the UI shall ユーザーフレンドリーなエラーメッセージを表示する
5. The フォーム shall Zodスキーマを使用してクライアントサイドバリデーションを実行する
6. When バリデーションエラーが発生した時, the フォーム shall エラーメッセージを該当フィールドの下に表示する
7. The UI shall モバイルファーストのレスポンシブデザインを実装する
8. The ボタン shall クリック時に適切なフィードバック（ホバー、アクティブ状態）を提供する
9. The モーダル shall ESCキーまたはオーバーレイクリックで閉じることができる
10. The 入力フィールド shall フォーカス時に視覚的なフィードバックを表示する

---

## 画面・ルート対応表

| 画面 | モック | ルート | 主要コンポーネント |
|------|--------|--------|------------------|
| ログイン | login.html | (auth)/login | LoginPage, LoginForm, PasswordInput |
| 新規登録 | register.html | (auth)/register | RegisterPage, RegisterForm |
| パスワードリセット | password-reset.html | (auth)/reset-password | ResetPasswordPage, ResetPasswordForm |
| ホーム | main.html | (main)/home | HomePage, QuickInputForm, CardTabs, CardList, StudyCard, RatingButtons |
| カード入力 | card-input.html | (main)/cards/new | CardInputPage, CardInputForm, TagSelector |
| カード編集 | card-input.html | (main)/cards/[id]/edit | CardInputPage, CardInputForm, TagSelector |
| タグ管理 | tags.html | (main)/tags | TagManagementPage, TagList, TagFormModal, DeleteConfirmModal |
| 統計 | stats.html | (main)/stats | StatsPage, TodaySummary, PeriodTabs, StatsChart, CumulativeStats |
| 設定 | settings.html | (main)/settings | SettingsPage, LearningSettings, AccountSettings, AppInfo |

---

## 使用するHooks・Actions

### カード関連
- `useCards` - カード一覧取得
- `useCreateCard` - カード作成
- `useUpdateCard` - カード更新
- `useDeleteCard` - カード削除

### タグ関連
- `useTags` - タグ一覧取得
- `useCreateTag` - タグ作成
- `useUpdateTag` - タグ更新
- `useDeleteTag` - タグ削除

### 学習関連
- `useStudySession` - 学習セッション取得
- `useSubmitAssessment` - 評価送信

### 統計関連
- `useTodayStats` - 今日の統計
- `useDailyStats` - 日別統計
- `useSummaryStats` - 累計統計

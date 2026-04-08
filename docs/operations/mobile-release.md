# Mobile リリースフロー

## 概要

Expo + EAS Build を使った iOS / Android アプリのリリース手順書。

---

## 前提条件

| 必要なもの | 用途 |
|-----------|------|
| Apple Developer Program ($99/年) | iOS ストア配信 |
| Google Play Console ($25 一回) | Android ストア配信 |
| Expo アカウント (expo.dev) | EAS Build / Submit |
| EAS CLI | ビルド・申請コマンド |

```bash
# EAS CLI インストール
npm install -g eas-cli

# Expo にログイン
eas login
```

---

## 【初回のみ】初期セットアップ

### app.json 修正（必須）

現在の `apps/mobile/app.json` は別プロジェクトの設定が残っているため、**リリース前に必ず修正すること**。

**現状の問題:**

```json
{
  "expo": {
    "name": "BBS Mobile",
    "slug": "bbs-mobile",
    "ios": {
      "bundleIdentifier": "com.bbs.mobile"
    },
    "android": {
      "package": "com.bbs.mobile"
    }
  }
}
```

**修正後（ReSave 向け）:**

```json
{
  "expo": {
    "name": "ReSave",
    "slug": "resave",
    "scheme": "resave",
    "ios": {
      "bundleIdentifier": "com.resave.app",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.resave.app",
      "versionCode": 1
    }
  }
}
```

> **注意:** `bundleIdentifier` / `package` は一度ストアに登録すると変更不可。慎重に決定すること。

---

### EAS プロジェクト設定

```bash
cd apps/mobile

# EAS プロジェクト初期化（初回のみ）
eas init

# eas.json が自動生成されない場合は手動作成
```

**`apps/mobile/eas.json` の内容:**

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

### 証明書設定

#### iOS

```bash
# EAS が自動管理（推奨）
eas credentials

# Apple Developer Account と連携し、証明書・Provisioning Profile を自動設定
```

#### Android

```bash
# EAS が Keystore を自動生成・管理（推奨）
eas credentials

# 重要: Keystore は EAS に保管され、紛失するとアプリ更新不可になる
# eas credentials でバックアップを取得すること
```

---

## リリースフロー

```
[1] develop でテスト
        ↓
[2] バージョン更新（app.json の version / buildNumber / versionCode）
        ↓
[3] eas build --platform all --profile production
        ↓
[4] ビルド確認（expo.dev で状況確認）
        ↓
[5] eas submit --platform all
        ↓
[6] ストア審査・公開
        ↓
[7] Git タグ + GitHub Release（mobile/vX.X.X）
```

---

### Step 1: develop でテスト

```bash
git checkout develop
git pull origin develop

# Mobile 開発サーバー起動
cd apps/mobile
pnpm start

# Development ビルドで実機確認
eas build --profile development --platform ios
eas build --profile development --platform android
```

**確認項目:**
- [ ] ビルドエラーなし
- [ ] 実機 / シミュレーターで主要機能が動作する
- [ ] 今回リリースする機能の動作確認済み

---

### Step 2: バージョン更新

`apps/mobile/app.json` のバージョンを更新する。

```json
{
  "expo": {
    "version": "1.1.0",
    "ios": {
      "buildNumber": "2"
    },
    "android": {
      "versionCode": 2
    }
  }
}
```

| 項目 | 意味 | 更新タイミング |
|------|------|----------------|
| `version` | ユーザーに見えるバージョン（semver） | 機能追加・バグ修正時 |
| `buildNumber` | iOS 内部ビルド番号（整数文字列） | ビルドごとに +1 |
| `versionCode` | Android 内部ビルド番号（整数） | ビルドごとに +1 |

> `eas.json` の `"autoIncrement": true` を設定済みの場合、`buildNumber` / `versionCode` は EAS が自動でインクリメントする。

**コミット:**

```bash
git add apps/mobile/app.json
git commit -m "chore(mobile): bump version to 1.1.0"
git push origin develop
```

---

### Step 3: Production ビルド

```bash
cd apps/mobile

# iOS + Android 同時ビルド
eas build --platform all --profile production

# プラットフォームを分けてビルドする場合
eas build --platform ios --profile production
eas build --platform android --profile production
```

**ビルドには10〜30分程度かかる。**

---

### Step 4: ビルド確認

```bash
# ビルド一覧を確認
eas build:list

# 特定ビルドの詳細
eas build:view
```

または [expo.dev/accounts/\<username\>/projects/\<slug\>/builds](https://expo.dev) でビルド状況を確認。

**確認項目:**
- [ ] ビルドステータスが `FINISHED` になっている
- [ ] iOS: `.ipa` が生成されている
- [ ] Android: `.aab` が生成されている

---

### Step 5: ストアへ申請

```bash
# iOS + Android 同時申請
eas submit --platform all --latest

# プラットフォームを分けて申請する場合
eas submit --platform ios --latest
eas submit --platform android --latest
```

**iOS (App Store Connect) での追加作業:**

1. [App Store Connect](https://appstoreconnect.apple.com) にログイン
2. アプリのバージョンページへ移動
3. スクリーンショット・説明文・リリースノートを確認・更新
4. 「審査に提出」をクリック

**Android (Google Play Console) での追加作業:**

1. [Google Play Console](https://play.google.com/console) にログイン
2. 「内部テスト」→「製品版」へプロモート
3. リリースノートを更新
4. 「審査に提出」をクリック

---

### Step 6: ストア審査・公開

| ストア | 審査期間の目安 |
|--------|----------------|
| App Store (iOS) | 1〜3日（初回は長くなる場合あり） |
| Google Play (Android) | 数時間〜3日 |

審査結果はメールで通知される。リジェクトされた場合はフィードバックに従って修正・再申請する。

---

### Step 7: Git タグ + GitHub Release

```bash
git checkout develop
git pull origin develop

# モバイル専用タグ（Web の v* タグと区別するため mobile/ プレフィックス）
git tag mobile/v1.1.0
git push origin mobile/v1.1.0

# GitHub Release 作成
gh release create mobile/v1.1.0 \
  --title "Mobile v1.1.0" \
  --notes "$(cat <<'EOF'
## What's Changed

### Added
- 新機能の説明

### Fixed
- バグ修正の説明

**Full Changelog**: https://github.com/shinji-hayamizu/ReSave/compare/mobile/v1.0.0...mobile/v1.1.0
EOF
)"
```

---

## OTA アップデート（eas update）

### OTA で更新できる範囲

| 更新可能 | 更新不可（ストア再審査が必要） |
|---------|-------------------------------|
| JavaScript / TypeScript コード | ネイティブモジュールの追加・変更 |
| アセット（画像・フォント等） | `app.json` のネイティブ設定変更 |
| アプリのロジック・UI | 新しい Expo SDK へのアップグレード |
| API エンドポイントの変更対応 | ネイティブ権限の追加 |

### OTA アップデートの配信

```bash
cd apps/mobile

# develop チャンネルへ配信（ステージング確認用）
eas update --channel develop --message "fix: ログイン画面のバグ修正"

# production チャンネルへ配信
eas update --channel production --message "fix: ログイン画面のバグ修正"
```

### OTA アップデートのロールバック

```bash
# 直前のアップデートにロールバック
eas update:rollback --channel production

# 特定のアップデート ID を指定
eas update:republish --group <update-group-id> --channel production
```

---

## トラブルシューティング

### Metro bundler エラー（monorepo 環境）

Turborepo monorepo では Metro の設定が必要な場合がある。

```bash
# キャッシュクリア
cd apps/mobile
pnpm start --clear

# Metro キャッシュを完全削除
rm -rf node_modules/.cache
pnpm install
pnpm start --clear
```

`apps/mobile/metro.config.js` で `watchFolders` に `../../packages` を含めていることを確認:

```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.watchFolders = [
  path.resolve(__dirname, '../../packages'),
];

module.exports = config;
```

---

### iOS: Code Signing エラー

```bash
# 証明書を再取得
eas credentials --platform ios

# ローカルの証明書キャッシュをクリア
eas credentials:sync --platform ios
```

Xcode で手動確認する場合:

1. Xcode → Preferences → Accounts → Apple ID を確認
2. Signing & Capabilities → Automatically manage signing が有効か確認

---

### Android: Keystore 紛失への注意

**Keystore を紛失するとアプリの更新が永久に不可能になる。**

```bash
# EAS に保管されている Keystore のバックアップ
eas credentials --platform android

# Keystore ファイルをローカルに保存
eas credentials:sync --platform android
```

Keystore は安全な場所（パスワードマネージャー等）に必ずバックアップすること。

---

### EAS Build キュー詰まり

無料プランはビルドキューが長くなる場合がある。

```bash
# ビルド状況確認
eas build:list

# ローカルビルド（キューを使わない）
eas build --local --platform ios --profile production
eas build --local --platform android --profile production
```

> ローカルビルドには Xcode（iOS）または Android Studio（Android）が必要。

---

## クイックチェックリスト

```
### リリース前
- [ ] app.json の name / slug / bundleIdentifier が ReSave 向けに修正済み
- [ ] version / buildNumber / versionCode を更新済み
- [ ] 実機 / シミュレーターで動作確認済み
- [ ] eas.json が正しく設定されている

### ビルド・申請
- [ ] eas build --profile production でビルド完了
- [ ] expo.dev でビルドステータスが FINISHED
- [ ] eas submit でストアへ申請済み
- [ ] App Store Connect / Google Play Console でリリース情報を更新済み

### リリース後
- [ ] ストア審査通過・公開確認
- [ ] Git タグ（mobile/vX.X.X）を作成
- [ ] GitHub Release を作成
```

---

## 関連ドキュメント

- [デプロイガイド](../DEPLOYMENT.md)
- [本番環境リリースフロー（Web）](./production-deploy-flow.md)

---
description: architecture.md に基づき、Expoプロジェクトを作成しビルド可能な状態にする
allowed-tools: Read, Write, Edit, Bash
---

# Expoプロジェクト作成

## 手順

### 1. architecture.md を確認
```bash
# docs/requirements/architecture.md を読み込み、以下を確認:
# - ディレクトリ名: mobile/
# - テンプレート: tabs
```

### 2. プロジェクト作成
```bash
npx create-expo-app@latest mobile --template tabs --yes
```

### 3. TypeScriptエラー修正
`mobile/components/ExternalLink.tsx` の不要な `@ts-expect-error` を削除:
```tsx
// 削除前
// @ts-expect-error: External URLs are not typed.
href={props.href}

// 削除後
href={props.href}
```

### 4. 型チェック
```bash
cd mobile && npx tsc --noEmit
```

### 5. 起動確認
```bash
npx expo start
```
Metro Bundlerが `http://localhost:8081` で起動すれば成功。

### 6. ルートにスクリプト追加
`package.json` に以下を追加:
```json
"mobile": "npm --prefix mobile run start",
"mobile:ios": "npm --prefix mobile run ios",
"mobile:android": "npm --prefix mobile run android",
"mobile:web": "npm --prefix mobile run web"
```

## 完了条件
- [ ] `mobile/` にExpoプロジェクトが作成されている
- [ ] `npx tsc --noEmit` が成功
- [ ] `npx expo start` でMetro Bundlerが起動
- [ ] ルートから `pnpm mobile` で起動可能

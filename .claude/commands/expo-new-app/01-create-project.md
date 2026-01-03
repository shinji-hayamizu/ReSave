---
description: architecture.md に基づき、Expoプロジェクトを作成しビルド可能な状態にする
allowed-tools: Read, Write, Edit, Bash
---

# Expoプロジェクト作成

## 参照ドキュメント
- docs/requirements/architecture.md

---

## 手順

### 1. architecture.md を読み込み、以下を確認
- Expoプロジェクトのディレクトリ名
- 使用するテンプレート（tabs / default / blank-typescript）

### 2. プロジェクト作成
```bash
npx create-expo-app@latest [ディレクトリ名] --template [テンプレート] --yes
```

### 3. ビルド確認
```bash
cd [ディレクトリ名]
npx tsc --noEmit
npx expo start
```

Metro Bundlerが起動すれば完了。

---

## 完了条件
- [ ] Expoプロジェクトが作成されている
- [ ] `npx tsc --noEmit` が成功
- [ ] `npx expo start` でMetro Bundlerが起動

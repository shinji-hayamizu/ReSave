## 🎯 目的（Claude Code向け前提）

* Claude Code による **自動レビュー・修正提案・指摘の一貫性**を目的とする
* **default export / TypeScriptの`namespace`宣言 / any / ts-ignore などの事故要因を事前に排除**
* 長期運用・複数リポジトリ前提

---

## 🔧 基本方針（最重要）

* **自作モジュールは Named exportのみ使用（default export禁止）**
* **ES Modulesのみ使用（TypeScriptの`namespace`宣言 / `require`禁止）**
* **const / letのみ使用（var禁止）**
* **文末セミコロンを省略しない（ASIに依存しない）**
* **型安全を壊す行為は原則禁止（any / ts-ignore / non-null assertion）**

---

## 📁 ソースファイル構造

順序は必ず以下：

1. Copyright（必要な場合）
2. import
3. 実装コード

※ 各セクション間は **空行1行のみ**

---

## 📦 Import / Export 規約

### Import

* **プロジェクト内のimportは相対パス禁止（`./`, `../`）**
* **内部モジュールは必ずパスエイリアスを使用**
* import順序は **外部ライブラリ → 内部モジュール（パスエイリアス）**
* named import / namespace import（`import * as foo from '...'`）を使い分ける
* default import は **外部ライブラリのみ許可**（自作モジュールからdefault importしない）

```ts
// Good
import {z} from 'zod';

import {logger} from '@/utils/logger';
import type {User} from '@type/user';
import {Constants} from '@const/general';

// Bad
import {User} from './user';
import table from '../table';
import x = require('x');
```

### Export

* **自作モジュールでの default export は禁止**
* export letは禁止（mutable export禁止）

```ts
// Good
export const MAX_COUNT = 10;
export function calc() {}
export class User {}

// Bad
export default class User {}
export let state = {};
```

---

## 🧠 Type Import / Export

* **型専用は `import type` を使用**
* 型の再exportは `export type`

```ts
import type {User} from '@type/user';
export type {User};
```

---

## 🧱 クラス設計

### 基本

* クラス宣言末尾に `;` をつけない
* privateフィールド `#foo` 禁止
* static this 禁止
* container class（staticだけのclass）禁止

```ts
class User {
  constructor(private readonly id: string) {}

  get userId(): string {
    return this.id;
  }
}
```

### 推奨

* **parameter property を使う**
* **readonly を積極使用**
* constructor 前後に空行1行

---

## 🔁 関数設計

### 基本

* **モジュールスコープ（トップレベル）の関数は function 宣言を使う**
* **コールバック / インライン関数は arrow function を使う**
* トップレベルでの `const fn = function() {}` 形式は禁止（例外：generator）

```ts
// Good
function calc(): number {
  return 1;
}

array.map(x => x * 2);
```

---

## 🔄 制御構文

* **必ず `{}` を使う**
* `===` / `!==` を使用
* switch は必ず default を持つ
* fallthrough 禁止（空caseのみ可）

---

## ❌ 禁止事項（Claude Codeで強く指摘）

* `any`
* `@ts-ignore / @ts-nocheck`
* `const enum`
* `eval / Function`
* `with`
* `debugger`
* `parseInt / parseFloat` → 代わりに `Number()` を使用（基数指定ミスによるバグ防止）

---

## 🧩 型システム規約

### anyの代替

* `unknown` を使用
* 型ガードで安全に絞り込む

```ts
const value: unknown = input;
if (typeof value === 'string') {
  value.toUpperCase();
}
```

### インターフェース優先

* **object型定義は interface を使う**
* type alias は union / primitive / tuple のみ

---

## 📛 Naming 規約

| 種類                              | 形式                 |
| ------------------------------- | ------------------ |
| class / interface / type / enum | UpperCamelCase     |
| variable / function             | lowerCamelCase     |
| 定数                              | CONSTANT_CASE      |
| 型パラメータ                          | T / UpperCamelCase |

* `_` prefix / suffix 禁止
* 意味不明な略語禁止
* Observable の `$` はプロジェクト内で統一

---

## 📝 コメント / JSDoc

* **JSDocは禁止**
* **処理説明コメントは禁止**
* **TODO / FIXME コメントは禁止**
* **許可されるコメントは次の2種類のみ**
  * ツール制御コメント（lint/coverage等で技術的に必須）
  * 業務ロジック分岐説明（ドメイン知識がないと判断不能な分岐のみ）

---

## 🧯 エラーハンドリング

* **`catch (error: unknown)` を必ず使用**
* 型ガードで安全に絞り込む
* すべてのエラーをロガーで記録

---

## 🪵 ロギング

* **console.log / console.warn / console.error 等の直接使用は禁止**
* **必ず `@/utils/logger` を使用**
* **機密情報のログ出力は禁止**

---

## 🧊 定数管理

* **定数は `app/constants/general.ts` の `Constants` に集約**
* マジックナンバー / マジック文字列は禁止

---

## 🧭 パスエイリアス

* `@/` → `app/src/`
* `@type/` → `app/types/`
* `@const/` → `app/constants/`
* `@client/` → `app/clients/`
* `@config/` → `app/configs/`

---

## 🧪 例外・既存コード

* 既存コードのスタイルは尊重
* 新規ファイルは **必ず本規約準拠**
* 大規模修正時のみまとめて整形

---

## 🤖 Claude Code向け運用ルール（重要）

Claude Code は以下を常に前提としてレビュー・修正提案する：

* 自作モジュールで default export を見つけたら **即NG**
* any / ts-ignore は **理由なし使用を拒否**
* mutable export を **設計ミスとして指摘**
* TypeScriptの`namespace`宣言 / require を **即修正提案**
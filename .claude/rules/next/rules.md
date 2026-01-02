**前提（対象）**

* Next.js App Router（`app/`）前提
* React Server Components（RSC）前提（Server/Client の境界を強く意識）

---

**1) Server / Client Components の境界（最重要）**

* **デフォルトは Server Component**（`use client` を安易につけない）
* **`use client` は"必要最小の葉（Leaf）コンポーネント"にだけ付ける**

  * 例：フォーム入力、onClick、useState/useEffect が必要な部分だけ
  * page/layout を丸ごと Client にしない
* **Client Component から Server-only を import しない**

  * DB・秘密鍵・Server Actions・Node 専用 API は Server 側へ寄せる
* **Server Component では副作用（ブラウザ依存）を持たない**

  * window/document/localStorage は Client に隔離
* **境界のコメント規約（任意だけど効く）**

  * Server/Client の境界が分かりづらいファイルでは意図を一言書く
  * コメントは `use client` の**上にも書ける**（モジュールの一部とみなされる）
  * 例：
    ```tsx
    // Client Component: uses useState for form interactions
    'use client'
    
    import { useState } from 'react'
    ```

---

**2) `use client` の置き場所と粒度**

* **`use client` は import 文より前に配置（ファイル冒頭）**
  * コメントは `use client` の上にも書ける
  * OK例：
    ```tsx
    // Client Component: interactive form
    'use client'
    
    import { useState } from 'react'
    ```
  * NG例：
    ```tsx
    import { useState } from 'react'  // ❌ import が先
    'use client'
    ```
* **Client 化は"最小コンポーネント"単位**（※原則は 1) に従う）
* **Server → Client へ渡す props は「シリアライズ可能」だけ**

  * Date / Map / Set / class instance / 関数を渡さない
  * 必要なら Server 側で string/number に変換して渡す

---

**3) Data Fetching とキャッシュ（混乱ポイント）**

* **⚠️ Next.js 15 でデフォルト動作が変更された**

  * Next.js 14 以前：`fetch()` は デフォルト `cache: 'force-cache'`（キャッシュする）
  * Next.js 15：`fetch()` は デフォルト `cache: 'no-store'`（キャッシュしない）
  * **バージョン問わず明示指定を徹底**すれば影響を受けない

* **取得方針を明示する（どれが正なのか迷わせない）**

  * `fetch()` の `cache` / `next: { revalidate }` を"無指定にしない"運用にする（推奨）
  * **指定場所を固定する**：`fetch` は `services/*` でラップし、そこで `cache` / `next: { revalidate }` を必ず指定（無指定禁止）
* **「ページの性質」ごとに規約を決める**

  * 例：

    * 管理画面＝基本 `no-store`（常に最新）
    * 公開一覧＝`revalidate`（数分）
    * 静的で良い＝`force-cache`
* **Server 側で取得 → 画面用 DTO に整形 → Client へ渡す**

  * Client は表示と操作に集中

---

**4) Server Actions のルール（運用コケやすい）**

* **Server Actions は `actions.ts` / `actions/` に集約（page直下にベタ書き禁止）**
  * 理由：差分レビューしやすく、責務境界が崩れにくく、単体テスト（入力/出力）もしやすい
  * 例外（小規模のみ）：該当ルート配下に `actions.ts` を **1つだけ同居**させるのは可（ただし `page.tsx` への直書きはしない）
* **命名は動詞＋目的語（例：`createPost`, `updateProfile`）**
* **入力は必ずバリデーション**（zod 等）

  * FormData を直接信用しない
* **返り値は"UI が扱いやすい形"に統一**

  * 成功/失敗を同じ形（例：`{ ok: true } | { ok:false, message }`）
* **revalidate の責務を統一**

  * Action 内で `revalidatePath` / `revalidateTag` を呼ぶのか
  * 呼ばないなら呼び出し側で必ずやる、を決める
* **⚠️ セキュリティ：Server Actions は公開エンドポイントになる**

  * 認証・認可チェックを Action 内で必ず行う
  * 例：
    ```tsx
    'use server'
    
    export async function updateProfile(formData: FormData) {
      const session = await getSession()
      if (!session) throw new Error('Unauthorized')
      
      // 認可チェック（本人のみ編集可能など）
      // ...処理
    }
    ```

---

**5) `page.tsx / layout.tsx` 肥大化防止**

* **page/layout は"組み立て専用"**（重いロジック禁止）

  * データ取得・認可・永続化・複雑な変換は `lib/` や `services/` に逃がす
* **コンポーネントは同階層に `components/` を切る**

  * 例：`app/(marketing)/pricing/components/*`
* **条件分岐が増えたら責務分割**（UIブロック単位で部品化）

---

**6) ルーティング設計（app/ の秩序）**

* **Route Group（`(group)`）は"URLに出ない分類"にだけ使う**

  * marketing / auth / dashboard など
* **Parallel Routes / Intercepting Routes は導入基準を明文化**

  * なんとなく使わない（構造が難化しやすい）
* **`loading.tsx` / `error.tsx` / `not-found.tsx` の責務を固定**

  * `error.tsx` は"UI とリカバリ"だけ、ログ送信は共通関数へ

---

**7) Metadata / SEO（ついバラける）**

* **`generateMetadata` はページから分離**（同ファイル内でも良いが肥大化させない）
* **タイトル/OG は共通ヘルパーで統一**（表記ゆれ防止）
* **動的メタデータは fetch 方針（cache/revalidate）もセットで書く**

---

**8) 環境変数と secrets（事故防止）**

* **`NEXT_PUBLIC_` 以外は Client で参照禁止**
* **環境変数アクセスは"1箇所に集約"**（`env.ts` など）

  * `process.env.X` を散らさない
* **型安全（存在チェック）を必ず通す**（起動時に落とす）

---

**9) API Routes / Route Handlers（`app/api/*`）**

* **レスポンス形式を統一**（エラー形・成功形）
* **例外は握りつぶさず、HTTP ステータスに落とす**
* **DB/外部APIは Handler 直書き禁止**（service 層に寄せる）
* **認可（authorization）は共通ガードを必ず経由**

---

**10) `next/navigation` と遷移**

* **`redirect` / `notFound` の使い分けを固定**

  * 認可失敗＝`redirect`
  * 取得結果なし＝`notFound`
* **Client の `useRouter` は UI イベントに限定**

  * データ都合の遷移は Server で決める（可能なら）

---

**11) 画像・フォント・静的資産（パフォーマンス含む）**

* **画像は基本 `next/image`**（例外は理由を書く）
* **外部画像ドメインは config で明示**
* **フォントは next/font を優先**（読み込みの一貫性）

---

**12) エラーハンドリングと observability（地味に重要）**

* **`error.tsx` は UI、ログ送信は共通 `reportError()` へ**
* **Server 側の例外は「握る場所」を固定**

  * service 層で握るか、page で握るかを決める
* **ユーザーに見せるエラー文言は共通化**（表記ゆれ防止）

---

**13) Suspense とストリーミング（Next.js 14+）**

* **重いデータ取得は Suspense で分離**

  * ページ全体のブロッキングを避け、部分的にストリーミング表示
  * 例：
    ```tsx
    // page.tsx (Server Component)
    import { Suspense } from 'react'
    import { HeavyDataSection } from './components/HeavyDataSection'
    import { Skeleton } from './components/Skeleton'

    export default function Page() {
      return (
        <div>
          <h1>ダッシュボード</h1>
          <Suspense fallback={<Skeleton />}>
            <HeavyDataSection />
          </Suspense>
        </div>
      )
    }
    ```

* **Suspense 境界の設計指針**

  * 1つの Suspense = 1つの独立したデータ取得単位
  * fallback は具体的な Skeleton を用意（ユーザー体験向上）
  * 過剰なネストは避ける（3階層以上は設計を見直す）

* **loading.tsx との使い分け**

  * `loading.tsx`：ルート単位の自動 Suspense（ページ遷移時）
  * `<Suspense>`：コンポーネント単位の細かい制御（部分更新時）

---

**14) Partial Prerendering (PPR)（Next.js 15 実験的機能）**

* **PPR とは**

  * 静的シェル + 動的コンテンツのハイブリッドレンダリング
  * 静的部分は即座に表示、動的部分は Suspense でストリーミング

* **有効化（experimental）**
  ```js
  // next.config.js
  module.exports = {
    experimental: {
      ppr: true,
    },
  }
  ```

* **採用判断**

  * プロダクション利用は慎重に（experimental のため）
  * 安定版リリースまでは `loading.tsx` + `Suspense` で代替可能
  * 採用する場合はチーム全体で動作を理解した上で

---

**15) 開発環境とビルド**

* **Turbopack（開発時バンドラー）**

  * Next.js 15 で安定版として利用可能
  * 有効化：`next dev --turbo`
  * Webpack より高速だが、一部プラグイン非対応の場合あり
  * チームで統一するか `package.json` の scripts で明示

* **ビルド時の型チェック**

  * `next build` は TypeScript エラーで失敗する（デフォルト）
  * CI でも同じ挙動になるよう確認

* **バンドルサイズの監視**

  * `@next/bundle-analyzer` の定期実行を推奨
  * 閾値を決めて CI で警告を出す運用も有効

---

**16) セキュリティ考慮事項**

* **Server Actions のセキュリティ**

  * Server Action は公開エンドポイントになる（誰でも呼べる）
  * **認証・認可チェックを Action 内で必ず行う**

* **taint API（sensitive data protection）**

  * Next.js 14+ で利用可能
  * DB から取得した機密情報を Client に渡さない仕組み
  * 必要に応じて導入を検討

* **CSP（Content Security Policy）の設定**

  * `next.config.js` の `headers` で設定
  * インラインスクリプト使用時は nonce 対応が必要

---

**運用に効く"最小セット"（迷ったらこれだけ採用）**

* `use client` は最小の葉にだけ
* Client へ渡す props はシリアライズ可能のみ
* page/layout は組み立て専用で肥大化禁止
* **fetch の cache/revalidate は必ず明示指定**（Next.js 15 でデフォルト変更あり）
* env は `NEXT_PUBLIC_` 以外 Client 禁止＋アクセス集約
* **Server Actions は認証・認可チェック必須**

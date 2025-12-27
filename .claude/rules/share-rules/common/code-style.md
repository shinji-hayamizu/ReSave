# コードスタイルガイド
「リーダブルコード」に基づく

> **基本原則**: コードは他の人が最短時間で理解できるように書く

---

## 1. 命名

### 1.1 明確で具体的な名前を使う
曖昧な単語を避け、処理内容を正確に表す名前を選ぶ。

| 曖昧 | より良い代替案 |
|------|----------------|
| get | fetch, download, compute, extract |
| send | deliver, dispatch, announce, publish |
| find | search, locate, extract, recover |
| make | create, build, generate, initialize |
| data | user, config, payload, response |

### 1.2 汎用的な名前を避ける
- 避ける: `tmp`, `retval`, `data`, `value`, `result`, `info`
- 例外: `tmp`は短命な値の入れ替え処理では許容

### 1.3 ループイテレーターを区別する
```
// Bad: バグが発見しにくい
for i in clubs:
  for j in members:
    for k in users:
      if members[k] == users[j]  // インデックスが逆！

// Good: 接頭辞で意図を明確に
for ci in clubs:
  for mi in members:
    for ui in users:
      if members[mi] == users[ui]
```

### 1.4 単位・状態を名前に含める
```
// Bad
delay = 30
size = 512

// Good
delayMs = 30
sizeMb = 512
startTimeSec = 0
```

### 1.5 境界値には正確な名前を使う
- 限界値: `maxItems`, `minValue`（`itemLimit`ではなく）
- 範囲: `firstIndex`, `lastIndex`（包含が明確）
- 真偽値: `isVisible`, `hasPermission`, `canEdit`

### 1.6 スコープに応じた名前の長さ
- 小さいスコープ → 短い名前でOK
- 大きいスコープ / グローバル → 説明的な名前が必要

---

## 2. コメント

### 2.1 コメントすべきでないこと
- コードを読めばわかること
- 冗長な情報

### 2.2 コメントすべきこと
- **Why**: 理由、トレードオフ、制約
- **TODO/FIXME**: 既知の問題（担当者付き）
- **背景**: 自明でないビジネスルールやエッジケース
- **意図**: 処理内容ではなく目的

```
// Bad: 自明なことを述べている
i++  // iをインクリメント

// Good: 理由を説明
MAX_RETRIES = 3  // APIは3回以上でブロックされる

// Good: 意図を記述
// 高額商品を先に表示するため価格の降順でソート
```

### 2.3 曖昧な指示語を避ける
```
// Bad: 「その」が不明確
// データをキャッシュに入れる。ただし先にそのサイズをチェック

// Good: 明確に記述
// データをキャッシュに入れる。ただし先にデータサイズをチェック
```

---

## 3. 制御フロー

### 3.1 条件式は自然な順序で
- 左側: 調査対象（変化する値）
- 右側: 比較対象（定数）

```
// Bad
if (18 <= age)

// Good: 「年齢が18以上なら」と自然に読める
if (age >= 18)
```

### 3.2 肯定形を優先する
```
// 推奨
if (isValid)

// 避ける
if (!isInvalid)
```

### 3.3 早期リターンでネストを減らす
```
// Bad: 深いネスト
function process(user) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        // 実際の処理
      }
    }
  }
}

// Good: ガード節
function process(user) {
  if (!user) return
  if (!user.isActive) return
  if (!user.hasPermission) return
  // 実際の処理
}
```

### 3.4 三項演算子はシンプルな場合のみ
- 単純な代入ならOK
- ネストした三項演算子は避ける

---

## 4. 式の分割

### 4.1 説明変数を使う
```
// Bad
if (line.split(':')[0].trim() == 'admin')

// Good
userRole = line.split(':')[0].trim()
if (userRole == 'admin')
```

### 4.2 要約変数を使う
```
// Bad: 追跡する変数が多い
if (request.user.id == document.ownerId)

// Good: 意図を表現
userOwnsDocument = (request.user.id == document.ownerId)
if (userOwnsDocument)
```

---

## 5. 変数

### 5.1 不要な変数を削除する
以下に該当する変数は削除:
- 複雑な式を分割していない
- 一度しか使われていない
- 明確さを追加していない

### 5.2 スコープを最小化する
- 変数は使用箇所の近くで宣言
- グローバルよりローカルを優先
- スコープ内の変数数を減らす

---

## 6. 関数

### 6.1 下位問題を抽出する
汎用的なユーティリティロジックとビジネスロジックを分離。

```
// Bad: 関心事が混在
function findClosest(lat, lng, locations) {
  for each location:
    // 複雑な球面距離の計算がここに
    // ビジネスロジックもここに
}

// Good: 抽出済み
function sphericalDistance(lat1, lng1, lat2, lng2) {
  // 純粋な計算
}

function findClosest(lat, lng, locations) {
  for each location:
    dist = sphericalDistance(...)
    // ビジネスロジックのみ
}
```

### 6.2 1つの関数で1つのタスク
- 関数が行うタスクをすべて列挙
- 複数タスクがあれば別関数に分割
- 各関数は1つのことをうまく行う

---

## クイックチェックリスト

コミット前に確認:

- [ ] 名前が具体的で汎用的でない（`tmp`, `data`, `info`を避ける）
- [ ] 必要に応じて単位を含む（`Ms`, `Sec`, `Mb`）
- [ ] コメントは「何を」ではなく「なぜ」を説明
- [ ] 条件式が自然に読める（変数が左側）
- [ ] 早期リターンでネストを削減
- [ ] 複雑な式を名前付き変数に分割
- [ ] 各関数が1つのことを行う
- [ ] 変数のスコープが最小限
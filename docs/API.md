# API仕様

## 概要

AI_Linkage_PoCは、電力設備画像の自動解析を行うRESTful APIを提供します。
複数のAIモデルに対応し、非同期処理による効率的な画像解析を実現します。

## ベースURL

```
http://localhost:3001
```

## エンドポイント一覧

### 画像解析API

#### `POST /api/ai/image/list/{model}`

電力設備画像を指定されたAIモデルで解析します。

**対応モデル:**
URLパスの`{model}`部分に指定可能なモデルについては、[`app/constants/general.ts`](../app/constants/general.ts)の`ENDPOINT_TO_AI_MODEL`を参照してください。

**リクエスト形式:**
```json
{
  "id": "unique-request-id",
  "photos": [
    {
      "photoId": "photo-001",
      "angleLabel": "POWER_POLE_FULL_VIEW",
      "imageUrl": "https://example.com/image1.jpg"
    },
    {
      "photoId": "photo-002",
      "angleLabel": "POWER_POLE_UPPER_VIEW",
      "imageUrl": "https://example.com/image2.jpg"
    }
  ]
}
```

**リクエストパラメータ:**
- `id` (string, required): リクエストの一意識別子
- `photos` (array, required): 解析対象画像の配列
  - `photoId` (string, required): 画像の一意識別子
  - `angleLabel` (string, required): 撮影角度ラベル（詳細は[画角仕様](./ANGLE_SPECIFICATIONS.md)を参照）
  - `imageUrl` (string, required): 画像のURL

**レスポンス形式:**

**処理中の場合 (HTTP 555):**
```json
{
  "jobId": "unique-request-id",
  "status": "Processing"
}
```

**処理完了の場合 (HTTP 200):**
```json
{
  "id": "unique-request-id",
  "assetType": "POWER_POLE",
  "results": [
    {
      "photoId": "photo-001",
      "result": "OK",
      "reason": "設備に異常は見られません。"
    },
    {
      "photoId": "photo-002",
      "result": "NG",
      "reason": "腐食が確認されました。"
    }
  ]
}
```
※result値は実装に応じて`OK`, `NG`, `FORCE_OK`, `FORCE_NG`等

**エラーレスポンス (HTTP 4xx/5xx):**
```json
{
  "error": "エラーメッセージ"
}
```

## エラーハンドリング

### HTTPステータスコード

- `200` - 処理完了（キャッシュヒットまたは処理済み）
- `400` - リクエストエラー（パラメータ不正等）
- `500` - サーバーエラー
- `555` - 処理中（非同期処理開始を通知するカスタムステータス）

※555は非標準のステータスコードですが、クライアントが処理中であることを明確に識別できるよう採用しています。

### エラーの種類

**400 Bad Request:**
- 必須パラメータの不足
- 不正なJSON形式
- サポートされていないAIモデル

**500 Internal Server Error:**
- AI API呼び出しエラー
- Redis接続エラー
- 内部処理エラー

## レート制限

各AIモデルにはプロバイダーの制限に応じたレート制限が適用されます。
具体的な制限値は[`app/constants/general.ts`](../app/constants/general.ts)の`AI_RATE_LIMITS`を参照してください。

制限に達した場合、システムは自動的に待機し、処理を継続します。

## キャッシュ機能

同一のリクエストID（`id`）に対する結果はRedisにキャッシュされます。

- **キャッシュキー**: `photo-result:{id}`
- **有効期限**: 3600秒（1時間）
- **効果**: 同じリクエストIDで再度APIを呼び出すと、処理済み結果が即座に返されます

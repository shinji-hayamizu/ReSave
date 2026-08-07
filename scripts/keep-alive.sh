#!/usr/bin/env bash
# Supabase無料枠の自動pause(7日間クエリ0件で発生)を防ぐため、
# 定期的に /api/health を叩いてDBに軽量クエリを1回到達させる。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 設定ファイルがあれば読み込む(無くても正常動作する)
ENV_FILE="${SCRIPT_DIR}/.env.keepalive"
if [[ -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
fi

HEALTH_URL="${RESAVE_HEALTH_URL:-https://re-save.vercel.app/api/health}"

LOG_DIR="${HOME}/Library/Logs"
LOG_FILE="${LOG_DIR}/resave-keepalive.log"
mkdir -p "${LOG_DIR}"

# ログが1MBを超えていたら退避してから新規ログを書き始める(無限肥大化防止)
rotate_log_if_needed() {
  if [[ -f "${LOG_FILE}" ]]; then
    local size
    size=$(stat -f%z "${LOG_FILE}" 2>/dev/null || stat -c%s "${LOG_FILE}" 2>/dev/null || echo 0)
    if (( size > 1048576 )); then
      mv "${LOG_FILE}" "${LOG_FILE}.1"
    fi
  fi
}

now_iso() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  echo "$(now_iso) ${level} $*" >> "${LOG_FILE}"
}

rotate_log_if_needed

# curl実行: タイムアウト・リトライを設定し、HTTPステータスとボディの両方を取得する。
# curl自体が失敗(DNS解決失敗・接続不可・タイムアウト)した場合はここでcatchする。
RESPONSE=""
HTTP_STATUS=""
CURL_EXIT=0
START_TIME=$(date +%s)

RESPONSE=$(curl -sS --max-time 30 --retry 2 --retry-delay 5 \
  -w '\n%{http_code}' "${HEALTH_URL}" 2>&1) || CURL_EXIT=$?

END_TIME=$(date +%s)
ELAPSED="$(( END_TIME - START_TIME ))s"

if [[ ${CURL_EXIT} -ne 0 ]]; then
  BODY_HEAD="${RESPONSE:0:200}"
  log_line "ERROR" "url=${HEALTH_URL} reason=curl_failed curl_exit=${CURL_EXIT} elapsed=${ELAPSED} body_head=${BODY_HEAD}"
  exit 1
fi

# 最終行がHTTPステータスコード、それ以外がレスポンスボディ
HTTP_STATUS=$(echo "${RESPONSE}" | tail -n1)
BODY=$(echo "${RESPONSE}" | sed '$d')

# 成功条件は3つ全部を満たした時だけ:
#   1. HTTPステータスが200
#   2. ボディに "status":"ok" を含む
#   3. ボディに "db":"reachable" または "status":"connected" のどちらかを含む
#
# 条件3を2パターン許容している理由:
#   本番は現在まだ旧実装で {"status":"ok",...,"database":{"status":"connected",...}} を返す。
#   将来リリースされる新実装は {"status":"ok","db":"reachable",...} を返す予定。
#   両方で通るようにしておけば、リリースのタイミングでこのスクリプトを直さずに済む。
#   また、無関係な他社サービス(例: resave.app)は "status":"ok" だけを返し
#   "db":"reachable" も "status":"connected" も返さないため、
#   URLを間違えた時にここで機械的に弾ける保険としても機能する。
#
# jqはインストール保証がないため使わず、bashの文字列マッチで判定する。
STATUS_OK=false
DB_OK=false

if [[ "${BODY}" == *'"status":"ok"'* ]]; then
  STATUS_OK=true
fi

if [[ "${BODY}" == *'"db":"reachable"'* ]] || [[ "${BODY}" == *'"status":"connected"'* ]]; then
  DB_OK=true
fi

if [[ "${HTTP_STATUS}" == "200" ]] && [[ "${STATUS_OK}" == true ]] && [[ "${DB_OK}" == true ]]; then
  DB_FIELD="unknown"
  if [[ "${BODY}" == *'"db":"reachable"'* ]]; then
    DB_FIELD="reachable"
  elif [[ "${BODY}" == *'"status":"connected"'* ]]; then
    DB_FIELD="connected"
  fi
  log_line "INFO" "url=${HEALTH_URL} http=${HTTP_STATUS} db=${DB_FIELD} elapsed=${ELAPSED}"
  exit 0
else
  BODY_HEAD="${BODY:0:200}"
  REASON="db_unreachable"
  if [[ "${HTTP_STATUS}" != "200" ]]; then
    REASON="http_status_${HTTP_STATUS}"
  elif [[ "${STATUS_OK}" != true ]]; then
    REASON="status_not_ok"
  fi
  log_line "ERROR" "url=${HEALTH_URL} http=${HTTP_STATUS} reason=${REASON} elapsed=${ELAPSED} body_head=${BODY_HEAD}"
  exit 1
fi

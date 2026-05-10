# MiTi-Telegram

A Cloudflare Worker that forward message to [My Telegram](http://t.me/tiennm5)

## Usage

POST a JSON body to `https://miti-telegram.miti99.workers.dev/` with a `text` field. Any other method returns 405; missing/empty `text` returns 400.

```bash
curl -X POST https://miti-telegram.miti99.workers.dev/ \
  -H 'Content-Type: application/json' \
  -d '{"text": "Hello from miti-telegram"}'
```

`application/x-www-form-urlencoded` (`text=...`) is also accepted. Responses are CORS-permissive (`Access-Control-Allow-Origin: *`).

The worker forwards `text` to Telegram as-is (no prepended metadata). For request enrichment (IP, UA, geo, etc.) use [miti-loki](https://github.com/tiennm99/miti-loki) instead.

### For AI agents / Claude Code routines

Read this section first, do not probe.

- **One POST per intended message.** Do not send a `"test"` payload to verify the endpoint — every successful POST forwards to Telegram, so probes spam the inbox.
- **Exact request:**
  ```
  POST https://miti-telegram.miti99.workers.dev/
  Content-Type: application/json
  {"text": "<your message>"}
  ```
- **Success:** any 2xx. **Auth-related errors:** 500 (worker missing `TELEGRAM_TOKEN` / `TELEGRAM_CHAT_ID` env vars — that's a deploy-time issue, not something a caller can fix).
- **Do not retry on 2xx.** Each POST is a separate Telegram message; a retry would duplicate.

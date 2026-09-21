# Python Algorithm Integration

The Next.js application owns browser-facing API validation and response envelopes. Python owns deterministic Bazi and divination calculations.

## Configure the Python service

Set the environment variable before starting Next.js:

```bash
PYTHON_ALGORITHM_BASE_URL=http://127.0.0.1:8000
```

When the variable is absent, Bazi and divination endpoints return explicit mock data with `meta.mock: true` and a warning. The frontend requires no changes when the Python service is connected.

## Python endpoints

### POST /bazi/chart

Request:

```json
{"birth_date":"2000-01-01","birth_time":"12:30","birth_place":"Singapore","gender":"unspecified","calendar":"solar"}
```

Return the `BaziChartResult` shape defined in `lib/contracts/bazi.ts`. Do not wrap it in the common API envelope; Next.js adds that wrapper.

### POST /divination/cast

Request:

```json
{"question":"未来三个月的职业安排？","method":"numbers","numbers":[18,27]}
```

Return the `DivinationCastResult` shape defined in `lib/contracts/divination.ts`. Line values use the traditional numeric representation: `6`, `7`, `8`, or `9`.

The reference implementation is in `python_algorithm/`. Its rules are: arrays are ordered from the bottom line to the top line; in number casting, the first and second positive integers select the upper and lower trigrams using modulo 8, and the optional third integer selects the moving line (otherwise their sum selects it). The mutual hexagram uses lines 2–4 and 3–5; values `6` and `9` change yin/yang to form the transformed hexagram.

## Browser-facing routes

| Method | Route | Implementation entry |
| --- | --- | --- |
| POST | `/api/bazi/chart` | `lib/bazi/service.ts` |
| POST | `/api/divination/cast` | `lib/divination/service.ts` |
| POST | `/api/divination/chat` | rule-based clarification and dispatch route |
| POST | `/api/guanyin-lot/draw` | `lib/guanyin/library.ts` |
| GET | `/api/knowledge/search?q=` | `lib/knowledge/library.ts` |
| GET | `/api/knowledge/graph?concept=` | graph placeholder route |
| GET | `/api/knowledge/compare?q=` | `lib/knowledge/library.ts` |
| POST | `/api/session/event` | `lib/session/store.ts` |
| POST | `/api/user/notes` | `lib/session/store.ts` |

Every browser-facing response follows `ApiEnvelope<T>` in `lib/contracts/api.ts`. Session events and notes currently use process memory and must be replaced with persistent storage before production deployment.

## Divination chatbot

`POST /api/divination/chat` accepts a short conversation and returns either one necessary follow-up question or a ready-to-run divination request. It is deliberately a rule-based conversation coordinator: it does not calculate hexagrams, rewrite source text, or produce an authoritative interpretation. Guanyin lots are handled only by the separate `/guanyin` module.

```json
{
  "messages": [
    {"role": "user", "content": "我想用六爻问未来三个月的工作，数字 18 和 27"}
  ]
}
```

If required information is still missing, the response has `result.status: "clarify"` and a short `message`. When ready, it returns `result.cast_request` for `/api/divination/cast`. Requests for lots receive guidance to use the separate Guanyin-lot module instead.

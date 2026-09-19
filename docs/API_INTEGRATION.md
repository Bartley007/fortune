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

## Browser-facing routes

| Method | Route | Implementation entry |
| --- | --- | --- |
| POST | `/api/bazi/chart` | `lib/bazi/service.ts` |
| POST | `/api/divination/cast` | `lib/divination/service.ts` |
| POST | `/api/guanyin-lot/draw` | `lib/guanyin/library.ts` |
| GET | `/api/knowledge/search?q=` | `lib/knowledge/library.ts` |
| GET | `/api/knowledge/graph?concept=` | graph placeholder route |
| GET | `/api/knowledge/compare?q=` | `lib/knowledge/library.ts` |
| POST | `/api/session/event` | `lib/session/store.ts` |
| POST | `/api/user/notes` | `lib/session/store.ts` |

Every browser-facing response follows `ApiEnvelope<T>` in `lib/contracts/api.ts`. Session events and notes currently use process memory and must be replaced with persistent storage before production deployment.

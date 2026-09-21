# FateMatch BaZi Service

Deterministic chart calculation (1.1), pattern diagnosis (1.2) and advisory
generation (1.4). Next.js owns browser-facing validation and response
envelopes; this service owns the calculation.

## Status — T1 (skeleton)

The endpoint validates requests and returns a **contract-shaped placeholder**.
No value in the response is derived from the submitted birth data, and every
response carries `meta.mock: true` plus a warning.

| Task | Scope | State |
| --- | --- | --- |
| T1 | FastAPI skeleton, request validation, placeholder response | done |
| T2 | lunar-python cross-validation harness | next |
| T3 | Four pillars (Julian day mod 60, 23:00 day cutover) | |
| T4 | City → coordinates, manual fallback | |
| T5 | IANA timezone resolution incl. historical DST | |
| T6 | True solar time (longitude + equation of time) | |
| T7 | Hidden stems, five-element distribution, ten gods | |
| T8 | Luck cycles (onset age, forward/reverse), current period | |

Each task replaces part of `app/mocks/chart.py`. When the last placeholder is
gone, `meta.mock` comes off.

## Run

```bash
python3 -m venv .venv          # first time only
source .venv/bin/activate      # every new terminal
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

Point Next.js at it via `.env.local`:

```
PYTHON_ALGORITHM_BASE_URL=http://127.0.0.1:8000
```

Interactive docs at <http://127.0.0.1:8000/docs>.

```bash
pytest -q
```

`pytest.ini` puts the project root on `sys.path`; without it `pytest` cannot
import `app` (only `python -m pytest` would work).

## Layout

```
app/
  main.py            FastAPI app, /health
  routers/bazi.py    POST /bazi/chart
  models/enums.py    Closed sets + Chinese display maps
  models/bazi.py     Request/response models mirroring lib/contracts/bazi.ts
  mocks/chart.py     Placeholder response, retired task by task
tests/
  test_chart_contract.py       Response shape and request validation
  test_contract_consistency.py Enum parity with the TypeScript contract
```

## Conventions

**The contract is the source of truth.** `app/models/bazi.py` mirrors
`lib/contracts/bazi.ts` field for field. Changing one without the other breaks
the frontend silently — update both, plus `docs/API_INTEGRATION.md`.

**Romanised keys, Chinese in the UI.** The API speaks `jia` / `zi` /
`direct_wealth`; `models/enums.py` carries `DISPLAY_*` maps for rendering. Note
`wu` is the 戊 stem and `wu_branch` is the 午 branch — they collide in pinyin.

**Unknown fields are rejected** (`extra="forbid"`), so contract drift fails at
the boundary rather than surfacing as a missing value three layers in.

**Enum drift is caught two ways.** Within TypeScript it is automatic:
`display.ts` types its maps as `Record<TenGod, string>`, so a value added to the
union without a label fails the build. Across the language boundary nothing is
automatic, so `test_contract_consistency.py` parses `lib/contracts/bazi.ts` and
compares it against `models/enums.py`. Add a value on one side only and it fails.

**Citations use the shared `SourceReference` shape** from `lib/contracts/api.ts`,
not a bare string, so a rule can be traced to an edition, chapter and page. The
route forwards `source_refs` into `ApiEnvelope.source_refs`.

**Nulls are explicit.** `ten_god` is null on the day pillar (the day master has
no relation to itself) and `override` is null when no special structure fires.
These are serialised as null, not omitted, because the contract types them as
`T | null` — dropping them gives the frontend `undefined` instead.

## Scope boundaries encoded here

These come from the module design and are enforced by the contract shape:

- Luck cycles and the current period are **display only**. There is nowhere in
  the response to attach a favourable/unfavourable judgement to them, and the
  advisory layer does not read them.
- `fit_score` expresses **structural fit with the chart**, never a probability
  or a likelihood of a real-world outcome.
- Every advisory strength and consideration must trace back through
  `citations`. Traceability is the only automatable metric for 1.4, so an
  uncited claim is a defect — `test_every_advisory_category_is_cited` guards it.

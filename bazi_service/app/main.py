"""FastAPI service for deterministic BaZi calculation.

Next.js owns browser-facing validation and response envelopes; this service
owns the calculation. Run with:

    uvicorn app.main:app --reload --port 8001

Then point Next.js at it:

    PYTHON_BAZI_BASE_URL=http://127.0.0.1:8001
"""

from fastapi import FastAPI

from .routers import bazi

app = FastAPI(
    title="FateMatch BaZi Service",
    version="0.0.1",
    description="Deterministic chart calculation, pattern diagnosis and advisory generation.",
)

app.include_router(bazi.router)


@app.get("/health", tags=["ops"])
async def health() -> dict[str, str]:
    return {"status": "ok"}

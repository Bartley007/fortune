# Team Handoff

## Frontend members

Pages live in `app/<module>`. Interactive components call `/api/*` routes and should not import algorithm implementations directly. Shared response types live in `lib/contracts`.

## Python algorithm members

Implement the two endpoints described in `API_INTEGRATION.md` and return the exact result objects from the TypeScript contracts. Start the Python service separately and set `PYTHON_ALGORITHM_BASE_URL` in `.env.local`.

The replacement boundary is:

```text
React page -> Next.js route handler -> service.ts -> python-client.ts -> Python API
```

Do not change React components to connect an algorithm. If a required output field is missing, discuss and update the shared contract first.

## Knowledge and data members

Normalized searchable records belong in `data/knowledge_sources_complete/knowledge_sources_pages.json`. Preserve source URL, title, catalog, category and original content. Do not place user notes in the public knowledge data.

## Backend and database members

Replace `lib/session/store.ts` with persistent storage while keeping the route-level request and response contracts stable. Authentication and authorization must be added before personal notes are deployed publicly.

## Before opening a merge request

```bash
npm install
npm run check
npm run build
```

Do not commit `.env.local`, API keys, generated `.next` files, dependency folders, or the root knowledge-source ZIP archive.

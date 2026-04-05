# Testing

Vitest conventions for this project.

## Setup

- Runner: `vitest` (`pnpm test --run`)
- Test files: `src/app/api/<resource>/__tests__/route.test.ts`
- Imports: `import { describe, it, expect, vi, beforeEach } from "vitest"`

## Mocking Supabase

Mock `@/lib/supabase/server` before importing the route handler. Import order matters:

```ts
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

import { GET } from "../route";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.mocked(createServerSupabaseClient).mockReturnValue(mockSupabase as never);
  mockFrom.mockReset();
});
```

## Test Names

Use Japanese for `describe` and `it` labels — this is the project convention:

```ts
describe("GET /api/templates", () => {
  it("テンプレート一覧を返す", async () => { ... });
  it("Supabase エラー時に 500 を返す", async () => { ... });
});
```

## Dynamic Route Params

Route handlers receive `params: Promise<{ id: string }>`. In tests, create a helper:

```ts
const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

const res = await fetchTemplate(new Request("http://localhost"), makeParams("some-id"));
```

## Coverage Checklist

For each route handler, test:
- [ ] Happy path (200 with correct response shape)
- [ ] Supabase error (500)
- [ ] Not found / bad input (404) where applicable

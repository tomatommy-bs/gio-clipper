# API Patterns

Next.js App Router route handler conventions for this project.

## Route Handler Structure

| Concern | Pattern |
|---------|---------|
| Location | `src/app/api/<resource>/route.ts`, `src/app/api/<resource>/[id]/route.ts` |
| Supabase client | Always `createServerSupabaseClient()` from `@/lib/supabase/server` |
| Success response | `Response.json(data)` |
| Error response | `new Response(message, { status: N })` |
| Dynamic params | `{ params }: { params: Promise<{ id: string }> }` — must `await params` |

## DB ↔ TypeScript Naming

Database columns use `snake_case`. TypeScript interfaces use `camelCase`. Always map explicitly in the route handler:

```ts
const result: MyType = {
  canvasWidth: row.canvas_width,
  canvasHeight: row.canvas_height,
  nameEn: row.name_en,
};
```

Types live in `src/lib/geo/types.ts` (geo domain) or `src/lib/storage/types.ts` (client storage domain).

## Supabase Query Pattern

```ts
const supabase = createServerSupabaseClient();

const { data, error } = await supabase
  .from("table_name")
  .select("col1, col2");

if (error) {
  return new Response(error.message, { status: 500 });
}
```

For single-row lookups add `.eq("id", id).single()` and return 404 on error/null.

## What Belongs in Route Handlers

Route handlers are thin — no business logic. They:
1. Create the Supabase client
2. Query the DB
3. Map snake_case rows to camelCase TypeScript types
4. Return the response

Complex logic goes in `src/lib/`.

# Data Layer

This project has two distinct storage tiers. Never mix them.

## Storage Architecture

| Tier | What | Where | Access |
|------|------|-------|--------|
| **Supabase (PostgreSQL)** | Geo templates, regions, template groups | `src/lib/supabase/` | Server-side only (route handlers) |
| **localStorage** | Collection metadata (`Collection`, `CollectionMeta`) | `src/lib/storage/collections-store.ts` | Client-side only |
| **IndexedDB** | Photo binaries | `src/lib/storage/photo-db.ts` | Client-side only |

## Key Rule

Geo/template data is read-only from the client's perspective — always fetched via API routes, never accessed directly from client code. User-generated data (collections, photos) never leaves the browser.

## Supabase Client Usage

| Context | Import |
|---------|--------|
| Server (route handlers, Server Components) | `createServerSupabaseClient` from `@/lib/supabase/server` |
| Client Components | `createBrowserSupabaseClient` from `@/lib/supabase/client` |

Never use the server client in a Client Component, and vice versa.

## Schema Conventions

- Table names: `snake_case` plural (`geo_templates`, `geo_regions`, `geo_template_groups`)
- Migration files: `supabase/migrations/YYYYMMDDNNNNNN_description.sql`
- All migrations run in order — never edit existing migration files

## Geo Data Domain Types

Defined in `src/lib/geo/types.ts`:
- `GeoRegion` — single administrative area with SVG path, bbox, offset
- `GeoTemplateInfo` — template metadata without regions (list view)
- `GeoTemplate` — full template including regions array
- `GeoTemplateGroup` — group containing ordered templates
- `GeoRegionTag` — `"prefecture" | "municipality"`

## Client Storage Domain Types

Defined in `src/lib/storage/types.ts`:
- `Collection` — user's map collection with all assignments
- `CollectionMeta` — same as Collection (photos excluded via IndexedDB)
- `RegionAssignment` — photo key + display settings for one region

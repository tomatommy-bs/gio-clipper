import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { GeoTemplateGroup } from "@/lib/geo/types";

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("geo_template_groups")
    .select(`
      id,
      name,
      sort_order,
      geo_template_group_members (
        sort_order,
        geo_templates (
          id,
          name,
          canvas_width,
          canvas_height
        )
      )
    `)
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "geo_template_group_members" });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  type TemplateRow = { id: string; name: string; canvas_width: number; canvas_height: number };

  const groups: GeoTemplateGroup[] = (data ?? []).map((group) => ({
    id: group.id,
    name: group.name,
    sortOrder: group.sort_order,
    templates: (group.geo_template_group_members ?? [])
      .flatMap((m) => {
        const t = m.geo_templates as unknown as TemplateRow | TemplateRow[] | null;
        const row = Array.isArray(t) ? t[0] : t;
        if (!row) return [];
        return [{ id: row.id, name: row.name, canvasWidth: row.canvas_width, canvasHeight: row.canvas_height, sortOrder: m.sort_order }];
      }),
  }));

  return Response.json(groups);
}

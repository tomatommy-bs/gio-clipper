import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { GeoTemplateInfo } from "@/lib/geo/types";

export async function GET() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("geo_templates")
    .select("id, name, parent_template_id, parent_region_id, canvas_width, canvas_height");

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const templates: GeoTemplateInfo[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    parentTemplateId: row.parent_template_id ?? undefined,
    parentRegionId: row.parent_region_id ?? undefined,
    canvasWidth: row.canvas_width,
    canvasHeight: row.canvas_height,
  }));

  return Response.json(templates);
}

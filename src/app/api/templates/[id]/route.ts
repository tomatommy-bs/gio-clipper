import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { GeoTemplate, GeoRegion, GeoRegionTag } from "@/lib/geo/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerSupabaseClient();

  const { data: templateRow, error: templateError } = await supabase
    .from("geo_templates")
    .select("id, name, parent_template_id, parent_region_id, canvas_width, canvas_height")
    .eq("id", id)
    .single();

  if (templateError || !templateRow) {
    return new Response("Not Found", { status: 404 });
  }

  const { data: regionRows, error: regionError } = await supabase
    .from("geo_regions")
    .select("id, name, name_en, tag_id, path, bbox, geo_offset")
    .eq("template_id", id);

  if (regionError) {
    return new Response(regionError.message, { status: 500 });
  }

  const regions: GeoRegion[] = (regionRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    nameEn: row.name_en,
    tag: row.tag_id as GeoRegionTag,
    path: row.path,
    bbox: row.bbox,
    offset: row.geo_offset,
  }));

  const template: GeoTemplate = {
    id: templateRow.id,
    name: templateRow.name,
    parentTemplateId: templateRow.parent_template_id ?? undefined,
    parentRegionId: templateRow.parent_region_id ?? undefined,
    canvasWidth: templateRow.canvas_width,
    canvasHeight: templateRow.canvas_height,
    regions,
  };

  return Response.json(template);
}

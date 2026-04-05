import type { GeoTemplate, GeoTemplateInfo } from "./types";

export async function listTemplatesFromApi(): Promise<GeoTemplateInfo[]> {
  const res = await fetch("/api/templates");
  if (!res.ok) throw new Error(`Failed to fetch templates: ${res.status}`);
  return res.json();
}

export async function fetchTemplateFromApi(id: string): Promise<GeoTemplate> {
  const res = await fetch(`/api/templates/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Template not found: ${id}`);
    throw new Error(`Failed to fetch template "${id}": ${res.status}`);
  }
  return res.json();
}

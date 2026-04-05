import {
  listTemplatesFromApi,
  fetchTemplateFromApi,
} from "./geo-template.gateway.bff";
import type { GeoTemplate, GeoTemplateInfo } from "./types";

export async function listTemplates(): Promise<GeoTemplateInfo[]> {
  return listTemplatesFromApi();
}

export async function fetchTemplate(id: string): Promise<GeoTemplate> {
  return fetchTemplateFromApi(id);
}

import type { GeoTemplate, GeoTemplateInfo } from "./types";

/** 利用可能なテンプレートの一覧（fetch 不要なメタデータのみ） */
export const TEMPLATE_REGISTRY: GeoTemplateInfo[] = [
  {
    id: "japan-prefectures",
    name: "日本全国（都道府県）",
    regionCount: 47,
    dataFile: "japan-prefectures.json",
  },
  {
    id: "tokyo-wards",
    name: "東京都（23区）",
    parentId: "13",
    regionCount: 23,
    dataFile: "tokyo-wards.json",
  },
];

const GEO_DATA_BASE_URL =
  process.env.NEXT_PUBLIC_GEO_DATA_BASE_URL ?? "/geo-data";

const cache = new Map<string, GeoTemplate>();

/** テンプレートIDからフルデータを取得する（キャッシュあり） */
export async function fetchTemplate(templateId: string): Promise<GeoTemplate> {
  if (cache.has(templateId)) {
    return cache.get(templateId)!;
  }

  const info = TEMPLATE_REGISTRY.find((t) => t.id === templateId);
  if (!info) throw new Error(`Unknown template: ${templateId}`);

  const res = await fetch(`${GEO_DATA_BASE_URL}/${info.dataFile}`);
  if (!res.ok)
    throw new Error(`Failed to fetch geo data: ${info.dataFile} (${res.status})`);

  const json = await res.json();
  const template: GeoTemplate = { ...info, ...json };
  cache.set(templateId, template);
  return template;
}

export function getTemplateInfo(templateId: string): GeoTemplateInfo | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.id === templateId);
}

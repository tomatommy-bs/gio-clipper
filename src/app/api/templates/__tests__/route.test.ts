import { describe, it, expect, vi, beforeEach } from "vitest";

// Supabase client をモック
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

import { GET as listTemplates } from "../route";
import { GET as fetchTemplate } from "../[id]/route";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.mocked(createServerSupabaseClient).mockReturnValue(mockSupabase as never);
  mockFrom.mockReset();
});

describe("GET /api/templates", () => {
  it("テンプレート一覧を返す", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          {
            id: "japan-prefectures",
            name: "日本全国（都道府県）",
            parent_template_id: null,
            parent_region_id: null,
            canvas_width: 800,
            canvas_height: 900,
          },
        ],
        error: null,
      }),
    });

    const res = await listTemplates();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("japan-prefectures");
    expect(body[0].parentTemplateId).toBeUndefined();
  });

  it("Supabase エラー時に 500 を返す", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "DB error" },
      }),
    });

    const res = await listTemplates();
    expect(res.status).toBe(500);
  });
});

describe("GET /api/templates/[id]", () => {
  const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

  it("テンプレートと regions を返す", async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "japan-prefectures",
                name: "日本全国（都道府県）",
                parent_template_id: null,
                parent_region_id: null,
                canvas_width: 800,
                canvas_height: 900,
              },
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                id: "13",
                name: "東京都",
                name_en: "Tokyo",
                tag_id: "prefecture",
                path: "M0 0",
                bbox: { x: 0, y: 0, width: 100, height: 100 },
                offset: { dx: 0, dy: 0 },
              },
            ],
            error: null,
          }),
        }),
      });

    const res = await fetchTemplate(new Request("http://localhost"), makeParams("japan-prefectures"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("japan-prefectures");
    expect(body.regions).toHaveLength(1);
    expect(body.regions[0].tag).toBe("prefecture");
  });

  it("存在しない ID に 404 を返す", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Not found" },
          }),
        }),
      }),
    });

    const res = await fetchTemplate(new Request("http://localhost"), makeParams("nonexistent"));
    expect(res.status).toBe(404);
  });
});

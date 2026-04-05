import { describe, it, expect } from "vitest";
import {
  buildNameFromN03,
  buildTagFromN03,
  dissolveByCode,
} from "../generate-geo-data.mjs";

// -----------------------------------------------------------------------
// buildNameFromN03
// -----------------------------------------------------------------------

describe("buildNameFromN03", () => {
  it("政令市区: district + city を結合する", () => {
    expect(buildNameFromN03({ pref: "神奈川県", district: "横浜市", city: "鶴見区" })).toBe("横浜市鶴見区");
  });

  it("郡部: district + city を結合する", () => {
    expect(buildNameFromN03({ pref: "神奈川県", district: "三浦郡", city: "葉山町" })).toBe("三浦郡葉山町");
  });

  it("一般市: city のみ返す", () => {
    expect(buildNameFromN03({ pref: "北海道", district: null, city: "札幌市" })).toBe("札幌市");
  });

  it("都道府県テンプレート: pref を返す", () => {
    expect(buildNameFromN03({ pref: "東京都", district: null, city: null })).toBe("東京都");
  });
});

// -----------------------------------------------------------------------
// buildTagFromN03
// -----------------------------------------------------------------------

describe("buildTagFromN03", () => {
  it("city あり → municipality", () => {
    expect(buildTagFromN03({ city: "千代田区" })).toBe("municipality");
    expect(buildTagFromN03({ city: "札幌市" })).toBe("municipality");
    expect(buildTagFromN03({ city: "葉山町" })).toBe("municipality");
    expect(buildTagFromN03({ city: "山村" })).toBe("municipality");
  });

  it("city なし → prefecture", () => {
    expect(buildTagFromN03({ city: null })).toBe("prefecture");
    expect(buildTagFromN03({ city: undefined })).toBe("prefecture");
  });
});

// -----------------------------------------------------------------------
// dissolveByCode
// -----------------------------------------------------------------------

function makeFeature(code, city) {
  return {
    type: "Feature",
    properties: {
      N03_001: "テスト県",
      N03_003: null,
      N03_004: city,
      N03_007: code,
    },
    geometry: {
      type: "Polygon",
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
    },
  };
}

describe("dissolveByCode", () => {
  it("同一コードの複数フィーチャーを1エントリに統合する", () => {
    const features = [
      makeFeature("13101", "千代田区"),
      makeFeature("13101", "千代田区"), // 離島など
      makeFeature("13102", "中央区"),
    ];
    const result = dissolveByCode(features);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.code).sort()).toEqual(["13101", "13102"]);
  });

  it("N03_007 が null のフィーチャーをスキップする", () => {
    const features = [
      makeFeature(null, "無効エリア"),
      makeFeature("13101", "千代田区"),
    ];
    const result = dissolveByCode(features);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("13101");
  });

  it("dissolve 後も props が保持される", () => {
    const features = [makeFeature("13101", "千代田区")];
    const result = dissolveByCode(features);
    expect(result[0].props.city).toBe("千代田区");
    expect(result[0].geometry).toBeTruthy();
  });
});

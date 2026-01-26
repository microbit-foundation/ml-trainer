/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { matchLanguage } from "./settings";

describe("matchLanguage", () => {
  it("matches locales to supported languages", () => {
    // Chinese
    expect(matchLanguage(["zh-Hans"])).toBe("zh-CN");
    expect(matchLanguage(["zh-Hant"])).toBe("zh-TW");
    expect(matchLanguage(["zh-Hans-CN"])).toBe("zh-CN");
    expect(matchLanguage(["zh-Hant-TW"])).toBe("zh-TW");
    expect(matchLanguage(["zh-Hant-HK"])).toBe("zh-TW");
    expect(matchLanguage(["zh"])).toBe("zh-CN");

    // Exact matches
    expect(matchLanguage(["en"])).toBe("en");
    expect(matchLanguage(["fr"])).toBe("fr");
    expect(matchLanguage(["ja"])).toBe("ja");

    // Regional variants to base language
    expect(matchLanguage(["en-US"])).toBe("en");
    expect(matchLanguage(["en-GB"])).toBe("en");
    expect(matchLanguage(["fr-CA"])).toBe("fr");

    // Regional variants to specific codes when available
    expect(matchLanguage(["es-ES"])).toBe("es-ES");
    expect(matchLanguage(["pt-BR"])).toBe("pt-BR");
    expect(matchLanguage(["pt-PT"])).toBe("pt-PT");

    // Bare codes to regional variants
    expect(matchLanguage(["es"])).toBe("es-ES");
    expect(matchLanguage(["es-MX"])).toBe("es-ES");
    expect(matchLanguage(["sv"])).toBe("sv-SE");
    expect(matchLanguage(["nn"])).toBe("nn-NO");
    expect(matchLanguage(["si"])).toBe("si-LK");

    // Norwegian: "no" is an alias for "nb"
    expect(matchLanguage(["no"])).toBe("nb");

    // Portuguese: bare "pt" defaults to Brazil (most speakers globally, unlikely from an OS)
    expect(matchLanguage(["pt"])).toBe("pt-BR");

    // Fallback through preferences
    expect(matchLanguage(["xyz", "fr"])).toBe("fr");

    // Fallback to English
    expect(matchLanguage(["xyz"])).toBe("en");
    expect(matchLanguage([])).toBe("en");
  });
});

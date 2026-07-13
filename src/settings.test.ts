/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { getDefaultLanguage, matchLanguage } from "./settings";

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
    expect(matchLanguage(["en-US"])).toBe("en-US");
    expect(matchLanguage(["fr"])).toBe("fr");
    expect(matchLanguage(["ja"])).toBe("ja");

    // Regional variants to base language
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

describe("getDefaultLanguage", () => {
  it("matches OS languages against all languages on web", () => {
    expect(getDefaultLanguage(null, ["ja"], false)).toBe("ja");
    expect(getDefaultLanguage(null, ["de"], false)).toBe("de");
  });
  it("prefers the URL parameter on web", () => {
    expect(getDefaultLanguage("ja", ["fr"], false)).toBe("ja");
    expect(getDefaultLanguage("xyz", ["fr"], false)).toBe("fr");
  });
  it("auto-selects only fully supported languages on native", () => {
    expect(getDefaultLanguage(null, ["fr-CA"], true)).toBe("fr");
    expect(getDefaultLanguage(null, ["es-MX"], true)).toBe("es-ES");
    // Partially supported languages fall back to English
    expect(getDefaultLanguage(null, ["ja"], true)).toBe("en");
    expect(getDefaultLanguage(null, ["de"], true)).toBe("en");
    // ...but later fully supported preferences still win
    expect(getDefaultLanguage(null, ["de", "fr"], true)).toBe("fr");
  });
  it("treats the URL parameter as another preference on native", () => {
    expect(getDefaultLanguage("fr", ["en"], true)).toBe("fr");
    expect(getDefaultLanguage("fr", ["nl"], true)).toBe("fr");
    // A partially supported language via the URL falls through to the OS
    // languages, then English
    expect(getDefaultLanguage("ja", ["nl"], true)).toBe("nl");
    expect(getDefaultLanguage("ja", ["en"], true)).toBe("en");
  });
  it("ignores an invalid URL parameter on native", () => {
    expect(getDefaultLanguage("xyz", ["nl"], true)).toBe("nl");
    expect(getDefaultLanguage("xyz", ["ja"], true)).toBe("en");
  });
});

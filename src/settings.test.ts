/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  allLanguages,
  autoSelectableLanguageIds,
  getDefaultLanguage,
  Language,
  matchLanguage,
  nativeLanguageIds,
} from "./settings";

// Derived from the language table rather than hardcoded: a language moving
// between support levels (adding native strings, going live from preview)
// should not require editing these tests.
const pick = (description: string, ids: string[]): string => {
  const [id] = ids;
  if (!id) {
    throw new Error(`No ${description} language to test with`);
  }
  return id;
};

// English is the fallback, so is useless as a positive example.
const nonEnglish = (id: string) => id !== "en" && id !== "en-US";

const autoSelectable = pick(
  "auto-selectable",
  autoSelectableLanguageIds().filter(nonEnglish)
);
const notAutoSelectable = pick(
  "partially supported",
  allLanguages
    .map((l) => l.id)
    .filter((id) => nonEnglish(id) && !autoSelectableLanguageIds().includes(id))
);

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

describe("autoSelectableLanguageIds", () => {
  const language = (id: string, ui: Language["ui"]): Language => ({
    id,
    name: id,
    enName: id,
    ui,
    makeCode: true,
  });
  const languages = [
    language("live", true),
    language("preview", "preview"),
    language("untranslated", false),
    language("not-native", true),
  ];
  const nativeIds = ["live", "preview", "untranslated"];

  it("includes preview languages only when the preview flag is on", () => {
    expect(autoSelectableLanguageIds(languages, false, nativeIds)).toEqual([
      "live",
    ]);
    expect(autoSelectableLanguageIds(languages, true, nativeIds)).toEqual([
      "live",
      "preview",
    ]);
  });

  it("excludes languages that don't cover the native strings", () => {
    expect(autoSelectableLanguageIds(languages, true, nativeIds)).not.toContain(
      "not-native"
    );
  });

  it("only names languages that exist", () => {
    const ids = allLanguages.map((l) => l.id);
    expect(nativeLanguageIds.filter((id) => !ids.includes(id))).toEqual([]);
  });
});

describe("getDefaultLanguage", () => {
  it("matches OS languages against all languages on web", () => {
    expect(getDefaultLanguage(null, [notAutoSelectable], false)).toBe(
      notAutoSelectable
    );
  });
  it("prefers the URL parameter on web", () => {
    expect(getDefaultLanguage("ja", ["fr"], false)).toBe("ja");
    expect(getDefaultLanguage("xyz", ["fr"], false)).toBe("fr");
  });
  it("auto-selects only fully supported languages on native", () => {
    expect(getDefaultLanguage(null, [autoSelectable], true)).toBe(
      autoSelectable
    );
    // Partially supported languages fall back to English...
    expect(getDefaultLanguage(null, [notAutoSelectable], true)).toBe("en");
    // ...but later fully supported preferences still win
    expect(
      getDefaultLanguage(null, [notAutoSelectable, autoSelectable], true)
    ).toBe(autoSelectable);
  });
  it("treats the URL parameter as another preference on native", () => {
    expect(getDefaultLanguage(autoSelectable, ["en"], true)).toBe(
      autoSelectable
    );
    // A partially supported language via the URL falls through to the OS
    // languages, then English
    expect(getDefaultLanguage(notAutoSelectable, [autoSelectable], true)).toBe(
      autoSelectable
    );
    expect(getDefaultLanguage(notAutoSelectable, ["en"], true)).toBe("en");
  });
  it("ignores an invalid URL parameter on native", () => {
    expect(getDefaultLanguage("xyz", [autoSelectable], true)).toBe(
      autoSelectable
    );
    expect(getDefaultLanguage("xyz", [notAutoSelectable], true)).toBe("en");
  });
});

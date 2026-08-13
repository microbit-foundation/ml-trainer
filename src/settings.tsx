/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  getDefaultLanguageId,
  type KnownLanguageId,
} from "@microbit/ui-patterns";
import { flags } from "./flags";
import { DataSamplesView, TourTriggerName } from "./model";
import { isNativePlatform } from "./platform";

type Translation = "preview" | boolean;

export interface Language {
  // Typo-proof: the shared registry's id union, so `tsc` catches an id the
  // family doesn't know.
  id: KnownLanguageId;
  name: string;
  enName: string;
  // Language supported in Classroom UI.
  ui: Translation;
  // Language supported in Microsoft MakeCode editor.
  makeCode: boolean;
}

// Tag new languages with `ui: "preview"` to enable for beta only.
// Adding a new language? Ensure the project links work, or add a temporary
// redirect on microbit.org to fallback on not having a language path.
export const allLanguages: Language[] = [
  {
    id: "en",
    name: "English (UK)",
    enName: "English (UK)",
    ui: true,
    makeCode: true,
  },
  {
    id: "en-US",
    name: "English (US)",
    enName: "English (US)",
    ui: true,
    makeCode: true,
  },
  {
    id: "ar",
    name: "العربية",
    enName: "Arabic",
    ui: false,
    makeCode: true,
  },
  {
    id: "bg",
    name: "български",
    enName: "Bulgarian",
    ui: false,
    makeCode: true,
  },
  {
    id: "ca",
    name: "Català",
    enName: "Catalan",
    ui: true,
    makeCode: true,
  },
  {
    id: "cs",
    name: "Čeština",
    enName: "Czech",
    ui: false,
    makeCode: true,
  },
  {
    id: "cy",
    name: "Cymraeg",
    enName: "Welsh",
    ui: false,
    makeCode: true,
  },
  {
    id: "da",
    name: "Dansk",
    enName: "Danish",
    ui: false,
    makeCode: true,
  },
  {
    id: "de",
    name: "Deutsch",
    enName: "German",
    ui: false,
    makeCode: true,
  },
  {
    id: "el",
    name: "Ελληνικά",
    enName: "Greek",
    ui: false,
    makeCode: true,
  },
  {
    id: "es-ES",
    name: "Español",
    enName: "Spanish",
    ui: true,
    makeCode: true,
  },
  {
    id: "fi",
    name: "Suomi",
    enName: "Finnish",
    ui: false,
    makeCode: true,
  },
  {
    id: "fr",
    name: "Français",
    enName: "French",
    ui: true,
    makeCode: true,
  },
  {
    id: "gn",
    name: "Avañe'ẽ",
    enName: "Guarani",
    ui: false,
    makeCode: true,
  },
  {
    id: "he",
    name: "עברית",
    enName: "Hebrew",
    ui: false,
    makeCode: true,
  },
  {
    id: "hu",
    name: "Magyar",
    enName: "Hungarian",
    ui: false,
    makeCode: true,
  },
  {
    id: "is",
    name: "Íslenska",
    enName: "Icelandic",
    ui: false,
    makeCode: true,
  },
  {
    id: "it",
    name: "Italiano",
    enName: "Italian",
    ui: false,
    makeCode: true,
  },
  {
    id: "ja",
    name: "日本語",
    enName: "Japanese",
    ui: true,
    makeCode: true,
  },
  {
    id: "ko",
    name: "한국어",
    enName: "Korean",
    ui: true,
    makeCode: true,
  },
  {
    id: "lo",
    name: "ພາສາລາວ",
    enName: "Lao",
    ui: true,
    makeCode: true,
  },
  {
    id: "nl",
    name: "Nederlands",
    enName: "Dutch",
    ui: true,
    makeCode: true,
  },
  {
    id: "nb",
    name: "Norsk bokmål",
    enName: "Norwegian Bokmal",
    ui: false,
    makeCode: true,
  },
  {
    id: "nn-NO",
    name: "Norsk nynorsk",
    enName: "Norwegian Nynorsk",
    ui: false,
    makeCode: true,
  },
  {
    id: "pl",
    name: "Polski",
    enName: "Polish",
    ui: true,
    makeCode: true,
  },
  {
    id: "pt-BR",
    name: "Português (Brasil)",
    enName: "Portuguese (Brazil)",
    ui: true,
    makeCode: true,
  },
  {
    id: "pt-PT",
    name: "Português (Portugal)",
    enName: "Portuguese (Portugal)",
    ui: false,
    makeCode: true,
  },
  {
    id: "ru",
    name: "Русский",
    enName: "Russian",
    ui: false,
    makeCode: true,
  },
  {
    id: "si-LK",
    name: "සිංහල",
    enName: "Sinhala",
    ui: false,
    makeCode: true,
  },
  {
    id: "sk",
    name: "Slovenčina",
    enName: "Slovak",
    ui: false,
    makeCode: true,
  },
  {
    id: "sr",
    name: "Srpski",
    enName: "Serbian (Latin)",
    ui: false,
    makeCode: true,
  },
  {
    id: "sv-SE",
    name: "Svenska",
    enName: "Swedish",
    ui: false,
    makeCode: true,
  },
  {
    id: "tr",
    name: "Türkçe",
    enName: "Turkish",
    ui: false,
    makeCode: true,
  },
  {
    id: "uk",
    name: "Українська",
    enName: "Ukrainian",
    ui: false,
    makeCode: true,
  },
  {
    id: "vi",
    name: "Tiếng việt",
    enName: "Vietnamese",
    ui: true,
    makeCode: true,
  },
  {
    id: "zh-CN",
    name: "简体中文",
    enName: "Chinese (Simplified)",
    ui: false,
    makeCode: true,
  },
  {
    id: "zh-TW",
    name: "繁體中文",
    enName: "Chinese (Traditional)",
    ui: true,
    makeCode: true,
  },
];

export const getMakeCodeLang = (languageId: string): string =>
  allLanguages.find((l) => l.id === languageId)?.makeCode ? languageId : "en";

/**
 * Languages with UI translations covering the native (iOS/Android) app's
 * additional strings. Other languages still appear in the picker on native,
 * but as 'partially supported' — missing strings fall back to English —
 * and are never auto-selected on first run. Add ids here as translations
 * land.
 */
export const nativeLanguageIds: KnownLanguageId[] = [
  "en",
  "en-US",
  "nl",
  "fr",
  "pl",
  "es-ES",
  "pt-BR",
  "vi",
  "lo",
];

/**
 * Whether the language's UI translation is enabled in this build.
 *
 * Preview languages are enabled on beta only, so their translations can be
 * reviewed before going live.
 */
export const isUiEnabled = (
  language: Language,
  previewEnabled: boolean = flags.translationPreview
): boolean =>
  language.ui === true || (language.ui === "preview" && previewEnabled);

const supportedLanguageIds = allLanguages.map((l) => l.id);

/**
 * Match the user's preferred languages (from browser/OS) to supported languages.
 */
export const matchLanguage = (requestedLanguages: readonly string[]): string =>
  getDefaultLanguageId({
    autoSelectableIds: supportedLanguageIds,
    requestedLanguages,
  });

/**
 * Language ids that may be auto-selected on first run on native: those
 * covering the native strings whose UI translation is enabled in this build.
 *
 * Parameters default from the environment and exist for testing.
 */
export const autoSelectableLanguageIds = (
  languages: readonly Language[] = allLanguages,
  previewEnabled: boolean = flags.translationPreview,
  nativeIds: readonly string[] = nativeLanguageIds
): string[] =>
  languages
    .filter((l) => nativeIds.includes(l.id) && isUiEnabled(l, previewEnabled))
    .map((l) => l.id);

/**
 * Get the initial language, checking URL parameter first, then OS/browser
 * preference.
 *
 * On native, languages are only auto-selected if fully supported
 * ({@link nativeLanguageIds}); for others we stay in English so the user
 * makes an informed choice via the language dialog, which explains the
 * level of support. The URL parameter (typically the site language passed
 * along when following a link from microbit.org) is a hint rather than an
 * explicit choice, so gets the same treatment.
 *
 * Parameters default from the environment and exist for testing.
 */
export const getDefaultLanguage = (
  languageParam: string | null = new URLSearchParams(
    window.location.search
  ).get("l"),
  osLanguages: readonly string[] = navigator.languages,
  native: boolean = isNativePlatform()
): string =>
  getDefaultLanguageId({
    // On native only fully supported languages may be auto-selected; on the
    // web any supported language may be.
    autoSelectableIds: native
      ? autoSelectableLanguageIds()
      : supportedLanguageIds,
    languageHint: languageParam,
    requestedLanguages: osLanguages,
  });

export const defaultSettings: Settings = {
  languageId: getDefaultLanguage(),
  showPreSaveHelp: true,
  showPreTrainHelp: true,
  showPreDownloadHelp: true,
  toursCompleted: [],
  dataSamplesView: DataSamplesView.Graph,
  showGraphs: true,
  graphColorScheme: "default",
  graphLineScheme: "solid",
  graphLineWeight: "default",
};

export type GraphColorScheme = "default" | "color-blind-1" | "color-blind-2";
export const graphColorSchemeOptions: GraphColorScheme[] = [
  "default",
  "color-blind-1",
  "color-blind-2",
];

export type GraphLineScheme = "solid" | "accessible";
export const graphLineSchemeOptions: GraphLineScheme[] = [
  "solid",
  "accessible",
];

export type GraphLineWeight = "default" | "thick";
export const graphLineWeightOptions: GraphLineWeight[] = ["default", "thick"];

export interface Settings {
  languageId: string;
  showPreSaveHelp: boolean;
  showPreTrainHelp: boolean;
  showPreDownloadHelp: boolean;
  toursCompleted: TourTriggerName[];
  dataSamplesView: DataSamplesView;
  showGraphs: boolean;
  graphColorScheme: GraphColorScheme;
  graphLineScheme: GraphLineScheme;
  graphLineWeight: GraphLineWeight;
  /**
   * The micro:bit Bluetooth name, used to filter for a specific device during pairing.
   * Set from user input (Bluetooth pattern dialog) or derived from USB device ID after flashing.
   * Persisted so it can be reused across sessions and between data connection/download flows.
   */
  bluetoothMicrobitName?: string;
  /**
   * List of bonded Bluetooth device ids.
   * The connection library needs us to store this because iOS doesn't
   * have API for checking whether a device is bonded.
   */
  bondedDevices?: string[];
  /**
   * The user's analytics consent decision on the native (Capacitor)
   * build. Web builds use the shared-assets cookie modal instead and
   * ignore this field.
   *
   * `undefined` means the user has not been asked yet — the consent UI
   * uses this to decide whether to prompt on first run. Analytics events
   * must not be emitted while this is `undefined` or `"denied"`.
   */
  analyticsConsent?: "granted" | "denied";
}

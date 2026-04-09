/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { DataSamplesView, TourTriggerName } from "./model";

type Translation = "preview" | boolean;

export interface Language {
  id: string;
  name: string;
  enName: string;
  // Language supported in Classroom UI.
  ui: Translation;
  // Language supported in Microsoft MakeCode editor.
  makeCode: boolean;
}

// Tag new languages with `preview: true` to enable for beta only.
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
    ui: false,
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

export const getLanguageFromQuery = (): string => {
  const searchParams = new URLSearchParams(window.location.search);
  const l = searchParams.get("l");
  const language = allLanguages.find((x) => x.id === l);
  return language?.id || allLanguages[0].id;
};

export const defaultSettings: Settings = {
  languageId: getLanguageFromQuery(),
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
}

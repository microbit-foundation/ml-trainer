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
    name: "English",
    enName: "English",
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
    ui: false,
    enName: "Bulgarian",
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
    ui: false,
    enName: "Czech",
    makeCode: true,
  },
  {
    id: "cy",
    name: "Cymraeg",
    ui: true,
    enName: "Welsh",
    makeCode: true,
  },
  {
    id: "da",
    name: "Dansk",
    ui: false,
    enName: "Danish",
    makeCode: true,
  },
  {
    id: "de",
    name: "Deutsch",
    ui: "preview",
    enName: "German",
    makeCode: true,
  },
  {
    id: "el",
    name: "Ελληνικά",
    ui: false,
    enName: "Greek",
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
    ui: false,
    enName: "Finnish",
    makeCode: true,
  },
  {
    id: "fr",
    name: "Français",
    ui: true,
    enName: "French",
    makeCode: true,
  },
  {
    id: "he",
    name: "עברית",
    ui: false,
    enName: "Hebrew",
    makeCode: true,
  },
  {
    id: "hu",
    name: "Magyar",
    ui: false,
    enName: "Hungarian",
    makeCode: true,
  },
  {
    id: "is",
    name: "Íslenska",
    ui: false,
    enName: "Icelandic",
    makeCode: true,
  },
  {
    id: "it",
    name: "Italiano",
    ui: "preview",
    enName: "Italian",
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
    ui: false,
    enName: "Norwegian Bokmal",
    makeCode: true,
  },
  {
    id: "nn-NO",
    name: "Norsk nynorsk",
    ui: false,
    enName: "Norwegian Nynorsk",
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
    ui: false,
    enName: "Portuguese (Portugal)",
    makeCode: true,
  },
  {
    id: "ru",
    name: "Русский",
    ui: false,
    enName: "Russian",
    makeCode: true,
  },
  {
    id: "si-LK",
    name: "සිංහල",
    ui: false,
    enName: "Sinhala",
    makeCode: true,
  },
  {
    id: "sk",
    name: "Slovenčina",
    ui: false,
    enName: "Slovak",
    makeCode: true,
  },
  {
    id: "sr",
    name: "Srpski",
    ui: false,
    enName: "Serbian (Latin)",
    makeCode: true,
  },
  {
    id: "sv-SE",
    name: "Svenska",
    ui: false,
    enName: "Swedish",
    makeCode: true,
  },
  {
    id: "tr",
    name: "Türkçe",
    ui: false,
    enName: "Turkish",
    makeCode: true,
  },
  {
    id: "uk",
    name: "Українська",
    ui: false,
    enName: "Ukrainian",
    makeCode: true,
  },
  {
    id: "zh-CN",
    name: "简体中文",
    ui: false,
    enName: "Chinese (Simplified)",
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

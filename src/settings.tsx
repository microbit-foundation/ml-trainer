/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 * Modifications (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { stage } from "./environment";
import { DataSamplesView, TourTriggerName } from "./model";

export interface Language {
  id: string;
  name: string;
  enName: string;
  preview?: boolean;
  // Language supported in Microsoft MakeCode editor.
  makeCode: boolean;
}

// Tag new languages with `preview: true` to enable for beta only.
export const allLanguages: Language[] = [
  {
    id: "en",
    name: "English",
    enName: "English",
    makeCode: true,
  },
  {
    id: "es-es",
    name: "Español",
    enName: "Spanish",
    makeCode: true,
    preview: true,
  },
  {
    id: "ja",
    name: "日本語",
    enName: "Japanese",
    makeCode: true,
    preview: true,
  },
  {
    id: "ko",
    name: "한국어",
    enName: "Korean",
    makeCode: true,
    preview: true,
  },
  {
    id: "nl",
    name: "Nederlands",
    enName: "Dutch",
    makeCode: true,
    preview: true,
  },
  {
    id: "pl",
    name: "Polski",
    enName: "Polish",
    makeCode: true,
    preview: true,
  },
  {
    id: "pt-br",
    name: "Português (Brasil)",
    enName: "Portuguese (Brazil)",
    makeCode: true,
    preview: true,
  },
  {
    id: "zh-tw",
    name: "繁體中文",
    enName: "Chinese (Traditional)",
    makeCode: true,
    preview: true,
  },
];

export const getMakeCodeLang = (languageId: string): string =>
  allLanguages.find((l) => l.id === languageId)?.makeCode ? languageId : "en";

export const supportedLanguages: Language[] = allLanguages.filter(
  (l) => stage !== "production" || !l.preview
);

export const getLanguageFromQuery = (): string => {
  const searchParams = new URLSearchParams(window.location.search);
  const l = searchParams.get("l");
  const supportedLanguage = supportedLanguages.find((x) => x.id === l);
  return supportedLanguage?.id || supportedLanguages[0].id;
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

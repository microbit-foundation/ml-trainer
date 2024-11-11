import { stage } from "./environment";
import { DataSamplesView, TourTrigger } from "./model";

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
};

export interface Settings {
  languageId: string;
  showPreSaveHelp: boolean;
  showPreTrainHelp: boolean;
  showPreDownloadHelp: boolean;
  toursCompleted: TourTrigger[];
  dataSamplesView: DataSamplesView;
  showGraphs: boolean;
}

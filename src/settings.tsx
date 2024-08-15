/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createContext, ReactNode, useContext } from "react";
import { useStorage } from "./hooks/use-storage";
import { stage } from "./environment";

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
};

export const isValidSettingsObject = (value: unknown): value is Settings => {
  if (typeof value !== "object") {
    return false;
  }
  const object = value as any;
  if (
    object.languageId &&
    !supportedLanguages.find((x) => x.id === object.languageId)
  ) {
    return false;
  }
  return true;
};

export interface Settings {
  languageId: string;
}

type SettingsContextValue = [Settings, (settings: Settings) => void];

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export const useSettings = (): SettingsContextValue => {
  const settings = useContext(SettingsContext);
  if (!settings) {
    throw new Error("Missing provider");
  }
  return settings;
};

const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const settings = useStorage<Settings>(
    "local",
    "settings",
    defaultSettings,
    isValidSettingsObject
  );
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;

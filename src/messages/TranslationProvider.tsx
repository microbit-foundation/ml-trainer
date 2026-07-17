/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { inContextTranslationLangId, useSettings } from "../store";
import { IntlProvider, MessageFormatElement } from "react-intl";
import { ReactNode, useEffect, useState } from "react";
import { retryAsyncLoad } from "./chunk-util";
import { allLanguages } from "../settings";
import { flags } from "../flags";

async function loadLocaleData(locale: string) {
  const lang = locale.toLowerCase();
  const languageSetting = allLanguages.find(
    l => l.id.toLowerCase() === lang
  );
  const importLanguage =
    (flags.translationPreview && languageSetting?.ui === "preview") ||
    languageSetting?.ui === true || lang === inContextTranslationLangId;
  if (importLanguage) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return (await import(`./ui.${lang}.json`)).default as Messages;
  }
  return (await import("./ui.en.json")).default;
}

type Messages = Record<string, string> | Record<string, MessageFormatElement[]>;

// @microbit/ui's components look up messages by ui.*-namespaced ids. Until
// the package ships its own translated catalogs, alias them to this app's
// existing (translated) messages so every locale keeps working; without an
// entry react-intl falls back to the package's inline English.
const sharedUiMessageAliases: Record<string, string> = {
  "ui.close-action": "close-action",
  "ui.toast-status-error": "toast-status-error",
  "ui.toast-status-info": "toast-status-info",
  "ui.toast-status-success": "toast-status-success",
  "ui.toast-status-warning": "toast-status-warning",
};

const withSharedUiMessages = (messages: Messages): Messages => {
  const result = { ...messages } as Record<
    string,
    string | MessageFormatElement[]
  >;
  for (const [id, appId] of Object.entries(sharedUiMessageAliases)) {
    if (messages[appId]) {
      result[id] = messages[appId];
    }
  }
  return result as Messages;
};

interface TranslationProviderProps {
  children: ReactNode;
}

/**
 * Provides translation support to the app via react-intl.
 */
const TranslationProvider = ({ children }: TranslationProviderProps) => {
  const [{ languageId }] = useSettings();
  // If the messages are for a different language (or missing) then reload them
  const [messages, setMessages] = useState<Messages | undefined>();
  useEffect(() => {
    const load = async () => {
      setMessages(
        withSharedUiMessages(
          await retryAsyncLoad(() => loadLocaleData(languageId))
        )
      );
    };
    void load();
  }, [languageId]);
  return messages ? (
    <IntlProvider locale={languageId} defaultLocale="en" messages={messages}>
      {children}
    </IntlProvider>
  ) : null;
};

export default TranslationProvider;

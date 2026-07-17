/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { messages as uiMessages } from "@microbit/ui/messages";
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

// @microbit/ui's components look up messages by ui.*-namespaced ids from the
// catalogs the package ships; merge the active locale's catalog (English
// fallback) under the app's own messages.
const withSharedUiMessages = (locale: string, messages: Messages): Messages =>
  ({
    ...(uiMessages[locale.toLowerCase()] ?? uiMessages.en),
    ...messages,
  }) as Messages;

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
          languageId,
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

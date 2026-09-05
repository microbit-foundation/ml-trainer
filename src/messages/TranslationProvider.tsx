/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { inContextTranslationLangId, useSettings } from "../store";
import { IntlProvider, MessageFormatElement } from "react-intl";
import { ReactNode, useEffect, useState } from "react";
import { retryAsyncLoad } from "./chunk-util";
import { allLanguages, isUiEnabled } from "../settings";

async function loadLocaleData(locale: string): Promise<LocaleData> {
  // Matched case-insensitively: stored settings and ?l= links predate
  // canonical id casing. The catalog file takes the canonical id.
  const lower = locale.toLowerCase();
  const languageSetting = allLanguages.find(
    (l) => l.id.toLowerCase() === lower
  );
  // Keyed on isUiEnabled (the catalog decision), not the dialog's uiSupported:
  // languages the native builds demote to "partially supported" still load
  // their catalog and mostly render in it, with only the native-extra strings
  // falling back per-message, so they keep their own locale below.
  const id =
    languageSetting !== undefined && isUiEnabled(languageSetting)
      ? languageSetting.id
      : lower === inContextTranslationLangId
        ? inContextTranslationLangId
        : undefined;
  if (id) {
    return {
      locale: id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      messages: (await import(`./ui.${id}.json`)).default as Messages,
    };
  }
  // Wholesale English fallback (no UI translation for this language): claim
  // `en` too — react-intl's locale is read as the language the page actually
  // renders in, driving <html lang>, react-aria's direction and built-in
  // strings, and Intl formatting. The user's chosen language stays in the
  // store and still reaches MakeCode.
  return { locale: "en", messages: (await import("./ui.en.json")).default };
}

type Messages = Record<string, string> | Record<string, MessageFormatElement[]>;

interface LocaleData {
  /** The locale of `messages` — `en` whenever we fell back. */
  locale: string;
  messages: Messages;
}

interface TranslationProviderProps {
  children: ReactNode;
}

/**
 * Provides translation support to the app via react-intl.
 */
const TranslationProvider = ({ children }: TranslationProviderProps) => {
  const [{ languageId }] = useSettings();
  // If the messages are for a different language (or missing) then reload them
  const [localeData, setLocaleData] = useState<LocaleData | undefined>();
  useEffect(() => {
    const load = async () => {
      setLocaleData(await retryAsyncLoad(() => loadLocaleData(languageId)));
    };
    void load();
  }, [languageId]);
  return localeData ? (
    <IntlProvider
      locale={localeData.locale}
      defaultLocale="en"
      messages={localeData.messages}
    >
      {children}
    </IntlProvider>
  ) : null;
};

export default TranslationProvider;

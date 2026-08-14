/**
 * (c) 2021, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  LanguageDialog as SharedLanguageDialog,
  LanguageDialogLanguage,
} from "@microbit/ui-patterns";
import { useMemo } from "react";
import { deployment, useDeployment } from "../deployment";
import { isNativePlatform } from "../platform";
import {
  allLanguages,
  isUiEnabled,
  Language,
  nativeLanguageIds,
} from "../settings";
import { useStore } from "../store";

interface LanguageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const uiSupported = (language: Language): boolean => {
  if (isNativePlatform() && !nativeLanguageIds.includes(language.id)) {
    return false;
  }
  return isUiEnabled(language);
};

/**
 * Language setting dialog: @microbit/ui-patterns' LanguageDialog fed this
 * app's support model (MakeCode + the app itself, with the native builds'
 * narrower translation coverage).
 */
export const LanguageDialog = ({ isOpen, onClose }: LanguageDialogProps) => {
  const setLanguage = useStore((s) => s.setLanguage);
  const { appNameFull } = useDeployment();
  const languages = useMemo<LanguageDialogLanguage[]>(
    () =>
      allLanguages.map((language) => ({
        id: language.id,
        // Qualified because this app also offers en-US; the shared registry
        // says plain "English" pending the family-wide naming decision.
        ...(language.id === "en"
          ? { name: "English (UK)", enName: "English (UK)" }
          : undefined),
        support: [
          { name: "Microsoft MakeCode", supported: language.makeCode },
          { name: appNameFull, supported: uiSupported(language) === true },
        ],
      })),
    [appNameFull]
  );
  return (
    <SharedLanguageDialog
      isOpen={isOpen}
      onClose={onClose}
      languages={languages}
      onSelectLanguage={setLanguage}
      translationLinkHref={deployment.translationLink}
    />
  );
};

/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { isPublicFacingStage } from "../environment";

// We might move these into the deployment config in future
// They'll also need to become language aware
const microbitOrgBaseUrl = isPublicFacingStage()
  ? "https://microbit.org/"
  : "https://stage.microbit.org/";

const langPath = (languageId: string) =>
  languageId === "en" ? "" : `${languageId.toLowerCase()}/`;

export const projectUrl = (slug: string, language: string) =>
  `${microbitOrgBaseUrl}${langPath(
    language
  )}projects/make-it-code-it/${encodeURIComponent(slug)}/`;

export const userGuideUrl = () =>
  `${microbitOrgBaseUrl}get-started/user-guide/microbit-createai/`;

export const landingPageUrl = (language: string) =>
  `${microbitOrgBaseUrl}${langPath(language)}ai/`;

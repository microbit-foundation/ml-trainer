/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { stage } from "../environment";

// We might move these into the deployment config in future
// They'll also need to become language aware
const microbitOrgBaseUrl =
  stage === "production"
    ? "https://microbit.org/"
    : "https://stage.microbit.org/";

export const projectUrl = (slug: string, language: string) =>
  `${microbitOrgBaseUrl}${
    language === "en" ? "" : `${language.toLowerCase()}/`
  }projects/make-it-code-it/${encodeURIComponent(slug)}/`;

export const userGuideUrl = () =>
  `${microbitOrgBaseUrl}get-started/user-guide/microbit-createai/`;

export const landingPageUrl = () => `${microbitOrgBaseUrl}ai/`;

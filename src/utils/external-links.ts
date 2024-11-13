import { stage } from "../environment";

// We might move these into the deployment config in future
// They'll also need to become language aware
const microbitOrgBaseUrl =
  stage === "production"
    ? "https://microbit.org/"
    : "https://stage.microbit.org/";

export const projectUrl = (slug: string) =>
  `${microbitOrgBaseUrl}projects/make-it-code-it/${encodeURIComponent(slug)}/`;

export const userGuideUrl = () =>
  `${microbitOrgBaseUrl}get-started/user-guide/createai/`;

export const landingPageUrl = () => `${microbitOrgBaseUrl}ai/`;

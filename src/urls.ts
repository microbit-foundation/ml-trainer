import { ResourceId, TabId } from "./pages-config";

export const basepath = import.meta.env.BASE_URL ?? "/";

if (!basepath.endsWith("/")) {
  throw new Error("URL configuration broken: " + basepath);
}

export const createHomePageUrl = () => `${basepath}`;

export const createStepPageUrl = (stepId: TabId) => `${basepath}${stepId}`;

export const createResourcePageUrl = (resourceId: ResourceId) =>
  `${basepath}resources/${resourceId}`;

/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
export const basepath = import.meta.env.BASE_URL ?? "/";

if (!basepath.endsWith("/")) {
  throw new Error("URL configuration broken: " + basepath);
}

export const createHomePageUrl = () => `${basepath}`;

export const createNewPageUrl = () => `${basepath}new`;

export const createImportPageUrl = () => `${basepath}import`;

export const createDataSamplesPageUrl = () => `${basepath}data-samples`;

export const createTestingModelPageUrl = () => `${basepath}testing-model`;

export const createCodePageUrl = () => `${basepath}code`;

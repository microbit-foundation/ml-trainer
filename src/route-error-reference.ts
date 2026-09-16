/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

const references = new WeakMap<object, string | undefined>();

const isObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null;

/**
 * Wraps a route loader so that an error it throws is reported before
 * react-router hands it to the errorElement, which shows the report's
 * reference via referenceFor. The original error is rethrown, so checks on
 * it (e.g. for a VersionError) still work.
 */
export const reported =
  <T>(
    report: (error: unknown) => string | undefined,
    loader: () => Promise<T>
  ) =>
  async (): Promise<T> => {
    try {
      return await loader();
    } catch (e) {
      const reference = report(e);
      if (isObject(e)) {
        references.set(e, reference);
      }
      throw e;
    }
  };

/** The reference recorded for an error thrown by a wrapped loader. */
export const referenceFor = (error: unknown): string | undefined =>
  isObject(error) ? references.get(error) : undefined;

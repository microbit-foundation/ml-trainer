/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Capacitor } from "@capacitor/core";
import { captureException } from "@sentry/capacitor";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reportError } from "./sentry";

vi.mock("@sentry/capacitor", () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  init: vi.fn(),
}));

describe("reportError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(captureException).mockClear();
  });

  const report = (message: string, e: unknown) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    reportError("dsn", message, e);
    return vi.mocked(captureException).mock.calls[0];
  };

  it("reports the message when there is no error", () => {
    const [error, hint] = report("Something timed out", undefined);
    expect(error).toEqual(new Error("Something timed out"));
    expect(hint).toMatchObject({
      tags: { log_message: "Something timed out" },
    });
  });

  it("leaves grouping to Sentry on the web", () => {
    const [, hint] = report("Connect error", new Error("Timeout"));
    expect(hint).toMatchObject({ fingerprint: undefined });
  });

  it("groups by message and error on native platforms", () => {
    vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    const [, hint] = report("Connect error", new Error("Timeout"));
    expect(hint).toMatchObject({
      fingerprint: ["Connect error", "Error: Timeout"],
    });
  });
});

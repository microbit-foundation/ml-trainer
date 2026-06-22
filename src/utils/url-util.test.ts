/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { isWebUrl } from "./url-util";

describe("isWebUrl", () => {
  it("is true for http and https URLs", () => {
    expect(isWebUrl("https://mltrainer.microbit.org/import?id=x")).toEqual(
      true
    );
    expect(isWebUrl("http://localhost:5173/data-samples")).toEqual(true);
  });

  it("is false for file and content URLs (native file opens)", () => {
    expect(isWebUrl("file:///storage/emulated/0/Download/project.hex")).toEqual(
      false
    );
    expect(isWebUrl("content://com.android.providers/document/123")).toEqual(
      false
    );
  });

  it("is false for unparseable input", () => {
    expect(isWebUrl("not a url")).toEqual(false);
    expect(isWebUrl("")).toEqual(false);
  });
});

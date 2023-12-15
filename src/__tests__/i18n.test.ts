/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { get } from 'svelte/store';
import { MockInstance } from 'vitest';
import { spyOn } from '@vitest/spy';

describe('Initialization tests', () => {
  let windowSpy: MockInstance<[], any>;

  beforeEach(() => {
    windowSpy = spyOn(window, 'window', 'get');
  });

  afterEach(() => {
    windowSpy.mockRestore();
    localStorage.clear();
    vitest.resetModules();
  });

  test('Language is set to welsh when it is the preferred browser option', async () => {
    windowSpy.mockImplementation(() => ({
      navigator: {
        languages: ['cy', 'en'],
      },
    }));
    const i18n = await import('../i18n');
    const getText = get(i18n.t);

    const translatedText = getText('alert.isRecording');

    expect(translatedText).toBe("Rydych chi'n recordio ar hyn o bryd!");
  });

  test('Language falls back to english when an unsupported language is selected', async () => {
    windowSpy.mockImplementation(() => ({
      navigator: {
        languages: ['random-language'],
      },
    }));
    const i18n = await import('../i18n');
    const getText = get(i18n.t);

    const translatedText = getText('alert.isRecording');

    expect(translatedText).toBe('You are currently recording!');
  });
});

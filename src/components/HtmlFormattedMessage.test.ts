/**
 * @vitest-environment jsdom
 */
/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/svelte';
import { IntlMessageFormat } from 'intl-messageformat';

import HtmlFormattedMessage from './HtmlFormattedMessage.svelte';

const messages: Record<string, string> = {
  simple: 'An example',
  link: 'Before <link>linked</link> After',
  html: "'Before '<b>Bold</b>'",
};

const tValue = (id: string, options: any) => {
  // Skipped the svelte-i18n layer but tested the XML-like parsing behaviour below it
  return new IntlMessageFormat(
    messages[id] ?? 'Unknown',
    undefined,
    undefined,
    options,
  ).format(options.values);
};

vitest.mock('../i18n', () => ({
  t: {
    subscribe(cb: any) {
      cb(tValue);
      return () => {};
    },
  },
}));

describe('HtmlFormattedMessage', () => {
  it('renderes simple example', () => {
    render(HtmlFormattedMessage, { id: 'simple' });
    const dom = screen.getByText('An example');
    expect(dom).toMatchInlineSnapshot(`
      <span>
        An example
      </span>
    `);
  });

  it('renderes a link', () => {
    render(HtmlFormattedMessage, {
      id: 'link',
      options: {
        values: {
          link: chunks => {
            const link = document.createElement('a');
            Object.assign(link, {
              href: '/',
              innerText: chunks.join(''),
            });
            return link;
          },
        },
      },
    });
    const dom = screen.getByText(/Before/);
    expect(dom).toMatchInlineSnapshot(`
      <span>
        Before 
        <a
          href="/"
        />
         After
      </span>
    `);
  });

  it('needs care due to lack of html escaping', () => {
    render(HtmlFormattedMessage, {
      id: 'html',
    });
    const dom = screen.getByText(/Bold/);
    expect(dom).toMatchInlineSnapshot(`
      <b>
        Bold
      </b>
    `);
  });
});

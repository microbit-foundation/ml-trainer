<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT

  WARNING: This uses @html so translations used must be reviewed.

  A more Svelte-friendly approach to links appears elusive.
  Note this requires `ignoreTag: false` in the svelte-i18n options.
  
  https://github.com/kaisermann/svelte-i18n/issues/118

 -->

<script lang="ts" context="module">
  interface Options {
    className?: string;
    tag?: string;
  }
  export const linkWithProps =
    (props: Partial<HTMLAnchorElement>, options: Options = {}) =>
    (chunks: string[]) => {
      {
        const tag = options.tag ?? 'a';
        const element = document.createElement(tag);
        Object.assign(element, {
          className:
            'text-link outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring ' +
            (options.className ?? ''),
          innerText: chunks.join(''),
          ...props,
        });
        return element;
      }
    };
</script>

<script lang="ts">
  import { t } from '../i18n';

  // Not exported from svelte-i18n
  interface Options {
    locale?: string;
    format?: string;
    default?: string;
    values?: InterpolationValues;
  }
  type InterpolationValues =
    | Record<
        string,
        | string
        | number
        | boolean
        | Date
        // Return type changed
        | ((parts: Array<string>) => HTMLElement)
        | null
        | undefined
      >
    | undefined;

  export let id: string;

  export let options: Options | undefined = undefined;

  $: adaptedOptions = {
    ...options,
    values: Object.fromEntries(
      Object.entries(options?.values ?? {}).map(([k, v]) => {
        return [
          k,
          v instanceof Function
            ? (parts: unknown[]) => v(parts as string[]).outerHTML
            : v,
        ];
      }),
    ),
  };
</script>

<span>
  {@html $t(id, adaptedOptions)}
</span>

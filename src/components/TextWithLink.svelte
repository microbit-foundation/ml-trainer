<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import { parseTag } from '../parseTag';
  export let href: string;
  export let textId: string;
</script>

{#each parseTag($t(textId), 'link') as { tag, text }}
  {#if tag}
    <a
      class="text-link outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
      rel="noopener noreferrer"
      {href}
      target="_blank">{text}</a>
  {:else}
    {text}
  {/if}
{/each}

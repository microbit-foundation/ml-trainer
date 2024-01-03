<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  export let statusId: string;
  export let descriptionId: string | undefined = undefined;
</script>

<div class="flex flex-col w-full py-10 gap-10">
  <div class="flex flex-col gap-3">
    <h3 class="text-lg bold m-auto font-semibold">
      {$t(statusId)}
    </h3>
    {#if descriptionId}
      <p>{$t(descriptionId)}</p>
    {/if}
  </div>
  <slot />
</div>

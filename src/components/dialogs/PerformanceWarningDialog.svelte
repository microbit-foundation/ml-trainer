<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from 'svelte-i18n';
  import StandardButton from '../StandardButton.svelte';
  import StandardDialog from './StandardDialog.svelte';
  import ExternalLinkIcon from 'virtual:icons/ri/external-link-line';

  export let isOpen: boolean = false;

  // Non-functional dialog to prompt the user to re-flash devices
  // if performance is poor.
  // This can be due to RF interference or slow hardware.
</script>

<StandardDialog {isOpen} onClose={() => {}} class="w-150 space-y-5">
  <svelte:fragment slot="heading">
    {$t('performanceWarning.heading')}
  </svelte:fragment>
  <svelte:fragment slot="body">
    <p>{$t('performanceWarning.content1')}</p>
    <p>{$t('performanceWarning.content2')}</p>
    <a
      class="inline-flex mr-auto gap-x-1 items-center text-link outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
      href=""
      target="_blank"
      rel="noopener">
      {$t('performanceWarning.troubleshoot')}
      <ExternalLinkIcon />
    </a>
    <div class="flex items-center justify-between">
      <StandardButton class="mr-auto" type="link"
        >{$t('performanceWarning.ignore')}</StandardButton>
      <div>
        <div class="flex gap-x-5">
          <StandardButton onClick={() => {}}>{$t('actions.cancel')}</StandardButton>
          <StandardButton type="primary" onClick={() => {}}
            >{$t('performanceWarning.nextButton')}</StandardButton>
        </div>
      </div>
    </div></svelte:fragment>
</StandardDialog>

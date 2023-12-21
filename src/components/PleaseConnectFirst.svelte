<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import { startConnectionProcess } from '../script/stores/connectDialogStore';
  import StandardButton from './StandardButton.svelte';
  import ConnectDialogContainer from './connection-prompt/ConnectDialogContainer.svelte';

  let connectDialogReference: ConnectDialogContainer;
</script>

<div>
  <ConnectDialogContainer bind:this={connectDialogReference} />

  <p class="text-center text-2xl bold m-auto">
    {$t('menu.trainer.notConnected1')}
  </p>
  <p class="text-center text-2xl bold m-auto">
    {$t('menu.trainer.notConnected2')}
  </p>
  <div class="text-center ml-auto mr-auto mb-2 mt-10" />
  <StandardButton type="primary" onClick={startConnectionProcess}
    >{$t('footer.connectButtonNotConnected')}</StandardButton>
</div>

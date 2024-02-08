<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import { DeviceRequestStates } from '../script/microbit-interfacing/MicrobitConnection';
  import Microbits from '../script/microbit-interfacing/Microbits';
  import { startConnectionProcess } from '../script/stores/connectDialogStore';
  import { state } from '../script/stores/uiStore';
  import { reconnect } from '../script/utils/reconnect';
  import StandardButton from './StandardButton.svelte';

  const handleInputConnect = async () => {
    if ($state.showReconnectHelp || Microbits.getInputMicrobit()) {
      reconnect();
    } else {
      startConnectionProcess();
    }
  };
</script>

<div>
  <p class="text-center text-2xl bold m-auto">
    {$t('menu.trainer.notConnected1')}
  </p>
  <p class="text-center text-2xl bold m-auto">
    {$t('menu.trainer.notConnected2')}
  </p>
  <div class="text-center ml-auto mr-auto mb-2 mt-10" />
  <StandardButton
    type="primary"
    disabled={$state.reconnectState.reconnecting}
    onClick={handleInputConnect}
    >{$t(
      $state.showReconnectHelp || Microbits.getInputMicrobit()
        ? 'actions.reconnect'
        : 'footer.connectButton',
    )}</StandardButton>
</div>

<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { areActionsAllowed } from '../script/stores/uiStore';
  import { addGesture } from '../script/stores/mlStore';
  import { t } from '../i18n';
  import StandardButton, { ButtonVariant } from './StandardButton.svelte';
  import AddIcon from 'virtual:icons/ri/add-line';
  import { logEvent } from '../script/utils/logging';

  export let type: ButtonVariant = 'primary';
  export let disabled: boolean = false;

  function onClick() {
    if (areActionsAllowed(false)) {
      addGesture('');
      logEvent({ type: 'Data', action: 'Add action' });
    }
  }
</script>

<StandardButton {type} {disabled} {onClick}
  ><div class="flex items-center gap-x-1">
    <AddIcon class="h-6 w-6" /><span>{$t('content.data.addAction')}</span>
  </div>
</StandardButton>

<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { areActionsAllowed } from '../script/stores/uiStore';
  import { addGesture } from '../script/stores/mlStore';
  import { t } from '../i18n';
  import StandardButton from './StandardButton.svelte';

  export let disabled: boolean = false;

  function onClick() {
    if (areActionsAllowed(false)) {
      addGesture('');
    }
  }
</script>

<StandardButton type="primary" {disabled} {onClick}
  >{$t('content.data.addAction')}</StandardButton>

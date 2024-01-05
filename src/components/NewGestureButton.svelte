<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { areActionsAllowed } from '../script/stores/uiStore';
  import { addGesture } from '../script/stores/mlStore';
  import { t } from '../i18n';
  import AddIcon from 'virtual:icons/ri/add-line';
  import IconButton from './IconButton.svelte';
  import StandardButton from './StandardButton.svelte';

  const defaultNewName = $t('content.data.classPlaceholderNewClass');

  function onClick() {
    if (areActionsAllowed(false)) {
      addGesture(defaultNewName);
    }
  }
</script>

<StandardButton type="primary" {onClick}>{$t('content.data.addAction')}</StandardButton>

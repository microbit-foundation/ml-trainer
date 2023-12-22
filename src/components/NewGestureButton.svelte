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

  const defaultNewName = $t('content.data.classPlaceholderNewClass');

  function onClick() {
    if (areActionsAllowed(false)) {
      addGesture(defaultNewName);
    }
  }
</script>

<div class="mt-5 mb-2">
  <IconButton ariaLabel={$t('content.data.addAction')} {onClick} rounded>
    <AddIcon
      class="h-20 w-20 text-primary flex justify-center items-center rounded-full p-2 border-4 border-primary m-1.5" />
  </IconButton>
</div>

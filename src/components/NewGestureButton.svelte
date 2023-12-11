<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { areActionsAllowed } from '../script/stores/uiStore';
  import { addGesture } from '../script/stores/mlStore';
  import { t } from '../i18n';

  const defaultNewName = $t('content.data.classPlaceholderNewClass');

  function onClick() {
    if (areActionsAllowed(false)) {
      addGesture(defaultNewName);
    }
  }
</script>

<button
  class="h-20 w-20 cursor-pointer flex justify-center items-center mt-5 mb-2
    p-2 border-5 border-primary rounded-full text-center text-primary"
  on:click={onClick}>
  <i class="fas fa-plus fa-2x text-black-500" />
</button>

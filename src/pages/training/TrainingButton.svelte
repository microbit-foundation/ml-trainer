<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
-->

<script lang="ts">
  import StandardButton, { ButtonVariant } from '../../components/StandardButton.svelte';
  import { t } from '../../i18n';
  import { gestures } from '../../script/stores/Stores';
  import { hasSufficientData, state } from '../../script/stores/uiStore';

  export let type: ButtonVariant = 'primary';
  export let onClick: () => void;

  // Workaround: hasSufficientData uses gestures but isn't reactive
  $: sufficientData = $gestures && hasSufficientData();
  $: trainingButtonDisabled = !sufficientData || $state.isTraining;
</script>

<StandardButton {onClick} {type} disabled={trainingButtonDisabled}
  >{$t('menu.trainer.trainModelButton')}
</StandardButton>

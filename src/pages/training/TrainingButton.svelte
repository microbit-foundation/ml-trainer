<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
-->

<script lang="ts">
  import { hasSufficientData, state } from '../../script/stores/uiStore';
  import StandardButton, { ButtonVariant } from '../../components/StandardButton.svelte';
  import { trainModel } from '../../script/ml';
  import { t } from '../../i18n';
  import { Paths, navigate } from '../../router/paths';
  import { gestures } from '../../script/stores/Stores';

  export let type: ButtonVariant = 'primary';
  export let action: 'navigate' | 'train' = 'train';

  $: trainButtonLabel = !$state.isPredicting
    ? 'menu.trainer.trainModelButton'
    : 'menu.trainer.trainNewModelButton';

  // Workaround: hasSufficientData uses gestures but isn't reactive
  $: sufficientData = $gestures && hasSufficientData();

  $: trainingButtonDisabled = !sufficientData || $state.isTraining;

  let trainingDialogOpen = false;

  const closeTrainingDialog = () => {
    trainingDialogOpen = false;
  };

  const startTraining = () => {
    closeTrainingDialog();
    trainModel();
  };

  const navitgateToTrainingPage = () => {
    navigate(Paths.TRAINING);
  };
</script>

<StandardButton
  onClick={action === 'navigate' ? navitgateToTrainingPage : startTraining}
  disabled={trainingButtonDisabled}
  {type}
  >{$t(trainButtonLabel)}
</StandardButton>

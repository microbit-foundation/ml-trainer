<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
-->

<script lang="ts">
  import { hasSufficientData, state } from '../../script/stores/uiStore';
  import StandardButton from '../../components/StandardButton.svelte';
  import { trainModel } from '../../script/ml';
  import { t } from '../../i18n';
  import StandardDialog from '../../components/dialogs/StandardDialog.svelte';
  import { Paths, navigate } from '../../router/paths';
  import { gestures } from '../../script/stores/mlStore';

  $: trainButtonLabel = !$state.isPredicting
    ? 'menu.trainer.trainModelButton'
    : 'menu.trainer.trainNewModelButton';

  $: sufficientData = hasSufficientData($gestures);

  $: trainingButtonDisabled = !sufficientData || $state.isTraining;

  let trainingDialogOpen = false;

  const closeTrainingDialog = () => {
    trainingDialogOpen = false;
  };

  const startTraining = async (): Promise<void> => {
    closeTrainingDialog();
    navigate(Paths.TRAINING);
    const shouldRedirect = await trainModel();
    if (shouldRedirect) {
      navigate(Paths.MODEL);
    }
  };
</script>

<StandardButton
  onClick={() => {
    trainingDialogOpen = true;
  }}
  disabled={trainingButtonDisabled}
  type="primary"
  >{$t(trainButtonLabel)}
</StandardButton>

<StandardDialog
  isOpen={trainingDialogOpen && !$state.isTraining}
  onClose={closeTrainingDialog}>
  <div class="w-150">
    <h1 class="text-xl font-bold mb-4">{$t('content.data.trainDialog.title')}</h1>
    <p>{$t('content.data.trainDialog.text')}</p>
    <div class="flex justify-end gap-3">
      <StandardButton onClick={closeTrainingDialog}
        >{$t('connectMB.backButton')}</StandardButton>
      <StandardButton type="primary" onClick={startTraining}
        >{$t('content.data.trainDialog.title')}</StandardButton>
    </div>
  </div>
</StandardDialog>

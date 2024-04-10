<script lang="ts">
  import { get } from 'svelte/store';
  import HtmlFormattedMessage, {
    linkWithProps,
  } from '../components/HtmlFormattedMessage.svelte';
  import StandardButton, { ButtonSize } from '../components/StandardButton.svelte';
  import StandardDialog from '../components/dialogs/StandardDialog.svelte';
  import { t } from '../i18n';
  import { Paths, navigate } from '../router/paths';
  import { gestures } from '../script/stores/Stores';
  import { startConnectionProcess } from '../script/stores/connectDialogStore';
  import { clearGestures } from '../script/stores/mlStore';
  import {
    compatibility,
    isCompatibilityWarningDialogOpen,
    state,
  } from '../script/stores/uiStore';

  export let buttonSize: ButtonSize = 'normal';

  $: hasExistingSession = $gestures.some(g => g.name || g.recordings.length);
  let showDataLossWarning = false;

  const { bluetooth, usb } = get(compatibility);
  const isIncompatible = !bluetooth && !usb;
  const openCompatibityWarningDialog = () => isCompatibilityWarningDialogOpen.set(true);

  const onClickStartNewSession = () => {
    if (isIncompatible) {
      openCompatibityWarningDialog();
      return;
    }
    if (hasExistingSession) {
      showDataLossWarning = true;
    } else {
      handleNewSession();
    }
  };

  const handleNewSession = () => {
    clearGestures();
    if ($state.isInputConnected) {
      navigate(Paths.DATA);
    } else {
      showDataLossWarning = false;
      startConnectionProcess();
    }
  };
</script>

<div class="{$$restProps.class || ''} flex items-center gap-x-5">
  {#if hasExistingSession}
    <StandardButton size={buttonSize} type="primary" onClick={() => navigate(Paths.DATA)}
      >{$t('footer.resume')}</StandardButton>
  {/if}
  <StandardButton
    size={buttonSize}
    type={hasExistingSession ? 'secondary' : 'primary'}
    onClick={onClickStartNewSession}>{$t('footer.start')}</StandardButton>
</div>

<StandardDialog
  isOpen={showDataLossWarning}
  onClose={() => (showDataLossWarning = false)}
  class="w-150 space-y-5">
  <svelte:fragment slot="heading">
    {$t('content.index.dataWarning.title')}
  </svelte:fragment>
  <svelte:fragment slot="body">
    <div slot="body" class="space-y-5">
      <p>{$t('content.index.dataWarning.subtitleOne')}</p>
      <p>
        <HtmlFormattedMessage
          id="content.index.dataWarning.subtitleTwo"
          options={{
            values: {
              link: linkWithProps({
                href:
                  'data:application/json;charset=utf-8,' +
                  encodeURIComponent(JSON.stringify(get(gestures), null, 2)),
                download: 'dataset.json',
              }),
            },
          }} />
      </p>
      <div class="flex justify-end items-center gap-x-5">
        <StandardButton onClick={handleNewSession} type="primary"
          >{$t('footer.start')}</StandardButton>
      </div>
    </div>
  </svelte:fragment>
</StandardDialog>

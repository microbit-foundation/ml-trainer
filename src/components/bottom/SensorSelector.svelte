<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { createSelect, CreateSelectProps, melt } from '@melt-ui/svelte';
  import { fade } from 'svelte/transition';
  import ArrowDownIcon from 'virtual:icons/ri/arrow-down-s-line';
  import { t } from '../../i18n';
  import {
    clearGestures,
    DataSource,
    persistentSettings,
  } from '../../script/stores/mlStore';
  import StandardDialog from '../dialogs/StandardDialog.svelte';
  import StandardButton from '../StandardButton.svelte';
  import { gestures } from '../../script/stores/Stores';

  interface Option {
    label: string;
    value: DataSource;
  }

  const options: Option[] = [
    { label: 'Accelerometer', value: DataSource.ACCELEROMETER },
    { label: 'Magnetometer', value: DataSource.MAGNETOMETER },
  ];

  let showWarningDialog = false;
  let changeSensorPromise: Promise<boolean> | undefined;
  let changeSensorRes: (value: boolean) => void;

  const closeWarningDialog = () => {
    showWarningDialog = false;
    changeSensorRes(false);
  };

  const changeSensorContinue = () => {
    clearGestures();
    changeSensorRes(true);
    showWarningDialog = false;
  };

  const warnUser = (): boolean => {
    const totalRecordings = $gestures
      .map(g => g.recordings.length)
      .reduce((a, b) => a + b, 0);
    return !!totalRecordings;
  };

  let programaticChange = false;
  const handleSelectedChanged: CreateSelectProps<DataSource>['onSelectedChange'] = ({
    curr,
    next,
  }) => {
    if (programaticChange) {
      programaticChange = false;
      return next;
    }
    if (curr?.value === next?.value) {
      return next;
    }
    if (!next) {
      return curr;
    }
    if (warnUser()) {
      programaticChange = true;
      changeSensorPromise = new Promise(res => {
        changeSensorRes = res;
      });
      showWarningDialog = true;
      changeSensorPromise.then(result => {
        if (result) {
          persistentSettings.update(obj => {
            obj.dataSource = next.value;
            return obj;
          });
          selected.set(next);
        } else {
          selected.set(curr);
        }
      });
    } else {
      persistentSettings.update(obj => {
        obj.dataSource = next.value;
        return obj;
      });
    }
    return next;
  };

  const getDefaultSelected = () => {
    const value = $persistentSettings.dataSource;
    const defaultOption = options.find(option => option.value === value);
    return defaultOption;
  };

  $: {
    programaticChange = true;
    selected.set(options.find(o => o.value === $persistentSettings.dataSource));
  }

  const {
    elements: { trigger, menu, option, label },
    states: { selectedLabel, open, selected },
  } = createSelect<DataSource>({
    forceVisible: true,
    positioning: {
      placement: 'bottom',
      fitViewport: true,
      sameWidth: true,
    },
    onSelectedChange: handleSelectedChanged,
    defaultSelected: getDefaultSelected(),
  });
</script>

<StandardDialog
  isOpen={showWarningDialog}
  onClose={closeWarningDialog}
  class="w-150 space-y-5">
  <svelte:fragment slot="heading">Warning</svelte:fragment>
  <svelte:fragment slot="body">
    <p>
      Changing the sensor will clear your existing actions and recordings. Are you sure
      you want to continue?
    </p>
    <div class="flex justify-end gap-x-5">
      <StandardButton onClick={closeWarningDialog}>{$t('actions.cancel')}</StandardButton>
      <StandardButton type="primary" onClick={changeSensorContinue}>Yes</StandardButton>
    </div>
  </svelte:fragment>
</StandardDialog>

<div class="flex flex-col gap-1">
  <label class="sr-only" use:melt={$label}>Sensor</label>
  <button
    class="flex h-10 min-w-[170px] items-center justify-between rounded-lg bg-white px-3 py-2
  shadow"
    use:melt={$trigger}
    aria-label="Sensor">
    {$selectedLabel || 'Select a sensor'}
    <ArrowDownIcon class="size-5" />
  </button>
  {#if $open}
    <div
      class="z-10 flex flex-col
    overflow-y-auto rounded-lg bg-white p-1
    shadow focus:!ring-0"
      use:melt={$menu}
      transition:fade={{ duration: 150 }}>
      {#each options as item}
        <div
          class="relative cursor-pointer rounded-lg py-1 px-2
              hover:bg-gray-100 focus:z-10
              data-[highlighted]:bg-gray-200"
          use:melt={$option({ value: item.value, label: item.label })}>
          {item.label}
        </div>
      {/each}
    </div>
  {/if}
</div>

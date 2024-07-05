<!--
  (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import * as tfvis from '@tensorflow/tfjs-vis';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { makeInputs, ModelSettings } from '../script/ml';
  import { GestureData, settings } from '../script/stores/mlStore';
  import { gestures } from '../script/stores/Stores';
  import Fingerprint from './Fingerprint.svelte';

  export let gesture: GestureData;
  let surface: undefined | tfvis.Drawable;

  const filters = Array.from(get(settings).includedFilters);

  const mlSettings = get(settings);
  const modelSettings: ModelSettings = {
    axes: mlSettings.includedAxes,
    filters: mlSettings.includedFilters,
  };

  const filtersLabels: string[] = [];
  filters.forEach(filter => {
    filtersLabels.push(`${filter}-x`, `${filter}-y`, `${filter}-z`);
  });

  const getFingerprintData = () => {
    const inputData: number[][] = [];
    gesture.recordings.forEach(r => {
      inputData.push(makeInputs(modelSettings, r.data, 'computeNormalizedOutput'));
    });
    const averagedData: number[] = [];
    for (let i = 0; i < filters.length * 3; i++) {
      let filterValues: number[] = [];
      inputData.forEach(d => {
        filterValues.push(d[i]);
      });
      averagedData.push(filterValues.reduce((a, b) => a + b, 0) / filterValues.length);
    }
    return averagedData;
  };
</script>

<Fingerprint
  gestureName={`${gesture.name} average`}
  recordingData={undefined}
  averagedData={getFingerprintData()}
  height="full" />

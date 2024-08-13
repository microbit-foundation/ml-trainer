<!--
  (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import {
    ArcElement,
    Chart,
    DoughnutController,
    LineElement,
    PointElement,
    registerables,
  } from 'chart.js';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { makeInputs, ModelSettings } from '../script/ml';
  import { RecordingData, settings } from '../script/stores/mlStore';
  import { calculateColor } from '../script/utils/gradient-calculator';

  export let recordingData: RecordingData | undefined;
  export let gestureName: string;

  const mlSettings = get(settings);
  const modelSettings: ModelSettings = {
    axes: mlSettings.includedAxes,
    filters: mlSettings.includedFilters,
  };

  const filtersLabels: string[] = [];
  modelSettings.filters.forEach(filter => {
    filtersLabels.push(`${filter}-x`, `${filter}-y`, `${filter}-z`);
  });

  const getProcessedData = () =>
    recordingData
      ? makeInputs(modelSettings, recordingData.data, 'computeNormalizedOutput')
      : [];

  const data = getProcessedData();

  let canvas: HTMLCanvasElement;
  onMount(() => {
    Chart.unregister(...registerables);
    Chart.register([DoughnutController, ArcElement, PointElement, LineElement]);
    const chart = new Chart(canvas.getContext('2d') ?? new HTMLCanvasElement(), {
      type: 'doughnut',
      data: {
        labels: filtersLabels,
        datasets: [
          {
            label: `${gestureName} recording`,
            data: [...Array(24).keys()].map(_v => 1),
            backgroundColor: data.map(v => calculateColor(v)),
          },
        ],
      },
      options: {
        events: [],
        animation: false,
        responsive: false,
        maintainAspectRatio: false,
      },
    });
    return () => {
      chart.destroy();
    };
  });
</script>

<canvas class="w-100px h-100px" bind:this={canvas} />

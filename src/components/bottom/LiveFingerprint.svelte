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
  import * as tfvis from '@tensorflow/tfjs-vis';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { makeInputs, ModelSettings } from '../../script/ml';
  import { getPrevData, settings } from '../../script/stores/mlStore';
  import { state } from '../../script/stores/uiStore';
  import { calculateColor } from '../../script/utils/gradient-calculator';

  let surface: undefined | tfvis.Drawable;
  $: prevData = getPrevData();
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

  const disconnectedData = new Array(filtersLabels.length).fill(0);

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
            label: `Live`,
            data: [...Array(24).keys()].map(_v => 1),
            backgroundColor: disconnectedData.map(v => calculateColor(v)),
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

    const interval = setInterval(() => {
      prevData = getPrevData();
      const currentGestureData = prevData
        ? makeInputs(modelSettings, prevData, 'computeNormalizedOutput')
        : disconnectedData;
      chart.data.datasets = [
        {
          label: `Live`,
          data: [...Array(24).keys()].map(_v => 1),
          backgroundColor: currentGestureData.map(v => calculateColor(v)),
        },
      ];
      console.log(chart);
      chart.update();
      console.log('render');
    }, 100);
    return () => {
      clearInterval(interval);
      chart?.destroy();
    };
  });
</script>

<div class="h-160px w-160px flex justify-center items-center">
  <canvas class="w-140px h-140px" bind:this={canvas} />
</div>

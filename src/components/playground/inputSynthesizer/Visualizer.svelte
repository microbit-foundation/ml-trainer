<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { SmoothieChart, TimeSeries } from 'smoothie';
  import { Unsubscriber } from 'svelte/store';
  import { liveData } from '../../../script/stores/Stores';
  import { onMount } from 'svelte';

  // Updates width to ensure that the canvas fills the whole screen
  export let width: number;

  var canvas: HTMLCanvasElement | undefined = undefined;
  var chart: SmoothieChart | undefined;
  let lineX = new TimeSeries();
  let lineY = new TimeSeries();
  let lineZ = new TimeSeries();
  const lineWidth = 2;

  // On mount draw smoothieChart
  onMount(() => {
    chart = new SmoothieChart({
      maxValue: 2.3,
      minValue: -2,
      millisPerPixel: 7,
      grid: {
        fillStyle: '#ffffff00',
        strokeStyle: 'rgba(48,48,48,0.20)',
        millisPerLine: 3000,
        borderVisible: false,
      },
      interpolation: 'linear',
    });

    chart.addTimeSeries(lineX, { lineWidth, strokeStyle: '#f9808e' });
    chart.addTimeSeries(lineY, { lineWidth, strokeStyle: '#80f98e' });
    chart.addTimeSeries(lineZ, { lineWidth, strokeStyle: '#808ef9' });
    chart.streamTo(<HTMLCanvasElement>canvas, 0);
    chart.start();
  });

  // When state changes, update the state of the canvas

  let unsubscribeFromData: Unsubscriber | undefined;

  // If state is connected. Start updating the graph whenever there is new data
  // From the Micro:Bit
  unsubscribeFromData = liveData.subscribe(data => {
    const t = new Date().getTime();
    lineX.append(t, data.accelX, false);
    lineY.append(t, data.accelY, false);
    lineZ.append(t, data.accelZ, false);
  });
</script>

<main class="flex">
  <canvas bind:this={canvas} height={160} id="synthetic-visualizer" width={width - 30} />
</main>

<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { SmoothieChart, TimeSeries } from 'smoothie';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { currentData, settings } from '../../script/stores/mlStore';
  import { state } from '../../script/stores/uiStore';
  import DimensionLabels from './DimensionLabels.svelte';
  import { graphRange } from './graph-utils';

  // Updates width to ensure that the canvas fills the whole screen
  export let width: number;

  var canvas: HTMLCanvasElement | undefined = undefined;
  var chart: SmoothieChart | undefined;
  let lineX = new TimeSeries();
  let lineY = new TimeSeries();
  let lineZ = new TimeSeries();
  let recordLines = new TimeSeries();
  const lineWidth = 2;

  // On mount draw smoothieChart
  onMount(() => {
    chart = new SmoothieChart({
      maxValue: graphRange.max,
      minValue: graphRange.min,
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
    chart.addTimeSeries(recordLines, {
      lineWidth: 3,
      strokeStyle: '#4040ff44',
      fillStyle: '#0000ff07',
    });
    chart.streamTo(<HTMLCanvasElement>canvas, 0);
    chart.render();
    return () => chart?.stop();
  });

  $: {
    if ($state.isInputConnected) {
      chart?.start();
    } else {
      chart?.stop();
    }
  }

  // Draw on graph to display that users are recording
  // The jagged edges problem is caused by repeating the recordingStarted function.
  // We will simply block the recording from starting, while it's recording
  let blockRecordingStart = false;
  $: recordingStarted($state.isRecording || $state.isTesting);

  // Function to clearly diplay the area in which users are recording
  function recordingStarted(isRecording: boolean): void {
    if (!isRecording || blockRecordingStart) {
      return;
    }

    // Set start line
    recordLines.append(new Date().getTime() - 1, graphRange.min, false);
    recordLines.append(new Date().getTime(), graphRange.max, false);

    // Wait a second and set end line
    blockRecordingStart = true;
    setTimeout(() => {
      recordLines.append(new Date().getTime() - 1, graphRange.max, false);
      recordLines.append(new Date().getTime(), graphRange.min, false);
      blockRecordingStart = false;
    }, get(settings).duration);
  }

  $: {
    const t = new Date().getTime();
    lineX.append(t, $currentData.x, false);
    lineY.append(t, $currentData.y, false);
    lineZ.append(t, $currentData.z, false);
  }
</script>

<div class="flex overflow-hidden">
  <canvas bind:this={canvas} height={160} id="smoothie-chart" width={width - 30} />
  <DimensionLabels />
</div>

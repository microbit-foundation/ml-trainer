<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { SmoothieChart, TimeSeries } from 'smoothie';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import {
    currentData,
    settings,
    bestPrediction,
    GestureData,
  } from '../../script/stores/mlStore';
  import { state } from '../../script/stores/uiStore';
  import DimensionLabels from './DimensionLabels.svelte';
  import SimpleLedMatrix from '../output/SimpleLedMatrix.svelte';
  import { gestures } from '../../script/stores/Stores';

  // Updates width to ensure that the canvas fills the whole screen
  export let width: number;

  var canvas: HTMLCanvasElement | undefined = undefined;
  var chart: SmoothieChart | undefined;
  let lineX = new TimeSeries();
  let lineY = new TimeSeries();
  let lineZ = new TimeSeries();
  let recordLines = new TimeSeries();
  const lineWidth = 2;

  // Create time series for each gesture
  const gestureLines: Record<string, TimeSeries> = gestures
    .getGestures()
    .reduce((acc, g) => ({ ...acc, [g.getName()]: new TimeSeries() }), {});

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
    chart.addTimeSeries(recordLines, {
      lineWidth: 3,
      strokeStyle: '#4040ff44',
      fillStyle: '#0000ff07',
    });
    for (const [, line] of Object.entries(gestureLines)) {
      chart.addTimeSeries(line, {
        lineWidth: 3,
        strokeStyle: '#4040ff44',
        fillStyle: '#0000ff07',
      });
    }
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
    markPeriodStart(recordLines);

    // Wait a second and set end line
    blockRecordingStart = true;
    setTimeout(() => {
      markPeriodEnd(recordLines);
      blockRecordingStart = false;
    }, get(settings).duration);
  }

  const markPeriodStart = (lines: TimeSeries) => {
    lines.append(new Date().getTime() - 1, -2, false);
    lines.append(new Date().getTime(), 2.3, false);
  };

  const markPeriodEnd = (lines: TimeSeries) => {
    lines.append(new Date().getTime() - 1, 2.3, false);
    lines.append(new Date().getTime(), -2, false);
  };

  // Draw on graph to display that predicted periods
  const markGestureLines = (
    lastGestureName: undefined | string,
    currGestureName: undefined | string,
  ) => {
    if (lastGestureName === currGestureName) {
      return;
    }
    if (!lastGestureName && currGestureName) {
      markPeriodStart(gestureLines[currGestureName]);
    }
    if (lastGestureName && !currGestureName) {
      markPeriodEnd(gestureLines[lastGestureName]);
    }
    if (lastGestureName && currGestureName) {
      markPeriodEnd(gestureLines[lastGestureName]);
      markPeriodStart(gestureLines[currGestureName]);
    }
  };

  let lastPrediction: GestureData | undefined = undefined;
  let ledMatrix: boolean[] | undefined;
  $: {
    markGestureLines(lastPrediction?.name, $bestPrediction?.name);
    lastPrediction = $bestPrediction;

    // Display predicted gesture led matrix
    ledMatrix = $bestPrediction ? $bestPrediction.matrix : undefined;
  }

  $: {
    const t = new Date().getTime();
    lineX.append(t, $currentData.x, false);
    lineY.append(t, $currentData.y, false);
    lineZ.append(t, $currentData.z, false);
  }
</script>

<div class="flex overflow-hidden">
  <canvas bind:this={canvas} height={160} id="smoothie-chart" width={width - 220} />
  <DimensionLabels />
  <div class="flex flex-col justify-center p-5">
    <SimpleLedMatrix dimension={30} matrix={ledMatrix} />
  </div>
</div>

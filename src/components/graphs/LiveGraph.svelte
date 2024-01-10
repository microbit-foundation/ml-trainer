<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { state } from '../../script/stores/uiStore';
  import { currentData, settings } from '../../script/stores/mlStore';
  import { onMount } from 'svelte';
  import { get, type Unsubscriber } from 'svelte/store';
  import { SmoothieChart, TimeSeries } from 'smoothie';
  import DimensionLabels from './DimensionLabels.svelte';

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
    chart.streamTo(<HTMLCanvasElement>canvas, 0);
    chart.stop();
  });

  // Start and stop chart when microbit connect/disconnect
  $: {
    if (chart !== undefined) {
      if ($state.isInputReady) {
        if (!$state.isTraining) {
          chart.start();
        } else {
          chart.stop();
        }
      } else {
        chart.stop();
      }
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
    recordLines.append(new Date().getTime() - 1, -2, false);
    recordLines.append(new Date().getTime(), 2.3, false);

    // Wait a second and set end line
    blockRecordingStart = true;
    setTimeout(() => {
      recordLines.append(new Date().getTime() - 1, 2.3, false);
      recordLines.append(new Date().getTime(), -2, false);
      blockRecordingStart = false;
    }, get(settings).duration);
  }

  // When state changes, update the state of the canvas
  $: {
    const isConnected = $state.isInputConnected;
    updateCanvas(isConnected);
  }

  let unsubscribeFromData: Unsubscriber | undefined;

  // If state is connected. Start updating the graph whenever there is new data
  // From the Micro:Bit
  function updateCanvas(isConnected: boolean) {
    // TODO: Clean this
    if (isConnected) {
      unsubscribeFromData = currentData.subscribe(data => {
        const t = new Date().getTime();
        lineX.append(t, data.x, false);
        lineY.append(t, data.y, false);
        lineZ.append(t, data.z, false);
      });

      // Else if we're currently subscribed to data. Unsubscribe.
      // This means that the micro:bit has been disconnected
    } else if (unsubscribeFromData !== undefined) {
      unsubscribeFromData();
      unsubscribeFromData = undefined;
    }
  }
</script>

<main class="flex overflow-hidden">
  <canvas bind:this={canvas} height={160} id="smoothie-chart" width={width - 30} />
  <DimensionLabels />
</main>

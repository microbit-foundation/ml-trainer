<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->
<script lang="ts">
  import Gesture from '../../script/domain/Gesture';
  import OutputGestureStack from './OutputGestureStack.svelte';
  import OutputGestureTile from './OutputGestureTile.svelte';
  import { state } from '../../script/stores/uiStore';
  import Microbits, { HexOrigin } from '../../script/microbit-interfacing/Microbits';

  export let gesture: Gesture;
  let wasTriggered = false;

  $: {
    let isConfident = $gesture.confidence.isConfident;
    if (isConfident) {
      if (!wasTriggered) {
        wasTurnedOn();
      }
      wasTriggered = true;
    } else {
      if (wasTriggered) {
        wasTurnedOff();
      }
      wasTriggered = false;
    }
  }
  const wasTurnedOff = () => {};
  const wasTurnedOn = () => {
    if ($state.outputOrigin === HexOrigin.MAKECODE) {
      Microbits.getOutputMicrobit().sendToOutputUart('g', $gesture.name);
      return;
    }
  };

  export let variant: 'stack' | 'tile';
  export let onUserInteraction: () => void = () => {
    return;
  };
</script>

{#if variant === 'stack'}
  <OutputGestureStack {gesture} {onUserInteraction} />
{/if}

{#if variant === 'tile'}
  <OutputGestureTile {gesture} />
{/if}

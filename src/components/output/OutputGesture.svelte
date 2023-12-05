<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->
<script lang="ts">
  import CookieManager from '../../script/CookieManager';
  import Gestures from '../../script/Gestures';
  import ConnectionBehaviours from '../../script/connection-behaviours/ConnectionBehaviours';
  import Microbits from '../../script/microbit-interfacing/Microbits';
  import { GestureData } from '../../script/stores/mlStore';
  import { state } from '../../script/stores/uiStore';
  import OutputGestureStack from './OutputGestureStack.svelte';
  import OutputGestureTile from './OutputGestureTile.svelte';

  export let gesture: GestureData;
  let wasTriggered = false;

  const confidence = Gestures.getConfidence(gesture.ID);
  const requiredConfidence = Gestures.getRequiredConfidence(gesture.ID);

  $: currentConfidence = $state.isInputReady ? $confidence : 0;

  $: {
    console.log($requiredConfidence);
  }

  $: {
    let isConfident = $requiredConfidence <= currentConfidence;
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
    if (Microbits.isOutputMakecode()) {
      ConnectionBehaviours.getOutputBehaviour().onGestureRecognized(
        gesture.ID,
        gesture.name,
      );
      return;
    }
  };

  export let variant: 'stack' | 'tile';
</script>

{#if variant === 'stack'}
  <OutputGestureStack {gesture} />
{/if}

{#if variant === 'tile'}
  <OutputGestureTile {confidence} {requiredConfidence} {gesture} />
{/if}

<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import {
    connectionStateMachine,
    ConnectionStates,
  } from '../../script/stores/connectDialogStore';
  import StandardDialog from '../dialogs/StandardDialog.svelte';
  import ConnectionStateToComponent from './ConnectionStateToComponent.svelte';

  let state = ConnectionStates.WHAT_YOU_WILL_NEED_2_MICROBITS;
  $: s = connectionStateMachine[state];

  const onSwitch =
    s.on?.switch &&
    (() => {
      state = s.on?.switch || state;
    });

  const onSkip =
    s.on?.skip &&
    (() => {
      state = s.on?.skip || state;
    });
  const onNext = () => {
    state = s.on?.next || state;
  };
  const onBack = () => {
    state = s.on?.back || state;
  };
</script>

<div>
  <StandardDialog
    isOpen={!s.on}
    onClose={() => {
      state = ConnectionStates.CONNECTION_UNFINISHED;
    }}>
    <ConnectionStateToComponent {state} {onSwitch} {onNext} {onBack} {onSkip} />
  </StandardDialog>
</div>

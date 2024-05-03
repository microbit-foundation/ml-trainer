<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../i18n';
  import StandardDialog from './StandardDialog.svelte';
  import StandardButton from '../StandardButton.svelte';
  import { isCompatibilityWarningDialogOpen } from '../../script/stores/uiStore';

  const onClose = () => {
    $isCompatibilityWarningDialogOpen = false;
  };
</script>

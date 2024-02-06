<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import DialogHeading from '../../DialogHeading.svelte';
  import { t } from '../../../i18n';
  import LoadingSpinner from '../../LoadingSpinner.svelte';
</script>

<div class="w-175">
  <DialogHeading>
    {$t('connectMB.radio.heading')}
  </DialogHeading>
  <div class="flex flex-col gap-5 justify-center items-center py-3">
    <p>{$t('connectMB.connecting')}</p>
    <LoadingSpinner />
  </div>
</div>

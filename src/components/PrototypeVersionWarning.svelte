<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../i18n';
  import WarningIcon from 'virtual:icons/ri/error-warning-line';
</script>

<div
  class="bg-red-600 text-white px-10 py-2 space-x-5 flex items-center sticky top-16 z-5">
  <WarningIcon class="text-white text-2xl" />
  <p class="font-bold">{$t('prototype.warning')}</p>
</div>

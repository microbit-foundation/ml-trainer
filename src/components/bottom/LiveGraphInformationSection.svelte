<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../i18n';
  import Information from '../information/Information.svelte';
</script>

<div class="flex flex-row">
  <div>
    <Information
      titleText={$t('footer.helpHeader')}
      bodyText={$t('footer.helpContent')}
      isLightTheme={false}
      boxOffset={{ x: 25, y: -150 }} />
  </div>
  <i class="fas fa-bolt ml-8 mr-2 flex items-center" />
  <p class="float-left font-bold mr-3">LIVE</p>
</div>

<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script>
  import { t } from '../i18n';
  import { appName } from '../script/environment';
</script>

<div class="h-screen w-screen bg-secondary flex flex-col justify-center items-center">
  <p class="mb-4 text-secondarytext font-extrabold text-5xl">
    {appName}
  </p>
  <p class="text-primarytext text-center mb-2">
    {$t('compatibility.platform.notSupported')}
  </p>
  <p class="text-primarytext">{$t('compatibility.platform.notSupported.joinDesktop')}</p>
</div>

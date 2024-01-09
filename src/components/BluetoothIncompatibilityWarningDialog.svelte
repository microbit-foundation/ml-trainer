<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { WebBluetoothCompatibility } from '../script/compatibility/CompatibilityList';
  import { t } from '../i18n';
  import StandardDialog from './dialogs/StandardDialog.svelte';
  import { isBluetoothWarningDialogOpen } from '../script/stores/uiStore';
  import DialogHeading from './DialogHeading.svelte';
</script>

<StandardDialog
  isOpen={$isBluetoothWarningDialogOpen}
  onClose={() => {
    $isBluetoothWarningDialogOpen = false;
  }}>
  <div class="w-175">
    <DialogHeading>
      {$t('popup.compatibility.bluetooth.header')}
    </DialogHeading>
    <div class="space-y-5">
      <div class="space-y-2">
        <p>{$t('popup.compatibility.bluetooth.explain')}</p>
        <p>{$t('popup.compatibility.bluetooth.advice')}</p>
      </div>
      <table class="m-auto">
        <thead>
          <tr class="font-bold">
            <td>Browser</td>
            <td class="text-right">Version</td>
          </tr>
        </thead>
        <tbody>
          {#each WebBluetoothCompatibility.getSupportedBrowsers() as browser}
            <tr class="border-solid border-b-1">
              <td>{browser.browser}</td>
              <td class="text-right">v{String(browser.version)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</StandardDialog>

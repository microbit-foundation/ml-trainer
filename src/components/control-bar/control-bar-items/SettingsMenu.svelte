<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { createMenu } from 'svelte-headlessui';
  import SettingsIcon from 'virtual:icons/ri/settings-2-line';
  import GlobeIcon from 'virtual:icons/ri/global-line';
  import MenuTransition from '../../MenuTransition.svelte';
  import LanguageDialog from './LanguageDialog.svelte';
  import { t } from '../../../i18n';
  import MenuItems from './MenuItems.svelte';
  import MenuItem from './MenuItem.svelte';

  const menu = createMenu({ label: $t('settings.label') });
  let isLanguageDialogOpen = false;
  const onSelect = (event: Event) => {
    isLanguageDialogOpen = true;
    menu.set({ selected: null });
  };
</script>

<div>
  <LanguageDialog
    isOpen={isLanguageDialogOpen}
    onClose={() => {
      isLanguageDialogOpen = false;
    }} />
  <div class="relative inline-block">
    <button
      use:menu.button
      on:select={onSelect}
      class="inline-flex rounded-full text-xl p-2">
      <SettingsIcon />
    </button>
    <MenuTransition show={$menu.expanded}>
      <MenuItems {menu}>
        <div class="py-2">
          <MenuItem {menu} value="settings">
            <GlobeIcon />
            {$t('languageDialog.title')}
          </MenuItem>
        </div>
      </MenuItems>
    </MenuTransition>
  </div>
</div>

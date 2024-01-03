/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { SvelteComponent } from 'svelte';
import { writable } from 'svelte/store';
import GestureMenu from '../../menus/DataMenu.svelte';
import NewTrainerMenu from '../../menus/TrainingMenu.svelte';
import NewModelMenu from '../../menus/ModelMenu.svelte';
import { Paths, PathType } from '../../router/paths';

export type MenuProperties = {
  title: string;
  navigationPath: PathType;
  content: typeof SvelteComponent<any>;
};

class Menus {
  private static menuStore = writable<MenuProperties[]>([
    {
      title: 'menu.data.helpHeading',
      content: GestureMenu,
      navigationPath: Paths.DATA,
    },
    {
      title: 'menu.trainer.helpHeading',
      content: NewTrainerMenu,
      navigationPath: Paths.TRAINING,
    },
    {
      title: 'menu.model.helpHeading',
      content: NewModelMenu,
      navigationPath: Paths.MODEL,
    },
  ]);

  public static getMenuStore() {
    return this.menuStore;
  }
}

export default Menus;

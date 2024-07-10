/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { writable } from 'svelte/store';
import { Paths, PathType } from '../../router/paths';

export type MenuProperties = {
  title: string;
  navigationPath: PathType;
};

class Menus {
  private static menuStore = writable<MenuProperties[]>([
    {
      title: 'menu.data.helpHeading',
      navigationPath: Paths.DATA,
    },
    {
      title: '1.5. Process data',
      navigationPath: Paths.PROCESS,
    },
    {
      title: 'menu.trainer.helpHeading',
      navigationPath: Paths.TRAINING,
    },
    {
      title: 'menu.model.helpHeading',
      navigationPath: Paths.MODEL,
    },
    {
      title: 'menu.output.helpHeading',
      navigationPath: Paths.OUTPUT,
    },
  ]);

  public static getMenuStore() {
    return this.menuStore;
  }
}

export default Menus;

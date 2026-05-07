/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (data: any) => void;

/**
 * Simple typed event target for mock connection classes.
 */
export class MockEventTarget {
  private listeners = new Map<string, Set<Listener>>();

  addEventListener(type: string, listener: Listener): void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener);
  }

  removeEventListener(type: string, listener: Listener): void {
    const set = this.listeners.get(type);
    if (set?.delete(listener) && set.size === 0) {
      this.listeners.delete(type);
    }
  }

  protected dispatchEvent(type: string, data?: unknown): void {
    const set = this.listeners.get(type);
    if (set) {
      for (const listener of set) {
        listener(data);
      }
    }
  }
}

interface QueueEntry<T> {
  action: () => Promise<T>;
  resolve: (v: T) => void;
  reject: (r: unknown) => void;
}

interface Options {
  /**
   * If we should clear the queue return a function to create errors to reject all promises.
   * Otherwise return undefined. Called before processing each entry.
   */
  abortCheck?: () => (() => Error) | undefined;
}

export class PromiseQueue {
  private busy: boolean = false;
  private entries: QueueEntry<any>[] = [];
  private abortCheck: () => (() => Error) | undefined;

  constructor(options: Options = {}) {
    this.abortCheck = options.abortCheck ?? (() => undefined);
  }

  /**
   * Queue an action.
   *
   * @param action Async action to perform.
   * @returns A promise that resolves when all prior added actions and this action have been performed.
   */
  public add<T>(action: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const entry: QueueEntry<T> = {
        resolve,
        reject,
        action,
      };
      this.entries.push(entry);
      if (!this.busy) {
        void this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    const rejection = this.abortCheck();
    if (rejection) {
      this.clear(rejection);
      return;
    }
    const entry = this.entries.shift();
    if (!entry) {
      return;
    }
    this.busy = true;
    try {
      entry.resolve(await entry.action());
    } catch (e) {
      entry.reject(e);
    }
    this.busy = false;
    return this.processQueue();
  }

  /**
   * Skips any queued actions that aren't in progress and rejects their
   * promises with errors created with the supplied function.
   */
  public clear(rejection: () => Error) {
    const entries = this.entries;
    this.entries = [];
    entries.forEach((e) => {
      e.reject(rejection());
    });
  }
}

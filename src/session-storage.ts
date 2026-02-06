class ProjectSessionStorage {
  key = "projectId";
  constructor() {}

  private useSessionStorage() {
    try {
      return window.sessionStorage;
    } catch (e) {
      // Handle possible SecurityError, absent window.
      return undefined;
    }
  }

  setProjectId(id: string) {
    this.useSessionStorage()?.setItem(this.key, id);
  }

  getProjectId(): string | null | undefined {
    const sessionStorage = this.useSessionStorage();
    if (sessionStorage) {
      return sessionStorage.getItem(this.key);
    }
  }

  clearProjectId() {
    this.useSessionStorage()?.removeItem(this.key);
  }
}

export const projectSessionStorage = new ProjectSessionStorage();

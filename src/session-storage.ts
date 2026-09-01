class ProjectSessionStorage {
  key = "projectId";
  constructor() {}

  private getSessionStorage() {
    try {
      return window.sessionStorage;
    } catch {
      // Handle possible SecurityError, absent window.
      return undefined;
    }
  }

  setProjectId(id: string) {
    this.getSessionStorage()?.setItem(this.key, id);
  }

  getProjectId(): string | null | undefined {
    const sessionStorage = this.getSessionStorage();
    if (sessionStorage) {
      return sessionStorage.getItem(this.key);
    }
  }

  clearProjectId() {
    this.getSessionStorage()?.removeItem(this.key);
  }
}

export const projectSessionStorage = new ProjectSessionStorage();

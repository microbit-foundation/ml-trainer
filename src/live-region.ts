export interface LiveRegionOptions {
  id: string;
  "aria-live": "polite" | "assertive";
  role: "status" | "alert" | "log";
  "aria-atomic": React.AriaAttributes["aria-atomic"];
}

const defaultOptions: LiveRegionOptions = {
  id: "live-region",
  "aria-live": "polite",
  role: "status",
  "aria-atomic": true,
};

export class LiveRegion {
  region: HTMLElement | null;
  options: Required<LiveRegionOptions>;

  constructor(options: Partial<LiveRegionOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
    this.region = null;
  }

  setupLiveRegion(parentNode: HTMLElement) {
    if (this.region) {
      // Region already setup.
      return;
    }
    this.region = document.createElement("div");
    setup(this.region, this.options);
    parentNode.appendChild(this.region);
  }

  speak(message: string) {
    this.clear();
    if (this.region) {
      this.region.innerText = message;
    }
  }

  destroy() {
    if (this.region) {
      this.region.parentNode?.removeChild(this.region);
    }
  }

  clear() {
    if (this.region) {
      this.region.innerText = "";
    }
  }
}

const setup = (region: HTMLElement, options: LiveRegionOptions) => {
  region.id = options.id;
  region.setAttribute("aria-live", options["aria-live"]);
  region.setAttribute("role", options.role);
  region.setAttribute("aria-atomic", String(options["aria-atomic"]));
  Object.assign(region.style, {
    border: "0px",
    clip: "rect(0px, 0px, 0px, 0px)",
    height: "1px",
    width: "1px",
    margin: "-1px",
    padding: "0px",
    overflow: "hidden",
    whiteSpace: "nowrap",
    position: "absolute",
  });
};

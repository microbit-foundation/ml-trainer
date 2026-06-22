import type { CapacitorConfig } from "@capacitor/cli";
import { existsSync, readFileSync } from "fs";
import { networkInterfaces } from "os";
import { resolve } from "path";

const localBrandPath = resolve(__dirname, "brand.local.json");
const themeBrandPath = resolve(
  __dirname,
  "node_modules/@microbit-foundation/ml-trainer-microbit/native/brand.json"
);
const brandPath = existsSync(localBrandPath)
  ? localBrandPath
  : existsSync(themeBrandPath)
    ? themeBrandPath
    : resolve(__dirname, "bin/stubs/brand.json");
const brand = JSON.parse(readFileSync(brandPath, "utf8")) as {
  appId: string;
  appName: string;
};

const config: CapacitorConfig = {
  appId: brand.appId,
  appName: brand.appName,
  webDir: "dist",
  plugins: {
    Keyboard: {
      // Prevent iOS from resizing the WebView when the keyboard opens.
      // We handle scroll-into-view manually via useKeyboardHeight.
      resize: "none",
    },
  },
};

function getIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  throw new Error("Could not guess Vite server IP");
}

if (process.env.CAP_LOCAL_DEV) {
  config.server = { url: `http://${getIP()}:5173`, cleartext: true };
}

export default config;

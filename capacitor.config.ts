import type { CapacitorConfig } from "@capacitor/cli";
import { networkInterfaces } from "os";

const config: CapacitorConfig = {
  appId: "org.microbit.createai",
  appName: "micro:bit CreateAI",
  webDir: "dist",
  android: {
    adjustMarginsForEdgeToEdge: "disable",
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

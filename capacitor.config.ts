import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.microbit.createai',
  appName: 'micro:bit CreateAI',
  webDir: 'dist',
  android: {
    adjustMarginsForEdgeToEdge: 'disable'
  }
};

export default config;

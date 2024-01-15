/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import Bowser from 'bowser';
import { nonAllowedPlatforms } from './CompatibilityList';
import Environment from '../Environment';

export type CompatibilityStatus = {
  bluetooth: boolean;
  usb: boolean;
  platformAllowed: boolean;
  webGL: boolean;
};

export function checkCompatibility(): CompatibilityStatus {
  if (localStorage.getItem('isTesting')) {
    return { bluetooth: true, usb: true, platformAllowed: true, webGL: true };
  }

  const canvas = document.createElement('canvas');
  // TODO: Handle webgl1 vs webgl2 in relation to threejs
  const webGL = canvas.getContext('webgl') instanceof WebGLRenderingContext;

  const browser = Bowser.getParser(window.navigator.userAgent);
  const browserVersion = browser.getBrowserVersion();
  if (!browserVersion) {
    return { bluetooth: false, usb: false, platformAllowed: true, webGL: webGL };
  }

  let platformType = browser.getPlatform().type;

  // If platform won't report what it is, just assume desktop (ChromeOS doesnt report it)
  if (platformType == undefined) {
    platformType = 'desktop';
  }
  const isPlatformAllowed =
    Environment.isInDevelopment || !nonAllowedPlatforms.includes(platformType);

  return {
    bluetooth: !!navigator.bluetooth,
    usb: !!navigator.usb,
    platformAllowed: isPlatformAllowed,
    webGL: webGL,
  };
}

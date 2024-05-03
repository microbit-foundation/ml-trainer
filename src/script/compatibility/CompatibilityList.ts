/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

/// <reference types="web-bluetooth" />
import Bowser from 'bowser';

// REFERENCES FOR VALUES = https://github.com/lancedikson/bowser/blob/master/src/constants.js

export interface SemVer {
  majorVersion: number | string;
  minorVersion: number | string;

  isGreaterThan(version: SemVer): boolean;

  isLessThan(version: SemVer): boolean;

  isEqualTo(version: SemVer): boolean;

  toString(): string;
}

export class SemVerImpl implements SemVer {
  majorVersion: number | string;
  minorVersion: number | string;

  constructor(major: string | number, minor: string | number) {
    this.majorVersion = major;
    this.minorVersion = minor;
  }

  private static compareSubVersions(
    subVersion1: number | string,
    subVersion2: number | string,
  ): number {
    let subVersionNum1: number = subVersion1 as number;
    let subVersionNum2: number = subVersion2 as number;
    if (typeof subVersion1 === 'string') {
      if (subVersion1 === '*') return 0;
      subVersionNum1 = parseInt(subVersion1);
    }
    if (typeof subVersion2 === 'string') {
      if (subVersion2 === '*') return 0;
      subVersionNum2 = parseInt(subVersion2);
    }

    const comparison = Math.sign(subVersionNum1 - subVersionNum2);
    console.assert(!isNaN(comparison));
    return comparison;
  }

  public isGreaterThan(version: SemVer): boolean {
    const compareMajor = SemVerImpl.compareSubVersions(
      this.majorVersion,
      version.majorVersion,
    );
    const compareMinor = SemVerImpl.compareSubVersions(
      this.minorVersion,
      version.minorVersion,
    );
    if (compareMajor < 0) return false;
    if (compareMajor > 0) return true;
    return compareMinor > 0;
  }

  public isEqualTo(version: SemVer): boolean {
    const compareMajor = SemVerImpl.compareSubVersions(
      this.majorVersion,
      version.majorVersion,
    );
    const compareMinor = SemVerImpl.compareSubVersions(
      this.minorVersion,
      version.minorVersion,
    );

    return compareMajor == 0 && compareMinor == 0;
  }

  public isLessThan(version: SemVer): boolean {
    return !this.isGreaterThan(version) && !this.isEqualTo(version);
  }

  public toString(): string {
    const maj = parseInt(this.majorVersion.toString());
    const min = parseInt(this.minorVersion.toString());
    if (isNaN(min)) {
      return maj.toString();
    }
    return maj.toString() + '.' + min.toString();
  }
}

type BrowserVersion = {
  browser: string;
  version: SemVer;
};

type BrowserException = {
  browser: string;
  version: SemVer;
  os: string;
};

abstract class CompatibilityList {
  protected static readonly minVersions: BrowserVersion[];
  protected static readonly exceptions: BrowserException[];

  // TODO: Use or remove. Never used at the moment
  public static getMinVersion(browserName: string): SemVer | undefined {
    return this.minVersions.find(
      version => version.browser.toLowerCase() === browserName.toLowerCase(),
    )?.version;
  }

  public static getSupportedBrowsers(): BrowserVersion[] {
    return this.minVersions;
  }

  public static isVersionExempted(
    browserName: string,
    version: SemVer,
    operatingSystem: string,
  ): boolean {
    return (
      this.exceptions
        .filter(value => value.browser.toLowerCase() == browserName.toLowerCase())
        .filter(value => value.os.toLowerCase() == operatingSystem.toLowerCase())
        .filter(value => value.version.isEqualTo(version)).length > 0
    );
  }

  public static isVersionAtLeastMin(browserName: string, version: SemVer): boolean {
    return (
      this.minVersions
        .filter(value => value.browser == browserName)
        .filter(
          value => value.version.isEqualTo(version) || value.version.isLessThan(version),
        ).length > 0
    );
  }

  public static isBrowserSupported(browserName: string): boolean {
    return (
      this.minVersions.filter(
        value => value.browser.toLowerCase() === browserName.toLowerCase(),
      ).length != 0
    );
  }

  public static isVersionSupported(
    browserName: string,
    version: SemVer,
    operatingSystem: string,
  ): boolean {
    return (
      !this.isVersionExempted(browserName, version, operatingSystem) &&
      this.isVersionAtLeastMin(browserName, version)
    );
  }

  public static isSupported(
    browserName: string,
    version: SemVer,
    operatingSystem: string,
  ): boolean {
    throw new Error(
      'isSupported is not implemented on this instance of CompatibilityList!',
    );
  }
}

export class WebBluetoothCompatibility extends CompatibilityList {
  protected static readonly exceptions = [] as BrowserException[];

  protected static readonly minVersions = [
    {
      browser: Bowser.BROWSER_MAP.chrome,
      version: new SemVerImpl(56, '*'),
    },
    {
      browser: Bowser.BROWSER_MAP.chromium,
      version: new SemVerImpl(56, '*'),
    },
    {
      browser: Bowser.BROWSER_MAP.edge,
      version: new SemVerImpl(79, '*'),
    },
    {
      browser: Bowser.BROWSER_MAP.opera,
      version: new SemVerImpl(43, '*'),
    } /*{
			browser: Bowser.BROWSER_MAP.android,
			version: new SemVerImpl(105, "*")
		},*/ /*{
			browser: Bowser.BROWSER_MAP.samsung_internet,
			version: new SemVerImpl(6, 2)
		}, {
			browser: Bowser.BROWSER_MAP.uc,
			version: new SemVerImpl(13, 4)
		}*/,
  ] as BrowserVersion[];

  public static isSupported(
    browserName: string,
    version: SemVer,
    operatingSystem: string,
  ): boolean {
    if (!navigator.bluetooth) return false;
    return this.isVersionSupported(browserName, version, operatingSystem);
  }
}

export class WebUSBCompatibility extends CompatibilityList {
  protected static readonly exceptions = [
    {
      browser: Bowser.BROWSER_MAP.chrome,
      version: new SemVerImpl(105, '*'),
      os: Bowser.OS_MAP.ChromeOS,
    },
  ] as BrowserException[];

  protected static readonly minVersions = [
    {
      browser: Bowser.BROWSER_MAP.chrome,
      version: new SemVerImpl(61, '*'),
    },
    {
      browser: Bowser.BROWSER_MAP.chromium,
      version: new SemVerImpl(61, '*'),
    },
    {
      browser: Bowser.BROWSER_MAP.edge,
      version: new SemVerImpl(79, '*'),
    },
    {
      browser: Bowser.BROWSER_MAP.opera,
      version: new SemVerImpl(48, '*'),
    } /* {
			browser: Bowser.BROWSER_MAP.android,
			version: new SemVerImpl(105, "*")
		}, {
			browser: Bowser.BROWSER_MAP.samsung_internet,
			version: new SemVerImpl(8, 2)
		}, {
			browser: Bowser.BROWSER_MAP.uc,
			version: new SemVerImpl(13, 4)
		}*/,
  ] as BrowserVersion[];

  public static isSupported(
    browserName: string,
    version: SemVer,
    operatingSystem: string,
  ): boolean {
    if (!navigator.usb) return false;
    return this.isVersionSupported(browserName, version, operatingSystem);
  }
}

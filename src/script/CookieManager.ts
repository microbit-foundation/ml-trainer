/**
 * (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import Cookies from 'js-cookie';

/**
 * Handles the storage and access of cookie information in a GDPR-compliant manner
 */
class CookieManager {
  private static reconnectCookieName = 'reconnect_flag';
  private static featureFlagsCookieName = 'fflags';

  public static isReconnectFlagSet(): boolean {
    return Cookies.get(this.reconnectCookieName) !== undefined;
  }

  public static unsetReconnectFlag(): void {
    Cookies.remove(this.reconnectCookieName);
  }

  public static setReconnectFlag(): void {
    Cookies.set(this.reconnectCookieName, 'true');
  }

  public static hasFeatureFlag(flag: string): boolean {
    const flags = Cookies.get(this.featureFlagsCookieName);
    if (!flags) {
      return false;
    }
    return flags.toLowerCase().includes(flag.toLowerCase());
  }
}

export default CookieManager;

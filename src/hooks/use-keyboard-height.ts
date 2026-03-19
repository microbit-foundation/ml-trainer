/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Keyboard } from "@capacitor/keyboard";
import { useEffect, useState } from "react";
import { isNativePlatform } from "../platform";

/**
 * Returns the current on-screen keyboard height in pixels.
 *
 * Uses the Capacitor Keyboard plugin on native platforms.
 * Returns 0 on web or when the keyboard is closed.
 */
const useKeyboardHeight = (): number => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!isNativePlatform()) {
      return;
    }
    const showListener = Keyboard.addListener("keyboardWillShow", (info) => {
      setKeyboardHeight(info.keyboardHeight);
    });
    const hideListener = Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      void showListener.then((h) => h.remove());
      void hideListener.then((h) => h.remove());
    };
  }, []);

  return keyboardHeight;
};

export default useKeyboardHeight;

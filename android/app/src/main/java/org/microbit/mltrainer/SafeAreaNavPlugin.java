/**
 * (c) 2026, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
package org.microbit.mltrainer;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Reports the navigation-bar portion of the window insets in CSS pixels,
 * fed by MainActivity's window-insets listener. Backs shared-ui's
 * safeAreaNavSource contract (see src/safe-area-nav.ts): real WindowInsets
 * types replace its size heuristic, so content can flow under a display
 * cutout while staying clear of the navigation bar.
 */
@CapacitorPlugin(name = "SafeAreaNav")
public class SafeAreaNavPlugin extends Plugin {

    private double left = 0;
    private double right = 0;

    @PluginMethod
    public void getInsets(PluginCall call) {
        call.resolve(asJSObject());
    }

    void update(double left, double right) {
        if (this.left == left && this.right == right) {
            return;
        }
        this.left = left;
        this.right = right;
        notifyListeners("insetsChanged", asJSObject());
    }

    private JSObject asJSObject() {
        JSObject insets = new JSObject();
        insets.put("left", left);
        insets.put("right", right);
        return insets;
    }
}

package org.microbit.mltrainer;

import android.content.pm.PackageInfo;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;

import androidx.activity.EdgeToEdge;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MainActivity extends BridgeActivity {

    /**
     * Chromium WebView versions below this report env(safe-area-inset-*) as
     * 0px, so we emulate the safe area with padding for them. At or above it,
     * the WebView reports the insets correctly and we pass them through.
     * See https://issues.chromium.org/issues/40699457
     */
    private static final int SAFE_AREA_CORE_FIX_WEBVIEW_VERSION = 140;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SaveToDownloadsPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        // Enable edge-to-edge mode for all Android versions.
        // On API 35+ this is automatic, but older versions need this call
        // to make status/navigation bars transparent and allow content underneath.
        // The @capacitor-community/safe-area plugin handles icon colors via config.
        EdgeToEdge.enable(this);
        setupSafeAreaInsets();
    }

    /**
     * Applies the safe area insets ourselves via a single window insets
     * listener, adapted from @capacitor-community/safe-area.
     *
     * Owning the listener lets us:
     *
     * - Emulate the safe area for older Chromium WebViews (< v140) that report
     *   env(safe-area-inset-*) as 0px, by padding the decorView and zeroing the
     *   insets (and pass the insets through unchanged for newer WebViews).
     * - Never offset for the on-screen keyboard. The keyboard overlays the
     *   WebView; keyboard avoidance is handled in JS (see useKeyboardHeight).
     *
     * Must be called after EdgeToEdge.enable() and after the bridge has loaded
     * its plugins, as both install their own listener that would otherwise
     * override ours.
     */
    private void setupSafeAreaInsets() {
        final int webViewMajorVersion = getWebViewMajorVersion();
        // index.html always sets viewport-fit=cover, so newer WebViews can read
        // the insets natively; only older WebViews need the padding fallback.
        final boolean passthrough = webViewMajorVersion >= SAFE_AREA_CORE_FIX_WEBVIEW_VERSION;
        final int barsTypeMask =
            WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout();

        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (view, insets) -> {
            Insets bars = insets.getInsets(barsTypeMask);

            // Strip the IME inset so neither the padding below nor the WebView's
            // own viewport resizes the layout when the keyboard opens.
            WindowInsetsCompat.Builder builder = new WindowInsetsCompat.Builder(insets)
                .setInsets(WindowInsetsCompat.Type.ime(), Insets.NONE);

            if (passthrough) {
                view.setPadding(0, 0, 0, 0);
                return builder.build();
            }

            // Older WebView: emulate the safe area by padding the decorView and
            // reporting zeroed insets, since env(safe-area-inset-*) is broken.
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return builder.setInsets(barsTypeMask, Insets.of(0, 0, 0, 0)).build();
        });
    }

    /**
     * Returns the major version of the system WebView (Chromium) package, or 0
     * if it can't be determined (treated as an old WebView needing the
     * padding fallback).
     */
    private int getWebViewMajorVersion() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PackageInfo webViewPackage = WebView.getCurrentWebViewPackage();
            if (webViewPackage != null && webViewPackage.versionName != null) {
                Matcher matcher = Pattern.compile("(\\d+)").matcher(webViewPackage.versionName);
                if (matcher.find()) {
                    return Integer.parseInt(matcher.group(1));
                }
            }
        }
        return 0;
    }
}

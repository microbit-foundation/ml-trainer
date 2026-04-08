package org.microbit.createai;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

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
        // Prevent the keyboard from resizing the WebView (match iOS behavior).
        // Must be set after EdgeToEdge.enable() as it installs its own insets
        // listener that would otherwise override ours.
        ViewCompat.setOnApplyWindowInsetsListener(
            getWindow().getDecorView(),
            (view, insets) -> {
                // Strip out IME insets so the layout doesn't resize for the keyboard
                return new WindowInsetsCompat.Builder(insets)
                    .setInsets(WindowInsetsCompat.Type.ime(), androidx.core.graphics.Insets.NONE)
                    .build();
            }
        );
    }

}
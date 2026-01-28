package org.microbit.createai;

import androidx.activity.EdgeToEdge;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onStart() {
        super.onStart();
        // Enable edge-to-edge mode for all Android versions.
        // On API 35+ this is automatic, but older versions need this call
        // to make status/navigation bars transparent and allow content underneath.
        // The @capacitor-community/safe-area plugin handles icon colors via config.
        EdgeToEdge.enable(this);
    }

}
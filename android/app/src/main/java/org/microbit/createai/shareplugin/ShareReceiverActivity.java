package org.microbit.createai.shareplugin;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class ShareReceiverActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShareReceiver.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onPause() {
        super.onPause();
        finish();
    }

    @Override
    public void onStop() {
        super.onStop();
        finish();
    }
}

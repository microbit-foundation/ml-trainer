package org.microbit.createai;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import androidx.activity.EdgeToEdge;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;

import org.microbit.createai.shareplugin.ShareReceiver;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShareReceiver.class);
        super.onCreate(savedInstanceState);
        handleIncomingIntent(getIntent());
    }

    @Override
    public void onStart() {
        super.onStart();
        EdgeToEdge.enable(this);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIncomingIntent(intent);
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();

        if ("org.microbit.createai.SHARE_PRIVATE".equals(action)) {

            Uri shared = intent.getParcelableExtra("sharedUri");

            if (shared != null) {

                JSObject payload = new JSObject();
                payload.put("uri", shared.toString());

                getBridge().triggerWindowJSEvent("indirectShareReceived", payload.toString());

            }
        }
    }
}
package org.microbit.createai.shareplugin;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;

import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import org.microbit.createai.MainActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;


@CapacitorPlugin(name = "ShareReceiver")
public class ShareReceiver extends Plugin {

    @PluginMethod
    public void isShare(PluginCall call) {
        Intent intent = bridge.getActivity().getIntent();
        String action = intent.getAction();
        String type = intent.getType();
        var result = new JSObject();
        result.put("isShare", Intent.ACTION_SEND.equals(action) && type != null);
        call.resolve(result);
    }

    @PluginMethod
    public void finish(PluginCall call) {

        bridge.getActivity().finish();
    }

    @PluginMethod
    public void openMainActivity (PluginCall call) {
        Activity receiver = getActivity();
        Intent incoming = receiver.getIntent();
        Uri shared = incoming.getParcelableExtra(Intent.EXTRA_STREAM);

        Uri localCopy = makeFileLocal(shared);

        int flags = incoming.getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION;

        Intent forward = new Intent(this.getActivity(), MainActivity.class);
        forward.setAction("org.microbit.createai.SHARE_PRIVATE");
        forward.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        forward.addFlags(flags);
        forward.putExtra("sharedUri", localCopy);
        receiver.startActivity(forward);
        call.resolve(new JSObject());
    }

    Uri makeFileLocal(Uri uri) {
        // get the name
        Cursor contentCursor =
                getContext().getContentResolver().query(uri, null, null, null, null);
        contentCursor.moveToFirst();
        int nameCol = contentCursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
        String fileName = contentCursor.getString(nameCol);
        contentCursor.close();

        File file = new File(getContext().getFilesDir(), fileName);

        try (FileOutputStream outputStream = getContext().openFileOutput(fileName, Context.MODE_PRIVATE);
             InputStream inputStream = getContext().getContentResolver().openInputStream(uri)) {

            byte[] buffer = new byte[8192];
            int n;
            while ((n = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, n);
            }

            return Uri.fromFile(file);
        } catch (IOException ioException) {
            ioException.printStackTrace();
        }
        return null;
    }
}

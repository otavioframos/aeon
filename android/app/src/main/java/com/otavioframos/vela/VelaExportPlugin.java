package com.otavioframos.vela;

import android.content.Intent;
import android.net.Uri;

import androidx.core.content.FileProvider;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "VelaExport")
public class VelaExportPlugin extends Plugin {
    @PluginMethod
    public void shareFile(PluginCall call) {
        String filename = safeFilename(call.getString("filename", "vela-export.txt"));
        String contents = call.getString("contents", "");
        String mimeType = call.getString("mimeType", "application/octet-stream");

        try {
            File dir = new File(getContext().getCacheDir(), "exports");
            if (!dir.exists() && !dir.mkdirs()) {
                call.reject("Could not prepare export directory");
                return;
            }

            File file = new File(dir, filename);
            try (FileOutputStream stream = new FileOutputStream(file, false)) {
                stream.write(contents.getBytes(StandardCharsets.UTF_8));
            }

            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
            Intent sendIntent = new Intent(Intent.ACTION_SEND);
            sendIntent.setType(mimeType);
            sendIntent.putExtra(Intent.EXTRA_STREAM, uri);
            sendIntent.putExtra(Intent.EXTRA_SUBJECT, filename);
            sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(sendIntent, "Export Vela file");
            getActivity().startActivity(chooser);
            call.resolve();
        } catch (Exception exception) {
            call.reject("Could not export file", exception);
        }
    }

    private static String safeFilename(String filename) {
        String clean = filename.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        return clean.isEmpty() ? "vela-export.txt" : clean;
    }
}

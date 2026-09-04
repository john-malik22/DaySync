package com.daysync.app;

import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import androidx.core.content.FileProvider;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {

    private static final String TAG = "AppUpdatePlugin";

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String urlString = call.getString("url");
        if (urlString == null || urlString.isEmpty()) {
            call.reject("APK URL is required");
            return;
        }

        Log.d(TAG, "[DaySync Native Updater] Exact APK URL received: " + urlString);

        new Thread(() -> {
            try {
                File cacheDir = getContext().getCacheDir();
                File apkFile = new File(cacheDir, "daysync-update.apk");
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                String userAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
                URL url = new URL(urlString);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("User-Agent", userAgent);
                connection.setRequestProperty("Accept", "application/octet-stream, application/vnd.android.package-archive, */*");
                connection.setConnectTimeout(20000);
                connection.setReadTimeout(60000);
                connection.connect();

                int status = connection.getResponseCode();
                int redirects = 0;

                while ((status == HttpURLConnection.HTTP_MOVED_TEMP
                        || status == HttpURLConnection.HTTP_MOVED_PERM
                        || status == HttpURLConnection.HTTP_SEE_OTHER
                        || status == 307
                        || status == 308) && redirects < 10) {

                    String redirectUrl = connection.getHeaderField("Location");
                    Log.d(TAG, "[DaySync Native Updater] HTTP Redirect " + status + " -> " + redirectUrl);

                    if (redirectUrl == null || redirectUrl.isEmpty()) {
                        break;
                    }

                    connection.disconnect();
                    url = new URL(url, redirectUrl); // handles both relative and absolute redirect URLs
                    connection = (HttpURLConnection) url.openConnection();
                    connection.setInstanceFollowRedirects(true);
                    connection.setRequestProperty("User-Agent", userAgent);
                    connection.setRequestProperty("Accept", "application/octet-stream, application/vnd.android.package-archive, */*");
                    connection.setConnectTimeout(20000);
                    connection.setReadTimeout(60000);
                    connection.connect();

                    status = connection.getResponseCode();
                    redirects++;
                }

                String finalUrl = connection.getURL().toString();
                String contentType = connection.getContentType();
                int contentLength = connection.getContentLength();

                Log.d(TAG, "[DaySync Native Updater] Final Response URL: " + finalUrl);
                Log.d(TAG, "[DaySync Native Updater] HTTP Status: " + status);
                Log.d(TAG, "[DaySync Native Updater] Content-Type: " + contentType);
                Log.d(TAG, "[DaySync Native Updater] Content-Length: " + contentLength + " bytes");

                if (status != HttpURLConnection.HTTP_OK) {
                    connection.disconnect();
                    call.reject("HTTP error downloading APK: status " + status + " for URL " + finalUrl);
                    return;
                }

                if (contentType != null && contentType.toLowerCase().contains("text/html")) {
                    connection.disconnect();
                    call.reject("Downloaded URL returned HTML instead of an APK binary (Content-Type: " + contentType + "). URL: " + finalUrl);
                    return;
                }

                InputStream input = connection.getInputStream();
                FileOutputStream output = new FileOutputStream(apkFile);

                byte[] buffer = new byte[16384];
                int bytesRead;
                long totalDownloaded = 0;

                while ((bytesRead = input.read(buffer)) != -1) {
                    output.write(buffer, 0, bytesRead);
                    totalDownloaded += bytesRead;
                }

                output.flush();
                output.close();
                input.close();
                connection.disconnect();

                Log.d(TAG, "[DaySync Native Updater] Total downloaded bytes: " + totalDownloaded + " (File size: " + apkFile.length() + " bytes)");

                if (!apkFile.exists() || apkFile.length() < 100) {
                    call.reject("Downloaded APK file is missing or too small (" + apkFile.length() + " bytes).");
                    return;
                }

                // Verify APK / ZIP Signature (Magic Bytes: 0x50 0x4B 0x03 0x04 -> "PK\003\004")
                FileInputStream fis = new FileInputStream(apkFile);
                byte[] header = new byte[4];
                int headerRead = fis.read(header);
                fis.close();

                boolean isValidZip = (headerRead == 4
                        && (header[0] & 0xFF) == 0x50
                        && (header[1] & 0xFF) == 0x4B
                        && (header[2] & 0xFF) == 0x03
                        && (header[3] & 0xFF) == 0x04);

                if (!isValidZip) {
                    String magicHex = String.format("%02X %02X %02X %02X",
                            header[0] & 0xFF, header[1] & 0xFF, header[2] & 0xFF, header[3] & 0xFF);
                    Log.e(TAG, "[DaySync Native Updater] APK signature validation FAILED! Magic bytes: " + magicHex);
                    apkFile.delete();
                    call.reject("Downloaded file is not a valid APK package. Signature validation failed (Magic bytes: " + magicHex + ").");
                    return;
                }

                Log.d(TAG, "[DaySync Native Updater] APK signature validation PASSED! Valid ZIP/APK magic bytes (PK\\x03\\x04) confirmed.");

                Uri apkUri = FileProvider.getUriForFile(
                        getContext(),
                        getContext().getPackageName() + ".fileprovider",
                        apkFile
                );

                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

                getContext().startActivity(intent);
                call.resolve();

            } catch (Exception e) {
                Log.e(TAG, "[DaySync Native Updater] Error during download or install: " + e.getMessage(), e);
                call.reject("Error downloading or launching APK installer: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void openUrl(PluginCall call) {
        downloadAndInstall(call);
    }
}

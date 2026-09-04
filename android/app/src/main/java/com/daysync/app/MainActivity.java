package com.daysync.app;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppUpdatePlugin.class);
        super.onCreate(savedInstanceState);

        if (getBridge() != null) {
            getBridge().registerPlugin(AppUpdatePlugin.class);
            if (getBridge().getWebView() != null) {
                WebSettings settings = getBridge().getWebView().getSettings();
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
            }
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        try {
            CookieManager.getInstance().flush();
        } catch (Exception ignored) {}
    }

    @Override
    public void onStop() {
        super.onStop();
        try {
            CookieManager.getInstance().flush();
        } catch (Exception ignored) {}
    }
}

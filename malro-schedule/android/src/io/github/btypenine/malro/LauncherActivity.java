package io.github.btypenine.malro;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.support.customtabs.ICustomTabsCallback;
import android.support.customtabs.ICustomTabsService;

import java.util.List;

/**
 * 말로 일정 — 앱 아이콘을 누르면 웹앱을 크롬의 "신뢰할 수 있는 웹 활동(TWA)"으로 엶.
 *
 * 동작 순서(androidx.browser / android-browser-helper 의 TWA 실행 방식과 같음)
 *  1. TWA를 지원하는 브라우저 선택 — 음성인식(Web Speech)이 되는 크롬을 먼저 고름
 *  2. 그 브라우저의 CustomTabsService 에 연결 → newSession 으로 세션 생성(크롬이 이 앱을 알아봄)
 *  3. 세션을 실어 웹앱 주소를 TWA 로 실행 → 크롬이 사이트의 assetlinks.json 을 확인하면 주소창 없이 전체화면
 *  4. 연결 실패·지원 브라우저 없음 → 일반 브라우저로 웹앱을 엶(앱이 아무것도 안 하는 일은 없게)
 */
public class LauncherActivity extends Activity {

    static final String LAUNCH_URL = "https://btypenine.github.io/malro-schedule/";
    static final int THEME_COLOR = 0xFFF5F3EE; // 웹앱 manifest 의 theme_color

    static final String ACTION_CUSTOM_TABS = "android.support.customtabs.action.CustomTabsService";
    static final String CATEGORY_TWA = "androidx.browser.trusted.category.TrustedWebActivities";
    static final String EXTRA_SESSION = "android.support.customtabs.extra.SESSION";
    static final String EXTRA_LAUNCH_AS_TWA = "android.support.customtabs.extra.LAUNCH_AS_TRUSTED_WEB_ACTIVITY";
    static final String EXTRA_TOOLBAR_COLOR = "android.support.customtabs.extra.TOOLBAR_COLOR";
    static final String EXTRA_NAV_BAR_COLOR = "androidx.browser.customtabs.extra.NAVIGATION_BAR_COLOR";
    static final String EXTRA_DISPLAY_MODE = "androidx.browser.trusted.extra.DISPLAY_MODE";
    static final String KEY_DISPLAY_MODE_ID = "androidx.browser.trusted.displaymode.KEY_ID";
    static final String EXTRA_SCREEN_ORIENTATION = "androidx.browser.trusted.extra.SCREEN_ORIENTATION";

    /** 크롬 계열(음성인식 지원) 우선순위 */
    static final String[] CHROME_PACKAGES = {
            "com.android.chrome", "com.chrome.beta", "com.chrome.dev", "com.chrome.canary"};

    private static final String STATE_LAUNCHED = "launched";
    private static final long CONNECT_TIMEOUT_MS = 4000;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private ServiceConnection connection;
    private boolean bound;
    private boolean launched;
    private String provider;

    /** 크롬이 보내는 탐색 알림 수신용 — 이 앱은 받을 일이 없어 모두 무시 */
    private final ICustomTabsCallback.Stub callback = new ICustomTabsCallback.Stub() {
        @Override public void onNavigationEvent(int e, Bundle x) {}
        @Override public void extraCallback(String n, Bundle a) {}
        @Override public void onMessageChannelReady(Bundle x) {}
        @Override public void onPostMessage(String m, Bundle x) {}
        @Override public void onRelationshipValidationResult(int r, Uri o, boolean ok, Bundle x) {}
        @Override public Bundle extraCallbackWithResult(String n, Bundle a) { return null; }
        @Override public void onActivityResized(int h, int w, Bundle x) {}
        @Override public void onWarmupCompleted(Bundle x) {}
        @Override public void onActivityLayout(int l, int t, int r, int b, int s, Bundle x) {}
        @Override public void onMinimized(Bundle x) {}
        @Override public void onUnminimized(Bundle x) {}
    };

    private final Runnable connectTimeout = new Runnable() {
        @Override public void run() {
            if (!launched) openInBrowser(provider);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (savedInstanceState != null && savedInstanceState.getBoolean(STATE_LAUNCHED)) {
            finish();
            return;
        }

        provider = pickTwaProvider(this);
        if (provider == null) {
            openInBrowser(null);
            return;
        }

        connection = new ServiceConnection() {
            @Override public void onServiceConnected(ComponentName name, IBinder service) {
                launchTwa(service);
            }
            @Override public void onServiceDisconnected(ComponentName name) {}
        };
        Intent bind = new Intent(ACTION_CUSTOM_TABS).setPackage(provider);
        try {
            bound = bindService(bind, connection, Context.BIND_AUTO_CREATE);
        } catch (SecurityException e) {
            bound = false;
        }
        if (!bound) {
            openInBrowser(provider);
            return;
        }
        handler.postDelayed(connectTimeout, CONNECT_TIMEOUT_MS);
    }

    private void launchTwa(IBinder service) {
        if (launched || isFinishing()) return;
        ICustomTabsService tabs = ICustomTabsService.Stub.asInterface(service);
        boolean sessionOk;
        try {
            tabs.warmup(0);
            sessionOk = tabs.newSession(callback);
        } catch (Exception e) {
            sessionOk = false;
        }
        if (!sessionOk) {
            openInBrowser(provider);
            return;
        }

        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(LAUNCH_URL));
        intent.setPackage(provider);
        Bundle session = new Bundle();
        session.putBinder(EXTRA_SESSION, callback.asBinder());
        intent.putExtras(session);
        intent.putExtra(EXTRA_LAUNCH_AS_TWA, true);
        intent.putExtra(EXTRA_TOOLBAR_COLOR, THEME_COLOR);
        intent.putExtra(EXTRA_NAV_BAR_COLOR, THEME_COLOR);
        Bundle displayMode = new Bundle();
        displayMode.putInt(KEY_DISPLAY_MODE_ID, 0); // 0 = 기본(상태바 보이는 전체화면)
        intent.putExtra(EXTRA_DISPLAY_MODE, displayMode);
        intent.putExtra(EXTRA_SCREEN_ORIENTATION, 0); // 0 = 기기 설정을 따름

        try {
            startActivity(intent);
            launched = true;
            handler.removeCallbacks(connectTimeout);
            finish();
        } catch (ActivityNotFoundException e) {
            openInBrowser(null);
        }
    }

    /** TWA 를 못 쓸 때: 브라우저로 웹앱을 엶(주소창은 보임) */
    private void openInBrowser(String pkg) {
        if (launched) return;
        launched = true;
        handler.removeCallbacks(connectTimeout);
        Intent view = new Intent(Intent.ACTION_VIEW, Uri.parse(LAUNCH_URL));
        if (pkg != null) view.setPackage(pkg);
        try {
            startActivity(view);
        } catch (ActivityNotFoundException e) {
            if (pkg != null) {
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(LAUNCH_URL))); }
                catch (ActivityNotFoundException ignored) {}
            }
        }
        finish();
    }

    /** TWA 지원 브라우저 고르기: 크롬 → 기본 브라우저 → 그 밖의 TWA 지원 브라우저 */
    static String pickTwaProvider(Context ctx) {
        PackageManager pm = ctx.getPackageManager();
        List<ResolveInfo> services = pm.queryIntentServices(
                new Intent(ACTION_CUSTOM_TABS), PackageManager.GET_RESOLVED_FILTER);
        if (services == null || services.isEmpty()) return null;

        for (String chrome : CHROME_PACKAGES) {
            if (supportsTwa(services, chrome)) return chrome;
        }
        String defaultBrowser = null;
        ResolveInfo def = pm.resolveActivity(
                new Intent(Intent.ACTION_VIEW, Uri.parse("http://")), PackageManager.MATCH_DEFAULT_ONLY);
        if (def != null && def.activityInfo != null) defaultBrowser = def.activityInfo.packageName;
        if (defaultBrowser != null && supportsTwa(services, defaultBrowser)) return defaultBrowser;

        for (ResolveInfo ri : services) {
            if (ri.filter != null && ri.filter.hasCategory(CATEGORY_TWA)) return ri.serviceInfo.packageName;
        }
        return null;
    }

    private static boolean supportsTwa(List<ResolveInfo> services, String pkg) {
        for (ResolveInfo ri : services) {
            if (ri.serviceInfo != null && pkg.equals(ri.serviceInfo.packageName)
                    && ri.filter != null && ri.filter.hasCategory(CATEGORY_TWA)) {
                return true;
            }
        }
        return false;
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putBoolean(STATE_LAUNCHED, launched);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        handler.removeCallbacks(connectTimeout);
        if (bound && connection != null) {
            try { unbindService(connection); } catch (IllegalArgumentException ignored) {}
            bound = false;
        }
    }
}

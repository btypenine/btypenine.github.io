// androidx.browser 의 ICustomTabsCallback.aidl 과 동일(크롬이 이 앱으로 보내는 알림 — 앱은 모두 무시)
package android.support.customtabs;

import android.net.Uri;
import android.os.Bundle;

interface ICustomTabsCallback {
    oneway void onNavigationEvent(int navigationEvent, in Bundle extras) = 1;
    oneway void extraCallback(String callbackName, in Bundle args) = 2;
    void onMessageChannelReady(in Bundle extras) = 3;
    void onPostMessage(String message, in Bundle extras) = 4;
    oneway void onRelationshipValidationResult(int relation, in Uri origin, boolean result, in Bundle extras) = 5;
    Bundle extraCallbackWithResult(String callbackName, in Bundle args) = 6;
    oneway void onActivityResized(int height, int width, in Bundle extras) = 7;
    oneway void onWarmupCompleted(in Bundle extras) = 8;
    oneway void onActivityLayout(int left, int top, int right, int bottom, int state, in Bundle extras) = 9;
    oneway void onMinimized(in Bundle extras) = 10;
    oneway void onUnminimized(in Bundle extras) = 11;
}

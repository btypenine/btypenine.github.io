// androidx.browser 의 ICustomTabsService.aidl 중 이 앱이 쓰는 두 메서드만 남김(번호는 원본과 동일해야 함)
package android.support.customtabs;

import android.support.customtabs.ICustomTabsCallback;

interface ICustomTabsService {
    boolean warmup(long flags) = 1;
    boolean newSession(in ICustomTabsCallback callback) = 2;
}

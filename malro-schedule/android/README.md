# 말로 일정 — 안드로이드 앱(APK)

웹앱 https://btypenine.github.io/malro-schedule/ 을 크롬 **TWA(신뢰할 수 있는 웹 활동)** 로 여는 설치 파일.
앱 안에는 화면이 없고, 아이콘을 누르면 크롬이 주소창 없이 웹앱을 전체화면으로 띄움.

| 항목 | 값 |
|---|---|
| 앱 이름 / 아이콘 | 말로 일정 / 검은 둥근 사각형 + 흰 9 + 주황 점(적응형·테마 아이콘 포함) |
| 패키지명 | `io.github.btypenine.malro` |
| 버전 | versionCode 1 / 1.0.0 |
| 최소 / 대상 | Android 6.0(API 23) / API 34 |
| 서명 키 지문(SHA-256) | `02:F6:9A:51:26:0C:8D:60:D9:7E:ED:DA:77:72:89:8F:D2:7F:59:5E:6A:D9:73:7C:C1:D9:40:B0:DF:A8:F7:A2` |
| 사이트 연결 파일 | 저장소 루트 `/.well-known/assetlinks.json` (위 지문과 같아야 주소창이 사라짐) |
| 배포 파일 | `../malro.apk` (다운로드 이름 `말로일정.apk`), 안내 페이지 `../download.html` |

## 빌드

Gradle·Android Studio 없이 기본 도구로 빌드함(`build.sh` 참고).

```bash
sudo apt-get install -y openjdk-17-jdk aapt zipalign apksigner dalvik-exchange aidl android-sdk-platform-23
MALRO_KEYSTORE=/안전한/곳/malro-release.jks MALRO_KS_PASS='비밀번호' ./build.sh
cp "out/말로일정.apk" ../malro.apk
```

- 아이콘을 바꿨으면 먼저 `python3 make_icons.py`(웹앱 icon-512·icon-maskable-512 에서 생성)
- 다시 배포할 때는 `AndroidManifest.xml` 의 `versionCode` 를 1 올리고, **반드시 같은 서명 키** 사용

## 업데이트 원칙

- 웹앱(`index.html` 등) 수정 → 저장소에 올리면 끝. **APK 재설치 불필요**(앱이 매번 웹앱을 엶)
- APK 재배포가 필요한 경우: 앱 이름·아이콘·시작 주소·패키지명 변경 시만

## 서명 키

- `malro-release.jks` 와 비밀번호는 **저장소에 올리지 않음**(`.gitignore` 로 차단)
- 키를 잃어버리면 같은 앱으로 업데이트 불가 → 새 키로 만들면 기존 앱을 지우고 새로 설치해야 하고 assetlinks.json 지문도 바꿔야 함

## 구성

- `src/.../LauncherActivity.java` — 크롬(없으면 기본 브라우저) 선택 → Custom Tabs 세션 생성 → TWA 실행, 실패 시 일반 브라우저로 열기
- `aidl/` — 크롬과 통신하는 인터페이스(androidx.browser 원본과 같은 번호)
- `res/` — 앱 이름, 아이콘

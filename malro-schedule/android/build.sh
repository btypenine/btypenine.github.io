#!/usr/bin/env bash
# 말로 일정 APK 빌드 — Gradle 없이 안드로이드 기본 도구로 빌드
#
# 준비(우분투/데비안):
#   sudo apt-get install -y openjdk-17-jdk aapt zipalign apksigner dalvik-exchange aidl android-sdk-platform-23
#
# 실행:
#   MALRO_KEYSTORE=/안전한/곳/malro-release.jks MALRO_KS_PASS='키 비밀번호' ./build.sh
#   → out/말로일정.apk
#
# ⚠ 서명 키(.jks)는 절대 이 저장소에 넣지 말 것. 같은 키로 서명해야 덮어쓰기 업데이트가 되고,
#   키 지문이 /.well-known/assetlinks.json 과 같아야 주소창 없는 전체화면이 됨.
set -euo pipefail
cd "$(dirname "$0")"

ANDROID_JAR="${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}"
FRAMEWORK_AIDL="$(dirname "$ANDROID_JAR")/framework.aidl"
: "${MALRO_KEYSTORE:?MALRO_KEYSTORE(서명 키 파일 경로)를 지정하세요}"
: "${MALRO_KS_PASS:?MALRO_KS_PASS(서명 키 비밀번호)를 지정하세요}"
ALIAS="${MALRO_KEY_ALIAS:-malro}"
DX="$(command -v d8 || command -v dalvik-exchange || command -v dx)"

rm -rf build out && mkdir -p build/gen build/classes out

echo "1) AIDL → 자바 인터페이스"
for f in aidl/android/support/customtabs/*.aidl; do
  aidl -Iaidl -p"$FRAMEWORK_AIDL" -obuild/gen "$f"
done

echo "2) 리소스 컴파일·링크(이름·아이콘·매니페스트)"
aapt2 compile --dir res -o build/res.zip
aapt2 link -I "$ANDROID_JAR" --manifest AndroidManifest.xml --java build/gen \
  -o build/base.apk build/res.zip

echo "3) 자바 컴파일 → DEX"
javac -nowarn -Xlint:-options -source 8 -target 8 -encoding UTF-8 -bootclasspath "$ANDROID_JAR" \
  -d build/classes $(find src build/gen -name '*.java')
if [[ "$(basename "$DX")" == d8 ]]; then
  "$DX" --min-api 23 --lib "$ANDROID_JAR" --output build $(find build/classes -name '*.class')
else
  "$DX" --dex --min-sdk-version=23 --output=build/classes.dex build/classes
fi

echo "4) 묶기·정렬·서명"
cp build/base.apk build/unsigned.apk
(cd build && zip -q -X unsigned.apk classes.dex)
zipalign -p -f 4 build/unsigned.apk build/aligned.apk
apksigner sign --ks "$MALRO_KEYSTORE" --ks-key-alias "$ALIAS" --ks-pass env:MALRO_KS_PASS \
  --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --v4-signing-enabled false \
  --out build/signed.apk build/aligned.apk
apksigner verify --print-certs build/signed.apk
cp build/signed.apk "out/말로일정.apk"   # 한글 파일명은 셸에서 복사(자바 도구는 한글 경로를 못 다룰 수 있음)
echo "완료: $(pwd)/out/말로일정.apk"

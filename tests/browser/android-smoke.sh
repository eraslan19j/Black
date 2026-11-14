#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "::error::Android kontrolünde ${LINENO}. satır başarısız: ${BASH_COMMAND}"' ERR
# Yayınlanmış uygulamanın ağ bağlantısına ihtiyaç duymadığını doğrula.
adb shell svc wifi disable
adb shell svc data disable
adb install -r apk/app-debug.apk
adb shell am start -n com.mirravadi.kuldefteri/.MainActivity
PID=''
for i in $(seq 1 30); do
  PID=$(adb shell pidof com.mirravadi.kuldefteri | tr -d '\r') || true
  [ -n "$PID" ] && break
  sleep 1
done
test -n "$PID"
adb forward tcp:9222 "localabstract:webview_devtools_remote_$PID"
node tests/browser/android.mjs 2>&1 | tee /tmp/kul-android-test.log

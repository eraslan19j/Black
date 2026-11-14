# Kül Defteri

Mirra Vadisi ile Noctis Akademisi'nde geçen, özgün ve Türkçe bir 2D hikâye-aksiyon RPG'si. Depodaki mevcut oynanabilir sürüm **Milestone 1 dikey dilimidir**: prolog, birinci bölüm ve bir Ayna Düello. Hikâyenin kalanı ve büyü icadı henüz uygulanmadı; bu sürüm tam oyun değildir.

## Oynama

Yatay ekranda soldaki kontrolle sağa-sola ve sahnenin önüne/arkasına yürü; bir iz işaretinin yakınına gelince **İncele**'ye dokun. Sağdaki **Rün** düğmesi çizim alanını açar: çember Kor, V Su, ∧ Siper'dir. Çizimi parmağını kaldırmadan yap. Düelloda rakibin Kor Mührü'nü Su ile karşıla. Masaüstü önizlemesinde yön tuşları veya W/A/S/D, inceleme için E ve rün için R kullanılabilir. Ses düğmesi üst sağdadır. Otomatik kayıt cihazdaki localStorage'dadır; yeni oyun önceki kaydı siler. Tarayıcı verileri veya uygulama kaldırılırsa kayıt kaybolabilir.

## Geliştirme ve test

Node.js 22 ve npm gerekir. Oyun varlıkları kodla üretilir; çalışma zamanında ağ veya harici varlık gerekmez.

```sh
npm ci
npm test
npm run dev
# Başka bir terminalde, yerel Chromium ile isteğe bağlı uçtan uca test:
CHROME_BIN=/usr/bin/google-chrome npm run test:browser
# Üretim derlemesi:
npm run build
```

Android için JDK 21, Android SDK 35 ve Android Studio veya komut satırı araçları gerekir:

```sh
npm run android:sync
cd android
./gradlew assembleDebug
```

Çıktı: `android/app/build/outputs/apk/debug/app-debug.apk`. Uygulama Android 6.0+ (API 23+) hedefler ve yatay yönü kullanır. Orta seviye cihazlarda 60 FPS hedeflenir; performans gerçek cihazlarda ayrıca ölçülmelidir.

## GitHub Actions

Her push `Android debug APK` iş akışını çalıştırır; birim testleri ve Android derlemesi başarılıysa `kul-defteri-debug-apk` artifact'i yüklenir. İş akışı ayrıca tarayıcıda oynanış testini ve Android emülatörde çevrimdışı WebView açılış kontrolünü çalıştırır. `Android imzalı AAB` Actions sekmesinden elle başlatılır. Önce güvenli bir yerde bir **upload key** oluşturun (JDK `keytool` gerekir):

```sh
keytool -genkeypair -v -keystore kul-upload.jks -keyalg RSA -keysize 4096 -validity 10000 -alias kul-upload
base64 -w 0 kul-upload.jks  # macOS: base64 -i kul-upload.jks | tr -d '\n'
```

GitHub deposu **Settings → Secrets and variables → Actions** bölümüne şu secrets değerlerini ekleyin:

- `ANDROID_KEYSTORE_BASE64`: keystore dosyasının base64 çıktısı
- `ANDROID_KEYSTORE_PASSWORD`: keystore parolası
- `ANDROID_KEY_ALIAS`: örnekte `kul-upload`
- `ANDROID_KEY_PASSWORD`: anahtar parolası

Keystore'u ve parolaları güvenle yedekleyin; depoya yüklemeyin. Elle başlatılan iş akışı imzalı AAB üretir ve imzasını doğrular. Play Console'da Play App Signing, paket adı, sürüm kodu, mağaza girişi, içerik derecelendirmesi, veri güvenliği formu ve yayın öncesi cihaz testleri ayrıca yönetilmelidir. Sürüm yüklemelerinde `versionCode` artırılmalıdır.

## Yapı

- `src/world.js`: çok katmanlı paralaks, perspektif zemin ve derinlik hareketi
- `src/movement.js`: dokunmatik ve klavye hareket hesapları
- `src/story.js`: bölüm ve diyalog verileri
- `src/recognizer.js`: tek vuruşlu rün tanıyıcı
- `src/save.js`: sürümlenmiş yerel kayıt
- `src/audio.js`: Web Audio ile sentezlenen sesler
- `src/main.js`: oyun akışı ve dokunmatik arayüz
- `android/`: Capacitor Android projesi
- `GIZLILIK.md`: yayın öncesi gözden geçirilecek gizlilik politikası taslağı

## Bilinen sınırlar

Bu dikey dilimde gerçek cihaz/APK performansı ve çeşitli Android WebView sürümleri ayrıca doğrulanmalıdır; emülatör testi gerçek cihaz ölçümünün yerini tutmaz. Sahne perspektifi 2.5D hissi veren 2D katmanlardan oluşur, gerçek 3D değildir. Büyü icadı, envanter arayüzü, kalan bölümler ve tam oyun dengesi sonraki aşamalardadır. Ses sentezi cihazın Web Audio desteğine bağlıdır. Rün tanıma basit şekiller için tasarlanmıştır.

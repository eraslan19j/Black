# Kül Defteri — Arena

Kül Defteri, hikâye yerine savaşa odaklanan, tek oyunculu, çevrimdışı bir aksiyon RPG prototipidir. Phaser ile üretilmiş izometrik 2.5D sahnede dalgalar hâlinde gelen düşmanlarla savaşılır. Sahne gerçek 3D değildir; görseller kodla üretilen 2D katman ve siluetlerdir. Hiçbir harici oyun varlığı kullanılmaz.

## Nasıl oynanır?

Yatay ekranda soldaki joystick ile hareket et. Düşmana dokunarak hedef seç veya menzildeki en yakın düşmanın otomatik hedeflenmesini kullan. Düşmanlar seni takip eder; Kor Gözcüleri uzak mesafeden saldırır ve çok yaklaştığında geri çekilir. Her beşinci dalgada güçlü bir muhafız çıkar.

- **Asa Darbesi (Q):** Tek hedefe ücretsiz saldırı; düğmeyi basılı tutabilirsin.
- **Kor Küresi (E):** Hedefin çevresindeki düşmanlara alan hasarı verir.
- **Ayaz Halkası (R):** Yakındaki düşmanlara hasar verir ve onları yavaşlatır.
- **Kül Sığınağı (F):** İyileştirir ve kısa süre alınan hasarı azaltır.

Büyüler öz kullanır, bekleme süresine sahiptir ve geçerli hedef yoksa öz harcamaz. Öz zamanla yenilenir. Düşmanlardan kül ve deneyim kazan; seviye atladığında canın ve özün dolar. Yere düşersen aynı dalgayı tekrar denersin, külünün %10'u kaybolur. Masaüstü önizlemesinde WASD veya yön tuşlarıyla hareket edebilirsin.

Seviye, deneyim, kül, yenilen düşman sayısı ve dalga cihazda otomatik saklanır. Arenaya yeniden girildiğinde düşmanlar ve can/öz yeniden oluşturulur; konum ve tek tek düşmanların sağlığı saklanmaz. Eski hikâye sürümünün kayıtları ayrı anahtarda kalır, arena ilerlemesine dönüştürülmez. Uygulama verileri temizlenir veya uygulama kaldırılırsa yerel kayıt kaybolur.

## Geliştirme ve test

Node.js 22 ve npm gerekir:

```sh
npm ci
npm test
npm run dev
# Başka bir terminalde, yerel Chromium ile:
CHROME_BIN=/usr/bin/google-chrome npm run test:browser
npm run build
```

Android için JDK 21, Android SDK 35 ve Android Studio veya komut satırı araçları gerekir:

```sh
npm run android:sync
cd android
./gradlew assembleDebug
```

Çıktı: `android/app/build/outputs/apk/debug/app-debug.apk`. Android 6.0+ (API 23+) ve yatay ekran kullanılır. 60 FPS hedeflenir; farklı gerçek cihazlarda performans henüz ölçülmemiştir.

## GitHub Actions

Her push `Android debug APK` iş akışını çalıştırır; test ve derleme başarılıysa `kul-defteri-debug-apk` artifact'i yüklenir. Tarayıcı oynanış testi ve Android emülatörde çevrimdışı açılış testi ayrıca çalışır. `Android imzalı AAB` Actions sekmesinden elle başlatılır. Önce güvenli bir yerde **upload key** oluşturun:

```sh
keytool -genkeypair -v -keystore kul-upload.jks -keyalg RSA -keysize 4096 -validity 10000 -alias kul-upload
base64 -w 0 kul-upload.jks  # macOS: base64 -i kul-upload.jks | tr -d '\n'
```

GitHub **Settings → Secrets and variables → Actions** bölümüne ekleyin:

- `ANDROID_KEYSTORE_BASE64`: keystore dosyasının base64 çıktısı
- `ANDROID_KEYSTORE_PASSWORD`: keystore parolası
- `ANDROID_KEY_ALIAS`: örnekte `kul-upload`
- `ANDROID_KEY_PASSWORD`: anahtar parolası

Keystore'u ve parolaları güvenle yedekleyin; depoya yüklemeyin. AAB iş akışı imzalı paket üretir ve doğrular. Play App Signing, paket adı, artan sürüm kodu, mağaza girişi, içerik derecelendirmesi, veri güvenliği ve yayın öncesi cihaz testleri ayrıca yönetilmelidir.

## Yapı ve sınırlar

- `src/world.js`: izometrik dünya, düşman davranışları, dalga ve savaş efektleri
- `src/combat.js`: büyüler, hedefleme, hasar ve seviye hesapları
- `src/movement.js`: joystick ve klavye hareket hesapları
- `src/save.js`: sürümlenmiş yerel arena kaydı
- `src/audio.js`: Web Audio ile sentezlenen sesler
- `src/main.js`: menü, dokunmatik arayüz ve oyun akışı
- `android/`: Capacitor Android projesi
- `GIZLILIK.md`: yayın öncesi gözden geçirilecek gizlilik politikası taslağı

Bu sürüm sınırlı bir arenadır; çok oyunculu, gerçek 3D, ekipman/envanter ve geniş açık dünya içermez. Denge ve gerçek cihaz performansı ayrıca test edilmelidir. İnternet izni Capacitor'un yerel WebView sunucusu için tanımlıdır; oyun dış ağa istek göndermez.

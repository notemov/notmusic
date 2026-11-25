# 🎵 NotMusic — Modern Masaüstü Müzik Oynatıcı

**NotMusic**, React, TypeScript ve Electron teknolojileriyle geliştirilmiş, sade ve hızlı bir açık kaynak Windows masaüstü müzik uygulamasıdır.

## ✨ Özellikler

- **🎧 Çoklu Platform Keşfi:** Tek arayüzden Spotify listeleri, Apple Music dünya listeleri ve YouTube Music trendlerini keşfetme ve arama.
- **📺 YouTube Video Modu:** Yalnızca YouTube kaynaklı parçalarda isteğe bağlı mini video oynatıcı desteği (Spotify ve Apple Music için saf ses odaklı deneyim).
- **🎤 Senkronize Şarkı Sözleri (Lyrics):** LRCLIB API üzerinden canlı zaman damgalı şarkı sözleri ve söze tıklayarak saniyeye atlama.
- **📊 Ses Spektrum Görselleştirici:** Çubuk, dalga ve döngü modlarıyla 60 FPS Canvas görselleştirici.
- **🔊 Arka Planda Kesintisiz Oynatma:** Pencere kapatılsa (X) dahi Sistem Tepsisinde (System Tray) oynatmaya devam eder; medya tuşları desteklenir.
- **❤️ Kitaplık & Yerel Depolama:** Beğenilen şarkılar, özel çalma listeleri, dinleme geçmişi ve çevrim dışı önbellek yönetimi.
- **⏱️ Uyku Zamanlayıcısı & Kişiselleştirme:** Uygulama adı/logosu özelleştirme ve otomatik durdurma zamanlayıcısı.

## 🛠️ Teknoloji Yığını

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite, Lucide Icons
- **Desktop:** Electron (Single-instance lock, System Tray, Global Media Shortcuts)
- **Backend:** Express 5 (Yerel API ve önbellek yönetimi)
- **Test:** Node.js Test Runner + TSX ile 4 katmanlı otomatik E2E doğrulama (`npm test`)

## 🚀 Geliştirici Kurulumu

Projeyi kaynak kodundan çalıştırmak için:

```bash
# 1. Depoyu klonlayın
git clone https://github.com/notemov/notmusic.git
cd notmusic

# 2. Bağımlılıkları yükleyin
npm install

# 3. Geliştirici modunda başlatın
npm run dev

# 4. Üretim derlemesi & masaüstü penceresi
npm run build
npx electron electron/main.cjs

# 5. Otomatik testleri çalıştırın
npm test
```

## 📦 Windows Kurulumu (Son Kullanıcılar)

Hazır Windows kurulum dosyasını [Releases (Sürümler)](https://github.com/notemov/notmusic/releases) sayfasından indirebilirsiniz (`NotMusic_Kurulum.exe`).

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında açık kaynak olarak sunulmaktadır.

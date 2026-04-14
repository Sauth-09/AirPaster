Sen uzman bir Chrome Eklentisi (Manifest V3) ve Web geliştiricisisin. İki farklı ağdaki cihaz (Bilgisayar ve Mobil) arasında anlık metin/link aktarımı sağlayan, Firebase Realtime Database tabanlı bir "Bulut Pano" (Cloud Clipboard) projesi geliştireceğiz.

Lütfen bu projeyi modüler, temiz ve profesyonel bir kod yapısıyla oluştur. Kodları tek seferde yazmak yerine, aşağıda belirttiğim "Geliştirme Adımları"na harfiyen uyarak adım adım ilerle. Her adımın sonunda benden onay bekle.

# KULLANILACAK TEKNOLOJİLER
* Frontend 1: Chrome Extension (Manifest V3, HTML, CSS, Vanilla JS)
* Frontend 2: Mobil Web Sayfası (HTML, CSS, Vanilla JS, Responsive tasarım)
* Backend: Firebase Realtime Database (Firebase Web SDK v9 - Modular)
* Yardımcı Kütüphane: QR Kod oluşturmak için qrcode.js (Eklenti içine dahil edilecek)

# DOSYA YAPISI
Projeyi kök dizinde iki ana klasöre ayır:
/extension (Chrome eklentisi dosyaları)
/mobile-web (GitHub Pages'e yüklenecek mobil arayüz dosyaları)

# SİSTEM MİMARİSİ VE İŞ AKIŞI
1. Kullanıcı bilgisayarda eklentiye tıklar.
2. Eklenti (popup.js) rastgele bir "room_id" (örn: 1453-876) üretir.
3. Eklenti, mobil web sayfasının URL'sinin sonuna bu ID'yi ekler (örn: https://ornek-site.com/?room=1453-876) ve bunu bir QR Koda çevirip popup'ta gösterir.
4. Eklenti, Firebase üzerinde bu "room_id" düğümünü dinlemeye (onValue) başlar.
5. Kullanıcı telefonuyla QR kodu okutur ve mobil web sayfasına gider. Sayfa, URL'deki "room" parametresini okur.
6. Mobil sayfada büyük bir textarea ve "Gönder" butonu vardır. Butona basılınca, metin Firebase'deki o "room_id" düğümüne yazılır (set veya update).
7. Eklenti değişikliği anında yakalar, Firebase'den veriyi çeker, kullanıcının bilgisayar panosuna (Clipboard API) kopyalar ve popup'ta "Kopyalandı!" mesajı gösterir.

# GELİŞTİRME ADIMLARI
Adım 1: Temel İskelet ve Firebase Yapılandırması
* Dosya yapısını oluştur.
* /extension ve /mobile-web klasörleri içine `firebase-config.js` dosyaları oluştur. Firebase bilgilerimi daha sonra girebilmem için bu dosyaları birer "placeholder" nesnesiyle (apiKey, authDomain vb.) hazırla. (Firebase SDK v9 modüler yapısını kullan).

Adım 2: Mobil Web Arayüzü (Gönderici)
* /mobile-web/index.html, styles.css ve app.js dosyalarını oluştur.
* Mobil uyumlu, modern ve sade bir UI tasarla. Sadece bir metin kutusu ve büyük bir buton olsun.
* app.js içinde URL'den '?room=' parametresini okuyan fonksiyonu yaz.
* Firebase'e bağlanıp, input içindeki veriyi ilgili room_id altına yazan fonksiyonu ekle.

Adım 3: Chrome Eklentisi Temeli (Kabul Edici)
* /extension/manifest.json dosyasını Manifest V3 standartlarına göre oluştur. Gerekli izinleri (clipboardWrite vb.) ekle.
* /extension/popup.html ve popup.css dosyalarını oluştur. İçinde QR kodun gösterileceği bir div ve durum mesajlarının (Bekleniyor, Kopyalandı) yazacağı bir alan olsun.

Adım 4: Eklenti Mantığı ve QR Kod
* /extension klasörüne uygun bir `qrcode.min.js` (veya benzeri) kütüphanesini dahil ettiğini varsayarak kod yaz (Manifest V3 harici scriptlere izin vermediği için kütüphane lokalde olmalı).
* /extension/popup.js dosyasını yaz: Rastgele ID üret, mobil web URL'si ile birleştirip QR kod oluştur.
* Firebase'i dinle. Yeni veri geldiğinde `navigator.clipboard.writeText()` kullanarak veriyi bilgisayar panosuna kopyala ve Firebase'deki o odayı temizle/sil.

Her bir adımı tek tek, eksiksiz ve üretim ortamına (production) hazır kalitede kodla. Hata yönetimi (error handling) eklemeyi unutma (örn: QR okutulmadan metin gönderilmeye çalışılırsa uyarı ver).

Şimdi sadece Adım 1'i tamamla ve beklediğin onayı sor.
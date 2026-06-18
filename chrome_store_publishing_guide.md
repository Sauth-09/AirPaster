# 🚀 AirPaste Chrome Web Store Yayınlama Kılavuzu

Bu kılavuz, AirPaste Chrome eklentisini Google Chrome Web Store'da başarılı, hızlı ve sorunsuz bir şekilde yayınlamanız için hazırlanmıştır. Kılavuz; teknik paket hazırlığından mağaza tanıtım yazılarına, gizlilik politikasından onay sürecindeki inceleme (review) detaylarına kadar her şeyi içerir.

---

## 📋 İÇİNDEKİLER
1. [Adım Adım Yayınlama Süreci](#1-adım-adım-yayınlama-süreci)
2. [Eklenti Paketini (ZIP) Hazırlama](#2-eklenti-paketini-zip-hazırlama)
3. [Mağaza Tanıtım ve Arama Detayları (Metadata)](#3-mağaza-tanıtım-ve-arama-detayları-metadata)
   - [Türkçe Tanıtım Metinleri](#türkçe-tanıtım-metinleri)
   - [İngilizce Tanıtım Metinleri (Global)](#ingilizce-tanıtım-metinleri-global)
4. [Görsel Materyal Gereksinimleri (Store Assets Checklist)](#4-görsel-materyal-gereksinimleri-store-assets-checklist)
5. [Gizlilik Politikası (Privacy Policy) Taslağı](#5-gizlilik-politikası-privacy-policy-taslağı)
6. [Onay Sürecini Hızlandırmak İçin Önemli Notlar](#6-onay-sürecini-hızlandırmak-için-önemli-notlar)

---

## 1. Adım Adım Yayınlama Süreci

1. **Geliştirici Hesabı Oluşturun:**
   * [Google Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/) sayfasına gidin.
   * Geliştirici olmak istediğiniz Google hesabıyla giriş yapın.
   * Tek seferlik **5 USD** olan Google geliştirici kayıt ücretini ödeyin.

2. **Yeni Öğe Ekleme:**
   * Dashboard'da sağ üstteki **"Yeni öğe ekle" (Add new item)** butonuna tıklayın.
   * Hazırladığınız eklenti ZIP dosyasını yükleyin (bknz: Bölüm 2).

3. **Mağaza Listesi Bilgilerini Doldurun:**
   * **Ürün Detayları:** Tanıtım metinlerini, kategoriyi ve dilleri girin (bknz: Bölüm 3).
   * **Görseller:** Logoları, ekran görüntülerini ve tanıtım banner'larını yükleyin (bknz: Bölüm 4).

4. **Gizlilik ve İzin Bildirimlerini Tamamlayın:**
   * İzinlerin (`clipboardWrite`, `storage`, Firebase host izinleri) neden gerekli olduğunu açıklayın (bknz: Bölüm 6).
   * Gizlilik Politikası linkinizi ekleyin (bknz: Bölüm 5).

5. **İncelemeye Gönderin:**
   * Her şey tamamlandığında sağ üstteki **"İncelemeye Gönder" (Submit for review)** butonuna tıklayın. İnceleme süresi genellikle **2 ila 5 iş günü** sürer.

---

## 2. Eklenti Paketini (ZIP) Hazırlama

> [!WARNING]
> Projenin kök dizinindeki tüm dosyaları (özellikle `node_modules`, `mobile-web`, `.git` vb.) ZIP dosyasına dahil **etmemelisiniz**. Sadece eklenti için derlenmiş ve gerekli olan klasörü sıkıştırmalısınız.

### Paketleme Adımları:
1. Terminalde proje kök dizinindeyken son güncel derlemeyi alın:
   ```bash
   npm run build:extension
   ```
2. Bilgisayarınızda `extension` klasörünün içine girin.
3. **Yalnızca `extension` klasörünün içindeki** şu dosya ve klasörleri seçin:
   * `dist/` (Popup ve Options bundle kodları)
   * `icons/` (Eklenti logoları - 16x16, 48x48, 128x128)
   * `src/` (Reviewer'ların inceleyebilmesi için orijinal kaynak kodlar)
   * `manifest.json`
   * `options.html`
   * `popup.css`
   * `popup.html`
4. Bu seçili dosyaları sağ tıklayarak **`AirPaste_v3.zip`** adıyla sıkıştırın.
5. ZIP dosyasının içini açtığınızda `manifest.json` dosyasının doğrudan en üst dizinde (kök) yer aldığından emin olun (klasör içinde klasör olmamalıdır).

---

## 3. Mağaza Tanıtım ve Arama Detayları (Metadata)

### Türkçe Tanıtım Metinleri

* **Eklenti Adı (Name):** AirPaste — Cihazlar Arası Güvenli Pano ve Dosya Paylaşımı
* **Tek Cümlelik Açıklama (Summary):** Bilgisayarınız ve telefonunuz arasında uçtan uca şifreli metin, link ve fotoğraf paylaşmanın en hızlı ve kablosuz yolu. (Maksimum 160 karakter)
* **Kategori:** Araçlar (Productivity / Developer Tools)
* **Arama Anahtar Kelimeleri (Tags):** airpaste, pano paylaşımı, clipboard sync, dosya gönder, qr transfer, e2e transfer, kablosuz aktarım

#### Detaylı Açıklama (Description)
```text
✈️ AirPaste: İki Cihaz Arasında Metin, Link ve Dosya Paylaşmanın En Hızlı Yolu!

Telefonunuz ile bilgisayarınız arasında dosya, fotoğraf veya uzun metinleri aktarmak için artık kendinize e-posta atmaya veya karmaşık mesajlaşma uygulamalarını kullanmaya son verin. AirPaste, kablo gerektirmeden, saniyeler içinde cihazlarınızı eşleştirir ve verilerinizi aktarır.

Üstelik tamamen Uçtan Uca Şifreli (E2E) ve açık kaynak kodlu!

✨ NELER YAPABİLİRSİNİZ?
- 📋 Metin ve Link Paylaşımı: Bilgisayardaki uzun bir metni veya makale linkini anında telefonunuza gönderin. Gelen linkleri tek tıkla tarayıcıda açın.
- 📸 Fotoğraf ve Belge Gönderimi: Fotoğrafları (otomatik sıkıştırma desteğiyle), PDF, Word, Excel veya ZIP gibi dosyaları (2MB'a kadar ücretsiz veya WebRTC aracılığıyla doğrudan) anında iletin.
- 📱 Telefon-Telefon Transferi (Yeni PWA): QR kod oluşturup başka bir telefonla taratarak iki mobil cihaz arasında da doğrudan transfer yapın.
- ⚡ Hızlı Yeniden Bağlantı: Bir kez eşleştikten sonra, 10 dakika boyunca QR kod okutmadan tek tıkla tekrar bağlanabilirsiniz.

🔒 MAKSİMUM GÜVENLİK (Uçtan Uca Şifreleme)
AirPaste, güvenliğinizi en üst düzeyde tutar. Tüm verileriniz tarayıcınızda veya telefonunuzda Web Crypto API kullanılarak AES-256-GCM algoritması ile şifrelenir. 
Şifreleme anahtarı yalnızca cihazlarınız arasındadır ve sunucuya asla ulaşmaz. Verileriniz transfer tamamlandığı anda sunucudan kalıcı olarak silinir.

🚀 NASIL KULLANILIR?
1. Chrome'da AirPaste ikonuna tıklayın ve QR kodunuzu hazır hale getirin.
2. Telefonunuzun kamerası ile QR kodu taratın (Uygulama yüklemenize gerek yoktur, PWA olarak yüklenebilir).
3. Metninizi yazın veya dosyanızı seçip gönderin. Saniyeler içinde diğer cihaza ulaşacaktır!

Herhangi bir üyelik, kablo veya aynı WiFi ağına bağlı olma zorunluluğu yoktur. Tamamen özgür ve hızlı!

⭐ Uygulamayı beğendiyseniz lütfen puan vermeyi ve yorum bırakmayı unutmayın!
```

---

### İngilizce Tanıtım Metinleri (Global)

* **Eklenti Adı (Name):** AirPaste — Secure Clipboard & File Sharing
* **Tek Cümlelik Açıklama (Summary):** The fastest, end-to-end encrypted way to instantly share text, links, and photos between your computer and phone via QR code.
* **Kategori:** Productivity / Developer Tools
* **Arama Anahtar Kelimeleri (Tags):** airpaste, clipboard share, cloud clipboard, send file, qr transfer, secure copy, e2e clipboard

#### Detaylı Açıklama (Description)
```text
✈️ AirPaste: The Fastest Way to Share Text, Links, and Files Between Devices!

Stop emailing yourself or using complex messaging apps just to send a link, a password, or a photo between your computer and phone. AirPaste pairs your devices in seconds and transfers your data instantly—no cables required.

Best of all, it is fully End-to-End Encrypted (E2E) and open-source!

✨ KEY FEATURES:
- 📋 Seamless Text & Link Share: Instantly send long texts, snippets, or article URLs. Open received links with a single click.
- 📸 Photo & Document Transfer: Share photos (with auto-compression), PDFs, spreadsheets, or ZIP files instantly (up to 2MB via cloud or larger via direct WebRTC).
- 📱 Phone-to-Phone Transfer: Host rooms directly from your mobile device via PWA and transfer data between two phones.
- ⚡ Quick Reconnect: Reconnect with a single click within 10 minutes without scanning the QR code again.

🔒 ULTIMATE PRIVACY (End-to-End Encrypted)
Your privacy is our priority. All data is encrypted locally on your device using the AES-256-GCM algorithm via the Web Crypto API before being transmitted.
The encryption key remains strictly on your devices and never touches our servers. Data is immediately and permanently deleted from our servers as soon as the transfer is complete.

🚀 HOW TO USE:
1. Click the AirPaste icon in Chrome to display your unique QR code.
2. Scan the QR code with your phone's camera (No app installation needed, runs instantly on mobile web or can be installed as a PWA).
3. Type your text or choose a file, and send! It will arrive on the other device in a flash.

No registrations, no cables, and no need to be on the same Wi-Fi network. Completely free and secure!

⭐ If you love AirPaste, please leave us a 5-star review!
```

---

## 4. Görsel Materyal Gereksinimleri (Store Assets Checklist)

Chrome Web Store'da listelenmek için aşağıdaki görselleri hazırlamanız gerekir. Bu görselleri oluştururken premium, modern, koyu mod ve pastel renklerin ağırlıkta olduğu (AirPaste marka renkleri) bir tasarım dili kullanmanız önerilir.

* **[ ] Eklenti Logosu (Icon):**
  * Boyut: **128 x 128 piksel** (Ayrıca manifest'te bulunan 16x16 ve 48x48 boyutları da gereklidir).
  * Format: PNG (Şeffaf arka plan tercih edilir).
* **[ ] Ekran Görüntüleri (Screenshots) - En az 1, en fazla 5 adet:**
  * Boyut: **1280 x 800** veya **640 x 400 piksel**.
  * İçerik: Eklentinin popup arayüzü, QR kod ekranı ve mobil cihazdaki dosya alım ekranı (üzerinde açıklayıcı kısa yazılarla birlikte).
* **[ ] Küçük Tanıtım Görseli (Small Promo Tile - Zorunlu):**
  * Boyut: **440 x 280 piksel**.
  * Mağazada arama sonuçlarında veya önerilenlerde görünecek ana görseldir. Sade, şık bir logo ve eklenti adı içermelidir.
* **[ ] Büyük Tanıtım Görseli (Large Promo Tile - İsteğe Bağlı):**
  * Boyut: **1400 x 560 piksel**.

---

## 5. Gizlilik Politikası (Privacy Policy) Taslağı

> [!IMPORTANT]
> Chrome Web Store, panoya erişim izni (`clipboardWrite`) ve dış sunucu bağlantısı (`host_permissions`) isteyen eklentiler için **Gizlilik Politikası (Privacy Policy)** URL'si girilmesini zorunlu kılar. Bu politikayı kişisel web sitenizde veya projenizin GitHub Pages adresinde (örn: `https://sauth-09.github.io/AirPaster/privacy.html`) barındırabilirsiniz.

Aşağıdaki taslağı kullanabilirsiniz:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AirPaste — Privacy Policy</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }
        h1 { color: #4285F4; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; }
        .highlight { background-color: #f4f8ff; border-left: 4px solid #4285F4; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Privacy Policy for AirPaste</h1>
    <p><strong>Effective Date:</strong> May 26, 2026</p>

    <p>AirPaste ("we", "our", or "us") operates the AirPaste Chrome Extension and the AirPaste PWA. We are highly committed to protecting your privacy and security. This Privacy Policy describes how we handle user data.</p>

    <div class="highlight">
        <strong>Zero Personal Data Collection:</strong> AirPaste does NOT collect, store, or sell any personal data, accounts, browsing history, or identities. No registration or account creation is required to use AirPaste.
    </div>

    <h2>1. Data Handling & End-to-End Encryption (E2E)</h2>
    <p>All data shared between your devices (including text, URLs, and files) is encrypted locally in your browser or PWA using the <strong>AES-256-GCM</strong> algorithm (Web Crypto API) before transmission.</p>
    <ul>
        <li><strong>No Server Access to Decrypted Data:</strong> The encryption/decryption keys are generated locally and stored temporarily in your device's local memory or URL fragments (hashes). These keys are never transmitted to our servers (Firebase). Consequently, we cannot read your shared data.</li>
        <li><strong>Instant Deletion:</strong> The encrypted payload is processed through Firebase Realtime Database. As soon as the target device successfully downloads or receives the data, the record is immediately and permanently deleted from our servers.</li>
    </ul>

    <h2>2. Permissions Explained</h2>
    <p>To provide seamless device synchronization, the extension requests the following permissions:</p>
    <ul>
        <li><strong>clipboardWrite:</strong> Used solely to allow you to easily copy received text to your computer's clipboard with a single click. We do NOT read your clipboard without your explicit request or run background clipboard logging.</li>
        <li><strong>storage:</strong> Used locally on your device to store options (such as language preference or recent device connection state) to enhance user experience.</li>
        <li><strong>notifications:</strong> Used to display desktop notifications when a file or text is successfully received from your phone.</li>
        <li><strong>Host Permissions (*.firebaseio.com, *.firebasedatabase.app):</strong> Required to establish connection to the Firebase Realtime Database to exchange encrypted payloads during transmission.</li>
    </ul>

    <h2>3. Changes to This Policy</h2>
    <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

    <h2>4. Contact Us</h2>
    <p>If you have any questions about this Privacy Policy or the security of AirPaste, please contact us via our GitHub Repository: <a href="https://github.com/Sauth-09/AirPaster" target="_blank">https://github.com/Sauth-09/AirPaster</a></p>
</body>
</html>
```

---

## 6. Onay Sürecini Hızlandırmak İçin Önemli Notlar

Google mühendisleri eklentinizi incelerken, güvenlik ve izin kullanımı konusunda oldukça hassastır. Dashboard'da **"Single-Purpose Description"** ve **"Permission Justification"** alanlarını doldururken aşağıdaki açıklamaları kullanmanız onay sürecinizi büyük ölçüde hızlandıracaktır:

### 🔑 İzin Gerekçelendirmeleri (Permission Justifications)

1. **`clipboardWrite` Gerekçesi:**
   * *Açıklama (EN):* "This permission is strictly used to allow users to copy received text or links from their mobile device directly into their computer's clipboard by clicking the 'Copy' button in the extension popup."

2. **`storage` Gerekçesi:**
   * *Açıklama (EN):* "We use local chrome.storage to persist user configuration preferences (such as preferred language) and temporary session configuration metadata (such as active roomId for auto-reconnection)."

3. **`notifications` Gerekçesi:**
   * *Açıklama (EN):* "This permission is used to display a subtle, non-intrusive desktop notification when a file or clipboard data is successfully received from the paired mobile device."

### 🛡️ Güvenlik ve Uçtan Uca Şifreleme Beyanı

İnceleme aşamasında, eklentinin üçüncü taraf sunuculara veri aktardığı (Firebase) tespit edilecektir. İnceleme formundaki **"Data Safety & Privacy"** alanında şunları belirtin:
* Eklentinin kullanıcı verilerini toplamadığını ve üçüncü şahıslara satmadığını beyan edin.
* Verilerin tamamının sunucuya gönderilmeden önce istemci tarafında **Web Crypto API (AES-256-GCM)** ile şifrelendiğini ve sunucunun verinin içeriğine asla erişemediğini açıkça yazın.

---

Bu kılavuzdaki adımları uyguladığınızda eklentiniz Chrome Web Store standartlarına tam uyumlu olacak ve hızlıca onay alacaktır! Bol şanslar! 🚀

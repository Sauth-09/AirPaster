<div align="center">

# ✈️ AirPaste

### Telefonundan Bilgisayarına Anında Metin Gönder

[![Chrome](https://img.shields.io/badge/Chrome-Eklenti-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://github.com/Sauth-09/AirPaster)
[![License: MIT](https://img.shields.io/badge/Lisans-MIT-34D399?style=for-the-badge)](LICENSE)

<br/>

Telefonunuzdaki bir metni veya linki **bilgisayarınıza anında aktarın.**
<br/>Kablo yok. Uygulama yükleme yok. Sadece QR kodu okut ve gönder.

<br/>

```
📋 Eklentiyi aç  →  📱 QR'ı okut  →  ✍️ Metni yaz  →  💻 Bilgisayarına geldi!
```

</div>

<br/>

## 🤔 Nedir?

AirPaste, bilgisayarınız ile telefonunuz arasında **metin ve link paylaşmanızı** sağlayan basit bir Chrome eklentisidir.

Örneğin:
- 📱 Telefonunuzda gördüğünüz bir linki bilgisayara göndermek istiyorsunuz
- 📝 Telefonunuzdaki bir notu hızlıca bilgisayara aktarmak istiyorsunuz
- 🔑 Bir kodu veya şifreyi cihazlar arasında taşımak istiyorsunuz

AirPaste bunların hepsini **2 saniyede** halleder.

## 📖 Nasıl Kullanılır?

<table>
<tr>
<td align="center" width="25%">

### 1️⃣
**Eklentiyi Aç**
<br/><br/>
Chrome'da sağ üstteki AirPaste ikonuna tıklayın. Bir QR kod ve oda numarası görünecek.

</td>
<td align="center" width="25%">

### 2️⃣
**QR Kodu Okut**
<br/><br/>
Telefonunuzun kamerasıyla QR kodu tarayın. Otomatik olarak bir web sayfası açılacak.

</td>
<td align="center" width="25%">

### 3️⃣
**Metni Yaz & Gönder**
<br/><br/>
Açılan sayfada metin kutusuna istediğinizi yazın ve **"Send to Computer"** butonuna basın.

</td>
<td align="center" width="25%">

### 4️⃣
**Hazır! ✅**
<br/><br/>
Metin anında bilgisayarınızın panosuna kopyalanır. Herhangi bir yere **Ctrl+V** ile yapıştırın.

</td>
</tr>
</table>

## ⚡ Özellikler

- 🔒 **Güvenli** — Veriler geçicidir, okunur okunmaz silinir
- 📡 **Anlık** — Gönder'e bastığınız anda bilgisayarınıza gelir
- 🌐 **Kablosuz** — Aynı WiFi'da olmanıza bile gerek yok
- 📱 **Uygulama Gerektirmez** — Telefonunuzda hiçbir şey yüklemenize gerek yok
- ✏️ **10.000 karakter** — Uzun metinleri bile gönderebilirsiniz
- 🔄 **Sınırsız gönderim** — Aynı oturumda istediğiniz kadar metin gönderin

## 🚀 Kurulum

### Chrome Eklentisini Yükleme

1. Bu projeyi indirin: **Code → Download ZIP** veya:
   ```bash
   git clone https://github.com/Sauth-09/AirPaster.git
   ```

2. Chrome'da adres çubuğuna `chrome://extensions` yazın

3. Sağ üst köşeden **Geliştirici modu**'nu açın

4. **"Paketlenmemiş öğe yükle"** butonuna tıklayın

5. İndirdiğiniz klasördeki `extension/` klasörünü seçin

6. ✅ Hazır! Araç çubuğunda AirPaste ikonu görünecek

## ❓ Sık Sorulan Sorular

<details>
<summary><b>Telefonuma uygulama yüklemem gerekiyor mu?</b></summary>
<br/>
Hayır! Telefonunuzda herhangi bir uygulama yüklemenize gerek yok. QR kodu okuttuğunuzda açılan web sayfası her şeyi halleder.
</details>

<details>
<summary><b>Cihazlarım aynı WiFi'da olmalı mı?</b></summary>
<br/>
Hayır! AirPaste internet üzerinden çalışır. Telefonunuz mobil veriyle, bilgisayarınız kablolu internetle bağlı olsa bile çalışır.
</details>

<details>
<summary><b>Gönderdiğim metinler güvende mi?</b></summary>
<br/>
Evet. Metin bilgisayarınıza ulaştığı anda sunucudan otomatik olarak silinir. Kimse göremez.
</details>

<details>
<summary><b>Dosya gönderebilir miyim?</b></summary>
<br/>
Şu anda sadece metin ve link gönderimi desteklenmektedir. Dosya paylaşımı gelecek sürümlerde planlanmaktadır.
</details>

<details>
<summary><b>Hangi tarayıcılarda çalışır?</b></summary>
<br/>
Eklenti Google Chrome üzerinde çalışır. Mobil taraftaki web sayfası ise tüm modern tarayıcılarda (Safari, Chrome, Firefox) çalışır.
</details>

## 🛠️ Geliştiriciler İçin

<details>
<summary><b>Projeyi geliştirme ortamında çalıştırma</b></summary>
<br/>

```bash
# Bağımlılıkları yükle
npm install

# Tüm bileşenleri derle
npm run build

# Geliştirme modu (otomatik yeniden derleme)
npm run dev
```

**Kullanılan Teknolojiler:**
- Chrome Extension (Manifest V3)
- Firebase Realtime Database
- Vanilla HTML / CSS / JavaScript
- esbuild (bundler)
- GitHub Pages (mobil web barındırma)

</details>

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile açık kaynak olarak sunulmaktadır.

---

<div align="center">

⭐ Projeyi beğendiyseniz bir **yıldız** bırakmayı unutmayın!

<sub>Geliştirici: <a href="https://github.com/Sauth-09">Sauth-09</a></sub>

</div>
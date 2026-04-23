// ---------------------------------------------------------------------------
// i18n Service (Mobile Web)
// ---------------------------------------------------------------------------

const translations = {
  en: {
    tagline: "Send text to your computer",
    e2eEncrypted: "🔒 End-to-end encrypted",
    connectedToRoom: "Connected to room",
    noRoomTitle: "No Room Connected",
    noRoomDesc: "Scan the QR code from the AirPaste extension on your computer to connect.",
    reconnectBtn: "🔄 Reconnect to last room",
    reconnectInfoBase: "Room {roomId} · {timeAgo}",
    inputLabel: "Your text or link",
    inputPlaceholder: "Paste or type anything here...",
    sendBtn: "Send to Computer",
    photoBtn: "📸 Photo",
    fileBtn: "📁 File",
    fromComputerLabel: "📥 From Computer",
    openBtn: "🔗 Open",
    copyBtn: "📋 Copy",
    historyBtn: "📜 History",
    historyClear: "🗑️ Clear All",
    noHistory: "No history yet",
    footerText: "AirPaste — Cloud Clipboard",
    // Dynamic
    fileSending: "Sending {filename}...",
    justNow: "just now",
    minAgo: "{min} min ago",
    copiedToast: "Copied!",
    pastedToast: "Pasted into text box",
    enterTextToast: "Enter some text first",
    maxCharsToast: "Max {max} characters",
    sentToComputerToast: "Sent to computer!",
    failedToSendToast: "Failed to send",
    fileSentToast: "{filename} sent!",
    decryptFailedToast: "Decryption failed",
    receivedFromPctoast: "Received from computer!",
    noFileSelected: "No file selected",
    fileTooLarge: "File too large ({size}MB). Max 2MB.",
    fileStillTooLarge: "File is still too large ({size}MB) even after processing. Max 2MB.",
    // QR Scanner
    scanQRBtn: "📷 Scan QR Code",
    scanQRHint: "Point camera at the QR code on your computer",
    stopScanBtn: "✕ Close Scanner",
    cameraAccessDenied: "Camera access denied. Please enable it in settings.",
    roomConnected: "Connected to room {roomId}!",
    qrScannerTitle: "Scan QR Code",
    // Share Target
    shareReadyTitle: "Share Ready!",
    shareReadyDesc: "Scan the QR code on your computer screen to connect and send.",
    sendingToRoom: "Sending to room {roomId}...",
    sendingNow: "Sending...",
    sentSuccessTitle: "Sent!",
    sentSuccessDesc: "Your content has been sent to the computer.",
    closeBtn: "Close",
    sendErrorTitle: "Failed to Send",
    sendErrorDesc: "Something went wrong.",
    retryBtn: "Try Again",
    noShareData: "No Shared Content",
    noShareDataDesc: "Open this app from your phone's share menu to send content.",
    // PWA
    installPWA: "Install App",
    fileReceivedLabel: "📎 File Received"
  },
  tr: {
    tagline: "Bilgisayarına anında gönder",
    e2eEncrypted: "🔒 Uçtan uca şifreli",
    connectedToRoom: "Odaya bağlanıldı",
    noRoomTitle: "Odaya Bağlı Değilsiniz",
    noRoomDesc: "Bağlanmak için bilgisayarınızdaki AirPaste eklentisinden QR kodu okutun.",
    reconnectBtn: "🔄 Son odaya yeniden bağlan",
    reconnectInfoBase: "Oda {roomId} · {timeAgo}",
    inputLabel: "Metin veya link girin",
    inputPlaceholder: "Buraya yazın veya yapıştırın...",
    sendBtn: "Bilgisayara Gönder",
    photoBtn: "📸 Fotoğraf",
    fileBtn: "📁 Dosya",
    fromComputerLabel: "📥 Bilgisayardan Gelen",
    openBtn: "🔗 Aç",
    copyBtn: "📋 Kopyala",
    historyBtn: "📜 Geçmiş",
    historyClear: "🗑️ Tümünü Sil",
    noHistory: "Geçmiş boş",
    footerText: "AirPaste — Cloud Clipboard",
    // Dynamic
    fileSending: "{filename} gönderiliyor...",
    justNow: "az önce",
    minAgo: "{min} dk önce",
    copiedToast: "Kopyalandı!",
    pastedToast: "Metin kutusuna yapıştırıldı",
    enterTextToast: "Önce bir şeyler yazın",
    maxCharsToast: "Maksimum {max} karakter",
    sentToComputerToast: "Bilgisayara gönderildi!",
    failedToSendToast: "Gönderme başarısız",
    fileSentToast: "{filename} gönderildi!",
    decryptFailedToast: "Şifre çözülemedi",
    receivedFromPctoast: "Bilgisayardan veri geldi!",
    noFileSelected: "Dosya seçilmedi",
    fileTooLarge: "Dosya çok büyük ({size}MB). Maks 2MB.",
    fileStillTooLarge: "Dosya sıkıştırıldıktan sonra bile çok büyük ({size}MB). Maks 2MB.",
    // QR Scanner
    scanQRBtn: "📷 QR Kodu Tara",
    scanQRHint: "Kamerayı bilgisayarınızdaki QR koda tutun",
    stopScanBtn: "✕ Tarayıcıyı Kapat",
    cameraAccessDenied: "Kamera erişimi reddedildi. Lütfen ayarlardan izin verin.",
    roomConnected: "{roomId} odasına bağlandı!",
    qrScannerTitle: "QR Kodu Tara",
    // Share Target
    shareReadyTitle: "Gönderi Hazır!",
    shareReadyDesc: "Bağlanmak ve göndermek için ekrandaki QR kodu okutun.",
    sendingToRoom: "{roomId} odasına gönderiliyor...",
    sendingNow: "Gönderiliyor...",
    sentSuccessTitle: "Gönderildi!",
    sentSuccessDesc: "İçerik bilgisayara gönderildi.",
    closeBtn: "Kapat",
    sendErrorTitle: "Gönderilemedi",
    sendErrorDesc: "Bir hata oluştu.",
    retryBtn: "Tekrar Dene",
    noShareData: "Paylaşılan İçerik Yok",
    noShareDataDesc: "İçerik göndermek için telefonunuzun paylaşım menüsünden bu uygulamayı açın.",
    // PWA
    installPWA: "Uygulamayı Yükle",
    fileReceivedLabel: "📎 Dosya Alındı"
  }
};

export const createI18nService = () => {
  const browserLang = navigator.language || navigator.userLanguage || "en";
  const langcode = browserLang.toLowerCase().startsWith("tr") ? "tr" : "en";
  const tDict = translations[langcode];

  /**
   * Get translation for a key, optionally replacing variables '{varName}'
   * @param {string} key 
   * @param {Object} [vars]
   * @returns {string}
   */
  const t = (key, vars = {}) => {
    let text = tDict[key] || translations["en"][key] || key;
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
    return text;
  };

  /**
   * Initialize translations on the DOM
   */
  const initDom = () => {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (tDict[key]) {
         
         const textSpan = Array.from(el.querySelectorAll('span')).find(s => !s.id && !s.classList.contains('history-count-mobile') && s.textContent.trim() !== '');
         
         if (textSpan) {
            textSpan.textContent = t(key);
         } else if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
            el.textContent = t(key);
         } else if (el.tagName === 'LABEL' || el.tagName === 'P' || el.tagName === 'H2' || el.tagName === 'SPAN') {
            el.textContent = t(key);
         }
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (tDict[key]) {
         el.placeholder = t(key);
      }
    });
  };

  return Object.freeze({ t, initDom, lang: langcode });
};

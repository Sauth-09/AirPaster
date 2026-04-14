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
    fileStillTooLarge: "File is still too large ({size}MB) even after processing. Max 2MB."
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
    fileStillTooLarge: "Dosya sıkıştırıldıktan sonra bile çok büyük ({size}MB). Maks 2MB."
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

// ---------------------------------------------------------------------------
// i18n Service (Extension)
// ---------------------------------------------------------------------------

const translations = {
  en: {
    tagline: "Scan QR · Send Text · Done",
    e2eEncrypted: "End-to-end encrypted",
    roomLabel: "Room",
    waitingConnection: "Waiting for connection...",
    receivedLabel: "Received",
    openLink: "Open",
    downloadBtn: "Download",
    fileReceivedLabel: "📎 File Received",
    sendSectionLabel: "Send to Phone",
    sendInputPlaceholder: "Type text or paste a link...",
    historyBtn: "History",
    clearAll: "Clear All",
    noHistory: "No history yet",
    newRoomBtn: "New Room",
    photoBtn: "📸 Photo",
    fileBtn: "📁 File",
    settingsHeaderDesc: "Manage extension behavior and general preferences here.",
    settingsNotifTitle: "🔔 Notifications",
    settingsNotifDesktop: "Desktop Notifications",
    settingsNotifDesc: "Show a notification when a file or text is received.",
    settingsRoomTitle: "🔑 Room Security",
    settingsRoomSelect: "Room Selection / Refresh Time",
    settingsRoomDesc: "How long should the connection room remain the same each time you open the extension?",
    roomOptSession: "Create a new room on every launch",
    roomOpt10m: "Stay the same for 10 minutes",
    roomOpt1h: "Stay the same for 1 hour",
    roomOpt24h: "Stay the same for 24 hours (Default)",
    roomOptAlways: "Always use the same room",
    settingsAboutTitle: "ℹ️ About",
    settingsGithubBtn: "View on GitHub",
    settingsToast: "Settings saved!",
    // Dynamic
    qrError: "QR code generation failed",
    connError: "Connection error. Try a new room.",
    decryptError: "Decryption failed",
    fileReceived: "File received!",
    copiedClipboard: "Copied to clipboard!",
    linkCopied: "Link copied!",
    failedToCopy: "Failed to copy",
    waitingMore: "Waiting for more...",
    copiedAgain: "Copied again!",
    notifFileReceived: "📎 File received:",
    notifLinkCopied: "🔗 Link copied to clipboard",
    notifTextCopied: "📋 Text copied to clipboard",
  },
  tr: {
    tagline: "QR Okut · Gönder · Bitti",
    e2eEncrypted: "Uçtan uca şifreli",
    roomLabel: "Oda",
    waitingConnection: "Bağlantı bekleniyor...",
    receivedLabel: "Gelen",
    openLink: "Aç",
    downloadBtn: "İndir",
    fileReceivedLabel: "📎 Dosya Alındı",
    sendSectionLabel: "Telefona Gönder",
    sendInputPlaceholder: "Metin yazın veya link yapıştırın...",
    historyBtn: "Geçmiş",
    clearAll: "Tümünü Sil",
    noHistory: "Geçmiş boş",
    newRoomBtn: "Yeni Oda",
    photoBtn: "📸 Fotoğraf",
    fileBtn: "📁 Dosya",
    settingsHeaderDesc: "Uzantı davranışını ve genel tercihleri buradan yönetebilirsiniz.",
    settingsNotifTitle: "🔔 Bildirimler",
    settingsNotifDesktop: "Masaüstü Bildirimleri",
    settingsNotifDesc: "Dosya veya metin alındığında bildirim göster.",
    settingsRoomTitle: "🔑 Oda Güvenliği",
    settingsRoomSelect: "Oda Seçimi / Yenileme Süresi",
    settingsRoomDesc: "Uzantıyı her açtığınızda bağlantı odası ne kadar süre aynı kalsın?",
    roomOptSession: "Her açılışta yeni oda oluştur",
    roomOpt10m: "10 dakika boyunca aynı kalsın",
    roomOpt1h: "1 saat boyunca aynı kalsın",
    roomOpt24h: "24 saat boyunca aynı kalsın (Varsayılan)",
    roomOptAlways: "Her zaman aynı odayı kullan",
    settingsAboutTitle: "ℹ️ Hakkında",
    settingsGithubBtn: "GitHub'da Görüntüle",
    settingsToast: "Ayarlar kaydedildi!",
    // Dynamic
    qrError: "QR kod oluşturulamadı",
    connError: "Bağlantı hatası. Yeni oda açın.",
    decryptError: "Şifre çözülemedi",
    fileReceived: "Dosya alındı!",
    copiedClipboard: "Pano'ya kopyalandı!",
    linkCopied: "Link kopyalandı!",
    failedToCopy: "Kopyalama başarısız",
    waitingMore: "Yeni veriler bekleniyor...",
    copiedAgain: "Tekrar kopyalandı!",
    notifFileReceived: "📎 Dosya alındı:",
    notifLinkCopied: "🔗 Link kopyalandı",
    notifTextCopied: "📋 Metin kopyalandı",
  }
};

/**
 * Creates an i18n service instance.
 */
export const createI18nService = () => {
  // Determine language based on browser language (fallback to 'en')
  const browserLang = navigator.language || navigator.userLanguage || "en";
  const langcode = browserLang.toLowerCase().startsWith("tr") ? "tr" : "en";
  const tDict = translations[langcode];

  /**
   * Get translation for a key
   * @param {string} key 
   * @returns {string}
   */
  const t = (key) => tDict[key] || translations["en"][key] || key;

  /**
   * Initialize translations on the DOM
   */
  const initDom = () => {
    // Translate text chunks
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (tDict[key]) {
        el.childNodes.forEach(node => {
          // Replace only text nodes so we don't destroy SVGs or child spans inside buttons
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
            node.textContent = t(key);
          }
        });
        
        // If element has no text nodes but is a span, set textContent
        if (el.childNodes.length === 0 || (el.children.length === 1 && el.childNodes.length === 1 && el.tagName === "SPAN")) {
            el.textContent = t(key);
        } else if (el.querySelector('span:not([class*="-count"])')) {
             // specific fallback for our buttons with svg + span
            const textSpan = Array.from(el.querySelectorAll('span')).find(s => !s.id && !s.classList.contains('history-count') && s.textContent.trim() !== '');
            if(textSpan) textSpan.textContent = t(key);
        }
      }
    });

    // Translate placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (tDict[key]) {
         el.placeholder = t(key);
      }
    });
  };

  return Object.freeze({ t, initDom, lang: langcode });
};

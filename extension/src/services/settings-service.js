// ---------------------------------------------------------------------------
// Settings Service
// ---------------------------------------------------------------------------

export const createSettingsService = () => {
  const defaultSettings = {
    notificationsEnabled: true,
    roomRetention: "24h", // "session", "10m", "1h", "24h", "always"
  };

  const loadSettings = async () => {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get("airpaste_settings", (result) => {
          resolve({ ...defaultSettings, ...(result.airpaste_settings || {}) });
        });
      } else {
        // Fallback for local testing
        try {
          const stored = localStorage.getItem("airpaste_settings");
          if (stored) {
            resolve({ ...defaultSettings, ...JSON.parse(stored) });
            return;
          }
        } catch {}
        resolve(defaultSettings);
      }
    });
  };

  const saveSettings = async (settings) => {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ airpaste_settings: settings }, resolve);
      } else {
        try {
          localStorage.setItem("airpaste_settings", JSON.stringify(settings));
        } catch {}
        resolve();
      }
    });
  };

  return Object.freeze({ loadSettings, saveSettings });
};

import { createSettingsService } from "./services/settings-service.js";
import { createI18nService } from "./services/i18n-service.js";

const initOptions = async () => {
  const i18nService = createI18nService();
  i18nService.initDom();

  const settingsService = createSettingsService();
  const settings = await settingsService.loadSettings();

  const notifToggle = document.getElementById("notif-toggle");
  const roomRetention = document.getElementById("room-retention");
  const toast = document.getElementById("toast");

  // Set initial values
  notifToggle.checked = settings.notificationsEnabled !== false;
  roomRetention.value = settings.roomRetention || "24h";

  let saveTimeout;

  const showToast = () => {
    toast.classList.add("show");
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 2000);
  };

  const saveCurrentSettings = async () => {
    await settingsService.saveSettings({
      notificationsEnabled: notifToggle.checked,
      roomRetention: roomRetention.value,
    });
    showToast();
  };

  notifToggle.addEventListener("change", saveCurrentSettings);
  roomRetention.addEventListener("change", saveCurrentSettings);
};

document.addEventListener("DOMContentLoaded", initOptions);

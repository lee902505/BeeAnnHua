const I18N = {
  defaultLanguage: "zh-CN",
  storageKey: "xingchen-language",
  translations: {},

  async load(lang) {
    const response = await fetch(`data/i18n/${lang}.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load language: ${lang}`);
    this.translations = await response.json();
    this.apply(lang);
  },

  apply(lang) {
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (Object.prototype.hasOwnProperty.call(this.translations, key)) {
        element.textContent = this.translations[key];
      }
    });

    document.querySelectorAll(".lang-btn").forEach((button) => {
      const isActive = button.dataset.lang === lang;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    localStorage.setItem(this.storageKey, lang);
  },

  getInitialLanguage() {
    const saved = localStorage.getItem(this.storageKey);
    return ["zh-CN", "zh-TW", "en"].includes(saved) ? saved : this.defaultLanguage;
  }
};

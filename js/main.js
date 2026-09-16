document.addEventListener("DOMContentLoaded", async () => {
  const lang = I18N.getInitialLanguage();

  try {
    await I18N.load(lang);
  } catch (error) {
    console.error(error);
    if (lang !== I18N.defaultLanguage) {
      await I18N.load(I18N.defaultLanguage);
    }
  }

  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const nextLanguage = button.dataset.lang;
      if (!nextLanguage || nextLanguage === document.documentElement.lang) return;
      await I18N.load(nextLanguage);
    });
  });
});

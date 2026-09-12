(() => {
  const root = document.querySelector("[data-share-root]");
  if (!root) return;

  const url = window.location.href;
  const text = root.dataset.shareTitle || "اكتشف سوقنا سوريا للإعلانات المبوبة.";
  const combined = `${text}\n${url}`;
  const status = root.querySelector("[data-share-status]");

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const whatsapp = root.querySelector("[data-share-whatsapp]");
  const telegram = root.querySelector("[data-share-telegram]");
  const facebook = root.querySelector("[data-share-facebook]");
  if (whatsapp) whatsapp.href = `https://wa.me/?text=${encodeURIComponent(combined)}`;
  if (telegram) telegram.href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  if (facebook) facebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  root.querySelector("[data-share-copy]")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("تم نسخ الرابط.");
    } catch {
      setStatus(url);
    }
  });

  root.querySelector("[data-share-native]")?.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Souqna Syria", text, url });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("تم نسخ الرابط.");
    } catch {
      setStatus(url);
    }
  });
})();

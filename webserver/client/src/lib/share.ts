export type SharePayload = {
  url: string;
  text: string;
};

export function buildShareLinks({ url, text }: SharePayload) {
  const combined = `${text}\n${url}`;
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(combined)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };
}

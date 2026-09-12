import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { translate, type MobileLocale } from "./i18n";
import { webBaseUrl } from "./api";

function Notice({ title, detail, rtl }: { title: string; detail: string; rtl: boolean }) {
  return (
    <View style={styles.notice}>
      <View style={styles.badge}><Text style={styles.badgeText}>س</Text></View>
      <Text style={[styles.noticeTitle, { textAlign: rtl ? "right" : "left" }]}>{title}</Text>
      <Text style={[styles.noticeDetail, { textAlign: rtl ? "right" : "left" }]}>{detail}</Text>
    </View>
  );
}

export function MyListingsPanel({ locale }: { locale: MobileLocale }) {
  const rtl = locale === "ar";
  const t = (key: string, values?: Record<string, string | number>) => translate(locale, key, values);
  const [message, setMessage] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const openMyListings = async () => {
    setIsOpening(true);
    setMessage(t("openingMyListings"));
    try {
      const result = await WebBrowser.openBrowserAsync(`${webBaseUrl}/my-listings`);
      setMessage(result.type === "cancel" || result.type === "dismiss" ? t("browserCancelled") : t("browserOpenedMyListings"));
    } catch {
      setMessage(t("browserFailedMyListings"));
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <View style={styles.panel}>
      <Notice title={t("manageTitle")} detail={t("manageDetail")} rtl={rtl} />
      <View style={styles.statusCard}>
        <Text style={[styles.statusTitle, { textAlign: rtl ? "right" : "left" }]}>{t("myListingsStatus")}</Text>
        <Text style={[styles.statusDetail, { textAlign: rtl ? "right" : "left" }]}>{t("myListingsStatusDetail")}</Text>
      </View>
      <Pressable disabled={isOpening} style={[styles.button, isOpening && styles.buttonDisabled]} onPress={() => void openMyListings()}><Text style={styles.buttonText}>{isOpening ? t("opening") : t("openMyListings")}</Text></Pressable>
      {message && <Text style={[styles.message, { textAlign: rtl ? "right" : "left" }]}>{message}</Text>}
    </View>
  );
}

export function AccountPanel({ locale }: { locale: MobileLocale }) {
  const rtl = locale === "ar";
  const t = (key: string, values?: Record<string, string | number>) => translate(locale, key, values);
  const [message, setMessage] = useState<string | null>(null);
  const [opening, setOpening] = useState<"messages" | "notifications" | null>(null);

  const openProtectedPage = async (path: "messages" | "notifications", label: string) => {
    setOpening(path);
    setMessage(label === t("messages") ? t("openingMessages") : t("openingNotifications"));
    try {
      const result = await WebBrowser.openBrowserAsync(`${webBaseUrl}/${path}`);
      setMessage(result.type === "cancel" || result.type === "dismiss" ? t("browserCancelled") : t("browserOpenedProtected", { label }));
    } catch {
      setMessage(t("browserFailedProtected", { label }));
    } finally {
      setOpening(null);
    }
  };

  return (
    <View style={styles.panel}>
      <Notice title={t("signInTitle")} detail={t("signInDetail")} rtl={rtl} />
      <Pressable disabled={opening !== null} style={[styles.button, opening !== null && styles.buttonDisabled]} onPress={() => void openProtectedPage("messages", t("messages"))}> 
        <Text style={styles.buttonText}>{opening === "messages" ? t("opening") : t("openMessages")}</Text>
      </Pressable>
      <Pressable disabled={opening !== null} style={[styles.outlineButton, opening !== null && styles.outlineButtonDisabled]} onPress={() => void openProtectedPage("notifications", t("notificationsTitle"))}>
        <Text style={styles.outlineButtonText}>{opening === "notifications" ? t("opening") : t("openNotifications")}</Text>
      </Pressable>
      <View style={styles.notificationCard}>
        <Text style={[styles.notificationTitle, { textAlign: rtl ? "right" : "left" }]}>{t("chatTitle")}</Text>
        <Text style={[styles.notificationDetail, { textAlign: rtl ? "right" : "left" }]}>{t("chatDetail")}</Text>
      </View>
      <View style={styles.notificationCard}>
        <Text style={[styles.notificationTitle, { textAlign: rtl ? "right" : "left" }]}>{t("notificationsTitle")}</Text>
        <Text style={[styles.notificationDetail, { textAlign: rtl ? "right" : "left" }]}>{t("notificationsDetail")}</Text>
      </View>
      {message && <Text style={[styles.message, { textAlign: rtl ? "right" : "left" }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { marginTop: 18 },
  notice: { alignItems: "center", borderColor: "#ece6dc", borderRadius: 22, borderWidth: 1, backgroundColor: "#fff", padding: 26 },
  badge: { alignItems: "center", backgroundColor: "#f5edda", borderRadius: 17, height: 48, justifyContent: "center", width: 48 },
  badgeText: { color: "#b68b34", fontSize: 22, fontWeight: "900" },
  noticeTitle: { color: "#173f37", fontSize: 16, fontWeight: "900", marginTop: 14 },
  noticeDetail: { color: "#758078", fontSize: 13, lineHeight: 21, marginTop: 6 },
  button: { alignItems: "center", backgroundColor: "#1a5c50", borderRadius: 16, height: 52, justifyContent: "center", marginTop: 16 },
  buttonDisabled: { backgroundColor: "#799b91" },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  outlineButton: { alignItems: "center", borderColor: "#1a5c50", borderRadius: 16, borderWidth: 1, height: 48, justifyContent: "center", marginTop: 10 },
  outlineButtonDisabled: { borderColor: "#9db6ae" },
  outlineButtonText: { color: "#1a5c50", fontSize: 14, fontWeight: "900" },
  notificationCard: { backgroundColor: "#e7f0eb", borderRadius: 18, marginTop: 20, padding: 16 },
  notificationTitle: { color: "#173f37", fontSize: 14, fontWeight: "900" },
  notificationDetail: { color: "#59685f", fontSize: 12, lineHeight: 19, marginTop: 5 },
  statusCard: { backgroundColor: "#f5edda", borderRadius: 18, marginTop: 20, padding: 16 },
  statusTitle: { color: "#775b26", fontSize: 14, fontWeight: "900" },
  statusDetail: { color: "#806a3f", fontSize: 12, lineHeight: 19, marginTop: 5 },
  message: { color: "#1a5c50", fontSize: 13, lineHeight: 21, marginTop: 14 },
});

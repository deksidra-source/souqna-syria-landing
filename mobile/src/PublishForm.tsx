import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as WebBrowser from "expo-web-browser";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useState } from "react";
import { translate, type MobileLocale } from "./i18n";
import { webBaseUrl } from "./api";

const categories = ["العقارات", "السيارات", "الوظائف", "المستعمل", "الخدمات"] as const;
const draftStorageKey = "souqna-publish-draft-v1";

type DraftLocation = { latitude: number; longitude: number };
type PublishDraft = {
  category: (typeof categories)[number];
  title: string;
  province: string;
  imageUris: string[];
  location: DraftLocation | null;
};

export function PublishForm({ locale }: { locale: MobileLocale }) {
  const rtl = locale === "ar";
  const t = (key: string, values?: Record<string, string | number>) => translate(locale, key, values);
  const [category, setCategory] = useState<(typeof categories)[number]>("العقارات");
  const [title, setTitle] = useState("");
  const [province, setProvince] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [location, setLocation] = useState<DraftLocation | null>(null);
  const [isOpeningPublish, setIsOpeningPublish] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await AsyncStorage.getItem(draftStorageKey);
      if (!stored) return;
      try {
        const draft = JSON.parse(stored) as PublishDraft;
        if (categories.includes(draft.category)) setCategory(draft.category);
        setTitle(draft.title ?? "");
        setProvince(draft.province ?? "");
        setImageUris(Array.isArray(draft.imageUris) ? draft.imageUris : []);
        setLocation(draft.location ?? null);
        if (draft.location) setLocationNote(t("locationRestored", { latitude: draft.location.latitude.toFixed(4), longitude: draft.location.longitude.toFixed(4) }));
        setMessage(t("draftRestored"));
      } catch {
        await AsyncStorage.removeItem(draftStorageKey);
      }
    })();
  }, []);

  const categoryHint = category === "العقارات"
    ? t("publishHintRealEstate")
    : category === "السيارات"
      ? t("publishHintVehicles")
      : t("publishHintDefault");

  const submitDraft = async () => {
    if (title.trim().length < 8 || province.trim().length < 2) {
      setMessage(t("enterDetails"));
      return;
    }
    const draft: PublishDraft = { category, title: title.trim(), province: province.trim(), imageUris, location };
    await AsyncStorage.setItem(draftStorageKey, JSON.stringify(draft));
    setMessage(t("draftSaved"));
  };

  const continueOnWeb = async () => {
    setIsOpeningPublish(true);
    setMessage(t("draftOpenNotice"));
    try {
      const result = await WebBrowser.openBrowserAsync(`${webBaseUrl}/publish`);
      setMessage(result.type === "cancel" || result.type === "dismiss" ? t("browserCancelledDraft") : t("browserOpenedPublish"));
    } catch {
      setMessage(t("browserFailedPublish"));
    } finally {
      setIsOpeningPublish(false);
    }
  };

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage(t("imagePermission"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, selectionLimit: 8, quality: 0.7 });
    if (!result.canceled) {
      const selectedUris = result.assets.map(asset => asset.uri);
      setImageUris(selectedUris);
      setMessage(t("imagesPicked", { count: selectedUris.length }));
    }
  };

  const useCurrentLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setLocationNote(t("locationPermission"));
      return;
    }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const selectedLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    setLocation(selectedLocation);
    setLocationNote(t("locationSaved", { latitude: selectedLocation.latitude.toFixed(4), longitude: selectedLocation.longitude.toFixed(4) }));
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.helper, { textAlign: rtl ? "right" : "left" }]}>{t("publishHelper")}</Text>
      <Text style={[styles.label, { textAlign: rtl ? "right" : "left" }]}>{t("category")}</Text>
      <View style={[styles.categoryGrid, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        {categories.map(item => (
          <Pressable key={item} style={[styles.category, category === item && styles.categoryActive]} onPress={() => setCategory(item)}>
            <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{t(item === "العقارات" ? "realEstate" : item === "السيارات" ? "vehicles" : item === "الوظائف" ? "jobs" : item === "المستعمل" ? "used" : "services")}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.label, { textAlign: rtl ? "right" : "left" }]}>{t("listingTitle")}</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder={t("listingTitleExample")} placeholderTextColor="#938f85" style={styles.input} textAlign={rtl ? "right" : "left"} returnKeyType="next" />
      <Text style={[styles.label, { textAlign: rtl ? "right" : "left" }]}>{t("province")}</Text>
      <TextInput value={province} onChangeText={setProvince} placeholder={t("provinceExample")} placeholderTextColor="#938f85" style={styles.input} textAlign={rtl ? "right" : "left"} returnKeyType="done" onSubmitEditing={() => void submitDraft()} />
      <View style={styles.hintBox}><Text style={[styles.hintText, { textAlign: rtl ? "right" : "left" }]}>{categoryHint}</Text></View>
      <View style={[styles.featureRow, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        <Pressable style={styles.secondaryButton} onPress={() => void pickImages()}><Text style={styles.secondaryButtonText}>{imageUris.length ? t("imagesSelected", { count: imageUris.length }) : t("addImages")}</Text></Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => void useCurrentLocation()}><Text style={styles.secondaryButtonText}>{t("chooseLocation")}</Text></Pressable>
      </View>
      {locationNote && <Text style={[styles.locationNote, { textAlign: rtl ? "right" : "left" }]}>{locationNote}</Text>}
      <Pressable style={styles.button} onPress={() => void submitDraft()}><Text style={styles.buttonText}>{t("saveDraft")}</Text></Pressable>
      <Pressable disabled={isOpeningPublish} style={[styles.webButton, isOpeningPublish && styles.webButtonDisabled]} onPress={() => void continueOnWeb()}><Text style={styles.webButtonText}>{isOpeningPublish ? t("opening") : t("openPublish")}</Text></Pressable>
      {message && <Text style={[styles.message, { textAlign: rtl ? "right" : "left" }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 18 },
  helper: { color: "#758078", fontSize: 13, lineHeight: 21, marginBottom: 18 },
  label: { color: "#405048", fontSize: 13, fontWeight: "900", marginBottom: 8, marginTop: 13 },
  categoryGrid: { flexWrap: "wrap", gap: 8 },
  category: { backgroundColor: "#fff", borderColor: "#e7e0d4", borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10 },
  categoryActive: { backgroundColor: "#e6f0ea", borderColor: "#1a5c50" },
  categoryText: { color: "#59685f", fontWeight: "800", fontSize: 12 },
  categoryTextActive: { color: "#173f37" },
  input: { backgroundColor: "#fff", borderColor: "#e7e0d4", borderWidth: 1, borderRadius: 15, height: 52, color: "#173f37", paddingHorizontal: 14, fontSize: 14 },
  hintBox: { marginTop: 16, backgroundColor: "#f5edda", borderRadius: 15, padding: 13 },
  hintText: { color: "#775b26", fontSize: 12, lineHeight: 19 },
  featureRow: { gap: 9, marginTop: 14 },
  secondaryButton: { alignItems: "center", backgroundColor: "#e7f0eb", borderRadius: 14, flex: 1, justifyContent: "center", minHeight: 48, paddingHorizontal: 8 },
  secondaryButtonText: { color: "#1a5c50", fontSize: 12, fontWeight: "900" },
  locationNote: { color: "#59685f", fontSize: 12, lineHeight: 19, marginTop: 10 },
  button: { marginTop: 20, height: 52, borderRadius: 16, backgroundColor: "#1a5c50", justifyContent: "center", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  webButton: { alignItems: "center", borderColor: "#1a5c50", borderRadius: 16, borderWidth: 1, height: 52, justifyContent: "center", marginTop: 10 },
  webButtonDisabled: { borderColor: "#9db6ae", opacity: 0.72 },
  webButtonText: { color: "#1a5c50", fontSize: 14, fontWeight: "900" },
  message: { color: "#1a5c50", fontSize: 13, lineHeight: 21, marginTop: 14 },
});

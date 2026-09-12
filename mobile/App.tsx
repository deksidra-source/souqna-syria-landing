import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiIsConfigured, getListings, recordAppDownload, type MobileListing } from "./src/api";
import { AccountPanel, MyListingsPanel } from "./src/AccountPanels";
import { loadLocale, saveLocale, translate, type MobileLocale } from "./src/i18n";
import { PublishForm } from "./src/PublishForm";

type Tab = "home" | "search" | "publish" | "mine" | "account" | "detail";

const categories = [
  { key: "realEstate", id: "real_estate" },
  { key: "vehicles", id: "vehicles" },
  { key: "jobs", id: "jobs" },
  { key: "used", id: "used_items" },
  { key: "services", id: "services" },
];
const tabs: Array<{ id: Exclude<Tab, "detail">; label: string; icon: string }> = [
  { id: "home", label: "home", icon: "⌂" },
  { id: "search", label: "search", icon: "⌕" },
  { id: "publish", label: "publish", icon: "+" },
  { id: "mine", label: "mine", icon: "▤" },
  { id: "account", label: "account", icon: "◉" },
];

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>س</Text></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDetail}>{detail}</Text>
    </View>
  );
}

function formatPrice(listing: MobileListing, locale: MobileLocale) {
  if (listing.priceType === "on_request") return locale === "ar" ? "السعر عند الطلب" : locale === "tr" ? "Fiyat istek üzerine" : "Price on request";
  if (!listing.price) return locale === "ar" ? "السعر غير محدد" : locale === "tr" ? "Fiyat belirtilmedi" : "Price not specified";
  return `${listing.price} ${listing.currency === "SYP" ? "ل.س" : "$"}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<MobileListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<MobileListing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [locale, setLocale] = useState<MobileLocale>("ar");
  const rtl = locale === "ar";
  const t = (key: string) => translate(locale, key);

  useEffect(() => {
    void loadLocale().then(setLocale);
    void (async () => {
      const key = "souqna-download-recorded-v1";
      if (await AsyncStorage.getItem(key)) return;
      await recordAppDownload(Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web").catch(() => undefined);
      await AsyncStorage.setItem(key, "1");
    })();
  }, []);

  const chooseLocale = (next: MobileLocale) => {
    setLocale(next);
    void saveLocale(next);
  };

  const loadListings = useCallback(async (query?: string, category?: string) => {
    if (!apiIsConfigured) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      setListings(await getListings({ query, category }));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "تعذر تحميل الإعلانات");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const openListing = (listing: MobileListing) => {
    setSelectedListing(listing);
    setActiveTab("detail");
  };

  const openCategory = (category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
    setActiveTab("search");
    void loadListings(undefined, category);
  };

  const listingContent = !apiIsConfigured ? (
    <EmptyState title="بانتظار ربط الخدمة" detail="اضبط EXPO_PUBLIC_SOUQNA_API_URL بعنوان المنصة المنشورة لعرض الإعلانات الفعلية." />
  ) : isLoading ? (
    <EmptyState title="جارٍ تحميل الإعلانات" detail="نسترجع أحدث الإعلانات من سوقنا سوريا." />
  ) : loadError ? (
    <EmptyState title="تعذر التحميل" detail={loadError} />
  ) : listings.length === 0 ? (
    <EmptyState title="لا توجد إعلانات مطابقة" detail="جرّب تغيير عبارة البحث أو تصفح قسم آخر." />
  ) : (
    <View style={styles.resultsList}>
      {listings.map(listing => (
        <Pressable key={listing.id} style={styles.listingCard} onPress={() => openListing(listing)}>
          {listing.images[0]?.url ? <Image source={{ uri: listing.images[0].url }} style={styles.listingImage} /> : <View style={styles.listingImage}><Text style={styles.listingImageText}>س</Text></View>}
          <View style={[styles.listingInfo, { alignItems: rtl ? "flex-end" : "flex-start" }]}>
            <Text style={[styles.listingTitle, { textAlign: rtl ? "right" : "left" }]} numberOfLines={2}>{listing.title}</Text>
            <Text style={[styles.listingMeta, { textAlign: rtl ? "right" : "left" }]}>{listing.province}{listing.area ? ` · ${listing.area}` : ""}</Text>
            <Text style={[styles.listingPrice, { textAlign: rtl ? "right" : "left" }]}>{formatPrice(listing, locale)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );

  const body = (() => {
    if (activeTab === "home") {
      return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={[styles.eyebrow, { textAlign: rtl ? "right" : "left" }]}>Souqna Syria</Text>
            <Text style={[styles.heroTitle, { textAlign: rtl ? "right" : "left" }]}>{t("hero")}</Text>
            <Text style={[styles.heroSubtitle, { textAlign: rtl ? "right" : "left" }]}>{t("subtitle")}</Text>
            <Pressable style={styles.searchBox} onPress={() => setActiveTab("search")}>
              <Text style={styles.searchHint}>{t("searchHint")}</Text>
              <Text style={styles.searchIcon}>⌕</Text>
            </Pressable>
          </View>
          <Text style={[styles.sectionTitle, { textAlign: rtl ? "right" : "left" }]}>{t("browseCategory")}</Text>
          <View style={[styles.categoryGrid, { flexDirection: rtl ? "row-reverse" : "row" }]}>
            {categories.map(category => (
              <Pressable key={category.id} style={styles.categoryCard} onPress={() => openCategory(category.id)}>
                <View style={styles.categoryMark}><Text style={styles.categoryMarkText}>س</Text></View>
                <Text style={styles.categoryText}>{t(category.key)}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.sectionTitle, { textAlign: rtl ? "right" : "left" }]}>{t("latest")}</Text>
          {listingContent}
        </ScrollView>
      );
    }
    if (activeTab === "search") {
      return (
        <View style={styles.page}>
          <Text style={[styles.pageTitle, { textAlign: rtl ? "right" : "left" }]}>{t("searchTitle")}</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("searchExample")}
              placeholderTextColor="#938f85"
              style={styles.input}
              textAlign={rtl ? "right" : "left"}
              returnKeyType="search"
              onSubmitEditing={() => void loadListings(searchQuery.trim(), activeCategory)}
            />
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterChip}>{t("category")}</Text>
            <Text style={styles.filterChip}>{t("province")}</Text>
            <Text style={styles.filterChip}>{t("price")}</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => void loadListings(searchQuery.trim(), activeCategory)}>
            <Text style={styles.primaryButtonText}>{t("searchNow")}</Text>
          </Pressable>
          {listingContent}
        </View>
      );
    }
    if (activeTab === "detail" && selectedListing) {
      return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.page}>
            <Pressable onPress={() => setActiveTab("search")}><Text style={[styles.backLink, { textAlign: rtl ? "right" : "left" }]}>← {t("back")}</Text></Pressable>
            {selectedListing.images[0]?.url ? <Image source={{ uri: selectedListing.images[0].url }} style={styles.detailVisual} /> : <View style={styles.detailVisual}><Text style={styles.detailVisualText}>س</Text></View>}
            <Text style={styles.detailTitle}>{selectedListing.title}</Text>
            <Text style={[styles.detailPrice, { textAlign: rtl ? "right" : "left" }]}>{formatPrice(selectedListing, locale)}</Text>
            <Text style={styles.detailLocation}>{selectedListing.province}{selectedListing.area ? `، ${selectedListing.area}` : ""}</Text>
            <Text style={[styles.detailSection, { textAlign: rtl ? "right" : "left" }]}>{t("detail")}</Text>
            <Text style={styles.detailBody}>{selectedListing.description}</Text>
            <Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>{t("contact")}</Text></Pressable>
          </View>
        </ScrollView>
      );
    }
    if (activeTab === "publish") {
      return <ScrollView contentContainerStyle={styles.scrollContent}><View style={styles.page}><Text style={[styles.pageTitle, { textAlign: rtl ? "right" : "left" }]}>{t("publishTitle")}</Text><PublishForm locale={locale} /></View></ScrollView>;
    }
    if (activeTab === "mine") {
      return <View style={styles.page}><Text style={[styles.pageTitle, { textAlign: rtl ? "right" : "left" }]}>{t("myListingsTitle")}</Text><MyListingsPanel locale={locale} /></View>;
    }
    return <View style={styles.page}><Text style={[styles.pageTitle, { textAlign: rtl ? "right" : "left" }]}>{t("accountTitle")}</Text><AccountPanel locale={locale} /></View>;
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={[styles.localeBar, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        <Text style={styles.localeLabel}>{t("language")}</Text>
        {(["ar", "en", "tr"] as MobileLocale[]).map(item => <Pressable key={item} onPress={() => chooseLocale(item)} style={[styles.localeButton, locale === item && styles.localeButtonActive]}><Text style={[styles.localeButtonText, locale === item && styles.localeButtonTextActive]}>{item.toUpperCase()}</Text></Pressable>)}
      </View>
      <View style={styles.app}>{body}</View>
      {activeTab !== "detail" && <View style={[styles.tabBar, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t(tab.label)}</Text>
            </Pressable>
          );
        })}
      </View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f4ec" },
  app: { flex: 1 },
  localeBar: { alignItems: "center", backgroundColor: "#fffdf8", borderBottomColor: "#ece6dc", borderBottomWidth: 1, gap: 7, paddingHorizontal: 16, paddingVertical: 7 },
  localeLabel: { color: "#64716a", fontSize: 11, fontWeight: "800", marginHorizontal: 3 },
  localeButton: { borderColor: "#e6dfd5", borderRadius: 9, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  localeButtonActive: { backgroundColor: "#e6f0ea", borderColor: "#1a5c50" },
  localeButtonText: { color: "#758078", fontSize: 10, fontWeight: "900" },
  localeButtonTextActive: { color: "#173f37" },
  scrollContent: { paddingBottom: 28 },
  hero: { backgroundColor: "#edf3ec", paddingHorizontal: 22, paddingTop: 28, paddingBottom: 30, borderBottomLeftRadius: 34, borderBottomRightRadius: 34 },
  eyebrow: { color: "#b68b34", fontWeight: "800", textAlign: "right", fontSize: 13, marginBottom: 8 },
  heroTitle: { color: "#173f37", fontWeight: "900", textAlign: "right", fontSize: 29, lineHeight: 38 },
  heroSubtitle: { color: "#64716a", textAlign: "right", fontSize: 14, lineHeight: 23, marginTop: 8 },
  searchBox: { backgroundColor: "#ffffff", marginTop: 22, borderRadius: 18, minHeight: 54, paddingHorizontal: 16, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", shadowColor: "#193e37", shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  searchHint: { color: "#938f85", fontSize: 14 },
  searchIcon: { color: "#1a5c50", fontSize: 27 },
  sectionTitle: { color: "#173f37", fontSize: 19, fontWeight: "900", textAlign: "right", marginTop: 28, marginHorizontal: 22 },
  categoryGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10, margin: 18 },
  categoryCard: { width: "30%", minHeight: 100, backgroundColor: "#ffffff", borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 9, borderWidth: 1, borderColor: "#ece6dc" },
  categoryMark: { width: 35, height: 35, backgroundColor: "#f5edda", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  categoryMarkText: { color: "#1a5c50", fontWeight: "900" },
  categoryText: { color: "#405048", fontSize: 13, fontWeight: "800" },
  page: { flex: 1, padding: 22 },
  pageTitle: { color: "#173f37", fontSize: 26, fontWeight: "900", textAlign: "right", marginTop: 12 },
  inputWrap: { marginTop: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e7e0d4", borderRadius: 16, paddingHorizontal: 14 },
  input: { height: 54, color: "#183d36", fontSize: 15 },
  filterRow: { flexDirection: "row-reverse", gap: 8, marginTop: 15 },
  filterChip: { backgroundColor: "#e7f0eb", color: "#1a5c50", overflow: "hidden", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14, fontWeight: "800", fontSize: 12 },
  emptyState: { backgroundColor: "#fff", borderRadius: 22, borderWidth: 1, borderColor: "#ece6dc", padding: 26, marginTop: 20, alignItems: "center" },
  emptyIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: "#f5edda", alignItems: "center", justifyContent: "center" },
  emptyIconText: { color: "#b68b34", fontSize: 22, fontWeight: "900" },
  emptyTitle: { color: "#173f37", fontSize: 16, fontWeight: "900", marginTop: 14, textAlign: "center" },
  emptyDetail: { color: "#758078", fontSize: 13, lineHeight: 21, marginTop: 6, textAlign: "center" },
  resultsList: { gap: 12, marginTop: 18 },
  listingCard: { flexDirection: "row-reverse", backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#ece6dc", padding: 10, gap: 12 },
  listingImage: { width: 88, height: 88, borderRadius: 13, backgroundColor: "#e8f0eb", alignItems: "center", justifyContent: "center" },
  listingImageText: { color: "#b68b34", fontWeight: "900", fontSize: 25 },
  listingInfo: { flex: 1, alignItems: "flex-end", justifyContent: "space-between", paddingVertical: 3 },
  listingTitle: { color: "#173f37", fontSize: 15, fontWeight: "900", textAlign: "right", width: "100%" },
  listingMeta: { color: "#758078", fontSize: 12, textAlign: "right", width: "100%" },
  listingPrice: { color: "#a7751f", fontSize: 14, fontWeight: "900", textAlign: "right", width: "100%" },
  primaryButton: { marginTop: 16, height: 52, borderRadius: 16, backgroundColor: "#1a5c50", alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  backLink: { color: "#1a5c50", fontWeight: "800", fontSize: 13, textAlign: "right" },
  detailVisual: { height: 220, borderRadius: 24, backgroundColor: "#e8f0eb", alignItems: "center", justifyContent: "center", marginTop: 20 },
  detailVisualText: { color: "#b68b34", fontWeight: "900", fontSize: 60 },
  detailTitle: { color: "#173f37", fontWeight: "900", fontSize: 25, lineHeight: 34, textAlign: "right", marginTop: 20 },
  detailPrice: { color: "#a7751f", fontWeight: "900", fontSize: 19, textAlign: "right", marginTop: 8 },
  detailLocation: { color: "#758078", fontSize: 14, textAlign: "right", marginTop: 6 },
  detailSection: { color: "#173f37", fontWeight: "900", fontSize: 17, textAlign: "right", marginTop: 22 },
  detailBody: { color: "#4f5e56", fontSize: 14, lineHeight: 24, textAlign: "right", marginTop: 8 },
  tabBar: { backgroundColor: "#fff", flexDirection: "row-reverse", paddingTop: 8, paddingBottom: 10, borderTopWidth: 1, borderTopColor: "#ece6dc" },
  tab: { flex: 1, alignItems: "center", gap: 3, paddingVertical: 4 },
  tabActive: { transform: [{ translateY: -2 }] },
  tabIcon: { color: "#969b94", fontSize: 21, fontWeight: "800" },
  tabIconActive: { color: "#b68b34" },
  tabText: { color: "#969b94", fontSize: 10, fontWeight: "700" },
  tabTextActive: { color: "#173f37", fontWeight: "900" },
});

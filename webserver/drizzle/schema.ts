import {
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import {
  currencyValues,
  interestTypeValues,
  listingCategoryValues,
  listingStatusValues,
  notificationTypeValues,
  paymentProviderValues,
  priceTypeValues,
  promotionStatusValues,
} from "../shared/marketplace";

/** Core user table backing the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const listings = mysqlTable(
  "listings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: mysqlEnum("category", listingCategoryValues).notNull(),
    status: mysqlEnum("status", listingStatusValues).default("published").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description").notNull(),
    province: varchar("province", { length: 64 }).notNull(),
    area: varchar("area", { length: 120 }),
    price: decimal("price", { precision: 14, scale: 2 }),
    currency: mysqlEnum("currency", currencyValues).default("SYP").notNull(),
    priceType: mysqlEnum("priceType", priceTypeValues).default("fixed").notNull(),
    contactName: varchar("contactName", { length: 120 }).notNull(),
    contactPhone: varchar("contactPhone", { length: 32 }).notNull(),
    isPhoneVisible: boolean("isPhoneVisible").default(true).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    attributes: json("attributes").$type<Record<string, string | number | boolean>>().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    publishedAt: timestamp("publishedAt"),
  },
  table => [
    index("listings_user_status_idx").on(table.userId, table.status),
    index("listings_status_category_created_idx").on(table.status, table.category, table.createdAt),
    index("listings_province_price_idx").on(table.province, table.price),
  ]
);

export const listingImages = mysqlTable(
  "listing_images",
  {
    id: int("id").autoincrement().primaryKey(),
    listingId: int("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    storageKey: varchar("storageKey", { length: 500 }).notNull(),
    url: varchar("url", { length: 700 }).notNull(),
    altText: varchar("altText", { length: 180 }),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("listing_images_listing_sort_idx").on(table.listingId, table.sortOrder)]
);

export const listingInterests = mysqlTable(
  "listing_interests",
  {
    id: int("id").autoincrement().primaryKey(),
    listingId: int("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", interestTypeValues).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("listing_interests_unique").on(table.listingId, table.userId, table.type),
    index("listing_interests_listing_idx").on(table.listingId),
  ]
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: int("listingId").references(() => listings.id, { onDelete: "set null" }),
    type: mysqlEnum("type", notificationTypeValues).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body").notNull(),
    isRead: boolean("isRead").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("notifications_user_read_created_idx").on(table.userId, table.isRead, table.createdAt)]
);

/** Optional, paid placement for an already-published listing. */
export const listingPromotions = mysqlTable(
  "listing_promotions",
  {
    id: int("id").autoincrement().primaryKey(),
    listingId: int("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    userId: int("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: mysqlEnum("provider", paymentProviderValues).default("ecash").notNull(),
    status: mysqlEnum("status", promotionStatusValues).default("pending").notNull(),
    referenceAmountUsd: decimal("referenceAmountUsd", { precision: 6, scale: 2 }).notNull(),
    amountSyp: int("amountSyp").notNull(),
    durationDays: int("durationDays").default(15).notNull(),
    externalPaymentId: varchar("externalPaymentId", { length: 255 }),
    merchantReference: varchar("merchantReference", { length: 120 }).notNull().unique(),
    startsAt: timestamp("startsAt"),
    endsAt: timestamp("endsAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("listing_promotions_listing_status_idx").on(table.listingId, table.status),
    index("listing_promotions_status_ends_idx").on(table.status, table.endsAt),
    index("listing_promotions_user_created_idx").on(table.userId, table.createdAt),
  ]
);

/** A private buyer-to-owner conversation about one listing. */
export const listingConversations = mysqlTable(
  "listing_conversations",
  {
    id: int("id").autoincrement().primaryKey(),
    listingId: int("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    ownerId: int("ownerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    buyerId: int("buyerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("listing_conversations_listing_buyer_unique").on(table.listingId, table.buyerId),
    index("listing_conversations_owner_last_idx").on(table.ownerId, table.lastMessageAt),
    index("listing_conversations_buyer_last_idx").on(table.buyerId, table.lastMessageAt),
  ]
);

export const conversationMessages = mysqlTable(
  "conversation_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    conversationId: int("conversationId")
      .notNull()
      .references(() => listingConversations.id, { onDelete: "cascade" }),
    senderId: int("senderId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("conversation_messages_conversation_created_idx").on(table.conversationId, table.createdAt)]
);

/** A one-way block that prevents direct interaction between two users. */
export const userBlocks = mysqlTable(
  "user_blocks",
  {
    id: int("id").autoincrement().primaryKey(),
    blockerId: int("blockerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    blockedId: int("blockedId").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("user_blocks_blocker_blocked_unique").on(table.blockerId, table.blockedId),
    index("user_blocks_blocked_idx").on(table.blockedId),
  ]
);

/** Store-facing moderation queue for listing and private-message reports. */
export const contentReports = mysqlTable(
  "content_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    reporterId: int("reporterId").notNull().references(() => users.id, { onDelete: "cascade" }),
    reportedUserId: int("reportedUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
    listingId: int("listingId").references(() => listings.id, { onDelete: "set null" }),
    messageId: int("messageId").references(() => conversationMessages.id, { onDelete: "set null" }),
    reason: mysqlEnum("reason", ["fraud", "spam", "harassment", "illegal", "inappropriate", "other"]).notNull(),
    details: varchar("details", { length: 800 }),
    status: mysqlEnum("status", ["open", "reviewing", "resolved", "dismissed"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
    resolvedBy: int("resolvedBy").references(() => users.id, { onDelete: "set null" }),
  },
  table => [
    index("content_reports_status_created_idx").on(table.status, table.createdAt),
    index("content_reports_reported_user_idx").on(table.reportedUserId, table.createdAt),
  ]
);

/** Auditable acceptance of the marketplace policies before a user publishes content. */
export const userPolicyAcceptances = mysqlTable(
  "user_policy_acceptances",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    policyVersion: varchar("policyVersion", { length: 32 }).notNull(),
    acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("user_policy_acceptances_unique").on(table.userId, table.policyVersion)]
);

/** A non-destructive queue for verified account/data deletion requests. */
export const dataDeletionRequests = mysqlTable(
  "data_deletion_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    details: varchar("details", { length: 500 }),
    status: mysqlEnum("status", ["open", "reviewing", "completed", "rejected"]).default("open").notNull(),
    requestedAt: timestamp("requestedAt").defaultNow().notNull(),
    processedAt: timestamp("processedAt"),
    processedBy: int("processedBy").references(() => users.id, { onDelete: "set null" }),
  },
  table => [index("data_deletion_requests_status_requested_idx").on(table.status, table.requestedAt)]
);

/** Public support requests retained for marketplace operations and review follow-up. */
export const supportRequests = mysqlTable(
  "support_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").references(() => users.id, { onDelete: "set null" }),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 160 }).notNull(),
    message: text("message").notNull(),
    status: mysqlEnum("status", ["open", "reviewing", "resolved"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("support_requests_status_created_idx").on(table.status, table.createdAt)]
);

/** Anonymous app-install events used only for aggregate operational analytics. */
export const appDownloads = mysqlTable(
  "app_downloads",
  {
    id: int("id").autoincrement().primaryKey(),
    platform: mysqlEnum("platform", ["android", "ios", "web"]).notNull(),
    appVersion: varchar("appVersion", { length: 32 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("app_downloads_platform_created_idx").on(table.platform, table.createdAt)]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;
export type ListingImage = typeof listingImages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ListingPromotion = typeof listingPromotions.$inferSelect;
export type ListingConversation = typeof listingConversations.$inferSelect;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type ContentReport = typeof contentReports.$inferSelect;

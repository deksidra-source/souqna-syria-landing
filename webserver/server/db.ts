import { and, asc, desc, eq, gte, inArray, isNull, like, lte, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { alias } from "drizzle-orm/mysql-core";
import {
  contentReports,
  appDownloads,
  conversationMessages,
  dataDeletionRequests,
  listingConversations,
  listingImages,
  listingInterests,
  listingPromotions,
  listings,
  notifications,
  supportRequests,
  type InsertUser,
  userBlocks,
  userPolicyAcceptances,
  users,
} from "../drizzle/schema";
import type { ListingCategory, ListingStatus, PromotionOffer } from "../shared/marketplace";
import { ENV } from "./_core/env";

let database: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!database && process.env.DATABASE_URL) {
    try {
      database = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      database = null;
    }
  }
  return database;
}

/** الدور الوحيد الذي يمكن لمزامنة OAuth فرضه هو admin للمالك أو لتصريح إداري صريح. */
export function getAuthoritativeRoleForUpsert(user: Pick<InsertUser, "openId" | "role">) {
  return user.role === "admin" || user.openId === ENV.ownerOpenId ? "admin" : undefined;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };

  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }

  // لا نعيد تعيين الدور عند كل دخول، لأن دور المدير قد يكون مُنح للحساب
  // المالك داخل قاعدة البيانات ويجب أن يبقى محفوظًا حتى لو لم يرسله OAuth.
  const authoritativeRole = getAuthoritativeRoleForUpsert(user);
  if (authoritativeRole) {
    values.role = authoritativeRole;
    updateSet.role = authoritativeRole;
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export type StoredImageInput = {
  storageKey: string;
  url: string;
  altText?: string;
  sortOrder: number;
};

export type ListingWriteValues = {
  category: ListingCategory;
  status: ListingStatus;
  title: string;
  description: string;
  province: string;
  area: string | null;
  price: string | null;
  currency: "SYP" | "USD";
  priceType: "fixed" | "negotiable" | "on_request";
  contactName: string;
  contactPhone: string;
  isPhoneVisible: boolean;
  latitude: string | null;
  longitude: string | null;
  attributes: Record<string, string | number | boolean>;
  publishedAt?: Date | null;
};

type DbClient = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function attachImages(db: DbClient, listingIds: number[]) {
  const grouped = new Map<number, Array<typeof listingImages.$inferSelect>>();
  if (!listingIds.length) return grouped;

  const rows = await db
    .select()
    .from(listingImages)
    .where(inArray(listingImages.listingId, listingIds))
    .orderBy(asc(listingImages.sortOrder), asc(listingImages.id));

  for (const image of rows) {
    const current = grouped.get(image.listingId) ?? [];
    current.push(image);
    grouped.set(image.listingId, current);
  }
  return grouped;
}

export async function listPublishedListings(input: {
  query?: string;
  category?: ListingCategory;
  province?: string;
  status?: "published";
  minPrice?: number;
  maxPrice?: number;
  limit: number;
  offset: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(listings.status, input.status ?? "published")];
  if (input.category) conditions.push(eq(listings.category, input.category));
  if (input.province) conditions.push(eq(listings.province, input.province));
  if (input.minPrice !== undefined) conditions.push(gte(listings.price, String(input.minPrice)));
  if (input.maxPrice !== undefined) conditions.push(lte(listings.price, String(input.maxPrice)));
  if (input.query) {
    const phrase = `%${input.query}%`;
    conditions.push(
      or(
        like(listings.title, phrase),
        like(listings.description, phrase),
        like(listings.area, phrase)
      )!
    );
  }

  const rows = await db
    .select({ listing: listings, ownerName: users.name })
    .from(listings)
    .leftJoin(users, eq(listings.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(listings.publishedAt), desc(listings.createdAt))
    .limit(input.limit)
    .offset(input.offset);

  const images = await attachImages(db, rows.map(row => row.listing.id));
  return rows.map(row => ({ ...row.listing, ownerName: row.ownerName, images: images.get(row.listing.id) ?? [] }));
}

export async function getListingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({ listing: listings, ownerName: users.name })
    .from(listings)
    .leftJoin(users, eq(listings.userId, users.id))
    .where(eq(listings.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return undefined;
  const images = await attachImages(db, [id]);
  return { ...row.listing, ownerName: row.ownerName, images: images.get(id) ?? [] };
}

export async function listUserListings(userId: number, status?: ListingStatus) {
  const db = await getDb();
  if (!db) return [];
  const condition = status
    ? and(eq(listings.userId, userId), eq(listings.status, status))
    : eq(listings.userId, userId);
  const rows = await db
    .select()
    .from(listings)
    .where(condition)
    .orderBy(desc(listings.updatedAt), desc(listings.createdAt));
  const images = await attachImages(db, rows.map(row => row.id));
  return rows.map(row => ({ ...row, images: images.get(row.id) ?? [] }));
}

export async function createListingRecord(input: {
  userId: number;
  values: ListingWriteValues;
  images: StoredImageInput[];
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");

  const listingId = await db.transaction(async tx => {
    const inserted = await tx.insert(listings).values({ userId: input.userId, ...input.values }).$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("تعذر إنشاء الإعلان");
    if (input.images.length) {
      await tx.insert(listingImages).values(input.images.map(image => ({ listingId: id, ...image })));
    }
    return id;
  });

  return getListingById(listingId);
}

export async function updateListingRecord(input: {
  id: number;
  userId: number;
  values: ListingWriteValues;
  images?: StoredImageInput[];
}) {
  const existing = await getListingById(input.id);
  if (!existing || existing.userId !== input.userId) return { existing: undefined, listing: undefined };

  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");

  await db.transaction(async tx => {
    await tx
      .update(listings)
      .set({ ...input.values, updatedAt: new Date() })
      .where(and(eq(listings.id, input.id), eq(listings.userId, input.userId)));
    if (input.images !== undefined) {
      await tx.delete(listingImages).where(eq(listingImages.listingId, input.id));
      if (input.images.length) {
        await tx.insert(listingImages).values(input.images.map(image => ({ listingId: input.id, ...image })));
      }
    }
  });

  return { existing, listing: await getListingById(input.id) };
}

export async function deleteListingRecord(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const existing = await getListingById(id);
  if (!existing || existing.userId !== userId) return false;
  await db.delete(listings).where(and(eq(listings.id, id), eq(listings.userId, userId)));
  return true;
}

export async function changeListingStatus(id: number, userId: number, status: ListingStatus) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const existing = await getListingById(id);
  if (!existing || existing.userId !== userId) return undefined;

  await db
    .update(listings)
    .set({
      status,
      updatedAt: new Date(),
      publishedAt: status === "published" && !existing.publishedAt ? new Date() : existing.publishedAt,
    })
    .where(and(eq(listings.id, id), eq(listings.userId, userId)));

  return getListingById(id);
}

export async function getOpenPromotion(listingId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(listingPromotions)
    .where(
      and(
        eq(listingPromotions.listingId, listingId),
        eq(listingPromotions.userId, userId),
        inArray(listingPromotions.status, ["pending", "active"])
      )
    )
    .orderBy(desc(listingPromotions.createdAt))
    .limit(1);
  return rows[0];
}

export async function createPendingPromotion(input: { listingId: number; userId: number; offer: PromotionOffer }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");

  const merchantReference = `souqna-${input.listingId}-${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`;
  const inserted = await db
    .insert(listingPromotions)
    .values({
      listingId: input.listingId,
      userId: input.userId,
      referenceAmountUsd: String(input.offer.referenceAmountUsd),
      amountSyp: input.offer.amountSyp,
      durationDays: input.offer.durationDays,
      merchantReference,
      status: "pending",
    })
    .$returningId();
  const id = inserted[0]?.id;
  if (!id) throw new Error("تعذر إنشاء طلب ترقية الإعلان");
  const rows = await db.select().from(listingPromotions).where(eq(listingPromotions.id, id)).limit(1);
  return rows[0];
}

export async function listUserPromotions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ promotion: listingPromotions, listingTitle: listings.title })
    .from(listingPromotions)
    .leftJoin(listings, eq(listingPromotions.listingId, listings.id))
    .where(eq(listingPromotions.userId, userId))
    .orderBy(desc(listingPromotions.createdAt));
}

export async function acceptPolicies(userId: number, policyVersion: string) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const existing = await db
    .select({ id: userPolicyAcceptances.id })
    .from(userPolicyAcceptances)
    .where(and(eq(userPolicyAcceptances.userId, userId), eq(userPolicyAcceptances.policyVersion, policyVersion)))
    .limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db.insert(userPolicyAcceptances).values({ userId, policyVersion }).$returningId();
  return { id: inserted[0]?.id };
}

export async function hasAcceptedPolicies(userId: number, policyVersion: string) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: userPolicyAcceptances.id })
    .from(userPolicyAcceptances)
    .where(and(eq(userPolicyAcceptances.userId, userId), eq(userPolicyAcceptances.policyVersion, policyVersion)))
    .limit(1);
  return Boolean(rows[0]);
}

export async function areUsersBlocked(firstUserId: number, secondUserId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: userBlocks.id })
    .from(userBlocks)
    .where(or(and(eq(userBlocks.blockerId, firstUserId), eq(userBlocks.blockedId, secondUserId)), and(eq(userBlocks.blockerId, secondUserId), eq(userBlocks.blockedId, firstUserId)))!)
    .limit(1);
  return Boolean(rows[0]);
}

export async function blockUser(blockerId: number, blockedId: number) {
  if (blockerId === blockedId) return false;
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const existing = await db
    .select({ id: userBlocks.id })
    .from(userBlocks)
    .where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)))
    .limit(1);
  if (existing[0]) return true;
  await db.insert(userBlocks).values({ blockerId, blockedId });
  return true;
}

export async function unblockUser(blockerId: number, blockedId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  await db.delete(userBlocks).where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)));
}

export async function createListingReport(input: {
  reporterId: number;
  listingId: number;
  reason: "fraud" | "spam" | "harassment" | "illegal" | "inappropriate" | "other";
  details?: string;
}) {
  const listing = await getListingById(input.listingId);
  if (!listing || listing.userId === input.reporterId) return undefined;
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const inserted = await db
    .insert(contentReports)
    .values({ ...input, reportedUserId: listing.userId, details: input.details || null })
    .$returningId();
  return { id: inserted[0]?.id, reportedUserId: listing.userId };
}

export async function createMessageReport(input: {
  reporterId: number;
  messageId: number;
  reason: "fraud" | "spam" | "harassment" | "illegal" | "inappropriate" | "other";
  details?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const rows = await db
    .select({ message: conversationMessages, conversation: listingConversations })
    .from(conversationMessages)
    .innerJoin(listingConversations, eq(conversationMessages.conversationId, listingConversations.id))
    .where(and(eq(conversationMessages.id, input.messageId), or(eq(listingConversations.ownerId, input.reporterId), eq(listingConversations.buyerId, input.reporterId))!))
    .limit(1);
  const row = rows[0];
  if (!row || row.message.senderId === input.reporterId) return undefined;
  const inserted = await db
    .insert(contentReports)
    .values({
      reporterId: input.reporterId,
      reportedUserId: row.message.senderId,
      messageId: input.messageId,
      listingId: row.conversation.listingId,
      reason: input.reason,
      details: input.details || null,
    })
    .$returningId();
  return { id: inserted[0]?.id, reportedUserId: row.message.senderId };
}

export async function requestDataDeletion(userId: number, details?: string) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const existing = await db
    .select()
    .from(dataDeletionRequests)
    .where(and(eq(dataDeletionRequests.userId, userId), inArray(dataDeletionRequests.status, ["open", "reviewing"])))
    .limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db.insert(dataDeletionRequests).values({ userId, details: details || null }).$returningId();
  const rows = await db.select().from(dataDeletionRequests).where(eq(dataDeletionRequests.id, inserted[0]!.id)).limit(1);
  return rows[0];
}

export async function createSupportRequest(input: { userId?: number; name: string; email: string; subject: string; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const inserted = await db
    .insert(supportRequests)
    .values({ userId: input.userId ?? null, name: input.name, email: input.email, subject: input.subject, message: input.message })
    .$returningId();
  return { id: inserted[0]?.id };
}

export async function findConversationForBuyer(listingId: number, buyerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(listingConversations)
    .where(and(eq(listingConversations.listingId, listingId), eq(listingConversations.buyerId, buyerId)))
    .limit(1);
  return rows[0];
}

export async function startListingConversation(input: { listingId: number; ownerId: number; buyerId: number }) {
  if (await areUsersBlocked(input.ownerId, input.buyerId)) return undefined;
  const existing = await findConversationForBuyer(input.listingId, input.buyerId);
  if (existing) return existing;
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");

  try {
    const inserted = await db
      .insert(listingConversations)
      .values({ listingId: input.listingId, ownerId: input.ownerId, buyerId: input.buyerId })
      .$returningId();
    const id = inserted[0]?.id;
    if (!id) throw new Error("تعذر إنشاء المحادثة");
    const rows = await db.select().from(listingConversations).where(eq(listingConversations.id, id)).limit(1);
    return rows[0];
  } catch (error) {
    const concurrent = await findConversationForBuyer(input.listingId, input.buyerId);
    if (concurrent) return concurrent;
    throw error;
  }
}

export async function getConversationForParticipant(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({ conversation: listingConversations, listingTitle: listings.title })
    .from(listingConversations)
    .leftJoin(listings, eq(listingConversations.listingId, listings.id))
    .where(
      and(
        eq(listingConversations.id, conversationId),
        or(eq(listingConversations.ownerId, userId), eq(listingConversations.buyerId, userId))!
      )
    )
    .limit(1);
  const row = rows[0];
  if (!row) return undefined;
  const counterpartId = row.conversation.ownerId === userId ? row.conversation.buyerId : row.conversation.ownerId;
  if (await areUsersBlocked(userId, counterpartId)) return undefined;
  const messages = await db
    .select()
    .from(conversationMessages)
    .where(eq(conversationMessages.conversationId, conversationId))
    .orderBy(asc(conversationMessages.createdAt), asc(conversationMessages.id));
  return { ...row, counterpartId, messages };
}

export async function listConversationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ conversation: listingConversations, listingTitle: listings.title })
    .from(listingConversations)
    .leftJoin(listings, eq(listingConversations.listingId, listings.id))
    .where(or(eq(listingConversations.ownerId, userId), eq(listingConversations.buyerId, userId))!)
    .orderBy(desc(listingConversations.lastMessageAt));
  return Promise.all(rows.map(async row => {
    const unread = await db
      .select({ id: conversationMessages.id })
      .from(conversationMessages)
      .where(and(eq(conversationMessages.conversationId, row.conversation.id), ne(conversationMessages.senderId, userId), isNull(conversationMessages.readAt)));
    return { ...row, unreadCount: unread.length };
  }));
}

export async function markConversationMessagesRead(conversationId: number, userId: number) {
  const detail = await getConversationForParticipant(conversationId, userId);
  if (!detail) return false;
  const db = await getDb();
  if (!db) return false;
  await db
    .update(conversationMessages)
    .set({ readAt: new Date() })
    .where(and(eq(conversationMessages.conversationId, conversationId), ne(conversationMessages.senderId, userId), isNull(conversationMessages.readAt)));
  return true;
}

export async function getUnreadMessageCount(userId: number) {
  const conversations = await listConversationsForUser(userId);
  return conversations.reduce((total, item) => total + item.unreadCount, 0);
}

export async function sendConversationMessage(input: { conversationId: number; senderId: number; body: string }) {
  const detail = await getConversationForParticipant(input.conversationId, input.senderId);
  if (!detail) return undefined;
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const now = new Date();
  const inserted = await db
    .insert(conversationMessages)
    .values({ conversationId: input.conversationId, senderId: input.senderId, body: input.body })
    .$returningId();
  const id = inserted[0]?.id;
  if (!id) throw new Error("تعذر إرسال الرسالة");
  await db.update(listingConversations).set({ lastMessageAt: now, updatedAt: now }).where(eq(listingConversations.id, input.conversationId));
  const messages = await db.select().from(conversationMessages).where(eq(conversationMessages.id, id)).limit(1);
  return { message: messages[0], recipientId: detail.conversation.ownerId === input.senderId ? detail.conversation.buyerId : detail.conversation.ownerId };
}

export async function addListingInterest(input: { listingId: number; userId: number; type: "favorite" | "contact" }) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const current = await db
    .select({ id: listingInterests.id })
    .from(listingInterests)
    .where(
      and(
        eq(listingInterests.listingId, input.listingId),
        eq(listingInterests.userId, input.userId),
        eq(listingInterests.type, input.type)
      )
    )
    .limit(1);
  if (current[0]) return false;
  await db.insert(listingInterests).values(input);
  return true;
}

export async function createNotification(input: {
  userId: number;
  listingId?: number | null;
  type: "listing_created" | "listing_status_changed" | "new_interest" | "new_message";
  title: string;
  body: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(input);
}

export async function listNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(40);
}

export async function markNotificationsRead(userId: number, notificationId?: number) {
  const db = await getDb();
  if (!db) return;
  const condition = notificationId
    ? and(eq(notifications.userId, userId), eq(notifications.id, notificationId))
    : eq(notifications.userId, userId);
  await db.update(notifications).set({ isRead: true }).where(condition);
}

const reportAuthors = alias(users, "report_authors");
const reportedAccounts = alias(users, "reported_accounts");

export async function listAdminContentReports(status?: "open" | "reviewing" | "resolved" | "dismissed") {
  const db = await getDb();
  if (!db) return [];
  const query = db
    .select({
      report: contentReports,
      reporterName: reportAuthors.name,
      reporterEmail: reportAuthors.email,
      reportedUserName: reportedAccounts.name,
      reportedUserEmail: reportedAccounts.email,
      listingTitle: listings.title,
      messageBody: conversationMessages.body,
    })
    .from(contentReports)
    .leftJoin(reportAuthors, eq(contentReports.reporterId, reportAuthors.id))
    .leftJoin(reportedAccounts, eq(contentReports.reportedUserId, reportedAccounts.id))
    .leftJoin(listings, eq(contentReports.listingId, listings.id))
    .leftJoin(conversationMessages, eq(contentReports.messageId, conversationMessages.id));
  const rows = status
    ? await query.where(eq(contentReports.status, status)).orderBy(desc(contentReports.createdAt))
    : await query.orderBy(desc(contentReports.createdAt));
  return rows;
}

export async function updateAdminContentReportStatus(
  id: number,
  status: "open" | "reviewing" | "resolved" | "dismissed",
  adminId: number
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const completed = status === "resolved" || status === "dismissed";
  const result = await db
    .update(contentReports)
    .set({
      status,
      resolvedAt: completed ? new Date() : null,
      resolvedBy: completed ? adminId : null,
    })
    .where(eq(contentReports.id, id));
  return result[0]?.affectedRows ? true : false;
}

export async function listAdminDeletionRequests(status?: "open" | "reviewing" | "completed" | "rejected") {
  const db = await getDb();
  if (!db) return [];
  const query = db
    .select({ request: dataDeletionRequests, userName: users.name, userEmail: users.email })
    .from(dataDeletionRequests)
    .leftJoin(users, eq(dataDeletionRequests.userId, users.id));
  const rows = status
    ? await query.where(eq(dataDeletionRequests.status, status)).orderBy(desc(dataDeletionRequests.requestedAt))
    : await query.orderBy(desc(dataDeletionRequests.requestedAt));
  return rows;
}

export async function updateAdminDeletionRequestStatus(
  id: number,
  status: "open" | "reviewing" | "completed" | "rejected",
  adminId: number
) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const completed = status === "completed" || status === "rejected";
  const result = await db
    .update(dataDeletionRequests)
    .set({
      status,
      processedAt: completed ? new Date() : null,
      processedBy: completed ? adminId : null,
    })
    .where(eq(dataDeletionRequests.id, id));
  return result[0]?.affectedRows ? true : false;
}

export async function listAdminSupportRequests(status?: "open" | "reviewing" | "resolved") {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(supportRequests);
  const rows = status
    ? await query.where(eq(supportRequests.status, status)).orderBy(desc(supportRequests.createdAt))
    : await query.orderBy(desc(supportRequests.createdAt));
  return rows;
}

export async function updateAdminSupportRequestStatus(id: number, status: "open" | "reviewing" | "resolved") {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا");
  const result = await db.update(supportRequests).set({ status }).where(eq(supportRequests.id, id));
  return result[0]?.affectedRows ? true : false;
}

export async function recordAppDownload(platform: "android" | "ios" | "web", appVersion?: string) {
  const db = await getDb();
  if (!db) return false;
  await db.insert(appDownloads).values({ platform, appVersion: appVersion?.slice(0, 32) || null });
  return true;
}

async function countSince(table: typeof users | typeof listings | typeof contentReports | typeof appDownloads, column: any, since: Date) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ value: sql<number>`count(*)` }).from(table).where(gte(column, since));
  return Number(result[0]?.value ?? 0);
}

async function countBetween(table: typeof users | typeof listings | typeof contentReports | typeof appDownloads, column: any, from: Date, to: Date) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ value: sql<number>`count(*)` }).from(table).where(and(gte(column, from), lte(column, to)));
  return Number(result[0]?.value ?? 0);
}

function growthPercent(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getAdminAnalytics() {
  const db = await getDb();
  if (!db) return { users: { total: 0, last30Days: 0, growth: 0 }, listings: { total: 0, last30Days: 0, growth: 0 }, reports: { total: 0, last30Days: 0, growth: 0 }, downloads: { total: 0, last30Days: 0, growth: 0, android: 0, ios: 0, web: 0 } };
  const now = Date.now();
  const currentStart = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const previousStart = new Date(now - 60 * 24 * 60 * 60 * 1000);
  const [userTotal, listingTotal, reportTotal, downloadTotal, usersCurrent, usersPrevious, listingsCurrent, listingsPrevious, reportsCurrent, reportsPrevious, downloadsCurrent, downloadsPrevious] = await Promise.all([
    db.select({ value: sql<number>`count(*)` }).from(users),
    db.select({ value: sql<number>`count(*)` }).from(listings),
    db.select({ value: sql<number>`count(*)` }).from(contentReports),
    db.select({ value: sql<number>`count(*)` }).from(appDownloads),
    countSince(users, users.createdAt, currentStart), countBetween(users, users.createdAt, previousStart, currentStart),
    countSince(listings, listings.createdAt, currentStart), countBetween(listings, listings.createdAt, previousStart, currentStart),
    countSince(contentReports, contentReports.createdAt, currentStart), countBetween(contentReports, contentReports.createdAt, previousStart, currentStart),
    countSince(appDownloads, appDownloads.createdAt, currentStart), countBetween(appDownloads, appDownloads.createdAt, previousStart, currentStart),
  ]);
  const platformRows = await db.select({ platform: appDownloads.platform, value: sql<number>`count(*)` }).from(appDownloads).groupBy(appDownloads.platform);
  const platformCounts = Object.fromEntries(platformRows.map(row => [row.platform, Number(row.value)]));
  const make = (total: { value: number }[], current: number, previous: number) => ({ total: Number(total[0]?.value ?? 0), last30Days: current, growth: growthPercent(current, previous) });
  return {
    users: make(userTotal, usersCurrent, usersPrevious),
    listings: make(listingTotal, listingsCurrent, listingsPrevious),
    reports: make(reportTotal, reportsCurrent, reportsPrevious),
    downloads: { ...make(downloadTotal, downloadsCurrent, downloadsPrevious), android: platformCounts.android ?? 0, ios: platformCounts.ios ?? 0, web: platformCounts.web ?? 0 },
  };
}

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  categories,
  conversationIdSchema,
  createListingSchema,
  interestSchema,
  getPromotionOffer,
  listingQuerySchema,
  listingStatusLabels,
  myListingsQuerySchema,
  promotionOffers,
  promotionRequestSchema,
  policyAcceptanceSchema,
  reportListingSchema,
  reportMessageSchema,
  blockUserSchema,
  dataDeletionRequestSchema,
  supportRequestSchema,
  sendMessageSchema,
  startConversationSchema,
  updateListingSchema,
} from "../shared/marketplace";
import { COOKIE_NAME } from "@shared/const";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";

function toListingValues(input: Omit<z.infer<typeof createListingSchema>, "images">, wasPublished = false) {
  const hasJustPublished = input.status === "published" && !wasPublished;
  return {
    category: input.category,
    status: input.status,
    title: input.title,
    description: input.description,
    province: input.province,
    area: input.area ?? null,
    price: input.price === null || input.price === undefined ? null : String(input.price),
    currency: input.currency,
    priceType: input.priceType,
    contactName: input.contactName,
    contactPhone: input.contactPhone,
    isPhoneVisible: input.isPhoneVisible,
    latitude: input.latitude === null || input.latitude === undefined ? null : String(input.latitude),
    longitude: input.longitude === null || input.longitude === undefined ? null : String(input.longitude),
    attributes: input.attributes,
    publishedAt: hasJustPublished ? new Date() : undefined,
  };
}

function decodeImage(dataUrl: string, imageType: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match || match[1] !== imageType) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "صيغة الصورة غير مدعومة" });
  }
  const data = Buffer.from(match[2], "base64");
  if (!data.length || data.length > 2_000_000) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "حجم كل صورة يجب ألا يتجاوز 2 ميغابايت" });
  }
  return data;
}

async function storeImages(userId: number, images: z.infer<typeof createListingSchema>["images"], title: string) {
  return Promise.all(
    images.map(async (image, index) => {
      const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
      const content = decodeImage(image.dataUrl, image.type);
      const stored = await storagePut(`listings/${userId}/${Date.now()}-${index}.${extension}`, content, image.type);
      return { storageKey: stored.key, url: stored.url, altText: title, sortOrder: index };
    })
  );
}

function notFound() {
  return new TRPCError({ code: "NOT_FOUND", message: "الإعلان غير موجود أو لم يعد متاحًا" });
}

const CURRENT_POLICY_VERSION = "2026-08-26";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "هذه الصفحة متاحة للمدير فقط" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  marketplace: router({
    meta: publicProcedure.query(() => ({ categories })),
    list: publicProcedure.input(listingQuerySchema).query(({ input }) => db.listPublishedListings(input)),
    detail: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const listing = await db.getListingById(input.id);
      if (!listing || listing.status !== "published") throw notFound();
      return listing;
    }),
    mine: protectedProcedure
      .input(myListingsQuerySchema.default({}))
      .query(({ ctx, input }) => db.listUserListings(ctx.user.id, input.status)),
    create: protectedProcedure.input(createListingSchema).mutation(async ({ ctx, input }) => {
      if (!(await db.hasAcceptedPolicies(ctx.user.id, CURRENT_POLICY_VERSION))) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "يجب قبول شروط الاستخدام وسياسة الخصوصية قبل نشر إعلان" });
      }
      const images = await storeImages(ctx.user.id, input.images, input.title);
      const listing = await db.createListingRecord({
        userId: ctx.user.id,
        values: toListingValues(input),
        images,
      });
      if (!listing) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر إنشاء الإعلان" });
      await db.createNotification({
        userId: ctx.user.id,
        listingId: listing.id,
        type: "listing_created",
        title: "تم نشر إعلانك",
        body: `أصبح إعلان «${listing.title}» ظاهرًا للمتصفحين.`,
      });
      return listing;
    }),
    update: protectedProcedure.input(updateListingSchema).mutation(async ({ ctx, input }) => {
      const { id, images: imagePayload, ...payload } = input;
      const existing = await db.getListingById(id);
      if (!existing || existing.userId !== ctx.user.id) throw notFound();
      const images = imagePayload === undefined ? undefined : await storeImages(ctx.user.id, imagePayload, payload.title);
      const result = await db.updateListingRecord({
        id,
        userId: ctx.user.id,
        values: toListingValues(payload, existing.status === "published"),
        images,
      });
      if (!result.listing) throw notFound();
      if (existing.status !== result.listing.status) {
        await db.createNotification({
          userId: ctx.user.id,
          listingId: result.listing.id,
          type: "listing_status_changed",
          title: "تم تحديث حالة إعلانك",
          body: `حالة إعلان «${result.listing.title}» الآن: ${listingStatusLabels[result.listing.status]}.`,
        });
      }
      return result.listing;
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const deleted = await db.deleteListingRecord(input.id, ctx.user.id);
      if (!deleted) throw notFound();
      return { success: true };
    }),
    setStatus: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["draft", "published", "paused", "archived"]) }))
      .mutation(async ({ ctx, input }) => {
        const listing = await db.changeListingStatus(input.id, ctx.user.id, input.status);
        if (!listing) throw notFound();
        await db.createNotification({
          userId: ctx.user.id,
          listingId: listing.id,
          type: "listing_status_changed",
          title: "تم تحديث حالة إعلانك",
          body: `حالة إعلان «${listing.title}» الآن: ${listingStatusLabels[listing.status]}.`,
        });
        return listing;
      }),
    addInterest: protectedProcedure.input(interestSchema).mutation(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing || listing.status !== "published") throw notFound();
      if (listing.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكنك تسجيل اهتمام بإعلانك" });
      }
      const created = await db.addListingInterest({ ...input, userId: ctx.user.id });
      if (created) {
        await db.createNotification({
          userId: listing.userId,
          listingId: listing.id,
          type: "new_interest",
          title: "اهتمام جديد بإعلانك",
          body: `سجّل مستخدم اهتمامًا بإعلان «${listing.title}».`,
        });
      }
      return { created };
    }),
  }),
  promotions: router({
    plans: publicProcedure.query(() => Object.values(promotionOffers)),
    mine: protectedProcedure.query(({ ctx }) => db.listUserPromotions(ctx.user.id)),
    createPending: protectedProcedure.input(promotionRequestSchema).mutation(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing || listing.userId !== ctx.user.id || listing.status !== "published") throw notFound();
      const offer = getPromotionOffer(listing.category);
      if (!offer) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "الترقية المميزة متاحة حاليًا للعقارات والسيارات فقط",
        });
      }
      const openPromotion = await db.getOpenPromotion(listing.id, ctx.user.id);
      if (openPromotion?.status === "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "هذا الإعلان مميز بالفعل" });
      }
      return openPromotion ?? db.createPendingPromotion({ listingId: listing.id, userId: ctx.user.id, offer });
    }),
  }),
  safety: router({
    acceptPolicies: protectedProcedure.input(policyAcceptanceSchema).mutation(async ({ ctx, input }) => {
      if (input.policyVersion !== CURRENT_POLICY_VERSION) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "إصدار السياسات غير صالح" });
      }
      return db.acceptPolicies(ctx.user.id, input.policyVersion);
    }),
    reportListing: protectedProcedure.input(reportListingSchema).mutation(async ({ ctx, input }) => {
      const report = await db.createListingReport({ ...input, reporterId: ctx.user.id });
      if (!report) throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن الإبلاغ عن هذا الإعلان" });
      return { id: report.id };
    }),
    reportMessage: protectedProcedure.input(reportMessageSchema).mutation(async ({ ctx, input }) => {
      const report = await db.createMessageReport({ ...input, reporterId: ctx.user.id });
      if (!report) throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن الإبلاغ عن هذه الرسالة" });
      return { id: report.id };
    }),
    blockUser: protectedProcedure.input(blockUserSchema).mutation(async ({ ctx, input }) => {
      const blocked = await db.blockUser(ctx.user.id, input.userId);
      if (!blocked) throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكنك حظر حسابك" });
      return { ok: true };
    }),
    unblockUser: protectedProcedure.input(blockUserSchema).mutation(async ({ ctx, input }) => {
      await db.unblockUser(ctx.user.id, input.userId);
      return { ok: true };
    }),
    requestDataDeletion: protectedProcedure.input(dataDeletionRequestSchema).mutation(async ({ ctx, input }) => {
      const request = await db.requestDataDeletion(ctx.user.id, input.details);
      void notifyOwner({ title: "طلب حذف بيانات جديد", content: `طلب المستخدم رقم ${ctx.user.id} حذف بياناته. رقم الطلب: ${request?.id ?? "غير متاح"}.` }).catch(() => undefined);
      return request;
    }),
  }),
  support: router({
    create: publicProcedure.input(supportRequestSchema).mutation(async ({ ctx, input }) => {
      const ticket = await db.createSupportRequest({ ...input, userId: ctx.user?.id });
      void notifyOwner({ title: "تذكرة دعم جديدة", content: `التذكرة #${ticket.id ?? "غير متاح"}: ${input.subject} — ${input.email}` }).catch(() => undefined);
      return ticket;
    }),
  }),
  analytics: router({
    recordDownload: publicProcedure
      .input(z.object({ platform: z.enum(["android", "ios", "web"]), appVersion: z.string().trim().max(32).optional() }))
      .mutation(({ input }) => db.recordAppDownload(input.platform, input.appVersion)),
  }),
  conversations: router({
    mine: protectedProcedure.query(({ ctx }) => db.listConversationsForUser(ctx.user.id)),
    unreadCount: protectedProcedure.query(({ ctx }) => db.getUnreadMessageCount(ctx.user.id)),
    start: protectedProcedure.input(startConversationSchema).mutation(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing || listing.status !== "published") throw notFound();
      if (listing.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكنك بدء محادثة حول إعلانك" });
      }
      const conversation = await db.startListingConversation({ listingId: listing.id, ownerId: listing.userId, buyerId: ctx.user.id });
      if (!conversation) throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكن بدء المحادثة لأن أحد الطرفين حظر الآخر" });
      return conversation;
    }),
    detail: protectedProcedure.input(conversationIdSchema).query(async ({ ctx, input }) => {
      const detail = await db.getConversationForParticipant(input.conversationId, ctx.user.id);
      if (!detail) throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك صلاحية الوصول إلى هذه المحادثة" });
      return detail;
    }),
    markRead: protectedProcedure.input(conversationIdSchema).mutation(async ({ ctx, input }) => {
      const marked = await db.markConversationMessagesRead(input.conversationId, ctx.user.id);
      if (!marked) throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك صلاحية الوصول إلى هذه المحادثة" });
      return { ok: true };
    }),
    send: protectedProcedure.input(sendMessageSchema).mutation(async ({ ctx, input }) => {
      const sent = await db.sendConversationMessage({ conversationId: input.conversationId, senderId: ctx.user.id, body: input.body });
      if (!sent?.message) throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك صلاحية الإرسال في هذه المحادثة" });
      const detail = await db.getConversationForParticipant(input.conversationId, ctx.user.id);
      await db.createNotification({
        userId: sent.recipientId,
        listingId: detail?.conversation.listingId ?? null,
        type: "new_message",
        title: "رسالة جديدة حول إعلان",
        body: "لديك رسالة جديدة من مستخدم مهتم بإعلانك.",
      });
      return sent.message;
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => db.listNotifications(ctx.user.id)),
    markRead: protectedProcedure
      .input(z.object({ id: z.number().int().positive().optional() }).default({}))
      .mutation(({ ctx, input }) => db.markNotificationsRead(ctx.user.id, input.id)),
  }),
  admin: router({
    analytics: adminProcedure.query(() => db.getAdminAnalytics()),
    overview: adminProcedure.query(async () => {
      const [reports, deletions, support] = await Promise.all([
        db.listAdminContentReports(),
        db.listAdminDeletionRequests(),
        db.listAdminSupportRequests(),
      ]);
      return {
        openReports: reports.filter(item => item.report.status === "open" || item.report.status === "reviewing").length,
        openDeletionRequests: deletions.filter(item => item.request.status === "open" || item.request.status === "reviewing").length,
        openSupportRequests: support.filter(item => item.status === "open" || item.status === "reviewing").length,
      };
    }),
    reports: adminProcedure
      .input(z.object({ status: z.enum(["open", "reviewing", "resolved", "dismissed"]).optional() }).default({}))
      .query(({ input }) => db.listAdminContentReports(input.status)),
    updateReportStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["open", "reviewing", "resolved", "dismissed"]) }))
      .mutation(async ({ ctx, input }) => {
        const updated = await db.updateAdminContentReportStatus(input.id, input.status, ctx.user.id);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "البلاغ غير موجود" });
        return { ok: true };
      }),
    deletionRequests: adminProcedure
      .input(z.object({ status: z.enum(["open", "reviewing", "completed", "rejected"]).optional() }).default({}))
      .query(({ input }) => db.listAdminDeletionRequests(input.status)),
    updateDeletionRequestStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["open", "reviewing", "completed", "rejected"]) }))
      .mutation(async ({ ctx, input }) => {
        const updated = await db.updateAdminDeletionRequestStatus(input.id, input.status, ctx.user.id);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "طلب الحذف غير موجود" });
        return { ok: true };
      }),
    supportRequests: adminProcedure
      .input(z.object({ status: z.enum(["open", "reviewing", "resolved"]).optional() }).default({}))
      .query(({ input }) => db.listAdminSupportRequests(input.status)),
    updateSupportRequestStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["open", "reviewing", "resolved"]) }))
      .mutation(async ({ input }) => {
        const updated = await db.updateAdminSupportRequestStatus(input.id, input.status);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "تذكرة الدعم غير موجودة" });
        return { ok: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

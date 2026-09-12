import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    createListingRecord: vi.fn(),
    createNotification: vi.fn(),
    getListingById: vi.fn(),
    addListingInterest: vi.fn(),
    getOpenPromotion: vi.fn(),
    createPendingPromotion: vi.fn(),
    hasAcceptedPolicies: vi.fn(),
    acceptPolicies: vi.fn(),
    createListingReport: vi.fn(),
    createMessageReport: vi.fn(),
    blockUser: vi.fn(),
    unblockUser: vi.fn(),
    requestDataDeletion: vi.fn(),
    getConversationForParticipant: vi.fn(),
    markConversationMessagesRead: vi.fn(),
    getUnreadMessageCount: vi.fn(),
    startListingConversation: vi.fn(),
    sendConversationMessage: vi.fn(),
    listAdminContentReports: vi.fn(),
    updateAdminContentReportStatus: vi.fn(),
    listAdminDeletionRequests: vi.fn(),
    updateAdminDeletionRequestStatus: vi.fn(),
    listAdminSupportRequests: vi.fn(),
    updateAdminSupportRequestStatus: vi.fn(),
  },
}));

vi.mock("./db", () => mockDb);
vi.mock("./storage", () => ({ storagePut: vi.fn() }));

import { appRouter } from "./routers";

const user = {
  id: 11,
  openId: "marketplace-user",
  name: "معلن تجريبي",
  email: "seller@example.com",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const listingInput = {
  category: "services" as const,
  title: "خدمة صيانة كهربائية منزلية",
  description: "خدمة صيانة كهربائية للمنازل ضمن دمشق مع مواعيد مرنة وأسعار واضحة.",
  province: "دمشق" as const,
  area: "المزة",
  price: 100_000,
  currency: "SYP" as const,
  priceType: "fixed" as const,
  contactName: "معلن تجريبي",
  contactPhone: "0944000000",
  isPhoneVisible: true,
  latitude: null,
  longitude: null,
  attributes: { serviceType: "صيانة كهربائية" },
  images: [],
};

function context(): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function adminContext(): TrpcContext {
  return {
    user: { ...user, id: 1, openId: "marketplace-admin", role: "admin" },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("إجراءات سوقنا المحمية", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.hasAcceptedPolicies.mockResolvedValue(true);
  });

  it("ينشئ إعلانًا منشورًا ويولد تنبيهًا لصاحبه", async () => {
    const created = { id: 42, userId: user.id, title: listingInput.title, status: "published" as const };
    mockDb.createListingRecord.mockResolvedValue(created);
    const caller = appRouter.createCaller(context());

    const result = await caller.marketplace.create(listingInput);

    expect(result).toEqual(created);
    expect(mockDb.createListingRecord).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id, images: [] }));
    expect(mockDb.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: user.id, listingId: 42, type: "listing_created" }));
  });

  it("يرفض نشر إعلان قبل قبول الشروط وسياسة الخصوصية", async () => {
    mockDb.hasAcceptedPolicies.mockResolvedValue(false);
    const caller = appRouter.createCaller(context());

    await expect(caller.marketplace.create(listingInput)).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(mockDb.createListingRecord).not.toHaveBeenCalled();
  });

  it("يسجل قبول إصدار السياسات الحالي للمستخدم", async () => {
    mockDb.acceptPolicies.mockResolvedValue({ id: 4 });
    const caller = appRouter.createCaller(context());

    await expect(caller.safety.acceptPolicies({ policyVersion: "2026-08-26" })).resolves.toEqual({ id: 4 });
    expect(mockDb.acceptPolicies).toHaveBeenCalledWith(user.id, "2026-08-26");
  });

  it("ينشئ بلاغًا عن إعلان يملكه مستخدم آخر", async () => {
    mockDb.createListingReport.mockResolvedValue({ id: 9, reportedUserId: 90 });
    const caller = appRouter.createCaller(context());

    await expect(caller.safety.reportListing({ listingId: 42, reason: "fraud" })).resolves.toEqual({ id: 9 });
    expect(mockDb.createListingReport).toHaveBeenCalledWith(expect.objectContaining({ reporterId: user.id, listingId: 42 }));
  });

  it("يرفض حظر الحساب الذاتي", async () => {
    mockDb.blockUser.mockResolvedValue(false);
    const caller = appRouter.createCaller(context());

    await expect(caller.safety.blockUser({ userId: user.id })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("يرفض تسجيل اهتمام المعلن بإعلانه", async () => {
    mockDb.getListingById.mockResolvedValue({ id: 42, userId: user.id, status: "published", title: "إعلان المعلن" });
    const caller = appRouter.createCaller(context());

    await expect(caller.marketplace.addInterest({ listingId: 42, type: "favorite" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockDb.addListingInterest).not.toHaveBeenCalled();
  });

  it("يسجل اهتمام مستخدم آخر وينبه صاحب الإعلان", async () => {
    mockDb.getListingById.mockResolvedValue({ id: 42, userId: 90, status: "published", title: "إعلان متاح" });
    mockDb.addListingInterest.mockResolvedValue(true);
    const caller = appRouter.createCaller(context());

    await expect(caller.marketplace.addInterest({ listingId: 42, type: "contact" })).resolves.toEqual({ created: true });
    expect(mockDb.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 90, type: "new_interest" }));
  });

  it("ينشئ طلب ترقية معلقًا لإعلان سيارة منشور دون تغيير نشر الإعلان", async () => {
    mockDb.getListingById.mockResolvedValue({ id: 42, userId: user.id, status: "published", category: "vehicles" });
    mockDb.getOpenPromotion.mockResolvedValue(undefined);
    mockDb.createPendingPromotion.mockResolvedValue({ id: 7, listingId: 42, status: "pending", amountSyp: 13170, durationDays: 15 });
    const caller = appRouter.createCaller(context());

    await expect(caller.promotions.createPending({ listingId: 42 })).resolves.toMatchObject({ status: "pending", durationDays: 15 });
    expect(mockDb.createPendingPromotion).toHaveBeenCalledWith(expect.objectContaining({ listingId: 42, userId: user.id }));
  });

  it("يرفض بدء محادثة حول إعلان المستخدم نفسه", async () => {
    mockDb.getListingById.mockResolvedValue({ id: 42, userId: user.id, status: "published" });
    const caller = appRouter.createCaller(context());
    await expect(caller.conversations.start({ listingId: 42 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("يفتح أو يعيد استخدام محادثة خاصة بإعلان منشور", async () => {
    mockDb.getListingById.mockResolvedValue({ id: 42, userId: 90, status: "published", title: "إعلان متاح" });
    mockDb.startListingConversation.mockResolvedValue({ id: 71, listingId: 42, ownerId: 90, buyerId: user.id });
    const caller = appRouter.createCaller(context());

    await expect(caller.conversations.start({ listingId: 42 })).resolves.toMatchObject({ id: 71, buyerId: user.id });
    expect(mockDb.startListingConversation).toHaveBeenCalledWith({ listingId: 42, ownerId: 90, buyerId: user.id });
  });

  it("يرفض بدء المحادثة عندما يوجد حظر بين الطرفين", async () => {
    mockDb.getListingById.mockResolvedValue({ id: 42, userId: 90, status: "published", title: "إعلان متاح" });
    mockDb.startListingConversation.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(context());

    await expect(caller.conversations.start({ listingId: 42 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("يرفض إرسال رسالة حين لا يكون المستخدم من المشاركين", async () => {
    mockDb.sendConversationMessage.mockResolvedValue(undefined);
    const caller = appRouter.createCaller(context());
    await expect(caller.conversations.send({ conversationId: 31, body: "هل ما زال الإعلان متاحًا؟" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("يرسل رسالة عندما يكون المستخدم مشاركًا في المحادثة", async () => {
    const message = { id: 14, conversationId: 31, senderId: user.id, body: "هل ما زال الإعلان متاحًا؟", createdAt: new Date() };
    mockDb.sendConversationMessage.mockResolvedValue({ message, recipientId: 90 });
    const caller = appRouter.createCaller(context());

    await expect(caller.conversations.send({ conversationId: 31, body: message.body })).resolves.toEqual(message);
    expect(mockDb.sendConversationMessage).toHaveBeenCalledWith({ conversationId: 31, senderId: user.id, body: message.body });
    expect(mockDb.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 90, type: "new_message" }));
  });

  it("يعلم الرسائل الواردة كمقروءة للمشارك فقط", async () => {
    mockDb.markConversationMessagesRead.mockResolvedValue(true);
    const caller = appRouter.createCaller(context());

    await expect(caller.conversations.markRead({ conversationId: 31 })).resolves.toEqual({ ok: true });
    expect(mockDb.markConversationMessagesRead).toHaveBeenCalledWith(31, user.id);
  });

  it("يرفض تعليم الرسائل كمقروءة لغير المشارك", async () => {
    mockDb.markConversationMessagesRead.mockResolvedValue(false);
    const caller = appRouter.createCaller(context());

    await expect(caller.conversations.markRead({ conversationId: 31 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("يعرض إجمالي الرسائل غير المقروءة للمستخدم المسجل فقط", async () => {
    mockDb.getUnreadMessageCount.mockResolvedValue(3);
    const caller = appRouter.createCaller(context());

    await expect(caller.conversations.unreadCount()).resolves.toBe(3);
    expect(mockDb.getUnreadMessageCount).toHaveBeenCalledWith(user.id);
  });
});

describe("إجراءات لوحة المدير", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.listAdminContentReports.mockResolvedValue([]);
    mockDb.listAdminDeletionRequests.mockResolvedValue([]);
    mockDb.listAdminSupportRequests.mockResolvedValue([]);
  });

  it("يرفض الوصول إلى لوحة المدير للمستخدم العادي", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.admin.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mockDb.listAdminContentReports).not.toHaveBeenCalled();
  });

  it("يعرض العدادات الإدارية للمدير فقط", async () => {
    mockDb.listAdminContentReports.mockResolvedValue([{ report: { status: "open" } }, { report: { status: "resolved" } }]);
    mockDb.listAdminDeletionRequests.mockResolvedValue([{ request: { status: "reviewing" } }]);
    mockDb.listAdminSupportRequests.mockResolvedValue([{ status: "open" }, { status: "resolved" }]);
    const caller = appRouter.createCaller(adminContext());

    await expect(caller.admin.overview()).resolves.toEqual({
      openReports: 1,
      openDeletionRequests: 1,
      openSupportRequests: 1,
    });
  });

  it("يسجل المدير الذي أغلق بلاغًا وطلب حذف", async () => {
    mockDb.updateAdminContentReportStatus.mockResolvedValue(true);
    mockDb.updateAdminDeletionRequestStatus.mockResolvedValue(true);
    const caller = appRouter.createCaller(adminContext());

    await expect(caller.admin.updateReportStatus({ id: 8, status: "resolved" })).resolves.toEqual({ ok: true });
    await expect(caller.admin.updateDeletionRequestStatus({ id: 4, status: "completed" })).resolves.toEqual({ ok: true });
    expect(mockDb.updateAdminContentReportStatus).toHaveBeenCalledWith(8, "resolved", 1);
    expect(mockDb.updateAdminDeletionRequestStatus).toHaveBeenCalledWith(4, "completed", 1);
  });

  it("يسمح للمدير بتحديث تذكرة الدعم ويرفض المستخدم العادي", async () => {
    mockDb.updateAdminSupportRequestStatus.mockResolvedValue(true);
    const adminCaller = appRouter.createCaller(adminContext());
    const userCaller = appRouter.createCaller(context());

    await expect(adminCaller.admin.updateSupportRequestStatus({ id: 3, status: "resolved" })).resolves.toEqual({ ok: true });
    await expect(userCaller.admin.updateSupportRequestStatus({ id: 3, status: "resolved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mockDb.updateAdminSupportRequestStatus).toHaveBeenCalledWith(3, "resolved");
  });

  it("يعرض خطأ واضحًا عندما لا يعثر المدير على سجل للتحديث", async () => {
    mockDb.updateAdminContentReportStatus.mockResolvedValue(false);
    mockDb.updateAdminDeletionRequestStatus.mockResolvedValue(false);
    mockDb.updateAdminSupportRequestStatus.mockResolvedValue(false);
    const caller = appRouter.createCaller(adminContext());

    await expect(caller.admin.updateReportStatus({ id: 8, status: "reviewing" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.admin.updateDeletionRequestStatus({ id: 4, status: "reviewing" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.admin.updateSupportRequestStatus({ id: 3, status: "reviewing" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

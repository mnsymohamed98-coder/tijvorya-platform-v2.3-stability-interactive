"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { defaultPlatformSettings, initialAuditLog, initialConversations, initialMessages, initialOrders, initialProducts, initialReels, initialStores, initialUsers, platformAdminUser } from "@/data/seed";
import { getCurrentUser, resetLocalAuthAccounts } from "@/lib/auth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  changeOrderStatus,
  changeReelStatus,
  insertConversation,
  insertMessage,
  insertOrder,
  insertReel,
  loadAdminWorkspace,
  loadCustomerWorkspace,
  loadMerchantWorkspace,
  removeProduct,
  updateConversation,
  updateProfile,
  updateOwnProfile,
  upsertProduct,
  upsertStore,
  upsertPlatformSettings,
} from "@/lib/supabase/repository";
import { uid } from "@/lib/utils";
import type {
  AdminRole,
  AppUser,
  AuditAction,
  ChatMessage,
  Conversation,
  AuditEntry,
  CartItem,
  Locale,
  Order,
  PlatformSettings,
  Product,
  Reel,
  Store,
  ToastMessage,
  MessageSenderRole,
  UserRole,
} from "@/types";

const STORAGE_KEY = "tijvorya-local-v3";
const LEGACY_STORAGE_KEY = "tijvorya-demo-v2";

type PersistedState = {
  users: AppUser[];
  stores: Store[];
  products: Product[];
  reels: Reel[];
  orders: Order[];
  conversations: Conversation[];
  messages: ChatMessage[];
  cart: CartItem[];
  favoriteIds: string[];
  likedReelIds: string[];
  currentUser: AppUser | null;
  platformSettings: PlatformSettings;
  auditLog: AuditEntry[];
};

type ModerateInput = { rejectionReason?: string };

type AppContextValue = PersistedState & {
  locale: Locale;
  ready: boolean;
  workspaceLoading: boolean;
  loadError: boolean;
  retryHydrate: () => void;
  productionMode: boolean;
  toasts: ToastMessage[];
  setCurrentUser: (user: AppUser | null) => void;
  updateAccountProfile: (changes: { fullName: string; phone?: string }) => Promise<void>;
  addToCart: (productId: string, quantity?: number, variant?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, variant?: string) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  toggleLikeReel: (reelId: string) => void;
  saveProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  saveReel: (reel: Reel) => Promise<void>;
  startConversation: (input: { storeId: string; subject: string; productId?: string; orderId?: string; initialMessage: string }) => Promise<Conversation>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  markConversationRead: (conversationId: string, audience: "merchant" | "customer") => Promise<void>;
  setConversationStatus: (conversationId: string, status: Conversation["status"]) => Promise<void>;
  createOrder: (input: Pick<Order, "customerName" | "phone" | "address" | "notes">) => Promise<Order>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
  moderateReel: (id: string, status: Reel["status"], input?: ModerateInput) => Promise<void>;
  updateStore: (store: Store) => Promise<void>;
  setStoreStatus: (id: string, status: Store["status"]) => Promise<void>;
  setStoreVerified: (id: string, verified: boolean) => Promise<void>;
  setUserStatus: (id: string, status: AppUser["status"]) => Promise<void>;
  setUserRole: (id: string, role: UserRole) => Promise<void>;
  setAdminRole: (id: string, adminRole: AdminRole) => Promise<void>;
  updatePlatformSettings: (settings: PlatformSettings) => Promise<void>;
  toast: (text: string, tone?: ToastMessage["tone"]) => void;
  resetDemo: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const LEGACY_FAKE_USER_IDS = new Set([
  "usr_merchant", "usr_admin", "usr_moderator", "usr_store_manager", "usr_support", "usr_finance", "usr_influencer", "usr_customer",
]);
const LEGACY_FAKE_STORE_IDS = new Set(["store_urban", "store_noor", "store_tech"]);

function initialLocalState(): PersistedState {
  return {
    users: initialUsers,
    stores: initialStores,
    products: initialProducts,
    reels: initialReels,
    orders: initialOrders,
    conversations: initialConversations,
    messages: initialMessages,
    cart: [],
    favoriteIds: [],
    likedReelIds: [],
    currentUser: null,
    platformSettings: defaultPlatformSettings,
    auditLog: initialAuditLog,
  };
}

function emptyState(): PersistedState {
  return {
    users: [],
    stores: [],
    products: [],
    reels: [],
    orders: [],
    conversations: [],
    messages: [],
    cart: [],
    favoriteIds: [],
    likedReelIds: [],
    currentUser: null,
    platformSettings: defaultPlatformSettings,
    auditLog: [],
  };
}

function isLegacyFakeUser(user: AppUser) {
  return LEGACY_FAKE_USER_IDS.has(user.id) || user.email.toLowerCase().endsWith("@tijvorya.demo");
}

function sanitizePersisted(raw: Partial<PersistedState>): PersistedState {
  const object = raw && typeof raw === "object" ? raw : {};
  const persistedUsers = Array.isArray(object.users) ? object.users.filter(Boolean).filter((user) => !isLegacyFakeUser(user)) : [];
  const users = [platformAdminUser, ...persistedUsers.filter((user) => user.id !== platformAdminUser.id && user.email.toLowerCase() !== platformAdminUser.email.toLowerCase())];
  const stores = Array.isArray(object.stores)
    ? object.stores.filter(Boolean).filter((store) => !LEGACY_FAKE_STORE_IDS.has(store.id) && !LEGACY_FAKE_USER_IDS.has(store.ownerId))
    : [];
  const storeIds = new Set(stores.map((store) => store.id));
  const products = Array.isArray(object.products) ? object.products.filter(Boolean).filter((product) => storeIds.has(product.storeId)) : [];
  const productIds = new Set(products.map((product) => product.id));
  const reels = Array.isArray(object.reels) ? object.reels.filter(Boolean).filter((reel) => storeIds.has(reel.storeId) && productIds.has(reel.productId)) : [];
  const orders = Array.isArray(object.orders) ? object.orders.filter(Boolean).filter((order) => storeIds.has(order.storeId)) : [];
  const conversations = Array.isArray(object.conversations) ? object.conversations.filter(Boolean).filter((conversation) => storeIds.has(conversation.storeId)) : [];
  const conversationIds = new Set(conversations.map((conversation) => conversation.id));
  const messages = Array.isArray(object.messages) ? object.messages.filter(Boolean).filter((message) => conversationIds.has(message.conversationId)) : [];
  const currentUser = object.currentUser && typeof object.currentUser === "object" && !isLegacyFakeUser(object.currentUser)
    ? object.currentUser
    : null;
  return {
    users,
    stores,
    products,
    reels,
    orders,
    conversations,
    messages,
    cart: Array.isArray(object.cart) ? object.cart.filter((item) => productIds.has(item.productId)) : [],
    favoriteIds: Array.isArray(object.favoriteIds) ? object.favoriteIds.filter((id): id is string => typeof id === "string" && productIds.has(id)) : [],
    likedReelIds: Array.isArray(object.likedReelIds) ? object.likedReelIds.filter((id): id is string => typeof id === "string" && reels.some((reel) => reel.id === id)) : [],
    currentUser,
    platformSettings: object.platformSettings && typeof object.platformSettings === "object"
      ? { ...defaultPlatformSettings, ...object.platformSettings }
      : defaultPlatformSettings,
    auditLog: Array.isArray(object.auditLog)
      ? object.auditLog.filter(Boolean).filter((entry) => !LEGACY_FAKE_USER_IDS.has(entry.actorId ?? "") && !LEGACY_FAKE_STORE_IDS.has(entry.targetId))
      : [],
  };
}

export function AppProvider({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const productionMode = isSupabaseConfigured() && process.env.NEXT_PUBLIC_DEMO_MODE !== "true";
  const [state, setState] = useState<PersistedState>(() => productionMode ? emptyState() : initialLocalState());
  const [ready, setReady] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const loadedWorkspaceKey = useRef<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      // A slow/flaky connection to the DB (most visitors are far from the
      // hosting region) previously failed hydrate() silently: state stayed
      // at its empty default, ready still flipped true, and the visitor saw
      // a marketplace/storefront with no stores at all - indistinguishable
      // from there genuinely being none. Retry transient failures a few
      // times before giving up, and surface a real error state on the way
      // out so the UI can tell the visitor to retry instead of going quiet.
      const MAX_ATTEMPTS = 3;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
          if (productionMode) {
            const user = await getCurrentUser();
            const remote = user?.role === "admin"
              ? await loadAdminWorkspace()
              : user?.role === "merchant" || user?.role === "influencer"
                ? await loadMerchantWorkspace(user.id)
                : await loadCustomerWorkspace(user?.id);
            if (active) {
              loadedWorkspaceKey.current = user ? `${user.id}:${user.role}` : null;
              setState((previous) => ({
                ...previous,
                ...remote,
                users: remote.users ?? previous.users,
                currentUser: user,
                cart: [],
                favoriteIds: [],
                likedReelIds: [],
              }));
              setLoadError(false);
            }
          } else {
            const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
            if (raw && active) {
              const cleaned = sanitizePersisted(JSON.parse(raw) as Partial<PersistedState>);
              setState(cleaned);
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
              window.localStorage.removeItem(LEGACY_STORAGE_KEY);
            }
          }
          break;
        } catch (error) {
          console.error(error);
          if (attempt === MAX_ATTEMPTS) {
            if (active) setLoadError(true);
          } else if (active) {
            await new Promise((resolve) => window.setTimeout(resolve, attempt * 800));
          }
        }
      }
      if (active) setReady(true);
    }
    hydrate();

    const supabase = productionMode ? createClient() : null;
    // Never await another Supabase auth call from inside onAuthStateChange.
    // Doing so can deadlock signInWithPassword/signInWithOAuth and leave the
    // login button spinning forever. Defer the refresh to the next task.
    // Only SIGNED_IN/SIGNED_OUT represent an actual identity change. Supabase
    // also fires INITIAL_SESSION immediately on subscribe (duplicating the
    // hydrate() call above) and TOKEN_REFRESHED on silent token renewal -
    // reacting to those forced a full, redundant workspace reload each time.
    const subscription = supabase?.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      window.setTimeout(() => {
        void (async () => {
          const user = await getCurrentUser();
          if (active) {
            loadedWorkspaceKey.current = null;
            setWorkspaceLoading(Boolean(user));
            setState((previous) => ({ ...previous, currentUser: user }));
          }
        })();
      }, 0);
    }).data.subscription;

    return () => { active = false; subscription?.unsubscribe(); };
  }, [productionMode]);

  useEffect(() => {
    if (!ready || productionMode) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready, productionMode]);

  useEffect(() => {
    if (!productionMode || !ready) return;
    const user = state.currentUser;
    if (!user) { setWorkspaceLoading(false); return; }
    const userId = user.id;
    const userRole = user.role;
    const workspaceKey = `${userId}:${userRole}`;
    if (loadedWorkspaceKey.current === workspaceKey) { setWorkspaceLoading(false); return; }
    let active = true;
    setWorkspaceLoading(true);
    async function loadRoleWorkspace() {
      try {
        const remote = userRole === "admin"
          ? await loadAdminWorkspace()
          : userRole === "merchant" || userRole === "influencer"
            ? await loadMerchantWorkspace(userId)
            : await loadCustomerWorkspace(userId);
        if (!active) return;
        loadedWorkspaceKey.current = workspaceKey;
        setState((previous) => ({
          ...previous,
          ...remote,
          users: remote.users ?? previous.users,
          currentUser: previous.currentUser,
        }));
      } catch (error) {
        console.error("Unable to load role workspace", error);
      } finally {
        if (active) setWorkspaceLoading(false);
      }
    }
    void loadRoleWorkspace();
    return () => { active = false; };
  }, [productionMode, ready, state.currentUser?.id, state.currentUser?.role]);

  useEffect(() => {
    if (productionMode) return;
    function syncAcrossTabs(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try { setState(sanitizePersisted(JSON.parse(event.newValue) as Partial<PersistedState>)); }
      catch (error) { console.error("Unable to sync Tijvorya local state", error); }
    }
    window.addEventListener("storage", syncAcrossTabs);
    return () => window.removeEventListener("storage", syncAcrossTabs);
  }, [productionMode]);

  useEffect(() => {
    if (!productionMode || !state.currentUser) return;
    const supabase = createClient();
    if (!supabase) return;
    let active = true;
    let refreshing = false;
    async function refreshCommunication() {
      if (refreshing) return;
      refreshing = true;
      try {
        const user = state.currentUser;
        const remote = user?.role === "admin"
          ? await loadAdminWorkspace()
          : user?.role === "merchant" || user?.role === "influencer"
            ? await loadMerchantWorkspace(user.id)
            : await loadCustomerWorkspace(user?.id);
        if (active) {
          setState((previous) => ({
            ...previous,
            conversations: remote.conversations,
            messages: remote.messages,
          }));
        }
      } catch (error) {
        console.error("Unable to refresh messaging workspace", error);
      } finally {
        refreshing = false;
      }
    }
    const channel = supabase
      .channel(`tijvorya-messages-${state.currentUser.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, refreshCommunication)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refreshCommunication)
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [productionMode, state.currentUser]);

  const toast = useCallback((text: string, tone: ToastMessage["tone"] = "success") => {
    const id = uid("toast");
    setToasts((items) => [...items, { id, text, tone }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3500);
  }, []);

  const appendAudit = useCallback((action: AuditAction, targetId: string, details: string, actorId?: string) => {
    const entry: AuditEntry = { id: uid("audit"), action, targetId, details, actorId, createdAt: new Date().toISOString() };
    setState((previous) => ({ ...previous, auditLog: [entry, ...previous.auditLog].slice(0, 200) }));
  }, []);

  const setCurrentUser = useCallback((currentUser: AppUser | null) => {
    if (productionMode) {
      loadedWorkspaceKey.current = null;
      setWorkspaceLoading(Boolean(currentUser));
    }
    setState((previous) => ({
      ...previous,
      currentUser,
      users: !productionMode && currentUser && !previous.users.some((user) => user.id === currentUser.id)
        ? [currentUser, ...previous.users]
        : previous.users,
    }));
  }, [productionMode]);

  const updateAccountProfile = useCallback(async (changes: { fullName: string; phone?: string }) => {
    const current = state.currentUser;
    if (!current) throw new Error(locale === "ar" ? "سجّل الدخول أولًا." : "Sign in first.");
    const fullName = changes.fullName.trim();
    if (fullName.length < 2) throw new Error(locale === "ar" ? "اكتب اسمًا صحيحًا." : "Enter a valid name.");
    if (productionMode) await updateOwnProfile(current.id, { fullName, phone: changes.phone });
    const updated: AppUser = { ...current, fullName, phone: changes.phone !== undefined ? (changes.phone.trim() || undefined) : current.phone };
    setState((previous) => ({
      ...previous,
      currentUser: updated,
      users: previous.users.map((user) => user.id === updated.id ? updated : user),
    }));
    toast(locale === "ar" ? "تم تحديث بيانات الحساب" : "Account profile updated");
  }, [state.currentUser, productionMode, locale, toast]);

  const addToCart = useCallback((productId: string, quantity = 1, variant?: string) => {
    const target = state.products.find((product) => product.id === productId);
    if (!target || target.stock < 1) { toast(locale === "ar" ? "المنتج غير متوفر" : "Product is unavailable", "error"); return; }
    const existingStore = state.cart.length ? state.products.find((product) => product.id === state.cart[0].productId)?.storeId : undefined;
    if (existingStore && existingStore !== target.storeId) {
      toast(locale === "ar" ? "يمكن تنفيذ طلب واحد من متجر واحد. أفرغ السلة أولًا." : "One checkout can contain products from one store only.", "error");
      return;
    }
    setState((previous) => {
      const current = previous.cart.find((item) => item.productId === productId && item.variant === variant);
      const cart = current
        ? previous.cart.map((item) => item === current ? { ...item, quantity: Math.min(item.quantity + quantity, target.stock) } : item)
        : [...previous.cart, { productId, quantity: Math.min(quantity, target.stock), variant }];
      return { ...previous, cart };
    });
    toast(locale === "ar" ? "تمت إضافة المنتج إلى السلة" : "Product added to cart");
  }, [state.products, state.cart, locale, toast]);

  const updateCartQuantity = useCallback((productId: string, quantity: number, variant?: string) => {
    setState((previous) => ({
      ...previous,
      cart: quantity <= 0
        ? previous.cart.filter((item) => !(item.productId === productId && item.variant === variant))
        : previous.cart.map((item) => item.productId === productId && item.variant === variant ? { ...item, quantity } : item),
    }));
  }, []);

  const removeFromCart = useCallback((productId: string, variant?: string) => setState((previous) => ({
    ...previous, cart: previous.cart.filter((item) => !(item.productId === productId && item.variant === variant)),
  })), []);
  const clearCart = useCallback(() => setState((previous) => ({ ...previous, cart: [] })), []);
  const toggleFavorite = useCallback((productId: string) => setState((previous) => ({ ...previous, favoriteIds: previous.favoriteIds.includes(productId) ? previous.favoriteIds.filter((id) => id !== productId) : [...previous.favoriteIds, productId] })), []);
  const toggleLikeReel = useCallback((reelId: string) => setState((previous) => ({
    ...previous,
    likedReelIds: previous.likedReelIds.includes(reelId) ? previous.likedReelIds.filter((id) => id !== reelId) : [...previous.likedReelIds, reelId],
    reels: previous.reels.map((reel) => reel.id === reelId ? { ...reel, likes: Math.max(0, reel.likes + (previous.likedReelIds.includes(reelId) ? -1 : 1)) } : reel),
  })), []);

  const saveProduct = useCallback(async (product: Product) => {
    if (productionMode) await upsertProduct(product);
    setState((previous) => ({ ...previous, products: previous.products.some((item) => item.id === product.id) ? previous.products.map((item) => item.id === product.id ? product : item) : [product, ...previous.products] }));
    toast(locale === "ar" ? "تم حفظ المنتج" : "Product saved");
  }, [productionMode, toast, locale]);

  const deleteProduct = useCallback(async (id: string) => {
    if (productionMode) await removeProduct(id);
    setState((previous) => ({ ...previous, products: previous.products.filter((item) => item.id !== id) }));
    toast(locale === "ar" ? "تم حذف المنتج" : "Product deleted", "info");
  }, [productionMode, toast, locale]);

  const saveReel = useCallback(async (input: Reel) => {
    const now = new Date().toISOString();
    const finalStatus: Reel["status"] = input.status === "draft"
      ? "draft"
      : state.platformSettings.reelModerationRequired ? "pending" : "approved";
    const reel: Reel = {
      ...input,
      status: finalStatus,
      submittedAt: finalStatus === "draft" ? undefined : input.submittedAt ?? now,
      createdAt: input.createdAt ?? now,
      rejectionReason: undefined,
      reviewedAt: finalStatus === "approved" ? now : undefined,
      reviewedBy: finalStatus === "approved" ? state.currentUser?.id : undefined,
    };
    if (productionMode) await insertReel(reel);
    setState((previous) => ({
      ...previous,
      reels: previous.reels.some((item) => item.id === reel.id)
        ? previous.reels.map((item) => item.id === reel.id ? reel : item)
        : [reel, ...previous.reels],
    }));
    if (reel.status !== "draft") appendAudit("reel_submitted", reel.id, `تم إرسال الريلز ${reel.id} للمراجعة`, state.currentUser?.id);
    toast(locale === "ar" ? (reel.status === "draft" ? "تم حفظ الريلز كمسودة" : reel.status === "pending" ? "تم إرسال الريلز للمراجعة" : "تم نشر الريلز") : (reel.status === "draft" ? "Reel saved as draft" : reel.status === "pending" ? "Reel submitted for review" : "Reel published"));
  }, [productionMode, state.platformSettings.reelModerationRequired, state.currentUser?.id, appendAudit, toast, locale]);

  const startConversation = useCallback(async (input: { storeId: string; subject: string; productId?: string; orderId?: string; initialMessage: string }) => {
    if (!state.platformSettings.messagingEnabled) throw new Error(locale === "ar" ? "الرسائل متوقفة حاليًا" : "Messaging is currently disabled");
    if (!state.currentUser) throw new Error(locale === "ar" ? "سجّل الدخول لبدء المحادثة" : "Sign in to start a conversation");
    if (state.currentUser.role !== "customer") throw new Error(locale === "ar" ? "بدء محادثة جديدة متاح لحساب العميل" : "New conversations can be started from a customer account");
    const targetStore = state.stores.find((store) => store.id === input.storeId && (store.status ?? "active") === "active");
    if (!targetStore) throw new Error(locale === "ar" ? "المتجر غير متاح للمراسلة" : "This store is not available for messaging");
    if (input.productId) {
      const targetProduct = state.products.find((product) => product.id === input.productId && product.storeId === input.storeId && product.status === "active");
      if (!targetProduct) throw new Error(locale === "ar" ? "المنتج المحدد غير متاح في هذا المتجر" : "The selected product is not available in this store");
    }
    if (input.orderId) {
      const targetOrder = state.orders.find((order) => order.id === input.orderId && order.storeId === input.storeId && order.customerId === state.currentUser?.id);
      if (!targetOrder) throw new Error(locale === "ar" ? "لا يمكن ربط هذه المحادثة بالطلب المحدد" : "This conversation cannot be linked to the selected order");
    }
    const text = input.initialMessage.trim();
    if (!text) throw new Error(locale === "ar" ? "اكتب رسالتك أولًا" : "Write your message first");
    const now = new Date().toISOString();
    const existing = state.conversations.find((conversation) =>
      conversation.storeId === input.storeId &&
      conversation.customerId === state.currentUser?.id &&
      conversation.status === "open" &&
      conversation.productId === input.productId &&
      conversation.orderId === input.orderId
    );
    const conversation: Conversation = existing ?? {
      id: uid("conv"),
      storeId: input.storeId,
      customerId: state.currentUser.id,
      customerName: state.currentUser.fullName,
      customerAvatar: state.currentUser.avatar,
      subject: input.subject.trim() || (locale === "ar" ? "استفسار جديد" : "New inquiry"),
      productId: input.productId,
      orderId: input.orderId,
      status: "open",
      unreadByMerchant: 0,
      unreadByCustomer: 0,
      lastMessageAt: now,
      createdAt: now,
    };
    const message: ChatMessage = {
      id: uid("msg"),
      conversationId: conversation.id,
      senderId: state.currentUser.id,
      senderRole: "customer",
      text,
      createdAt: now,
    };
    const updatedConversation = { ...conversation, lastMessageAt: now, unreadByMerchant: conversation.unreadByMerchant + 1 };
    if (productionMode) {
      if (!existing) await insertConversation(conversation);
      await insertMessage(message);
    }
    setState((previous) => ({
      ...previous,
      conversations: existing
        ? previous.conversations.map((item) => item.id === conversation.id ? updatedConversation : item)
        : [updatedConversation, ...previous.conversations],
      messages: [...previous.messages, message],
    }));
    appendAudit("message_sent", conversation.id, `رسالة جديدة في المحادثة ${conversation.id}`, state.currentUser.id);
    toast(locale === "ar" ? "تم إرسال رسالتك إلى المتجر" : "Your message was sent to the store");
    return updatedConversation;
  }, [state.platformSettings.messagingEnabled, state.currentUser, state.conversations, state.stores, state.products, state.orders, productionMode, appendAudit, toast, locale]);

  const sendMessage = useCallback(async (conversationId: string, textInput: string) => {
    if (!state.platformSettings.messagingEnabled) throw new Error(locale === "ar" ? "الرسائل متوقفة حاليًا" : "Messaging is currently disabled");
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation || !state.currentUser) throw new Error(locale === "ar" ? "المحادثة غير متاحة" : "Conversation is unavailable");
    if (conversation.status === "closed") throw new Error(locale === "ar" ? "المحادثة مغلقة" : "Conversation is closed");
    const text = textInput.trim();
    if (!text) return;
    const role: MessageSenderRole = state.currentUser.role === "admin" ? "admin" : state.currentUser.role === "customer" ? "customer" : "merchant";
    const ownsTargetStore = state.stores.some((store) => store.id === conversation.storeId && store.ownerId === state.currentUser?.id);
    const isParticipant = role === "admin" || (role === "customer" ? conversation.customerId === state.currentUser.id : ownsTargetStore);
    if (!isParticipant) throw new Error(locale === "ar" ? "لا تملك صلاحية الكتابة في هذه المحادثة" : "You are not allowed to write in this conversation");
    const now = new Date().toISOString();
    const message: ChatMessage = { id: uid("msg"), conversationId, senderId: state.currentUser.id, senderRole: role, text, createdAt: now };
    const updatedConversation: Conversation = {
      ...conversation,
      lastMessageAt: now,
      unreadByMerchant: role === "customer" || role === "admin" ? conversation.unreadByMerchant + 1 : conversation.unreadByMerchant,
      unreadByCustomer: role === "merchant" || role === "admin" ? conversation.unreadByCustomer + 1 : conversation.unreadByCustomer,
    };
    if (productionMode) {
      await insertMessage(message);
    }
    setState((previous) => ({
      ...previous,
      messages: [...previous.messages, message],
      conversations: previous.conversations.map((item) => item.id === conversationId ? updatedConversation : item),
    }));
    appendAudit("message_sent", conversationId, `تم إرسال رسالة في المحادثة ${conversationId}`, state.currentUser.id);
  }, [state.platformSettings.messagingEnabled, state.conversations, state.currentUser, state.stores, productionMode, appendAudit, locale]);

  const markConversationRead = useCallback(async (conversationId: string, audience: "merchant" | "customer") => {
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation || !state.currentUser) return;
    const ownsTargetStore = state.stores.some((store) => store.id === conversation.storeId && store.ownerId === state.currentUser?.id);
    if (audience === "customer" && conversation.customerId !== state.currentUser.id) return;
    if (audience === "merchant" && !ownsTargetStore) return;
    if (audience === "merchant" && conversation.unreadByMerchant === 0) return;
    if (audience === "customer" && conversation.unreadByCustomer === 0) return;
    const updated: Conversation = {
      ...conversation,
      unreadByMerchant: audience === "merchant" ? 0 : conversation.unreadByMerchant,
      unreadByCustomer: audience === "customer" ? 0 : conversation.unreadByCustomer,
    };
    if (productionMode) await updateConversation(updated);
    setState((previous) => ({
      ...previous,
      conversations: previous.conversations.map((item) => item.id === conversationId ? updated : item),
      messages: previous.messages.map((message) =>
        message.conversationId === conversationId && !message.readAt ? { ...message, readAt: new Date().toISOString() } : message
      ),
    }));
  }, [state.conversations, state.currentUser, state.stores, productionMode]);

  const setConversationStatus = useCallback(async (conversationId: string, status: Conversation["status"]) => {
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation || !state.currentUser) return;
    const ownsTargetStore = state.stores.some((store) => store.id === conversation.storeId && store.ownerId === state.currentUser?.id);
    if (state.currentUser.role !== "admin" && !ownsTargetStore) throw new Error(locale === "ar" ? "لا تملك صلاحية تغيير حالة المحادثة" : "You cannot change this conversation status");
    const updated = { ...conversation, status };
    if (productionMode) await updateConversation(updated);
    setState((previous) => ({ ...previous, conversations: previous.conversations.map((item) => item.id === conversationId ? updated : item) }));
    appendAudit(status === "closed" ? "conversation_closed" : "conversation_reopened", conversationId, status === "closed" ? "تم إغلاق المحادثة" : "تمت إعادة فتح المحادثة", state.currentUser?.id);
    toast(locale === "ar" ? (status === "closed" ? "تم إغلاق المحادثة" : "تمت إعادة فتح المحادثة") : (status === "closed" ? "Conversation closed" : "Conversation reopened"), "info");
  }, [state.conversations, state.currentUser, state.stores, productionMode, appendAudit, toast, locale]);

  const createOrder = useCallback(async (input: Pick<Order, "customerName" | "phone" | "address" | "notes">) => {
    if (state.cart.length === 0) throw new Error(locale === "ar" ? "السلة فارغة" : "Cart is empty");
    const storeIds = new Set<string>();
    const items = state.cart.map((cartItem) => {
      const product = state.products.find((item) => item.id === cartItem.productId);
      if (!product || product.status !== "active") throw new Error(locale === "ar" ? "أحد المنتجات لم يعد متاحًا." : "One of the products is no longer available.");
      if (!Number.isInteger(cartItem.quantity) || cartItem.quantity < 1 || cartItem.quantity > product.stock) {
        throw new Error(locale === "ar" ? `الكمية المطلوبة من ${product.name} غير متوفرة.` : `The requested quantity of ${product.nameEn} is unavailable.`);
      }
      storeIds.add(product.storeId);
      return { productId: product.id, name: locale === "ar" ? product.name : product.nameEn, quantity: cartItem.quantity, unitPrice: product.price, variant: cartItem.variant };
    });
    if (storeIds.size !== 1) throw new Error(locale === "ar" ? "يجب أن يحتوي الطلب على منتجات من متجر واحد فقط." : "An order can contain products from one store only.");
    const storeId = [...storeIds][0] ?? "";
    const store = state.stores.find((item) => item.id === storeId);
    if (!store || (store.status ?? "active") !== "active") throw new Error(locale === "ar" ? "المتجر غير متاح لاستقبال الطلبات حاليًا." : "The store is not currently accepting orders.");
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const deliveryFee = Math.max(0, store.deliveryFee ?? 0);
    let order: Order = {
      id: `TJV-${uid("checkout").replace(/[^a-zA-Z0-9]/g, "").slice(-12).toUpperCase()}`, storeId, customerId: state.currentUser?.id,
      ...input, status: "pending", subtotal, deliveryFee, total: subtotal + deliveryFee, items, createdAt: new Date().toISOString(),
    };
    if (productionMode) order = await insertOrder(order);
    const purchased = new Map(items.map((item) => [item.productId, item.quantity]));
    setState((previous) => ({
      ...previous,
      orders: [order, ...previous.orders],
      cart: [],
      products: previous.products.map((product) => purchased.has(product.id)
        ? { ...product, stock: Math.max(0, product.stock - (purchased.get(product.id) ?? 0)) }
        : product),
    }));
    toast(locale === "ar" ? `تم إنشاء الطلب ${order.id}` : `Order ${order.id} created`);
    return order;
  }, [state.cart, state.products, state.stores, state.currentUser, locale, productionMode, toast]);

  const updateOrderStatus = useCallback(async (id: string, status: Order["status"]) => {
    if (productionMode) await changeOrderStatus(id, status);
    setState((previous) => ({ ...previous, orders: previous.orders.map((order) => order.id === id ? { ...order, status } : order) }));
    toast(locale === "ar" ? "تم تحديث حالة الطلب" : "Order status updated");
  }, [productionMode, toast, locale]);

  const moderateReel = useCallback(async (id: string, status: Reel["status"], input?: ModerateInput) => {
    if (status === "rejected" && !input?.rejectionReason?.trim()) {
      throw new Error(locale === "ar" ? "اكتب سبب الرفض قبل المتابعة" : "Add a rejection reason before continuing");
    }
    const reviewedAt = new Date().toISOString();
    if (productionMode) await changeReelStatus(id, status, { rejectionReason: input?.rejectionReason, reviewedBy: state.currentUser?.id });
    setState((previous) => ({
      ...previous,
      reels: previous.reels.map((reel) => reel.id === id ? {
        ...reel,
        status,
        rejectionReason: status === "rejected" ? input?.rejectionReason?.trim() : undefined,
        reviewedAt,
        reviewedBy: state.currentUser?.id,
      } : reel),
    }));
    appendAudit(status === "approved" ? "reel_approved" : "reel_rejected", id, status === "approved" ? `تم اعتماد الريلز ${id}` : `تم رفض الريلز ${id}: ${input?.rejectionReason}`, state.currentUser?.id);
    toast(locale === "ar" ? (status === "approved" ? "تم اعتماد الريلز ونشره" : "تم رفض الريلز وإرسال السبب للتاجر") : (status === "approved" ? "Reel approved and published" : "Reel rejected with feedback"));
  }, [productionMode, state.currentUser?.id, appendAudit, toast, locale]);

  const updateStore = useCallback(async (store: Store) => {
    if (productionMode) await upsertStore(store);
    setState((previous) => ({ ...previous, stores: previous.stores.some((item) => item.id === store.id) ? previous.stores.map((item) => item.id === store.id ? store : item) : [store, ...previous.stores] }));
    toast(locale === "ar" ? "تم تحديث المتجر" : "Store updated");
  }, [productionMode, toast, locale]);

  const setStoreStatus = useCallback(async (id: string, status: Store["status"]) => {
    const target = state.stores.find((store) => store.id === id);
    if (!target) return;
    await updateStore({ ...target, status });
    appendAudit(status === "suspended" ? "store_suspended" : "store_activated", id, status === "suspended" ? `تم تعليق المتجر ${target.name}` : `تم تفعيل المتجر ${target.name}`, state.currentUser?.id);
  }, [state.stores, state.currentUser?.id, updateStore, appendAudit]);

  const setStoreVerified = useCallback(async (id: string, verified: boolean) => {
    const target = state.stores.find((store) => store.id === id);
    if (!target) return;
    await updateStore({ ...target, verified });
    appendAudit(verified ? "store_verified" : "store_unverified", id, verified ? `تم توثيق المتجر ${target.name}` : `تم إلغاء توثيق المتجر ${target.name}`, state.currentUser?.id);
  }, [state.stores, state.currentUser?.id, updateStore, appendAudit]);

  const refreshAdminUsers = useCallback(async () => {
    if (!productionMode) return;

    const remote = await loadAdminWorkspace();

    setState((previous) => ({
      ...previous,
      users: remote.users ?? previous.users,
    }));
  }, [productionMode]);

  const setUserStatus = useCallback(async (id: string, status: AppUser["status"]) => {
    const target = state.users.find((user) => user.id === id);
    if (!target || target.role === "admin") return;

    try {
      if (productionMode) {
        await updateProfile(id, { status });
        await refreshAdminUsers();
      } else {
        const updated = { ...target, status };
        setState((previous) => ({
          ...previous,
          users: previous.users.map((user) => user.id === id ? updated : user),
        }));
      }

      appendAudit(
        status === "suspended" ? "user_suspended" : "user_activated",
        id,
        status === "suspended"
          ? `تم تعليق حساب ${target.fullName}`
          : `تم تفعيل حساب ${target.fullName}`,
        state.currentUser?.id
      );

      toast(
        locale === "ar"
          ? status === "suspended"
            ? "تم تعليق الحساب وحفظ التعديل"
            : "تم تفعيل الحساب وحفظ التعديل"
          : status === "suspended"
            ? "Account suspended and saved"
            : "Account activated and saved"
      );
    } catch (error) {
      console.error("SET_USER_STATUS_ERROR", error);
      toast(
        locale === "ar"
          ? "تعذر حفظ حالة المستخدم في قاعدة البيانات."
          : "Unable to save the user status to the database.",
        "error"
      );
      throw error;
    }
  }, [state.users, state.currentUser?.id, productionMode, refreshAdminUsers, appendAudit, toast, locale]);

  const setUserRole = useCallback(async (id: string, role: UserRole) => {
    const target = state.users.find((user) => user.id === id);
    if (!target || target.role === "admin" || role === "admin") return;

    try {
      if (productionMode) {
        await updateProfile(id, { role });
        await refreshAdminUsers();
      } else {
        const updated = { ...target, role };
        setState((previous) => ({
          ...previous,
          users: previous.users.map((user) => user.id === id ? updated : user),
        }));
      }

      appendAudit(
        "user_role_changed",
        id,
        `تم تغيير دور ${target.fullName} إلى ${role}`,
        state.currentUser?.id
      );

      toast(
        locale === "ar"
          ? "تم تغيير دور المستخدم وحفظ التعديل"
          : "User role updated and saved"
      );
    } catch (error) {
      console.error("SET_USER_ROLE_ERROR", error);
      toast(
        locale === "ar"
          ? "تعذر حفظ دور المستخدم في قاعدة البيانات."
          : "Unable to save the user role to the database.",
        "error"
      );
      throw error;
    }
  }, [state.users, state.currentUser?.id, productionMode, refreshAdminUsers, appendAudit, toast, locale]);

  const setAdminRole = useCallback(async (id: string, adminRole: AdminRole) => {
    const target = state.users.find((user) => user.id === id);
    if (!target || target.role !== "admin") return;

    try {
      if (productionMode) {
        await updateProfile(id, { adminRole });
        await refreshAdminUsers();
      } else {
        const updated = { ...target, adminRole };
        setState((previous) => ({
          ...previous,
          users: previous.users.map((user) => user.id === id ? updated : user),
        }));
      }

      appendAudit(
        "user_role_changed",
        id,
        `تم تغيير الصلاحية الإدارية لـ ${target.fullName} إلى ${adminRole}`,
        state.currentUser?.id
      );

      toast(
        locale === "ar"
          ? "تم تحديث الصلاحية الإدارية وحفظ التعديل"
          : "Administrative permission updated and saved"
      );
    } catch (error) {
      console.error("SET_ADMIN_ROLE_ERROR", error);
      toast(
        locale === "ar"
          ? "تعذر حفظ الصلاحية الإدارية في قاعدة البيانات."
          : "Unable to save the administrative permission to the database.",
        "error"
      );
      throw error;
    }
  }, [state.users, state.currentUser?.id, productionMode, refreshAdminUsers, appendAudit, toast, locale]);

  const updatePlatformSettings = useCallback(async (platformSettings: PlatformSettings) => {
    if (productionMode) await upsertPlatformSettings(platformSettings);
    setState((previous) => ({ ...previous, platformSettings }));
    appendAudit("platform_settings_updated", "platform", "تم تحديث إعدادات المنصة", state.currentUser?.id);
    toast(locale === "ar" ? "تم حفظ إعدادات المنصة" : "Platform settings saved");
  }, [productionMode, appendAudit, state.currentUser?.id, toast, locale]);

  const retryHydrate = useCallback(() => {
    window.location.reload();
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = initialLocalState();
    setState(fresh);
    window.localStorage.removeItem(STORAGE_KEY);
    resetLocalAuthAccounts();
    toast(locale === "ar" ? "تم مسح بيانات التطوير المحلية" : "Local development data cleared", "info");
  }, [toast, locale]);

  const value = useMemo<AppContextValue>(() => ({
    ...state,
    locale,
    ready,
    workspaceLoading,
    loadError,
    retryHydrate,
    productionMode,
    toasts,
    setCurrentUser,
    updateAccountProfile,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    toggleFavorite,
    toggleLikeReel,
    saveProduct,
    deleteProduct,
    saveReel,
    startConversation,
    sendMessage,
    markConversationRead,
    setConversationStatus,
    createOrder,
    updateOrderStatus,
    moderateReel,
    updateStore,
    setStoreStatus,
    setStoreVerified,
    setUserStatus,
    setUserRole,
    setAdminRole,
    updatePlatformSettings,
    toast,
    resetDemo,
  }), [state, locale, ready, workspaceLoading, loadError, retryHydrate, productionMode, toasts, setCurrentUser, updateAccountProfile, addToCart, updateCartQuantity, removeFromCart, clearCart, toggleFavorite, toggleLikeReel, saveProduct, deleteProduct, saveReel, startConversation, sendMessage, markConversationRead, setConversationStatus, createOrder, updateOrderStatus, moderateReel, updateStore, setStoreStatus, setStoreVerified, setUserStatus, setUserRole, setAdminRole, updatePlatformSettings, toast, resetDemo]);

  return <AppContext.Provider value={value}>{children}<ToastViewport messages={toasts} /></AppContext.Provider>;
}

function ToastViewport({ messages }: { messages: ToastMessage[] }) {
  return <div className="toast-viewport" aria-live="polite">{messages.map((message) => <div key={message.id} className={`toast toast-${message.tone}`}>{message.text}</div>)}</div>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
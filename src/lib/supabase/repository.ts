import type { AppUser, ChatMessage, Conversation, Order, PlatformSettings, Product, Reel, Store, StoreTheme, StoreWebsiteProfile } from "@/types";
import { normalizeStoreWebsiteProfile } from "@/lib/store-website";
import { createClient, isSupabaseConfigured } from "./client";

// Explicit column lists (instead of "*") so every workspace load only pulls
// what the mapXxx() functions below actually read, cutting payload size.
const STORE_COLUMNS = "id,owner_id,slug,name,name_en,description,description_en,logo_url,cover_url,rating,verified,city,completion,status,phone,whatsapp,delivery_fee,theme_color,theme,website";
const PRODUCT_COLUMNS = "id,store_id,name,name_en,description,description_en,price,compare_at_price,stock,category,image_url,images,status,rating,variants,featured";
const REEL_COLUMNS = "id,store_id,product_id,caption,caption_en,video_url,cover_url,status,views,likes,created_at,submitted_at,rejection_reason,reviewed_at,reviewed_by,hashtags,best_post_time,ai_score,ai_suggestions,watch_time_seconds,shares,saves,product_clicks,orders_attributed";
const ORDER_ITEM_COLUMNS = "product_id,product_name,quantity,unit_price,variant";
const ORDER_COLUMNS = `id,store_id,customer_id,customer_name,phone,address,notes,status,subtotal,delivery_fee,total,created_at,order_items(${ORDER_ITEM_COLUMNS})`;
const PROFILE_COLUMNS = "id,full_name,email,role,admin_role,status,avatar,phone,created_at";
const PLATFORM_SETTINGS_COLUMNS = "id,platform_name,support_email,maintenance_mode,merchant_registration_enabled,reel_moderation_required,max_reel_size_mb,commission_percent,ai_enabled,ai_product_writer_enabled,ai_reel_writer_enabled,ai_moderation_enabled,ai_daily_request_limit,messaging_enabled,updated_at";
const CONVERSATION_COLUMNS = "id,store_id,customer_id,customer_name,customer_avatar,subject,product_id,order_id,status,unread_by_merchant,unread_by_customer,last_message_at,created_at";
const MESSAGE_COLUMNS = "id,conversation_id,sender_id,sender_role,text,created_at,read_at";

type WorkspaceData = {
  stores: Store[];
  products: Product[];
  reels: Reel[];
  orders: Order[];
  conversations: Conversation[];
  messages: ChatMessage[];
  users?: AppUser[];
  platformSettings?: PlatformSettings;
};

export async function loadPublicData(): Promise<Pick<WorkspaceData, "stores" | "products" | "reels">> {
  if (!isSupabaseConfigured()) return { stores: [], products: [], reels: [] };
  const supabase = createClient();
  if (!supabase) return { stores: [], products: [], reels: [] };
  const [storesResult, productsResult, reelsResult] = await Promise.all([
    supabase.from("stores").select(STORE_COLUMNS).eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("products").select(PRODUCT_COLUMNS).eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("reels").select(REEL_COLUMNS).eq("status", "approved").order("created_at", { ascending: false }),
  ]);
  if (storesResult.error || productsResult.error || reelsResult.error) throw new Error("تعذر تحميل بيانات المنصة من قاعدة البيانات.");
  return {
    stores: (storesResult.data ?? []).map(mapStore),
    products: (productsResult.data ?? []).map(mapProduct),
    reels: (reelsResult.data ?? []).map(mapReel),
  };
}

// Scoped product lookups used to fall back a single store/product/id-list
// instead of assuming the shared client-side product cache is complete.
// See docs/performance-roadmap-AR.md for why loadPublicData() can't keep
// being the only source of truth for `products` as the catalog grows.
export async function loadStoreCatalog(storeId: string): Promise<Product[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS)
    .eq("store_id", storeId).eq("status", "active").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function loadHomepagePreviewProducts(limit: number): Promise<Product[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS)
    .eq("status", "active").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS)
    .eq("id", id).eq("status", "active").maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) return [];
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS)
    .in("id", uniqueIds).eq("status", "active");
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function loadCustomerWorkspace(customerId?: string): Promise<WorkspaceData> {
  const publicData = await loadPublicData();
  if (!customerId) return { ...publicData, orders: [], conversations: [], messages: [] };
  const supabase = createClient();
  if (!supabase) return { ...publicData, orders: [], conversations: [], messages: [] };
  const [ordersResult, communication] = await Promise.all([
    supabase.from("orders").select(ORDER_COLUMNS).eq("customer_id", customerId).order("created_at", { ascending: false }),
    loadConversationWorkspace({ customerId }),
  ]);
  if (ordersResult.error) throw ordersResult.error;
  return {
    ...publicData,
    orders: (ordersResult.data ?? []).map(mapOrder),
    conversations: communication.conversations,
    messages: communication.messages,
  };
}

export async function loadMerchantWorkspace(ownerId: string): Promise<WorkspaceData> {
  const supabase = createClient();
  if (!supabase) return { stores: [], products: [], reels: [], orders: [], conversations: [], messages: [] };
  const { data: storesRows, error: storesError } = await supabase.from("stores").select(STORE_COLUMNS).eq("owner_id", ownerId).order("created_at", { ascending: false });
  if (storesError) throw storesError;
  const stores = (storesRows ?? []).map(mapStore);
  const storeIds = stores.map((store) => store.id);
  if (!storeIds.length) return { stores, products: [], reels: [], orders: [], conversations: [], messages: [] };
  const [productsResult, reelsResult, orders, communication] = await Promise.all([
    supabase.from("products").select(PRODUCT_COLUMNS).in("store_id", storeIds).order("created_at", { ascending: false }),
    supabase.from("reels").select(REEL_COLUMNS).in("store_id", storeIds).order("created_at", { ascending: false }),
    loadMerchantOrders(storeIds),
    loadConversationWorkspace({ storeIds }),
  ]);
  if (productsResult.error || reelsResult.error) throw productsResult.error ?? reelsResult.error;
  return {
    stores,
    products: (productsResult.data ?? []).map(mapProduct),
    reels: (reelsResult.data ?? []).map(mapReel),
    orders,
    conversations: communication.conversations,
    messages: communication.messages,
  };
}

export async function loadAdminWorkspace(): Promise<WorkspaceData> {
  const supabase = createClient();
  if (!supabase) return { stores: [], products: [], reels: [], orders: [], conversations: [], messages: [], users: [] };
  const [storesResult, productsResult, reelsResult, ordersResult, profilesResult, settingsResult, communication] = await Promise.all([
    supabase.from("stores").select(STORE_COLUMNS).order("created_at", { ascending: false }),
    supabase.from("products").select(PRODUCT_COLUMNS).order("created_at", { ascending: false }),
    supabase.from("reels").select(REEL_COLUMNS).order("created_at", { ascending: false }),
    supabase.from("orders").select(ORDER_COLUMNS).order("created_at", { ascending: false }),
    supabase.from("profiles").select(PROFILE_COLUMNS).order("created_at", { ascending: false }),
    supabase.from("platform_settings").select(PLATFORM_SETTINGS_COLUMNS).eq("id", "main").maybeSingle(),
    loadConversationWorkspace({}),
  ]);
  const error = storesResult.error ?? productsResult.error ?? reelsResult.error ?? ordersResult.error ?? profilesResult.error ?? settingsResult.error;
  if (error) throw error;
  return {
    stores: (storesResult.data ?? []).map(mapStore),
    products: (productsResult.data ?? []).map(mapProduct),
    reels: (reelsResult.data ?? []).map(mapReel),
    orders: (ordersResult.data ?? []).map(mapOrder),
    conversations: communication.conversations,
    messages: communication.messages,
    users: (profilesResult.data ?? []).map(mapUser),
    platformSettings: settingsResult.data ? mapPlatformSettings(settingsResult.data as Record<string, unknown>) : undefined,
  };
}

export async function loadMerchantOrders(storeIds: string[]): Promise<Order[]> {
  const supabase = createClient();
  if (!supabase || storeIds.length === 0) return [];
  const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).in("store_id", storeIds).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

async function loadConversationWorkspace(input: { customerId?: string; storeIds?: string[] }) {
  const supabase = createClient();
  if (!supabase) return { conversations: [] as Conversation[], messages: [] as ChatMessage[] };
  let query = supabase.from("conversations").select(CONVERSATION_COLUMNS).order("last_message_at", { ascending: false });
  if (input.customerId) query = query.eq("customer_id", input.customerId);
  if (input.storeIds?.length) query = query.in("store_id", input.storeIds);
  const { data: conversationRows, error: conversationError } = await query;
  if (conversationError) throw conversationError;
  const conversations = (conversationRows ?? []).map(mapConversation);
  const ids = conversations.map((conversation) => conversation.id);
  if (!ids.length) return { conversations, messages: [] as ChatMessage[] };
  const { data: messageRows, error: messageError } = await supabase.from("messages").select(MESSAGE_COLUMNS).in("conversation_id", ids).order("created_at", { ascending: true });
  if (messageError) throw messageError;
  return { conversations, messages: (messageRows ?? []).map(mapMessage) };
}

export async function insertConversation(conversation: Conversation) {
  const supabase = createClient(); if (!supabase) return;
  const { error } = await supabase.from("conversations").insert({
    id: conversation.id, store_id: conversation.storeId, customer_id: conversation.customerId,
    customer_name: conversation.customerName, customer_avatar: conversation.customerAvatar ?? null,
    subject: conversation.subject, product_id: conversation.productId ?? null, order_id: conversation.orderId ?? null,
    status: conversation.status, unread_by_merchant: conversation.unreadByMerchant,
    unread_by_customer: conversation.unreadByCustomer, last_message_at: conversation.lastMessageAt,
    created_at: conversation.createdAt,
  });
  if (error) throw error;
}

export async function insertMessage(message: ChatMessage) {
  const supabase = createClient(); if (!supabase) return;
  const { error } = await supabase.from("messages").insert({
    id: message.id, conversation_id: message.conversationId, sender_id: message.senderId,
    sender_role: message.senderRole, text: message.text, created_at: message.createdAt, read_at: message.readAt ?? null,
  });
  if (error) throw error;
}

export async function updateConversation(conversation: Conversation) {
  const supabase = createClient(); if (!supabase) return;
  const { error } = await supabase.from("conversations").update({
    status: conversation.status, unread_by_merchant: conversation.unreadByMerchant,
    unread_by_customer: conversation.unreadByCustomer, last_message_at: conversation.lastMessageAt,
  }).eq("id", conversation.id);
  if (error) throw error;
}

export async function upsertProduct(product: Product) {
  const supabase = createClient(); if (!supabase) return;
  const { error } = await supabase.from("products").upsert({
    id: product.id, store_id: product.storeId, name: product.name, name_en: product.nameEn,
    description: product.description, description_en: product.descriptionEn, price: product.price,
    compare_at_price: product.compareAtPrice ?? null, stock: product.stock, category: product.category,
    image_url: product.image, images: product.images ?? [product.image], status: product.status,
    rating: product.rating, variants: product.variants ?? [], featured: product.featured ?? false,
  });
  if (error) throw error;
}

export async function removeProduct(id: string) {
  const supabase = createClient(); if (!supabase) return;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function insertReel(reel: Reel) {
  const supabase = createClient(); if (!supabase) return;
  const { error } = await supabase.from("reels").upsert({
    id: reel.id, store_id: reel.storeId, product_id: reel.productId, caption: reel.caption,
    caption_en: reel.captionEn, video_url: reel.videoUrl, cover_url: reel.cover, status: reel.status,
    views: reel.views, likes: reel.likes, created_at: reel.createdAt,
    submitted_at: reel.submittedAt ?? reel.createdAt,
    rejection_reason: reel.rejectionReason ?? null,
    reviewed_at: reel.reviewedAt ?? null,
    reviewed_by: reel.reviewedBy ?? null, hashtags: reel.hashtags ?? [], best_post_time: reel.bestPostTime ?? null,
    ai_score: reel.aiScore ?? null, ai_suggestions: reel.aiSuggestions ?? [], watch_time_seconds: reel.watchTimeSeconds ?? 0,
    shares: reel.shares ?? 0, saves: reel.saves ?? 0, product_clicks: reel.productClicks ?? 0, orders_attributed: reel.ordersAttributed ?? 0,
  });
  if (error) throw error;
}

export async function insertOrder(order: Order): Promise<Order> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.rpc("create_checkout_order", {
    p_customer_name: order.customerName,
    p_phone: order.phone,
    p_address: order.address,
    p_notes: order.notes ?? null,
    p_items: order.items.map((item) => ({ productId: item.productId, quantity: item.quantity, variant: item.variant ?? null })),
  });
  if (error) throw error;
  if (!data || typeof data !== "object") throw new Error("Checkout did not return an order");
  return mapOrder(data as Record<string, unknown>);
}

export async function changeOrderStatus(id: string, status: Order["status"]) {
  const supabase = createClient(); if (!supabase) return;
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function changeReelStatus(id: string, status: Reel["status"], input?: { rejectionReason?: string; reviewedBy?: string }) {
  const supabase = createClient(); if (!supabase) return;
  const { error } = await supabase.from("reels").update({
    status,
    rejection_reason: status === "rejected" ? input?.rejectionReason ?? "" : null,
    reviewed_by: input?.reviewedBy ?? null,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function upsertStore(store: Store) {
  const supabase = createClient(); if (!supabase) return;
  const { error } = await supabase.from("stores").upsert({
    id: store.id, owner_id: store.ownerId, slug: store.slug, name: store.name, name_en: store.nameEn,
    description: store.description, description_en: store.descriptionEn, logo_url: store.logo, cover_url: store.cover,
    rating: store.rating, verified: store.verified, city: store.city, completion: store.completion,
    status: store.status ?? "active", phone: store.phone ?? null, whatsapp: store.whatsapp ?? null,
    delivery_fee: store.deliveryFee ?? 0, theme_color: store.themeColor ?? store.theme?.accentColor ?? "#2f6fed", theme: store.theme ?? null,
    website: normalizeStoreWebsiteProfile(store.website),
  });
  if (error) {
    if (error.code === "23505" && /slug|stores_slug_key/i.test(error.message ?? "")) throw new Error("STORE_SLUG_TAKEN");
    throw error;
  }
}

export async function updateProfile(id: string, changes: { status?: AppUser["status"]; role?: AppUser["role"]; adminRole?: AppUser["adminRole"] }) {
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase.rpc("admin_update_profile", {
    p_target_id: id,
    p_status: changes.status ?? null,
    p_role: changes.role ?? null,
    p_admin_role: changes.adminRole ?? null,
  });
  if (error) throw error;
}

export async function updateOwnProfile(id: string, changes: { fullName?: string; phone?: string; avatar?: string }) {
  const supabase = createClient();
  if (!supabase) return;
  const payload: Record<string, string | null> = {};
  if (changes.fullName !== undefined) payload.full_name = changes.fullName.trim();
  if (changes.phone !== undefined) payload.phone = changes.phone.trim() || null;
  if (changes.avatar !== undefined) payload.avatar = changes.avatar.trim() || null;
  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase.from("profiles").update(payload).eq("id", id);
  if (error) throw error;
}

export async function upsertPlatformSettings(settings: PlatformSettings) {
  const supabase = createClient(); if (!supabase) return;
  const { error } = await supabase.from("platform_settings").upsert({
    id: "main", platform_name: settings.platformName, support_email: settings.supportEmail,
    maintenance_mode: settings.maintenanceMode, merchant_registration_enabled: settings.merchantRegistrationEnabled,
    reel_moderation_required: settings.reelModerationRequired, max_reel_size_mb: settings.maxReelSizeMB,
    commission_percent: settings.commissionPercent, ai_enabled: settings.aiEnabled,
    ai_product_writer_enabled: settings.aiProductWriterEnabled, ai_reel_writer_enabled: settings.aiReelWriterEnabled,
    ai_moderation_enabled: settings.aiModerationEnabled, ai_daily_request_limit: settings.aiDailyRequestLimit, messaging_enabled: settings.messagingEnabled,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id), storeId: String(row.store_id), customerId: row.customer_id ? String(row.customer_id) : undefined,
    customerName: String(row.customer_name), phone: String(row.phone), address: String(row.address), notes: row.notes ? String(row.notes) : undefined,
    status: row.status as Order["status"], subtotal: Number(row.subtotal ?? row.total), deliveryFee: Number(row.delivery_fee ?? 0), total: Number(row.total),
    items: Array.isArray(row.order_items) ? row.order_items.map((item: Record<string, unknown>) => ({ productId: String(item.product_id), name: String(item.product_name), quantity: Number(item.quantity), unitPrice: Number(item.unit_price), variant: item.variant ? String(item.variant) : undefined })) : [],
    createdAt: String(row.created_at),
  };
}

function mapUser(row: Record<string, unknown>): AppUser {
  const name = String(row.full_name ?? row.email ?? "User");
  return {
    id: String(row.id), fullName: name, email: String(row.email ?? ""), role: (row.role as AppUser["role"]) ?? "customer",
    adminRole: row.admin_role ? row.admin_role as AppUser["adminRole"] : undefined,
    status: (row.status as AppUser["status"]) ?? "active", avatar: String(row.avatar ?? name.slice(0, 2).toUpperCase()),
    phone: row.phone ? String(row.phone) : undefined, createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

function mapStore(row: Record<string, unknown>): Store {
  return {
    id: String(row.id), ownerId: String(row.owner_id), slug: String(row.slug), name: String(row.name), nameEn: String(row.name_en ?? row.name),
    description: String(row.description ?? ""), descriptionEn: String(row.description_en ?? row.description ?? ""), logo: String(row.logo_url ?? "/assets/logo.svg"),
    cover: String(row.cover_url ?? "/assets/cover-urban.svg"), rating: Number(row.rating ?? 0), verified: Boolean(row.verified), city: String(row.city ?? ""),
    completion: Number(row.completion ?? 0), status: (row.status as Store["status"]) ?? "active", phone: row.phone ? String(row.phone) : undefined,
    whatsapp: row.whatsapp ? String(row.whatsapp) : undefined, deliveryFee: Number(row.delivery_fee ?? 0), themeColor: String(row.theme_color ?? "#2f6fed"), theme: mapStoreTheme(row.theme, String(row.theme_color ?? "#2f6fed")),
    website: mapStoreWebsite(row.website),
  };
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id), storeId: String(row.store_id), name: String(row.name), nameEn: String(row.name_en ?? row.name), description: String(row.description ?? ""),
    descriptionEn: String(row.description_en ?? row.description ?? ""), price: Number(row.price), compareAtPrice: row.compare_at_price == null ? undefined : Number(row.compare_at_price),
    stock: Number(row.stock ?? 0), category: String(row.category ?? ""), image: String(row.image_url ?? "/assets/perfume.svg"),
    images: Array.isArray(row.images) ? row.images.map(String) : [], status: (row.status as Product["status"]) ?? "active", rating: Number(row.rating ?? 0),
    variants: Array.isArray(row.variants) ? row.variants.map(String) : [], featured: Boolean(row.featured),
  };
}

function mapReel(row: Record<string, unknown>): Reel {
  return {
    id: String(row.id), storeId: String(row.store_id), productId: String(row.product_id), caption: String(row.caption ?? ""),
    captionEn: String(row.caption_en ?? row.caption ?? ""), videoUrl: String(row.video_url), cover: String(row.cover_url ?? "/assets/reel-1.png"),
    status: (row.status as Reel["status"]) ?? "pending", views: Number(row.views ?? 0), likes: Number(row.likes ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()), submittedAt: row.submitted_at ? String(row.submitted_at) : undefined,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined, reviewedBy: row.reviewed_by ? String(row.reviewed_by) : undefined,
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    hashtags: Array.isArray(row.hashtags) ? row.hashtags.map(String) : [], bestPostTime: row.best_post_time ? String(row.best_post_time) : undefined,
    aiScore: row.ai_score == null ? undefined : Number(row.ai_score), aiSuggestions: Array.isArray(row.ai_suggestions) ? row.ai_suggestions.map(String) : [],
    watchTimeSeconds: Number(row.watch_time_seconds ?? 0), shares: Number(row.shares ?? 0), saves: Number(row.saves ?? 0),
    productClicks: Number(row.product_clicks ?? 0), ordersAttributed: Number(row.orders_attributed ?? 0),
  };
}

function mapConversation(row: Record<string, unknown>): Conversation {
  return {
    id: String(row.id), storeId: String(row.store_id), customerId: String(row.customer_id),
    customerName: String(row.customer_name ?? "Customer"), customerAvatar: row.customer_avatar ? String(row.customer_avatar) : undefined,
    subject: String(row.subject ?? ""), productId: row.product_id ? String(row.product_id) : undefined,
    orderId: row.order_id ? String(row.order_id) : undefined, status: (row.status as Conversation["status"]) ?? "open",
    unreadByMerchant: Number(row.unread_by_merchant ?? 0), unreadByCustomer: Number(row.unread_by_customer ?? 0),
    lastMessageAt: String(row.last_message_at ?? row.created_at ?? new Date().toISOString()),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: String(row.id), conversationId: String(row.conversation_id), senderId: String(row.sender_id),
    senderRole: (row.sender_role as ChatMessage["senderRole"]) ?? "customer", text: String(row.text ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()), readAt: row.read_at ? String(row.read_at) : undefined,
  };
}

function mapStoreWebsite(value: unknown): StoreWebsiteProfile | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  return {
    onboardingCompleted: raw.onboardingCompleted === true,
    businessCategory: String(raw.businessCategory ?? "general"),
    tagline: String(raw.tagline ?? ""),
    taglineEn: String(raw.taglineEn ?? raw.tagline ?? ""),
    about: String(raw.about ?? ""),
    aboutEn: String(raw.aboutEn ?? raw.about ?? ""),
    businessEmail: String(raw.businessEmail ?? ""),
    country: String(raw.country ?? ""),
    address: String(raw.address ?? ""),
    openingHours: String(raw.openingHours ?? ""),
    shippingAreas: String(raw.shippingAreas ?? ""),
    returnPolicy: String(raw.returnPolicy ?? ""),
    instagram: raw.instagram ? String(raw.instagram) : undefined,
    facebook: raw.facebook ? String(raw.facebook) : undefined,
    tiktok: raw.tiktok ? String(raw.tiktok) : undefined,
    legalName: raw.legalName ? String(raw.legalName) : undefined,
    registrationNumber: raw.registrationNumber ? String(raw.registrationNumber) : undefined,
    domain: raw.domain ? String(raw.domain) : undefined,
  };
}

function mapStoreTheme(value: unknown, fallbackAccent: string): StoreTheme {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    preset: (raw.preset as StoreTheme["preset"]) ?? "modern",
    accentColor: String(raw.accentColor ?? fallbackAccent),
    backgroundColor: String(raw.backgroundColor ?? "#f5f8fc"),
    surfaceColor: String(raw.surfaceColor ?? "#ffffff"),
    textColor: String(raw.textColor ?? "#101828"),
    heroStyle: (raw.heroStyle as StoreTheme["heroStyle"]) ?? "cover",
    layout: (raw.layout as StoreTheme["layout"]) ?? "grid",
    font: (raw.font as StoreTheme["font"]) ?? "system",
    buttonStyle: (raw.buttonStyle as StoreTheme["buttonStyle"]) ?? "solid",
    cardRadius: Number(raw.cardRadius ?? 14),
    announcement: raw.announcement ? String(raw.announcement) : undefined,
  };
}

function mapPlatformSettings(row: Record<string, unknown>): PlatformSettings {
  return {
    platformName: String(row.platform_name ?? "Tijvorya"),
    supportEmail: String(row.support_email ?? "mnsymohamed98@gmail.com"),
    maintenanceMode: Boolean(row.maintenance_mode),
    merchantRegistrationEnabled: row.merchant_registration_enabled !== false,
    reelModerationRequired: row.reel_moderation_required !== false,
    maxReelSizeMB: Number(row.max_reel_size_mb ?? 20),
    commissionPercent: Number(row.commission_percent ?? 5),
    aiEnabled: row.ai_enabled !== false,
    aiProductWriterEnabled: row.ai_product_writer_enabled !== false,
    aiReelWriterEnabled: row.ai_reel_writer_enabled !== false,
    aiModerationEnabled: row.ai_moderation_enabled !== false,
    aiDailyRequestLimit: Number(row.ai_daily_request_limit ?? 50),
    messagingEnabled: row.messaging_enabled !== false,
  };
}

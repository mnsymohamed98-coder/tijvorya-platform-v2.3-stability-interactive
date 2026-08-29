export type Locale = "ar" | "en";
export type UserRole = "customer" | "merchant" | "admin" | "influencer";
export type AdminRole = "super_admin" | "content_moderator" | "store_manager" | "customer_support" | "finance_manager";
export type UserStatus = "active" | "suspended";
export type ProductStatus = "active" | "draft" | "archived";
export type ReelStatus = "draft" | "pending" | "approved" | "rejected";
export type StoreStatus = "draft" | "active" | "suspended";
export type StoreThemePreset = "modern" | "boutique" | "minimal" | "bold";
export type StoreHeroStyle = "cover" | "split" | "minimal";
export type StoreLayout = "grid" | "editorial";
export type StoreFont = "system" | "rounded" | "serif";
export type StoreButtonStyle = "solid" | "outline" | "pill";
export type ConversationStatus = "open" | "closed";
export type MessageSenderRole = "customer" | "merchant" | "admin";
export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  adminRole?: AdminRole;
  status?: UserStatus;
  avatar?: string;
  phone?: string;
  createdAt?: string;
}

export interface StoreTheme {
  preset: StoreThemePreset;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  heroStyle: StoreHeroStyle;
  layout: StoreLayout;
  font: StoreFont;
  buttonStyle: StoreButtonStyle;
  cardRadius: number;
  announcement?: string;
}


export interface StoreWebsiteProfile {
  onboardingCompleted: boolean;
  businessCategory: string;
  tagline: string;
  taglineEn: string;
  about: string;
  aboutEn: string;
  businessEmail: string;
  country: string;
  address: string;
  openingHours: string;
  shippingAreas: string;
  returnPolicy: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  legalName?: string;
  registrationNumber?: string;
  domain?: string;
}

export interface Store {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  logo: string;
  cover: string;
  rating: number;
  verified: boolean;
  city: string;
  completion: number;
  status?: StoreStatus;
  phone?: string;
  whatsapp?: string;
  deliveryFee?: number;
  themeColor?: string;
  theme?: StoreTheme;
  website?: StoreWebsiteProfile;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  category: string;
  image: string;
  images?: string[];
  status: ProductStatus;
  rating: number;
  variants?: string[];
  featured?: boolean;
}

export interface Reel {
  id: string;
  storeId: string;
  productId: string;
  caption: string;
  captionEn: string;
  videoUrl: string;
  cover: string;
  status: ReelStatus;
  views: number;
  likes: number;
  createdAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  hashtags?: string[];
  bestPostTime?: string;
  aiScore?: number;
  aiSuggestions?: string[];
  watchTimeSeconds?: number;
  shares?: number;
  saves?: number;
  productClicks?: number;
  ordersAttributed?: number;
  commentsCount?: number;
}

export interface Conversation {
  id: string;
  storeId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  subject: string;
  productId?: string;
  orderId?: string;
  status: ConversationStatus;
  unreadByMerchant: number;
  unreadByCustomer: number;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: MessageSenderRole;
  text: string;
  createdAt: string;
  readAt?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  variant?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  variant?: string;
}

export interface Order {
  id: string;
  storeId: string;
  customerId?: string;
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  status: OrderStatus;
  subtotal?: number;
  deliveryFee?: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  merchantRegistrationEnabled: boolean;
  reelModerationRequired: boolean;
  maxReelSizeMB: number;
  commissionPercent: number;
  aiEnabled: boolean;
  aiProductWriterEnabled: boolean;
  aiReelWriterEnabled: boolean;
  aiModerationEnabled: boolean;
  aiDailyRequestLimit: number;
  messagingEnabled: boolean;
}

export type AuditAction =
  | "reel_submitted"
  | "reel_approved"
  | "reel_rejected"
  | "store_activated"
  | "store_suspended"
  | "store_verified"
  | "store_unverified"
  | "user_activated"
  | "user_suspended"
  | "user_role_changed"
  | "platform_settings_updated"
  | "ai_settings_updated"
  | "message_sent"
  | "conversation_closed"
  | "conversation_reopened";

export interface AuditEntry {
  id: string;
  action: AuditAction;
  actorId?: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  tone: "success" | "error" | "info";
}

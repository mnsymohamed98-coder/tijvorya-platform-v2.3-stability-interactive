import type { AppUser, AuditEntry, ChatMessage, Conversation, Order, PlatformSettings, Product, Reel, Store } from "@/types";

/**
 * Tijvorya starts with no fabricated commerce data.
 * The only built-in identity kept for local development is the platform administrator.
 * Production authentication and all real merchant/customer accounts come from Supabase.
 */
export const platformAdminUser: AppUser = {
  id: "usr_platform_admin",
  fullName: "Tijvorya Platform Admin",
  email: "admin@tijvorya.com",
  role: "admin",
  adminRole: "super_admin",
  status: "active",
  avatar: "TJ",
};

export const initialUsers: AppUser[] = [platformAdminUser];
export const initialStores: Store[] = [];
export const initialProducts: Product[] = [];
export const initialReels: Reel[] = [];
export const initialOrders: Order[] = [];
export const initialConversations: Conversation[] = [];
export const initialMessages: ChatMessage[] = [];
export const initialAuditLog: AuditEntry[] = [];

export const defaultPlatformSettings: PlatformSettings = {
  platformName: "Tijvorya",
  supportEmail: "mnsymohamed98@gmail.com",
  maintenanceMode: false,
  merchantRegistrationEnabled: true,
  reelModerationRequired: true,
  maxReelSizeMB: 20,
  commissionPercent: 5,
  aiEnabled: true,
  aiProductWriterEnabled: true,
  aiReelWriterEnabled: true,
  aiModerationEnabled: true,
  aiDailyRequestLimit: 50,
  messagingEnabled: true,
};

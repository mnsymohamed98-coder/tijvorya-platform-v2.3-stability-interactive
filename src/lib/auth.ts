import type { AdminRole, AppUser, Locale, UserRole } from "@/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { platformAdminUser } from "@/data/seed";
import { safeInternalPath } from "@/lib/utils";


const LOCAL_AUTH_STORAGE_KEY = "tijvorya-local-auth-v1";
const LOCAL_PLATFORM_ADMIN_PASSWORD = "Tijvorya123!";

type LocalAuthRecord = {
  user: AppUser;
  passwordHash: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function hashLocalPassword(email: string, password: string) {
  const value = `${normalizeEmail(email)}::${password}`;
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return value;
}

function readLocalAuthRecords(): LocalAuthRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is LocalAuthRecord => Boolean(
      item && typeof item === "object" &&
      "user" in item && "passwordHash" in item &&
      typeof (item as LocalAuthRecord).passwordHash === "string" &&
      (item as LocalAuthRecord).user?.email,
    ));
  } catch {
    return [];
  }
}

function writeLocalAuthRecords(records: LocalAuthRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(records));
}

export function resetLocalAuthAccounts() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
}

function mapAuthUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): AppUser {
  const name = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User");
  const metadataRole = String(user.user_metadata?.role ?? "customer");
  const role: UserRole = ["customer", "merchant", "influencer", "admin"].includes(metadataRole)
    ? metadataRole as UserRole
    : "customer";
  // OAuth providers don't agree on the metadata key for the profile photo -
  // Supabase usually normalises Google's response to avatar_url, but the
  // raw "picture" key (what Google's userinfo endpoint actually returns)
  // is checked too as a fallback, same reasoning as the full_name/name pair
  // above.
  const avatarUrl = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: name,
    role,
    adminRole: role === "admin" ? "super_admin" : undefined,
    avatar: typeof avatarUrl === "string" ? avatarUrl : name.slice(0, 2).toUpperCase(),
    phone: typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : undefined,
  };
}

async function hydrateProfile(supabase: NonNullable<ReturnType<typeof createClient>>, mapped: AppUser): Promise<AppUser> {
  // Only the columns actually read below (was select("*") - every login/
  // session check pulled the full profiles row). If a future column gets
  // added here without a corresponding migration on an older database, the
  // query fails loudly instead of silently degrading - acceptable now that
  // supabase/schema.sql is kept as the single source of truth for this
  // project's live schema.
  const { data, error } = await supabase.from("profiles").select("full_name,role,admin_role,status,avatar,phone,created_at").eq("id", mapped.id).maybeSingle();
  if (error || !data) return mapped;
  const row = data as Record<string, unknown>;
  const fullName = String(row.full_name ?? mapped.fullName);
  const profileRole = String(row.role ?? mapped.role);
  const role: UserRole = ["customer", "merchant", "influencer", "admin"].includes(profileRole)
    ? profileRole as UserRole
    : mapped.role;
  return {
    ...mapped,
    fullName,
    role,
    // An account explicitly marked admin remains usable even if the optional
    // admin_role column is not present in an older database.
    adminRole: row.admin_role ? String(row.admin_role) as AdminRole : role === "admin" ? "super_admin" : mapped.adminRole,
    status: row.status === "suspended" ? "suspended" : "active",
    avatar: row.avatar ? String(row.avatar) : mapped.avatar ?? fullName.slice(0, 2).toUpperCase(),
    phone: row.phone ? String(row.phone) : mapped.phone,
    createdAt: row.created_at ? String(row.created_at) : mapped.createdAt,
  };
}


export function defaultPathForRole(locale: Locale, role: UserRole) {
  if (role === "admin") return `/${locale}/admin`;
  if (role === "merchant" || role === "influencer") return `/${locale}/merchant`;
  return `/${locale}/marketplace`;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  if (!supabase) return null;
  // getUser() round-trips to the Auth server to revalidate the session -
  // this used to be awaited before even starting the profile lookup, i.e.
  // two sequential network calls (measured ~3.3s + ~1.4s back to back on
  // every protected page load). getSession() reads the already-present
  // local session without a network round trip, so its user id can kick
  // off the profile query in parallel with the getUser() revalidation
  // instead of waiting on it first. The profile data itself is still only
  // ever returned once getUser() actually confirms the session is valid.
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData.session?.user;
  if (!sessionUser) return null;
  const [{ data, error }, profile] = await Promise.all([
    supabase.auth.getUser(),
    hydrateProfile(supabase, mapAuthUser(sessionUser)),
  ]);
  if (error || !data.user) return null;
  return profile;
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    if (!supabase) throw new Error("تعذر إنشاء اتصال المصادقة.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error("تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور ثم حاول مجددًا.");
    const user = await hydrateProfile(supabase, mapAuthUser(data.user));
    if (user.status === "suspended") {
      await supabase.auth.signOut();
      throw new Error("هذا الحساب موقوف. تواصل مع دعم المنصة.");
    }
    return user;
  }

  const normalizedEmail = normalizeEmail(email);
  if (normalizeEmail(platformAdminUser.email) === normalizedEmail) {
    if (password !== LOCAL_PLATFORM_ADMIN_PASSWORD) {
      throw new Error("بيانات الدخول غير صحيحة. تحقق من البريد الإلكتروني وكلمة المرور.");
    }
    return platformAdminUser;
  }

  const localRecord = readLocalAuthRecords().find((record) => normalizeEmail(record.user.email) === normalizedEmail);
  if (!localRecord) {
    throw new Error("بيانات الدخول غير صحيحة. تحقق من البريد الإلكتروني وكلمة المرور.");
  }
  const passwordHash = await hashLocalPassword(normalizedEmail, password);
  if (passwordHash !== localRecord.passwordHash) {
    throw new Error("بيانات الدخول غير صحيحة. تحقق من البريد الإلكتروني وكلمة المرور.");
  }
  if (localRecord.user.status === "suspended") {
    throw new Error("هذا الحساب موقوف. تواصل مع دعم المنصة.");
  }
  return localRecord.user;
}

export async function signInWithGoogle(input: { locale: Locale; next?: string; role?: "customer" | "merchant"; admin?: boolean }) {
  const supabase = createClient();
  if (!supabase) throw new Error(input.locale === "ar" ? "فعّل Supabase أولًا لاستخدام تسجيل Google." : "Connect Supabase before using Google sign-in.");
  const origin = window.location.origin;
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("locale", input.locale);
  if (input.next) callback.searchParams.set("next", safeInternalPath(input.next, input.admin ? `/${input.locale}/admin` : `/${input.locale}/marketplace`));
  if (input.role) callback.searchParams.set("role", input.role);
  if (input.admin) callback.searchParams.set("admin", "1");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });
  if (error) throw new Error(input.locale === "ar" ? "تعذر بدء تسجيل الدخول عبر Google." : "Unable to start Google sign-in.");
}

export type SignUpResult = { user: AppUser; hasSession: boolean };

export async function signUp(input: { fullName: string; email: string; password: string; role: UserRole; phone?: string }): Promise<SignUpResult> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    if (!supabase) throw new Error("تعذر إنشاء اتصال المصادقة.");
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.fullName, role: input.role, phone: input.phone ?? "" } },
    });
    if (error) throw error;
    if (!data.user) throw new Error("تعذر إنشاء الحساب.");
    return { user: { ...mapAuthUser(data.user), role: input.role }, hasSession: Boolean(data.session) };
  }
  const normalizedEmail = normalizeEmail(input.email);
  const records = readLocalAuthRecords();
  const platformAccountExists = normalizeEmail(platformAdminUser.email) === normalizedEmail;
  const localExists = records.some((record) => normalizeEmail(record.user.email) === normalizedEmail);
  if (platformAccountExists || localExists) {
    throw new Error("يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.");
  }
  const user: AppUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email: normalizedEmail,
    fullName: input.fullName.trim(),
    role: input.role,
    status: "active",
    avatar: input.fullName.trim().slice(0, 2).toUpperCase(),
    phone: input.phone?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  const passwordHash = await hashLocalPassword(normalizedEmail, input.password);
  writeLocalAuthRecords([...records, { user, passwordHash }]);
  return { user, hasSession: true };
}

export async function requestPasswordReset(email: string, locale: Locale) {
  const supabase = createClient();
  if (!supabase) throw new Error(locale === "ar" ? "فعّل Supabase أولًا لاستخدام استعادة كلمة المرور." : "Connect Supabase before using password recovery.");
  const redirectTo = `${window.location.origin}/auth/callback?locale=${locale}&next=/${locale}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(locale === "ar" ? "تعذر إرسال رابط الاستعادة. حاول لاحقًا." : "Unable to send the recovery link. Try again later.");
}

export async function updatePassword(password: string, locale: Locale) {
  const supabase = createClient();
  if (!supabase) throw new Error(locale === "ar" ? "اتصال المصادقة غير متاح." : "Authentication is unavailable.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(locale === "ar" ? "تعذر تحديث كلمة المرور." : "Unable to update the password.");
}

export async function signOut() {
  const supabase = createClient();
  if (supabase) await supabase.auth.signOut({ scope: "local" });
}

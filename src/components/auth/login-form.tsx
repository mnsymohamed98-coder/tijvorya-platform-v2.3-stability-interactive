"use client";

import Link from "next/link";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  defaultPathForRole,
  signIn,
  signInWithGoogle,
} from "@/lib/auth";
import { safeInternalPath } from "@/lib/utils";
import { useApp } from "@/providers/app-provider";

export function LoginForm() {
  const { locale, setCurrentUser, toast } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function requestedNext() {
    if (typeof window === "undefined") {
      return undefined;
    }

    return safeInternalPath(
      new URLSearchParams(window.location.search).get("next"),
      ""
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const user = await signIn(email.trim(), password);

      setCurrentUser(user);

      toast(
        locale === "ar"
          ? "مرحبًا بك في Tijvorya"
          : "Welcome to Tijvorya"
      );

      if (user.role === "merchant") {
        router.replace(`/${locale}/merchant`);
        return;
      }

      const requested = requestedNext();

      router.replace(
        requested || defaultPathForRole(locale, user.role)
      );
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Login failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function googleSignIn() {
    setGoogleLoading(true);

    try {
      await signInWithGoogle({
        locale,
        next: `/${locale}/merchant`,
      });
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Google sign-in failed",
        "error"
      );

      setGoogleLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="auth-heading">
        <span className="eyebrow">
          TIJVORYA ACCESS
        </span>

        <h1>
          {locale === "ar"
            ? "تسجيل الدخول"
            : "Sign in"}
        </h1>

        <p>
          {locale === "ar"
            ? "ادخل إلى متجرك وطلباتك وريـلزك من مكان واحد."
            : "Access your store, orders and reels from one place."}
        </p>
      </div>

      <button
        className="oauth-button"
        type="button"
        onClick={googleSignIn}
        disabled={googleLoading || loading}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <path
            fill="#4285F4"
            d="M21.6 12.227c0-.709-.064-1.391-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.509h3.232c1.891-1.741 2.981-4.305 2.981-7.35Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 4.964-.895 6.619-2.423l-3.232-2.509c-.895.6-2.041.955-3.387.955-2.605 0-4.809-1.759-5.596-4.123H3.064v2.591A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.404 13.9A6.02 6.02 0 0 1 6.091 12c0-.659.114-1.3.313-1.9V7.509h-3.34A10 10 0 0 0 2 12c0 1.614.386 3.141 1.064 4.491L6.404 13.9Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.959 2.991 14.695 2 12 2a10 10 0 0 0-8.936 5.509l3.34 2.591C7.191 7.736 9.395 5.977 12 5.977Z"
          />
        </svg>

        {googleLoading && (
          <LoaderCircle className="spin" />
        )}

        <span>
          {locale === "ar"
            ? "المتابعة باستخدام Google"
            : "Continue with Google"}
        </span>
      </button>

      <div className="auth-divider">
        <span>
          {locale === "ar"
            ? "أو باستخدام البريد"
            : "or use email"}
        </span>
      </div>

      <label className="field">
        <span>
          {locale === "ar"
            ? "البريد الإلكتروني"
            : "Email"}
        </span>

        <div className="input-with-icon">
          <Mail />

          <input
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="name@example.com"
          />
        </div>
      </label>

      <label className="field">
        <span>
          {locale === "ar"
            ? "كلمة المرور"
            : "Password"}
        </span>

        <div className="input-with-icon">
          <LockKeyhole />

          <input
            type={show ? "text" : "password"}
            required
            minLength={8}
            autoComplete="current-password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
          />

          <button
            type="button"
            aria-label={
              show
                ? "Hide password"
                : "Show password"
            }
            onClick={() =>
              setShow((value) => !value)
            }
          >
            {show ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </label>

      <div className="form-row-between">
        <span className="secure-session-note">
          <ShieldCheck />

          {locale === "ar"
            ? "جلسة مشفرة ومحمية"
            : "Encrypted protected session"}
        </span>

        <Link
          className="text-button"
          href={`/${locale}/forgot-password`}
        >
          {locale === "ar"
            ? "نسيت كلمة المرور؟"
            : "Forgot password?"}
        </Link>
      </div>

      <button
        className="button button-dark button-block"
        disabled={loading || googleLoading}
      >
        {loading ? (
          <LoaderCircle className="spin" />
        ) : (
          <ShieldCheck />
        )}

        {locale === "ar"
          ? "دخول آمن"
          : "Secure sign in"}
      </button>

      <p className="auth-switch">
        {locale === "ar"
          ? "ليس لديك حساب؟"
          : "New to Tijvorya?"}{" "}

        <Link href={`/${locale}/register`}>
          {locale === "ar"
            ? "أنشئ حسابًا"
            : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
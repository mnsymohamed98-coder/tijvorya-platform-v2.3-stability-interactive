"use client";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/ui/logo";
import { useApp } from "@/providers/app-provider";
export default function LoginPage(){const{locale}=useApp();return <main className="auth-page"><section className="auth-visual has-image"><Logo locale={locale}/><Image className="auth-visual-image" src="/assets/auth-visual-login.jpg" alt="" fill sizes="50vw" priority /></section><section className="auth-panel"><LoginForm/></section></main>;}

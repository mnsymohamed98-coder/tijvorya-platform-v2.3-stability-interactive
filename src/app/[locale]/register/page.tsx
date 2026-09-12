"use client";
import Image from "next/image";
import { RegisterForm } from "@/components/auth/register-form";
import { Logo } from "@/components/ui/logo";
import { useApp } from "@/providers/app-provider";
export default function RegisterPage(){const{locale}=useApp();return <main className="auth-page"><section className="auth-visual register has-image"><Logo locale={locale}/><Image className="auth-visual-image" src="/assets/auth-visual-register.jpg" alt="" fill sizes="50vw" priority /></section><section className="auth-panel"><RegisterForm/></section></main>;}

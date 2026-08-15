"use client";

import { MessageCircle } from "lucide-react";
import { MessagingWorkspace } from "@/components/messages/messaging-workspace";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApp } from "@/providers/app-provider";

export default function Page() {
  const { locale, conversations } = useApp();
  const unread = conversations.reduce((sum, conversation) => sum + conversation.unreadByMerchant + conversation.unreadByCustomer, 0);
  return <>
    <PageHeader eyebrow="MESSAGE GOVERNANCE" title={locale === "ar" ? "مركز الرسائل" : "Messaging center"} text={locale === "ar" ? "عرض المحادثات لدعم النزاعات والرقابة التشغيلية. لا تُعدل الرسائل الأصلية." : "View conversations for support, disputes and operational oversight without altering original messages."} actions={<span className="message-page-badge"><MessageCircle />{unread} {locale === "ar" ? "تنبيهًا" : "alerts"}</span>} />
    <MessagingWorkspace mode="admin" />
  </>;
}

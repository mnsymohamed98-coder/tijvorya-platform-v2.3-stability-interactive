"use client";

import { MessageCircle } from "lucide-react";
import { MessagingWorkspace } from "@/components/messages/messaging-workspace";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApp } from "@/providers/app-provider";

export default function Page() {
  const { locale, conversations, stores, currentUser } = useApp();
  const owned = new Set(stores.filter((store) => store.ownerId === currentUser?.id).map((store) => store.id));
  const unread = conversations.filter((conversation) => owned.has(conversation.storeId)).reduce((sum, conversation) => sum + conversation.unreadByMerchant, 0);
  return <>
    <PageHeader eyebrow="CUSTOMER MESSAGING" title={locale === "ar" ? "رسائل العملاء" : "Customer messages"} text={locale === "ar" ? "محادثات مرتبطة بالمتاجر والمنتجات والطلبات مع عدّاد رسائل غير مقروءة." : "Store, product and order conversations with unread tracking."} actions={<span className="message-page-badge"><MessageCircle />{unread} {locale === "ar" ? "غير مقروءة" : "unread"}</span>} />
    <MessagingWorkspace mode="merchant" />
  </>;
}

"use client";

import { Archive, ArrowLeft, Lock, MessageCircle, MessagesSquare, Package, RotateCcw, Search, Send, ShoppingBag, Store as StoreIcon, UserRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useApp } from "@/providers/app-provider";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

type Mode = "customer" | "merchant" | "admin";

export function MessagingWorkspace({ mode }: { mode: Mode }) {
  return <Suspense fallback={<div className="conversation-empty-main"><MessagesSquare /><p>Loading messages…</p></div>}><MessagingWorkspaceInner mode={mode} /></Suspense>;
}

function MessagingWorkspaceInner({ mode }: { mode: Mode }) {
  const {
    locale,
    currentUser,
    stores,
    products,
    conversations,
    messages,
    platformSettings,
    startConversation,
    sendMessage,
    markConversationRead,
    setConversationStatus,
    toast,
  } = useApp();
  const searchParams = useSearchParams();
  const requestedStoreKey = searchParams.get("store") ?? "";
  const requestedProductId = searchParams.get("product") ?? "";
  const requestedOrderId = searchParams.get("order") ?? "";
  const requestedConversationId = searchParams.get("conversation") ?? "";
  const [selectedId, setSelectedId] = useState<string>(requestedConversationId);
  const [query, setQuery] = useState("");
  const [composeStoreId, setComposeStoreId] = useState("");
  const [composeProductId] = useState(requestedProductId);
  const [composeOrderId] = useState(requestedOrderId);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(!requestedStoreKey && !requestedConversationId);
  const [newConversationMode, setNewConversationMode] = useState(false);

  const ownedStoreIds = useMemo(() => new Set(stores.filter((store) => store.ownerId === currentUser?.id).map((store) => store.id)), [stores, currentUser?.id]);
  const visibleConversations = useMemo(() => {
    const rows = conversations.filter((conversation) => {
      if (mode === "customer") return conversation.customerId === currentUser?.id;
      if (mode === "merchant") return ownedStoreIds.has(conversation.storeId);
      return true;
    });
    const term = query.trim().toLowerCase();
    return rows
      .filter((conversation) => !term || `${conversation.customerName} ${conversation.subject} ${stores.find((store) => store.id === conversation.storeId)?.name ?? ""}`.toLowerCase().includes(term))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }, [conversations, currentUser?.id, mode, ownedStoreIds, query, stores]);

  const requestedStore = stores.find((item) => item.slug === requestedStoreKey || item.id === requestedStoreKey);
  const requestedProduct = products.find((item) => item.id === requestedProductId);
  const requestedConversation = visibleConversations.find((conversation) =>
    conversation.id === requestedConversationId ||
    (
      requestedStore &&
      conversation.storeId === requestedStore.id &&
      conversation.customerId === currentUser?.id &&
      conversation.status === "open" &&
      (!requestedProductId || conversation.productId === requestedProductId) &&
      (!requestedOrderId || conversation.orderId === requestedOrderId)
    )
  );
  const shouldCompose = mode === "customer" && (newConversationMode || Boolean(requestedStore && !requestedConversation && !selectedId));
  const selected = shouldCompose
    ? undefined
    : visibleConversations.find((conversation) => conversation.id === selectedId)
      ?? requestedConversation
      ?? visibleConversations[0];
  const selectedMessages = useMemo(() => messages.filter((message) => message.conversationId === selected?.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [messages, selected?.id]);
  const effectiveComposeStoreId = composeStoreId || requestedStore?.id || "";
  const effectiveComposeProductId = composeProductId || requestedProductId;
  const effectiveComposeOrderId = composeOrderId || requestedOrderId;
  const suggestedSubject = requestedProduct
    ? (locale === "ar" ? `استفسار عن ${requestedProduct.name}` : `Question about ${requestedProduct.nameEn}`)
    : requestedOrderId
      ? (locale === "ar" ? `متابعة الطلب ${requestedOrderId}` : `Order ${requestedOrderId} follow-up`)
      : "";
  const effectiveComposeSubject = composeSubject || suggestedSubject;
  const selectedIdForRead = selected?.id;

  useEffect(() => {
    if (!selectedIdForRead || shouldCompose || mode === "admin") return;
    void markConversationRead(selectedIdForRead, mode === "customer" ? "customer" : "merchant");
  }, [selectedIdForRead, mode, markConversationRead, shouldCompose]);

  if (!platformSettings.messagingEnabled) {
    return <div className="admin-empty"><Lock /><h3>{locale === "ar" ? "نظام الرسائل متوقف" : "Messaging is disabled"}</h3><p>{locale === "ar" ? "يمكن للإدارة تفعيله من إعدادات المنصة." : "An administrator can enable it from platform settings."}</p></div>;
  }

  if (!currentUser) {
    return <div className="auth-gate-card messaging-auth-card"><MessageCircle /><h2>{locale === "ar" ? "سجّل الدخول لاستخدام الرسائل" : "Sign in to use messages"}</h2><p>{locale === "ar" ? "المحادثات مرتبطة بحسابك لحماية الطلبات والبيانات." : "Conversations are linked to your account to protect orders and data."}</p><Link className="button button-dark" href={`/${locale}/login?next=/${locale}/messages`}>{locale === "ar" ? "تسجيل الدخول" : "Sign in"}</Link></div>;
  }

  const roleAllowed = mode === "customer"
    ? currentUser.role === "customer"
    : mode === "merchant"
      ? currentUser.role === "merchant" || currentUser.role === "influencer"
      : currentUser.role === "admin";
  if (!roleAllowed) {
    const href = currentUser.role === "admin" ? `/${locale}/admin/messages` : currentUser.role === "merchant" || currentUser.role === "influencer" ? `/${locale}/merchant/messages` : `/${locale}/messages`;
    return <div className="admin-empty"><UserRound /><h3>{locale === "ar" ? "افتح صندوق الرسائل المناسب لحسابك" : "Open the inbox for your account role"}</h3><Link className="button button-dark" href={href}>{locale === "ar" ? "فتح الرسائل" : "Open messages"}</Link></div>;
  }

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const text = String(form.get("message") ?? "").trim();
    if (!text) return;
    setSending(true);
    try {
      await sendMessage(selected.id, text);
      event.currentTarget.reset();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to send message", "error");
    } finally {
      setSending(false);
    }
  }

  async function submitNewConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!effectiveComposeStoreId) {
      toast(locale === "ar" ? "اختر متجرًا" : "Choose a store", "error");
      return;
    }
    setSending(true);
    try {
      const conversation = await startConversation({
        storeId: effectiveComposeStoreId,
        subject: effectiveComposeSubject || (locale === "ar" ? "استفسار جديد" : "New inquiry"),
        productId: effectiveComposeProductId || undefined,
        orderId: effectiveComposeOrderId || undefined,
        initialMessage: composeMessage,
      });
      setSelectedId(conversation.id);
      setNewConversationMode(false);
      setComposeMessage("");
      setMobileListOpen(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to start conversation", "error");
    } finally {
      setSending(false);
    }
  }

  const store = selected ? stores.find((item) => item.id === selected.storeId) : undefined;
  const unreadCount = (conversation: Conversation) => mode === "customer" ? conversation.unreadByCustomer : conversation.unreadByMerchant;

  return <div className={cn("messages-workspace", mobileListOpen && "show-list")}>
    <aside className="conversation-sidebar">
      <div className="conversation-sidebar-head">
        <div><span className="eyebrow">INBOX</span><h3>{locale === "ar" ? "المحادثات" : "Conversations"}</h3></div>
        <div className="conversation-head-actions"><span className="inbox-count">{visibleConversations.reduce((sum, item) => sum + unreadCount(item), 0)}</span>{mode === "customer" && <button type="button" className="icon-button" onClick={() => { setNewConversationMode(true); setMobileListOpen(false); }} aria-label="New conversation">+</button>}</div>
      </div>
      <label className="message-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locale === "ar" ? "بحث في الرسائل" : "Search messages"} /></label>
      <div className="conversation-scroll">
        {visibleConversations.map((conversation) => {
          const rowStore = stores.find((item) => item.id === conversation.storeId);
          const latest = messages.filter((message) => message.conversationId === conversation.id).at(-1);
          const unread = unreadCount(conversation);
          return <button key={conversation.id} className={cn("conversation-row", selected?.id === conversation.id && "is-active")} onClick={() => { setSelectedId(conversation.id); setNewConversationMode(false); setMobileListOpen(false); }}>
            <span className="avatar">{mode === "customer" ? rowStore?.name.slice(0, 2) : conversation.customerAvatar ?? conversation.customerName.slice(0, 2)}</span>
            <span className="conversation-row-copy">
              <span><strong>{mode === "customer" ? (locale === "ar" ? rowStore?.name : rowStore?.nameEn) : conversation.customerName}</strong><time>{new Date(conversation.lastMessageAt).toLocaleDateString(locale === "ar" ? "ar" : "en", { month: "short", day: "numeric" })}</time></span>
              <b>{conversation.subject}</b>
              <small>{latest?.text ?? (locale === "ar" ? "لا توجد رسائل" : "No messages")}</small>
            </span>
            {unread > 0 && <span className="conversation-unread">{unread}</span>}
          </button>;
        })}
        {visibleConversations.length === 0 && <div className="conversation-empty"><MessagesSquare /><p>{locale === "ar" ? "لا توجد محادثات بعد." : "No conversations yet."}</p></div>}
      </div>
    </aside>

    <section className="conversation-main">
      {selected ? <>
        <header className="conversation-header">
          <button className="icon-button conversation-back" onClick={() => setMobileListOpen(true)}><ArrowLeft /></button>
          <span className="avatar">{mode === "customer" ? store?.name.slice(0, 2) : selected.customerAvatar ?? selected.customerName.slice(0, 2)}</span>
          <div><strong>{mode === "customer" ? (locale === "ar" ? store?.name : store?.nameEn) : selected.customerName}</strong><small>{selected.subject}</small></div>
          <div className="conversation-context">
            {selected.productId && <Link href={`/${locale}/product/${selected.productId}`}><Package />{locale === "ar" ? "المنتج" : "Product"}</Link>}
            {selected.orderId && <Link href={`/${locale}/order/${selected.orderId}`}><ShoppingBag />{selected.orderId}</Link>}
            {mode !== "customer" && <button onClick={() => void setConversationStatus(selected.id, selected.status === "open" ? "closed" : "open")}>{selected.status === "open" ? <Archive /> : <RotateCcw />}{selected.status === "open" ? (locale === "ar" ? "إغلاق" : "Close") : (locale === "ar" ? "إعادة فتح" : "Reopen")}</button>}
          </div>
        </header>
        <div className="conversation-messages">
          <div className="conversation-day"><span>{locale === "ar" ? "المحادثة محمية داخل Tijvorya" : "Protected Tijvorya conversation"}</span></div>
          {selectedMessages.map((message) => {
            const mine = mode === "customer" ? message.senderRole === "customer" : mode === "merchant" ? message.senderRole === "merchant" : message.senderRole === "admin";
            return <div key={message.id} className={cn("message-bubble", mine && "is-mine", message.senderRole === "admin" && "is-admin")}>
              {message.senderRole === "admin" && <small className="admin-message-label">{locale === "ar" ? "إدارة المنصة" : "Platform admin"}</small>}
              <p>{message.text}</p>
              <time>{new Date(message.createdAt).toLocaleTimeString(locale === "ar" ? "ar" : "en", { hour: "2-digit", minute: "2-digit" })}</time>
            </div>;
          })}
        </div>
        <form className="conversation-composer" onSubmit={submitReply}>
          {selected.status === "closed" ? <div className="conversation-closed"><Lock />{locale === "ar" ? "هذه المحادثة مغلقة. أعد فتحها لإرسال رسالة." : "This conversation is closed. Reopen it to reply."}</div> : <>
            <textarea name="message" rows={2} maxLength={2000} required placeholder={locale === "ar" ? "اكتب رسالة واضحة…" : "Write a clear message…"} />
            <button className="button button-dark" disabled={sending}><Send />{locale === "ar" ? "إرسال" : "Send"}</button>
          </>}
        </form>
      </> : mode === "customer" ? <form className="new-conversation-card" onSubmit={submitNewConversation}>
        <div className="new-conversation-icon"><StoreIcon /></div>
        <span className="eyebrow">NEW CONVERSATION</span>
        <h2>{locale === "ar" ? "ابدأ محادثة مع متجر" : "Start a store conversation"}</h2>
        <p>{locale === "ar" ? "اكتب استفسارك وسيظهر مباشرة في صندوق رسائل التاجر." : "Send your inquiry directly to the merchant inbox."}</p>
        <label className="field"><span>{locale === "ar" ? "المتجر" : "Store"}</span><select value={effectiveComposeStoreId} onChange={(event) => setComposeStoreId(event.target.value)} required><option value="">{locale === "ar" ? "اختر متجرًا" : "Choose a store"}</option>{stores.filter((item) => (item.status ?? "active") === "active").map((item) => <option key={item.id} value={item.id}>{locale === "ar" ? item.name : item.nameEn}</option>)}</select></label>
        <label className="field"><span>{locale === "ar" ? "الموضوع" : "Subject"}</span><input value={effectiveComposeSubject} onChange={(event) => setComposeSubject(event.target.value)} required /></label>
        <label className="field"><span>{locale === "ar" ? "الرسالة" : "Message"}</span><textarea value={composeMessage} onChange={(event) => setComposeMessage(event.target.value)} rows={5} required maxLength={2000} /></label>
        <button className="button button-dark button-block" disabled={sending}><Send />{locale === "ar" ? "إرسال إلى المتجر" : "Send to store"}</button>
      </form> : <div className="conversation-empty-main"><MessagesSquare /><h2>{locale === "ar" ? "اختر محادثة من القائمة" : "Select a conversation"}</h2><p>{locale === "ar" ? "ستظهر هنا الرسائل المرتبطة بالمتاجر والطلبات." : "Store and order conversations will appear here."}</p></div>}
    </section>
  </div>;
}

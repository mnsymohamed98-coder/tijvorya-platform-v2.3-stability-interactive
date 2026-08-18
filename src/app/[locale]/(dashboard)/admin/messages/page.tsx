"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

import { MessagingWorkspace } from "@/components/messages/messaging-workspace";
import { PageHeader } from "@/components/dashboard/page-header";
import { useApp } from "@/providers/app-provider";
import { createClient } from "@/lib/supabase/client";

type ContactRequest = {
  id: string;
  name: string;
  email: string;
  inquiry_type: string;
  message: string;
  locale: "ar" | "en";
  status: string;
  created_at: string;
};

export default function Page() {
  const { locale, conversations } = useApp();

  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactError, setContactError] = useState<string | null>(null);

  const unreadConversations = useMemo(() => {
    return conversations.reduce(
      (sum, conversation) =>
        sum +
        conversation.unreadByMerchant +
        conversation.unreadByCustomer,
      0
    );
  }, [conversations]);

  const newContactRequests = useMemo(() => {
    return contactRequests.filter(
      (request) => request.status === "new"
    ).length;
  }, [contactRequests]);

  const totalAlerts =
    unreadConversations + newContactRequests;

  async function loadContactRequests() {
    setLoadingContacts(true);
    setContactError(null);

    try {
      const supabase = createClient();

      if (!supabase) {
        throw new Error("SUPABASE_NOT_CONFIGURED");
      }

      const { data, error } = await supabase
        .from("contact_requests")
        .select(
          "id,name,email,inquiry_type,message,locale,status,created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setContactRequests(
        (data ?? []) as ContactRequest[]
      );
    } catch (error) {
      console.error(
        "ADMIN_CONTACT_REQUESTS_ERROR",
        error
      );

      setContactError(
        locale === "ar"
          ? "تعذر تحميل رسائل نموذج التواصل."
          : "Unable to load contact requests."
      );
    } finally {
      setLoadingContacts(false);
    }
  }

  useEffect(() => {
    void loadContactRequests();
  }, []);

  async function updateContactStatus(
    id: string,
    status: string
  ) {
    try {
      const supabase = createClient();

      if (!supabase) {
        throw new Error("SUPABASE_NOT_CONFIGURED");
      }

      const { error } = await supabase
        .from("contact_requests")
        .update({ status })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setContactRequests((current) =>
        current.map((request) =>
          request.id === id
            ? {
                ...request,
                status,
              }
            : request
        )
      );
    } catch (error) {
      console.error(
        "ADMIN_CONTACT_STATUS_ERROR",
        error
      );

      alert(
        locale === "ar"
          ? "تعذر تحديث حالة الرسالة."
          : "Unable to update message status."
      );
    }
  }

  function inquiryLabel(type: string) {
    if (locale === "en") {
      switch (type) {
        case "merchant":
          return "Merchant";
        case "partnership":
          return "Partnership";
        case "support":
          return "Support";
        case "press":
          return "Press";
        default:
          return "Other";
      }
    }

    switch (type) {
      case "merchant":
        return "طلب تاجر";
      case "partnership":
        return "شراكة";
      case "support":
        return "دعم فني";
      case "press":
        return "إعلام";
      default:
        return "أخرى";
    }
  }

  function statusLabel(status: string) {
    if (locale === "en") {
      switch (status) {
        case "new":
          return "New";
        case "in_progress":
          return "In progress";
        case "resolved":
          return "Resolved";
        case "closed":
          return "Closed";
        default:
          return status;
      }
    }

    switch (status) {
      case "new":
        return "جديدة";
      case "in_progress":
        return "قيد المتابعة";
      case "resolved":
        return "تم الحل";
      case "closed":
        return "مغلقة";
      default:
        return status;
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="MESSAGE GOVERNANCE"
        title={
          locale === "ar"
            ? "مركز الرسائل"
            : "Messaging center"
        }
        text={
          locale === "ar"
            ? "عرض المحادثات ورسائل نموذج التواصل لدعم المتابعة والرقابة التشغيلية."
            : "View platform conversations and contact requests for support and operational oversight."
        }
        actions={
          <span className="message-page-badge">
            <MessageCircle />
            {totalAlerts}{" "}
            {locale === "ar"
              ? "تنبيهًا"
              : "alerts"}
          </span>
        }
      />

      <section
        className="editor-card"
        style={{
          marginBottom: 20,
        }}
      >
        <div className="card-head">
          <div>
            <span className="eyebrow">
              CONTACT REQUESTS
            </span>

            <h2>
              {locale === "ar"
                ? "رسائل نموذج التواصل"
                : "Contact requests"}
            </h2>

            <p className="muted">
              {locale === "ar"
                ? "الرسائل المرسلة من صفحة تواصل معنا."
                : "Messages submitted from the contact page."}
            </p>
          </div>

          <button
            type="button"
            className="button button-ghost"
            onClick={() =>
              void loadContactRequests()
            }
            disabled={loadingContacts}
          >
            <RefreshCw
              className={
                loadingContacts ? "spin" : ""
              }
            />

            {locale === "ar"
              ? "تحديث"
              : "Refresh"}
          </button>
        </div>

        {loadingContacts ? (
          <div className="empty-state">
            <p>
              {locale === "ar"
                ? "جارٍ تحميل الرسائل..."
                : "Loading messages..."}
            </p>
          </div>
        ) : contactError ? (
          <div className="empty-state">
            <p className="danger-text">
              {contactError}
            </p>
          </div>
        ) : contactRequests.length === 0 ? (
          <div className="empty-state">
            <Mail />

            <h3>
              {locale === "ar"
                ? "لا توجد رسائل تواصل بعد"
                : "No contact requests yet"}
            </h3>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    {locale === "ar"
                      ? "المرسل"
                      : "Sender"}
                  </th>

                  <th>
                    {locale === "ar"
                      ? "نوع الطلب"
                      : "Type"}
                  </th>

                  <th>
                    {locale === "ar"
                      ? "الرسالة"
                      : "Message"}
                  </th>

                  <th>
                    {locale === "ar"
                      ? "الحالة"
                      : "Status"}
                  </th>

                  <th>
                    {locale === "ar"
                      ? "التاريخ"
                      : "Date"}
                  </th>
                </tr>
              </thead>

              <tbody>
                {contactRequests.map(
                  (request) => (
                    <tr key={request.id}>
                      <td>
                        <strong>
                          {request.name}
                        </strong>

                        <small>
                          {request.email}
                        </small>
                      </td>

                      <td>
                        <span className="status-pill">
                          {inquiryLabel(
                            request.inquiry_type
                          )}
                        </span>
                      </td>

                      <td
                        style={{
                          maxWidth: 420,
                          whiteSpace: "normal",
                        }}
                      >
                        {request.message}
                      </td>

                      <td>
                        <select
                          className="admin-inline-select"
                          value={request.status}
                          onChange={(event) =>
                            void updateContactStatus(
                              request.id,
                              event.target.value
                            )
                          }
                        >
                          <option value="new">
                            {statusLabel("new")}
                          </option>

                          <option value="in_progress">
                            {statusLabel(
                              "in_progress"
                            )}
                          </option>

                          <option value="resolved">
                            {statusLabel(
                              "resolved"
                            )}
                          </option>

                          <option value="closed">
                            {statusLabel(
                              "closed"
                            )}
                          </option>
                        </select>
                      </td>

                      <td>
                        {new Date(
                          request.created_at
                        ).toLocaleString(
                          locale === "ar"
                            ? "ar"
                            : "en"
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <MessagingWorkspace mode="admin" />
    </>
  );
}
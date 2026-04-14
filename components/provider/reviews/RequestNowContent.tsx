/**
 * RequestNowContent Component
 *
 * This component handles both the "Send Invites" and "In Person" tabs:
 * - When `providerSlug` is provided: Shows shareable review link (In Person tab)
 * - When `providerSlug` is NOT provided: Shows invite form (Send Invites tab)
 */

"use client";

import { useState, useRef } from "react";
import type {
  ReviewRequestClient,
  DeliveryMethod,
  RequestNowContentProps,
} from "./types";
import { DEFAULT_MESSAGE } from "./types";

// ── Icons ──

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function CloseIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

// ── Component ──

export default function RequestNowContent({ state, onStateChange, providerSlug }: RequestNowContentProps) {
  const { clients, message, deliveryMethod } = state;

  // Local form state (not persisted across tab switches)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Review link for on-site sharing
  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://olera.care";
  const reviewUrl = providerSlug
    ? `${siteOrigin}/review/${providerSlug}?ref=qr`
    : null;

  const handleCopyLink = async () => {
    if (!reviewUrl) return;
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = reviewUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Helper to update parent state
  const setClients = (updater: ReviewRequestClient[] | ((prev: ReviewRequestClient[]) => ReviewRequestClient[])) => {
    const newClients = typeof updater === "function" ? updater(clients) : updater;
    onStateChange({ ...state, clients: newClients });
  };
  const setMessage = (msg: string) => onStateChange({ ...state, message: msg });
  const setDeliveryMethod = (method: DeliveryMethod) => onStateChange({ ...state, deliveryMethod: method });

  const isEditing = editingClientId !== null;
  const canAddClient = name.trim() && (email.trim() || phone.trim());
  const canSend = clients.length > 0 && message.trim();

  // Check which delivery methods are available based on client contact info
  const hasAnyEmail = clients.some((c) => c.email);
  const hasAnyPhone = clients.some((c) => c.phone);

  const handleAddClient = () => {
    if (!canAddClient) {
      setFormError("Please enter a name and at least one contact method.");
      return;
    }
    setFormError(null);

    if (isEditing) {
      // Update existing client
      setClients((prev) =>
        prev.map((c) =>
          c.id === editingClientId
            ? { ...c, name: name.trim(), email: email.trim(), phone: phone.trim() }
            : c
        )
      );
      setEditingClientId(null);
    } else {
      // Add new client
      const newClient: ReviewRequestClient = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      };
      setClients((prev) => [...prev, newClient]);
    }

    setName("");
    setEmail("");
    setPhone("");
    // Focus back to name input for quick multi-add
    nameInputRef.current?.focus();
  };

  const handleEditClient = (client: ReviewRequestClient) => {
    setEditingClientId(client.id);
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone);
    setFormError(null);
    nameInputRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingClientId(null);
    setName("");
    setEmail("");
    setPhone("");
    setFormError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canAddClient) {
      e.preventDefault();
      handleAddClient();
    }
  };

  const handleRemoveClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setFormError(null);

    try {
      const res = await fetch("/api/review-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clients: clients.map((c) => ({
            name: c.name,
            email: c.email || undefined,
            phone: c.phone || undefined,
          })),
          message: message.trim(),
          delivery_method: deliveryMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send review requests");
      }

      setSent(true);
      // Reset form after showing success briefly
      setTimeout(() => {
        onStateChange({ clients: [], message: DEFAULT_MESSAGE, deliveryMethod: "email" });
        setSent(false);
      }, 2000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to send requests");
    } finally {
      setSending(false);
    }
  };

  const getClientContactIcon = (client: ReviewRequestClient) => {
    if (client.email && client.phone) {
      return (
        <span className="text-gray-400" title="Email & SMS">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        </span>
      );
    }
    if (client.email) {
      return (
        <span className="text-gray-400" title="Email">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </span>
      );
    }
    return (
      <span className="text-gray-400" title="SMS">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      </span>
    );
  };

  // Success state
  if (sent) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm">
        <div
          className="p-8 lg:p-12 flex flex-col items-center text-center"
          style={{ animation: "card-enter 0.3s ease-out both" }}
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mb-5 ring-4 ring-primary-50">
            <CheckIcon className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-display font-bold text-gray-900">
            Requests sent!
          </h3>
          <p className="text-[15px] text-gray-500 mt-2.5 max-w-sm leading-relaxed">
            Your review requests have been sent successfully. We&apos;ll notify you when clients respond.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="p-5 lg:p-6">
        {/* Review Link Section (only for on-site tab) */}
        {reviewUrl && (
          <div>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-semibold text-gray-900">Share with visitors</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Text to families or share with your staff
                </p>
              </div>
            </div>
            {/* Link container with button inside */}
            <div className="flex items-center gap-3 px-4 py-2 bg-vanilla-50 border border-warm-100 rounded-xl min-h-[56px]">
              <p className="flex-1 min-w-0 text-[15px] font-mono text-gray-700 truncate">
                {reviewUrl}
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-[15px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 flex-shrink-0 ${
                  linkCopied
                    ? "bg-primary-100 text-primary-700"
                    : "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-sm"
                }`}
              >
                {linkCopied ? (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                    </svg>
                    <span>Copy link</span>
                  </>
                )}
              </button>
            </div>

            {/* Note */}
            <p className="mt-4 text-sm text-gray-500">
              <span className="font-semibold text-gray-700">Tip:</span> Share this link during care visits or text it to families after appointments.
            </p>
          </div>
        )}

        {/* Request Now form (only shown when not on-site tab) */}
        {!reviewUrl && (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">Invite families to review</h3>
              <p className="text-sm text-gray-500">Add recipients, customize your message, and send</p>
            </div>
          </div>

          {/* Recipients chips - shown at top when there are clients */}
          {clients.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Recipients</span>
                <span className="text-xs text-primary-600 font-semibold bg-primary-50 px-2 py-0.5 rounded-full">
                  {clients.length} added
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm group transition-all ${
                      editingClientId === client.id
                        ? "bg-primary-100 border-2 border-primary-500"
                        : "bg-white border border-gray-200 hover:border-gray-300"
                    }`}
                    style={{ animation: "card-enter 0.2s ease-out both" }}
                  >
                    {getClientContactIcon(client)}
                    <span className="font-medium text-gray-700">{client.name}</span>
                    <button
                      type="button"
                      onClick={() => handleEditClient(client)}
                      className="text-gray-300 hover:text-primary-500 transition-colors p-0.5 rounded hover:bg-primary-50"
                      aria-label={`Edit ${client.name}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveClient(client.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-0.5 rounded hover:bg-red-50"
                      aria-label={`Remove ${client.name}`}
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add recipient form */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {isEditing ? "Edit recipient" : "Add a recipient"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                ref={nameInputRef}
                id="client-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Name *"
                className="w-full px-3.5 py-3 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
              <input
                id="client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Email"
                className="w-full px-3.5 py-3 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
              <input
                id="client-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Phone"
                className="w-full px-3.5 py-3 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
            {formError && (
              <p className="mt-2 text-xs text-red-600">{formError}</p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">Email or phone required</span>
              <div className="flex gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddClient}
                  disabled={!canAddClient}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {isEditing ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>

          {/* Message - only show when recipients added */}
          {clients.length > 0 && (
          <div className="mb-5">
            <label htmlFor="review-message" className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              id="review-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Write a personalized message..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none leading-relaxed"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-400">Personalize to increase responses</span>
              <span className={`text-xs ${message.length > 450 ? "text-amber-500" : "text-gray-400"}`}>
                {message.length}/500
              </span>
            </div>
          </div>
          )}

          {/* Delivery Method - only show when recipients added */}
          {clients.length > 0 && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Send via</label>
            <div className="flex flex-wrap gap-2">
              <label
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  deliveryMethod === "email"
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                } ${!hasAnyEmail ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name="delivery-method"
                  value="email"
                  checked={deliveryMethod === "email"}
                  onChange={() => setDeliveryMethod("email")}
                  disabled={!hasAnyEmail}
                  className="sr-only"
                />
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <span className="text-sm font-medium">Email</span>
              </label>
              <label
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  deliveryMethod === "sms"
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                } ${!hasAnyPhone ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name="delivery-method"
                  value="sms"
                  checked={deliveryMethod === "sms"}
                  onChange={() => setDeliveryMethod("sms")}
                  disabled={!hasAnyPhone}
                  className="sr-only"
                />
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
                <span className="text-sm font-medium">SMS</span>
              </label>
              <label
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  deliveryMethod === "both"
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                } ${(!hasAnyEmail || !hasAnyPhone) ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name="delivery-method"
                  value="both"
                  checked={deliveryMethod === "both"}
                  onChange={() => setDeliveryMethod("both")}
                  disabled={!hasAnyEmail || !hasAnyPhone}
                  className="sr-only"
                />
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                <span className="text-sm font-medium">Both</span>
              </label>
            </div>
          </div>
          )}

          {/* Send Button - Full width, prominent */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || sending}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            {sending ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
                <span>
                  {clients.length > 0
                    ? `Send to ${clients.length} client${clients.length > 1 ? "s" : ""}`
                    : "Add clients to send"}
                </span>
              </>
            )}
          </button>
        </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  canEngage,
  getFreeConnectionsRemaining,
  FREE_CONNECTION_LIMIT,
} from "@/lib/membership";
import type { FamilyMetadata } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { user, account, activeProfile, profiles, membership, refreshAccountData } =
    useAuth();
  const searchParams = useSearchParams();
  const justUpgraded = searchParams.get("upgraded") === "true";

  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);
  const [error, setError] = useState("");

  // Notification prefs
  const meta = (activeProfile?.metadata || {}) as FamilyMetadata;
  const notifPrefs = meta.notification_prefs || {};

  // Account editing
  const [editingField, setEditingField] = useState<
    "email" | "phone" | "password" | null
  >(null);
  const [fieldValue, setFieldValue] = useState("");
  const [fieldSaving, setFieldSaving] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [fieldSuccess, setFieldSuccess] = useState("");

  // Add provider profile
  const [showProviderModal, setShowProviderModal] = useState(false);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Remove profile
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [deleteProfileError, setDeleteProfileError] = useState("");
  const [deleteProfileConfirmText, setDeleteProfileConfirmText] = useState("");

  const isProvider =
    activeProfile?.type === "organization" ||
    activeProfile?.type === "caregiver";
  const isFamily = activeProfile?.type === "family";
  const hasAccess = canEngage(
    activeProfile?.type,
    membership,
    "respond_to_inquiry"
  );
  const freeRemaining = getFreeConnectionsRemaining(membership);

  // ── Notification toggle ──
  const handleNotifToggle = useCallback(
    async (
      key: "connection_updates" | "saved_provider_alerts" | "match_updates" | "profile_reminders",
      channel: "email" | "sms"
    ) => {
      if (!activeProfile || !isSupabaseConfigured()) return;

      const supabase = createClient();
      const { data: current } = await supabase
        .from("business_profiles")
        .select("metadata")
        .eq("id", activeProfile.id)
        .single();

      const currentMeta = (current?.metadata || {}) as Record<string, unknown>;
      const currentPrefs = (currentMeta.notification_prefs || {}) as Record<
        string,
        Record<string, boolean>
      >;

      const currentSetting = currentPrefs[key]?.[channel] ?? getDefault(key, channel);

      const updatedPrefs = {
        ...currentPrefs,
        [key]: {
          ...(currentPrefs[key] || {}),
          [channel]: !currentSetting,
        },
      };

      await supabase
        .from("business_profiles")
        .update({
          metadata: { ...currentMeta, notification_prefs: updatedPrefs },
        })
        .eq("id", activeProfile.id);

      await refreshAccountData();
    },
    [activeProfile, refreshAccountData]
  );

  // ── Account field editing ──
  const startEdit = (field: "email" | "phone" | "password") => {
    setEditingField(field);
    setFieldError("");
    setFieldSuccess("");
    if (field === "email") setFieldValue(user?.email || "");
    else if (field === "phone") setFieldValue(activeProfile?.phone || "");
    else setFieldValue("");
  };

  const saveField = async () => {
    if (!isSupabaseConfigured()) return;
    setFieldSaving(true);
    setFieldError("");
    setFieldSuccess("");

    try {
      const supabase = createClient();

      if (editingField === "email") {
        const { error: authError } = await supabase.auth.updateUser({
          email: fieldValue,
        });
        if (authError) throw authError;
        setFieldSuccess("Confirmation email sent to your new address.");
      } else if (editingField === "phone") {
        if (!activeProfile) throw new Error("No profile");
        const { error: updateError } = await supabase
          .from("business_profiles")
          .update({ phone: fieldValue || null })
          .eq("id", activeProfile.id);
        if (updateError) throw updateError;
        await refreshAccountData();
        setFieldSuccess("Phone updated.");
      } else if (editingField === "password") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          user?.email || "",
          { redirectTo: `${window.location.origin}/auth/callback` }
        );
        if (resetError) throw resetError;
        setFieldSuccess("Password reset email sent.");
      }

      setTimeout(() => setEditingField(null), 1500);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Something went wrong";
      setFieldError(msg);
    } finally {
      setFieldSaving(false);
    }
  };

  // ── Delete account ──
  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Something went wrong";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  // ── Remove single profile ──
  const handleDeleteProfile = async () => {
    if (!activeProfile) return;
    setDeletingProfile(true);
    setDeleteProfileError("");

    try {
      const res = await fetch("/api/auth/delete-profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: activeProfile.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.isLastProfile) {
          setDeleteProfileError(
            "This is your only profile. To remove it, use \u2018Delete account\u2019 below."
          );
          return;
        }
        throw new Error(data.error || "Failed to remove profile");
      }

      await refreshAccountData();
      setShowDeleteProfileModal(false);
      setDeleteProfileConfirmText("");
      router.push("/portal");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Something went wrong";
      setDeleteProfileError(msg);
    } finally {
      setDeletingProfile(false);
    }
  };

  // ── Stripe upgrade ──
  const handleUpgrade = async (billingCycle: "monthly" | "annual") => {
    setLoading(billingCycle);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start checkout");
      if (data.url) window.location.href = data.url;
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-2xl">
      {justUpgraded && (
        <div className="bg-primary-50 border border-primary-200 text-primary-800 px-4 py-3 rounded-xl text-base mb-5">
          Your subscription is now active. You have full access to all features.
        </div>
      )}

      <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
      {/* ── Notifications ── */}
      <div className="p-6">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-5">Notifications</h3>
        <div className="divide-y divide-gray-50">
          <NotificationRow
            title="Connection updates"
            description="When a provider responds or messages you"
            emailOn={notifPrefs.connection_updates?.email ?? true}
            smsOn={notifPrefs.connection_updates?.sms ?? false}
            onToggle={(channel) =>
              handleNotifToggle("connection_updates", channel)
            }
          />
          <NotificationRow
            title="Saved provider alerts"
            description="When a saved provider becomes available"
            emailOn={notifPrefs.saved_provider_alerts?.email ?? true}
            smsOn={notifPrefs.saved_provider_alerts?.sms ?? false}
            onToggle={(channel) =>
              handleNotifToggle("saved_provider_alerts", channel)
            }
          />
          <NotificationRow
            title="Match updates"
            description="New provider matches and care post responses"
            emailOn={notifPrefs.match_updates?.email ?? true}
            smsOn={notifPrefs.match_updates?.sms ?? false}
            onToggle={(channel) =>
              handleNotifToggle("match_updates", channel)
            }
          />
          <NotificationRow
            title="Profile reminders"
            description="Tips to complete your care profile"
            emailOn={notifPrefs.profile_reminders?.email ?? true}
            smsOn={notifPrefs.profile_reminders?.sms ?? false}
            onToggle={(channel) =>
              handleNotifToggle("profile_reminders", channel)
            }
          />
        </div>
      </div>

      {/* ── Account ── */}
      <div className="p-6">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-5">Account</h3>
        <div className="divide-y divide-gray-100">
          <AccountRow
            label="Email"
            value={user?.email || "Not set"}
            verified={!!user?.email_confirmed_at}
            isEditing={editingField === "email"}
            editValue={fieldValue}
            onEditChange={setFieldValue}
            onStartEdit={() => startEdit("email")}
            onSave={saveField}
            onCancel={() => setEditingField(null)}
            saving={fieldSaving}
            error={editingField === "email" ? fieldError : ""}
            success={editingField === "email" ? fieldSuccess : ""}
            inputType="email"
          />
          <AccountRow
            label="Phone"
            value={activeProfile?.phone || "Not set"}
            isEditing={editingField === "phone"}
            editValue={fieldValue}
            onEditChange={setFieldValue}
            onStartEdit={() => startEdit("phone")}
            onSave={saveField}
            onCancel={() => setEditingField(null)}
            saving={fieldSaving}
            error={editingField === "phone" ? fieldError : ""}
            success={editingField === "phone" ? fieldSuccess : ""}
            inputType="tel"
            placeholder="(555) 123-4567"
          />
          <AccountRow
            label="Password"
            value={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
            isEditing={editingField === "password"}
            editValue=""
            onEditChange={() => {}}
            onStartEdit={() => startEdit("password")}
            onSave={saveField}
            onCancel={() => setEditingField(null)}
            saving={fieldSaving}
            error={editingField === "password" ? fieldError : ""}
            success={editingField === "password" ? fieldSuccess : ""}
            isPassword
          />
        </div>
      </div>

      {/* ── Add Provider Profile (family only) ── */}
      {isFamily && (
        <div className="p-6">
          <button
            type="button"
            onClick={() => setShowProviderModal(true)}
            className="w-full text-left flex items-center gap-4 rounded-lg p-4 hover:bg-gray-50 transition-colors group -mx-1"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-gray-900">
                Add a provider profile
              </p>
              <p className="text-xs text-gray-400">
                List your care services on Olera and connect with families.
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-300 shrink-0 group-hover:text-primary-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Add Provider Profile Confirmation Modal */}
      <Modal
        isOpen={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        title="Add a Provider Profile"
        size="sm"
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <p className="text-base text-gray-700 mb-2">
            Want to list your care services?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Setting up a provider profile lets families find and connect with you
            on Olera. Your family profile will remain active.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowProviderModal(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={() => {
                setShowProviderModal(false);
                router.push("/onboarding?intent=provider");
              }}
            >
              Continue to setup
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Subscription (providers only) ── */}
      {isProvider && (
        <div className="p-6">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-5">
            Subscription
          </h3>

          <div className="flex items-center gap-3 mb-4">
            <p className="text-base font-semibold text-gray-900">
              Current plan:
            </p>
            {membership?.status === "active" && (
              <Badge variant="pro">Pro</Badge>
            )}
            {(membership?.status === "free" ||
              membership?.status === "trialing" ||
              !membership) && <Badge variant="default">Free</Badge>}
            {membership?.status === "past_due" && (
              <Badge variant="pending">Past Due</Badge>
            )}
            {membership?.status === "canceled" && (
              <Badge variant="default">Canceled</Badge>
            )}
          </div>

          {freeRemaining !== null && (
            <div className="mb-4">
              <p className="text-base text-gray-600">
                You have{" "}
                <span className="font-semibold text-gray-900">
                  {freeRemaining} of {FREE_CONNECTION_LIMIT}
                </span>{" "}
                free connections remaining.
                {freeRemaining === 0
                  ? " Upgrade to Pro to continue connecting."
                  : " Upgrade to Pro for unlimited connections."}
              </p>
            </div>
          )}

          {membership?.status === "active" && (
            <div className="mb-4">
              <p className="text-base text-gray-600">
                You have unlimited access to all Pro features.
              </p>
              {membership.billing_cycle && (
                <p className="text-base text-gray-500 mt-1">
                  Billed{" "}
                  {membership.billing_cycle === "annual"
                    ? "annually"
                    : "monthly"}
                  {membership.current_period_ends_at &&
                    ` \u00b7 Next billing date: ${new Date(
                      membership.current_period_ends_at
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`}
                </p>
              )}
            </div>
          )}

          {membership?.status === "past_due" && (
            <div className="mb-4 bg-warm-50 text-warm-700 px-4 py-3 rounded-xl text-base">
              Your last payment failed. Please update your payment method.
            </div>
          )}

          {membership?.status !== "active" && (
            <div className="space-y-4">
              {error && (
                <div
                  className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-base"
                  role="alert"
                >
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border-2 border-gray-200 rounded-xl p-5 hover:border-primary-300 transition-colors">
                  <p className="text-lg font-semibold text-gray-900">
                    Monthly
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    $25
                    <span className="text-base font-normal text-gray-500">
                      /mo
                    </span>
                  </p>
                  <Button
                    fullWidth
                    className="mt-4"
                    onClick={() => handleUpgrade("monthly")}
                    loading={loading === "monthly"}
                    disabled={loading !== null}
                  >
                    Subscribe Monthly
                  </Button>
                </div>
                <div className="border-2 border-primary-300 rounded-xl p-5 relative">
                  <div className="absolute -top-3 right-4 bg-primary-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                    Save 17%
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    Annual
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    $249
                    <span className="text-base font-normal text-gray-500">
                      /yr
                    </span>
                  </p>
                  <p className="text-base text-gray-500 mt-1">~$20.75/mo</p>
                  <Button
                    fullWidth
                    className="mt-4"
                    onClick={() => handleUpgrade("annual")}
                    loading={loading === "annual"}
                    disabled={loading !== null}
                  >
                    Subscribe Annually
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Remove this profile ── */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">
              Remove this profile
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Remove your{" "}
              <span className="font-medium text-gray-500">
                {activeProfile?.display_name}
              </span>{" "}
              profile. Your account and other profiles will not be affected.
            </p>
          </div>
          {profiles.length > 1 ? (
            <button
              type="button"
              onClick={() => setShowDeleteProfileModal(true)}
              className="text-[14px] font-medium text-red-500 hover:text-red-600 transition-colors shrink-0 ml-4"
            >
              Remove
            </button>
          ) : (
            <span className="text-xs text-gray-400 shrink-0 ml-4 max-w-[140px] text-right leading-snug">
              Only profile — use &ldquo;Delete account&rdquo; below
            </span>
          )}
        </div>
      </div>

      {/* ── Delete Account ── */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">
              Delete account
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Permanently delete your account, all profiles, and all connection
              history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="text-[14px] font-medium text-red-500 hover:text-red-600 transition-colors shrink-0 ml-4"
          >
            Delete
          </button>
        </div>
      </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText("");
          setDeleteError("");
        }}
        title="Delete account"
        size="sm"
      >
        <div>
          <p className="text-sm text-gray-600 mb-4">
            This action is permanent and cannot be undone. Deleting your account will:
          </p>
          <ul className="space-y-2 mb-5">
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Remove all your profiles and personal information
            </li>
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Delete all your connections and message history
            </li>
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel any active subscriptions
            </li>
          </ul>

          <div className="mb-5">
            <label htmlFor="delete-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
              Type <span className="font-semibold text-gray-900">delete</span> to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent placeholder:text-gray-300"
              autoComplete="off"
            />
          </div>

          {deleteError && (
            <div className="mb-4 bg-red-50 text-red-700 px-3 py-2.5 rounded-lg text-sm">
              {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText("");
                setDeleteError("");
              }}
              disabled={deleting}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 px-3 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || deleteConfirmText !== "delete"}
              className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-lg px-4 py-2"
            >
              {deleting ? "Deleting..." : "Delete my account"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Remove Profile Confirmation Modal */}
      <Modal
        isOpen={showDeleteProfileModal}
        onClose={() => {
          setShowDeleteProfileModal(false);
          setDeleteProfileConfirmText("");
          setDeleteProfileError("");
        }}
        title="Remove profile"
        size="sm"
      >
        <div>
          <p className="text-sm text-gray-600 mb-4">
            This will permanently remove your{" "}
            <span className="font-semibold text-gray-900">
              {activeProfile?.display_name}
            </span>{" "}
            profile. Your account and other profiles will not be affected.
          </p>
          <ul className="space-y-2 mb-5">
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Remove this profile and its information
            </li>
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Delete all connections for this profile
            </li>
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <svg className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              You can add a new profile later from the profile switcher
            </li>
          </ul>

          <div className="mb-5">
            <label htmlFor="delete-profile-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
              Type <span className="font-semibold text-gray-900">remove</span> to confirm
            </label>
            <input
              id="delete-profile-confirm"
              type="text"
              value={deleteProfileConfirmText}
              onChange={(e) => setDeleteProfileConfirmText(e.target.value)}
              placeholder="remove"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent placeholder:text-gray-300"
              autoComplete="off"
            />
          </div>

          {deleteProfileError && (
            <div className="mb-4 bg-red-50 text-red-700 px-3 py-2.5 rounded-lg text-sm">
              {deleteProfileError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowDeleteProfileModal(false);
                setDeleteProfileConfirmText("");
                setDeleteProfileError("");
              }}
              disabled={deletingProfile}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 px-3 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteProfile}
              disabled={deletingProfile || deleteProfileConfirmText !== "remove"}
              className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-lg px-4 py-2"
            >
              {deletingProfile ? "Removing..." : "Remove this profile"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Helper: default notification values ──

function getDefault(
  key: "connection_updates" | "saved_provider_alerts" | "match_updates" | "profile_reminders",
  channel: "email" | "sms"
): boolean {
  if (channel === "email") return true;
  // SMS defaults: all off except explicitly enabled
  return false;
}

// ── Notification Row ──

function NotificationRow({
  title,
  description,
  emailOn,
  smsOn,
  onToggle,
}: {
  title: string;
  description: string;
  emailOn: boolean;
  smsOn: boolean;
  onToggle: (channel: "email" | "sms") => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">Email</span>
          <Toggle on={emailOn} onToggle={() => onToggle("email")} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">SMS</span>
          <Toggle on={smsOn} onToggle={() => onToggle("sms")} />
        </div>
      </div>
    </div>
  );
}

// ── Toggle Switch ──

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        on ? "bg-primary-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-[25px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

// ── Account Row ──

function AccountRow({
  label,
  value,
  verified,
  isEditing,
  editValue,
  onEditChange,
  onStartEdit,
  onSave,
  onCancel,
  saving,
  error,
  success,
  inputType = "text",
  placeholder,
  isPassword,
}: {
  label: string;
  value: string;
  verified?: boolean;
  isEditing: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  success: string;
  inputType?: string;
  placeholder?: string;
  isPassword?: boolean;
}) {
  return (
    <div className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
          {isEditing ? (
            isPassword ? (
              <p className="text-sm text-gray-500 mt-1">
                We&apos;ll send a password reset link to your email.
              </p>
            ) : (
              <input
                type={inputType}
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                placeholder={placeholder}
                className="mt-1.5 w-full text-[15px] text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
            )
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[15px] text-gray-900">{value}</p>
              {verified && (
                <span className="inline-flex items-center gap-1 text-xs text-success-600 font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
          )}
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={onStartEdit}
            className="text-[14px] font-medium text-primary-600 hover:text-primary-700 transition-colors shrink-0 ml-4"
          >
            {isPassword ? "Change" : "Edit"}
          </button>
        )}
      </div>
      {isEditing && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isPassword
              ? "Send reset email"
              : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      {success && <p className="text-sm text-green-600 mt-1">{success}</p>}
    </div>
  );
}

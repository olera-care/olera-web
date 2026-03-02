"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { FamilyMetadata } from "@/lib/types";
import Modal from "@/components/ui/Modal";

export default function SettingsPage() {
  const router = useRouter();
  const { user, activeProfile, profiles, refreshAccountData } =
    useAuth();

  // Notification prefs — optimistic overrides for instant toggle response
  const meta = (activeProfile?.metadata || {}) as FamilyMetadata;
  const notifPrefs = meta.notification_prefs || {};
  const [optimisticNotifs, setOptimisticNotifs] = useState<Record<string, boolean>>({});

  /** Returns the display value for a notification toggle (optimistic → server → default) */
  const getNotifOn = useCallback(
    (key: string, channel: "email" | "sms"): boolean => {
      const oKey = `${key}_${channel}`;
      if (oKey in optimisticNotifs) return optimisticNotifs[oKey];
      const prefs = notifPrefs as Record<string, Record<string, boolean> | undefined>;
      return prefs[key]?.[channel] ?? (channel === "email");
    },
    [optimisticNotifs, notifPrefs]
  );

  // Account editing
  const [editingField, setEditingField] = useState<
    "email" | "phone" | "password" | null
  >(null);
  const [fieldValue, setFieldValue] = useState("");
  const [fieldSaving, setFieldSaving] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [fieldSuccess, setFieldSuccess] = useState("");

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

  // ── Notification toggle (optimistic — flips instantly, persists in background) ──
  const handleNotifToggle = useCallback(
    (
      key: "connection_updates" | "saved_provider_alerts" | "match_updates" | "profile_reminders",
      channel: "email" | "sms"
    ) => {
      if (!activeProfile || !isSupabaseConfigured()) return;

      const oKey = `${key}_${channel}`;
      const currentValue = getNotifOn(key, channel);
      const newValue = !currentValue;

      // Flip immediately in the UI
      setOptimisticNotifs((prev) => ({ ...prev, [oKey]: newValue }));

      // Persist in background — use local metadata as base (skip extra SELECT)
      (async () => {
        try {
          const supabase = createClient();
          const currentMeta = (activeProfile.metadata || {}) as Record<string, unknown>;
          const currentPrefs = (currentMeta.notification_prefs || {}) as Record<
            string,
            Record<string, boolean>
          >;

          const updatedPrefs = {
            ...currentPrefs,
            [key]: { ...(currentPrefs[key] || {}), [channel]: newValue },
          };

          await supabase
            .from("business_profiles")
            .update({
              metadata: { ...currentMeta, notification_prefs: updatedPrefs },
            })
            .eq("id", activeProfile.id);

          await refreshAccountData();
        } finally {
          // Clear optimistic override — server data is now canonical
          setOptimisticNotifs((prev) => {
            const next = { ...prev };
            delete next[oKey];
            return next;
          });
        }
      })();
    },
    [activeProfile, getNotifOn, refreshAccountData]
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

  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl bg-white border border-gray-200/80 shadow-sm divide-y divide-gray-100">
      {/* ── Notifications ── */}
      <div className="p-6">
        <h3 className="text-lg font-display font-bold text-gray-900 mb-5">Notifications</h3>
        <div className="divide-y divide-gray-50">
          <NotificationRow
            title="Connection updates"
            description="When a provider responds or messages you"
            emailOn={getNotifOn("connection_updates", "email")}
            smsOn={getNotifOn("connection_updates", "sms")}
            onToggle={(channel) =>
              handleNotifToggle("connection_updates", channel)
            }
          />
          <NotificationRow
            title="Saved provider alerts"
            description="When a saved provider becomes available"
            emailOn={getNotifOn("saved_provider_alerts", "email")}
            smsOn={getNotifOn("saved_provider_alerts", "sms")}
            onToggle={(channel) =>
              handleNotifToggle("saved_provider_alerts", channel)
            }
          />
          <NotificationRow
            title="Match updates"
            description="New provider matches and care profile responses"
            emailOn={getNotifOn("match_updates", "email")}
            smsOn={getNotifOn("match_updates", "sms")}
            onToggle={(channel) =>
              handleNotifToggle("match_updates", channel)
            }
          />
          <NotificationRow
            title="Profile reminders"
            description="Tips to complete your care profile"
            emailOn={getNotifOn("profile_reminders", "email")}
            smsOn={getNotifOn("profile_reminders", "sms")}
            onToggle={(channel) =>
              handleNotifToggle("profile_reminders", channel)
            }
          />
        </div>
      </div>

      {/* ── Account ── */}
      <div className="p-6">
        <h3 className="text-lg font-display font-bold text-gray-900 mb-5">Account</h3>
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

      {/* ── Remove this profile ── */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] font-semibold text-gray-900">
              Remove this profile
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Remove your{" "}
              <span className="font-medium text-gray-700">
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
            <p className="text-[15px] font-semibold text-gray-900">
              Delete account
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
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
              <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

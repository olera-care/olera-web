"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// ── Types ──

interface Provider {
  id: string;
  display_name: string;
  slug: string;
  image_url: string | null;
  tagline: string | null;
  city: string | null;
  state: string | null;
  google_place_id: string | null;
}

// ── Icons ──

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function ExternalLinkIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

// ── Minimal Header ──

function MinimalHeader() {
  return (
    <header className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16">
        <Link href="/" className="flex items-center gap-2 group" aria-label="Olera homepage">
          <Image src="/images/olera-logo.png" alt="" width={28} height={28} className="object-contain" />
          <span className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors">Olera</span>
        </Link>
      </div>
    </header>
  );
}

// ── Main Page Content ──

function ReviewPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const clientName = searchParams.get("name") || "";

  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [experience, setExperience] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch provider info
  useEffect(() => {
    async function fetchProvider() {
      try {
        const res = await fetch(`/api/provider/${slug}/info`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Provider not found");
          } else {
            setError("Failed to load provider");
          }
          return;
        }
        const data = await res.json();
        setProvider(data.provider);
      } catch {
        setError("Failed to load provider");
      } finally {
        setLoading(false);
      }
    }
    fetchProvider();
  }, [slug]);

  // Copy to clipboard and open Google
  const handleShareOnGoogle = async () => {
    if (!provider?.google_place_id || !experience.trim()) return;

    const reviewText = experience.trim();

    try {
      await navigator.clipboard.writeText(reviewText);
      setCopied(true);

      // Show success state briefly, then open Google
      setTimeout(() => {
        setShowSuccess(true);
        window.open(
          `https://search.google.com/local/writereview?placeid=${provider.google_place_id}`,
          "_blank",
          "noopener,noreferrer"
        );
      }, 500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = reviewText;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);

      setTimeout(() => {
        setShowSuccess(true);
        window.open(
          `https://search.google.com/local/writereview?placeid=${provider.google_place_id}`,
          "_blank",
          "noopener,noreferrer"
        );
      }, 500);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white flex flex-col">
        <MinimalHeader />
        <div className="flex-1 flex items-center justify-center" role="status" aria-label="Loading">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Error state - provider not found
  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white flex flex-col">
        <MinimalHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md" style={{ animation: "fadeIn 0.3s ease-out" }}>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-vanilla-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 className="text-xl font-display font-bold text-gray-900 mb-2">
              {error || "Provider not found"}
            </h1>
            <p className="text-[15px] text-gray-500 mb-6 leading-relaxed">
              We couldn&apos;t find this provider. The link may be incorrect or expired.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 min-h-[52px]"
            >
              Go to homepage
            </Link>
          </div>
        </div>
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // No Google Place ID - show friendly message
  if (!provider.google_place_id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white flex flex-col">
        <MinimalHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md" style={{ animation: "fadeIn 0.3s ease-out" }}>
            {/* Provider avatar */}
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl overflow-hidden bg-vanilla-100 ring-4 ring-white shadow-md">
              {provider.image_url ? (
                <Image
                  src={provider.image_url}
                  alt={provider.display_name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
                  <span className="text-2xl font-bold text-primary-600">
                    {provider.display_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <h1 className="text-xl font-display font-bold text-gray-900 mb-2">
              Thanks for wanting to review {provider.display_name}!
            </h1>
            <p className="text-[15px] text-gray-500 mb-6 leading-relaxed">
              We&apos;re still setting up their Google review page. In the meantime, your feedback means a lot — please check back soon!
            </p>
            <Link
              href={`/provider/${provider.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 min-h-[52px]"
            >
              View their profile
            </Link>
          </div>
        </div>
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // Success state (after sharing to Google)
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white flex flex-col">
        <MinimalHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md" style={{ animation: "fadeIn 0.3s ease-out" }}>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-success-50 flex items-center justify-center ring-4 ring-success-50/50 shadow-sm">
              <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
              You&apos;re all set!
            </h1>
            <p className="text-[15px] text-gray-500 mb-6 leading-relaxed">
              Your review has been copied. Paste it in the Google review window that just opened.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  window.open(
                    `https://search.google.com/local/writereview?placeid=${provider.google_place_id}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 min-h-[52px] shadow-xs"
              >
                <GoogleIcon className="w-5 h-5" />
                Open Google Reviews again
              </button>
              <Link
                href={`/provider/${provider.slug}`}
                className="block text-[15px] text-gray-500 hover:text-gray-700 transition-colors py-2"
              >
                View provider profile
              </Link>
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // Main review form
  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white flex flex-col">
      <MinimalHeader />
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <main className="flex-1 flex items-center justify-center p-4 py-8 sm:py-12">
        <div className="w-full max-w-lg" style={{ animation: "fadeIn 0.3s ease-out" }}>
          {/* Provider header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden bg-vanilla-100 ring-4 ring-white shadow-md">
              {provider.image_url ? (
                <Image
                  src={provider.image_url}
                  alt={provider.display_name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
                  <span className="text-2xl font-bold text-primary-600" aria-hidden="true">
                    {provider.display_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-1">
              {provider.display_name}
            </h1>
            {provider.city && provider.state && (
              <p className="text-gray-500">
                {provider.city}, {provider.state}
              </p>
            )}
            {clientName && (
              <p className="text-primary-600 font-medium mt-3">
                Hi {clientName}, thanks for taking a moment to leave a review!
              </p>
            )}
          </div>

          {/* Main card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-display font-bold text-gray-900 mb-2 text-center">
              How was your experience?
            </h2>
            <p className="text-[15px] text-gray-500 text-center mb-6 leading-relaxed">
              Share your honest thoughts to help other families find quality care.
            </p>

            {/* Text area */}
            <div className="mb-6">
              <label htmlFor="experience" className="sr-only">Your experience</label>
              <textarea
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={5}
                placeholder="Tell us about your experience with this provider..."
                className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-vanilla-50/50 text-gray-900 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 focus:bg-white transition-all resize-none leading-relaxed"
                aria-describedby="experience-hint"
              />
              <p id="experience-hint" className="sr-only">
                Write about your experience working with this care provider
              </p>
            </div>

            {/* Google info note - using warm tones */}
            <div className="flex items-start gap-3 p-4 bg-vanilla-100 border border-warm-100/60 rounded-xl mb-6">
              <GoogleIcon className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-gray-700 font-medium">
                  Your review will be shared on Google
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  More families can discover them. You&apos;ll need a Google account to post.
                </p>
              </div>
            </div>

            {/* Share button */}
            <button
              type="button"
              onClick={handleShareOnGoogle}
              disabled={!experience.trim()}
              aria-disabled={!experience.trim()}
              className={`w-full py-4 rounded-xl font-semibold text-[15px] transition-all flex items-center justify-center gap-2.5 min-h-[56px] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                copied
                  ? "bg-success-600 text-white focus:ring-success-300"
                  : experience.trim()
                  ? "bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow focus:ring-primary-300 active:scale-[0.99]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed focus:ring-gray-200"
              }`}
            >
              {copied ? (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Copied! Opening Google...
                </>
              ) : (
                <>
                  <ExternalLinkIcon className="w-5 h-5" />
                  Share on Google
                </>
              )}
            </button>

            {/* Helper text */}
            <p className="text-xs text-center text-gray-400 mt-4 leading-relaxed">
              We&apos;ll copy your review to your clipboard and open Google Reviews.
              <br />
              Just paste and submit!
            </p>
          </div>

          {/* Footer */}
          <footer className="text-center mt-10">
            <p className="text-xs text-gray-400">
              Powered by{" "}
              <Link href="/" className="text-primary-600 hover:text-primary-700 hover:underline transition-colors">
                Olera
              </Link>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

// ── Default Export with Suspense ──

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ReviewPageContent />
    </Suspense>
  );
}

/**
 * Email validation utilities for provider onboarding
 * - Typo detection with suggestions
 * - Format validation
 * - Common domain corrections
 */

// Common domain typos and their corrections
const DOMAIN_TYPOS: Record<string, string> = {
  // Gmail
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cmo": "gmail.com",
  "gmail.om": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gmaul.com": "gmail.com",
  "gemail.com": "gmail.com",
  // Yahoo
  "yaho.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yhoo.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  // Hotmail
  "hotmal.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotamil.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  // Outlook
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.con": "outlook.com",
  "outlool.com": "outlook.com",
  "outllook.com": "outlook.com",
  // iCloud
  "icloud.co": "icloud.com",
  "icloud.con": "icloud.com",
  "icoud.com": "icloud.com",
  "iclod.com": "icloud.com",
  // AOL
  "aol.co": "aol.com",
  "aol.con": "aol.com",
  // Common TLD typos (applied to any domain)
  ".con": ".com",
  ".cmo": ".com",
  ".co,": ".com",
  ".ocm": ".com",
  ".vom": ".com",
  ".xom": ".com",
  ".cim": ".com",
  ".com,": ".com",
  ".nt": ".net",
  ".ner": ".net",
  ".ne": ".net",
  ".orgg": ".org",
  ".og": ".org",
  ".origination": ".org",
};

// Valid TLDs (common ones)
const VALID_TLDS = new Set([
  "com", "org", "net", "edu", "gov", "mil", "int",
  "co", "io", "ai", "app", "dev", "tech", "info", "biz",
  "us", "uk", "ca", "au", "de", "fr", "jp", "cn", "in", "br", "mx",
  "health", "care", "medical", "clinic", "hospital",
  "agency", "company", "services", "solutions", "group",
  "online", "site", "website", "email", "mail",
]);

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
  suggestedEmail?: string;
}

/**
 * Validate email format and check for common typos
 */
export function validateEmail(email: string): EmailValidationResult {
  const trimmed = email.trim().toLowerCase();

  // Empty check
  if (!trimmed) {
    return { valid: false, error: "Email is required" };
  }

  // Basic format check
  if (!trimmed.includes("@")) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  const [localPart, domain] = trimmed.split("@");

  // Check local part
  if (!localPart || localPart.length === 0) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  // Check domain exists
  if (!domain || domain.length === 0) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  // Check domain has a dot
  if (!domain.includes(".")) {
    return { valid: false, error: "Please check the domain in your email" };
  }

  // Check for full domain typos first
  const domainLower = domain.toLowerCase();
  if (DOMAIN_TYPOS[domainLower]) {
    const correctedDomain = DOMAIN_TYPOS[domainLower];
    const correctedEmail = `${localPart}@${correctedDomain}`;
    return {
      valid: false,
      suggestion: `Did you mean ${correctedDomain}?`,
      suggestedEmail: correctedEmail,
    };
  }

  // Check for TLD typos
  const lastDotIndex = domain.lastIndexOf(".");
  const tld = domain.slice(lastDotIndex); // includes the dot
  const domainWithoutTld = domain.slice(0, lastDotIndex);

  for (const [typo, correction] of Object.entries(DOMAIN_TYPOS)) {
    if (typo.startsWith(".") && tld === typo) {
      const correctedDomain = domainWithoutTld + correction;
      const correctedEmail = `${localPart}@${correctedDomain}`;
      return {
        valid: false,
        suggestion: `Did you mean ${correctedDomain}?`,
        suggestedEmail: correctedEmail,
      };
    }
  }

  // Extract TLD without dot for validation
  const tldWithoutDot = tld.slice(1);

  // Check if TLD is suspiciously short (likely a typo)
  if (tldWithoutDot.length === 1) {
    return {
      valid: false,
      error: "Please check the ending of your email address",
    };
  }

  // Check for obviously invalid TLDs (numbers, special chars)
  if (!/^[a-z]+$/.test(tldWithoutDot)) {
    return {
      valid: false,
      error: "Please enter a valid email address",
    };
  }

  // Warn about uncommon TLDs but don't block (they might be valid)
  // Only block truly invalid patterns

  // Check for double dots
  if (domain.includes("..")) {
    return {
      valid: false,
      error: "Please check your email address",
    };
  }

  // Check for trailing/leading dots in domain
  if (domain.startsWith(".") || domain.endsWith(".")) {
    return {
      valid: false,
      error: "Please check your email address",
    };
  }

  // All checks passed
  return { valid: true };
}

/**
 * Check if email is from a consumer domain (gmail, yahoo, etc.)
 */
export function isBusinessEmail(email: string): boolean {
  const consumerDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "live.com",
    "msn.com",
    "protonmail.com",
    "mail.com",
    "ymail.com",
    "comcast.net",
    "att.net",
    "verizon.net",
    "sbcglobal.net",
    "bellsouth.net",
    "cox.net",
    "earthlink.net",
  ];

  const domain = email.split("@")[1]?.toLowerCase();
  return !consumerDomains.includes(domain);
}

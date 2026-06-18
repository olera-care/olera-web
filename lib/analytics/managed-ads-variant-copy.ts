import type { ManagedAdsVariant } from "./managed-ads-variant";

export function managedAdsVariantLabel(variant: ManagedAdsVariant): string {
  switch (variant) {
    case "direct_reach":
      return "Direct reach";
    case "local_plan":
      return "Local plan";
  }
}

export function managedAdsVariantSubLabel(variant: ManagedAdsVariant): string {
  switch (variant) {
    case "direct_reach":
      return "Reach families already searching";
    case "local_plan":
      return "Ads we run, families to your page";
  }
}

export type ManagedAdsPitchCopy = {
  headline: string;
  accent: string;
  body: string;
};

export function managedAdsPitchCopy(variant: ManagedAdsVariant): ManagedAdsPitchCopy {
  switch (variant) {
    case "local_plan":
      return {
        headline: "Send local families",
        accent: "straight to your page",
        body: "We run Google, Meta, and local ads for your market. You pick timing and budget; we handle setup and send interested families to your Olera page.",
      };
    case "direct_reach":
      return {
        headline: "Reach families",
        accent: "already searching for care",
        body: "We run the ads where families are already looking — and send every one of them straight to your Olera page.",
      };
  }
}

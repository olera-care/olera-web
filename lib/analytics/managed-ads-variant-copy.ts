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
      return "See what we'd run locally";
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
        headline: "See what we'd run",
        accent: "for your local market",
        body: "We turn local demand into a simple launch plan: where we'd advertise, what budget makes sense, and how families get sent to your Olera page.",
      };
    case "direct_reach":
      return {
        headline: "Reach families",
        accent: "already searching for care",
        body: "We run the ads where families are already looking — and send every one of them straight to your Olera page.",
      };
  }
}

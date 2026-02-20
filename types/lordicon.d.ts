/**
 * Type declarations for the <lord-icon> web component from Lordicon.
 * Script: https://cdn.lordicon.com/lordicon.js
 */
import "react";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "lord-icon": {
        src?: string;
        trigger?: string;
        colors?: string;
        delay?: string;
        state?: string;
        target?: string;
        style?: React.CSSProperties;
        className?: string;
      };
    }
  }
}

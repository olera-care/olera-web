declare module "react-simple-maps" {
  import type { ReactNode, CSSProperties, MouseEvent } from "react";

  interface GeographyStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    outline?: string;
    cursor?: string;
    transition?: string;
  }

  interface GeographyStyleConfig {
    default?: GeographyStyle;
    hover?: GeographyStyle;
    pressed?: GeographyStyle;
  }

  interface GeoFeature {
    rsmKey: string;
    id: string | number;
    type: string;
    geometry: object;
    properties: Record<string, unknown>;
  }

  interface GeographiesRenderProps {
    geographies: GeoFeature[];
  }

  interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    rotate?: [number, number, number];
    parallels?: [number, number];
    translate?: [number, number];
  }

  interface ComposableMapProps {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    className?: string;
    style?: CSSProperties;
    viewBox?: string;
    children?: ReactNode;
  }

  interface GeographiesProps {
    geography: string | object;
    children: (props: GeographiesRenderProps) => ReactNode;
  }

  interface GeographyProps {
    key?: string;
    geography: GeoFeature;
    style?: GeographyStyleConfig;
    onMouseEnter?: (event: MouseEvent<SVGPathElement>) => void;
    onMouseMove?: (event: MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (event: MouseEvent<SVGPathElement>) => void;
    onClick?: (event: MouseEvent<SVGPathElement>) => void;
  }

  interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
  export function Marker(props: MarkerProps): JSX.Element;
}

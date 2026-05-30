// Design Token Types — W3C Design Token Community Group Format
// https://design-tokens.github.io/community-group/format/

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceAnnotation {
  level: ConfidenceLevel;
  note?: string;
}

// ─── Color ───────────────────────────────────────────────────────────────────

export interface ColorToken {
  hex: string;
  role: "primary" | "secondary" | "background" | "surface" | "text-primary" | "text-secondary" | "accent" | "border";
  label: string;
  confidence: ConfidenceAnnotation;
}

// ─── Typography ───────────────────────────────────────────────────────────────

export interface TypographyToken {
  level: "h1" | "h2" | "h3" | "body" | "caption" | "label";
  size: string;         // e.g. "32px"
  sizeValue: number;    // numeric px value
  weight: string;       // e.g. "700"
  lineHeight: string;   // e.g. "1.4"
  label: string;
  confidence: ConfidenceAnnotation;
}

// ─── Spacing ─────────────────────────────────────────────────────────────────

export interface SpacingToken {
  name: string;         // e.g. "spacing-xs"
  value: string;        // e.g. "8px"
  numericValue: number;
  usage: string;        // e.g. "Component gap"
  confidence: ConfidenceAnnotation;
}

export interface SpacingSystem {
  baseUnit: number;           // e.g. 8
  gridType: "4pt" | "8pt" | "custom" | "unknown";
  tokens: SpacingToken[];
  confidence: ConfidenceAnnotation;
}

// ─── Radius ──────────────────────────────────────────────────────────────────

export interface RadiusToken {
  name: string;         // e.g. "radius-button"
  value: string;        // e.g. "999px"
  numericValue: number;
  context: string;      // e.g. "Button / pill shape"
  confidence: ConfidenceAnnotation;
}

// ─── Full Analysis Result ─────────────────────────────────────────────────────

export interface StyleScanResult {
  id: string;
  createdAt: string;
  imagePreviewUrl?: string;

  // Style keywords from visual analysis
  styleKeywords: string[];

  // Design tokens
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingSystem;
  radii: RadiusToken[];

  // Overall analysis metadata
  overallConfidence: ConfidenceLevel;
  analysisNotes: string;
}

// ─── Editable State ───────────────────────────────────────────────────────────

export type EditableResult = {
  colors: (ColorToken & { edited?: boolean })[];
  typography: (TypographyToken & { edited?: boolean })[];
  spacing: SpacingSystem & {
    tokens: (SpacingToken & { edited?: boolean })[];
  };
  radii: (RadiusToken & { edited?: boolean })[];
  styleKeywords: string[];
  analysisNotes: string;
  overallConfidence: ConfidenceLevel;
};

// ─── W3C Export Format ────────────────────────────────────────────────────────

export interface W3CDesignToken {
  $value: string | number;
  $type: "color" | "dimension" | "fontWeight" | "number" | "string";
  $description?: string;
}

export interface W3CTokenGroup {
  [key: string]: W3CDesignToken | W3CTokenGroup;
}

export interface StyleScanExport {
  $meta: {
    exportedBy: "StyleScan";
    version: string;
    exportedAt: string;
    note: string;
  };
  color: W3CTokenGroup;
  typography: W3CTokenGroup;
  spacing: W3CTokenGroup;
  borderRadius: W3CTokenGroup;
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface AnalyzeRequest {
  imageBase64: string;
  mimeType: string;
}

export interface AnalyzeResponse {
  success: boolean;
  result?: StyleScanResult;
  error?: string;
}

export type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "analyzing" }
  | { status: "done"; result: StyleScanResult; imageUrl: string }
  | { status: "error"; message: string };

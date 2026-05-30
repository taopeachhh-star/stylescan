import type {
  EditableResult,
  StyleScanExport,
  W3CDesignToken,
  W3CTokenGroup,
} from "@/types";

const VERSION = "0.1.0";

/**
 * Converts the editable analysis result into a W3C Design Token Community Group
 * compliant JSON file that can be imported directly into Figma via Tokens Studio.
 *
 * Reference: https://design-tokens.github.io/community-group/format/
 */
export function exportToW3C(result: EditableResult): StyleScanExport {
  const colorGroup: W3CTokenGroup = {};
  for (const c of result.colors) {
    const key = c.role.replace(/[^a-zA-Z0-9]/g, "-");
    colorGroup[key] = {
      $value: c.hex,
      $type: "color",
      $description: `${c.label} — confidence: ${c.confidence.level}`,
    } satisfies W3CDesignToken;
  }

  const typographyGroup: W3CTokenGroup = {};
  for (const t of result.typography) {
    typographyGroup[`${t.level}-size`] = {
      $value: t.size,
      $type: "dimension",
      $description: `${t.label} font size — confidence: ${t.confidence.level}`,
    } satisfies W3CDesignToken;
    typographyGroup[`${t.level}-weight`] = {
      $value: t.weight,
      $type: "fontWeight",
      $description: `${t.label} font weight`,
    } satisfies W3CDesignToken;
    typographyGroup[`${t.level}-line-height`] = {
      $value: t.lineHeight,
      $type: "number",
      $description: `${t.label} line height`,
    } satisfies W3CDesignToken;
  }

  const spacingGroup: W3CTokenGroup = {
    "base-unit": {
      $value: `${result.spacing.baseUnit}px`,
      $type: "dimension",
      $description: `Base spacing unit — confidence: ${result.spacing.confidence.level}`,
    } satisfies W3CDesignToken,
  };
  for (const s of result.spacing.tokens) {
    spacingGroup[s.name] = {
      $value: s.value,
      $type: "dimension",
      $description: `${s.usage} — confidence: ${s.confidence.level}`,
    } satisfies W3CDesignToken;
  }

  const radiusGroup: W3CTokenGroup = {};
  for (const r of result.radii) {
    const key = r.name.replace("radius-", "");
    radiusGroup[key] = {
      $value: r.value,
      $type: "dimension",
      $description: `${r.context} — confidence: ${r.confidence.level}`,
    } satisfies W3CDesignToken;
  }

  return {
    $meta: {
      exportedBy: "StyleScan",
      version: VERSION,
      exportedAt: new Date().toISOString(),
      note: "Values marked with low/medium confidence are AI inferences. Verify before production use.",
    },
    color: colorGroup,
    typography: typographyGroup,
    spacing: spacingGroup,
    borderRadius: radiusGroup,
  };
}

/**
 * Triggers a browser download of the token JSON file.
 */
export function downloadTokenJSON(result: EditableResult, filename?: string): void {
  const data = exportToW3C(result);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `stylescan-tokens-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Returns the JSON string for display (copy to clipboard etc.)
 */
export function getTokenJSONString(result: EditableResult): string {
  return JSON.stringify(exportToW3C(result), null, 2);
}

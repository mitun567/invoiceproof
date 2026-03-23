export type InvoiceTemplateId = "luxury" | "corporate" | "creative" | "minimal";

export type InvoicePalette = {
  primary: string;
  secondary: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  accent: string;
};

export type InvoiceStyle = {
  templateId: InvoiceTemplateId;
  styleName: string;
  accentLabel: string;
  hierarchyStyle: string;
  tone: string;
  lineItemPresentation: string;
  footerStyle: string;
  trustBadge: string;
  previewSummary: string;
  headerTitle: string;
  heroCopy: string;
  palette: InvoicePalette;
};

const STYLE_LIBRARY: Record<InvoiceTemplateId, InvoiceStyle> = {
  luxury: {
    templateId: "luxury",
    styleName: "Luxury editorial",
    accentLabel: "Luxury",
    hierarchyStyle: "Bold editorial headline with premium summary panel",
    tone: "Polished, elevated, and executive",
    lineItemPresentation: "",
    footerStyle: "Dark trust block with embossed-style seal messaging",
    trustBadge: "Sealed premium proof",
    previewSummary:
      "Dark navy canvas with gold accents and a prestige trust block.",
    headerTitle: "Premium invoice",
    heroCopy: "Refined presentation for high-value client work and retainers.",
    palette: {
      primary: "#111827",
      secondary: "#C6A35C",
      surface: "#F8F4EC",
      surfaceAlt: "#1F2937",
      text: "#111827",
      muted: "#6B7280",
      accent: "#E8D3A2",
    },
  },
  corporate: {
    templateId: "corporate",
    styleName: "Corporate executive",
    accentLabel: "Corporate",
    hierarchyStyle: "Structured top bar with crisp executive summary blocks",
    tone: "Confident, sharp, and boardroom-ready",
    lineItemPresentation: "",
    footerStyle: "Structured compliance footer with verification summary",
    trustBadge: "Audit-ready seal",
    previewSummary: "Royal blue structure with formal financial hierarchy.",
    headerTitle: "Executive invoice",
    heroCopy: "",
    palette: {
      primary: "#1640D6",
      secondary: "#0F172A",
      surface: "#F4F7FF",
      surfaceAlt: "#DCE7FF",
      text: "#0F172A",
      muted: "#475569",
      accent: "#5B8CFF",
    },
  },
  creative: {
    templateId: "creative",
    styleName: "Creative studio",
    accentLabel: "Creative",
    hierarchyStyle: "Expressive split layout with highlighted story-led totals",
    tone: "Modern, energetic, and design-forward",
    lineItemPresentation: "",
    footerStyle: "Gradient-inspired trust ribbon with proof callout",
    trustBadge: "Studio-grade proof",
    previewSummary:
      "Vibrant purple-coral palette with a more expressive layout.",
    headerTitle: "Studio invoice",
    heroCopy: "Ideal for product design, branding, and creative retainers.",
    palette: {
      primary: "#7C3AED",
      secondary: "#F97316",
      surface: "#FAF5FF",
      surfaceAlt: "#FCE7F3",
      text: "#2E1065",
      muted: "#6D28D9",
      accent: "#FDBA74",
    },
  },
  minimal: {
    templateId: "minimal",
    styleName: "Minimal modern",
    accentLabel: "Minimal",
    hierarchyStyle: "Quiet whitespace-first layout with subtle detail grouping",
    tone: "Calm, precise, and contemporary",
    lineItemPresentation: "",
    footerStyle: "Subtle proof footer with clean QR anchor",
    trustBadge: "Quiet verified seal",
    previewSummary: "Soft grayscale system with restrained premium elegance.",
    headerTitle: "Modern invoice",
    heroCopy: "Minimal visual noise while keeping trust details prominent.",
    palette: {
      primary: "#0F172A",
      secondary: "#94A3B8",
      surface: "#FFFFFF",
      surfaceAlt: "#F8FAFC",
      text: "#0F172A",
      muted: "#64748B",
      accent: "#CBD5E1",
    },
  },
};

function sanitizeStyleText(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text && !/^(undefined|null)$/i.test(text) ? text : fallback;
}

export function getInvoiceStyle(
  templateId?: string,
  overrides?: Partial<InvoiceStyle>
): InvoiceStyle {
  const resolvedId = (
    templateId && templateId in STYLE_LIBRARY ? templateId : "corporate"
  ) as InvoiceTemplateId;
  const base = STYLE_LIBRARY[resolvedId];
  const paletteOverrides: Partial<InvoicePalette> = overrides?.palette ?? {};

  return {
    templateId: resolvedId,
    styleName: sanitizeStyleText(overrides?.styleName, base.styleName),
    accentLabel: sanitizeStyleText(overrides?.accentLabel, base.accentLabel),
    hierarchyStyle: sanitizeStyleText(
      overrides?.hierarchyStyle,
      base.hierarchyStyle
    ),
    tone: sanitizeStyleText(overrides?.tone, base.tone),
    lineItemPresentation: sanitizeStyleText(
      overrides?.lineItemPresentation,
      base.lineItemPresentation
    ),
    footerStyle: sanitizeStyleText(overrides?.footerStyle, base.footerStyle),
    trustBadge: sanitizeStyleText(overrides?.trustBadge, base.trustBadge),
    previewSummary: sanitizeStyleText(
      overrides?.previewSummary,
      base.previewSummary
    ),
    headerTitle: sanitizeStyleText(overrides?.headerTitle, base.headerTitle),
    heroCopy: sanitizeStyleText(overrides?.heroCopy, base.heroCopy),
    palette: {
      primary: sanitizeStyleText(
        paletteOverrides.primary,
        base.palette.primary
      ),
      secondary: sanitizeStyleText(
        paletteOverrides.secondary,
        base.palette.secondary
      ),
      surface: sanitizeStyleText(
        paletteOverrides.surface,
        base.palette.surface
      ),
      surfaceAlt: sanitizeStyleText(
        paletteOverrides.surfaceAlt,
        base.palette.surfaceAlt
      ),
      text: sanitizeStyleText(paletteOverrides.text, base.palette.text),
      muted: sanitizeStyleText(paletteOverrides.muted, base.palette.muted),
      accent: sanitizeStyleText(paletteOverrides.accent, base.palette.accent),
    },
  };
}

export function listInvoiceStyles() {
  return Object.values(STYLE_LIBRARY);
}

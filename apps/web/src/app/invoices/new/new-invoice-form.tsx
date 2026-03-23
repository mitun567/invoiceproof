"use client";

import type {
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "../../../components/ui/spinner";
import { useToast } from "../../../components/ui/toast-provider";
import {
  clearPendingInvoiceDraft,
  loadPendingInvoiceDraft,
} from "../../../lib/invoice-draft-transfer";

type LoadingState = null | "ai" | "ai-draft" | "finalize";

const MAX_LOGO_SIZE_BYTES = 4 * 1024 * 1024;
const MAX_ATTACHMENT_SIZE_BYTES = 12 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;

type LineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
};

type StylePalette = {
  primary: string;
  secondary: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  accent: string;
};

type StyleTheme = {
  templateId: string;
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
  palette: StylePalette;
};

type CanvasBlock = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z?: number;
  locked?: boolean;
  editable?: boolean;
  content?: string;
  binding?: { key?: string };
  style?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    background?: string;
    align?: string;
    radius?: number;
  };
};

type InvoiceDraftOption = {
  title: string;
  accentLabel: string;
  templateId: string;
  styleDirection: string;
  style: StyleTheme;
  blocks: CanvasBlock[];
  summary: string;
};

type AiCanvasDraftResult = InvoiceDraftOption & {
  promptSummary: string;
  missingFields: string[];
  invoice: InvoiceState;
};

type InvoiceState = {
  invoiceNumber: string;
  customerName: string;
  amount: string;
  currency: string;
  taxPercentage: string;
  discountPercentage: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  paymentTerms: string;
  issuerName: string;
  issuerEmail: string;
  issuerAddress: string;
  accentLabel: string;
  lineItems: LineItem[];
  style: StyleTheme;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const FOOTER_HEIGHT = 92;
const intlWithSupportedValues = Intl as typeof Intl & {
  supportedValuesOf?: (key: string) => string[];
};
const FALLBACK_CURRENCY_OPTIONS = [
  "USD",
  "EUR",
  "GBP",
  "INR",
  "JPY",
  "CNY",
  "AUD",
  "CAD",
  "NZD",
  "SGD",
  "HKD",
  "AED",
  "SAR",
  "QAR",
  "KWD",
  "BHD",
  "OMR",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
  "ISK",
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "BGN",
  "TRY",
  "RUB",
  "UAH",
  "ZAR",
  "NGN",
  "KES",
  "GHS",
  "EGP",
  "MAD",
  "MXN",
  "BRL",
  "ARS",
  "CLP",
  "COP",
  "PEN",
  "UYU",
  "PYG",
  "BOB",
  "CRC",
  "DOP",
  "JMD",
  "TTD",
  "BBD",
  "BSD",
  "BMD",
  "KRW",
  "THB",
  "VND",
  "IDR",
  "MYR",
  "PHP",
  "TWD",
  "PKR",
  "BDT",
  "LKR",
  "NPR",
  "ILS",
];
const CURRENCY_OPTIONS = Array.from(
  new Set(
    (typeof intlWithSupportedValues.supportedValuesOf === "function"
      ? intlWithSupportedValues.supportedValuesOf("currency")
      : FALLBACK_CURRENCY_OPTIONS
    ).map((code) => code.toUpperCase())
  )
).sort();
const CURRENCY_OPTION_SET = new Set(CURRENCY_OPTIONS);
const CURRENCY_DETECTION_RULES: Array<{ pattern: RegExp; code: string }> = [
  { pattern: /US\$/i, code: "USD" },
  { pattern: /A\$/i, code: "AUD" },
  { pattern: /C\$/i, code: "CAD" },
  { pattern: /NZ\$/i, code: "NZD" },
  { pattern: /HK\$/i, code: "HKD" },
  { pattern: /S\$/i, code: "SGD" },
  { pattern: /R\$/i, code: "BRL" },
  { pattern: /\bAED\b|\bDH\b|د\.إ/i, code: "AED" },
  { pattern: /\bSAR\b|ر\.س/i, code: "SAR" },
  { pattern: /\bQAR\b|ر\.ق/i, code: "QAR" },
  { pattern: /\bKWD\b|د\.ك/i, code: "KWD" },
  { pattern: /\bBHD\b|د\.ب/i, code: "BHD" },
  { pattern: /\bOMR\b|ر\.ع/i, code: "OMR" },
  { pattern: /€/i, code: "EUR" },
  { pattern: /£/i, code: "GBP" },
  { pattern: /₹/i, code: "INR" },
  { pattern: /\bCNY\b|\bRMB\b|CN¥|￥|元/i, code: "CNY" },
  { pattern: /¥|円/i, code: "JPY" },
  { pattern: /₩/i, code: "KRW" },
  { pattern: /₽/i, code: "RUB" },
  { pattern: /₴/i, code: "UAH" },
  { pattern: /₺/i, code: "TRY" },
  { pattern: /₫/i, code: "VND" },
  { pattern: /฿/i, code: "THB" },
  { pattern: /₱/i, code: "PHP" },
  { pattern: /₦/i, code: "NGN" },
  { pattern: /₵/i, code: "GHS" },
  { pattern: /₪/i, code: "ILS" },
  { pattern: /₨/i, code: "PKR" },
  { pattern: /\$/i, code: "USD" },
];

const BASE_STYLES: Record<string, StyleTheme> = {
  luxury: {
    templateId: "luxury",
    styleName: "Luxury editorial",
    accentLabel: "Luxury",
    hierarchyStyle: "Editorial hierarchy",
    tone: "Elevated and executive",
    lineItemPresentation: "Premium ledger",
    footerStyle: "Dark verified footer",
    trustBadge: "Sealed premium proof",
    previewSummary: "Dark navy hero with warm metallic accents.",
    headerTitle: "Premium invoice",
    heroCopy: "Refined presentation for retainers and premium engagements.",
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
    hierarchyStyle: "Structured executive layout",
    tone: "Crisp and confident",
    lineItemPresentation: "Boardroom finance table",
    footerStyle: "Compliance-ready footer",
    trustBadge: "Audit-ready seal",
    previewSummary: "Royal blue structure with sharp financial hierarchy.",
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
    hierarchyStyle: "Expressive split layout",
    tone: "Energetic and premium",
    lineItemPresentation: "Story-led service table",
    footerStyle: "Ribbon footer with proof",
    trustBadge: "Studio-grade proof",
    previewSummary: "Vibrant purple canvas with warm highlights.",
    headerTitle: "Studio invoice",
    heroCopy: "Ideal for branding, design, product, and creative retainers.",
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
    hierarchyStyle: "Quiet whitespace-first layout",
    tone: "Calm and precise",
    lineItemPresentation: "Minimal rows with understated separators",
    footerStyle: "Quiet proof footer",
    trustBadge: "Quiet verified seal",
    previewSummary: "Soft grayscale system with restrained premium spacing.",
    headerTitle: "Modern invoice",
    heroCopy: "Minimal visual noise while trust details stay present.",
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

function cloneBlocks(blocks: CanvasBlock[]) {
  return blocks.map((block) => ({
    ...block,
    binding: block.binding ? { ...block.binding } : undefined,
    style: block.style ? { ...block.style } : undefined,
  }));
}

function defaultBlocks(templateId: string): CanvasBlock[] {
  const templates: Record<string, CanvasBlock[]> = {
    corporate: [
      {
        id: "logo",
        type: "logo",
        x: 40,
        y: 42,
        w: 86,
        h: 86,
        binding: { key: "logo" },
        style: { radius: 24, background: "#ffffff" },
      },
      {
        id: "title",
        type: "text",
        x: 142,
        y: 40,
        w: 250,
        h: 28,
        binding: { key: "headerTitle" },
        style: { fontSize: 16, fontWeight: "700", color: "#5B8CFF" },
      },
      {
        id: "invoiceNumber",
        type: "text",
        x: 142,
        y: 72,
        w: 230,
        h: 42,
        binding: { key: "invoiceNumber" },
        style: { fontSize: 32, fontWeight: "800", color: "#0F172A" },
      },
      {
        id: "amount",
        type: "amount",
        x: 410,
        y: 44,
        w: 145,
        h: 92,
        binding: { key: "amount" },
        style: { background: "#DCE7FF", color: "#1640D6", radius: 28 },
      },
      {
        id: "issuer",
        type: "multiline",
        x: 40,
        y: 172,
        w: 220,
        h: 108,
        binding: { key: "issuer" },
        style: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
      },
      {
        id: "customer",
        type: "multiline",
        x: 310,
        y: 172,
        w: 245,
        h: 108,
        binding: { key: "customer" },
        style: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
      },
      {
        id: "meta",
        type: "multiline",
        x: 40,
        y: 292,
        w: 515,
        h: 70,
        binding: { key: "meta" },
        style: {
          background: "#F4F7FF",
          fontSize: 12,
          color: "#475569",
          radius: 22,
        },
      },
      {
        id: "table",
        type: "table",
        x: 40,
        y: 380,
        w: 515,
        h: 230,
        binding: { key: "lineItems" },
        style: { background: "#ffffff", radius: 24 },
      },
      {
        id: "notes",
        type: "multiline",
        x: 40,
        y: 622,
        w: 515,
        h: 102,
        binding: { key: "notes" },
        style: {
          background: "#ffffff",
          fontSize: 12,
          color: "#475569",
          radius: 20,
        },
      },
    ],
    luxury: [
      {
        id: "logo",
        type: "logo",
        x: 40,
        y: 48,
        w: 84,
        h: 84,
        binding: { key: "logo" },
        style: { radius: 24, background: "#1F2937" },
      },
      {
        id: "title",
        type: "text",
        x: 40,
        y: 152,
        w: 180,
        h: 28,
        binding: { key: "headerTitle" },
        style: { fontSize: 14, fontWeight: "700", color: "#C6A35C" },
      },
      {
        id: "invoiceNumber",
        type: "text",
        x: 40,
        y: 182,
        w: 290,
        h: 42,
        binding: { key: "invoiceNumber" },
        style: { fontSize: 34, fontWeight: "800", color: "#FFFFFF" },
      },
      {
        id: "amount",
        type: "amount",
        x: 392,
        y: 74,
        w: 163,
        h: 118,
        binding: { key: "amount" },
        style: { background: "#E8D3A2", color: "#111827", radius: 28 },
      },
      {
        id: "issuer",
        type: "multiline",
        x: 40,
        y: 272,
        w: 220,
        h: 108,
        binding: { key: "issuer" },
        style: { fontSize: 13, fontWeight: "600", color: "#111827" },
      },
      {
        id: "customer",
        type: "multiline",
        x: 310,
        y: 272,
        w: 245,
        h: 108,
        binding: { key: "customer" },
        style: { fontSize: 13, fontWeight: "600", color: "#111827" },
      },
      {
        id: "meta",
        type: "multiline",
        x: 40,
        y: 392,
        w: 515,
        h: 74,
        binding: { key: "meta" },
        style: {
          background: "#F7EFE3",
          fontSize: 12,
          color: "#6B7280",
          radius: 22,
        },
      },
      {
        id: "table",
        type: "table",
        x: 40,
        y: 480,
        w: 515,
        h: 190,
        binding: { key: "lineItems" },
        style: { background: "#FFFDF9", radius: 24 },
      },
      {
        id: "notes",
        type: "multiline",
        x: 40,
        y: 684,
        w: 515,
        h: 64,
        binding: { key: "notes" },
        style: {
          background: "#F7EFE3",
          fontSize: 12,
          color: "#6B7280",
          radius: 20,
        },
      },
    ],
    creative: [
      {
        id: "logo",
        type: "logo",
        x: 40,
        y: 44,
        w: 90,
        h: 90,
        binding: { key: "logo" },
        style: { radius: 28, background: "#ffffff" },
      },
      {
        id: "title",
        type: "text",
        x: 154,
        y: 46,
        w: 180,
        h: 28,
        binding: { key: "headerTitle" },
        style: { fontSize: 16, fontWeight: "700", color: "#F97316" },
      },
      {
        id: "invoiceNumber",
        type: "text",
        x: 154,
        y: 80,
        w: 220,
        h: 42,
        binding: { key: "invoiceNumber" },
        style: { fontSize: 31, fontWeight: "800", color: "#FFFFFF" },
      },
      {
        id: "amount",
        type: "amount",
        x: 390,
        y: 52,
        w: 165,
        h: 96,
        binding: { key: "amount" },
        style: { background: "#FDBA74", color: "#2E1065", radius: 30 },
      },
      {
        id: "issuer",
        type: "multiline",
        x: 40,
        y: 212,
        w: 240,
        h: 110,
        binding: { key: "issuer" },
        style: {
          background: "#FFFFFF",
          fontSize: 13,
          color: "#2E1065",
          radius: 24,
        },
      },
      {
        id: "customer",
        type: "multiline",
        x: 315,
        y: 212,
        w: 240,
        h: 110,
        binding: { key: "customer" },
        style: {
          background: "#FFFFFF",
          fontSize: 13,
          color: "#2E1065",
          radius: 24,
        },
      },
      {
        id: "meta",
        type: "multiline",
        x: 40,
        y: 338,
        w: 515,
        h: 72,
        binding: { key: "meta" },
        style: {
          background: "#FCE7F3",
          fontSize: 12,
          color: "#6D28D9",
          radius: 22,
        },
      },
      {
        id: "table",
        type: "table",
        x: 40,
        y: 428,
        w: 515,
        h: 210,
        binding: { key: "lineItems" },
        style: { background: "#FFFFFF", radius: 26 },
      },
      {
        id: "notes",
        type: "multiline",
        x: 40,
        y: 654,
        w: 515,
        h: 90,
        binding: { key: "notes" },
        style: {
          background: "#FFFFFF",
          fontSize: 12,
          color: "#6D28D9",
          radius: 22,
        },
      },
    ],
    minimal: [
      {
        id: "logo",
        type: "logo",
        x: 40,
        y: 44,
        w: 72,
        h: 72,
        binding: { key: "logo" },
        style: { radius: 20, background: "#F8FAFC" },
      },
      {
        id: "title",
        type: "text",
        x: 132,
        y: 50,
        w: 150,
        h: 22,
        binding: { key: "headerTitle" },
        style: { fontSize: 13, fontWeight: "700", color: "#64748B" },
      },
      {
        id: "invoiceNumber",
        type: "text",
        x: 132,
        y: 78,
        w: 260,
        h: 38,
        binding: { key: "invoiceNumber" },
        style: { fontSize: 32, fontWeight: "800", color: "#0F172A" },
      },
      {
        id: "amount",
        type: "amount",
        x: 402,
        y: 58,
        w: 153,
        h: 82,
        binding: { key: "amount" },
        style: { background: "#F8FAFC", color: "#0F172A", radius: 24 },
      },
      {
        id: "issuer",
        type: "multiline",
        x: 40,
        y: 166,
        w: 220,
        h: 96,
        binding: { key: "issuer" },
        style: { fontSize: 13, color: "#0F172A" },
      },
      {
        id: "customer",
        type: "multiline",
        x: 315,
        y: 166,
        w: 240,
        h: 96,
        binding: { key: "customer" },
        style: { fontSize: 13, color: "#0F172A" },
      },
      {
        id: "meta",
        type: "multiline",
        x: 40,
        y: 280,
        w: 515,
        h: 58,
        binding: { key: "meta" },
        style: {
          background: "#FFFFFF",
          fontSize: 12,
          color: "#64748B",
          radius: 18,
        },
      },
      {
        id: "table",
        type: "table",
        x: 40,
        y: 364,
        w: 515,
        h: 238,
        binding: { key: "lineItems" },
        style: { background: "#FFFFFF", radius: 20 },
      },
      {
        id: "notes",
        type: "multiline",
        x: 40,
        y: 618,
        w: 515,
        h: 102,
        binding: { key: "notes" },
        style: {
          background: "#FFFFFF",
          fontSize: 12,
          color: "#64748B",
          radius: 18,
        },
      },
    ],
  };

  return cloneBlocks(templates[templateId] || templates.corporate);
}

function toMoney(value: string) {
  const number = Number(String(value || "0").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(number)) return "0.00";
  return number.toFixed(2);
}

function detectCurrencyCode(value: string) {
  const text = String(value || "").trim();
  if (!text) return "";
  for (const rule of CURRENCY_DETECTION_RULES) {
    if (rule.pattern.test(text)) return rule.code;
  }
  const upper = text.toUpperCase();
  const matches = upper.match(/[A-Z]{3}/g) || [];
  const detected = matches.find((code) => CURRENCY_OPTION_SET.has(code));
  if (detected) return detected;
  const collapsed = upper.replace(/[^A-Z]/g, "").slice(0, 3);
  return collapsed && CURRENCY_OPTION_SET.has(collapsed) ? collapsed : "";
}

function normalizeCurrency(value: string, fallback = "USD") {
  return detectCurrencyCode(value) || fallback;
}

function sumLineItems(items: LineItem[]) {
  return items
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    .toFixed(2);
}

function calculateDiscountAmount(
  items: LineItem[],
  discountPercentage: string
) {
  return (
    (Number(sumLineItems(items)) * Number(discountPercentage || 0)) /
    100
  ).toFixed(2);
}

function calculateTaxableSubtotal(
  items: LineItem[],
  discountPercentage: string
) {
  return Math.max(
    Number(sumLineItems(items)) -
      Number(calculateDiscountAmount(items, discountPercentage)),
    0
  ).toFixed(2);
}

function calculateTaxAmount(
  items: LineItem[],
  taxPercentage: string,
  discountPercentage: string
) {
  return (
    (Number(calculateTaxableSubtotal(items, discountPercentage)) *
      Number(taxPercentage || 0)) /
    100
  ).toFixed(2);
}

function calculateInvoiceAmount(
  items: LineItem[],
  taxPercentage: string,
  discountPercentage: string
) {
  return (
    Number(calculateTaxableSubtotal(items, discountPercentage)) +
    Number(calculateTaxAmount(items, taxPercentage, discountPercentage))
  ).toFixed(2);
}

function parseTaxPercentageFromText(value: string) {
  const match = String(value || "").match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? toMoney(match[1]) : null;
}

function normalizeLineItem(
  item: Partial<LineItem>,
  fallbackDescription: string
): LineItem {
  const quantity = toMoney(String(item.quantity || "1"));
  const unitPrice = toMoney(String(item.unitPrice || item.amount || "0"));

  return {
    description: String(item.description || fallbackDescription).slice(0, 150),
    quantity,
    unitPrice,
    amount: toMoney(String(Number(quantity) * Number(unitPrice))),
  };
}

function normalizeImportedLineItems(
  rawItems: unknown,
  fallbackItems: LineItem[]
) {
  const items = Array.isArray(rawItems) ? rawItems.slice(0, 12) : [];
  const normalized: LineItem[] = [];
  let subtotal = 0;
  let derivedTaxPercentage: string | null = null;

  items.forEach((item: any, index: number) => {
    const normalizedItem = normalizeLineItem(
      {
        description: String(item?.description || `Line item ${index + 1}`),
        quantity: String(item?.quantity || "1"),
        unitPrice: String(item?.unitPrice || item?.amount || "0"),
        amount: String(item?.amount || item?.unitPrice || "0"),
      },
      `Line item ${index + 1}`
    );
    const description = normalizedItem.description;
    const explicitTaxPercentage = item?.taxPercentage
      ? toMoney(String(item.taxPercentage))
      : parseTaxPercentageFromText(description);
    const isTaxOnlyLine = /\b(?:gst|vat|tax)\b/i.test(description);

    if (isTaxOnlyLine) {
      const derivedFromAmount =
        subtotal > 0 && Number(normalizedItem.amount || 0) > 0
          ? toMoney(
              String((Number(normalizedItem.amount || 0) * 100) / subtotal)
            )
          : null;
      derivedTaxPercentage =
        derivedFromAmount ||
        explicitTaxPercentage ||
        derivedTaxPercentage ||
        "0.00";
      return;
    }

    normalized.push(normalizedItem);
    subtotal += Number(normalizedItem.amount || 0);

    if (
      !derivedTaxPercentage &&
      explicitTaxPercentage &&
      Number(explicitTaxPercentage) > 0
    ) {
      derivedTaxPercentage = explicitTaxPercentage;
    }
  });

  return {
    lineItems: normalized.length ? normalized : fallbackItems,
    taxPercentage: derivedTaxPercentage || "0.00",
  };
}

function normalizeInvoiceState(
  input: Partial<InvoiceState>,
  today: string
): InvoiceState {
  const base = createInitialInvoice(today);
  const rawStyle = input.style || base.style;
  const baseStyle = BASE_STYLES[rawStyle.templateId] || base.style;
  const imported = normalizeImportedLineItems(
    (input as { lineItems?: unknown }).lineItems,
    base.lineItems
  );
  const taxPercentage = toMoney(
    String(
      (input as { taxPercentage?: string }).taxPercentage ||
        imported.taxPercentage ||
        base.taxPercentage
    )
  );
  const discountPercentage = toMoney(
    String(
      (input as { discountPercentage?: string }).discountPercentage ||
        base.discountPercentage
    )
  );
  const lineItems = imported.lineItems;
  const style = {
    ...baseStyle,
    ...rawStyle,
    palette: {
      ...baseStyle.palette,
      ...(rawStyle.palette || {}),
    },
  };

  return {
    ...base,
    ...input,
    currency: normalizeCurrency(
      String(input.currency || base.currency),
      base.currency
    ),
    taxPercentage,
    discountPercentage,
    amount: calculateInvoiceAmount(
      lineItems,
      taxPercentage,
      discountPercentage
    ),
    notes: String(input.notes ?? base.notes),
    paymentTerms: String(input.paymentTerms ?? base.paymentTerms),
    accentLabel: String(input.accentLabel || style.accentLabel),
    lineItems,
    style,
  };
}

function normalizeAiPrompt(value: string) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function mergeStyle(base: StyleTheme, palette?: Partial<StylePalette>) {
  return {
    ...base,
    palette: {
      ...base.palette,
      ...(palette || {}),
    },
  };
}

function createInitialInvoice(today: string): InvoiceState {
  const style = mergeStyle(BASE_STYLES.corporate);
  const lineItems: LineItem[] = [
    {
      description: "Strategy and discovery",
      quantity: "1.00",
      unitPrice: "1200.00",
      amount: "1200.00",
    },
    {
      description: "Visual design system",
      quantity: "1.00",
      unitPrice: "1600.00",
      amount: "1600.00",
    },
    {
      description: "Final delivery and handoff",
      quantity: "1.00",
      unitPrice: "800.00",
      amount: "800.00",
    },
  ];
  const taxPercentage = "0.00";
  const discountPercentage = "0.00";

  return {
    invoiceNumber: `INV-${new Date().getFullYear()}-1001`,
    customerName: "Client name",
    amount: calculateInvoiceAmount(
      lineItems,
      taxPercentage,
      discountPercentage
    ),
    currency: "USD",
    taxPercentage,
    discountPercentage,
    issueDate: today,
    dueDate: today,
    notes:
      "Thank you for your business. This invoice covers strategy, design, and delivery.",
    paymentTerms: "Due on receipt",
    issuerName: "InvoiceProof Studio",
    issuerEmail: "billing@invoiceproof.app",
    issuerAddress: "123 Market Street, San Francisco, CA",
    accentLabel: style.accentLabel,
    lineItems,
    style,
  };
}

function initials(name: string) {
  const parts = String(name || "IP")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return `${parts[0]?.[0] || "I"}${parts[1]?.[0] || parts[0]?.[1] || "P"}`
    .slice(0, 2)
    .toUpperCase();
}

function styleCardCss(style: StyleTheme) {
  return {
    background: `linear-gradient(160deg, ${style.palette.surface}, ${style.palette.surfaceAlt})`,
    color: style.palette.text,
    border: `1px solid ${style.palette.accent}`,
  } as const;
}

function moveBlock(blocks: CanvasBlock[], id: string, dx: number, dy: number) {
  return blocks.map((block) =>
    block.id === id
      ? {
          ...block,
          x: Math.max(8, Math.min(PAGE_WIDTH - block.w - 8, block.x + dx)),
          y: Math.max(
            8,
            Math.min(PAGE_HEIGHT - FOOTER_HEIGHT - block.h - 8, block.y + dy)
          ),
        }
      : block
  );
}

function MiniPreview({
  invoice,
  blocks,
  logoDataUrl,
}: {
  invoice: InvoiceState;
  blocks: CanvasBlock[];
  logoDataUrl: string | null;
}) {
  return (
    <div className="mini-canvas-frame">
      <div className="mini-canvas-scale">
        <InvoiceCanvasPage
          invoice={invoice}
          blocks={blocks}
          logoDataUrl={logoDataUrl}
          selectedBlockId={null}
          onSelectBlock={() => undefined}
          onBlockMouseDown={() => undefined}
          onUpdateInvoice={() => undefined}
          onUpdateLineItem={() => undefined}
          onAddLineItem={() => undefined}
          onDeleteBlock={() => undefined}
          onLogoPick={() => undefined}
          readOnly
        />
      </div>
    </div>
  );
}

function InvoiceCanvasPage(props: {
  invoice: InvoiceState;
  blocks: CanvasBlock[];
  logoDataUrl: string | null;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onBlockMouseDown: (
    event: ReactMouseEvent<HTMLButtonElement>,
    id: string
  ) => void;
  onUpdateInvoice: (patch: Partial<InvoiceState>) => void;
  onUpdateLineItem: (index: number, key: keyof LineItem, value: string) => void;
  onAddLineItem: () => void;
  onDeleteBlock: (id: string) => void;
  onLogoPick: () => void;
  readOnly?: boolean;
}) {
  const {
    invoice,
    blocks,
    logoDataUrl,
    selectedBlockId,
    onSelectBlock,
    onBlockMouseDown,
    onUpdateInvoice,
    onUpdateLineItem,
    onAddLineItem,
    onDeleteBlock,
    onLogoPick,
    readOnly,
  } = props;
  const { style } = invoice;
  const palette = style.palette;
  const orderedBlocks = [...blocks].sort((a, b) => (a.z || 0) - (b.z || 0));

  return (
    <div
      className={`invoice-canvas-page is-${style.templateId}`}
      style={{
        background: palette.surface,
        color: palette.text,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      }}
    >
      <div
        className="invoice-canvas-bg invoice-canvas-bg-luxury"
        style={{
          background:
            style.templateId === "luxury" ? palette.primary : "transparent",
        }}
      />
      <div
        className="invoice-canvas-bg invoice-canvas-bg-creative"
        style={{
          background:
            style.templateId === "creative" ? palette.primary : "transparent",
        }}
      />
      <div
        className="invoice-canvas-bg invoice-canvas-bg-creative-accent"
        style={{
          background:
            style.templateId === "creative" ? palette.accent : "transparent",
        }}
      />
      <div
        className="invoice-canvas-bg invoice-canvas-bg-corporate"
        style={{
          background:
            style.templateId === "corporate"
              ? palette.surfaceAlt
              : "transparent",
        }}
      />
      <div
        className="invoice-canvas-line"
        style={{
          borderColor:
            style.templateId === "minimal" ? palette.secondary : "transparent",
        }}
      />

      {orderedBlocks.map((block) => {
        const isSelected = selectedBlockId === block.id;
        const background = block.style?.background || "transparent";
        return (
          <div
            key={block.id}
            className={`canvas-block canvas-block-${block.type} ${
              isSelected ? "is-selected" : ""
            }`}
            style={{
              left: block.x,
              top: block.y,
              width: block.w,
              height: block.h,
              color: block.style?.color || palette.text,
              background,
              borderRadius: block.style?.radius || 18,
              boxShadow: isSelected
                ? `0 0 0 2px ${palette.primary}`
                : undefined,
            }}
            onMouseDown={() => onSelectBlock(block.id)}
          >
            {!readOnly ? (
              <>
                <button
                  type="button"
                  className="canvas-drag-handle"
                  onMouseDown={(event) => onBlockMouseDown(event, block.id)}
                  aria-label={`Move ${block.id}`}
                >
                  ⋮⋮
                </button>
                <button
                  type="button"
                  className="canvas-delete-handle"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteBlock(block.id);
                  }}
                  aria-label={`Delete ${block.id}`}
                >
                  ×
                </button>
              </>
            ) : null}

            {block.type === "logo" ? (
              <button
                type="button"
                className={`canvas-logo-inner ${
                  readOnly ? "is-readonly" : "is-uploadable"
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!readOnly) onLogoPick();
                }}
              >
                {logoDataUrl ? (
                  <img
                    src={logoDataUrl}
                    alt="Logo"
                    className="canvas-logo-image"
                  />
                ) : (
                  <div className="canvas-logo-placeholder">
                    <span className="canvas-logo-placeholder-badge">
                      {initials(invoice.issuerName)}
                    </span>
                    <span className="canvas-logo-placeholder-copy">
                      Click to upload logo
                    </span>
                  </div>
                )}
              </button>
            ) : null}

            {block.binding?.key === "headerTitle" ? (
              <input
                className="canvas-inline-input canvas-inline-title"
                value={invoice.style.headerTitle}
                onChange={(event) =>
                  onUpdateInvoice({
                    style: {
                      ...invoice.style,
                      headerTitle: event.target.value,
                    },
                  })
                }
                readOnly={readOnly}
              />
            ) : null}

            {block.binding?.key === "invoiceNumber" ? (
              <input
                className="canvas-inline-input canvas-inline-number"
                value={invoice.invoiceNumber}
                onChange={(event) =>
                  onUpdateInvoice({ invoiceNumber: event.target.value })
                }
                readOnly={readOnly}
              />
            ) : null}

            {block.type === "amount" ? (
              <div className="canvas-amount-shell">
                <span className="canvas-kicker">Amount due</span>
                <div className="canvas-amount-row">
                  <input
                    className="canvas-inline-currency"
                    list="invoice-currency-list"
                    value={invoice.currency}
                    onChange={(event) =>
                      onUpdateInvoice({
                        currency: normalizeCurrency(
                          event.target.value,
                          invoice.currency
                        ),
                      })
                    }
                    readOnly={readOnly}
                  />
                  <input
                    className="canvas-inline-amount is-readonly"
                    value={invoice.amount}
                    onChange={(event) =>
                      onUpdateInvoice({ amount: event.target.value })
                    }
                    readOnly
                  />
                </div>
                <span className="canvas-subtle-copy">
                  {invoice.style.trustBadge}
                </span>
              </div>
            ) : null}

            {block.binding?.key === "issuer" ? (
              <div className="canvas-multiline-card">
                <span className="canvas-kicker">From</span>
                <input
                  className="canvas-inline-input"
                  value={invoice.issuerName}
                  onChange={(event) =>
                    onUpdateInvoice({ issuerName: event.target.value })
                  }
                  readOnly={readOnly}
                />
                <input
                  className="canvas-inline-input"
                  value={invoice.issuerEmail}
                  onChange={(event) =>
                    onUpdateInvoice({ issuerEmail: event.target.value })
                  }
                  readOnly={readOnly}
                />
                <textarea
                  className="canvas-inline-textarea"
                  value={invoice.issuerAddress}
                  onChange={(event) =>
                    onUpdateInvoice({ issuerAddress: event.target.value })
                  }
                  readOnly={readOnly}
                />
              </div>
            ) : null}

            {block.binding?.key === "customer" ? (
              <div className="canvas-multiline-card">
                <span className="canvas-kicker">Bill to</span>
                <input
                  className="canvas-inline-input"
                  value={invoice.customerName}
                  onChange={(event) =>
                    onUpdateInvoice({ customerName: event.target.value })
                  }
                  readOnly={readOnly}
                />
                <div className="canvas-dual-row">
                  <input
                    type="date"
                    className="canvas-inline-input"
                    value={invoice.issueDate}
                    onChange={(event) =>
                      onUpdateInvoice({ issueDate: event.target.value })
                    }
                    readOnly={readOnly}
                  />
                  <input
                    type="date"
                    className="canvas-inline-input"
                    value={invoice.dueDate}
                    onChange={(event) =>
                      onUpdateInvoice({ dueDate: event.target.value })
                    }
                    readOnly={readOnly}
                  />
                </div>
              </div>
            ) : null}

            {block.binding?.key === "meta" ? (
              <div className="canvas-meta-grid">
                <div>
                  <span className="canvas-kicker">Label</span>
                  <input
                    className="canvas-inline-input"
                    value={invoice.accentLabel}
                    onChange={(event) =>
                      onUpdateInvoice({ accentLabel: event.target.value })
                    }
                    readOnly={readOnly}
                  />
                </div>
                <div>
                  <span className="canvas-kicker">Terms</span>
                  <input
                    className="canvas-inline-input"
                    value={invoice.paymentTerms}
                    onChange={(event) =>
                      onUpdateInvoice({ paymentTerms: event.target.value })
                    }
                    readOnly={readOnly}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <span className="canvas-kicker">Hero copy</span>
                  <input
                    className="canvas-inline-input"
                    value={invoice.style.heroCopy}
                    onChange={(event) =>
                      onUpdateInvoice({
                        style: {
                          ...invoice.style,
                          heroCopy: event.target.value,
                        },
                      })
                    }
                    readOnly={readOnly}
                  />
                </div>
              </div>
            ) : null}

            {block.type === "table" ? (
              <div className="canvas-table-shell">
                <div
                  className="canvas-table-head"
                  style={{
                    background:
                      style.templateId === "minimal"
                        ? palette.surfaceAlt
                        : palette.primary,
                    color:
                      style.templateId === "minimal" ? palette.text : "#fff",
                  }}
                >
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Unit</span>
                  <span>Currency</span>
                  <span>Amount</span>
                </div>
                <div className="canvas-table-body">
                  {invoice.lineItems.map((item, index) => (
                    <div
                      key={`${index}-${item.description}`}
                      className="canvas-table-row"
                    >
                      <input
                        className="canvas-inline-input is-readonly"
                        value={item.description}
                        onChange={(event) =>
                          onUpdateLineItem(
                            index,
                            "description",
                            event.target.value
                          )
                        }
                        readOnly
                      />
                      <input
                        className="canvas-inline-input"
                        value={item.quantity}
                        onChange={(event) =>
                          onUpdateLineItem(
                            index,
                            "quantity",
                            event.target.value
                          )
                        }
                        readOnly={readOnly}
                      />
                      <input
                        className="canvas-inline-input"
                        value={item.unitPrice}
                        onChange={(event) =>
                          onUpdateLineItem(
                            index,
                            "unitPrice",
                            event.target.value
                          )
                        }
                        readOnly={readOnly}
                      />
                      <input
                        className="canvas-inline-input is-readonly canvas-table-currency"
                        value={invoice.currency}
                        readOnly
                      />
                      <input
                        className="canvas-inline-input is-readonly"
                        value={item.amount}
                        onChange={(event) =>
                          onUpdateLineItem(index, "amount", event.target.value)
                        }
                        readOnly
                      />
                    </div>
                  ))}
                </div>
                {!readOnly ? (
                  <button
                    type="button"
                    className="canvas-table-add"
                    onClick={onAddLineItem}
                  >
                    + Add item
                  </button>
                ) : null}
                <div className="canvas-table-summary">
                  <div>
                    <span>Total amount</span>
                    <strong className="canvas-table-summary-value">
                      {invoice.currency} {sumLineItems(invoice.lineItems)}
                    </strong>
                  </div>
                  <div>
                    <span className="canvas-tax-summary-label">
                      Discount (
                      <input
                        className="canvas-inline-input canvas-inline-tax-rate"
                        value={invoice.discountPercentage}
                        onChange={(event) =>
                          onUpdateInvoice({
                            discountPercentage: event.target.value,
                          })
                        }
                        readOnly={readOnly}
                        aria-label="Discount percentage"
                      />
                      %)
                    </span>
                    <strong className="canvas-table-summary-value">
                      - {invoice.currency}{" "}
                      {calculateDiscountAmount(
                        invoice.lineItems,
                        invoice.discountPercentage
                      )}
                    </strong>
                  </div>
                  <div>
                    <span className="canvas-tax-summary-label">
                      GST / Tax / VAT (
                      <input
                        className="canvas-inline-input canvas-inline-tax-rate"
                        value={invoice.taxPercentage}
                        onChange={(event) =>
                          onUpdateInvoice({ taxPercentage: event.target.value })
                        }
                        readOnly={readOnly}
                        aria-label="GST, tax, or VAT percentage"
                      />
                      %)
                    </span>
                    <strong className="canvas-table-summary-value">
                      {invoice.currency}{" "}
                      {calculateTaxAmount(
                        invoice.lineItems,
                        invoice.taxPercentage,
                        invoice.discountPercentage
                      )}
                    </strong>
                  </div>
                  <div className="is-grand">
                    <span>Grand total</span>
                    <strong className="canvas-table-summary-value">
                      {invoice.currency} {invoice.amount}
                    </strong>
                  </div>
                </div>
              </div>
            ) : null}

            {block.binding?.key === "notes" ? (
              <div className="canvas-notes-shell">
                <div className="canvas-notes-head">
                  <span className="canvas-kicker">Notes</span>
                  {!readOnly && invoice.notes ? (
                    <button
                      type="button"
                      className="canvas-mini-action"
                      onClick={() => onUpdateInvoice({ notes: "" })}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <textarea
                  className="canvas-inline-textarea canvas-inline-notes"
                  value={invoice.notes}
                  onChange={(event) =>
                    onUpdateInvoice({ notes: event.target.value })
                  }
                  readOnly={readOnly}
                  placeholder="Add optional payment notes or leave blank."
                />
              </div>
            ) : null}
          </div>
        );
      })}

      <div
        className="invoice-footer-preview"
        style={{
          background:
            invoice.style.templateId === "luxury"
              ? palette.primary
              : palette.surfaceAlt,
          color: invoice.style.templateId === "luxury" ? "#fff" : palette.text,
        }}
      >
        <div className="invoice-footer-copy">
          <strong>InvoiceProof</strong>
          <span>
            QR, brand, and verification link appear on every final page.
          </span>
          <span className="invoice-footer-link">/verify/&lt;public-id&gt;</span>
        </div>
        <div className="invoice-footer-qr">QR</div>
      </div>
    </div>
  );
}

export function NewInvoiceForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [invoice, setInvoice] = useState<InvoiceState>(() =>
    createInitialInvoice(today)
  );
  const [blocks, setBlocks] = useState<CanvasBlock[]>(() =>
    defaultBlocks("corporate")
  );
  const [drafts, setDrafts] = useState<InvoiceDraftOption[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<string>("corporate");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    "invoiceNumber"
  );
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState<LoadingState>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPromptSummary, setAiPromptSummary] = useState("");
  const [aiMissingFields, setAiMissingFields] = useState<string[]>([]);
  const dragRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const canvasStageRef = useRef<HTMLElement | null>(null);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const hasAiDraft = Boolean(aiPrompt.trim() || aiPromptSummary.trim());

  useEffect(() => {
    const transferred = loadPendingInvoiceDraft();
    if (!transferred) return;

    clearPendingInvoiceDraft();

    if (transferred.type === "ai-canvas") {
      const data = transferred.payload as AiCanvasDraftResult & {
        prompt?: string;
      };
      if (data.invoice) setInvoice(normalizeInvoiceState(data.invoice, today));
      if (Array.isArray(data.blocks) && data.blocks.length)
        setBlocks(cloneBlocks(data.blocks));
      setAiPrompt(typeof data.prompt === "string" ? data.prompt : "");
      setAiPromptSummary(
        String(data?.promptSummary || "AI created an editable invoice draft.")
      );
      setAiMissingFields(
        Array.isArray(data?.missingFields) ? data.missingFields.slice(0, 6) : []
      );
      setSelectedDraft(
        String(
          data?.templateId || data?.invoice?.style?.templateId || "corporate"
        )
      );
      setSelectedBlockId("invoiceNumber");
      window.requestAnimationFrame(() => {
        canvasStageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
      showToast({
        tone: "success",
        title: "AI invoice ready",
        description: "Your extracted invoice has been loaded into the canvas.",
      });
      return;
    }

    if (transferred.type === "pdf-detect") {
      const payload = transferred.payload as {
        fileName?: string;
        detected?: any;
      };
      const detected = payload?.detected || {};
      const base = createInitialInvoice(today);
      const imported = normalizeImportedLineItems(
        detected.lineItems,
        base.lineItems
      );
      const taxPercentage = toMoney(
        String(detected.taxPercentage || imported.taxPercentage || "0")
      );
      const discountPercentage = toMoney(
        String(detected.discountPercentage || "0")
      );
      const lineItems = imported.lineItems;
      const nextInvoice: InvoiceState = {
        ...base,
        invoiceNumber: String(detected.invoiceNumber || base.invoiceNumber),
        customerName: String(detected.customerName || base.customerName),
        amount: calculateInvoiceAmount(
          lineItems,
          taxPercentage,
          discountPercentage
        ),
        currency: normalizeCurrency(
          String(detected.currency || base.currency),
          base.currency
        ),
        taxPercentage,
        discountPercentage,
        issueDate: String(detected.issueDate || base.issueDate),
        dueDate: String(detected.dueDate || detected.issueDate || base.dueDate),
        notes: String(detected.notes || base.notes),
        paymentTerms: String(detected.paymentTerms || base.paymentTerms),
        issuerName: String(detected.issuerName || base.issuerName),
        issuerEmail: String(detected.issuerEmail || base.issuerEmail),
        issuerAddress: String(detected.issuerAddress || base.issuerAddress),
        lineItems,
        style: mergeStyle(BASE_STYLES.corporate),
        accentLabel: BASE_STYLES.corporate.accentLabel,
      };
      setInvoice(normalizeInvoiceState(nextInvoice, today));
      setBlocks(defaultBlocks("corporate"));
      setSelectedDraft("corporate");
      setSelectedBlockId("invoiceNumber");
      setAiPromptSummary(
        String(
          detected.extractionSummary ||
            `Extracted invoice data from ${payload.fileName || "uploaded PDF"}.`
        )
      );
      setAiMissingFields(
        detected.needsReview
          ? ["invoice number", "customer", "amount", "dates"].slice(0, 4)
          : []
      );
      window.requestAnimationFrame(() => {
        canvasStageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
      showToast({
        tone: "success",
        title: "PDF data loaded",
        description:
          "Review the extracted fields, then finalize the canvas PDF.",
      });
    }
  }, [showToast, today]);

  useEffect(() => {
    function onMove(event: MouseEvent) {
      if (!dragRef.current) return;
      const dx = event.clientX - dragRef.current.x;
      const dy = event.clientY - dragRef.current.y;
      dragRef.current = {
        ...dragRef.current,
        x: event.clientX,
        y: event.clientY,
      };
      setBlocks((current) => moveBlock(current, dragRef.current!.id, dx, dy));
    }

    function onUp() {
      dragRef.current = null;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    if (!aiModalOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAiModalOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aiModalOpen]);

  useEffect(() => {
    if (!selectedBlockId) return;

    function onDeleteKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName || "";
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(tagName) ||
        target?.isContentEditable
      )
        return;
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      event.preventDefault();
      deleteBlock(selectedBlockId);
    }

    window.addEventListener("keydown", onDeleteKey);
    return () => window.removeEventListener("keydown", onDeleteKey);
  }, [selectedBlockId, blocks]);

  useEffect(() => {
    function updateCanvasScale() {
      const viewportWidth =
        canvasViewportRef.current?.clientWidth || PAGE_WIDTH;
      const nextScale = Math.max(
        0.82,
        Math.min(1.82, (viewportWidth - 24) / PAGE_WIDTH)
      );
      setCanvasScale(Number.isFinite(nextScale) ? nextScale : 1);
    }

    updateCanvasScale();

    const observer =
      typeof ResizeObserver !== "undefined" && canvasViewportRef.current
        ? new ResizeObserver(() => updateCanvasScale())
        : null;

    if (observer && canvasViewportRef.current) {
      observer.observe(canvasViewportRef.current);
    }

    window.addEventListener("resize", updateCanvasScale);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateCanvasScale);
    };
  }, []);

  function updateInvoice(patch: Partial<InvoiceState>) {
    setInvoice((current) => {
      const next = { ...current, ...patch };
      if (patch.currency !== undefined) {
        next.currency = normalizeCurrency(
          String(patch.currency || current.currency),
          current.currency
        );
      }
      if (patch.taxPercentage !== undefined) {
        next.taxPercentage = toMoney(String(patch.taxPercentage || "0"));
      }
      if (patch.discountPercentage !== undefined) {
        next.discountPercentage = toMoney(
          String(patch.discountPercentage || "0")
        );
      }
      if (
        patch.taxPercentage !== undefined ||
        patch.discountPercentage !== undefined
      ) {
        next.amount = calculateInvoiceAmount(
          next.lineItems,
          next.taxPercentage,
          next.discountPercentage
        );
      }
      return next;
    });
  }

  function deleteBlock(id: string) {
    setBlocks((current) => {
      const next = current.filter((block) => block.id !== id);
      setSelectedBlockId(next[0]?.id || null);
      return next;
    });
  }

  function updateLineItem(index: number, key: keyof LineItem, value: string) {
    setInvoice((current) => {
      const lineItems = current.lineItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, [key]: value };
        if (key === "quantity" || key === "unitPrice") {
          next.amount = toMoney(
            String(Number(next.quantity || 0) * Number(next.unitPrice || 0))
          );
        }
        return next;
      });
      return {
        ...current,
        lineItems,
        amount: calculateInvoiceAmount(
          lineItems,
          current.taxPercentage,
          current.discountPercentage
        ),
      };
    });
  }

  function addLineItem() {
    setInvoice((current) => {
      const lineItems = [
        ...current.lineItems,
        {
          description: "New item",
          quantity: "1.00",
          unitPrice: "0.00",
          amount: "0.00",
        },
      ];
      return {
        ...current,
        lineItems,
        amount: calculateInvoiceAmount(
          lineItems,
          current.taxPercentage,
          current.discountPercentage
        ),
      };
    });
  }

  function openLogoPicker() {
    logoInputRef.current?.click();
  }

  async function onLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      const message = "Please upload a PNG, JPG, or WebP logo.";
      setError(message);
      showToast({
        tone: "error",
        title: "Invalid logo type",
        description: message,
      });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      const message = "Logo must be 4 MB or smaller.";
      setError(message);
      showToast({
        tone: "error",
        title: "Logo too large",
        description: message,
      });
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setLogoDataUrl(dataUrl);
      setLogoName(file.name);
      showToast({
        tone: "success",
        title: "Logo ready",
        description:
          "Your logo will be rendered on the invoice canvas and final PDF.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load logo.";
      setError(message);
      showToast({ tone: "error", title: "Logo failed", description: message });
    }
  }

  function onAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      setAttachments([]);
      return;
    }

    if (files.length > MAX_ATTACHMENTS) {
      const message = `Attach up to ${MAX_ATTACHMENTS} PDFs at a time.`;
      setError(message);
      showToast({
        tone: "error",
        title: "Too many attachments",
        description: message,
      });
      event.target.value = "";
      return;
    }

    const invalidType = files.find(
      (file) =>
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    );
    if (invalidType) {
      const message = "All attachments must be PDF files.";
      setError(message);
      showToast({
        tone: "error",
        title: "Invalid attachment",
        description: message,
      });
      event.target.value = "";
      return;
    }

    const oversized = files.find(
      (file) => file.size > MAX_ATTACHMENT_SIZE_BYTES
    );
    if (oversized) {
      const message = `${oversized.name} is larger than 12 MB.`;
      setError(message);
      showToast({
        tone: "error",
        title: "Attachment too large",
        description: message,
      });
      event.target.value = "";
      return;
    }

    setAttachments(files);
    setError(null);
  }

  function updatePalette(key: keyof StylePalette, value: string) {
    setInvoice((current) => ({
      ...current,
      style: {
        ...current.style,
        palette: {
          ...current.style.palette,
          [key]: value,
        },
      },
    }));
  }

  function openAiModal() {
    setError(null);
    setAiModalOpen(true);
  }

  function handleAiPromptKeyDown(
    event: ReactKeyboardEvent<HTMLTextAreaElement>
  ) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void generateAiCanvasFromPrompt(aiPrompt);
    }
  }

  function clearAiDraft() {
    setAiPrompt("");
    setAiPromptSummary("");
    setAiMissingFields([]);
  }

  function applyDraft(option: InvoiceDraftOption) {
    setSelectedDraft(option.templateId);
    setInvoice((current) => ({
      ...current,
      style: option.style,
      accentLabel: option.style.accentLabel,
    }));
    setBlocks(cloneBlocks(option.blocks));
  }

  async function generateAiCanvasFromPrompt(rawPrompt = aiPrompt) {
    if (loading) return;

    const prompt = normalizeAiPrompt(rawPrompt);
    if (prompt.length < 12) {
      showToast({
        tone: "error",
        title: "Add a bit more detail",
        description:
          "Include who the invoice is for, what the work was, and the amount if you know it.",
      });
      return;
    }

    setAiModalOpen(false);
    setLoading("ai-draft");
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/invoices/ai-canvas-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(
          json?.error?.message || "Could not create the AI invoice draft."
        );
      }

      const data = json.data as AiCanvasDraftResult;
      setAiPrompt(prompt);
      setAiPromptSummary(
        String(data?.promptSummary || "AI created an editable invoice draft.")
      );
      setAiMissingFields(
        Array.isArray(data?.missingFields) ? data.missingFields.slice(0, 6) : []
      );
      setInvoice(normalizeInvoiceState(data.invoice, today));
      setBlocks(cloneBlocks(data.blocks));
      setSelectedDraft(data.templateId);
      setSelectedBlockId("invoiceNumber");
      window.requestAnimationFrame(() => {
        canvasStageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
      showToast({
        tone: "success",
        title: "AI invoice ready",
        description:
          "Your first editable canvas is ready. Review anything highlighted, then finalize.",
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not create the AI invoice draft.";
      setError(message);
      showToast({
        tone: "error",
        title: "AI draft failed",
        description: message,
      });
    } finally {
      setLoading(null);
    }
  }

  async function generateDesigns() {
    if (loading) return;
    setLoading("ai");
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/invoices/canvas-drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoice,
          amount: toMoney(invoice.amount),
          palette: invoice.style.palette,
          selectedTemplateId: invoice.style.templateId,
          styleDirection: invoice.style.tone,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(
          json?.error?.message || "Could not generate canvas designs."
        );
      }
      const options = Array.isArray(json?.data?.options)
        ? json.data.options
        : [];
      setDrafts(options);
      if (options[0]) applyDraft(options[0]);
      showToast({
        tone: "success",
        title: "4 premium options ready",
        description: "Pick one and keep editing directly on the page.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not generate designs.";
      setError(message);
      showToast({
        tone: "error",
        title: "Design generation failed",
        description: message,
      });
    } finally {
      setLoading(null);
    }
  }

  async function finalizeCanvas() {
    if (loading) return;
    let navigating = false;
    setLoading("finalize");
    setError(null);
    try {
      const formData = new FormData();
      formData.append(
        "invoice",
        JSON.stringify({
          ...invoice,
          amount: toMoney(invoice.amount),
          lineItems: invoice.lineItems.map((item) => ({
            ...item,
            quantity: toMoney(item.quantity),
            unitPrice: toMoney(item.unitPrice),
            amount: toMoney(item.amount),
          })),
          selectedTemplateId: invoice.style.templateId,
          style: invoice.style,
          palette: invoice.style.palette,
          canvasBlocks: blocks,
          logoDataUrl,
          attachmentNames: attachments.map((file) => file.name),
        })
      );
      attachments.forEach((file) => formData.append("attachments", file));

      const response = await fetch(`${API_BASE}/invoices/finalize-canvas`, {
        method: "POST",
        body: formData,
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(
          json?.error?.message || "Could not finalize canvas invoice."
        );
      }
      showToast({
        tone: "success",
        title: "Canvas invoice finalized",
        description: "Sealed PDF created with footer on every page.",
      });
      navigating = true;
      router.push(`/invoices/${json.data.id}`);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not finalize invoice.";
      setError(message);
      showToast({
        tone: "error",
        title: "Finalize failed",
        description: message,
      });
    } finally {
      if (!navigating) {
        setLoading(null);
      }
    }
  }

  function onBlockMouseDown(
    event: ReactMouseEvent<HTMLButtonElement>,
    id: string
  ) {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = { id, x: event.clientX, y: event.clientY };
    setSelectedBlockId(id);
  }

  const overlayTitle =
    loading === "ai-draft"
      ? "Building your invoice with AI"
      : loading === "ai"
      ? "Generating premium layouts"
      : loading === "finalize"
      ? "Processing sealed PDF"
      : "";
  const overlayCopy =
    loading === "ai-draft"
      ? "Reading your messy notes, extracting the billing details, and placing everything onto one editable canvas."
      : loading === "ai"
      ? "Building four premium design systems from your data and palette."
      : loading === "finalize"
      ? "Please wait while we render your invoice, append attachments, and open the next page automatically."
      : "";

  return (
    <>
      {aiModalOpen ? (
        <div
          className="ai-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-modal-title"
        >
          <div className="ai-modal-card">
            <div className="ai-modal-head">
              <div className="page-stack" style={{ gap: 6 }}>
                <span className="mini-chip is-accent">V1</span>
                <h3 id="ai-modal-title" style={{ margin: 0 }}>
                  Generate invoice with AI
                </h3>
                <p className="muted" style={{ margin: 0 }}>
                  Describe the job, paste messy notes, or drop in copied email
                  text. AI will extract the core invoice fields and load one
                  editable canvas.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary ai-modal-close"
                onClick={() => setAiModalOpen(false)}
              >
                Close
              </button>
            </div>

            <label className="field-group">
              <span className="field-label">Prompt or messy notes</span>
              <textarea
                className="input-shell ai-modal-textarea"
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                onKeyDown={handleAiPromptKeyDown}
                placeholder="Example: Invoice Acme Corp for a landing page redesign, 3 weeks of work, $4,500 USD, due next Friday, add 18% GST, mention payment by bank transfer."
                maxLength={4000}
                autoFocus
              />
            </label>

            <div className="ai-modal-tips">
              <span className="mini-chip">Paste WhatsApp or email text</span>
              <span className="mini-chip">
                Mention VAT / GST / tax if known
              </span>
              <span className="mini-chip">Ctrl/Cmd + Enter to generate</span>
            </div>

            <div className="ai-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAiModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => generateAiCanvasFromPrompt(aiPrompt)}
                disabled={normalizeAiPrompt(aiPrompt).length < 12}
              >
                Generate canvas
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <datalist id="invoice-currency-list">
        {CURRENCY_OPTIONS.map((currencyCode) => (
          <option key={currencyCode} value={currencyCode} />
        ))}
      </datalist>
      {loading ? (
        <div className="submit-overlay" aria-live="polite" aria-busy="true">
          <div className="submit-overlay-card">
            <div className="submit-overlay-inner">
              <Spinner size="xl" tone="brand" />
              <h3>{overlayTitle}</h3>
              <p>{overlayCopy}</p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="invoice-builder-stack">
        <input
          ref={logoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onLogoChange}
          style={{ display: "none" }}
        />
        {error ? <div className="error-banner">{error}</div> : null}

        <section
          className="invoice-panel-card canvas-primary-card"
          ref={canvasStageRef}
        >
          <div className="canvas-workspace">
            <div
              ref={canvasViewportRef}
              className="invoice-canvas-scroll canvas-primary-scroll"
            >
              <div
                className="invoice-canvas-stage"
                style={{ height: `${PAGE_HEIGHT * canvasScale}px` }}
              >
                <div
                  className="invoice-canvas-stage-scale"
                  style={{ transform: `scale(${canvasScale})` }}
                >
                  <InvoiceCanvasPage
                    invoice={invoice}
                    blocks={blocks}
                    logoDataUrl={logoDataUrl}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={setSelectedBlockId}
                    onBlockMouseDown={onBlockMouseDown}
                    onUpdateInvoice={updateInvoice}
                    onUpdateLineItem={updateLineItem}
                    onAddLineItem={addLineItem}
                    onDeleteBlock={deleteBlock}
                    onLogoPick={openLogoPicker}
                  />
                </div>
              </div>
            </div>

            <aside className="canvas-side-tools">
              <section className="invoice-panel-card palette-mini-card">
                <div className="invoice-panel-head">
                  <h2>Palette</h2>
                </div>
                <div className="palette-mini-grid">
                  {(
                    Object.keys(invoice.style.palette) as Array<
                      keyof StylePalette
                    >
                  ).map((key) => (
                    <label key={key} className="palette-swatch" title={key}>
                      <input
                        className="palette-swatch-input"
                        type="color"
                        value={invoice.style.palette[key]}
                        onChange={(event) =>
                          updatePalette(key, event.target.value)
                        }
                        aria-label={`Change ${key} color`}
                      />
                      <span
                        className="palette-swatch-dot"
                        style={{ background: invoice.style.palette[key] }}
                      />
                      <span className="palette-swatch-label">
                        {key === "surfaceAlt" ? "alt" : key.slice(0, 3)}
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>

        <div className="builder-bottom-grid">
          <section className="invoice-panel-card builder-span-2 prompt-compact-card">
            <div className="prompt-compact-shell">
              <textarea
                className="input-shell ai-brief-textarea prompt-compact-textarea"
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                onKeyDown={handleAiPromptKeyDown}
                placeholder="Paste prompt, brief, or messy notes here."
                maxLength={4000}
              />
              <div className="quick-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => generateAiCanvasFromPrompt(aiPrompt)}
                >
                  Generate with AI
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={clearAiDraft}
                >
                  Clear prompt
                </button>
              </div>
            </div>
          </section>

          <section className="invoice-panel-card builder-span-2">
            <div className="invoice-panel-head">
              <h2>Attachments</h2>
              <span className="mini-chip">PDF only</span>
            </div>
            <label className="upload-shell" style={{ minHeight: 0 }}>
              <span className="upload-title">
                Upload additional attachments
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                multiple
                onChange={onAttachmentChange}
              />
              <span className="file-pill">
                {attachments.length
                  ? `${attachments.length} PDF${
                      attachments.length > 1 ? "s" : ""
                    }`
                  : "Optional extra PDFs"}
              </span>
            </label>
            {logoName ? (
              <span className="mini-chip">Logo: {logoName}</span>
            ) : null}
            {attachments.length ? (
              <div className="attachment-list">
                {attachments.map((file) => (
                  <span key={`${file.name}-${file.size}`} className="mini-chip">
                    {file.name}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="quick-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={openAiModal}
              >
                Update with AI
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setBlocks(defaultBlocks(invoice.style.templateId))
                }
              >
                Reset layout
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={finalizeCanvas}
              >
                Finalize canvas PDF
              </button>
            </div>
          </section>
        </div>
      </div>{" "}
      <style jsx global>{`
        .ai-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.44);
          backdrop-filter: blur(10px);
        }
        .ai-modal-card {
          width: min(720px, 100%);
          border-radius: 30px;
          padding: 24px;
          display: grid;
          gap: 18px;
          border: 1px solid rgba(101, 79, 230, 0.14);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.98),
            rgba(247, 245, 255, 0.96)
          );
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.24);
        }
        .ai-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .ai-modal-close {
          white-space: nowrap;
        }
        .ai-modal-textarea,
        .ai-brief-textarea {
          min-height: 140px;
          resize: vertical;
          line-height: 1.55;
        }
        .ai-brief-card {
          position: relative;
          overflow: hidden;
        }
        .ai-brief-card::after {
          content: "";
          position: absolute;
          inset: auto -30px -30px auto;
          width: 180px;
          height: 180px;
          border-radius: 999px;
          background: radial-gradient(
            circle,
            rgba(91, 140, 255, 0.18),
            rgba(91, 140, 255, 0)
          );
          pointer-events: none;
        }
        .ai-empty-state {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ai-modal-tips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ai-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ai-missing-chip {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.24);
          color: #9a6700;
        }
        .canvas-logo-placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          gap: 6px;
          text-align: center;
          background: repeating-linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.94),
            rgba(255, 255, 255, 0.94) 10px,
            rgba(241, 245, 249, 0.94) 10px,
            rgba(241, 245, 249, 0.94) 20px
          );
          color: #0f172a;
        }
        .canvas-logo-placeholder-badge {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(15, 23, 42, 0.9);
          color: #fff;
          font-weight: 900;
        }
        .canvas-logo-placeholder-copy {
          font-size: 0.76rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.72;
        }
        .invoice-builder-stack {
          display: grid;
          gap: 18px;
        }
        .canvas-primary-card {
          gap: 0;
          padding: 12px;
        }
        .builder-bottom-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          align-items: start;
        }
        .builder-span-2 {
          grid-column: 1 / -1;
        }
        .canvas-workspace {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 104px;
          gap: 10px;
          align-items: start;
        }
        .canvas-side-tools {
          display: grid;
          gap: 12px;
          align-self: stretch;
        }
        .palette-mini-card {
          padding: 10px 8px;
          gap: 8px;
          position: sticky;
          top: 96px;
        }
        .palette-mini-grid {
          display: grid;
          justify-items: center;
          gap: 8px;
        }
        .palette-swatch {
          position: relative;
          width: 56px;
          display: grid;
          justify-items: center;
          gap: 4px;
          padding: 6px 4px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(15, 23, 42, 0.06);
          cursor: pointer;
        }
        .palette-swatch-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }
        .palette-swatch-dot {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08),
            0 10px 20px rgba(15, 23, 42, 0.12);
        }
        .palette-swatch-label {
          font-size: 0.54rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted-strong);
        }
        .prompt-compact-card {
          padding: 14px 18px;
          display: grid;
          justify-items: center;
        }
        .prompt-compact-shell {
          width: min(640px, 100%);
          display: grid;
          gap: 12px;
          justify-items: center;
          margin: 0 auto;
        }
        .prompt-compact-textarea {
          min-height: 90px;
          max-height: 140px;
        }
        .invoice-panel-card {
          border-radius: 28px;
          border: 1px solid rgba(101, 79, 230, 0.1);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.97),
            rgba(248, 246, 255, 0.95)
          );
          box-shadow: var(--shadow-soft);
          padding: 18px;
          display: grid;
          gap: 14px;
        }
        .invoice-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .invoice-panel-head h2 {
          margin: 0;
          font-size: 0.9rem;
          letter-spacing: -0.03em;
        }
        .attachment-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .canvas-primary-scroll {
          min-width: 0;
        }
        .invoice-canvas-scroll {
          overflow: hidden;
          padding: 12px;
          border-radius: 34px;
          border: 1px solid rgba(101, 79, 230, 0.1);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.94),
            rgba(242, 241, 255, 0.82)
          );
          box-shadow: var(--shadow);
        }
        .invoice-canvas-stage {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow: hidden;
        }
        .invoice-canvas-stage-scale {
          transform-origin: top center;
          will-change: transform;
        }
        .invoice-canvas-page {
          position: relative;
          margin: 0 auto;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 30px 70px rgba(66, 74, 130, 0.18);
        }
        .invoice-canvas-bg,
        .invoice-canvas-line {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .invoice-canvas-bg-luxury {
          inset: 0 0 auto 0;
          height: 250px;
        }
        .invoice-canvas-bg-creative {
          inset: 0 0 auto 0;
          height: 220px;
        }
        .invoice-canvas-bg-creative-accent {
          inset: 0 0 auto auto;
          width: 160px;
          height: 220px;
          opacity: 0.92;
        }
        .invoice-canvas-bg-corporate {
          inset: 0 auto auto 0;
          width: 132px;
          height: 155px;
        }
        .invoice-canvas-line {
          inset: 118px 40px auto 40px;
          height: 1px;
          border-top: 1px solid transparent;
        }
        .canvas-block {
          position: absolute;
          padding: 10px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          backdrop-filter: blur(8px);
          transition: box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .canvas-block:hover {
          box-shadow: 0 10px 30px rgba(77, 88, 138, 0.12);
        }
        .canvas-drag-handle {
          position: absolute;
          top: 8px;
          right: 38px;
          z-index: 3;
          width: 26px;
          height: 26px;
          border: 0;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.08);
          color: inherit;
          font-weight: 900;
        }
        .canvas-delete-handle {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 3;
          width: 26px;
          height: 26px;
          border: 0;
          border-radius: 999px;
          background: rgba(239, 68, 68, 0.12);
          color: #b91c1c;
          font-size: 1rem;
          font-weight: 900;
        }
        .canvas-logo-inner {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: inherit;
          font-size: 1.2rem;
          font-weight: 900;
          color: #fff;
          background: rgba(15, 23, 42, 0.9);
          border: 0;
          padding: 0;
        }
        .canvas-logo-inner.is-uploadable {
          cursor: pointer;
        }
        .canvas-logo-inner.is-uploadable:hover {
          box-shadow: inset 0 0 0 2px rgba(22, 64, 214, 0.32);
        }
        .canvas-logo-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #fff;
        }
        .canvas-inline-input,
        .canvas-inline-textarea,
        .canvas-inline-currency,
        .canvas-inline-amount {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          padding: 0;
          color: inherit;
          font: inherit;
          font-size: 0.64rem;
        }
        .canvas-inline-input.is-readonly,
        .canvas-inline-amount.is-readonly {
          cursor: default;
        }
        .canvas-inline-input::placeholder,
        .canvas-inline-textarea::placeholder {
          color: inherit;
          opacity: 0.45;
        }
        .canvas-inline-title {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .canvas-inline-number {
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: -0.04em;
        }
        .canvas-inline-textarea {
          resize: none;
          min-height: 34px;
          line-height: 1.35;
        }
        .canvas-inline-notes {
          min-height: 48px;
        }
        .canvas-amount-shell,
        .canvas-multiline-card,
        .canvas-meta-grid,
        .canvas-notes-shell {
          display: grid;
          gap: 8px;
          height: 100%;
        }
        .canvas-kicker {
          font-size: 0.52rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.74;
        }
        .canvas-amount-row {
          display: grid;
          grid-template-columns: 46px 1fr;
          gap: 6px;
          align-items: center;
          margin-top: 2px;
        }
        .canvas-inline-currency {
          font-size: 0.62rem;
          font-weight: 800;
        }
        .canvas-inline-amount {
          font-size: 1.38rem;
          font-weight: 800;
          letter-spacing: -0.04em;
        }
        .canvas-subtle-copy {
          margin-top: auto;
          font-size: 0.54rem;
          opacity: 0.75;
        }
        .canvas-dual-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .canvas-meta-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-content: start;
        }
        .canvas-table-shell {
          display: grid;
          grid-template-rows: auto 1fr auto auto;
          gap: 8px;
          height: 100%;
        }
        .canvas-table-head,
        .canvas-table-row {
          display: grid;
          grid-template-columns: 1.78fr 0.42fr 0.56fr 0.56fr 0.78fr;
          gap: 6px;
          align-items: center;
        }
        .canvas-table-head {
          padding: 8px 10px;
          border-radius: 14px;
          font-size: 0.56rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .canvas-table-body {
          display: grid;
          gap: 8px;
          overflow: auto;
          align-content: start;
        }
        .canvas-table-row {
          padding: 7px 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(15, 23, 42, 0.06);
        }
        .canvas-table-add {
          justify-self: start;
          border: 0;
          border-radius: 999px;
          padding: 7px 11px;
          background: rgba(15, 23, 42, 0.07);
          font-size: 0.62rem;
          font-weight: 800;
          color: inherit;
        }
        .canvas-table-currency {
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .canvas-table-summary {
          display: grid;
          gap: 6px;
          margin-top: auto;
          margin-left: auto;
          width: min(320px, 100%);
          padding-top: 10px;
          border-top: 1px solid rgba(15, 23, 42, 0.1);
        }
        .canvas-table-summary > div {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px;
          align-items: center;
          font-size: 0.62rem;
          line-height: 1.3;
        }
        .canvas-table-summary > div > span {
          text-align: right;
          color: rgba(15, 23, 42, 0.78);
          font-weight: 700;
        }
        .canvas-table-summary > div.is-grand {
          margin-top: 2px;
          padding-top: 8px;
          border-top: 1px solid rgba(15, 23, 42, 0.14);
          font-size: 0.72rem;
        }
        .canvas-table-summary > div.is-grand > span {
          color: inherit;
          font-weight: 800;
        }
        .canvas-table-summary strong {
          font-size: inherit;
        }
        .canvas-table-summary-value {
          min-width: 128px;
          text-align: right;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .canvas-tax-summary-label {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 3px;
          flex-wrap: wrap;
        }
        .canvas-inline-tax-rate {
          width: 38px;
          min-width: 38px;
          text-align: center;
          font-weight: 800;
          padding: 0;
        }
        .canvas-notes-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .canvas-mini-action {
          border: 0;
          border-radius: 999px;
          padding: 4px 8px;
          background: rgba(15, 23, 42, 0.08);
          color: inherit;
          font-size: 0.56rem;
          font-weight: 800;
        }
        .invoice-footer-preview {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 12px;
          height: 74px;
          border-radius: 22px;
          border: 1px solid rgba(15, 23, 42, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
        }
        .invoice-footer-copy {
          display: grid;
          gap: 3px;
          font-size: 0.62rem;
        }
        .invoice-footer-link {
          font-weight: 800;
        }
        .invoice-footer-qr {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #fff;
          color: #111827;
          font-weight: 900;
          border: 1px solid rgba(15, 23, 42, 0.08);
        }
        .palette-grid {
          display: grid;
          gap: 10px;
        }
        .palette-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          border-radius: 16px;
          padding: 8px 10px;
          background: rgba(255, 255, 255, 0.76);
          border: 1px solid rgba(15, 23, 42, 0.06);
          font-weight: 700;
          text-transform: capitalize;
        }
        .palette-row input {
          width: 42px;
          height: 42px;
          border: 0;
          background: transparent;
          padding: 0;
        }
        .design-options-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .design-option-card {
          width: 100%;
          border-radius: 26px;
          padding: 14px;
          display: grid;
          gap: 12px;
          text-align: left;
          box-shadow: var(--shadow-soft);
        }
        .design-option-card.is-active {
          outline: 2px solid currentColor;
        }
        .premium-template-header {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .premium-template-title {
          font-weight: 800;
          font-size: 1.05rem;
          letter-spacing: -0.03em;
        }
        .mini-canvas-frame {
          overflow: hidden;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.54);
          border: 1px solid rgba(15, 23, 42, 0.08);
          height: 236px;
          position: relative;
        }
        .mini-canvas-scale {
          position: absolute;
          top: 0;
          left: 0;
          transform: scale(0.28);
          transform-origin: top left;
          width: ${PAGE_WIDTH}px;
          height: ${PAGE_HEIGHT}px;
        }
        @media (max-width: 900px) {
          .ai-modal-overlay {
            padding: 12px;
          }
          .ai-modal-card {
            padding: 18px;
          }
          .ai-modal-head,
          .ai-empty-state {
            flex-direction: column;
            align-items: stretch;
          }
        }
        @media (max-width: 1120px) {
          .builder-bottom-grid,
          .design-options-grid,
          .canvas-workspace {
            grid-template-columns: 1fr;
          }
          .canvas-side-tools {
            order: -1;
          }
          .palette-mini-card {
            position: static;
          }
          .prompt-compact-shell {
            width: 100%;
          }
        }
        @media (max-width: 720px) {
          .invoice-canvas-scroll {
            padding: 8px;
          }
        }
      `}</style>
    </>
  );
}

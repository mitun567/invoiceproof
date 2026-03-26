// "use client";

// import type {
//   ChangeEvent,
//   KeyboardEvent as ReactKeyboardEvent,
//   MouseEvent as ReactMouseEvent,
// } from "react";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { Spinner } from "../../../components/ui/spinner";
// import { useToast } from "../../../components/ui/toast-provider";
// import {
//   clearPendingInvoiceDraft,
//   loadPendingInvoiceDraft,
// } from "../../../lib/invoice-draft-transfer";

// type LoadingState = null | "ai" | "ai-draft" | "finalize";

// const MAX_LOGO_SIZE_BYTES = 4 * 1024 * 1024;
// const MAX_ATTACHMENT_SIZE_BYTES = 12 * 1024 * 1024;
// const MAX_ATTACHMENTS = 10;

// type LineItem = {
//   description: string;
//   quantity: string;
//   unitPrice: string;
//   amount: string;
// };

// type StylePalette = {
//   primary: string;
//   secondary: string;
//   surface: string;
//   surfaceAlt: string;
//   text: string;
//   muted: string;
//   accent: string;
// };

// type StyleTheme = {
//   templateId: string;
//   styleName: string;
//   accentLabel: string;
//   hierarchyStyle: string;
//   tone: string;
//   lineItemPresentation: string;
//   footerStyle: string;
//   trustBadge: string;
//   previewSummary: string;
//   headerTitle: string;
//   heroCopy: string;
//   palette: StylePalette;
// };

// type CanvasBlock = {
//   id: string;
//   type: string;
//   x: number;
//   y: number;
//   w: number;
//   h: number;
//   z?: number;
//   locked?: boolean;
//   editable?: boolean;
//   content?: string;
//   binding?: { key?: string };
//   style?: {
//     fontSize?: number;
//     fontWeight?: string;
//     color?: string;
//     background?: string;
//     align?: string;
//     radius?: number;
//   };
// };

// type InvoiceDraftOption = {
//   title: string;
//   accentLabel: string;
//   templateId: string;
//   styleDirection: string;
//   style: StyleTheme;
//   blocks: CanvasBlock[];
//   summary: string;
// };

// type AiCanvasDraftResult = InvoiceDraftOption & {
//   promptSummary: string;
//   missingFields: string[];
//   invoice: InvoiceState;
// };

// type InvoiceState = {
//   invoiceNumber: string;
//   customerName: string;
//   amount: string;
//   currency: string;
//   taxPercentage: string;
//   discountPercentage: string;
//   issueDate: string;
//   dueDate: string;
//   notes: string;
//   paymentTerms: string;
//   issuerName: string;
//   issuerEmail: string;
//   issuerAddress: string;
//   accentLabel: string;
//   lineItems: LineItem[];
//   style: StyleTheme;
// };

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
// const PAGE_WIDTH = 595.28;
// const PAGE_HEIGHT = 841.89;
// const FOOTER_HEIGHT = 92;
// const intlWithSupportedValues = Intl as typeof Intl & {
//   supportedValuesOf?: (key: string) => string[];
// };
// const FALLBACK_CURRENCY_OPTIONS = [
//   "USD",
//   "EUR",
//   "GBP",
//   "INR",
//   "JPY",
//   "CNY",
//   "AUD",
//   "CAD",
//   "NZD",
//   "SGD",
//   "HKD",
//   "AED",
//   "SAR",
//   "QAR",
//   "KWD",
//   "BHD",
//   "OMR",
//   "CHF",
//   "SEK",
//   "NOK",
//   "DKK",
//   "ISK",
//   "PLN",
//   "CZK",
//   "HUF",
//   "RON",
//   "BGN",
//   "TRY",
//   "RUB",
//   "UAH",
//   "ZAR",
//   "NGN",
//   "KES",
//   "GHS",
//   "EGP",
//   "MAD",
//   "MXN",
//   "BRL",
//   "ARS",
//   "CLP",
//   "COP",
//   "PEN",
//   "UYU",
//   "PYG",
//   "BOB",
//   "CRC",
//   "DOP",
//   "JMD",
//   "TTD",
//   "BBD",
//   "BSD",
//   "BMD",
//   "KRW",
//   "THB",
//   "VND",
//   "IDR",
//   "MYR",
//   "PHP",
//   "TWD",
//   "PKR",
//   "BDT",
//   "LKR",
//   "NPR",
//   "ILS",
// ];
// const CURRENCY_OPTIONS = Array.from(
//   new Set(
//     (typeof intlWithSupportedValues.supportedValuesOf === "function"
//       ? intlWithSupportedValues.supportedValuesOf("currency")
//       : FALLBACK_CURRENCY_OPTIONS
//     ).map((code) => code.toUpperCase())
//   )
// ).sort();
// const CURRENCY_OPTION_SET = new Set(CURRENCY_OPTIONS);
// const CURRENCY_DETECTION_RULES: Array<{ pattern: RegExp; code: string }> = [
//   { pattern: /US\$/i, code: "USD" },
//   { pattern: /A\$/i, code: "AUD" },
//   { pattern: /C\$/i, code: "CAD" },
//   { pattern: /NZ\$/i, code: "NZD" },
//   { pattern: /HK\$/i, code: "HKD" },
//   { pattern: /S\$/i, code: "SGD" },
//   { pattern: /R\$/i, code: "BRL" },
//   { pattern: /\bAED\b|\bDH\b|د\.إ/i, code: "AED" },
//   { pattern: /\bSAR\b|ر\.س/i, code: "SAR" },
//   { pattern: /\bQAR\b|ر\.ق/i, code: "QAR" },
//   { pattern: /\bKWD\b|د\.ك/i, code: "KWD" },
//   { pattern: /\bBHD\b|د\.ب/i, code: "BHD" },
//   { pattern: /\bOMR\b|ر\.ع/i, code: "OMR" },
//   { pattern: /€/i, code: "EUR" },
//   { pattern: /£/i, code: "GBP" },
//   { pattern: /₹/i, code: "INR" },
//   { pattern: /\bCNY\b|\bRMB\b|CN¥|￥|元/i, code: "CNY" },
//   { pattern: /¥|円/i, code: "JPY" },
//   { pattern: /₩/i, code: "KRW" },
//   { pattern: /₽/i, code: "RUB" },
//   { pattern: /₴/i, code: "UAH" },
//   { pattern: /₺/i, code: "TRY" },
//   { pattern: /₫/i, code: "VND" },
//   { pattern: /฿/i, code: "THB" },
//   { pattern: /₱/i, code: "PHP" },
//   { pattern: /₦/i, code: "NGN" },
//   { pattern: /₵/i, code: "GHS" },
//   { pattern: /₪/i, code: "ILS" },
//   { pattern: /₨/i, code: "PKR" },
//   { pattern: /\$/i, code: "USD" },
// ];

// const BASE_STYLES: Record<string, StyleTheme> = {
//   luxury: {
//     templateId: "luxury",
//     styleName: "Luxury editorial",
//     accentLabel: "Luxury",
//     hierarchyStyle: "Editorial hierarchy",
//     tone: "Elevated and executive",
//     lineItemPresentation: "Premium ledger",
//     footerStyle: "Dark verified footer",
//     trustBadge: "Sealed premium proof",
//     previewSummary: "Dark navy hero with warm metallic accents.",
//     headerTitle: "Premium invoice",
//     heroCopy: "Refined presentation for retainers and premium engagements.",
//     palette: {
//       primary: "#111827",
//       secondary: "#C6A35C",
//       surface: "#F8F4EC",
//       surfaceAlt: "#1F2937",
//       text: "#111827",
//       muted: "#6B7280",
//       accent: "#E8D3A2",
//     },
//   },
//   corporate: {
//     templateId: "corporate",
//     styleName: "Corporate executive",
//     accentLabel: "Corporate",
//     hierarchyStyle: "Structured executive layout",
//     tone: "Crisp and confident",
//     lineItemPresentation: "Boardroom finance table",
//     footerStyle: "Compliance-ready footer",
//     trustBadge: "Audit-ready seal",
//     previewSummary: "Royal blue structure with sharp financial hierarchy.",
//     headerTitle: "Executive invoice",
//     heroCopy: "",
//     palette: {
//       primary: "#1640D6",
//       secondary: "#0F172A",
//       surface: "#F4F7FF",
//       surfaceAlt: "#DCE7FF",
//       text: "#0F172A",
//       muted: "#475569",
//       accent: "#5B8CFF",
//     },
//   },
//   creative: {
//     templateId: "creative",
//     styleName: "Creative studio",
//     accentLabel: "Creative",
//     hierarchyStyle: "Expressive split layout",
//     tone: "Energetic and premium",
//     lineItemPresentation: "Story-led service table",
//     footerStyle: "Ribbon footer with proof",
//     trustBadge: "Studio-grade proof",
//     previewSummary: "Vibrant purple canvas with warm highlights.",
//     headerTitle: "Studio invoice",
//     heroCopy: "Ideal for branding, design, product, and creative retainers.",
//     palette: {
//       primary: "#7C3AED",
//       secondary: "#F97316",
//       surface: "#FAF5FF",
//       surfaceAlt: "#FCE7F3",
//       text: "#2E1065",
//       muted: "#6D28D9",
//       accent: "#FDBA74",
//     },
//   },
//   minimal: {
//     templateId: "minimal",
//     styleName: "Minimal modern",
//     accentLabel: "Minimal",
//     hierarchyStyle: "Quiet whitespace-first layout",
//     tone: "Calm and precise",
//     lineItemPresentation: "Minimal rows with understated separators",
//     footerStyle: "Quiet proof footer",
//     trustBadge: "Quiet verified seal",
//     previewSummary: "Soft grayscale system with restrained premium spacing.",
//     headerTitle: "Modern invoice",
//     heroCopy: "Minimal visual noise while trust details stay present.",
//     palette: {
//       primary: "#0F172A",
//       secondary: "#94A3B8",
//       surface: "#FFFFFF",
//       surfaceAlt: "#F8FAFC",
//       text: "#0F172A",
//       muted: "#64748B",
//       accent: "#CBD5E1",
//     },
//   },
// };

// function cloneBlocks(blocks: CanvasBlock[]) {
//   return blocks.map((block) => ({
//     ...block,
//     binding: block.binding ? { ...block.binding } : undefined,
//     style: block.style ? { ...block.style } : undefined,
//   }));
// }

// function defaultBlocks(templateId: string): CanvasBlock[] {
//   const templates: Record<string, CanvasBlock[]> = {
//     corporate: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 42,
//         w: 86,
//         h: 86,
//         binding: { key: "logo" },
//         style: { radius: 24, background: "#ffffff" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 142,
//         y: 40,
//         w: 250,
//         h: 28,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 16, fontWeight: "700", color: "#5B8CFF" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 142,
//         y: 72,
//         w: 230,
//         h: 42,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 32, fontWeight: "800", color: "#0F172A" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 410,
//         y: 44,
//         w: 145,
//         h: 92,
//         binding: { key: "amount" },
//         style: { background: "#DCE7FF", color: "#1640D6", radius: 28 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 172,
//         w: 220,
//         h: 108,
//         binding: { key: "issuer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 310,
//         y: 172,
//         w: 245,
//         h: 108,
//         binding: { key: "customer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 292,
//         w: 515,
//         h: 70,
//         binding: { key: "meta" },
//         style: {
//           background: "#F4F7FF",
//           fontSize: 12,
//           color: "#475569",
//           radius: 22,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 380,
//         w: 515,
//         h: 230,
//         binding: { key: "lineItems" },
//         style: { background: "#ffffff", radius: 24 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 622,
//         w: 515,
//         h: 102,
//         binding: { key: "notes" },
//         style: {
//           background: "#ffffff",
//           fontSize: 12,
//           color: "#475569",
//           radius: 20,
//         },
//       },
//     ],
//     luxury: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 48,
//         w: 84,
//         h: 84,
//         binding: { key: "logo" },
//         style: { radius: 24, background: "#1F2937" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 40,
//         y: 152,
//         w: 180,
//         h: 28,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 14, fontWeight: "700", color: "#C6A35C" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 40,
//         y: 182,
//         w: 290,
//         h: 42,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 34, fontWeight: "800", color: "#FFFFFF" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 392,
//         y: 74,
//         w: 163,
//         h: 118,
//         binding: { key: "amount" },
//         style: { background: "#E8D3A2", color: "#111827", radius: 28 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 272,
//         w: 220,
//         h: 108,
//         binding: { key: "issuer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#111827" },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 310,
//         y: 272,
//         w: 245,
//         h: 108,
//         binding: { key: "customer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#111827" },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 392,
//         w: 515,
//         h: 74,
//         binding: { key: "meta" },
//         style: {
//           background: "#F7EFE3",
//           fontSize: 12,
//           color: "#6B7280",
//           radius: 22,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 480,
//         w: 515,
//         h: 190,
//         binding: { key: "lineItems" },
//         style: { background: "#FFFDF9", radius: 24 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 684,
//         w: 515,
//         h: 64,
//         binding: { key: "notes" },
//         style: {
//           background: "#F7EFE3",
//           fontSize: 12,
//           color: "#6B7280",
//           radius: 20,
//         },
//       },
//     ],
//     creative: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 44,
//         w: 90,
//         h: 90,
//         binding: { key: "logo" },
//         style: { radius: 28, background: "#ffffff" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 154,
//         y: 46,
//         w: 180,
//         h: 28,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 16, fontWeight: "700", color: "#F97316" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 154,
//         y: 80,
//         w: 220,
//         h: 42,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 31, fontWeight: "800", color: "#FFFFFF" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 390,
//         y: 52,
//         w: 165,
//         h: 96,
//         binding: { key: "amount" },
//         style: { background: "#FDBA74", color: "#2E1065", radius: 30 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 212,
//         w: 240,
//         h: 110,
//         binding: { key: "issuer" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 13,
//           color: "#2E1065",
//           radius: 24,
//         },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 315,
//         y: 212,
//         w: 240,
//         h: 110,
//         binding: { key: "customer" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 13,
//           color: "#2E1065",
//           radius: 24,
//         },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 338,
//         w: 515,
//         h: 72,
//         binding: { key: "meta" },
//         style: {
//           background: "#FCE7F3",
//           fontSize: 12,
//           color: "#6D28D9",
//           radius: 22,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 428,
//         w: 515,
//         h: 210,
//         binding: { key: "lineItems" },
//         style: { background: "#FFFFFF", radius: 26 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 654,
//         w: 515,
//         h: 90,
//         binding: { key: "notes" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 12,
//           color: "#6D28D9",
//           radius: 22,
//         },
//       },
//     ],
//     minimal: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 44,
//         w: 72,
//         h: 72,
//         binding: { key: "logo" },
//         style: { radius: 20, background: "#F8FAFC" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 132,
//         y: 50,
//         w: 150,
//         h: 22,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 13, fontWeight: "700", color: "#64748B" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 132,
//         y: 78,
//         w: 260,
//         h: 38,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 32, fontWeight: "800", color: "#0F172A" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 402,
//         y: 58,
//         w: 153,
//         h: 82,
//         binding: { key: "amount" },
//         style: { background: "#F8FAFC", color: "#0F172A", radius: 24 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 166,
//         w: 220,
//         h: 96,
//         binding: { key: "issuer" },
//         style: { fontSize: 13, color: "#0F172A" },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 315,
//         y: 166,
//         w: 240,
//         h: 96,
//         binding: { key: "customer" },
//         style: { fontSize: 13, color: "#0F172A" },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 280,
//         w: 515,
//         h: 58,
//         binding: { key: "meta" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 12,
//           color: "#64748B",
//           radius: 18,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 364,
//         w: 515,
//         h: 238,
//         binding: { key: "lineItems" },
//         style: { background: "#FFFFFF", radius: 20 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 618,
//         w: 515,
//         h: 102,
//         binding: { key: "notes" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 12,
//           color: "#64748B",
//           radius: 18,
//         },
//       },
//     ],
//   };

//   return cloneBlocks(templates[templateId] || templates.corporate);
// }

// function toMoney(value: string) {
//   const number = Number(String(value || "0").replace(/[^\d.]/g, ""));
//   if (!Number.isFinite(number)) return "0.00";
//   return number.toFixed(2);
// }

// function detectCurrencyCode(value: string) {
//   const text = String(value || "").trim();
//   if (!text) return "";
//   for (const rule of CURRENCY_DETECTION_RULES) {
//     if (rule.pattern.test(text)) return rule.code;
//   }
//   const upper = text.toUpperCase();
//   const matches = upper.match(/[A-Z]{3}/g) || [];
//   const detected = matches.find((code) => CURRENCY_OPTION_SET.has(code));
//   if (detected) return detected;
//   const collapsed = upper.replace(/[^A-Z]/g, "").slice(0, 3);
//   return collapsed && CURRENCY_OPTION_SET.has(collapsed) ? collapsed : "";
// }

// function normalizeCurrency(value: string, fallback = "USD") {
//   return detectCurrencyCode(value) || fallback;
// }

// function sumLineItems(items: LineItem[]) {
//   return items
//     .reduce((sum, item) => sum + Number(item.amount || 0), 0)
//     .toFixed(2);
// }

// function calculateDiscountAmount(
//   items: LineItem[],
//   discountPercentage: string
// ) {
//   return (
//     (Number(sumLineItems(items)) * Number(discountPercentage || 0)) /
//     100
//   ).toFixed(2);
// }

// function calculateTaxableSubtotal(
//   items: LineItem[],
//   discountPercentage: string
// ) {
//   return Math.max(
//     Number(sumLineItems(items)) -
//       Number(calculateDiscountAmount(items, discountPercentage)),
//     0
//   ).toFixed(2);
// }

// function calculateTaxAmount(
//   items: LineItem[],
//   taxPercentage: string,
//   discountPercentage: string
// ) {
//   return (
//     (Number(calculateTaxableSubtotal(items, discountPercentage)) *
//       Number(taxPercentage || 0)) /
//     100
//   ).toFixed(2);
// }

// function calculateInvoiceAmount(
//   items: LineItem[],
//   taxPercentage: string,
//   discountPercentage: string
// ) {
//   return (
//     Number(calculateTaxableSubtotal(items, discountPercentage)) +
//     Number(calculateTaxAmount(items, taxPercentage, discountPercentage))
//   ).toFixed(2);
// }

// function parseTaxPercentageFromText(value: string) {
//   const match = String(value || "").match(/(\d+(?:\.\d+)?)\s*%/);
//   return match ? toMoney(match[1]) : null;
// }

// function normalizeLineItem(
//   item: Partial<LineItem>,
//   fallbackDescription: string
// ): LineItem {
//   const quantity = toMoney(String(item.quantity || "1"));
//   const unitPrice = toMoney(String(item.unitPrice || item.amount || "0"));

//   return {
//     description: String(item.description || fallbackDescription).slice(0, 150),
//     quantity,
//     unitPrice,
//     amount: toMoney(String(Number(quantity) * Number(unitPrice))),
//   };
// }

// function normalizeImportedLineItems(
//   rawItems: unknown,
//   fallbackItems: LineItem[]
// ) {
//   const items = Array.isArray(rawItems) ? rawItems.slice(0, 12) : [];
//   const normalized: LineItem[] = [];
//   let subtotal = 0;
//   let derivedTaxPercentage: string | null = null;

//   items.forEach((item: any, index: number) => {
//     const normalizedItem = normalizeLineItem(
//       {
//         description: String(item?.description || `Line item ${index + 1}`),
//         quantity: String(item?.quantity || "1"),
//         unitPrice: String(item?.unitPrice || item?.amount || "0"),
//         amount: String(item?.amount || item?.unitPrice || "0"),
//       },
//       `Line item ${index + 1}`
//     );
//     const description = normalizedItem.description;
//     const explicitTaxPercentage = item?.taxPercentage
//       ? toMoney(String(item.taxPercentage))
//       : parseTaxPercentageFromText(description);
//     const isTaxOnlyLine = /\b(?:gst|vat|tax)\b/i.test(description);

//     if (isTaxOnlyLine) {
//       const derivedFromAmount =
//         subtotal > 0 && Number(normalizedItem.amount || 0) > 0
//           ? toMoney(
//               String((Number(normalizedItem.amount || 0) * 100) / subtotal)
//             )
//           : null;
//       derivedTaxPercentage =
//         derivedFromAmount ||
//         explicitTaxPercentage ||
//         derivedTaxPercentage ||
//         "0.00";
//       return;
//     }

//     normalized.push(normalizedItem);
//     subtotal += Number(normalizedItem.amount || 0);

//     if (
//       !derivedTaxPercentage &&
//       explicitTaxPercentage &&
//       Number(explicitTaxPercentage) > 0
//     ) {
//       derivedTaxPercentage = explicitTaxPercentage;
//     }
//   });

//   return {
//     lineItems: normalized.length ? normalized : fallbackItems,
//     taxPercentage: derivedTaxPercentage || "0.00",
//   };
// }

// function normalizeInvoiceState(
//   input: Partial<InvoiceState>,
//   today: string
// ): InvoiceState {
//   const base = createInitialInvoice(today);
//   const rawStyle = input.style || base.style;
//   const baseStyle = BASE_STYLES[rawStyle.templateId] || base.style;
//   const imported = normalizeImportedLineItems(
//     (input as { lineItems?: unknown }).lineItems,
//     base.lineItems
//   );
//   const taxPercentage = toMoney(
//     String(
//       (input as { taxPercentage?: string }).taxPercentage ||
//         imported.taxPercentage ||
//         base.taxPercentage
//     )
//   );
//   const discountPercentage = toMoney(
//     String(
//       (input as { discountPercentage?: string }).discountPercentage ||
//         base.discountPercentage
//     )
//   );
//   const lineItems = imported.lineItems;
//   const style = {
//     ...baseStyle,
//     ...rawStyle,
//     palette: {
//       ...baseStyle.palette,
//       ...(rawStyle.palette || {}),
//     },
//   };

//   return {
//     ...base,
//     ...input,
//     currency: normalizeCurrency(
//       String(input.currency || base.currency),
//       base.currency
//     ),
//     taxPercentage,
//     discountPercentage,
//     amount: calculateInvoiceAmount(
//       lineItems,
//       taxPercentage,
//       discountPercentage
//     ),
//     notes: String(input.notes ?? base.notes),
//     paymentTerms: String(input.paymentTerms ?? base.paymentTerms),
//     accentLabel: String(input.accentLabel || style.accentLabel),
//     lineItems,
//     style,
//   };
// }

// function normalizeAiPrompt(value: string) {
//   return String(value || "")
//     .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
//     .replace(/\s+/g, " ")
//     .trim()
//     .slice(0, 4000);
// }

// function readFileAsDataUrl(file: File) {
//   return new Promise<string>((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(String(reader.result || ""));
//     reader.onerror = () => reject(new Error("Could not read file."));
//     reader.readAsDataURL(file);
//   });
// }

// function mergeStyle(base: StyleTheme, palette?: Partial<StylePalette>) {
//   return {
//     ...base,
//     palette: {
//       ...base.palette,
//       ...(palette || {}),
//     },
//   };
// }

// function createInitialInvoice(today: string): InvoiceState {
//   const style = mergeStyle(BASE_STYLES.corporate);
//   const lineItems: LineItem[] = [
//     {
//       description: "Strategy and discovery",
//       quantity: "1.00",
//       unitPrice: "1200.00",
//       amount: "1200.00",
//     },
//     {
//       description: "Visual design system",
//       quantity: "1.00",
//       unitPrice: "1600.00",
//       amount: "1600.00",
//     },
//     {
//       description: "Final delivery and handoff",
//       quantity: "1.00",
//       unitPrice: "800.00",
//       amount: "800.00",
//     },
//   ];
//   const taxPercentage = "0.00";
//   const discountPercentage = "0.00";

//   return {
//     invoiceNumber: `INV-${new Date().getFullYear()}-1001`,
//     customerName: "Client name",
//     amount: calculateInvoiceAmount(
//       lineItems,
//       taxPercentage,
//       discountPercentage
//     ),
//     currency: "USD",
//     taxPercentage,
//     discountPercentage,
//     issueDate: today,
//     dueDate: today,
//     notes:
//       "Thank you for your business. This invoice covers strategy, design, and delivery.",
//     paymentTerms: "Due on receipt",
//     issuerName: "InvoiceProof Studio",
//     issuerEmail: "billing@invoiceproof.app",
//     issuerAddress: "123 Market Street, San Francisco, CA",
//     accentLabel: style.accentLabel,
//     lineItems,
//     style,
//   };
// }

// function initials(name: string) {
//   const parts = String(name || "IP")
//     .trim()
//     .split(/\s+/)
//     .filter(Boolean);
//   return `${parts[0]?.[0] || "I"}${parts[1]?.[0] || parts[0]?.[1] || "P"}`
//     .slice(0, 2)
//     .toUpperCase();
// }

// function styleCardCss(style: StyleTheme) {
//   return {
//     background: `linear-gradient(160deg, ${style.palette.surface}, ${style.palette.surfaceAlt})`,
//     color: style.palette.text,
//     border: `1px solid ${style.palette.accent}`,
//   } as const;
// }

// function moveBlock(blocks: CanvasBlock[], id: string, dx: number, dy: number) {
//   return blocks.map((block) =>
//     block.id === id
//       ? {
//           ...block,
//           x: Math.max(8, Math.min(PAGE_WIDTH - block.w - 8, block.x + dx)),
//           y: Math.max(
//             8,
//             Math.min(PAGE_HEIGHT - FOOTER_HEIGHT - block.h - 8, block.y + dy)
//           ),
//         }
//       : block
//   );
// }

// function MiniPreview({
//   invoice,
//   blocks,
//   logoDataUrl,
// }: {
//   invoice: InvoiceState;
//   blocks: CanvasBlock[];
//   logoDataUrl: string | null;
// }) {
//   return (
//     <div className="mini-canvas-frame">
//       <div className="mini-canvas-scale">
//         <InvoiceCanvasPage
//           invoice={invoice}
//           blocks={blocks}
//           logoDataUrl={logoDataUrl}
//           selectedBlockId={null}
//           onSelectBlock={() => undefined}
//           onBlockMouseDown={() => undefined}
//           onUpdateInvoice={() => undefined}
//           onUpdateLineItem={() => undefined}
//           onAddLineItem={() => undefined}
//           onDeleteBlock={() => undefined}
//           onLogoPick={() => undefined}
//           readOnly
//         />
//       </div>
//     </div>
//   );
// }

// function InvoiceCanvasPage(props: {
//   invoice: InvoiceState;
//   blocks: CanvasBlock[];
//   logoDataUrl: string | null;
//   selectedBlockId: string | null;
//   onSelectBlock: (id: string) => void;
//   onBlockMouseDown: (
//     event: ReactMouseEvent<HTMLButtonElement>,
//     id: string
//   ) => void;
//   onUpdateInvoice: (patch: Partial<InvoiceState>) => void;
//   onUpdateLineItem: (index: number, key: keyof LineItem, value: string) => void;
//   onAddLineItem: () => void;
//   onDeleteBlock: (id: string) => void;
//   onLogoPick: () => void;
//   readOnly?: boolean;
// }) {
//   const {
//     invoice,
//     blocks,
//     logoDataUrl,
//     selectedBlockId,
//     onSelectBlock,
//     onBlockMouseDown,
//     onUpdateInvoice,
//     onUpdateLineItem,
//     onAddLineItem,
//     onDeleteBlock,
//     onLogoPick,
//     readOnly,
//   } = props;
//   const { style } = invoice;
//   const palette = style.palette;
//   const orderedBlocks = [...blocks].sort((a, b) => (a.z || 0) - (b.z || 0));

//   return (
//     <div
//       className={`invoice-canvas-page is-${style.templateId}`}
//       style={{
//         background: palette.surface,
//         color: palette.text,
//         width: PAGE_WIDTH,
//         height: PAGE_HEIGHT,
//       }}
//     >
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-luxury"
//         style={{
//           background:
//             style.templateId === "luxury" ? palette.primary : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-creative"
//         style={{
//           background:
//             style.templateId === "creative" ? palette.primary : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-creative-accent"
//         style={{
//           background:
//             style.templateId === "creative" ? palette.accent : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-corporate"
//         style={{
//           background:
//             style.templateId === "corporate"
//               ? palette.surfaceAlt
//               : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-line"
//         style={{
//           borderColor:
//             style.templateId === "minimal" ? palette.secondary : "transparent",
//         }}
//       />

//       {orderedBlocks.map((block) => {
//         const isSelected = selectedBlockId === block.id;
//         const background = block.style?.background || "transparent";
//         return (
//           <div
//             key={block.id}
//             className={`canvas-block canvas-block-${block.type} ${
//               isSelected ? "is-selected" : ""
//             }`}
//             style={{
//               left: block.x,
//               top: block.y,
//               width: block.w,
//               height: block.h,
//               color: block.style?.color || palette.text,
//               background,
//               borderRadius: block.style?.radius || 18,
//               boxShadow: isSelected
//                 ? `0 0 0 2px ${palette.primary}`
//                 : undefined,
//             }}
//             onMouseDown={() => onSelectBlock(block.id)}
//           >
//             {!readOnly ? (
//               <>
//                 <button
//                   type="button"
//                   className="canvas-drag-handle"
//                   onMouseDown={(event) => onBlockMouseDown(event, block.id)}
//                   aria-label={`Move ${block.id}`}
//                 >
//                   ⋮⋮
//                 </button>
//                 <button
//                   type="button"
//                   className="canvas-delete-handle"
//                   onClick={(event) => {
//                     event.stopPropagation();
//                     onDeleteBlock(block.id);
//                   }}
//                   aria-label={`Delete ${block.id}`}
//                 >
//                   ×
//                 </button>
//               </>
//             ) : null}

//             {block.type === "logo" ? (
//               <button
//                 type="button"
//                 className={`canvas-logo-inner ${
//                   readOnly ? "is-readonly" : "is-uploadable"
//                 }`}
//                 onClick={(event) => {
//                   event.stopPropagation();
//                   if (!readOnly) onLogoPick();
//                 }}
//               >
//                 {logoDataUrl ? (
//                   <img
//                     src={logoDataUrl}
//                     alt="Logo"
//                     className="canvas-logo-image"
//                   />
//                 ) : (
//                   <div className="canvas-logo-placeholder">
//                     <span className="canvas-logo-placeholder-badge">
//                       {initials(invoice.issuerName)}
//                     </span>
//                     <span className="canvas-logo-placeholder-copy">
//                       Click to upload logo
//                     </span>
//                   </div>
//                 )}
//               </button>
//             ) : null}

//             {block.binding?.key === "headerTitle" ? (
//               <input
//                 className="canvas-inline-input canvas-inline-title"
//                 value={invoice.style.headerTitle}
//                 onChange={(event) =>
//                   onUpdateInvoice({
//                     style: {
//                       ...invoice.style,
//                       headerTitle: event.target.value,
//                     },
//                   })
//                 }
//                 readOnly={readOnly}
//               />
//             ) : null}

//             {block.binding?.key === "invoiceNumber" ? (
//               <input
//                 className="canvas-inline-input canvas-inline-number"
//                 value={invoice.invoiceNumber}
//                 onChange={(event) =>
//                   onUpdateInvoice({ invoiceNumber: event.target.value })
//                 }
//                 readOnly={readOnly}
//               />
//             ) : null}

//             {block.type === "amount" ? (
//               <div className="canvas-amount-shell">
//                 <span className="canvas-kicker">Amount due</span>
//                 <div className="canvas-amount-row">
//                   <input
//                     className="canvas-inline-currency"
//                     list="invoice-currency-list"
//                     value={invoice.currency}
//                     onChange={(event) =>
//                       onUpdateInvoice({
//                         currency: normalizeCurrency(
//                           event.target.value,
//                           invoice.currency
//                         ),
//                       })
//                     }
//                     readOnly={readOnly}
//                   />
//                   <input
//                     className="canvas-inline-amount is-readonly"
//                     value={invoice.amount}
//                     onChange={(event) =>
//                       onUpdateInvoice({ amount: event.target.value })
//                     }
//                     readOnly
//                   />
//                 </div>
//                 <span className="canvas-subtle-copy">
//                   {invoice.style.trustBadge}
//                 </span>
//               </div>
//             ) : null}

//             {block.binding?.key === "issuer" ? (
//               <div className="canvas-multiline-card">
//                 <span className="canvas-kicker">From</span>
//                 <input
//                   className="canvas-inline-input"
//                   value={invoice.issuerName}
//                   onChange={(event) =>
//                     onUpdateInvoice({ issuerName: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//                 <input
//                   className="canvas-inline-input"
//                   value={invoice.issuerEmail}
//                   onChange={(event) =>
//                     onUpdateInvoice({ issuerEmail: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//                 <textarea
//                   className="canvas-inline-textarea"
//                   value={invoice.issuerAddress}
//                   onChange={(event) =>
//                     onUpdateInvoice({ issuerAddress: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//               </div>
//             ) : null}

//             {block.binding?.key === "customer" ? (
//               <div className="canvas-multiline-card">
//                 <span className="canvas-kicker">Bill to</span>
//                 <input
//                   className="canvas-inline-input"
//                   value={invoice.customerName}
//                   onChange={(event) =>
//                     onUpdateInvoice({ customerName: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//                 <div className="canvas-dual-row">
//                   <input
//                     type="date"
//                     className="canvas-inline-input"
//                     value={invoice.issueDate}
//                     onChange={(event) =>
//                       onUpdateInvoice({ issueDate: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                   <input
//                     type="date"
//                     className="canvas-inline-input"
//                     value={invoice.dueDate}
//                     onChange={(event) =>
//                       onUpdateInvoice({ dueDate: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//               </div>
//             ) : null}

//             {block.binding?.key === "meta" ? (
//               <div className="canvas-meta-grid">
//                 <div>
//                   <span className="canvas-kicker">Label</span>
//                   <input
//                     className="canvas-inline-input"
//                     value={invoice.accentLabel}
//                     onChange={(event) =>
//                       onUpdateInvoice({ accentLabel: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//                 <div>
//                   <span className="canvas-kicker">Terms</span>
//                   <input
//                     className="canvas-inline-input"
//                     value={invoice.paymentTerms}
//                     onChange={(event) =>
//                       onUpdateInvoice({ paymentTerms: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//                 <div style={{ gridColumn: "1 / -1" }}>
//                   <span className="canvas-kicker">Hero copy</span>
//                   <input
//                     className="canvas-inline-input"
//                     value={invoice.style.heroCopy}
//                     onChange={(event) =>
//                       onUpdateInvoice({
//                         style: {
//                           ...invoice.style,
//                           heroCopy: event.target.value,
//                         },
//                       })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//               </div>
//             ) : null}

//             {block.type === "table" ? (
//               <div className="canvas-table-shell">
//                 <div
//                   className="canvas-table-head"
//                   style={{
//                     background:
//                       style.templateId === "minimal"
//                         ? palette.surfaceAlt
//                         : palette.primary,
//                     color:
//                       style.templateId === "minimal" ? palette.text : "#fff",
//                   }}
//                 >
//                   <span>Description</span>
//                   <span>Qty</span>
//                   <span>Unit</span>
//                   <span>Currency</span>
//                   <span>Amount</span>
//                 </div>
//                 <div className="canvas-table-body">
//                   {invoice.lineItems.map((item, index) => (
//                     <div
//                       key={`${index}-${item.description}`}
//                       className="canvas-table-row"
//                     >
//                       <input
//                         className="canvas-inline-input is-readonly"
//                         value={item.description}
//                         onChange={(event) =>
//                           onUpdateLineItem(
//                             index,
//                             "description",
//                             event.target.value
//                           )
//                         }
//                         readOnly
//                       />
//                       <input
//                         className="canvas-inline-input"
//                         value={item.quantity}
//                         onChange={(event) =>
//                           onUpdateLineItem(
//                             index,
//                             "quantity",
//                             event.target.value
//                           )
//                         }
//                         readOnly={readOnly}
//                       />
//                       <input
//                         className="canvas-inline-input"
//                         value={item.unitPrice}
//                         onChange={(event) =>
//                           onUpdateLineItem(
//                             index,
//                             "unitPrice",
//                             event.target.value
//                           )
//                         }
//                         readOnly={readOnly}
//                       />
//                       <input
//                         className="canvas-inline-input is-readonly canvas-table-currency"
//                         value={invoice.currency}
//                         readOnly
//                       />
//                       <input
//                         className="canvas-inline-input is-readonly"
//                         value={item.amount}
//                         onChange={(event) =>
//                           onUpdateLineItem(index, "amount", event.target.value)
//                         }
//                         readOnly
//                       />
//                     </div>
//                   ))}
//                 </div>
//                 {!readOnly ? (
//                   <button
//                     type="button"
//                     className="canvas-table-add"
//                     onClick={onAddLineItem}
//                   >
//                     + Add item
//                   </button>
//                 ) : null}
//                 <div className="canvas-table-summary">
//                   <div>
//                     <span>Total amount</span>
//                     <strong className="canvas-table-summary-value">
//                       {invoice.currency} {sumLineItems(invoice.lineItems)}
//                     </strong>
//                   </div>
//                   <div>
//                     <span className="canvas-tax-summary-label">
//                       Discount (
//                       <input
//                         className="canvas-inline-input canvas-inline-tax-rate"
//                         value={invoice.discountPercentage}
//                         onChange={(event) =>
//                           onUpdateInvoice({
//                             discountPercentage: event.target.value,
//                           })
//                         }
//                         readOnly={readOnly}
//                         aria-label="Discount percentage"
//                       />
//                       %)
//                     </span>
//                     <strong className="canvas-table-summary-value">
//                       - {invoice.currency}{" "}
//                       {calculateDiscountAmount(
//                         invoice.lineItems,
//                         invoice.discountPercentage
//                       )}
//                     </strong>
//                   </div>
//                   <div>
//                     <span className="canvas-tax-summary-label">
//                       GST / Tax / VAT (
//                       <input
//                         className="canvas-inline-input canvas-inline-tax-rate"
//                         value={invoice.taxPercentage}
//                         onChange={(event) =>
//                           onUpdateInvoice({ taxPercentage: event.target.value })
//                         }
//                         readOnly={readOnly}
//                         aria-label="GST, tax, or VAT percentage"
//                       />
//                       %)
//                     </span>
//                     <strong className="canvas-table-summary-value">
//                       {invoice.currency}{" "}
//                       {calculateTaxAmount(
//                         invoice.lineItems,
//                         invoice.taxPercentage,
//                         invoice.discountPercentage
//                       )}
//                     </strong>
//                   </div>
//                   <div className="is-grand">
//                     <span>Grand total</span>
//                     <strong className="canvas-table-summary-value">
//                       {invoice.currency} {invoice.amount}
//                     </strong>
//                   </div>
//                 </div>
//               </div>
//             ) : null}

//             {block.binding?.key === "notes" ? (
//               <div className="canvas-notes-shell">
//                 <div className="canvas-notes-head">
//                   <span className="canvas-kicker">Notes</span>
//                   {!readOnly && invoice.notes ? (
//                     <button
//                       type="button"
//                       className="canvas-mini-action"
//                       onClick={() => onUpdateInvoice({ notes: "" })}
//                     >
//                       Clear
//                     </button>
//                   ) : null}
//                 </div>
//                 <textarea
//                   className="canvas-inline-textarea canvas-inline-notes"
//                   value={invoice.notes}
//                   onChange={(event) =>
//                     onUpdateInvoice({ notes: event.target.value })
//                   }
//                   readOnly={readOnly}
//                   placeholder="Add optional payment notes or leave blank."
//                 />
//               </div>
//             ) : null}
//           </div>
//         );
//       })}

//       <div
//         className="invoice-footer-preview"
//         style={{
//           background:
//             invoice.style.templateId === "luxury"
//               ? palette.primary
//               : palette.surfaceAlt,
//           color: invoice.style.templateId === "luxury" ? "#fff" : palette.text,
//         }}
//       >
//         <div className="invoice-footer-copy">
//           <strong>InvoiceProof</strong>
//           <span>
//             QR, brand, and verification link appear on every final page.
//           </span>
//           <span className="invoice-footer-link">/verify/&lt;public-id&gt;</span>
//         </div>
//         <div className="invoice-footer-qr">QR</div>
//       </div>
//     </div>
//   );
// }

// export function NewInvoiceForm() {
//   const router = useRouter();
//   const { showToast } = useToast();
//   const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
//   const [invoice, setInvoice] = useState<InvoiceState>(() =>
//     createInitialInvoice(today)
//   );
//   const [blocks, setBlocks] = useState<CanvasBlock[]>(() =>
//     defaultBlocks("corporate")
//   );
//   const [drafts, setDrafts] = useState<InvoiceDraftOption[]>([]);
//   const [selectedDraft, setSelectedDraft] = useState<string>("corporate");
//   const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
//     "invoiceNumber"
//   );
//   const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
//   const [logoName, setLogoName] = useState<string>("");
//   const [attachments, setAttachments] = useState<File[]>([]);
//   const [loading, setLoading] = useState<LoadingState>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [aiModalOpen, setAiModalOpen] = useState(false);
//   const [aiPrompt, setAiPrompt] = useState("");
//   const [aiPromptSummary, setAiPromptSummary] = useState("");
//   const [aiMissingFields, setAiMissingFields] = useState<string[]>([]);
//   const dragRef = useRef<{ id: string; x: number; y: number } | null>(null);
//   const canvasStageRef = useRef<HTMLElement | null>(null);
//   const canvasViewportRef = useRef<HTMLDivElement | null>(null);
//   const logoInputRef = useRef<HTMLInputElement | null>(null);
//   const [canvasScale, setCanvasScale] = useState(1);
//   const hasAiDraft = Boolean(aiPrompt.trim() || aiPromptSummary.trim());

//   useEffect(() => {
//     const transferred = loadPendingInvoiceDraft();
//     if (!transferred) return;

//     clearPendingInvoiceDraft();

//     if (transferred.type === "ai-canvas") {
//       const data = transferred.payload as AiCanvasDraftResult & {
//         prompt?: string;
//       };
//       if (data.invoice) setInvoice(normalizeInvoiceState(data.invoice, today));
//       if (Array.isArray(data.blocks) && data.blocks.length)
//         setBlocks(cloneBlocks(data.blocks));
//       setAiPrompt(typeof data.prompt === "string" ? data.prompt : "");
//       setAiPromptSummary(
//         String(data?.promptSummary || "AI created an editable invoice draft.")
//       );
//       setAiMissingFields(
//         Array.isArray(data?.missingFields) ? data.missingFields.slice(0, 6) : []
//       );
//       setSelectedDraft(
//         String(
//           data?.templateId || data?.invoice?.style?.templateId || "corporate"
//         )
//       );
//       setSelectedBlockId("invoiceNumber");
//       window.requestAnimationFrame(() => {
//         canvasStageRef.current?.scrollIntoView({
//           behavior: "smooth",
//           block: "start",
//         });
//       });
//       showToast({
//         tone: "success",
//         title: "AI invoice ready",
//         description: "Your extracted invoice has been loaded into the canvas.",
//       });
//       return;
//     }

//     if (transferred.type === "pdf-detect") {
//       const payload = transferred.payload as {
//         fileName?: string;
//         detected?: any;
//       };
//       const detected = payload?.detected || {};
//       const base = createInitialInvoice(today);
//       const imported = normalizeImportedLineItems(
//         detected.lineItems,
//         base.lineItems
//       );
//       const taxPercentage = toMoney(
//         String(detected.taxPercentage || imported.taxPercentage || "0")
//       );
//       const discountPercentage = toMoney(
//         String(detected.discountPercentage || "0")
//       );
//       const lineItems = imported.lineItems;
//       const nextInvoice: InvoiceState = {
//         ...base,
//         invoiceNumber: String(detected.invoiceNumber || base.invoiceNumber),
//         customerName: String(detected.customerName || base.customerName),
//         amount: calculateInvoiceAmount(
//           lineItems,
//           taxPercentage,
//           discountPercentage
//         ),
//         currency: normalizeCurrency(
//           String(detected.currency || base.currency),
//           base.currency
//         ),
//         taxPercentage,
//         discountPercentage,
//         issueDate: String(detected.issueDate || base.issueDate),
//         dueDate: String(detected.dueDate || detected.issueDate || base.dueDate),
//         notes: String(detected.notes || base.notes),
//         paymentTerms: String(detected.paymentTerms || base.paymentTerms),
//         issuerName: String(detected.issuerName || base.issuerName),
//         issuerEmail: String(detected.issuerEmail || base.issuerEmail),
//         issuerAddress: String(detected.issuerAddress || base.issuerAddress),
//         lineItems,
//         style: mergeStyle(BASE_STYLES.corporate),
//         accentLabel: BASE_STYLES.corporate.accentLabel,
//       };
//       setInvoice(normalizeInvoiceState(nextInvoice, today));
//       setBlocks(defaultBlocks("corporate"));
//       setSelectedDraft("corporate");
//       setSelectedBlockId("invoiceNumber");
//       setAiPromptSummary(
//         String(
//           detected.extractionSummary ||
//             `Extracted invoice data from ${payload.fileName || "uploaded PDF"}.`
//         )
//       );
//       setAiMissingFields(
//         detected.needsReview
//           ? ["invoice number", "customer", "amount", "dates"].slice(0, 4)
//           : []
//       );
//       window.requestAnimationFrame(() => {
//         canvasStageRef.current?.scrollIntoView({
//           behavior: "smooth",
//           block: "start",
//         });
//       });
//       showToast({
//         tone: "success",
//         title: "PDF data loaded",
//         description:
//           "Review the extracted fields, then finalize the canvas PDF.",
//       });
//     }
//   }, [showToast, today]);

//   useEffect(() => {
//     function onMove(event: MouseEvent) {
//       if (!dragRef.current) return;
//       const dx = event.clientX - dragRef.current.x;
//       const dy = event.clientY - dragRef.current.y;
//       dragRef.current = {
//         ...dragRef.current,
//         x: event.clientX,
//         y: event.clientY,
//       };
//       setBlocks((current) => moveBlock(current, dragRef.current!.id, dx, dy));
//     }

//     function onUp() {
//       dragRef.current = null;
//     }

//     window.addEventListener("mousemove", onMove);
//     window.addEventListener("mouseup", onUp);
//     return () => {
//       window.removeEventListener("mousemove", onMove);
//       window.removeEventListener("mouseup", onUp);
//     };
//   }, []);

//   useEffect(() => {
//     if (!aiModalOpen) return;

//     function onKeyDown(event: KeyboardEvent) {
//       if (event.key === "Escape") {
//         setAiModalOpen(false);
//       }
//     }

//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [aiModalOpen]);

//   useEffect(() => {
//     if (!selectedBlockId) return;

//     function onDeleteKey(event: KeyboardEvent) {
//       const target = event.target as HTMLElement | null;
//       const tagName = target?.tagName || "";
//       if (
//         ["INPUT", "TEXTAREA", "SELECT"].includes(tagName) ||
//         target?.isContentEditable
//       )
//         return;
//       if (event.key !== "Delete" && event.key !== "Backspace") return;
//       event.preventDefault();
//       deleteBlock(selectedBlockId);
//     }

//     window.addEventListener("keydown", onDeleteKey);
//     return () => window.removeEventListener("keydown", onDeleteKey);
//   }, [selectedBlockId, blocks]);

//   useEffect(() => {
//     function updateCanvasScale() {
//       const viewportWidth =
//         canvasViewportRef.current?.clientWidth || PAGE_WIDTH;
//       const nextScale = Math.max(
//         0.82,
//         Math.min(1.82, (viewportWidth - 24) / PAGE_WIDTH)
//       );
//       setCanvasScale(Number.isFinite(nextScale) ? nextScale : 1);
//     }

//     updateCanvasScale();

//     const observer =
//       typeof ResizeObserver !== "undefined" && canvasViewportRef.current
//         ? new ResizeObserver(() => updateCanvasScale())
//         : null;

//     if (observer && canvasViewportRef.current) {
//       observer.observe(canvasViewportRef.current);
//     }

//     window.addEventListener("resize", updateCanvasScale);
//     return () => {
//       observer?.disconnect();
//       window.removeEventListener("resize", updateCanvasScale);
//     };
//   }, []);

//   function updateInvoice(patch: Partial<InvoiceState>) {
//     setInvoice((current) => {
//       const next = { ...current, ...patch };
//       if (patch.currency !== undefined) {
//         next.currency = normalizeCurrency(
//           String(patch.currency || current.currency),
//           current.currency
//         );
//       }
//       if (patch.taxPercentage !== undefined) {
//         next.taxPercentage = toMoney(String(patch.taxPercentage || "0"));
//       }
//       if (patch.discountPercentage !== undefined) {
//         next.discountPercentage = toMoney(
//           String(patch.discountPercentage || "0")
//         );
//       }
//       if (
//         patch.taxPercentage !== undefined ||
//         patch.discountPercentage !== undefined
//       ) {
//         next.amount = calculateInvoiceAmount(
//           next.lineItems,
//           next.taxPercentage,
//           next.discountPercentage
//         );
//       }
//       return next;
//     });
//   }

//   function deleteBlock(id: string) {
//     setBlocks((current) => {
//       const next = current.filter((block) => block.id !== id);
//       setSelectedBlockId(next[0]?.id || null);
//       return next;
//     });
//   }

//   function updateLineItem(index: number, key: keyof LineItem, value: string) {
//     setInvoice((current) => {
//       const lineItems = current.lineItems.map((item, itemIndex) => {
//         if (itemIndex !== index) return item;
//         const next = { ...item, [key]: value };
//         if (key === "quantity" || key === "unitPrice") {
//           next.amount = toMoney(
//             String(Number(next.quantity || 0) * Number(next.unitPrice || 0))
//           );
//         }
//         return next;
//       });
//       return {
//         ...current,
//         lineItems,
//         amount: calculateInvoiceAmount(
//           lineItems,
//           current.taxPercentage,
//           current.discountPercentage
//         ),
//       };
//     });
//   }

//   function addLineItem() {
//     setInvoice((current) => {
//       const lineItems = [
//         ...current.lineItems,
//         {
//           description: "New item",
//           quantity: "1.00",
//           unitPrice: "0.00",
//           amount: "0.00",
//         },
//       ];
//       return {
//         ...current,
//         lineItems,
//         amount: calculateInvoiceAmount(
//           lineItems,
//           current.taxPercentage,
//           current.discountPercentage
//         ),
//       };
//     });
//   }

//   function openLogoPicker() {
//     logoInputRef.current?.click();
//   }

//   async function onLogoChange(event: ChangeEvent<HTMLInputElement>) {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
//       const message = "Please upload a PNG, JPG, or WebP logo.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Invalid logo type",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     if (file.size > MAX_LOGO_SIZE_BYTES) {
//       const message = "Logo must be 4 MB or smaller.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Logo too large",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     try {
//       const dataUrl = await readFileAsDataUrl(file);
//       setLogoDataUrl(dataUrl);
//       setLogoName(file.name);
//       showToast({
//         tone: "success",
//         title: "Logo ready",
//         description:
//           "Your logo will be rendered on the invoice canvas and final PDF.",
//       });
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Could not load logo.";
//       setError(message);
//       showToast({ tone: "error", title: "Logo failed", description: message });
//     }
//   }

//   function onAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
//     const files = Array.from(event.target.files || []);
//     if (!files.length) {
//       setAttachments([]);
//       return;
//     }

//     if (files.length > MAX_ATTACHMENTS) {
//       const message = `Attach up to ${MAX_ATTACHMENTS} PDFs at a time.`;
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Too many attachments",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     const invalidType = files.find(
//       (file) =>
//         file.type !== "application/pdf" &&
//         !file.name.toLowerCase().endsWith(".pdf")
//     );
//     if (invalidType) {
//       const message = "All attachments must be PDF files.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Invalid attachment",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     const oversized = files.find(
//       (file) => file.size > MAX_ATTACHMENT_SIZE_BYTES
//     );
//     if (oversized) {
//       const message = `${oversized.name} is larger than 12 MB.`;
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Attachment too large",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     setAttachments(files);
//     setError(null);
//   }

//   function updatePalette(key: keyof StylePalette, value: string) {
//     setInvoice((current) => ({
//       ...current,
//       style: {
//         ...current.style,
//         palette: {
//           ...current.style.palette,
//           [key]: value,
//         },
//       },
//     }));
//   }

//   function openAiModal() {
//     setError(null);
//     setAiModalOpen(true);
//   }

//   function handleAiPromptKeyDown(
//     event: ReactKeyboardEvent<HTMLTextAreaElement>
//   ) {
//     if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
//       event.preventDefault();
//       void generateAiCanvasFromPrompt(aiPrompt);
//     }
//   }

//   function clearAiDraft() {
//     setAiPrompt("");
//     setAiPromptSummary("");
//     setAiMissingFields([]);
//   }

//   function applyDraft(option: InvoiceDraftOption) {
//     setSelectedDraft(option.templateId);
//     setInvoice((current) => ({
//       ...current,
//       style: option.style,
//       accentLabel: option.style.accentLabel,
//     }));
//     setBlocks(cloneBlocks(option.blocks));
//   }

//   async function generateAiCanvasFromPrompt(rawPrompt = aiPrompt) {
//     if (loading) return;

//     const prompt = normalizeAiPrompt(rawPrompt);
//     if (prompt.length < 12) {
//       showToast({
//         tone: "error",
//         title: "Add a bit more detail",
//         description:
//           "Include who the invoice is for, what the work was, and the amount if you know it.",
//       });
//       return;
//     }

//     setAiModalOpen(false);
//     setLoading("ai-draft");
//     setError(null);

//     try {
//       const response = await fetch(`${API_BASE}/invoices/ai-canvas-draft`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt }),
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not create the AI invoice draft."
//         );
//       }

//       const data = json.data as AiCanvasDraftResult;
//       setAiPrompt(prompt);
//       setAiPromptSummary(
//         String(data?.promptSummary || "AI created an editable invoice draft.")
//       );
//       setAiMissingFields(
//         Array.isArray(data?.missingFields) ? data.missingFields.slice(0, 6) : []
//       );
//       setInvoice(normalizeInvoiceState(data.invoice, today));
//       setBlocks(cloneBlocks(data.blocks));
//       setSelectedDraft(data.templateId);
//       setSelectedBlockId("invoiceNumber");
//       window.requestAnimationFrame(() => {
//         canvasStageRef.current?.scrollIntoView({
//           behavior: "smooth",
//           block: "start",
//         });
//       });
//       showToast({
//         tone: "success",
//         title: "AI invoice ready",
//         description:
//           "Your first editable canvas is ready. Review anything highlighted, then finalize.",
//       });
//     } catch (err) {
//       const message =
//         err instanceof Error
//           ? err.message
//           : "Could not create the AI invoice draft.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "AI draft failed",
//         description: message,
//       });
//     } finally {
//       setLoading(null);
//     }
//   }

//   async function generateDesigns() {
//     if (loading) return;
//     setLoading("ai");
//     setError(null);
//     try {
//       const response = await fetch(`${API_BASE}/invoices/canvas-drafts`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...invoice,
//           amount: toMoney(invoice.amount),
//           palette: invoice.style.palette,
//           selectedTemplateId: invoice.style.templateId,
//           styleDirection: invoice.style.tone,
//         }),
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not generate canvas designs."
//         );
//       }
//       const options = Array.isArray(json?.data?.options)
//         ? json.data.options
//         : [];
//       setDrafts(options);
//       if (options[0]) applyDraft(options[0]);
//       showToast({
//         tone: "success",
//         title: "4 premium options ready",
//         description: "Pick one and keep editing directly on the page.",
//       });
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Could not generate designs.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Design generation failed",
//         description: message,
//       });
//     } finally {
//       setLoading(null);
//     }
//   }

//   async function finalizeCanvas() {
//     if (loading) return;
//     let navigating = false;
//     setLoading("finalize");
//     setError(null);
//     try {
//       const formData = new FormData();
//       formData.append(
//         "invoice",
//         JSON.stringify({
//           ...invoice,
//           amount: toMoney(invoice.amount),
//           lineItems: invoice.lineItems.map((item) => ({
//             ...item,
//             quantity: toMoney(item.quantity),
//             unitPrice: toMoney(item.unitPrice),
//             amount: toMoney(item.amount),
//           })),
//           selectedTemplateId: invoice.style.templateId,
//           style: invoice.style,
//           palette: invoice.style.palette,
//           canvasBlocks: blocks,
//           logoDataUrl,
//           attachmentNames: attachments.map((file) => file.name),
//         })
//       );
//       attachments.forEach((file) => formData.append("attachments", file));

//       const response = await fetch(`${API_BASE}/invoices/finalize-canvas`, {
//         method: "POST",
//         body: formData,
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not finalize canvas invoice."
//         );
//       }
//       showToast({
//         tone: "success",
//         title: "Canvas invoice finalized",
//         description: "Sealed PDF created with footer on every page.",
//       });
//       navigating = true;
//       router.push(`/invoices/${json.data.id}`);
//       router.refresh();
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Could not finalize invoice.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Finalize failed",
//         description: message,
//       });
//     } finally {
//       if (!navigating) {
//         setLoading(null);
//       }
//     }
//   }

//   function onBlockMouseDown(
//     event: ReactMouseEvent<HTMLButtonElement>,
//     id: string
//   ) {
//     event.preventDefault();
//     event.stopPropagation();
//     dragRef.current = { id, x: event.clientX, y: event.clientY };
//     setSelectedBlockId(id);
//   }

//   const overlayTitle =
//     loading === "ai-draft"
//       ? "Building your invoice with AI"
//       : loading === "ai"
//       ? "Generating premium layouts"
//       : loading === "finalize"
//       ? "Processing sealed PDF"
//       : "";
//   const overlayCopy =
//     loading === "ai-draft"
//       ? "Reading your messy notes, extracting the billing details, and placing everything onto one editable canvas."
//       : loading === "ai"
//       ? "Building four premium design systems from your data and palette."
//       : loading === "finalize"
//       ? "Please wait while we render your invoice, append attachments, and open the next page automatically."
//       : "";

//   return (
//     <>
//       {aiModalOpen ? (
//         <div
//           className="ai-modal-overlay"
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="ai-modal-title"
//         >
//           <div className="ai-modal-card">
//             <div className="ai-modal-head">
//               <div className="page-stack" style={{ gap: 6 }}>
//                 <span className="mini-chip is-accent">V1</span>
//                 <h3 id="ai-modal-title" style={{ margin: 0 }}>
//                   Generate invoice with AI
//                 </h3>
//                 <p className="muted" style={{ margin: 0 }}>
//                   Describe the job, paste messy notes, or drop in copied email
//                   text. AI will extract the core invoice fields and load one
//                   editable canvas.
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 className="btn btn-secondary ai-modal-close"
//                 onClick={() => setAiModalOpen(false)}
//               >
//                 Close
//               </button>
//             </div>

//             <label className="field-group">
//               <span className="field-label">Prompt or messy notes</span>
//               <textarea
//                 className="input-shell ai-modal-textarea"
//                 value={aiPrompt}
//                 onChange={(event) => setAiPrompt(event.target.value)}
//                 onKeyDown={handleAiPromptKeyDown}
//                 placeholder="Example: Invoice Acme Corp for a landing page redesign, 3 weeks of work, $4,500 USD, due next Friday, add 18% GST, mention payment by bank transfer."
//                 maxLength={4000}
//                 autoFocus
//               />
//             </label>

//             <div className="ai-modal-tips">
//               <span className="mini-chip">Paste WhatsApp or email text</span>
//               <span className="mini-chip">
//                 Mention VAT / GST / tax if known
//               </span>
//               <span className="mini-chip">Ctrl/Cmd + Enter to generate</span>
//             </div>

//             <div className="ai-modal-actions">
//               <button
//                 type="button"
//                 className="btn btn-secondary"
//                 onClick={() => setAiModalOpen(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 className="btn btn-primary"
//                 onClick={() => generateAiCanvasFromPrompt(aiPrompt)}
//                 disabled={normalizeAiPrompt(aiPrompt).length < 12}
//               >
//                 Generate canvas
//               </button>
//             </div>
//           </div>
//         </div>
//       ) : null}
//       <datalist id="invoice-currency-list">
//         {CURRENCY_OPTIONS.map((currencyCode) => (
//           <option key={currencyCode} value={currencyCode} />
//         ))}
//       </datalist>
//       {loading ? (
//         <div className="submit-overlay" aria-live="polite" aria-busy="true">
//           <div className="submit-overlay-card">
//             <div className="submit-overlay-inner">
//               <Spinner size="xl" tone="brand" />
//               <h3>{overlayTitle}</h3>
//               <p>{overlayCopy}</p>
//             </div>
//           </div>
//         </div>
//       ) : null}
//       <div className="invoice-builder-shell">
//         <input
//           ref={logoInputRef}
//           type="file"
//           accept="image/png,image/jpeg,image/webp"
//           onChange={onLogoChange}
//           style={{ display: "none" }}
//         />
//         {error ? <div className="error-banner">{error}</div> : null}

//         <aside className="builder-side-rail builder-side-rail-left">
//           <section className="builder-floating-card tools-rail-card">
//             <div className="tools-rail-head">
//               <h3>Design Tools</h3>
//               <span>Editorial mode</span>
//             </div>

//             <div className="tools-rail-nav">
//               <button type="button" className="tools-rail-item">
//                 <span className="tools-rail-icon">✦</span>
//                 <span>Palette</span>
//               </button>

//               <label className="tools-rail-item tools-rail-upload">
//                 <input
//                   type="file"
//                   accept="application/pdf,.pdf"
//                   multiple
//                   onChange={onAttachmentChange}
//                   style={{ display: "none" }}
//                 />
//                 <span className="tools-rail-icon">⎙</span>
//                 <span>
//                   {attachments.length
//                     ? `Attachments (${attachments.length})`
//                     : "Attachments"}
//                 </span>
//               </label>

//               <button
//                 type="button"
//                 className="tools-rail-item is-active"
//                 onClick={openAiModal}
//               >
//                 <span className="tools-rail-icon">✦</span>
//                 <span>AI Assistant</span>
//               </button>

//               <button type="button" className="tools-rail-item">
//                 <span className="tools-rail-icon">⚙</span>
//                 <span>Settings</span>
//               </button>
//             </div>

//             <div className="tools-rail-section">
//               <span className="tools-section-kicker">Quick palette</span>
//               <div className="tools-palette-grid">
//                 {(
//                   Object.keys(invoice.style.palette) as Array<
//                     keyof StylePalette
//                   >
//                 ).map((key) => (
//                   <label key={key} className="tools-palette-swatch" title={key}>
//                     <input
//                       className="tools-palette-input"
//                       type="color"
//                       value={invoice.style.palette[key]}
//                       onChange={(event) =>
//                         updatePalette(key, event.target.value)
//                       }
//                       aria-label={`Change ${key} color`}
//                     />
//                     <span
//                       className="tools-palette-dot"
//                       style={{ background: invoice.style.palette[key] }}
//                     />
//                     <span className="tools-palette-name">{key}</span>
//                   </label>
//                 ))}
//               </div>
//             </div>

//             <div className="tools-rail-section tools-rail-footer">
//               <span className="tools-section-kicker">Attachments</span>
//               {logoName ? (
//                 <span className="mini-chip">Logo: {logoName}</span>
//               ) : null}
//               {attachments.length ? (
//                 <div className="attachment-list">
//                   {attachments.map((file) => (
//                     <span
//                       key={`${file.name}-${file.size}`}
//                       className="mini-chip"
//                     >
//                       {file.name}
//                     </span>
//                   ))}
//                 </div>
//               ) : (
//                 <span className="mini-chip">Optional extra PDFs</span>
//               )}
//             </div>
//           </section>

//           <section className="builder-floating-card pro-upgrade-card">
//             <span className="pro-kicker">Pro features active</span>
//             <button type="button" className="pro-upgrade-button">
//               Upgrade to Pro
//             </button>
//           </section>
//         </aside>

//         <main className="builder-center-column">
//           <section className="builder-floating-card top-ai-card">
//             <div className="top-ai-card-head">
//               <div className="top-ai-title-row">
//                 <span className="top-ai-sparkle">✦</span>
//                 <strong>AI Co-Designer</strong>
//               </div>
//               <button type="button" className="history-chip">
//                 History
//               </button>
//             </div>

//             <div className="top-ai-input-row">
//               <textarea
//                 className="input-shell ai-brief-textarea top-ai-textarea"
//                 value={aiPrompt}
//                 onChange={(event) => setAiPrompt(event.target.value)}
//                 onKeyDown={handleAiPromptKeyDown}
//                 placeholder="E.g., ‘Make the layout more minimalist’ or ‘Update colors to brand palette’..."
//                 maxLength={4000}
//               />
//               <button
//                 type="button"
//                 className="top-ai-generate"
//                 onClick={() => generateAiCanvasFromPrompt(aiPrompt)}
//               >
//                 <span className="button-icon-text">✦</span>
//                 <span>Generate with AI</span>
//               </button>
//             </div>

//             <div className="top-ai-chip-row">
//               <button
//                 type="button"
//                 className="suggestion-chip"
//                 onClick={() =>
//                   generateAiCanvasFromPrompt("Optimize layout and spacing")
//                 }
//               >
//                 Optimize Layout
//               </button>
//               <button
//                 type="button"
//                 className="suggestion-chip"
//                 onClick={() =>
//                   generateAiCanvasFromPrompt("Refine typography and hierarchy")
//                 }
//               >
//                 Refine Typography
//               </button>
//               <button
//                 type="button"
//                 className="suggestion-chip"
//                 onClick={() =>
//                   generateAiCanvasFromPrompt(
//                     "Add modern flourish and premium polish"
//                   )
//                 }
//               >
//                 Add Modern Flourish
//               </button>
//               <button
//                 type="button"
//                 className="suggestion-chip is-muted"
//                 onClick={clearAiDraft}
//               >
//                 Clear prompt
//               </button>
//             </div>
//           </section>

//           <section
//             className="builder-floating-card canvas-stage-card"
//             ref={canvasStageRef}
//           >
//             <div className="canvas-stage-inner">
//               <div className="canvas-stage-watermark" />
//               <div
//                 ref={canvasViewportRef}
//                 className="invoice-canvas-scroll canvas-primary-scroll stitched-canvas-scroll"
//               >
//                 <div
//                   className="invoice-canvas-stage"
//                   style={{ height: `${PAGE_HEIGHT * canvasScale}px` }}
//                 >
//                   <div
//                     className="invoice-canvas-stage-scale"
//                     style={{ transform: `scale(${canvasScale})` }}
//                   >
//                     <InvoiceCanvasPage
//                       invoice={invoice}
//                       blocks={blocks}
//                       logoDataUrl={logoDataUrl}
//                       selectedBlockId={selectedBlockId}
//                       onSelectBlock={setSelectedBlockId}
//                       onBlockMouseDown={onBlockMouseDown}
//                       onUpdateInvoice={updateInvoice}
//                       onUpdateLineItem={updateLineItem}
//                       onAddLineItem={addLineItem}
//                       onDeleteBlock={deleteBlock}
//                       onLogoPick={openLogoPicker}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </section>

//           <div className="builder-bottom-actions">
//             <button
//               type="button"
//               className="tray-btn tray-btn-ghost"
//               onClick={() => setBlocks(defaultBlocks(invoice.style.templateId))}
//             >
//               <span className="button-icon-text">↺</span>
//               <span>Reset Layout</span>
//             </button>
//             <div className="action-tray-divider" />
//             <button
//               type="button"
//               className="tray-btn tray-btn-primary"
//               onClick={finalizeCanvas}
//             >
//               <span className="button-icon-text">▣</span>
//               <span>Finalize Canvas PDF</span>
//             </button>
//           </div>
//         </main>

//         <aside className="builder-side-rail builder-side-rail-right">
//           <section className="builder-floating-card health-rail-card">
//             <div className="health-rail-head">
//               <h3>Document Health</h3>
//             </div>

//             <div className="health-stack">
//               <div className="health-item is-good">
//                 <div className="health-icon">✓</div>
//                 <div>
//                   <strong>Branding Consistent</strong>
//                   <span>Colors match profile “Pro Editorial”.</span>
//                 </div>
//               </div>

//               <div className="health-item is-warn">
//                 <div className="health-icon">!</div>
//                 <div>
//                   <strong>Attachments Ready</strong>
//                   <span>
//                     {attachments.length
//                       ? `${attachments.length} PDF${
//                           attachments.length > 1 ? "s" : ""
//                         } attached`
//                       : "Optional supporting PDFs can still be added"}
//                   </span>
//                 </div>
//               </div>

//               <div className="health-suggestion-card">
//                 <strong>AI Suggestion</strong>
//                 <p>
//                   Add a softer editorial hierarchy, tighten page chrome, and
//                   keep the invoice sheet as the visual hero.
//                 </p>
//                 <button
//                   type="button"
//                   className="health-cta-button"
//                   onClick={openAiModal}
//                 >
//                   Apply Optimization
//                 </button>
//               </div>

//               <div className="collaboration-card">
//                 <span className="tools-section-kicker">Live collaboration</span>
//                 <div className="collaboration-row">
//                   <span className="collab-avatar">A</span>
//                   <span className="collab-avatar">M</span>
//                   <span className="collab-avatar">J</span>
//                   <span className="collab-plus">+3</span>
//                 </div>
//               </div>
//             </div>
//           </section>
//         </aside>
//       </div>
//       <style jsx global>{`
//         .ai-modal-overlay {
//           position: fixed;
//           inset: 0;
//           z-index: 60;
//           display: grid;
//           place-items: center;
//           padding: 24px;
//           background: rgba(15, 23, 42, 0.44);
//           backdrop-filter: blur(10px);
//         }
//         .ai-modal-card {
//           width: min(720px, 100%);
//           border-radius: 30px;
//           padding: 24px;
//           display: grid;
//           gap: 18px;
//           border: 1px solid rgba(101, 79, 230, 0.14);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.98),
//             rgba(247, 245, 255, 0.96)
//           );
//           box-shadow: 0 30px 80px rgba(15, 23, 42, 0.24);
//         }
//         .ai-modal-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           gap: 16px;
//         }
//         .ai-modal-close {
//           white-space: nowrap;
//         }
//         .ai-modal-textarea,
//         .ai-brief-textarea {
//           min-height: 140px;
//           resize: vertical;
//           line-height: 1.55;
//         }
//         .ai-brief-card {
//           position: relative;
//           overflow: hidden;
//         }
//         .ai-brief-card::after {
//           content: "";
//           position: absolute;
//           inset: auto -30px -30px auto;
//           width: 180px;
//           height: 180px;
//           border-radius: 999px;
//           background: radial-gradient(
//             circle,
//             rgba(91, 140, 255, 0.18),
//             rgba(91, 140, 255, 0)
//           );
//           pointer-events: none;
//         }
//         .ai-empty-state {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 16px;
//           flex-wrap: wrap;
//         }
//         .ai-modal-tips {
//           display: flex;
//           gap: 8px;
//           flex-wrap: wrap;
//         }
//         .ai-modal-actions {
//           display: flex;
//           justify-content: flex-end;
//           gap: 10px;
//           flex-wrap: wrap;
//         }
//         .ai-missing-chip {
//           background: rgba(245, 158, 11, 0.12);
//           border-color: rgba(245, 158, 11, 0.24);
//           color: #9a6700;
//         }
//         .canvas-logo-placeholder {
//           width: 100%;
//           height: 100%;
//           display: grid;
//           place-items: center;
//           gap: 6px;
//           text-align: center;
//           background: repeating-linear-gradient(
//             135deg,
//             rgba(255, 255, 255, 0.94),
//             rgba(255, 255, 255, 0.94) 10px,
//             rgba(241, 245, 249, 0.94) 10px,
//             rgba(241, 245, 249, 0.94) 20px
//           );
//           color: #0f172a;
//         }
//         .canvas-logo-placeholder-badge {
//           width: 44px;
//           height: 44px;
//           border-radius: 999px;
//           display: grid;
//           place-items: center;
//           background: rgba(15, 23, 42, 0.9);
//           color: #fff;
//           font-weight: 900;
//         }
//         .canvas-logo-placeholder-copy {
//           font-size: 0.76rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//           opacity: 0.72;
//         }
//         .invoice-builder-shell {
//           min-height: 100vh;
//           display: grid;
//           grid-template-columns: 156px minmax(0, 720px) 156px;
//           justify-content: center;
//           gap: 16px;
//           align-items: start;
//           padding: 18px 12px 28px;
//           background: radial-gradient(
//               circle at top,
//               rgba(255, 255, 255, 0.14),
//               transparent 34%
//             ),
//             linear-gradient(180deg, #4f1fd7 0%, #6f1df2 48%, #7e25ff 100%);
//         }
//         .builder-side-rail {
//           position: sticky;
//           top: 18px;
//         }
//         .builder-center-column {
//           display: grid;
//           gap: 14px;
//           justify-items: center;
//         }
//         .builder-floating-card {
//           width: 100%;
//           border-radius: 18px;
//           border: 1px solid rgba(255, 255, 255, 0.2);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.9),
//             rgba(236, 229, 255, 0.86)
//           );
//           box-shadow: 0 18px 44px rgba(44, 12, 122, 0.28),
//             inset 0 1px 0 rgba(255, 255, 255, 0.42);
//           backdrop-filter: blur(14px);
//         }
//         .tools-rail-card,
//         .health-rail-card {
//           padding: 14px;
//           gap: 14px;
//           display: grid;
//         }
//         .tools-rail-head,
//         .health-rail-head {
//           display: grid;
//           gap: 2px;
//         }
//         .tools-rail-head h3,
//         .health-rail-head h3 {
//           margin: 0;
//           font-size: 0.95rem;
//           color: #24124f;
//           letter-spacing: -0.03em;
//         }
//         .tools-rail-head span {
//           font-size: 0.66rem;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//           color: rgba(36, 18, 79, 0.62);
//           font-weight: 700;
//         }
//         .tools-rail-nav {
//           display: grid;
//           gap: 8px;
//         }
//         .tools-rail-item {
//           width: 100%;
//           border: 0;
//           background: transparent;
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           padding: 10px 12px;
//           border-radius: 12px;
//           color: #43346b;
//           font-weight: 700;
//           cursor: pointer;
//           text-align: left;
//         }
//         .tools-rail-item.is-active {
//           background: rgba(255, 255, 255, 0.88);
//           color: #5130d6;
//           box-shadow: 0 10px 18px rgba(81, 48, 214, 0.14);
//         }
//         .tools-rail-dot {
//           width: 8px;
//           height: 8px;
//           border-radius: 999px;
//           background: currentColor;
//           opacity: 0.72;
//         }
//         .tools-rail-footer {
//           display: grid;
//           gap: 8px;
//           margin-top: 4px;
//         }
//         .top-ai-card {
//           padding: 12px 14px;
//           display: grid;
//           gap: 10px;
//         }
//         .top-ai-card-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 10px;
//           color: #2a1959;
//           font-size: 0.78rem;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//         }
//         .top-ai-input-row {
//           display: grid;
//           grid-template-columns: minmax(0, 1fr) auto;
//           gap: 10px;
//           align-items: start;
//         }
//         .top-ai-textarea {
//           min-height: 56px;
//           max-height: 84px;
//           resize: none;
//           border-radius: 14px;
//           background: rgba(255, 255, 255, 0.82);
//         }
//         .top-ai-generate {
//           align-self: stretch;
//           min-width: 148px;
//           //   min-height: 50px;
//         }
//         .top-ai-chip-row {
//           display: flex;
//           gap: 8px;
//           flex-wrap: wrap;
//         }
//         .action-chip {
//           cursor: pointer;
//         }
//         .canvas-stage-busy-overlay {
//           position: absolute;
//           inset: 16px;
//           z-index: 8;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           gap: 12px;
//           padding: 16px;
//           border-radius: 24px;
//           background: rgba(255, 255, 255, 0.8);
//           backdrop-filter: blur(8px);
//           box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
//         }
//         .canvas-stage-card {
//           position: relative;
//           padding: 14px;
//         }
//         .canvas-stage-inner {
//           display: grid;
//           grid-template-columns: minmax(0, 1fr) 64px;
//           gap: 12px;
//           align-items: start;
//         }
//         .canvas-inline-palette {
//           display: flex;
//           justify-content: center;
//         }
//         .palette-rail {
//           display: grid;
//           gap: 10px;
//           padding: 8px 6px;
//           border-radius: 18px;
//           background: rgba(255, 255, 255, 0.72);
//           border: 1px solid rgba(89, 61, 196, 0.12);
//         }
//         .palette-rail-swatch {
//           position: relative;
//           width: 42px;
//           display: grid;
//           justify-items: center;
//           gap: 5px;
//           padding: 8px 4px;
//           border-radius: 14px;
//           background: rgba(255, 255, 255, 0.86);
//           border: 1px solid rgba(15, 23, 42, 0.06);
//           cursor: pointer;
//         }
//         .palette-swatch-input {
//           position: absolute;
//           inset: 0;
//           opacity: 0;
//           cursor: pointer;
//         }
//         .palette-swatch-dot {
//           width: 22px;
//           height: 22px;
//           border-radius: 999px;
//           box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08),
//             0 10px 20px rgba(15, 23, 42, 0.12);
//         }
//         .palette-rail-label {
//           font-size: 0.5rem;
//           font-weight: 800;
//           letter-spacing: 0.08em;
//           color: #726790;
//         }
//         .builder-bottom-actions {
//           display: flex;
//           justify-content: center;
//           gap: 10px;
//           flex-wrap: wrap;
//           padding: 8px 12px 0;
//         }
//         .invoice-panel-card {
//           border-radius: 18px;
//           border: 1px solid rgba(255, 255, 255, 0.24);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.97),
//             rgba(246, 240, 255, 0.92)
//           );
//           box-shadow: 0 18px 44px rgba(44, 12, 122, 0.18);
//           padding: 18px;
//           display: grid;
//           gap: 14px;
//         }
//         .invoice-panel-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 8px;
//         }
//         .invoice-panel-head h2 {
//           margin: 0;
//           font-size: 0.9rem;
//           letter-spacing: -0.03em;
//         }
//         .attachment-list {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 8px;
//         }
//         .canvas-primary-scroll,
//         .stitched-canvas-scroll {
//           min-width: 0;
//         }
//         .invoice-canvas-scroll {
//           overflow: hidden;
//           padding: 16px;
//           border-radius: 26px;
//           border: 1px solid rgba(108, 77, 220, 0.12);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.98),
//             rgba(240, 236, 255, 0.9)
//           );
//           box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.46),
//             0 20px 46px rgba(47, 18, 130, 0.16);
//         }
//         .health-stack {
//           display: grid;
//           gap: 10px;
//         }
//         .health-item,
//         .health-suggestion-card {
//           border-radius: 14px;
//           padding: 12px;
//           display: grid;
//           gap: 6px;
//           background: rgba(255, 255, 255, 0.72);
//           border: 1px solid rgba(255, 255, 255, 0.34);
//         }
//         .health-item strong,
//         .health-suggestion-card strong {
//           color: #291854;
//           font-size: 0.8rem;
//         }
//         .health-item span,
//         .health-suggestion-card p {
//           margin: 0;
//           font-size: 0.68rem;
//           line-height: 1.45;
//           color: #6f6690;
//         }
//         .health-item.is-good {
//           box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.18);
//         }
//         .health-item.is-warn {
//           box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.18);
//         }
//         .health-suggestion-card {
//           background: linear-gradient(180deg, #6a4df1 0%, #5a39dd 100%);
//         }
//         .health-suggestion-card strong,
//         .health-suggestion-card p {
//           color: #fff;
//         }
//         .invoice-canvas-stage {
//           width: 100%;
//           display: flex;
//           justify-content: center;
//           align-items: flex-start;
//           overflow: hidden;
//         }
//         .invoice-canvas-stage-scale {
//           transform-origin: top center;
//           will-change: transform;
//         }
//         .invoice-canvas-page {
//           position: relative;
//           margin: 0 auto;
//           border-radius: 32px;
//           overflow: hidden;
//           box-shadow: 0 30px 70px rgba(66, 74, 130, 0.18);
//         }
//         .invoice-canvas-bg,
//         .invoice-canvas-line {
//           position: absolute;
//           inset: 0;
//           pointer-events: none;
//         }
//         .invoice-canvas-bg-luxury {
//           inset: 0 0 auto 0;
//           height: 250px;
//         }
//         .invoice-canvas-bg-creative {
//           inset: 0 0 auto 0;
//           height: 220px;
//         }
//         .invoice-canvas-bg-creative-accent {
//           inset: 0 0 auto auto;
//           width: 160px;
//           height: 220px;
//           opacity: 0.92;
//         }
//         .invoice-canvas-bg-corporate {
//           inset: 0 auto auto 0;
//           width: 132px;
//           height: 155px;
//         }
//         .invoice-canvas-line {
//           inset: 118px 40px auto 40px;
//           height: 1px;
//           border-top: 1px solid transparent;
//         }
//         .canvas-block {
//           position: absolute;
//           padding: 10px;
//           border: 1px solid rgba(15, 23, 42, 0.06);
//           backdrop-filter: blur(8px);
//           box-shadow: none !important;
//           transition: box-shadow 0.18s ease, border-color 0.18s ease;
//         }
//         .canvas-block:hover {
//           box-shadow: 0 10px 24px rgba(77, 88, 138, 0.08);
//         }
//         .canvas-drag-handle {
//           position: absolute;
//           top: 8px;
//           right: 38px;
//           z-index: 3;
//           width: 26px;
//           height: 26px;
//           border: 0;
//           border-radius: 999px;
//           background: rgba(15, 23, 42, 0.08);
//           color: inherit;
//           font-weight: 900;
//           opacity: 0.22;
//           transition: opacity 0.2s ease, transform 0.2s ease;
//         }
//         .canvas-delete-handle {
//           position: absolute;
//           top: 8px;
//           right: 8px;
//           z-index: 3;
//           width: 26px;
//           height: 26px;
//           border: 0;
//           border-radius: 999px;
//           background: rgba(239, 68, 68, 0.12);
//           color: #b91c1c;
//           font-size: 1rem;
//           font-weight: 900;
//           opacity: 0.22;
//           transition: opacity 0.2s ease, transform 0.2s ease;
//         }
//         .canvas-block:hover .canvas-drag-handle,
//         .canvas-block:hover .canvas-delete-handle,
//         .canvas-block.is-selected .canvas-drag-handle,
//         .canvas-block.is-selected .canvas-delete-handle {
//           opacity: 1;
//         }
//         .canvas-logo-inner {
//           width: 100%;
//           height: 100%;
//           display: grid;
//           place-items: center;
//           overflow: hidden;
//           border-radius: inherit;
//           font-size: 1.2rem;
//           font-weight: 900;
//           color: #fff;
//           background: rgba(15, 23, 42, 0.9);
//           border: 0;
//           padding: 0;
//         }
//         .canvas-logo-inner.is-uploadable {
//           cursor: pointer;
//         }
//         .canvas-logo-inner.is-uploadable:hover {
//           box-shadow: inset 0 0 0 2px rgba(22, 64, 214, 0.32);
//         }
//         .canvas-logo-image {
//           width: 100%;
//           height: 100%;
//           object-fit: contain;
//           background: #fff;
//         }
//         .canvas-inline-input,
//         .canvas-inline-textarea,
//         .canvas-inline-currency,
//         .canvas-inline-amount {
//           width: 100%;
//           border: 0;
//           outline: none;
//           background: transparent;
//           padding: 0;
//           color: inherit;
//           font: inherit;
//           font-size: 0.64rem;
//         }
//         .canvas-inline-input.is-readonly,
//         .canvas-inline-amount.is-readonly {
//           cursor: default;
//         }
//         .canvas-inline-input::placeholder,
//         .canvas-inline-textarea::placeholder {
//           color: inherit;
//           opacity: 0.45;
//         }
//         .canvas-inline-title {
//           font-size: 0.72rem;
//           font-weight: 700;
//           letter-spacing: 0.02em;
//           text-transform: uppercase;
//         }
//         .canvas-inline-number {
//           font-size: 1.2rem;
//           font-weight: 800;
//           letter-spacing: -0.04em;
//         }
//         .canvas-inline-textarea {
//           resize: none;
//           min-height: 34px;
//           line-height: 1.35;
//         }
//         .canvas-inline-notes {
//           min-height: 48px;
//         }
//         .canvas-amount-shell,
//         .canvas-multiline-card,
//         .canvas-meta-grid,
//         .canvas-notes-shell {
//           display: grid;
//           gap: 8px;
//           height: 100%;
//         }
//         .canvas-kicker {
//           font-size: 0.52rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//           opacity: 0.74;
//         }
//         .canvas-amount-row {
//           display: grid;
//           grid-template-columns: 46px 1fr;
//           gap: 6px;
//           align-items: center;
//           margin-top: 2px;
//         }
//         .canvas-inline-currency {
//           font-size: 0.62rem;
//           font-weight: 800;
//         }
//         .canvas-inline-amount {
//           font-size: 1.38rem;
//           font-weight: 800;
//           letter-spacing: -0.04em;
//         }
//         .canvas-subtle-copy {
//           margin-top: auto;
//           font-size: 0.54rem;
//           opacity: 0.75;
//         }
//         .canvas-dual-row {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 8px;
//         }
//         .canvas-meta-grid {
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           align-content: start;
//         }
//         .canvas-table-shell {
//           display: grid;
//           grid-template-rows: auto 1fr auto auto;
//           gap: 8px;
//           height: 100%;
//         }
//         .canvas-table-head,
//         .canvas-table-row {
//           display: grid;
//           grid-template-columns: 1.78fr 0.42fr 0.56fr 0.56fr 0.78fr;
//           gap: 6px;
//           align-items: center;
//         }
//         .canvas-table-head {
//           padding: 8px 10px;
//           border-radius: 14px;
//           font-size: 0.56rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.04em;
//         }
//         .canvas-table-body {
//           display: grid;
//           gap: 8px;
//           overflow: auto;
//           align-content: start;
//         }
//         .canvas-table-row {
//           padding: 7px 8px;
//           border-radius: 12px;
//           background: rgba(255, 255, 255, 0.72);
//           border: 1px solid rgba(15, 23, 42, 0.06);
//         }
//         .canvas-table-add {
//           justify-self: start;
//           border: 0;
//           border-radius: 999px;
//           padding: 7px 11px;
//           background: rgba(15, 23, 42, 0.07);
//           font-size: 0.62rem;
//           font-weight: 800;
//           color: inherit;
//         }
//         .canvas-table-currency {
//           text-transform: uppercase;
//           letter-spacing: 0.04em;
//         }
//         .canvas-table-summary {
//           display: grid;
//           gap: 6px;
//           margin-top: auto;
//           margin-left: auto;
//           width: min(320px, 100%);
//           padding-top: 10px;
//           border-top: 1px solid rgba(15, 23, 42, 0.1);
//         }
//         .canvas-table-summary > div {
//           width: 100%;
//           display: grid;
//           grid-template-columns: minmax(0, 1fr) auto;
//           gap: 16px;
//           align-items: center;
//           font-size: 0.62rem;
//           line-height: 1.3;
//         }
//         .canvas-table-summary > div > span {
//           text-align: right;
//           color: rgba(15, 23, 42, 0.78);
//           font-weight: 700;
//         }
//         .canvas-table-summary > div.is-grand {
//           margin-top: 2px;
//           padding-top: 8px;
//           border-top: 1px solid rgba(15, 23, 42, 0.14);
//           font-size: 0.72rem;
//         }
//         .canvas-table-summary > div.is-grand > span {
//           color: inherit;
//           font-weight: 800;
//         }
//         .canvas-table-summary strong {
//           font-size: inherit;
//         }
//         .canvas-table-summary-value {
//           min-width: 128px;
//           text-align: right;
//           white-space: nowrap;
//           font-variant-numeric: tabular-nums;
//         }
//         .canvas-tax-summary-label {
//           display: inline-flex;
//           align-items: center;
//           justify-content: flex-end;
//           gap: 3px;
//           flex-wrap: wrap;
//         }
//         .canvas-inline-tax-rate {
//           width: 38px;
//           min-width: 38px;
//           text-align: center;
//           font-weight: 800;
//           padding: 0;
//         }
//         .canvas-notes-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 8px;
//         }
//         .canvas-mini-action {
//           border: 0;
//           border-radius: 999px;
//           padding: 4px 8px;
//           background: rgba(15, 23, 42, 0.08);
//           color: inherit;
//           font-size: 0.56rem;
//           font-weight: 800;
//         }
//         .invoice-footer-preview {
//           position: absolute;
//           left: 16px;
//           right: 16px;
//           bottom: 12px;
//           height: 74px;
//           border-radius: 22px;
//           border: 1px solid rgba(15, 23, 42, 0.1);
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 14px;
//           padding: 12px 16px;
//         }
//         .invoice-footer-copy {
//           display: grid;
//           gap: 3px;
//           font-size: 0.62rem;
//         }
//         .invoice-footer-link {
//           font-weight: 800;
//         }
//         .invoice-footer-qr {
//           width: 54px;
//           height: 54px;
//           border-radius: 14px;
//           display: grid;
//           place-items: center;
//           background: #fff;
//           color: #111827;
//           font-weight: 900;
//           border: 1px solid rgba(15, 23, 42, 0.08);
//         }
//         .palette-grid {
//           display: grid;
//           gap: 10px;
//         }
//         .palette-row {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 12px;
//           border-radius: 16px;
//           padding: 8px 10px;
//           background: rgba(255, 255, 255, 0.76);
//           border: 1px solid rgba(15, 23, 42, 0.06);
//           font-weight: 700;
//           text-transform: capitalize;
//         }
//         .palette-row input {
//           width: 42px;
//           height: 42px;
//           border: 0;
//           background: transparent;
//           padding: 0;
//         }
//         .design-options-grid {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 14px;
//         }
//         .design-option-card {
//           width: 100%;
//           border-radius: 26px;
//           padding: 14px;
//           display: grid;
//           gap: 12px;
//           text-align: left;
//           box-shadow: var(--shadow-soft);
//         }
//         .design-option-card.is-active {
//           outline: 2px solid currentColor;
//         }
//         .premium-template-header {
//           display: flex;
//           justify-content: space-between;
//           gap: 10px;
//           align-items: center;
//           flex-wrap: wrap;
//         }
//         .premium-template-title {
//           font-weight: 800;
//           font-size: 1.05rem;
//           letter-spacing: -0.03em;
//         }
//         .mini-canvas-frame {
//           overflow: hidden;
//           border-radius: 18px;
//           background: rgba(255, 255, 255, 0.54);
//           border: 1px solid rgba(15, 23, 42, 0.08);
//           height: 236px;
//           position: relative;
//         }
//         .mini-canvas-scale {
//           position: absolute;
//           top: 0;
//           left: 0;
//           transform: scale(0.28);
//           transform-origin: top left;
//           width: ${PAGE_WIDTH}px;
//           height: ${PAGE_HEIGHT}px;
//         }
//         .invoice-builder-shell {
//           min-height: 100vh;
//           display: grid;
//           grid-template-columns: 228px minmax(0, 850px) 228px;
//           justify-content: center;
//           gap: 18px;
//           align-items: start;
//           padding: 18px 16px 36px;
//           background: radial-gradient(
//               circle at top,
//               rgba(255, 255, 255, 0.14),
//               transparent 34%
//             ),
//             linear-gradient(180deg, #4b1fd2 0%, #651be7 52%, #781ef0 100%);
//         }
//         .builder-side-rail {
//           position: sticky;
//           top: 18px;
//           display: grid;
//           gap: 14px;
//         }
//         .builder-side-rail-left,
//         .builder-side-rail-right {
//           width: 228px;
//         }
//         .builder-center-column {
//           width: min(100%, 850px);
//           display: grid;
//           gap: 14px;
//           justify-items: center;
//         }
//         .builder-floating-card {
//           width: 100%;
//           border-radius: 18px;
//           border: 1px solid rgba(255, 255, 255, 0.18);
//           background: linear-gradient(
//             180deg,
//             rgba(238, 225, 255, 0.92),
//             rgba(218, 194, 252, 0.88)
//           );
//           box-shadow: 0 20px 52px rgba(35, 10, 106, 0.22),
//             inset 0 1px 0 rgba(255, 255, 255, 0.3);
//           backdrop-filter: blur(18px);
//         }
//         .tools-rail-card,
//         .health-rail-card {
//           padding: 14px;
//           display: grid;
//           gap: 14px;
//         }
//         .tools-rail-head,
//         .health-rail-head {
//           display: grid;
//           gap: 4px;
//         }
//         .tools-rail-head h3,
//         .health-rail-head h3 {
//           margin: 0;
//           color: #1e143f;
//           font-size: 1rem;
//           font-weight: 800;
//           letter-spacing: -0.03em;
//         }
//         .tools-rail-head span,
//         .tools-section-kicker,
//         .pro-kicker {
//           font-size: 0.63rem;
//           line-height: 1;
//           text-transform: uppercase;
//           letter-spacing: 0.14em;
//           color: rgba(30, 20, 63, 0.58);
//           font-weight: 800;
//         }
//         .tools-rail-nav {
//           display: grid;
//           gap: 8px;
//         }
//         .tools-rail-item {
//           width: 100%;
//           border: 0;
//           background: transparent;
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           padding: 11px 12px;
//           border-radius: 12px;
//           color: #544873;
//           font-size: 0.76rem;
//           font-weight: 700;
//           cursor: pointer;
//           text-align: left;
//           transition: background 0.2s ease, transform 0.2s ease, color 0.2s ease;
//         }
//         .tools-rail-item:hover {
//           background: rgba(255, 255, 255, 0.34);
//         }
//         .tools-rail-item.is-active {
//           background: rgba(255, 255, 255, 0.88);
//           color: #4c32cc;
//           box-shadow: 0 10px 22px rgba(79, 51, 204, 0.16);
//         }
//         .tools-rail-icon {
//           width: 18px;
//           display: inline-grid;
//           place-items: center;
//           font-size: 0.86rem;
//           opacity: 0.86;
//         }
//         .tools-rail-section {
//           display: grid;
//           gap: 10px;
//         }
//         .tools-palette-grid {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 8px;
//         }
//         .tools-palette-swatch {
//           position: relative;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           padding: 8px 10px;
//           border-radius: 12px;
//           background: rgba(255, 255, 255, 0.54);
//           cursor: pointer;
//           min-width: 0;
//         }
//         .tools-palette-input {
//           position: absolute;
//           inset: 0;
//           opacity: 0;
//           cursor: pointer;
//         }
//         .tools-palette-dot {
//           width: 16px;
//           height: 16px;
//           border-radius: 999px;
//           box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08);
//           flex: 0 0 auto;
//         }
//         .tools-palette-name {
//           min-width: 0;
//           overflow: hidden;
//           text-overflow: ellipsis;
//           white-space: nowrap;
//           font-size: 0.66rem;
//           font-weight: 700;
//           text-transform: capitalize;
//           color: #4a4165;
//         }
//         .tools-rail-footer {
//           margin-top: 2px;
//         }
//         .attachment-list {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 8px;
//         }
//         .pro-upgrade-card {
//           padding: 14px;
//           display: grid;
//           gap: 10px;
//           justify-items: center;
//           text-align: center;
//         }
//         .pro-upgrade-button {
//           width: 100%;
//           border: 0;
//           border-radius: 12px;
//           padding: 10px 12px;
//           color: #fff;
//           font-weight: 800;
//           background: linear-gradient(135deg, #1f4dd8 0%, #003fab 100%);
//           box-shadow: 0 14px 28px rgba(0, 63, 171, 0.26);
//         }
//         .top-ai-card {
//           width: min(100%, 850px);
//           padding: 14px;
//           display: grid;
//           gap: 12px;
//           background: linear-gradient(
//             180deg,
//             rgba(237, 224, 255, 0.94),
//             rgba(217, 193, 251, 0.9)
//           );
//         }
//         .top-ai-card-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 10px;
//         }
//         .top-ai-title-row {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           color: #1e143f;
//           font-size: 0.74rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.12em;
//         }
//         .top-ai-sparkle {
//           color: #244fd4;
//           font-size: 0.95rem;
//         }
//         .history-chip {
//           border: 0;
//           background: transparent;
//           color: rgba(30, 20, 63, 0.46);
//           font-size: 0.64rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.12em;
//           cursor: pointer;
//         }
//         .top-ai-input-row {
//           display: grid;
//           grid-template-columns: minmax(0, 1fr) auto;
//           gap: 10px;
//           align-items: start;
//         }
//         .top-ai-textarea {
//           min-height: 54px;
//           max-height: 84px;
//           padding: 14px 16px;
//           resize: none;
//           border: 0;
//           border-radius: 12px;
//           background: rgba(255, 255, 255, 0.5);
//           box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
//           font-size: 0.86rem;
//         }
//         .top-ai-generate {
//           //   align-self: stretch;
//           align-self: center;

//           border: 0;
//           border-radius: 12px;
//           padding: 0 18px;
//           min-width: 182px;
//           height: 50px;
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           gap: 8px;
//           color: #fff;
//           font-weight: 800;
//           background: linear-gradient(135deg, #003fab 0%, #0455dd 100%);
//           box-shadow: 0 16px 30px rgba(0, 63, 171, 0.24);
//           cursor: pointer;
//         }
//         .button-icon-text {
//           display: inline-grid;
//           place-items: center;
//           font-size: 0.9rem;
//           line-height: 1;
//         }
//         .top-ai-chip-row {
//           display: flex;
//           gap: 8px;
//           flex-wrap: wrap;
//         }
//         .suggestion-chip {
//           border: 1px solid rgba(255, 255, 255, 0.34);
//           border-radius: 999px;
//           padding: 8px 12px;
//           background: rgba(255, 255, 255, 0.44);
//           color: #5d5578;
//           font-size: 0.67rem;
//           font-weight: 700;
//           cursor: pointer;
//         }
//         .suggestion-chip.is-muted {
//           background: rgba(255, 255, 255, 0.26);
//           color: rgba(30, 20, 63, 0.58);
//         }
//         .canvas-stage-card {
//           width: min(100%, 850px);
//           padding: 14px;
//           background: rgba(255, 255, 255, 0.16);
//         }
//         .canvas-stage-inner {
//           position: relative;
//           display: block;
//         }
//         .canvas-stage-watermark {
//           position: absolute;
//           top: -14px;
//           right: -6px;
//           width: 220px;
//           height: 220px;
//           border-radius: 999px;
//           background: radial-gradient(
//             circle,
//             rgba(255, 255, 255, 0.18) 0%,
//             rgba(255, 255, 255, 0) 70%
//           );
//           pointer-events: none;
//         }
//         .invoice-canvas-scroll {
//           overflow: hidden;
//           padding: 18px;
//           border: 0;
//           border-radius: 16px;
//           background: rgba(255, 255, 255, 0.12);
//           box-shadow: none;
//         }
//         .invoice-canvas-page {
//           border-radius: 12px;
//           overflow: hidden;
//           box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
//         }
//         .builder-bottom-actions {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           gap: 0;
//           padding: 7px;
//           border-radius: 16px;
//           background: rgba(238, 221, 255, 0.84);
//           border: 1px solid rgba(255, 255, 255, 0.28);
//           box-shadow: 0 18px 34px rgba(40, 9, 121, 0.18);
//           backdrop-filter: blur(16px);
//         }
//         .action-tray-divider {
//           width: 1px;
//           align-self: stretch;
//           background: rgba(89, 72, 141, 0.16);
//           margin: 2px 4px;
//         }
//         .tray-btn {
//           border: 0;
//           border-radius: 12px;
//           padding: 11px 16px;
//           display: inline-flex;
//           align-items: center;
//           gap: 8px;
//           font-size: 0.78rem;
//           font-weight: 800;
//           cursor: pointer;
//         }
//         .tray-btn-ghost {
//           background: rgba(255, 255, 255, 0.42);
//           color: #4d4a5a;
//         }
//         .tray-btn-primary {
//           background: linear-gradient(135deg, #003fab 0%, #0455dd 100%);
//           color: #fff;
//           box-shadow: 0 14px 26px rgba(0, 63, 171, 0.24);
//         }
//         .health-rail-card {
//           gap: 14px;
//         }
//         .health-stack {
//           display: grid;
//           gap: 12px;
//         }
//         .health-item {
//           display: grid;
//           grid-template-columns: auto 1fr;
//           gap: 12px;
//           align-items: start;
//           border-radius: 12px;
//           padding: 12px;
//           background: rgba(255, 255, 255, 0.42);
//         }
//         .health-icon {
//           width: 28px;
//           height: 28px;
//           border-radius: 999px;
//           display: grid;
//           place-items: center;
//           font-size: 0.84rem;
//           font-weight: 900;
//           background: rgba(255, 255, 255, 0.8);
//         }
//         .health-item.is-good .health-icon {
//           color: #16a34a;
//         }
//         .health-item.is-warn .health-icon {
//           color: #d97706;
//         }
//         .health-item strong,
//         .health-suggestion-card strong {
//           display: block;
//           color: #26194c;
//           font-size: 0.78rem;
//           margin-bottom: 4px;
//         }
//         .health-item span,
//         .health-suggestion-card p {
//           margin: 0;
//           color: #645c81;
//           font-size: 0.66rem;
//           line-height: 1.45;
//         }
//         .health-suggestion-card {
//           border-radius: 14px;
//           padding: 14px;
//           display: grid;
//           gap: 10px;
//           background: linear-gradient(180deg, #6a4df1 0%, #5332d1 100%);
//           box-shadow: 0 18px 30px rgba(73, 47, 188, 0.24);
//         }
//         .health-suggestion-card strong,
//         .health-suggestion-card p {
//           color: #fff;
//         }
//         .health-cta-button {
//           border: 1px solid rgba(255, 255, 255, 0.18);
//           border-radius: 12px;
//           padding: 10px 12px;
//           background: rgba(255, 255, 255, 0.16);
//           color: #fff;
//           font-size: 0.72rem;
//           font-weight: 800;
//           cursor: pointer;
//         }
//         .collaboration-card {
//           display: grid;
//           gap: 10px;
//           padding-top: 4px;
//         }
//         .collaboration-row {
//           display: flex;
//           align-items: center;
//         }
//         .collab-avatar,
//         .collab-plus {
//           width: 30px;
//           height: 30px;
//           border-radius: 999px;
//           display: grid;
//           place-items: center;
//           margin-left: -6px;
//           font-size: 0.68rem;
//           font-weight: 800;
//           border: 2px solid rgba(255, 255, 255, 0.9);
//           background: linear-gradient(135deg, #0f172a, #334155);
//           color: #fff;
//         }
//         .collaboration-row > :first-child {
//           margin-left: 0;
//         }
//         .collab-plus {
//           background: rgba(255, 255, 255, 0.7);
//           color: #4934b2;
//         }
//         @media (max-width: 900px) {
//           .ai-modal-overlay {
//             padding: 12px;
//           }
//           .ai-modal-card {
//             padding: 18px;
//           }
//           .ai-modal-head,
//           .ai-empty-state {
//             flex-direction: column;
//             align-items: stretch;
//           }
//         }
//         @media (max-width: 1120px) {
//           .invoice-builder-shell {
//             grid-template-columns: 1fr;
//           }
//           .builder-side-rail {
//             position: static;
//           }
//           .builder-side-rail-left,
//           .builder-side-rail-right,
//           .builder-center-column,
//           .top-ai-card,
//           .canvas-stage-card {
//             width: min(850px, 100%);
//             margin: 0 auto;
//           }
//           .builder-side-rail-left {
//             order: 2;
//           }
//           .builder-side-rail-right {
//             order: 3;
//           }
//           .top-ai-input-row {
//             grid-template-columns: 1fr;
//           }
//         }
//         @media (max-width: 720px) {
//           .invoice-builder-shell {
//             padding-inline: 10px;
//           }
//           .invoice-canvas-scroll {
//             padding: 8px;
//           }
//           .builder-bottom-actions {
//             width: 100%;
//             flex-wrap: wrap;
//           }
//           .action-tray-divider {
//             display: none;
//           }
//           .tray-btn {
//             width: 100%;
//             justify-content: center;
//           }
//           .tools-palette-grid {
//             grid-template-columns: 1fr;
//           }
//         }
//       `}</style>
//     </>
//   );
// }
// "use client";

// import type {
//   ChangeEvent,
//   KeyboardEvent as ReactKeyboardEvent,
//   MouseEvent as ReactMouseEvent,
// } from "react";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { Spinner } from "../../../components/ui/spinner";
// import { useToast } from "../../../components/ui/toast-provider";
// import {
//   clearPendingInvoiceDraft,
//   loadPendingInvoiceDraft,
// } from "../../../lib/invoice-draft-transfer";

// type LoadingState = null | "ai" | "ai-draft" | "finalize";

// const MAX_LOGO_SIZE_BYTES = 4 * 1024 * 1024;
// const MAX_ATTACHMENT_SIZE_BYTES = 12 * 1024 * 1024;
// const MAX_ATTACHMENTS = 10;

// type LineItem = {
//   description: string;
//   quantity: string;
//   unitPrice: string;
//   amount: string;
// };

// type StylePalette = {
//   primary: string;
//   secondary: string;
//   surface: string;
//   surfaceAlt: string;
//   text: string;
//   muted: string;
//   accent: string;
// };

// type StyleTheme = {
//   templateId: string;
//   styleName: string;
//   accentLabel: string;
//   hierarchyStyle: string;
//   tone: string;
//   lineItemPresentation: string;
//   footerStyle: string;
//   trustBadge: string;
//   previewSummary: string;
//   headerTitle: string;
//   heroCopy: string;
//   palette: StylePalette;
// };

// type CanvasBlock = {
//   id: string;
//   type: string;
//   x: number;
//   y: number;
//   w: number;
//   h: number;
//   z?: number;
//   locked?: boolean;
//   editable?: boolean;
//   content?: string;
//   binding?: { key?: string };
//   style?: {
//     fontSize?: number;
//     fontWeight?: string;
//     color?: string;
//     background?: string;
//     align?: string;
//     radius?: number;
//   };
// };

// type InvoiceDraftOption = {
//   title: string;
//   accentLabel: string;
//   templateId: string;
//   styleDirection: string;
//   style: StyleTheme;
//   blocks: CanvasBlock[];
//   summary: string;
// };

// type AiCanvasDraftResult = InvoiceDraftOption & {
//   promptSummary: string;
//   missingFields: string[];
//   invoice: InvoiceState;
// };

// type InvoiceState = {
//   invoiceNumber: string;
//   customerName: string;
//   amount: string;
//   currency: string;
//   taxPercentage: string;
//   discountPercentage: string;
//   issueDate: string;
//   dueDate: string;
//   notes: string;
//   paymentTerms: string;
//   issuerName: string;
//   issuerEmail: string;
//   issuerAddress: string;
//   accentLabel: string;
//   lineItems: LineItem[];
//   style: StyleTheme;
// };

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
// const PAGE_WIDTH = 595.28;
// const PAGE_HEIGHT = 841.89;
// const FOOTER_HEIGHT = 92;
// const intlWithSupportedValues = Intl as typeof Intl & {
//   supportedValuesOf?: (key: string) => string[];
// };
// const FALLBACK_CURRENCY_OPTIONS = [
//   "USD",
//   "EUR",
//   "GBP",
//   "INR",
//   "JPY",
//   "CNY",
//   "AUD",
//   "CAD",
//   "NZD",
//   "SGD",
//   "HKD",
//   "AED",
//   "SAR",
//   "QAR",
//   "KWD",
//   "BHD",
//   "OMR",
//   "CHF",
//   "SEK",
//   "NOK",
//   "DKK",
//   "ISK",
//   "PLN",
//   "CZK",
//   "HUF",
//   "RON",
//   "BGN",
//   "TRY",
//   "RUB",
//   "UAH",
//   "ZAR",
//   "NGN",
//   "KES",
//   "GHS",
//   "EGP",
//   "MAD",
//   "MXN",
//   "BRL",
//   "ARS",
//   "CLP",
//   "COP",
//   "PEN",
//   "UYU",
//   "PYG",
//   "BOB",
//   "CRC",
//   "DOP",
//   "JMD",
//   "TTD",
//   "BBD",
//   "BSD",
//   "BMD",
//   "KRW",
//   "THB",
//   "VND",
//   "IDR",
//   "MYR",
//   "PHP",
//   "TWD",
//   "PKR",
//   "BDT",
//   "LKR",
//   "NPR",
//   "ILS",
// ];
// const CURRENCY_OPTIONS = Array.from(
//   new Set(
//     (typeof intlWithSupportedValues.supportedValuesOf === "function"
//       ? intlWithSupportedValues.supportedValuesOf("currency")
//       : FALLBACK_CURRENCY_OPTIONS
//     ).map((code) => code.toUpperCase())
//   )
// ).sort();
// const CURRENCY_OPTION_SET = new Set(CURRENCY_OPTIONS);
// const CURRENCY_DETECTION_RULES: Array<{ pattern: RegExp; code: string }> = [
//   { pattern: /US\$/i, code: "USD" },
//   { pattern: /A\$/i, code: "AUD" },
//   { pattern: /C\$/i, code: "CAD" },
//   { pattern: /NZ\$/i, code: "NZD" },
//   { pattern: /HK\$/i, code: "HKD" },
//   { pattern: /S\$/i, code: "SGD" },
//   { pattern: /R\$/i, code: "BRL" },
//   { pattern: /\bAED\b|\bDH\b|د\.إ/i, code: "AED" },
//   { pattern: /\bSAR\b|ر\.س/i, code: "SAR" },
//   { pattern: /\bQAR\b|ر\.ق/i, code: "QAR" },
//   { pattern: /\bKWD\b|د\.ك/i, code: "KWD" },
//   { pattern: /\bBHD\b|د\.ب/i, code: "BHD" },
//   { pattern: /\bOMR\b|ر\.ع/i, code: "OMR" },
//   { pattern: /€/i, code: "EUR" },
//   { pattern: /£/i, code: "GBP" },
//   { pattern: /₹/i, code: "INR" },
//   { pattern: /\bCNY\b|\bRMB\b|CN¥|￥|元/i, code: "CNY" },
//   { pattern: /¥|円/i, code: "JPY" },
//   { pattern: /₩/i, code: "KRW" },
//   { pattern: /₽/i, code: "RUB" },
//   { pattern: /₴/i, code: "UAH" },
//   { pattern: /₺/i, code: "TRY" },
//   { pattern: /₫/i, code: "VND" },
//   { pattern: /฿/i, code: "THB" },
//   { pattern: /₱/i, code: "PHP" },
//   { pattern: /₦/i, code: "NGN" },
//   { pattern: /₵/i, code: "GHS" },
//   { pattern: /₪/i, code: "ILS" },
//   { pattern: /₨/i, code: "PKR" },
//   { pattern: /\$/i, code: "USD" },
// ];

// const BASE_STYLES: Record<string, StyleTheme> = {
//   luxury: {
//     templateId: "luxury",
//     styleName: "Luxury editorial",
//     accentLabel: "Luxury",
//     hierarchyStyle: "Editorial hierarchy",
//     tone: "Elevated and executive",
//     lineItemPresentation: "Premium ledger",
//     footerStyle: "Dark verified footer",
//     trustBadge: "Sealed premium proof",
//     previewSummary: "Dark navy hero with warm metallic accents.",
//     headerTitle: "Premium invoice",
//     heroCopy: "Refined presentation for retainers and premium engagements.",
//     palette: {
//       primary: "#111827",
//       secondary: "#C6A35C",
//       surface: "#F8F4EC",
//       surfaceAlt: "#1F2937",
//       text: "#111827",
//       muted: "#6B7280",
//       accent: "#E8D3A2",
//     },
//   },
//   corporate: {
//     templateId: "corporate",
//     styleName: "Corporate executive",
//     accentLabel: "Corporate",
//     hierarchyStyle: "Structured executive layout",
//     tone: "Crisp and confident",
//     lineItemPresentation: "Boardroom finance table",
//     footerStyle: "Compliance-ready footer",
//     trustBadge: "Audit-ready seal",
//     previewSummary: "Royal blue structure with sharp financial hierarchy.",
//     headerTitle: "Executive invoice",
//     heroCopy: "",
//     palette: {
//       primary: "#1640D6",
//       secondary: "#0F172A",
//       surface: "#F4F7FF",
//       surfaceAlt: "#DCE7FF",
//       text: "#0F172A",
//       muted: "#475569",
//       accent: "#5B8CFF",
//     },
//   },
//   creative: {
//     templateId: "creative",
//     styleName: "Creative studio",
//     accentLabel: "Creative",
//     hierarchyStyle: "Expressive split layout",
//     tone: "Energetic and premium",
//     lineItemPresentation: "Story-led service table",
//     footerStyle: "Ribbon footer with proof",
//     trustBadge: "Studio-grade proof",
//     previewSummary: "Vibrant purple canvas with warm highlights.",
//     headerTitle: "Studio invoice",
//     heroCopy: "Ideal for branding, design, product, and creative retainers.",
//     palette: {
//       primary: "#7C3AED",
//       secondary: "#F97316",
//       surface: "#FAF5FF",
//       surfaceAlt: "#FCE7F3",
//       text: "#2E1065",
//       muted: "#6D28D9",
//       accent: "#FDBA74",
//     },
//   },
//   minimal: {
//     templateId: "minimal",
//     styleName: "Minimal modern",
//     accentLabel: "Minimal",
//     hierarchyStyle: "Quiet whitespace-first layout",
//     tone: "Calm and precise",
//     lineItemPresentation: "Minimal rows with understated separators",
//     footerStyle: "Quiet proof footer",
//     trustBadge: "Quiet verified seal",
//     previewSummary: "Soft grayscale system with restrained premium spacing.",
//     headerTitle: "Modern invoice",
//     heroCopy: "Minimal visual noise while trust details stay present.",
//     palette: {
//       primary: "#0F172A",
//       secondary: "#94A3B8",
//       surface: "#FFFFFF",
//       surfaceAlt: "#F8FAFC",
//       text: "#0F172A",
//       muted: "#64748B",
//       accent: "#CBD5E1",
//     },
//   },
// };

// function cloneBlocks(blocks: CanvasBlock[]) {
//   return blocks.map((block) => ({
//     ...block,
//     binding: block.binding ? { ...block.binding } : undefined,
//     style: block.style ? { ...block.style } : undefined,
//   }));
// }

// function defaultBlocks(templateId: string): CanvasBlock[] {
//   const templates: Record<string, CanvasBlock[]> = {
//     corporate: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 42,
//         w: 86,
//         h: 86,
//         binding: { key: "logo" },
//         style: { radius: 24, background: "#ffffff" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 142,
//         y: 40,
//         w: 250,
//         h: 28,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 16, fontWeight: "700", color: "#5B8CFF" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 142,
//         y: 72,
//         w: 230,
//         h: 42,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 32, fontWeight: "800", color: "#0F172A" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 410,
//         y: 44,
//         w: 145,
//         h: 92,
//         binding: { key: "amount" },
//         style: { background: "#DCE7FF", color: "#1640D6", radius: 28 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 172,
//         w: 220,
//         h: 108,
//         binding: { key: "issuer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 310,
//         y: 172,
//         w: 245,
//         h: 108,
//         binding: { key: "customer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 292,
//         w: 515,
//         h: 70,
//         binding: { key: "meta" },
//         style: {
//           background: "#F4F7FF",
//           fontSize: 12,
//           color: "#475569",
//           radius: 22,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 380,
//         w: 515,
//         h: 230,
//         binding: { key: "lineItems" },
//         style: { background: "#ffffff", radius: 24 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 622,
//         w: 515,
//         h: 102,
//         binding: { key: "notes" },
//         style: {
//           background: "#ffffff",
//           fontSize: 12,
//           color: "#475569",
//           radius: 20,
//         },
//       },
//     ],
//     luxury: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 48,
//         w: 84,
//         h: 84,
//         binding: { key: "logo" },
//         style: { radius: 24, background: "#1F2937" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 40,
//         y: 152,
//         w: 180,
//         h: 28,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 14, fontWeight: "700", color: "#C6A35C" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 40,
//         y: 182,
//         w: 290,
//         h: 42,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 34, fontWeight: "800", color: "#FFFFFF" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 392,
//         y: 74,
//         w: 163,
//         h: 118,
//         binding: { key: "amount" },
//         style: { background: "#E8D3A2", color: "#111827", radius: 28 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 272,
//         w: 220,
//         h: 108,
//         binding: { key: "issuer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#111827" },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 310,
//         y: 272,
//         w: 245,
//         h: 108,
//         binding: { key: "customer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#111827" },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 392,
//         w: 515,
//         h: 74,
//         binding: { key: "meta" },
//         style: {
//           background: "#F7EFE3",
//           fontSize: 12,
//           color: "#6B7280",
//           radius: 22,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 480,
//         w: 515,
//         h: 190,
//         binding: { key: "lineItems" },
//         style: { background: "#FFFDF9", radius: 24 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 684,
//         w: 515,
//         h: 64,
//         binding: { key: "notes" },
//         style: {
//           background: "#F7EFE3",
//           fontSize: 12,
//           color: "#6B7280",
//           radius: 20,
//         },
//       },
//     ],
//     creative: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 44,
//         w: 90,
//         h: 90,
//         binding: { key: "logo" },
//         style: { radius: 28, background: "#ffffff" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 154,
//         y: 46,
//         w: 180,
//         h: 28,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 16, fontWeight: "700", color: "#F97316" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 154,
//         y: 80,
//         w: 220,
//         h: 42,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 31, fontWeight: "800", color: "#FFFFFF" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 390,
//         y: 52,
//         w: 165,
//         h: 96,
//         binding: { key: "amount" },
//         style: { background: "#FDBA74", color: "#2E1065", radius: 30 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 212,
//         w: 240,
//         h: 110,
//         binding: { key: "issuer" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 13,
//           color: "#2E1065",
//           radius: 24,
//         },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 315,
//         y: 212,
//         w: 240,
//         h: 110,
//         binding: { key: "customer" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 13,
//           color: "#2E1065",
//           radius: 24,
//         },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 338,
//         w: 515,
//         h: 72,
//         binding: { key: "meta" },
//         style: {
//           background: "#FCE7F3",
//           fontSize: 12,
//           color: "#6D28D9",
//           radius: 22,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 428,
//         w: 515,
//         h: 210,
//         binding: { key: "lineItems" },
//         style: { background: "#FFFFFF", radius: 26 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 654,
//         w: 515,
//         h: 90,
//         binding: { key: "notes" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 12,
//           color: "#6D28D9",
//           radius: 22,
//         },
//       },
//     ],
//     minimal: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 44,
//         w: 72,
//         h: 72,
//         binding: { key: "logo" },
//         style: { radius: 20, background: "#F8FAFC" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 132,
//         y: 50,
//         w: 150,
//         h: 22,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 13, fontWeight: "700", color: "#64748B" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 132,
//         y: 78,
//         w: 260,
//         h: 38,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 32, fontWeight: "800", color: "#0F172A" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 402,
//         y: 58,
//         w: 153,
//         h: 82,
//         binding: { key: "amount" },
//         style: { background: "#F8FAFC", color: "#0F172A", radius: 24 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 166,
//         w: 220,
//         h: 96,
//         binding: { key: "issuer" },
//         style: { fontSize: 13, color: "#0F172A" },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 315,
//         y: 166,
//         w: 240,
//         h: 96,
//         binding: { key: "customer" },
//         style: { fontSize: 13, color: "#0F172A" },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 280,
//         w: 515,
//         h: 58,
//         binding: { key: "meta" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 12,
//           color: "#64748B",
//           radius: 18,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 364,
//         w: 515,
//         h: 238,
//         binding: { key: "lineItems" },
//         style: { background: "#FFFFFF", radius: 20 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 618,
//         w: 515,
//         h: 102,
//         binding: { key: "notes" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 12,
//           color: "#64748B",
//           radius: 18,
//         },
//       },
//     ],
//   };

//   return cloneBlocks(templates[templateId] || templates.corporate);
// }

// function toMoney(value: string) {
//   const number = Number(String(value || "0").replace(/[^\d.]/g, ""));
//   if (!Number.isFinite(number)) return "0.00";
//   return number.toFixed(2);
// }

// function detectCurrencyCode(value: string) {
//   const text = String(value || "").trim();
//   if (!text) return "";
//   for (const rule of CURRENCY_DETECTION_RULES) {
//     if (rule.pattern.test(text)) return rule.code;
//   }
//   const upper = text.toUpperCase();
//   const matches = upper.match(/[A-Z]{3}/g) || [];
//   const detected = matches.find((code) => CURRENCY_OPTION_SET.has(code));
//   if (detected) return detected;
//   const collapsed = upper.replace(/[^A-Z]/g, "").slice(0, 3);
//   return collapsed && CURRENCY_OPTION_SET.has(collapsed) ? collapsed : "";
// }

// function normalizeCurrency(value: string, fallback = "USD") {
//   return detectCurrencyCode(value) || fallback;
// }

// function sumLineItems(items: LineItem[]) {
//   return items
//     .reduce((sum, item) => sum + Number(item.amount || 0), 0)
//     .toFixed(2);
// }

// function calculateDiscountAmount(
//   items: LineItem[],
//   discountPercentage: string
// ) {
//   return (
//     (Number(sumLineItems(items)) * Number(discountPercentage || 0)) /
//     100
//   ).toFixed(2);
// }

// function calculateTaxableSubtotal(
//   items: LineItem[],
//   discountPercentage: string
// ) {
//   return Math.max(
//     Number(sumLineItems(items)) -
//       Number(calculateDiscountAmount(items, discountPercentage)),
//     0
//   ).toFixed(2);
// }

// function calculateTaxAmount(
//   items: LineItem[],
//   taxPercentage: string,
//   discountPercentage: string
// ) {
//   return (
//     (Number(calculateTaxableSubtotal(items, discountPercentage)) *
//       Number(taxPercentage || 0)) /
//     100
//   ).toFixed(2);
// }

// function calculateInvoiceAmount(
//   items: LineItem[],
//   taxPercentage: string,
//   discountPercentage: string
// ) {
//   return (
//     Number(calculateTaxableSubtotal(items, discountPercentage)) +
//     Number(calculateTaxAmount(items, taxPercentage, discountPercentage))
//   ).toFixed(2);
// }

// function parseTaxPercentageFromText(value: string) {
//   const match = String(value || "").match(/(\d+(?:\.\d+)?)\s*%/);
//   return match ? toMoney(match[1]) : null;
// }

// function normalizeLineItem(
//   item: Partial<LineItem>,
//   fallbackDescription: string
// ): LineItem {
//   const quantity = toMoney(String(item.quantity || "1"));
//   const unitPrice = toMoney(String(item.unitPrice || item.amount || "0"));

//   return {
//     description: String(item.description || fallbackDescription).slice(0, 150),
//     quantity,
//     unitPrice,
//     amount: toMoney(String(Number(quantity) * Number(unitPrice))),
//   };
// }

// function normalizeImportedLineItems(
//   rawItems: unknown,
//   fallbackItems: LineItem[]
// ) {
//   const items = Array.isArray(rawItems) ? rawItems.slice(0, 12) : [];
//   const normalized: LineItem[] = [];
//   let subtotal = 0;
//   let derivedTaxPercentage: string | null = null;

//   items.forEach((item: any, index: number) => {
//     const normalizedItem = normalizeLineItem(
//       {
//         description: String(item?.description || `Line item ${index + 1}`),
//         quantity: String(item?.quantity || "1"),
//         unitPrice: String(item?.unitPrice || item?.amount || "0"),
//         amount: String(item?.amount || item?.unitPrice || "0"),
//       },
//       `Line item ${index + 1}`
//     );
//     const description = normalizedItem.description;
//     const explicitTaxPercentage = item?.taxPercentage
//       ? toMoney(String(item.taxPercentage))
//       : parseTaxPercentageFromText(description);
//     const isTaxOnlyLine = /\b(?:gst|vat|tax)\b/i.test(description);

//     if (isTaxOnlyLine) {
//       const derivedFromAmount =
//         subtotal > 0 && Number(normalizedItem.amount || 0) > 0
//           ? toMoney(
//               String((Number(normalizedItem.amount || 0) * 100) / subtotal)
//             )
//           : null;
//       derivedTaxPercentage =
//         derivedFromAmount ||
//         explicitTaxPercentage ||
//         derivedTaxPercentage ||
//         "0.00";
//       return;
//     }

//     normalized.push(normalizedItem);
//     subtotal += Number(normalizedItem.amount || 0);

//     if (
//       !derivedTaxPercentage &&
//       explicitTaxPercentage &&
//       Number(explicitTaxPercentage) > 0
//     ) {
//       derivedTaxPercentage = explicitTaxPercentage;
//     }
//   });

//   return {
//     lineItems: normalized.length ? normalized : fallbackItems,
//     taxPercentage: derivedTaxPercentage || "0.00",
//   };
// }

// function normalizeInvoiceState(
//   input: Partial<InvoiceState>,
//   today: string
// ): InvoiceState {
//   const base = createInitialInvoice(today);
//   const rawStyle = input.style || base.style;
//   const baseStyle = BASE_STYLES[rawStyle.templateId] || base.style;
//   const imported = normalizeImportedLineItems(
//     (input as { lineItems?: unknown }).lineItems,
//     base.lineItems
//   );
//   const taxPercentage = toMoney(
//     String(
//       (input as { taxPercentage?: string }).taxPercentage ||
//         imported.taxPercentage ||
//         base.taxPercentage
//     )
//   );
//   const discountPercentage = toMoney(
//     String(
//       (input as { discountPercentage?: string }).discountPercentage ||
//         base.discountPercentage
//     )
//   );
//   const lineItems = imported.lineItems;
//   const style = {
//     ...baseStyle,
//     ...rawStyle,
//     palette: {
//       ...baseStyle.palette,
//       ...(rawStyle.palette || {}),
//     },
//   };

//   return {
//     ...base,
//     ...input,
//     currency: normalizeCurrency(
//       String(input.currency || base.currency),
//       base.currency
//     ),
//     taxPercentage,
//     discountPercentage,
//     amount: calculateInvoiceAmount(
//       lineItems,
//       taxPercentage,
//       discountPercentage
//     ),
//     notes: String(input.notes ?? base.notes),
//     paymentTerms: String(input.paymentTerms ?? base.paymentTerms),
//     accentLabel: String(input.accentLabel || style.accentLabel),
//     lineItems,
//     style,
//   };
// }

// function normalizeAiPrompt(value: string) {
//   return String(value || "")
//     .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
//     .replace(/\s+/g, " ")
//     .trim()
//     .slice(0, 4000);
// }

// function readFileAsDataUrl(file: File) {
//   return new Promise<string>((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(String(reader.result || ""));
//     reader.onerror = () => reject(new Error("Could not read file."));
//     reader.readAsDataURL(file);
//   });
// }

// function mergeStyle(base: StyleTheme, palette?: Partial<StylePalette>) {
//   return {
//     ...base,
//     palette: {
//       ...base.palette,
//       ...(palette || {}),
//     },
//   };
// }

// function createInitialInvoice(today: string): InvoiceState {
//   const style = mergeStyle(BASE_STYLES.corporate);
//   const lineItems: LineItem[] = [
//     {
//       description: "Strategy and discovery",
//       quantity: "1.00",
//       unitPrice: "1200.00",
//       amount: "1200.00",
//     },
//     {
//       description: "Visual design system",
//       quantity: "1.00",
//       unitPrice: "1600.00",
//       amount: "1600.00",
//     },
//     {
//       description: "Final delivery and handoff",
//       quantity: "1.00",
//       unitPrice: "800.00",
//       amount: "800.00",
//     },
//   ];
//   const taxPercentage = "0.00";
//   const discountPercentage = "0.00";

//   return {
//     invoiceNumber: `INV-${new Date().getFullYear()}-1001`,
//     customerName: "Client name",
//     amount: calculateInvoiceAmount(
//       lineItems,
//       taxPercentage,
//       discountPercentage
//     ),
//     currency: "USD",
//     taxPercentage,
//     discountPercentage,
//     issueDate: today,
//     dueDate: today,
//     notes:
//       "Thank you for your business. This invoice covers strategy, design, and delivery.",
//     paymentTerms: "Due on receipt",
//     issuerName: "InvoiceProof Studio",
//     issuerEmail: "billing@invoiceproof.app",
//     issuerAddress: "123 Market Street, San Francisco, CA",
//     accentLabel: style.accentLabel,
//     lineItems,
//     style,
//   };
// }

// function initials(name: string) {
//   const parts = String(name || "IP")
//     .trim()
//     .split(/\s+/)
//     .filter(Boolean);
//   return `${parts[0]?.[0] || "I"}${parts[1]?.[0] || parts[0]?.[1] || "P"}`
//     .slice(0, 2)
//     .toUpperCase();
// }

// function styleCardCss(style: StyleTheme) {
//   return {
//     background: `linear-gradient(160deg, ${style.palette.surface}, ${style.palette.surfaceAlt})`,
//     color: style.palette.text,
//     border: `1px solid ${style.palette.accent}`,
//   } as const;
// }

// function moveBlock(blocks: CanvasBlock[], id: string, dx: number, dy: number) {
//   return blocks.map((block) =>
//     block.id === id
//       ? {
//           ...block,
//           x: Math.max(8, Math.min(PAGE_WIDTH - block.w - 8, block.x + dx)),
//           y: Math.max(
//             8,
//             Math.min(PAGE_HEIGHT - FOOTER_HEIGHT - block.h - 8, block.y + dy)
//           ),
//         }
//       : block
//   );
// }

// function MiniPreview({
//   invoice,
//   blocks,
//   logoDataUrl,
// }: {
//   invoice: InvoiceState;
//   blocks: CanvasBlock[];
//   logoDataUrl: string | null;
// }) {
//   return (
//     <div className="mini-canvas-frame">
//       <div className="mini-canvas-scale">
//         <InvoiceCanvasPage
//           invoice={invoice}
//           blocks={blocks}
//           logoDataUrl={logoDataUrl}
//           selectedBlockId={null}
//           onSelectBlock={() => undefined}
//           onBlockMouseDown={() => undefined}
//           onUpdateInvoice={() => undefined}
//           onUpdateLineItem={() => undefined}
//           onAddLineItem={() => undefined}
//           onDeleteBlock={() => undefined}
//           onLogoPick={() => undefined}
//           readOnly
//         />
//       </div>
//     </div>
//   );
// }

// function InvoiceCanvasPage(props: {
//   invoice: InvoiceState;
//   blocks: CanvasBlock[];
//   logoDataUrl: string | null;
//   selectedBlockId: string | null;
//   onSelectBlock: (id: string) => void;
//   onBlockMouseDown: (
//     event: ReactMouseEvent<HTMLButtonElement>,
//     id: string
//   ) => void;
//   onUpdateInvoice: (patch: Partial<InvoiceState>) => void;
//   onUpdateLineItem: (index: number, key: keyof LineItem, value: string) => void;
//   onAddLineItem: () => void;
//   onDeleteBlock: (id: string) => void;
//   onLogoPick: () => void;
//   readOnly?: boolean;
// }) {
//   const {
//     invoice,
//     blocks,
//     logoDataUrl,
//     selectedBlockId,
//     onSelectBlock,
//     onBlockMouseDown,
//     onUpdateInvoice,
//     onUpdateLineItem,
//     onAddLineItem,
//     onDeleteBlock,
//     onLogoPick,
//     readOnly,
//   } = props;
//   const { style } = invoice;
//   const palette = style.palette;
//   const orderedBlocks = [...blocks].sort((a, b) => (a.z || 0) - (b.z || 0));

//   return (
//     <div
//       className={`invoice-canvas-page is-${style.templateId}`}
//       style={{
//         background: palette.surface,
//         color: palette.text,
//         width: PAGE_WIDTH,
//         height: PAGE_HEIGHT,
//       }}
//     >
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-luxury"
//         style={{
//           background:
//             style.templateId === "luxury" ? palette.primary : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-creative"
//         style={{
//           background:
//             style.templateId === "creative" ? palette.primary : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-creative-accent"
//         style={{
//           background:
//             style.templateId === "creative" ? palette.accent : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-corporate"
//         style={{
//           background:
//             style.templateId === "corporate"
//               ? palette.surfaceAlt
//               : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-line"
//         style={{
//           borderColor:
//             style.templateId === "minimal" ? palette.secondary : "transparent",
//         }}
//       />

//       {orderedBlocks.map((block) => {
//         const isSelected = selectedBlockId === block.id;
//         const background = block.style?.background || "transparent";
//         return (
//           <div
//             key={block.id}
//             className={`canvas-block canvas-block-${block.type} ${
//               isSelected ? "is-selected" : ""
//             }`}
//             style={{
//               left: block.x,
//               top: block.y,
//               width: block.w,
//               height: block.h,
//               color: block.style?.color || palette.text,
//               background,
//               borderRadius: block.style?.radius || 18,
//               boxShadow: isSelected
//                 ? `0 0 0 2px ${palette.primary}`
//                 : undefined,
//             }}
//             onMouseDown={() => onSelectBlock(block.id)}
//           >
//             {!readOnly ? (
//               <>
//                 <button
//                   type="button"
//                   className="canvas-drag-handle"
//                   onMouseDown={(event) => onBlockMouseDown(event, block.id)}
//                   aria-label={`Move ${block.id}`}
//                 >
//                   ⋮⋮
//                 </button>
//                 <button
//                   type="button"
//                   className="canvas-delete-handle"
//                   onClick={(event) => {
//                     event.stopPropagation();
//                     onDeleteBlock(block.id);
//                   }}
//                   aria-label={`Delete ${block.id}`}
//                 >
//                   ×
//                 </button>
//               </>
//             ) : null}

//             {block.type === "logo" ? (
//               <button
//                 type="button"
//                 className={`canvas-logo-inner ${
//                   readOnly ? "is-readonly" : "is-uploadable"
//                 }`}
//                 onClick={(event) => {
//                   event.stopPropagation();
//                   if (!readOnly) onLogoPick();
//                 }}
//               >
//                 {logoDataUrl ? (
//                   <img
//                     src={logoDataUrl}
//                     alt="Logo"
//                     className="canvas-logo-image"
//                   />
//                 ) : (
//                   <div className="canvas-logo-placeholder">
//                     <span className="canvas-logo-placeholder-badge">
//                       {initials(invoice.issuerName)}
//                     </span>
//                     <span className="canvas-logo-placeholder-copy">
//                       Click to upload logo
//                     </span>
//                   </div>
//                 )}
//               </button>
//             ) : null}

//             {block.binding?.key === "headerTitle" ? (
//               <input
//                 className="canvas-inline-input canvas-inline-title"
//                 value={invoice.style.headerTitle}
//                 onChange={(event) =>
//                   onUpdateInvoice({
//                     style: {
//                       ...invoice.style,
//                       headerTitle: event.target.value,
//                     },
//                   })
//                 }
//                 readOnly={readOnly}
//               />
//             ) : null}

//             {block.binding?.key === "invoiceNumber" ? (
//               <input
//                 className="canvas-inline-input canvas-inline-number"
//                 value={invoice.invoiceNumber}
//                 onChange={(event) =>
//                   onUpdateInvoice({ invoiceNumber: event.target.value })
//                 }
//                 readOnly={readOnly}
//               />
//             ) : null}

//             {block.type === "amount" ? (
//               <div className="canvas-amount-shell">
//                 <span className="canvas-kicker">Amount due</span>
//                 <div className="canvas-amount-row">
//                   <input
//                     className="canvas-inline-currency"
//                     list="invoice-currency-list"
//                     value={invoice.currency}
//                     onChange={(event) =>
//                       onUpdateInvoice({
//                         currency: normalizeCurrency(
//                           event.target.value,
//                           invoice.currency
//                         ),
//                       })
//                     }
//                     readOnly={readOnly}
//                   />
//                   <input
//                     className="canvas-inline-amount is-readonly"
//                     value={invoice.amount}
//                     onChange={(event) =>
//                       onUpdateInvoice({ amount: event.target.value })
//                     }
//                     readOnly
//                   />
//                 </div>
//                 <span className="canvas-subtle-copy">
//                   {invoice.style.trustBadge}
//                 </span>
//               </div>
//             ) : null}

//             {block.binding?.key === "issuer" ? (
//               <div className="canvas-multiline-card">
//                 <span className="canvas-kicker">From</span>
//                 <input
//                   className="canvas-inline-input"
//                   value={invoice.issuerName}
//                   onChange={(event) =>
//                     onUpdateInvoice({ issuerName: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//                 <input
//                   className="canvas-inline-input"
//                   value={invoice.issuerEmail}
//                   onChange={(event) =>
//                     onUpdateInvoice({ issuerEmail: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//                 <textarea
//                   className="canvas-inline-textarea"
//                   value={invoice.issuerAddress}
//                   onChange={(event) =>
//                     onUpdateInvoice({ issuerAddress: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//               </div>
//             ) : null}

//             {block.binding?.key === "customer" ? (
//               <div className="canvas-multiline-card">
//                 <span className="canvas-kicker">Bill to</span>
//                 <input
//                   className="canvas-inline-input"
//                   value={invoice.customerName}
//                   onChange={(event) =>
//                     onUpdateInvoice({ customerName: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//                 <div className="canvas-dual-row">
//                   <input
//                     type="date"
//                     className="canvas-inline-input"
//                     value={invoice.issueDate}
//                     onChange={(event) =>
//                       onUpdateInvoice({ issueDate: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                   <input
//                     type="date"
//                     className="canvas-inline-input"
//                     value={invoice.dueDate}
//                     onChange={(event) =>
//                       onUpdateInvoice({ dueDate: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//               </div>
//             ) : null}

//             {block.binding?.key === "meta" ? (
//               <div className="canvas-meta-grid">
//                 <div>
//                   <span className="canvas-kicker">Label</span>
//                   <input
//                     className="canvas-inline-input"
//                     value={invoice.accentLabel}
//                     onChange={(event) =>
//                       onUpdateInvoice({ accentLabel: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//                 <div>
//                   <span className="canvas-kicker">Terms</span>
//                   <input
//                     className="canvas-inline-input"
//                     value={invoice.paymentTerms}
//                     onChange={(event) =>
//                       onUpdateInvoice({ paymentTerms: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//                 <div style={{ gridColumn: "1 / -1" }}>
//                   <span className="canvas-kicker">Hero copy</span>
//                   <input
//                     className="canvas-inline-input"
//                     value={invoice.style.heroCopy}
//                     onChange={(event) =>
//                       onUpdateInvoice({
//                         style: {
//                           ...invoice.style,
//                           heroCopy: event.target.value,
//                         },
//                       })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//               </div>
//             ) : null}

//             {block.type === "table" ? (
//               <div className="canvas-table-shell">
//                 <div
//                   className="canvas-table-head"
//                   style={{
//                     background:
//                       style.templateId === "minimal"
//                         ? palette.surfaceAlt
//                         : palette.primary,
//                     color:
//                       style.templateId === "minimal" ? palette.text : "#fff",
//                   }}
//                 >
//                   <span>Description</span>
//                   <span>Qty</span>
//                   <span>Unit</span>
//                   <span>Currency</span>
//                   <span>Amount</span>
//                 </div>
//                 <div className="canvas-table-body">
//                   {invoice.lineItems.map((item, index) => (
//                     <div
//                       key={`${index}-${item.description}`}
//                       className="canvas-table-row"
//                     >
//                       <input
//                         className="canvas-inline-input is-readonly"
//                         value={item.description}
//                         onChange={(event) =>
//                           onUpdateLineItem(
//                             index,
//                             "description",
//                             event.target.value
//                           )
//                         }
//                         readOnly
//                       />
//                       <input
//                         className="canvas-inline-input"
//                         value={item.quantity}
//                         onChange={(event) =>
//                           onUpdateLineItem(
//                             index,
//                             "quantity",
//                             event.target.value
//                           )
//                         }
//                         readOnly={readOnly}
//                       />
//                       <input
//                         className="canvas-inline-input"
//                         value={item.unitPrice}
//                         onChange={(event) =>
//                           onUpdateLineItem(
//                             index,
//                             "unitPrice",
//                             event.target.value
//                           )
//                         }
//                         readOnly={readOnly}
//                       />
//                       <input
//                         className="canvas-inline-input is-readonly canvas-table-currency"
//                         value={invoice.currency}
//                         readOnly
//                       />
//                       <input
//                         className="canvas-inline-input is-readonly"
//                         value={item.amount}
//                         onChange={(event) =>
//                           onUpdateLineItem(index, "amount", event.target.value)
//                         }
//                         readOnly
//                       />
//                     </div>
//                   ))}
//                 </div>
//                 {!readOnly ? (
//                   <button
//                     type="button"
//                     className="canvas-table-add"
//                     onClick={onAddLineItem}
//                   >
//                     + Add item
//                   </button>
//                 ) : null}
//                 <div className="canvas-table-summary">
//                   <div>
//                     <span>Total amount</span>
//                     <strong className="canvas-table-summary-value">
//                       {invoice.currency} {sumLineItems(invoice.lineItems)}
//                     </strong>
//                   </div>
//                   <div>
//                     <span className="canvas-tax-summary-label">
//                       Discount (
//                       <input
//                         className="canvas-inline-input canvas-inline-tax-rate"
//                         value={invoice.discountPercentage}
//                         onChange={(event) =>
//                           onUpdateInvoice({
//                             discountPercentage: event.target.value,
//                           })
//                         }
//                         readOnly={readOnly}
//                         aria-label="Discount percentage"
//                       />
//                       %)
//                     </span>
//                     <strong className="canvas-table-summary-value">
//                       - {invoice.currency}{" "}
//                       {calculateDiscountAmount(
//                         invoice.lineItems,
//                         invoice.discountPercentage
//                       )}
//                     </strong>
//                   </div>
//                   <div>
//                     <span className="canvas-tax-summary-label">
//                       GST / Tax / VAT (
//                       <input
//                         className="canvas-inline-input canvas-inline-tax-rate"
//                         value={invoice.taxPercentage}
//                         onChange={(event) =>
//                           onUpdateInvoice({ taxPercentage: event.target.value })
//                         }
//                         readOnly={readOnly}
//                         aria-label="GST, tax, or VAT percentage"
//                       />
//                       %)
//                     </span>
//                     <strong className="canvas-table-summary-value">
//                       {invoice.currency}{" "}
//                       {calculateTaxAmount(
//                         invoice.lineItems,
//                         invoice.taxPercentage,
//                         invoice.discountPercentage
//                       )}
//                     </strong>
//                   </div>
//                   <div className="is-grand">
//                     <span>Grand total</span>
//                     <strong className="canvas-table-summary-value">
//                       {invoice.currency} {invoice.amount}
//                     </strong>
//                   </div>
//                 </div>
//               </div>
//             ) : null}

//             {block.binding?.key === "notes" ? (
//               <div className="canvas-notes-shell">
//                 <div className="canvas-notes-head">
//                   <span className="canvas-kicker">Notes</span>
//                   {!readOnly && invoice.notes ? (
//                     <button
//                       type="button"
//                       className="canvas-mini-action"
//                       onClick={() => onUpdateInvoice({ notes: "" })}
//                     >
//                       Clear
//                     </button>
//                   ) : null}
//                 </div>
//                 <textarea
//                   className="canvas-inline-textarea canvas-inline-notes"
//                   value={invoice.notes}
//                   onChange={(event) =>
//                     onUpdateInvoice({ notes: event.target.value })
//                   }
//                   readOnly={readOnly}
//                   placeholder="Add optional payment notes or leave blank."
//                 />
//               </div>
//             ) : null}
//           </div>
//         );
//       })}

//       <div
//         className="invoice-footer-preview"
//         style={{
//           background:
//             invoice.style.templateId === "luxury"
//               ? palette.primary
//               : palette.surfaceAlt,
//           color: invoice.style.templateId === "luxury" ? "#fff" : palette.text,
//         }}
//       >
//         <div className="invoice-footer-copy">
//           <strong>InvoiceProof</strong>
//           <span>
//             QR, brand, and verification link appear on every final page.
//           </span>
//           <span className="invoice-footer-link">/verify/&lt;public-id&gt;</span>
//         </div>
//         <div className="invoice-footer-qr">QR</div>
//       </div>
//     </div>
//   );
// }

// export function NewInvoiceForm() {
//   const router = useRouter();
//   const { showToast } = useToast();
//   const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
//   const [invoice, setInvoice] = useState<InvoiceState>(() =>
//     createInitialInvoice(today)
//   );
//   const [blocks, setBlocks] = useState<CanvasBlock[]>(() =>
//     defaultBlocks("corporate")
//   );
//   const [drafts, setDrafts] = useState<InvoiceDraftOption[]>([]);
//   const [selectedDraft, setSelectedDraft] = useState<string>("corporate");
//   const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
//     "invoiceNumber"
//   );
//   const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
//   const [logoName, setLogoName] = useState<string>("");
//   const [attachments, setAttachments] = useState<File[]>([]);
//   const [loading, setLoading] = useState<LoadingState>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [aiModalOpen, setAiModalOpen] = useState(false);
//   const [aiPrompt, setAiPrompt] = useState("");
//   const [aiPromptSummary, setAiPromptSummary] = useState("");
//   const [aiMissingFields, setAiMissingFields] = useState<string[]>([]);
//   const dragRef = useRef<{ id: string; x: number; y: number } | null>(null);
//   const canvasStageRef = useRef<HTMLElement | null>(null);
//   const canvasViewportRef = useRef<HTMLDivElement | null>(null);
//   const logoInputRef = useRef<HTMLInputElement | null>(null);
//   const [canvasScale, setCanvasScale] = useState(1);
//   const hasAiDraft = Boolean(aiPrompt.trim() || aiPromptSummary.trim());

//   useEffect(() => {
//     const transferred = loadPendingInvoiceDraft();
//     if (!transferred) return;

//     clearPendingInvoiceDraft();

//     if (transferred.type === "ai-canvas") {
//       const data = transferred.payload as AiCanvasDraftResult & {
//         prompt?: string;
//       };
//       if (data.invoice) setInvoice(normalizeInvoiceState(data.invoice, today));
//       if (Array.isArray(data.blocks) && data.blocks.length)
//         setBlocks(cloneBlocks(data.blocks));
//       setAiPrompt(typeof data.prompt === "string" ? data.prompt : "");
//       setAiPromptSummary(
//         String(data?.promptSummary || "AI created an editable invoice draft.")
//       );
//       setAiMissingFields(
//         Array.isArray(data?.missingFields) ? data.missingFields.slice(0, 6) : []
//       );
//       setSelectedDraft(
//         String(
//           data?.templateId || data?.invoice?.style?.templateId || "corporate"
//         )
//       );
//       setSelectedBlockId("invoiceNumber");
//       window.requestAnimationFrame(() => {
//         canvasStageRef.current?.scrollIntoView({
//           behavior: "smooth",
//           block: "start",
//         });
//       });
//       showToast({
//         tone: "success",
//         title: "AI invoice ready",
//         description: "Your extracted invoice has been loaded into the canvas.",
//       });
//       return;
//     }

//     if (transferred.type === "pdf-detect") {
//       const payload = transferred.payload as {
//         fileName?: string;
//         detected?: any;
//       };
//       const detected = payload?.detected || {};
//       const base = createInitialInvoice(today);
//       const imported = normalizeImportedLineItems(
//         detected.lineItems,
//         base.lineItems
//       );
//       const taxPercentage = toMoney(
//         String(detected.taxPercentage || imported.taxPercentage || "0")
//       );
//       const discountPercentage = toMoney(
//         String(detected.discountPercentage || "0")
//       );
//       const lineItems = imported.lineItems;
//       const nextInvoice: InvoiceState = {
//         ...base,
//         invoiceNumber: String(detected.invoiceNumber || base.invoiceNumber),
//         customerName: String(detected.customerName || base.customerName),
//         amount: calculateInvoiceAmount(
//           lineItems,
//           taxPercentage,
//           discountPercentage
//         ),
//         currency: normalizeCurrency(
//           String(detected.currency || base.currency),
//           base.currency
//         ),
//         taxPercentage,
//         discountPercentage,
//         issueDate: String(detected.issueDate || base.issueDate),
//         dueDate: String(detected.dueDate || detected.issueDate || base.dueDate),
//         notes: String(detected.notes || base.notes),
//         paymentTerms: String(detected.paymentTerms || base.paymentTerms),
//         issuerName: String(detected.issuerName || base.issuerName),
//         issuerEmail: String(detected.issuerEmail || base.issuerEmail),
//         issuerAddress: String(detected.issuerAddress || base.issuerAddress),
//         lineItems,
//         style: mergeStyle(BASE_STYLES.corporate),
//         accentLabel: BASE_STYLES.corporate.accentLabel,
//       };
//       setInvoice(normalizeInvoiceState(nextInvoice, today));
//       setBlocks(defaultBlocks("corporate"));
//       setSelectedDraft("corporate");
//       setSelectedBlockId("invoiceNumber");
//       setAiPromptSummary(
//         String(
//           detected.extractionSummary ||
//             `Extracted invoice data from ${payload.fileName || "uploaded PDF"}.`
//         )
//       );
//       setAiMissingFields(
//         detected.needsReview
//           ? ["invoice number", "customer", "amount", "dates"].slice(0, 4)
//           : []
//       );
//       window.requestAnimationFrame(() => {
//         canvasStageRef.current?.scrollIntoView({
//           behavior: "smooth",
//           block: "start",
//         });
//       });
//       showToast({
//         tone: "success",
//         title: "PDF data loaded",
//         description:
//           "Review the extracted fields, then finalize the canvas PDF.",
//       });
//     }
//   }, [showToast, today]);

//   useEffect(() => {
//     function onMove(event: MouseEvent) {
//       if (!dragRef.current) return;
//       const dx = event.clientX - dragRef.current.x;
//       const dy = event.clientY - dragRef.current.y;
//       dragRef.current = {
//         ...dragRef.current,
//         x: event.clientX,
//         y: event.clientY,
//       };
//       setBlocks((current) => moveBlock(current, dragRef.current!.id, dx, dy));
//     }

//     function onUp() {
//       dragRef.current = null;
//     }

//     window.addEventListener("mousemove", onMove);
//     window.addEventListener("mouseup", onUp);
//     return () => {
//       window.removeEventListener("mousemove", onMove);
//       window.removeEventListener("mouseup", onUp);
//     };
//   }, []);

//   useEffect(() => {
//     if (!aiModalOpen) return;

//     function onKeyDown(event: KeyboardEvent) {
//       if (event.key === "Escape") {
//         setAiModalOpen(false);
//       }
//     }

//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [aiModalOpen]);

//   useEffect(() => {
//     if (!selectedBlockId) return;

//     function onDeleteKey(event: KeyboardEvent) {
//       const target = event.target as HTMLElement | null;
//       const tagName = target?.tagName || "";
//       if (
//         ["INPUT", "TEXTAREA", "SELECT"].includes(tagName) ||
//         target?.isContentEditable
//       )
//         return;
//       if (event.key !== "Delete" && event.key !== "Backspace") return;
//       event.preventDefault();
//       deleteBlock(selectedBlockId);
//     }

//     window.addEventListener("keydown", onDeleteKey);
//     return () => window.removeEventListener("keydown", onDeleteKey);
//   }, [selectedBlockId, blocks]);

//   useEffect(() => {
//     function updateCanvasScale() {
//       const viewportWidth =
//         canvasViewportRef.current?.clientWidth || PAGE_WIDTH;
//       const nextScale = Math.max(
//         0.82,
//         Math.min(1.82, (viewportWidth - 24) / PAGE_WIDTH)
//       );
//       setCanvasScale(Number.isFinite(nextScale) ? nextScale : 1);
//     }

//     updateCanvasScale();

//     const observer =
//       typeof ResizeObserver !== "undefined" && canvasViewportRef.current
//         ? new ResizeObserver(() => updateCanvasScale())
//         : null;

//     if (observer && canvasViewportRef.current) {
//       observer.observe(canvasViewportRef.current);
//     }

//     window.addEventListener("resize", updateCanvasScale);
//     return () => {
//       observer?.disconnect();
//       window.removeEventListener("resize", updateCanvasScale);
//     };
//   }, []);

//   function updateInvoice(patch: Partial<InvoiceState>) {
//     setInvoice((current) => {
//       const next = { ...current, ...patch };
//       if (patch.currency !== undefined) {
//         next.currency = normalizeCurrency(
//           String(patch.currency || current.currency),
//           current.currency
//         );
//       }
//       if (patch.taxPercentage !== undefined) {
//         next.taxPercentage = toMoney(String(patch.taxPercentage || "0"));
//       }
//       if (patch.discountPercentage !== undefined) {
//         next.discountPercentage = toMoney(
//           String(patch.discountPercentage || "0")
//         );
//       }
//       if (
//         patch.taxPercentage !== undefined ||
//         patch.discountPercentage !== undefined
//       ) {
//         next.amount = calculateInvoiceAmount(
//           next.lineItems,
//           next.taxPercentage,
//           next.discountPercentage
//         );
//       }
//       return next;
//     });
//   }

//   function deleteBlock(id: string) {
//     setBlocks((current) => {
//       const next = current.filter((block) => block.id !== id);
//       setSelectedBlockId(next[0]?.id || null);
//       return next;
//     });
//   }

//   function updateLineItem(index: number, key: keyof LineItem, value: string) {
//     setInvoice((current) => {
//       const lineItems = current.lineItems.map((item, itemIndex) => {
//         if (itemIndex !== index) return item;
//         const next = { ...item, [key]: value };
//         if (key === "quantity" || key === "unitPrice") {
//           next.amount = toMoney(
//             String(Number(next.quantity || 0) * Number(next.unitPrice || 0))
//           );
//         }
//         return next;
//       });
//       return {
//         ...current,
//         lineItems,
//         amount: calculateInvoiceAmount(
//           lineItems,
//           current.taxPercentage,
//           current.discountPercentage
//         ),
//       };
//     });
//   }

//   function addLineItem() {
//     setInvoice((current) => {
//       const lineItems = [
//         ...current.lineItems,
//         {
//           description: "New item",
//           quantity: "1.00",
//           unitPrice: "0.00",
//           amount: "0.00",
//         },
//       ];
//       return {
//         ...current,
//         lineItems,
//         amount: calculateInvoiceAmount(
//           lineItems,
//           current.taxPercentage,
//           current.discountPercentage
//         ),
//       };
//     });
//   }

//   function openLogoPicker() {
//     logoInputRef.current?.click();
//   }

//   async function onLogoChange(event: ChangeEvent<HTMLInputElement>) {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
//       const message = "Please upload a PNG, JPG, or WebP logo.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Invalid logo type",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     if (file.size > MAX_LOGO_SIZE_BYTES) {
//       const message = "Logo must be 4 MB or smaller.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Logo too large",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     try {
//       const dataUrl = await readFileAsDataUrl(file);
//       setLogoDataUrl(dataUrl);
//       setLogoName(file.name);
//       showToast({
//         tone: "success",
//         title: "Logo ready",
//         description:
//           "Your logo will be rendered on the invoice canvas and final PDF.",
//       });
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Could not load logo.";
//       setError(message);
//       showToast({ tone: "error", title: "Logo failed", description: message });
//     }
//   }

//   function onAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
//     const files = Array.from(event.target.files || []);
//     if (!files.length) {
//       setAttachments([]);
//       return;
//     }

//     if (files.length > MAX_ATTACHMENTS) {
//       const message = `Attach up to ${MAX_ATTACHMENTS} PDFs at a time.`;
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Too many attachments",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     const invalidType = files.find(
//       (file) =>
//         file.type !== "application/pdf" &&
//         !file.name.toLowerCase().endsWith(".pdf")
//     );
//     if (invalidType) {
//       const message = "All attachments must be PDF files.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Invalid attachment",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     const oversized = files.find(
//       (file) => file.size > MAX_ATTACHMENT_SIZE_BYTES
//     );
//     if (oversized) {
//       const message = `${oversized.name} is larger than 12 MB.`;
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Attachment too large",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     setAttachments(files);
//     setError(null);
//   }

//   function updatePalette(key: keyof StylePalette, value: string) {
//     setInvoice((current) => ({
//       ...current,
//       style: {
//         ...current.style,
//         palette: {
//           ...current.style.palette,
//           [key]: value,
//         },
//       },
//     }));
//   }

//   function openAiModal() {
//     setError(null);
//     setAiModalOpen(true);
//   }

//   function handleAiPromptKeyDown(
//     event: ReactKeyboardEvent<HTMLTextAreaElement>
//   ) {
//     if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
//       event.preventDefault();
//       void generateAiCanvasFromPrompt(aiPrompt);
//     }
//   }

//   function clearAiDraft() {
//     setAiPrompt("");
//     setAiPromptSummary("");
//     setAiMissingFields([]);
//   }

//   function applyDraft(option: InvoiceDraftOption) {
//     setSelectedDraft(option.templateId);
//     setInvoice((current) => ({
//       ...current,
//       style: option.style,
//       accentLabel: option.style.accentLabel,
//     }));
//     setBlocks(cloneBlocks(option.blocks));
//   }

//   async function generateAiCanvasFromPrompt(rawPrompt = aiPrompt) {
//     if (loading) return;

//     const prompt = normalizeAiPrompt(rawPrompt);
//     if (prompt.length < 12) {
//       showToast({
//         tone: "error",
//         title: "Add a bit more detail",
//         description:
//           "Include who the invoice is for, what the work was, and the amount if you know it.",
//       });
//       return;
//     }

//     setAiModalOpen(false);
//     setLoading("ai-draft");
//     setError(null);

//     try {
//       const response = await fetch(`${API_BASE}/invoices/ai-canvas-draft`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt }),
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not create the AI invoice draft."
//         );
//       }

//       const data = json.data as AiCanvasDraftResult;
//       setAiPrompt(prompt);
//       setAiPromptSummary(
//         String(data?.promptSummary || "AI created an editable invoice draft.")
//       );
//       setAiMissingFields(
//         Array.isArray(data?.missingFields) ? data.missingFields.slice(0, 6) : []
//       );
//       setInvoice(normalizeInvoiceState(data.invoice, today));
//       setBlocks(cloneBlocks(data.blocks));
//       setSelectedDraft(data.templateId);
//       setSelectedBlockId("invoiceNumber");
//       window.requestAnimationFrame(() => {
//         canvasStageRef.current?.scrollIntoView({
//           behavior: "smooth",
//           block: "start",
//         });
//       });
//       showToast({
//         tone: "success",
//         title: "AI invoice ready",
//         description:
//           "Your first editable canvas is ready. Review anything highlighted, then finalize.",
//       });
//     } catch (err) {
//       const message =
//         err instanceof Error
//           ? err.message
//           : "Could not create the AI invoice draft.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "AI draft failed",
//         description: message,
//       });
//     } finally {
//       setLoading(null);
//     }
//   }

//   async function generateDesigns() {
//     if (loading) return;
//     setLoading("ai");
//     setError(null);
//     try {
//       const response = await fetch(`${API_BASE}/invoices/canvas-drafts`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...invoice,
//           amount: toMoney(invoice.amount),
//           palette: invoice.style.palette,
//           selectedTemplateId: invoice.style.templateId,
//           styleDirection: invoice.style.tone,
//         }),
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not generate canvas designs."
//         );
//       }
//       const options = Array.isArray(json?.data?.options)
//         ? json.data.options
//         : [];
//       setDrafts(options);
//       if (options[0]) applyDraft(options[0]);
//       showToast({
//         tone: "success",
//         title: "4 premium options ready",
//         description: "Pick one and keep editing directly on the page.",
//       });
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Could not generate designs.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Design generation failed",
//         description: message,
//       });
//     } finally {
//       setLoading(null);
//     }
//   }

//   async function finalizeCanvas() {
//     if (loading) return;
//     let navigating = false;
//     setLoading("finalize");
//     setError(null);
//     try {
//       const formData = new FormData();
//       formData.append(
//         "invoice",
//         JSON.stringify({
//           ...invoice,
//           amount: toMoney(invoice.amount),
//           lineItems: invoice.lineItems.map((item) => ({
//             ...item,
//             quantity: toMoney(item.quantity),
//             unitPrice: toMoney(item.unitPrice),
//             amount: toMoney(item.amount),
//           })),
//           selectedTemplateId: invoice.style.templateId,
//           style: invoice.style,
//           palette: invoice.style.palette,
//           canvasBlocks: blocks,
//           logoDataUrl,
//           attachmentNames: attachments.map((file) => file.name),
//         })
//       );
//       attachments.forEach((file) => formData.append("attachments", file));

//       const response = await fetch(`${API_BASE}/invoices/finalize-canvas`, {
//         method: "POST",
//         body: formData,
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not finalize canvas invoice."
//         );
//       }
//       showToast({
//         tone: "success",
//         title: "Canvas invoice finalized",
//         description: "Sealed PDF created with footer on every page.",
//       });
//       navigating = true;
//       router.push(`/invoices/${json.data.id}`);
//       router.refresh();
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Could not finalize invoice.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Finalize failed",
//         description: message,
//       });
//     } finally {
//       if (!navigating) {
//         setLoading(null);
//       }
//     }
//   }

//   function onBlockMouseDown(
//     event: ReactMouseEvent<HTMLButtonElement>,
//     id: string
//   ) {
//     event.preventDefault();
//     event.stopPropagation();
//     dragRef.current = { id, x: event.clientX, y: event.clientY };
//     setSelectedBlockId(id);
//   }

//   const overlayTitle =
//     loading === "ai-draft"
//       ? "Building your invoice with AI"
//       : loading === "ai"
//       ? "Generating premium layouts"
//       : loading === "finalize"
//       ? "Processing sealed PDF"
//       : "";
//   const overlayCopy =
//     loading === "ai-draft"
//       ? "Reading your messy notes, extracting the billing details, and placing everything onto one editable canvas."
//       : loading === "ai"
//       ? "Building four premium design systems from your data and palette."
//       : loading === "finalize"
//       ? "Please wait while we render your invoice, append attachments, and open the next page automatically."
//       : "";

//   return (
//     <>
//       {aiModalOpen ? (
//         <div
//           className="ai-modal-overlay"
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="ai-modal-title"
//         >
//           <div className="ai-modal-card">
//             <div className="ai-modal-head">
//               <div className="page-stack" style={{ gap: 6 }}>
//                 <span className="mini-chip is-accent">V1</span>
//                 <h3 id="ai-modal-title" style={{ margin: 0 }}>
//                   Generate invoice with AI
//                 </h3>
//                 <p className="muted" style={{ margin: 0 }}>
//                   Describe the job, paste messy notes, or drop in copied email
//                   text. AI will extract the core invoice fields and load one
//                   editable canvas.
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 className="btn btn-secondary ai-modal-close"
//                 onClick={() => setAiModalOpen(false)}
//               >
//                 Close
//               </button>
//             </div>

//             <label className="field-group">
//               <span className="field-label">Prompt or messy notes</span>
//               <textarea
//                 className="input-shell ai-modal-textarea"
//                 value={aiPrompt}
//                 onChange={(event) => setAiPrompt(event.target.value)}
//                 onKeyDown={handleAiPromptKeyDown}
//                 placeholder="Example: Invoice Acme Corp for a landing page redesign, 3 weeks of work, $4,500 USD, due next Friday, add 18% GST, mention payment by bank transfer."
//                 maxLength={4000}
//                 autoFocus
//               />
//             </label>

//             <div className="ai-modal-tips">
//               <span className="mini-chip">Paste WhatsApp or email text</span>
//               <span className="mini-chip">
//                 Mention VAT / GST / tax if known
//               </span>
//               <span className="mini-chip">Ctrl/Cmd + Enter to generate</span>
//             </div>

//             <div className="ai-modal-actions">
//               <button
//                 type="button"
//                 className="btn btn-secondary"
//                 onClick={() => setAiModalOpen(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 className="btn btn-primary"
//                 onClick={() => generateAiCanvasFromPrompt(aiPrompt)}
//                 disabled={normalizeAiPrompt(aiPrompt).length < 12}
//               >
//                 Generate canvas
//               </button>
//             </div>
//           </div>
//         </div>
//       ) : null}
//       <datalist id="invoice-currency-list">
//         {CURRENCY_OPTIONS.map((currencyCode) => (
//           <option key={currencyCode} value={currencyCode} />
//         ))}
//       </datalist>
//       {loading ? (
//         <div className="submit-overlay" aria-live="polite" aria-busy="true">
//           <div className="submit-overlay-card">
//             <div className="submit-overlay-inner">
//               <Spinner size="xl" tone="brand" />
//               <h3>{overlayTitle}</h3>
//               <p>{overlayCopy}</p>
//             </div>
//           </div>
//         </div>
//       ) : null}
//       <div className="invoice-builder-stack">
//         <input
//           ref={logoInputRef}
//           type="file"
//           accept="image/png,image/jpeg,image/webp"
//           onChange={onLogoChange}
//           style={{ display: "none" }}
//         />
//         {error ? <div className="error-banner">{error}</div> : null}

//         <section
//           className="invoice-panel-card canvas-primary-card"
//           ref={canvasStageRef}
//         >
//           <div className="canvas-workspace">
//             <div
//               ref={canvasViewportRef}
//               className="invoice-canvas-scroll canvas-primary-scroll"
//             >
//               <div
//                 className="invoice-canvas-stage"
//                 style={{ height: `${PAGE_HEIGHT * canvasScale}px` }}
//               >
//                 <div
//                   className="invoice-canvas-stage-scale"
//                   style={{ transform: `scale(${canvasScale})` }}
//                 >
//                   <InvoiceCanvasPage
//                     invoice={invoice}
//                     blocks={blocks}
//                     logoDataUrl={logoDataUrl}
//                     selectedBlockId={selectedBlockId}
//                     onSelectBlock={setSelectedBlockId}
//                     onBlockMouseDown={onBlockMouseDown}
//                     onUpdateInvoice={updateInvoice}
//                     onUpdateLineItem={updateLineItem}
//                     onAddLineItem={addLineItem}
//                     onDeleteBlock={deleteBlock}
//                     onLogoPick={openLogoPicker}
//                   />
//                 </div>
//               </div>
//             </div>

//             <aside className="canvas-side-tools">
//               <section className="invoice-panel-card palette-mini-card">
//                 <div className="invoice-panel-head">
//                   <h2>Palette</h2>
//                 </div>
//                 <div className="palette-mini-grid">
//                   {(
//                     Object.keys(invoice.style.palette) as Array<
//                       keyof StylePalette
//                     >
//                   ).map((key) => (
//                     <label key={key} className="palette-swatch" title={key}>
//                       <input
//                         className="palette-swatch-input"
//                         type="color"
//                         value={invoice.style.palette[key]}
//                         onChange={(event) =>
//                           updatePalette(key, event.target.value)
//                         }
//                         aria-label={`Change ${key} color`}
//                       />
//                       <span
//                         className="palette-swatch-dot"
//                         style={{ background: invoice.style.palette[key] }}
//                       />
//                       <span className="palette-swatch-label">
//                         {key === "surfaceAlt" ? "alt" : key.slice(0, 3)}
//                       </span>
//                     </label>
//                   ))}
//                 </div>
//               </section>
//             </aside>
//           </div>
//         </section>

//         <div className="builder-bottom-grid">
//           <section className="invoice-panel-card builder-span-2 prompt-compact-card">
//             <div className="prompt-compact-shell">
//               <textarea
//                 className="input-shell ai-brief-textarea prompt-compact-textarea"
//                 value={aiPrompt}
//                 onChange={(event) => setAiPrompt(event.target.value)}
//                 onKeyDown={handleAiPromptKeyDown}
//                 placeholder="Paste prompt, brief, or messy notes here."
//                 maxLength={4000}
//               />
//               <div className="quick-row">
//                 <button
//                   type="button"
//                   className="btn btn-primary"
//                   onClick={() => generateAiCanvasFromPrompt(aiPrompt)}
//                 >
//                   Generate with AI
//                 </button>
//                 <button
//                   type="button"
//                   className="btn btn-secondary"
//                   onClick={clearAiDraft}
//                 >
//                   Clear prompt
//                 </button>
//               </div>
//             </div>
//           </section>

//           <section className="invoice-panel-card builder-span-2">
//             <div className="invoice-panel-head">
//               <h2>Attachments</h2>
//               <span className="mini-chip">PDF only</span>
//             </div>
//             <label className="upload-shell" style={{ minHeight: 0 }}>
//               <span className="upload-title">
//                 Upload additional attachments
//               </span>
//               <input
//                 type="file"
//                 accept="application/pdf,.pdf"
//                 multiple
//                 onChange={onAttachmentChange}
//               />
//               <span className="file-pill">
//                 {attachments.length
//                   ? `${attachments.length} PDF${
//                       attachments.length > 1 ? "s" : ""
//                     }`
//                   : "Optional extra PDFs"}
//               </span>
//             </label>
//             {logoName ? (
//               <span className="mini-chip">Logo: {logoName}</span>
//             ) : null}
//             {attachments.length ? (
//               <div className="attachment-list">
//                 {attachments.map((file) => (
//                   <span key={`${file.name}-${file.size}`} className="mini-chip">
//                     {file.name}
//                   </span>
//                 ))}
//               </div>
//             ) : null}
//             <div className="quick-row">
//               <button
//                 type="button"
//                 className="btn btn-secondary"
//                 onClick={openAiModal}
//               >
//                 Update with AI
//               </button>
//               <button
//                 type="button"
//                 className="btn btn-secondary"
//                 onClick={() =>
//                   setBlocks(defaultBlocks(invoice.style.templateId))
//                 }
//               >
//                 Reset layout
//               </button>
//               <button
//                 type="button"
//                 className="btn btn-primary"
//                 onClick={finalizeCanvas}
//               >
//                 Finalize canvas PDF
//               </button>
//             </div>
//           </section>
//         </div>
//       </div>{" "}
//       <style jsx global>{`
//         .ai-modal-overlay {
//           position: fixed;
//           inset: 0;
//           z-index: 60;
//           display: grid;
//           place-items: center;
//           padding: 24px;
//           background: rgba(15, 23, 42, 0.44);
//           backdrop-filter: blur(10px);
//         }
//         .ai-modal-card {
//           width: min(720px, 100%);
//           border-radius: 30px;
//           padding: 24px;
//           display: grid;
//           gap: 18px;
//           border: 1px solid rgba(101, 79, 230, 0.14);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.98),
//             rgba(247, 245, 255, 0.96)
//           );
//           box-shadow: 0 30px 80px rgba(15, 23, 42, 0.24);
//         }
//         .ai-modal-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           gap: 16px;
//         }
//         .ai-modal-close {
//           white-space: nowrap;
//         }
//         .ai-modal-textarea,
//         .ai-brief-textarea {
//           min-height: 140px;
//           resize: vertical;
//           line-height: 1.55;
//         }
//         .ai-brief-card {
//           position: relative;
//           overflow: hidden;
//         }
//         .ai-brief-card::after {
//           content: "";
//           position: absolute;
//           inset: auto -30px -30px auto;
//           width: 180px;
//           height: 180px;
//           border-radius: 999px;
//           background: radial-gradient(
//             circle,
//             rgba(91, 140, 255, 0.18),
//             rgba(91, 140, 255, 0)
//           );
//           pointer-events: none;
//         }
//         .ai-empty-state {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 16px;
//           flex-wrap: wrap;
//         }
//         .ai-modal-tips {
//           display: flex;
//           gap: 8px;
//           flex-wrap: wrap;
//         }
//         .ai-modal-actions {
//           display: flex;
//           justify-content: flex-end;
//           gap: 10px;
//           flex-wrap: wrap;
//         }
//         .ai-missing-chip {
//           background: rgba(245, 158, 11, 0.12);
//           border-color: rgba(245, 158, 11, 0.24);
//           color: #9a6700;
//         }
//         .canvas-logo-placeholder {
//           width: 100%;
//           height: 100%;
//           display: grid;
//           place-items: center;
//           gap: 6px;
//           text-align: center;
//           background: repeating-linear-gradient(
//             135deg,
//             rgba(255, 255, 255, 0.94),
//             rgba(255, 255, 255, 0.94) 10px,
//             rgba(241, 245, 249, 0.94) 10px,
//             rgba(241, 245, 249, 0.94) 20px
//           );
//           color: #0f172a;
//         }
//         .canvas-logo-placeholder-badge {
//           width: 44px;
//           height: 44px;
//           border-radius: 999px;
//           display: grid;
//           place-items: center;
//           background: rgba(15, 23, 42, 0.9);
//           color: #fff;
//           font-weight: 900;
//         }
//         .canvas-logo-placeholder-copy {
//           font-size: 0.76rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//           opacity: 0.72;
//         }
//         .invoice-builder-stack {
//           display: grid;
//           gap: 18px;
//         }
//         .canvas-primary-card {
//           gap: 0;
//           padding: 12px;
//         }
//         .builder-bottom-grid {
//           display: grid;
//           grid-template-columns: 1fr;
//           gap: 14px;
//           align-items: start;
//           // justify-items: center;
//         }
//         // .builder-bottom-grid > section {
//         //   width: min(960px, 100%);
//         //   margin: 0 auto;
//         // }

//         .builder-span-2 {
//           grid-column: 1 / -1;
//         }
//         .canvas-workspace {
//           display: grid;
//           grid-template-columns: minmax(0, 1fr) 104px;
//           gap: 10px;
//           align-items: start;
//         }
//         .canvas-side-tools {
//           display: grid;
//           gap: 12px;
//           align-self: stretch;
//         }
//         .palette-mini-card {
//           padding: 10px 8px;
//           gap: 8px;
//           position: sticky;
//           top: 96px;
//         }
//         .palette-mini-grid {
//           display: grid;
//           justify-items: center;
//           gap: 8px;
//         }
//         .palette-swatch {
//           position: relative;
//           width: 56px;
//           display: grid;
//           justify-items: center;
//           gap: 4px;
//           padding: 6px 4px;
//           border-radius: 16px;
//           background: rgba(255, 255, 255, 0.86);
//           border: 1px solid rgba(15, 23, 42, 0.06);
//           cursor: pointer;
//         }
//         .palette-swatch-input {
//           position: absolute;
//           inset: 0;
//           opacity: 0;
//           cursor: pointer;
//         }
//         .palette-swatch-dot {
//           width: 22px;
//           height: 22px;
//           border-radius: 999px;
//           box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08),
//             0 10px 20px rgba(15, 23, 42, 0.12);
//         }
//         .palette-swatch-label {
//           font-size: 0.54rem;
//           font-weight: 800;
//           letter-spacing: 0.08em;
//           text-transform: uppercase;
//           color: var(--muted-strong);
//         }
//         .prompt-compact-card {
//           padding: 14px 18px;
//           display: grid;
//           justify-items: center;
//         }
//         .prompt-compact-shell {
//           width: min(640px, 100%);
//           display: grid;
//           gap: 12px;
//           justify-items: center;
//           margin: 0 auto;
//         }
//         .prompt-compact-textarea {
//           min-height: 90px;
//           max-height: 140px;
//         }
//         .invoice-panel-card {
//           border-radius: 28px;
//           border: 1px solid rgba(101, 79, 230, 0.1);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.97),
//             rgba(248, 246, 255, 0.95)
//           );
//           box-shadow: var(--shadow-soft);
//           padding: 18px;
//           display: grid;
//           gap: 14px;
//         }
//         .invoice-panel-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 8px;
//         }
//         .invoice-panel-head h2 {
//           margin: 0;
//           font-size: 0.9rem;
//           letter-spacing: -0.03em;
//         }
//         .attachment-list {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 8px;
//         }
//         .canvas-primary-scroll {
//           min-width: 0;
//         }
//         .invoice-canvas-scroll {
//           overflow: hidden;
//           padding: 12px;
//           border-radius: 34px;
//           border: 1px solid rgba(101, 79, 230, 0.1);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.94),
//             rgba(242, 241, 255, 0.82)
//           );
//           box-shadow: var(--shadow);
//         }
//         .invoice-canvas-stage {
//           width: 100%;
//           display: flex;
//           justify-content: center;
//           align-items: flex-start;
//           overflow: hidden;
//         }
//         .invoice-canvas-stage-scale {
//           transform-origin: top center;
//           will-change: transform;
//         }
//         .invoice-canvas-page {
//           position: relative;
//           margin: 0 auto;
//           border-radius: 32px;
//           overflow: hidden;
//           box-shadow: 0 30px 70px rgba(66, 74, 130, 0.18);
//         }
//         .invoice-canvas-bg,
//         .invoice-canvas-line {
//           position: absolute;
//           inset: 0;
//           pointer-events: none;
//         }
//         .invoice-canvas-bg-luxury {
//           inset: 0 0 auto 0;
//           height: 250px;
//         }
//         .invoice-canvas-bg-creative {
//           inset: 0 0 auto 0;
//           height: 220px;
//         }
//         .invoice-canvas-bg-creative-accent {
//           inset: 0 0 auto auto;
//           width: 160px;
//           height: 220px;
//           opacity: 0.92;
//         }
//         .invoice-canvas-bg-corporate {
//           inset: 0 auto auto 0;
//           width: 132px;
//           height: 155px;
//         }
//         .invoice-canvas-line {
//           inset: 118px 40px auto 40px;
//           height: 1px;
//           border-top: 1px solid transparent;
//         }
//         .canvas-block {
//           position: absolute;
//           padding: 10px;
//           border: 1px solid rgba(15, 23, 42, 0.08);
//           backdrop-filter: blur(8px);
//           transition: box-shadow 0.18s ease, border-color 0.18s ease;
//         }
//         .canvas-block:hover {
//           box-shadow: 0 10px 30px rgba(77, 88, 138, 0.12);
//         }
//         .canvas-drag-handle {
//           position: absolute;
//           top: 8px;
//           right: 38px;
//           z-index: 3;
//           width: 26px;
//           height: 26px;
//           border: 0;
//           border-radius: 999px;
//           background: rgba(15, 23, 42, 0.08);
//           color: inherit;
//           font-weight: 900;
//         }
//         .canvas-delete-handle {
//           position: absolute;
//           top: 8px;
//           right: 8px;
//           z-index: 3;
//           width: 26px;
//           height: 26px;
//           border: 0;
//           border-radius: 999px;
//           background: rgba(239, 68, 68, 0.12);
//           color: #b91c1c;
//           font-size: 1rem;
//           font-weight: 900;
//         }
//         .canvas-logo-inner {
//           width: 100%;
//           height: 100%;
//           display: grid;
//           place-items: center;
//           overflow: hidden;
//           border-radius: inherit;
//           font-size: 1.2rem;
//           font-weight: 900;
//           color: #fff;
//           background: rgba(15, 23, 42, 0.9);
//           border: 0;
//           padding: 0;
//         }
//         .canvas-logo-inner.is-uploadable {
//           cursor: pointer;
//         }
//         .canvas-logo-inner.is-uploadable:hover {
//           box-shadow: inset 0 0 0 2px rgba(22, 64, 214, 0.32);
//         }
//         .canvas-logo-image {
//           width: 100%;
//           height: 100%;
//           object-fit: contain;
//           background: #fff;
//         }
//         .canvas-inline-input,
//         .canvas-inline-textarea,
//         .canvas-inline-currency,
//         .canvas-inline-amount {
//           width: 100%;
//           border: 0;
//           outline: none;
//           background: transparent;
//           padding: 0;
//           color: inherit;
//           font: inherit;
//           font-size: 0.64rem;
//         }
//         .canvas-inline-input.is-readonly,
//         .canvas-inline-amount.is-readonly {
//           cursor: default;
//         }
//         .canvas-inline-input::placeholder,
//         .canvas-inline-textarea::placeholder {
//           color: inherit;
//           opacity: 0.45;
//         }
//         .canvas-inline-title {
//           font-size: 0.72rem;
//           font-weight: 700;
//           letter-spacing: 0.02em;
//           text-transform: uppercase;
//         }
//         .canvas-inline-number {
//           font-size: 1.2rem;
//           font-weight: 800;
//           letter-spacing: -0.04em;
//         }
//         .canvas-inline-textarea {
//           resize: none;
//           min-height: 34px;
//           line-height: 1.35;
//         }
//         .canvas-inline-notes {
//           min-height: 48px;
//         }
//         .canvas-amount-shell,
//         .canvas-multiline-card,
//         .canvas-meta-grid,
//         .canvas-notes-shell {
//           display: grid;
//           gap: 8px;
//           height: 100%;
//         }
//         .canvas-kicker {
//           font-size: 0.52rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//           opacity: 0.74;
//         }
//         .canvas-amount-row {
//           display: grid;
//           grid-template-columns: 46px 1fr;
//           gap: 6px;
//           align-items: center;
//           margin-top: 2px;
//         }
//         .canvas-inline-currency {
//           font-size: 0.62rem;
//           font-weight: 800;
//         }
//         .canvas-inline-amount {
//           font-size: 1.38rem;
//           font-weight: 800;
//           letter-spacing: -0.04em;
//         }
//         .canvas-subtle-copy {
//           margin-top: auto;
//           font-size: 0.54rem;
//           opacity: 0.75;
//         }
//         .canvas-dual-row {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 8px;
//         }
//         .canvas-meta-grid {
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           align-content: start;
//         }
//         .canvas-table-shell {
//           display: grid;
//           grid-template-rows: auto 1fr auto auto;
//           gap: 8px;
//           height: 100%;
//         }
//         .canvas-table-head,
//         .canvas-table-row {
//           display: grid;
//           grid-template-columns: 1.78fr 0.42fr 0.56fr 0.56fr 0.78fr;
//           gap: 6px;
//           align-items: center;
//         }
//         .canvas-table-head {
//           padding: 8px 10px;
//           border-radius: 14px;
//           font-size: 0.56rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.04em;
//         }
//         .canvas-table-body {
//           display: grid;
//           gap: 8px;
//           overflow: auto;
//           align-content: start;
//         }
//         .canvas-table-row {
//           padding: 7px 8px;
//           border-radius: 12px;
//           background: rgba(255, 255, 255, 0.72);
//           border: 1px solid rgba(15, 23, 42, 0.06);
//         }
//         .canvas-table-add {
//           justify-self: start;
//           border: 0;
//           border-radius: 999px;
//           padding: 7px 11px;
//           background: rgba(15, 23, 42, 0.07);
//           font-size: 0.62rem;
//           font-weight: 800;
//           color: inherit;
//         }
//         .canvas-table-currency {
//           text-transform: uppercase;
//           letter-spacing: 0.04em;
//         }
//         .canvas-table-summary {
//           display: grid;
//           gap: 6px;
//           margin-top: auto;
//           margin-left: auto;
//           width: min(320px, 100%);
//           padding-top: 10px;
//           border-top: 1px solid rgba(15, 23, 42, 0.1);
//         }
//         .canvas-table-summary > div {
//           width: 100%;
//           display: grid;
//           grid-template-columns: minmax(0, 1fr) auto;
//           gap: 16px;
//           align-items: center;
//           font-size: 0.62rem;
//           line-height: 1.3;
//         }
//         .canvas-table-summary > div > span {
//           text-align: right;
//           color: rgba(15, 23, 42, 0.78);
//           font-weight: 700;
//         }
//         .canvas-table-summary > div.is-grand {
//           margin-top: 2px;
//           padding-top: 8px;
//           border-top: 1px solid rgba(15, 23, 42, 0.14);
//           font-size: 0.72rem;
//         }
//         .canvas-table-summary > div.is-grand > span {
//           color: inherit;
//           font-weight: 800;
//         }
//         .canvas-table-summary strong {
//           font-size: inherit;
//         }
//         .canvas-table-summary-value {
//           min-width: 128px;
//           text-align: right;
//           white-space: nowrap;
//           font-variant-numeric: tabular-nums;
//         }
//         .canvas-tax-summary-label {
//           display: inline-flex;
//           align-items: center;
//           justify-content: flex-end;
//           gap: 3px;
//           flex-wrap: wrap;
//         }
//         .canvas-inline-tax-rate {
//           width: 38px;
//           min-width: 38px;
//           text-align: center;
//           font-weight: 800;
//           padding: 0;
//         }
//         .canvas-notes-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 8px;
//         }
//         .canvas-mini-action {
//           border: 0;
//           border-radius: 999px;
//           padding: 4px 8px;
//           background: rgba(15, 23, 42, 0.08);
//           color: inherit;
//           font-size: 0.56rem;
//           font-weight: 800;
//         }
//         .invoice-footer-preview {
//           position: absolute;
//           left: 16px;
//           right: 16px;
//           bottom: 12px;
//           height: 74px;
//           border-radius: 22px;
//           border: 1px solid rgba(15, 23, 42, 0.1);
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 14px;
//           padding: 12px 16px;
//         }
//         .invoice-footer-copy {
//           display: grid;
//           gap: 3px;
//           font-size: 0.62rem;
//         }
//         .invoice-footer-link {
//           font-weight: 800;
//         }
//         .invoice-footer-qr {
//           width: 54px;
//           height: 54px;
//           border-radius: 14px;
//           display: grid;
//           place-items: center;
//           background: #fff;
//           color: #111827;
//           font-weight: 900;
//           border: 1px solid rgba(15, 23, 42, 0.08);
//         }
//         .palette-grid {
//           display: grid;
//           gap: 10px;
//         }
//         .palette-row {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 12px;
//           border-radius: 16px;
//           padding: 8px 10px;
//           background: rgba(255, 255, 255, 0.76);
//           border: 1px solid rgba(15, 23, 42, 0.06);
//           font-weight: 700;
//           text-transform: capitalize;
//         }
//         .palette-row input {
//           width: 42px;
//           height: 42px;
//           border: 0;
//           background: transparent;
//           padding: 0;
//         }
//         .design-options-grid {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 14px;
//         }
//         .design-option-card {
//           width: 100%;
//           border-radius: 26px;
//           padding: 14px;
//           display: grid;
//           gap: 12px;
//           text-align: left;
//           box-shadow: var(--shadow-soft);
//         }
//         .design-option-card.is-active {
//           outline: 2px solid currentColor;
//         }
//         .premium-template-header {
//           display: flex;
//           justify-content: space-between;
//           gap: 10px;
//           align-items: center;
//           flex-wrap: wrap;
//         }
//         .premium-template-title {
//           font-weight: 800;
//           font-size: 1.05rem;
//           letter-spacing: -0.03em;
//         }
//         .mini-canvas-frame {
//           overflow: hidden;
//           border-radius: 18px;
//           background: rgba(255, 255, 255, 0.54);
//           border: 1px solid rgba(15, 23, 42, 0.08);
//           height: 236px;
//           position: relative;
//         }
//         .mini-canvas-scale {
//           position: absolute;
//           top: 0;
//           left: 0;
//           transform: scale(0.28);
//           transform-origin: top left;
//           width: ${PAGE_WIDTH}px;
//           height: ${PAGE_HEIGHT}px;
//         }
// //         @media (max-width: 1180px) {
//           .ai-pass-row,
//           .ai-variant-grid,
//           .ai-optimize-grid {
//             grid-template-columns: repeat(2, minmax(0, 1fr));
//           }
//         }
//         @media (max-width: 900px) {
//           .ai-tab-row,
//           .ai-pass-row,
//           .ai-variant-grid,
//           .ai-optimize-grid,
//           .variant-score-grid {
//             grid-template-columns: minmax(0, 1fr);
//           }
//           .ai-orchestra-input-row {
//             grid-template-columns: minmax(0, 1fr);
//           }
//           .ai-modal-overlay {
//             padding: 12px;
//           }
//           .ai-modal-card {
//             padding: 18px;
//           }
//           .ai-modal-head,
//           .ai-empty-state {
//             flex-direction: column;
//             align-items: stretch;
//           }
//         }
//         @media (max-width: 1120px) {
//           .builder-bottom-grid,
//           .design-options-grid,
//           .canvas-workspace {
//             grid-template-columns: 1fr;
//           }
//           .canvas-side-tools {
//             order: -1;
//           }
//           .palette-mini-card {
//             position: static;
//           }
//           .prompt-compact-shell {
//             width: 100%;
//           }
//         }
//         @media (max-width: 720px) {
//           .invoice-canvas-scroll {
//             padding: 8px;
//           }
//         }
//       `}</style>
//     </>
//   );
// }
// "use client";

// import type {
//   ChangeEvent,
//   KeyboardEvent as ReactKeyboardEvent,
//   MouseEvent as ReactMouseEvent,
// } from "react";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { Spinner } from "../../../components/ui/spinner";
// import { useToast } from "../../../components/ui/toast-provider";
// import {
//   clearPendingInvoiceDraft,
//   loadPendingInvoiceDraft,
// } from "../../../lib/invoice-draft-transfer";

// type LoadingState = null | "ai" | "ai-draft" | "finalize";

// const MAX_LOGO_SIZE_BYTES = 4 * 1024 * 1024;
// const MAX_ATTACHMENT_SIZE_BYTES = 12 * 1024 * 1024;
// const MAX_ATTACHMENTS = 10;

// type LineItem = {
//   description: string;
//   quantity: string;
//   unitPrice: string;
//   amount: string;
// };

// type StylePalette = {
//   primary: string;
//   secondary: string;
//   surface: string;
//   surfaceAlt: string;
//   text: string;
//   muted: string;
//   accent: string;
// };

// type StyleTheme = {
//   templateId: string;
//   styleName: string;
//   accentLabel: string;
//   hierarchyStyle: string;
//   tone: string;
//   lineItemPresentation: string;
//   footerStyle: string;
//   trustBadge: string;
//   previewSummary: string;
//   headerTitle: string;
//   heroCopy: string;
//   palette: StylePalette;
// };

// type CanvasBlock = {
//   id: string;
//   type: string;
//   x: number;
//   y: number;
//   w: number;
//   h: number;
//   z?: number;
//   locked?: boolean;
//   editable?: boolean;
//   content?: string;
//   binding?: { key?: string };
//   style?: {
//     fontSize?: number;
//     fontWeight?: string;
//     color?: string;
//     background?: string;
//     align?: string;
//     radius?: number;
//   };
// };

// type InvoiceDraftOption = {
//   title: string;
//   accentLabel: string;
//   templateId: string;
//   styleDirection: string;
//   style: StyleTheme;
//   blocks: CanvasBlock[];
//   summary: string;
// };

// type AiCanvasDraftResult = InvoiceDraftOption & {
//   promptSummary: string;
//   missingFields: string[];
//   invoice: InvoiceState;
// };

// type InvoiceState = {
//   invoiceNumber: string;
//   customerName: string;
//   amount: string;
//   currency: string;
//   taxPercentage: string;
//   discountPercentage: string;
//   issueDate: string;
//   dueDate: string;
//   notes: string;
//   paymentTerms: string;
//   issuerName: string;
//   issuerEmail: string;
//   issuerAddress: string;
//   accentLabel: string;
//   lineItems: LineItem[];
//   style: StyleTheme;
// };

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
// const PAGE_WIDTH = 595.28;
// const PAGE_HEIGHT = 841.89;
// const FOOTER_HEIGHT = 92;
// const intlWithSupportedValues = Intl as typeof Intl & {
//   supportedValuesOf?: (key: string) => string[];
// };
// const FALLBACK_CURRENCY_OPTIONS = [
//   "USD",
//   "EUR",
//   "GBP",
//   "INR",
//   "JPY",
//   "CNY",
//   "AUD",
//   "CAD",
//   "NZD",
//   "SGD",
//   "HKD",
//   "AED",
//   "SAR",
//   "QAR",
//   "KWD",
//   "BHD",
//   "OMR",
//   "CHF",
//   "SEK",
//   "NOK",
//   "DKK",
//   "ISK",
//   "PLN",
//   "CZK",
//   "HUF",
//   "RON",
//   "BGN",
//   "TRY",
//   "RUB",
//   "UAH",
//   "ZAR",
//   "NGN",
//   "KES",
//   "GHS",
//   "EGP",
//   "MAD",
//   "MXN",
//   "BRL",
//   "ARS",
//   "CLP",
//   "COP",
//   "PEN",
//   "UYU",
//   "PYG",
//   "BOB",
//   "CRC",
//   "DOP",
//   "JMD",
//   "TTD",
//   "BBD",
//   "BSD",
//   "BMD",
//   "KRW",
//   "THB",
//   "VND",
//   "IDR",
//   "MYR",
//   "PHP",
//   "TWD",
//   "PKR",
//   "BDT",
//   "LKR",
//   "NPR",
//   "ILS",
// ];
// const CURRENCY_OPTIONS = Array.from(
//   new Set(
//     (typeof intlWithSupportedValues.supportedValuesOf === "function"
//       ? intlWithSupportedValues.supportedValuesOf("currency")
//       : FALLBACK_CURRENCY_OPTIONS
//     ).map((code) => code.toUpperCase())
//   )
// ).sort();
// const CURRENCY_OPTION_SET = new Set(CURRENCY_OPTIONS);
// const CURRENCY_DETECTION_RULES: Array<{ pattern: RegExp; code: string }> = [
//   { pattern: /US\$/i, code: "USD" },
//   { pattern: /A\$/i, code: "AUD" },
//   { pattern: /C\$/i, code: "CAD" },
//   { pattern: /NZ\$/i, code: "NZD" },
//   { pattern: /HK\$/i, code: "HKD" },
//   { pattern: /S\$/i, code: "SGD" },
//   { pattern: /R\$/i, code: "BRL" },
//   { pattern: /\bAED\b|\bDH\b|د\.إ/i, code: "AED" },
//   { pattern: /\bSAR\b|ر\.س/i, code: "SAR" },
//   { pattern: /\bQAR\b|ر\.ق/i, code: "QAR" },
//   { pattern: /\bKWD\b|د\.ك/i, code: "KWD" },
//   { pattern: /\bBHD\b|د\.ب/i, code: "BHD" },
//   { pattern: /\bOMR\b|ر\.ع/i, code: "OMR" },
//   { pattern: /€/i, code: "EUR" },
//   { pattern: /£/i, code: "GBP" },
//   { pattern: /₹/i, code: "INR" },
//   { pattern: /\bCNY\b|\bRMB\b|CN¥|￥|元/i, code: "CNY" },
//   { pattern: /¥|円/i, code: "JPY" },
//   { pattern: /₩/i, code: "KRW" },
//   { pattern: /₽/i, code: "RUB" },
//   { pattern: /₴/i, code: "UAH" },
//   { pattern: /₺/i, code: "TRY" },
//   { pattern: /₫/i, code: "VND" },
//   { pattern: /฿/i, code: "THB" },
//   { pattern: /₱/i, code: "PHP" },
//   { pattern: /₦/i, code: "NGN" },
//   { pattern: /₵/i, code: "GHS" },
//   { pattern: /₪/i, code: "ILS" },
//   { pattern: /₨/i, code: "PKR" },
//   { pattern: /\$/i, code: "USD" },
// ];

// const BASE_STYLES: Record<string, StyleTheme> = {
//   luxury: {
//     templateId: "luxury",
//     styleName: "Luxury editorial",
//     accentLabel: "Luxury",
//     hierarchyStyle: "Editorial hierarchy",
//     tone: "Elevated and executive",
//     lineItemPresentation: "Premium ledger",
//     footerStyle: "Dark verified footer",
//     trustBadge: "Sealed premium proof",
//     previewSummary: "Dark navy hero with warm metallic accents.",
//     headerTitle: "Premium invoice",
//     heroCopy: "Refined presentation for retainers and premium engagements.",
//     palette: {
//       primary: "#111827",
//       secondary: "#C6A35C",
//       surface: "#F8F4EC",
//       surfaceAlt: "#1F2937",
//       text: "#111827",
//       muted: "#6B7280",
//       accent: "#E8D3A2",
//     },
//   },
//   corporate: {
//     templateId: "corporate",
//     styleName: "Corporate executive",
//     accentLabel: "Corporate",
//     hierarchyStyle: "Structured executive layout",
//     tone: "Crisp and confident",
//     lineItemPresentation: "Boardroom finance table",
//     footerStyle: "Compliance-ready footer",
//     trustBadge: "Audit-ready seal",
//     previewSummary: "Royal blue structure with sharp financial hierarchy.",
//     headerTitle: "Executive invoice",
//     heroCopy: "",
//     palette: {
//       primary: "#1640D6",
//       secondary: "#0F172A",
//       surface: "#F4F7FF",
//       surfaceAlt: "#DCE7FF",
//       text: "#0F172A",
//       muted: "#475569",
//       accent: "#5B8CFF",
//     },
//   },
//   creative: {
//     templateId: "creative",
//     styleName: "Creative studio",
//     accentLabel: "Creative",
//     hierarchyStyle: "Expressive split layout",
//     tone: "Energetic and premium",
//     lineItemPresentation: "Story-led service table",
//     footerStyle: "Ribbon footer with proof",
//     trustBadge: "Studio-grade proof",
//     previewSummary: "Vibrant purple canvas with warm highlights.",
//     headerTitle: "Studio invoice",
//     heroCopy: "Ideal for branding, design, product, and creative retainers.",
//     palette: {
//       primary: "#7C3AED",
//       secondary: "#F97316",
//       surface: "#FAF5FF",
//       surfaceAlt: "#FCE7F3",
//       text: "#2E1065",
//       muted: "#6D28D9",
//       accent: "#FDBA74",
//     },
//   },
//   minimal: {
//     templateId: "minimal",
//     styleName: "Minimal modern",
//     accentLabel: "Minimal",
//     hierarchyStyle: "Quiet whitespace-first layout",
//     tone: "Calm and precise",
//     lineItemPresentation: "Minimal rows with understated separators",
//     footerStyle: "Quiet proof footer",
//     trustBadge: "Quiet verified seal",
//     previewSummary: "Soft grayscale system with restrained premium spacing.",
//     headerTitle: "Modern invoice",
//     heroCopy: "Minimal visual noise while trust details stay present.",
//     palette: {
//       primary: "#0F172A",
//       secondary: "#94A3B8",
//       surface: "#FFFFFF",
//       surfaceAlt: "#F8FAFC",
//       text: "#0F172A",
//       muted: "#64748B",
//       accent: "#CBD5E1",
//     },
//   },
// };

// function cloneBlocks(blocks: CanvasBlock[]) {
//   return blocks.map((block) => ({
//     ...block,
//     binding: block.binding ? { ...block.binding } : undefined,
//     style: block.style ? { ...block.style } : undefined,
//   }));
// }

// function defaultBlocks(templateId: string): CanvasBlock[] {
//   const templates: Record<string, CanvasBlock[]> = {
//     corporate: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 42,
//         w: 86,
//         h: 86,
//         binding: { key: "logo" },
//         style: { radius: 24, background: "#ffffff" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 142,
//         y: 40,
//         w: 250,
//         h: 28,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 16, fontWeight: "700", color: "#5B8CFF" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 142,
//         y: 72,
//         w: 230,
//         h: 42,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 32, fontWeight: "800", color: "#0F172A" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 410,
//         y: 44,
//         w: 145,
//         h: 92,
//         binding: { key: "amount" },
//         style: { background: "#DCE7FF", color: "#1640D6", radius: 28 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 172,
//         w: 220,
//         h: 108,
//         binding: { key: "issuer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 310,
//         y: 172,
//         w: 245,
//         h: 108,
//         binding: { key: "customer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 292,
//         w: 515,
//         h: 70,
//         binding: { key: "meta" },
//         style: {
//           background: "#F4F7FF",
//           fontSize: 12,
//           color: "#475569",
//           radius: 22,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 380,
//         w: 515,
//         h: 230,
//         binding: { key: "lineItems" },
//         style: { background: "#ffffff", radius: 24 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 622,
//         w: 515,
//         h: 102,
//         binding: { key: "notes" },
//         style: {
//           background: "#ffffff",
//           fontSize: 12,
//           color: "#475569",
//           radius: 20,
//         },
//       },
//     ],
//     luxury: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 48,
//         w: 84,
//         h: 84,
//         binding: { key: "logo" },
//         style: { radius: 24, background: "#1F2937" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 40,
//         y: 152,
//         w: 180,
//         h: 28,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 14, fontWeight: "700", color: "#C6A35C" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 40,
//         y: 182,
//         w: 290,
//         h: 42,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 34, fontWeight: "800", color: "#FFFFFF" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 392,
//         y: 74,
//         w: 163,
//         h: 118,
//         binding: { key: "amount" },
//         style: { background: "#E8D3A2", color: "#111827", radius: 28 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 272,
//         w: 220,
//         h: 108,
//         binding: { key: "issuer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#111827" },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 310,
//         y: 272,
//         w: 245,
//         h: 108,
//         binding: { key: "customer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#111827" },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 392,
//         w: 515,
//         h: 74,
//         binding: { key: "meta" },
//         style: {
//           background: "#F7EFE3",
//           fontSize: 12,
//           color: "#6B7280",
//           radius: 22,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 480,
//         w: 515,
//         h: 190,
//         binding: { key: "lineItems" },
//         style: { background: "#FFFDF9", radius: 24 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 684,
//         w: 515,
//         h: 64,
//         binding: { key: "notes" },
//         style: {
//           background: "#F7EFE3",
//           fontSize: 12,
//           color: "#6B7280",
//           radius: 20,
//         },
//       },
//     ],
//     creative: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 44,
//         w: 90,
//         h: 90,
//         binding: { key: "logo" },
//         style: { radius: 28, background: "#ffffff" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 154,
//         y: 46,
//         w: 180,
//         h: 28,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 16, fontWeight: "700", color: "#F97316" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 154,
//         y: 80,
//         w: 220,
//         h: 42,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 31, fontWeight: "800", color: "#FFFFFF" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 390,
//         y: 52,
//         w: 165,
//         h: 96,
//         binding: { key: "amount" },
//         style: { background: "#FDBA74", color: "#2E1065", radius: 30 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 212,
//         w: 240,
//         h: 110,
//         binding: { key: "issuer" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 13,
//           color: "#2E1065",
//           radius: 24,
//         },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 315,
//         y: 212,
//         w: 240,
//         h: 110,
//         binding: { key: "customer" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 13,
//           color: "#2E1065",
//           radius: 24,
//         },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 338,
//         w: 515,
//         h: 72,
//         binding: { key: "meta" },
//         style: {
//           background: "#FCE7F3",
//           fontSize: 12,
//           color: "#6D28D9",
//           radius: 22,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 428,
//         w: 515,
//         h: 210,
//         binding: { key: "lineItems" },
//         style: { background: "#FFFFFF", radius: 26 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 654,
//         w: 515,
//         h: 90,
//         binding: { key: "notes" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 12,
//           color: "#6D28D9",
//           radius: 22,
//         },
//       },
//     ],
//     minimal: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 44,
//         w: 72,
//         h: 72,
//         binding: { key: "logo" },
//         style: { radius: 20, background: "#F8FAFC" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 132,
//         y: 50,
//         w: 150,
//         h: 22,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 13, fontWeight: "700", color: "#64748B" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 132,
//         y: 78,
//         w: 260,
//         h: 38,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 32, fontWeight: "800", color: "#0F172A" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 402,
//         y: 58,
//         w: 153,
//         h: 82,
//         binding: { key: "amount" },
//         style: { background: "#F8FAFC", color: "#0F172A", radius: 24 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 166,
//         w: 220,
//         h: 96,
//         binding: { key: "issuer" },
//         style: { fontSize: 13, color: "#0F172A" },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 315,
//         y: 166,
//         w: 240,
//         h: 96,
//         binding: { key: "customer" },
//         style: { fontSize: 13, color: "#0F172A" },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 280,
//         w: 515,
//         h: 58,
//         binding: { key: "meta" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 12,
//           color: "#64748B",
//           radius: 18,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 364,
//         w: 515,
//         h: 238,
//         binding: { key: "lineItems" },
//         style: { background: "#FFFFFF", radius: 20 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 618,
//         w: 515,
//         h: 102,
//         binding: { key: "notes" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 12,
//           color: "#64748B",
//           radius: 18,
//         },
//       },
//     ],
//   };

//   return cloneBlocks(templates[templateId] || templates.corporate);
// }

// function toMoney(value: string) {
//   const number = Number(String(value || "0").replace(/[^\d.]/g, ""));
//   if (!Number.isFinite(number)) return "0.00";
//   return number.toFixed(2);
// }

// function detectCurrencyCode(value: string) {
//   const text = String(value || "").trim();
//   if (!text) return "";
//   for (const rule of CURRENCY_DETECTION_RULES) {
//     if (rule.pattern.test(text)) return rule.code;
//   }
//   const upper = text.toUpperCase();
//   const matches = upper.match(/[A-Z]{3}/g) || [];
//   const detected = matches.find((code) => CURRENCY_OPTION_SET.has(code));
//   if (detected) return detected;
//   const collapsed = upper.replace(/[^A-Z]/g, "").slice(0, 3);
//   return collapsed && CURRENCY_OPTION_SET.has(collapsed) ? collapsed : "";
// }

// function normalizeCurrency(value: string, fallback = "USD") {
//   return detectCurrencyCode(value) || fallback;
// }

// function sumLineItems(items: LineItem[]) {
//   return items
//     .reduce((sum, item) => sum + Number(item.amount || 0), 0)
//     .toFixed(2);
// }

// function calculateDiscountAmount(
//   items: LineItem[],
//   discountPercentage: string
// ) {
//   return (
//     (Number(sumLineItems(items)) * Number(discountPercentage || 0)) /
//     100
//   ).toFixed(2);
// }

// function calculateTaxableSubtotal(
//   items: LineItem[],
//   discountPercentage: string
// ) {
//   return Math.max(
//     Number(sumLineItems(items)) -
//       Number(calculateDiscountAmount(items, discountPercentage)),
//     0
//   ).toFixed(2);
// }

// function calculateTaxAmount(
//   items: LineItem[],
//   taxPercentage: string,
//   discountPercentage: string
// ) {
//   return (
//     (Number(calculateTaxableSubtotal(items, discountPercentage)) *
//       Number(taxPercentage || 0)) /
//     100
//   ).toFixed(2);
// }

// function calculateInvoiceAmount(
//   items: LineItem[],
//   taxPercentage: string,
//   discountPercentage: string
// ) {
//   return (
//     Number(calculateTaxableSubtotal(items, discountPercentage)) +
//     Number(calculateTaxAmount(items, taxPercentage, discountPercentage))
//   ).toFixed(2);
// }

// function parseTaxPercentageFromText(value: string) {
//   const match = String(value || "").match(/(\d+(?:\.\d+)?)\s*%/);
//   return match ? toMoney(match[1]) : null;
// }

// function normalizeLineItem(
//   item: Partial<LineItem>,
//   fallbackDescription: string
// ): LineItem {
//   const quantity = toMoney(String(item.quantity || "1"));
//   const unitPrice = toMoney(String(item.unitPrice || item.amount || "0"));

//   return {
//     description: String(item.description || fallbackDescription).slice(0, 150),
//     quantity,
//     unitPrice,
//     amount: toMoney(String(Number(quantity) * Number(unitPrice))),
//   };
// }

// function normalizeImportedLineItems(
//   rawItems: unknown,
//   fallbackItems: LineItem[]
// ) {
//   const items = Array.isArray(rawItems) ? rawItems.slice(0, 12) : [];
//   const normalized: LineItem[] = [];
//   let subtotal = 0;
//   let derivedTaxPercentage: string | null = null;

//   items.forEach((item: any, index: number) => {
//     const normalizedItem = normalizeLineItem(
//       {
//         description: String(item?.description || `Line item ${index + 1}`),
//         quantity: String(item?.quantity || "1"),
//         unitPrice: String(item?.unitPrice || item?.amount || "0"),
//         amount: String(item?.amount || item?.unitPrice || "0"),
//       },
//       `Line item ${index + 1}`
//     );
//     const description = normalizedItem.description;
//     const explicitTaxPercentage = item?.taxPercentage
//       ? toMoney(String(item.taxPercentage))
//       : parseTaxPercentageFromText(description);
//     const isTaxOnlyLine = /\b(?:gst|vat|tax)\b/i.test(description);

//     if (isTaxOnlyLine) {
//       const derivedFromAmount =
//         subtotal > 0 && Number(normalizedItem.amount || 0) > 0
//           ? toMoney(
//               String((Number(normalizedItem.amount || 0) * 100) / subtotal)
//             )
//           : null;
//       derivedTaxPercentage =
//         derivedFromAmount ||
//         explicitTaxPercentage ||
//         derivedTaxPercentage ||
//         "0.00";
//       return;
//     }

//     normalized.push(normalizedItem);
//     subtotal += Number(normalizedItem.amount || 0);

//     if (
//       !derivedTaxPercentage &&
//       explicitTaxPercentage &&
//       Number(explicitTaxPercentage) > 0
//     ) {
//       derivedTaxPercentage = explicitTaxPercentage;
//     }
//   });

//   return {
//     lineItems: normalized.length ? normalized : fallbackItems,
//     taxPercentage: derivedTaxPercentage || "0.00",
//   };
// }

// function normalizeInvoiceState(
//   input: Partial<InvoiceState>,
//   today: string
// ): InvoiceState {
//   const base = createInitialInvoice(today);
//   const rawStyle = input.style || base.style;
//   const baseStyle = BASE_STYLES[rawStyle.templateId] || base.style;
//   const imported = normalizeImportedLineItems(
//     (input as { lineItems?: unknown }).lineItems,
//     base.lineItems
//   );
//   const taxPercentage = toMoney(
//     String(
//       (input as { taxPercentage?: string }).taxPercentage ||
//         imported.taxPercentage ||
//         base.taxPercentage
//     )
//   );
//   const discountPercentage = toMoney(
//     String(
//       (input as { discountPercentage?: string }).discountPercentage ||
//         base.discountPercentage
//     )
//   );
//   const lineItems = imported.lineItems;
//   const style = {
//     ...baseStyle,
//     ...rawStyle,
//     palette: {
//       ...baseStyle.palette,
//       ...(rawStyle.palette || {}),
//     },
//   };

//   return {
//     ...base,
//     ...input,
//     currency: normalizeCurrency(
//       String(input.currency || base.currency),
//       base.currency
//     ),
//     taxPercentage,
//     discountPercentage,
//     amount: calculateInvoiceAmount(
//       lineItems,
//       taxPercentage,
//       discountPercentage
//     ),
//     notes: String(input.notes ?? base.notes),
//     paymentTerms: String(input.paymentTerms ?? base.paymentTerms),
//     accentLabel: String(input.accentLabel || style.accentLabel),
//     lineItems,
//     style,
//   };
// }

// function normalizeAiPrompt(value: string) {
//   return String(value || "")
//     .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
//     .replace(/\s+/g, " ")
//     .trim()
//     .slice(0, 4000);
// }

// function readFileAsDataUrl(file: File) {
//   return new Promise<string>((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(String(reader.result || ""));
//     reader.onerror = () => reject(new Error("Could not read file."));
//     reader.readAsDataURL(file);
//   });
// }

// function mergeStyle(base: StyleTheme, palette?: Partial<StylePalette>) {
//   return {
//     ...base,
//     palette: {
//       ...base.palette,
//       ...(palette || {}),
//     },
//   };
// }

// function createInitialInvoice(today: string): InvoiceState {
//   const style = mergeStyle(BASE_STYLES.corporate);
//   const lineItems: LineItem[] = [
//     {
//       description: "Strategy and discovery",
//       quantity: "1.00",
//       unitPrice: "1200.00",
//       amount: "1200.00",
//     },
//     {
//       description: "Visual design system",
//       quantity: "1.00",
//       unitPrice: "1600.00",
//       amount: "1600.00",
//     },
//     {
//       description: "Final delivery and handoff",
//       quantity: "1.00",
//       unitPrice: "800.00",
//       amount: "800.00",
//     },
//   ];
//   const taxPercentage = "0.00";
//   const discountPercentage = "0.00";

//   return {
//     invoiceNumber: `INV-${new Date().getFullYear()}-1001`,
//     customerName: "Client name",
//     amount: calculateInvoiceAmount(
//       lineItems,
//       taxPercentage,
//       discountPercentage
//     ),
//     currency: "USD",
//     taxPercentage,
//     discountPercentage,
//     issueDate: today,
//     dueDate: today,
//     notes:
//       "Thank you for your business. This invoice covers strategy, design, and delivery.",
//     paymentTerms: "Due on receipt",
//     issuerName: "InvoiceProof Studio",
//     issuerEmail: "billing@invoiceproof.app",
//     issuerAddress: "123 Market Street, San Francisco, CA",
//     accentLabel: style.accentLabel,
//     lineItems,
//     style,
//   };
// }

// function initials(name: string) {
//   const parts = String(name || "IP")
//     .trim()
//     .split(/\s+/)
//     .filter(Boolean);
//   return `${parts[0]?.[0] || "I"}${parts[1]?.[0] || parts[0]?.[1] || "P"}`
//     .slice(0, 2)
//     .toUpperCase();
// }

// function styleCardCss(style: StyleTheme) {
//   return {
//     background: `linear-gradient(160deg, ${style.palette.surface}, ${style.palette.surfaceAlt})`,
//     color: style.palette.text,
//     border: `1px solid ${style.palette.accent}`,
//   } as const;
// }

// function moveBlock(blocks: CanvasBlock[], id: string, dx: number, dy: number) {
//   return blocks.map((block) =>
//     block.id === id
//       ? {
//           ...block,
//           x: Math.max(8, Math.min(PAGE_WIDTH - block.w - 8, block.x + dx)),
//           y: Math.max(
//             8,
//             Math.min(PAGE_HEIGHT - FOOTER_HEIGHT - block.h - 8, block.y + dy)
//           ),
//         }
//       : block
//   );
// }

// function MiniPreview({
//   invoice,
//   blocks,
//   logoDataUrl,
// }: {
//   invoice: InvoiceState;
//   blocks: CanvasBlock[];
//   logoDataUrl: string | null;
// }) {
//   return (
//     <div className="mini-canvas-frame">
//       <div className="mini-canvas-scale">
//         <InvoiceCanvasPage
//           invoice={invoice}
//           blocks={blocks}
//           logoDataUrl={logoDataUrl}
//           selectedBlockId={null}
//           onSelectBlock={() => undefined}
//           onBlockMouseDown={() => undefined}
//           onUpdateInvoice={() => undefined}
//           onUpdateLineItem={() => undefined}
//           onAddLineItem={() => undefined}
//           onDeleteBlock={() => undefined}
//           onLogoPick={() => undefined}
//           readOnly
//         />
//       </div>
//     </div>
//   );
// }

// function InvoiceCanvasPage(props: {
//   invoice: InvoiceState;
//   blocks: CanvasBlock[];
//   logoDataUrl: string | null;
//   selectedBlockId: string | null;
//   onSelectBlock: (id: string) => void;
//   onBlockMouseDown: (
//     event: ReactMouseEvent<HTMLButtonElement>,
//     id: string
//   ) => void;
//   onUpdateInvoice: (patch: Partial<InvoiceState>) => void;
//   onUpdateLineItem: (index: number, key: keyof LineItem, value: string) => void;
//   onAddLineItem: () => void;
//   onDeleteBlock: (id: string) => void;
//   onLogoPick: () => void;
//   readOnly?: boolean;
// }) {
//   const {
//     invoice,
//     blocks,
//     logoDataUrl,
//     selectedBlockId,
//     onSelectBlock,
//     onBlockMouseDown,
//     onUpdateInvoice,
//     onUpdateLineItem,
//     onAddLineItem,
//     onDeleteBlock,
//     onLogoPick,
//     readOnly,
//   } = props;
//   const { style } = invoice;
//   const palette = style.palette;
//   const orderedBlocks = [...blocks].sort((a, b) => (a.z || 0) - (b.z || 0));

//   return (
//     <div
//       className={`invoice-canvas-page is-${style.templateId}`}
//       style={{
//         background: palette.surface,
//         color: palette.text,
//         width: PAGE_WIDTH,
//         height: PAGE_HEIGHT,
//       }}
//     >
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-luxury"
//         style={{
//           background:
//             style.templateId === "luxury" ? palette.primary : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-creative"
//         style={{
//           background:
//             style.templateId === "creative" ? palette.primary : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-creative-accent"
//         style={{
//           background:
//             style.templateId === "creative" ? palette.accent : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-corporate"
//         style={{
//           background:
//             style.templateId === "corporate"
//               ? palette.surfaceAlt
//               : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-line"
//         style={{
//           borderColor:
//             style.templateId === "minimal" ? palette.secondary : "transparent",
//         }}
//       />

//       {orderedBlocks.map((block) => {
//         const isSelected = selectedBlockId === block.id;
//         const background = block.style?.background || "transparent";
//         return (
//           <div
//             key={block.id}
//             className={`canvas-block canvas-block-${block.type} ${
//               isSelected ? "is-selected" : ""
//             }`}
//             style={{
//               left: block.x,
//               top: block.y,
//               width: block.w,
//               height: block.h,
//               color: block.style?.color || palette.text,
//               background,
//               borderRadius: block.style?.radius || 18,
//               boxShadow: isSelected
//                 ? `0 0 0 2px ${palette.primary}`
//                 : undefined,
//             }}
//             onMouseDown={() => onSelectBlock(block.id)}
//           >
//             {!readOnly ? (
//               <>
//                 <button
//                   type="button"
//                   className="canvas-drag-handle"
//                   onMouseDown={(event) => onBlockMouseDown(event, block.id)}
//                   aria-label={`Move ${block.id}`}
//                 >
//                   ⋮⋮
//                 </button>
//                 <button
//                   type="button"
//                   className="canvas-delete-handle"
//                   onClick={(event) => {
//                     event.stopPropagation();
//                     onDeleteBlock(block.id);
//                   }}
//                   aria-label={`Delete ${block.id}`}
//                 >
//                   ×
//                 </button>
//               </>
//             ) : null}

//             {block.type === "logo" ? (
//               <button
//                 type="button"
//                 className={`canvas-logo-inner ${
//                   readOnly ? "is-readonly" : "is-uploadable"
//                 }`}
//                 onClick={(event) => {
//                   event.stopPropagation();
//                   if (!readOnly) onLogoPick();
//                 }}
//               >
//                 {logoDataUrl ? (
//                   <img
//                     src={logoDataUrl}
//                     alt="Logo"
//                     className="canvas-logo-image"
//                   />
//                 ) : (
//                   <div className="canvas-logo-placeholder">
//                     <span className="canvas-logo-placeholder-badge">
//                       {initials(invoice.issuerName)}
//                     </span>
//                     <span className="canvas-logo-placeholder-copy">
//                       Click to upload logo
//                     </span>
//                   </div>
//                 )}
//               </button>
//             ) : null}

//             {block.binding?.key === "headerTitle" ? (
//               <input
//                 className="canvas-inline-input canvas-inline-title"
//                 value={invoice.style.headerTitle}
//                 onChange={(event) =>
//                   onUpdateInvoice({
//                     style: {
//                       ...invoice.style,
//                       headerTitle: event.target.value,
//                     },
//                   })
//                 }
//                 readOnly={readOnly}
//               />
//             ) : null}

//             {block.binding?.key === "invoiceNumber" ? (
//               <input
//                 className="canvas-inline-input canvas-inline-number"
//                 value={invoice.invoiceNumber}
//                 onChange={(event) =>
//                   onUpdateInvoice({ invoiceNumber: event.target.value })
//                 }
//                 readOnly={readOnly}
//               />
//             ) : null}

//             {block.type === "amount" ? (
//               <div className="canvas-amount-shell">
//                 <span className="canvas-kicker">Amount due</span>
//                 <div className="canvas-amount-row">
//                   <input
//                     className="canvas-inline-currency"
//                     list="invoice-currency-list"
//                     value={invoice.currency}
//                     onChange={(event) =>
//                       onUpdateInvoice({
//                         currency: normalizeCurrency(
//                           event.target.value,
//                           invoice.currency
//                         ),
//                       })
//                     }
//                     readOnly={readOnly}
//                   />
//                   <input
//                     className="canvas-inline-amount is-readonly"
//                     value={invoice.amount}
//                     onChange={(event) =>
//                       onUpdateInvoice({ amount: event.target.value })
//                     }
//                     readOnly
//                   />
//                 </div>
//                 <span className="canvas-subtle-copy">
//                   {invoice.style.trustBadge}
//                 </span>
//               </div>
//             ) : null}

//             {block.binding?.key === "issuer" ? (
//               <div className="canvas-multiline-card">
//                 <span className="canvas-kicker">From</span>
//                 <input
//                   className="canvas-inline-input"
//                   value={invoice.issuerName}
//                   onChange={(event) =>
//                     onUpdateInvoice({ issuerName: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//                 <input
//                   className="canvas-inline-input"
//                   value={invoice.issuerEmail}
//                   onChange={(event) =>
//                     onUpdateInvoice({ issuerEmail: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//                 <textarea
//                   className="canvas-inline-textarea"
//                   value={invoice.issuerAddress}
//                   onChange={(event) =>
//                     onUpdateInvoice({ issuerAddress: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//               </div>
//             ) : null}

//             {block.binding?.key === "customer" ? (
//               <div className="canvas-multiline-card">
//                 <span className="canvas-kicker">Bill to</span>
//                 <input
//                   className="canvas-inline-input"
//                   value={invoice.customerName}
//                   onChange={(event) =>
//                     onUpdateInvoice({ customerName: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//                 <div className="canvas-dual-row">
//                   <input
//                     type="date"
//                     className="canvas-inline-input"
//                     value={invoice.issueDate}
//                     onChange={(event) =>
//                       onUpdateInvoice({ issueDate: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                   <input
//                     type="date"
//                     className="canvas-inline-input"
//                     value={invoice.dueDate}
//                     onChange={(event) =>
//                       onUpdateInvoice({ dueDate: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//               </div>
//             ) : null}

//             {block.binding?.key === "meta" ? (
//               <div className="canvas-meta-grid">
//                 <div>
//                   <span className="canvas-kicker">Label</span>
//                   <input
//                     className="canvas-inline-input"
//                     value={invoice.accentLabel}
//                     onChange={(event) =>
//                       onUpdateInvoice({ accentLabel: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//                 <div>
//                   <span className="canvas-kicker">Terms</span>
//                   <input
//                     className="canvas-inline-input"
//                     value={invoice.paymentTerms}
//                     onChange={(event) =>
//                       onUpdateInvoice({ paymentTerms: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//                 <div style={{ gridColumn: "1 / -1" }}>
//                   <span className="canvas-kicker">Hero copy</span>
//                   <input
//                     className="canvas-inline-input"
//                     value={invoice.style.heroCopy}
//                     onChange={(event) =>
//                       onUpdateInvoice({
//                         style: {
//                           ...invoice.style,
//                           heroCopy: event.target.value,
//                         },
//                       })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//               </div>
//             ) : null}

//             {block.type === "table" ? (
//               <div className="canvas-table-shell">
//                 <div
//                   className="canvas-table-head"
//                   style={{
//                     background:
//                       style.templateId === "minimal"
//                         ? palette.surfaceAlt
//                         : palette.primary,
//                     color:
//                       style.templateId === "minimal" ? palette.text : "#fff",
//                   }}
//                 >
//                   <span>Description</span>
//                   <span>Qty</span>
//                   <span>Unit</span>
//                   <span>Currency</span>
//                   <span>Amount</span>
//                 </div>
//                 <div className="canvas-table-body">
//                   {invoice.lineItems.map((item, index) => (
//                     <div
//                       key={`${index}-${item.description}`}
//                       className="canvas-table-row"
//                     >
//                       <input
//                         className="canvas-inline-input is-readonly"
//                         value={item.description}
//                         onChange={(event) =>
//                           onUpdateLineItem(
//                             index,
//                             "description",
//                             event.target.value
//                           )
//                         }
//                         readOnly
//                       />
//                       <input
//                         className="canvas-inline-input"
//                         value={item.quantity}
//                         onChange={(event) =>
//                           onUpdateLineItem(
//                             index,
//                             "quantity",
//                             event.target.value
//                           )
//                         }
//                         readOnly={readOnly}
//                       />
//                       <input
//                         className="canvas-inline-input"
//                         value={item.unitPrice}
//                         onChange={(event) =>
//                           onUpdateLineItem(
//                             index,
//                             "unitPrice",
//                             event.target.value
//                           )
//                         }
//                         readOnly={readOnly}
//                       />
//                       <input
//                         className="canvas-inline-input is-readonly canvas-table-currency"
//                         value={invoice.currency}
//                         readOnly
//                       />
//                       <input
//                         className="canvas-inline-input is-readonly"
//                         value={item.amount}
//                         onChange={(event) =>
//                           onUpdateLineItem(index, "amount", event.target.value)
//                         }
//                         readOnly
//                       />
//                     </div>
//                   ))}
//                 </div>
//                 {!readOnly ? (
//                   <button
//                     type="button"
//                     className="canvas-table-add"
//                     onClick={onAddLineItem}
//                   >
//                     + Add item
//                   </button>
//                 ) : null}
//                 <div className="canvas-table-summary">
//                   <div>
//                     <span>Total amount</span>
//                     <strong className="canvas-table-summary-value">
//                       {invoice.currency} {sumLineItems(invoice.lineItems)}
//                     </strong>
//                   </div>
//                   <div>
//                     <span className="canvas-tax-summary-label">
//                       Discount (
//                       <input
//                         className="canvas-inline-input canvas-inline-tax-rate"
//                         value={invoice.discountPercentage}
//                         onChange={(event) =>
//                           onUpdateInvoice({
//                             discountPercentage: event.target.value,
//                           })
//                         }
//                         readOnly={readOnly}
//                         aria-label="Discount percentage"
//                       />
//                       %)
//                     </span>
//                     <strong className="canvas-table-summary-value">
//                       - {invoice.currency}{" "}
//                       {calculateDiscountAmount(
//                         invoice.lineItems,
//                         invoice.discountPercentage
//                       )}
//                     </strong>
//                   </div>
//                   <div>
//                     <span className="canvas-tax-summary-label">
//                       GST / Tax / VAT (
//                       <input
//                         className="canvas-inline-input canvas-inline-tax-rate"
//                         value={invoice.taxPercentage}
//                         onChange={(event) =>
//                           onUpdateInvoice({ taxPercentage: event.target.value })
//                         }
//                         readOnly={readOnly}
//                         aria-label="GST, tax, or VAT percentage"
//                       />
//                       %)
//                     </span>
//                     <strong className="canvas-table-summary-value">
//                       {invoice.currency}{" "}
//                       {calculateTaxAmount(
//                         invoice.lineItems,
//                         invoice.taxPercentage,
//                         invoice.discountPercentage
//                       )}
//                     </strong>
//                   </div>
//                   <div className="is-grand">
//                     <span>Grand total</span>
//                     <strong className="canvas-table-summary-value">
//                       {invoice.currency} {invoice.amount}
//                     </strong>
//                   </div>
//                 </div>
//               </div>
//             ) : null}

//             {block.binding?.key === "notes" ? (
//               <div className="canvas-notes-shell">
//                 <div className="canvas-notes-head">
//                   <span className="canvas-kicker">Notes</span>
//                   {!readOnly && invoice.notes ? (
//                     <button
//                       type="button"
//                       className="canvas-mini-action"
//                       onClick={() => onUpdateInvoice({ notes: "" })}
//                     >
//                       Clear
//                     </button>
//                   ) : null}
//                 </div>
//                 <textarea
//                   className="canvas-inline-textarea canvas-inline-notes"
//                   value={invoice.notes}
//                   onChange={(event) =>
//                     onUpdateInvoice({ notes: event.target.value })
//                   }
//                   readOnly={readOnly}
//                   placeholder="Add optional payment notes or leave blank."
//                 />
//               </div>
//             ) : null}
//           </div>
//         );
//       })}

//       <div
//         className="invoice-footer-preview"
//         style={{
//           background:
//             invoice.style.templateId === "luxury"
//               ? palette.primary
//               : palette.surfaceAlt,
//           color: invoice.style.templateId === "luxury" ? "#fff" : palette.text,
//         }}
//       >
//         <div className="invoice-footer-copy">
//           <strong>InvoiceProof</strong>
//           <span>
//             QR, brand, and verification link appear on every final page.
//           </span>
//           <span className="invoice-footer-link">/verify/&lt;public-id&gt;</span>
//         </div>
//         <div className="invoice-footer-qr">QR</div>
//       </div>
//     </div>
//   );
// }

// export function NewInvoiceForm() {
//   const router = useRouter();
//   const { showToast } = useToast();
//   const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
//   const [invoice, setInvoice] = useState<InvoiceState>(() =>
//     createInitialInvoice(today)
//   );
//   const [blocks, setBlocks] = useState<CanvasBlock[]>(() =>
//     defaultBlocks("corporate")
//   );
//   const [drafts, setDrafts] = useState<InvoiceDraftOption[]>([]);
//   const [selectedDraft, setSelectedDraft] = useState<string>("corporate");
//   const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
//     "invoiceNumber"
//   );
//   const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
//   const [logoName, setLogoName] = useState<string>("");
//   const [attachments, setAttachments] = useState<File[]>([]);
//   const [loading, setLoading] = useState<LoadingState>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [aiModalOpen, setAiModalOpen] = useState(false);
//   const [aiPrompt, setAiPrompt] = useState("");
//   const [aiPromptSummary, setAiPromptSummary] = useState("");
//   const [aiMissingFields, setAiMissingFields] = useState<string[]>([]);
//   const dragRef = useRef<{ id: string; x: number; y: number } | null>(null);
//   const canvasStageRef = useRef<HTMLElement | null>(null);
//   const canvasViewportRef = useRef<HTMLDivElement | null>(null);
//   const logoInputRef = useRef<HTMLInputElement | null>(null);
//   const [canvasScale, setCanvasScale] = useState(1);
//   const hasAiDraft = Boolean(aiPrompt.trim() || aiPromptSummary.trim());

//   useEffect(() => {
//     const transferred = loadPendingInvoiceDraft();
//     if (!transferred) return;

//     clearPendingInvoiceDraft();

//     if (transferred.type === "ai-canvas") {
//       const data = transferred.payload as AiCanvasDraftResult & {
//         prompt?: string;
//       };
//       if (data.invoice) setInvoice(normalizeInvoiceState(data.invoice, today));
//       if (Array.isArray(data.blocks) && data.blocks.length)
//         setBlocks(cloneBlocks(data.blocks));
//       setAiPrompt(typeof data.prompt === "string" ? data.prompt : "");
//       setAiPromptSummary(
//         String(data?.promptSummary || "AI created an editable invoice draft.")
//       );
//       setAiMissingFields(
//         Array.isArray(data?.missingFields) ? data.missingFields.slice(0, 6) : []
//       );
//       setSelectedDraft(
//         String(
//           data?.templateId || data?.invoice?.style?.templateId || "corporate"
//         )
//       );
//       setSelectedBlockId("invoiceNumber");
//       window.requestAnimationFrame(() => {
//         canvasStageRef.current?.scrollIntoView({
//           behavior: "smooth",
//           block: "start",
//         });
//       });
//       showToast({
//         tone: "success",
//         title: "AI invoice ready",
//         description: "Your extracted invoice has been loaded into the canvas.",
//       });
//       return;
//     }

//     if (transferred.type === "pdf-detect") {
//       const payload = transferred.payload as {
//         fileName?: string;
//         detected?: any;
//       };
//       const detected = payload?.detected || {};
//       const base = createInitialInvoice(today);
//       const imported = normalizeImportedLineItems(
//         detected.lineItems,
//         base.lineItems
//       );
//       const taxPercentage = toMoney(
//         String(detected.taxPercentage || imported.taxPercentage || "0")
//       );
//       const discountPercentage = toMoney(
//         String(detected.discountPercentage || "0")
//       );
//       const lineItems = imported.lineItems;
//       const nextInvoice: InvoiceState = {
//         ...base,
//         invoiceNumber: String(detected.invoiceNumber || base.invoiceNumber),
//         customerName: String(detected.customerName || base.customerName),
//         amount: calculateInvoiceAmount(
//           lineItems,
//           taxPercentage,
//           discountPercentage
//         ),
//         currency: normalizeCurrency(
//           String(detected.currency || base.currency),
//           base.currency
//         ),
//         taxPercentage,
//         discountPercentage,
//         issueDate: String(detected.issueDate || base.issueDate),
//         dueDate: String(detected.dueDate || detected.issueDate || base.dueDate),
//         notes: String(detected.notes || base.notes),
//         paymentTerms: String(detected.paymentTerms || base.paymentTerms),
//         issuerName: String(detected.issuerName || base.issuerName),
//         issuerEmail: String(detected.issuerEmail || base.issuerEmail),
//         issuerAddress: String(detected.issuerAddress || base.issuerAddress),
//         lineItems,
//         style: mergeStyle(BASE_STYLES.corporate),
//         accentLabel: BASE_STYLES.corporate.accentLabel,
//       };
//       setInvoice(normalizeInvoiceState(nextInvoice, today));
//       setBlocks(defaultBlocks("corporate"));
//       setSelectedDraft("corporate");
//       setSelectedBlockId("invoiceNumber");
//       setAiPromptSummary(
//         String(
//           detected.extractionSummary ||
//             `Extracted invoice data from ${payload.fileName || "uploaded PDF"}.`
//         )
//       );
//       setAiMissingFields(
//         detected.needsReview
//           ? ["invoice number", "customer", "amount", "dates"].slice(0, 4)
//           : []
//       );
//       window.requestAnimationFrame(() => {
//         canvasStageRef.current?.scrollIntoView({
//           behavior: "smooth",
//           block: "start",
//         });
//       });
//       showToast({
//         tone: "success",
//         title: "PDF data loaded",
//         description:
//           "Review the extracted fields, then finalize the canvas PDF.",
//       });
//     }
//   }, [showToast, today]);

//   useEffect(() => {
//     function onMove(event: MouseEvent) {
//       if (!dragRef.current) return;
//       const dx = event.clientX - dragRef.current.x;
//       const dy = event.clientY - dragRef.current.y;
//       dragRef.current = {
//         ...dragRef.current,
//         x: event.clientX,
//         y: event.clientY,
//       };
//       setBlocks((current) => moveBlock(current, dragRef.current!.id, dx, dy));
//     }

//     function onUp() {
//       dragRef.current = null;
//     }

//     window.addEventListener("mousemove", onMove);
//     window.addEventListener("mouseup", onUp);
//     return () => {
//       window.removeEventListener("mousemove", onMove);
//       window.removeEventListener("mouseup", onUp);
//     };
//   }, []);

//   useEffect(() => {
//     if (!aiModalOpen) return;

//     function onKeyDown(event: KeyboardEvent) {
//       if (event.key === "Escape") {
//         setAiModalOpen(false);
//       }
//     }

//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [aiModalOpen]);

//   useEffect(() => {
//     if (!selectedBlockId) return;

//     function onDeleteKey(event: KeyboardEvent) {
//       const target = event.target as HTMLElement | null;
//       const tagName = target?.tagName || "";
//       if (
//         ["INPUT", "TEXTAREA", "SELECT"].includes(tagName) ||
//         target?.isContentEditable
//       )
//         return;
//       if (event.key !== "Delete" && event.key !== "Backspace") return;
//       event.preventDefault();
//       deleteBlock(selectedBlockId);
//     }

//     window.addEventListener("keydown", onDeleteKey);
//     return () => window.removeEventListener("keydown", onDeleteKey);
//   }, [selectedBlockId, blocks]);

//   useEffect(() => {
//     function updateCanvasScale() {
//       const viewportWidth =
//         canvasViewportRef.current?.clientWidth || PAGE_WIDTH;
//       const nextScale = Math.max(
//         0.82,
//         Math.min(1.82, (viewportWidth - 24) / PAGE_WIDTH)
//       );
//       setCanvasScale(Number.isFinite(nextScale) ? nextScale : 1);
//     }

//     updateCanvasScale();

//     const observer =
//       typeof ResizeObserver !== "undefined" && canvasViewportRef.current
//         ? new ResizeObserver(() => updateCanvasScale())
//         : null;

//     if (observer && canvasViewportRef.current) {
//       observer.observe(canvasViewportRef.current);
//     }

//     window.addEventListener("resize", updateCanvasScale);
//     return () => {
//       observer?.disconnect();
//       window.removeEventListener("resize", updateCanvasScale);
//     };
//   }, []);

//   function updateInvoice(patch: Partial<InvoiceState>) {
//     setInvoice((current) => {
//       const next = { ...current, ...patch };
//       if (patch.currency !== undefined) {
//         next.currency = normalizeCurrency(
//           String(patch.currency || current.currency),
//           current.currency
//         );
//       }
//       if (patch.taxPercentage !== undefined) {
//         next.taxPercentage = toMoney(String(patch.taxPercentage || "0"));
//       }
//       if (patch.discountPercentage !== undefined) {
//         next.discountPercentage = toMoney(
//           String(patch.discountPercentage || "0")
//         );
//       }
//       if (
//         patch.taxPercentage !== undefined ||
//         patch.discountPercentage !== undefined
//       ) {
//         next.amount = calculateInvoiceAmount(
//           next.lineItems,
//           next.taxPercentage,
//           next.discountPercentage
//         );
//       }
//       return next;
//     });
//   }

//   function deleteBlock(id: string) {
//     setBlocks((current) => {
//       const next = current.filter((block) => block.id !== id);
//       setSelectedBlockId(next[0]?.id || null);
//       return next;
//     });
//   }

//   function updateLineItem(index: number, key: keyof LineItem, value: string) {
//     setInvoice((current) => {
//       const lineItems = current.lineItems.map((item, itemIndex) => {
//         if (itemIndex !== index) return item;
//         const next = { ...item, [key]: value };
//         if (key === "quantity" || key === "unitPrice") {
//           next.amount = toMoney(
//             String(Number(next.quantity || 0) * Number(next.unitPrice || 0))
//           );
//         }
//         return next;
//       });
//       return {
//         ...current,
//         lineItems,
//         amount: calculateInvoiceAmount(
//           lineItems,
//           current.taxPercentage,
//           current.discountPercentage
//         ),
//       };
//     });
//   }

//   function addLineItem() {
//     setInvoice((current) => {
//       const lineItems = [
//         ...current.lineItems,
//         {
//           description: "New item",
//           quantity: "1.00",
//           unitPrice: "0.00",
//           amount: "0.00",
//         },
//       ];
//       return {
//         ...current,
//         lineItems,
//         amount: calculateInvoiceAmount(
//           lineItems,
//           current.taxPercentage,
//           current.discountPercentage
//         ),
//       };
//     });
//   }

//   function openLogoPicker() {
//     logoInputRef.current?.click();
//   }

//   async function onLogoChange(event: ChangeEvent<HTMLInputElement>) {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
//       const message = "Please upload a PNG, JPG, or WebP logo.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Invalid logo type",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     if (file.size > MAX_LOGO_SIZE_BYTES) {
//       const message = "Logo must be 4 MB or smaller.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Logo too large",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     try {
//       const dataUrl = await readFileAsDataUrl(file);
//       setLogoDataUrl(dataUrl);
//       setLogoName(file.name);
//       showToast({
//         tone: "success",
//         title: "Logo ready",
//         description:
//           "Your logo will be rendered on the invoice canvas and final PDF.",
//       });
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Could not load logo.";
//       setError(message);
//       showToast({ tone: "error", title: "Logo failed", description: message });
//     }
//   }

//   function onAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
//     const files = Array.from(event.target.files || []);
//     if (!files.length) {
//       setAttachments([]);
//       return;
//     }

//     if (files.length > MAX_ATTACHMENTS) {
//       const message = `Attach up to ${MAX_ATTACHMENTS} PDFs at a time.`;
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Too many attachments",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     const invalidType = files.find(
//       (file) =>
//         file.type !== "application/pdf" &&
//         !file.name.toLowerCase().endsWith(".pdf")
//     );
//     if (invalidType) {
//       const message = "All attachments must be PDF files.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Invalid attachment",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     const oversized = files.find(
//       (file) => file.size > MAX_ATTACHMENT_SIZE_BYTES
//     );
//     if (oversized) {
//       const message = `${oversized.name} is larger than 12 MB.`;
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Attachment too large",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     setAttachments(files);
//     setError(null);
//   }

//   function updatePalette(key: keyof StylePalette, value: string) {
//     setInvoice((current) => ({
//       ...current,
//       style: {
//         ...current.style,
//         palette: {
//           ...current.style.palette,
//           [key]: value,
//         },
//       },
//     }));
//   }

//   function openAiModal() {
//     setError(null);
//     setAiModalOpen(true);
//   }

//   function handleAiPromptKeyDown(
//     event: ReactKeyboardEvent<HTMLTextAreaElement>
//   ) {
//     if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
//       event.preventDefault();
//       void generateAiCanvasFromPrompt(aiPrompt);
//     }
//   }

//   function clearAiDraft() {
//     setAiPrompt("");
//     setAiPromptSummary("");
//     setAiMissingFields([]);
//   }

//   function applyDraft(option: InvoiceDraftOption) {
//     setSelectedDraft(option.templateId);
//     setInvoice((current) => ({
//       ...current,
//       style: option.style,
//       accentLabel: option.style.accentLabel,
//     }));
//     setBlocks(cloneBlocks(option.blocks));
//   }

//   async function generateAiCanvasFromPrompt(rawPrompt = aiPrompt) {
//     if (loading) return;

//     const prompt = normalizeAiPrompt(rawPrompt);
//     if (prompt.length < 12) {
//       showToast({
//         tone: "error",
//         title: "Add a bit more detail",
//         description:
//           "Include who the invoice is for, what the work was, and the amount if you know it.",
//       });
//       return;
//     }

//     setAiModalOpen(false);
//     setLoading("ai-draft");
//     setError(null);

//     try {
//       const response = await fetch(`${API_BASE}/invoices/ai-canvas-draft`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt }),
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not create the AI invoice draft."
//         );
//       }

//       const data = json.data as AiCanvasDraftResult;
//       setAiPrompt(prompt);
//       setAiPromptSummary(
//         String(data?.promptSummary || "AI created an editable invoice draft.")
//       );
//       setAiMissingFields(
//         Array.isArray(data?.missingFields) ? data.missingFields.slice(0, 6) : []
//       );
//       setInvoice(normalizeInvoiceState(data.invoice, today));
//       setBlocks(cloneBlocks(data.blocks));
//       setSelectedDraft(data.templateId);
//       setSelectedBlockId("invoiceNumber");
//       window.requestAnimationFrame(() => {
//         canvasStageRef.current?.scrollIntoView({
//           behavior: "smooth",
//           block: "start",
//         });
//       });
//       showToast({
//         tone: "success",
//         title: "AI invoice ready",
//         description:
//           "Your first editable canvas is ready. Review anything highlighted, then finalize.",
//       });
//     } catch (err) {
//       const message =
//         err instanceof Error
//           ? err.message
//           : "Could not create the AI invoice draft.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "AI draft failed",
//         description: message,
//       });
//     } finally {
//       setLoading(null);
//     }
//   }

//   async function generateDesigns() {
//     if (loading) return;
//     setLoading("ai");
//     setError(null);
//     try {
//       const response = await fetch(`${API_BASE}/invoices/canvas-drafts`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...invoice,
//           amount: toMoney(invoice.amount),
//           palette: invoice.style.palette,
//           selectedTemplateId: invoice.style.templateId,
//           styleDirection: invoice.style.tone,
//         }),
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not generate canvas designs."
//         );
//       }
//       const options = Array.isArray(json?.data?.options)
//         ? json.data.options
//         : [];
//       setDrafts(options);
//       if (options[0]) applyDraft(options[0]);
//       showToast({
//         tone: "success",
//         title: "4 premium options ready",
//         description: "Pick one and keep editing directly on the page.",
//       });
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Could not generate designs.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Design generation failed",
//         description: message,
//       });
//     } finally {
//       setLoading(null);
//     }
//   }

//   async function finalizeCanvas() {
//     if (loading) return;
//     let navigating = false;
//     setLoading("finalize");
//     setError(null);
//     try {
//       const formData = new FormData();
//       formData.append(
//         "invoice",
//         JSON.stringify({
//           ...invoice,
//           amount: toMoney(invoice.amount),
//           lineItems: invoice.lineItems.map((item) => ({
//             ...item,
//             quantity: toMoney(item.quantity),
//             unitPrice: toMoney(item.unitPrice),
//             amount: toMoney(item.amount),
//           })),
//           selectedTemplateId: invoice.style.templateId,
//           style: invoice.style,
//           palette: invoice.style.palette,
//           canvasBlocks: blocks,
//           logoDataUrl,
//           attachmentNames: attachments.map((file) => file.name),
//         })
//       );
//       attachments.forEach((file) => formData.append("attachments", file));

//       const response = await fetch(`${API_BASE}/invoices/finalize-canvas`, {
//         method: "POST",
//         body: formData,
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not finalize canvas invoice."
//         );
//       }
//       showToast({
//         tone: "success",
//         title: "Canvas invoice finalized",
//         description: "Sealed PDF created with footer on every page.",
//       });
//       navigating = true;
//       router.push(`/invoices/${json.data.id}`);
//       router.refresh();
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Could not finalize invoice.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Finalize failed",
//         description: message,
//       });
//     } finally {
//       if (!navigating) {
//         setLoading(null);
//       }
//     }
//   }

//   function onBlockMouseDown(
//     event: ReactMouseEvent<HTMLButtonElement>,
//     id: string
//   ) {
//     event.preventDefault();
//     event.stopPropagation();
//     dragRef.current = { id, x: event.clientX, y: event.clientY };
//     setSelectedBlockId(id);
//   }

//   const overlayTitle =
//     loading === "ai-draft"
//       ? "Building your invoice with AI"
//       : loading === "ai"
//       ? "Generating premium layouts"
//       : loading === "finalize"
//       ? "Processing sealed PDF"
//       : "";
//   const overlayCopy =
//     loading === "ai-draft"
//       ? "Reading your messy notes, extracting the billing details, and placing everything onto one editable canvas."
//       : loading === "ai"
//       ? "Building four premium design systems from your data and palette."
//       : loading === "finalize"
//       ? "Please wait while we render your invoice, append attachments, and open the next page automatically."
//       : "";

//   return (
//     <>
//       {aiModalOpen ? (
//         <div
//           className="ai-modal-overlay"
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="ai-modal-title"
//         >
//           <div className="ai-modal-card">
//             <div className="ai-modal-head">
//               <div className="page-stack" style={{ gap: 6 }}>
//                 <span className="mini-chip is-accent">V1</span>
//                 <h3 id="ai-modal-title" style={{ margin: 0 }}>
//                   Generate invoice with AI
//                 </h3>
//                 <p className="muted" style={{ margin: 0 }}>
//                   Describe the job, paste messy notes, or drop in copied email
//                   text. AI will extract the core invoice fields and load one
//                   editable canvas.
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 className="btn btn-secondary ai-modal-close"
//                 onClick={() => setAiModalOpen(false)}
//               >
//                 Close
//               </button>
//             </div>

//             <label className="field-group">
//               <span className="field-label">Prompt or messy notes</span>
//               <textarea
//                 className="input-shell ai-modal-textarea"
//                 value={aiPrompt}
//                 onChange={(event) => setAiPrompt(event.target.value)}
//                 onKeyDown={handleAiPromptKeyDown}
//                 placeholder="Example: Invoice Acme Corp for a landing page redesign, 3 weeks of work, $4,500 USD, due next Friday, add 18% GST, mention payment by bank transfer."
//                 maxLength={4000}
//                 autoFocus
//               />
//             </label>

//             <div className="ai-modal-tips">
//               <span className="mini-chip">Paste WhatsApp or email text</span>
//               <span className="mini-chip">
//                 Mention VAT / GST / tax if known
//               </span>
//               <span className="mini-chip">Ctrl/Cmd + Enter to generate</span>
//             </div>

//             <div className="ai-modal-actions">
//               <button
//                 type="button"
//                 className="btn btn-secondary"
//                 onClick={() => setAiModalOpen(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 className="btn btn-primary"
//                 onClick={() => generateAiCanvasFromPrompt(aiPrompt)}
//                 disabled={normalizeAiPrompt(aiPrompt).length < 12}
//               >
//                 Generate canvas
//               </button>
//             </div>
//           </div>
//         </div>
//       ) : null}
//       <datalist id="invoice-currency-list">
//         {CURRENCY_OPTIONS.map((currencyCode) => (
//           <option key={currencyCode} value={currencyCode} />
//         ))}
//       </datalist>
//       {loading ? (
//         <div className="submit-overlay" aria-live="polite" aria-busy="true">
//           <div className="submit-overlay-card">
//             <div className="submit-overlay-inner">
//               <Spinner size="xl" tone="brand" />
//               <h3>{overlayTitle}</h3>
//               <p>{overlayCopy}</p>
//             </div>
//           </div>
//         </div>
//       ) : null}
//       <div className="invoice-builder-stack">
//         <input
//           ref={logoInputRef}
//           type="file"
//           accept="image/png,image/jpeg,image/webp"
//           onChange={onLogoChange}
//           style={{ display: "none" }}
//         />
//         {error ? <div className="error-banner">{error}</div> : null}

//         <section
//           className="invoice-panel-card canvas-primary-card"
//           ref={canvasStageRef}
//         >
//           <div className="canvas-workspace">
//             <div
//               ref={canvasViewportRef}
//               className="invoice-canvas-scroll canvas-primary-scroll"
//             >
//               <div
//                 className="invoice-canvas-stage"
//                 style={{ height: `${PAGE_HEIGHT * canvasScale}px` }}
//               >
//                 <div
//                   className="invoice-canvas-stage-scale"
//                   style={{ transform: `scale(${canvasScale})` }}
//                 >
//                   <InvoiceCanvasPage
//                     invoice={invoice}
//                     blocks={blocks}
//                     logoDataUrl={logoDataUrl}
//                     selectedBlockId={selectedBlockId}
//                     onSelectBlock={setSelectedBlockId}
//                     onBlockMouseDown={onBlockMouseDown}
//                     onUpdateInvoice={updateInvoice}
//                     onUpdateLineItem={updateLineItem}
//                     onAddLineItem={addLineItem}
//                     onDeleteBlock={deleteBlock}
//                     onLogoPick={openLogoPicker}
//                   />
//                 </div>
//               </div>
//             </div>

//             <aside className="canvas-side-tools">
//               <section className="invoice-panel-card palette-mini-card">
//                 <div className="invoice-panel-head">
//                   <h2>Palette</h2>
//                 </div>
//                 <div className="palette-mini-grid">
//                   {(
//                     Object.keys(invoice.style.palette) as Array<
//                       keyof StylePalette
//                     >
//                   ).map((key) => (
//                     <label key={key} className="palette-swatch" title={key}>
//                       <input
//                         className="palette-swatch-input"
//                         type="color"
//                         value={invoice.style.palette[key]}
//                         onChange={(event) =>
//                           updatePalette(key, event.target.value)
//                         }
//                         aria-label={`Change ${key} color`}
//                       />
//                       <span
//                         className="palette-swatch-dot"
//                         style={{ background: invoice.style.palette[key] }}
//                       />
//                       <span className="palette-swatch-label">
//                         {key === "surfaceAlt" ? "alt" : key.slice(0, 3)}
//                       </span>
//                     </label>
//                   ))}
//                 </div>
//               </section>
//             </aside>
//           </div>
//         </section>

//         <div className="builder-bottom-grid">
//           <section className="invoice-panel-card builder-span-2 prompt-compact-card">
//             <div className="prompt-compact-shell">
//               <textarea
//                 className="input-shell ai-brief-textarea prompt-compact-textarea"
//                 value={aiPrompt}
//                 onChange={(event) => setAiPrompt(event.target.value)}
//                 onKeyDown={handleAiPromptKeyDown}
//                 placeholder="Paste prompt, brief, or messy notes here."
//                 maxLength={4000}
//               />
//               <div className="quick-row">
//                 <button
//                   type="button"
//                   className="btn btn-primary"
//                   onClick={() => generateAiCanvasFromPrompt(aiPrompt)}
//                 >
//                   Generate with AI
//                 </button>
//                 <button
//                   type="button"
//                   className="btn btn-secondary"
//                   onClick={clearAiDraft}
//                 >
//                   Clear prompt
//                 </button>
//               </div>
//             </div>
//           </section>

//           <section className="invoice-panel-card builder-span-2">
//             <div className="invoice-panel-head">
//               <h2>Attachments</h2>
//               <span className="mini-chip">PDF only</span>
//             </div>
//             <label className="upload-shell" style={{ minHeight: 0 }}>
//               <span className="upload-title">
//                 Upload additional attachments
//               </span>
//               <input
//                 type="file"
//                 accept="application/pdf,.pdf"
//                 multiple
//                 onChange={onAttachmentChange}
//               />
//               <span className="file-pill">
//                 {attachments.length
//                   ? `${attachments.length} PDF${
//                       attachments.length > 1 ? "s" : ""
//                     }`
//                   : "Optional extra PDFs"}
//               </span>
//             </label>
//             {logoName ? (
//               <span className="mini-chip">Logo: {logoName}</span>
//             ) : null}
//             {attachments.length ? (
//               <div className="attachment-list">
//                 {attachments.map((file) => (
//                   <span key={`${file.name}-${file.size}`} className="mini-chip">
//                     {file.name}
//                   </span>
//                 ))}
//               </div>
//             ) : null}
//             <div className="quick-row">
//               <button
//                 type="button"
//                 className="btn btn-secondary"
//                 onClick={openAiModal}
//               >
//                 Update with AI
//               </button>
//               <button
//                 type="button"
//                 className="btn btn-secondary"
//                 onClick={() =>
//                   setBlocks(defaultBlocks(invoice.style.templateId))
//                 }
//               >
//                 Reset layout
//               </button>
//               <button
//                 type="button"
//                 className="btn btn-primary"
//                 onClick={finalizeCanvas}
//               >
//                 Finalize canvas PDF
//               </button>
//             </div>
//           </section>
//         </div>
//       </div>{" "}
//       <style jsx global>{`
//         .ai-modal-overlay {
//           position: fixed;
//           inset: 0;
//           z-index: 60;
//           display: grid;
//           place-items: center;
//           padding: 24px;
//           background: rgba(15, 23, 42, 0.44);
//           backdrop-filter: blur(10px);
//         }
//         .ai-modal-card {
//           width: min(720px, 100%);
//           border-radius: 30px;
//           padding: 24px;
//           display: grid;
//           gap: 18px;
//           border: 1px solid rgba(101, 79, 230, 0.14);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.98),
//             rgba(247, 245, 255, 0.96)
//           );
//           box-shadow: 0 30px 80px rgba(15, 23, 42, 0.24);
//         }
//         .ai-modal-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           gap: 16px;
//         }
//         .ai-modal-close {
//           white-space: nowrap;
//         }
//         .ai-modal-textarea,
//         .ai-brief-textarea {
//           min-height: 140px;
//           resize: vertical;
//           line-height: 1.55;
//         }
//         .ai-brief-card {
//           position: relative;
//           overflow: hidden;
//         }
//         .ai-brief-card::after {
//           content: "";
//           position: absolute;
//           inset: auto -30px -30px auto;
//           width: 180px;
//           height: 180px;
//           border-radius: 999px;
//           background: radial-gradient(
//             circle,
//             rgba(91, 140, 255, 0.18),
//             rgba(91, 140, 255, 0)
//           );
//           pointer-events: none;
//         }
//         .ai-empty-state {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 16px;
//           flex-wrap: wrap;
//         }
//         .ai-modal-tips {
//           display: flex;
//           gap: 8px;
//           flex-wrap: wrap;
//         }
//         .ai-modal-actions {
//           display: flex;
//           justify-content: flex-end;
//           gap: 10px;
//           flex-wrap: wrap;
//         }
//         .ai-missing-chip {
//           background: rgba(245, 158, 11, 0.12);
//           border-color: rgba(245, 158, 11, 0.24);
//           color: #9a6700;
//         }
//         .canvas-logo-placeholder {
//           width: 100%;
//           height: 100%;
//           display: grid;
//           place-items: center;
//           gap: 6px;
//           text-align: center;
//           background: repeating-linear-gradient(
//             135deg,
//             rgba(255, 255, 255, 0.94),
//             rgba(255, 255, 255, 0.94) 10px,
//             rgba(241, 245, 249, 0.94) 10px,
//             rgba(241, 245, 249, 0.94) 20px
//           );
//           color: #0f172a;
//         }
//         .canvas-logo-placeholder-badge {
//           width: 44px;
//           height: 44px;
//           border-radius: 999px;
//           display: grid;
//           place-items: center;
//           background: rgba(15, 23, 42, 0.9);
//           color: #fff;
//           font-weight: 900;
//         }
//         .canvas-logo-placeholder-copy {
//           font-size: 0.76rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//           opacity: 0.72;
//         }
//         .invoice-builder-stack {
//           display: grid;
//           gap: 18px;
//         }
//         .canvas-primary-card {
//           gap: 0;
//           padding: 12px;
//         }
//         .builder-bottom-grid {
//           display: grid;
//           grid-template-columns: 1fr;
//           gap: 14px;
//           align-items: start;
//           // justify-items: center;
//         }
//         // .builder-bottom-grid > section {
//         //   width: min(960px, 100%);
//         //   margin: 0 auto;
//         // }

//         .builder-span-2 {
//           grid-column: 1 / -1;
//         }
//         .canvas-workspace {
//           display: grid;
//           grid-template-columns: minmax(0, 1fr) 104px;
//           gap: 10px;
//           align-items: start;
//         }
//         .canvas-side-tools {
//           display: grid;
//           gap: 12px;
//           align-self: stretch;
//         }
//         .palette-mini-card {
//           padding: 10px 8px;
//           gap: 8px;
//           position: sticky;
//           top: 96px;
//         }
//         .palette-mini-grid {
//           display: grid;
//           justify-items: center;
//           gap: 8px;
//         }
//         .palette-swatch {
//           position: relative;
//           width: 56px;
//           display: grid;
//           justify-items: center;
//           gap: 4px;
//           padding: 6px 4px;
//           border-radius: 16px;
//           background: rgba(255, 255, 255, 0.86);
//           border: 1px solid rgba(15, 23, 42, 0.06);
//           cursor: pointer;
//         }
//         .palette-swatch-input {
//           position: absolute;
//           inset: 0;
//           opacity: 0;
//           cursor: pointer;
//         }
//         .palette-swatch-dot {
//           width: 22px;
//           height: 22px;
//           border-radius: 999px;
//           box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08),
//             0 10px 20px rgba(15, 23, 42, 0.12);
//         }
//         .palette-swatch-label {
//           font-size: 0.54rem;
//           font-weight: 800;
//           letter-spacing: 0.08em;
//           text-transform: uppercase;
//           color: var(--muted-strong);
//         }
//         .prompt-compact-card {
//           padding: 14px 18px;
//           display: grid;
//           justify-items: center;
//         }
//         .prompt-compact-shell {
//           width: min(640px, 100%);
//           display: grid;
//           gap: 12px;
//           justify-items: center;
//           margin: 0 auto;
//         }
//         .prompt-compact-textarea {
//           min-height: 90px;
//           max-height: 140px;
//         }
//         .invoice-panel-card {
//           border-radius: 28px;
//           border: 1px solid rgba(101, 79, 230, 0.1);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.97),
//             rgba(248, 246, 255, 0.95)
//           );
//           box-shadow: var(--shadow-soft);
//           padding: 18px;
//           display: grid;
//           gap: 14px;
//         }
//         .invoice-panel-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 8px;
//         }
//         .invoice-panel-head h2 {
//           margin: 0;
//           font-size: 0.9rem;
//           letter-spacing: -0.03em;
//         }
//         .attachment-list {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 8px;
//         }
//         .canvas-primary-scroll {
//           min-width: 0;
//         }
//         .invoice-canvas-scroll {
//           overflow: hidden;
//           padding: 12px;
//           border-radius: 34px;
//           border: 1px solid rgba(101, 79, 230, 0.1);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.94),
//             rgba(242, 241, 255, 0.82)
//           );
//           box-shadow: var(--shadow);
//         }
//         .invoice-canvas-stage {
//           width: 100%;
//           display: flex;
//           justify-content: center;
//           align-items: flex-start;
//           overflow: hidden;
//         }
//         .invoice-canvas-stage-scale {
//           transform-origin: top center;
//           will-change: transform;
//         }
//         .invoice-canvas-page {
//           position: relative;
//           margin: 0 auto;
//           border-radius: 32px;
//           overflow: hidden;
//           box-shadow: 0 30px 70px rgba(66, 74, 130, 0.18);
//         }
//         .invoice-canvas-bg,
//         .invoice-canvas-line {
//           position: absolute;
//           inset: 0;
//           pointer-events: none;
//         }
//         .invoice-canvas-bg-luxury {
//           inset: 0 0 auto 0;
//           height: 250px;
//         }
//         .invoice-canvas-bg-creative {
//           inset: 0 0 auto 0;
//           height: 220px;
//         }
//         .invoice-canvas-bg-creative-accent {
//           inset: 0 0 auto auto;
//           width: 160px;
//           height: 220px;
//           opacity: 0.92;
//         }
//         .invoice-canvas-bg-corporate {
//           inset: 0 auto auto 0;
//           width: 132px;
//           height: 155px;
//         }
//         .invoice-canvas-line {
//           inset: 118px 40px auto 40px;
//           height: 1px;
//           border-top: 1px solid transparent;
//         }
//         .canvas-block {
//           position: absolute;
//           padding: 10px;
//           border: 1px solid rgba(15, 23, 42, 0.08);
//           backdrop-filter: blur(8px);
//           transition: box-shadow 0.18s ease, border-color 0.18s ease;
//         }
//         .canvas-block:hover {
//           box-shadow: 0 10px 30px rgba(77, 88, 138, 0.12);
//         }
//         .canvas-drag-handle {
//           position: absolute;
//           top: 8px;
//           right: 38px;
//           z-index: 3;
//           width: 26px;
//           height: 26px;
//           border: 0;
//           border-radius: 999px;
//           background: rgba(15, 23, 42, 0.08);
//           color: inherit;
//           font-weight: 900;
//         }
//         .canvas-delete-handle {
//           position: absolute;
//           top: 8px;
//           right: 8px;
//           z-index: 3;
//           width: 26px;
//           height: 26px;
//           border: 0;
//           border-radius: 999px;
//           background: rgba(239, 68, 68, 0.12);
//           color: #b91c1c;
//           font-size: 1rem;
//           font-weight: 900;
//         }
//         .canvas-logo-inner {
//           width: 100%;
//           height: 100%;
//           display: grid;
//           place-items: center;
//           overflow: hidden;
//           border-radius: inherit;
//           font-size: 1.2rem;
//           font-weight: 900;
//           color: #fff;
//           background: rgba(15, 23, 42, 0.9);
//           border: 0;
//           padding: 0;
//         }
//         .canvas-logo-inner.is-uploadable {
//           cursor: pointer;
//         }
//         .canvas-logo-inner.is-uploadable:hover {
//           box-shadow: inset 0 0 0 2px rgba(22, 64, 214, 0.32);
//         }
//         .canvas-logo-image {
//           width: 100%;
//           height: 100%;
//           object-fit: contain;
//           background: #fff;
//         }
//         .canvas-inline-input,
//         .canvas-inline-textarea,
//         .canvas-inline-currency,
//         .canvas-inline-amount {
//           width: 100%;
//           border: 0;
//           outline: none;
//           background: transparent;
//           padding: 0;
//           color: inherit;
//           font: inherit;
//           font-size: 0.64rem;
//         }
//         .canvas-inline-input.is-readonly,
//         .canvas-inline-amount.is-readonly {
//           cursor: default;
//         }
//         .canvas-inline-input::placeholder,
//         .canvas-inline-textarea::placeholder {
//           color: inherit;
//           opacity: 0.45;
//         }
//         .canvas-inline-title {
//           font-size: 0.72rem;
//           font-weight: 700;
//           letter-spacing: 0.02em;
//           text-transform: uppercase;
//         }
//         .canvas-inline-number {
//           font-size: 1.2rem;
//           font-weight: 800;
//           letter-spacing: -0.04em;
//         }
//         .canvas-inline-textarea {
//           resize: none;
//           min-height: 34px;
//           line-height: 1.35;
//         }
//         .canvas-inline-notes {
//           min-height: 48px;
//         }
//         .canvas-amount-shell,
//         .canvas-multiline-card,
//         .canvas-meta-grid,
//         .canvas-notes-shell {
//           display: grid;
//           gap: 8px;
//           height: 100%;
//         }
//         .canvas-kicker {
//           font-size: 0.52rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//           opacity: 0.74;
//         }
//         .canvas-amount-row {
//           display: grid;
//           grid-template-columns: 46px 1fr;
//           gap: 6px;
//           align-items: center;
//           margin-top: 2px;
//         }
//         .canvas-inline-currency {
//           font-size: 0.62rem;
//           font-weight: 800;
//         }
//         .canvas-inline-amount {
//           font-size: 1.38rem;
//           font-weight: 800;
//           letter-spacing: -0.04em;
//         }
//         .canvas-subtle-copy {
//           margin-top: auto;
//           font-size: 0.54rem;
//           opacity: 0.75;
//         }
//         .canvas-dual-row {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 8px;
//         }
//         .canvas-meta-grid {
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           align-content: start;
//         }
//         .canvas-table-shell {
//           display: grid;
//           grid-template-rows: auto 1fr auto auto;
//           gap: 8px;
//           height: 100%;
//         }
//         .canvas-table-head,
//         .canvas-table-row {
//           display: grid;
//           grid-template-columns: 1.78fr 0.42fr 0.56fr 0.56fr 0.78fr;
//           gap: 6px;
//           align-items: center;
//         }
//         .canvas-table-head {
//           padding: 8px 10px;
//           border-radius: 14px;
//           font-size: 0.56rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.04em;
//         }
//         .canvas-table-body {
//           display: grid;
//           gap: 8px;
//           overflow: auto;
//           align-content: start;
//         }
//         .canvas-table-row {
//           padding: 7px 8px;
//           border-radius: 12px;
//           background: rgba(255, 255, 255, 0.72);
//           border: 1px solid rgba(15, 23, 42, 0.06);
//         }
//         .canvas-table-add {
//           justify-self: start;
//           border: 0;
//           border-radius: 999px;
//           padding: 7px 11px;
//           background: rgba(15, 23, 42, 0.07);
//           font-size: 0.62rem;
//           font-weight: 800;
//           color: inherit;
//         }
//         .canvas-table-currency {
//           text-transform: uppercase;
//           letter-spacing: 0.04em;
//         }
//         .canvas-table-summary {
//           display: grid;
//           gap: 6px;
//           margin-top: auto;
//           margin-left: auto;
//           width: min(320px, 100%);
//           padding-top: 10px;
//           border-top: 1px solid rgba(15, 23, 42, 0.1);
//         }
//         .canvas-table-summary > div {
//           width: 100%;
//           display: grid;
//           grid-template-columns: minmax(0, 1fr) auto;
//           gap: 16px;
//           align-items: center;
//           font-size: 0.62rem;
//           line-height: 1.3;
//         }
//         .canvas-table-summary > div > span {
//           text-align: right;
//           color: rgba(15, 23, 42, 0.78);
//           font-weight: 700;
//         }
//         .canvas-table-summary > div.is-grand {
//           margin-top: 2px;
//           padding-top: 8px;
//           border-top: 1px solid rgba(15, 23, 42, 0.14);
//           font-size: 0.72rem;
//         }
//         .canvas-table-summary > div.is-grand > span {
//           color: inherit;
//           font-weight: 800;
//         }
//         .canvas-table-summary strong {
//           font-size: inherit;
//         }
//         .canvas-table-summary-value {
//           min-width: 128px;
//           text-align: right;
//           white-space: nowrap;
//           font-variant-numeric: tabular-nums;
//         }
//         .canvas-tax-summary-label {
//           display: inline-flex;
//           align-items: center;
//           justify-content: flex-end;
//           gap: 3px;
//           flex-wrap: wrap;
//         }
//         .canvas-inline-tax-rate {
//           width: 38px;
//           min-width: 38px;
//           text-align: center;
//           font-weight: 800;
//           padding: 0;
//         }
//         .canvas-notes-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 8px;
//         }
//         .canvas-mini-action {
//           border: 0;
//           border-radius: 999px;
//           padding: 4px 8px;
//           background: rgba(15, 23, 42, 0.08);
//           color: inherit;
//           font-size: 0.56rem;
//           font-weight: 800;
//         }
//         .invoice-footer-preview {
//           position: absolute;
//           left: 16px;
//           right: 16px;
//           bottom: 12px;
//           height: 74px;
//           border-radius: 22px;
//           border: 1px solid rgba(15, 23, 42, 0.1);
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 14px;
//           padding: 12px 16px;
//         }
//         .invoice-footer-copy {
//           display: grid;
//           gap: 3px;
//           font-size: 0.62rem;
//         }
//         .invoice-footer-link {
//           font-weight: 800;
//         }
//         .invoice-footer-qr {
//           width: 54px;
//           height: 54px;
//           border-radius: 14px;
//           display: grid;
//           place-items: center;
//           background: #fff;
//           color: #111827;
//           font-weight: 900;
//           border: 1px solid rgba(15, 23, 42, 0.08);
//         }
//         .palette-grid {
//           display: grid;
//           gap: 10px;
//         }
//         .palette-row {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 12px;
//           border-radius: 16px;
//           padding: 8px 10px;
//           background: rgba(255, 255, 255, 0.76);
//           border: 1px solid rgba(15, 23, 42, 0.06);
//           font-weight: 700;
//           text-transform: capitalize;
//         }
//         .palette-row input {
//           width: 42px;
//           height: 42px;
//           border: 0;
//           background: transparent;
//           padding: 0;
//         }
//         .design-options-grid {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 14px;
//         }
//         .design-option-card {
//           width: 100%;
//           border-radius: 26px;
//           padding: 14px;
//           display: grid;
//           gap: 12px;
//           text-align: left;
//           box-shadow: var(--shadow-soft);
//         }
//         .design-option-card.is-active {
//           outline: 2px solid currentColor;
//         }
//         .premium-template-header {
//           display: flex;
//           justify-content: space-between;
//           gap: 10px;
//           align-items: center;
//           flex-wrap: wrap;
//         }
//         .premium-template-title {
//           font-weight: 800;
//           font-size: 1.05rem;
//           letter-spacing: -0.03em;
//         }
//         .mini-canvas-frame {
//           overflow: hidden;
//           border-radius: 18px;
//           background: rgba(255, 255, 255, 0.54);
//           border: 1px solid rgba(15, 23, 42, 0.08);
//           height: 236px;
//           position: relative;
//         }
//         .mini-canvas-scale {
//           position: absolute;
//           top: 0;
//           left: 0;
//           transform: scale(0.28);
//           transform-origin: top left;
//           width: ${PAGE_WIDTH}px;
//           height: ${PAGE_HEIGHT}px;
//         }
// //         @media (max-width: 1180px) {
//           .ai-pass-row,
//           .ai-variant-grid,
//           .ai-optimize-grid {
//             grid-template-columns: repeat(2, minmax(0, 1fr));
//           }
//         }
//         @media (max-width: 900px) {
//           .ai-tab-row,
//           .ai-pass-row,
//           .ai-variant-grid,
//           .ai-optimize-grid,
//           .variant-score-grid {
//             grid-template-columns: minmax(0, 1fr);
//           }
//           .ai-orchestra-input-row {
//             grid-template-columns: minmax(0, 1fr);
//           }
//           .ai-modal-overlay {
//             padding: 12px;
//           }
//           .ai-modal-card {
//             padding: 18px;
//           }
//           .ai-modal-head,
//           .ai-empty-state {
//             flex-direction: column;
//             align-items: stretch;
//           }
//         }
//         @media (max-width: 1120px) {
//           .builder-bottom-grid,
//           .design-options-grid,
//           .canvas-workspace {
//             grid-template-columns: 1fr;
//           }
//           .canvas-side-tools {
//             order: -1;
//           }
//           .palette-mini-card {
//             position: static;
//           }
//           .prompt-compact-shell {
//             width: 100%;
//           }
//         }
//         @media (max-width: 720px) {
//           .invoice-canvas-scroll {
//             padding: 8px;
//           }
//         }
//       `}</style>
//     </>
//   );
// }
// "use client";

// import type {
//   ChangeEvent,
//   KeyboardEvent as ReactKeyboardEvent,
//   MouseEvent as ReactMouseEvent,
// } from "react";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { Spinner } from "../../../components/ui/spinner";
// import { useToast } from "../../../components/ui/toast-provider";
// import {
//   clearPendingInvoiceDraft,
//   loadPendingInvoiceDraft,
// } from "../../../lib/invoice-draft-transfer";

// type LoadingState = null | "ai" | "ai-draft" | "finalize";

// const MAX_LOGO_SIZE_BYTES = 4 * 1024 * 1024;
// const MAX_ATTACHMENT_SIZE_BYTES = 12 * 1024 * 1024;
// const MAX_ATTACHMENTS = 10;

// type LineItem = {
//   description: string;
//   quantity: string;
//   unitPrice: string;
//   amount: string;
// };

// type StylePalette = {
//   primary: string;
//   secondary: string;
//   surface: string;
//   surfaceAlt: string;
//   text: string;
//   muted: string;
//   accent: string;
// };

// type StyleTheme = {
//   templateId: string;
//   styleName: string;
//   accentLabel: string;
//   hierarchyStyle: string;
//   tone: string;
//   lineItemPresentation: string;
//   footerStyle: string;
//   trustBadge: string;
//   previewSummary: string;
//   headerTitle: string;
//   heroCopy: string;
//   palette: StylePalette;
// };

// type CanvasBlock = {
//   id: string;
//   type: string;
//   x: number;
//   y: number;
//   w: number;
//   h: number;
//   z?: number;
//   locked?: boolean;
//   editable?: boolean;
//   content?: string;
//   binding?: { key?: string };
//   style?: {
//     fontSize?: number;
//     fontWeight?: string;
//     color?: string;
//     background?: string;
//     align?: string;
//     radius?: number;
//   };
// };

// type InvoiceDraftOption = {
//   title: string;
//   accentLabel: string;
//   templateId: string;
//   styleDirection: string;
//   style: StyleTheme;
//   blocks: CanvasBlock[];
//   summary: string;
// };

// type AiCanvasDraftResult = InvoiceDraftOption & {
//   promptSummary: string;
//   missingFields: string[];
//   invoice: InvoiceState;
// };

// type AiTab = "create" | "variants" | "optimize";
// type OrchestraPassStatus = "idle" | "running" | "done";

// type VariantScoreCard = {
//   safest: number;
//   boldest: number;
//   premium: number;
//   futuristic: number;
//   paymentConfidence: number;
// };

// type BrandInference = {
//   industry: string;
//   tone: string;
//   impression: string;
//   recommendedFamily: string;
//   notes: string[];
// };

// type OrchestraVariant = InvoiceDraftOption & {
//   id: string;
//   family: string;
//   badge: string;
//   source: "draft" | "remix";
//   rationale: string;
//   score: VariantScoreCard;
// };

// type OrchestraPass = {
//   id: "facts" | "brand" | "layouts" | "polish" | "rank";
//   title: string;
//   detail: string;
//   status: OrchestraPassStatus;
// };

// type InvoiceState = {
//   invoiceNumber: string;
//   customerName: string;
//   amount: string;
//   currency: string;
//   taxPercentage: string;
//   discountPercentage: string;
//   issueDate: string;
//   dueDate: string;
//   notes: string;
//   paymentTerms: string;
//   issuerName: string;
//   issuerEmail: string;
//   issuerAddress: string;
//   accentLabel: string;
//   lineItems: LineItem[];
//   style: StyleTheme;
// };

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
// const PAGE_WIDTH = 595.28;
// const PAGE_HEIGHT = 841.89;
// const FOOTER_HEIGHT = 92;
// const intlWithSupportedValues = Intl as typeof Intl & {
//   supportedValuesOf?: (key: string) => string[];
// };
// const FALLBACK_CURRENCY_OPTIONS = [
//   "USD",
//   "EUR",
//   "GBP",
//   "INR",
//   "JPY",
//   "CNY",
//   "AUD",
//   "CAD",
//   "NZD",
//   "SGD",
//   "HKD",
//   "AED",
//   "SAR",
//   "QAR",
//   "KWD",
//   "BHD",
//   "OMR",
//   "CHF",
//   "SEK",
//   "NOK",
//   "DKK",
//   "ISK",
//   "PLN",
//   "CZK",
//   "HUF",
//   "RON",
//   "BGN",
//   "TRY",
//   "RUB",
//   "UAH",
//   "ZAR",
//   "NGN",
//   "KES",
//   "GHS",
//   "EGP",
//   "MAD",
//   "MXN",
//   "BRL",
//   "ARS",
//   "CLP",
//   "COP",
//   "PEN",
//   "UYU",
//   "PYG",
//   "BOB",
//   "CRC",
//   "DOP",
//   "JMD",
//   "TTD",
//   "BBD",
//   "BSD",
//   "BMD",
//   "KRW",
//   "THB",
//   "VND",
//   "IDR",
//   "MYR",
//   "PHP",
//   "TWD",
//   "PKR",
//   "BDT",
//   "LKR",
//   "NPR",
//   "ILS",
// ];
// const CURRENCY_OPTIONS = Array.from(
//   new Set(FALLBACK_CURRENCY_OPTIONS.map((code) => code.toUpperCase()))
// ).sort();
// const CURRENCY_OPTION_SET = new Set(CURRENCY_OPTIONS);
// const CURRENCY_DETECTION_RULES: Array<{ pattern: RegExp; code: string }> = [
//   { pattern: /US\$/i, code: "USD" },
//   { pattern: /A\$/i, code: "AUD" },
//   { pattern: /C\$/i, code: "CAD" },
//   { pattern: /NZ\$/i, code: "NZD" },
//   { pattern: /HK\$/i, code: "HKD" },
//   { pattern: /S\$/i, code: "SGD" },
//   { pattern: /R\$/i, code: "BRL" },
//   { pattern: /\bAED\b|\bDH\b|د\.إ/i, code: "AED" },
//   { pattern: /\bSAR\b|ر\.س/i, code: "SAR" },
//   { pattern: /\bQAR\b|ر\.ق/i, code: "QAR" },
//   { pattern: /\bKWD\b|د\.ك/i, code: "KWD" },
//   { pattern: /\bBHD\b|د\.ب/i, code: "BHD" },
//   { pattern: /\bOMR\b|ر\.ع/i, code: "OMR" },
//   { pattern: /€/i, code: "EUR" },
//   { pattern: /£/i, code: "GBP" },
//   { pattern: /₹/i, code: "INR" },
//   { pattern: /\bCNY\b|\bRMB\b|CN¥|￥|元/i, code: "CNY" },
//   { pattern: /¥|円/i, code: "JPY" },
//   { pattern: /₩/i, code: "KRW" },
//   { pattern: /₽/i, code: "RUB" },
//   { pattern: /₴/i, code: "UAH" },
//   { pattern: /₺/i, code: "TRY" },
//   { pattern: /₫/i, code: "VND" },
//   { pattern: /฿/i, code: "THB" },
//   { pattern: /₱/i, code: "PHP" },
//   { pattern: /₦/i, code: "NGN" },
//   { pattern: /₵/i, code: "GHS" },
//   { pattern: /₪/i, code: "ILS" },
//   { pattern: /₨/i, code: "PKR" },
//   { pattern: /\$/i, code: "USD" },
// ];

// const BASE_STYLES: Record<string, StyleTheme> = {
//   luxury: {
//     templateId: "luxury",
//     styleName: "Luxury editorial",
//     accentLabel: "Luxury",
//     hierarchyStyle: "Editorial hierarchy",
//     tone: "Elevated and executive",
//     lineItemPresentation: "Premium ledger",
//     footerStyle: "Dark verified footer",
//     trustBadge: "Sealed premium proof",
//     previewSummary: "Dark navy hero with warm metallic accents.",
//     headerTitle: "Premium invoice",
//     heroCopy: "Refined presentation for retainers and premium engagements.",
//     palette: {
//       primary: "#111827",
//       secondary: "#C6A35C",
//       surface: "#F8F4EC",
//       surfaceAlt: "#1F2937",
//       text: "#111827",
//       muted: "#6B7280",
//       accent: "#E8D3A2",
//     },
//   },
//   corporate: {
//     templateId: "corporate",
//     styleName: "Corporate executive",
//     accentLabel: "Corporate",
//     hierarchyStyle: "Structured executive layout",
//     tone: "Crisp and confident",
//     lineItemPresentation: "Boardroom finance table",
//     footerStyle: "Compliance-ready footer",
//     trustBadge: "Audit-ready seal",
//     previewSummary: "Royal blue structure with sharp financial hierarchy.",
//     headerTitle: "Executive invoice",
//     heroCopy: "",
//     palette: {
//       primary: "#1640D6",
//       secondary: "#0F172A",
//       surface: "#F4F7FF",
//       surfaceAlt: "#DCE7FF",
//       text: "#0F172A",
//       muted: "#475569",
//       accent: "#5B8CFF",
//     },
//   },
//   creative: {
//     templateId: "creative",
//     styleName: "Creative studio",
//     accentLabel: "Creative",
//     hierarchyStyle: "Expressive split layout",
//     tone: "Energetic and premium",
//     lineItemPresentation: "Story-led service table",
//     footerStyle: "Ribbon footer with proof",
//     trustBadge: "Studio-grade proof",
//     previewSummary: "Vibrant purple canvas with warm highlights.",
//     headerTitle: "Studio invoice",
//     heroCopy: "Ideal for branding, design, product, and creative retainers.",
//     palette: {
//       primary: "#7C3AED",
//       secondary: "#F97316",
//       surface: "#FAF5FF",
//       surfaceAlt: "#FCE7F3",
//       text: "#2E1065",
//       muted: "#6D28D9",
//       accent: "#FDBA74",
//     },
//   },
//   minimal: {
//     templateId: "minimal",
//     styleName: "Minimal modern",
//     accentLabel: "Minimal",
//     hierarchyStyle: "Quiet whitespace-first layout",
//     tone: "Calm and precise",
//     lineItemPresentation: "Minimal rows with understated separators",
//     footerStyle: "Quiet proof footer",
//     trustBadge: "Quiet verified seal",
//     previewSummary: "Soft grayscale system with restrained premium spacing.",
//     headerTitle: "Modern invoice",
//     heroCopy: "Minimal visual noise while trust details stay present.",
//     palette: {
//       primary: "#0F172A",
//       secondary: "#94A3B8",
//       surface: "#FFFFFF",
//       surfaceAlt: "#F8FAFC",
//       text: "#0F172A",
//       muted: "#64748B",
//       accent: "#CBD5E1",
//     },
//   },
// };

// function cloneBlocks(blocks: CanvasBlock[]) {
//   return blocks.map((block) => ({
//     ...block,
//     binding: block.binding ? { ...block.binding } : undefined,
//     style: block.style ? { ...block.style } : undefined,
//   }));
// }

// function sanitizeCanvasBlocksForFinalize(blocks: CanvasBlock[]): CanvasBlock[] {
//   return blocks.map((block) => ({
//     id: block.id,
//     type: block.type,
//     x: block.x,
//     y: block.y,
//     w: block.w,
//     h: block.h,
//     binding: block.binding?.key ? { key: block.binding.key } : undefined,
//     style: block.style
//       ? {
//           fontSize:
//             typeof block.style.fontSize === "number"
//               ? block.style.fontSize
//               : undefined,
//           fontWeight:
//             typeof block.style.fontWeight === "string"
//               ? block.style.fontWeight
//               : undefined,
//           color:
//             typeof block.style.color === "string"
//               ? block.style.color
//               : undefined,
//           background:
//             typeof block.style.background === "string"
//               ? block.style.background
//               : undefined,
//           align:
//             typeof block.style.align === "string"
//               ? block.style.align
//               : undefined,
//           radius:
//             typeof block.style.radius === "number"
//               ? block.style.radius
//               : undefined,
//         }
//       : undefined,
//   }));
// }

// function defaultBlocks(templateId: string): CanvasBlock[] {
//   const templates: Record<string, CanvasBlock[]> = {
//     corporate: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 42,
//         w: 86,
//         h: 86,
//         binding: { key: "logo" },
//         style: { radius: 24, background: "#ffffff" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 142,
//         y: 40,
//         w: 250,
//         h: 28,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 16, fontWeight: "700", color: "#5B8CFF" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 142,
//         y: 72,
//         w: 230,
//         h: 42,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 32, fontWeight: "800", color: "#0F172A" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 410,
//         y: 44,
//         w: 145,
//         h: 92,
//         binding: { key: "amount" },
//         style: { background: "#DCE7FF", color: "#1640D6", radius: 28 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 172,
//         w: 220,
//         h: 108,
//         binding: { key: "issuer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 310,
//         y: 172,
//         w: 245,
//         h: 108,
//         binding: { key: "customer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 292,
//         w: 515,
//         h: 70,
//         binding: { key: "meta" },
//         style: {
//           background: "#F4F7FF",
//           fontSize: 12,
//           color: "#475569",
//           radius: 22,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 380,
//         w: 515,
//         h: 230,
//         binding: { key: "lineItems" },
//         style: { background: "#ffffff", radius: 24 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 622,
//         w: 515,
//         h: 102,
//         binding: { key: "notes" },
//         style: {
//           background: "#ffffff",
//           fontSize: 12,
//           color: "#475569",
//           radius: 20,
//         },
//       },
//     ],
//     luxury: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 48,
//         w: 84,
//         h: 84,
//         binding: { key: "logo" },
//         style: { radius: 24, background: "#1F2937" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 40,
//         y: 152,
//         w: 180,
//         h: 28,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 14, fontWeight: "700", color: "#C6A35C" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 40,
//         y: 182,
//         w: 290,
//         h: 42,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 34, fontWeight: "800", color: "#FFFFFF" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 392,
//         y: 74,
//         w: 163,
//         h: 118,
//         binding: { key: "amount" },
//         style: { background: "#E8D3A2", color: "#111827", radius: 28 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 272,
//         w: 220,
//         h: 108,
//         binding: { key: "issuer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#111827" },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 310,
//         y: 272,
//         w: 245,
//         h: 108,
//         binding: { key: "customer" },
//         style: { fontSize: 13, fontWeight: "600", color: "#111827" },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 392,
//         w: 515,
//         h: 74,
//         binding: { key: "meta" },
//         style: {
//           background: "#F7EFE3",
//           fontSize: 12,
//           color: "#6B7280",
//           radius: 22,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 480,
//         w: 515,
//         h: 190,
//         binding: { key: "lineItems" },
//         style: { background: "#FFFDF9", radius: 24 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 684,
//         w: 515,
//         h: 64,
//         binding: { key: "notes" },
//         style: {
//           background: "#F7EFE3",
//           fontSize: 12,
//           color: "#6B7280",
//           radius: 20,
//         },
//       },
//     ],
//     creative: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 44,
//         w: 90,
//         h: 90,
//         binding: { key: "logo" },
//         style: { radius: 28, background: "#ffffff" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 154,
//         y: 46,
//         w: 180,
//         h: 28,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 16, fontWeight: "700", color: "#F97316" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 154,
//         y: 80,
//         w: 220,
//         h: 42,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 31, fontWeight: "800", color: "#FFFFFF" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 390,
//         y: 52,
//         w: 165,
//         h: 96,
//         binding: { key: "amount" },
//         style: { background: "#FDBA74", color: "#2E1065", radius: 30 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 212,
//         w: 240,
//         h: 110,
//         binding: { key: "issuer" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 13,
//           color: "#2E1065",
//           radius: 24,
//         },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 315,
//         y: 212,
//         w: 240,
//         h: 110,
//         binding: { key: "customer" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 13,
//           color: "#2E1065",
//           radius: 24,
//         },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 338,
//         w: 515,
//         h: 72,
//         binding: { key: "meta" },
//         style: {
//           background: "#FCE7F3",
//           fontSize: 12,
//           color: "#6D28D9",
//           radius: 22,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 428,
//         w: 515,
//         h: 210,
//         binding: { key: "lineItems" },
//         style: { background: "#FFFFFF", radius: 26 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 654,
//         w: 515,
//         h: 90,
//         binding: { key: "notes" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 12,
//           color: "#6D28D9",
//           radius: 22,
//         },
//       },
//     ],
//     minimal: [
//       {
//         id: "logo",
//         type: "logo",
//         x: 40,
//         y: 44,
//         w: 72,
//         h: 72,
//         binding: { key: "logo" },
//         style: { radius: 20, background: "#F8FAFC" },
//       },
//       {
//         id: "title",
//         type: "text",
//         x: 132,
//         y: 50,
//         w: 150,
//         h: 22,
//         binding: { key: "headerTitle" },
//         style: { fontSize: 13, fontWeight: "700", color: "#64748B" },
//       },
//       {
//         id: "invoiceNumber",
//         type: "text",
//         x: 132,
//         y: 78,
//         w: 260,
//         h: 38,
//         binding: { key: "invoiceNumber" },
//         style: { fontSize: 32, fontWeight: "800", color: "#0F172A" },
//       },
//       {
//         id: "amount",
//         type: "amount",
//         x: 402,
//         y: 58,
//         w: 153,
//         h: 82,
//         binding: { key: "amount" },
//         style: { background: "#F8FAFC", color: "#0F172A", radius: 24 },
//       },
//       {
//         id: "issuer",
//         type: "multiline",
//         x: 40,
//         y: 166,
//         w: 220,
//         h: 96,
//         binding: { key: "issuer" },
//         style: { fontSize: 13, color: "#0F172A" },
//       },
//       {
//         id: "customer",
//         type: "multiline",
//         x: 315,
//         y: 166,
//         w: 240,
//         h: 96,
//         binding: { key: "customer" },
//         style: { fontSize: 13, color: "#0F172A" },
//       },
//       {
//         id: "meta",
//         type: "multiline",
//         x: 40,
//         y: 280,
//         w: 515,
//         h: 58,
//         binding: { key: "meta" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 12,
//           color: "#64748B",
//           radius: 18,
//         },
//       },
//       {
//         id: "table",
//         type: "table",
//         x: 40,
//         y: 364,
//         w: 515,
//         h: 238,
//         binding: { key: "lineItems" },
//         style: { background: "#FFFFFF", radius: 20 },
//       },
//       {
//         id: "notes",
//         type: "multiline",
//         x: 40,
//         y: 618,
//         w: 515,
//         h: 102,
//         binding: { key: "notes" },
//         style: {
//           background: "#FFFFFF",
//           fontSize: 12,
//           color: "#64748B",
//           radius: 18,
//         },
//       },
//     ],
//   };

//   return cloneBlocks(templates[templateId] || templates.corporate);
// }

// function toMoney(value: string) {
//   const number = Number(String(value || "0").replace(/[^\d.]/g, ""));
//   if (!Number.isFinite(number)) return "0.00";
//   return number.toFixed(2);
// }

// function detectCurrencyCode(value: string) {
//   const text = String(value || "").trim();
//   if (!text) return "";
//   for (const rule of CURRENCY_DETECTION_RULES) {
//     if (rule.pattern.test(text)) return rule.code;
//   }
//   const upper = text.toUpperCase();
//   const matches = upper.match(/[A-Z]{3}/g) || [];
//   const detected = matches.find((code) => CURRENCY_OPTION_SET.has(code));
//   if (detected) return detected;
//   const collapsed = upper.replace(/[^A-Z]/g, "").slice(0, 3);
//   return collapsed && CURRENCY_OPTION_SET.has(collapsed) ? collapsed : "";
// }

// function normalizeCurrency(value: string, fallback = "USD") {
//   return detectCurrencyCode(value) || fallback;
// }

// function sumLineItems(items: LineItem[]) {
//   return items
//     .reduce((sum, item) => sum + Number(item.amount || 0), 0)
//     .toFixed(2);
// }

// function calculateDiscountAmount(
//   items: LineItem[],
//   discountPercentage: string
// ) {
//   return (
//     (Number(sumLineItems(items)) * Number(discountPercentage || 0)) /
//     100
//   ).toFixed(2);
// }

// function calculateTaxableSubtotal(
//   items: LineItem[],
//   discountPercentage: string
// ) {
//   return Math.max(
//     Number(sumLineItems(items)) -
//       Number(calculateDiscountAmount(items, discountPercentage)),
//     0
//   ).toFixed(2);
// }

// function calculateTaxAmount(
//   items: LineItem[],
//   taxPercentage: string,
//   discountPercentage: string
// ) {
//   return (
//     (Number(calculateTaxableSubtotal(items, discountPercentage)) *
//       Number(taxPercentage || 0)) /
//     100
//   ).toFixed(2);
// }

// function calculateInvoiceAmount(
//   items: LineItem[],
//   taxPercentage: string,
//   discountPercentage: string
// ) {
//   return (
//     Number(calculateTaxableSubtotal(items, discountPercentage)) +
//     Number(calculateTaxAmount(items, taxPercentage, discountPercentage))
//   ).toFixed(2);
// }

// function parseTaxPercentageFromText(value: string) {
//   const match = String(value || "").match(/(\d+(?:\.\d+)?)\s*%/);
//   return match ? toMoney(match[1]) : null;
// }

// function normalizeLineItem(
//   item: Partial<LineItem>,
//   fallbackDescription: string
// ): LineItem {
//   const quantity = toMoney(String(item.quantity || "1"));
//   const unitPrice = toMoney(String(item.unitPrice || item.amount || "0"));

//   return {
//     description: String(item.description || fallbackDescription).slice(0, 150),
//     quantity,
//     unitPrice,
//     amount: toMoney(String(Number(quantity) * Number(unitPrice))),
//   };
// }

// function normalizeImportedLineItems(
//   rawItems: unknown,
//   fallbackItems: LineItem[]
// ) {
//   const items = Array.isArray(rawItems) ? rawItems.slice(0, 12) : [];
//   const normalized: LineItem[] = [];
//   let subtotal = 0;
//   let derivedTaxPercentage: string | null = null;

//   items.forEach((item: any, index: number) => {
//     const normalizedItem = normalizeLineItem(
//       {
//         description: String(item?.description || `Line item ${index + 1}`),
//         quantity: String(item?.quantity || "1"),
//         unitPrice: String(item?.unitPrice || item?.amount || "0"),
//         amount: String(item?.amount || item?.unitPrice || "0"),
//       },
//       `Line item ${index + 1}`
//     );
//     const description = normalizedItem.description;
//     const explicitTaxPercentage = item?.taxPercentage
//       ? toMoney(String(item.taxPercentage))
//       : parseTaxPercentageFromText(description);
//     const isTaxOnlyLine = /\b(?:gst|vat|tax)\b/i.test(description);

//     if (isTaxOnlyLine) {
//       const derivedFromAmount =
//         subtotal > 0 && Number(normalizedItem.amount || 0) > 0
//           ? toMoney(
//               String((Number(normalizedItem.amount || 0) * 100) / subtotal)
//             )
//           : null;
//       derivedTaxPercentage =
//         derivedFromAmount ||
//         explicitTaxPercentage ||
//         derivedTaxPercentage ||
//         "0.00";
//       return;
//     }

//     normalized.push(normalizedItem);
//     subtotal += Number(normalizedItem.amount || 0);

//     if (
//       !derivedTaxPercentage &&
//       explicitTaxPercentage &&
//       Number(explicitTaxPercentage) > 0
//     ) {
//       derivedTaxPercentage = explicitTaxPercentage;
//     }
//   });

//   return {
//     lineItems: normalized.length ? normalized : fallbackItems,
//     taxPercentage: derivedTaxPercentage || "0.00",
//   };
// }

// function normalizeInvoiceState(
//   input: Partial<InvoiceState>,
//   today: string
// ): InvoiceState {
//   const base = createInitialInvoice(today);
//   const rawStyle = input.style || base.style;
//   const baseStyle = BASE_STYLES[rawStyle.templateId] || base.style;
//   const imported = normalizeImportedLineItems(
//     (input as { lineItems?: unknown }).lineItems,
//     base.lineItems
//   );
//   const taxPercentage = toMoney(
//     String(
//       (input as { taxPercentage?: string }).taxPercentage ||
//         imported.taxPercentage ||
//         base.taxPercentage
//     )
//   );
//   const discountPercentage = toMoney(
//     String(
//       (input as { discountPercentage?: string }).discountPercentage ||
//         base.discountPercentage
//     )
//   );
//   const lineItems = imported.lineItems;
//   const style = {
//     ...baseStyle,
//     ...rawStyle,
//     palette: {
//       ...baseStyle.palette,
//       ...(rawStyle.palette || {}),
//     },
//   };

//   return {
//     ...base,
//     ...input,
//     currency: normalizeCurrency(
//       String(input.currency || base.currency),
//       base.currency
//     ),
//     taxPercentage,
//     discountPercentage,
//     amount: calculateInvoiceAmount(
//       lineItems,
//       taxPercentage,
//       discountPercentage
//     ),
//     notes: String(input.notes ?? base.notes),
//     paymentTerms: String(input.paymentTerms ?? base.paymentTerms),
//     accentLabel: String(input.accentLabel || style.accentLabel),
//     lineItems,
//     style,
//   };
// }

// function normalizeAiPrompt(value: string) {
//   return String(value || "")
//     .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
//     .replace(/\s+/g, " ")
//     .trim()
//     .slice(0, 4000);
// }

// function readFileAsDataUrl(file: File) {
//   return new Promise<string>((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(String(reader.result || ""));
//     reader.onerror = () => reject(new Error("Could not read file."));
//     reader.readAsDataURL(file);
//   });
// }

// function mergeStyle(base: StyleTheme, palette?: Partial<StylePalette>) {
//   return {
//     ...base,
//     palette: {
//       ...base.palette,
//       ...(palette || {}),
//     },
//   };
// }

// function createInitialInvoice(today: string): InvoiceState {
//   const style = mergeStyle(BASE_STYLES.corporate);
//   const lineItems: LineItem[] = [
//     {
//       description: "Strategy and discovery",
//       quantity: "1.00",
//       unitPrice: "1200.00",
//       amount: "1200.00",
//     },
//     {
//       description: "Visual design system",
//       quantity: "1.00",
//       unitPrice: "1600.00",
//       amount: "1600.00",
//     },
//     {
//       description: "Final delivery and handoff",
//       quantity: "1.00",
//       unitPrice: "800.00",
//       amount: "800.00",
//     },
//   ];
//   const taxPercentage = "0.00";
//   const discountPercentage = "0.00";

//   return {
//     invoiceNumber: `INV-${new Date().getFullYear()}-1001`,
//     customerName: "Client name",
//     amount: calculateInvoiceAmount(
//       lineItems,
//       taxPercentage,
//       discountPercentage
//     ),
//     currency: "USD",
//     taxPercentage,
//     discountPercentage,
//     issueDate: today,
//     dueDate: today,
//     notes:
//       "Thank you for your business. This invoice covers strategy, design, and delivery.",
//     paymentTerms: "Due on receipt",
//     issuerName: "InvoiceProof Studio",
//     issuerEmail: "billing@invoiceproof.app",
//     issuerAddress: "123 Market Street, San Francisco, CA",
//     accentLabel: style.accentLabel,
//     lineItems,
//     style,
//   };
// }

// const AI_TAB_OPTIONS: Array<{ id: AiTab; label: string; kicker: string }> = [
//   { id: "create", label: "Create", kicker: "First generation" },
//   { id: "variants", label: "Variants", kicker: "Multiple looks" },
//   { id: "optimize", label: "Optimize", kicker: "Refine chosen design" },
// ];

// const OPTIMIZE_ACTIONS = [
//   "Make it more premium",
//   "Make it more futuristic",
//   "Improve spacing",
//   "Improve trust signals",
//   "Improve brand consistency",
//   "Improve typography",
//   "Make it more enterprise-safe",
// ] as const;

// const VARIANT_BLUEPRINTS = [
//   {
//     key: "audit-ready",
//     family: "Audit-Ready Professional",
//     templateId: "corporate",
//     title: "Safest",
//     accentLabel: "Audit Ready",
//     styleDirection: "Enterprise-safe clarity",
//     summary: "High confidence hierarchy with boardroom-safe structure.",
//     palette: { primary: "#1640D6", accent: "#5B8CFF", surfaceAlt: "#DCE7FF" },
//   },
//   {
//     key: "editorial-luxe",
//     family: "Editorial Luxe",
//     templateId: "luxury",
//     title: "Most Premium",
//     accentLabel: "Premium",
//     styleDirection: "Editorial luxury",
//     summary: "Dark editorial contrast with elevated premium cues.",
//     palette: { secondary: "#D6B16B", accent: "#F0DBAF", surface: "#FBF7F0" },
//   },
//   {
//     key: "futuristic-glass",
//     family: "Futuristic Glass",
//     templateId: "corporate",
//     title: "Most Futuristic",
//     accentLabel: "Future",
//     styleDirection: "Futuristic glass-fintech",
//     summary: "Electric blue glassy direction with forward-leaning trust cues.",
//     palette: {
//       primary: "#003FAB",
//       secondary: "#0B1021",
//       accent: "#56C7FF",
//       surfaceAlt: "#D9EEFF",
//     },
//   },
//   {
//     key: "minimal-swiss",
//     family: "Minimal Swiss",
//     templateId: "minimal",
//     title: "Most Minimal",
//     accentLabel: "Minimal",
//     styleDirection: "Quiet Swiss grid",
//     summary: "Whitespace-first professional layout with restrained confidence.",
//     palette: { primary: "#0F172A", secondary: "#94A3B8", accent: "#CBD5E1" },
//   },
//   {
//     key: "creative-studio",
//     family: "Creative Studio",
//     templateId: "creative",
//     title: "Boldest",
//     accentLabel: "Studio",
//     styleDirection: "High-energy editorial",
//     summary: "Expressive creative composition for standout billing.",
//     palette: { primary: "#6D28D9", secondary: "#F97316", accent: "#FDBA74" },
//   },
//   {
//     key: "payment-confidence",
//     family: "Payment Confidence",
//     templateId: "corporate",
//     title: "Best for Payment Confidence",
//     accentLabel: "Trust+",
//     styleDirection: "Trust-led clarity",
//     summary: "Designed to improve clarity, hierarchy, and payment confidence.",
//     palette: {
//       primary: "#0F3FB6",
//       secondary: "#0F172A",
//       accent: "#7AA5FF",
//       surfaceAlt: "#E6EEFF",
//     },
//   },
//   {
//     key: "neo-fintech",
//     family: "Neo Fintech",
//     templateId: "creative",
//     title: "Tech-forward",
//     accentLabel: "Neo",
//     styleDirection: "Modern fintech punch",
//     summary: "Energetic fintech-inspired layout with vivid modern accents.",
//     palette: {
//       primary: "#5B21B6",
//       secondary: "#0F172A",
//       accent: "#60A5FA",
//       surfaceAlt: "#EEF2FF",
//     },
//   },
//   {
//     key: "quiet-premium",
//     family: "Quiet Premium",
//     templateId: "minimal",
//     title: "Quiet Premium",
//     accentLabel: "Quiet",
//     styleDirection: "Minimal but elevated",
//     summary: "Low-noise layout with premium restraint and polished spacing.",
//     palette: {
//       primary: "#111827",
//       secondary: "#B8A46B",
//       accent: "#D6C49B",
//       surface: "#FCFBF7",
//     },
//   },
//   {
//     key: "executive-blueprint",
//     family: "Executive Blueprint",
//     templateId: "corporate",
//     title: "Boardroom",
//     accentLabel: "Executive",
//     styleDirection: "Executive precision",
//     summary:
//       "Sharp executive presentation for enterprise and procurement teams.",
//     palette: {
//       primary: "#153EAD",
//       secondary: "#14213D",
//       accent: "#90B4FF",
//       surfaceAlt: "#E8EFFF",
//     },
//   },
//   {
//     key: "midnight-luxury",
//     family: "Midnight Luxury",
//     templateId: "luxury",
//     title: "Dark Luxe",
//     accentLabel: "Midnight",
//     styleDirection: "Dark premium confidence",
//     summary:
//       "Confident midnight palette for high-value retainers and premium billing.",
//     palette: {
//       primary: "#0B1220",
//       secondary: "#D4AF6A",
//       accent: "#F2E1BC",
//       surface: "#F8F5EE",
//     },
//   },
//   {
//     key: "clean-future",
//     family: "Clean Future",
//     templateId: "minimal",
//     title: "Clean Future",
//     accentLabel: "Future Lite",
//     styleDirection: "Minimal futuristic calm",
//     summary: "A restrained futuristic direction for clean but modern output.",
//     palette: {
//       primary: "#111827",
//       secondary: "#38BDF8",
//       accent: "#7DD3FC",
//       surfaceAlt: "#F0F9FF",
//     },
//   },
//   {
//     key: "signature-editorial",
//     family: "Signature Editorial",
//     templateId: "luxury",
//     title: "Signature",
//     accentLabel: "Editorial",
//     styleDirection: "Signature editorial confidence",
//     summary: "Magazine-inspired presentation with premium typography signals.",
//     palette: {
//       primary: "#1F2937",
//       secondary: "#C08457",
//       accent: "#E9C9A8",
//       surface: "#FFF9F2",
//     },
//   },
// ] as const;

// function clampScore(value: number) {
//   return Math.max(48, Math.min(99, Math.round(value)));
// }

// function adjustHexColor(hex: string, amount: number) {
//   const normalized = String(hex || "")
//     .replace("#", "")
//     .trim();
//   if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return hex;
//   const value = Number.parseInt(normalized, 16);
//   const next = [16, 8, 0]
//     .map((shift) => {
//       const channel = (value >> shift) & 255;
//       const adjusted = Math.max(0, Math.min(255, channel + amount));
//       return adjusted.toString(16).padStart(2, "0");
//     })
//     .join("");
//   return `#${next}`;
// }

// function buildPasses(
//   activeId: OrchestraPass["id"] | null = null
// ): OrchestraPass[] {
//   const sequence: OrchestraPass[] = [
//     {
//       id: "facts",
//       title: "Pass 1 · Facts",
//       detail:
//         "Extract structured invoice facts from prompt, PDFs, and current fields.",
//       status: "idle",
//     },
//     {
//       id: "brand",
//       title: "Pass 2 · Brand",
//       detail: "Infer tone, client context, and brand posture from the brief.",
//       status: "idle",
//     },
//     {
//       id: "layouts",
//       title: "Pass 3 · Layouts",
//       detail:
//         "Generate multiple layout systems while preserving the same billing data.",
//       status: "idle",
//     },
//     {
//       id: "polish",
//       title: "Pass 4 · Polish",
//       detail: "Tighten typography, spacing, trust cues, and visual rhythm.",
//       status: "idle",
//     },
//     {
//       id: "rank",
//       title: "Pass 5 · Ranking",
//       detail:
//         "Score every variant for safest, boldest, premium, futuristic, and payment confidence.",
//       status: "idle",
//     },
//   ];

//   if (!activeId) return sequence;
//   const activeIndex = sequence.findIndex((pass) => pass.id === activeId);
//   return sequence.map((pass, index) => ({
//     ...pass,
//     status:
//       index < activeIndex ? "done" : index === activeIndex ? "running" : "idle",
//   }));
// }

// function inferBrandProfile(
//   invoice: InvoiceState,
//   prompt: string
// ): BrandInference {
//   const text =
//     `${prompt} ${invoice.notes} ${invoice.paymentTerms}`.toLowerCase();
//   const issuer = `${invoice.issuerName} ${invoice.customerName}`.toLowerCase();
//   const isCreative =
//     /design|brand|creative|studio|campaign|ux|ui|video|photo/.test(
//       text + issuer
//     );
//   const isEnterprise =
//     /procurement|enterprise|board|compliance|saas|retainer|consulting/.test(
//       text + issuer
//     );
//   const isTech =
//     /ai|fintech|crypto|future|platform|automation|software|startup/.test(
//       text + issuer
//     );
//   const industry = isCreative
//     ? "Creative services"
//     : isTech
//     ? "Technology / product"
//     : isEnterprise
//     ? "Enterprise services"
//     : "Professional services";
//   const tone = isTech
//     ? "Future-forward and sharp"
//     : isCreative
//     ? "Expressive and premium"
//     : isEnterprise
//     ? "Executive and trustworthy"
//     : "Polished and professional";
//   const recommendedFamily = isTech
//     ? "Futuristic Glass"
//     : isCreative
//     ? "Editorial Luxe"
//     : isEnterprise
//     ? "Audit-Ready Professional"
//     : "Modern Premium";
//   const impression = `${
//     invoice.issuerName || "This issuer"
//   } reads as ${tone.toLowerCase()} with a ${industry.toLowerCase()} profile.`;
//   const notes = [
//     `${invoice.currency} billing with ${invoice.lineItems.length} line item${
//       invoice.lineItems.length === 1 ? "" : "s"
//     }`,
//     invoice.taxPercentage !== "0.00"
//       ? `Tax-aware (${invoice.taxPercentage}% tax)`
//       : "Simple untaxed structure",
//     invoice.paymentTerms || "Payment terms still editable",
//   ];
//   return { industry, tone, impression, recommendedFamily, notes };
// }

// function deriveFactHighlights(
//   invoice: InvoiceState,
//   prompt: string,
//   attachmentCount: number
// ) {
//   return [
//     invoice.customerName
//       ? `Client · ${invoice.customerName}`
//       : "Client pending",
//     `${invoice.currency} ${toMoney(invoice.amount) || "0.00"}`,
//     invoice.dueDate ? `Due · ${invoice.dueDate}` : "Due date pending",
//     invoice.lineItems.length
//       ? `${invoice.lineItems.length} line item${
//           invoice.lineItems.length === 1 ? "" : "s"
//         }`
//       : "Line items pending",
//     attachmentCount
//       ? `${attachmentCount} PDF attachment${attachmentCount === 1 ? "" : "s"}`
//       : "No attachments yet",
//     prompt.trim() ? "AI brief loaded" : "Add a prompt to guide AI",
//   ].slice(0, 6);
// }

// function scoreVariant(
//   option: InvoiceDraftOption,
//   index: number
// ): VariantScoreCard {
//   const template = option.style.templateId;
//   const title =
//     `${option.title} ${option.accentLabel} ${option.summary}`.toLowerCase();
//   const safestBase =
//     template === "corporate" ? 92 : template === "minimal" ? 88 : 76;
//   const boldestBase =
//     template === "creative" ? 94 : template === "luxury" ? 84 : 68;
//   const premiumBase =
//     template === "luxury"
//       ? 96
//       : template === "creative"
//       ? 82
//       : template === "minimal"
//       ? 79
//       : 86;
//   const futuristicBase = /future|fintech|glass|neo/.test(title)
//     ? 95
//     : template === "creative"
//     ? 83
//     : template === "corporate"
//     ? 78
//     : 64;
//   const paymentConfidenceBase = /payment|audit|trust|executive/.test(title)
//     ? 96
//     : template === "corporate"
//     ? 92
//     : template === "minimal"
//     ? 85
//     : 80;

//   return {
//     safest: clampScore(safestBase - index),
//     boldest: clampScore(boldestBase - (index % 3) * 2),
//     premium: clampScore(premiumBase - (index % 4)),
//     futuristic: clampScore(futuristicBase - (index % 5)),
//     paymentConfidence: clampScore(paymentConfidenceBase - (index % 4)),
//   };
// }

// function variantBadgeFromScore(score: VariantScoreCard) {
//   const entries: Array<[string, number]> = [
//     ["Safest", score.safest],
//     ["Boldest", score.boldest],
//     ["Premium", score.premium],
//     ["Futuristic", score.futuristic],
//     ["Payment confidence", score.paymentConfidence],
//   ];
//   return entries.sort((a, b) => b[1] - a[1])[0][0];
// }

// function makeOrchestraVariant(
//   option: InvoiceDraftOption,
//   index: number,
//   familyOverride?: string,
//   source: OrchestraVariant["source"] = "draft"
// ): OrchestraVariant {
//   const score = scoreVariant(option, index);
//   return {
//     ...option,
//     id: `${option.templateId}-${index}-${option.accentLabel
//       .toLowerCase()
//       .replace(/\s+/g, "-")}`,
//     family: familyOverride || option.style.styleName,
//     badge: variantBadgeFromScore(score),
//     source,
//     rationale: option.summary || option.style.previewSummary,
//     score,
//   };
// }

// function rotateList<T>(items: readonly T[], offset: number) {
//   if (!items.length) return [] as T[];
//   const start = ((offset % items.length) + items.length) % items.length;
//   const copy = [...items];
//   return copy.slice(start).concat(copy.slice(0, start));
// }

// const LAYOUT_RECIPE_PRESETS = [
//   {
//     key: "split-hero",
//     label: "Split Hero",
//     summary: "Large hero amount with a crisp split information row.",
//     patches: {
//       logo: { x: 40, y: 42, w: 74, h: 74 },
//       title: { x: 130, y: 44, w: 200, h: 24, style: { fontSize: 15 } },
//       invoiceNumber: { x: 130, y: 76, w: 250, h: 42, style: { fontSize: 30 } },
//       amount: { x: 390, y: 40, w: 165, h: 112 },
//       issuer: { x: 40, y: 178, w: 245, h: 104 },
//       customer: { x: 310, y: 178, w: 245, h: 104 },
//       meta: { x: 40, y: 298, w: 515, h: 72 },
//       table: { x: 40, y: 388, w: 515, h: 224 },
//       notes: { x: 40, y: 628, w: 515, h: 96 },
//     },
//   },
//   {
//     key: "editorial-cards",
//     label: "Editorial Cards",
//     summary: "Three-card briefing row with a tall premium amount panel.",
//     patches: {
//       logo: { x: 40, y: 44, w: 62, h: 62 },
//       title: { x: 118, y: 48, w: 320, h: 24, style: { fontSize: 15 } },
//       invoiceNumber: { x: 40, y: 126, w: 360, h: 46, style: { fontSize: 33 } },
//       amount: { x: 398, y: 66, w: 157, h: 150 },
//       issuer: { x: 40, y: 260, w: 160, h: 130 },
//       customer: { x: 212, y: 260, w: 160, h: 130 },
//       meta: { x: 384, y: 260, w: 171, h: 130 },
//       table: { x: 40, y: 412, w: 515, h: 232 },
//       notes: { x: 40, y: 660, w: 515, h: 72 },
//     },
//   },
//   {
//     key: "left-rail",
//     label: "Left Rail",
//     summary:
//       "Editorial left rail for branding, with ledger content on the right.",
//     patches: {
//       logo: { x: 40, y: 52, w: 76, h: 76 },
//       title: { x: 40, y: 148, w: 132, h: 34, style: { fontSize: 14 } },
//       invoiceNumber: { x: 40, y: 184, w: 132, h: 92, style: { fontSize: 26 } },
//       amount: { x: 40, y: 294, w: 132, h: 118 },
//       issuer: { x: 200, y: 48, w: 170, h: 128 },
//       customer: { x: 385, y: 48, w: 170, h: 128 },
//       meta: { x: 200, y: 192, w: 355, h: 86 },
//       table: { x: 200, y: 296, w: 355, h: 340 },
//       notes: { x: 40, y: 654, w: 515, h: 70 },
//     },
//   },
//   {
//     key: "center-stage",
//     label: "Center Stage",
//     summary: "Centered premium masthead with a symmetrical invoice story.",
//     patches: {
//       logo: { x: 257, y: 36, w: 82, h: 82 },
//       title: { x: 188, y: 132, w: 220, h: 24, style: { fontSize: 14 } },
//       invoiceNumber: { x: 108, y: 164, w: 380, h: 46, style: { fontSize: 34 } },
//       amount: { x: 176, y: 230, w: 244, h: 96 },
//       issuer: { x: 40, y: 346, w: 245, h: 96 },
//       customer: { x: 310, y: 346, w: 245, h: 96 },
//       meta: { x: 40, y: 458, w: 515, h: 60 },
//       table: { x: 40, y: 534, w: 515, h: 146 },
//       notes: { x: 40, y: 694, w: 515, h: 48 },
//     },
//   },
//   {
//     key: "top-band",
//     label: "Top Band",
//     summary: "Full-width briefing band with compact premium detail cards.",
//     patches: {
//       logo: { x: 44, y: 48, w: 68, h: 68 },
//       title: { x: 130, y: 50, w: 160, h: 24, style: { fontSize: 15 } },
//       invoiceNumber: { x: 130, y: 84, w: 190, h: 42, style: { fontSize: 28 } },
//       amount: { x: 350, y: 46, w: 205, h: 88 },
//       meta: { x: 40, y: 156, w: 515, h: 72 },
//       issuer: { x: 40, y: 248, w: 160, h: 118 },
//       customer: { x: 212, y: 248, w: 160, h: 118 },
//       notes: { x: 384, y: 248, w: 171, h: 118 },
//       table: { x: 40, y: 386, w: 515, h: 270 },
//     },
//   },
//   {
//     key: "magazine-column",
//     label: "Magazine Column",
//     summary: "Magazine-style column rhythm with a floating premium total.",
//     patches: {
//       logo: { x: 40, y: 48, w: 72, h: 72 },
//       title: { x: 130, y: 48, w: 300, h: 24, style: { fontSize: 15 } },
//       invoiceNumber: { x: 130, y: 82, w: 300, h: 42, style: { fontSize: 31 } },
//       amount: { x: 390, y: 160, w: 165, h: 120 },
//       meta: { x: 40, y: 166, w: 320, h: 104 },
//       issuer: { x: 40, y: 286, w: 248, h: 112 },
//       customer: { x: 307, y: 286, w: 248, h: 112 },
//       table: { x: 40, y: 420, w: 515, h: 230 },
//       notes: { x: 40, y: 666, w: 515, h: 60 },
//     },
//   },
// ] as const;

// function pickLayoutRecipe(seed: number) {
//   return LAYOUT_RECIPE_PRESETS[Math.abs(seed) % LAYOUT_RECIPE_PRESETS.length];
// }

// function remixPalette(palette: StylePalette, seed: number): StylePalette {
//   const tonalOffsets = [-16, -10, -4, 6, 12, 18, 24];
//   const accentOffsets = [22, 16, 10, 4, -6, -12, -18];
//   const toneOffset = tonalOffsets[Math.abs(seed) % tonalOffsets.length];
//   const accentOffset = accentOffsets[Math.abs(seed + 3) % accentOffsets.length];

//   return {
//     ...palette,
//     primary: adjustHexColor(palette.primary, toneOffset),
//     secondary: adjustHexColor(palette.secondary, Math.round(toneOffset / 2)),
//     accent: adjustHexColor(palette.accent, accentOffset),
//     surface: adjustHexColor(palette.surface, Math.round(toneOffset / 5)),
//     surfaceAlt: adjustHexColor(
//       palette.surfaceAlt,
//       Math.round(accentOffset / 6)
//     ),
//     muted: adjustHexColor(palette.muted, Math.round(toneOffset / 3)),
//     text: palette.text,
//   };
// }

// function applyLayoutPatches(
//   blocks: CanvasBlock[],
//   patches: Record<
//     string,
//     Partial<CanvasBlock> & { style?: Record<string, string | number> }
//   >
// ) {
//   return cloneBlocks(blocks).map((block) => {
//     const patch = patches[block.id];
//     if (!patch) return block;
//     const { style, ...rest } = patch;
//     return {
//       ...block,
//       ...rest,
//       style: style ? { ...(block.style || {}), ...style } : block.style,
//     };
//   });
// }

// function createRemixedBlocks(
//   templateId: string,
//   palette: StylePalette,
//   seed: number
// ) {
//   const recipe = pickLayoutRecipe(seed);
//   const baseBlocks = applyLayoutPatches(
//     defaultBlocks(templateId),
//     recipe.patches
//   );
//   const cardBackground =
//     templateId === "luxury" ? palette.surfaceAlt : palette.surface;
//   const panelBackground =
//     templateId === "luxury"
//       ? adjustHexColor(palette.surfaceAlt, 8)
//       : palette.surfaceAlt;
//   const numberColor = templateId === "luxury" ? "#FFFFFF" : palette.text;

//   return baseBlocks.map((block, index) => {
//     if (block.id === "logo") {
//       return {
//         ...block,
//         z: index + 1,
//         style: {
//           ...(block.style || {}),
//           radius: 20 + ((seed + index) % 12),
//           background: templateId === "luxury" ? palette.surfaceAlt : "#FFFFFF",
//         },
//       };
//     }

//     if (block.id === "title") {
//       return {
//         ...block,
//         z: index + 1,
//         style: {
//           ...(block.style || {}),
//           color: templateId === "luxury" ? palette.secondary : palette.accent,
//           fontWeight: "700",
//           letterSpacing: 0.2,
//         },
//       };
//     }

//     if (block.id === "invoiceNumber") {
//       return {
//         ...block,
//         z: index + 1,
//         style: {
//           ...(block.style || {}),
//           color: numberColor,
//           fontWeight: "800",
//         },
//       };
//     }

//     if (block.id === "amount") {
//       return {
//         ...block,
//         z: index + 1,
//         style: {
//           ...(block.style || {}),
//           background: palette.accent,
//           color: palette.primary,
//           radius: 24 + ((seed + index) % 14),
//         },
//       };
//     }

//     if (block.id === "issuer" || block.id === "customer") {
//       return {
//         ...block,
//         z: index + 1,
//         style: {
//           ...(block.style || {}),
//           background: cardBackground,
//           color: templateId === "luxury" ? "#F8FAFC" : palette.text,
//           radius: 18 + ((seed + index) % 10),
//           fontWeight: "600",
//         },
//       };
//     }

//     if (block.id === "meta") {
//       return {
//         ...block,
//         z: index + 1,
//         style: {
//           ...(block.style || {}),
//           background: panelBackground,
//           color: templateId === "luxury" ? palette.accent : palette.muted,
//           radius: 18 + ((seed + index) % 10),
//         },
//       };
//     }

//     if (block.id === "table") {
//       return {
//         ...block,
//         z: index + 1,
//         style: {
//           ...(block.style || {}),
//           background:
//             templateId === "luxury"
//               ? adjustHexColor(palette.surface, 4)
//               : "#FFFFFF",
//           radius: 20 + ((seed + index) % 12),
//         },
//       };
//     }

//     if (block.id === "notes") {
//       return {
//         ...block,
//         z: index + 1,
//         style: {
//           ...(block.style || {}),
//           background: panelBackground,
//           color: templateId === "luxury" ? palette.accent : palette.muted,
//           radius: 18 + ((seed + index) % 10),
//         },
//       };
//     }

//     return { ...block, z: index + 1 };
//   });
// }

// function buildVariantFromBlueprint(
//   invoice: InvoiceState,
//   blueprint: (typeof VARIANT_BLUEPRINTS)[number],
//   index: number,
//   remixSeed = 0
// ): OrchestraVariant {
//   const baseStyle = BASE_STYLES[blueprint.templateId] || BASE_STYLES.corporate;
//   const paletteOverride = blueprint.palette as Partial<StylePalette>;
//   const rawPalette = {
//     ...invoice.style.palette,
//     ...baseStyle.palette,
//     ...paletteOverride,
//     surface: paletteOverride.surface || baseStyle.palette.surface,
//   };
//   const palette = remixPalette(rawPalette, remixSeed + index);
//   const style = mergeStyle(baseStyle, palette);
//   const recipe = pickLayoutRecipe(remixSeed + index);
//   const family = `${blueprint.family} · ${recipe.label}`;
//   const summary = `${blueprint.summary} ${recipe.summary}`;
//   const option: InvoiceDraftOption = {
//     title: blueprint.title,
//     accentLabel: blueprint.accentLabel,
//     templateId: style.templateId,
//     styleDirection: `${blueprint.styleDirection} · ${recipe.label}`,
//     style: {
//       ...style,
//       styleName: family,
//       accentLabel: blueprint.accentLabel,
//       tone: `${blueprint.styleDirection} · ${recipe.label}`,
//       previewSummary: summary,
//       heroCopy: summary,
//     },
//     blocks: createRemixedBlocks(style.templateId, palette, remixSeed + index),
//     summary,
//   };
//   const variant = makeOrchestraVariant(option, index, family, "remix");
//   return {
//     ...variant,
//     id: `${variant.id}-${(remixSeed + index).toString(36)}`,
//     rationale: summary,
//   };
// }

// function remixDraftOption(
//   option: InvoiceDraftOption,
//   invoice: InvoiceState,
//   remixSeed: number,
//   index: number
// ) {
//   const templateId =
//     option.style?.templateId || option.templateId || invoice.style.templateId;
//   const baseStyle = BASE_STYLES[templateId] || BASE_STYLES.corporate;
//   const recipe = pickLayoutRecipe(remixSeed + index + 1);
//   const palette = remixPalette(
//     {
//       ...baseStyle.palette,
//       ...invoice.style.palette,
//       ...option.style.palette,
//     },
//     remixSeed + index + 11
//   );
//   const style = mergeStyle(baseStyle, palette);
//   const family = `${option.style.styleName || option.title} · ${recipe.label}`;
//   const summary = `${
//     option.summary || option.style.previewSummary || style.previewSummary
//   } ${recipe.summary}`.trim();
//   const variant = makeOrchestraVariant(
//     {
//       ...option,
//       templateId: style.templateId,
//       styleDirection: `${
//         option.styleDirection || option.style.tone || style.tone
//       } · ${recipe.label}`,
//       style: {
//         ...option.style,
//         ...style,
//         styleName: family,
//         accentLabel: option.accentLabel,
//         palette,
//         tone: `${option.styleDirection || option.style.tone || style.tone} · ${
//           recipe.label
//         }`,
//         previewSummary: summary,
//         heroCopy: `${option.style.heroCopy || style.heroCopy || ""} ${
//           recipe.summary
//         }`.trim(),
//       },
//       blocks: createRemixedBlocks(
//         style.templateId,
//         palette,
//         remixSeed + index + 1
//       ),
//       summary,
//     },
//     index,
//     family,
//     "remix"
//   );

//   return {
//     ...variant,
//     id: `${variant.id}-${(remixSeed + index).toString(36)}`,
//     rationale: summary,
//   };
// }

// function synthesizeVariantPool(
//   existing: InvoiceDraftOption[],
//   invoice: InvoiceState,
//   desiredCount: number,
//   remixSeed = 0
// ) {
//   const seed = Math.abs(remixSeed || 1);
//   const remixedExisting = existing.map((option, index) =>
//     remixDraftOption(option, invoice, seed, index)
//   );
//   const usedFamilies = new Set(
//     remixedExisting.map((variant) => variant.family)
//   );
//   const remixedFallbacks: OrchestraVariant[] = [];

//   for (const [offset, blueprint] of rotateList(
//     VARIANT_BLUEPRINTS,
//     seed
//   ).entries()) {
//     if (remixedExisting.length + remixedFallbacks.length >= desiredCount) break;
//     const candidate = buildVariantFromBlueprint(
//       invoice,
//       blueprint,
//       remixedExisting.length + remixedFallbacks.length,
//       seed + offset
//     );
//     if (usedFamilies.has(candidate.family)) continue;
//     remixedFallbacks.push(candidate);
//     usedFamilies.add(candidate.family);
//   }

//   return [...remixedExisting, ...remixedFallbacks].slice(0, desiredCount);
// }

// function buildOptimizationVariant(
//   invoice: InvoiceState,
//   action: (typeof OPTIMIZE_ACTIONS)[number],
//   index: number
// ) {
//   const mapping: Record<
//     (typeof OPTIMIZE_ACTIONS)[number],
//     (typeof VARIANT_BLUEPRINTS)[number]["key"]
//   > = {
//     "Make it more premium": "editorial-luxe",
//     "Make it more futuristic": "futuristic-glass",
//     "Improve spacing": "minimal-swiss",
//     "Improve trust signals": "payment-confidence",
//     "Improve brand consistency": "signature-editorial",
//     "Improve typography": "quiet-premium",
//     "Make it more enterprise-safe": "audit-ready",
//   };
//   const blueprint =
//     VARIANT_BLUEPRINTS.find((item) => item.key === mapping[action]) ||
//     VARIANT_BLUEPRINTS[0];
//   const variant = buildVariantFromBlueprint(invoice, blueprint, index);
//   return {
//     ...variant,
//     id: `${variant.id}-optimized-${index}`,
//     title: action,
//     rationale: `AI optimization pass applied: ${action.toLowerCase()}.`,
//   };
// }

// function initials(name: string) {
//   const parts = String(name || "IP")
//     .trim()
//     .split(/\s+/)
//     .filter(Boolean);
//   return `${parts[0]?.[0] || "I"}${parts[1]?.[0] || parts[0]?.[1] || "P"}`
//     .slice(0, 2)
//     .toUpperCase();
// }

// function styleCardCss(style: StyleTheme) {
//   return {
//     background: `linear-gradient(160deg, ${style.palette.surface}, ${style.palette.surfaceAlt})`,
//     color: style.palette.text,
//     border: `1px solid ${style.palette.accent}`,
//   } as const;
// }

// function moveBlock(blocks: CanvasBlock[], id: string, dx: number, dy: number) {
//   return blocks.map((block) =>
//     block.id === id
//       ? {
//           ...block,
//           x: Math.max(8, Math.min(PAGE_WIDTH - block.w - 8, block.x + dx)),
//           y: Math.max(
//             8,
//             Math.min(PAGE_HEIGHT - FOOTER_HEIGHT - block.h - 8, block.y + dy)
//           ),
//         }
//       : block
//   );
// }

// function MiniPreview({
//   invoice,
//   blocks,
//   logoDataUrl,
// }: {
//   invoice: InvoiceState;
//   blocks: CanvasBlock[];
//   logoDataUrl: string | null;
// }) {
//   return (
//     <div className="mini-canvas-frame">
//       <div className="mini-canvas-scale">
//         <InvoiceCanvasPage
//           invoice={invoice}
//           blocks={blocks}
//           logoDataUrl={logoDataUrl}
//           selectedBlockId={null}
//           onSelectBlock={() => undefined}
//           onBlockMouseDown={() => undefined}
//           onUpdateInvoice={() => undefined}
//           onUpdateLineItem={() => undefined}
//           onAddLineItem={() => undefined}
//           onDeleteBlock={() => undefined}
//           onLogoPick={() => undefined}
//           readOnly
//         />
//       </div>
//     </div>
//   );
// }

// function InvoiceCanvasPage(props: {
//   invoice: InvoiceState;
//   blocks: CanvasBlock[];
//   logoDataUrl: string | null;
//   selectedBlockId: string | null;
//   onSelectBlock: (id: string) => void;
//   onBlockMouseDown: (
//     event: ReactMouseEvent<HTMLButtonElement>,
//     id: string
//   ) => void;
//   onUpdateInvoice: (patch: Partial<InvoiceState>) => void;
//   onUpdateLineItem: (index: number, key: keyof LineItem, value: string) => void;
//   onAddLineItem: () => void;
//   onDeleteBlock: (id: string) => void;
//   onLogoPick: () => void;
//   readOnly?: boolean;
// }) {
//   const {
//     invoice,
//     blocks,
//     logoDataUrl,
//     selectedBlockId,
//     onSelectBlock,
//     onBlockMouseDown,
//     onUpdateInvoice,
//     onUpdateLineItem,
//     onAddLineItem,
//     onDeleteBlock,
//     onLogoPick,
//     readOnly,
//   } = props;
//   const { style } = invoice;
//   const palette = style.palette;
//   const orderedBlocks = [...blocks].sort((a, b) => (a.z || 0) - (b.z || 0));

//   return (
//     <div
//       className={`invoice-canvas-page is-${style.templateId}`}
//       style={{
//         background: palette.surface,
//         color: palette.text,
//         width: PAGE_WIDTH,
//         height: PAGE_HEIGHT,
//       }}
//     >
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-luxury"
//         style={{
//           background:
//             style.templateId === "luxury" ? palette.primary : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-creative"
//         style={{
//           background:
//             style.templateId === "creative" ? palette.primary : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-creative-accent"
//         style={{
//           background:
//             style.templateId === "creative" ? palette.accent : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-bg invoice-canvas-bg-corporate"
//         style={{
//           background:
//             style.templateId === "corporate"
//               ? palette.surfaceAlt
//               : "transparent",
//         }}
//       />
//       <div
//         className="invoice-canvas-line"
//         style={{
//           borderColor:
//             style.templateId === "minimal" ? palette.secondary : "transparent",
//         }}
//       />

//       {orderedBlocks.map((block) => {
//         const isSelected = selectedBlockId === block.id;
//         const background = block.style?.background || "transparent";
//         return (
//           <div
//             key={block.id}
//             className={`canvas-block canvas-block-${block.type} ${
//               isSelected ? "is-selected" : ""
//             }`}
//             style={{
//               left: block.x,
//               top: block.y,
//               width: block.w,
//               height: block.h,
//               color: block.style?.color || palette.text,
//               background,
//               borderRadius: block.style?.radius || 18,
//               boxShadow: isSelected
//                 ? `0 0 0 2px ${palette.primary}`
//                 : undefined,
//             }}
//             onMouseDown={() => onSelectBlock(block.id)}
//           >
//             {!readOnly ? (
//               <>
//                 <button
//                   type="button"
//                   className="canvas-drag-handle"
//                   onMouseDown={(event) => onBlockMouseDown(event, block.id)}
//                   aria-label={`Move ${block.id}`}
//                 >
//                   ⋮⋮
//                 </button>
//                 <button
//                   type="button"
//                   className="canvas-delete-handle"
//                   onClick={(event) => {
//                     event.stopPropagation();
//                     onDeleteBlock(block.id);
//                   }}
//                   aria-label={`Delete ${block.id}`}
//                 >
//                   ×
//                 </button>
//               </>
//             ) : null}

//             {block.type === "logo" ? (
//               <button
//                 type="button"
//                 className={`canvas-logo-inner ${
//                   readOnly ? "is-readonly" : "is-uploadable"
//                 }`}
//                 onClick={(event) => {
//                   event.stopPropagation();
//                   if (!readOnly) onLogoPick();
//                 }}
//               >
//                 {logoDataUrl ? (
//                   <img
//                     src={logoDataUrl}
//                     alt="Logo"
//                     className="canvas-logo-image"
//                   />
//                 ) : (
//                   <div className="canvas-logo-placeholder">
//                     <span className="canvas-logo-placeholder-badge">
//                       {initials(invoice.issuerName)}
//                     </span>
//                     <span className="canvas-logo-placeholder-copy">
//                       Click to upload logo
//                     </span>
//                   </div>
//                 )}
//               </button>
//             ) : null}

//             {block.binding?.key === "headerTitle" ? (
//               <input
//                 className="canvas-inline-input canvas-inline-title"
//                 value={invoice.style.headerTitle}
//                 onChange={(event) =>
//                   onUpdateInvoice({
//                     style: {
//                       ...invoice.style,
//                       headerTitle: event.target.value,
//                     },
//                   })
//                 }
//                 readOnly={readOnly}
//               />
//             ) : null}

//             {block.binding?.key === "invoiceNumber" ? (
//               <input
//                 className="canvas-inline-input canvas-inline-number"
//                 value={invoice.invoiceNumber}
//                 onChange={(event) =>
//                   onUpdateInvoice({ invoiceNumber: event.target.value })
//                 }
//                 readOnly={readOnly}
//               />
//             ) : null}

//             {block.type === "amount" ? (
//               <div className="canvas-amount-shell">
//                 <span className="canvas-kicker">Amount due</span>
//                 <div className="canvas-amount-row">
//                   <input
//                     className="canvas-inline-currency"
//                     list="invoice-currency-list"
//                     value={invoice.currency}
//                     onChange={(event) =>
//                       onUpdateInvoice({
//                         currency: normalizeCurrency(
//                           event.target.value,
//                           invoice.currency
//                         ),
//                       })
//                     }
//                     readOnly={readOnly}
//                   />
//                   <input
//                     className="canvas-inline-amount is-readonly"
//                     value={invoice.amount}
//                     onChange={(event) =>
//                       onUpdateInvoice({ amount: event.target.value })
//                     }
//                     readOnly
//                   />
//                 </div>
//                 <span className="canvas-subtle-copy">
//                   {invoice.style.trustBadge}
//                 </span>
//               </div>
//             ) : null}

//             {block.binding?.key === "issuer" ? (
//               <div className="canvas-multiline-card">
//                 <span className="canvas-kicker">From</span>
//                 <input
//                   className="canvas-inline-input"
//                   value={invoice.issuerName}
//                   onChange={(event) =>
//                     onUpdateInvoice({ issuerName: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//                 <input
//                   className="canvas-inline-input"
//                   value={invoice.issuerEmail}
//                   onChange={(event) =>
//                     onUpdateInvoice({ issuerEmail: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//                 <textarea
//                   className="canvas-inline-textarea"
//                   value={invoice.issuerAddress}
//                   onChange={(event) =>
//                     onUpdateInvoice({ issuerAddress: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//               </div>
//             ) : null}

//             {block.binding?.key === "customer" ? (
//               <div className="canvas-multiline-card">
//                 <span className="canvas-kicker">Bill to</span>
//                 <input
//                   className="canvas-inline-input"
//                   value={invoice.customerName}
//                   onChange={(event) =>
//                     onUpdateInvoice({ customerName: event.target.value })
//                   }
//                   readOnly={readOnly}
//                 />
//                 <div className="canvas-dual-row">
//                   <input
//                     type="date"
//                     className="canvas-inline-input"
//                     value={invoice.issueDate}
//                     onChange={(event) =>
//                       onUpdateInvoice({ issueDate: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                   <input
//                     type="date"
//                     className="canvas-inline-input"
//                     value={invoice.dueDate}
//                     onChange={(event) =>
//                       onUpdateInvoice({ dueDate: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//               </div>
//             ) : null}

//             {block.binding?.key === "meta" ? (
//               <div className="canvas-meta-grid">
//                 <div>
//                   <span className="canvas-kicker">Label</span>
//                   <input
//                     className="canvas-inline-input"
//                     value={invoice.accentLabel}
//                     onChange={(event) =>
//                       onUpdateInvoice({ accentLabel: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//                 <div>
//                   <span className="canvas-kicker">Terms</span>
//                   <input
//                     className="canvas-inline-input"
//                     value={invoice.paymentTerms}
//                     onChange={(event) =>
//                       onUpdateInvoice({ paymentTerms: event.target.value })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//                 <div style={{ gridColumn: "1 / -1" }}>
//                   <span className="canvas-kicker">Hero copy</span>
//                   <input
//                     className="canvas-inline-input"
//                     value={invoice.style.heroCopy}
//                     onChange={(event) =>
//                       onUpdateInvoice({
//                         style: {
//                           ...invoice.style,
//                           heroCopy: event.target.value,
//                         },
//                       })
//                     }
//                     readOnly={readOnly}
//                   />
//                 </div>
//               </div>
//             ) : null}

//             {block.type === "table" ? (
//               <div className="canvas-table-shell">
//                 <div
//                   className="canvas-table-head"
//                   style={{
//                     background:
//                       style.templateId === "minimal"
//                         ? palette.surfaceAlt
//                         : palette.primary,
//                     color:
//                       style.templateId === "minimal" ? palette.text : "#fff",
//                   }}
//                 >
//                   <span>Description</span>
//                   <span>Qty</span>
//                   <span>Unit</span>
//                   <span>Currency</span>
//                   <span>Amount</span>
//                 </div>
//                 <div className="canvas-table-body">
//                   {invoice.lineItems.map((item, index) => (
//                     <div
//                       key={`${index}-${item.description}`}
//                       className="canvas-table-row"
//                     >
//                       <input
//                         className="canvas-inline-input is-readonly"
//                         value={item.description}
//                         onChange={(event) =>
//                           onUpdateLineItem(
//                             index,
//                             "description",
//                             event.target.value
//                           )
//                         }
//                         readOnly
//                       />
//                       <input
//                         className="canvas-inline-input"
//                         value={item.quantity}
//                         onChange={(event) =>
//                           onUpdateLineItem(
//                             index,
//                             "quantity",
//                             event.target.value
//                           )
//                         }
//                         readOnly={readOnly}
//                       />
//                       <input
//                         className="canvas-inline-input"
//                         value={item.unitPrice}
//                         onChange={(event) =>
//                           onUpdateLineItem(
//                             index,
//                             "unitPrice",
//                             event.target.value
//                           )
//                         }
//                         readOnly={readOnly}
//                       />
//                       <input
//                         className="canvas-inline-input is-readonly canvas-table-currency"
//                         value={invoice.currency}
//                         readOnly
//                       />
//                       <input
//                         className="canvas-inline-input is-readonly"
//                         value={item.amount}
//                         onChange={(event) =>
//                           onUpdateLineItem(index, "amount", event.target.value)
//                         }
//                         readOnly
//                       />
//                     </div>
//                   ))}
//                 </div>
//                 {!readOnly ? (
//                   <button
//                     type="button"
//                     className="canvas-table-add"
//                     onClick={onAddLineItem}
//                   >
//                     + Add item
//                   </button>
//                 ) : null}
//                 <div className="canvas-table-summary">
//                   <div>
//                     <span>Total amount</span>
//                     <strong className="canvas-table-summary-value">
//                       {invoice.currency} {sumLineItems(invoice.lineItems)}
//                     </strong>
//                   </div>
//                   <div>
//                     <span className="canvas-tax-summary-label">
//                       Discount (
//                       <input
//                         className="canvas-inline-input canvas-inline-tax-rate"
//                         value={invoice.discountPercentage}
//                         onChange={(event) =>
//                           onUpdateInvoice({
//                             discountPercentage: event.target.value,
//                           })
//                         }
//                         readOnly={readOnly}
//                         aria-label="Discount percentage"
//                       />
//                       %)
//                     </span>
//                     <strong className="canvas-table-summary-value">
//                       - {invoice.currency}{" "}
//                       {calculateDiscountAmount(
//                         invoice.lineItems,
//                         invoice.discountPercentage
//                       )}
//                     </strong>
//                   </div>
//                   <div>
//                     <span className="canvas-tax-summary-label">
//                       GST / Tax / VAT (
//                       <input
//                         className="canvas-inline-input canvas-inline-tax-rate"
//                         value={invoice.taxPercentage}
//                         onChange={(event) =>
//                           onUpdateInvoice({ taxPercentage: event.target.value })
//                         }
//                         readOnly={readOnly}
//                         aria-label="GST, tax, or VAT percentage"
//                       />
//                       %)
//                     </span>
//                     <strong className="canvas-table-summary-value">
//                       {invoice.currency}{" "}
//                       {calculateTaxAmount(
//                         invoice.lineItems,
//                         invoice.taxPercentage,
//                         invoice.discountPercentage
//                       )}
//                     </strong>
//                   </div>
//                   <div className="is-grand">
//                     <span>Grand total</span>
//                     <strong className="canvas-table-summary-value">
//                       {invoice.currency} {invoice.amount}
//                     </strong>
//                   </div>
//                 </div>
//               </div>
//             ) : null}

//             {block.binding?.key === "notes" ? (
//               <div className="canvas-notes-shell">
//                 <div className="canvas-notes-head">
//                   <span className="canvas-kicker">Notes</span>
//                   {!readOnly && invoice.notes ? (
//                     <button
//                       type="button"
//                       className="canvas-mini-action"
//                       onClick={() => onUpdateInvoice({ notes: "" })}
//                     >
//                       Clear
//                     </button>
//                   ) : null}
//                 </div>
//                 <textarea
//                   className="canvas-inline-textarea canvas-inline-notes"
//                   value={invoice.notes}
//                   onChange={(event) =>
//                     onUpdateInvoice({ notes: event.target.value })
//                   }
//                   readOnly={readOnly}
//                   placeholder="Add optional payment notes or leave blank."
//                 />
//               </div>
//             ) : null}
//           </div>
//         );
//       })}

//       <div
//         className="invoice-footer-preview"
//         style={{
//           background:
//             invoice.style.templateId === "luxury"
//               ? palette.primary
//               : palette.surfaceAlt,
//           color: invoice.style.templateId === "luxury" ? "#fff" : palette.text,
//         }}
//       >
//         <div className="invoice-footer-copy">
//           <strong>InvoiceProof</strong>
//           <span>
//             QR, brand, and verification link appear on every final page.
//           </span>
//           <span className="invoice-footer-link">/verify/&lt;public-id&gt;</span>
//         </div>
//         <div className="invoice-footer-qr">QR</div>
//       </div>
//     </div>
//   );
// }

// export function NewInvoiceForm() {
//   const router = useRouter();
//   const { showToast } = useToast();
//   const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
//   const [invoice, setInvoice] = useState<InvoiceState>(() =>
//     createInitialInvoice(today)
//   );
//   const [blocks, setBlocks] = useState<CanvasBlock[]>(() =>
//     defaultBlocks("corporate")
//   );
//   const [drafts, setDrafts] = useState<InvoiceDraftOption[]>([]);
//   const [selectedDraft, setSelectedDraft] = useState<string>("corporate");
//   const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
//     "invoiceNumber"
//   );
//   const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
//   const [logoName, setLogoName] = useState<string>("");
//   const [attachments, setAttachments] = useState<File[]>([]);
//   const [loading, setLoading] = useState<LoadingState>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [aiModalOpen, setAiModalOpen] = useState(false);
//   const [aiPrompt, setAiPrompt] = useState("");
//   const [aiPromptSummary, setAiPromptSummary] = useState("");
//   const [aiMissingFields, setAiMissingFields] = useState<string[]>([]);
//   const [aiTab, setAiTab] = useState<AiTab>("create");
//   const [variantCount, setVariantCount] = useState<4 | 8 | 12>(4);
//   const [orchestraPasses, setOrchestraPasses] = useState<OrchestraPass[]>(() =>
//     buildPasses()
//   );
//   const [scoredVariants, setScoredVariants] = useState<OrchestraVariant[]>([]);
//   const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
//     null
//   );
//   const [optimizationHistory, setOptimizationHistory] = useState<string[]>([]);
//   const dragRef = useRef<{ id: string; x: number; y: number } | null>(null);
//   const canvasStageRef = useRef<HTMLElement | null>(null);
//   const canvasViewportRef = useRef<HTMLDivElement | null>(null);
//   const logoInputRef = useRef<HTMLInputElement | null>(null);
//   const [canvasScale, setCanvasScale] = useState(1);
//   const hasAiDraft = Boolean(aiPrompt.trim() || aiPromptSummary.trim());
//   const brandInference = useMemo(
//     () => inferBrandProfile(invoice, aiPrompt),
//     [invoice, aiPrompt]
//   );
//   const factHighlights = useMemo(
//     () => deriveFactHighlights(invoice, aiPrompt, attachments.length),
//     [invoice, aiPrompt, attachments.length]
//   );
//   const selectedOrchestraVariant = useMemo(
//     () =>
//       scoredVariants.find((variant) => variant.id === selectedVariantId) ||
//       null,
//     [scoredVariants, selectedVariantId]
//   );

//   useEffect(() => {
//     const transferred = loadPendingInvoiceDraft();
//     if (!transferred) return;

//     clearPendingInvoiceDraft();

//     if (transferred.type === "ai-canvas") {
//       const data = transferred.payload as AiCanvasDraftResult & {
//         prompt?: string;
//       };
//       if (data.invoice) setInvoice(normalizeInvoiceState(data.invoice, today));
//       if (Array.isArray(data.blocks) && data.blocks.length)
//         setBlocks(cloneBlocks(data.blocks));
//       setAiPrompt(typeof data.prompt === "string" ? data.prompt : "");
//       setAiPromptSummary(
//         String(data?.promptSummary || "AI created an editable invoice draft.")
//       );
//       setAiMissingFields(
//         Array.isArray(data?.missingFields) ? data.missingFields.slice(0, 6) : []
//       );
//       setSelectedDraft(
//         String(
//           data?.templateId || data?.invoice?.style?.templateId || "corporate"
//         )
//       );
//       setSelectedBlockId("invoiceNumber");
//       window.requestAnimationFrame(() => {
//         canvasStageRef.current?.scrollIntoView({
//           behavior: "smooth",
//           block: "start",
//         });
//       });
//       showToast({
//         tone: "success",
//         title: "AI invoice ready",
//         description: "Your extracted invoice has been loaded into the canvas.",
//       });
//       return;
//     }

//     if (transferred.type === "pdf-detect") {
//       const payload = transferred.payload as {
//         fileName?: string;
//         detected?: any;
//       };
//       const detected = payload?.detected || {};
//       const base = createInitialInvoice(today);
//       const imported = normalizeImportedLineItems(
//         detected.lineItems,
//         base.lineItems
//       );
//       const taxPercentage = toMoney(
//         String(detected.taxPercentage || imported.taxPercentage || "0")
//       );
//       const discountPercentage = toMoney(
//         String(detected.discountPercentage || "0")
//       );
//       const lineItems = imported.lineItems;
//       const nextInvoice: InvoiceState = {
//         ...base,
//         invoiceNumber: String(detected.invoiceNumber || base.invoiceNumber),
//         customerName: String(detected.customerName || base.customerName),
//         amount: calculateInvoiceAmount(
//           lineItems,
//           taxPercentage,
//           discountPercentage
//         ),
//         currency: normalizeCurrency(
//           String(detected.currency || base.currency),
//           base.currency
//         ),
//         taxPercentage,
//         discountPercentage,
//         issueDate: String(detected.issueDate || base.issueDate),
//         dueDate: String(detected.dueDate || detected.issueDate || base.dueDate),
//         notes: String(detected.notes || base.notes),
//         paymentTerms: String(detected.paymentTerms || base.paymentTerms),
//         issuerName: String(detected.issuerName || base.issuerName),
//         issuerEmail: String(detected.issuerEmail || base.issuerEmail),
//         issuerAddress: String(detected.issuerAddress || base.issuerAddress),
//         lineItems,
//         style: mergeStyle(BASE_STYLES.corporate),
//         accentLabel: BASE_STYLES.corporate.accentLabel,
//       };
//       setInvoice(normalizeInvoiceState(nextInvoice, today));
//       setBlocks(defaultBlocks("corporate"));
//       setSelectedDraft("corporate");
//       setSelectedBlockId("invoiceNumber");
//       setAiPromptSummary(
//         String(
//           detected.extractionSummary ||
//             `Extracted invoice data from ${payload.fileName || "uploaded PDF"}.`
//         )
//       );
//       setAiMissingFields(
//         detected.needsReview
//           ? ["invoice number", "customer", "amount", "dates"].slice(0, 4)
//           : []
//       );
//       window.requestAnimationFrame(() => {
//         canvasStageRef.current?.scrollIntoView({
//           behavior: "smooth",
//           block: "start",
//         });
//       });
//       showToast({
//         tone: "success",
//         title: "PDF data loaded",
//         description:
//           "Review the extracted fields, then finalize the canvas PDF.",
//       });
//     }
//   }, [showToast, today]);

//   useEffect(() => {
//     function onMove(event: MouseEvent) {
//       if (!dragRef.current) return;
//       const dx = event.clientX - dragRef.current.x;
//       const dy = event.clientY - dragRef.current.y;
//       dragRef.current = {
//         ...dragRef.current,
//         x: event.clientX,
//         y: event.clientY,
//       };
//       setBlocks((current) => moveBlock(current, dragRef.current!.id, dx, dy));
//     }

//     function onUp() {
//       dragRef.current = null;
//     }

//     window.addEventListener("mousemove", onMove);
//     window.addEventListener("mouseup", onUp);
//     return () => {
//       window.removeEventListener("mousemove", onMove);
//       window.removeEventListener("mouseup", onUp);
//     };
//   }, []);

//   useEffect(() => {
//     if (!aiModalOpen) return;

//     function onKeyDown(event: KeyboardEvent) {
//       if (event.key === "Escape") {
//         setAiModalOpen(false);
//       }
//     }

//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [aiModalOpen]);

//   useEffect(() => {
//     if (!selectedBlockId) return;

//     function onDeleteKey(event: KeyboardEvent) {
//       const target = event.target as HTMLElement | null;
//       const tagName = target?.tagName || "";
//       if (
//         ["INPUT", "TEXTAREA", "SELECT"].includes(tagName) ||
//         target?.isContentEditable
//       )
//         return;
//       if (event.key !== "Delete" && event.key !== "Backspace") return;
//       event.preventDefault();
//       deleteBlock(selectedBlockId);
//     }

//     window.addEventListener("keydown", onDeleteKey);
//     return () => window.removeEventListener("keydown", onDeleteKey);
//   }, [selectedBlockId, blocks]);

//   useEffect(() => {
//     function updateCanvasScale() {
//       const viewportWidth =
//         canvasViewportRef.current?.clientWidth || PAGE_WIDTH;
//       const nextScale = Math.max(
//         0.82,
//         Math.min(1.82, (viewportWidth - 24) / PAGE_WIDTH)
//       );
//       setCanvasScale(Number.isFinite(nextScale) ? nextScale : 1);
//     }

//     updateCanvasScale();

//     const observer =
//       typeof ResizeObserver !== "undefined" && canvasViewportRef.current
//         ? new ResizeObserver(() => updateCanvasScale())
//         : null;

//     if (observer && canvasViewportRef.current) {
//       observer.observe(canvasViewportRef.current);
//     }

//     window.addEventListener("resize", updateCanvasScale);
//     return () => {
//       observer?.disconnect();
//       window.removeEventListener("resize", updateCanvasScale);
//     };
//   }, []);

//   function updateInvoice(patch: Partial<InvoiceState>) {
//     setInvoice((current) => {
//       const next = { ...current, ...patch };
//       if (patch.currency !== undefined) {
//         next.currency = normalizeCurrency(
//           String(patch.currency || current.currency),
//           current.currency
//         );
//       }
//       if (patch.taxPercentage !== undefined) {
//         next.taxPercentage = toMoney(String(patch.taxPercentage || "0"));
//       }
//       if (patch.discountPercentage !== undefined) {
//         next.discountPercentage = toMoney(
//           String(patch.discountPercentage || "0")
//         );
//       }
//       if (
//         patch.taxPercentage !== undefined ||
//         patch.discountPercentage !== undefined
//       ) {
//         next.amount = calculateInvoiceAmount(
//           next.lineItems,
//           next.taxPercentage,
//           next.discountPercentage
//         );
//       }
//       return next;
//     });
//   }

//   function deleteBlock(id: string) {
//     setBlocks((current) => {
//       const next = current.filter((block) => block.id !== id);
//       setSelectedBlockId(next[0]?.id || null);
//       return next;
//     });
//   }

//   function updateLineItem(index: number, key: keyof LineItem, value: string) {
//     setInvoice((current) => {
//       const lineItems = current.lineItems.map((item, itemIndex) => {
//         if (itemIndex !== index) return item;
//         const next = { ...item, [key]: value };
//         if (key === "quantity" || key === "unitPrice") {
//           next.amount = toMoney(
//             String(Number(next.quantity || 0) * Number(next.unitPrice || 0))
//           );
//         }
//         return next;
//       });
//       return {
//         ...current,
//         lineItems,
//         amount: calculateInvoiceAmount(
//           lineItems,
//           current.taxPercentage,
//           current.discountPercentage
//         ),
//       };
//     });
//   }

//   function addLineItem() {
//     setInvoice((current) => {
//       const lineItems = [
//         ...current.lineItems,
//         {
//           description: "New item",
//           quantity: "1.00",
//           unitPrice: "0.00",
//           amount: "0.00",
//         },
//       ];
//       return {
//         ...current,
//         lineItems,
//         amount: calculateInvoiceAmount(
//           lineItems,
//           current.taxPercentage,
//           current.discountPercentage
//         ),
//       };
//     });
//   }

//   function openLogoPicker() {
//     logoInputRef.current?.click();
//   }

//   async function onLogoChange(event: ChangeEvent<HTMLInputElement>) {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
//       const message = "Please upload a PNG, JPG, or WebP logo.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Invalid logo type",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     if (file.size > MAX_LOGO_SIZE_BYTES) {
//       const message = "Logo must be 4 MB or smaller.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Logo too large",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     try {
//       const dataUrl = await readFileAsDataUrl(file);
//       setLogoDataUrl(dataUrl);
//       setLogoName(file.name);
//       showToast({
//         tone: "success",
//         title: "Logo ready",
//         description:
//           "Your logo will be rendered on the invoice canvas and final PDF.",
//       });
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Could not load logo.";
//       setError(message);
//       showToast({ tone: "error", title: "Logo failed", description: message });
//     }
//   }

//   function onAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
//     const files = Array.from(event.target.files || []);
//     if (!files.length) {
//       setAttachments([]);
//       return;
//     }

//     if (files.length > MAX_ATTACHMENTS) {
//       const message = `Attach up to ${MAX_ATTACHMENTS} PDFs at a time.`;
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Too many attachments",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     const invalidType = files.find(
//       (file) =>
//         file.type !== "application/pdf" &&
//         !file.name.toLowerCase().endsWith(".pdf")
//     );
//     if (invalidType) {
//       const message = "All attachments must be PDF files.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Invalid attachment",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     const oversized = files.find(
//       (file) => file.size > MAX_ATTACHMENT_SIZE_BYTES
//     );
//     if (oversized) {
//       const message = `${oversized.name} is larger than 12 MB.`;
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Attachment too large",
//         description: message,
//       });
//       event.target.value = "";
//       return;
//     }

//     setAttachments(files);
//     setError(null);
//   }

//   function updatePalette(key: keyof StylePalette, value: string) {
//     setInvoice((current) => ({
//       ...current,
//       style: {
//         ...current.style,
//         palette: {
//           ...current.style.palette,
//           [key]: value,
//         },
//       },
//     }));
//   }

//   function openAiModal() {
//     setError(null);
//     setAiModalOpen(true);
//   }

//   function handleAiPromptKeyDown(
//     event: ReactKeyboardEvent<HTMLTextAreaElement>
//   ) {
//     if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
//       event.preventDefault();
//       void generateAiCanvasFromPrompt(aiPrompt);
//     }
//   }

//   function clearAiDraft() {
//     setAiPrompt("");
//     setAiPromptSummary("");
//     setAiMissingFields([]);
//     setAiTab("create");
//     setOrchestraPasses(buildPasses());
//   }

//   function applyDraft(option: InvoiceDraftOption, orchestrationId?: string) {
//     setSelectedDraft(option.templateId);
//     setSelectedVariantId(orchestrationId || option.templateId);
//     setInvoice((current) => ({
//       ...current,
//       style: option.style,
//       accentLabel: option.style.accentLabel,
//     }));
//     setBlocks(cloneBlocks(option.blocks));
//   }

//   function applyVariant(variant: OrchestraVariant) {
//     applyDraft(variant, variant.id);
//     setAiPromptSummary(variant.rationale);
//     setAiTab("variants");
//     showToast({
//       tone: "success",
//       title: `${variant.family} applied`,
//       description: "This look is now active on the editable canvas.",
//     });
//   }

//   function optimizeCurrentVariant(action: (typeof OPTIMIZE_ACTIONS)[number]) {
//     const nextVariant = buildOptimizationVariant(
//       invoice,
//       action,
//       scoredVariants.length + optimizationHistory.length + 1
//     );
//     setOptimizationHistory((current) =>
//       [action, ...current.filter((item) => item !== action)].slice(0, 7)
//     );
//     setScoredVariants((current) => [
//       nextVariant,
//       ...current.filter((item) => item.id !== nextVariant.id),
//     ]);
//     setOrchestraPasses(buildPasses("polish"));
//     applyDraft(nextVariant, nextVariant.id);
//     setAiPromptSummary(nextVariant.rationale);
//     setAiTab("optimize");
//     window.requestAnimationFrame(() => setOrchestraPasses(buildPasses("rank")));
//   }

//   async function generateAiCanvasFromPrompt(rawPrompt = aiPrompt) {
//     if (loading) return;

//     const prompt = normalizeAiPrompt(rawPrompt);
//     if (prompt.length < 12) {
//       showToast({
//         tone: "error",
//         title: "Add a bit more detail",
//         description:
//           "Include who the invoice is for, what the work was, and the amount if you know it.",
//       });
//       return;
//     }

//     setAiModalOpen(false);
//     setLoading("ai-draft");
//     setError(null);
//     setAiTab("create");
//     setOrchestraPasses(buildPasses("facts"));

//     try {
//       const response = await fetch(`${API_BASE}/invoices/ai-canvas-draft`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt }),
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not create the AI invoice draft."
//         );
//       }

//       const data = json.data as AiCanvasDraftResult;
//       const nextInvoice = normalizeInvoiceState(data.invoice, today);
//       const primaryVariant = makeOrchestraVariant(
//         data,
//         0,
//         data.style.styleName,
//         "draft"
//       );
//       setAiPrompt(prompt);
//       setAiPromptSummary(
//         String(data?.promptSummary || "AI created an editable invoice draft.")
//       );
//       setAiMissingFields(
//         Array.isArray(data?.missingFields) ? data.missingFields.slice(0, 6) : []
//       );
//       setInvoice(nextInvoice);
//       setBlocks(cloneBlocks(data.blocks));
//       setDrafts([data]);
//       setScoredVariants([primaryVariant]);
//       setSelectedDraft(data.templateId);
//       setSelectedVariantId(primaryVariant.id);
//       setSelectedBlockId("invoiceNumber");
//       setAiTab("variants");
//       setOrchestraPasses(buildPasses("rank"));
//       window.requestAnimationFrame(() => {
//         canvasStageRef.current?.scrollIntoView({
//           behavior: "smooth",
//           block: "start",
//         });
//       });
//       showToast({
//         tone: "success",
//         title: "AI invoice ready",
//         description:
//           "Your first editable canvas is ready. Review anything highlighted, then finalize.",
//       });
//     } catch (err) {
//       const message =
//         err instanceof Error
//           ? err.message
//           : "Could not create the AI invoice draft.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "AI draft failed",
//         description: message,
//       });
//     } finally {
//       setLoading(null);
//     }
//   }

//   async function generateDesigns() {
//     if (loading) return;
//     const remixSeed = Date.now();
//     setLoading("ai");
//     setError(null);
//     setAiTab("variants");
//     setOrchestraPasses(buildPasses("layouts"));
//     try {
//       const response = await fetch(`${API_BASE}/invoices/canvas-drafts`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...invoice,
//           amount: toMoney(invoice.amount),
//           palette: invoice.style.palette,
//           selectedTemplateId: invoice.style.templateId,
//           styleDirection: invoice.style.tone,
//           variantCount,
//           remixSeed,
//           explorationMode: "premium-layout-remix",
//           explorationGoal:
//             "Return materially different premium invoice directions with new hierarchy, block placement, spacing, and composition on every refresh.",
//         }),
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not generate canvas designs."
//         );
//       }
//       const options = Array.isArray(json?.data?.options)
//         ? json.data.options
//         : [];
//       const nextVariants = synthesizeVariantPool(
//         options,
//         invoice,
//         variantCount,
//         remixSeed
//       );
//       setDrafts(nextVariants);
//       setScoredVariants(nextVariants);
//       setOrchestraPasses(buildPasses("rank"));
//       if (nextVariants[0]) {
//         applyDraft(nextVariants[0], nextVariants[0].id);
//       }
//       showToast({
//         tone: "success",
//         title: `${nextVariants.length} AI variants ready`,
//         description:
//           "Compare the strongest looks, then apply the one you want.",
//       });
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Could not generate designs.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Design generation failed",
//         description: message,
//       });
//     } finally {
//       setLoading(null);
//     }
//   }

//   async function finalizeCanvas() {
//     if (loading) return;
//     let navigating = false;
//     setLoading("finalize");
//     setError(null);
//     try {
//       const formData = new FormData();
//       formData.append(
//         "invoice",
//         JSON.stringify({
//           ...invoice,
//           amount: toMoney(invoice.amount),
//           lineItems: invoice.lineItems.map((item) => ({
//             ...item,
//             quantity: toMoney(item.quantity),
//             unitPrice: toMoney(item.unitPrice),
//             amount: toMoney(item.amount),
//           })),
//           selectedTemplateId: invoice.style.templateId,
//           style: invoice.style,
//           palette: invoice.style.palette,
//           canvasBlocks: sanitizeCanvasBlocksForFinalize(blocks, invoice),
//           logoDataUrl,
//           attachmentNames: attachments.map((file) => file.name),
//         })
//       );
//       attachments.forEach((file) => formData.append("attachments", file));

//       const response = await fetch(`${API_BASE}/invoices/finalize-canvas`, {
//         method: "POST",
//         body: formData,
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not finalize canvas invoice."
//         );
//       }
//       showToast({
//         tone: "success",
//         title: "Canvas invoice finalized",
//         description: "Sealed PDF created with footer on every page.",
//       });
//       navigating = true;
//       router.push(`/invoices/${json.data.id}`);
//       router.refresh();
//     } catch (err) {
//       const message =
//         err instanceof Error ? err.message : "Could not finalize invoice.";
//       setError(message);
//       showToast({
//         tone: "error",
//         title: "Finalize failed",
//         description: message,
//       });
//     } finally {
//       if (!navigating) {
//         setLoading(null);
//       }
//     }
//   }

//   function onBlockMouseDown(
//     event: ReactMouseEvent<HTMLButtonElement>,
//     id: string
//   ) {
//     event.preventDefault();
//     event.stopPropagation();
//     dragRef.current = { id, x: event.clientX, y: event.clientY };
//     setSelectedBlockId(id);
//   }

//   const overlayTitle =
//     loading === "ai-draft"
//       ? "Building your invoice with AI"
//       : loading === "ai"
//       ? "Generating premium layouts"
//       : loading === "finalize"
//       ? "Processing sealed PDF"
//       : "";
//   const overlayCopy =
//     loading === "ai-draft"
//       ? "Reading your messy notes, extracting the billing details, and placing everything onto one editable canvas."
//       : loading === "ai"
//       ? "Building four premium design systems from your data and palette."
//       : loading === "finalize"
//       ? "Please wait while we render your invoice, append attachments, and open the next page automatically."
//       : "";

//   return (
//     <>
//       {aiModalOpen ? (
//         <div
//           className="ai-modal-overlay"
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="ai-modal-title"
//         >
//           <div className="ai-modal-card">
//             <div className="ai-modal-head">
//               <div className="page-stack" style={{ gap: 6 }}>
//                 <span className="mini-chip is-accent">V1</span>
//                 <h3 id="ai-modal-title" style={{ margin: 0 }}>
//                   Generate invoice with AI
//                 </h3>
//                 <p className="muted" style={{ margin: 0 }}>
//                   Describe the job, paste messy notes, or drop in copied email
//                   text. AI will extract the core invoice fields and load one
//                   editable canvas.
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 className="btn btn-secondary ai-modal-close"
//                 onClick={() => setAiModalOpen(false)}
//               >
//                 Close
//               </button>
//             </div>

//             <label className="field-group">
//               <span className="field-label">Prompt or messy notes</span>
//               <textarea
//                 className="input-shell ai-modal-textarea"
//                 value={aiPrompt}
//                 onChange={(event) => setAiPrompt(event.target.value)}
//                 onKeyDown={handleAiPromptKeyDown}
//                 placeholder="Example: Invoice Acme Corp for a landing page redesign, 3 weeks of work, $4,500 USD, due next Friday, add 18% GST, mention payment by bank transfer."
//                 maxLength={4000}
//                 autoFocus
//               />
//             </label>

//             <div className="ai-modal-tips">
//               <span className="mini-chip">Paste WhatsApp or email text</span>
//               <span className="mini-chip">
//                 Mention VAT / GST / tax if known
//               </span>
//               <span className="mini-chip">Ctrl/Cmd + Enter to generate</span>
//             </div>

//             <div className="ai-modal-actions">
//               <button
//                 type="button"
//                 className="btn btn-secondary"
//                 onClick={() => setAiModalOpen(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 className="btn btn-primary"
//                 onClick={() => generateAiCanvasFromPrompt(aiPrompt)}
//                 disabled={normalizeAiPrompt(aiPrompt).length < 12}
//               >
//                 Generate canvas
//               </button>
//             </div>
//           </div>
//         </div>
//       ) : null}
//       <datalist id="invoice-currency-list">
//         {CURRENCY_OPTIONS.map((currencyCode) => (
//           <option key={currencyCode} value={currencyCode} />
//         ))}
//       </datalist>
//       {loading ? (
//         <div className="submit-overlay" aria-live="polite" aria-busy="true">
//           <div className="submit-overlay-card">
//             <div className="submit-overlay-inner">
//               <Spinner size="xl" tone="brand" />
//               <h3>{overlayTitle}</h3>
//               <p>{overlayCopy}</p>
//             </div>
//           </div>
//         </div>
//       ) : null}
//       <div className="invoice-builder-shell">
//         <input
//           ref={logoInputRef}
//           type="file"
//           accept="image/png,image/jpeg,image/webp"
//           onChange={onLogoChange}
//           style={{ display: "none" }}
//         />
//         {error ? <div className="error-banner">{error}</div> : null}

//         <aside className="builder-side-rail builder-side-rail-left">
//           <section className="builder-floating-card tools-rail-card">
//             <div className="tools-rail-head">
//               <h3>Design Tools</h3>
//               <span>Editorial mode</span>
//             </div>

//             <div className="tools-rail-nav">
//               <button type="button" className="tools-rail-item">
//                 <span className="tools-rail-icon">✦</span>
//                 <span>Palette</span>
//               </button>

//               <label className="tools-rail-item tools-rail-upload">
//                 <input
//                   type="file"
//                   accept="application/pdf,.pdf"
//                   multiple
//                   onChange={onAttachmentChange}
//                   style={{ display: "none" }}
//                 />
//                 <span className="tools-rail-icon">⎙</span>
//                 <span>
//                   {attachments.length
//                     ? `Attachments (${attachments.length})`
//                     : "Attachments"}
//                 </span>
//               </label>

//               <button
//                 type="button"
//                 className="tools-rail-item is-active"
//                 onClick={openAiModal}
//               >
//                 <span className="tools-rail-icon">✦</span>
//                 <span>AI Assistant</span>
//               </button>

//               <button type="button" className="tools-rail-item">
//                 <span className="tools-rail-icon">⚙</span>
//                 <span>Settings</span>
//               </button>
//             </div>

//             <div className="tools-rail-section">
//               <span className="tools-section-kicker">Quick palette</span>
//               <div className="tools-palette-grid">
//                 {(
//                   Object.keys(invoice.style.palette) as Array<
//                     keyof StylePalette
//                   >
//                 ).map((key) => (
//                   <label key={key} className="tools-palette-swatch" title={key}>
//                     <input
//                       className="tools-palette-input"
//                       type="color"
//                       value={invoice.style.palette[key]}
//                       onChange={(event) =>
//                         updatePalette(key, event.target.value)
//                       }
//                       aria-label={`Change ${key} color`}
//                     />
//                     <span
//                       className="tools-palette-dot"
//                       style={{ background: invoice.style.palette[key] }}
//                     />
//                     <span className="tools-palette-name">{key}</span>
//                   </label>
//                 ))}
//               </div>
//             </div>

//             <div className="tools-rail-section tools-rail-footer">
//               <span className="tools-section-kicker">Attachments</span>
//               {logoName ? (
//                 <span className="mini-chip">Logo: {logoName}</span>
//               ) : null}
//               {attachments.length ? (
//                 <div className="attachment-list">
//                   {attachments.map((file) => (
//                     <span
//                       key={`${file.name}-${file.size}`}
//                       className="mini-chip"
//                     >
//                       {file.name}
//                     </span>
//                   ))}
//                 </div>
//               ) : (
//                 <span className="mini-chip">Optional extra PDFs</span>
//               )}
//             </div>
//           </section>

//           <section className="builder-floating-card pro-upgrade-card">
//             <span className="pro-kicker">Pro features active</span>
//             <button type="button" className="pro-upgrade-button">
//               Upgrade to Pro
//             </button>
//           </section>
//         </aside>

//         <main className="builder-center-column">
//           <section className="builder-floating-card top-ai-card">
//             <div className="top-ai-card-head">
//               <div className="page-stack" style={{ gap: 10 }}>
//                 <div className="top-ai-title-row">
//                   <span className="top-ai-sparkle">✦</span>
//                   <strong>AI Design Orchestra</strong>
//                 </div>
//                 <div className="ai-orchestra-head-meta">
//                   {/* <span className="mini-chip is-accent">Gemini 2.5 Flash</span> */}
//                   {/* <span className="mini-chip">5-pass workflow</span> */}
//                   {/* <span className="mini-chip">
//                     Same invoice facts, many looks
//                   </span> */}
//                 </div>
//               </div>
//               <button
//                 type="button"
//                 className="history-chip"
//                 onClick={() => setAiTab("optimize")}
//               >
//                 {optimizationHistory.length
//                   ? `Optimized ${optimizationHistory.length}×`
//                   : "Optimization ready"}
//               </button>
//             </div>

//             <div className="ai-tab-row">
//               {AI_TAB_OPTIONS.map((tab) => (
//                 <button
//                   key={tab.id}
//                   type="button"
//                   className={`ai-tab-button${
//                     aiTab === tab.id ? " is-active" : ""
//                   }`}
//                   onClick={() => setAiTab(tab.id)}
//                 >
//                   <strong>{tab.label}</strong>
//                   <span>{tab.kicker}</span>
//                 </button>
//               ))}
//             </div>

//             <div className="ai-pass-row">
//               {orchestraPasses.map((pass) => (
//                 <div
//                   key={pass.id}
//                   className={`ai-pass-card is-${pass.status}`}
//                   title={pass.detail}
//                 >
//                   <strong>{pass.title}</strong>
//                   <span>{pass.detail}</span>
//                 </div>
//               ))}
//             </div>

//             {aiTab === "create" ? (
//               <>
//                 <div className="ai-orchestra-meta-row">
//                   <div className="ai-variant-count-row">
//                     {[4, 8, 12].map((count) => (
//                       <button
//                         key={count}
//                         type="button"
//                         className={`variant-count-chip${
//                           variantCount === count ? " is-active" : ""
//                         }`}
//                         onClick={() => setVariantCount(count as 4 | 8 | 12)}
//                       >
//                         {count} looks
//                       </button>
//                     ))}
//                   </div>
//                   <span className="mini-chip">
//                     Recommended family · {brandInference.recommendedFamily}
//                   </span>
//                 </div>

//                 <div className="top-ai-input-row ai-orchestra-input-row">
//                   <textarea
//                     className="input-shell ai-brief-textarea top-ai-textarea"
//                     value={aiPrompt}
//                     onChange={(event) => setAiPrompt(event.target.value)}
//                     onKeyDown={handleAiPromptKeyDown}
//                     placeholder="Describe the job, tone, references, and how ambitious the design should feel. Example: Create an enterprise-safe but futuristic invoice for a London AI consultancy, keep the same billing facts, generate premium variants, and prioritize payment confidence."
//                     maxLength={4000}
//                   />
//                   <div className="ai-create-actions">
//                     <button
//                       type="button"
//                       className="top-ai-generate"
//                       onClick={() => generateAiCanvasFromPrompt(aiPrompt)}
//                     >
//                       <span className="button-icon-text">✦</span>
//                       <span>Run first generation</span>
//                     </button>
//                     <button
//                       type="button"
//                       className="top-ai-secondary"
//                       onClick={generateDesigns}
//                     >
//                       <span className="button-icon-text">◌</span>
//                       <span>Generate {variantCount} looks</span>
//                     </button>
//                   </div>
//                 </div>

//                 <div className="top-ai-chip-row">
//                   <button
//                     type="button"
//                     className="suggestion-chip"
//                     onClick={() =>
//                       setAiPrompt(
//                         "Create a premium editorial invoice with stronger typography, trust cues, and memorable layout variety."
//                       )
//                     }
//                   >
//                     Premium editorial
//                   </button>
//                   <button
//                     type="button"
//                     className="suggestion-chip"
//                     onClick={() =>
//                       setAiPrompt(
//                         "Generate futuristic but professional invoice variants with a fintech feel and very strong payment confidence."
//                       )
//                     }
//                   >
//                     Futuristic fintech
//                   </button>
//                   <button
//                     type="button"
//                     className="suggestion-chip"
//                     onClick={() =>
//                       setAiPrompt(
//                         "Keep the exact same facts, but create safe enterprise and bold premium variants for comparison."
//                       )
//                     }
//                   >
//                     Enterprise vs bold
//                   </button>
//                   <button
//                     type="button"
//                     className="suggestion-chip is-muted"
//                     onClick={clearAiDraft}
//                   >
//                     Clear prompt
//                   </button>
//                 </div>

//                 <div className="ai-fact-strip">
//                   {factHighlights.map((item) => (
//                     <span key={item} className="fact-pill">
//                       {item}
//                     </span>
//                   ))}
//                 </div>
//               </>
//             ) : null}

//             {aiTab === "variants" ? (
//               <>
//                 <div className="ai-orchestra-meta-row">
//                   <div className="page-stack" style={{ gap: 4 }}>
//                     <strong className="ai-section-title">
//                       Ranked variants
//                     </strong>
//                     <span className="muted" style={{ fontSize: "0.74rem" }}>
//                       Same invoice facts, reordered into safer, bolder, more
//                       premium, and more futuristic layout systems.
//                     </span>
//                   </div>
//                   <button
//                     type="button"
//                     className="top-ai-secondary"
//                     onClick={generateDesigns}
//                   >
//                     Refresh {variantCount} looks
//                   </button>
//                 </div>

//                 <div className="ai-variant-grid">
//                   {scoredVariants.length ? (
//                     scoredVariants.map((variant) => {
//                       const previewInvoice = {
//                         ...invoice,
//                         style: variant.style,
//                         accentLabel: variant.style.accentLabel,
//                       };
//                       return (
//                         <article
//                           key={variant.id}
//                           className={`ai-variant-card${
//                             selectedVariantId === variant.id ? " is-active" : ""
//                           }`}
//                         >
//                           <div className="ai-variant-card-head">
//                             <div className="page-stack" style={{ gap: 4 }}>
//                               <span className="mini-chip">{variant.badge}</span>
//                               <strong>{variant.family}</strong>
//                               <span
//                                 className="muted"
//                                 style={{ fontSize: "0.72rem" }}
//                               >
//                                 {variant.rationale}
//                               </span>
//                             </div>
//                             <button
//                               type="button"
//                               className="variant-apply-button"
//                               onClick={() => applyVariant(variant)}
//                             >
//                               Apply
//                             </button>
//                           </div>

//                           <MiniPreview
//                             invoice={previewInvoice}
//                             blocks={variant.blocks}
//                             logoDataUrl={logoDataUrl}
//                           />

//                           <div className="variant-score-grid">
//                             {(
//                               Object.entries(variant.score) as Array<
//                                 [keyof VariantScoreCard, number]
//                               >
//                             ).map(([key, value]) => (
//                               <div key={key} className="variant-score-pill">
//                                 <span>{key}</span>
//                                 <strong>{value}</strong>
//                               </div>
//                             ))}
//                           </div>
//                         </article>
//                       );
//                     })
//                   ) : (
//                     <div className="ai-empty-inline-state">
//                       Run the orchestra once, then this tab will rank and
//                       compare your strongest design directions.
//                     </div>
//                   )}
//                 </div>
//               </>
//             ) : null}

//             {aiTab === "optimize" ? (
//               <>
//                 <div className="ai-orchestra-meta-row">
//                   <div className="page-stack" style={{ gap: 4 }}>
//                     <strong className="ai-section-title">
//                       Optimization actions
//                     </strong>
//                     <span className="muted" style={{ fontSize: "0.74rem" }}>
//                       Tier 2 is capped to 7 focused refinement actions, exactly
//                       as requested.
//                     </span>
//                   </div>
//                   <span className="mini-chip">
//                     Current tone · {brandInference.tone}
//                   </span>
//                 </div>

//                 <div className="ai-optimize-grid">
//                   {OPTIMIZE_ACTIONS.map((action) => (
//                     <button
//                       key={action}
//                       type="button"
//                       className="optimize-action-button"
//                       onClick={() => optimizeCurrentVariant(action)}
//                     >
//                       {action}
//                     </button>
//                   ))}
//                 </div>

//                 {selectedOrchestraVariant ? (
//                   <div className="ai-optimize-summary">
//                     <strong>
//                       Active look · {selectedOrchestraVariant.family}
//                     </strong>
//                     <span>{selectedOrchestraVariant.rationale}</span>
//                   </div>
//                 ) : null}

//                 {optimizationHistory.length ? (
//                   <div className="top-ai-chip-row">
//                     {optimizationHistory.map((item) => (
//                       <span key={item} className="suggestion-chip is-muted">
//                         {item}
//                       </span>
//                     ))}
//                   </div>
//                 ) : null}
//               </>
//             ) : null}
//           </section>

//           <section
//             className="builder-floating-card canvas-stage-card"
//             ref={canvasStageRef}
//           >
//             <div className="canvas-stage-inner">
//               <div className="canvas-stage-watermark" />
//               <div
//                 ref={canvasViewportRef}
//                 className="invoice-canvas-scroll canvas-primary-scroll stitched-canvas-scroll"
//               >
//                 <div
//                   className="invoice-canvas-stage"
//                   style={{ height: `${PAGE_HEIGHT * canvasScale}px` }}
//                 >
//                   <div
//                     className="invoice-canvas-stage-scale"
//                     style={{ transform: `scale(${canvasScale})` }}
//                   >
//                     <InvoiceCanvasPage
//                       invoice={invoice}
//                       blocks={blocks}
//                       logoDataUrl={logoDataUrl}
//                       selectedBlockId={selectedBlockId}
//                       onSelectBlock={setSelectedBlockId}
//                       onBlockMouseDown={onBlockMouseDown}
//                       onUpdateInvoice={updateInvoice}
//                       onUpdateLineItem={updateLineItem}
//                       onAddLineItem={addLineItem}
//                       onDeleteBlock={deleteBlock}
//                       onLogoPick={openLogoPicker}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </section>

//           <div className="builder-bottom-actions">
//             <button
//               type="button"
//               className="tray-btn tray-btn-ghost"
//               onClick={() => setBlocks(defaultBlocks(invoice.style.templateId))}
//             >
//               <span className="button-icon-text">↺</span>
//               <span>Reset Layout</span>
//             </button>
//             <div className="action-tray-divider" />
//             <button
//               type="button"
//               className="tray-btn tray-btn-primary"
//               onClick={finalizeCanvas}
//             >
//               <span className="button-icon-text">▣</span>
//               <span>Finalize Canvas PDF</span>
//             </button>
//           </div>
//         </main>

//         <aside className="builder-side-rail builder-side-rail-right">
//           <section className="builder-floating-card health-rail-card">
//             <div className="health-rail-head">
//               <h3>Document Health</h3>
//             </div>

//             <div className="health-stack">
//               <div className="health-item is-good">
//                 <div className="health-icon">✓</div>
//                 <div>
//                   <strong>Fact Lock Active</strong>
//                   <span>
//                     All variants preserve the same invoice information while
//                     only presentation changes.
//                   </span>
//                 </div>
//               </div>

//               <div className="health-item is-good">
//                 <div className="health-icon">✦</div>
//                 <div>
//                   <strong>{brandInference.recommendedFamily}</strong>
//                   <span>{brandInference.impression}</span>
//                 </div>
//               </div>

//               <div className="health-item is-warn">
//                 <div className="health-icon">!</div>
//                 <div>
//                   <strong>Attachments Ready</strong>
//                   <span>
//                     {attachments.length
//                       ? `${attachments.length} PDF${
//                           attachments.length > 1 ? "s" : ""
//                         } attached`
//                       : "Optional supporting PDFs can still be added"}
//                   </span>
//                 </div>
//               </div>

//               <div className="health-item is-good">
//                 <div className="health-icon">◎</div>
//                 <div>
//                   <strong>Orchestra progress</strong>
//                   <span>
//                     {
//                       orchestraPasses.filter((pass) => pass.status === "done")
//                         .length
//                     }{" "}
//                     / {orchestraPasses.length} passes completed
//                   </span>
//                 </div>
//               </div>

//               {selectedOrchestraVariant ? (
//                 <div className="health-score-card">
//                   <strong>{selectedOrchestraVariant.family}</strong>
//                   <div className="health-score-grid">
//                     {(
//                       Object.entries(selectedOrchestraVariant.score) as Array<
//                         [keyof VariantScoreCard, number]
//                       >
//                     ).map(([key, value]) => (
//                       <div key={key} className="health-score-pill">
//                         <span>{key}</span>
//                         <strong>{value}</strong>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ) : null}

//               <div className="health-suggestion-card">
//                 <strong>AI Suggestion</strong>
//                 <p>
//                   {brandInference.notes[0]}. Best next move: compare{" "}
//                   {variantCount} ranked looks, then use Optimize for the final
//                   polish.
//                 </p>
//                 <button
//                   type="button"
//                   className="health-cta-button"
//                   onClick={() => setAiTab("optimize")}
//                 >
//                   Open Optimize Tab
//                 </button>
//               </div>

//               <div className="collaboration-card">
//                 <span className="tools-section-kicker">Live collaboration</span>
//                 <div className="collaboration-row">
//                   <span className="collab-avatar">A</span>
//                   <span className="collab-avatar">M</span>
//                   <span className="collab-avatar">J</span>
//                   <span className="collab-plus">+3</span>
//                 </div>
//               </div>
//             </div>
//           </section>
//         </aside>
//       </div>
//       <style jsx global>{`
//         .ai-modal-overlay {
//           position: fixed;
//           inset: 0;
//           z-index: 60;
//           display: grid;
//           place-items: center;
//           padding: 24px;
//           background: rgba(15, 23, 42, 0.44);
//           backdrop-filter: blur(10px);
//         }
//         .ai-modal-card {
//           width: min(720px, 100%);
//           border-radius: 30px;
//           padding: 24px;
//           display: grid;
//           gap: 18px;
//           border: 1px solid rgba(101, 79, 230, 0.14);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.98),
//             rgba(247, 245, 255, 0.96)
//           );
//           box-shadow: 0 30px 80px rgba(15, 23, 42, 0.24);
//         }
//         .ai-modal-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           gap: 16px;
//         }
//         .ai-modal-close {
//           white-space: nowrap;
//         }
//         .ai-modal-textarea,
//         .ai-brief-textarea {
//           min-height: 140px;
//           resize: vertical;
//           line-height: 1.55;
//         }
//         .ai-brief-card {
//           position: relative;
//           overflow: hidden;
//         }
//         .ai-brief-card::after {
//           content: "";
//           position: absolute;
//           inset: auto -30px -30px auto;
//           width: 180px;
//           height: 180px;
//           border-radius: 999px;
//           background: radial-gradient(
//             circle,
//             rgba(91, 140, 255, 0.18),
//             rgba(91, 140, 255, 0)
//           );
//           pointer-events: none;
//         }
//         .ai-empty-state {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 16px;
//           flex-wrap: wrap;
//         }
//         .ai-modal-tips {
//           display: flex;
//           gap: 8px;
//           flex-wrap: wrap;
//         }
//         .ai-modal-actions {
//           display: flex;
//           justify-content: flex-end;
//           gap: 10px;
//           flex-wrap: wrap;
//         }
//         .ai-missing-chip {
//           background: rgba(245, 158, 11, 0.12);
//           border-color: rgba(245, 158, 11, 0.24);
//           color: #9a6700;
//         }
//         .canvas-logo-placeholder {
//           width: 100%;
//           height: 100%;
//           display: grid;
//           place-items: center;
//           gap: 6px;
//           text-align: center;
//           background: repeating-linear-gradient(
//             135deg,
//             rgba(255, 255, 255, 0.94),
//             rgba(255, 255, 255, 0.94) 10px,
//             rgba(241, 245, 249, 0.94) 10px,
//             rgba(241, 245, 249, 0.94) 20px
//           );
//           color: #0f172a;
//         }
//         .canvas-logo-placeholder-badge {
//           width: 44px;
//           height: 44px;
//           border-radius: 999px;
//           display: grid;
//           place-items: center;
//           background: rgba(15, 23, 42, 0.9);
//           color: #fff;
//           font-weight: 900;
//         }
//         .canvas-logo-placeholder-copy {
//           font-size: 0.76rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//           opacity: 0.72;
//         }
//         .invoice-builder-shell {
//           min-height: 100vh;
//           display: grid;
//           grid-template-columns: 156px minmax(0, 720px) 156px;
//           justify-content: center;
//           gap: 16px;
//           align-items: start;
//           padding: 18px 12px 28px;
//           background: radial-gradient(
//               circle at top,
//               rgba(255, 255, 255, 0.14),
//               transparent 34%
//             ),
//             linear-gradient(180deg, #4f1fd7 0%, #6f1df2 48%, #7e25ff 100%);
//         }
//         .builder-side-rail {
//           position: sticky;
//           top: 18px;
//         }
//         .builder-center-column {
//           display: grid;
//           gap: 14px;
//           justify-items: center;
//         }
//         .builder-floating-card {
//           width: 100%;
//           border-radius: 18px;
//           border: 1px solid rgba(255, 255, 255, 0.2);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.9),
//             rgba(236, 229, 255, 0.86)
//           );
//           box-shadow: 0 18px 44px rgba(44, 12, 122, 0.28),
//             inset 0 1px 0 rgba(255, 255, 255, 0.42);
//           backdrop-filter: blur(14px);
//         }
//         .tools-rail-card,
//         .health-rail-card {
//           padding: 14px;
//           gap: 14px;
//           display: grid;
//         }
//         .tools-rail-head,
//         .health-rail-head {
//           display: grid;
//           gap: 2px;
//         }
//         .tools-rail-head h3,
//         .health-rail-head h3 {
//           margin: 0;
//           font-size: 0.95rem;
//           color: #24124f;
//           letter-spacing: -0.03em;
//         }
//         .tools-rail-head span {
//           font-size: 0.66rem;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//           color: rgba(36, 18, 79, 0.62);
//           font-weight: 700;
//         }
//         .tools-rail-nav {
//           display: grid;
//           gap: 8px;
//         }
//         .tools-rail-item {
//           width: 100%;
//           border: 0;
//           background: transparent;
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           padding: 10px 12px;
//           border-radius: 12px;
//           color: #43346b;
//           font-weight: 700;
//           cursor: pointer;
//           text-align: left;
//         }
//         .tools-rail-item.is-active {
//           background: rgba(255, 255, 255, 0.88);
//           color: #5130d6;
//           box-shadow: 0 10px 18px rgba(81, 48, 214, 0.14);
//         }
//         .tools-rail-dot {
//           width: 8px;
//           height: 8px;
//           border-radius: 999px;
//           background: currentColor;
//           opacity: 0.72;
//         }
//         .tools-rail-footer {
//           display: grid;
//           gap: 8px;
//           margin-top: 4px;
//         }
//         .top-ai-card {
//           padding: 12px 14px;
//           display: grid;
//           gap: 10px;
//         }
//         .top-ai-card-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 10px;
//           color: #2a1959;
//           font-size: 0.78rem;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//         }
//         .top-ai-input-row {
//           display: grid;
//           grid-template-columns: minmax(0, 1fr) auto;
//           gap: 10px;
//           align-items: start;
//         }
//         .ai-orchestra-input-row {
//           grid-template-columns: minmax(0, 1fr) 220px;
//         }
//         .ai-create-actions {
//           display: grid;
//           gap: 10px;
//         }
//         .top-ai-secondary {
//           border: 1px solid rgba(255, 255, 255, 0.34);
//           border-radius: 12px;
//           padding: 0 16px;
//           min-height: 48px;
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           gap: 8px;
//           background: rgba(255, 255, 255, 0.58);
//           color: #1e143f;
//           font-weight: 800;
//           cursor: pointer;
//         }
//         .top-ai-textarea {
//           min-height: 56px;
//           max-height: 84px;
//           resize: none;
//           border-radius: 14px;
//           background: rgba(255, 255, 255, 0.82);
//         }
//         .top-ai-generate {
//           align-self: stretch;
//           min-width: 148px;
//           //   min-height: 50px;
//         }
//         .top-ai-chip-row {
//           display: flex;
//           gap: 8px;
//           flex-wrap: wrap;
//         }
//         .ai-fact-strip {
//           display: flex;
//           gap: 8px;
//           flex-wrap: wrap;
//         }
//         .fact-pill {
//           padding: 8px 12px;
//           border-radius: 999px;
//           background: rgba(255, 255, 255, 0.54);
//           color: #4e4670;
//           font-size: 0.68rem;
//           font-weight: 700;
//         }
//         .ai-section-title {
//           color: #26194c;
//           font-size: 0.84rem;
//         }
//         .ai-variant-grid {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 14px;
//         }
//         .ai-variant-card {
//           border-radius: 22px;
//           padding: 14px;
//           display: grid;
//           gap: 12px;
//           background: rgba(255, 255, 255, 0.58);
//           border: 1px solid rgba(255, 255, 255, 0.3);
//           box-shadow: 0 16px 28px rgba(65, 30, 140, 0.08);
//         }
//         .ai-variant-card.is-active {
//           border-color: rgba(0, 63, 171, 0.18);
//           box-shadow: 0 20px 36px rgba(0, 63, 171, 0.14);
//         }
//         .ai-variant-card-head {
//           display: flex;
//           justify-content: space-between;
//           gap: 12px;
//           align-items: flex-start;
//         }
//         .variant-apply-button {
//           border: 0;
//           border-radius: 12px;
//           padding: 10px 12px;
//           background: linear-gradient(135deg, #003fab 0%, #0455dd 100%);
//           color: #fff;
//           font-size: 0.72rem;
//           font-weight: 800;
//           cursor: pointer;
//           white-space: nowrap;
//         }
//         .variant-score-grid {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 8px;
//         }
//         .variant-score-pill,
//         .health-score-pill {
//           border-radius: 12px;
//           padding: 9px 10px;
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 8px;
//           background: rgba(255, 255, 255, 0.6);
//           color: #4e4670;
//           font-size: 0.66rem;
//         }
//         .variant-score-pill strong,
//         .health-score-pill strong {
//           margin: 0;
//           font-size: 0.72rem;
//           color: #26194c;
//         }
//         .ai-optimize-grid {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 10px;
//         }
//         .optimize-action-button {
//           border: 1px solid rgba(255, 255, 255, 0.34);
//           border-radius: 16px;
//           padding: 13px 14px;
//           background: rgba(255, 255, 255, 0.5);
//           color: #26194c;
//           font-size: 0.76rem;
//           font-weight: 800;
//           text-align: left;
//           cursor: pointer;
//         }
//         .ai-optimize-summary,
//         .ai-empty-inline-state,
//         .health-score-card {
//           border-radius: 16px;
//           padding: 14px;
//           display: grid;
//           gap: 8px;
//           background: rgba(255, 255, 255, 0.46);
//         }
//         .ai-optimize-summary strong,
//         .health-score-card strong {
//           color: #26194c;
//           font-size: 0.78rem;
//           margin: 0;
//         }
//         .ai-optimize-summary span,
//         .ai-empty-inline-state {
//           color: #645c81;
//           font-size: 0.7rem;
//           line-height: 1.5;
//         }
//         .health-score-grid {
//           display: grid;
//           gap: 8px;
//         }
//         .action-chip {
//           cursor: pointer;
//         }
//         .canvas-stage-card {
//           padding: 14px;
//         }
//         .canvas-stage-inner {
//           display: grid;
//           grid-template-columns: minmax(0, 1fr) 64px;
//           gap: 12px;
//           align-items: start;
//         }
//         .canvas-inline-palette {
//           display: flex;
//           justify-content: center;
//         }
//         .palette-rail {
//           display: grid;
//           gap: 10px;
//           padding: 8px 6px;
//           border-radius: 18px;
//           background: rgba(255, 255, 255, 0.72);
//           border: 1px solid rgba(89, 61, 196, 0.12);
//         }
//         .palette-rail-swatch {
//           position: relative;
//           width: 42px;
//           display: grid;
//           justify-items: center;
//           gap: 5px;
//           padding: 8px 4px;
//           border-radius: 14px;
//           background: rgba(255, 255, 255, 0.86);
//           border: 1px solid rgba(15, 23, 42, 0.06);
//           cursor: pointer;
//         }
//         .palette-swatch-input {
//           position: absolute;
//           inset: 0;
//           opacity: 0;
//           cursor: pointer;
//         }
//         .palette-swatch-dot {
//           width: 22px;
//           height: 22px;
//           border-radius: 999px;
//           box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08),
//             0 10px 20px rgba(15, 23, 42, 0.12);
//         }
//         .palette-rail-label {
//           font-size: 0.5rem;
//           font-weight: 800;
//           letter-spacing: 0.08em;
//           color: #726790;
//         }
//         .builder-bottom-actions {
//           display: flex;
//           justify-content: center;
//           gap: 10px;
//           flex-wrap: wrap;
//           padding: 8px 12px 0;
//         }
//         .invoice-panel-card {
//           border-radius: 18px;
//           border: 1px solid rgba(255, 255, 255, 0.24);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.97),
//             rgba(246, 240, 255, 0.92)
//           );
//           box-shadow: 0 18px 44px rgba(44, 12, 122, 0.18);
//           padding: 18px;
//           display: grid;
//           gap: 14px;
//         }
//         .invoice-panel-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 8px;
//         }
//         .invoice-panel-head h2 {
//           margin: 0;
//           font-size: 0.9rem;
//           letter-spacing: -0.03em;
//         }
//         .attachment-list {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 8px;
//         }
//         .canvas-primary-scroll,
//         .stitched-canvas-scroll {
//           min-width: 0;
//         }
//         .invoice-canvas-scroll {
//           overflow: hidden;
//           padding: 16px;
//           border-radius: 26px;
//           border: 1px solid rgba(108, 77, 220, 0.12);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.98),
//             rgba(240, 236, 255, 0.9)
//           );
//           box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.46),
//             0 20px 46px rgba(47, 18, 130, 0.16);
//         }
//         .health-stack {
//           display: grid;
//           gap: 10px;
//         }
//         .health-item,
//         .health-suggestion-card {
//           border-radius: 14px;
//           padding: 12px;
//           display: grid;
//           gap: 6px;
//           background: rgba(255, 255, 255, 0.72);
//           border: 1px solid rgba(255, 255, 255, 0.34);
//         }
//         .health-item strong,
//         .health-suggestion-card strong {
//           color: #291854;
//           font-size: 0.8rem;
//         }
//         .health-item span,
//         .health-suggestion-card p {
//           margin: 0;
//           font-size: 0.68rem;
//           line-height: 1.45;
//           color: #6f6690;
//         }
//         .health-item.is-good {
//           box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.18);
//         }
//         .health-item.is-warn {
//           box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.18);
//         }
//         .health-suggestion-card {
//           background: linear-gradient(180deg, #6a4df1 0%, #5a39dd 100%);
//         }
//         .health-suggestion-card strong,
//         .health-suggestion-card p {
//           color: #fff;
//         }
//         .invoice-canvas-stage {
//           width: 100%;
//           display: flex;
//           justify-content: center;
//           align-items: flex-start;
//           overflow: hidden;
//         }
//         .invoice-canvas-stage-scale {
//           transform-origin: top center;
//           will-change: transform;
//         }
//         .invoice-canvas-page {
//           position: relative;
//           margin: 0 auto;
//           border-radius: 32px;
//           overflow: hidden;
//           box-shadow: 0 30px 70px rgba(66, 74, 130, 0.18);
//         }
//         .invoice-canvas-bg,
//         .invoice-canvas-line {
//           position: absolute;
//           inset: 0;
//           pointer-events: none;
//         }
//         .invoice-canvas-bg-luxury {
//           inset: 0 0 auto 0;
//           height: 250px;
//         }
//         .invoice-canvas-bg-creative {
//           inset: 0 0 auto 0;
//           height: 220px;
//         }
//         .invoice-canvas-bg-creative-accent {
//           inset: 0 0 auto auto;
//           width: 160px;
//           height: 220px;
//           opacity: 0.92;
//         }
//         .invoice-canvas-bg-corporate {
//           inset: 0 auto auto 0;
//           width: 132px;
//           height: 155px;
//         }
//         .invoice-canvas-line {
//           inset: 118px 40px auto 40px;
//           height: 1px;
//           border-top: 1px solid transparent;
//         }
//         .canvas-block {
//           position: absolute;
//           padding: 10px;
//           border: 1px solid rgba(15, 23, 42, 0.06);
//           backdrop-filter: blur(8px);
//           box-shadow: none !important;
//           transition: box-shadow 0.18s ease, border-color 0.18s ease;
//         }
//         .canvas-block:hover {
//           box-shadow: 0 10px 24px rgba(77, 88, 138, 0.08);
//         }
//         .canvas-drag-handle {
//           position: absolute;
//           top: 8px;
//           right: 38px;
//           z-index: 3;
//           width: 26px;
//           height: 26px;
//           border: 0;
//           border-radius: 999px;
//           background: rgba(15, 23, 42, 0.08);
//           color: inherit;
//           font-weight: 900;
//           opacity: 0.22;
//           transition: opacity 0.2s ease, transform 0.2s ease;
//         }
//         .canvas-delete-handle {
//           position: absolute;
//           top: 8px;
//           right: 8px;
//           z-index: 3;
//           width: 26px;
//           height: 26px;
//           border: 0;
//           border-radius: 999px;
//           background: rgba(239, 68, 68, 0.12);
//           color: #b91c1c;
//           font-size: 1rem;
//           font-weight: 900;
//           opacity: 0.22;
//           transition: opacity 0.2s ease, transform 0.2s ease;
//         }
//         .canvas-block:hover .canvas-drag-handle,
//         .canvas-block:hover .canvas-delete-handle,
//         .canvas-block.is-selected .canvas-drag-handle,
//         .canvas-block.is-selected .canvas-delete-handle {
//           opacity: 1;
//         }
//         .canvas-logo-inner {
//           width: 100%;
//           height: 100%;
//           display: grid;
//           place-items: center;
//           overflow: hidden;
//           border-radius: inherit;
//           font-size: 1.2rem;
//           font-weight: 900;
//           color: #fff;
//           background: rgba(15, 23, 42, 0.9);
//           border: 0;
//           padding: 0;
//         }
//         .canvas-logo-inner.is-uploadable {
//           cursor: pointer;
//         }
//         .canvas-logo-inner.is-uploadable:hover {
//           box-shadow: inset 0 0 0 2px rgba(22, 64, 214, 0.32);
//         }
//         .canvas-logo-image {
//           width: 100%;
//           height: 100%;
//           object-fit: contain;
//           background: #fff;
//         }
//         .canvas-inline-input,
//         .canvas-inline-textarea,
//         .canvas-inline-currency,
//         .canvas-inline-amount {
//           width: 100%;
//           border: 0;
//           outline: none;
//           background: transparent;
//           padding: 0;
//           color: inherit;
//           font: inherit;
//           font-size: 0.64rem;
//         }
//         .canvas-inline-input.is-readonly,
//         .canvas-inline-amount.is-readonly {
//           cursor: default;
//         }
//         .canvas-inline-input::placeholder,
//         .canvas-inline-textarea::placeholder {
//           color: inherit;
//           opacity: 0.45;
//         }
//         .canvas-inline-title {
//           font-size: 0.72rem;
//           font-weight: 700;
//           letter-spacing: 0.02em;
//           text-transform: uppercase;
//         }
//         .canvas-inline-number {
//           font-size: 1.2rem;
//           font-weight: 800;
//           letter-spacing: -0.04em;
//         }
//         .canvas-inline-textarea {
//           resize: none;
//           min-height: 34px;
//           line-height: 1.35;
//         }
//         .canvas-inline-notes {
//           min-height: 48px;
//         }
//         .canvas-amount-shell,
//         .canvas-multiline-card,
//         .canvas-meta-grid,
//         .canvas-notes-shell {
//           display: grid;
//           gap: 8px;
//           height: 100%;
//         }
//         .canvas-kicker {
//           font-size: 0.52rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.08em;
//           opacity: 0.74;
//         }
//         .canvas-amount-row {
//           display: grid;
//           grid-template-columns: 46px 1fr;
//           gap: 6px;
//           align-items: center;
//           margin-top: 2px;
//         }
//         .canvas-inline-currency {
//           font-size: 0.62rem;
//           font-weight: 800;
//         }
//         .canvas-inline-amount {
//           font-size: 1.38rem;
//           font-weight: 800;
//           letter-spacing: -0.04em;
//         }
//         .canvas-subtle-copy {
//           margin-top: auto;
//           font-size: 0.54rem;
//           opacity: 0.75;
//         }
//         .canvas-dual-row {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 8px;
//         }
//         .canvas-meta-grid {
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           align-content: start;
//         }
//         .canvas-table-shell {
//           display: grid;
//           grid-template-rows: auto 1fr auto auto;
//           gap: 8px;
//           height: 100%;
//         }
//         .canvas-table-head,
//         .canvas-table-row {
//           display: grid;
//           grid-template-columns: 1.78fr 0.42fr 0.56fr 0.56fr 0.78fr;
//           gap: 6px;
//           align-items: center;
//         }
//         .canvas-table-head {
//           padding: 8px 10px;
//           border-radius: 14px;
//           font-size: 0.56rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.04em;
//         }
//         .canvas-table-body {
//           display: grid;
//           gap: 8px;
//           overflow: auto;
//           align-content: start;
//         }
//         .canvas-table-row {
//           padding: 7px 8px;
//           border-radius: 12px;
//           background: rgba(255, 255, 255, 0.72);
//           border: 1px solid rgba(15, 23, 42, 0.06);
//         }
//         .canvas-table-add {
//           justify-self: start;
//           border: 0;
//           border-radius: 999px;
//           padding: 7px 11px;
//           background: rgba(15, 23, 42, 0.07);
//           font-size: 0.62rem;
//           font-weight: 800;
//           color: inherit;
//         }
//         .canvas-table-currency {
//           text-transform: uppercase;
//           letter-spacing: 0.04em;
//         }
//         .canvas-table-summary {
//           display: grid;
//           gap: 6px;
//           margin-top: auto;
//           margin-left: auto;
//           width: min(320px, 100%);
//           padding-top: 10px;
//           border-top: 1px solid rgba(15, 23, 42, 0.1);
//         }
//         .canvas-table-summary > div {
//           width: 100%;
//           display: grid;
//           grid-template-columns: minmax(0, 1fr) auto;
//           gap: 16px;
//           align-items: center;
//           font-size: 0.62rem;
//           line-height: 1.3;
//         }
//         .canvas-table-summary > div > span {
//           text-align: right;
//           color: rgba(15, 23, 42, 0.78);
//           font-weight: 700;
//         }
//         .canvas-table-summary > div.is-grand {
//           margin-top: 2px;
//           padding-top: 8px;
//           border-top: 1px solid rgba(15, 23, 42, 0.14);
//           font-size: 0.72rem;
//         }
//         .canvas-table-summary > div.is-grand > span {
//           color: inherit;
//           font-weight: 800;
//         }
//         .canvas-table-summary strong {
//           font-size: inherit;
//         }
//         .canvas-table-summary-value {
//           min-width: 128px;
//           text-align: right;
//           white-space: nowrap;
//           font-variant-numeric: tabular-nums;
//         }
//         .canvas-tax-summary-label {
//           display: inline-flex;
//           align-items: center;
//           justify-content: flex-end;
//           gap: 3px;
//           flex-wrap: wrap;
//         }
//         .canvas-inline-tax-rate {
//           width: 38px;
//           min-width: 38px;
//           text-align: center;
//           font-weight: 800;
//           padding: 0;
//         }
//         .canvas-notes-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 8px;
//         }
//         .canvas-mini-action {
//           border: 0;
//           border-radius: 999px;
//           padding: 4px 8px;
//           background: rgba(15, 23, 42, 0.08);
//           color: inherit;
//           font-size: 0.56rem;
//           font-weight: 800;
//         }
//         .invoice-footer-preview {
//           position: absolute;
//           left: 16px;
//           right: 16px;
//           bottom: 12px;
//           height: 74px;
//           border-radius: 22px;
//           border: 1px solid rgba(15, 23, 42, 0.1);
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 14px;
//           padding: 12px 16px;
//         }
//         .invoice-footer-copy {
//           display: grid;
//           gap: 3px;
//           font-size: 0.62rem;
//         }
//         .invoice-footer-link {
//           font-weight: 800;
//         }
//         .invoice-footer-qr {
//           width: 54px;
//           height: 54px;
//           border-radius: 14px;
//           display: grid;
//           place-items: center;
//           background: #fff;
//           color: #111827;
//           font-weight: 900;
//           border: 1px solid rgba(15, 23, 42, 0.08);
//         }
//         .palette-grid {
//           display: grid;
//           gap: 10px;
//         }
//         .palette-row {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 12px;
//           border-radius: 16px;
//           padding: 8px 10px;
//           background: rgba(255, 255, 255, 0.76);
//           border: 1px solid rgba(15, 23, 42, 0.06);
//           font-weight: 700;
//           text-transform: capitalize;
//         }
//         .palette-row input {
//           width: 42px;
//           height: 42px;
//           border: 0;
//           background: transparent;
//           padding: 0;
//         }
//         .design-options-grid {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 14px;
//         }
//         .design-option-card {
//           width: 100%;
//           border-radius: 26px;
//           padding: 14px;
//           display: grid;
//           gap: 12px;
//           text-align: left;
//           box-shadow: var(--shadow-soft);
//         }
//         .design-option-card.is-active {
//           outline: 2px solid currentColor;
//         }
//         .premium-template-header {
//           display: flex;
//           justify-content: space-between;
//           gap: 10px;
//           align-items: center;
//           flex-wrap: wrap;
//         }
//         .premium-template-title {
//           font-weight: 800;
//           font-size: 1.05rem;
//           letter-spacing: -0.03em;
//         }
//         .mini-canvas-frame {
//           overflow: hidden;
//           border-radius: 18px;
//           background: rgba(255, 255, 255, 0.54);
//           border: 1px solid rgba(15, 23, 42, 0.08);
//           height: 236px;
//           position: relative;
//         }
//         .mini-canvas-scale {
//           position: absolute;
//           top: 0;
//           left: 0;
//           transform: scale(0.28);
//           transform-origin: top left;
//           width: ${PAGE_WIDTH}px;
//           height: ${PAGE_HEIGHT}px;
//         }
//         .invoice-builder-shell {
//           min-height: 100vh;
//           display: grid;
//           grid-template-columns: 228px minmax(0, 850px) 228px;
//           justify-content: center;
//           gap: 18px;
//           align-items: start;
//           padding: 18px 16px 36px;
//           background: radial-gradient(
//               circle at top,
//               rgba(255, 255, 255, 0.14),
//               transparent 34%
//             ),
//             linear-gradient(180deg, #4b1fd2 0%, #651be7 52%, #781ef0 100%);
//         }
//         .builder-side-rail {
//           position: sticky;
//           top: 18px;
//           display: grid;
//           gap: 14px;
//         }
//         .builder-side-rail-left,
//         .builder-side-rail-right {
//           width: 228px;
//         }
//         .builder-center-column {
//           width: min(100%, 850px);
//           display: grid;
//           gap: 14px;
//           justify-items: center;
//         }
//         .builder-floating-card {
//           width: 100%;
//           border-radius: 18px;
//           border: 1px solid rgba(255, 255, 255, 0.18);
//           background: linear-gradient(
//             180deg,
//             rgba(238, 225, 255, 0.92),
//             rgba(218, 194, 252, 0.88)
//           );
//           box-shadow: 0 20px 52px rgba(35, 10, 106, 0.22),
//             inset 0 1px 0 rgba(255, 255, 255, 0.3);
//           backdrop-filter: blur(18px);
//         }
//         .tools-rail-card,
//         .health-rail-card {
//           padding: 14px;
//           display: grid;
//           gap: 14px;
//         }
//         .tools-rail-head,
//         .health-rail-head {
//           display: grid;
//           gap: 4px;
//         }
//         .tools-rail-head h3,
//         .health-rail-head h3 {
//           margin: 0;
//           color: #1e143f;
//           font-size: 1rem;
//           font-weight: 800;
//           letter-spacing: -0.03em;
//         }
//         .tools-rail-head span,
//         .tools-section-kicker,
//         .pro-kicker {
//           font-size: 0.63rem;
//           line-height: 1;
//           text-transform: uppercase;
//           letter-spacing: 0.14em;
//           color: rgba(30, 20, 63, 0.58);
//           font-weight: 800;
//         }
//         .tools-rail-nav {
//           display: grid;
//           gap: 8px;
//         }
//         .tools-rail-item {
//           width: 100%;
//           border: 0;
//           background: transparent;
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           padding: 11px 12px;
//           border-radius: 12px;
//           color: #544873;
//           font-size: 0.76rem;
//           font-weight: 700;
//           cursor: pointer;
//           text-align: left;
//           transition: background 0.2s ease, transform 0.2s ease, color 0.2s ease;
//         }
//         .tools-rail-item:hover {
//           background: rgba(255, 255, 255, 0.34);
//         }
//         .tools-rail-item.is-active {
//           background: rgba(255, 255, 255, 0.88);
//           color: #4c32cc;
//           box-shadow: 0 10px 22px rgba(79, 51, 204, 0.16);
//         }
//         .tools-rail-icon {
//           width: 18px;
//           display: inline-grid;
//           place-items: center;
//           font-size: 0.86rem;
//           opacity: 0.86;
//         }
//         .tools-rail-section {
//           display: grid;
//           gap: 10px;
//         }
//         .tools-palette-grid {
//           display: grid;
//           grid-template-columns: repeat(2, minmax(0, 1fr));
//           gap: 8px;
//         }
//         .tools-palette-swatch {
//           position: relative;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           padding: 8px 10px;
//           border-radius: 12px;
//           background: rgba(255, 255, 255, 0.54);
//           cursor: pointer;
//           min-width: 0;
//         }
//         .tools-palette-input {
//           position: absolute;
//           inset: 0;
//           opacity: 0;
//           cursor: pointer;
//         }
//         .tools-palette-dot {
//           width: 16px;
//           height: 16px;
//           border-radius: 999px;
//           box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08);
//           flex: 0 0 auto;
//         }
//         .tools-palette-name {
//           min-width: 0;
//           overflow: hidden;
//           text-overflow: ellipsis;
//           white-space: nowrap;
//           font-size: 0.66rem;
//           font-weight: 700;
//           text-transform: capitalize;
//           color: #4a4165;
//         }
//         .tools-rail-footer {
//           margin-top: 2px;
//         }
//         .attachment-list {
//           display: flex;
//           flex-wrap: wrap;
//           gap: 8px;
//         }
//         .pro-upgrade-card {
//           padding: 14px;
//           display: grid;
//           gap: 10px;
//           justify-items: center;
//           text-align: center;
//         }
//         .pro-upgrade-button {
//           width: 100%;
//           border: 0;
//           border-radius: 12px;
//           padding: 10px 12px;
//           color: #fff;
//           font-weight: 800;
//           background: linear-gradient(135deg, #1f4dd8 0%, #003fab 100%);
//           box-shadow: 0 14px 28px rgba(0, 63, 171, 0.26);
//         }
//         .top-ai-card {
//           width: min(100%, 850px);
//           padding: 14px;
//           display: grid;
//           gap: 12px;
//           background: linear-gradient(
//             180deg,
//             rgba(237, 224, 255, 0.94),
//             rgba(217, 193, 251, 0.9)
//           );
//         }
//         .top-ai-card-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 10px;
//         }
//         .top-ai-title-row {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           color: #1e143f;
//           font-size: 0.74rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.12em;
//         }
//         .ai-orchestra-head-meta {
//           display: flex;
//           gap: 8px;
//           flex-wrap: wrap;
//         }
//         .ai-tab-row {
//           display: grid;
//           grid-template-columns: repeat(3, minmax(0, 1fr));
//           gap: 8px;
//         }
//         .ai-tab-button {
//           border: 1px solid rgba(255, 255, 255, 0.36);
//           border-radius: 16px;
//           padding: 12px 14px;
//           display: grid;
//           gap: 4px;
//           background: rgba(255, 255, 255, 0.34);
//           color: #4e4670;
//           text-align: left;
//           cursor: pointer;
//           transition: transform 0.18s ease, background 0.18s ease,
//             box-shadow 0.18s ease;
//         }
//         .ai-tab-button strong {
//           font-size: 0.8rem;
//           color: #26194c;
//         }
//         .ai-tab-button span {
//           font-size: 0.68rem;
//           color: #655d82;
//         }
//         .ai-tab-button.is-active {
//           background: rgba(255, 255, 255, 0.76);
//           box-shadow: 0 14px 24px rgba(82, 54, 182, 0.12);
//           transform: translateY(-1px);
//         }
//         .ai-pass-row {
//           display: grid;
//           grid-template-columns: repeat(5, minmax(0, 1fr));
//           gap: 8px;
//         }
//         .ai-pass-card {
//           min-height: 90px;
//           border-radius: 16px;
//           padding: 12px;
//           display: grid;
//           align-content: start;
//           gap: 6px;
//           background: rgba(255, 255, 255, 0.26);
//           border: 1px solid rgba(255, 255, 255, 0.28);
//         }
//         .ai-pass-card strong {
//           font-size: 0.72rem;
//           color: #26194c;
//         }
//         .ai-pass-card span {
//           font-size: 0.64rem;
//           color: #655d82;
//           line-height: 1.4;
//         }
//         .ai-pass-card.is-running {
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.84),
//             rgba(223, 230, 255, 0.72)
//           );
//           border-color: rgba(0, 63, 171, 0.18);
//         }
//         .ai-pass-card.is-done {
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.84),
//             rgba(225, 248, 235, 0.72)
//           );
//         }
//         .ai-orchestra-meta-row {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 12px;
//           flex-wrap: wrap;
//         }
//         .ai-variant-count-row {
//           display: inline-flex;
//           align-items: center;
//           gap: 8px;
//           flex-wrap: wrap;
//         }
//         .variant-count-chip {
//           border: 1px solid rgba(255, 255, 255, 0.34);
//           border-radius: 999px;
//           padding: 8px 12px;
//           background: rgba(255, 255, 255, 0.42);
//           color: #4e4670;
//           font-size: 0.72rem;
//           font-weight: 800;
//           cursor: pointer;
//         }
//         .variant-count-chip.is-active {
//           background: linear-gradient(135deg, #003fab 0%, #0455dd 100%);
//           color: #fff;
//           box-shadow: 0 12px 22px rgba(0, 63, 171, 0.18);
//         }
//         .top-ai-sparkle {
//           color: #244fd4;
//           font-size: 0.95rem;
//         }
//         .history-chip {
//           border: 0;
//           background: transparent;
//           color: rgba(30, 20, 63, 0.46);
//           font-size: 0.64rem;
//           font-weight: 800;
//           text-transform: uppercase;
//           letter-spacing: 0.12em;
//           cursor: pointer;
//         }
//         .top-ai-input-row {
//           display: grid;
//           grid-template-columns: minmax(0, 1fr) auto;
//           gap: 10px;
//           align-items: start;
//         }
//         .top-ai-textarea {
//           min-height: 54px;
//           max-height: 84px;
//           padding: 14px 16px;
//           resize: none;
//           border: 0;
//           border-radius: 12px;
//           background: rgba(255, 255, 255, 0.5);
//           box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
//           font-size: 0.86rem;
//         }
//         .top-ai-generate {
//           //   align-self: stretch;
//           align-self: center;

//           border: 0;
//           border-radius: 12px;
//           padding: 0 18px;
//           min-width: 182px;
//           height: 50px;
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           gap: 8px;
//           color: #fff;
//           font-weight: 800;
//           background: linear-gradient(135deg, #003fab 0%, #0455dd 100%);
//           box-shadow: 0 16px 30px rgba(0, 63, 171, 0.24);
//           cursor: pointer;
//         }
//         .button-icon-text {
//           display: inline-grid;
//           place-items: center;
//           font-size: 0.9rem;
//           line-height: 1;
//         }
//         .top-ai-chip-row {
//           display: flex;
//           gap: 8px;
//           flex-wrap: wrap;
//         }
//         .suggestion-chip {
//           border: 1px solid rgba(255, 255, 255, 0.34);
//           border-radius: 999px;
//           padding: 8px 12px;
//           background: rgba(255, 255, 255, 0.44);
//           color: #5d5578;
//           font-size: 0.67rem;
//           font-weight: 700;
//           cursor: pointer;
//         }
//         .suggestion-chip.is-muted {
//           background: rgba(255, 255, 255, 0.26);
//           color: rgba(30, 20, 63, 0.58);
//         }
//         .canvas-stage-card {
//           width: min(100%, 850px);
//           padding: 14px;
//           background: rgba(255, 255, 255, 0.16);
//         }
//         .canvas-stage-inner {
//           position: relative;
//           display: block;
//         }
//         .canvas-stage-watermark {
//           position: absolute;
//           top: -14px;
//           right: -6px;
//           width: 220px;
//           height: 220px;
//           border-radius: 999px;
//           background: radial-gradient(
//             circle,
//             rgba(255, 255, 255, 0.18) 0%,
//             rgba(255, 255, 255, 0) 70%
//           );
//           pointer-events: none;
//         }
//         .invoice-canvas-scroll {
//           overflow: hidden;
//           padding: 18px;
//           border: 0;
//           border-radius: 16px;
//           background: rgba(255, 255, 255, 0.12);
//           box-shadow: none;
//         }
//         .invoice-canvas-page {
//           border-radius: 12px;
//           overflow: hidden;
//           box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
//         }
//         .builder-bottom-actions {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           gap: 0;
//           padding: 7px;
//           border-radius: 16px;
//           background: rgba(238, 221, 255, 0.84);
//           border: 1px solid rgba(255, 255, 255, 0.28);
//           box-shadow: 0 18px 34px rgba(40, 9, 121, 0.18);
//           backdrop-filter: blur(16px);
//         }
//         .action-tray-divider {
//           width: 1px;
//           align-self: stretch;
//           background: rgba(89, 72, 141, 0.16);
//           margin: 2px 4px;
//         }
//         .tray-btn {
//           border: 0;
//           border-radius: 12px;
//           padding: 11px 16px;
//           display: inline-flex;
//           align-items: center;
//           gap: 8px;
//           font-size: 0.78rem;
//           font-weight: 800;
//           cursor: pointer;
//         }
//         .tray-btn-ghost {
//           background: rgba(255, 255, 255, 0.42);
//           color: #4d4a5a;
//         }
//         .tray-btn-primary {
//           background: linear-gradient(135deg, #003fab 0%, #0455dd 100%);
//           color: #fff;
//           box-shadow: 0 14px 26px rgba(0, 63, 171, 0.24);
//         }
//         .health-rail-card {
//           gap: 14px;
//         }
//         .health-stack {
//           display: grid;
//           gap: 12px;
//         }
//         .health-item {
//           display: grid;
//           grid-template-columns: auto 1fr;
//           gap: 12px;
//           align-items: start;
//           border-radius: 12px;
//           padding: 12px;
//           background: rgba(255, 255, 255, 0.42);
//         }
//         .health-icon {
//           width: 28px;
//           height: 28px;
//           border-radius: 999px;
//           display: grid;
//           place-items: center;
//           font-size: 0.84rem;
//           font-weight: 900;
//           background: rgba(255, 255, 255, 0.8);
//         }
//         .health-item.is-good .health-icon {
//           color: #16a34a;
//         }
//         .health-item.is-warn .health-icon {
//           color: #d97706;
//         }
//         .health-item strong,
//         .health-suggestion-card strong {
//           display: block;
//           color: #26194c;
//           font-size: 0.78rem;
//           margin-bottom: 4px;
//         }
//         .health-item span,
//         .health-suggestion-card p {
//           margin: 0;
//           color: #645c81;
//           font-size: 0.66rem;
//           line-height: 1.45;
//         }
//         .health-suggestion-card {
//           border-radius: 14px;
//           padding: 14px;
//           display: grid;
//           gap: 10px;
//           background: linear-gradient(180deg, #6a4df1 0%, #5332d1 100%);
//           box-shadow: 0 18px 30px rgba(73, 47, 188, 0.24);
//         }
//         .health-suggestion-card strong,
//         .health-suggestion-card p {
//           color: #fff;
//         }
//         .health-cta-button {
//           border: 1px solid rgba(255, 255, 255, 0.18);
//           border-radius: 12px;
//           padding: 10px 12px;
//           background: rgba(255, 255, 255, 0.16);
//           color: #fff;
//           font-size: 0.72rem;
//           font-weight: 800;
//           cursor: pointer;
//         }
//         .collaboration-card {
//           display: grid;
//           gap: 10px;
//           padding-top: 4px;
//         }
//         .collaboration-row {
//           display: flex;
//           align-items: center;
//         }
//         .collab-avatar,
//         .collab-plus {
//           width: 30px;
//           height: 30px;
//           border-radius: 999px;
//           display: grid;
//           place-items: center;
//           margin-left: -6px;
//           font-size: 0.68rem;
//           font-weight: 800;
//           border: 2px solid rgba(255, 255, 255, 0.9);
//           background: linear-gradient(135deg, #0f172a, #334155);
//           color: #fff;
//         }
//         .collaboration-row > :first-child {
//           margin-left: 0;
//         }
//         .collab-plus {
//           background: rgba(255, 255, 255, 0.7);
//           color: #4934b2;
//         }
//         @media (max-width: 900px) {
//           .ai-modal-overlay {
//             padding: 12px;
//           }
//           .ai-modal-card {
//             padding: 18px;
//           }
//           .ai-modal-head,
//           .ai-empty-state {
//             flex-direction: column;
//             align-items: stretch;
//           }
//         }
//         @media (max-width: 1120px) {
//           .invoice-builder-shell {
//             grid-template-columns: 1fr;
//           }
//           .builder-side-rail {
//             position: static;
//           }
//           .builder-side-rail-left,
//           .builder-side-rail-right,
//           .builder-center-column,
//           .top-ai-card,
//           .canvas-stage-card {
//             width: min(850px, 100%);
//             margin: 0 auto;
//           }
//           .builder-side-rail-left {
//             order: 2;
//           }
//           .builder-side-rail-right {
//             order: 3;
//           }
//           .top-ai-input-row {
//             grid-template-columns: 1fr;
//           }
//         }
//         @media (max-width: 720px) {
//           .invoice-builder-shell {
//             padding-inline: 10px;
//           }
//           .invoice-canvas-scroll {
//             padding: 8px;
//           }
//           .builder-bottom-actions {
//             width: 100%;
//             flex-wrap: wrap;
//           }
//           .action-tray-divider {
//             display: none;
//           }
//           .tray-btn {
//             width: 100%;
//             justify-content: center;
//           }
//           .tools-palette-grid {
//             grid-template-columns: 1fr;
//           }
//         }
//       `}</style>
//     </>
//   );
// }

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
const ASSISTANT_LAYOUT_INTENT_REGEX =
  /(premium|fresh|new|different|alternate|another|remix|redesign|rearrange|reposition|move|reset|change).*(look|layout|design|variant|canvas|structure|blocks?)/i;
const ASSISTANT_PRESERVE_LAYOUT_REGEX =
  /(keep|preserve|retain|leave|without changing|don\'?t change|do not change).*(layout|design|canvas|structure|placement|positions?|theme|style)/i;
const ASSISTANT_CALCULATED_AMOUNT_REGEX =
  /\b(amount due|invoice total|total due|grand total|total amount|payable|balance due|balance|total|amount)\b/i;
const ASSISTANT_COLOR_MAP: Record<string, string> = {
  white: "#FFFFFF",
  black: "#111827",
  charcoal: "#1F2937",
  slate: "#E2E8F0",
  gray: "#CBD5E1",
  silver: "#E5E7EB",
  cream: "#FFF7ED",
  beige: "#F5E6C8",
  gold: "#D4A017",
  blue: "#2563EB",
  navy: "#1E3A8A",
  indigo: "#4F46E5",
  purple: "#7C3AED",
  violet: "#8B5CF6",
  pink: "#EC4899",
  orange: "#F97316",
  red: "#EF4444",
  green: "#10B981",
  emerald: "#059669",
  teal: "#14B8A6",
};

function normalizeAssistantValue(value: string) {
  return value
    .trim()
    .replace(/^["“”']+|["“”']+$/g, "")
    .trim();
}

function resolveAssistantColor(value: string) {
  const cleaned = normalizeAssistantValue(value)
    .toLowerCase()
    .replace(/\.+$/, "")
    .trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(cleaned)) {
    if (cleaned.length === 4) {
      return `#${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}${cleaned[3]}${cleaned[3]}`.toUpperCase();
    }
    return cleaned.toUpperCase();
  }
  return ASSISTANT_COLOR_MAP[cleaned] || null;
}

function extractAssistantValue(segment: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = segment.match(pattern);
    if (match?.[1]) return normalizeAssistantValue(match[1]);
  }
  return "";
}

function cleanupAssistantLooseValue(value: string) {
  return normalizeAssistantValue(
    String(value || "")
      .replace(/^(?:to|as|with|into|like|saying|says?)\s+/i, "")
      .replace(/^(?:just|simply|please|pls)\s+/i, "")
      .replace(/\s+(?:please|pls)\s*$/i, "")
      .replace(/[.]+$/g, "")
  );
}

function hasAssistantCalculatedAmountIntent(command: string) {
  return (
    ASSISTANT_CALCULATED_AMOUNT_REGEX.test(command) &&
    !/\b(qty|quantity|unit|unit\s+price|price|rate|tax|vat|gst|discount|currency|line\s*item|item)\b/i.test(
      command
    )
  );
}

function isAssistantRequestTooVague(command: string) {
  const normalized = normalizeAssistantValue(command).toLowerCase();
  if (!normalized) return true;
  if (normalized.split(/\s+/).filter(Boolean).length >= 4) return false;
  return /^(?:please|pls|help|do it|fix it|change it|update it|make it better|improve it|something else|different|new design|change design|layout|design)$/i.test(
    normalized
  );
}

function sanitizeAssistantInvoicePatch(
  patch: Partial<InvoiceState> | null | undefined
) {
  if (!patch) return {};
  const nextPatch = { ...patch } as Partial<InvoiceState> &
    Record<string, unknown>;
  delete nextPatch.amount;
  return nextPatch as Partial<InvoiceState>;
}

function splitAssistantCommandIntoSegments(command: string) {
  return normalizeAssistantValue(command)
    .split(/\n+|\.{2,}|;+/)
    .flatMap((item) => item.split(/\s+(?:and then|then|also|plus)\s+/i))
    .flatMap((item) =>
      item.split(
        /,\s+(?=(?:make|change|set|update|rewrite|replace|add|create|show|open|hide|close|reset|restore|revert|refresh|redesign|restyle|switch|move|use|apply|remove)\b)/i
      )
    )
    .flatMap((item) =>
      item.split(
        /\s+and\s+(?=(?:make|change|set|update|rewrite|replace|add|create|show|open|hide|close|reset|restore|revert|refresh|redesign|restyle|switch|move|use|apply|remove)\b)/i
      )
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function isAssistantTranscriptLikelyIncomplete(transcript: string) {
  const normalized = normalizeAssistantValue(transcript).toLowerCase();
  if (!normalized) return false;
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 2) return true;
  return (
    /\b(and|or|with|for|to|into|from|because|but|then|also|plus)\s*$/i.test(
      normalized
    ) ||
    /(?:make|change|set|update|add|show|open|move|replace)\s+(?:the\s+)?$/i.test(
      normalized
    )
  );
}

function inferAssistantOptimizeAction(command: string) {
  const normalized = normalizeAssistantValue(command).toLowerCase();
  if (!normalized) return null;
  const scores = new Map<string, number>();
  const addScore = (action: string, score: number) => {
    scores.set(action, (scores.get(action) || 0) + score);
  };

  if (
    /\b(premium|luxury|elevated|editorial|expensive|higher-end)\b/i.test(
      normalized
    )
  ) {
    addScore("Make it more premium", 3);
  }
  if (
    /\b(futuristic|future|fintech|techy|glassy|sleek tech)\b/i.test(normalized)
  ) {
    addScore("Make it more futuristic", 3);
  }
  if (
    /\b(clean|cleaner|minimal|minimalist|less crowded|more whitespace|airier|spacing|breathe)\b/i.test(
      normalized
    )
  ) {
    addScore("Improve spacing", 2.6);
  }
  if (
    /\b(trust|confidence|credible|clearer payment|reassuring)\b/i.test(
      normalized
    )
  ) {
    addScore("Improve trust signals", 2.4);
  }
  if (/\b(brand|consistent|consistency|on-brand|aligned)\b/i.test(normalized)) {
    addScore("Improve brand consistency", 2.2);
  }
  if (
    /\b(typography|font|fonts|readability|legibility|text hierarchy)\b/i.test(
      normalized
    )
  ) {
    addScore("Improve typography", 2.2);
  }
  if (
    /\b(enterprise|boardroom|formal|safe|procurement|corporate)\b/i.test(
      normalized
    )
  ) {
    addScore("Make it more enterprise-safe", 2.8);
  }

  const ranked = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] || null;
}

function extractAssistantDesignDirection(command: string) {
  return normalizeAssistantValue(command)
    .replace(
      /^(?:please|pls|can\s+you|could\s+you|would\s+you|i\s+want\s+you\s+to|i\s+need\s+you\s+to)\s+/i,
      ""
    )
    .replace(
      /^(?:make|give|create|generate|show|apply|try|use|switch\s+to|change\s+to|refresh|redesign|restyle|reimagine)\s+/i,
      ""
    )
    .replace(
      /\b(?:invoice|canvas|layout|design|look|style|theme|variant)\b/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function hasExplicitSelectedBlockReference(command: string) {
  return /\b(this|that|selected|current)\b(?:\s+(?:text|field|block|section|box|area))?/i.test(
    command
  );
}

function hasAssistantKnownFieldSignal(command: string) {
  return /\b(discount|discont|tax|vat|gst|currency|note|notes|message|bill\s*-?\s*to|client|customer|invoice\s+number|invoice\s+no|number|due\s+date|issue\s+date|payment\s+terms|terms|biller|issuer|company|sender|email|address|qty|quantity|price|rate|unit\s+price|unit\s+cost|line\s*item|item|service|charge|entry|row|task|amount|total|balance|payable)\b/i.test(
    command
  );
}

function hasAssistantAddLineItemIntent(command: string) {
  const normalized = normalizeAssistantValue(command).toLowerCase();
  if (!normalized) return false;
  return (
    (/\b(add|create|insert|include|append|put)\b/.test(normalized) &&
      /\b(line\s*item|item|service|charge|entry|row|task)\b/.test(
        normalized
      )) ||
    /\badd\s+(?:like|something\s+like|this\s+item|another\s+item)\b/.test(
      normalized
    ) ||
    /\b(?:new|another)\s+(?:line\s*item|item|service|charge|entry|row|task)\b/.test(
      normalized
    )
  );
}

function extractAssistantLooseCandidate(segment: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = segment.match(pattern);
    if (match?.[1]) {
      const cleaned = cleanupAssistantLooseValue(match[1]);
      if (cleaned) return cleaned;
    }
  }
  return "";
}

function retargetInvoiceAmount(
  baseInvoice: InvoiceState,
  targetAmountValue: string
) {
  const targetAmount = toMoney(String(targetAmountValue || "0"));
  const numericTarget = Number(targetAmount || 0);
  if (!Number.isFinite(numericTarget) || numericTarget < 0) {
    return baseInvoice;
  }

  const sourceItems = (baseInvoice.lineItems || []).length
    ? baseInvoice.lineItems.map((item) => ({ ...item }))
    : [
        {
          description: "Invoice total",
          quantity: "1.00",
          unitPrice: targetAmount,
          amount: targetAmount,
        },
      ];

  const taxFactor = 1 + Number(baseInvoice.taxPercentage || 0) / 100;
  const discountFactor = 1 - Number(baseInvoice.discountPercentage || 0) / 100;
  const multiplier = Math.max(taxFactor * discountFactor, 0.0001);
  const targetSubtotal = Number((numericTarget / multiplier).toFixed(2));
  const currentSubtotal = sourceItems.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  let allocated = 0;
  const nextLineItems = sourceItems.map((item, index) => {
    const quantityValue = Math.max(Number(item.quantity || 1), 0.0001);
    const nextAmountNumber =
      currentSubtotal > 0
        ? index === sourceItems.length - 1
          ? Number((targetSubtotal - allocated).toFixed(2))
          : Number(
              (
                ((Number(item.amount || 0) || 0) / currentSubtotal) *
                targetSubtotal
              ).toFixed(2)
            )
        : index === 0
        ? targetSubtotal
        : 0;

    allocated += nextAmountNumber;
    const nextUnitPrice = Number((nextAmountNumber / quantityValue).toFixed(2));

    return {
      ...item,
      quantity: toMoney(String(quantityValue)),
      unitPrice: toMoney(String(Math.max(nextUnitPrice, 0))),
      amount: toMoney(String(Math.max(nextAmountNumber, 0))),
    };
  });

  return {
    ...baseInvoice,
    lineItems: nextLineItems,
    amount: calculateInvoiceAmount(
      nextLineItems,
      baseInvoice.taxPercentage,
      baseInvoice.discountPercentage
    ),
  };
}

function normalizeAssistantLineItemHint(value: string) {
  return normalizeAssistantValue(String(value || ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(
      /\b(?:line|item|items|qty|quantity|price|rate|amount|update|change|set|make|please|pls|just|the|a|an|to|for|of|with|as|is|be|should|needs|need|into|this|that|it)\b/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeAssistantLineItemHint(value: string) {
  const normalized = normalizeAssistantLineItemHint(value);
  return normalized ? normalized.split(" ").filter(Boolean) : [];
}

function findBestInvoiceLineItemIndex(items: LineItem[], hint: string) {
  const normalizedHint = normalizeAssistantLineItemHint(hint);
  const hintTokens = tokenizeAssistantLineItemHint(hint);
  if (!normalizedHint && !hintTokens.length) {
    return -1;
  }

  let bestIndex = -1;
  let bestScore = 0;

  items.forEach((item, index) => {
    const description = normalizeAssistantLineItemHint(item.description || "");
    const descriptionTokens = tokenizeAssistantLineItemHint(
      item.description || ""
    );
    if (!description && !descriptionTokens.length) {
      return;
    }

    let score = 0;
    if (normalizedHint && description === normalizedHint) score += 10;
    if (normalizedHint && description.indexOf(normalizedHint) !== -1)
      score += 7;
    if (normalizedHint && normalizedHint.indexOf(description) !== -1)
      score += 5;

    hintTokens.forEach((token) => {
      if (descriptionTokens.indexOf(token) !== -1) score += 2;
    });

    if (hintTokens.length && descriptionTokens.length) {
      score +=
        Math.min(hintTokens.length, descriptionTokens.length) >= 2 ? 0.5 : 0;
    }

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestScore >= 2 ? bestIndex : -1;
}

function updateInvoiceLineItemFieldByHint(
  baseInvoice: InvoiceState,
  hint: string,
  field: "quantity" | "unitPrice" | "amount",
  nextValue: string
) {
  const targetIndex = findBestInvoiceLineItemIndex(
    baseInvoice.lineItems || [],
    hint
  );
  if (targetIndex < 0) {
    return {
      invoice: baseInvoice,
      changed: false,
      matchedDescription: "",
    };
  }

  const safeValue = toMoney(String(nextValue || "0"));
  const lineItems = baseInvoice.lineItems.map((item, index) => {
    if (index !== targetIndex) return { ...item };
    const nextItem = { ...item };

    if (field === "quantity") {
      nextItem.quantity = safeValue;
      nextItem.amount = toMoney(
        String(Number(nextItem.quantity || 0) * Number(nextItem.unitPrice || 0))
      );
      return nextItem;
    }

    if (field === "unitPrice") {
      nextItem.unitPrice = safeValue;
      nextItem.amount = toMoney(
        String(Number(nextItem.quantity || 0) * Number(nextItem.unitPrice || 0))
      );
      return nextItem;
    }

    nextItem.amount = safeValue;
    const quantityValue = Math.max(Number(nextItem.quantity || 1), 0.0001);
    nextItem.unitPrice = toMoney(
      String(Number(nextItem.amount || 0) / quantityValue)
    );
    return nextItem;
  });

  return {
    invoice: {
      ...baseInvoice,
      lineItems,
      amount: calculateInvoiceAmount(
        lineItems,
        baseInvoice.taxPercentage,
        baseInvoice.discountPercentage
      ),
    },
    changed: true,
    matchedDescription: baseInvoice.lineItems[targetIndex]?.description || "",
  };
}

function parseAssistantNaturalLineItem(
  input: string,
  fallbackCurrency = "USD"
) {
  const source = String(input || "").trim();
  if (!source) return null;

  const quantityKeyword =
    "(?:qty|qt.?y|quantity|quanitty|quantitiy|quatity|quanity|units|pcs?|pieces?|hours?)";
  const pricingKeyword =
    "(?:pers+unit(?:s+cost|s+price)?|unit(?:s+cost|s+price)?|unit|each|rate|price|cost|amount|currency)";
  const addItemKeyword = "(?:(?:lines+)?item|service|charge|entry|row|task)";
  const descriptionLookahead = `(?=\s+(?:and|with)?\s*${quantityKeyword}\b|\s+(?:and|with)?\s*${pricingKeyword}\b|\s+(?:usd|eur|gbp|inr|cad|aud|sgd|aed|jpy|cny)\b|[,.;]|$)`;
  const explicitDescription = extractAssistantValue(source, [
    new RegExp(
      `(?:^|\b)(?:description|desc)(?:\s+should(?:\s+be)?|\s+to|\s+as|\s+is|\s*=|\s*:)?\s+["“”']?(.+?)["“”']?${descriptionLookahead}`,
      "i"
    ),
    new RegExp(
      `(?:^|\b)(?:add|create|insert|include|append|put)\s+(?:another\s+)?(?:this\s+)?(?:a\s+)?(?:new\s+)?${addItemKeyword}(?:\s+called|\s+named|\s+for|\s+as|\s+like|\s*:)?\s+["“”']?(.+?)["“”']?${descriptionLookahead}`,
      "i"
    ),
    new RegExp(
      `(?:^|\b)add\s+(?:like|something\s+like)\s+["“”']?(.+?)["“”']?${descriptionLookahead}`,
      "i"
    ),
    new RegExp(
      `(?:^|\b)(?:item|service|charge|entry|task)(?:\s+called|\s+named|\s+for|\s+as|\s+like|\s*:)?\s+["“”']?(.+?)["“”']?${descriptionLookahead}`,
      "i"
    ),
  ]);

  const currency = normalizeCurrency(source, fallbackCurrency);
  const pricePatterns = [
    /(?:per\s+unit(?:\s+cost|\s+price)?|unit(?:\s+cost|\s+price)?|unit|each|rate|price|cost|amount)\s*(?:is|=|:|at|of)?\s*(?:([$€£₹])\s*)?(\d[\d,]*(?:\.\d{1,2})?)(?:\s*(usd|eur|gbp|inr|cad|aud|sgd|aed|jpy|cny))?/i,
    /(?:([$€£₹])\s*)?(\d[\d,]*(?:\.\d{1,2})?)(?:\s*(usd|eur|gbp|inr|cad|aud|sgd|aed|jpy|cny))?\s*(?:per\s+unit|each)/i,
  ];
  const quantityPatterns = [
    /(?:qty|qt\.?y|quantity|quanitty|quantitiy|quatity|quanity|units|pcs?|pieces?|hours?)\s*(?:is|=|:|of|as)?\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:qty|qt\.?y|quantity|quanitty|quantitiy|quatity|quanity|units|pcs?|pieces?|hours?)\b/i,
  ];

  let unitPrice = "";
  let quantity = "";
  const consumedParts: string[] = [];

  for (const pattern of pricePatterns) {
    const match = source.match(pattern);
    if (match?.[0] && match?.[2]) {
      unitPrice = toMoney(match[2].replace(/,/g, ""));
      consumedParts.push(match[0]);
      break;
    }
  }

  for (const pattern of quantityPatterns) {
    const match = source.match(pattern);
    const numeric = match?.[1] || "";
    if (match?.[0] && numeric) {
      quantity = toMoney(numeric.replace(/,/g, ""));
      consumedParts.push(match[0]);
      break;
    }
  }

  const numericValues = Array.from(
    source.matchAll(/\d[\d,]*(?:\.\d{1,2})?/g)
  ).map((match) => match[0].replace(/,/g, ""));
  if (!unitPrice && numericValues.length >= 2) {
    const lastNumber = numericValues[numericValues.length - 1];
    const firstNumber = numericValues[0];
    unitPrice = toMoney(lastNumber);
    if (!quantity && firstNumber) quantity = toMoney(firstNumber);
  } else if (
    !unitPrice &&
    numericValues.length === 1 &&
    /(cost|price|rate|unit|amount|usd|eur|gbp|inr|cad|aud|sgd|aed|jpy|cny)/i.test(
      source
    )
  ) {
    unitPrice = toMoney(numericValues[0]);
  }

  if (!quantity) {
    quantity = "1.00";
  }

  const cleanupDescription = (value: string) =>
    normalizeAssistantValue(
      String(value || "")
        .replace(/^["“”']+|["“”']+$/g, "")
        .replace(
          /^(?:as\s+)?(?:another\s+)?(?:this\s+)?(?:new\s+)?(?:(?:line\s+)?item|service|charge|entry|row|task)\s+(?:as\s+|called\s+|named\s+|for\s+|like\s+)?/i,
          " "
        )
        .replace(
          /^(?:description|desc)\s*(?:should(?:\s+be)?|to|as|is|=|:)?\s*/i,
          ""
        )
        .replace(/^(?:another\s+)?(?:description|desc)\s+/i, "")
        .replace(/^[-,:;]+/, "")
        .replace(/\s+/g, " ")
        .trim()
    );

  let description = explicitDescription
    ? cleanupDescription(explicitDescription)
    : source;
  if (!explicitDescription) {
    consumedParts.forEach((part) => {
      description = description.replace(part, " ");
    });
    description = cleanupDescription(
      description
        .replace(
          /^(?:add|create|insert|include|append|put)\s+(?:another\s+)?(?:this\s+)?(?:a\s+)?(?:new\s+)?(?:(?:line\s+)?item|service|charge|entry|row|task)\b/gi,
          " "
        )
        .replace(
          /^(?:another\s+)?(?:(?:line\s+)?item|service|charge|entry|row|task)\b/gi,
          " "
        )
        .replace(/^(?:add\s+like|something\s+like)\b/gi, " ")
        .replace(/^(?:as\s+)?(?:description|desc)\b/gi, " ")
        .replace(/\b(?:called|named|like)\b/gi, " ")
        .replace(
          /\b(?:add|create|insert|include|append|put|new|with|where|whose|having|please|pls|just|this|another)\b/gi,
          " "
        )
        .replace(
          /\b(?:per\s+unit(?:\s+cost|\s+price)?|unit(?:\s+cost|\s+price)?|unit|each|rate|qty|qt\.?y|quantity|quanitty|quantitiy|quatity|quanity|units|pcs?|pieces?|hours?|cost|price|amount|currency)\b/gi,
          " "
        )
        .replace(/\b(?:is|are|as|at|of|for|to|be|being|where|and)\b/gi, " ")
        .replace(/(?:[$€£₹]|usd|eur|gbp|inr|cad|aud|sgd|aed|jpy|cny)/gi, " ")
        .replace(/[,:;]+/g, " ")
        .replace(/\d[\d,]*(?:\.\d{1,2})?/g, " ")
    );
  }

  if (!description) {
    description = cleanupDescription(
      source.split(
        /[,.;]|\b(?:qty|qt\.?y|quantity|quanitty|quantitiy|quatity|quanity|per\s+unit|unit\s+cost|unit\s+price|unit|cost|price|amount)\b/i
      )[0] || "Item"
    );
  }

  if (!description || !unitPrice) return null;

  return {
    description,
    quantity: toMoney(quantity || "1"),
    unitPrice,
    currency,
    amount: toMoney(String(Number(quantity || 0) * Number(unitPrice || 0))),
  };
}

function buildAiDraftPrompt(prompt: string, fallbackCurrency = "USD") {
  const normalizedPrompt = normalizeAiPrompt(prompt);
  const parsedLineItem = parseAssistantNaturalLineItem(
    normalizedPrompt,
    fallbackCurrency
  );
  if (!parsedLineItem) {
    return normalizedPrompt;
  }

  return `${normalizedPrompt}

Structured extraction hints from the same request:
- line item description: ${parsedLineItem.description}
- quantity: ${parsedLineItem.quantity}
- unit price: ${parsedLineItem.unitPrice}
- currency: ${parsedLineItem.currency}
- line amount: ${parsedLineItem.amount}
Use these extracted facts if they fit the user's request, and keep the description clean instead of mixing quantity/price words into it.`;
}

type AssistantStatus = "idle" | "listening" | "thinking" | "applying";

type AssistantCanvasResponse = {
  invoice?: Partial<InvoiceState>;
  invoicePatch?: Partial<InvoiceState>;
  style?: Partial<StyleTheme>;
  stylePatch?: Partial<StyleTheme>;
  palette?: Partial<StylePalette>;
  blocks?: unknown;
  showDesignExplorer?: boolean;
  generateLooks?: boolean;
  appliedLabels?: string[];
  summary?: string;
  feedback?: string;
  selectedBlockId?: string | null;
};

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

function hasAssistantLayoutIntent(command: string) {
  return (
    ASSISTANT_LAYOUT_INTENT_REGEX.test(command) &&
    !ASSISTANT_PRESERVE_LAYOUT_REGEX.test(command)
  );
}

function sanitizeAssistantBlocksPatch(value: unknown): CanvasBlock[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const source = item as Record<string, unknown>;
      const styleSource =
        source.style && typeof source.style === "object"
          ? (source.style as Record<string, unknown>)
          : null;
      const bindingSource =
        source.binding && typeof source.binding === "object"
          ? (source.binding as Record<string, unknown>)
          : null;
      if (
        typeof source.id !== "string" ||
        typeof source.type !== "string" ||
        typeof source.x !== "number" ||
        typeof source.y !== "number" ||
        typeof source.w !== "number" ||
        typeof source.h !== "number"
      ) {
        return null;
      }
      return {
        id: source.id,
        type: source.type,
        x: source.x,
        y: source.y,
        w: source.w,
        h: source.h,
        z: typeof source.z === "number" ? source.z : undefined,
        locked: typeof source.locked === "boolean" ? source.locked : undefined,
        editable:
          typeof source.editable === "boolean" ? source.editable : undefined,
        content:
          typeof source.content === "string" ? source.content : undefined,
        binding:
          bindingSource && typeof bindingSource.key === "string"
            ? { key: bindingSource.key }
            : undefined,
        style: styleSource
          ? {
              fontSize:
                typeof styleSource.fontSize === "number"
                  ? styleSource.fontSize
                  : undefined,
              fontWeight:
                typeof styleSource.fontWeight === "string"
                  ? styleSource.fontWeight
                  : undefined,
              color:
                typeof styleSource.color === "string"
                  ? styleSource.color
                  : undefined,
              background:
                typeof styleSource.background === "string"
                  ? styleSource.background
                  : undefined,
              align:
                typeof styleSource.align === "string"
                  ? styleSource.align
                  : undefined,
              radius:
                typeof styleSource.radius === "number"
                  ? styleSource.radius
                  : undefined,
            }
          : undefined,
      };
    })
    .filter((item): item is CanvasBlock => Boolean(item));
}

function mergeAssistantBlocks(
  current: CanvasBlock[],
  incoming: CanvasBlock[],
  allowReplace: boolean
) {
  if (!incoming.length) return current;
  if (allowReplace) return cloneBlocks(incoming);

  const incomingById = new Map(incoming.map((block) => [block.id, block]));
  let changed = false;
  const merged = current.map((block) => {
    const patch = incomingById.get(block.id);
    if (!patch) return block;
    changed = true;
    return {
      ...block,
      ...patch,
      binding: patch.binding ?? block.binding,
      style: { ...block.style, ...patch.style },
    };
  });
  return changed ? merged : current;
}

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

type AiTab = "create" | "variants" | "optimize";
type OrchestraPassStatus = "idle" | "running" | "done";

type VariantScoreCard = {
  safest: number;
  boldest: number;
  premium: number;
  futuristic: number;
  paymentConfidence: number;
};

type BrandInference = {
  industry: string;
  tone: string;
  impression: string;
  recommendedFamily: string;
  notes: string[];
};

type OrchestraVariant = InvoiceDraftOption & {
  id: string;
  family: string;
  badge: string;
  source: "draft" | "remix";
  rationale: string;
  score: VariantScoreCard;
};

type OrchestraPass = {
  id: "facts" | "brand" | "layouts" | "polish" | "rank";
  title: string;
  detail: string;
  status: OrchestraPassStatus;
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
  new Set(FALLBACK_CURRENCY_OPTIONS.map((code) => code.toUpperCase()))
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

function estimateTableBlockHeight(
  invoice: InvoiceState | undefined,
  compact = false
): number {
  const rowCount = Math.max(1, invoice?.lineItems?.length || 0);
  const headHeight = compact ? 26 : 34;
  const rowHeight = compact ? 22 : 30;
  const rowGap = compact ? 4 : 8;
  const summaryHeight = compact ? 66 : 92;
  const addButtonHeight = compact ? 0 : 30;
  return Math.ceil(
    headHeight +
      rowCount * rowHeight +
      Math.max(0, rowCount - 1) * rowGap +
      summaryHeight +
      addButtonHeight
  );
}

function optimizeCanvasBlocksForOutput(
  blocks: CanvasBlock[],
  invoice: InvoiceState | undefined,
  compact = false
): CanvasBlock[] {
  const nextBlocks = cloneBlocks(blocks);
  const tableIndex = nextBlocks.findIndex((block) => block.id === "table");
  if (tableIndex === -1) return nextBlocks;

  const notesIndex = nextBlocks.findIndex((block) => block.id === "notes");
  const footerTop = PAGE_HEIGHT - FOOTER_HEIGHT - 8;
  const blockGap = 12;
  const minNotesHeight = compact ? 34 : 48;
  const minimumTableHeight = estimateTableBlockHeight(invoice, compact);
  const tableBlock = { ...nextBlocks[tableIndex] };

  if (notesIndex === -1) {
    tableBlock.h = Math.min(
      Math.max(tableBlock.h, minimumTableHeight),
      footerTop - tableBlock.y
    );
    nextBlocks[tableIndex] = tableBlock;
    return nextBlocks;
  }

  const notesBlock = { ...nextBlocks[notesIndex] };
  const maxTableHeight = Math.max(
    tableBlock.h,
    footerTop - tableBlock.y - blockGap - minNotesHeight
  );
  tableBlock.h = Math.min(
    Math.max(tableBlock.h, minimumTableHeight),
    maxTableHeight
  );
  notesBlock.y = Math.max(notesBlock.y, tableBlock.y + tableBlock.h + blockGap);
  notesBlock.h = Math.max(minNotesHeight, footerTop - notesBlock.y);

  nextBlocks[tableIndex] = tableBlock;
  nextBlocks[notesIndex] = notesBlock;
  return nextBlocks;
}

function sanitizeCanvasBlocksForFinalize(
  blocks: CanvasBlock[],
  invoice?: InvoiceState
): CanvasBlock[] {
  return optimizeCanvasBlocksForOutput(blocks, invoice, true).map((block) => ({
    id: block.id,
    type: block.type,
    x: block.x,
    y: block.y,
    w: block.w,
    h: block.h,
    binding: block.binding?.key ? { key: block.binding.key } : undefined,
    style: block.style
      ? {
          fontSize:
            typeof block.style.fontSize === "number"
              ? block.style.fontSize
              : undefined,
          fontWeight:
            typeof block.style.fontWeight === "string"
              ? block.style.fontWeight
              : undefined,
          color:
            typeof block.style.color === "string"
              ? block.style.color
              : undefined,
          background:
            typeof block.style.background === "string"
              ? block.style.background
              : undefined,
          align:
            typeof block.style.align === "string"
              ? block.style.align
              : undefined,
          radius:
            typeof block.style.radius === "number"
              ? block.style.radius
              : undefined,
        }
      : undefined,
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
    .slice(0, 12000);
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

function ensureStyleTheme(
  style?: Partial<StyleTheme> | null,
  templateHint?: string
): StyleTheme {
  const templateId = style?.templateId || templateHint || "corporate";
  const baseStyle = BASE_STYLES[templateId] || BASE_STYLES.corporate;
  return {
    ...baseStyle,
    ...(style || {}),
    palette: {
      ...baseStyle.palette,
      ...((style && style.palette) || {}),
    },
  };
}

function ensurePalette(
  palette?: Partial<StylePalette> | null,
  templateHint?: string
): StylePalette {
  const basePalette = ensureStyleTheme(undefined, templateHint).palette;
  return {
    ...basePalette,
    ...(palette || {}),
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

const AI_TAB_OPTIONS: Array<{ id: AiTab; label: string; kicker: string }> = [
  { id: "create", label: "Create", kicker: "First generation" },
  { id: "variants", label: "Variants", kicker: "Multiple looks" },
  { id: "optimize", label: "Optimize", kicker: "Refine chosen design" },
];

const OPTIMIZE_ACTIONS = [
  "Make it more premium",
  "Make it more futuristic",
  "Improve spacing",
  "Improve trust signals",
  "Improve brand consistency",
  "Improve typography",
  "Make it more enterprise-safe",
] as const;

const VARIANT_BLUEPRINTS = [
  {
    key: "audit-ready",
    family: "Audit-Ready Professional",
    templateId: "corporate",
    title: "Safest",
    accentLabel: "Audit Ready",
    styleDirection: "Enterprise-safe clarity",
    summary: "High confidence hierarchy with boardroom-safe structure.",
    palette: { primary: "#1640D6", accent: "#5B8CFF", surfaceAlt: "#DCE7FF" },
  },
  {
    key: "editorial-luxe",
    family: "Editorial Luxe",
    templateId: "luxury",
    title: "Most Premium",
    accentLabel: "Premium",
    styleDirection: "Editorial luxury",
    summary: "Dark editorial contrast with elevated premium cues.",
    palette: { secondary: "#D6B16B", accent: "#F0DBAF", surface: "#FBF7F0" },
  },
  {
    key: "futuristic-glass",
    family: "Futuristic Glass",
    templateId: "corporate",
    title: "Most Futuristic",
    accentLabel: "Future",
    styleDirection: "Futuristic glass-fintech",
    summary: "Electric blue glassy direction with forward-leaning trust cues.",
    palette: {
      primary: "#003FAB",
      secondary: "#0B1021",
      accent: "#56C7FF",
      surfaceAlt: "#D9EEFF",
    },
  },
  {
    key: "minimal-swiss",
    family: "Minimal Swiss",
    templateId: "minimal",
    title: "Most Minimal",
    accentLabel: "Minimal",
    styleDirection: "Quiet Swiss grid",
    summary: "Whitespace-first professional layout with restrained confidence.",
    palette: { primary: "#0F172A", secondary: "#94A3B8", accent: "#CBD5E1" },
  },
  {
    key: "creative-studio",
    family: "Creative Studio",
    templateId: "creative",
    title: "Boldest",
    accentLabel: "Studio",
    styleDirection: "High-energy editorial",
    summary: "Expressive creative composition for standout billing.",
    palette: { primary: "#6D28D9", secondary: "#F97316", accent: "#FDBA74" },
  },
  {
    key: "payment-confidence",
    family: "Payment Confidence",
    templateId: "corporate",
    title: "Best for Payment Confidence",
    accentLabel: "Trust+",
    styleDirection: "Trust-led clarity",
    summary: "Designed to improve clarity, hierarchy, and payment confidence.",
    palette: {
      primary: "#0F3FB6",
      secondary: "#0F172A",
      accent: "#7AA5FF",
      surfaceAlt: "#E6EEFF",
    },
  },
  {
    key: "neo-fintech",
    family: "Neo Fintech",
    templateId: "creative",
    title: "Tech-forward",
    accentLabel: "Neo",
    styleDirection: "Modern fintech punch",
    summary: "Energetic fintech-inspired layout with vivid modern accents.",
    palette: {
      primary: "#5B21B6",
      secondary: "#0F172A",
      accent: "#60A5FA",
      surfaceAlt: "#EEF2FF",
    },
  },
  {
    key: "quiet-premium",
    family: "Quiet Premium",
    templateId: "minimal",
    title: "Quiet Premium",
    accentLabel: "Quiet",
    styleDirection: "Minimal but elevated",
    summary: "Low-noise layout with premium restraint and polished spacing.",
    palette: {
      primary: "#111827",
      secondary: "#B8A46B",
      accent: "#D6C49B",
      surface: "#FCFBF7",
    },
  },
  {
    key: "executive-blueprint",
    family: "Executive Blueprint",
    templateId: "corporate",
    title: "Boardroom",
    accentLabel: "Executive",
    styleDirection: "Executive precision",
    summary:
      "Sharp executive presentation for enterprise and procurement teams.",
    palette: {
      primary: "#153EAD",
      secondary: "#14213D",
      accent: "#90B4FF",
      surfaceAlt: "#E8EFFF",
    },
  },
  {
    key: "midnight-luxury",
    family: "Midnight Luxury",
    templateId: "luxury",
    title: "Dark Luxe",
    accentLabel: "Midnight",
    styleDirection: "Dark premium confidence",
    summary:
      "Confident midnight palette for high-value retainers and premium billing.",
    palette: {
      primary: "#0B1220",
      secondary: "#D4AF6A",
      accent: "#F2E1BC",
      surface: "#F8F5EE",
    },
  },
  {
    key: "clean-future",
    family: "Clean Future",
    templateId: "minimal",
    title: "Clean Future",
    accentLabel: "Future Lite",
    styleDirection: "Minimal futuristic calm",
    summary: "A restrained futuristic direction for clean but modern output.",
    palette: {
      primary: "#111827",
      secondary: "#38BDF8",
      accent: "#7DD3FC",
      surfaceAlt: "#F0F9FF",
    },
  },
  {
    key: "signature-editorial",
    family: "Signature Editorial",
    templateId: "luxury",
    title: "Signature",
    accentLabel: "Editorial",
    styleDirection: "Signature editorial confidence",
    summary: "Magazine-inspired presentation with premium typography signals.",
    palette: {
      primary: "#1F2937",
      secondary: "#C08457",
      accent: "#E9C9A8",
      surface: "#FFF9F2",
    },
  },
] as const;

function clampScore(value: number) {
  return Math.max(48, Math.min(99, Math.round(value)));
}

function adjustHexColor(hex: string, amount: number) {
  const normalized = String(hex || "")
    .replace("#", "")
    .trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return hex;
  const value = Number.parseInt(normalized, 16);
  const next = [16, 8, 0]
    .map((shift) => {
      const channel = (value >> shift) & 255;
      const adjusted = Math.max(0, Math.min(255, channel + amount));
      return adjusted.toString(16).padStart(2, "0");
    })
    .join("");
  return `#${next}`;
}

function buildPasses(
  activeId: OrchestraPass["id"] | null = null
): OrchestraPass[] {
  const sequence: OrchestraPass[] = [
    {
      id: "facts",
      title: "Pass 1 · Facts",
      detail:
        "Extract structured invoice facts from prompt, PDFs, and current fields.",
      status: "idle",
    },
    {
      id: "brand",
      title: "Pass 2 · Brand",
      detail: "Infer tone, client context, and brand posture from the brief.",
      status: "idle",
    },
    {
      id: "layouts",
      title: "Pass 3 · Layouts",
      detail:
        "Generate multiple layout systems while preserving the same billing data.",
      status: "idle",
    },
    {
      id: "polish",
      title: "Pass 4 · Polish",
      detail: "Tighten typography, spacing, trust cues, and visual rhythm.",
      status: "idle",
    },
    {
      id: "rank",
      title: "Pass 5 · Ranking",
      detail:
        "Score every variant for safest, boldest, premium, futuristic, and payment confidence.",
      status: "idle",
    },
  ];

  if (!activeId) return sequence;
  const activeIndex = sequence.findIndex((pass) => pass.id === activeId);
  return sequence.map((pass, index) => ({
    ...pass,
    status:
      index < activeIndex ? "done" : index === activeIndex ? "running" : "idle",
  }));
}

function inferBrandProfile(
  invoice: InvoiceState,
  prompt: string
): BrandInference {
  const text =
    `${prompt} ${invoice.notes} ${invoice.paymentTerms}`.toLowerCase();
  const issuer = `${invoice.issuerName} ${invoice.customerName}`.toLowerCase();
  const isCreative =
    /design|brand|creative|studio|campaign|ux|ui|video|photo/.test(
      text + issuer
    );
  const isEnterprise =
    /procurement|enterprise|board|compliance|saas|retainer|consulting/.test(
      text + issuer
    );
  const isTech =
    /ai|fintech|crypto|future|platform|automation|software|startup/.test(
      text + issuer
    );
  const industry = isCreative
    ? "Creative services"
    : isTech
    ? "Technology / product"
    : isEnterprise
    ? "Enterprise services"
    : "Professional services";
  const tone = isTech
    ? "Future-forward and sharp"
    : isCreative
    ? "Expressive and premium"
    : isEnterprise
    ? "Executive and trustworthy"
    : "Polished and professional";
  const recommendedFamily = isTech
    ? "Futuristic Glass"
    : isCreative
    ? "Editorial Luxe"
    : isEnterprise
    ? "Audit-Ready Professional"
    : "Modern Premium";
  const impression = `${
    invoice.issuerName || "This issuer"
  } reads as ${tone.toLowerCase()} with a ${industry.toLowerCase()} profile.`;
  const notes = [
    `${invoice.currency} billing with ${invoice.lineItems.length} line item${
      invoice.lineItems.length === 1 ? "" : "s"
    }`,
    invoice.taxPercentage !== "0.00"
      ? `Tax-aware (${invoice.taxPercentage}% tax)`
      : "Simple untaxed structure",
    invoice.paymentTerms || "Payment terms still editable",
  ];
  return { industry, tone, impression, recommendedFamily, notes };
}

function deriveFactHighlights(
  invoice: InvoiceState,
  prompt: string,
  attachmentCount: number
) {
  return [
    invoice.customerName
      ? `Client · ${invoice.customerName}`
      : "Client pending",
    `${invoice.currency} ${toMoney(invoice.amount) || "0.00"}`,
    invoice.dueDate ? `Due · ${invoice.dueDate}` : "Due date pending",
    invoice.lineItems.length
      ? `${invoice.lineItems.length} line item${
          invoice.lineItems.length === 1 ? "" : "s"
        }`
      : "Line items pending",
    attachmentCount
      ? `${attachmentCount} PDF attachment${attachmentCount === 1 ? "" : "s"}`
      : "No attachments yet",
    prompt.trim() ? "AI brief loaded" : "Add a prompt to guide AI",
  ].slice(0, 6);
}

function scoreVariant(
  option: InvoiceDraftOption,
  index: number
): VariantScoreCard {
  const resolvedStyle = ensureStyleTheme(option.style, option.templateId);
  const template = resolvedStyle.templateId;
  const title =
    `${option.title} ${option.accentLabel} ${option.summary}`.toLowerCase();
  const safestBase =
    template === "corporate" ? 92 : template === "minimal" ? 88 : 76;
  const boldestBase =
    template === "creative" ? 94 : template === "luxury" ? 84 : 68;
  const premiumBase =
    template === "luxury"
      ? 96
      : template === "creative"
      ? 82
      : template === "minimal"
      ? 79
      : 86;
  const futuristicBase = /future|fintech|glass|neo/.test(title)
    ? 95
    : template === "creative"
    ? 83
    : template === "corporate"
    ? 78
    : 64;
  const paymentConfidenceBase = /payment|audit|trust|executive/.test(title)
    ? 96
    : template === "corporate"
    ? 92
    : template === "minimal"
    ? 85
    : 80;

  return {
    safest: clampScore(safestBase - index),
    boldest: clampScore(boldestBase - (index % 3) * 2),
    premium: clampScore(premiumBase - (index % 4)),
    futuristic: clampScore(futuristicBase - (index % 5)),
    paymentConfidence: clampScore(paymentConfidenceBase - (index % 4)),
  };
}

function variantBadgeFromScore(score: VariantScoreCard) {
  const entries: Array<[string, number]> = [
    ["Safest", score.safest],
    ["Boldest", score.boldest],
    ["Premium", score.premium],
    ["Futuristic", score.futuristic],
    ["Payment confidence", score.paymentConfidence],
  ];
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

function makeOrchestraVariant(
  option: InvoiceDraftOption,
  index: number,
  familyOverride?: string,
  source: OrchestraVariant["source"] = "draft"
): OrchestraVariant {
  const resolvedStyle = ensureStyleTheme(option.style, option.templateId);
  const accentLabel = String(
    option.accentLabel || resolvedStyle.accentLabel || "Default"
  );
  const score = scoreVariant({ ...option, style: resolvedStyle }, index);
  return {
    ...option,
    templateId: option.templateId || resolvedStyle.templateId,
    style: resolvedStyle,
    accentLabel,
    id: `${option.templateId || resolvedStyle.templateId}-${index}-${accentLabel
      .toLowerCase()
      .replace(/\s+/g, "-")}`,
    family: familyOverride || resolvedStyle.styleName,
    badge: variantBadgeFromScore(score),
    source,
    rationale: option.summary || resolvedStyle.previewSummary,
    score,
  };
}

function rotateList<T>(items: readonly T[], offset: number) {
  if (!items.length) return [] as T[];
  const start = ((offset % items.length) + items.length) % items.length;
  const copy = [...items];
  return copy.slice(start).concat(copy.slice(0, start));
}

const LAYOUT_RECIPE_PRESETS = [
  {
    key: "split-hero",
    label: "Split Hero",
    summary: "Large hero amount with a crisp split information row.",
    patches: {
      logo: { x: 40, y: 42, w: 74, h: 74 },
      title: { x: 130, y: 44, w: 200, h: 24, style: { fontSize: 15 } },
      invoiceNumber: { x: 130, y: 76, w: 250, h: 42, style: { fontSize: 30 } },
      amount: { x: 390, y: 40, w: 165, h: 112 },
      issuer: { x: 40, y: 178, w: 245, h: 104 },
      customer: { x: 310, y: 178, w: 245, h: 104 },
      meta: { x: 40, y: 298, w: 515, h: 72 },
      table: { x: 40, y: 388, w: 515, h: 224 },
      notes: { x: 40, y: 628, w: 515, h: 96 },
    },
  },
  {
    key: "editorial-cards",
    label: "Editorial Cards",
    summary: "Three-card briefing row with a tall premium amount panel.",
    patches: {
      logo: { x: 40, y: 44, w: 62, h: 62 },
      title: { x: 118, y: 48, w: 320, h: 24, style: { fontSize: 15 } },
      invoiceNumber: { x: 40, y: 126, w: 360, h: 46, style: { fontSize: 33 } },
      amount: { x: 398, y: 66, w: 157, h: 150 },
      issuer: { x: 40, y: 260, w: 160, h: 130 },
      customer: { x: 212, y: 260, w: 160, h: 130 },
      meta: { x: 384, y: 260, w: 171, h: 130 },
      table: { x: 40, y: 412, w: 515, h: 232 },
      notes: { x: 40, y: 660, w: 515, h: 72 },
    },
  },
  {
    key: "left-rail",
    label: "Left Rail",
    summary:
      "Editorial left rail for branding, with ledger content on the right.",
    patches: {
      logo: { x: 40, y: 52, w: 76, h: 76 },
      title: { x: 40, y: 148, w: 132, h: 34, style: { fontSize: 14 } },
      invoiceNumber: { x: 40, y: 184, w: 132, h: 92, style: { fontSize: 26 } },
      amount: { x: 40, y: 294, w: 132, h: 118 },
      issuer: { x: 200, y: 48, w: 170, h: 128 },
      customer: { x: 385, y: 48, w: 170, h: 128 },
      meta: { x: 200, y: 192, w: 355, h: 86 },
      table: { x: 200, y: 296, w: 355, h: 340 },
      notes: { x: 40, y: 654, w: 515, h: 70 },
    },
  },
  {
    key: "center-stage",
    label: "Center Stage",
    summary: "Centered premium masthead with a symmetrical invoice story.",
    patches: {
      logo: { x: 257, y: 36, w: 82, h: 82 },
      title: { x: 188, y: 132, w: 220, h: 24, style: { fontSize: 14 } },
      invoiceNumber: { x: 108, y: 164, w: 380, h: 46, style: { fontSize: 34 } },
      amount: { x: 176, y: 230, w: 244, h: 96 },
      issuer: { x: 40, y: 346, w: 245, h: 96 },
      customer: { x: 310, y: 346, w: 245, h: 96 },
      meta: { x: 40, y: 458, w: 515, h: 60 },
      table: { x: 40, y: 534, w: 515, h: 146 },
      notes: { x: 40, y: 694, w: 515, h: 48 },
    },
  },
  {
    key: "top-band",
    label: "Top Band",
    summary: "Full-width briefing band with compact premium detail cards.",
    patches: {
      logo: { x: 44, y: 48, w: 68, h: 68 },
      title: { x: 130, y: 50, w: 160, h: 24, style: { fontSize: 15 } },
      invoiceNumber: { x: 130, y: 84, w: 190, h: 42, style: { fontSize: 28 } },
      amount: { x: 350, y: 46, w: 205, h: 88 },
      meta: { x: 40, y: 156, w: 515, h: 72 },
      issuer: { x: 40, y: 248, w: 160, h: 118 },
      customer: { x: 212, y: 248, w: 160, h: 118 },
      notes: { x: 384, y: 248, w: 171, h: 118 },
      table: { x: 40, y: 386, w: 515, h: 270 },
    },
  },
  {
    key: "magazine-column",
    label: "Magazine Column",
    summary: "Magazine-style column rhythm with a floating premium total.",
    patches: {
      logo: { x: 40, y: 48, w: 72, h: 72 },
      title: { x: 130, y: 48, w: 300, h: 24, style: { fontSize: 15 } },
      invoiceNumber: { x: 130, y: 82, w: 300, h: 42, style: { fontSize: 31 } },
      amount: { x: 390, y: 160, w: 165, h: 120 },
      meta: { x: 40, y: 166, w: 320, h: 104 },
      issuer: { x: 40, y: 286, w: 248, h: 112 },
      customer: { x: 307, y: 286, w: 248, h: 112 },
      table: { x: 40, y: 420, w: 515, h: 230 },
      notes: { x: 40, y: 666, w: 515, h: 60 },
    },
  },
] as const;

function pickLayoutRecipe(seed: number) {
  return LAYOUT_RECIPE_PRESETS[Math.abs(seed) % LAYOUT_RECIPE_PRESETS.length];
}

function remixPalette(
  palette: Partial<StylePalette> | undefined,
  seed: number,
  templateHint?: string
): StylePalette {
  const safePalette = ensurePalette(palette, templateHint);
  const tonalOffsets = [-16, -10, -4, 6, 12, 18, 24];
  const accentOffsets = [22, 16, 10, 4, -6, -12, -18];
  const toneOffset = tonalOffsets[Math.abs(seed) % tonalOffsets.length];
  const accentOffset = accentOffsets[Math.abs(seed + 3) % accentOffsets.length];

  return {
    ...safePalette,
    primary: adjustHexColor(safePalette.primary, toneOffset),
    secondary: adjustHexColor(
      safePalette.secondary,
      Math.round(toneOffset / 2)
    ),
    accent: adjustHexColor(safePalette.accent, accentOffset),
    surface: adjustHexColor(safePalette.surface, Math.round(toneOffset / 5)),
    surfaceAlt: adjustHexColor(
      safePalette.surfaceAlt,
      Math.round(accentOffset / 6)
    ),
    muted: adjustHexColor(safePalette.muted, Math.round(toneOffset / 3)),
    text: safePalette.text,
  };
}

function applyLayoutPatches(
  blocks: CanvasBlock[],
  patches: Record<
    string,
    Partial<CanvasBlock> & { style?: Record<string, string | number> }
  >
) {
  return cloneBlocks(blocks).map((block) => {
    const patch = patches[block.id];
    if (!patch) return block;
    const { style, ...rest } = patch;
    return {
      ...block,
      ...rest,
      style: style ? { ...(block.style || {}), ...style } : block.style,
    };
  });
}

function createRemixedBlocks(
  templateId: string,
  palette: StylePalette,
  seed: number
) {
  const recipe = pickLayoutRecipe(seed);
  const baseBlocks = applyLayoutPatches(
    defaultBlocks(templateId),
    recipe.patches
  );
  const cardBackground =
    templateId === "luxury" ? palette.surfaceAlt : palette.surface;
  const panelBackground =
    templateId === "luxury"
      ? adjustHexColor(palette.surfaceAlt, 8)
      : palette.surfaceAlt;
  const numberColor = templateId === "luxury" ? "#FFFFFF" : palette.text;

  return baseBlocks.map((block, index) => {
    if (block.id === "logo") {
      return {
        ...block,
        z: index + 1,
        style: {
          ...(block.style || {}),
          radius: 20 + ((seed + index) % 12),
          background: templateId === "luxury" ? palette.surfaceAlt : "#FFFFFF",
        },
      };
    }

    if (block.id === "title") {
      return {
        ...block,
        z: index + 1,
        style: {
          ...(block.style || {}),
          color: templateId === "luxury" ? palette.secondary : palette.accent,
          fontWeight: "700",
          letterSpacing: 0.2,
        },
      };
    }

    if (block.id === "invoiceNumber") {
      return {
        ...block,
        z: index + 1,
        style: {
          ...(block.style || {}),
          color: numberColor,
          fontWeight: "800",
        },
      };
    }

    if (block.id === "amount") {
      return {
        ...block,
        z: index + 1,
        style: {
          ...(block.style || {}),
          background: palette.accent,
          color: palette.primary,
          radius: 24 + ((seed + index) % 14),
        },
      };
    }

    if (block.id === "issuer" || block.id === "customer") {
      return {
        ...block,
        z: index + 1,
        style: {
          ...(block.style || {}),
          background: cardBackground,
          color: templateId === "luxury" ? "#F8FAFC" : palette.text,
          radius: 18 + ((seed + index) % 10),
          fontWeight: "600",
        },
      };
    }

    if (block.id === "meta") {
      return {
        ...block,
        z: index + 1,
        style: {
          ...(block.style || {}),
          background: panelBackground,
          color: templateId === "luxury" ? palette.accent : palette.muted,
          radius: 18 + ((seed + index) % 10),
        },
      };
    }

    if (block.id === "table") {
      return {
        ...block,
        z: index + 1,
        style: {
          ...(block.style || {}),
          background:
            templateId === "luxury"
              ? adjustHexColor(palette.surface, 4)
              : "#FFFFFF",
          radius: 20 + ((seed + index) % 12),
        },
      };
    }

    if (block.id === "notes") {
      return {
        ...block,
        z: index + 1,
        style: {
          ...(block.style || {}),
          background: panelBackground,
          color: templateId === "luxury" ? palette.accent : palette.muted,
          radius: 18 + ((seed + index) % 10),
        },
      };
    }

    return { ...block, z: index + 1 };
  });
}

function buildVariantFromBlueprint(
  invoice: InvoiceState,
  blueprint: (typeof VARIANT_BLUEPRINTS)[number],
  index: number,
  remixSeed = 0
): OrchestraVariant {
  const safeInvoiceStyle = ensureStyleTheme(
    invoice.style,
    blueprint.templateId
  );
  const baseStyle = BASE_STYLES[blueprint.templateId] || BASE_STYLES.corporate;
  const paletteOverride = blueprint.palette as Partial<StylePalette>;
  const rawPalette = {
    ...safeInvoiceStyle.palette,
    ...baseStyle.palette,
    ...paletteOverride,
    surface: paletteOverride.surface || baseStyle.palette.surface,
  };
  const palette = remixPalette(
    rawPalette,
    remixSeed + index,
    blueprint.templateId
  );
  const style = mergeStyle(baseStyle, palette);
  const recipe = pickLayoutRecipe(remixSeed + index);
  const family = `${blueprint.family} · ${recipe.label}`;
  const summary = `${blueprint.summary} ${recipe.summary}`;
  const option: InvoiceDraftOption = {
    title: blueprint.title,
    accentLabel: blueprint.accentLabel,
    templateId: style.templateId,
    styleDirection: `${blueprint.styleDirection} · ${recipe.label}`,
    style: {
      ...style,
      styleName: family,
      accentLabel: blueprint.accentLabel,
      tone: `${blueprint.styleDirection} · ${recipe.label}`,
      previewSummary: summary,
      heroCopy: summary,
    },
    blocks: createRemixedBlocks(style.templateId, palette, remixSeed + index),
    summary,
  };
  const variant = makeOrchestraVariant(option, index, family, "remix");
  return {
    ...variant,
    id: `${variant.id}-${(remixSeed + index).toString(36)}`,
    rationale: summary,
  };
}

function remixDraftOption(
  option: InvoiceDraftOption,
  invoice: InvoiceState,
  remixSeed: number,
  index: number
) {
  const safeInvoiceStyle = ensureStyleTheme(invoice.style);
  const optionStyle = ensureStyleTheme(
    option.style,
    option.templateId || safeInvoiceStyle.templateId
  );
  const templateId =
    optionStyle.templateId || option.templateId || safeInvoiceStyle.templateId;
  const baseStyle = BASE_STYLES[templateId] || BASE_STYLES.corporate;
  const recipe = pickLayoutRecipe(remixSeed + index + 1);
  const palette = remixPalette(
    {
      ...baseStyle.palette,
      ...safeInvoiceStyle.palette,
      ...(optionStyle.palette || {}),
    },
    remixSeed + index + 11,
    templateId
  );
  const style = mergeStyle(baseStyle, palette);
  const family = `${
    optionStyle.styleName || option.title || "Invoice remix"
  } · ${recipe.label}`;
  const summary = `${
    option.summary || optionStyle.previewSummary || style.previewSummary
  } ${recipe.summary}`.trim();
  const resolvedTone = option.styleDirection || optionStyle.tone || style.tone;
  const variant = makeOrchestraVariant(
    {
      ...option,
      templateId: style.templateId,
      styleDirection: `${resolvedTone} · ${recipe.label}`,
      style: {
        ...optionStyle,
        ...style,
        styleName: family,
        accentLabel: option.accentLabel,
        palette,
        tone: `${resolvedTone} · ${recipe.label}`,
        previewSummary: summary,
        heroCopy: `${optionStyle.heroCopy || style.heroCopy || ""} ${
          recipe.summary
        }`.trim(),
      },
      blocks: createRemixedBlocks(
        style.templateId,
        palette,
        remixSeed + index + 1
      ),
      summary,
    },
    index,
    family,
    "remix"
  );

  return {
    ...variant,
    id: `${variant.id}-${(remixSeed + index).toString(36)}`,
    rationale: summary,
  };
}

function synthesizeVariantPool(
  existing: InvoiceDraftOption[],
  invoice: InvoiceState,
  desiredCount: number,
  remixSeed = 0
) {
  const seed = Math.abs(remixSeed || 1);
  const remixedExisting = existing.map((option, index) =>
    remixDraftOption(option, invoice, seed, index)
  );
  const usedFamilies = new Set(
    remixedExisting.map((variant) => variant.family)
  );
  const remixedFallbacks: OrchestraVariant[] = [];

  for (const [offset, blueprint] of rotateList(
    VARIANT_BLUEPRINTS,
    seed
  ).entries()) {
    if (remixedExisting.length + remixedFallbacks.length >= desiredCount) break;
    const candidate = buildVariantFromBlueprint(
      invoice,
      blueprint,
      remixedExisting.length + remixedFallbacks.length,
      seed + offset
    );
    if (usedFamilies.has(candidate.family)) continue;
    remixedFallbacks.push(candidate);
    usedFamilies.add(candidate.family);
  }

  return [...remixedExisting, ...remixedFallbacks].slice(0, desiredCount);
}

function buildOptimizationVariant(
  invoice: InvoiceState,
  action: (typeof OPTIMIZE_ACTIONS)[number],
  index: number
) {
  const mapping: Record<
    (typeof OPTIMIZE_ACTIONS)[number],
    (typeof VARIANT_BLUEPRINTS)[number]["key"]
  > = {
    "Make it more premium": "editorial-luxe",
    "Make it more futuristic": "futuristic-glass",
    "Improve spacing": "minimal-swiss",
    "Improve trust signals": "payment-confidence",
    "Improve brand consistency": "signature-editorial",
    "Improve typography": "quiet-premium",
    "Make it more enterprise-safe": "audit-ready",
  };
  const blueprint =
    VARIANT_BLUEPRINTS.find((item) => item.key === mapping[action]) ||
    VARIANT_BLUEPRINTS[0];
  const variant = buildVariantFromBlueprint(invoice, blueprint, index);
  return {
    ...variant,
    id: `${variant.id}-optimized-${index}`,
    title: action,
    rationale: `AI optimization pass applied: ${action.toLowerCase()}.`,
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
  const resolvedBlocks = readOnly
    ? optimizeCanvasBlocksForOutput(blocks, invoice, true)
    : blocks;
  const orderedBlocks = [...resolvedBlocks].sort(
    (a, b) => (a.z || 0) - (b.z || 0)
  );

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
                    <span className="canvas-logo-placeholder-badge">Logo</span>
                    <span className="canvas-logo-placeholder-copy">
                      Upload brand mark
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
              <div
                className={`canvas-table-shell${
                  readOnly ? " is-readonly" : ""
                }`}
              >
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
                      {readOnly ? (
                        <span className="canvas-static-field is-description">
                          {item.description}
                        </span>
                      ) : (
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
                      )}
                      {readOnly ? (
                        <span className="canvas-static-field is-number">
                          {item.quantity}
                        </span>
                      ) : (
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
                      )}
                      {readOnly ? (
                        <span className="canvas-static-field is-number">
                          {item.unitPrice}
                        </span>
                      ) : (
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
                      )}
                      {readOnly ? (
                        <span className="canvas-static-field is-currency">
                          {invoice.currency}
                        </span>
                      ) : (
                        <input
                          className="canvas-inline-input is-readonly canvas-table-currency"
                          value={invoice.currency}
                          readOnly
                        />
                      )}
                      {readOnly ? (
                        <span className="canvas-static-field is-number is-amount">
                          {item.amount}
                        </span>
                      ) : (
                        <input
                          className="canvas-inline-input is-readonly"
                          value={item.amount}
                          onChange={(event) =>
                            onUpdateLineItem(
                              index,
                              "amount",
                              event.target.value
                            )
                          }
                          readOnly
                        />
                      )}
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
                      {readOnly ? (
                        <span className="canvas-summary-rate">
                          {invoice.discountPercentage}
                        </span>
                      ) : (
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
                      )}
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
                      {readOnly ? (
                        <span className="canvas-summary-rate">
                          {invoice.taxPercentage}
                        </span>
                      ) : (
                        <input
                          className="canvas-inline-input canvas-inline-tax-rate"
                          value={invoice.taxPercentage}
                          onChange={(event) =>
                            onUpdateInvoice({
                              taxPercentage: event.target.value,
                            })
                          }
                          readOnly={readOnly}
                          aria-label="GST, tax, or VAT percentage"
                        />
                      )}
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
  const [aiTab, setAiTab] = useState<AiTab>("create");
  const [variantCount, setVariantCount] = useState<4 | 8 | 12>(4);
  const [orchestraPasses, setOrchestraPasses] = useState<OrchestraPass[]>(() =>
    buildPasses()
  );
  const [scoredVariants, setScoredVariants] = useState<OrchestraVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [optimizationHistory, setOptimizationHistory] = useState<string[]>([]);
  const [assistantCommand, setAssistantCommand] = useState("");
  const [assistantStatus, setAssistantStatus] =
    useState<AssistantStatus>("idle");
  const [assistantFeedback, setAssistantFeedback] = useState(
    "Ask naturally — I will update only the parts you mention on the current canvas."
  );
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [showDesignExplorer, setShowDesignExplorer] = useState(false);
  const assistantAutoApplyVariantRef = useRef(false);
  const assistantDesignDirectionRef = useRef("");
  const dragRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const canvasStageRef = useRef<HTMLElement | null>(null);
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const assistantInputRef = useRef<HTMLTextAreaElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const voiceSilenceTimeoutRef = useRef<number | null>(null);
  const voiceShouldAutoApplyRef = useRef(false);
  const voiceManualStopRef = useRef(false);
  const voiceTranscriptRef = useRef("");
  const voiceLastResultAtRef = useRef(0);
  const [canvasScale, setCanvasScale] = useState(1);
  const hasAiDraft = Boolean(aiPrompt.trim() || aiPromptSummary.trim());
  const brandInference = useMemo(
    () => inferBrandProfile(invoice, aiPrompt),
    [invoice, aiPrompt]
  );
  const factHighlights = useMemo(
    () => deriveFactHighlights(invoice, aiPrompt, attachments.length),
    [invoice, aiPrompt, attachments.length]
  );
  const selectedOrchestraVariant = useMemo(
    () =>
      scoredVariants.find((variant) => variant.id === selectedVariantId) ||
      null,
    [scoredVariants, selectedVariantId]
  );

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
    setSpeechSupported(
      typeof window !== "undefined" &&
        Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

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
    setShowDesignExplorer(false);
    window.requestAnimationFrame(() => {
      assistantInputRef.current?.focus();
      assistantInputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
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
    setAiTab("create");
    setOrchestraPasses(buildPasses());
  }

  function scrollCanvasIntoView() {
    window.requestAnimationFrame(() => {
      canvasStageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function openPdfPreview() {
    setPdfPreviewOpen(true);
  }

  function stopVoiceCapture(shouldApply = false) {
    voiceManualStopRef.current = true;
    voiceShouldAutoApplyRef.current = shouldApply;
    if (voiceSilenceTimeoutRef.current) {
      window.clearTimeout(voiceSilenceTimeoutRef.current);
      voiceSilenceTimeoutRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        speechRecognitionRef.current = null;
      }
      return;
    }

    const normalizedTranscript = normalizeAssistantValue(
      voiceTranscriptRef.current || assistantTranscript || assistantCommand
    );
    setAssistantStatus("idle");
    if (shouldApply && normalizedTranscript) {
      setAssistantFeedback("Applying your voice instruction…");
      setAssistantCommand(normalizedTranscript);
      void applyAssistantCommand(normalizedTranscript);
      return;
    }
    setAssistantFeedback("Voice capture stopped.");
  }

  function toggleVoiceCapture() {
    if (assistantStatus === "listening") {
      stopVoiceCapture(true);
      setAssistantFeedback("Got it — interpreting your voice instruction…");
      return;
    }

    const RecognitionCtor =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;
    if (!RecognitionCtor) {
      showToast({
        tone: "error",
        title: "Voice input unavailable",
        description: "This browser does not support live voice capture here.",
      });
      return;
    }

    const recognition = new RecognitionCtor();
    speechRecognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    let finalTranscript = "";

    const scheduleVoiceAutoStop = () => {
      if (voiceSilenceTimeoutRef.current) {
        window.clearTimeout(voiceSilenceTimeoutRef.current);
      }
      voiceSilenceTimeoutRef.current = window.setTimeout(() => {
        voiceShouldAutoApplyRef.current = true;
        setAssistantFeedback(
          "I heard enough — taking a moment to interpret your request before applying it."
        );
        try {
          recognition.stop();
        } catch {
          speechRecognitionRef.current = null;
        }
      }, 4200);
    };

    recognition.onstart = () => {
      voiceManualStopRef.current = false;
      voiceShouldAutoApplyRef.current = false;
      voiceTranscriptRef.current = "";
      voiceLastResultAtRef.current = Date.now();
      setAssistantStatus("listening");
      setAssistantFeedback(
        "Listening… speak naturally. I will wait for a full thought, and if confidence is low I will ask before changing anything."
      );
      setAssistantTranscript("");
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (
        let index = event.resultIndex || 0;
        index < (event.results?.length || 0);
        index += 1
      ) {
        const result = event.results[index];
        const nextChunk = String(result?.[0]?.transcript || "").trim();
        if (!nextChunk) continue;
        if (result?.isFinal) {
          finalTranscript = normalizeAssistantValue(
            `${finalTranscript} ${nextChunk}`
          );
        } else {
          interimTranscript = `${interimTranscript} ${nextChunk}`;
        }
      }
      const liveTranscript = normalizeAssistantValue(
        `${finalTranscript} ${interimTranscript}`
      );
      if (!liveTranscript) return;
      voiceLastResultAtRef.current = Date.now();
      voiceTranscriptRef.current = liveTranscript;
      setAssistantTranscript(liveTranscript);
      setAssistantCommand(liveTranscript);
      scheduleVoiceAutoStop();
    };

    recognition.onerror = (event: any) => {
      speechRecognitionRef.current = null;
      if (voiceSilenceTimeoutRef.current) {
        window.clearTimeout(voiceSilenceTimeoutRef.current);
        voiceSilenceTimeoutRef.current = null;
      }
      if (voiceManualStopRef.current && event?.error === "aborted") {
        setAssistantStatus("idle");
        return;
      }
      setAssistantStatus("idle");
      setAssistantFeedback(
        "I could not hear that clearly. Please be a bit more specific, or type the instruction."
      );
    };

    recognition.onend = () => {
      speechRecognitionRef.current = null;
      if (voiceSilenceTimeoutRef.current) {
        window.clearTimeout(voiceSilenceTimeoutRef.current);
        voiceSilenceTimeoutRef.current = null;
      }
      const normalizedTranscript = normalizeAssistantValue(
        finalTranscript ||
          voiceTranscriptRef.current ||
          assistantTranscript ||
          assistantCommand
      );
      const endedTooSoon =
        !voiceManualStopRef.current &&
        !voiceShouldAutoApplyRef.current &&
        Boolean(normalizedTranscript) &&
        Date.now() - voiceLastResultAtRef.current < 1800;
      const likelyIncompleteTranscript =
        !voiceManualStopRef.current &&
        isAssistantTranscriptLikelyIncomplete(normalizedTranscript);

      if (endedTooSoon || likelyIncompleteTranscript) {
        try {
          voiceShouldAutoApplyRef.current = false;
          speechRecognitionRef.current = recognition;
          recognition.start();
          return;
        } catch {
          speechRecognitionRef.current = null;
        }
      }

      if (
        normalizedTranscript &&
        (voiceShouldAutoApplyRef.current || !voiceManualStopRef.current)
      ) {
        setAssistantCommand(normalizedTranscript);
        void applyAssistantCommand(normalizedTranscript);
        return;
      }
      setAssistantStatus("idle");
    };

    recognition.start();
  }

  function handleAssistantKeyDown(
    event: ReactKeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void applyAssistantCommand();
    }
  }

  async function interpretAssistantWithAi(command: string) {
    const response = await fetch(`${API_BASE}/invoices/canvas-assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command,
        invoice,
        blocks,
        selectedBlockId,
        selectedBlock:
          blocks.find((block) => block.id === selectedBlockId) || null,
        aiPrompt,
        aiPromptSummary,
        attachments: attachments.map((file) => file.name),
        selectedVariantId,
        showDesignExplorer,
        variantCount,
        assistantMode: "scoped-canvas-editor",
        allowMessyInput: true,
        preserveUntouchedCanvas: true,
        canvasOnly: true,
        instructions:
          "Behave like an elite personal canvas assistant. The user may speak in any style: messy, indirect, emotional, overlong, shorthand, typo-heavy, or voice-transcribed. Infer the real goal without requiring structured commands. Prioritize correctly understanding intent, value, fact, and wish even when the user says them in unusual order. Update the most likely invoice field, note, line item, quantity, unit price, currency, or design setting from context. Be especially strong at add-item requests such as add this item, add like, include a service, put another line item, append a charge, or any similar phrasing. Preserve untouched canvas content. Only change layout when the user clearly asks for layout, remix, reset, redesign, or new looks. If the request is broad but still understandable, make the best professional update instead of asking the user to rephrase. When intent is only partially clear but still plausibly actionable, proceed with the best-fit canvas update instead of asking the user to structure the prompt. If confidence is not high enough, ask one concise follow-up instead of guessing. Never directly edit amount due or total amount as free text because they are calculated fields; instead prefer quantity, unit price, tax, discount, currency, or line-item changes. When they mention a line item by description, infer the closest matching line item and update its quantity or price. If a request is still too vague or unnecessary to execute safely, ask for a more specific instruction.",
      }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(
        json?.error?.message || "Could not interpret the assistant command."
      );
    }
    return (json.data || {}) as AssistantCanvasResponse;
  }

  async function applyAssistantCommand(rawCommand = assistantCommand) {
    const command = normalizeAssistantValue(rawCommand);
    if (
      !command ||
      assistantStatus === "thinking" ||
      assistantStatus === "applying"
    ) {
      return;
    }

    const layoutIntent = hasAssistantLayoutIntent(command);
    const selectedBlock =
      blocks.find((block) => block.id === selectedBlockId) || null;
    const segments = splitAssistantCommandIntoSegments(command);

    const updateSelectedBlockText = (
      baseInvoice: InvoiceState,
      baseBlocks: CanvasBlock[],
      nextText: string
    ) => {
      if (!selectedBlock) {
        return { invoice: baseInvoice, blocks: baseBlocks, changed: false };
      }
      const bindingKey = selectedBlock.binding?.key;
      if (bindingKey === "amount") {
        return { invoice: baseInvoice, blocks: baseBlocks, changed: false };
      }
      if (bindingKey === "invoiceNumber") {
        return {
          invoice: { ...baseInvoice, invoiceNumber: nextText },
          blocks: baseBlocks,
          changed: true,
        };
      }
      if (bindingKey === "issuerName") {
        return {
          invoice: { ...baseInvoice, issuerName: nextText },
          blocks: baseBlocks,
          changed: true,
        };
      }
      if (bindingKey === "issuerEmail") {
        return {
          invoice: { ...baseInvoice, issuerEmail: nextText },
          blocks: baseBlocks,
          changed: true,
        };
      }
      if (bindingKey === "issuerAddress") {
        return {
          invoice: { ...baseInvoice, issuerAddress: nextText },
          blocks: baseBlocks,
          changed: true,
        };
      }
      if (bindingKey === "customerName") {
        return {
          invoice: { ...baseInvoice, customerName: nextText },
          blocks: baseBlocks,
          changed: true,
        };
      }
      if (bindingKey === "notes") {
        return {
          invoice: { ...baseInvoice, notes: nextText },
          blocks: baseBlocks,
          changed: true,
        };
      }
      if (bindingKey === "paymentTerms") {
        return {
          invoice: { ...baseInvoice, paymentTerms: nextText },
          blocks: baseBlocks,
          changed: true,
        };
      }
      if (bindingKey === "accentLabel") {
        return {
          invoice: { ...baseInvoice, accentLabel: nextText },
          blocks: baseBlocks,
          changed: true,
        };
      }
      if (bindingKey === "headerTitle") {
        return {
          invoice: {
            ...baseInvoice,
            style: { ...baseInvoice.style, headerTitle: nextText },
          },
          blocks: baseBlocks,
          changed: true,
        };
      }
      if (bindingKey === "heroCopy") {
        return {
          invoice: {
            ...baseInvoice,
            style: { ...baseInvoice.style, heroCopy: nextText },
          },
          blocks: baseBlocks,
          changed: true,
        };
      }
      return {
        invoice: baseInvoice,
        blocks: baseBlocks.map((block) =>
          block.id === selectedBlock.id
            ? { ...block, content: nextText }
            : block
        ),
        changed: true,
      };
    };

    const replaceEverywhere = (
      baseInvoice: InvoiceState,
      baseBlocks: CanvasBlock[],
      searchText: string,
      nextText: string
    ) => {
      const needle = searchText.trim();
      if (!needle) {
        return { invoice: baseInvoice, blocks: baseBlocks, changed: false };
      }
      let changed = false;
      const replaceIn = (value: string) => {
        if (!value || !value.includes(needle)) return value;
        changed = true;
        return value.split(needle).join(nextText);
      };
      const invoicePatch: InvoiceState = {
        ...baseInvoice,
        invoiceNumber: replaceIn(baseInvoice.invoiceNumber),
        customerName: replaceIn(baseInvoice.customerName),
        notes: replaceIn(baseInvoice.notes),
        paymentTerms: replaceIn(baseInvoice.paymentTerms),
        issuerName: replaceIn(baseInvoice.issuerName),
        issuerEmail: replaceIn(baseInvoice.issuerEmail),
        issuerAddress: replaceIn(baseInvoice.issuerAddress),
        issueDate: replaceIn(baseInvoice.issueDate),
        dueDate: replaceIn(baseInvoice.dueDate),
        accentLabel: replaceIn(baseInvoice.accentLabel),
        lineItems: baseInvoice.lineItems.map((item) => ({
          ...item,
          description: replaceIn(item.description),
        })),
        style: {
          ...baseInvoice.style,
          headerTitle: replaceIn(baseInvoice.style.headerTitle),
          heroCopy: replaceIn(baseInvoice.style.heroCopy),
        },
      };
      const blockPatch = baseBlocks.map((block) => {
        if (!block.content || !block.content.includes(needle)) return block;
        changed = true;
        return { ...block, content: replaceIn(block.content) };
      });
      return { invoice: invoicePatch, blocks: blockPatch, changed };
    };

    const applyLocalAssistantPass = () => {
      let nextInvoice = normalizeInvoiceState(invoice, today);
      let nextBlocks = cloneBlocks(blocks);
      let appliedLabels: string[] = [];
      let nextShowDesignExplorer = showDesignExplorer;
      let generateLooks = false;
      let summary = "";
      assistantAutoApplyVariantRef.current = false;
      assistantDesignDirectionRef.current = "";

      const pushLabel = (label: string) => {
        if (!appliedLabels.includes(label)) appliedLabels.push(label);
      };

      const parseMoneyValue = (value: string) => {
        const numberMatch = value.match(/\d[\d,.]*/);
        return numberMatch ? toMoney(numberMatch[0].replace(/,/g, "")) : "";
      };

      const applyAmountTarget = (_value: string) => {
        return false;
      };

      const applyLineItemTarget = (
        hint: string,
        field: "quantity" | "unitPrice" | "amount",
        value: string
      ) => {
        const parsedValue = parseMoneyValue(value);
        if (!parsedValue) return false;
        const result = updateInvoiceLineItemFieldByHint(
          nextInvoice,
          hint,
          field,
          parsedValue
        );
        if (!result.changed) return false;
        nextInvoice = result.invoice;
        pushLabel(
          field === "quantity" ? "line item quantity" : "line item price"
        );
        summary =
          summary ||
          `Updated ${
            result.matchedDescription || "the matched line item"
          } on the current canvas.`;
        return true;
      };

      const extractLooseNumericValue = (segment: string) => {
        const match = segment.match(/[$€£₹]?\s*-?\d[\d,]*(?:\.\d{1,2})?/);
        return match?.[0] ? normalizeAssistantValue(match[0]) : "";
      };

      const extractLooseValueTail = (segment: string) => {
        return cleanupAssistantLooseValue(
          segment
            .replace(/^(?:please|pls|just|kindly)\s+/i, "")
            .replace(
              /^(?:can\s+you|could\s+you|would\s+you|will\s+you|i\s+want\s+you\s+to|i\s+need\s+you\s+to|help\s+me\s+to)\s+/i,
              ""
            )
            .replace(
              /^(?:make|change|set|update|rewrite|replace|turn|switch|move|put|keep|adjust|fix)\s+/i,
              ""
            )
            .replace(
              /\b(?:the|current|canvas|invoice|field|value|text|section|block)\b/gi,
              " "
            )
            .replace(
              /\b(?:to|as|with|into|for|be|is|become|becomes|should|needs\s+to|needs\s+to\s+be|should\s+be)\b/gi,
              " "
            )
            .replace(/\s+/g, " ")
        );
      };

      const extractLooseLineItemHint = (segment: string) => {
        return cleanupAssistantLooseValue(
          segment
            .replace(/[$€£₹]?\s*-?\d[\d,]*(?:\.\d{1,2})?/g, " ")
            .replace(
              /\b(?:line\s+item|item|items|qty|quantity|price|rate|unit\s+price|amount|update|change|set|make|to|as|with|is|be|should|needs\s+to|needs\s+to\s+be|should\s+be|please|pls|just)\b/gi,
              " "
            )
            .replace(/\s+/g, " ")
        );
      };

      const tryBestEffortAssistantInference = (segment: string) => {
        const lower = segment.toLowerCase();
        const looseNumericValue = extractLooseNumericValue(segment);
        const looseTailValue = extractLooseValueTail(segment);
        const looseLineItemHint = extractLooseLineItemHint(segment);
        const emailMatch = segment.match(
          /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
        );
        const domainMatch = segment.match(/\b[a-z0-9.-]+\.[a-z]{2,}\b/i);

        const candidates: Array<{
          score: number;
          run: () => boolean;
        }> = [];

        const addCandidate = (score: number, run: () => boolean) => {
          candidates.push({ score, run });
        };

        if (
          looseLineItemHint &&
          looseNumericValue &&
          /\b(qty|quantity)\b/i.test(lower)
        ) {
          addCandidate(5, () =>
            applyLineItemTarget(
              looseLineItemHint,
              "quantity",
              looseNumericValue
            )
          );
        }

        if (
          looseLineItemHint &&
          looseNumericValue &&
          /\b(price|rate|unit price)\b/i.test(lower)
        ) {
          addCandidate(5, () =>
            applyLineItemTarget(
              looseLineItemHint,
              "unitPrice",
              looseNumericValue
            )
          );
        }

        if (
          looseNumericValue &&
          (/\b(amount|total|due|balance|payable)\b/i.test(lower) ||
            selectedBlock?.binding?.key === "amount")
        ) {
          addCandidate(selectedBlock?.binding?.key === "amount" ? 4.5 : 4, () =>
            applyAmountTarget(looseNumericValue)
          );
        }

        if (
          looseTailValue &&
          (/\b(note|notes|message|mention|say|tell\s+them|let\s+them\s+know)\b/i.test(
            lower
          ) ||
            selectedBlock?.binding?.key === "notes")
        ) {
          addCandidate(
            selectedBlock?.binding?.key === "notes" ? 4 : 3.4,
            () => {
              nextInvoice = { ...nextInvoice, notes: looseTailValue };
              pushLabel("notes");
              summary =
                summary || "Updated the invoice note on the current canvas.";
              return true;
            }
          );
        }

        if (
          (emailMatch?.[0] || domainMatch?.[0] || looseTailValue) &&
          (/\b(bill|bill to|client|customer)\b/i.test(lower) ||
            /\b(send|invoice|charge)\b.*\b(to|for)\b/i.test(lower) ||
            selectedBlock?.binding?.key === "customerName")
        ) {
          const nextCustomerValue = cleanupAssistantLooseValue(
            emailMatch?.[0] || domainMatch?.[0] || looseTailValue
          );
          addCandidate(
            selectedBlock?.binding?.key === "customerName" ? 4 : 3.6,
            () => {
              nextInvoice = { ...nextInvoice, customerName: nextCustomerValue };
              pushLabel("customer");
              summary =
                summary || "Updated the bill-to details on the current canvas.";
              return true;
            }
          );
        }

        if (
          emailMatch?.[0] &&
          (/\b(issuer|biller|sender|from|company)\b/i.test(lower) ||
            selectedBlock?.binding?.key === "issuerEmail")
        ) {
          const nextIssuerEmail = cleanupAssistantLooseValue(emailMatch[0]);
          addCandidate(
            selectedBlock?.binding?.key === "issuerEmail" ? 4 : 3.2,
            () => {
              nextInvoice = { ...nextInvoice, issuerEmail: nextIssuerEmail };
              pushLabel("issuer email");
              summary =
                summary || "Updated the sender email on the current canvas.";
              return true;
            }
          );
        }

        if (
          looseTailValue &&
          (/\b(term|terms|net)\b/i.test(lower) ||
            selectedBlock?.binding?.key === "paymentTerms")
        ) {
          addCandidate(
            selectedBlock?.binding?.key === "paymentTerms" ? 4 : 2.9,
            () => {
              nextInvoice = { ...nextInvoice, paymentTerms: looseTailValue };
              pushLabel("payment terms");
              summary =
                summary || "Updated the payment terms on the current canvas.";
              return true;
            }
          );
        }

        if (
          looseTailValue &&
          selectedBlock &&
          hasExplicitSelectedBlockReference(segment) &&
          !hasAssistantKnownFieldSignal(segment) &&
          !/\b(layout|design|look|variant|remix|color|background|accent|primary|text color)\b/i.test(
            lower
          )
        ) {
          addCandidate(2.6, () => {
            const result = updateSelectedBlockText(
              nextInvoice,
              nextBlocks,
              looseTailValue
            );
            if (!result.changed) return false;
            nextInvoice = result.invoice;
            nextBlocks = result.blocks;
            pushLabel("selected text");
            summary = summary || "Updated the selected canvas text.";
            return true;
          });
        }

        candidates.sort((a, b) => b.score - a.score);
        const bestCandidate = candidates[0];
        const secondCandidate = candidates[1];
        if (!bestCandidate || bestCandidate.score < 2.6) {
          return false;
        }
        const ambiguityGap =
          bestCandidate.score - (secondCandidate?.score || 0);
        const ambiguityThreshold = selectedBlock ? 0.15 : 0.45;
        if (
          secondCandidate &&
          ambiguityGap < ambiguityThreshold &&
          bestCandidate.score < 4.2
        ) {
          return false;
        }
        return bestCandidate.run();
      };

      const extractFieldValue = (segment: string, aliases: string[]) => {
        const source = aliases.join("|");
        const extracted = extractAssistantValue(segment, [
          new RegExp(
            `(?:change|update|set|make|use|rewrite|enhance|replace|apply)\\s+(?:the\\s+)?(?:${source})(?:\\s+text|\\s+name|\\s+copy)?\\s*(?:to|as|with|is|=|:|of|at)\\s+(.+)`,
            "i"
          ),
          new RegExp(
            `(?:${source})(?:\\s+text|\\s+name|\\s+copy)?\\s*(?:to|as|with|is|=|:|of|at)\\s+(.+)`,
            "i"
          ),
          new RegExp(
            `(?:make|apply|add)\\s+(?:a\\s+)?(?:${source})\\s+of\\s+(.+)`,
            "i"
          ),
          new RegExp(
            `(?:use|put|move|switch|set|make|change|update|rewrite|replace|apply)\\s+["“”']?(.+?)["“”']?\\s+(?:for|as|into|under)\\s+(?:the\\s+)?(?:${source})(?:\\s+text|\\s+name|\\s+copy)?$`,
            "i"
          ),
          new RegExp(
            `^["“”']?(.+?)["“”']?\\s+(?:for|as|into|under)\\s+(?:the\\s+)?(?:${source})(?:\\s+text|\\s+name|\\s+copy)?$`,
            "i"
          ),
          new RegExp(
            `^(?!(?:change|update|set|make|use|rewrite|enhance|replace|apply|add)\\b)["“”']?(.+?)["“”']?\\s+(?:${source})(?:\\s+text|\\s+name|\\s+copy)?$`,
            "i"
          ),
        ]);
        if (!extracted) return "";
        return cleanupAssistantLooseValue(
          extracted
            .replace(
              new RegExp(
                `\\b(?:the\\s+)?(?:${source})(?:\\s+text|\\s+name|\\s+copy)?\\b`,
                "ig"
              ),
              " "
            )
            .replace(/\\s+/g, " ")
            .trim()
        );
      };

      const replaceMatch =
        command.match(
          /(?:replace|change|update)\s+["“”'](.+?)["“”']\s+(?:with|to)\s+["“”'](.+?)["“”']/i
        ) ||
        command.match(
          /["“”'](.+?)["“”']\s+(?:should be|becomes|to)\s+["“”'](.+?)["“”']/i
        );
      if (replaceMatch?.[1] && replaceMatch?.[2]) {
        const result = replaceEverywhere(
          nextInvoice,
          nextBlocks,
          normalizeAssistantValue(replaceMatch[1]),
          normalizeAssistantValue(replaceMatch[2])
        );
        nextInvoice = result.invoice;
        nextBlocks = result.blocks;
        if (result.changed) {
          pushLabel("text replacement");
          summary = `Replaced “${normalizeAssistantValue(replaceMatch[1])}”.`;
        }
      }

      for (const segment of segments.length ? segments : [command]) {
        const cleanedSegment = segment.trim();
        if (!cleanedSegment) continue;

        const selectedTextValue = extractAssistantValue(cleanedSegment, [
          /(?:change|update|set|rewrite|replace|make)\s+(?:this|selected|current)\s+(?:text|field|block|section)?\s*(?:to|as|with)\s+(.+)/i,
        ]);
        if (selectedTextValue) {
          const result = updateSelectedBlockText(
            nextInvoice,
            nextBlocks,
            selectedTextValue
          );
          if (result.changed) {
            nextInvoice = result.invoice;
            nextBlocks = result.blocks;
            pushLabel("selected text");
            summary = "Updated the selected canvas text.";
            continue;
          }
        }

        const lowerSegment = cleanedSegment.toLowerCase();
        const explicitSelectedReference =
          hasExplicitSelectedBlockReference(cleanedSegment);
        const knownFieldSignal = hasAssistantKnownFieldSignal(cleanedSegment);
        const looseSelectedValue = extractAssistantLooseCandidate(
          cleanedSegment,
          [
            /(?:make|change|set|update|rewrite|replace)\s+(?:it|this|that)\s+(?:to|as|with|say|be)\s+(.+)/i,
          ]
        );
        if (
          looseSelectedValue &&
          selectedBlock &&
          explicitSelectedReference &&
          !knownFieldSignal
        ) {
          const result = updateSelectedBlockText(
            nextInvoice,
            nextBlocks,
            looseSelectedValue
          );
          if (result.changed) {
            nextInvoice = result.invoice;
            nextBlocks = result.blocks;
            pushLabel("selected text");
            summary = summary || "Updated the selected canvas text.";
            continue;
          }
        }

        const combinedLineItemHint = extractLooseLineItemHint(cleanedSegment);
        const combinedLineItemQuantity = extractAssistantLooseCandidate(
          cleanedSegment,
          [
            /(?:qty|quantity)(?:\s+(?:to|as|=|is|should\s+be|needs\s+to\s+be))?\s+(\d+(?:\.\d+)?)/i,
            /(\d+(?:\.\d+)?)\s+(?:qty|quantity)\b/i,
          ]
        );
        const combinedLineItemPrice = extractAssistantLooseCandidate(
          cleanedSegment,
          [
            /(?:price|rate|unit\s+price|unit\s+cost|per\s+unit(?:\s+cost|\s+price)?)(?:\s+(?:to|as|=|is|at|of))?\s+([$€£₹]?\s*\d[\d,]*(?:\.\d{1,2})?)/i,
            /([$€£₹]?\s*\d[\d,]*(?:\.\d{1,2})?)(?:\s*(?:usd|eur|gbp|inr|cad|aud|sgd|aed|jpy|cny))?\s*(?:per\s+unit|each)\b/i,
          ]
        );
        if (
          combinedLineItemHint &&
          (combinedLineItemQuantity || combinedLineItemPrice) &&
          /\b(qty|quantity|price|rate|unit\s+price|unit\s+cost|per\s+unit)\b/i.test(
            cleanedSegment
          )
        ) {
          let changedLineItem = false;
          if (combinedLineItemQuantity) {
            changedLineItem =
              applyLineItemTarget(
                combinedLineItemHint,
                "quantity",
                combinedLineItemQuantity
              ) || changedLineItem;
          }
          if (combinedLineItemPrice) {
            changedLineItem =
              applyLineItemTarget(
                combinedLineItemHint,
                "unitPrice",
                combinedLineItemPrice
              ) || changedLineItem;
          }
          if (changedLineItem) {
            continue;
          }
        }

        const lineItemQuantityMatch =
          cleanedSegment.match(
            /(.+?)(?:\s+(?:line\s+)?item)?\s+(?:qty|quantity)(?:\s+(?:to|as|=|is|should\s+be|needs\s+to\s+be|update(?:d)?\s+to|set\s+to|change(?:d)?\s+to))?\s+(\d+(?:\.\d+)?)/i
          ) ||
          cleanedSegment.match(
            /(?:set|change|update|make)\s+(.+?)\s+(?:line\s+item\s+)?(?:qty|quantity)\s*(?:to|as|=|is)?\s+(\d+(?:\.\d+)?)/i
          );
        if (lineItemQuantityMatch?.[1] && lineItemQuantityMatch?.[2]) {
          if (
            applyLineItemTarget(
              lineItemQuantityMatch[1],
              "quantity",
              lineItemQuantityMatch[2]
            )
          ) {
            continue;
          }
        }

        const lineItemPriceMatch =
          cleanedSegment.match(
            /(.+?)(?:\s+(?:line\s+)?item)?\s+(?:price|rate|unit\s+price)(?:\s+(?:to|as|=|is|should\s+be|needs\s+to\s+be|update(?:d)?\s+to|set\s+to|change(?:d)?\s+to))?\s+([$€£₹]?\s*\d[\d,]*(?:\.\d{1,2})?)/i
          ) ||
          cleanedSegment.match(
            /(?:set|change|update|make)\s+(.+?)\s+(?:line\s+item\s+)?(?:price|rate|unit\s+price)\s*(?:to|as|=|is)?\s+([$€£₹]?\s*\d[\d,]*(?:\.\d{1,2})?)/i
          );
        if (lineItemPriceMatch?.[1] && lineItemPriceMatch?.[2]) {
          if (
            applyLineItemTarget(
              lineItemPriceMatch[1],
              "unitPrice",
              lineItemPriceMatch[2]
            )
          ) {
            continue;
          }
        }

        const looseAmountValue = extractAssistantLooseCandidate(
          cleanedSegment,
          [
            /(?:amount due|invoice total|total due|total|amount|balance due|balance|payable)(?:[^\d$€£₹-]{0,24}|.*?)([$€£₹]?\s*-?\d[\d,]*(?:\.\d{1,2})?)/i,
            /(?:bring|move|bump|drop|make|set|change|update|adjust|keep|land)\s+(?:the\s+)?(?:amount due|invoice total|total due|total|amount|balance due|balance|payable|it|this|that)(?:\s+to|\s+at|\s+around|\s+near|\s*=|\s+be|\s+become|\s+should\s+be|\s+needs\s+to\s+be)?\s+([$€£₹]?\s*-?\d[\d,]*(?:\.\d{1,2})?)/i,
            /(?:it|this|that)\s+(?:should|needs to|must|has to|can)\s+(?:be|become|come to|land at)\s+([$€£₹]?\s*-?\d[\d,]*(?:\.\d{1,2})?)/i,
          ]
        );
        if (
          looseAmountValue &&
          (/\b(amount|total|due|balance|payable)\b/i.test(lowerSegment) ||
            selectedBlock?.binding?.key === "amount")
        ) {
          if (applyAmountTarget(looseAmountValue)) {
            continue;
          }
        }

        const looseNoteValue = extractAssistantLooseCandidate(cleanedSegment, [
          /(?:note|notes|message)(?:\s+should(?:\s+just)?\s+|\s+to\s+|\s+as\s+|\s+with\s+|\s+say\s+)?(.+)/i,
          /(?:tell\s+them|let\s+them\s+know|please\s+mention|mention|say)(?:\s+that)?\s+(.+)/i,
        ]);
        if (
          looseNoteValue &&
          /\b(note|notes|message|tell them|let them know|mention|say)\b/i.test(
            lowerSegment
          )
        ) {
          nextInvoice = { ...nextInvoice, notes: looseNoteValue };
          pushLabel("notes");
          summary =
            summary || "Updated the invoice note on the current canvas.";
          continue;
        }

        const looseCustomerValue = extractAssistantLooseCandidate(
          cleanedSegment,
          [
            /(?:bill(?:\s|-)?to|client|customer)(?:\s+name)?(?:\s+should(?:\s+just)?\s+|\s+to\s+|\s+as\s+|\s+with\s+|\s+is\s+)?(.+)/i,
            /(?:invoice|charge|send)\s+(?:this\s+)?(?:to|for)\s+(.+)/i,
            /(?:make|switch|move|put)\s+(?:the\s+)?(?:bill(?:\s|-)?to|client|customer)?\s*(?:to|as|for)\s+(.+)/i,
          ]
        );
        if (
          looseCustomerValue &&
          (/\b(bill|client|customer)\b/i.test(lowerSegment) ||
            /\b(invoice|charge|send)\b.*\b(to|for)\b/i.test(lowerSegment))
        ) {
          nextInvoice = { ...nextInvoice, customerName: looseCustomerValue };
          pushLabel("customer");
          summary =
            summary || "Updated the bill-to details on the current canvas.";
          continue;
        }

        const issuerName = extractFieldValue(cleanedSegment, [
          "biller",
          "issuer",
          "company",
          "sender",
          "from",
        ]);
        if (issuerName) {
          nextInvoice = { ...nextInvoice, issuerName };
          pushLabel("biller");
          continue;
        }

        const issuerEmail = extractFieldValue(cleanedSegment, [
          "issuer email",
          "biller email",
          "billing email",
          "company email",
          "sender email",
          "from email",
        ]);
        if (issuerEmail) {
          nextInvoice = { ...nextInvoice, issuerEmail };
          pushLabel("issuer email");
          continue;
        }

        const issuerAddress = extractFieldValue(cleanedSegment, [
          "issuer address",
          "biller address",
          "company address",
          "sender address",
          "from address",
        ]);
        if (issuerAddress) {
          nextInvoice = { ...nextInvoice, issuerAddress };
          pushLabel("issuer address");
          continue;
        }

        const billToNatural = extractAssistantValue(cleanedSegment, [
          /(?:change|update|set|make|use|rewrite)\s+(?:the\s+)?(?:bill\s*to|bill-to|bill|client|customer)\s+(?:to|as|with|is|=|:)\s+(.+)/i,
        ]);
        if (billToNatural) {
          nextInvoice = { ...nextInvoice, customerName: billToNatural };
          pushLabel("customer");
          summary =
            summary || "Updated the bill-to details on the current canvas.";
          continue;
        }

        const customerName = extractFieldValue(cleanedSegment, [
          "customer",
          "client",
          "bill to",
          "bill-to",
          "bill",
        ]);
        if (customerName) {
          nextInvoice = { ...nextInvoice, customerName };
          pushLabel("customer");
          continue;
        }

        const noteNatural = extractAssistantValue(cleanedSegment, [
          /(?:change|update|set|rewrite|make|improve)\s+(?:the\s+)?(?:note|notes|message)\s+(?:to|as|with|into|say)\s+(.+)/i,
        ]);
        if (noteNatural) {
          nextInvoice = { ...nextInvoice, notes: noteNatural };
          pushLabel("notes");
          summary =
            summary || "Updated the invoice note on the current canvas.";
          continue;
        }

        const notes = extractFieldValue(cleanedSegment, [
          "note",
          "notes",
          "message",
        ]);
        if (notes) {
          nextInvoice = { ...nextInvoice, notes };
          pushLabel("notes");
          continue;
        }

        const paymentTerms = extractFieldValue(cleanedSegment, [
          "payment terms",
          "terms",
        ]);
        if (paymentTerms) {
          nextInvoice = { ...nextInvoice, paymentTerms };
          pushLabel("payment terms");
          continue;
        }

        const invoiceNumber = extractFieldValue(cleanedSegment, [
          "invoice number",
          "invoice no",
          "invoice #",
          "number",
        ]);
        if (invoiceNumber) {
          nextInvoice = { ...nextInvoice, invoiceNumber };
          pushLabel("invoice number");
          continue;
        }

        const dueDate = extractFieldValue(cleanedSegment, [
          "due date",
          "deadline",
        ]);
        if (dueDate) {
          nextInvoice = { ...nextInvoice, dueDate };
          pushLabel("due date");
          continue;
        }

        const issueDate = extractFieldValue(cleanedSegment, [
          "issue date",
          "invoice date",
        ]);
        if (issueDate) {
          nextInvoice = { ...nextInvoice, issueDate };
          pushLabel("issue date");
          continue;
        }

        const headerTitle = extractFieldValue(cleanedSegment, [
          "header title",
          "headline",
          "title",
        ]);
        if (headerTitle) {
          nextInvoice = {
            ...nextInvoice,
            style: { ...nextInvoice.style, headerTitle },
          };
          pushLabel("title");
          continue;
        }

        const heroCopy = extractFieldValue(cleanedSegment, [
          "hero copy",
          "subtitle",
          "tagline",
          "subheading",
        ]);
        if (heroCopy) {
          nextInvoice = {
            ...nextInvoice,
            style: { ...nextInvoice.style, heroCopy },
          };
          pushLabel("hero copy");
          continue;
        }

        const accentLabel = extractFieldValue(cleanedSegment, [
          "accent label",
          "badge",
          "label",
        ]);
        if (accentLabel) {
          nextInvoice = { ...nextInvoice, accentLabel };
          pushLabel("label");
          continue;
        }

        const currencyValue = extractFieldValue(cleanedSegment, ["currency"]);
        if (currencyValue) {
          nextInvoice = {
            ...nextInvoice,
            currency: normalizeCurrency(currencyValue, nextInvoice.currency),
          };
          pushLabel("currency");
          continue;
        }

        const taxValue = extractFieldValue(cleanedSegment, [
          "tax",
          "vat",
          "gst",
        ]);
        if (taxValue) {
          nextInvoice = {
            ...nextInvoice,
            taxPercentage:
              parseMoneyValue(taxValue) || nextInvoice.taxPercentage,
          };
          pushLabel("tax");
          continue;
        }

        const discountValue = extractFieldValue(cleanedSegment, [
          "discount",
          "discont",
        ]);
        if (discountValue) {
          nextInvoice = {
            ...nextInvoice,
            discountPercentage:
              parseMoneyValue(discountValue) || nextInvoice.discountPercentage,
          };
          pushLabel("discount");
          continue;
        }

        const amountNatural = extractAssistantValue(cleanedSegment, [
          /(?:change|update|set|make)\s+(?:the\s+)?(?:amount due|amount|total)\s+(?:to|as|with|is|=|:)\s+(.+)/i,
        ]);
        if (amountNatural) {
          if (applyAmountTarget(amountNatural)) {
            continue;
          }
        }

        const amountValue = extractFieldValue(cleanedSegment, [
          "amount due",
          "amount",
          "total",
        ]);
        if (amountValue) {
          if (applyAmountTarget(amountValue)) {
            continue;
          }
        }

        const backgroundColorValue = extractAssistantValue(cleanedSegment, [
          /(?:change|update|set|make|use)\s+(?:the\s+)?(?:bg|background|canvas background|canvas bg)(?:\s+color)?\s*(?:to|as|with|is|=|:)\s+(.+)/i,
        ]);
        const backgroundColor = backgroundColorValue
          ? resolveAssistantColor(backgroundColorValue)
          : null;
        if (backgroundColor) {
          nextInvoice = {
            ...nextInvoice,
            style: {
              ...nextInvoice.style,
              palette: {
                ...nextInvoice.style.palette,
                surface: backgroundColor,
                surfaceAlt:
                  backgroundColor === "#FFFFFF" ? "#F8FAFC" : backgroundColor,
              },
            },
          };
          pushLabel("background color");
          continue;
        }

        const primaryColorValue = extractAssistantValue(cleanedSegment, [
          /(?:change|update|set|make|use)\s+(?:the\s+)?primary(?:\s+color)?\s*(?:to|as|with|is|=|:)\s+(.+)/i,
        ]);
        const primaryColor = primaryColorValue
          ? resolveAssistantColor(primaryColorValue)
          : null;
        if (primaryColor) {
          nextInvoice = {
            ...nextInvoice,
            style: {
              ...nextInvoice.style,
              palette: { ...nextInvoice.style.palette, primary: primaryColor },
            },
          };
          pushLabel("primary color");
          continue;
        }

        const accentColorValue = extractAssistantValue(cleanedSegment, [
          /(?:change|update|set|make|use)\s+(?:the\s+)?accent(?:\s+color)?\s*(?:to|as|with|is|=|:)\s+(.+)/i,
        ]);
        const accentColor = accentColorValue
          ? resolveAssistantColor(accentColorValue)
          : null;
        if (accentColor) {
          nextInvoice = {
            ...nextInvoice,
            style: {
              ...nextInvoice.style,
              palette: { ...nextInvoice.style.palette, accent: accentColor },
            },
          };
          pushLabel("accent color");
          continue;
        }

        const textColorValue = extractAssistantValue(cleanedSegment, [
          /(?:change|update|set|make|use)\s+(?:the\s+)?text(?:\s+color)?\s*(?:to|as|with|is|=|:)\s+(.+)/i,
        ]);
        const textColor = textColorValue
          ? resolveAssistantColor(textColorValue)
          : null;
        if (textColor) {
          nextInvoice = {
            ...nextInvoice,
            style: {
              ...nextInvoice.style,
              palette: { ...nextInvoice.style.palette, text: textColor },
            },
          };
          pushLabel("text color");
          continue;
        }

        const addItem = extractAssistantValue(cleanedSegment, [
          /(?:add|create|insert|include|append|put)\s+(?:another\s+)?(?:this\s+)?(?:a\s+)?(?:new\s+)?(?:(?:line\s+)?item|service|charge|entry|row|task)(?:\s+called|\s+named|\s+for|\s+as|\s+like|:)?\s+(.+)/i,
          /(?:add|create|insert|include|append|put)\s+(?:like|something\s+like)\s+(.+)/i,
        ]);
        if (addItem) {
          const parsedLineItem =
            parseAssistantNaturalLineItem(addItem, nextInvoice.currency) ||
            parseAssistantNaturalLineItem(cleanedSegment, nextInvoice.currency);
          if (parsedLineItem) {
            const lineItems = [
              ...nextInvoice.lineItems,
              {
                description: parsedLineItem.description,
                quantity: parsedLineItem.quantity,
                unitPrice: parsedLineItem.unitPrice,
                amount: parsedLineItem.amount,
              },
            ];
            nextInvoice = {
              ...nextInvoice,
              currency: parsedLineItem.currency || nextInvoice.currency,
              lineItems,
              amount: calculateInvoiceAmount(
                lineItems,
                nextInvoice.taxPercentage,
                nextInvoice.discountPercentage
              ),
            };
            pushLabel("line item");
            summary =
              summary || `Added ${parsedLineItem.description} to the invoice.`;
            continue;
          }
        }

        if (
          /(show|open).*(looks|designs|variants|explorer)/i.test(cleanedSegment)
        ) {
          nextShowDesignExplorer = true;
          pushLabel("design explorer");
          continue;
        }
        if (
          /(hide|close).*(looks|designs|variants|explorer)/i.test(
            cleanedSegment
          )
        ) {
          nextShowDesignExplorer = false;
          pushLabel("canvas focus");
          continue;
        }
        if (
          /(premium|fresh|new|different|alternate|another|random).*(look|design|layout|variant|remix|theme|style)/i.test(
            cleanedSegment
          ) ||
          /(redesign|restyle|reimagine|remix|beautify|polish).*(invoice|canvas|layout|design|look|theme|style)?/i.test(
            cleanedSegment
          ) ||
          /refresh.*(look|design|layout|variant|theme|style)/i.test(
            cleanedSegment
          )
        ) {
          nextShowDesignExplorer = true;
          generateLooks = true;
          assistantAutoApplyVariantRef.current = true;
          assistantDesignDirectionRef.current =
            extractAssistantDesignDirection(cleanedSegment);
          pushLabel("premium looks");
          summary =
            summary ||
            "Generating and applying a fresh design direction on the canvas.";
          continue;
        }
        if (
          /(reset|restore|revert).*(layout|canvas|positions?|structure)/i.test(
            cleanedSegment
          )
        ) {
          nextBlocks = defaultBlocks(nextInvoice.style.templateId);
          assistantAutoApplyVariantRef.current = false;
          assistantDesignDirectionRef.current = "";
          pushLabel("layout reset");
          summary =
            summary || "Restored the default layout for the current design.";
          continue;
        }

        const naturalNewLineItem = parseAssistantNaturalLineItem(
          cleanedSegment,
          nextInvoice.currency
        );
        if (
          naturalNewLineItem &&
          (hasAssistantAddLineItemIntent(cleanedSegment) ||
            /\b(qty|quantity|quanitty|quantitiy|quatity|quanity|per\s+unit|unit\s+cost|unit\s+price|unit|cost|price|rate|amount|usd|eur|gbp|inr|cad|aud|sgd|aed|jpy|cny)\b/i.test(
              cleanedSegment
            ))
        ) {
          const lineItems = [
            ...nextInvoice.lineItems,
            {
              description: naturalNewLineItem.description,
              quantity: naturalNewLineItem.quantity,
              unitPrice: naturalNewLineItem.unitPrice,
              amount: naturalNewLineItem.amount,
            },
          ];
          nextInvoice = {
            ...nextInvoice,
            currency: naturalNewLineItem.currency || nextInvoice.currency,
            lineItems,
            amount: calculateInvoiceAmount(
              lineItems,
              nextInvoice.taxPercentage,
              nextInvoice.discountPercentage
            ),
          };
          pushLabel("line item");
          summary =
            summary ||
            `Added ${naturalNewLineItem.description} to the invoice.`;
          continue;
        }

        if (tryBestEffortAssistantInference(cleanedSegment)) {
          continue;
        }
      }

      nextInvoice = normalizeInvoiceState(nextInvoice, today);
      return {
        invoice: nextInvoice,
        blocks: nextBlocks,
        appliedLabels,
        showDesignExplorer: nextShowDesignExplorer,
        generateLooks,
        summary,
      };
    };

    setAssistantStatus("thinking");
    setAssistantFeedback(
      "Understanding your instruction and mapping it to the live canvas…"
    );
    setError(null);

    const localResult = applyLocalAssistantPass();
    let nextInvoice = localResult.invoice;
    let nextBlocks = localResult.blocks;
    let appliedLabels = [...localResult.appliedLabels];
    let nextShowDesignExplorer =
      localResult.showDesignExplorer ?? showDesignExplorer;
    let generateLooks = Boolean(localResult.generateLooks);
    let selectedNextBlockId = selectedBlockId;
    let responseSummary = localResult.summary;
    let optimizedVariantToApply: OrchestraVariant | null = null;
    const inferredOptimizeAction = layoutIntent
      ? inferAssistantOptimizeAction(command)
      : null;

    try {
      const aiResult = await interpretAssistantWithAi(command);
      if (aiResult.invoice || aiResult.invoicePatch) {
        const invoicePatch = sanitizeAssistantInvoicePatch(
          (aiResult.invoicePatch ||
            aiResult.invoice ||
            {}) as Partial<InvoiceState>
        );
        const mergedStyle = invoicePatch.style
          ? mergeStyle({
              ...nextInvoice.style,
              ...invoicePatch.style,
              palette: {
                ...nextInvoice.style.palette,
                ...(invoicePatch.style.palette || {}),
              },
            })
          : nextInvoice.style;
        nextInvoice = normalizeInvoiceState(
          {
            ...nextInvoice,
            ...invoicePatch,
            style: mergedStyle,
          },
          today
        );
      }

      const stylePatch = aiResult.stylePatch || aiResult.style;
      if (stylePatch || aiResult.palette) {
        nextInvoice = normalizeInvoiceState(
          {
            ...nextInvoice,
            style: mergeStyle({
              ...nextInvoice.style,
              ...(stylePatch || {}),
              palette: {
                ...nextInvoice.style.palette,
                ...(stylePatch?.palette || {}),
                ...(aiResult.palette || {}),
              },
            }),
          },
          today
        );
      }

      const blockPatch = sanitizeAssistantBlocksPatch(aiResult.blocks).filter(
        (block) => block.id !== "amount" && block.binding?.key !== "amount"
      );
      if (blockPatch.length) {
        nextBlocks = mergeAssistantBlocks(nextBlocks, blockPatch, layoutIntent);
      }

      if (Array.isArray(aiResult.appliedLabels)) {
        appliedLabels = Array.from(
          new Set([...appliedLabels, ...aiResult.appliedLabels.filter(Boolean)])
        );
      }
      const aiProducedUsableUpdate = Boolean(
        aiResult.invoice ||
          aiResult.invoicePatch ||
          stylePatch ||
          aiResult.palette ||
          blockPatch.length ||
          aiResult.generateLooks ||
          typeof aiResult.showDesignExplorer === "boolean" ||
          typeof aiResult.selectedBlockId === "string"
      );
      if (!appliedLabels.length && aiProducedUsableUpdate) {
        appliedLabels = ["assistant update"];
      }
      if (typeof aiResult.showDesignExplorer === "boolean") {
        nextShowDesignExplorer = aiResult.showDesignExplorer;
      }
      if (aiResult.generateLooks) {
        generateLooks = true;
      }
      if (typeof aiResult.selectedBlockId === "string") {
        selectedNextBlockId = aiResult.selectedBlockId;
      }
      responseSummary =
        aiResult.feedback ||
        aiResult.summary ||
        responseSummary ||
        (aiProducedUsableUpdate
          ? "Updated the current canvas from your instruction."
          : responseSummary);
    } catch (err) {
      responseSummary =
        err instanceof Error
          ? `${
              localResult.appliedLabels.length
                ? "Applied direct canvas edits locally."
                : "AI assistant service unavailable."
            } ${err.message}`
          : responseSummary;
    }

    if (inferredOptimizeAction && !generateLooks) {
      optimizedVariantToApply = buildOptimizationVariant(
        nextInvoice,
        inferredOptimizeAction as (typeof OPTIMIZE_ACTIONS)[number],
        scoredVariants.length + optimizationHistory.length + 1
      );
      nextInvoice = normalizeInvoiceState(
        {
          ...nextInvoice,
          style: optimizedVariantToApply.style,
          accentLabel: optimizedVariantToApply.style.accentLabel,
        },
        today
      );
      nextBlocks = cloneBlocks(optimizedVariantToApply.blocks);
      if (!appliedLabels.includes("design optimization")) {
        appliedLabels.push("design optimization");
      }
      responseSummary =
        responseSummary ||
        `Applied a design refinement pass: ${inferredOptimizeAction.toLowerCase()}.`;
    }

    if (!appliedLabels.length) {
      const calculatedAmountRequested =
        hasAssistantCalculatedAmountIntent(command);
      const addItemRequested = hasAssistantAddLineItemIntent(command);
      const vagueRequest = isAssistantRequestTooVague(command);
      const clarificationMessage = calculatedAmountRequested
        ? "Total and amount due stay read-only because they are calculated. Ask me to change quantity, unit price, currency, tax, discount, or a specific line item instead."
        : addItemRequested
        ? "I think you want to add a line item, but I am not confident enough to place it yet. Please give me at least a description plus a price or amount, for example: add item Hello, quantity 1, unit price 300 USD."
        : layoutIntent
        ? "Please be a bit more specific about the design change you want, for example cleaner, bolder, more premium, more minimal, or restore the default layout."
        : vagueRequest
        ? "Please be a bit more specific about what should change on the canvas, and I will infer the rest."
        : "I could not confidently map that request yet, so I kept the canvas stable. Please be a bit more specific and I will try again.";
      setAssistantStatus("idle");
      setAssistantFeedback(clarificationMessage);
      showToast({
        tone: calculatedAmountRequested ? "warning" : "error",
        title: calculatedAmountRequested
          ? "Calculated totals stay automatic"
          : "Please be a bit more specific",
        description: clarificationMessage,
      });
      return;
    }

    setAssistantStatus("applying");
    setAssistantFeedback(
      responseSummary || "Applying the requested updates on the current canvas…"
    );

    nextBlocks = cloneBlocks(nextBlocks);
    selectedNextBlockId =
      selectedNextBlockId &&
      nextBlocks.some((block) => block.id === selectedNextBlockId)
        ? selectedNextBlockId
        : nextBlocks.some((block) => block.id === selectedBlockId)
        ? selectedBlockId
        : nextBlocks[0]?.id || null;

    setInvoice(nextInvoice);
    setBlocks(nextBlocks);
    setShowDesignExplorer(nextShowDesignExplorer);
    if (optimizedVariantToApply) {
      setSelectedDraft(optimizedVariantToApply.templateId);
      setSelectedVariantId(optimizedVariantToApply.id);
      setAiPromptSummary(optimizedVariantToApply.rationale);
      setDrafts((current) =>
        [
          optimizedVariantToApply!,
          ...current.filter(
            (item) => item.templateId !== optimizedVariantToApply!.templateId
          ),
        ].slice(0, 12)
      );
      setScoredVariants((current) =>
        [
          optimizedVariantToApply!,
          ...current.filter((item) => item.id !== optimizedVariantToApply!.id),
        ].slice(0, 12)
      );
    }
    setSelectedBlockId(selectedNextBlockId);
    setAssistantCommand("");
    setAssistantTranscript("");
    setError(null);
    setAssistantStatus("idle");
    setAssistantFeedback(
      responseSummary ||
        `Updated ${Array.from(new Set(appliedLabels)).join(
          ", "
        )} on the current canvas.`
    );
    showToast({
      tone: "success",
      title: "Canvas updated",
      description:
        responseSummary ||
        `Applied ${Array.from(new Set(appliedLabels)).join(
          ", "
        )} without replacing the active design.`,
    });
    scrollCanvasIntoView();

    if (generateLooks) {
      const latestInvoiceForDesigns = nextInvoice;
      window.setTimeout(() => {
        void generateDesigns(latestInvoiceForDesigns);
      }, 0);
    }
  }

  function applyDraft(option: InvoiceDraftOption, orchestrationId?: string) {
    const resolvedStyle = ensureStyleTheme(option.style, option.templateId);
    setSelectedDraft(option.templateId || resolvedStyle.templateId);
    setSelectedVariantId(
      orchestrationId || option.templateId || resolvedStyle.templateId
    );
    setInvoice((current) => ({
      ...current,
      style: resolvedStyle,
      accentLabel: option.accentLabel || resolvedStyle.accentLabel,
    }));
    setBlocks(cloneBlocks(option.blocks));
  }

  function applyVariant(variant: OrchestraVariant) {
    applyDraft(variant, variant.id);
    setAiPromptSummary(variant.rationale);
    setAiTab("optimize");
    setShowDesignExplorer(false);
    showToast({
      tone: "success",
      title: `${variant.family} applied`,
      description: "The selected look is now reflected on the canvas.",
    });
    scrollCanvasIntoView();
  }

  function optimizeCurrentVariant(action: (typeof OPTIMIZE_ACTIONS)[number]) {
    const nextVariant = buildOptimizationVariant(
      invoice,
      action,
      scoredVariants.length + optimizationHistory.length + 1
    );
    setOptimizationHistory((current) =>
      [action, ...current.filter((item) => item !== action)].slice(0, 7)
    );
    setScoredVariants((current) => [
      nextVariant,
      ...current.filter((item) => item.id !== nextVariant.id),
    ]);
    setOrchestraPasses(buildPasses("polish"));
    applyDraft(nextVariant, nextVariant.id);
    setAiPromptSummary(nextVariant.rationale);
    setAiTab("optimize");
    window.requestAnimationFrame(() => setOrchestraPasses(buildPasses("rank")));
  }

  async function generateAiCanvasFromPrompt(rawPrompt = aiPrompt) {
    if (loading) return;

    const prompt = normalizeAiPrompt(rawPrompt);
    if (!prompt.length) {
      showToast({
        tone: "error",
        title: "Add anything to start",
        description:
          "Paste any rough note, email, transcript, or instruction and AI will turn it into an editable invoice canvas.",
      });
      return;
    }

    setAiModalOpen(false);
    setLoading("ai-draft");
    setError(null);
    setAiTab("create");
    setOrchestraPasses(buildPasses("facts"));

    try {
      const enhancedPrompt = buildAiDraftPrompt(prompt, invoice.currency);
      const response = await fetch(`${API_BASE}/invoices/ai-canvas-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: enhancedPrompt }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(
          json?.error?.message || "Could not create the AI invoice draft."
        );
      }

      const data = json.data as AiCanvasDraftResult;
      const nextInvoice = normalizeInvoiceState(data.invoice, today);
      const primaryVariant = makeOrchestraVariant(
        data,
        0,
        data?.style?.styleName || nextInvoice.style.styleName,
        "draft"
      );
      setShowDesignExplorer(true);
      setAiPrompt(prompt);
      setAiPromptSummary(
        String(data?.promptSummary || "AI created an editable invoice draft.")
      );
      setAiMissingFields(
        Array.isArray(data?.missingFields) ? data.missingFields.slice(0, 6) : []
      );
      setInvoice(nextInvoice);
      setBlocks(cloneBlocks(data.blocks));
      setDrafts([data]);
      setScoredVariants([primaryVariant]);
      setSelectedDraft(data.templateId);
      setSelectedVariantId(primaryVariant.id);
      setSelectedBlockId("invoiceNumber");
      setAiTab("variants");
      setOrchestraPasses(buildPasses("rank"));
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

  async function generateDesigns(sourceInvoice?: InvoiceState | unknown) {
    if (loading) return;
    const candidateInvoice =
      sourceInvoice &&
      typeof sourceInvoice === "object" &&
      "style" in (sourceInvoice as Record<string, unknown>)
        ? (sourceInvoice as InvoiceState)
        : invoice;
    const safeSourceInvoice = normalizeInvoiceState(candidateInvoice, today);
    const safeSourceStyle = ensureStyleTheme(safeSourceInvoice.style);
    const remixSeed = Date.now();
    const requestedDesignDirection = assistantDesignDirectionRef.current;
    setShowDesignExplorer(true);
    setLoading("ai");
    setError(null);
    setAiTab("variants");
    setOrchestraPasses(buildPasses("layouts"));
    try {
      const response = await fetch(`${API_BASE}/invoices/canvas-drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...safeSourceInvoice,
          amount: toMoney(safeSourceInvoice.amount),
          palette: safeSourceStyle.palette,
          selectedTemplateId: safeSourceStyle.templateId,
          styleDirection: requestedDesignDirection
            ? `${safeSourceStyle.tone} | requested direction: ${requestedDesignDirection}`
            : safeSourceStyle.tone,
          variantCount,
          remixSeed,
          explorationMode: "premium-layout-remix",
          explorationGoal: requestedDesignDirection
            ? `Return materially different premium invoice directions with new hierarchy, block placement, spacing, and composition. Prioritize this user-requested direction: ${requestedDesignDirection}.`
            : "Return materially different premium invoice directions with new hierarchy, block placement, spacing, and composition on every refresh.",
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
      const nextVariants = synthesizeVariantPool(
        options,
        safeSourceInvoice,
        variantCount,
        remixSeed
      );
      setDrafts(nextVariants);
      setScoredVariants(nextVariants);
      setOrchestraPasses(buildPasses("rank"));
      if (nextVariants[0]) {
        setSelectedVariantId(nextVariants[0].id);
      }
      if (assistantAutoApplyVariantRef.current && nextVariants[0]) {
        applyDraft(nextVariants[0], nextVariants[0].id);
        setAiPromptSummary(nextVariants[0].rationale);
        assistantAutoApplyVariantRef.current = false;
        assistantDesignDirectionRef.current = "";
        showToast({
          tone: "success",
          title: "Fresh design applied",
          description:
            "I generated and applied a new design direction to the current canvas.",
        });
      } else {
        assistantAutoApplyVariantRef.current = false;
        assistantDesignDirectionRef.current = "";
        showToast({
          tone: "success",
          title: `${nextVariants.length} AI variants ready`,
          description:
            "Fresh looks are ready in the explorer. Your active canvas stays unchanged until you click Apply.",
        });
      }
    } catch (err) {
      assistantAutoApplyVariantRef.current = false;
      assistantDesignDirectionRef.current = "";
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
          canvasBlocks: sanitizeCanvasBlocksForFinalize(blocks, invoice),
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
                placeholder="Paste anything: a rough client message, meeting notes, voice transcript, or a direct request like ‘Invoice Acme for design system work, due next Friday, 18% GST, bank transfer’."
                maxLength={12000}
                autoFocus
              />
            </label>

            <div className="ai-modal-tips">
              <span className="mini-chip">
                Paste any messy note, email, or transcript
              </span>
              <span className="mini-chip">
                Mention VAT / GST / tax if known
              </span>
              <span className="mini-chip">No special format needed</span>
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
                disabled={!normalizeAiPrompt(aiPrompt).length}
              >
                Generate canvas
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {pdfPreviewOpen ? (
        <div
          className="pdf-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-preview-title"
        >
          <div className="pdf-preview-card">
            <div className="pdf-preview-head">
              <div className="page-stack" style={{ gap: 4 }}>
                <strong id="pdf-preview-title">PDF preview</strong>
                <span className="muted" style={{ fontSize: "0.75rem" }}>
                  Review the current invoice before finalizing.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPdfPreviewOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="pdf-preview-stage">
              <div
                className="pdf-preview-paper"
                style={{
                  width: `${PAGE_WIDTH * 0.82}px`,
                  height: `${PAGE_HEIGHT * 0.82}px`,
                }}
              >
                <div
                  style={{
                    width: `${PAGE_WIDTH}px`,
                    height: `${PAGE_HEIGHT}px`,
                    transform: "scale(0.82)",
                    transformOrigin: "top left",
                  }}
                >
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
            </div>
          </div>
        </div>
      ) : null}
      <datalist id="invoice-currency-list">
        {CURRENCY_OPTIONS.map((currencyCode) => (
          <option key={currencyCode} value={currencyCode} />
        ))}
      </datalist>
      {loading && loading !== "ai" ? (
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
      <div className="invoice-builder-shell">
        <input
          ref={logoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onLogoChange}
          style={{ display: "none" }}
        />
        {error ? <div className="error-banner">{error}</div> : null}

        <aside className="builder-side-rail builder-side-rail-left">
          <section className="builder-floating-card tools-rail-card">
            <div className="tools-rail-head">
              <h3>Design Tools</h3>
              <span>Editorial mode</span>
            </div>

            <div className="tools-rail-nav">
              <button type="button" className="tools-rail-item">
                <span className="tools-rail-icon">✦</span>
                <span>Palette</span>
              </button>

              <label className="tools-rail-item tools-rail-upload">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  onChange={onAttachmentChange}
                  style={{ display: "none" }}
                />
                <span className="tools-rail-icon">⎙</span>
                <span>
                  {attachments.length
                    ? `Attachments (${attachments.length})`
                    : "Attachments"}
                </span>
              </label>

              <button
                type="button"
                className="tools-rail-item is-active"
                onClick={openAiModal}
              >
                <span className="tools-rail-icon">✦</span>
                <span>AI Assistant</span>
              </button>

              <button type="button" className="tools-rail-item">
                <span className="tools-rail-icon">⚙</span>
                <span>Settings</span>
              </button>
            </div>

            <div className="tools-rail-section">
              <span className="tools-section-kicker">Quick palette</span>
              <div className="tools-palette-grid">
                {(
                  Object.keys(invoice.style.palette) as Array<
                    keyof StylePalette
                  >
                ).map((key) => (
                  <label key={key} className="tools-palette-swatch" title={key}>
                    <input
                      className="tools-palette-input"
                      type="color"
                      value={invoice.style.palette[key]}
                      onChange={(event) =>
                        updatePalette(key, event.target.value)
                      }
                      aria-label={`Change ${key} color`}
                    />
                    <span
                      className="tools-palette-dot"
                      style={{ background: invoice.style.palette[key] }}
                    />
                    <span className="tools-palette-name">{key}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="tools-rail-section tools-rail-footer">
              <span className="tools-section-kicker">Attachments</span>
              {logoName ? (
                <span className="mini-chip">Logo: {logoName}</span>
              ) : null}
              {attachments.length ? (
                <div className="attachment-list">
                  {attachments.map((file) => (
                    <span
                      key={`${file.name}-${file.size}`}
                      className="mini-chip"
                    >
                      {file.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="mini-chip">Optional extra PDFs</span>
              )}
            </div>
          </section>

          <section className="builder-floating-card pro-upgrade-card">
            <span className="pro-kicker">Pro features active</span>
            <button type="button" className="pro-upgrade-button">
              Upgrade to Pro
            </button>
          </section>
        </aside>

        <main className="builder-center-column">
          {showDesignExplorer ? (
            <section className="builder-floating-card top-ai-card">
              <div className="top-ai-card-head">
                <div className="page-stack" style={{ gap: 10 }}>
                  <div className="top-ai-title-row">
                    <span className="top-ai-sparkle">✦</span>
                    <strong>AI Design Orchestra</strong>
                  </div>
                  <div className="ai-orchestra-head-meta">
                    {/* <span className="mini-chip is-accent">Gemini 2.5 Flash</span> */}
                    {/* <span className="mini-chip">5-pass workflow</span> */}
                    {/* <span className="mini-chip">
                    Same invoice facts, many looks
                  </span> */}
                  </div>
                </div>
                <button
                  type="button"
                  className="history-chip"
                  onClick={() => setShowDesignExplorer(false)}
                >
                  Close design explorer
                </button>
              </div>

              <div className="ai-tab-row">
                {AI_TAB_OPTIONS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`ai-tab-button${
                      aiTab === tab.id ? " is-active" : ""
                    }`}
                    onClick={() => setAiTab(tab.id)}
                  >
                    <strong>{tab.label}</strong>
                    <span>{tab.kicker}</span>
                  </button>
                ))}
              </div>

              <div className="ai-pass-row">
                {orchestraPasses.map((pass) => (
                  <div
                    key={pass.id}
                    className={`ai-pass-card is-${pass.status}`}
                    title={pass.detail}
                  >
                    <strong>{pass.title}</strong>
                    <span>{pass.detail}</span>
                  </div>
                ))}
              </div>

              {aiTab === "create" ? (
                <>
                  <div className="ai-orchestra-meta-row">
                    <div className="ai-variant-count-row">
                      {[4, 8, 12].map((count) => (
                        <button
                          key={count}
                          type="button"
                          className={`variant-count-chip${
                            variantCount === count ? " is-active" : ""
                          }`}
                          onClick={() => setVariantCount(count as 4 | 8 | 12)}
                        >
                          {count} looks
                        </button>
                      ))}
                    </div>
                    <span className="mini-chip">
                      Recommended family · {brandInference.recommendedFamily}
                    </span>
                  </div>

                  <div className="top-ai-assistant-callout">
                    <div className="page-stack" style={{ gap: 6 }}>
                      <strong>Canvas Assistant is docked below</strong>
                      <span className="muted" style={{ fontSize: "0.76rem" }}>
                        Ask for changes on top of the current extracted invoice,
                        then generate fresh premium looks only when you want
                        them.
                      </span>
                    </div>
                    <div className="ai-create-actions">
                      <button
                        type="button"
                        className="top-ai-secondary"
                        onClick={() => void generateDesigns()}
                      >
                        <span className="button-icon-text">◌</span>
                        <span>Generate {variantCount} looks</span>
                      </button>
                      <button
                        type="button"
                        className="top-ai-secondary"
                        onClick={() => setShowDesignExplorer(false)}
                      >
                        <span className="button-icon-text">▣</span>
                        <span>Go to canvas</span>
                      </button>
                    </div>
                  </div>

                  <div className="top-ai-chip-row">
                    <button
                      type="button"
                      className="suggestion-chip"
                      onClick={() =>
                        setAssistantCommand("Update the biller to abc.com")
                      }
                    >
                      Update biller
                    </button>
                    <button
                      type="button"
                      className="suggestion-chip"
                      onClick={() =>
                        setAssistantCommand("Change bg color to white")
                      }
                    >
                      White canvas
                    </button>
                    <button
                      type="button"
                      className="suggestion-chip"
                      onClick={() =>
                        setAssistantCommand(
                          'Change note to "Thank you for your business"'
                        )
                      }
                    >
                      Rewrite note
                    </button>
                    <button
                      type="button"
                      className="suggestion-chip is-muted"
                      onClick={clearAiDraft}
                    >
                      Clear AI summary
                    </button>
                  </div>

                  <div className="ai-fact-strip">
                    {factHighlights.map((item) => (
                      <span key={item} className="fact-pill">
                        {item}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}

              {aiTab === "variants" ? (
                <>
                  <div className="ai-orchestra-meta-row">
                    <div className="page-stack" style={{ gap: 4 }}>
                      <strong className="ai-section-title">
                        Ranked variants
                      </strong>
                      <span className="muted" style={{ fontSize: "0.74rem" }}>
                        Same invoice facts, reordered into safer, bolder, more
                        premium, and more futuristic layout systems.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="top-ai-secondary"
                      onClick={generateDesigns}
                    >
                      Refresh {variantCount} looks
                    </button>
                  </div>

                  <div className="ai-variant-grid">
                    {scoredVariants.length ? (
                      scoredVariants.map((variant) => {
                        const previewInvoice = {
                          ...invoice,
                          style: variant.style,
                          accentLabel: variant.style.accentLabel,
                        };
                        return (
                          <article
                            key={variant.id}
                            className={`ai-variant-card${
                              selectedVariantId === variant.id
                                ? " is-active"
                                : ""
                            }`}
                          >
                            <div className="ai-variant-card-head">
                              <div className="page-stack" style={{ gap: 4 }}>
                                <span className="mini-chip">
                                  {variant.badge}
                                </span>
                                <strong>{variant.family}</strong>
                                <span
                                  className="muted"
                                  style={{ fontSize: "0.72rem" }}
                                >
                                  {variant.rationale}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="variant-apply-button"
                                onClick={() => applyVariant(variant)}
                              >
                                Apply
                              </button>
                            </div>

                            <MiniPreview
                              invoice={previewInvoice}
                              blocks={variant.blocks}
                              logoDataUrl={logoDataUrl}
                            />

                            <div className="variant-score-grid">
                              {(
                                Object.entries(variant.score) as Array<
                                  [keyof VariantScoreCard, number]
                                >
                              ).map(([key, value]) => (
                                <div key={key} className="variant-score-pill">
                                  <span>{key}</span>
                                  <strong>{value}</strong>
                                </div>
                              ))}
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <div className="ai-empty-inline-state">
                        Run the orchestra once, then this tab will rank and
                        compare your strongest design directions.
                      </div>
                    )}
                  </div>
                </>
              ) : null}

              {aiTab === "optimize" ? (
                <>
                  <div className="ai-orchestra-meta-row">
                    <div className="page-stack" style={{ gap: 4 }}>
                      <strong className="ai-section-title">
                        Optimization actions
                      </strong>
                      <span className="muted" style={{ fontSize: "0.74rem" }}>
                        Tier 2 is capped to 7 focused refinement actions,
                        exactly as requested.
                      </span>
                    </div>
                    <span className="mini-chip">
                      Current tone · {brandInference.tone}
                    </span>
                  </div>

                  <div className="ai-optimize-grid">
                    {OPTIMIZE_ACTIONS.map((action) => (
                      <button
                        key={action}
                        type="button"
                        className="optimize-action-button"
                        onClick={() => optimizeCurrentVariant(action)}
                      >
                        {action}
                      </button>
                    ))}
                  </div>

                  {selectedOrchestraVariant ? (
                    <div className="ai-optimize-summary">
                      <strong>
                        Active look · {selectedOrchestraVariant.family}
                      </strong>
                      <span>{selectedOrchestraVariant.rationale}</span>
                    </div>
                  ) : null}

                  {optimizationHistory.length ? (
                    <div className="top-ai-chip-row">
                      {optimizationHistory.map((item) => (
                        <span key={item} className="suggestion-chip is-muted">
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </section>
          ) : (
            <section className="builder-floating-card explorer-collapsed-card">
              <div className="page-stack" style={{ gap: 6 }}>
                <strong>Canvas focused mode</strong>
                <span className="muted" style={{ fontSize: "0.76rem" }}>
                  The selected look is applied on the canvas. Reopen the design
                  explorer any time to compare more looks.
                </span>
              </div>
              <button
                type="button"
                className="top-ai-secondary"
                onClick={() => setShowDesignExplorer((current) => !current)}
              >
                {showDesignExplorer
                  ? "Close design explorer"
                  : "Open design explorer"}
              </button>
            </section>
          )}

          <section
            className="builder-floating-card canvas-stage-card"
            ref={canvasStageRef}
          >
            {loading === "ai" ||
            assistantStatus === "thinking" ||
            assistantStatus === "applying" ? (
              <div className="canvas-stage-busy-overlay" aria-live="polite">
                <Spinner size="lg" tone="brand" />
                <div className="page-stack" style={{ gap: 4 }}>
                  <strong>
                    {loading === "ai"
                      ? "Generating premium looks"
                      : assistantStatus === "applying"
                      ? "Applying your canvas changes"
                      : "Understanding your instruction"}
                  </strong>
                  <span className="muted" style={{ fontSize: "0.78rem" }}>
                    {loading === "ai"
                      ? "Fresh variants are being prepared without replacing the active canvas."
                      : assistantFeedback}
                  </span>
                </div>
              </div>
            ) : null}
            <div className="canvas-stage-inner">
              <div className="canvas-stage-watermark" />
              <div
                ref={canvasViewportRef}
                className="invoice-canvas-scroll canvas-primary-scroll stitched-canvas-scroll"
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
            </div>
          </section>

          <div className="builder-bottom-actions">
            <button
              type="button"
              className="tray-btn tray-btn-ghost"
              onClick={() => setBlocks(defaultBlocks(invoice.style.templateId))}
            >
              <span className="button-icon-text">↺</span>
              <span>Reset Layout</span>
            </button>
            <button
              type="button"
              className="tray-btn tray-btn-ghost"
              onClick={openPdfPreview}
            >
              <span className="button-icon-text">⌲</span>
              <span>Preview PDF</span>
            </button>
            <div className="action-tray-divider" />
            <button
              type="button"
              className="tray-btn tray-btn-primary"
              onClick={finalizeCanvas}
            >
              <span className="button-icon-text">▣</span>
              <span>Finalize Canvas PDF</span>
            </button>
          </div>

          <section
            className="canvas-assistant-dock"
            aria-label="Canvas assistant"
          >
            <div className="canvas-assistant-shell">
              <div className="canvas-assistant-head">
                <div className="page-stack" style={{ gap: 4 }}>
                  <strong>Canvas Assistant</strong>
                  <span className="muted" style={{ fontSize: "0.74rem" }}>
                    Acts like a personal AI assistant on the current canvas —
                    paste anything, including messy text or voice transcript.
                  </span>
                </div>
              </div>
              <div className="assistant-status-row">
                <span className={`assistant-status-pill is-${assistantStatus}`}>
                  {assistantStatus === "listening"
                    ? "Listening"
                    : assistantStatus === "thinking"
                    ? "Understanding"
                    : assistantStatus === "applying"
                    ? "Applying"
                    : "Ready"}
                </span>
                <span className="assistant-feedback-text">
                  {assistantFeedback}
                </span>
              </div>
              <div className="canvas-assistant-input-row">
                <div className="canvas-assistant-input-shell">
                  <textarea
                    ref={assistantInputRef}
                    className="canvas-assistant-input"
                    value={assistantCommand}
                    onChange={(event) =>
                      setAssistantCommand(event.target.value)
                    }
                    onKeyDown={handleAssistantKeyDown}
                    rows={2}
                    placeholder="Type or paste anything: a client email, rough notes, a voice transcript, or a direct instruction like “add item Hello qty 1 unit 300 USD”, “bill to Acme”, “make note warmer”, or “change this selected text to Paid on receipt”."
                  />
                  {speechSupported ? (
                    <button
                      type="button"
                      className={`assistant-voice-button is-${assistantStatus}`}
                      onClick={toggleVoiceCapture}
                      disabled={
                        assistantStatus === "thinking" ||
                        assistantStatus === "applying" ||
                        loading === "ai"
                      }
                      aria-pressed={assistantStatus === "listening"}
                      aria-label={
                        assistantStatus === "listening"
                          ? "Stop voice capture"
                          : assistantStatus === "thinking" ||
                            assistantStatus === "applying"
                          ? "Analyzing your request"
                          : "Start voice capture"
                      }
                    >
                      <span className="assistant-voice-button-inner">
                        <span
                          className="assistant-voice-bars"
                          aria-hidden="true"
                        >
                          <span />
                          <span />
                          <span />
                          <span />
                          <span />
                        </span>
                        <span className="assistant-voice-label">
                          {assistantStatus === "listening"
                            ? "Listening"
                            : "Speak"}
                        </span>
                      </span>
                    </button>
                  ) : null}
                </div>
                <div className="assistant-action-column">
                  <button
                    type="button"
                    className="assistant-send-button"
                    onClick={() => void applyAssistantCommand()}
                    disabled={
                      !assistantCommand.trim() ||
                      assistantStatus === "thinking" ||
                      assistantStatus === "applying" ||
                      loading === "ai"
                    }
                  >
                    Apply
                  </button>
                </div>
              </div>
              {assistantTranscript ? (
                <div className="assistant-transcript-row">
                  <strong>Heard</strong>
                  <span>{assistantTranscript}</span>
                </div>
              ) : null}
              <div className="canvas-assistant-chip-row">
                <button
                  type="button"
                  className="suggestion-chip"
                  onClick={() =>
                    void applyAssistantCommand("Change bg color to white")
                  }
                >
                  White background
                </button>
                <button
                  type="button"
                  className="suggestion-chip"
                  onClick={() =>
                    void applyAssistantCommand(
                      'Change note to "Thank you for your business"'
                    )
                  }
                >
                  Better note
                </button>
                <button
                  type="button"
                  className="suggestion-chip"
                  onClick={() =>
                    void applyAssistantCommand("Generate premium looks")
                  }
                >
                  Premium remix
                </button>
                <button
                  type="button"
                  className="suggestion-chip is-muted"
                  onClick={() => setAssistantCommand("")}
                >
                  Clear
                </button>
              </div>
            </div>
          </section>
        </main>

        <aside className="builder-side-rail builder-side-rail-right">
          <section className="builder-floating-card health-rail-card">
            <div className="health-rail-head">
              <h3>Document Health</h3>
            </div>

            <div className="health-stack">
              <div className="health-item is-good">
                <div className="health-icon">✓</div>
                <div>
                  <strong>Fact Lock Active</strong>
                  <span>
                    All variants preserve the same invoice information while
                    only presentation changes.
                  </span>
                </div>
              </div>

              <div className="health-item is-good">
                <div className="health-icon">✦</div>
                <div>
                  <strong>{brandInference.recommendedFamily}</strong>
                  <span>{brandInference.impression}</span>
                </div>
              </div>

              <div className="health-item is-warn">
                <div className="health-icon">!</div>
                <div>
                  <strong>Attachments Ready</strong>
                  <span>
                    {attachments.length
                      ? `${attachments.length} PDF${
                          attachments.length > 1 ? "s" : ""
                        } attached`
                      : "Optional supporting PDFs can still be added"}
                  </span>
                </div>
              </div>

              <div className="health-item is-good">
                <div className="health-icon">◎</div>
                <div>
                  <strong>Orchestra progress</strong>
                  <span>
                    {
                      orchestraPasses.filter((pass) => pass.status === "done")
                        .length
                    }{" "}
                    / {orchestraPasses.length} passes completed
                  </span>
                </div>
              </div>

              {selectedOrchestraVariant ? (
                <div className="health-score-card">
                  <strong>{selectedOrchestraVariant.family}</strong>
                  <div className="health-score-grid">
                    {(
                      Object.entries(selectedOrchestraVariant.score) as Array<
                        [keyof VariantScoreCard, number]
                      >
                    ).map(([key, value]) => (
                      <div key={key} className="health-score-pill">
                        <span>{key}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="health-suggestion-card">
                <strong>AI Suggestion</strong>
                <p>
                  {brandInference.notes[0]}. Best next move: compare{" "}
                  {variantCount} ranked looks, then use Optimize for the final
                  polish.
                </p>
                <button
                  type="button"
                  className="health-cta-button"
                  onClick={() => setAiTab("optimize")}
                >
                  Open Optimize Tab
                </button>
              </div>

              <div className="collaboration-card">
                <span className="tools-section-kicker">Live collaboration</span>
                <div className="collaboration-row">
                  <span className="collab-avatar">A</span>
                  <span className="collab-avatar">M</span>
                  <span className="collab-avatar">J</span>
                  <span className="collab-plus">+3</span>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
      <style jsx global>{`
        .pdf-preview-overlay {
          position: fixed;
          inset: 0;
          z-index: 70;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.52);
          backdrop-filter: blur(12px);
        }
        .pdf-preview-card {
          width: min(960px, 100%);
          max-height: calc(100vh - 48px);
          display: grid;
          gap: 16px;
          padding: 20px;
          border-radius: 26px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.96),
            rgba(243, 238, 255, 0.92)
          );
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.32);
        }
        .pdf-preview-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .pdf-preview-stage {
          overflow: auto;
          padding: 18px;
          border-radius: 20px;
          background: linear-gradient(180deg, #efe7ff 0%, #dcccff 100%);
        }
        .pdf-preview-paper {
          margin: 0 auto;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 24px 54px rgba(15, 23, 42, 0.18);
        }
        .explorer-collapsed-card {
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .top-ai-assistant-callout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.62);
          border: 1px solid rgba(90, 59, 207, 0.12);
        }
        .canvas-assistant-dock {
          position: sticky;
          bottom: 16px;
          z-index: 24;
          width: 100%;
        }
        .canvas-assistant-shell {
          display: grid;
          gap: 12px;
          padding: 14px;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          background: linear-gradient(
            180deg,
            rgba(36, 18, 79, 0.78),
            rgba(77, 36, 156, 0.66)
          );
          box-shadow: 0 18px 44px rgba(30, 18, 63, 0.34);
          backdrop-filter: blur(20px);
        }
        .canvas-assistant-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          color: #ffffff;
        }
        .assistant-status-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          color: #ffffff;
        }
        .assistant-status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 28px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.16);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.02em;
        }
        .assistant-status-pill.is-listening {
          background: rgba(252, 211, 77, 0.18);
          color: #fde68a;
        }
        .assistant-status-pill.is-thinking {
          background: rgba(191, 219, 254, 0.2);
          color: #dbeafe;
        }
        .assistant-status-pill.is-applying {
          background: rgba(167, 243, 208, 0.2);
          color: #d1fae5;
        }
        .assistant-feedback-text {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.88);
        }
        .canvas-assistant-input-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: stretch;
        }
        .canvas-assistant-input-shell {
          position: relative;
        }
        .canvas-assistant-input {
          width: 100%;
          min-height: 96px;
          padding: 14px 18px 18px;
          padding-right: 152px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.96);
          color: #1f1638;
          font-size: 0.96rem;
          line-height: 1.45;
          resize: vertical;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.42);
        }
        .canvas-assistant-input::placeholder {
          color: rgba(75, 55, 123, 0.58);
        }
        .canvas-assistant-input:focus {
          outline: none;
          border-color: rgba(167, 139, 250, 0.72);
          box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.18);
        }
        .assistant-action-column {
          display: grid;
          gap: 10px;
          align-content: stretch;
        }
        .assistant-looks-button,
        .assistant-send-button,
        .assistant-voice-button {
          min-height: 48px;
          border: 0;
          border-radius: 16px;
          padding: 0 18px;
          font-weight: 800;
          cursor: pointer;
        }
        .assistant-looks-button {
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.16);
        }
        .assistant-send-button {
          background: linear-gradient(135deg, #ffffff 0%, #dfe4ff 100%);
          color: #2d175d;
        }
        .assistant-send-button:disabled {
          opacity: 0.64;
          cursor: not-allowed;
        }
        .assistant-voice-button {
          position: absolute;
          right: 12px;
          bottom: 12px;
          min-width: 112px;
          min-height: 46px;
          overflow: hidden;
          background: linear-gradient(180deg, #23252b 0%, #17181c 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 14px 30px rgba(15, 23, 42, 0.24);
        }
        .assistant-voice-button:disabled {
          cursor: wait;
          opacity: 0.88;
        }
        .assistant-voice-button-inner {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
        }
        .assistant-voice-bars {
          display: inline-flex;
          align-items: flex-end;
          gap: 3px;
          height: 20px;
        }
        .assistant-voice-bars span {
          width: 3px;
          border-radius: 999px;
          background: currentColor;
          opacity: 0.92;
          transform-origin: center bottom;
        }
        .assistant-voice-bars span:nth-child(1) {
          height: 8px;
          animation-delay: 0s;
        }
        .assistant-voice-bars span:nth-child(2) {
          height: 14px;
          animation-delay: 0.12s;
        }
        .assistant-voice-bars span:nth-child(3) {
          height: 18px;
          animation-delay: 0.24s;
        }
        .assistant-voice-bars span:nth-child(4) {
          height: 13px;
          animation-delay: 0.36s;
        }
        .assistant-voice-bars span:nth-child(5) {
          height: 9px;
          animation-delay: 0.48s;
        }
        .assistant-voice-label {
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .assistant-voice-button.is-listening {
          background: linear-gradient(180deg, #18191d 0%, #101114 100%);
          box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.16),
            0 18px 36px rgba(251, 191, 36, 0.16);
        }
        .assistant-voice-button.is-listening::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 16% 50%, rgba(255, 255, 255, 0.12), transparent 34%);
          pointer-events: none;
        }
        .assistant-voice-button.is-listening .assistant-voice-bars span {
          animation: assistantVoiceListening 0.88s ease-in-out infinite;
        }
        .assistant-voice-button.is-thinking,
        .assistant-voice-button.is-applying {
          background: linear-gradient(180deg, #20243a 0%, #15182b 100%);
        }
        .assistant-transcript-row {
          display: grid;
          gap: 4px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.92);
          font-size: 0.78rem;
        }
        .canvas-assistant-chip-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        @keyframes assistantVoiceListening {
          0%,
          100% {
            transform: scaleY(0.35);
            opacity: 0.66;
          }
          25% {
            transform: scaleY(1.15);
            opacity: 1;
          }
          50% {
            transform: scaleY(0.55);
            opacity: 0.82;
          }
          75% {
            transform: scaleY(1.35);
            opacity: 1;
          }
        }
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
        .invoice-builder-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 156px minmax(0, 720px) 156px;
          justify-content: center;
          gap: 16px;
          align-items: start;
          padding: 18px 12px 28px;
          background: radial-gradient(
              circle at top,
              rgba(255, 255, 255, 0.7),
              transparent 34%
            ),
            linear-gradient(180deg, #eef7f5 0%, #e8f0fb 50%, #f7fafc 100%);
        }
        .builder-side-rail {
          position: sticky;
          top: 18px;
        }
        .builder-center-column {
          display: grid;
          gap: 14px;
          justify-items: center;
        }
        .builder-floating-card {
          width: 100%;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.9),
            rgba(236, 229, 255, 0.86)
          );
          box-shadow: 0 18px 44px rgba(44, 12, 122, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.42);
          backdrop-filter: blur(14px);
        }
        .tools-rail-card,
        .health-rail-card {
          padding: 14px;
          gap: 14px;
          display: grid;
        }
        .tools-rail-head,
        .health-rail-head {
          display: grid;
          gap: 2px;
        }
        .tools-rail-head h3,
        .health-rail-head h3 {
          margin: 0;
          font-size: 0.95rem;
          color: #24124f;
          letter-spacing: -0.03em;
        }
        .tools-rail-head span {
          font-size: 0.66rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(36, 18, 79, 0.62);
          font-weight: 700;
        }
        .tools-rail-nav {
          display: grid;
          gap: 8px;
        }
        .tools-rail-item {
          width: 100%;
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          color: #43346b;
          font-weight: 700;
          cursor: pointer;
          text-align: left;
        }
        .tools-rail-item.is-active {
          background: rgba(255, 255, 255, 0.88);
          color: #5130d6;
          box-shadow: 0 10px 18px rgba(81, 48, 214, 0.14);
        }
        .tools-rail-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: currentColor;
          opacity: 0.72;
        }
        .tools-rail-footer {
          display: grid;
          gap: 8px;
          margin-top: 4px;
        }
        .top-ai-card {
          padding: 12px 14px;
          display: grid;
          gap: 10px;
        }
        .top-ai-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          color: #2a1959;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .top-ai-input-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: start;
        }
        .ai-orchestra-input-row {
          grid-template-columns: minmax(0, 1fr) 220px;
        }
        .ai-create-actions {
          display: grid;
          gap: 10px;
        }
        .top-ai-secondary {
          border: 1px solid rgba(255, 255, 255, 0.34);
          border-radius: 12px;
          padding: 0 16px;
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.58);
          color: #1e143f;
          font-weight: 800;
          cursor: pointer;
        }
        .top-ai-textarea {
          min-height: 56px;
          max-height: 84px;
          resize: none;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.82);
        }
        .top-ai-generate {
          align-self: stretch;
          min-width: 148px;
          //   min-height: 50px;
        }
        .top-ai-chip-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ai-fact-strip {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .fact-pill {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.54);
          color: #4e4670;
          font-size: 0.68rem;
          font-weight: 700;
        }
        .ai-section-title {
          color: #26194c;
          font-size: 0.84rem;
        }
        .ai-variant-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .ai-variant-card {
          border-radius: 22px;
          padding: 14px;
          display: grid;
          gap: 12px;
          background: rgba(255, 255, 255, 0.58);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 16px 28px rgba(65, 30, 140, 0.08);
        }
        .ai-variant-card.is-active {
          border-color: rgba(0, 63, 171, 0.18);
          box-shadow: 0 20px 36px rgba(0, 63, 171, 0.14);
        }
        .ai-variant-card-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }
        .variant-apply-button {
          border: 0;
          border-radius: 12px;
          padding: 10px 12px;
          background: linear-gradient(135deg, #003fab 0%, #0455dd 100%);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }
        .variant-score-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .variant-score-pill,
        .health-score-pill {
          border-radius: 12px;
          padding: 9px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.6);
          color: #4e4670;
          font-size: 0.66rem;
        }
        .variant-score-pill strong,
        .health-score-pill strong {
          margin: 0;
          font-size: 0.72rem;
          color: #26194c;
        }
        .ai-optimize-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .optimize-action-button {
          border: 1px solid rgba(255, 255, 255, 0.34);
          border-radius: 16px;
          padding: 13px 14px;
          background: rgba(255, 255, 255, 0.5);
          color: #26194c;
          font-size: 0.76rem;
          font-weight: 800;
          text-align: left;
          cursor: pointer;
        }
        .ai-optimize-summary,
        .ai-empty-inline-state,
        .health-score-card {
          border-radius: 16px;
          padding: 14px;
          display: grid;
          gap: 8px;
          background: rgba(255, 255, 255, 0.46);
        }
        .ai-optimize-summary strong,
        .health-score-card strong {
          color: #26194c;
          font-size: 0.78rem;
          margin: 0;
        }
        .ai-optimize-summary span,
        .ai-empty-inline-state {
          color: #645c81;
          font-size: 0.7rem;
          line-height: 1.5;
        }
        .health-score-grid {
          display: grid;
          gap: 8px;
        }
        .action-chip {
          cursor: pointer;
        }
        .canvas-stage-card {
          padding: 14px;
        }
        .canvas-stage-inner {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 64px;
          gap: 12px;
          align-items: start;
        }
        .canvas-inline-palette {
          display: flex;
          justify-content: center;
        }
        .palette-rail {
          display: grid;
          gap: 10px;
          padding: 8px 6px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(89, 61, 196, 0.12);
        }
        .palette-rail-swatch {
          position: relative;
          width: 42px;
          display: grid;
          justify-items: center;
          gap: 5px;
          padding: 8px 4px;
          border-radius: 14px;
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
        .palette-rail-label {
          font-size: 0.5rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #726790;
        }
        .builder-bottom-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 8px 12px 0;
        }
        .invoice-panel-card {
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.97),
            rgba(246, 240, 255, 0.92)
          );
          box-shadow: 0 18px 44px rgba(44, 12, 122, 0.18);
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
        .canvas-primary-scroll,
        .stitched-canvas-scroll {
          min-width: 0;
        }
        .invoice-canvas-scroll {
          overflow: hidden;
          padding: 16px;
          border-radius: 26px;
          border: 1px solid rgba(108, 77, 220, 0.12);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.98),
            rgba(240, 236, 255, 0.9)
          );
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.46),
            0 20px 46px rgba(47, 18, 130, 0.16);
        }
        .health-stack {
          display: grid;
          gap: 10px;
        }
        .health-item,
        .health-suggestion-card {
          border-radius: 14px;
          padding: 12px;
          display: grid;
          gap: 6px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.34);
        }
        .health-item strong,
        .health-suggestion-card strong {
          color: #291854;
          font-size: 0.8rem;
        }
        .health-item span,
        .health-suggestion-card p {
          margin: 0;
          font-size: 0.68rem;
          line-height: 1.45;
          color: #6f6690;
        }
        .health-item.is-good {
          box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.18);
        }
        .health-item.is-warn {
          box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.18);
        }
        .health-suggestion-card {
          background: linear-gradient(180deg, #6a4df1 0%, #5a39dd 100%);
        }
        .health-suggestion-card strong,
        .health-suggestion-card p {
          color: #fff;
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
          border: 1px solid rgba(15, 23, 42, 0.06);
          backdrop-filter: blur(8px);
          box-shadow: none !important;
          transition: box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .canvas-block:hover {
          box-shadow: 0 10px 24px rgba(77, 88, 138, 0.08);
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
          opacity: 0.22;
          transition: opacity 0.2s ease, transform 0.2s ease;
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
          opacity: 0.22;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .canvas-block:hover .canvas-drag-handle,
        .canvas-block:hover .canvas-delete-handle,
        .canvas-block.is-selected .canvas-drag-handle,
        .canvas-block.is-selected .canvas-delete-handle {
          opacity: 1;
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
        .canvas-static-field {
          display: block;
          min-width: 0;
          width: 100%;
          font-size: 0.6rem;
          line-height: 1.18;
          color: inherit;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .canvas-static-field.is-description {
          white-space: normal;
          line-height: 1.12;
          max-height: 2.24em;
        }
        .canvas-static-field.is-number,
        .canvas-static-field.is-amount {
          text-align: right;
        }
        .canvas-static-field.is-currency {
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .canvas-summary-rate {
          display: inline-block;
          min-width: 18px;
          text-align: center;
          font-weight: 800;
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
        .canvas-table-shell.is-readonly {
          grid-template-rows: auto 1fr auto;
          gap: 5px;
        }
        .canvas-table-shell.is-readonly .canvas-table-head {
          padding: 6px 8px;
          font-size: 0.5rem;
        }
        .canvas-table-shell.is-readonly .canvas-table-body {
          gap: 4px;
          overflow: hidden;
        }
        .canvas-table-shell.is-readonly .canvas-table-row {
          padding: 4px 6px;
          gap: 5px;
        }
        .canvas-table-shell.is-readonly .canvas-table-summary {
          gap: 4px;
          width: min(260px, 100%);
          padding-top: 6px;
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
        .invoice-builder-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 228px minmax(0, 850px) 228px;
          justify-content: center;
          gap: 18px;
          align-items: start;
          padding: 18px 16px 36px;
          background: radial-gradient(
              circle at top,
              rgba(255, 255, 255, 0.14),
              transparent 34%
            ),
            linear-gradient(180deg, #4b1fd2 0%, #651be7 52%, #781ef0 100%);
        }
        .builder-side-rail {
          position: sticky;
          top: 18px;
          display: grid;
          gap: 14px;
        }
        .builder-side-rail-left,
        .builder-side-rail-right {
          width: 228px;
        }
        .builder-center-column {
          width: min(100%, 850px);
          display: grid;
          gap: 14px;
          justify-items: center;
        }
        .builder-floating-card {
          width: 100%;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: linear-gradient(
            180deg,
            rgba(238, 225, 255, 0.92),
            rgba(218, 194, 252, 0.88)
          );
          box-shadow: 0 20px 52px rgba(35, 10, 106, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(18px);
        }
        .tools-rail-card,
        .health-rail-card {
          padding: 14px;
          display: grid;
          gap: 14px;
        }
        .tools-rail-head,
        .health-rail-head {
          display: grid;
          gap: 4px;
        }
        .tools-rail-head h3,
        .health-rail-head h3 {
          margin: 0;
          color: #1e143f;
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }
        .tools-rail-head span,
        .tools-section-kicker,
        .pro-kicker {
          font-size: 0.63rem;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: rgba(30, 20, 63, 0.58);
          font-weight: 800;
        }
        .tools-rail-nav {
          display: grid;
          gap: 8px;
        }
        .tools-rail-item {
          width: 100%;
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 12px;
          color: #544873;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s ease, transform 0.2s ease, color 0.2s ease;
        }
        .tools-rail-item:hover {
          background: rgba(255, 255, 255, 0.34);
        }
        .tools-rail-item.is-active {
          background: rgba(255, 255, 255, 0.88);
          color: #4c32cc;
          box-shadow: 0 10px 22px rgba(79, 51, 204, 0.16);
        }
        .tools-rail-icon {
          width: 18px;
          display: inline-grid;
          place-items: center;
          font-size: 0.86rem;
          opacity: 0.86;
        }
        .tools-rail-section {
          display: grid;
          gap: 10px;
        }
        .tools-palette-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .tools-palette-swatch {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.54);
          cursor: pointer;
          min-width: 0;
        }
        .tools-palette-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }
        .tools-palette-dot {
          width: 16px;
          height: 16px;
          border-radius: 999px;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08);
          flex: 0 0 auto;
        }
        .tools-palette-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.66rem;
          font-weight: 700;
          text-transform: capitalize;
          color: #4a4165;
        }
        .tools-rail-footer {
          margin-top: 2px;
        }
        .attachment-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pro-upgrade-card {
          padding: 14px;
          display: grid;
          gap: 10px;
          justify-items: center;
          text-align: center;
        }
        .pro-upgrade-button {
          width: 100%;
          border: 0;
          border-radius: 12px;
          padding: 10px 12px;
          color: #fff;
          font-weight: 800;
          background: linear-gradient(135deg, #1f4dd8 0%, #003fab 100%);
          box-shadow: 0 14px 28px rgba(0, 63, 171, 0.26);
        }
        .top-ai-card {
          width: min(100%, 850px);
          padding: 14px;
          display: grid;
          gap: 12px;
          background: linear-gradient(
            180deg,
            rgba(237, 224, 255, 0.94),
            rgba(217, 193, 251, 0.9)
          );
        }
        .top-ai-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .top-ai-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1e143f;
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .ai-orchestra-head-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ai-tab-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .ai-tab-button {
          border: 1px solid rgba(255, 255, 255, 0.36);
          border-radius: 16px;
          padding: 12px 14px;
          display: grid;
          gap: 4px;
          background: rgba(255, 255, 255, 0.34);
          color: #4e4670;
          text-align: left;
          cursor: pointer;
          transition: transform 0.18s ease, background 0.18s ease,
            box-shadow 0.18s ease;
        }
        .ai-tab-button strong {
          font-size: 0.8rem;
          color: #26194c;
        }
        .ai-tab-button span {
          font-size: 0.68rem;
          color: #655d82;
        }
        .ai-tab-button.is-active {
          background: rgba(255, 255, 255, 0.76);
          box-shadow: 0 14px 24px rgba(82, 54, 182, 0.12);
          transform: translateY(-1px);
        }
        .ai-pass-row {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
        }
        .ai-pass-card {
          min-height: 90px;
          border-radius: 16px;
          padding: 12px;
          display: grid;
          align-content: start;
          gap: 6px;
          background: rgba(255, 255, 255, 0.26);
          border: 1px solid rgba(255, 255, 255, 0.28);
        }
        .ai-pass-card strong {
          font-size: 0.72rem;
          color: #26194c;
        }
        .ai-pass-card span {
          font-size: 0.64rem;
          color: #655d82;
          line-height: 1.4;
        }
        .ai-pass-card.is-running {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.84),
            rgba(223, 230, 255, 0.72)
          );
          border-color: rgba(0, 63, 171, 0.18);
        }
        .ai-pass-card.is-done {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.84),
            rgba(225, 248, 235, 0.72)
          );
        }
        .ai-orchestra-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ai-variant-count-row {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .variant-count-chip {
          border: 1px solid rgba(255, 255, 255, 0.34);
          border-radius: 999px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.42);
          color: #4e4670;
          font-size: 0.72rem;
          font-weight: 800;
          cursor: pointer;
        }
        .variant-count-chip.is-active {
          background: linear-gradient(135deg, #003fab 0%, #0455dd 100%);
          color: #fff;
          box-shadow: 0 12px 22px rgba(0, 63, 171, 0.18);
        }
        .top-ai-sparkle {
          color: #244fd4;
          font-size: 0.95rem;
        }
        .history-chip {
          border: 0;
          background: transparent;
          color: rgba(30, 20, 63, 0.46);
          font-size: 0.64rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          cursor: pointer;
        }
        .top-ai-input-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: start;
        }
        .top-ai-textarea {
          min-height: 54px;
          max-height: 84px;
          padding: 14px 16px;
          resize: none;
          border: 0;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.5);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
          font-size: 0.86rem;
        }
        .top-ai-generate {
          //   align-self: stretch;
          align-self: center;

          border: 0;
          border-radius: 12px;
          padding: 0 18px;
          min-width: 182px;
          height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #fff;
          font-weight: 800;
          background: linear-gradient(135deg, #003fab 0%, #0455dd 100%);
          box-shadow: 0 16px 30px rgba(0, 63, 171, 0.24);
          cursor: pointer;
        }
        .button-icon-text {
          display: inline-grid;
          place-items: center;
          font-size: 0.9rem;
          line-height: 1;
        }
        .top-ai-chip-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .suggestion-chip {
          border: 1px solid rgba(255, 255, 255, 0.34);
          border-radius: 999px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.44);
          color: #5d5578;
          font-size: 0.67rem;
          font-weight: 700;
          cursor: pointer;
        }
        .suggestion-chip.is-muted {
          background: rgba(255, 255, 255, 0.26);
          color: rgba(30, 20, 63, 0.58);
        }
        .canvas-stage-card {
          width: min(100%, 850px);
          padding: 14px;
          background: rgba(255, 255, 255, 0.16);
        }
        .canvas-stage-inner {
          position: relative;
          display: block;
        }
        .canvas-stage-watermark {
          position: absolute;
          top: -14px;
          right: -6px;
          width: 220px;
          height: 220px;
          border-radius: 999px;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0) 70%
          );
          pointer-events: none;
        }
        .invoice-canvas-scroll {
          overflow: hidden;
          padding: 18px;
          border: 0;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.12);
          box-shadow: none;
        }
        .invoice-canvas-page {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
        }
        .builder-bottom-actions {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 7px;
          border-radius: 16px;
          background: rgba(238, 221, 255, 0.84);
          border: 1px solid rgba(255, 255, 255, 0.28);
          box-shadow: 0 18px 34px rgba(40, 9, 121, 0.18);
          backdrop-filter: blur(16px);
        }
        .action-tray-divider {
          width: 1px;
          align-self: stretch;
          background: rgba(89, 72, 141, 0.16);
          margin: 2px 4px;
        }
        .tray-btn {
          border: 0;
          border-radius: 12px;
          padding: 11px 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
        }
        .tray-btn-ghost {
          background: rgba(255, 255, 255, 0.42);
          color: #4d4a5a;
        }
        .tray-btn-primary {
          background: linear-gradient(135deg, #003fab 0%, #0455dd 100%);
          color: #fff;
          box-shadow: 0 14px 26px rgba(0, 63, 171, 0.24);
        }
        .health-rail-card {
          gap: 14px;
        }
        .health-stack {
          display: grid;
          gap: 12px;
        }
        .health-item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          border-radius: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.42);
        }
        .health-icon {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 0.84rem;
          font-weight: 900;
          background: rgba(255, 255, 255, 0.8);
        }
        .health-item.is-good .health-icon {
          color: #16a34a;
        }
        .health-item.is-warn .health-icon {
          color: #d97706;
        }
        .health-item strong,
        .health-suggestion-card strong {
          display: block;
          color: #26194c;
          font-size: 0.78rem;
          margin-bottom: 4px;
        }
        .health-item span,
        .health-suggestion-card p {
          margin: 0;
          color: #645c81;
          font-size: 0.66rem;
          line-height: 1.45;
        }
        .health-suggestion-card {
          border-radius: 14px;
          padding: 14px;
          display: grid;
          gap: 10px;
          background: linear-gradient(180deg, #6a4df1 0%, #5332d1 100%);
          box-shadow: 0 18px 30px rgba(73, 47, 188, 0.24);
        }
        .health-suggestion-card strong,
        .health-suggestion-card p {
          color: #fff;
        }
        .health-cta-button {
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 12px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.16);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 800;
          cursor: pointer;
        }
        .collaboration-card {
          display: grid;
          gap: 10px;
          padding-top: 4px;
        }
        .collaboration-row {
          display: flex;
          align-items: center;
        }
        .collab-avatar,
        .collab-plus {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          margin-left: -6px;
          font-size: 0.68rem;
          font-weight: 800;
          border: 2px solid rgba(255, 255, 255, 0.9);
          background: linear-gradient(135deg, #0f172a, #334155);
          color: #fff;
        }
        .collaboration-row > :first-child {
          margin-left: 0;
        }
        .collab-plus {
          background: rgba(255, 255, 255, 0.7);
          color: #4934b2;
        }
        @media (max-width: 900px) {
          .top-ai-assistant-callout,
          .canvas-assistant-input-row {
            grid-template-columns: 1fr;
          }
          .explorer-collapsed-card,
          .canvas-assistant-head {
            flex-direction: column;
            align-items: stretch;
          }
          .assistant-looks-button,
          .assistant-send-button {
            width: 100%;
          }
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
          .invoice-builder-shell {
            grid-template-columns: 1fr;
          }
          .builder-side-rail {
            position: static;
          }
          .builder-side-rail-left,
          .builder-side-rail-right,
          .builder-center-column,
          .top-ai-card,
          .canvas-stage-card {
            width: min(850px, 100%);
            margin: 0 auto;
          }
          .builder-side-rail-left {
            order: 2;
          }
          .builder-side-rail-right {
            order: 3;
          }
          .top-ai-input-row {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 720px) {
          .invoice-builder-shell {
            padding-inline: 10px;
          }
          .canvas-assistant-dock {
            bottom: 10px;
          }
          .canvas-assistant-chip-row {
            display: grid;
          }
            padding-inline: 10px;
          }
          .invoice-canvas-scroll {
            padding: 8px;
          }
          .builder-bottom-actions {
            width: 100%;
            flex-wrap: wrap;
          }
          .action-tray-divider {
            display: none;
          }
          .tray-btn {
            width: 100%;
            justify-content: center;
          }
          .tools-palette-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

import { Injectable } from "@nestjs/common";
import crypto from "crypto";
import { PrismaService } from "./prisma.service";
import {
  AiCanvasGenerateDto,
  AiInvoiceDraftRequestDto,
  CanvasDraftRequestDto,
  CreateInvoiceDto,
  FinalizeCanvasInvoiceDto,
  FinalizeGeneratedInvoiceDto,
  InvoiceCanvasBlockDto,
} from "./invoices.dto";
import { LocalStorageService, StoredFileResult } from "./storage.service";
import { ProofQueueService } from "./proof-queue.service";
import { AiInvoiceService } from "./ai-invoice.service";
import { InvoicePdfService } from "./invoice-pdf.service";
import { getInvoiceStyle, InvoiceStyle } from "./invoice-design";

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

@Injectable()
export class InvoicesService {
  private readonly supportedCurrencyCodes = new Set(
    (
      (
        Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }
      ).supportedValuesOf?.("currency") || [
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
      ]
    ).map((code) => code.toUpperCase())
  );

  private readonly currencyDetectionRules: Array<{
    pattern: RegExp;
    code: string;
  }> = [
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
    private readonly proofQueue: ProofQueueService,
    private readonly aiInvoice: AiInvoiceService,
    private readonly invoicePdf: InvoicePdfService
  ) {}

  private getStatusLabel(status: string) {
    if (status === "anchored") return "Verified";
    if (status === "anchor_submitted") return "Proof Submitted";
    if (status === "anchor_failed_retrying") return "Retrying Proof";
    return "Pending Proof";
  }

  private buildVerifyUrl(publicVerifyId: string) {
    return `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/verify/${publicVerifyId}`;
  }

  private buildPdfUrl(invoiceId: string) {
    return `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"
    }/invoices/${invoiceId}/pdf`;
  }

  private buildRecordHash(input: {
    invoiceNumber: string;
    customerName: string;
    amount: string;
    currency: string;
    issueDate: string;
    fileHash?: string;
  }) {
    return crypto
      .createHash("sha256")
      .update(
        [
          input.invoiceNumber.trim(),
          input.customerName.trim(),
          input.amount.trim(),
          input.currency.trim(),
          input.issueDate.trim(),
          input.fileHash || "",
        ].join("|")
      )
      .digest("hex");
  }

  private async getDefaultOrganization() {
    return this.prisma.client.organization.upsert({
      where: { slug: "demo-company" },
      update: {},
      create: {
        name: "InvoiceProof Demo Company",
        slug: "demo-company",
      },
    });
  }

  private formatInvoiceRecord(invoice: any, document?: any) {
    const isPdf = (document?.mimeType || "").toLowerCase().includes("pdf");
    return {
      id: invoice.id,
      documentId: document?.id ?? invoice.documentId ?? null,
      publicVerifyId: invoice.publicVerifyId,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      amount: invoice.amount.toString(),
      currency: invoice.currency,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      status: invoice.status,
      statusLabel: this.getStatusLabel(invoice.status),
      notes: invoice.notes ?? null,
      fileName: document?.fileName ?? null,
      fileHash: document?.sha256 ?? null,
      recordHash: invoice.recordHash,
      verifyUrl: this.buildVerifyUrl(invoice.publicVerifyId),
      pdfUrl: document && isPdf ? this.buildPdfUrl(invoice.id) : null,
      createdAt: invoice.createdAt.toISOString(),
    };
  }

  private asText(value: unknown, maxLength: number, fallback = "") {
    const text = String(value ?? "").trim();
    if (!text || /^(undefined|null)$/i.test(text)) return fallback;
    return text.slice(0, maxLength);
  }

  private asMoneyish(value: unknown, fallback = "0.00") {
    const number = Number(String(value ?? "").replace(/[^\d.]/g, ""));
    if (!Number.isFinite(number)) return fallback;
    return number.toFixed(2);
  }

  private asDate(value: unknown, fallback?: string) {
    const text = String(value ?? "").trim();
    if (!text || /^(undefined|null)$/i.test(text))
      return fallback || new Date().toISOString().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime()))
      return parsed.toISOString().slice(0, 10);
    return fallback || new Date().toISOString().slice(0, 10);
  }

  private asCurrency(value: unknown) {
    const text = String(value ?? "").trim();
    if (!text || /^(undefined|null)$/i.test(text)) return "USD";
    for (const rule of this.currencyDetectionRules) {
      if (rule.pattern.test(text)) return rule.code;
    }
    const matches = text.toUpperCase().match(/[A-Z]{3}/g) || [];
    const detected = matches.find((code) =>
      this.supportedCurrencyCodes.has(code)
    );
    if (detected) return detected;
    const collapsed = text
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 3);
    return collapsed && this.supportedCurrencyCodes.has(collapsed)
      ? collapsed
      : "USD";
  }

  private asNumber(value: unknown, fallback: number) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  private normalizeLineItems(items: unknown[], totalAmount: string) {
    const normalized = Array.isArray(items)
      ? items.slice(0, 12).reduce(
          (
            rows: Array<{
              description: string;
              quantity: string;
              unitPrice: string;
              amount: string;
            }>,
            item: any,
            index
          ) => {
            const quantity = this.asMoneyish(item?.quantity, "1.00");
            const unitPrice = this.asMoneyish(item?.unitPrice, totalAmount);
            const description = this.asText(
              item?.description,
              150,
              `Line item ${index + 1}`
            );
            if (/\b(?:gst|vat|tax|discount)\b/i.test(description)) {
              return rows;
            }
            rows.push({
              description,
              quantity,
              unitPrice,
              amount: this.asMoneyish(
                item?.amount,
                (Number(quantity) * Number(unitPrice)).toFixed(2)
              ),
            });
            return rows;
          },
          []
        )
      : [];

    return normalized.length
      ? normalized
      : [
          {
            description: "Professional services",
            quantity: "1.00",
            unitPrice: totalAmount,
            amount: totalAmount,
          },
        ];
  }

  private deriveTaxPercentage(raw: any, lineItems: Array<{ amount: string }>) {
    if (
      raw?.taxPercentage !== undefined &&
      raw?.taxPercentage !== null &&
      String(raw.taxPercentage).trim()
    ) {
      return this.asMoneyish(raw.taxPercentage, "0.00");
    }

    const subtotal = lineItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    if (!Array.isArray(raw?.lineItems)) return "0.00";

    for (const item of raw.lineItems) {
      const description = this.asText(item?.description, 150, "");
      if (!/\b(?:gst|vat|tax)\b/i.test(description)) continue;
      const amount = Number(this.asMoneyish(item?.amount, "0.00"));
      if (subtotal > 0 && amount > 0) {
        return this.asMoneyish((amount * 100) / subtotal, "0.00");
      }
      const match = description.match(/(\d+(?:\.\d+)?)\s*%/);
      if (match) {
        return this.asMoneyish(match[1], "0.00");
      }
    }

    for (const item of raw.lineItems) {
      if (
        item?.taxPercentage !== undefined &&
        item?.taxPercentage !== null &&
        String(item.taxPercentage).trim()
      ) {
        return this.asMoneyish(item.taxPercentage, "0.00");
      }
    }

    return "0.00";
  }

  private deriveDiscountPercentage(
    raw: any,
    lineItems: Array<{ amount: string }>
  ) {
    if (
      raw?.discountPercentage !== undefined &&
      raw?.discountPercentage !== null &&
      String(raw.discountPercentage).trim()
    ) {
      return this.asMoneyish(raw.discountPercentage, "0.00");
    }

    const subtotal = lineItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    if (!Array.isArray(raw?.lineItems)) return "0.00";

    for (const item of raw.lineItems) {
      const description = this.asText(item?.description, 150, "");
      if (!/\b(?:discount)\b/i.test(description)) continue;
      const amount = Number(this.asMoneyish(item?.amount, "0.00"));
      if (subtotal > 0 && amount > 0) {
        return this.asMoneyish((amount * 100) / subtotal, "0.00");
      }
      const match = description.match(/(\d+(?:\.\d+)?)\s*%/);
      if (match) {
        return this.asMoneyish(match[1], "0.00");
      }
    }

    return "0.00";
  }

  private resolveStyle(raw: any) {
    const templateId = this.asText(
      raw?.selectedTemplateId || raw?.style?.templateId,
      40,
      "corporate"
    );
    const styleOverrides = raw?.style ? { ...raw.style } : {};
    const palette = {
      ...(styleOverrides?.palette || {}),
      ...(raw?.palette || {}),
    };
    return getInvoiceStyle(templateId, {
      ...styleOverrides,
      templateId,
      palette,
    } as Partial<InvoiceStyle>);
  }

  private normalizeInvoicePayload(raw: any) {
    const issueDate = this.asDate(raw?.issueDate);
    const dueDate = this.asDate(raw?.dueDate, issueDate);
    const requestedAmount = this.asMoneyish(raw?.amount);
    const lineItems = this.normalizeLineItems(raw?.lineItems, requestedAmount);
    const taxPercentage = this.deriveTaxPercentage(raw, lineItems);
    const discountPercentage = this.deriveDiscountPercentage(raw, lineItems);
    const subtotal = lineItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    const discountAmount = (subtotal * Number(discountPercentage || 0)) / 100;
    const taxableSubtotal = Math.max(subtotal - discountAmount, 0);
    const taxAmount = (taxableSubtotal * Number(taxPercentage || 0)) / 100;
    const amount = (taxableSubtotal + taxAmount).toFixed(2);

    return {
      invoiceNumber: this.asText(
        raw?.invoiceNumber,
        100,
        `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`
      ),
      customerName: this.asText(raw?.customerName, 150, "Customer name"),
      amount,
      currency: this.asCurrency(raw?.currency),
      taxPercentage,
      discountPercentage,
      issueDate,
      dueDate,
      notes: this.asText(raw?.notes, 1000, ""),
      issuerName: this.asText(raw?.issuerName, 120, "InvoiceProof Studio"),
      issuerEmail: this.asText(
        raw?.issuerEmail,
        160,
        "billing@invoiceproof.app"
      ),
      issuerAddress: this.asText(
        raw?.issuerAddress,
        240,
        "123 Market Street, San Francisco, CA"
      ),
      accentLabel: this.asText(raw?.accentLabel, 80, ""),
      paymentTerms: this.asText(raw?.paymentTerms, 120, "Due on receipt"),
      lineItems,
      style: this.resolveStyle(raw),
    };
  }

  private buildCanvasBlocks(templateId: string): CanvasBlock[] {
    const common: Record<string, CanvasBlock[]> = {
      corporate: [
        {
          id: "logo",
          type: "logo",
          x: 40,
          y: 42,
          w: 86,
          h: 86,
          locked: false,
          editable: false,
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

    return common[templateId] || common.corporate;
  }

  private normalizeCanvasBlocks(rawBlocks: unknown, templateId: string) {
    const blocks =
      Array.isArray(rawBlocks) && rawBlocks.length
        ? rawBlocks
        : this.buildCanvasBlocks(templateId);
    return blocks.slice(0, 20).map((raw: any, index) => ({
      id: this.asText(raw?.id, 80, `block-${index + 1}`),
      type: this.asText(raw?.type, 40, "text"),
      x: this.asNumber(raw?.x, 40),
      y: this.asNumber(raw?.y, 40),
      w: this.asNumber(raw?.w, 180),
      h: this.asNumber(raw?.h, 60),
      z: this.asNumber(raw?.z, index + 1),
      locked: Boolean(raw?.locked),
      editable: raw?.editable !== false,
      content:
        typeof raw?.content === "string"
          ? raw.content.slice(0, 4000)
          : undefined,
      binding: { key: this.asText(raw?.binding?.key, 80, "") || undefined },
      style: {
        fontSize: this.asNumber(raw?.style?.fontSize, 14),
        fontWeight: this.asText(raw?.style?.fontWeight, 40, "600"),
        color: this.asText(raw?.style?.color, 12, ""),
        background: this.asText(raw?.style?.background, 12, ""),
        align: this.asText(raw?.style?.align, 20, "left"),
        radius: this.asNumber(raw?.style?.radius, 18),
      },
    }));
  }

  async list() {
    const organization = await this.getDefaultOrganization();
    const invoices = await this.prisma.client.invoiceRecord.findMany({
      where: { orgId: organization.id },
      include: { document: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return invoices.map((invoice: any) =>
      this.formatInvoiceRecord(invoice, invoice.document)
    );
  }

  async generateAiDrafts(input: AiInvoiceDraftRequestDto) {
    return {
      options: await this.aiInvoice.generateDrafts(input),
    };
  }

  async generateAiCanvasDraft(input: AiCanvasGenerateDto) {
    const draft = await this.aiInvoice.generateCanvasDraft(input);
    const normalized = this.normalizeInvoicePayload(draft.invoice);

    return {
      promptSummary: draft.promptSummary,
      missingFields: draft.missingFields,
      title: `${normalized.style.styleName} canvas`,
      accentLabel: normalized.style.accentLabel,
      templateId: normalized.style.templateId,
      styleDirection: normalized.style.tone,
      style: normalized.style,
      blocks: this.normalizeCanvasBlocks([], normalized.style.templateId),
      summary: normalized.style.previewSummary,
      invoice: {
        ...normalized,
        style: normalized.style,
      },
    };
  }

  async generateCanvasDrafts(input: CanvasDraftRequestDto) {
    const normalized = this.normalizeInvoicePayload(input);
    const templates = ["luxury", "corporate", "creative", "minimal"];
    return {
      options: templates.map((templateId) => {
        const style = getInvoiceStyle(templateId, {
          palette: {
            ...getInvoiceStyle(templateId).palette,
            ...(input.palette || {}),
          },
        } as Partial<InvoiceStyle>);
        return {
          title: `${style.styleName} canvas`,
          accentLabel: style.accentLabel,
          templateId: style.templateId,
          styleDirection: input.styleDirection || style.tone,
          style,
          blocks: this.normalizeCanvasBlocks([], style.templateId),
          summary: style.previewSummary,
          invoice: {
            ...normalized,
            style,
          },
        };
      }),
    };
  }

  async detectUpload(file: Express.Multer.File) {
    const detected = await this.aiInvoice.detectInvoiceFromPdf(file);
    return {
      fileName: file.originalname,
      detected,
    };
  }

  async create(input: CreateInvoiceDto, file?: Express.Multer.File) {
    const organization = await this.getDefaultOrganization();
    const publicVerifyId = crypto.randomUUID().slice(0, 12);
    const verifyUrl = this.buildVerifyUrl(publicVerifyId);
    const normalized = this.normalizeInvoicePayload(input);

    let storedFile: StoredFileResult | null = null;
    if (file) {
      const buffer = await this.prepareUploadedFileBuffer(
        file,
        verifyUrl,
        normalized.invoiceNumber
      );
      const stampedName = file.mimetype.toLowerCase().includes("pdf")
        ? file.originalname.replace(/\.pdf$/i, "") + "-sealed.pdf"
        : file.originalname;

      storedFile = await this.storage.saveFile({
        fileName: stampedName,
        mimeType: file.mimetype.toLowerCase().includes("pdf")
          ? "application/pdf"
          : file.mimetype,
        buffer,
      });
    }

    return this.persistInvoiceRecord({
      organizationId: organization.id,
      publicVerifyId,
      input: normalized,
      storedFile,
      metadataJson: {
        publicVerifyId,
        hasDocument: Boolean(storedFile),
        source: file ? "uploaded_legacy" : "manual",
      },
    });
  }

  async finalizeUpload(raw: unknown, file: Express.Multer.File) {
    const organization = await this.getDefaultOrganization();
    const publicVerifyId = crypto.randomUUID().slice(0, 12);
    const verifyUrl = this.buildVerifyUrl(publicVerifyId);
    const normalized = this.normalizeInvoicePayload(raw);

    const stampedBuffer = await this.invoicePdf.stampExistingPdf({
      pdfBuffer: file.buffer,
      verifyUrl,
      invoiceNumber: normalized.invoiceNumber,
    });

    const storedFile = await this.storage.saveFile({
      fileName: file.originalname.replace(/\.pdf$/i, "") + "-sealed.pdf",
      mimeType: "application/pdf",
      buffer: stampedBuffer,
    });

    return this.persistInvoiceRecord({
      organizationId: organization.id,
      publicVerifyId,
      input: normalized,
      storedFile,
      metadataJson: {
        publicVerifyId,
        hasDocument: true,
        source: "uploaded_pdf_ai_detected",
        lineItems: normalized.lineItems,
        issuerName: normalized.issuerName || null,
        extractionMode: process.env.GEMINI_API_KEY ? "gemini" : "fallback",
      },
    });
  }

  async finalizeGenerated(input: FinalizeGeneratedInvoiceDto) {
    const organization = await this.getDefaultOrganization();
    const publicVerifyId = crypto.randomUUID().slice(0, 12);
    const verifyUrl = this.buildVerifyUrl(publicVerifyId);
    const normalized = this.normalizeInvoicePayload(input);

    const pdfBuffer = await this.invoicePdf.generateInvoicePdf({
      invoice: normalized as unknown as FinalizeGeneratedInvoiceDto,
      verifyUrl,
    });

    const storedFile = await this.storage.saveFile({
      fileName: `${normalized.invoiceNumber || "invoice"}-sealed.pdf`,
      mimeType: "application/pdf",
      buffer: pdfBuffer,
    });

    return this.persistInvoiceRecord({
      organizationId: organization.id,
      publicVerifyId,
      input: normalized,
      storedFile,
      metadataJson: {
        publicVerifyId,
        hasDocument: true,
        source: "ai_generated",
        issuerName: normalized.issuerName || null,
        paymentTerms: normalized.paymentTerms || null,
        lineItems: normalized.lineItems,
        style: normalized.style || null,
      },
    });
  }

  async finalizeCanvas(
    input: FinalizeCanvasInvoiceDto,
    attachments: Express.Multer.File[]
  ) {
    const organization = await this.getDefaultOrganization();
    const publicVerifyId = crypto.randomUUID().slice(0, 12);
    const verifyUrl = this.buildVerifyUrl(publicVerifyId);
    const normalized = this.normalizeInvoicePayload(input);
    const blocks = this.normalizeCanvasBlocks(
      input.canvasBlocks,
      normalized.style.templateId
    );
    const logoDataUrl =
      typeof input.logoDataUrl === "string" &&
      input.logoDataUrl.startsWith("data:image/")
        ? input.logoDataUrl
        : undefined;

    const pdfBuffer = await this.invoicePdf.generateCanvasInvoicePdf({
      invoice: normalized as unknown as FinalizeGeneratedInvoiceDto,
      verifyUrl,
      blocks,
      logoDataUrl,
      attachmentBuffers: attachments.map((file) => file.buffer),
      attachmentNames: attachments.map((file) => file.originalname),
    });

    const storedFile = await this.storage.saveFile({
      fileName: `${normalized.invoiceNumber || "invoice"}-canvas-sealed.pdf`,
      mimeType: "application/pdf",
      buffer: pdfBuffer,
    });

    return this.persistInvoiceRecord({
      organizationId: organization.id,
      publicVerifyId,
      input: normalized,
      storedFile,
      metadataJson: {
        publicVerifyId,
        hasDocument: true,
        source: "canvas_builder",
        lineItems: normalized.lineItems,
        issuerName: normalized.issuerName || null,
        paymentTerms: normalized.paymentTerms || null,
        style: normalized.style,
        canvasBlocks: blocks,
        attachmentNames: attachments.map((file) => file.originalname),
        hasLogo: Boolean(logoDataUrl),
      },
    });
  }

  async getById(id: string) {
    const invoice = await this.prisma.client.invoiceRecord.findUnique({
      where: { id },
      include: { document: true },
    });
    if (!invoice) return null;

    return {
      ...this.formatInvoiceRecord(invoice, invoice.document),
      anchor: {
        batchId: invoice.batchId,
        txHash: invoice.anchorTxHash,
        anchoredAt: invoice.anchoredAt?.toISOString() ?? null,
      },
    };
  }

  async getPdf(id: string) {
    const invoice = await this.prisma.client.invoiceRecord.findUnique({
      where: { id },
      include: { document: true },
    });

    if (!invoice?.document?.storageKey) return null;

    const fileBuffer = await this.storage.getFile(invoice.document.storageKey);
    return {
      fileName: invoice.document.fileName || `${invoice.invoiceNumber}.pdf`,
      mimeType: invoice.document.mimeType || "application/pdf",
      buffer: fileBuffer,
    };
  }

  async getByVerifyId(publicVerifyId: string) {
    const invoice = await this.prisma.client.invoiceRecord.findUnique({
      where: { publicVerifyId },
      include: { organization: true, document: true, proof: true },
    });
    if (!invoice) return null;

    const isVerified = invoice.status === "anchored";

    return {
      publicVerifyId: invoice.publicVerifyId,
      status: invoice.status,
      statusLabel: this.getStatusLabel(invoice.status),
      isVerified,
      invoiceNumber: invoice.invoiceNumber,
      issuedBy: invoice.organization.name,
      customerName: invoice.customerName,
      amount: invoice.amount.toString(),
      currency: invoice.currency,
      issueDate: invoice.issueDate.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      anchoredAt: invoice.anchoredAt?.toISOString() ?? null,
      fileName: invoice.document?.fileName ?? null,
      recordHash: invoice.recordHash,
      fileHash: invoice.document?.sha256 ?? null,
      message: isVerified
        ? "This invoice matches the stored proof and has been verified."
        : invoice.status === "anchor_failed_retrying"
        ? "Proof submission hit a temporary issue and is being retried. The invoice record is still safely stored."
        : invoice.status === "anchor_submitted"
        ? "Proof submission is in progress and waiting for final confirmation."
        : "This invoice has been recorded and is waiting for blockchain-backed proof.",
      proof: invoice.proof
        ? {
            network: invoice.proof.network,
            txHash: invoice.proof.txHash,
            merkleRoot: invoice.proof.merkleRoot,
            isMock: invoice.proof.contractAddress === "0xMockAnchorRegistry",
            contractAddress: invoice.proof.contractAddress,
          }
        : null,
    };
  }

  async getQrData(id: string) {
    const invoice = await this.prisma.client.invoiceRecord.findUnique({
      where: { id },
    });
    if (!invoice) return null;

    return {
      verifyUrl: this.buildVerifyUrl(invoice.publicVerifyId),
    };
  }

  private async prepareUploadedFileBuffer(
    file: Express.Multer.File,
    verifyUrl: string,
    invoiceNumber: string
  ) {
    if (file.mimetype.toLowerCase().includes("pdf")) {
      return this.invoicePdf.stampExistingPdf({
        pdfBuffer: file.buffer,
        verifyUrl,
        invoiceNumber,
      });
    }

    return file.buffer;
  }

  private async persistInvoiceRecord(input: {
    organizationId: string;
    publicVerifyId: string;
    input: ReturnType<InvoicesService["normalizeInvoicePayload"]>;
    storedFile: StoredFileResult | null;
    metadataJson: Record<string, unknown>;
  }) {
    const fileHash = input.storedFile?.checksum;
    const recordHash = this.buildRecordHash({
      invoiceNumber: input.input.invoiceNumber,
      customerName: input.input.customerName,
      amount: input.input.amount,
      currency: input.input.currency,
      issueDate: input.input.issueDate,
      fileHash,
    });

    const result = await this.prisma.client.$transaction(
      async (tx: any) => {
        const document = input.storedFile
          ? await tx.document.create({
              data: {
                orgId: input.organizationId,
                storageKey: input.storedFile.key,
                fileName: input.storedFile.fileName,
                mimeType: input.storedFile.mimeType,
                fileSize: input.storedFile.fileSize,
                sha256: input.storedFile.checksum,
              },
            })
          : null;

        const invoice = await tx.invoiceRecord.create({
          data: {
            orgId: input.organizationId,
            documentId: document?.id,
            publicVerifyId: input.publicVerifyId,
            invoiceNumber: input.input.invoiceNumber,
            customerName: input.input.customerName,
            amount: input.input.amount,
            currency: input.input.currency,
            issueDate: new Date(input.input.issueDate),
            dueDate: input.input.dueDate
              ? new Date(input.input.dueDate)
              : undefined,
            status: "pending_anchor",
            recordHash,
            notes: input.input.notes,
          },
        });

        await tx.auditLog.create({
          data: {
            orgId: input.organizationId,
            action: "invoice.created",
            entityType: "InvoiceRecord",
            entityId: invoice.id,
            metadataJson: {
              ...input.metadataJson,
              status: invoice.status,
              recordHash,
            },
          },
        });

        return { invoice, document };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );

    this.proofQueue.enqueueBatchTrigger().catch((error) => {
      console.error("Failed to enqueue proof batch trigger", error);
    });

    return this.formatInvoiceRecord(result.invoice, result.document);
  }
}

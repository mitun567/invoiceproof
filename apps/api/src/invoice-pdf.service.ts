import { Injectable } from "@nestjs/common";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { FinalizeGeneratedInvoiceDto } from "./invoices.dto";
import { getInvoiceStyle, InvoiceStyle } from "./invoice-design";

type CanvasBlock = {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z?: number;
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
export class InvoicePdfService {
  private readonly footerHeight = 92;

  async stampExistingPdf(input: {
    pdfBuffer: Buffer;
    verifyUrl: string;
    invoiceNumber: string;
  }) {
    const sourceDoc = await PDFDocument.load(input.pdfBuffer);
    const outputDoc = await PDFDocument.create();
    const font = await outputDoc.embedFont(StandardFonts.Helvetica);
    const bold = await outputDoc.embedFont(StandardFonts.HelveticaBold);
    const qrImage = await this.embedQr(outputDoc, input.verifyUrl, "#1F3AE0");

    const sourcePages = sourceDoc.getPages();
    for (const sourcePage of sourcePages) {
      const { width, height } = sourcePage.getSize();
      const page = outputDoc.addPage([width, height]);
      const embedded = await outputDoc.embedPage(sourcePage);
      const contentTop = height - 10;
      const availableHeight = contentTop - (this.footerHeight + 10);
      const availableWidth = width - 20;
      const scale = Math.min(
        1,
        availableWidth / width,
        availableHeight / height
      );
      const drawWidth = width * scale;
      const drawHeight = height * scale;
      const x = (width - drawWidth) / 2;
      const y = this.footerHeight + 8 + (availableHeight - drawHeight) / 2;

      page.drawPage(embedded, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });

      this.drawFooter(page, {
        verifyUrl: input.verifyUrl,
        invoiceNumber: input.invoiceNumber,
        qrImage,
        font,
        bold,
        primary: rgb(0.11, 0.23, 0.88),
        secondary: rgb(0.07, 0.1, 0.18),
        surface: rgb(0.97, 0.98, 1),
        muted: rgb(0.36, 0.41, 0.47),
      });
    }

    return Buffer.from(await outputDoc.save());
  }

  async generateInvoicePdf(input: {
    invoice: FinalizeGeneratedInvoiceDto;
    verifyUrl: string;
  }) {
    return this.generateCanvasInvoicePdf({
      invoice: input.invoice,
      verifyUrl: input.verifyUrl,
      blocks: [],
      logoDataUrl: undefined,
      attachmentBuffers: [],
      attachmentNames: [],
    });
  }

  async generateCanvasInvoicePdf(input: {
    invoice: FinalizeGeneratedInvoiceDto;
    verifyUrl: string;
    blocks: CanvasBlock[];
    logoDataUrl?: string;
    attachmentBuffers: Buffer[];
    attachmentNames?: string[];
  }) {
    const style = getInvoiceStyle(
      input.invoice.style?.templateId,
      input.invoice.style
        ? ({ ...input.invoice.style } as Partial<InvoiceStyle>)
        : undefined
    );
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const qrImage = await this.embedQr(
      pdfDoc,
      input.verifyUrl,
      style.palette.text
    );
    const logoImage = input.logoDataUrl
      ? await this.tryEmbedLogo(pdfDoc, input.logoDataUrl)
      : null;

    const page = pdfDoc.addPage([595.28, 841.89]);
    this.drawInvoicePage(page, {
      invoice: input.invoice,
      style,
      blocks: input.blocks.length
        ? input.blocks
        : this.defaultBlocks(style.templateId),
      qrImage,
      verifyUrl: input.verifyUrl,
      logoImage,
      font,
      bold,
    });

    for (const attachmentBuffer of input.attachmentBuffers || []) {
      await this.appendAttachmentPdf(pdfDoc, attachmentBuffer, {
        verifyUrl: input.verifyUrl,
        invoiceNumber: input.invoice.invoiceNumber,
        qrImage,
        font,
        bold,
        style,
      });
    }

    return Buffer.from(await pdfDoc.save());
  }

  private async appendAttachmentPdf(
    pdfDoc: PDFDocument,
    attachmentBuffer: Buffer,
    ctx: {
      verifyUrl: string;
      invoiceNumber: string;
      qrImage: any;
      font: any;
      bold: any;
      style: InvoiceStyle;
    }
  ) {
    const sourceDoc = await PDFDocument.load(attachmentBuffer);
    for (const sourcePage of sourceDoc.getPages()) {
      const { width, height } = sourcePage.getSize();
      const page = pdfDoc.addPage([width, height]);
      const embedded = await pdfDoc.embedPage(sourcePage);
      const availableHeight = height - this.footerHeight - 18;
      const availableWidth = width - 20;
      const scale = Math.min(
        1,
        availableWidth / width,
        availableHeight / height
      );
      const drawWidth = width * scale;
      const drawHeight = height * scale;
      const x = (width - drawWidth) / 2;
      const y = this.footerHeight + 10 + (availableHeight - drawHeight) / 2;

      page.drawPage(embedded, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });

      this.drawFooter(page, {
        verifyUrl: ctx.verifyUrl,
        invoiceNumber: ctx.invoiceNumber,
        qrImage: ctx.qrImage,
        font: ctx.font,
        bold: ctx.bold,
        primary: this.hex(ctx.style.palette.primary),
        secondary: this.hex(ctx.style.palette.text),
        surface: rgb(1, 1, 1),
        muted: this.hex(ctx.style.palette.muted),
      });
    }
  }

  private drawInvoicePage(page: any, ctx: any) {
    const {
      invoice,
      style,
      blocks,
      qrImage,
      verifyUrl,
      logoImage,
      font,
      bold,
    } = ctx;
    const { width, height } = page.getSize();
    const palette = style.palette;
    const primary = this.hex(palette.primary);
    const secondary = this.hex(palette.secondary);
    const surface = this.hex(palette.surface);
    const surfaceAlt = this.hex(palette.surfaceAlt);
    const text = this.hex(palette.text);
    const muted = this.hex(palette.muted);
    const accent = this.hex(palette.accent);

    page.drawRectangle({ x: 0, y: 0, width, height, color: surface });
    if (style.templateId === "luxury") {
      page.drawRectangle({
        x: 0,
        y: height - 250,
        width,
        height: 250,
        color: primary,
      });
      page.drawRectangle({
        x: 0,
        y: height - 260,
        width,
        height: 10,
        color: secondary,
      });
    } else if (style.templateId === "creative") {
      page.drawRectangle({
        x: 0,
        y: height - 220,
        width,
        height: 220,
        color: this.hex("#7C3AED"),
      });
      page.drawRectangle({
        x: width - 160,
        y: height - 220,
        width: 160,
        height: 220,
        color: accent,
        opacity: 0.9,
      });
    } else if (style.templateId === "corporate") {
      page.drawRectangle({ x: 0, y: 0, width, height, color: surface });
      page.drawRectangle({
        x: 0,
        y: height - 155,
        width: width,
        height: 155,
        color: this.hex("#F4F7FF"),
      });
      page.drawRectangle({
        x: 0,
        y: height - 155,
        width: 132,
        height: 155,
        color: primary,
      });
    } else {
      page.drawLine({
        start: { x: 40, y: height - 120 },
        end: { x: width - 40, y: height - 120 },
        thickness: 1.1,
        color: secondary,
      });
    }

    const orderedBlocks = [...blocks].sort((a, b) => (a.z || 0) - (b.z || 0));
    for (const block of orderedBlocks) {
      const x = block.x;
      const y = height - block.y - block.h;
      const background = block.style?.background
        ? this.safeHex(block.style.background, palette.surfaceAlt)
        : null;
      const radius = Number(block.style?.radius || 0);
      const color = this.safeHex(block.style?.color, palette.text);
      const fontSize = Number(
        block.style?.fontSize || (block.type === "amount" ? 28 : 13)
      );
      const align = block.style?.align || "left";
      const weight = String(block.style?.fontWeight || "600");
      const blockFont =
        weight.includes("7") || weight.includes("8") ? bold : font;

      if (background) {
        page.drawRectangle({
          x,
          y,
          width: block.w,
          height: block.h,
          color: background,
          opacity: 1,
        });
      }

      if (block.type === "logo") {
        if (logoImage) {
          page.drawImage(logoImage, {
            x: x + 8,
            y: y + 8,
            width: Math.max(28, block.w - 16),
            height: Math.max(28, block.h - 16),
          });
        } else {
          page.drawRectangle({
            x: x + 8,
            y: y + 8,
            width: block.w - 16,
            height: block.h - 16,
            color: primary,
          });
          page.drawText(this.brandInitials(invoice.issuerName || "IP"), {
            x: x + 18,
            y: y + block.h / 2 - 8,
            size: Math.min(22, block.w / 3),
            font: bold,
            color: rgb(1, 1, 1),
          });
        }
        continue;
      }

      if (block.type === "table") {
        this.drawLineItemsTable(page, {
          x,
          y,
          w: block.w,
          h: block.h,
          style,
          invoice,
          font,
          bold,
          text,
          muted,
          primary,
          secondary,
          surfaceAlt,
          accent,
        });
        continue;
      }

      const content = this.resolveBlockContent(block, invoice, style);
      if (block.binding?.key === "notes" && !String(content || "").trim()) {
        continue;
      }
      if (block.type === "amount") {
        const currency = this.cleanText(invoice.currency, "USD");
        const amount = this.cleanText(invoice.amount, "0.00");
        const trustBadge = this.cleanText(style.trustBadge);
        page.drawText("Amount due", {
          x: x + 14,
          y: y + block.h - 22,
          size: 10,
          font,
          color: muted,
        });
        page.drawText(`${currency} ${amount}`, {
          x: x + 14,
          y: y + block.h / 2 - 8,
          size: Math.min(fontSize, 28),
          font: bold,
          color,
        });
        if (trustBadge) {
          page.drawText(trustBadge, {
            x: x + 14,
            y: y + 12,
            size: 8.5,
            font,
            color: muted,
          });
        }
        continue;
      }

      this.drawParagraph(page, content, {
        x: x + 6,
        y: y + block.h - fontSize - 2,
        maxWidth: block.w - 12,
        lineHeight: fontSize * 1.35,
        maxLines: block.type === "text" ? 2 : 8,
        size: fontSize,
        font: blockFont,
        color,
        align,
      });
    }

    this.drawFooter(page, {
      verifyUrl,
      invoiceNumber: invoice.invoiceNumber,
      qrImage,
      font,
      bold,
      primary,
      secondary: text,
      surface: style.templateId === "luxury" ? primary : surfaceAlt,
      muted,
    });
  }

  private resolveBlockContent(
    block: CanvasBlock,
    invoice: FinalizeGeneratedInvoiceDto,
    style: InvoiceStyle
  ) {
    const key = block.binding?.key || block.id;
    if (block.content && !key) return this.cleanText(block.content);
    switch (key) {
      case "headerTitle":
        return this.cleanText(style.headerTitle, "Premium invoice");
      case "invoiceNumber":
        return this.cleanText(invoice.invoiceNumber);
      case "issuer":
        return this.joinCleanLines([
          "From",
          this.cleanText(invoice.issuerName, "InvoiceProof Studio"),
          this.cleanText(invoice.issuerEmail),
          this.cleanText(invoice.issuerAddress),
        ]);
      case "customer":
        return this.joinCleanLines([
          "Bill to",
          this.cleanText(invoice.customerName),
          invoice.issueDate
            ? `Issue date: ${this.cleanText(invoice.issueDate)}`
            : "",
          invoice.dueDate ? `Due date: ${this.cleanText(invoice.dueDate)}` : "",
        ]);
      case "meta":
        return this.joinCleanLines([
          `Currency: ${this.cleanText(
            invoice.currency,
            "USD"
          )}    Payment terms: ${this.cleanText(
            invoice.paymentTerms,
            "Due on receipt"
          )}`,
          this.cleanText(style.heroCopy),
        ]);
      case "notes":
        return this.cleanText(invoice.notes)
          ? this.joinCleanLines(["Notes", this.cleanText(invoice.notes)])
          : "";
      default:
        return this.cleanText(block.content || "");
    }
  }

  private drawLineItemsTable(page: any, ctx: any) {
    const {
      x,
      y,
      w,
      h,
      style,
      invoice,
      font,
      bold,
      text,
      muted,
      primary,
      surfaceAlt,
      accent,
    } = ctx;
    const headerFill = style.templateId === "minimal" ? surfaceAlt : primary;
    const headerText = style.templateId === "minimal" ? text : rgb(1, 1, 1);
    const rowHeight = 28;
    const maxRows = Math.max(1, Math.min(invoice.lineItems?.length || 1, 5));
    const taxPercentage = Number(invoice.taxPercentage || 0).toFixed(2);
    const discountPercentage = Number(invoice.discountPercentage || 0).toFixed(
      2
    );

    const qtyX = x + w - 222;
    const unitX = x + w - 176;
    const currencyX = x + w - 126;
    const amountX = x + w - 64;
    const amountRight = x + w - 12;
    const summaryLabelRight = x + w - 142;
    const summaryValueRight = amountRight;

    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color: rgb(1, 1, 1),
      borderColor: surfaceAlt,
      borderWidth: 0.8,
    });
    page.drawRectangle({
      x,
      y: y + h - 30,
      width: w,
      height: 30,
      color: headerFill,
    });
    page.drawText("Description", {
      x: x + 12,
      y: y + h - 20,
      size: 9,
      font: bold,
      color: headerText,
    });
    page.drawText("Qty", {
      x: qtyX,
      y: y + h - 20,
      size: 9,
      font: bold,
      color: headerText,
    });
    page.drawText("Unit", {
      x: unitX,
      y: y + h - 20,
      size: 9,
      font: bold,
      color: headerText,
    });
    page.drawText("Currency", {
      x: currencyX,
      y: y + h - 20,
      size: 9,
      font: bold,
      color: headerText,
    });
    page.drawText("Amount", {
      x: amountX,
      y: y + h - 20,
      size: 9,
      font: bold,
      color: headerText,
    });

    const sanitizedItems = (invoice.lineItems || [])
      .filter(
        (item: any) =>
          !/\b(?:gst|vat|tax|discount)\b/i.test(
            this.cleanText(item?.description)
          )
      )
      .map((item: any) => ({
        ...item,
        description: this.cleanText(item?.description, "Professional services"),
        quantity: this.cleanText(item?.quantity, "1.00"),
        unitPrice: this.cleanText(item?.unitPrice, "0.00"),
        amount: this.cleanText(item?.amount, "0.00"),
      }));

    const items = sanitizedItems.length
      ? sanitizedItems.slice(0, maxRows)
      : [
          {
            description: this.cleanText(invoice.notes, "Professional services"),
            quantity: "1.00",
            unitPrice: this.cleanText(invoice.amount, "0.00"),
            amount: this.cleanText(invoice.amount, "0.00"),
          },
        ];

    let currentY = y + h - 58;
    items.forEach((item: any, index: number) => {
      const fill =
        style.templateId === "creative" && index % 2 === 0
          ? accent
          : rgb(1, 1, 1);
      page.drawRectangle({
        x,
        y: currentY - 8,
        width: w,
        height: rowHeight,
        color: fill,
        borderColor: surfaceAlt,
        borderWidth: 0.4,
      });
      page.drawText(this.fitText(item.description, 30), {
        x: x + 12,
        y: currentY + 2,
        size: 9,
        font,
        color: text,
      });
      page.drawText(String(item.quantity), {
        x: qtyX + 2,
        y: currentY + 2,
        size: 9,
        font,
        color: text,
      });
      this.drawRightAlignedText(
        page,
        String(item.unitPrice),
        currencyX - 12,
        currentY + 2,
        9,
        font,
        text
      );
      page.drawText(this.cleanText(invoice.currency, "USD").toUpperCase(), {
        x: currencyX,
        y: currentY + 2,
        size: 9,
        font,
        color: text,
      });
      this.drawRightAlignedText(
        page,
        String(item.amount),
        amountRight,
        currentY + 2,
        9,
        bold,
        text
      );
      currentY -= rowHeight;
    });

    const subtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.amount || 0),
      0
    );
    const discountTotal = (subtotal * Number(discountPercentage || 0)) / 100;
    const taxableSubtotal = Math.max(subtotal - discountTotal, 0);
    const taxTotal = (taxableSubtotal * Number(taxPercentage || 0)) / 100;
    const grandTotal = taxableSubtotal + taxTotal;
    const summaryTop = y + 50;
    const summaryGap = 14;

    const lineItemPresentation = this.cleanText(style.lineItemPresentation);
    if (lineItemPresentation) {
      page.drawText(lineItemPresentation, {
        x: x + 12,
        y: y + 12,
        size: 8.5,
        font,
        color: muted,
      });
    }

    page.drawLine({
      start: { x: x + w - 240, y: y + 60 },
      end: { x: amountRight, y: y + 60 },
      thickness: 0.8,
      color: surfaceAlt,
    });

    const summaryCurrency = this.cleanText(invoice.currency, "USD");

    this.drawRightAlignedText(
      page,
      "Total amount",
      summaryLabelRight,
      summaryTop,
      8.8,
      font,
      muted
    );
    this.drawRightAlignedText(
      page,
      `${summaryCurrency} ${subtotal.toFixed(2)}`,
      summaryValueRight,
      summaryTop,
      8.8,
      font,
      text
    );

    this.drawRightAlignedText(
      page,
      `Discount (${discountPercentage}%)`,
      summaryLabelRight,
      summaryTop - summaryGap,
      8.8,
      font,
      muted
    );
    this.drawRightAlignedText(
      page,
      `- ${summaryCurrency} ${discountTotal.toFixed(2)}`,
      summaryValueRight,
      summaryTop - summaryGap,
      8.8,
      font,
      text
    );

    this.drawRightAlignedText(
      page,
      `GST / Tax / VAT (${taxPercentage}%)`,
      summaryLabelRight,
      summaryTop - summaryGap * 2,
      8.8,
      font,
      muted
    );
    this.drawRightAlignedText(
      page,
      `${summaryCurrency} ${taxTotal.toFixed(2)}`,
      summaryValueRight,
      summaryTop - summaryGap * 2,
      8.8,
      font,
      text
    );

    this.drawRightAlignedText(
      page,
      "Grand total",
      summaryLabelRight,
      summaryTop - summaryGap * 3 - 2,
      10.6,
      bold,
      text
    );
    this.drawRightAlignedText(
      page,
      `${summaryCurrency} ${grandTotal.toFixed(2)}`,
      summaryValueRight,
      summaryTop - summaryGap * 3 - 2,
      10.6,
      bold,
      text
    );
  }

  private drawFooter(page: any, ctx: any) {
    const {
      verifyUrl,
      invoiceNumber,
      qrImage,
      font,
      bold,
      primary,
      secondary,
      surface,
      muted,
    } = ctx;
    const { width } = page.getSize();
    const margin = 16;
    const y = 12;
    const blockHeight = this.footerHeight - 18;
    const isDark =
      primary?.blue !== undefined &&
      primary.red + primary.green + primary.blue < 0.9;
    const panelText = isDark ? rgb(1, 1, 1) : secondary;
    const panelMuted = isDark ? rgb(0.88, 0.91, 0.96) : muted;

    page.drawRectangle({
      x: margin,
      y,
      width: width - margin * 2,
      height: blockHeight,
      color: surface,
      borderColor: primary,
      borderWidth: 0.8,
      opacity: 0.98,
    });

    page.drawText("InvoiceProof", {
      x: margin + 16,
      y: y + blockHeight - 24,
      size: 12,
      font: bold,
      color: panelText,
    });
    // page.drawText('Verified footer • QR and link on every page', {
    //   x: margin + 16,
    //   y: y + blockHeight - 40,
    //   size: 9,
    //   font,
    //   color: panelMuted,
    // });
    page.drawText(this.fitText(verifyUrl, 78), {
      x: margin + 16,
      y: y + 16,
      size: 9.2,
      font: bold,
      color: primary,
    });
    page.drawText(`Invoice ${this.cleanText(invoiceNumber, "N/A")}`, {
      x: margin + 16,
      y: y + 30,
      size: 8.5,
      font,
      color: panelMuted,
    });

    page.drawImage(qrImage, {
      x: width - margin - 64,
      y: y + 8,
      width: 56,
      height: 56,
    });
  }

  private async embedQr(pdfDoc: PDFDocument, value: string, dark: string) {
    const qrPng = await this.buildQrPng(value, dark, "#FFFFFF");
    return pdfDoc.embedPng(qrPng);
  }

  private async tryEmbedLogo(pdfDoc: PDFDocument, logoDataUrl: string) {
    try {
      const match = logoDataUrl.match(
        /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
      );
      if (!match) return null;
      const mimeType = match[1];
      const buffer = Buffer.from(match[2], "base64");
      if (mimeType.includes("png") || mimeType.includes("webp")) {
        return pdfDoc.embedPng(buffer);
      }
      if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        return pdfDoc.embedJpg(buffer);
      }
      return null;
    } catch {
      return null;
    }
  }

  private defaultBlocks(templateId?: string) {
    const blocksByTemplate: Record<string, CanvasBlock[]> = {
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
    return (
      blocksByTemplate[templateId || "corporate"] || blocksByTemplate.corporate
    );
  }

  private async buildQrPng(value: string, dark: string, light: string) {
    const dataUrl = await QRCode.toDataURL(value, {
      width: 320,
      margin: 1,
      color: {
        dark,
        light,
      },
    });

    return Buffer.from(
      dataUrl.replace(/^data:image\/png;base64,/, ""),
      "base64"
    );
  }

  private cleanText(value: unknown, fallback = "") {
    const text = String(value ?? "").trim();
    return text && !/^(undefined|null)$/i.test(text) ? text : fallback;
  }

  private joinCleanLines(lines: Array<unknown>) {
    return lines
      .map((line) => this.cleanText(line))
      .filter(Boolean)
      .join("\n");
  }

  private drawParagraph(page: any, value: string, options: any) {
    const lines = String(value || "")
      .split("\n")
      .flatMap((line) => this.wrapText(line, options.maxWidth, options.size));
    const drawLines = lines.slice(0, options.maxLines || lines.length);
    drawLines.forEach((line, index) => {
      const lineWidth = options.font.widthOfTextAtSize(line, options.size);
      const x =
        options.align === "center"
          ? options.x + (options.maxWidth - lineWidth) / 2
          : options.align === "right"
          ? options.x + options.maxWidth - lineWidth
          : options.x;
      page.drawText(line, {
        x,
        y: options.y - index * options.lineHeight,
        size: options.size,
        font: options.font,
        color: options.color,
      });
    });
  }

  private drawRightAlignedText(
    page: any,
    value: string,
    rightEdge: number,
    y: number,
    size: number,
    font: any,
    color: any
  ) {
    const safeValue = String(value || "");
    const width = font.widthOfTextAtSize(safeValue, size);
    page.drawText(safeValue, {
      x: rightEdge - width,
      y,
      size,
      font,
      color,
    });
  }

  private wrapText(value: string, maxWidth: number, size: number) {
    const avgCharWidth = size * 0.52;
    const maxChars = Math.max(8, Math.floor(maxWidth / avgCharWidth));
    if (value.length <= maxChars) return [value];
    const words = value.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length <= maxChars) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [value.slice(0, maxChars)];
  }

  private brandInitials(value: string) {
    const parts = String(value || "IP")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return (parts[0]?.[0] || "I") + (parts[1]?.[0] || parts[0]?.[1] || "P");
  }

  private fitText(value: string, maxLength: number) {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 1)}…`;
  }

  private safeHex(value: string | undefined, fallback: string) {
    try {
      return this.hex(value || fallback);
    } catch {
      return this.hex(fallback);
    }
  }

  private hex(value: string) {
    const cleaned = value.replace("#", "");
    const safe =
      cleaned.length === 3
        ? cleaned
            .split("")
            .map((part) => `${part}${part}`)
            .join("")
        : cleaned.padEnd(6, "0").slice(0, 6);

    const r = parseInt(safe.slice(0, 2), 16) / 255;
    const g = parseInt(safe.slice(2, 4), 16) / 255;
    const b = parseInt(safe.slice(4, 6), 16) / 255;
    return rgb(r, g, b);
  }
}

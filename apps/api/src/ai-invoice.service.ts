import { Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import { AiCanvasGenerateDto, AiInvoiceDraftRequestDto } from './invoices.dto';
import { getInvoiceStyle, InvoiceStyle, InvoiceTemplateId, listInvoiceStyles } from './invoice-design';

export type InvoiceLineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
};

export type AiInvoiceDraft = {
  title: string;
  accentLabel: string;
  invoiceNumber: string;
  customerName: string;
  amount: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  paymentTerms: string;
  issuerName: string;
  issuerEmail: string;
  issuerAddress: string;
  lineItems: InvoiceLineItem[];
  style: InvoiceStyle;
};

export type AiCanvasDraft = {
  promptSummary: string;
  missingFields: string[];
  invoice: AiInvoiceDraft;
};

export type DetectedInvoiceDraft = {
  invoiceNumber: string;
  customerName: string;
  amount: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  paymentTerms: string;
  issuerName: string;
  issuerEmail: string;
  issuerAddress: string;
  lineItems: InvoiceLineItem[];
  confidence: number;
  extractionSummary: string;
  needsReview: boolean;
};

@Injectable()
export class AiInvoiceService {
  private readonly supportedCurrencyCodes = new Set(
    ((Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('currency') || [
      'USD', 'EUR', 'GBP', 'INR', 'JPY', 'CNY', 'AUD', 'CAD', 'NZD', 'SGD', 'HKD', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'CHF', 'SEK', 'NOK', 'DKK', 'ISK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'TRY', 'RUB', 'UAH', 'ZAR', 'NGN', 'KES', 'GHS', 'EGP', 'MAD', 'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'PYG', 'BOB', 'CRC', 'DOP', 'JMD', 'TTD', 'BBD', 'BSD', 'BMD', 'KRW', 'THB', 'VND', 'IDR', 'MYR', 'PHP', 'TWD', 'PKR', 'BDT', 'LKR', 'NPR', 'ILS'
    ]).map((code) => code.toUpperCase()),
  );

  private readonly currencyDetectionRules: Array<{ pattern: RegExp; code: string }> = [
    { pattern: /US\$/i, code: 'USD' },
    { pattern: /A\$/i, code: 'AUD' },
    { pattern: /C\$/i, code: 'CAD' },
    { pattern: /NZ\$/i, code: 'NZD' },
    { pattern: /HK\$/i, code: 'HKD' },
    { pattern: /S\$/i, code: 'SGD' },
    { pattern: /R\$/i, code: 'BRL' },
    { pattern: /\bAED\b|\bDH\b|د\.إ/i, code: 'AED' },
    { pattern: /\bSAR\b|ر\.س/i, code: 'SAR' },
    { pattern: /\bQAR\b|ر\.ق/i, code: 'QAR' },
    { pattern: /\bKWD\b|د\.ك/i, code: 'KWD' },
    { pattern: /\bBHD\b|د\.ب/i, code: 'BHD' },
    { pattern: /\bOMR\b|ر\.ع/i, code: 'OMR' },
    { pattern: /€/i, code: 'EUR' },
    { pattern: /£/i, code: 'GBP' },
    { pattern: /₹/i, code: 'INR' },
    { pattern: /\bCNY\b|\bRMB\b|CN¥|￥|元/i, code: 'CNY' },
    { pattern: /¥|円/i, code: 'JPY' },
    { pattern: /₩/i, code: 'KRW' },
    { pattern: /₽/i, code: 'RUB' },
    { pattern: /₴/i, code: 'UAH' },
    { pattern: /₺/i, code: 'TRY' },
    { pattern: /₫/i, code: 'VND' },
    { pattern: /฿/i, code: 'THB' },
    { pattern: /₱/i, code: 'PHP' },
    { pattern: /₦/i, code: 'NGN' },
    { pattern: /₵/i, code: 'GHS' },
    { pattern: /₪/i, code: 'ILS' },
    { pattern: /₨/i, code: 'PKR' },
    { pattern: /\$/i, code: 'USD' },
  ];
  private readonly draftModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  private readonly extractionModel = process.env.GEMINI_EXTRACTION_MODEL || 'gemini-2.5-pro';

  async generateDrafts(input: AiInvoiceDraftRequestDto): Promise<AiInvoiceDraft[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return this.buildFallbackDrafts(input);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.draftModel}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: this.buildDraftPrompt(input) }],
              },
            ],
            generationConfig: {
              temperature: 0.85,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(25000),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini draft generation failed with ${response.status}`);
      }

      const json = (await response.json()) as Record<string, any>;
      const text = this.extractText(json);
      const parsed = this.parseDraftPayload(text);
      if (!parsed.length) {
        throw new Error('Gemini returned no drafts');
      }
      return parsed;
    } catch (error) {
      console.error('Falling back to local invoice drafts', error);
      return this.buildFallbackDrafts(input);
    }
  }

  async generateCanvasDraft(input: AiCanvasGenerateDto): Promise<AiCanvasDraft> {
    const cleanedPrompt = this.cleanFreeformInput(input.prompt);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return this.buildFallbackCanvasDraft(cleanedPrompt);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.draftModel}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: this.buildCanvasPrompt(cleanedPrompt) }],
              },
            ],
            generationConfig: {
              temperature: 0.35,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(25000),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini canvas generation failed with ${response.status}`);
      }

      const json = (await response.json()) as Record<string, any>;
      const text = this.extractText(json);
      return this.parseCanvasPayload(text, cleanedPrompt);
    } catch (error) {
      console.error('Falling back to local canvas draft', error);
      return this.buildFallbackCanvasDraft(cleanedPrompt);
    }
  }

  async detectInvoiceFromPdf(file: Express.Multer.File): Promise<DetectedInvoiceDraft> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.extractionModel}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: this.buildPdfExtractionPrompt(file.originalname),
                    },
                    {
                      inlineData: {
                        mimeType: file.mimetype,
                        data: file.buffer.toString('base64'),
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json',
              },
            }),
            signal: AbortSignal.timeout(30000),
          },
        );

        if (!response.ok) {
          throw new Error(`Gemini extraction failed with ${response.status}`);
        }

        const json = (await response.json()) as Record<string, any>;
        const text = this.extractText(json);
        const parsed = this.parseDetectedPayload(text, file.originalname);
        if (parsed.invoiceNumber || parsed.customerName || Number(parsed.amount) > 0) {
          return parsed;
        }
      } catch (error) {
        console.error('Gemini PDF extraction failed, falling back to text parsing', error);
      }
    }

    return this.extractInvoiceFromPdfText(file);
  }

  private buildDraftPrompt(input: AiInvoiceDraftRequestDto) {
    const styles = listInvoiceStyles().map((style) => `${style.templateId}: ${style.previewSummary}`).join('\n');
    const today = input.issueDate || new Date().toISOString().slice(0, 10);
    const fallbackDue = input.dueDate || today;

    return [
      'Generate exactly 4 premium invoice draft options as valid JSON.',
      'Return an object with key "options" only.',
      'You must create one option for each templateId: luxury, corporate, creative, minimal.',
      'These 4 options must be visibly different in visual style, color palette, hierarchy, tone, line-item presentation, and footer/trust block style.',
      'Each option must contain keys: title, accentLabel, invoiceNumber, customerName, amount, currency, issueDate, dueDate, notes, paymentTerms, issuerName, issuerEmail, issuerAddress, lineItems, style.',
      'style must contain: templateId, hierarchyStyle, tone, lineItemPresentation, footerStyle, trustBadge, previewSummary, headerTitle, heroCopy.',
      'lineItems must be an array of 1 to 6 objects with description, quantity, unitPrice, amount.',
      'Amounts must be strings with 2 decimals.',
      'Use concise business-ready language and no markdown fences.',
      '',
      'Style library:',
      styles,
      '',
      `User prompt: ${input.prompt}`,
      `Known customer: ${input.customerName || 'Use a realistic placeholder customer'}`,
      `Known amount: ${input.amount || 'Choose a realistic amount based on the prompt'}`,
      `Currency: ${input.currency || 'USD'}`,
      `Issue date: ${today}`,
      `Due date: ${fallbackDue}`,
      `Optional note: ${input.notes || 'Keep notes short and useful'}`,
    ].join('\n');
  }

  private buildCanvasPrompt(prompt: string) {
    return [
      'Convert the user input into one editable invoice draft as valid JSON.',
      'Return an object with exactly these keys: promptSummary, missingFields, invoice.',
      'promptSummary must be a short plain-English summary of what was understood.',
      'missingFields must be an array of short field names that still need review or are missing.',
      'invoice must contain: title, accentLabel, invoiceNumber, customerName, amount, currency, issueDate, dueDate, notes, paymentTerms, issuerName, issuerEmail, issuerAddress, lineItems, style.',
      'style.templateId must be exactly one of: luxury, corporate, creative, minimal.',
      'Choose the single best template for readability and minimum manual cleanup.',
      'lineItems must be an array of 1 to 8 objects with description, quantity, unitPrice, amount.',
      'Amounts must be strings with 2 decimals.',
      'If GST, VAT, tax, discount, or service charge is explicitly mentioned, reflect it as a separate line item and make amount the final grand total.',
      'Do not invent emails, addresses, tax ids, bank details, or company names if they are not supported by the input.',
      'If a value is unclear, prefer an empty string or safe placeholder and include that field in missingFields.',
      'No markdown fences. JSON only.',
      '',
      `User input:\n${prompt}`,
    ].join('\n');
  }

  private buildPdfExtractionPrompt(fileName: string) {
    return [
      'You are extracting invoice details from an uploaded PDF.',
      'Return valid JSON only with key "invoice".',
      'Extract these keys: invoiceNumber, customerName, amount, currency, issueDate, dueDate, notes, paymentTerms, issuerName, issuerEmail, issuerAddress, lineItems, confidence, extractionSummary, needsReview.',
      'lineItems should be an array of up to 8 objects with description, quantity, unitPrice, amount.',
      'If a field is missing, return an empty string for text fields and an empty array for lineItems.',
      'confidence must be a number from 0 to 1.',
      'needsReview must be true if any of invoiceNumber, amount, currency, issueDate, or customerName is uncertain or missing.',
      `Filename hint: ${fileName}`,
      'Do not invent values if the document does not support them. Prefer empty strings over hallucinations.',
    ].join('\n');
  }

  private extractText(payload: Record<string, any>) {
    return payload?.candidates?.[0]?.content?.parts?.map((part: Record<string, any>) => part?.text || '').join('') || '';
  }

  private parseDraftPayload(raw: string): AiInvoiceDraft[] {
    const cleaned = this.cleanJson(raw);
    const parsed = JSON.parse(cleaned) as { options?: any[] };
    const options = Array.isArray(parsed.options) ? parsed.options : [];
    return options.slice(0, 4).map((option, index) => this.normalizeDraft(option, index));
  }

  private parseCanvasPayload(raw: string, prompt: string): AiCanvasDraft {
    const cleaned = this.cleanJson(raw);
    const parsed = JSON.parse(cleaned) as { promptSummary?: unknown; missingFields?: unknown; invoice?: any };
    const invoice = this.normalizeDraft(parsed.invoice || {}, 1);
    const missingFields = this.normalizeMissingFields(parsed.missingFields, invoice);

    return {
      promptSummary: this.asText(parsed.promptSummary, 240, this.buildPromptSummary(prompt)),
      missingFields,
      invoice,
    };
  }

  private parseDetectedPayload(raw: string, fileName: string): DetectedInvoiceDraft {
    const cleaned = this.cleanJson(raw);
    const parsed = JSON.parse(cleaned) as { invoice?: any };
    return this.normalizeDetectedInvoice(parsed.invoice || {}, fileName);
  }

  private cleanJson(raw: string) {
    return raw.trim().replace(/^```json\s*/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
  }

  private normalizeDraft(option: any, index: number): AiInvoiceDraft {
    const requestedTemplate = String(option?.style?.templateId || option?.templateId || ['luxury', 'corporate', 'creative', 'minimal'][index] || 'corporate');
    const style = getInvoiceStyle(requestedTemplate, {
      hierarchyStyle: String(option?.style?.hierarchyStyle || '' || undefined),
      tone: String(option?.style?.tone || '' || undefined),
      lineItemPresentation: String(option?.style?.lineItemPresentation || '' || undefined),
      footerStyle: String(option?.style?.footerStyle || '' || undefined),
      trustBadge: String(option?.style?.trustBadge || '' || undefined),
      previewSummary: String(option?.style?.previewSummary || '' || undefined),
      headerTitle: String(option?.style?.headerTitle || '' || undefined),
      heroCopy: String(option?.style?.heroCopy || '' || undefined),
    });

    const lineItems = Array.isArray(option?.lineItems) && option.lineItems.length
      ? option.lineItems.slice(0, 6).map((item: any) => ({
          description: this.asText(item?.description, 150, `Service item ${index + 1}`),
          quantity: this.asMoneyish(item?.quantity || '1.00'),
          unitPrice: this.asMoneyish(item?.unitPrice || option?.amount || '0.00'),
          amount: this.asMoneyish(item?.amount || option?.amount || '0.00'),
        }))
      : [{
          description: 'Professional services',
          quantity: '1.00',
          unitPrice: this.asMoneyish(option?.amount || '0.00'),
          amount: this.asMoneyish(option?.amount || '0.00'),
        }];

    const total = this.asMoneyish(
      option?.amount || lineItems.reduce((sum: number, item: InvoiceLineItem) => sum + Number(item.amount), 0).toFixed(2),
    );
    const today = new Date().toISOString().slice(0, 10);

    return {
      title: this.asText(option?.title, 120, `${style.styleName} invoice`),
      accentLabel: this.asText(option?.accentLabel, 80, style.accentLabel),
      invoiceNumber: this.asText(option?.invoiceNumber, 100, `INV-${new Date().getFullYear()}-00${index + 1}`),
      customerName: this.asText(option?.customerName, 150, 'Customer name'),
      amount: total,
      currency: this.asCurrency(option?.currency || 'USD'),
      issueDate: this.asDate(option?.issueDate || today),
      dueDate: this.asDate(option?.dueDate || today),
      notes: this.asText(option?.notes, 1000, 'Thank you for your business.'),
      paymentTerms: this.asText(option?.paymentTerms, 120, 'Due on receipt'),
      issuerName: this.asText(option?.issuerName, 120, 'InvoiceProof Studio'),
      issuerEmail: this.asText(option?.issuerEmail, 160, 'billing@invoiceproof.app'),
      issuerAddress: this.asText(option?.issuerAddress, 240, '123 Market Street, San Francisco, CA'),
      lineItems,
      style,
    };
  }

  private normalizeDetectedInvoice(option: any, fileName: string): DetectedInvoiceDraft {
    const today = new Date().toISOString().slice(0, 10);
    const lineItems = Array.isArray(option?.lineItems)
      ? option.lineItems.slice(0, 8).map((item: any) => ({
          description: this.asText(item?.description, 150, 'Detected line item'),
          quantity: this.asMoneyish(item?.quantity || '1.00'),
          unitPrice: this.asMoneyish(item?.unitPrice || item?.amount || '0.00'),
          amount: this.asMoneyish(item?.amount || item?.unitPrice || '0.00'),
        }))
      : [];

    const amount = this.asMoneyish(
      option?.amount || (lineItems.length ? lineItems.reduce((sum: number, item: InvoiceLineItem) => sum + Number(item.amount), 0).toFixed(2) : '0.00'),
    );
    const invoiceNumber = this.asText(option?.invoiceNumber, 100, this.fileNameFallback(fileName));
    const customerName = this.asText(option?.customerName, 150, 'Customer name');
    const currency = this.asCurrency(option?.currency || this.detectCurrencyFromText(`${option?.amount || ''} ${option?.notes || ''}`));
    const issueDate = this.asDate(option?.issueDate || today);
    const dueDate = this.asDate(option?.dueDate || issueDate);
    const confidence = this.asConfidence(option?.confidence);
    const essentialMissing = !invoiceNumber || customerName === 'Customer name' || amount === '0.00' || !currency || !issueDate;

    return {
      invoiceNumber,
      customerName,
      amount,
      currency: currency || 'USD',
      issueDate,
      dueDate,
      notes: this.asText(option?.notes, 1000, ''),
      paymentTerms: this.asText(option?.paymentTerms, 120, ''),
      issuerName: this.asText(option?.issuerName, 120, ''),
      issuerEmail: this.asText(option?.issuerEmail, 160, ''),
      issuerAddress: this.asText(option?.issuerAddress, 240, ''),
      lineItems,
      confidence,
      extractionSummary: this.asText(
        option?.extractionSummary,
        240,
        essentialMissing
          ? 'Some key details were uncertain. Please review before sealing.'
          : 'Invoice details were detected from the uploaded PDF and are ready to review.',
      ),
      needsReview: Boolean(option?.needsReview) || confidence < 0.82 || essentialMissing,
    };
  }

  private buildFallbackCanvasDraft(prompt: string): AiCanvasDraft {
    const drafts = this.buildFallbackDrafts({ prompt } as AiInvoiceDraftRequestDto);
    const invoice = drafts.find((draft) => draft.style.templateId === 'corporate') || drafts[0];

    return {
      promptSummary: this.buildPromptSummary(prompt),
      missingFields: this.inferMissingFields(invoice),
      invoice,
    };
  }

  private buildFallbackDrafts(input: AiInvoiceDraftRequestDto): AiInvoiceDraft[] {
    const baseAmount = this.asMoneyish(input.amount || '1200');
    const currency = this.asCurrency(input.currency || 'USD');
    const today = input.issueDate || new Date().toISOString().slice(0, 10);
    const dueDate = input.dueDate || today;
    const customer = input.customerName || 'Acme Ltd';
    const prompt = input.prompt.trim() || 'Professional services';
    const templateOrder: InvoiceTemplateId[] = ['luxury', 'corporate', 'creative', 'minimal'];

    return templateOrder.map((templateId, index) => {
      const style = getInvoiceStyle(templateId);
      return {
        title: style.styleName,
        accentLabel: style.accentLabel,
        invoiceNumber: `INV-${new Date().getFullYear()}-10${index + 1}`,
        customerName: customer,
        amount: baseAmount,
        currency,
        issueDate: today,
        dueDate,
        notes: input.notes || `Auto-drafted from: ${prompt}`,
        paymentTerms: ['Net 7', 'Net 14', 'Net 15', 'Due on receipt'][index] || 'Net 14',
        issuerName: 'InvoiceProof Studio',
        issuerEmail: 'billing@invoiceproof.app',
        issuerAddress: '123 Market Street, San Francisco, CA',
        lineItems: [
          {
            description: prompt,
            quantity: index === 2 ? '2.00' : '1.00',
            unitPrice: index === 2 ? this.asMoneyish(Number(baseAmount) / 2) : baseAmount,
            amount: index === 2 ? this.asMoneyish(Number(baseAmount) / 2) : baseAmount,
          },
        ],
        style,
      };
    });
  }

  private async extractInvoiceFromPdfText(file: Express.Multer.File): Promise<DetectedInvoiceDraft> {
    try {
      const parser = new PDFParse({ data: file.buffer });
      const parsed = await parser.getText();
      await parser.destroy();
      const text = parsed.text || '';
      const normalized = text.replace(/\s+/g, ' ').trim();
      const amountMatch = normalized.match(/(?:total|amount due|grand total|balance due)[:\s]*((?:[A-Z]{3}|[$€£₹¥₩₽₴₺₫฿₱₦₵₪₨])?\s?[\d,]+(?:\.\d{2})?)/i);
      const invoiceMatch = normalized.match(/invoice\s*(?:number|no\.?|#)?[:\s]*([A-Z0-9-]{4,})/i);
      const customerMatch = normalized.match(/bill\s*to[:\s]*([A-Za-z0-9&,.\- ]{3,80})/i);
      const issueDateMatch = normalized.match(/(?:issue date|invoice date|date)[:\s]*([A-Za-z]{3,9}\s+\d{1,2},\s*\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
      const dueDateMatch = normalized.match(/due date[:\s]*([A-Za-z]{3,9}\s+\d{1,2},\s*\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
      const emailMatch = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

      const issueDate = this.asDate(issueDateMatch?.[1] || new Date().toISOString().slice(0, 10));
      const dueDate = this.asDate(dueDateMatch?.[1] || issueDate);
      const amount = this.asMoneyish(amountMatch?.[1] || '0.00');
      const currency = this.asCurrency(this.detectCurrencyFromText(amountMatch?.[1] || normalized) || 'USD');
      const invoiceNumber = this.asText(invoiceMatch?.[1], 100, this.fileNameFallback(file.originalname));

      return {
        invoiceNumber,
        customerName: this.asText(customerMatch?.[1], 150, 'Customer name'),
        amount,
        currency,
        issueDate,
        dueDate,
        notes: '',
        paymentTerms: '',
        issuerName: '',
        issuerEmail: this.asText(emailMatch?.[0], 160, ''),
        issuerAddress: '',
        lineItems: [],
        confidence: normalized.length > 40 ? 0.72 : 0.45,
        extractionSummary:
          normalized.length > 40
            ? 'Basic invoice details were detected from selectable PDF text. Please review before sealing.'
            : 'The PDF appears to have limited machine-readable text. Review detected details carefully before sealing.',
        needsReview: true,
      };
    } catch (error) {
      console.error('PDF text extraction failed', error);
      return {
        invoiceNumber: this.fileNameFallback(file.originalname),
        customerName: 'Customer name',
        amount: '0.00',
        currency: 'USD',
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date().toISOString().slice(0, 10),
        notes: '',
        paymentTerms: '',
        issuerName: '',
        issuerEmail: '',
        issuerAddress: '',
        lineItems: [],
        confidence: 0.35,
        extractionSummary: 'The PDF could not be read reliably. You can still review and correct the detected fields before sealing.',
        needsReview: true,
      };
    }
  }

  private normalizeMissingFields(value: unknown, invoice: AiInvoiceDraft) {
    const fields = Array.isArray(value)
      ? value
          .map((item) => this.asText(item, 40, ''))
          .filter(Boolean)
          .slice(0, 6)
      : [];

    return fields.length ? fields : this.inferMissingFields(invoice);
  }

  private inferMissingFields(invoice: AiInvoiceDraft) {
    const fields: string[] = [];
    if (!invoice.customerName || invoice.customerName === 'Customer name') fields.push('customer name');
    if (!invoice.invoiceNumber) fields.push('invoice number');
    if (!invoice.amount || invoice.amount === '0.00') fields.push('amount');
    if (!invoice.paymentTerms) fields.push('payment terms');
    if (!invoice.notes) fields.push('notes');
    return fields.slice(0, 6);
  }

  private buildPromptSummary(prompt: string) {
    const collapsed = prompt.replace(/\s+/g, ' ').trim();
    if (!collapsed) return 'AI created a clean starting invoice draft from your prompt.';
    return this.asText(collapsed, 240, 'AI created a clean starting invoice draft from your prompt.');
  }

  private cleanFreeformInput(value: string) {
    return String(value || '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);
  }

  private detectCurrencyCode(value: string) {
    const text = String(value || '').trim();
    if (!text) return '';
    for (const rule of this.currencyDetectionRules) {
      if (rule.pattern.test(text)) return rule.code;
    }
    const matches = text.toUpperCase().match(/[A-Z]{3}/g) || [];
    const detected = matches.find((code) => this.supportedCurrencyCodes.has(code));
    if (detected) return detected;
    const collapsed = text.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    return collapsed && this.supportedCurrencyCodes.has(collapsed) ? collapsed : '';
  }

  private detectCurrencyFromText(value: string) {
    return this.detectCurrencyCode(value) || 'USD';
  }

  private fileNameFallback(fileName: string) {
    const stem = fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    return stem ? stem.toUpperCase().slice(0, 100) : `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  }

  private asMoneyish(value: unknown) {
    const number = Number(String(value ?? '0').replace(/[^\d.]/g, ''));
    if (!Number.isFinite(number)) return '0.00';
    return number.toFixed(2);
  }

  private asDate(value: unknown) {
    const text = String(value || '').trim();
    if (!text) return new Date().toISOString().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
    return parsed.toISOString().slice(0, 10);
  }

  private asCurrency(value: unknown) {
    return this.detectCurrencyCode(String(value || '')) || 'USD';
  }

  private asText(value: unknown, maxLength: number, fallback = '') {
    const text = String(value || '').trim();
    if (!text) return fallback;
    return text.slice(0, maxLength);
  }

  private asConfidence(value: unknown) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0.68;
    if (number < 0) return 0;
    if (number > 1) return 1;
    return Math.round(number * 100) / 100;
  }
}

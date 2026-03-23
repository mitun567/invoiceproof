export const INVOICE_DRAFT_SESSION_KEY = 'invoiceproof:pending-home-draft';

export type TransferredInvoiceDraft = {
  type: 'ai-canvas' | 'pdf-detect';
  payload: Record<string, unknown>;
};

export function savePendingInvoiceDraft(value: TransferredInvoiceDraft) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(INVOICE_DRAFT_SESSION_KEY, JSON.stringify(value));
}

export function loadPendingInvoiceDraft(): TransferredInvoiceDraft | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(INVOICE_DRAFT_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TransferredInvoiceDraft;
  } catch {
    window.sessionStorage.removeItem(INVOICE_DRAFT_SESSION_KEY);
    return null;
  }
}

export function clearPendingInvoiceDraft() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(INVOICE_DRAFT_SESSION_KEY);
}

export const INVOICE_STATUSES = [
  'saved',
  'pending_anchor',
  'anchor_submitted',
  'anchored',
  'anchor_failed_retrying',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  saved: 'Saved',
  pending_anchor: 'Pending Proof',
  anchor_submitted: 'Proof Submitted',
  anchored: 'Verified',
  anchor_failed_retrying: 'Retrying Proof',
};

export const BATCH_STATUSES = ['queued', 'submitted', 'anchored', 'failed'] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export const QUEUE_NAMES = {
  anchorTrigger: 'invoiceproof-anchor-trigger',
} as const;

export const JOB_NAMES = {
  processPendingBatch: 'process-pending-batch',
} as const;

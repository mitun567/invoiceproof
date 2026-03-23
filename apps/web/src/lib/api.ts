type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export type InvoiceRecord = {
  id: string;
  publicVerifyId: string;
  invoiceNumber: string;
  customerName: string;
  amount: string;
  currency: string;
  issueDate: string;
  dueDate: string | null;
  status: string;
  notes: string | null;
  fileName: string | null;
  fileHash: string | null;
  recordHash: string | null;
  verifyUrl: string;
  pdfUrl: string | null;
  createdAt: string;
  anchor?: {
    batchId: string | null;
    txHash: string | null;
    anchoredAt: string | null;
  };
};

export type VerifyRecord = {
  publicVerifyId: string;
  status: string;
  statusLabel: string;
  isVerified: boolean;
  invoiceNumber: string;
  issuedBy: string;
  customerName: string;
  amount: string;
  currency: string;
  issueDate: string;
  createdAt: string;
  anchoredAt: string | null;
  fileName: string | null;
  recordHash: string | null;
  fileHash: string | null;
  message: string;
  proof: null | {
    network: string | null;
    txHash: string | null;
    merkleRoot: string;
    contractAddress: string | null;
    isMock?: boolean;
  };
};

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
}

async function request<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      cache: 'no-store',
    });

    if (!response.ok) return null;
    const json = (await response.json()) as ApiEnvelope<T>;
    return json.data;
  } catch {
    return null;
  }
}

export function listInvoices() {
  return request<InvoiceRecord[]>('/invoices');
}

export function getInvoice(id: string) {
  return request<InvoiceRecord>(`/invoices/${id}`);
}

export function getVerification(publicVerifyId: string) {
  return request<VerifyRecord>(`/verify/${publicVerifyId}`);
}

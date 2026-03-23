import Link from 'next/link';
import { AutoRefreshWhenPending } from '../../../components/ui/auto-refresh';
import { ShareProofCard } from '../../../components/ui/share-proof-card';
import { getInvoice } from '../../../lib/api';
import { getTransactionUrl, shortenHash } from '../../../lib/explorer';

function formatDate(value: string | null) {
  if (!value) return 'Waiting';
  return (
    new Date(value).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC'
  );
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    return (
      <main className="container page-shell">
        <div className="glass-card card-pad-xl empty-state">
          <h1>Invoice not found</h1>
          <p className="muted">Create a new invoice to begin.</p>
          <Link href="/invoices/new" className="btn btn-primary" style={{ marginTop: 18 }}>
            Create invoice
          </Link>
        </div>
      </main>
    );
  }

  const isVerified = invoice.status === 'anchored';
  const txUrl = getTransactionUrl(invoice.anchor?.txHash, 'polygon');

  return (
    <main className="container page-shell page-stack">
      <section className="glass-card card-pad-xl premium-hero">
        <div className="verify-focus">
          <div className={`trust-badge ${isVerified ? 'is-verified' : 'is-pending'}`}>
            {isVerified ? '✓' : '⟳'}
          </div>

          <div className="page-stack" style={{ gap: 10, justifyItems: 'center' }}>
            <div className={`status-pill ${isVerified ? 'verified' : 'pending'}`}>
              {isVerified ? 'Verified' : 'Checking'}
            </div>
            <h1 style={{ margin: 0 }}>{invoice.invoiceNumber}</h1>
            <p className="page-subtitle" style={{ margin: 0, textAlign: 'center', maxWidth: 620 }}>
              {isVerified ? 'This invoice is ready to share with confidence.' : 'This invoice is being sealed now. The page updates automatically.'}
            </p>
          </div>

          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <a href={invoice.verifyUrl} className="btn btn-secondary">Public proof</a>
            {invoice.pdfUrl ? (
              <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">Open PDF</a>
            ) : null}
            {txUrl ? (
              <a href={txUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">Receipt</a>
            ) : null}
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <AutoRefreshWhenPending active={!isVerified} label="Checking proof automatically..." />
        </div>
      </section>

      <ShareProofCard verifyUrl={invoice.verifyUrl} invoiceNumber={invoice.invoiceNumber} />

      <section className="summary-grid">
        <div className="info-card is-accent">
          <div className="data-label">Customer</div>
          <div className="data-value is-large">{invoice.customerName}</div>
        </div>
        <div className="info-card is-accent">
          <div className="data-label">Amount</div>
          <div className="data-value is-large">{invoice.currency} {invoice.amount}</div>
        </div>
        <div className="info-card">
          <div className="data-label">Created</div>
          <div className="data-value">{formatDate(invoice.createdAt)}</div>
        </div>
        <div className="info-card">
          <div className="data-label">Verified on</div>
          <div className="data-value">{formatDate(invoice.anchor?.anchoredAt || null)}</div>
        </div>
      </section>

      <section className="proof-panel page-stack">
        <div className="section-head">
          <div>
            <h2 className="section-title">Proof details</h2>
            <p className="section-copy">Important details, arranged clearly.</p>
          </div>
        </div>

        <div className="proof-grid">
          <div className="proof-item is-accent">
            <div className="proof-label">Invoice record</div>
            <div className="proof-value break-anywhere" title={invoice.recordHash || ''}>
              {invoice.recordHash ? shortenHash(invoice.recordHash, 18, 12) : 'Waiting'}
            </div>
          </div>
          <div className="proof-item">
            <div className="proof-label">Attached file</div>
            <div className="proof-value break-anywhere" title={invoice.fileHash || ''}>
              {invoice.fileHash ? shortenHash(invoice.fileHash, 18, 12) : 'No file attached'}
            </div>
          </div>
          <div className="proof-item">
            <div className="proof-label">Blockchain receipt</div>
            <div className="proof-value break-anywhere">
              {txUrl && invoice.anchor?.txHash ? (
                <a href={txUrl} target="_blank" rel="noreferrer" className="hash-link" title={invoice.anchor.txHash}>
                  {shortenHash(invoice.anchor.txHash, 18, 12)}
                </a>
              ) : (
                'Waiting'
              )}
            </div>
          </div>
          <div className="proof-item">
            <div className="proof-label">Public proof page</div>
            <div className="proof-value">
              <a href={invoice.verifyUrl} className="link-primary">Open</a>
            </div>
          </div>
          {invoice.pdfUrl ? (
            <div className="proof-item">
              <div className="proof-label">Sealed PDF</div>
              <div className="proof-value">
                <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" className="link-primary">Download / open</a>
              </div>
            </div>
          ) : null}
        </div>

        {invoice.notes ? (
          <div className="info-card">
            <div className="data-label">Note</div>
            <div className="data-value">{invoice.notes}</div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

import { AutoRefreshWhenPending } from '../../../components/ui/auto-refresh';
import { ShareProofCard } from '../../../components/ui/share-proof-card';
import { getVerification } from '../../../lib/api';
import { getAddressUrl, getTransactionUrl, shortenHash } from '../../../lib/explorer';

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

export default async function VerifyPage({ params }: { params: Promise<{ publicVerifyId: string }> }) {
  const { publicVerifyId } = await params;
  const verification = await getVerification(publicVerifyId);

  if (!verification) {
    return (
      <main className="container page-shell">
        <section className="glass-card card-pad-xl empty-state" style={{ maxWidth: 820, margin: '0 auto' }}>
          <div className="status-pill retrying" style={{ margin: '0 auto 16px', width: 'fit-content' }}>Not found</div>
          <h1 style={{ margin: '0 0 10px' }}>Verification unavailable</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Please try again shortly.</p>
        </section>
      </main>
    );
  }

  const txUrl = getTransactionUrl(verification.proof?.txHash, verification.proof?.network);
  const contractUrl = getAddressUrl(verification.proof?.contractAddress, verification.proof?.network);
  const isVerified = verification.isVerified;

  return (
    <main className="container page-shell page-stack">
      <section className="glass-card card-pad-xl premium-hero" style={{ maxWidth: 920, margin: '0 auto', width: '100%' }}>
        <div className="verify-focus">
          <div className={`trust-badge ${isVerified ? 'is-verified' : 'is-pending'}`}>
            {isVerified ? '✓' : '⟳'}
          </div>

          <div className="page-stack" style={{ gap: 10, justifyItems: 'center' }}>
            <div className={`status-pill ${isVerified ? 'verified' : 'pending'}`}>
              {isVerified ? 'Verified' : 'Checking'}
            </div>

            <h1 style={{ margin: 0, fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', letterSpacing: '-0.045em' }}>
              {isVerified ? 'Invoice verified' : 'Verification in progress'}
            </h1>

            <p className="page-subtitle" style={{ margin: 0, textAlign: 'center', maxWidth: 620 }}>
              {isVerified ? 'This invoice matches the protected record and is ready to trust.' : 'This invoice is being sealed now. The page refreshes automatically.'}
            </p>
          </div>

          <div className="verify-highlight-grid">
            <div className="mini-card is-accent">
              <div className="metric-label">Invoice</div>
              <div className="metric-value">{verification.invoiceNumber}</div>
            </div>
            <div className="mini-card is-accent">
              <div className="metric-label">Amount</div>
              <div className="metric-value">{verification.currency} {verification.amount}</div>
            </div>
          </div>

          <AutoRefreshWhenPending active={!isVerified} label="Checking proof..." />
        </div>
      </section>

      <section className="summary-grid" style={{ maxWidth: 920, margin: '0 auto', width: '100%' }}>
        <div className="info-card">
          <div className="data-label">Business</div>
          <div className="data-value">{verification.issuedBy}</div>
        </div>
        <div className="info-card">
          <div className="data-label">Customer</div>
          <div className="data-value">{verification.customerName}</div>
        </div>
        <div className="info-card">
          <div className="data-label">Created</div>
          <div className="data-value">{formatDate(verification.createdAt)}</div>
        </div>
        <div className="info-card">
          <div className="data-label">Verified on</div>
          <div className="data-value">{formatDate(verification.anchoredAt)}</div>
        </div>
      </section>

      <section className="proof-panel page-stack" style={{ maxWidth: 920, margin: '0 auto', width: '100%' }}>
        <div className="section-head">
          <div>
            <h2 className="section-title">Protected proof</h2>
            <p className="section-copy">Human-readable first. Technical details kept tidy.</p>
          </div>
        </div>

        <div className="proof-grid">
          <div className="proof-item is-accent">
            <div className="proof-label">Invoice record</div>
            <div className="proof-value break-anywhere" title={verification.recordHash || ''}>
              {verification.recordHash ? shortenHash(verification.recordHash, 18, 12) : 'Waiting'}
            </div>
          </div>
          <div className="proof-item is-accent">
            <div className="proof-label">Proof batch</div>
            <div className="proof-value break-anywhere" title={verification.proof?.merkleRoot || ''}>
              {verification.proof?.merkleRoot ? shortenHash(verification.proof.merkleRoot, 18, 12) : 'Waiting'}
            </div>
          </div>
          <div className="proof-item">
            <div className="proof-label">Blockchain receipt</div>
            <div className="proof-value break-anywhere">
              {txUrl && verification.proof?.txHash ? (
                <a href={txUrl} target="_blank" rel="noreferrer" className="hash-link" title={verification.proof.txHash}>
                  {shortenHash(verification.proof.txHash, 18, 12)}
                </a>
              ) : (
                'Waiting'
              )}
            </div>
          </div>
          <div className="proof-item">
            <div className="proof-label">Contract</div>
            <div className="proof-value break-anywhere">
              {contractUrl && verification.proof?.contractAddress ? (
                <a href={contractUrl} target="_blank" rel="noreferrer" className="hash-link" title={verification.proof.contractAddress}>
                  {shortenHash(verification.proof.contractAddress, 16, 10)}
                </a>
              ) : (
                'Waiting'
              )}
            </div>
          </div>
          <div className="proof-item">
            <div className="proof-label">Attached file</div>
            <div className="proof-value break-anywhere" title={verification.fileHash || ''}>
              {verification.fileHash ? shortenHash(verification.fileHash, 18, 12) : 'No file attached'}
            </div>
          </div>
          <div className="proof-item">
            <div className="proof-label">Reference ID</div>
            <div className="proof-value break-anywhere">{verification.publicVerifyId}</div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 920, margin: '0 auto', width: '100%' }}>
        <ShareProofCard invoiceNumber={verification.invoiceNumber} compact />
      </div>
    </main>
  );
}

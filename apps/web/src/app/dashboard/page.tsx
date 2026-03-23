import Link from 'next/link';
import { listInvoices, type InvoiceRecord } from '../../lib/api';

function getStatusLabel(status: string) {
  if (status === 'anchored') return 'Verified';
  if (status === 'anchor_failed_retrying') return 'Checking';
  return 'Pending';
}

function getStatusClass(status: string) {
  if (status === 'anchored') return 'verified';
  if (status === 'anchor_failed_retrying') return 'retrying';
  return 'pending';
}

export default async function DashboardPage() {
  const invoices = await listInvoices();
  const records = invoices || [];
  const verifiedCount = records.filter((invoice) => invoice.status === 'anchored').length;
  const pendingCount = records.filter((invoice) => invoice.status !== 'anchored').length;

  return (
    <main className="container page-shell page-stack">
      <section className="glass-card card-pad-xl">
        <div className="page-head">
          <div className="page-stack" style={{ gap: 12 }}>
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              Dashboard
            </div>
            <h1 style={{ margin: 0 }}>Your invoices</h1>
            <p className="page-subtitle" style={{ margin: 0 }}>
              Calm overview. Clear status. Easy proof sharing.
            </p>
          </div>

          <div className="hero-actions">
            <Link href="/invoices/new" className="btn btn-primary">
              New invoice
            </Link>
          </div>
        </div>

        <div className="mini-grid" style={{ marginTop: 22 }}>
          <div className="mini-card is-accent">
            <div className="metric-label">Total</div>
            <div className="metric-value is-large">{records.length}</div>
          </div>
          <div className="mini-card is-accent">
            <div className="metric-label">Verified</div>
            <div className="metric-value is-large">{verifiedCount}</div>
          </div>
          <div className="mini-card is-accent">
            <div className="metric-label">Pending</div>
            <div className="metric-value is-large">{pendingCount}</div>
          </div>
        </div>
      </section>

      <section className="table-card table-card-premium">
        {!records.length ? (
          <div className="empty-state card-pad-xl">
            <h2>No invoices yet</h2>
            <p className="muted">Create your first invoice to start sharing proof.</p>
            <div className="action-row" style={{ justifyContent: 'center', marginTop: 18 }}>
              <Link href="/invoices/new" className="btn btn-primary">
                Create invoice
              </Link>
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Verify</th>
              </tr>
            </thead>
            <tbody>
              {records.map((invoice: InvoiceRecord) => (
                <tr key={invoice.id}>
                  <td>
                    <Link href={`/invoices/${invoice.id}`} className="link-primary">
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td>{invoice.customerName}</td>
                  <td>
                    <span className={`status-pill ${getStatusClass(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td>
                    <a href={invoice.verifyUrl} className="link-secondary">
                      Open proof
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

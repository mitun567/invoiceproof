import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ToastProvider } from '../components/ui/toast-provider';

export const metadata = {
  title: 'InvoiceProof',
  description: 'Premium invoice trust for modern businesses',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <header className="glass-nav">
            <div className="container nav-inner">
              <Link href="/" className="brand-link">
                <span className="brand-badge">IP</span>
                <span>InvoiceProof</span>
              </Link>

              <nav className="nav-links">
                <Link href="/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <Link href="/invoices/new" className="nav-link">
                  Create
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useToast } from './toast-provider';

type ShareProofCardProps = {
  verifyUrl?: string;
  invoiceNumber?: string;
  compact?: boolean;
};

export function ShareProofCard({ verifyUrl, invoiceNumber = 'invoice', compact = false }: ShareProofCardProps) {
  const { showToast } = useToast();
  const [currentUrl, setCurrentUrl] = useState(verifyUrl || '');
  const [busy, setBusy] = useState<null | 'download' | 'share-qr'>(null);

  useEffect(() => {
    if (verifyUrl) {
      setCurrentUrl(verifyUrl);
      return;
    }

    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, [verifyUrl]);

  const qrUrl = useMemo(() => {
    if (!currentUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(currentUrl)}`;
  }, [currentUrl]);

  const footerText = useMemo(() => {
    if (!currentUrl) return 'Verify this invoice here';
    return `Verify this invoice here: ${currentUrl}`;
  }, [currentUrl]);

  async function copyText(value: string, successTitle: string) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      showToast({
        tone: 'success',
        title: successTitle,
        description: 'Ready to share.',
      });
    } catch {
      showToast({
        tone: 'error',
        title: 'Copy failed',
        description: 'Please try again.',
      });
    }
  }

  async function shareLink() {
    if (!currentUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Verify ${invoiceNumber}`,
          text: 'Open this public verification page.',
          url: currentUrl,
        });

        showToast({
          tone: 'success',
          title: 'Shared',
          description: 'Verification link shared.',
        });
        return;
      }

      await copyText(currentUrl, 'Link copied');
    } catch {
      // user cancelled or share failed
    }
  }

  async function fetchQrFile() {
    if (!qrUrl) return null;

    const response = await fetch(qrUrl);
    const blob = await response.blob();
    return new File([blob], `${invoiceNumber || 'invoice'}-verify-qr.png`, { type: blob.type || 'image/png' });
  }

  async function downloadQr() {
    if (!qrUrl) return;
    setBusy('download');

    try {
      const file = await fetchQrFile();
      if (!file) throw new Error('QR unavailable');

      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showToast({
        tone: 'success',
        title: 'QR downloaded',
        description: 'You can share it anywhere.',
      });
    } catch {
      window.open(qrUrl, '_blank', 'noopener,noreferrer');
      showToast({
        tone: 'info',
        title: 'QR opened',
        description: 'Save the image from the new tab.',
      });
    } finally {
      setBusy(null);
    }
  }

  async function shareQr() {
    if (!qrUrl) return;
    setBusy('share-qr');

    try {
      if (!navigator.share) {
        await copyText(currentUrl, 'Link copied');
        return;
      }

      const file = await fetchQrFile();
      if (file && 'canShare' in navigator && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Verify ${invoiceNumber}`,
          text: 'Scan this QR code to verify the invoice.',
          files: [file],
        });
        showToast({
          tone: 'success',
          title: 'QR shared',
          description: 'Verification QR shared.',
        });
        return;
      }

      await navigator.share({
        title: `Verify ${invoiceNumber}`,
        text: `Scan or open this verification link: ${currentUrl}`,
        url: currentUrl,
      });
      showToast({
        tone: 'success',
        title: 'Shared',
        description: 'Verification link shared.',
      });
    } catch {
      // user cancelled or share failed
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={`section-card share-proof-card ${compact ? 'is-compact' : ''}`}>
      <div className="section-head">
        <div>
          <h2 className="section-title">Share verification</h2>
          <p className="section-copy">Anyone with this link or QR can open the public proof page.</p>
        </div>
        <span className="mini-chip is-accent">No login needed</span>
      </div>

      <div className="share-proof-grid">
        <div className="share-proof-main">
          <div className="share-proof-block">
            <div className="data-label">Public verify link</div>
            <div className="share-link-shell">{currentUrl || 'Preparing link...'}</div>
          </div>

          <div className="share-action-grid">
            <button type="button" className="btn btn-primary" onClick={() => copyText(currentUrl, 'Link copied')}>
              Copy verify link
            </button>
            <button type="button" className="btn btn-secondary" onClick={shareLink}>
              Share verify link
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => copyText(footerText, 'Footer text copied')}>
              Copy footer text
            </button>
            <button type="button" className="btn btn-ghost" onClick={shareQr} disabled={busy === 'share-qr'}>
              {busy === 'share-qr' ? 'Sharing QR...' : 'Share QR code'}
            </button>
          </div>

          <div className="share-proof-block">
            <div className="data-label">Email / PDF footer</div>
            <div className="footer-copy-preview">{footerText}</div>
          </div>
        </div>

        <div className="qr-card">
          <div className="data-label">Scan to verify</div>
          {qrUrl ? <img src={qrUrl} alt="Verification QR code" className="qr-image" /> : <div className="qr-placeholder">QR loading...</div>}
          <button type="button" className="btn btn-secondary qr-download-btn" onClick={downloadQr} disabled={busy === 'download'}>
            {busy === 'download' ? 'Preparing QR...' : 'Download QR'}
          </button>
        </div>
      </div>
    </section>
  );
}

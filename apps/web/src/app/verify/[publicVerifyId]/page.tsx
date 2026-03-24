// import { AutoRefreshWhenPending } from '../../../components/ui/auto-refresh';
// import { ShareProofCard } from '../../../components/ui/share-proof-card';
// import { getVerification } from '../../../lib/api';
// import { getAddressUrl, getTransactionUrl, shortenHash } from '../../../lib/explorer';

// function formatDate(value: string | null) {
//   if (!value) return 'Waiting';
//   return (
//     new Date(value).toLocaleString('en-US', {
//       dateStyle: 'medium',
//       timeStyle: 'short',
//       timeZone: 'UTC',
//     }) + ' UTC'
//   );
// }

// export default async function VerifyPage({ params }: { params: Promise<{ publicVerifyId: string }> }) {
//   const { publicVerifyId } = await params;
//   const verification = await getVerification(publicVerifyId);

//   if (!verification) {
//     return (
//       <main className="container page-shell">
//         <section className="glass-card card-pad-xl empty-state" style={{ maxWidth: 820, margin: '0 auto' }}>
//           <div className="status-pill retrying" style={{ margin: '0 auto 16px', width: 'fit-content' }}>Not found</div>
//           <h1 style={{ margin: '0 0 10px' }}>Verification unavailable</h1>
//           <p className="page-subtitle" style={{ margin: 0 }}>Please try again shortly.</p>
//         </section>
//       </main>
//     );
//   }

//   const txUrl = getTransactionUrl(verification.proof?.txHash, verification.proof?.network);
//   const contractUrl = getAddressUrl(verification.proof?.contractAddress, verification.proof?.network);
//   const isVerified = verification.isVerified;

//   return (
//     <main className="container page-shell page-stack">
//       <section className="glass-card card-pad-xl premium-hero" style={{ maxWidth: 920, margin: '0 auto', width: '100%' }}>
//         <div className="verify-focus">
//           <div className={`trust-badge ${isVerified ? 'is-verified' : 'is-pending'}`}>
//             {isVerified ? '✓' : '⟳'}
//           </div>

//           <div className="page-stack" style={{ gap: 10, justifyItems: 'center' }}>
//             <div className={`status-pill ${isVerified ? 'verified' : 'pending'}`}>
//               {isVerified ? 'Verified' : 'Checking'}
//             </div>

//             <h1 style={{ margin: 0, fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', letterSpacing: '-0.045em' }}>
//               {isVerified ? 'Invoice verified' : 'Verification in progress'}
//             </h1>

//             <p className="page-subtitle" style={{ margin: 0, textAlign: 'center', maxWidth: 620 }}>
//               {isVerified ? 'This invoice matches the protected record and is ready to trust.' : 'This invoice is being sealed now. The page refreshes automatically.'}
//             </p>
//           </div>

//           <div className="verify-highlight-grid">
//             <div className="mini-card is-accent">
//               <div className="metric-label">Invoice</div>
//               <div className="metric-value">{verification.invoiceNumber}</div>
//             </div>
//             <div className="mini-card is-accent">
//               <div className="metric-label">Amount</div>
//               <div className="metric-value">{verification.currency} {verification.amount}</div>
//             </div>
//           </div>

//           <AutoRefreshWhenPending active={!isVerified} label="Checking proof..." />
//         </div>
//       </section>

//       <section className="summary-grid" style={{ maxWidth: 920, margin: '0 auto', width: '100%' }}>
//         <div className="info-card">
//           <div className="data-label">Business</div>
//           <div className="data-value">{verification.issuedBy}</div>
//         </div>
//         <div className="info-card">
//           <div className="data-label">Customer</div>
//           <div className="data-value">{verification.customerName}</div>
//         </div>
//         <div className="info-card">
//           <div className="data-label">Created</div>
//           <div className="data-value">{formatDate(verification.createdAt)}</div>
//         </div>
//         <div className="info-card">
//           <div className="data-label">Verified on</div>
//           <div className="data-value">{formatDate(verification.anchoredAt)}</div>
//         </div>
//       </section>

//       <section className="proof-panel page-stack" style={{ maxWidth: 920, margin: '0 auto', width: '100%' }}>
//         <div className="section-head">
//           <div>
//             <h2 className="section-title">Protected proof</h2>
//             <p className="section-copy">Human-readable first. Technical details kept tidy.</p>
//           </div>
//         </div>

//         <div className="proof-grid">
//           <div className="proof-item is-accent">
//             <div className="proof-label">Invoice record</div>
//             <div className="proof-value break-anywhere" title={verification.recordHash || ''}>
//               {verification.recordHash ? shortenHash(verification.recordHash, 18, 12) : 'Waiting'}
//             </div>
//           </div>
//           <div className="proof-item is-accent">
//             <div className="proof-label">Proof batch</div>
//             <div className="proof-value break-anywhere" title={verification.proof?.merkleRoot || ''}>
//               {verification.proof?.merkleRoot ? shortenHash(verification.proof.merkleRoot, 18, 12) : 'Waiting'}
//             </div>
//           </div>
//           <div className="proof-item">
//             <div className="proof-label">Blockchain receipt</div>
//             <div className="proof-value break-anywhere">
//               {txUrl && verification.proof?.txHash ? (
//                 <a href={txUrl} target="_blank" rel="noreferrer" className="hash-link" title={verification.proof.txHash}>
//                   {shortenHash(verification.proof.txHash, 18, 12)}
//                 </a>
//               ) : (
//                 'Waiting'
//               )}
//             </div>
//           </div>
//           <div className="proof-item">
//             <div className="proof-label">Contract</div>
//             <div className="proof-value break-anywhere">
//               {contractUrl && verification.proof?.contractAddress ? (
//                 <a href={contractUrl} target="_blank" rel="noreferrer" className="hash-link" title={verification.proof.contractAddress}>
//                   {shortenHash(verification.proof.contractAddress, 16, 10)}
//                 </a>
//               ) : (
//                 'Waiting'
//               )}
//             </div>
//           </div>
//           <div className="proof-item">
//             <div className="proof-label">Attached file</div>
//             <div className="proof-value break-anywhere" title={verification.fileHash || ''}>
//               {verification.fileHash ? shortenHash(verification.fileHash, 18, 12) : 'No file attached'}
//             </div>
//           </div>
//           <div className="proof-item">
//             <div className="proof-label">Reference ID</div>
//             <div className="proof-value break-anywhere">{verification.publicVerifyId}</div>
//           </div>
//         </div>
//       </section>

//       <div style={{ maxWidth: 920, margin: '0 auto', width: '100%' }}>
//         <ShareProofCard invoiceNumber={verification.invoiceNumber} compact />
//       </div>
//     </main>
//   );
// }
"use client";

import { useState } from "react";

type VerifyRecord = {
  statusLabel: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  // networkLabel: string;
  documentId: string;
  issuerName: string;
  issuerMeta?: string;
  recipientName: string;
  recipientMeta?: string;
  totalAmount: string;
  currency: string;
  paymentMethod?: string;
  createdAt?: string;
  verifiedAt?: string;
  invoiceHash: string;
  proofBatch?: string;
  referenceId?: string;
  networkStatus?: string;
  blockchainReceipt?: string;
  publicLink?: string;
  explorerUrl?: string;
  verificationKeyLabel?: string;
  securityNote?: string;
};

const verification: VerifyRecord = {
  statusLabel: "Cryptographic Integrity Confirmed",
  title: "Invoice Verified",
  titleAccent: ".",
  subtitle: "This record is immutable, timestamped, and publicly verifiable.",
  // networkLabel: "VeriLedger Mainnet Node #4",
  documentId: "INV-2024-001",
  issuerName: "InvoiceProof Demo Company",
  issuerMeta: "#VeriProof Entity",
  recipientName: "BrightCore Ltd",
  recipientMeta: "Enterprise Client",
  totalAmount: "10,620",
  currency: "GBP",
  paymentMethod: "Wire Transfer",
  createdAt: "Mar 23, 2026, 5:37 PM UTC",
  verifiedAt: "Mar 23, 2026, 5:38 PM UTC",
  invoiceHash: "ccf982512412479fa14...6abaf34e99bd",
  proofBatch: "0xccf982512412...",
  referenceId: "840e113b-0ec",
  networkStatus: "Finalized",
  blockchainReceipt: "0xf9c6adfe9aba2977...7f6ecf84b485",
  publicLink: "http://localhost:3000/verify/840e113b-0ec",
  explorerUrl: "#",
  verificationKeyLabel: "Dynamic Verification Key",
  securityNote:
    "This session is encrypted using AES-256 and authenticated via VeriLedger Protocol v2.4.",
};

function CheckSeal() {
  return (
    <div className="relative mx-auto grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_22px_45px_rgba(16,185,129,0.28)]">
      <div className="absolute inset-[-10px] rounded-full border border-emerald-200/70" />
      <svg
        viewBox="0 0 48 48"
        className="h-11 w-11 fill-white"
        aria-hidden="true"
      >
        <path d="M24 4l5.4 3.15 6.2-.2 2.9 5.47 5.47 2.9-.2 6.2L47 27l-3.15 5.4.2 6.2-5.47 2.9-2.9 5.47-6.2-.2L24 44l-5.4 3.15-6.2-.2-2.9-5.47-5.47-2.9.2-6.2L1 27l3.15-5.4-.2-6.2 5.47-2.9 2.9-5.47 6.2.2L24 4zm7.6 14.6a2.2 2.2 0 00-3.1 0l-6.3 6.3-2.7-2.7a2.2 2.2 0 10-3.1 3.1l4.25 4.26a2.2 2.2 0 003.1 0l7.85-7.86a2.2 2.2 0 000-3.11z" />
      </svg>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px w-10 bg-emerald-200" />
      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
        {children}
      </span>
      <span className="h-px w-10 bg-emerald-200" />
    </div>
  );
}

function Field({
  label,
  value,
  subvalue,
  valueClassName = "text-[1.05rem] font-semibold text-slate-900",
  icon,
}: {
  label: string;
  value?: string;
  subvalue?: string;
  valueClassName?: string;
  icon?: React.ReactNode;
}) {
  if (!value) return null;

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="flex items-center gap-2">
        {icon}
        <div className={valueClassName}>{value}</div>
      </div>
      {subvalue ? (
        <div className="text-xs font-medium text-slate-400">{subvalue}</div>
      ) : null}
    </div>
  );
}

function ActualQRCode({ value }: { value: string }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
    value
  )}`;

  return (
    <div className="inline-flex rounded-[22px] border border-slate-200 bg-slate-50/80 p-5 shadow-inner">
      <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
        <img
          src={qrSrc}
          alt="Verification QR code"
          className="h-44 w-44 rounded-xl border border-slate-100 object-contain"
          loading="lazy"
        />
      </div>
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border border-slate-200/70 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

export default function VerifyPage() {
  const [linkCopied, setLinkCopied] = useState(false);
  const [hashCopied, setHashCopied] = useState(false);

  const copyText = async (value: string, type: "link" | "hash") => {
    try {
      await navigator.clipboard.writeText(value);
      if (type === "link") {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 1600);
      } else {
        setHashCopied(true);
        setTimeout(() => setHashCopied(false), 1600);
      }
    } catch {
      // ignore clipboard failure
    }
  };

  const exportManifest = () => {
    const blob = new Blob([JSON.stringify(verification, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${verification.documentId.toLowerCase()}-manifest.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const emailHref = verification.publicLink
    ? `mailto:?subject=${encodeURIComponent(
        `Verified invoice ${verification.documentId}`
      )}&body=${encodeURIComponent(
        `Verification link: ${verification.publicLink}`
      )}`
    : "#";

  return (
    <main
      className="min-h-screen bg-slate-50 text-slate-900"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(79,70,229,0.05), transparent 26%), radial-gradient(circle at top right, rgba(16,185,129,0.05), transparent 22%), linear-gradient(180deg, #ffffff 0%, #f8fafc 46%, #f8fafc 100%)",
      }}
    >
      {/* <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-5 lg:px-8">
          <BrandMark />
        </div>
      </header> */}

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-14 lg:px-8 lg:pt-20">
        <section className="mx-auto max-w-4xl text-center">
          <CheckSeal />
          <div className="mt-8 space-y-4">
            <SectionEyebrow>{verification.statusLabel}</SectionEyebrow>
            <h1 className="text-[2.5rem] font-extrabold tracking-[-0.05em] text-slate-950 sm:text-[3.6rem]">
              {verification.title}
              <span className="text-emerald-500">
                {verification.titleAccent}
              </span>
            </h1>
            <p className="mx-auto max-w-3xl text-[1rem] leading-7 text-slate-500 sm:text-lg">
              <span className="font-semibold text-slate-800">
                {/* {verification.networkLabel} */}
              </span>
              {verification.subtitle}
            </p>
          </div>
        </section>

        <section className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-12 xl:gap-10">
          <div className="space-y-8 lg:col-span-8">
            <Card className="relative overflow-hidden p-7 sm:p-9">
              <div className="pointer-events-none absolute right-8 top-7 opacity-[0.05]">
                <svg
                  viewBox="0 0 64 64"
                  className="h-24 w-24 fill-slate-500"
                  aria-hidden="true"
                >
                  <path d="M18 6h20l14 14v30c0 4.4-3.6 8-8 8H18c-4.4 0-8-3.6-8-8V14c0-4.4 3.6-8 8-8zm18 4v12h12" />
                </svg>
              </div>

              <div className="mb-10 flex flex-col gap-4 border-b border-slate-100 pb-7 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-900">
                  <span className="h-6 w-1.5 rounded-full bg-indigo-600" />
                  <span>Document Details</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live Sync
                  </span>
                  <span className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[11px] font-mono font-bold text-slate-500">
                    ID: {verification.documentId}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-12 gap-y-9 md:grid-cols-2">
                <Field
                  label="Issuer Name"
                  value={verification.issuerName}
                  subvalue={verification.issuerMeta}
                  valueClassName="text-[1.25rem] font-bold tracking-[-0.03em] text-slate-950"
                />
                <Field
                  label="Recipient"
                  value={verification.recipientName}
                  subvalue={verification.recipientMeta}
                  valueClassName="text-[1.25rem] font-bold tracking-[-0.03em] text-slate-950"
                />
                <Field
                  label="Total Amount"
                  value={verification.totalAmount}
                  subvalue={verification.currency}
                  valueClassName="text-[1.9rem] font-black leading-none tracking-[-0.05em] text-slate-950"
                />
                {/* <Field
                  label="Payment Method"
                  value={verification.paymentMethod}
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 fill-slate-400"
                      aria-hidden="true"
                    >
                      <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v1H4V8zm0 3h4v7H6a2 2 0 01-2-2v-5zm6 0h4v7h-4v-7zm6 0h4v5a2 2 0 01-2 2h-2v-7z" />
                    </svg>
                  }
                /> */}
                <Field label="Created" value={verification.createdAt} />
                <Field label="Verified On" value={verification.verifiedAt} />
              </div>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-900">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 stroke-current"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 7h16M7 12h10M10 17h4"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                Technical Manifest
              </div>

              <div className="relative overflow-hidden rounded-[24px] bg-slate-950 p-7 text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)] sm:p-9">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="relative space-y-7">
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Invoice Record (SHA-256)
                      </div>
                      <button
                        onClick={() =>
                          copyText(verification.invoiceHash, "hash")
                        }
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300 transition hover:text-white"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5 fill-current"
                          aria-hidden="true"
                        >
                          <path d="M16 1H6a2 2 0 00-2 2v12h2V3h10V1zm3 4H10a2 2 0 00-2 2v14a2 2 0 002 2h9a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H10V7h9v14z" />
                        </svg>
                        {hashCopied ? "Copied" : "Copy Hash"}
                      </button>
                    </div>
                    <div className="rounded-[18px] border border-white/5 bg-white/5 px-5 py-5 font-mono text-sm leading-7 text-indigo-100 shadow-inner shadow-black/10 break-all">
                      {verification.invoiceHash}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-[18px] border border-white/5 bg-white/5 p-4">
                      <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Proof Batch
                      </div>
                      <div className="mt-2 truncate font-mono text-sm text-emerald-400">
                        {verification.proofBatch}
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-white/5 bg-white/5 p-4">
                      <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Reference ID
                      </div>
                      <div className="mt-2 font-mono text-sm text-slate-100">
                        {verification.referenceId}
                      </div>
                    </div>
                    <div className="rounded-[18px] border border-white/5 bg-white/5 p-4">
                      <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Net Status
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-slate-100">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                        <span className="text-lg font-medium">
                          {verification.networkStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-end md:justify-between">
                    <div>
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Blockchain Receipt
                      </div>
                      <div className="font-mono text-[11px] text-indigo-300">
                        {verification.blockchainReceipt}
                      </div>
                    </div>
                    <a
                      href={verification.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white/20"
                    >
                      View on Explorer
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 lg:col-span-4 lg:pt-1">
            <Card className="overflow-hidden p-7 text-center sm:p-8">
              <div className="mx-[-32px] -mt-8 mb-7 h-1.5 bg-gradient-to-r from-indigo-600 to-emerald-500" />
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-900">
                Verification Toolkit
              </div>

              <div className="mt-7">
                <ActualQRCode
                  value={verification.publicLink ?? verification.documentId}
                />
                <div className="mt-4 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {verification.verificationKeyLabel}
                </div>
                {verification.publicLink ? (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-mono text-slate-500 break-all">
                    {verification.publicLink}
                  </div>
                ) : null}
              </div>

              <div className="mt-8 space-y-3">
                <button
                  onClick={() =>
                    verification.publicLink &&
                    copyText(verification.publicLink, "link")
                  }
                  className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(15,23,42,0.14)] transition hover:bg-slate-800"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M10.59 13.41a1.996 1.996 0 010-2.82l3.18-3.18a2 2 0 112.83 2.83l-1.06 1.06 1.41 1.41 1.06-1.06a4 4 0 00-5.66-5.66l-3.18 3.18a4 4 0 005.66 5.66l.88-.88-1.41-1.41-.88.87a1.996 1.996 0 01-2.83 0z" />
                    <path d="M13.41 10.59a1.996 1.996 0 010 2.82l-3.18 3.18a2 2 0 11-2.83-2.83l1.06-1.06-1.41-1.41-1.06 1.06a4 4 0 105.66 5.66l3.18-3.18a4 4 0 00-5.66-5.66l-.88.88 1.41 1.41.88-.87a1.996 1.996 0 012.83 0z" />
                  </svg>
                  {linkCopied ? "Copied" : "Copy Public Link"}
                </button>

                <button
                  onClick={exportManifest}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-900 transition hover:bg-slate-50"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M12 16l4-5h-3V4h-2v7H8l4 5zm7 2H5v2h14v-2z" />
                  </svg>
                  Export Manifest
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-7 border-t border-slate-100 pt-7">
                <button className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 transition hover:text-indigo-600">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M6 2h9l5 5v15a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 1.5V8h4.5" />
                  </svg>
                  PDF
                </button>
                <a
                  href={emailHref}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 transition hover:text-indigo-600"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.24l-8 5-8-5V6l8 5 8-5v2.24z" />
                  </svg>
                  Email
                </a>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 transition hover:text-indigo-600"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M7 7V3h10v4H7zm10 2H7a4 4 0 00-4 4v4h4v4h10v-4h4v-4a4 4 0 00-4-4zm-2 10H9v-5h6v5z" />
                  </svg>
                  Print
                </button>
              </div>
            </Card>

            <Card className="bg-white/60 p-8 text-center backdrop-blur-sm">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-indigo-50">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 fill-indigo-600"
                  aria-hidden="true"
                >
                  <path d="M12 2l7 4v5c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V6l7-4zm0 5a3 3 0 100 6 3 3 0 000-6z" />
                </svg>
              </div>
              <div className="mt-4 space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-900">
                  Bank-Grade Security
                </div>
                <p className="mx-auto max-w-[240px] text-xs leading-6 text-slate-500">
                  {verification.securityNote}
                </p>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

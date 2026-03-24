// "use client";

// import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { Spinner } from "../components/ui/spinner";
// import { useToast } from "../components/ui/toast-provider";
// import { savePendingInvoiceDraft } from "../lib/invoice-draft-transfer";

// type BusyState = null | "ai" | "upload";

// type SpeechRecognitionInstance = {
//   lang: string;
//   interimResults: boolean;
//   continuous: boolean;
//   start: () => void;
//   stop: () => void;
//   onresult:
//     | ((event: {
//         results: ArrayLike<ArrayLike<{ transcript: string }>>;
//       }) => void)
//     | null;
//   onerror: ((event: { error?: string }) => void) | null;
//   onend: (() => void) | null;
// };

// type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

// declare global {
//   interface Window {
//     webkitSpeechRecognition?: SpeechRecognitionCtor;
//     SpeechRecognition?: SpeechRecognitionCtor;
//   }
// }

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

// function getSpeechRecognitionCtor() {
//   if (typeof window === "undefined") return null;
//   return window.SpeechRecognition || window.webkitSpeechRecognition || null;
// }

// export default function HomePage() {
//   const router = useRouter();
//   const { showToast } = useToast();
//   const uploadInputRef = useRef<HTMLInputElement | null>(null);
//   const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
//   const [aiOpen, setAiOpen] = useState(false);
//   const [prompt, setPrompt] = useState("");
//   const [busy, setBusy] = useState<BusyState>(null);
//   const [isListening, setIsListening] = useState(false);

//   const hasVoiceInput = useMemo(() => Boolean(getSpeechRecognitionCtor()), []);

//   useEffect(() => {
//     return () => recognitionRef.current?.stop();
//   }, []);

//   function closeAiModal() {
//     recognitionRef.current?.stop();
//     setIsListening(false);
//     setAiOpen(false);
//   }

//   async function createFromAi() {
//     const normalizedPrompt = prompt
//       .replace(/[\u0000-\u001F\u007F]/g, " ")
//       .replace(/\s+/g, " ")
//       .trim();
//     if (normalizedPrompt.length < 12) {
//       showToast({
//         tone: "error",
//         title: "Add more detail",
//         description:
//           "Paste messy notes, a short conversation, or describe the invoice first.",
//       });
//       return;
//     }

//     setBusy("ai");

//     try {
//       const response = await fetch(`${API_BASE}/invoices/ai-canvas-draft`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt: normalizedPrompt }),
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not extract invoice data."
//         );
//       }

//       savePendingInvoiceDraft({
//         type: "ai-canvas",
//         payload: {
//           ...json.data,
//           prompt: normalizedPrompt,
//         },
//       });

//       closeAiModal();
//       router.push("/invoices/new");
//     } catch (error) {
//       const message =
//         error instanceof Error
//           ? error.message
//           : "Could not extract invoice data.";
//       showToast({
//         tone: "error",
//         title: "AI extraction failed",
//         description: message,
//       });
//     } finally {
//       setBusy(null);
//     }
//   }

//   async function handlePdfUpload(event: ChangeEvent<HTMLInputElement>) {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     if (
//       file.type !== "application/pdf" &&
//       !file.name.toLowerCase().endsWith(".pdf")
//     ) {
//       showToast({
//         tone: "error",
//         title: "Invalid file",
//         description: "Please choose a PDF invoice.",
//       });
//       event.target.value = "";
//       return;
//     }

//     setBusy("upload");

//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       const response = await fetch(`${API_BASE}/invoices/upload-detect`, {
//         method: "POST",
//         body: formData,
//       });
//       const json = await response.json();
//       if (!response.ok || !json.success) {
//         throw new Error(
//           json?.error?.message || "Could not read the uploaded PDF."
//         );
//       }

//       savePendingInvoiceDraft({
//         type: "pdf-detect",
//         payload: json.data,
//       });

//       showToast({
//         tone: "success",
//         title: "PDF imported",
//         description: "Opening the invoice canvas with extracted data.",
//       });
//       router.push("/invoices/new");
//     } catch (error) {
//       const message =
//         error instanceof Error
//           ? error.message
//           : "Could not read the uploaded PDF.";
//       showToast({
//         tone: "error",
//         title: "Upload failed",
//         description: message,
//       });
//     } finally {
//       event.target.value = "";
//       setBusy(null);
//     }
//   }

//   function toggleVoiceInput() {
//     const Recognition = getSpeechRecognitionCtor();
//     if (!Recognition) {
//       showToast({
//         tone: "info",
//         title: "Voice input unavailable",
//         description:
//           "This browser does not support built-in speech recognition.",
//       });
//       return;
//     }

//     if (isListening) {
//       recognitionRef.current?.stop();
//       setIsListening(false);
//       return;
//     }

//     const recognition = new Recognition();
//     recognition.lang = "en-US";
//     recognition.interimResults = true;
//     recognition.continuous = true;
//     recognition.onresult = (event) => {
//       const transcript = Array.from(event.results)
//         .map((result) => result?.[0]?.transcript || "")
//         .join(" ")
//         .trim();
//       setPrompt(transcript);
//     };
//     recognition.onerror = () => {
//       setIsListening(false);
//       showToast({
//         tone: "error",
//         title: "Voice input stopped",
//         description: "Please try again or type the notes manually.",
//       });
//     };
//     recognition.onend = () => {
//       setIsListening(false);
//     };
//     recognitionRef.current = recognition;
//     recognition.start();
//     setIsListening(true);
//   }

//   return (
//     <>
//       {aiOpen ? (
//         <div
//           className="ai-modal-overlay"
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="home-ai-title"
//         >
//           <div className="ai-modal-card home-ai-modal-card">
//             <div className="ai-modal-head">
//               <div className="page-stack" style={{ gap: 8 }}>
//                 <span className="mini-chip is-accent">AI invoice intake</span>
//                 <h2 id="home-ai-title" style={{ margin: 0 }}>
//                   Create invoice with AI
//                 </h2>
//                 <p className="page-subtitle" style={{ margin: 0 }}>
//                   Paste messy notes, client conversation, email text, or use
//                   voice input. We will extract the invoice data and open the
//                   canvas ready to edit.
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 className="btn btn-secondary"
//                 onClick={closeAiModal}
//               >
//                 Close
//               </button>
//             </div>

//             <label className="field-group">
//               <span className="field-label">
//                 Prompt, conversation, or messy notes
//               </span>
//               <textarea
//                 className="input-shell ai-modal-textarea"
//                 value={prompt}
//                 onChange={(event) => setPrompt(event.target.value)}
//                 placeholder="Example: Client is Acme Labs. Website redesign and 2 landing pages. Total 4500 USD. Add 18% VAT. Invoice date today. Due in 7 days."
//                 maxLength={4000}
//                 autoFocus
//               />
//             </label>

//             <div className="quick-row">
//               <span className="mini-chip">Paste email or WhatsApp text</span>
//               <span className="mini-chip">Messy details are okay</span>
//               {hasVoiceInput ? (
//                 <span className="mini-chip">Voice input supported</span>
//               ) : null}
//             </div>

//             <div className="ai-modal-actions">
//               {hasVoiceInput ? (
//                 <button
//                   type="button"
//                   className="btn btn-secondary"
//                   onClick={toggleVoiceInput}
//                 >
//                   {isListening ? "Stop voice input" : "Use voice input"}
//                 </button>
//               ) : null}
//               <button
//                 type="button"
//                 className="btn btn-primary"
//                 onClick={createFromAi}
//                 disabled={busy === "ai" || prompt.trim().length < 12}
//               >
//                 {busy === "ai" ? "Extracting..." : "Continue"}
//               </button>
//             </div>
//           </div>
//         </div>
//       ) : null}

//       {busy ? (
//         <div className="submit-overlay" aria-live="polite" aria-busy="true">
//           <div className="submit-overlay-card">
//             <div className="submit-overlay-inner">
//               <Spinner size="xl" tone="brand" />
//               <h3>
//                 {busy === "ai"
//                   ? "Extracting invoice details"
//                   : "Reading uploaded PDF"}
//               </h3>
//               <p>
//                 {busy === "ai"
//                   ? "Turning your messy notes into a clean editable invoice canvas."
//                   : "Scanning the PDF and preparing the invoice canvas with detected data."}
//               </p>
//             </div>
//           </div>
//         </div>
//       ) : null}

//       <main className="container page-shell page-stack">
//         <section className="glass-card card-pad-xl premium-hero">
//           <div className="page-stack" style={{ gap: 26 }}>
//             <div className="eyebrow">
//               <span className="eyebrow-dot" />
//               Trusted invoice verification
//             </div>

//             <div className="page-stack" style={{ gap: 14, maxWidth: 760 }}>
//               <h1 className="hero-title">Create. Seal. Verify.</h1>
//               <p className="hero-copy" style={{ margin: 0 }}>
//                 Built for businesses that want every invoice to feel official,
//                 protected, and easy to trust.
//               </p>
//             </div>

//             <div className="hero-actions">
//               <button
//                 type="button"
//                 className="btn btn-primary"
//                 onClick={() => setAiOpen(true)}
//               >
//                 Create invoice with AI
//               </button>
//               <button
//                 type="button"
//                 className="btn btn-secondary"
//                 onClick={() => uploadInputRef.current?.click()}
//               >
//                 Upload PDF
//               </button>
//               <input
//                 ref={uploadInputRef}
//                 type="file"
//                 accept="application/pdf,.pdf"
//                 hidden
//                 onChange={handlePdfUpload}
//               />
//             </div>

//             <div className="mini-grid mini-grid-premium">
//               <div className="mini-card is-accent">
//                 <div className="metric-label">Trust</div>
//                 <div className="metric-value">
//                   A proof page people can understand
//                 </div>
//               </div>
//               <div className="mini-card is-accent">
//                 <div className="metric-label">Protection</div>
//                 <div className="metric-value">
//                   Changes become easy to detect
//                 </div>
//               </div>
//               <div className="mini-card is-accent">
//                 <div className="metric-label">Sharing</div>
//                 <div className="metric-value">
//                   One clean link for customers and teams
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>
//       </main>

//       <style jsx global>{`
//         .ai-modal-overlay {
//           position: fixed;
//           inset: 0;
//           z-index: 60;
//           display: grid;
//           place-items: center;
//           padding: 24px;
//           background: rgba(15, 23, 42, 0.44);
//           backdrop-filter: blur(10px);
//         }
//         .ai-modal-card {
//           width: min(760px, 100%);
//           border-radius: 30px;
//           padding: 24px;
//           display: grid;
//           gap: 18px;
//           border: 1px solid rgba(101, 79, 230, 0.14);
//           background: linear-gradient(
//             180deg,
//             rgba(255, 255, 255, 0.98),
//             rgba(247, 245, 255, 0.96)
//           );
//           box-shadow: 0 30px 80px rgba(15, 23, 42, 0.24);
//         }
//         .home-ai-modal-card {
//           max-width: 760px;
//         }
//         .ai-modal-head {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-start;
//           gap: 16px;
//         }
//         .ai-modal-textarea {
//           min-height: 180px;
//           resize: vertical;
//           line-height: 1.6;
//         }
//         .ai-modal-actions {
//           display: flex;
//           justify-content: flex-end;
//           gap: 10px;
//           flex-wrap: wrap;
//         }
//         @media (max-width: 900px) {
//           .ai-modal-overlay {
//             padding: 12px;
//           }
//           .ai-modal-card,
//           .home-ai-modal-card {
//             padding: 18px;
//           }
//           .ai-modal-head {
//             flex-direction: column;
//             align-items: stretch;
//           }
//         }
//       `}</style>
//     </>
//   );
// }
"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "../components/ui/spinner";
import { useToast } from "../components/ui/toast-provider";
import { savePendingInvoiceDraft } from "../lib/invoice-draft-transfer";

type BusyState = null | "ai" | "upload";

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  }
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState<BusyState>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasVoiceInput, setHasVoiceInput] = useState(false);

  useEffect(() => {
    setHasVoiceInput(Boolean(getSpeechRecognitionCtor()));
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!promptInputRef.current) return;
    promptInputRef.current.style.height = "0px";
    promptInputRef.current.style.height = `${Math.min(
      promptInputRef.current.scrollHeight,
      260
    )}px`;
  }, [prompt]);

  async function createFromAi() {
    const normalizedPrompt = prompt
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (normalizedPrompt.length < 12) {
      showToast({
        tone: "error",
        title: "Add more detail",
        description:
          "Paste messy notes, a short conversation, or describe the invoice first.",
      });
      return;
    }

    setBusy("ai");

    try {
      const response = await fetch(`${API_BASE}/invoices/ai-canvas-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: normalizedPrompt }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(
          json?.error?.message || "Could not extract invoice data."
        );
      }

      savePendingInvoiceDraft({
        type: "ai-canvas",
        payload: {
          ...json.data,
          prompt: normalizedPrompt,
        },
      });

      router.push("/invoices/new");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not extract invoice data.";
      showToast({
        tone: "error",
        title: "AI extraction failed",
        description: message,
      });
    } finally {
      setBusy(null);
    }
  }

  async function handlePdfUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      showToast({
        tone: "error",
        title: "Invalid file",
        description: "Please choose a PDF invoice.",
      });
      event.target.value = "";
      return;
    }

    setBusy("upload");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/invoices/upload-detect`, {
        method: "POST",
        body: formData,
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(
          json?.error?.message || "Could not read the uploaded PDF."
        );
      }

      savePendingInvoiceDraft({
        type: "pdf-detect",
        payload: json.data,
      });

      showToast({
        tone: "success",
        title: "PDF imported",
        description: "Opening the invoice canvas with extracted data.",
      });
      router.push("/invoices/new");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not read the uploaded PDF.";
      showToast({
        tone: "error",
        title: "Upload failed",
        description: message,
      });
    } finally {
      event.target.value = "";
      setBusy(null);
    }
  }

  function toggleVoiceInput() {
    const Recognition = getSpeechRecognitionCtor();
    if (!Recognition) {
      showToast({
        tone: "info",
        title: "Voice input unavailable",
        description:
          "This browser does not support built-in speech recognition.",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();
      setPrompt(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      showToast({
        tone: "error",
        title: "Voice input stopped",
        description: "Please try again or type the notes manually.",
      });
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  return (
    <>
      {busy ? (
        <div className="submit-overlay" aria-live="polite" aria-busy="true">
          <div className="submit-overlay-card">
            <div className="submit-overlay-inner">
              <Spinner size="xl" tone="brand" />
              <h3>
                {busy === "ai"
                  ? "Extracting invoice details"
                  : "Reading uploaded PDF"}
              </h3>
              <p>
                {busy === "ai"
                  ? "Turning your notes into a premium editable invoice canvas."
                  : "Scanning the PDF and preparing the invoice canvas with detected data."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <input
        ref={uploadInputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={handlePdfUpload}
      />

      <main className="homepage-shell">
        <section className="hero-section">
          <div className="hero-aura hero-aura-left" />
          <div className="hero-aura hero-aura-right" />

          <div className="hero-inner">
            <div className="eyebrow-pill">The Future of Billing</div>

            <h1 className="hero-title">
              Create. <span>Seal.</span> Verify.
            </h1>

            <p className="hero-copy">
              Built for businesses that want every invoice to feel official,
              protected, and easy to trust. Leverage AI to curate professional
              billing documents in seconds.
            </p>

            <div className="prompt-card">
              <div className="prompt-label">Co-Designer Prompt</div>

              <div className="prompt-row">
                <div className="prompt-input-wrap">
                  <textarea
                    ref={promptInputRef}
                    className="prompt-input prompt-textarea"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="e.g., Generate a branded invoice for a design studio in London..."
                    rows={3}
                  />

                  {hasVoiceInput ? (
                    <button
                      type="button"
                      className={`voice-button${
                        isListening ? " is-listening" : ""
                      }`}
                      onClick={toggleVoiceInput}
                      aria-label={
                        isListening ? "Stop voice input" : "Use voice input"
                      }
                      title={
                        isListening ? "Stop voice input" : "Use voice input"
                      }
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M12 15.4a3.4 3.4 0 0 0 3.4-3.4V7.4a3.4 3.4 0 1 0-6.8 0V12a3.4 3.4 0 0 0 3.4 3.4Z"
                          fill="currentColor"
                        />
                        <path
                          d="M18.1 11.7a.9.9 0 0 0-1.8 0 4.3 4.3 0 0 1-8.6 0 .9.9 0 1 0-1.8 0 6.1 6.1 0 0 0 5.2 6v2h-2a.9.9 0 1 0 0 1.8h5.8a.9.9 0 0 0 0-1.8h-2v-2a6.1 6.1 0 0 0 5.2-6Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="prompt-actions">
                <button
                  type="button"
                  className="upload-link"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  <span className="upload-link-icon">↑</span>
                  Upload PDF to Auto-Stylize
                </button>

                <button
                  type="button"
                  className="primary-button prompt-submit-button"
                  onClick={createFromAi}
                  disabled={busy === "ai" || prompt.trim().length < 12}
                >
                  <span className="button-sparkle">✦</span>
                  {busy === "ai" ? "Generating..." : "Generate with AI"}
                </button>
              </div>
            </div>

            <div className="hero-preview-shell">
              <div className="preview-rail left" />
              <div className="preview-document-card">
                <div className="preview-document">
                  <div className="preview-topbar">
                    <div>
                      <div className="doc-brand">InvoiceProof</div>
                      <div className="doc-sub">Premium Services Invoice</div>
                    </div>
                    <div className="doc-meta">
                      <span>Invoice #INV-2408</span>
                      <span>Due Jul 28</span>
                    </div>
                  </div>

                  <div className="preview-grid">
                    <div>
                      <div className="doc-label">Issued For</div>
                      <div className="doc-strong">BrightCore Ltd</div>
                    </div>
                    <div>
                      <div className="doc-label">Issued By</div>
                      <div className="doc-strong">InvoiceProof Studio</div>
                    </div>
                    <div>
                      <div className="doc-label">Status</div>
                      <div className="status-chip">Verified</div>
                    </div>
                  </div>

                  <div className="preview-table">
                    <div className="preview-table-head">
                      <span>Item</span>
                      <span>Qty</span>
                      <span>Rate</span>
                      <span>Total</span>
                    </div>
                    <div className="preview-table-row">
                      <span>Visual Identity System</span>
                      <span>1</span>
                      <span>4,200</span>
                      <span>4,200</span>
                    </div>
                    <div className="preview-table-row">
                      <span>Landing Page Design</span>
                      <span>2</span>
                      <span>1,950</span>
                      <span>3,900</span>
                    </div>
                    <div className="preview-table-row">
                      <span>Invoice Verification Layer</span>
                      <span>1</span>
                      <span>2,520</span>
                      <span>2,520</span>
                    </div>
                  </div>

                  <div className="preview-summary">
                    <div className="summary-stack">
                      <span>Subtotal</span>
                      <span>10,620 GBP</span>
                    </div>
                    <div className="summary-stack strong">
                      <span>Total Due</span>
                      <span>10,620 GBP</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="preview-rail right" />
            </div>
          </div>
        </section>

        <section className="editorial-section">
          <div className="section-head">
            <h2>The Editorial Standard</h2>
            <p>
              Why leading teams choose InvoiceProof for trust-first, beautifully
              structured billing.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon blue">✓</div>
              <h3>Trust</h3>
              <p>
                A proof page people can understand. Every invoice comes with a
                cryptographic seal that confirms its origin instantly.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon violet">◌</div>
              <h3>Protection</h3>
              <p>
                Changes become easy to detect. Our AI monitors for tampering and
                alerts your team when document metadata shifts unexpectedly.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon slate">↗</div>
              <h3>Sharing</h3>
              <p>
                One clean link for customers and internal teams. No more messy
                attachments, just a fast and trusted billing portal.
              </p>
            </article>
          </div>
        </section>

        <section className="bento-section">
          <article className="bento-wide">
            <div className="bento-accent-line" />
            <div className="bento-widget">
              <div className="bento-widget-head">
                <span>Document control</span>
                <span>Live</span>
              </div>
              <div className="bento-widget-chart">
                <div className="chart-line" />
              </div>
              <div className="bento-widget-stats">
                <span>23%</span>
                <span>28%</span>
                <span>99%</span>
                <span>58</span>
              </div>
            </div>
            <div className="bento-copy">
              <h3>Advanced Curation</h3>
              <p>
                Fine-tune every typographic detail and verification signal to
                match your brand&apos;s editorial voice.
              </p>
            </div>
          </article>

          <article className="bento-narrow">
            <div className="bento-badge">✦</div>
            <h3>Enterprise Grade</h3>
            <p>
              The security infrastructure of a bank, wrapped in the interface of
              a refined billing product.
            </p>
            <button type="button" className="tier-button">
              View Tiers
            </button>
          </article>
        </section>

        <section className="cta-section">
          <div className="cta-card">
            <h2>Ready to redefine your billing?</h2>
            <div className="cta-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => router.push("/signup")}
              >
                Start For Free
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setPrompt(
                    "Create a modern invoice for a software studio with VAT and verification link"
                  )
                }
              >
                Schedule a Demo
              </button>
            </div>
          </div>
        </section>

        <footer className="homepage-footer">
          <div>
            <div className="footer-brand">InvoiceProof</div>
            <div className="footer-copy">
              The Digital Curator for Modern Finance.
            </div>
          </div>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security</a>
            <a href="#">Status</a>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        .homepage-shell {
          min-height: 100vh;
          background: radial-gradient(
              circle at top left,
              rgba(84, 131, 255, 0.1),
              transparent 24%
            ),
            radial-gradient(
              circle at top right,
              rgba(93, 198, 171, 0.11),
              transparent 24%
            ),
            linear-gradient(180deg, #f7f9fc 0%, #f1f4f8 100%);
          color: #111827;
          padding: 34px 22px 56px;
        }

        .hero-section,
        .editorial-section,
        .bento-section,
        .cta-section,
        .homepage-footer {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .hero-section {
          position: relative;
          overflow: hidden;
          padding: 38px 0 88px;
        }

        .hero-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .hero-aura {
          position: absolute;
          inset: auto;
          width: 420px;
          height: 420px;
          border-radius: 999px;
          filter: blur(70px);
          opacity: 0.45;
          pointer-events: none;
        }

        .hero-aura-left {
          top: -90px;
          left: -80px;
          background: rgba(104, 135, 255, 0.22);
        }

        .hero-aura-right {
          top: -60px;
          right: -80px;
          background: rgba(97, 203, 183, 0.22);
        }

        .eyebrow-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(227, 236, 255, 0.82);
          color: #2950d9;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          box-shadow: inset 0 0 0 1px rgba(41, 80, 217, 0.08);
        }

        .hero-title {
          margin: 0;
          max-width: 920px;
          color: #151823;
          font-size: clamp(42px, 7vw, 74px);
          font-weight: 900;
          line-height: 1.02;
          letter-spacing: -0.07em;
        }

        .hero-title span {
          color: #1f4fff;
        }

        .hero-copy {
          max-width: 700px;
          margin: 18px auto 0;
          color: #67758f;
          font-size: 17px;
          line-height: 1.75;
          font-weight: 500;
        }

        .prompt-card {
          width: min(860px, 100%);
          margin-top: 38px;
          padding: 18px 18px 20px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.86);
          box-shadow: 0 28px 60px rgba(21, 37, 77, 0.08);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.72);
        }

        .prompt-label {
          margin-bottom: 12px;
          text-align: left;
          color: #8b96ad;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .prompt-row {
          display: block;
        }

        .prompt-input-wrap {
          position: relative;
        }

        .prompt-input {
          width: 100%;
          min-width: 0;
          min-height: 104px;
          border: none;
          outline: none;
          border-radius: 20px;
          padding: 18px 74px 18px 18px;
          background: linear-gradient(180deg, #f7f9fd 0%, #f2f5fb 100%);
          color: #15213f;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.6;
          box-shadow: inset 0 0 0 1px rgba(19, 39, 81, 0.08);
        }

        .prompt-textarea {
          resize: none;
          overflow-y: auto;
        }

        .prompt-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .prompt-input::placeholder {
          color: #9aa5ba;
        }

        .primary-button,
        .secondary-button,
        .voice-button,
        .tier-button,
        .upload-link {
          transition: transform 160ms ease, opacity 160ms ease,
            background 160ms ease, border-color 160ms ease;
        }

        .primary-button:hover,
        .secondary-button:hover,
        .voice-button:hover,
        .tier-button:hover,
        .upload-link:hover {
          transform: translateY(-1px);
        }

        .primary-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          transform: none;
        }

        .primary-button {
          min-height: 56px;
          padding: 0 22px;
          border: none;
          border-radius: 16px;
          background: linear-gradient(
            135deg,
            #6f90ff 0%,
            #7d9cff 48%,
            #8ba8ff 100%
          );
          color: white;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.01em;
          box-shadow: 0 16px 32px rgba(84, 118, 255, 0.22);
        }

        .prompt-submit-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-width: 196px;
        }

        .button-sparkle {
          font-size: 15px;
          line-height: 1;
          transform: translateY(-1px);
        }

        .voice-button {
          position: absolute;
          right: 14px;
          bottom: 14px;
          width: 44px;
          height: 44px;
          padding: 0;
          border-radius: 14px;
          border: 1px solid rgba(73, 97, 149, 0.1);
          background: rgba(255, 255, 255, 0.92);
          color: #48618f;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 22px rgba(31, 48, 91, 0.08);
        }

        .voice-button svg {
          width: 18px;
          height: 18px;
        }

        .voice-button.is-listening {
          color: #245dff;
          background: rgba(227, 236, 255, 0.95);
          box-shadow: 0 12px 24px rgba(36, 93, 255, 0.16);
        }

        .secondary-button {
          min-height: 56px;
          padding: 0 18px;
          border-radius: 16px;
          border: 1px solid rgba(15, 32, 71, 0.09);
          background: #f7f9fc;
          color: #0f2147;
          font-size: 14px;
          font-weight: 700;
        }

        .upload-link {
          border: none;
          border-radius: 16px;
          background: linear-gradient(
            180deg,
            rgba(236, 242, 255, 0.96) 0%,
            rgba(232, 240, 255, 0.96) 100%
          );
          color: #35539a;
          font-size: 13px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          padding: 0 16px;
          min-height: 52px;
          box-shadow: inset 0 0 0 1px rgba(72, 100, 159, 0.08);
        }

        .upload-link-icon {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(89, 126, 235, 0.12);
          color: #2d57d8;
          font-size: 12px;
          font-weight: 900;
        }

        .hero-preview-shell {
          width: min(1080px, 100%);
          margin-top: 54px;
          display: grid;
          grid-template-columns: 96px minmax(0, 1fr) 96px;
          align-items: center;
          gap: 0;
        }

        .preview-rail {
          height: 84%;
          min-height: 320px;
          border-radius: 22px;
          background: linear-gradient(180deg, #1f6e73 0%, #347b7a 100%);
          box-shadow: inset 0 0 28px rgba(255, 255, 255, 0.08);
        }

        .preview-document-card {
          padding: 18px 0;
          display: flex;
          justify-content: center;
        }

        .preview-document {
          width: min(620px, 100%);
          background: linear-gradient(180deg, #ffffff 0%, #f7f7f3 100%);
          border-radius: 8px;
          box-shadow: 0 22px 44px rgba(17, 24, 39, 0.18);
          padding: 28px 28px 22px;
          text-align: left;
        }

        .preview-topbar {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .doc-brand {
          color: #153554;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .doc-sub,
        .doc-label,
        .doc-meta {
          color: #77839b;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .doc-meta {
          display: grid;
          gap: 8px;
          text-align: right;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 24px;
        }

        .doc-strong {
          margin-top: 6px;
          color: #18202f;
          font-size: 13px;
          font-weight: 800;
        }

        .status-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(34, 152, 105, 0.14);
          color: #167650;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .preview-table {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: inset 0 0 0 1px rgba(28, 54, 72, 0.08);
          background: #fcfcfa;
        }

        .preview-table-head,
        .preview-table-row {
          display: grid;
          grid-template-columns: minmax(0, 2.2fr) 0.7fr 0.9fr 0.9fr;
          gap: 10px;
          padding: 12px 14px;
          font-size: 11px;
          align-items: center;
        }

        .preview-table-head {
          background: #215e5d;
          color: #f7fbfb;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .preview-table-row {
          color: #243044;
          font-weight: 700;
          border-top: 1px solid rgba(32, 68, 92, 0.08);
        }

        .preview-summary {
          width: 220px;
          margin-left: auto;
          margin-top: 20px;
          display: grid;
          gap: 10px;
        }

        .summary-stack {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          color: #536277;
          font-size: 12px;
          font-weight: 700;
        }

        .summary-stack.strong {
          padding: 10px 12px;
          border-radius: 8px;
          background: #215e5d;
          color: white;
          font-weight: 800;
        }

        .editorial-section {
          padding: 34px 0 88px;
        }

        .section-head {
          text-align: center;
          margin-bottom: 34px;
        }

        .section-head h2,
        .cta-card h2 {
          margin: 0;
          color: #131722;
          font-size: clamp(30px, 4vw, 42px);
          font-weight: 900;
          letter-spacing: -0.05em;
        }

        .section-head p {
          max-width: 620px;
          margin: 12px auto 0;
          color: #7a869c;
          font-size: 15px;
          line-height: 1.7;
          font-weight: 500;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .feature-card {
          min-height: 218px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 20px 46px rgba(18, 36, 76, 0.06);
          padding: 22px;
          border: 1px solid rgba(255, 255, 255, 0.82);
        }

        .feature-icon {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          margin-bottom: 18px;
          font-size: 15px;
          font-weight: 900;
        }

        .feature-icon.blue {
          background: rgba(46, 92, 255, 0.11);
          color: #245dff;
        }

        .feature-icon.violet {
          background: rgba(127, 86, 255, 0.12);
          color: #7e50ff;
        }

        .feature-icon.slate {
          background: rgba(89, 103, 138, 0.12);
          color: #536277;
        }

        .feature-card h3,
        .bento-wide h3,
        .bento-narrow h3 {
          margin: 0 0 10px;
          color: #131722;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .feature-card p,
        .bento-wide p,
        .bento-narrow p,
        .footer-copy {
          margin: 0;
          color: #71809a;
          font-size: 14px;
          line-height: 1.72;
          font-weight: 500;
        }

        .bento-section {
          display: grid;
          grid-template-columns: minmax(0, 1.75fr) minmax(280px, 0.9fr);
          gap: 18px;
          padding-bottom: 76px;
        }

        .bento-wide,
        .bento-narrow {
          border-radius: 24px;
          overflow: hidden;
        }

        .bento-wide {
          position: relative;
          min-height: 340px;
          padding: 24px;
          background: radial-gradient(
              circle at top center,
              rgba(91, 216, 201, 0.16),
              transparent 20%
            ),
            linear-gradient(180deg, #071019 0%, #0e1824 100%);
          box-shadow: 0 28px 50px rgba(7, 15, 27, 0.18);
        }

        .bento-accent-line {
          position: absolute;
          top: 12px;
          left: 48px;
          width: 120px;
          height: 3px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            rgba(103, 234, 214, 0.2),
            rgba(98, 163, 255, 0.9)
          );
        }

        .bento-widget {
          width: min(430px, 100%);
          margin: 42px auto 0;
          border-radius: 4px;
          background: linear-gradient(
            180deg,
            rgba(202, 231, 255, 0.12),
            rgba(202, 231, 255, 0.04)
          );
          border: 1px solid rgba(169, 199, 231, 0.25);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.16);
          padding: 16px 14px 14px;
        }

        .bento-widget-head,
        .bento-widget-stats {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: rgba(234, 245, 255, 0.86);
          font-size: 11px;
          font-weight: 700;
        }

        .bento-widget-chart {
          height: 100px;
          margin: 18px 0 16px;
          border-radius: 4px;
          background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.06),
              rgba(255, 255, 255, 0.01)
            ),
            repeating-linear-gradient(
              to top,
              rgba(180, 214, 255, 0.08),
              rgba(180, 214, 255, 0.08) 1px,
              transparent 1px,
              transparent 24px
            );
          position: relative;
          overflow: hidden;
        }

        .chart-line {
          position: absolute;
          left: 10px;
          right: 10px;
          top: 52px;
          height: 48px;
          background: linear-gradient(
            180deg,
            rgba(90, 222, 205, 0.38),
            rgba(90, 222, 205, 0.02)
          );
          clip-path: polygon(
            0 72%,
            20% 58%,
            35% 62%,
            48% 35%,
            62% 40%,
            76% 30%,
            100% 0,
            100% 100%,
            0 100%
          );
          border-bottom: 2px solid #8ce5d9;
        }

        .bento-widget-stats span {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(187, 214, 240, 0.16);
        }

        .bento-copy {
          position: absolute;
          left: 24px;
          right: 24px;
          bottom: 24px;
          max-width: 420px;
        }

        .bento-copy h3,
        .bento-copy p {
          color: white;
        }

        .bento-copy p {
          color: rgba(240, 245, 255, 0.78);
        }

        .bento-narrow {
          background: linear-gradient(180deg, #1247c9 0%, #1f4fff 100%);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 28px;
          text-align: center;
          box-shadow: 0 26px 48px rgba(22, 77, 216, 0.2);
        }

        .bento-badge {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          margin-bottom: 18px;
          background: rgba(255, 255, 255, 0.12);
          font-size: 18px;
          font-weight: 900;
        }

        .bento-narrow h3,
        .bento-narrow p {
          color: white;
        }

        .bento-narrow p {
          max-width: 210px;
          color: rgba(239, 245, 255, 0.88);
        }

        .tier-button {
          margin-top: 22px;
          height: 44px;
          padding: 0 18px;
          border: none;
          border-radius: 14px;
          background: white;
          color: #1247c9;
          font-size: 13px;
          font-weight: 800;
        }

        .cta-section {
          padding-bottom: 48px;
        }

        .cta-card {
          border-radius: 28px;
          padding: 44px 24px;
          text-align: center;
          background: linear-gradient(
            90deg,
            rgba(241, 223, 255, 0.92) 0%,
            rgba(237, 246, 255, 0.96) 100%
          );
          box-shadow: 0 20px 44px rgba(24, 37, 61, 0.06);
        }

        .cta-actions {
          display: inline-flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          margin-top: 22px;
        }

        .homepage-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 18px 2px 0;
          border-top: 1px solid rgba(16, 27, 54, 0.08);
        }

        .footer-brand {
          color: #192132;
          font-size: 14px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
        }

        .footer-links a {
          color: #7c879d;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
        }

        .submit-overlay {
          position: fixed;
          inset: 0;
          z-index: 80;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(10, 18, 34, 0.36);
          backdrop-filter: blur(10px);
        }

        .submit-overlay-card {
          width: min(420px, 100%);
          border-radius: 28px;
          padding: 22px;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 24px 60px rgba(16, 27, 54, 0.18);
        }

        .submit-overlay-inner {
          display: grid;
          justify-items: center;
          text-align: center;
          gap: 12px;
        }

        .submit-overlay-inner h3 {
          margin: 0;
          color: #111827;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .submit-overlay-inner p {
          margin: 0;
          color: #66748d;
          font-size: 14px;
          line-height: 1.65;
          max-width: 300px;
        }

        @media (max-width: 1024px) {
          .hero-preview-shell {
            grid-template-columns: 64px minmax(0, 1fr) 64px;
          }

          .feature-grid,
          .bento-section {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .homepage-shell {
            padding: 20px 14px 42px;
          }

          .hero-section {
            padding-top: 18px;
            padding-bottom: 58px;
          }

          .prompt-card {
            padding: 16px;
          }

          .prompt-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .primary-button,
          .secondary-button,
          .upload-link,
          .prompt-submit-button {
            width: 100%;
          }

          .hero-preview-shell {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .preview-rail {
            display: none;
          }

          .preview-document {
            padding: 18px;
          }

          .preview-topbar,
          .preview-grid {
            grid-template-columns: 1fr;
            display: grid;
          }

          .preview-topbar {
            gap: 12px;
          }

          .doc-meta {
            text-align: left;
          }

          .preview-table-head,
          .preview-table-row {
            grid-template-columns: minmax(0, 1.4fr) 0.7fr 0.8fr 0.8fr;
            font-size: 10px;
          }

          .preview-summary {
            width: 100%;
          }

          .homepage-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}

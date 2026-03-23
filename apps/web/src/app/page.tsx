'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '../components/ui/spinner';
import { useToast } from '../components/ui/toast-provider';
import { savePendingInvoiceDraft } from '../lib/invoice-draft-transfer';

type BusyState = null | 'ai' | 'upload';

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState<BusyState>(null);
  const [isListening, setIsListening] = useState(false);

  const hasVoiceInput = useMemo(() => Boolean(getSpeechRecognitionCtor()), []);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function closeAiModal() {
    recognitionRef.current?.stop();
    setIsListening(false);
    setAiOpen(false);
  }

  async function createFromAi() {
    const normalizedPrompt = prompt.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
    if (normalizedPrompt.length < 12) {
      showToast({
        tone: 'error',
        title: 'Add more detail',
        description: 'Paste messy notes, a short conversation, or describe the invoice first.',
      });
      return;
    }

    setBusy('ai');

    try {
      const response = await fetch(`${API_BASE}/invoices/ai-canvas-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: normalizedPrompt }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message || 'Could not extract invoice data.');
      }

      savePendingInvoiceDraft({
        type: 'ai-canvas',
        payload: {
          ...json.data,
          prompt: normalizedPrompt,
        },
      });

      closeAiModal();
      router.push('/invoices/new');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not extract invoice data.';
      showToast({ tone: 'error', title: 'AI extraction failed', description: message });
    } finally {
      setBusy(null);
    }
  }

  async function handlePdfUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast({ tone: 'error', title: 'Invalid file', description: 'Please choose a PDF invoice.' });
      event.target.value = '';
      return;
    }

    setBusy('upload');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/invoices/upload-detect`, {
        method: 'POST',
        body: formData,
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message || 'Could not read the uploaded PDF.');
      }

      savePendingInvoiceDraft({
        type: 'pdf-detect',
        payload: json.data,
      });

      showToast({ tone: 'success', title: 'PDF imported', description: 'Opening the invoice canvas with extracted data.' });
      router.push('/invoices/new');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not read the uploaded PDF.';
      showToast({ tone: 'error', title: 'Upload failed', description: message });
    } finally {
      event.target.value = '';
      setBusy(null);
    }
  }

  function toggleVoiceInput() {
    const Recognition = getSpeechRecognitionCtor();
    if (!Recognition) {
      showToast({ tone: 'info', title: 'Voice input unavailable', description: 'This browser does not support built-in speech recognition.' });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result?.[0]?.transcript || '')
        .join(' ')
        .trim();
      setPrompt(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      showToast({ tone: 'error', title: 'Voice input stopped', description: 'Please try again or type the notes manually.' });
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
      {aiOpen ? (
        <div className="ai-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="home-ai-title">
          <div className="ai-modal-card home-ai-modal-card">
            <div className="ai-modal-head">
              <div className="page-stack" style={{ gap: 8 }}>
                <span className="mini-chip is-accent">AI invoice intake</span>
                <h2 id="home-ai-title" style={{ margin: 0 }}>Create invoice with AI</h2>
                <p className="page-subtitle" style={{ margin: 0 }}>
                  Paste messy notes, client conversation, email text, or use voice input. We will extract the invoice data and open the canvas ready to edit.
                </p>
              </div>
              <button type="button" className="btn btn-secondary" onClick={closeAiModal}>Close</button>
            </div>

            <label className="field-group">
              <span className="field-label">Prompt, conversation, or messy notes</span>
              <textarea
                className="input-shell ai-modal-textarea"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Example: Client is Acme Labs. Website redesign and 2 landing pages. Total 4500 USD. Add 18% VAT. Invoice date today. Due in 7 days."
                maxLength={4000}
                autoFocus
              />
            </label>

            <div className="quick-row">
              <span className="mini-chip">Paste email or WhatsApp text</span>
              <span className="mini-chip">Messy details are okay</span>
              {hasVoiceInput ? <span className="mini-chip">Voice input supported</span> : null}
            </div>

            <div className="ai-modal-actions">
              {hasVoiceInput ? (
                <button type="button" className="btn btn-secondary" onClick={toggleVoiceInput}>
                  {isListening ? 'Stop voice input' : 'Use voice input'}
                </button>
              ) : null}
              <button type="button" className="btn btn-primary" onClick={createFromAi} disabled={busy === 'ai' || prompt.trim().length < 12}>
                {busy === 'ai' ? 'Extracting...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {busy ? (
        <div className="submit-overlay" aria-live="polite" aria-busy="true">
          <div className="submit-overlay-card">
            <div className="submit-overlay-inner">
              <Spinner size="xl" tone="brand" />
              <h3>{busy === 'ai' ? 'Extracting invoice details' : 'Reading uploaded PDF'}</h3>
              <p>
                {busy === 'ai'
                  ? 'Turning your messy notes into a clean editable invoice canvas.'
                  : 'Scanning the PDF and preparing the invoice canvas with detected data.'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <main className="container page-shell page-stack">
        <section className="glass-card card-pad-xl premium-hero">
          <div className="page-stack" style={{ gap: 26 }}>
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              Trusted invoice verification
            </div>

            <div className="page-stack" style={{ gap: 14, maxWidth: 760 }}>
              <h1 className="hero-title">Create. Seal. Verify.</h1>
              <p className="hero-copy" style={{ margin: 0 }}>
                Built for businesses that want every invoice to feel official, protected, and easy to trust.
              </p>
            </div>

            <div className="hero-actions">
              <button type="button" className="btn btn-primary" onClick={() => setAiOpen(true)}>
                Create invoice with AI
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => uploadInputRef.current?.click()}>
                Upload PDF
              </button>
              <input ref={uploadInputRef} type="file" accept="application/pdf,.pdf" hidden onChange={handlePdfUpload} />
            </div>

            <div className="mini-grid mini-grid-premium">
              <div className="mini-card is-accent">
                <div className="metric-label">Trust</div>
                <div className="metric-value">A proof page people can understand</div>
              </div>
              <div className="mini-card is-accent">
                <div className="metric-label">Protection</div>
                <div className="metric-value">Changes become easy to detect</div>
              </div>
              <div className="mini-card is-accent">
                <div className="metric-label">Sharing</div>
                <div className="metric-value">One clean link for customers and teams</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style jsx global>{`
        .ai-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.44);
          backdrop-filter: blur(10px);
        }
        .ai-modal-card {
          width: min(760px, 100%);
          border-radius: 30px;
          padding: 24px;
          display: grid;
          gap: 18px;
          border: 1px solid rgba(101,79,230,.14);
          background: linear-gradient(180deg, rgba(255,255,255,.98), rgba(247,245,255,.96));
          box-shadow: 0 30px 80px rgba(15,23,42,.24);
        }
        .home-ai-modal-card {
          max-width: 760px;
        }
        .ai-modal-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .ai-modal-textarea {
          min-height: 180px;
          resize: vertical;
          line-height: 1.6;
        }
        .ai-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }
        @media (max-width: 900px) {
          .ai-modal-overlay {
            padding: 12px;
          }
          .ai-modal-card,
          .home-ai-modal-card {
            padding: 18px;
          }
          .ai-modal-head {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </>
  );
}

import { NewInvoiceForm } from './new-invoice-form';

export default function NewInvoicePage() {
  return (
    <main className="page-shell" style={{ paddingInline: 16 }}>
      <section style={{ maxWidth: 'min(1680px, 100%)', margin: '0 auto', width: '100%' }}>
        <NewInvoiceForm />
      </section>
    </main>
  );
}

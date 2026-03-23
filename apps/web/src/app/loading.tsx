import { Spinner } from '../components/ui/spinner';

export default function Loading() {
  return (
    <main className="container loading-screen">
      <div className="glass-card card-pad-lg loading-card">
        <div className="loading-visual">
          <Spinner size="xl" tone="brand" />
        </div>
        <h2 style={{ margin: '0 0 8px' }}>Opening proof page...</h2>
        <p>Please wait</p>
      </div>
    </main>
  );
}

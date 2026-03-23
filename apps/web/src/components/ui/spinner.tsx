'use client';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'light' | 'brand' | 'muted';
};

export function Spinner({ size = 'md', tone = 'brand' }: SpinnerProps) {
  return (
    <span aria-hidden="true" className={`spinner-wrap spinner-${size} spinner-${tone}`}>
      <span className="spinner-glow" />
      <span className="spinner-ring" />
      <span className="spinner-core" />
    </span>
  );
}

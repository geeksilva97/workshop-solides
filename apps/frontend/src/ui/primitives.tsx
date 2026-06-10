import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold text-brand">
      <span className="grid size-8 place-items-center rounded-full bg-brand text-white">TR</span>
      {!compact && <span className="text-lg">Tom Ranks</span>}
    </span>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60';
  const styles =
    variant === 'primary'
      ? 'bg-brand text-white hover:bg-brand-bright'
      : 'bg-transparent text-brand hover:bg-brand/5';
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[14px] border border-black/5 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-navy">{label}</span>
      <input
        className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        {...rest}
      />
    </label>
  );
}

const SIGNAL: Record<string, string> = {
  ok: 'bg-ok/10 text-ok',
  warn: 'bg-warn/10 text-warn',
  bad: 'bg-bad/10 text-bad',
  alta: 'bg-bad/10 text-bad',
  media: 'bg-warn/10 text-warn',
  baixa: 'bg-ok/10 text-ok',
};

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${SIGNAL[tone] ?? 'bg-black/5 text-muted'}`}>
      {children}
    </span>
  );
}

import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../ui/primitives.tsx';
import { clearSession, getSession } from '../lib/session.ts';

/** SaaS shell for protected pages: sidebar nav + topbar with company + sign out. */
export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const session = getSession();

  function signOut() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="grid min-h-full grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-6 border-r border-black/5 bg-white p-5">
        <Logo />
        <nav className="flex flex-col gap-1 text-sm">
          <Link className="rounded-lg px-3 py-2 font-medium text-navy hover:bg-brand/5" to="/">
            Seus benchmarks
          </Link>
          <Link
            className="rounded-lg px-3 py-2 font-medium text-navy hover:bg-brand/5"
            to="/benchmark/novo"
          >
            Novo benchmark
          </Link>
        </nav>
        <div className="mt-auto text-xs text-muted">Tom Ranks - People Analytics</div>
      </aside>

      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b border-black/5 bg-white px-8 py-4">
          <span className="text-sm text-muted">{session?.empresa ?? 'Solípse Tecnologia'}</span>
          <button onClick={signOut} className="text-sm font-medium text-brand hover:underline">
            Sair
          </button>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}

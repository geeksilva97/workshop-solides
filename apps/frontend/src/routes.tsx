import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getSession } from './lib/session.ts';
import { SignIn } from './pages/SignIn.tsx';
import { SeusBenchmarks } from './pages/SeusBenchmarks.tsx';
import { NovoBenchmark } from './pages/NovoBenchmark.tsx';
import { RodandoBenchmark } from './pages/RodandoBenchmark.tsx';
import { ListaCohort } from './pages/ListaCohort.tsx';
import { Dashboard } from './pages/Dashboard.tsx';

function Protected({ children }: { children: ReactNode }) {
  return getSession() ? <>{children}</> : <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<SignIn />} />
      <Route path="/" element={<Protected><SeusBenchmarks /></Protected>} />
      <Route path="/benchmark/novo" element={<Protected><NovoBenchmark /></Protected>} />
      <Route path="/benchmark/:id/run" element={<Protected><RodandoBenchmark /></Protected>} />
      <Route path="/benchmark/:id/cohort" element={<Protected><ListaCohort /></Protected>} />
      <Route path="/benchmark/:id" element={<Protected><Dashboard /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

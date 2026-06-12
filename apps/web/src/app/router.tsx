import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { RequireAuth } from '../lib/auth'
import { SignInPage } from '../features/auth/SignInPage'
import { SignUpPage } from '../features/auth/SignUpPage'
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage'
import { BenchmarkListPage } from '../features/benchmarks/BenchmarkListPage'
import { NewBenchmarkPage } from '../features/benchmarks/NewBenchmarkPage'
import { RunningBenchmarkPage } from '../features/benchmarks/RunningBenchmarkPage'
import { BenchmarkResultLayout } from '../features/benchmarks/BenchmarkResultLayout'
import { ResultsDashboardPage } from '../features/benchmarks/ResultsDashboardPage'
import { CohortPage } from '../features/benchmarks/CohortPage'
import { DiagnosisPage } from '../features/benchmarks/DiagnosisPage'
import { TrendsPage } from '../features/trends/TrendsPage'
import { SettingsPage } from '../features/settings/SettingsPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/benchmarks" replace /> },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <SignInPage /> },
      { path: '/signup', element: <SignUpPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: '/benchmarks', element: <BenchmarkListPage /> },
      { path: '/benchmarks/new', element: <NewBenchmarkPage /> },
      { path: '/benchmarks/:id/running', element: <RunningBenchmarkPage /> },
      {
        path: '/benchmarks/:id',
        element: <BenchmarkResultLayout />,
        children: [
          { index: true, element: <ResultsDashboardPage /> },
          { path: 'cohort', element: <CohortPage /> },
          { path: 'diagnosis', element: <DiagnosisPage /> },
        ],
      },
      { path: '/trends', element: <TrendsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/benchmarks" replace /> },
])

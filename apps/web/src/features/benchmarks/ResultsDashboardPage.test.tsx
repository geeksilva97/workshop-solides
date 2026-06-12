import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import { ResultsDashboardPage } from './ResultsDashboardPage'

describe('ResultsDashboardPage', () => {
  it('renders the four KPI cards for a benchmark', async () => {
    renderWithProviders(<ResultsDashboardPage />, {
      initialEntries: ['/benchmarks/bm-001'],
      path: '/benchmarks/:id',
    })

    expect(await screen.findByText('Turnover voluntário')).toBeInTheDocument()
    expect(screen.getByText('Absenteísmo')).toBeInTheDocument()
    expect(screen.getByText('eNPS')).toBeInTheDocument()
    expect(screen.getByText(/28\.4/)).toBeInTheDocument()
  })
})

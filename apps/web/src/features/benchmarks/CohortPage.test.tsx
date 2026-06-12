import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import { CohortPage } from './CohortPage'

describe('CohortPage', () => {
  it('renders the cohort table and average score', async () => {
    renderWithProviders(<CohortPage />, {
      initialEntries: ['/benchmarks/bm-001'],
      path: '/benchmarks/:id',
    })

    expect(await screen.findByText('Empresa A11')).toBeInTheDocument()
    expect(screen.getByText('0.86')).toBeInTheDocument()
    expect(screen.getByText(/k-anonimato ≥ 5/)).toBeInTheDocument()
  })
})

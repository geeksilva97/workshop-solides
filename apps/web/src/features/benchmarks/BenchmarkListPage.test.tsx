import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import { BenchmarkListPage } from './BenchmarkListPage'

describe('BenchmarkListPage', () => {
  it('renders the seeded benchmark cards', async () => {
    renderWithProviders(<BenchmarkListPage />)

    expect(
      await screen.findByText('Problema de retenção, não de atração.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Operação saudável, sem KPIs críticos.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /novo benchmark/i }),
    ).toBeInTheDocument()
  })
})

import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import { TrendsPage } from './TrendsPage'

describe('TrendsPage', () => {
  it('renders trend cards for the latest benchmark', async () => {
    renderWithProviders(<TrendsPage />)

    expect(
      screen.getByRole('heading', { name: 'Tendências' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Turnover voluntário')).toBeInTheDocument()
    expect(screen.getByText(/Dez 2025 → Mar 2026 → Jun 2026/)).toBeInTheDocument()
  })
})

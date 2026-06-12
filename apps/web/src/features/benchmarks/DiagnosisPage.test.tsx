import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import { DiagnosisPage } from './DiagnosisPage'

describe('DiagnosisPage', () => {
  it('renders the narrative diagnosis and hypotheses', async () => {
    renderWithProviders(<DiagnosisPage />, {
      initialEntries: ['/benchmarks/bm-001'],
      path: '/benchmarks/:id',
    })

    expect(
      await screen.findByText('Problema de retenção, não de atração.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Onboarding e primeiros 6 meses'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /agendar reunião de ação/i }),
    ).toBeInTheDocument()
  })
})

import { describe, expect, it } from 'vitest'
import { Route } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/renderWithProviders'
import { NewBenchmarkPage } from './NewBenchmarkPage'

describe('NewBenchmarkPage', () => {
  it('submits the default form and navigates to the running screen', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NewBenchmarkPage />, {
      initialEntries: ['/benchmarks/new'],
      path: '/benchmarks/new',
      extraRoutes: (
        <Route
          path="/benchmarks/:id/running"
          element={<div>Rodando o benchmark</div>}
        />
      ),
    })

    await user.click(screen.getByRole('button', { name: /rodar benchmark/i }))

    expect(await screen.findByText('Rodando o benchmark')).toBeInTheDocument()
  })
})

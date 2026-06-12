import { describe, expect, it } from 'vitest'
import { Route } from 'react-router-dom'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SignInPage } from './SignInPage'

function renderSignIn() {
  return renderWithProviders(<SignInPage />, {
    initialEntries: ['/login'],
    path: '/login',
    extraRoutes: (
      <Route path="/benchmarks" element={<div>Lista de benchmarks</div>} />
    ),
  })
}

describe('SignInPage', () => {
  it('validates the email field', async () => {
    const user = userEvent.setup()
    renderSignIn()

    await user.type(screen.getByLabelText('E-mail corporativo'), 'nao-e-email')
    await user.type(screen.getByLabelText('Senha'), '123456')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument()
  })

  it('signs in and navigates to the benchmarks list', async () => {
    const user = userEvent.setup()
    renderSignIn()

    await user.type(screen.getByLabelText('E-mail corporativo'), 'ana@empresa.com')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText('Lista de benchmarks')).toBeInTheDocument()
  })
})

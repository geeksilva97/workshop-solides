import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { SignIn } from './SignIn.tsx';
import { renderWithProviders } from '../test/utils.tsx';

describe('SignIn', () => {
  it('shows the brand, welcome heading and the sign-in button', () => {
    renderWithProviders(<SignIn />, '/login');
    expect(screen.getByRole('heading', { name: /bem-vindo/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });
});

import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { SeusBenchmarks } from './SeusBenchmarks.tsx';
import { renderWithProviders } from '../test/utils.tsx';

describe('SeusBenchmarks', () => {
  it('lists the benchmarks returned by the API', async () => {
    renderWithProviders(<SeusBenchmarks />);
    expect(screen.getByRole('heading', { name: /seus benchmarks/i })).toBeInTheDocument();
    // data loads via TanStack Query against the stub client
    expect(await screen.findByText(/Solípse Tecnologia/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /novo benchmark/i })).toBeInTheDocument();
  });
});

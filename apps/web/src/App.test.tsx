import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { HelloResponse } from '@workshop/shared'
import App from './App'

describe('App', () => {
  it('renders the message from the API', async () => {
    const body: HelloResponse = { message: 'Hello from Fastify!' }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: () => Promise.resolve(body) }),
    )

    render(<App />)

    expect(await screen.findByText('Hello from Fastify!')).toBeInTheDocument()
  })
})

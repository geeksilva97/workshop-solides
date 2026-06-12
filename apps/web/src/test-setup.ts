import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'
import { resetStore } from './mocks/store'

// Node 25 ships an experimental global localStorage that isn't functional here
// and shadows jsdom's. Install a simple in-memory Storage so app code that uses
// window.localStorage works under test.
class MemoryStorage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear() {
    this.store.clear()
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value))
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new MemoryStorage() as unknown as Storage,
  configurable: true,
  writable: true,
})

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  resetStore()
  window.localStorage.clear()
})
afterAll(() => server.close())

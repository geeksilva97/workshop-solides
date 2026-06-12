import { Outlet } from 'react-router-dom'
import { TopNav } from '../components/TopNav'

export function AppLayout() {
  return (
    <div className="min-h-full">
      <TopNav />
      <main className="mx-auto max-w-[1280px] px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}

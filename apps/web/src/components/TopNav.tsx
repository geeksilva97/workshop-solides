import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { cn } from '../lib/cn'
import { CompanySelector } from './CompanySelector'
import { Logo } from './ui/Logo'
import {
  BarChartIcon,
  LogoutIcon,
  SettingsIcon,
  TrendUpIcon,
} from './ui/icons'

const NAV_ITEMS = [
  { to: '/benchmarks', label: 'Benchmarks', Icon: BarChartIcon },
  { to: '/trends', label: 'Tendências', Icon: TrendUpIcon },
  { to: '/settings', label: 'Configurações', Icon: SettingsIcon },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-semibold transition-colors',
    isActive ? 'bg-primary-tint text-primary' : 'text-body hover:text-heading',
  )
}

export function TopNav() {
  const { session, signOut } = useAuth()
  const company = session?.user.company ?? 'Solides Run'

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                <Icon className="size-[18px]" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <CompanySelector company={company} />
          <button
            type="button"
            onClick={signOut}
            aria-label="Sair"
            className="flex size-9 items-center justify-center rounded-btn text-body hover:bg-line/60 hover:text-heading"
          >
            <LogoutIcon className="size-[18px]" />
          </button>
        </div>
      </div>
    </header>
  )
}

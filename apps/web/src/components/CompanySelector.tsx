import { ChevronDownIcon } from './ui/icons'

interface CompanySelectorProps {
  company: string
}

/** Read-only company switcher placeholder (single tenant in this demo). */
export function CompanySelector({ company }: CompanySelectorProps) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-btn border border-line bg-card px-3 py-2 text-sm font-semibold text-heading hover:bg-surface"
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-primary-tint text-[10px] font-bold text-primary">
        {company.slice(0, 2).toUpperCase()}
      </span>
      {company}
      <ChevronDownIcon className="text-body" />
    </button>
  )
}

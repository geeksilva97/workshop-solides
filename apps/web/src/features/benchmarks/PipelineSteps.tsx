import type { PipelineStep } from '@workshop/shared'
import { cn } from '../../lib/cn'
import { Spinner } from '../../components/ui/Spinner'
import { CheckIcon } from '../../components/ui/icons'

function StepIcon({ status }: { status: PipelineStep['status'] }) {
  if (status === 'done') {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-success-tint text-success">
        <CheckIcon className="size-4" />
      </span>
    )
  }
  if (status === 'active') {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-primary-tint">
        <Spinner className="size-4" />
      </span>
    )
  }
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-line">
      <span className="size-2 rounded-full bg-body/40" />
    </span>
  )
}

export function PipelineSteps({ steps }: { steps: PipelineStep[] }) {
  return (
    <ol className="flex flex-col gap-1">
      {steps.map((step) => (
        <li
          key={step.stage}
          className={cn(
            'flex items-center gap-3 rounded-btn px-3 py-2.5',
            step.status === 'active' ? 'bg-surface' : '',
          )}
        >
          <StepIcon status={step.status} />
          <div className="min-w-0">
            <p
              className={cn(
                'text-sm font-semibold',
                step.status === 'pending' ? 'text-body' : 'text-heading',
              )}
            >
              {step.label}
            </p>
            <p className="truncate text-xs text-body">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

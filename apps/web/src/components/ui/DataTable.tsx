import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T, index: number) => string
}

const ALIGN = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const

export function DataTable<T>({ columns, rows, getRowKey }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((col, i) => (
              <th
                key={i}
                className={cn(
                  'px-4 py-3 text-xs font-semibold tracking-wide text-heading',
                  ALIGN[col.align ?? 'left'],
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={getRowKey(row, rowIndex)}
              className="border-b border-line/70 last:border-0 hover:bg-surface"
            >
              {columns.map((col, i) => (
                <td
                  key={i}
                  className={cn(
                    'px-4 py-3 text-heading',
                    ALIGN[col.align ?? 'left'],
                    col.className,
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

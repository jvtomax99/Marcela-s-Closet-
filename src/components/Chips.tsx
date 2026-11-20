import type { ReactNode } from 'react'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="mt-6">
      <legend className="mb-2.5 text-eyebrow uppercase text-muted">{label}</legend>
      {children}
    </fieldset>
  )
}

interface ChipProps {
  selected: boolean
  onClick: () => void
  children: ReactNode
}

function Chip({ selected, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${
        selected ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface/60 text-ink hover:border-muted'
      }`}
    >
      {children}
    </button>
  )
}

interface PickerProps<T extends string | number> {
  options: readonly T[]
  labels: Record<T, string>
}

export function PickOne<T extends string | number>({
  options,
  labels,
  value,
  onChange,
}: PickerProps<T> & { value: T | null; onChange: (value: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Chip key={option} selected={option === value} onClick={() => onChange(option)}>
          {labels[option]}
        </Chip>
      ))}
    </div>
  )
}

export function PickMany<T extends string | number>({
  options,
  labels,
  values,
  onChange,
}: PickerProps<T> & { values: T[]; onChange: (values: T[]) => void }) {
  const toggle = (option: T) =>
    onChange(values.includes(option) ? values.filter((value) => value !== option) : [...values, option])

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Chip key={option} selected={values.includes(option)} onClick={() => toggle(option)}>
          {labels[option]}
        </Chip>
      ))}
    </div>
  )
}

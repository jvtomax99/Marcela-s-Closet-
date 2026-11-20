import { COLOR_SWATCHES } from '../lib/labels'
import { COLORS, type ColorName } from '../types'

interface ColorPickerProps {
  values: ColorName[]
  onChange: (values: ColorName[]) => void
}

/** The first color tapped is the main one, which is the one color matching uses. */
export function ColorPicker({ values, onChange }: ColorPickerProps) {
  const toggle = (color: ColorName) =>
    onChange(values.includes(color) ? values.filter((value) => value !== color) : [...values, color])

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {COLORS.map((color) => {
          const selected = values.includes(color)
          return (
            <button
              key={color}
              type="button"
              title={color}
              aria-label={color}
              aria-pressed={selected}
              onClick={() => toggle(color)}
              style={{ backgroundColor: COLOR_SWATCHES[color] }}
              className={`size-9 rounded-full border border-muted/30 ${
                selected ? 'ring-2 ring-ink ring-offset-2 ring-offset-canvas' : ''
              }`}
            />
          )
        })}
      </div>
      <p className="mt-3 min-h-5 text-sm text-muted">
        {values.length === 0
          ? 'Tap the main color first, then any others.'
          : `Main: ${values[0]}${values.length > 1 ? ` · also ${values.slice(1).join(', ')}` : ''}`}
      </p>
    </>
  )
}

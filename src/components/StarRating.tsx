interface StarRatingProps {
  value: number
  onChange: (rating: number) => void
}

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div role="group" aria-label="Rating" className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
          aria-pressed={star === value}
          // Tapping the current rating clears it.
          onClick={() => onChange(star === value ? 0 : star)}
          className={`px-1 py-2 text-xl leading-none transition-colors ${
            star <= value ? 'text-accent' : 'text-muted/30 hover:text-muted'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

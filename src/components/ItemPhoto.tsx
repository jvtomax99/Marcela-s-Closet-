import { photoUrl } from '../lib/image'
import type { ClothingItem } from '../types'

/** One clothing photo, always cropped the same way so the closet looks consistent. */
export function ItemPhoto({ item, className = '' }: { item: ClothingItem; className?: string }) {
  return (
    <img
      src={photoUrl(item.id, item.photo)}
      alt={item.name}
      draggable={false}
      className={`h-full w-full object-cover ${className}`}
    />
  )
}

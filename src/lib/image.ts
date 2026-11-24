const MAX_EDGE = 1200
const JPEG_QUALITY = 0.85

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('unreadable'))
    image.src = url
  })
}

/** The part of the photo she framed, in the photo's own pixels. It may reach past the edges. */
export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * The shape every piece is shown in (cards, prints on the board): 3 wide by 4 tall. Framing a
 * photo to it means what she sees in the framer is exactly what every card shows.
 */
export const PIECE_ASPECT = 3 / 4

/**
 * What to draw for a framed photo: the canvas size (the framed part, shrunk to `maxEdge`), and
 * which part of the photo goes where. Zoomed out past the photo's edges, the frame reaches
 * outside it: only the part inside the photo is drawn, the rest stays the fill color.
 * Pure, so it can be tested.
 */
export function cropPlan(area: CropArea, natural: { width: number; height: number }, maxEdge = MAX_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(area.width, area.height))
  const width = Math.max(1, Math.round(area.width * scale))
  const height = Math.max(1, Math.round(area.height * scale))
  const left = Math.max(0, area.x)
  const top = Math.max(0, area.y)
  const right = Math.min(natural.width, area.x + area.width)
  const bottom = Math.min(natural.height, area.y + area.height)
  const source =
    right > left && bottom > top ? { x: left, y: top, width: right - left, height: bottom - top } : null
  const target = source && {
    x: (source.x - area.x) * scale,
    y: (source.y - area.y) * scale,
    width: source.width * scale,
    height: source.height * scale,
  }
  return { width, height, source, target }
}

/** Behind a photo framed wider than itself: `--photo-fill` in `index.css` (the light sand). */
const fillColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--photo-fill').trim() || '#f3e4d8'

/**
 * Shrinks a phone photo before storing it, after cutting out the part she framed (if any).
 * A 12-megapixel shot is far bigger than the screen needs, and a closet of a few hundred of
 * them would fill the device. Cutting from the full-size original keeps a top taken from a
 * full-length photo sharp.
 */
export async function preparePhoto(file: Blob, area?: CropArea): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const natural = { width: image.naturalWidth, height: image.naturalHeight }
    const plan = cropPlan(area ?? { x: 0, y: 0, ...natural }, natural)
    const canvas = document.createElement('canvas')
    canvas.width = plan.width
    canvas.height = plan.height
    const context = canvas.getContext('2d')
    // PNG keeps the transparency of a photo that already had its background removed.
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    if (context) {
      if (type === 'image/jpeg') {
        context.fillStyle = fillColor()
        context.fillRect(0, 0, plan.width, plan.height)
      }
      if (plan.source && plan.target) {
        const { source, target } = plan
        context.drawImage(image, source.x, source.y, source.width, source.height, target.x, target.y, target.width, target.height)
      }
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, JPEG_QUALITY))
    if (!blob) throw new Error('unreadable')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

const urls = new Map<string, string>()

/**
 * The database hands back a new Blob on every read. Keeping one URL per photo
 * stops images from flickering each time something in the closet changes.
 */
export function photoUrl(key: string, photo: Blob): string {
  const cacheKey = `${key}:${photo.size}`
  let url = urls.get(cacheKey)
  if (!url) {
    url = URL.createObjectURL(photo)
    urls.set(cacheKey, url)
  }
  return url
}

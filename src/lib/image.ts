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

/**
 * Shrinks a phone photo before storing it. A 12-megapixel shot is far bigger than
 * the screen needs, and a closet of a few hundred of them would fill the device.
 */
export async function preparePhoto(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.naturalWidth * scale)
    canvas.height = Math.round(image.naturalHeight * scale)
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)

    // PNG keeps the transparency of a photo that already had its background removed.
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
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

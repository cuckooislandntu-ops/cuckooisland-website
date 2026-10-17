import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { createPortal } from 'react-dom'

// Tap a photo in the article body to see it large; Esc or tap again to close
export function useLightbox() {
  const [shot, setShot] = useState<{ src: string; cap: string } | null>(null)
  useEffect(() => {
    if (!shot) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setShot(null) }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [shot])
  const open = (e: MouseEvent<HTMLDivElement>) => {
    const img = (e.target as HTMLElement).closest('img')
    if (!img) return
    const fig = img.closest('figure')
    setShot({ src: img.currentSrc || img.src, cap: fig?.querySelector('figcaption')?.textContent || img.alt || '' })
  }
  const view = shot && createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="放大照片" onClick={() => setShot(null)}>
      <figure><img src={shot.src} alt={shot.cap} />{shot.cap && <figcaption>{shot.cap}</figcaption>}</figure>
      <button type="button" aria-label="關閉">×</button>
    </div>,
    document.body,
  )
  return { open, view }
}


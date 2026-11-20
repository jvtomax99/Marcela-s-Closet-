import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/cormorant-garamond/wght.css'
import '@fontsource-variable/cormorant-garamond/wght-italic.css'
import '@fontsource/parisienne/400.css'
import './index.css'
import { App } from './App'
import { INTRO_FILES, introMusicFile } from './lib/intro'

// Asks the browser not to clear the closet when the device runs low on space.
void navigator.storage?.persist?.()

// Offline support, only in the published version so it never gets in the way while developing.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // On the very first visit the page loads before the offline helper starts, so once it
  // is in charge, fetch the app's own files again through it to keep a copy.
  const keepOfflineCopy = () => {
    const files = performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((url) => new URL(url).origin === location.origin)
    // The intro's clip and music may still be downloading (or cancelled by Skip), so ask for
    // them again too: then the intro also plays offline after a single visit.
    const music = introMusicFile(document.createElement('audio').canPlayType('audio/mp4; codecs="mp4a.40.2"') !== '')
    for (const url of ['./', ...files, ...Object.values(INTRO_FILES), music]) void fetch(url).catch(() => undefined)
  }
  if (!navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('controllerchange', keepOfflineCopy, { once: true })
  }
  // Relative, so the app works in a sub-folder (GitHub Pages serves it at /Marcela-s-Closet-/).
  void navigator.serviceWorker.register('./sw.js')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

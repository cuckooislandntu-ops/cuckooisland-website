import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Load the Huninn (jf open 粉圓) and Noto Sans TC web fonts at runtime, so both the Vite build and the single-file bundle work.
for (const [rel, href, cors] of [
  ['preconnect', 'https://fonts.googleapis.com', false],
  ['preconnect', 'https://fonts.gstatic.com', true],
  ['stylesheet', 'https://fonts.googleapis.com/css2?family=Huninn&family=Noto+Sans+TC:wght@400;500;700&display=swap', false],
] as const) {
  const l = document.createElement('link'); l.rel = rel; l.href = href; if (cors) l.crossOrigin = ''
  document.head.appendChild(l)
}
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import '@/i18n'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import '@/styles/globals.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { reportWebVitals } from '@/lib/perf'
import { seedDefaultShapes } from '@/db/customShapes'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

seedDefaultShapes()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)

reportWebVitals()

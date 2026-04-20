import { createBrowserRouter, RouterProvider } from 'react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LazyMotion, domAnimation } from 'framer-motion'
import HomeScreen from '@/screens/HomeScreen'
import GameScreen from '@/screens/GameScreen'
import ShapeEditorScreen from '@/screens/ShapeEditorScreen'
import SettingsScreen from '@/screens/SettingsScreen'
import { useSettingsStore } from '@/store/settingsStore'

const RTL_LANGUAGES = new Set(['he', 'ar'])

const router = createBrowserRouter([
  { path: '/', element: <HomeScreen /> },
  { path: '/game', element: <GameScreen /> },
  { path: '/settings', element: <SettingsScreen /> },
  { path: '/shape-editor', element: <ShapeEditorScreen /> },
])

export default function App() {
  const theme = useSettingsStore((s) => s.theme)
  const darkMode = useSettingsStore((s) => s.darkMode)
  const language = useSettingsStore((s) => s.language)
  const { i18n } = useTranslation()

  const isRTL = RTL_LANGUAGES.has(language)

  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
    html.setAttribute('data-mode', darkMode)
    html.setAttribute('dir', isRTL ? 'rtl' : 'ltr')
    html.setAttribute('lang', language)
  }, [theme, darkMode, language, isRTL])

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [language, i18n])

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-content)] font-nunito">
        <RouterProvider router={router} />
      </div>
    </LazyMotion>
  )
}

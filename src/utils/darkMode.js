import { useState, useEffect } from 'react'

export function useDarkMode() {
  const getInitial = () => {
    const saved = localStorage.getItem('politiscope_theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const [dark, setDark] = useState(getInitial)

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
  }, [dark])

  const toggle = () => {
    setDark(d => {
      const next = !d
      localStorage.setItem('politiscope_theme', next ? 'dark' : 'light')
      return next
    })
  }

  return { dark, toggle }
}

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const themeStorageKey = 'ce-theme'

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

// index.html ตั้งค่าเริ่มต้นไว้แล้ว hook นี้แค่สลับและจำค่าไว้ในเบราว์เซอร์
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(themeStorageKey, theme)
    } catch {
      // บันทึกไม่ได้ก็ยังสลับธีมได้ระหว่างเปิดหน้า
    }
  }, [theme])

  return [theme, () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))] as const
}

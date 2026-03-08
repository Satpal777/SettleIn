import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextValue {
    dark: boolean
    toggleDark: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [dark, setDark] = useState(() =>
        window.matchMedia('(prefers-color-scheme: dark)').matches
    )

    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark)
    }, [dark])

    return (
        <ThemeContext value={{ dark, toggleDark: () => setDark(d => !d) }}>
            {children}
        </ThemeContext>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
    return ctx
}

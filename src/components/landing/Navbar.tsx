import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'

const NAV_LINKS = [
    { label: 'Help', href: '/help' },
]

function HouseLogo() {
    return (
        <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <rect width="36" height="36" rx="10" className="fill-button" />
            <path d="M18 8L7 18H11V28H25V18H29L18 8Z" fill="white" opacity="0.15" />
            <path d="M18 9.5L8.5 18.5H12V27H24V18.5H27.5L18 9.5Z"
                stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
            <rect x="15" y="20" width="6" height="7" rx="3" fill="white" opacity="0.9" />
        </svg>
    )
}

function SunIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    )
}

function MoonIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    )
}

function GitHubIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
    )
}

function MenuIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
    )
}

function CloseIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
        </svg>
    )
}

function LogOutIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    )
}

interface AvatarProps {
    avatarUrl?: string | null
    initials: string
}

function Avatar({ avatarUrl, initials }: AvatarProps) {
    const [imgError, setImgError] = useState(false)

    if (avatarUrl && !imgError) {
        return (
            <img
                src={avatarUrl}
                alt="Profile"
                className="w-8 h-8 rounded-sm object-cover select-none"
                onError={() => setImgError(true)}
            />
        )
    }
    return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-sm bg-secondary text-background text-xs font-bold tracking-wide select-none">
            {initials}
        </span>
    )
}

interface ProfileDropdownProps {
    avatarUrl?: string | null
    initials: string
    email: string
    name?: string | null
}

function ProfileDropdown({ avatarUrl, initials, email, name }: ProfileDropdownProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        function handler(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    async function handleSignOut() {
        setOpen(false)
        await supabase.auth.signOut()
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                aria-haspopup="true"
                aria-expanded={open}
                aria-label="Open profile menu"
                className="flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight rounded-sm transition-transform duration-150 hover:scale-105 active:scale-95"
            >
                <Avatar avatarUrl={avatarUrl} initials={initials} />
            </button>

            {open && (
                <div
                    className="absolute right-0 top-[calc(100%+10px)] w-64 bg-background border border-secondary/15 shadow-xl shadow-secondary/10 rounded-sm z-50 animate-[menuSlide_0.15s_ease-out] overflow-hidden"
                    role="menu"
                    aria-label="Profile menu"
                >
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-secondary/10">
                        <Avatar avatarUrl={avatarUrl} initials={initials} />
                        <div className="flex flex-col min-w-0">
                            {name && (
                                <span className="text-sm font-semibold text-headline truncate">{name}</span>
                            )}
                            <span className="text-xs text-paragraph truncate">{email}</span>
                        </div>
                    </div>

                    <div className="py-1.5">
                        <Link
                            to="/dashboard"
                            onClick={() => setOpen(false)}
                            role="menuitem"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-paragraph hover:text-headline hover:bg-secondary/8 transition-colors duration-100"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                aria-hidden="true">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                            </svg>
                            Dashboard
                        </Link>
                        <Link
                            to="/profile"
                            onClick={() => setOpen(false)}
                            role="menuitem"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-paragraph hover:text-headline hover:bg-secondary/8 transition-colors duration-100"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                aria-hidden="true">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            My profile
                        </Link>
                        <Link
                            to="/settings"
                            onClick={() => setOpen(false)}
                            role="menuitem"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-paragraph hover:text-headline hover:bg-secondary/8 transition-colors duration-100"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                aria-hidden="true">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            Settings
                        </Link>
                    </div>

                    <div className="border-t border-secondary/10 py-1.5">
                        <button
                            onClick={handleSignOut}
                            role="menuitem"
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-paragraph hover:text-red-500 hover:bg-red-500/8 transition-colors duration-100"
                        >
                            <LogOutIcon />
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}


export default function Navbar() {
    const { dark, toggleDark } = useTheme()
    const { user, loading } = useAuth()
    const [menuOpen, setMenuOpen] = useState(false)

    const email = user?.email ?? ''
    const name = user?.user_metadata?.full_name as string | null ?? null
    const avatarUrl = user?.user_metadata?.avatar_url as string | null ?? null
    const initials = email.slice(0, 2).toUpperCase()

    const closeMenu = () => setMenuOpen(false)

    return (
        <header className="sticky top-0 z-50 w-full">
            <div className="bg-background/75 backdrop-blur-xl border-b border-secondary/10 shadow-sm shadow-secondary/5">
                <nav
                    className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-10 h-16"
                    aria-label="Main navigation"
                >

                    <Link
                        to="/"
                        className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight rounded-sm"
                        aria-label="SettleIn — go to home"
                    >
                        <span className="transition-transform duration-200 group-hover:scale-105">
                            <HouseLogo />
                        </span>
                        <span className="text-[1.25rem] font-extrabold tracking-tight leading-none text-headline">
                            Settle<span className="text-highlight">In</span>
                        </span>
                    </Link>

                    <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
                        {NAV_LINKS.map(link => (
                            <li key={link.href}>
                                <Link
                                    to={link.href}
                                    className="px-4 py-2 rounded-sm text-sm font-medium text-paragraph hover:text-headline hover:bg-secondary/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center gap-1 sm:gap-2">

                        <a
                            href="https://github.com/Satpal777/SettleIn"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-sm text-paragraph hover:text-headline hover:bg-secondary/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
                            aria-label="View source on GitHub"
                        >
                            <GitHubIcon />
                        </a>

                        <button
                            onClick={toggleDark}
                            className="p-2 rounded-sm text-paragraph hover:text-headline hover:bg-secondary/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
                            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {dark ? <SunIcon /> : <MoonIcon />}
                        </button>

                        <span className="hidden sm:block w-px h-5 bg-secondary/20 mx-1" aria-hidden="true" />

                        {!loading && (
                            user ? (
                                <div className="hidden sm:flex items-center gap-2">
                                    <Link
                                        to="/dashboard"
                                        className="px-4 py-2 rounded-sm text-sm font-semibold text-paragraph hover:text-headline hover:bg-secondary/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
                                    >
                                        Dashboard
                                    </Link>
                                    <ProfileDropdown
                                        avatarUrl={avatarUrl}
                                        initials={initials}
                                        email={email}
                                        name={name}
                                    />
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="hidden sm:inline-flex items-center gap-1.5 bg-button text-button-text text-sm font-semibold px-5 py-2 rounded-sm shadow-md shadow-button/20 hover:opacity-90 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
                                >
                                    Login
                                </Link>
                            )
                        )}

                        <button
                            className="md:hidden p-2 rounded-sm text-paragraph hover:text-headline hover:bg-secondary/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
                            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={menuOpen}
                            aria-controls="mobile-menu"
                            onClick={() => setMenuOpen(o => !o)}
                        >
                            {menuOpen ? <CloseIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </nav>
            </div>

            {menuOpen && (
                <div
                    id="mobile-menu"
                    className="md:hidden bg-background/95 backdrop-blur-xl border-b border-secondary/10 px-6 py-4 space-y-1 animate-[menuSlide_0.2s_ease-out]"
                    style={{ transformOrigin: 'top' }}
                >
                    {NAV_LINKS.map(link => (
                        <Link
                            key={link.href}
                            to={link.href}
                            onClick={closeMenu}
                            className="flex items-center px-3 py-2.5 rounded-sm text-sm font-medium text-paragraph hover:text-headline hover:bg-secondary/10 transition-colors duration-150"
                        >
                            {link.label}
                        </Link>
                    ))}

                    <div className="pt-3 border-t border-secondary/10">
                        {!loading && (
                            user ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 px-3 py-2.5">
                                        <Avatar avatarUrl={avatarUrl} initials={initials} />
                                        <div className="flex flex-col min-w-0">
                                            {name && <span className="text-sm font-semibold text-headline truncate">{name}</span>}
                                            <span className="text-xs text-paragraph truncate">{email}</span>
                                        </div>
                                    </div>
                                    <Link
                                        to="/dashboard"
                                        onClick={closeMenu}
                                        className="flex items-center px-3 py-2.5 rounded-sm text-sm font-medium text-paragraph hover:text-headline hover:bg-secondary/10 transition-colors duration-150"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/profile"
                                        onClick={closeMenu}
                                        className="flex items-center px-3 py-2.5 rounded-sm text-sm font-medium text-paragraph hover:text-headline hover:bg-secondary/10 transition-colors duration-150"
                                    >
                                        My profile
                                    </Link>
                                    <button
                                        onClick={async () => { closeMenu(); await supabase.auth.signOut() }}
                                        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-sm text-sm font-medium text-paragraph hover:text-red-500 hover:bg-red-500/8 transition-colors duration-150"
                                    >
                                        <LogOutIcon />
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={closeMenu}
                                    className="flex items-center justify-center bg-button text-button-text text-sm font-semibold w-full py-2.5 rounded-sm shadow-md shadow-button/20 hover:opacity-90 transition-opacity duration-150"
                                >
                                    Login
                                </Link>
                            )
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}

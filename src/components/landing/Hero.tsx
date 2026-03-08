import { Link } from 'react-router-dom'
import HouseIllustration from '../shared/HouseIllustration'
import { useAuth } from '../../context/AuthContext'

export default function Hero() {
    const { user, loading } = useAuth()

    return (
        <section
            id="hero"
            className="relative w-full min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-background"
        >
            <div className="relative mx-auto w-full max-w-7xl px-6 sm:px-10 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="flex flex-col gap-6">

                    {/* Badge */}
                    <span className="inline-flex items-center gap-2 self-start px-4 py-1.5 rounded-sm text-xs font-semibold tracking-widest uppercase border border-highlight/40 text-highlight bg-highlight/8">
                        🏠 Find your place, faster
                    </span>

                    {/* Heading */}
                    <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.08] tracking-tight text-headline">
                        Settle <span className="relative inline-block">
                            <span className="text-highlight">anywhere</span>
                            <svg viewBox="0 0 160 12" className="absolute -bottom-2 left-0 w-full" aria-hidden="true">
                                <path d="M2 8 Q40 2 80 8 Q120 14 158 8"
                                    stroke="var(--color-highlight)" strokeWidth="3"
                                    strokeLinecap="round" fill="none" opacity="0.55" />
                            </svg>
                        </span>
                    </h1>

                    {/* Sub-copy */}
                    <p className="text-lg text-paragraph leading-relaxed max-w-md">
                        Find your dream rental and manage your entire move-in process in one single place. No paperwork headaches, just keys in hand.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-wrap gap-4 pt-2">
                        {loading ? (
                            <div className="h-[46px] w-[170px] bg-secondary/10 rounded-sm animate-pulse" aria-hidden="true"></div>
                        ) : user ? (
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center justify-center gap-2 bg-button text-button-text text-sm font-bold px-7 py-3 rounded-sm shadow-lg shadow-button/25 hover:opacity-90 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
                            >
                                Go to Dashboard
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ) : (
                            <Link
                                to="/signup"
                                className="inline-flex items-center justify-center gap-2 bg-button text-button-text text-sm font-bold px-7 py-3 rounded-sm shadow-lg shadow-button/25 hover:opacity-90 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
                            >
                                Get started free
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Link>
                        )}

                        <Link
                            to="/help"
                            className="inline-flex items-center justify-center gap-2 border-2 border-secondary/30 text-headline text-sm font-semibold px-7 py-3 rounded-sm hover:border-highlight/60 hover:text-highlight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
                        >
                            See how it works
                        </Link>
                    </div>
                </div>

                <div className="flex justify-center lg:justify-end">
                    <HouseIllustration />
                </div>
            </div>
        </section>
    )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SignInIllustration from '../components/shared/SignInIllustration'

export default function SignInPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [emailSent, setEmailSent] = useState(false)

    async function handleGoogleSignIn() {
        setError(null)
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}` },
        })
        if (error) setError(error.message)
        setLoading(false)
    }

    async function handleMagicLink(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}` },
        })
        if (error) setError(error.message)
        else setEmailSent(true)
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex bg-background text-headline">

            {/* ── Left: Form panel ─────────────────────────────────── */}
            <div className="flex flex-col justify-center w-full lg:w-1/2 px-6 sm:px-12 py-16">
                <div className="mx-auto w-full max-w-md">

                    {/* Logo */}
                    <Link to="/" className="inline-flex items-center gap-2 mb-10 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight rounded-sm">
                        <span className="text-xl font-extrabold tracking-tight text-headline">
                            Settle<span className="text-highlight">In</span>
                        </span>
                    </Link>

                    {/* Heading */}
                    <h1 className="text-3xl font-extrabold tracking-tight text-headline mb-1">
                        Welcome back
                    </h1>
                    <p className="text-sm text-paragraph mb-8">
                        Sign in to continue to your SettleIn dashboard.
                    </p>

                    {emailSent ? (
                        <div className="rounded-sm border border-highlight/30 bg-highlight/8 p-5 text-sm text-highlight">
                            <p className="font-semibold mb-1">Check your inbox ✉️</p>
                            <p className="text-paragraph">
                                We sent a magic link to <strong>{email}</strong>.
                                Click it to sign in — no password needed.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">

                            {/* Google */}
                            <button
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="flex items-center justify-center gap-3 w-full px-5 py-3 rounded-sm border border-secondary/25 text-sm font-semibold text-headline hover:bg-secondary/8 hover:border-secondary/40 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight disabled:opacity-50"
                            >
                                {/* Google G */}
                                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3 text-xs text-paragraph/50">
                                <span className="flex-1 h-px bg-secondary/15" />
                                or continue with email
                                <span className="flex-1 h-px bg-secondary/15" />
                            </div>

                            {/* Magic-link form */}
                            <form onSubmit={handleMagicLink} className="flex flex-col gap-4" noValidate>
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="signin-email" className="text-xs font-semibold text-paragraph uppercase tracking-widest">
                                        Email address
                                    </label>
                                    <input
                                        id="signin-email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-sm border border-secondary/25 bg-background text-headline text-sm placeholder:text-paragraph/40 focus:outline-none focus:ring-2 focus:ring-highlight focus:border-transparent transition-all duration-150"
                                    />
                                </div>

                                {error && (
                                    <p role="alert" className="text-xs text-red-500 font-medium">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full py-3 rounded-sm bg-button text-button-text text-sm font-bold shadow-lg shadow-button/25 hover:opacity-90 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight disabled:opacity-50"
                                >
                                    {loading ? 'Sending…' : 'Send magic link'}
                                </button>
                            </form>
                        </div>
                    )}

                    <p className="mt-8 text-sm text-paragraph text-center">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-highlight font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight rounded-sm">
                            Sign up free
                        </Link>
                    </p>
                </div>
            </div>

            {/* ── Right: Illustration panel ─────────────────────────── */}
            <div className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-background border-l border-secondary/10 px-12 py-16 relative overflow-hidden">
                {/* Subtle glow */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse 70% 60% at 60% 50%, var(--color-highlight) 0%, transparent 70%)', opacity: 0.06 }}
                />
                <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-sm">
                    <SignInIllustration />
                    <div className="space-y-2">
                        <h2 className="text-xl font-extrabold text-headline tracking-tight">
                            Your next home is one search away
                        </h2>
                        <p className="text-sm text-paragraph leading-relaxed">
                            Browse verified listings, track visits, and compare properties —
                            all in one dashboard-first platform.
                        </p>
                    </div>
                    {/* Trust badges */}
                    <div className="flex items-center gap-4 text-xs text-paragraph/60 font-medium">
                        <span>🔒 Secure login</span>
                        <span className="w-px h-4 bg-secondary/20" />
                        <span>✅ No password</span>
                        <span className="w-px h-4 bg-secondary/20" />
                        <span>⚡ Instant access</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

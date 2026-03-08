import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import type { ActiveView } from '../hooks/useProfile'

type Mode = 'seeker' | 'landlord' | 'both'

/**
 * First-time onboarding — shown when profile.onboarded = false.
 * User picks Seeker, Landlord, or Both.
 * Saves answer and redirects to the right dashboard.
 */
export default function OnboardingPage() {
    const { profile, loading, completeOnboarding } = useProfile()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [selected, setSelected] = useState<Mode | null>(null)
    const [saving, setSaving] = useState(false)
    const [fullName, setFullName] = useState('')

    useEffect(() => {
        if (loading || !profile) return


        // 2. Try profile data (second priority)
        const pSeeker = profile.is_seeker
        const pLandlord = profile.is_landlord

        const isSeeker = pSeeker
        const isLandlord = pLandlord

        if (isSeeker && isLandlord) setSelected('both')
        else if (isSeeker) setSelected('seeker')
        else if (isLandlord) setSelected('landlord')
        if (profile.full_name && !fullName) {
            setFullName(profile.full_name)
        }
    }, [searchParams, profile, loading])

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-paragraph animate-pulse font-bold">Loading profile...</p>
            </div>
        )
    }

    async function handleContinue() {
        if (!selected || !fullName.trim()) return
        setSaving(true)

        const is_seeker = selected === 'seeker' || selected === 'both'
        const is_landlord = selected === 'landlord' || selected === 'both'
        const active_view: ActiveView = is_seeker ? 'seeker' : 'landlord'

        await completeOnboarding({
            is_seeker,
            is_landlord,
            active_view,
            full_name: fullName.trim()
        })
        navigate(active_view === 'seeker' ? '/seeker/dashboard' : '/landlord/dashboard')
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">

            {/* Logo */}
            <p className="text-2xl font-extrabold tracking-tight text-headline mb-2">
                Settle<span className="text-highlight">In</span>
            </p>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-headline text-center mb-3 mt-6">
                Complete your profile
            </h1>
            <p className="text-sm text-paragraph text-center mb-8 max-w-xs">
                Just a few details before we get started.
            </p>

            {/* Profile fields */}
            <div className="w-full max-w-md flex flex-col gap-4 mb-8">
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-headline mb-1">Full Name</label>
                    <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-secondary/10 border border-secondary/20 rounded-sm py-2 px-3 text-headline focus:outline-none focus:ring-2 focus:ring-highlight"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-headline mb-1">How will you use SettleIn?</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => setSelected('seeker')}
                            className={[
                                'py-2 px-2 text-sm font-medium rounded-sm border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight',
                                selected === 'seeker' ? 'border-highlight bg-highlight/10 text-highlight ring-1 ring-highlight' : 'border-secondary/20 bg-secondary/10 text-headline hover:bg-secondary/20 hover:border-secondary/40'
                            ].join(' ')}
                        >
                            Seeker
                        </button>
                        <button
                            onClick={() => setSelected('landlord')}
                            className={[
                                'py-2 px-2 text-sm font-medium rounded-sm border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight',
                                selected === 'landlord' ? 'border-highlight bg-highlight/10 text-highlight ring-1 ring-highlight' : 'border-secondary/20 bg-secondary/10 text-headline hover:bg-secondary/20 hover:border-secondary/40'
                            ].join(' ')}
                        >
                            Landlord
                        </button>
                        <button
                            onClick={() => setSelected('both')}
                            className={[
                                'py-2 px-2 text-sm font-medium rounded-sm border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight',
                                selected === 'both' ? 'border-highlight bg-highlight/10 text-highlight ring-1 ring-highlight' : 'border-secondary/20 bg-secondary/10 text-headline hover:bg-secondary/20 hover:border-secondary/40'
                            ].join(' ')}
                        >
                            Both
                        </button>
                    </div>
                </div>
            </div>

            {/* Continue button */}
            <button
                onClick={handleContinue}
                disabled={!selected || !fullName.trim() || saving}
                className="w-full max-w-md py-3 rounded-sm bg-button text-button-text text-sm font-bold shadow-lg shadow-button/25 hover:opacity-90 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight disabled:opacity-40"
            >
                {saving ? 'Setting up your account…' : 'Continue →'}
            </button>
        </div>
    )
}

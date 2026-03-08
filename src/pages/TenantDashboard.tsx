import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Search, Heart, CalendarDays, CheckSquare, MessageSquare } from 'lucide-react'

/**
 * Tenant Dashboard — home for tenants after login.
 * Phase 2 will fill the cards with real data.
 */
export default function TenantDashboard() {
    const { user } = useAuth()
    const name = user?.user_metadata?.full_name ?? user?.email ?? 'there'

    return (
        <div className="min-h-screen bg-background text-headline">
            {/* Top bar */}
            <header className="border-b border-secondary/10 px-6 sm:px-10 h-14 flex items-center justify-between">
                <Link to="/" className="text-base font-extrabold tracking-tight">
                    Settle<span className="text-highlight">In</span>
                </Link>
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="text-xs font-semibold text-paragraph hover:text-headline transition-colors"
                >
                    Sign out
                </button>
            </header>

            <main className="max-w-5xl mx-auto px-6 sm:px-10 py-10">
                {/* Welcome */}
                <h1 className="text-2xl font-extrabold mb-1">Hi, {name} 👋</h1>
                <p className="text-sm text-paragraph mb-8">Here's what's happening with your rentals.</p>

                {/* Quick-action cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <DashCard
                        icon={<Search className="w-6 h-6" />}
                        title="Browse listings"
                        desc="Search verified properties by location, budget & move-in date."
                        href="/listings"
                        cta="Browse"
                    />
                    <DashCard
                        icon={<Heart className="w-6 h-6" />}
                        title="Shortlist"
                        desc="Your saved properties. Compare and revisit anytime."
                        href="/shortlist"
                        cta="View shortlist"
                        badge="0"
                    />
                    <DashCard
                        icon={<CalendarDays className="w-6 h-6" />}
                        title="My visits"
                        desc="Track scheduled and completed property visits."
                        href="/tenant/visits"
                        cta="View visits"
                        badge="0"
                    />
                </div>

                {/* Move-in + tickets row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                    <DashCard
                        icon={<CheckSquare className="w-6 h-6" />}
                        title="Move-in checklist"
                        desc="Complete your checklist before moving in."
                        href="/tenant/move-in"
                        cta="View checklist"
                    />
                    <DashCard
                        icon={<MessageSquare className="w-6 h-6" />}
                        title="Support tickets"
                        desc="Raise an issue or track existing ones."
                        href="/tenant/tickets"
                        cta="View tickets"
                        badge="0"
                    />
                </div>

                {/* Coming-soon notice */}
                <p className="mt-10 text-xs text-paragraph/50 text-center">
                    More features coming soon — visit tracking, side-by-side comparison, and more.
                </p>
            </main>
        </div>
    )
}

/* ── Reusable dashboard card ──────────────────────────────────────────────── */

interface DashCardProps {
    icon: React.ReactNode
    title: string
    desc: string
    href: string
    cta: string
    badge?: string
}

function DashCard({ icon, title, desc, href, cta, badge }: DashCardProps) {
    return (
        <div className="flex flex-col gap-3 p-5 rounded-sm border border-secondary/15 bg-background hover:border-highlight/30 hover:shadow-md hover:shadow-highlight/8 transition-all duration-200">
            <div className="flex items-center justify-between">
                <div className="text-headline opacity-80">{icon}</div>
                {badge !== undefined && (
                    <span className="text-xs font-bold bg-secondary/10 text-paragraph px-2 py-0.5 rounded-sm">
                        {badge}
                    </span>
                )}
            </div>
            <div>
                <h2 className="text-sm font-bold text-headline mb-1">{title}</h2>
                <p className="text-xs text-paragraph leading-relaxed">{desc}</p>
            </div>
            <Link
                to={href}
                className="mt-auto text-xs font-semibold text-highlight hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight rounded-sm"
            >
                {cta} →
            </Link>
        </div>
    )
}

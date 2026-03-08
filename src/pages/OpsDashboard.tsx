import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Home, CalendarDays, CheckSquare, MessageSquare, RefreshCw } from 'lucide-react'

/**
 * Ops Dashboard — for operations/property managers.
 * Manages their listings, visit requests, and move-ins.
 */
export default function OpsDashboard() {
    return (
        <div className="min-h-screen bg-background text-headline">
            <header className="border-b border-secondary/10 px-6 sm:px-10 h-14 flex items-center justify-between">
                <Link to="/" className="text-base font-extrabold tracking-tight">
                    Settle<span className="text-highlight">In</span>
                    <span className="ml-2 text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-sm">Ops</span>
                </Link>
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="text-xs font-semibold text-paragraph hover:text-headline transition-colors"
                >
                    Sign out
                </button>
            </header>

            <main className="max-w-5xl mx-auto px-6 sm:px-10 py-10">
                <h1 className="text-2xl font-extrabold mb-1">Operations Dashboard</h1>
                <p className="text-sm text-paragraph mb-8">Manage your listings, visits, and tenants.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <OpsCard icon={<Home className="w-6 h-6" />} title="My listings" count="0" href="/ops/listings" />
                    <OpsCard icon={<CalendarDays className="w-6 h-6" />} title="Visit requests" count="0" href="/ops/visits" />
                    <OpsCard icon={<CheckSquare className="w-6 h-6" />} title="Active move-ins" count="0" href="/ops/move-ins" />
                    <OpsCard icon={<MessageSquare className="w-6 h-6" />} title="Open tickets" count="0" href="/ops/tickets" />
                    <OpsCard icon={<RefreshCw className="w-6 h-6" />} title="Extension requests" count="0" href="/ops/extensions" />
                </div>
            </main>
        </div>
    )
}

function OpsCard({ icon, title, count, href }: { icon: React.ReactNode; title: string; count: string; href: string }) {
    return (
        <Link
            to={href}
            className="flex items-center gap-4 p-5 rounded-sm border border-secondary/15 hover:border-highlight/30 hover:shadow-md hover:shadow-highlight/8 transition-all duration-200"
        >
            <div className="text-headline opacity-80">{icon}</div>
            <div>
                <p className="text-xs text-paragraph">{title}</p>
                <p className="text-xl font-extrabold text-headline">{count}</p>
            </div>
        </Link>
    )
}

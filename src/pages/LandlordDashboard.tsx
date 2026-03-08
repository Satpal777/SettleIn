import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Home, CalendarDays, Key, MessageSquare, Clock, PlusCircle, ArrowRight, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

export default function LandlordDashboard() {
    const { user } = useAuth()
    const name = user?.user_metadata?.first_name || 'Landlord'

    const [stats, setStats] = useState({
        listingCount: 0,
        pendingVisits: 0,
        activeTenants: 0,
        openTickets: 0,
        interestedSeekers: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return
        fetchDashboardData()
    }, [user])

    async function fetchDashboardData() {
        setLoading(true)
        try {
            // 1. Listings Count
            const { count: listingCount } = await supabase
                .from('properties')
                .select('*', { count: 'exact', head: true })
                .eq('landlord_id', user!.id)

            // 2. Pending Visits (Requested status)
            const { data: visitsData } = await supabase
                .from('visits')
                .select('seeker_id, properties!inner(landlord_id)')
                .eq('status', 'requested')
                .eq('properties.landlord_id', user!.id)

            const pendingVisitsCount = visitsData?.length || 0

            // 3. Unique Seekers interested (from all visits on landlord's properties)
            const { data: allVisits } = await supabase
                .from('visits')
                .select('seeker_id, properties!inner(landlord_id)')
                .eq('properties.landlord_id', user!.id)

            const uniqueSeekers = new Set(allVisits?.map(v => v.seeker_id)).size

            // 4. Active Tenants (Count of Move-ins)
            const { count: activeTenants } = await supabase
                .from('move_ins')
                .select('*', { count: 'exact', head: true })
                .eq('landlord_id', user!.id)

            // 5. Open Tickets
            const { count: openTickets } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('landlord_id', user!.id)
                .eq('status', 'open')

            setStats({
                listingCount: listingCount || 0,
                pendingVisits: pendingVisitsCount,
                activeTenants: activeTenants || 0,
                openTickets: openTickets || 0,
                interestedSeekers: uniqueSeekers
            })
        } catch (error) {
            console.error("Error fetching landlord dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-background text-headline min-h-screen pb-12 animate-[fadeIn_0.25s_ease-out]">
            <main className="max-w-6xl mx-auto px-6 py-8">

                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-extrabold mb-1 tracking-tight">
                            Welcome, {name} <span className="text-2xl ml-1">👋</span>
                        </h1>
                        <p className="text-sm text-paragraph">Manage your listings, visits, and tenants.</p>
                    </div>
                </div>

                <div className="space-y-8">

                    <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <MetricCard label="My Listings" value={loading ? '...' : stats.listingCount} icon={<Home className="w-5 h-5" />} />
                        <MetricCard
                            label="Pending Visits"
                            value={loading ? '...' : stats.pendingVisits}
                            icon={<CalendarDays className="w-5 h-5" />}
                            highlightText={stats.pendingVisits > 0 ? "Action needed" : undefined}
                        />
                        <MetricCard label="Active Tenants" value={loading ? '...' : stats.activeTenants} icon={<Key className="w-5 h-5" />} />
                        <MetricCard label="Open Tickets" value={loading ? '...' : stats.openTickets} icon={<MessageSquare className="w-5 h-5" />} />
                        <MetricCard label="Interested Seekers" value={loading ? '...' : stats.interestedSeekers} icon={<Users className="w-5 h-5" />} />
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ActionFlowCard
                            icon={<Home className="w-6 h-6" />}
                            title="My Listings"
                            desc="View, edit, and manage all your property listings."
                            href="/landlord/listings"
                            cta="Manage listings"
                        />
                        <ActionFlowCard
                            icon={<CalendarDays className="w-6 h-6" />}
                            title="Visit Requests"
                            desc="Review and confirm visit requests from seekers."
                            href="/landlord/visits"
                            cta="View requests"
                            badge={stats.pendingVisits > 0 ? `${stats.pendingVisits} pending` : undefined}
                        />
                        <ActionFlowCard
                            icon={<Key className="w-6 h-6" />}
                            title="Move-ins"
                            desc="Track tenant move-in progress and documents."
                            href="/landlord/move-ins"
                            cta="View move-ins"
                        />
                        <ActionFlowCard
                            icon={<MessageSquare className="w-6 h-6" />}
                            title="Support Tickets"
                            desc="Respond to tenant issues and maintenance requests."
                            href="/landlord/tickets"
                            cta="View tickets"
                            badge={stats.openTickets > 0 ? `${stats.openTickets} open` : undefined}
                        />
                        <ActionFlowCard
                            icon={<Clock className="w-6 h-6" />}
                            title="Extension Requests"
                            desc="Approve or reject tenant stay extension requests."
                            href="/landlord/extensions"
                            cta="View extensions"
                        />
                        <ActionFlowCard
                            icon={<PlusCircle className="w-6 h-6" />}
                            title="Add a Listing"
                            desc="List a new property — it goes to review before going live."
                            href="/landlord/listings/new"
                            cta="Add listing"
                            isPrimary
                        />
                    </section>

                    {/* ── Recent Activity / Alerts Placeholder ─────────────────────── */}
                    <section className="bg-background border rounded-sm p-6 mt-8">
                        <h2 className="text-sm font-extrabold tracking-widest uppercase mb-4 text-headline">Recent Activity</h2>
                        <div className="text-center py-12 bg-secondary/5 border-2 border-dashed border-secondary/20 rounded-sm">
                            <p className="text-sm font-semibold text-paragraph">No recent activity</p>
                            <p className="text-xs text-paragraph/60 mt-1">Your notifications and updates will appear here.</p>
                        </div>
                    </section>
                </div>

            </main>
        </div>
    )
}


function MetricCard({ label, value, icon, highlightText }: { label: string, value: string | number, icon: React.ReactNode, highlightText?: string }) {
    return (
        <div className="bg-background border border-secondary/15 rounded-sm p-6 hover:border-secondary/40 transition-colors shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-sm bg-secondary/5 border border-secondary/10 flex items-center justify-center text-paragraph">
                    {icon}
                </div>
                <h3 className="text-xs font-bold text-paragraph uppercase tracking-widest">{label}</h3>
            </div>
            <div className="flex items-end gap-3 mt-4">
                <p className="text-3xl font-extrabold tracking-tight text-headline leading-none">{value}</p>
                {highlightText && (
                    <span className="text-[10px] font-bold text-highlight uppercase tracking-wider mb-1">{highlightText}</span>
                )}
            </div>
        </div>
    )
}

function ActionFlowCard({ title, desc, icon, href, cta, badge, isPrimary }: { title: string, desc: string, icon: React.ReactNode, href: string, cta: string, badge?: string, isPrimary?: boolean }) {
    return (
        <div className={`p-6 border rounded-sm flex flex-col group transition-all duration-300 ${isPrimary ? 'bg-highlight/5 border-highlight/30 shadow-sm hover:border-highlight/60' : 'bg-background border-secondary/15 hover:border-secondary/40 shadow-sm'}`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-sm flex items-center justify-center border ${isPrimary ? 'bg-highlight text-button-text border-highlight/20' : 'bg-secondary/5 text-headline border-secondary/10'}`}>
                    {icon}
                </div>
                {badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-sm bg-highlight/10 text-highlight">
                        {badge}
                    </span>
                )}
            </div>
            <h3 className="text-lg font-extrabold text-headline mb-2">{title}</h3>
            <p className="text-sm text-paragraph mb-6 flex-1">{desc}</p>

            <Link
                to={href}
                className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 w-max pb-1 border-b-2 transition-all ${isPrimary ? 'text-highlight border-highlight hover:pr-2' : 'text-headline border-headline hover:text-highlight hover:border-highlight hover:pr-2'}`}
            >
                {cta} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
        </div>
    )
}

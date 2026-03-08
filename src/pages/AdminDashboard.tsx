import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ListChecks, Ticket, Users, LineChart } from 'lucide-react'
import { supabase } from '../supabaseClient'

/**
 * Admin Dashboard
 */
export default function AdminDashboard() {
    const [pendingCount, setPendingCount] = useState(0);
    const [seekerCount, setSeekerCount] = useState(0);
    const [landlordCount, setLandlordCount] = useState(0);
    const [openTicketCount, setOpenTicketCount] = useState(0);

    useEffect(() => {

        async function fetchAllMetrics() {
            const { data, error } = await supabase.rpc('get_admin_metrics');
            if (!error && data) {
                setSeekerCount(data.seekers);
                setLandlordCount(data.landlords);
                setOpenTicketCount(data.open_tickets);
                setPendingCount(data.pending_properties);
            }
        }

        fetchAllMetrics();
    }, [])

    return (
        <div className="max-w-6xl mx-auto px-6 py-8 animate-[fadeIn_0.25s_ease-out]">
            <h1 className="text-2xl font-extrabold mb-1">Admin Dashboard</h1>
            <p className="text-sm text-paragraph mb-8">Platform-wide overview and controls.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <StatCard label="Pending listings" value={pendingCount.toString()} />
                <StatCard label="Active seekers" value={seekerCount.toString()} />
                <StatCard label="Landlords" value={landlordCount.toString()} />
                <StatCard label="Open tickets" value={openTicketCount.toString()} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <AdminCard icon={<ListChecks className="w-6 h-6" />} title="Review listings"
                    desc="Approve or reject listings submitted by landlords."
                    href="/admin/listings" badge={`${pendingCount} pending`} />
                <AdminCard icon={<Ticket className="w-6 h-6" />} title="Support tickets"
                    desc="All open tickets across the platform."
                    href="/admin/tickets" badge={`${openTicketCount} open`} />
                <AdminCard icon={<Users className="w-6 h-6" />} title="User management"
                    desc="Manage all users, roles, and admin accounts."
                    href="/admin/users" />
                <AdminCard icon={<LineChart className="w-6 h-6" />} title="Analytics"
                    desc="Visit conversion, listings performance, revenue."
                    href="/admin/analytics" />
            </div>
        </div>
    )
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-4 rounded-sm border border-secondary/15">
            <p className="text-xs text-paragraph mb-1">{label}</p>
            <p className="text-2xl font-extrabold text-headline">{value}</p>
        </div>
    )
}

function AdminCard({ icon, title, desc, href, badge }: {
    icon: React.ReactNode; title: string; desc: string; href: string; badge?: string
}) {
    return (
        <Link to={href}
            className="flex flex-col gap-3 p-5 rounded-sm border border-secondary/15 hover:border-highlight/30 hover:shadow-md hover:shadow-highlight/8 transition-all duration-200"
        >
            <div className="flex items-center justify-between">
                <div className="text-headline opacity-80">{icon}</div>
                {badge && (
                    <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-sm">{badge}</span>
                )}
            </div>
            <div>
                <p className="text-sm font-bold text-headline">{title}</p>
                <p className="text-xs text-paragraph leading-relaxed">{desc}</p>
            </div>
        </Link>
    )
}

import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Search, Heart, CalendarDays, CheckSquare, MessageSquare, LogOut, Layers, FileClock } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import ViewSwitcher from './ViewSwitcher'

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/seeker/dashboard', icon: LayoutDashboard },
    { label: 'Browse Properties', href: '/seeker/listings', icon: Search },
    { label: 'Shortlist', href: '/seeker/shortlist', icon: Heart },
    { label: 'Compare', href: '/seeker/compare', icon: Layers },
    { label: 'My Visits', href: '/seeker/visits', icon: CalendarDays },
    { label: 'Move-in Tasks', href: '/seeker/move-in', icon: CheckSquare },
    { label: 'Stay Extensions', href: '/seeker/extensions', icon: FileClock },
    { label: 'Support', href: '/seeker/tickets', icon: MessageSquare },
]

export default function SeekerLayout() {
    const { user } = useAuth()
    const { profile, setActiveView } = useProfile()
    const navigate = useNavigate()
    const location = useLocation()

    const name = profile?.full_name ?? user?.email ?? 'there'
    const hasBothRoles = profile?.is_seeker && profile?.is_landlord
    const isAdmin = profile?.role === 'superadmin'
    const showSwitcher = hasBothRoles || isAdmin

    async function handleViewSwitch(view: 'seeker' | 'landlord' | 'admin') {
        if (view === 'admin') {
            navigate('/admin/dashboard')
            return
        }
        await setActiveView(view)
        navigate(view === 'landlord' ? '/landlord/dashboard' : '/seeker/dashboard')
    }

    return (
        <div className="min-h-screen bg-background text-headline flex flex-col md:flex-row">
            <header className="md:hidden border-b border-secondary/10 px-6 h-14 flex items-center justify-between shrink-0">
                <Link to="/" className="text-base font-extrabold tracking-tight">
                    Settle<span className="text-highlight">In</span>
                </Link>
                <div className="flex items-center gap-3">
                    {showSwitcher && (
                        <ViewSwitcher activeView="seeker" onSwitch={handleViewSwitch} isAdmin={isAdmin} variant="icon-only" />
                    )}
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="p-2 text-paragraph hover:text-headline transition-colors"
                        title="Sign out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <aside className="w-64 border-r border-secondary/10 bg-background flex-col shrink-0 hidden md:flex sticky top-0 h-screen">
                <div className="p-6 h-14 flex items-center border-b border-secondary/10 shrink-0">
                    <Link to="/" className="text-lg font-extrabold tracking-tight">
                        Settle<span className="text-highlight">In</span>
                    </Link>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-1 overflow-y-auto">
                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon
                        const isActive = item.href === '/seeker/dashboard'
                            ? location.pathname === '/seeker/dashboard' || location.pathname === '/seeker/dashboard/'
                            : location.pathname.startsWith(item.href)

                        return (
                            <Link
                                key={item.label}
                                to={item.href}
                                className={[
                                    'flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-highlight',
                                    isActive
                                        ? 'bg-secondary/10 text-headline'
                                        : 'text-paragraph hover:bg-secondary/5 hover:text-headline'
                                ].join(' ')}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-secondary/10 flex flex-col gap-4">
                    <div className="flex items-center gap-3 px-3">
                        <div className="w-8 h-8 rounded-full bg-highlight/20 text-highlight flex items-center justify-center font-bold text-xs shrink-0">
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                            <p className="text-xs font-bold text-headline truncate">{name}</p>
                            <p className="text-[10px] text-paragraph uppercase tracking-widest font-semibold">Seeker</p>
                        </div>
                    </div>

                    {showSwitcher && (
                        <div className="px-3">
                            <ViewSwitcher activeView="seeker" onSwitch={handleViewSwitch} isAdmin={isAdmin} variant="vertical" />
                        </div>
                    )}

                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-paragraph hover:text-headline transition-colors rounded-sm hover:bg-secondary/5"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            <main className="flex-1 w-full relative">
                <Outlet />
            </main>
        </div>
    )
}

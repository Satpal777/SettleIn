import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { Heart, CalendarDays, CheckSquare, MessageSquare, ArrowRight, MapPin, FileText, Clock, Home, Search } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function SeekerDashboard() {
    const { user } = useAuth()
    const { profile } = useProfile()
    const name = profile?.full_name ?? user?.email?.split('@')[0] ?? 'there'

    const [hasCompletedMoveIn, setHasCompletedMoveIn] = useState(false)
    const [stats, setStats] = useState({
        shortlisted: 0,
        upcomingVisits: 0,
        pendingTasks: 0,
        documents: 0
    })
    const [upcomingVisit, setUpcomingVisit] = useState<any>(null)
    const [shortlisted, setShortlisted] = useState<any[]>([])
    const [activeMoveIn, setActiveMoveIn] = useState<any>(null)
    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return
        fetchDashboardData()
    }, [user])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const { count: shortlistCount, data: shortlistData } = await supabase
                .from('shortlists')
                .select('*, properties(*, property_images(url))', { count: 'exact' })
                .eq('seeker_id', user!.id)
                .limit(2)

            const { count: visitCount, data: visitData } = await supabase
                .from('visits')
                .select('*, properties(*, property_images(url))', { count: 'exact' })
                .eq('seeker_id', user!.id)
                .in('status', ['requested', 'scheduled'])
                .order('scheduled_at', { ascending: true })

            const { data: moveInData } = await supabase
                .from('move_ins')
                .select('*, properties(*)')
                .eq('seeker_id', user!.id)
                .order('created_at', { ascending: false })

            const completedMoveIn = moveInData?.find(m => m.status === 'complete')
            const latestActiveMoveIn = moveInData?.find(m => m.status !== 'complete')

            setHasCompletedMoveIn(!!completedMoveIn)

            const { count: docCount } = await supabase
                .from('move_in_documents')
                .select('*', { count: 'exact', head: true })
                .eq('uploader_id', user!.id)

            const recentActivities = []
            if (completedMoveIn) {
                recentActivities.push({
                    title: 'Welcome Home!',
                    desc: `Your move-in to ${completedMoveIn.properties.title} is complete.`,
                    time: 'Member since ' + new Date(completedMoveIn.created_at).toLocaleDateString(),
                    color: 'bg-highlight'
                })
            } else if (visitData?.[0]) {
                recentActivities.push({
                    title: `Visit ${visitData[0].status}`,
                    desc: `${visitData[0].properties.title} scheduled for ${new Date(visitData[0].scheduled_at).toLocaleDateString()}`,
                    time: 'Recently Updated',
                    color: 'bg-highlight'
                })
            }
            if (latestActiveMoveIn) {
                recentActivities.push({
                    title: 'Move-in Active',
                    desc: `Checklist active for ${latestActiveMoveIn.properties.title}`,
                    time: 'Ongoing',
                    color: 'bg-tertiary'
                })
            }

            setStats({
                shortlisted: shortlistCount || 0,
                upcomingVisits: !!completedMoveIn ? 0 : (visitCount || 0),
                pendingTasks: latestActiveMoveIn ? 3 : 0,
                documents: docCount || 0
            })
            setUpcomingVisit(!!completedMoveIn ? null : (visitData?.[0] || null))
            setShortlisted(shortlistData || [])
            setActiveMoveIn(latestActiveMoveIn || null)
            setActivities(recentActivities)
        } catch (err) {
            console.error("Dashboard error:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-background text-headline">
            <main className="max-w-6xl mx-auto px-6 py-8">

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-extrabold mb-1 tracking-tight">Welcome back, {name}</h1>
                        <p className="text-sm text-paragraph">
                            {hasCompletedMoveIn
                                ? "Home sweet home! Manage your stay and requests here."
                                : stats.upcomingVisits > 0
                                    ? `You have ${stats.upcomingVisits} upcoming visits scheduled.`
                                    : "Explore properties and start your journey home."}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-pulse">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-secondary/5 border-2 border-headline/10 rounded-sm"></div>)}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <MetricCard label="Shortlisted" value={`${stats.shortlisted} Properties`} icon={<Heart className="w-5 h-5 text-highlight" />} />
                            {!hasCompletedMoveIn && (
                                <MetricCard label="Upcoming Visits" value={`${stats.upcomingVisits} Scheduled`} icon={<CalendarDays className="w-5 h-5 text-highlight" />} />
                            )}
                            <MetricCard label="Move-in Progress" value={activeMoveIn ? activeMoveIn.status.toUpperCase() : hasCompletedMoveIn ? 'SUCCESS' : 'Inactive'} icon={<CheckSquare className="w-5 h-5 text-tertiary" />} highlightText={hasCompletedMoveIn ? "Resident" : undefined} />
                            <MetricCard label="Documents" value={`${stats.documents} Uploaded`} icon={<FileText className="w-5 h-5 text-secondary" />} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Left Column (Wider) */}
                            <div className="lg:col-span-2 space-y-6">

                                {!hasCompletedMoveIn && (
                                    <>
                                        {upcomingVisit ? (
                                            <section className="bg-background border border-highlight/20 rounded-sm p-6">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h2 className="text-sm font-extrabold tracking-widest uppercase flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-highlight"></span>
                                                        Upcoming Visit
                                                    </h2>
                                                    <Link to="/seeker/visits" className="text-xs font-black uppercase tracking-widest text-highlight hover:underline decoration-2 underline-offset-4">View All</Link>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-6 mb-2">
                                                    <div className="w-full sm:w-48 h-32 bg-secondary/5 rounded-sm overflow-hidden shrink-0 border border-secondary/10">
                                                        <img src={upcomingVisit.properties.property_images?.[0]?.url || "/platform-visit.png"} alt="Property" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h3 className="text-xl font-black tracking-tight">{upcomingVisit.properties.title}</h3>
                                                            <span className="text-[10px] font-black text-white bg-highlight px-2 py-0.5 rounded-sm uppercase tracking-wider">{upcomingVisit.status}</span>
                                                        </div>
                                                        <p className="text-sm font-bold text-paragraph mb-4 flex items-center gap-1.5 line-clamp-1">
                                                            <MapPin className="w-4 h-4 text-highlight" /> {upcomingVisit.properties.address}, {upcomingVisit.properties.city}
                                                        </p>

                                                        <div className="flex gap-6 text-sm font-black uppercase tracking-tight">
                                                            <div className="flex items-center gap-2 bg-secondary/5 px-3 py-1.5 border border-secondary/10 rounded-sm text-paragraph">
                                                                <CalendarDays className="w-4 h-4 text-highlight" /> {new Date(upcomingVisit.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </div>
                                                            <div className="flex items-center gap-2 bg-secondary/5 px-3 py-1.5 border border-secondary/10 rounded-sm text-paragraph">
                                                                <Clock className="w-4 h-4 text-highlight" /> {upcomingVisit.scheduled_at ? new Date(upcomingVisit.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>
                                        ) : (
                                            <div className="bg-secondary/5 border border-dashed border-secondary/20 rounded-sm p-12 text-center">
                                                <p className="text-sm font-black text-headline uppercase tracking-widest mb-6">No upcoming visits</p>
                                                <Link to="/seeker/listings" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-button-text bg-highlight px-6 py-3 rounded-sm">
                                                    Start Discovering <Search className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        )}
                                    </>
                                )}

                                {hasCompletedMoveIn && (
                                    <section className="bg-background border border-highlight/30 rounded-sm p-8 text-center relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="w-16 h-16 bg-tertiary/10 rounded-full border border-tertiary/30 flex items-center justify-center mx-auto mb-6">
                                                <Home className="w-10 h-10 text-tertiary" />
                                            </div>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">Welcome Home!</h2>
                                            <p className="text-sm font-bold text-headline mb-8 max-w-sm mx-auto leading-relaxed">
                                                Your residency is active. Your home dashboard is now available for managing property details, house rules, and extensions.
                                            </p>
                                            <Link to="/seeker/move-in" className="inline-flex items-center gap-3 px-10 py-4 bg-tertiary text-button-text font-black uppercase tracking-widest text-sm border border-headline/10 rounded-sm">
                                                Open Resident Portal <ArrowRight className="w-5 h-5" />
                                            </Link>
                                        </div>
                                    </section>
                                )}

                                {shortlisted.length > 0 && (
                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-sm font-extrabold tracking-widest uppercase">My Shortlist</h2>
                                            <Link to="/seeker/shortlist" className="text-xs font-bold text-paragraph hover:text-headline transition-colors flex items-center gap-1">View All ({stats.shortlisted}) <ArrowRight className="w-3 h-3" /></Link>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {shortlisted.map((s: any) => (
                                                <ShortlistCard
                                                    key={s.id}
                                                    name={s.properties.title}
                                                    price={`₹${s.properties.price.toLocaleString()}/mo`}
                                                    image={s.properties.property_images?.[0]?.url || "/platform-discovery.png"}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                            </div>

                            {/* Right Column (Narrower) */}
                            <div className="space-y-6">

                                {activeMoveIn && (
                                    <section className="bg-background border border-secondary/15 rounded-sm p-6">
                                        <h2 className="text-sm font-extrabold tracking-widest uppercase flex items-center gap-2 mb-6">
                                            <CheckSquare className="w-5 h-5 text-tertiary" /> Move-in Status
                                        </h2>

                                        <div className="mb-6">
                                            <p className="text-xs font-bold text-headline mb-2">{activeMoveIn.properties.title}</p>
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                                <span className="text-paragraph">Status: {activeMoveIn.status}</span>
                                            </div>
                                            <div className="h-2 w-full bg-secondary/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-tertiary"
                                                    style={{ width: activeMoveIn.status === 'complete' ? '100%' : activeMoveIn.status === 'inventory' ? '75%' : activeMoveIn.status === 'agreement' ? '50%' : '25%' }}
                                                ></div>
                                            </div>
                                        </div>

                                        <Link to="/seeker/move-in" className="w-full flex items-center justify-center gap-2 py-2.5 bg-background border border-secondary/20 text-[10px] font-black uppercase tracking-widest hover:bg-secondary/5 transition-all rounded-sm">
                                            View Checklist <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </section>
                                )}

                                {activities.length > 0 && (
                                    <section className="bg-background border border-secondary/15 rounded-sm p-6">
                                        <h2 className="text-sm font-extrabold tracking-widest uppercase flex items-center gap-2 mb-6">
                                            <MessageSquare className="w-5 h-5 text-paragraph" /> Recent Activity
                                        </h2>
                                        <div className="space-y-6 border-l border-secondary/20 ml-2 pl-4">
                                            {activities.map((act, i) => (
                                                <ActivityItem key={i} title={act.title} desc={act.desc} time={act.time} color={act.color} />
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    </>
                )}

            </main>
        </div>
    )
}


function MetricCard({ label, value, icon, highlightText }: { label: string, value: string, icon: React.ReactNode, highlightText?: string }) {
    return (
        <div className="bg-background border border-secondary/15 rounded-sm p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-sm bg-secondary/5 flex items-center justify-center border border-secondary/10">
                    {icon}
                </div>
                {highlightText && <span className="text-[10px] font-black text-background bg-headline px-2 py-0.5 rounded-sm uppercase tracking-tighter italic">{highlightText}</span>}
            </div>
            <div>
                <p className="text-[10px] font-black text-paragraph uppercase tracking-widest mb-1">{label}</p>
                <p className="text-xl font-black tracking-tight leading-none italic">{value}</p>
            </div>
        </div>
    )
}



function ShortlistCard({ name, price, image }: { name: string, price: string, image: string }) {
    return (
        <div className="bg-background border border-secondary/15 rounded-sm p-3 flex items-center gap-4 cursor-pointer">
            <div className="w-16 h-16 rounded-sm bg-secondary/5 overflow-hidden border border-secondary/10 shrink-0">
                <img src={image} alt={name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black truncate leading-tight uppercase tracking-tight">{name}</h4>
                <p className="text-[10px] font-black text-highlight">{price}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-paragraph" />
        </div>
    )
}

function ActivityItem({ title, desc, time, color }: { title: string, desc: string, time: string, color: string }) {
    return (
        <div className="relative">
            <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${color}`}></div>
            <p className="text-xs font-black text-headline mb-0.5 tracking-tight uppercase">{title}</p>
            <p className="text-[11px] font-bold text-paragraph mb-1.5 leading-relaxed">{desc}</p>
            <p className="text-[9px] font-black text-paragraph/40 uppercase tracking-widest italic">{time}</p>
        </div>
    )
}

import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { Home, Search, Heart, CalendarDays, CheckSquare, MessageSquare } from 'lucide-react'

export default function SeekerDashboard() {
    const { user } = useAuth()
    const { profile } = useProfile()
    const name = profile?.full_name ?? user?.email ?? 'there'

    return (
        <div className="bg-background text-headline animate-[fadeIn_0.25s_ease-out]">
            <main className="max-w-6xl mx-auto px-6 py-8">

                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-extrabold mb-1 tracking-tight">Welcome back, {name}</h1>
                        <p className="text-sm text-paragraph">You have 3 visits scheduled this week and 5 pending move-in tasks.</p>
                    </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <MetricCard label="Shortlisted" value="12 Properties" icon={<Heart className="w-5 h-5" />} highlightText="+2 new" />
                    <MetricCard label="Upcoming Visits" value="3 Scheduled" icon={<CalendarDays className="w-5 h-5 text-highlight" />} />
                    <MetricCard label="Move-in Tasks" value="5 Pending" icon={<CheckSquare className="w-5 h-5 text-tertiary" />} />
                    <MetricCard label="Documents" value="8 Uploaded" icon={<Search className="w-5 h-5" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Left Column (Wider) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Upcoming Visit Card */}
                        <section className="bg-background border-2 border-headline rounded-sm p-6 shadow-[4px_4px_0_theme(colors.secondary/10)]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-extrabold tracking-widest uppercase flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-highlight block animate-pulse"></span>
                                    Upcoming Visit
                                </h2>
                                <Link to="/seeker/visits" className="text-xs font-bold text-highlight hover:underline">View Calendar</Link>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-6 mb-8 border-b border-secondary/10 pb-6">
                                <div className="w-full sm:w-48 h-32 bg-secondary/5 rounded-sm overflow-hidden shrink-0 border border-secondary/10">
                                    <img src="/platform-visit.png" alt="Property" className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-lg font-bold">Emerald Gardens - Apt 4B</h3>
                                        <span className="text-[10px] font-bold text-highlight bg-highlight/10 px-2 py-0.5 rounded-sm uppercase tracking-wider">Scheduled</span>
                                    </div>
                                    <p className="text-sm text-paragraph mb-4 flex items-center gap-1.5">
                                        <Search className="w-3.5 h-3.5" /> 123 Green Valley, Silicon City
                                    </p>

                                    <div className="flex gap-6 text-sm font-semibold">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4 text-paragraph" /> Tomorrow, Oct 24
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckSquare className="w-4 h-4 text-paragraph" /> 10:30 AM
                                        </div>
                                    </div>
                                    <div className=" mt-4 bg-secondary/5 px-4 py-2 text-xs text-paragraph border border-secondary/10 rounded-sm">
                                        Agent <strong className="text-headline">Sarah Connor</strong> will meet you at the main gate.
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="relative">
                                <p className="text-[10px] font-bold text-paragraph/70 uppercase tracking-widest mb-4">Visit Status Timeline</p>
                                <div className="flex items-center justify-between relative px-4">
                                    <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-secondary/20 -translate-y-1/2 z-0"></div>
                                    <div className="absolute top-1/2 left-8 right-1/2 h-0.5 bg-highlight -translate-y-1/2 z-0"></div>

                                    <TimelineStep icon={<CheckSquare className="w-4 h-4" />} label="Requested" active />
                                    <TimelineStep icon={<CalendarDays className="w-4 h-4" />} label="Scheduled" active current />
                                    <TimelineStep icon={<Home className="w-4 h-4" />} label="Visited" />
                                </div>
                            </div>
                        </section>

                        {/* Shortlisted Properties */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-extrabold tracking-widest uppercase">Shortlisted Properties</h2>
                                <Link to="/seeker/shortlist" className="text-xs font-bold text-paragraph hover:text-headline transition-colors flex items-center gap-1">View All (12) <Search className="w-3 h-3" /></Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ShortlistCard name="Skyline View Residences" price="₹1,80,000/mo" image="/platform-discovery.png" />
                                <ShortlistCard name="The Pine District Studio" price="₹85,000/mo" image="/platform-movein.png" />
                            </div>
                        </section>

                    </div>

                    {/* Right Column (Narrower) */}
                    <div className="space-y-6">

                        {/* Tasks */}
                        <section className="bg-background border-2 border-headline rounded-sm p-6 shadow-[4px_4px_0_theme(colors.secondary/10)]">
                            <h2 className="text-sm font-extrabold tracking-widest uppercase flex items-center gap-2 mb-6">
                                <CheckSquare className="w-5 h-5 text-tertiary" /> Move-in Tasks
                            </h2>

                            <div className="mb-6">
                                <div className="flex justify-between text-xs font-semibold mb-2">
                                    <span className="text-paragraph">Overall Progress</span>
                                    <span className="text-highlight font-bold">60%</span>
                                </div>
                                <div className="h-2 w-full bg-secondary/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-highlight w-[60%]"></div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <TaskItem title="Upload ID Verification" completed />
                                <TaskItem title="Proof of Employment" completed />
                                <TaskItem title="Sign Digital Lease Agreement" active />
                                <TaskItem title="Pay Security Deposit" />
                                <TaskItem title="Submit Rental Reference" />
                            </div>

                            <Link to="/seeker/move-in" className="mt-6 block text-[10px] font-bold text-paragraph/70 uppercase tracking-widest hover:text-headline transition-colors">
                                Go to Task Center →
                            </Link>
                        </section>

                        {/* Activity Feed */}
                        <section className="bg-background border border-secondary/15 rounded-sm p-6">
                            <h2 className="text-sm font-extrabold tracking-widest uppercase flex items-center gap-2 mb-6">
                                <MessageSquare className="w-5 h-5 text-paragraph" /> Recent Activity
                            </h2>
                            <div className="space-y-6 border-l border-secondary/20 ml-2 pl-4">
                                <ActivityItem title="Visit scheduled" desc="Emerald Gardens visit confirmed for Oct 24." time="2 hours ago" color="bg-highlight" />
                                <ActivityItem title="Checklist completed" desc="You uploaded 'Proof of Employment'." time="Yesterday, 4:15 PM" color="bg-tertiary" />
                                <ActivityItem title="Ticket response received" desc="Agent Sarah replied to your query." time="Oct 21, 10:00 AM" color="bg-secondary" />
                            </div>
                        </section>

                    </div>
                </div>

            </main>
        </div>
    )
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function MetricCard({ label, value, icon, highlightText }: { label: string, value: string, icon: React.ReactNode, highlightText?: string }) {
    return (
        <div className="bg-background border-2 border-headline rounded-sm p-4 shadow-[3px_3px_0_theme(colors.secondary/10)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_theme(colors.secondary/15)] transition-all flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
                <div className="w-8 h-8 rounded-sm bg-secondary/5 flex items-center justify-center border border-secondary/10">
                    {icon}
                </div>
                {highlightText && <span className="text-[10px] font-bold text-highlight bg-highlight/10 px-2 py-0.5 rounded-sm">{highlightText}</span>}
            </div>
            <div>
                <p className="text-[10px] font-bold text-paragraph/70 uppercase tracking-widest">{label}</p>
                <p className="text-lg font-extrabold tracking-tight mt-0.5">{value}</p>
            </div>
        </div>
    )
}

function TimelineStep({ icon, label, active, current }: { icon: React.ReactNode, label: string, active?: boolean, current?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-2 z-10 bg-background px-2">
            <div className={`w-10 h-10 flex items-center justify-center rounded-sm border-2 ${active ? 'border-headline shadow-[3px_3px_0_theme(colors.headline)]' : 'border-secondary/20'} ${current ? 'bg-highlight/10 text-highlight' : (active ? 'bg-background text-headline' : 'bg-secondary/5 text-paragraph/40')}`}>
                {icon}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-headline' : 'text-paragraph/40'}`}>{label}</span>
        </div>
    )
}

function TaskItem({ title, completed, active }: { title: string, completed?: boolean, active?: boolean }) {
    return (
        <label className={`flex items-center gap-3 p-3 border rounded-sm cursor-pointer transition-colors ${active ? 'border-highlight/30 bg-highlight/5' : 'border-secondary/15 hover:bg-secondary/5'} ${completed ? 'opacity-60' : ''}`}>
            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${completed ? 'bg-highlight border-highlight' : 'border-secondary/30'}`}>
                {completed && <CheckSquare className="w-3 h-3 text-button-text" />}
            </div>
            <span className={`text-xs font-semibold flex-1 ${completed ? 'line-through text-paragraph' : 'text-headline'}`}>{title}</span>
            {active && <span className="text-[10px] font-bold text-highlight uppercase tracking-wider">→</span>}
        </label>
    )
}

function ShortlistCard({ name, price, image }: { name: string, price: string, image: string }) {
    return (
        <div className="border border-secondary/15 rounded-sm p-3 group hover:border-highlight/30 transition-colors bg-background">
            <div className="w-full h-32 bg-secondary/5 rounded-sm mb-3 overflow-hidden relative border border-secondary/10">
                <img src={image} alt={name} className="w-full h-full object-cover opacity-80 mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2 w-6 h-6 bg-background rounded-full flex items-center justify-center shadow-sm">
                    <Heart className="w-3.5 h-3.5 text-highlight fill-highlight" />
                </div>
                <div className="absolute bottom-2 left-2 bg-headline text-background text-[10px] font-bold px-2 py-1 rounded-sm tracking-wider">
                    {price}
                </div>
            </div>
            <h3 className="text-sm font-bold truncate">{name}</h3>
        </div>
    )
}

function ActivityItem({ title, desc, time, color }: { title: string, desc: string, time: string, color: string }) {
    return (
        <div className="relative">
            <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${color}`}></div>
            <p className="text-xs font-bold text-headline mb-0.5">{title}</p>
            <p className="text-[11px] text-paragraph mb-1.5">{desc}</p>
            <p className="text-[9px] text-paragraph/50 uppercase tracking-widest font-semibold">{time}</p>
        </div>
    )
}

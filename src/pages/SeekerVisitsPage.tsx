import { CalendarDays, MapPin, Clock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function SeekerVisitsPage() {
    const { user } = useAuth()
    const [visits, setVisits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')

    useEffect(() => {
        if (!user) return;

        async function fetchVisits() {
            setLoading(true)

            // 2. Fetch visits
            const { data, error } = await supabase
                .from('visits')
                .select(`
                    id,
                    status,
                    scheduled_at,
                    seeker_notes,
                    properties (
                        id,
                        title,
                        address,
                        city,
                        status,
                        property_images (url)
                    ),
                    landlord:properties(landlord_id) 
                `)
                .eq('seeker_id', user!.id)
                .order('scheduled_at', { ascending: false })

            if (error) {
                console.error("Error fetching visits:", error)
            } else if (data) {
                // Filter out visits for properties that are already rented (by anyone)
                const activeVisits = data.filter(v => (v.properties as any)?.status !== 'rented');
                setVisits(activeVisits)
            }
            setLoading(false)
        }

        fetchVisits()
    }, [user])

    // "upcoming" means requested or scheduled. "past" means anything else (visited, canceled, etc)
    const filteredVisits = visits.filter(v => {
        if (filter === 'upcoming') return v.status === 'requested' || v.status === 'scheduled';
        return v.status !== 'requested' && v.status !== 'scheduled';
    })

    const upcomingCount = visits.filter(v => v.status === 'requested' || v.status === 'scheduled').length;
    const pastCount = visits.filter(v => v.status !== 'requested' && v.status !== 'scheduled').length;

    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out]">

            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <h1 className="text-2xl font-extrabold mb-1 tracking-tight">My Visits</h1>
                    <p className="text-sm text-paragraph">Track your upcoming and past property viewings.</p>

                    {/* Status Filters */}
                    <div className="flex gap-4 mt-6 border-b border-secondary/10">
                        <button
                            onClick={() => setFilter('upcoming')}
                            className={`text-sm pb-2 border-b-2 px-1 transition-colors ${filter === 'upcoming' ? 'font-bold text-headline border-highlight' : 'font-semibold text-paragraph hover:text-headline border-transparent hover:border-secondary/20'}`}
                        >
                            Upcoming ({upcomingCount})
                        </button>
                        <button
                            onClick={() => setFilter('past')}
                            className={`text-sm pb-2 border-b-2 px-1 transition-colors ${filter === 'past' ? 'font-bold text-headline border-highlight' : 'font-semibold text-paragraph hover:text-headline border-transparent hover:border-secondary/20'}`}
                        >
                            Past ({pastCount})
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-sm text-paragraph font-semibold animate-pulse">Loading your visits...</div>
                ) : filteredVisits.length === 0 ? (
                    <div className="text-center py-20 border border-secondary/10 border-dashed rounded-sm bg-secondary/5">
                        <CalendarDays className="w-12 h-12 text-secondary/40 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-headline mb-2">No {filter} visits</h3>
                        <p className="text-sm text-paragraph mb-6">You don't have any {filter} property viewings at the moment.</p>
                        <Link to="/seeker/listings" className="text-xs font-black uppercase tracking-widest text-highlight hover:underline">
                            Browse Properties
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVisits.map(visit => {
                            const p = visit.properties;
                            if (!p) return null;

                            const imageUrl = p.property_images?.[0]?.url || '/platform-discovery.png';

                            // Extract time from notes fallback
                            let timeDisplay = "Time TBD";
                            const timeMatch = visit.seeker_notes?.match(/Preferred time: (.*)/);
                            if (timeMatch && timeMatch[1]) {
                                timeDisplay = timeMatch[1].split('(')[0].trim();
                            }

                            // Format Date
                            const dateObj = new Date(visit.scheduled_at);
                            const dateDisplay = isNaN(dateObj.getTime()) ? "Date TBD" : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                            return (
                                <div key={visit.id} className="group border border-secondary/15 rounded-sm p-4 bg-background hover:border-highlight/30 hover:shadow-md transition-all flex flex-col">

                                    <div className="w-full h-32 bg-secondary/5 rounded-sm mb-4 overflow-hidden relative border border-secondary/10">
                                        <img src={imageUrl} alt={p.title} className="w-full h-full object-cover mix-blend-multiply opacity-80 group-hover:scale-105 transition-transform duration-500" />

                                        <div className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm uppercase tracking-wider
                                            ${visit.status === 'scheduled' ? 'bg-highlight text-button-text' :
                                                visit.status === 'requested' ? 'bg-secondary text-background' :
                                                    visit.status === 'interested' ? 'bg-green-500 text-white' :
                                                        visit.status === 'not_interested' ? 'bg-red-500 text-white' :
                                                            'bg-tertiary text-headline'}`}>
                                            {visit.status.replace('_', ' ')}
                                        </div>
                                    </div>

                                    <div className="mb-4 flex-1">
                                        <h3 className="font-bold text-headline truncate mb-1">{p.title}</h3>
                                        <p className="text-xs text-paragraph truncate flex items-center gap-1.5 mb-3">
                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                            {p.address}, {p.city}
                                        </p>

                                        <div className="space-y-2 text-xs font-semibold text-paragraph/80">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="w-3.5 h-3.5 shrink-0" /> {dateDisplay}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 shrink-0" /> {timeDisplay}
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/seeker/visits/${visit.id}`}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-secondary/5 hover:bg-secondary/10 text-headline text-xs font-bold rounded-sm border border-secondary/20 transition-colors mt-auto"
                                    >
                                        View Details <ArrowRight className="w-3 h-3" />
                                    </Link>

                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}

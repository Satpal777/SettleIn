import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, ArrowLeft, MapPin, CalendarDays, Star, Home, BedDouble, CheckCircle2, AlertCircle, Clock, Send } from 'lucide-react'
import { supabase } from '../supabaseClient'

const SUPPORT_TICKETS = [
    {
        id: 'TKT-001',
        title: 'Query about pet policy',
        status: 'Resolved',
        date: 'Oct 21, 2026',
        lastMessage: 'Agent Sarah replied: Yes, small dogs are allowed with an additional deposit.',
        thread: [
            { id: 'm1', sender: 'seeker', text: 'Hi, are pets allowed here?', time: 'Oct 21, 10:00 AM' },
            { id: 'm2', sender: 'agent', name: 'Sarah Connor', text: 'Yes, small dogs are allowed with an additional deposit.', time: 'Oct 21, 11:30 AM' }
        ]
    },
    {
        id: 'TKT-002',
        title: 'Gym amenity access hours',
        status: 'Open',
        date: 'Oct 23, 2026',
        lastMessage: 'You asked: What are the exact timings for the building gym?',
        thread: [
            { id: 'm1', sender: 'seeker', text: 'What are the exact timings for the building gym?', time: 'Oct 23, 02:15 PM' }
        ]
    }
]

export default function SeekerVisitDetailsPage() {
    const { id } = useParams()
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
    const [visit, setVisit] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return;

        async function fetchVisit() {
            setLoading(true)
            const { data, error } = await supabase
                .from('visits')
                .select(`
                    *,
                    properties (
                        id,
                        title,
                        address,
                        city,
                        price,
                        bathrooms,
                        area_sqft,
                        property_type,
                        available_from,
                        property_images (url)
                    )
                `)
                .eq('id', id)
                .single()

            if (error) {
                console.error("Error fetching visit details:", error)
            } else if (data) {
                setVisit(data)
            }
            setLoading(false)
        }

        fetchVisit()
    }, [id])

    const activeTicket = SUPPORT_TICKETS.find(t => t.id === activeTicketId)

    if (loading) {
        return <div className="min-h-screen bg-background text-headline flex items-center justify-center font-semibold animate-pulse">Loading visit details...</div>
    }

    if (!visit || !visit.properties) {
        return (
            <div className="min-h-screen bg-background text-headline flex flex-col items-center justify-center p-6">
                <AlertCircle className="w-12 h-12 text-highlight mb-4" />
                <h1 className="text-2xl font-bold mb-2">Visit Not Found</h1>
                <p className="text-paragraph mb-6 text-sm">The visit request you're looking for doesn't exist.</p>
                <Link to="/seeker/visits" className="bg-highlight text-white px-6 py-2 rounded-sm font-bold shadow-sm transition-transform active:scale-95">Go Back</Link>
            </div>
        )
    }

    const p = visit.properties;
    const imageUrl = p.property_images?.[0]?.url || '/platform-visit.png';
    const availableDateDisplay = p.available_from ? new Date(p.available_from).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Immediately';

    // Formatting visit Date and Time
    const scheduledDateObj = new Date(visit.scheduled_at);
    const visitDateDisplay = isNaN(scheduledDateObj.getTime()) ? "Date TBD" : scheduledDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    let visitTimeDisplay = "Time TBD";
    const timeMatch = visit.seeker_notes?.match(/Preferred time: (.*)/);
    if (timeMatch && timeMatch[1]) {
        visitTimeDisplay = timeMatch[1].split('(')[0].trim();
    }

    return (
        <div className="bg-background text-headline min-h-screen pb-12 animate-[fadeIn_0.25s_ease-out]">

            {/* ── Breadcrumb Header ───────────────────────────────────────────── */}
            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-3">
                    <Link to="/seeker/visits" className="text-xs font-semibold text-paragraph hover:text-headline transition-colors flex items-center gap-1 w-fit">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to My Visits
                    </Link>

                    <div className="flex items-center gap-2 text-sm font-bold truncate">
                        <Link to="/seeker/visits" className="text-paragraph hover:text-headline transition-colors">My Visits</Link>
                        <ChevronRight className="w-4 h-4 text-paragraph/50 shrink-0" />
                        <span className="truncate">{p.title}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 mt-8 space-y-8">

                {/* ── Horizontal Property Details Card ────────────────────────── */}
                <section className="bg-background border-2 border-headline rounded-sm shadow-[4px_4px_0_var(--color-secondary/10)] flex flex-col md:flex-row overflow-hidden">

                    {/* Left side: Image */}
                    <div className="w-full md:w-2/5 h-64 md:h-auto bg-secondary/5 relative border-r border-secondary/10">
                        <img src={imageUrl} alt={p.title} className="w-full h-full object-cover mix-blend-multiply opacity-90" />

                        <div className={`absolute top-4 left-4 text-xs font-bold px-2 py-1 rounded-sm shadow-sm uppercase tracking-wider
                            ${visit.status === 'scheduled' ? 'bg-highlight text-button-text' :
                                visit.status === 'requested' ? 'bg-secondary text-background' :
                                    visit.status === 'interested' ? 'bg-green-500 text-white' :
                                        visit.status === 'not_interested' ? 'bg-red-500 text-white' :
                                            'bg-tertiary text-headline'}`}
                        >
                            {visit.status.replace('_', ' ')}
                        </div>
                    </div>

                    {/* Right side: Details */}
                    <div className="w-full md:w-3/5 p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between mb-2">
                                <h1 className="text-2xl font-extrabold tracking-tight">{p.title}</h1>
                                <div className="flex items-center gap-1 bg-secondary/5 px-2 py-1 rounded-sm border border-secondary/10 shrink-0">
                                    <Star className="w-3.5 h-3.5 text-highlight fill-highlight" />
                                    <span className="text-xs font-bold">New</span>
                                </div>
                            </div>

                            <p className="text-sm text-paragraph mb-6 flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 shrink-0" /> {p.address}, {p.city}
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                <div>
                                    <p className="text-[10px] font-bold text-paragraph/70 uppercase tracking-widest mb-1">Monthly</p>
                                    <p className="text-lg font-extrabold">₹{p.price?.toLocaleString() || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-paragraph/70 uppercase tracking-widest mb-1">Baths</p>
                                    <p className="text-sm font-bold flex items-center gap-1.5"><BedDouble className="w-4 h-4 text-paragraph" /> {p.bathrooms || 1}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-paragraph/70 uppercase tracking-widest mb-1">Type</p>
                                    <p className="text-sm font-bold flex items-center gap-1.5"><Home className="w-4 h-4 text-paragraph" /> {p.property_type || 'Property'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-paragraph/70 uppercase tracking-widest mb-1">Available</p>
                                    <p className="text-sm font-bold flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-paragraph" /> {availableDateDisplay}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-secondary/10">
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-paragraph/70 uppercase tracking-widest mb-1.5">{visit.status === 'requested' ? 'Requested For' : 'Visit Scheduled For'}</p>
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-highlight" /> {visitDateDisplay} at {visitTimeDisplay}
                                </p>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-paragraph/70 uppercase tracking-widest mb-1.5">Assigned Agent</p>
                                <div className="text-sm font-semibold flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 text-[10px] font-extrabold text-headline">
                                        L
                                    </div>
                                    Property Landlord
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Issues Raised / Support Tickets ─────────────────────────── */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-extrabold tracking-tight">Issues & Queries</h2>
                            <p className="text-xs text-paragraph mt-1">Support tickets raised for this property.</p>
                        </div>
                        {!activeTicketId && (
                            <button className="text-xs font-bold bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 text-headline px-4 py-2 rounded-sm transition-colors">
                                New Query
                            </button>
                        )}
                    </div>

                    {activeTicket ? (
                        /* ── Threaded View for Ticket ── */
                        <div className="bg-background border-2 border-headline rounded-sm shadow-[4px_4px_0_var(--color-secondary/10)] overflow-hidden flex flex-col h-[500px] animate-[fadeIn_0.2s_ease-out]">

                            {/* Thread Header */}
                            <div className="bg-secondary/5 border-b border-secondary/10 p-4 flex items-center gap-4">
                                <button
                                    onClick={() => setActiveTicketId(null)}
                                    className="w-8 h-8 flex shrink-0 items-center justify-center rounded-sm hover:bg-secondary/10 transition-colors border border-secondary/20"
                                >
                                    <ArrowLeft className="w-4 h-4 text-headline" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h2 className="text-sm font-bold truncate">{activeTicket.title}</h2>
                                        <span className={`text-[9px] shrink-0 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${activeTicket.status === 'Resolved' ? 'bg-tertiary/10 text-tertiary' : 'bg-highlight/10 text-highlight'}`}>
                                            {activeTicket.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-paragraph font-semibold">
                                        Ticket ID: {activeTicket.id}
                                    </p>
                                </div>
                            </div>

                            {/* Thread Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-secondary/5 bg-[radial-gradient(var(--color-secondary)_1px,transparent_1px)] bg-size-[20px_20px] opacity-[0.98]">
                                {activeTicket.thread.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'seeker' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] ${msg.sender === 'seeker' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>

                                            {msg.sender === 'agent' && (
                                                <span className="text-[10px] font-bold text-paragraph uppercase tracking-wider ml-1">{msg.name}</span>
                                            )}

                                            <div className={`p-4 rounded-sm border ${msg.sender === 'seeker'
                                                ? 'bg-headline text-background border-headline rounded-tr-none'
                                                : 'bg-background text-headline border-secondary/20 shadow-sm rounded-tl-none'
                                                }`}>
                                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                            </div>

                                            <span className={`text-[10px] font-bold text-paragraph/60 uppercase tracking-widest flex items-center gap-1 ${msg.sender === 'seeker' ? 'mr-1' : 'ml-1'}`}>
                                                <Clock className="w-3 h-3" /> {msg.time}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Thread Input Area */}
                            {activeTicket.status !== 'Resolved' ? (
                                <div className="p-4 bg-background border-t border-secondary/10 flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="Type your reply..."
                                        className="flex-1 bg-secondary/5 border border-secondary/20 rounded-sm px-4 py-2 text-sm focus:outline-none focus:border-highlight focus:ring-1 focus:ring-highlight transition-all"
                                    />
                                    <button className="bg-highlight hover:bg-highlight/90 text-button-text px-4 py-2 rounded-sm font-bold text-sm transition-colors flex items-center justify-center shadow-sm">
                                        <Send className="w-4 h-4 shrink-0" />
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 bg-background border-t border-secondary/10 text-center">
                                    <p className="text-sm text-paragraph font-semibold">This ticket is marked as resolved and closed for new replies.</p>
                                </div>
                            )}

                        </div>
                    ) : (
                        /* ── List View for Tickets ── */
                        <div className="space-y-4">
                            {SUPPORT_TICKETS.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setActiveTicketId(ticket.id)}
                                    className="bg-background border border-secondary/15 rounded-sm p-5 hover:border-headline/30 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="mt-0.5">
                                            {ticket.status === 'Resolved'
                                                ? <CheckCircle2 className="w-5 h-5 text-tertiary" />
                                                : <AlertCircle className="w-5 h-5 text-highlight" />}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="text-sm font-bold group-hover:underline text-headline">{ticket.title}</h3>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${ticket.status === 'Resolved' ? 'bg-tertiary/10 text-tertiary' : 'bg-highlight/10 text-highlight'}`}>
                                                    {ticket.status}
                                                </span>
                                                <span className="text-[10px] text-paragraph border border-secondary/20 px-1.5 py-0.5 rounded-sm">{ticket.id}</span>
                                            </div>
                                            <p className="text-xs text-paragraph/80 max-w-xl truncate mt-1">{ticket.lastMessage}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 sm:self-start">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-paragraph/60 flex items-center gap-1.5 justify-end">
                                            <Clock className="w-3 h-3" /> {ticket.date}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {SUPPORT_TICKETS.length === 0 && (
                                <div className="text-center p-8 border border-secondary/15 rounded-sm bg-secondary/5 border-dashed">
                                    <p className="text-sm font-semibold text-paragraph">No issues raised</p>
                                    <p className="text-xs text-paragraph/60 mt-1">Click "New Query" if you have questions before moving in.</p>
                                </div>
                            )}
                        </div>
                    )}
                </section>

            </main>
        </div>
    )
}

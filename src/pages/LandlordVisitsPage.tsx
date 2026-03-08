import { useState, useEffect } from 'react'
import { Calendar, Check, X, ArrowRight, AlertCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LandlordVisitsPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [visits, setVisits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'scheduled'>('all')

    useEffect(() => {
        if (!user) return;
        fetchVisits();
    }, [user])

    const fetchVisits = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('visits')
            .select(`
                id,
                status,
                scheduled_at,
                seeker_notes,
                seeker_id,
                properties!inner (
                    id,
                    title,
                    landlord_id,
                    status
                ),
                profiles!visits_seeker_id_fkey (
                    full_name
                )
            `)
            .eq('properties.landlord_id', user!.id)
            .order('scheduled_at', { ascending: false })

        // Fetch open tickets for this landlord
        const { data: ticketsData } = await supabase
            .from('tickets')
            .select('id, property_id, seeker_id')
            .eq('landlord_id', user!.id)
            .neq('status', 'resolved')

        if (error) {
            console.error("Error fetching landlord visits:", error)
        } else if (data) {
            let mappedVisits = data;
            if (ticketsData) {
                mappedVisits = data.map(v => {
                    const propId = Array.isArray(v.properties) ? v.properties[0]?.id : (v.properties as any)?.id;
                    const openTicket = ticketsData.find(t => t.property_id === propId && t.seeker_id === v.seeker_id);
                    return { ...v, openTicket };
                });
            }
            // Filter out visits for properties that are already rented
            const activeVisits = mappedVisits.filter(v => (v.properties as any)?.status !== 'rented');
            setVisits(activeVisits)
        }
        setLoading(false)
    }

    const handleStatusUpdate = async (visitId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('visits')
                .update({ status: newStatus })
                .eq('id', visitId);

            if (error) throw error;
            // Optimistically update
            setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status: newStatus } : v));
        } catch (err) {
            console.error("Failed to update status:", err);
            alert("Error updating visit status");
        }
    }

    const handleInitiateMoveIn = async (visit: any) => {
        try {
            const propertyId = visit.properties.id;
            const seekerId = visit.seeker_id;
            const landlordId = user!.id;

            // Check if one already exists
            const { data: existing } = await supabase
                .from('move_ins')
                .select('id')
                .eq('property_id', propertyId)
                .eq('seeker_id', seekerId)
                .single();

            if (existing) {
                navigate('/landlord/move-ins');
                return;
            }

            // Create new move in
            const { error } = await supabase
                .from('move_ins')
                .insert({
                    property_id: propertyId,
                    seeker_id: seekerId,
                    landlord_id: landlordId,
                    status: 'documents'
                });

            if (error) throw error;
            navigate('/landlord/move-ins');
        } catch (err) {
            console.error("Failed to initiate move in:", err);
            alert("Error initiating move in");
        }
    }

    const filteredVisits = visits.filter(v => {
        if (filter === 'all') return true;
        if (filter === 'pending') return v.status === 'requested';
        if (filter === 'scheduled') return v.status === 'scheduled';
        return true;
    });

    const pendingCount = visits.filter(v => v.status === 'requested').length;
    const scheduledCount = visits.filter(v => v.status === 'scheduled').length;

    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out]">
            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold mb-1 tracking-tight flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-paragraph" /> Visit Requests
                        </h1>
                        <p className="text-sm text-paragraph">Manage property viewings and requests.</p>
                    </div>
                </div>
            </header>
            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* ── Tabs ── */}
                <div className="flex gap-4 mb-6 border-b border-secondary/10">
                    <button
                        onClick={() => setFilter('all')}
                        className={`text-sm pb-2 border-b-2 px-1 transition-colors ${filter === 'all' ? 'font-bold text-headline border-highlight' : 'font-semibold text-paragraph hover:text-headline border-transparent hover:border-secondary/20'}`}
                    >
                        All Visits ({visits.length})
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`text-sm pb-2 border-b-2 px-1 transition-colors ${filter === 'pending' ? 'font-bold text-headline border-highlight' : 'font-semibold text-paragraph hover:text-headline border-transparent hover:border-secondary/20'}`}
                    >
                        Pending ({pendingCount})
                    </button>
                    <button
                        onClick={() => setFilter('scheduled')}
                        className={`text-sm pb-2 border-b-2 px-1 transition-colors ${filter === 'scheduled' ? 'font-bold text-headline border-highlight' : 'font-semibold text-paragraph hover:text-headline border-transparent hover:border-secondary/20'}`}
                    >
                        Scheduled ({scheduledCount})
                    </button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-sm text-paragraph font-semibold animate-pulse">Loading visits...</div>
                    ) : filteredVisits.length === 0 ? (
                        <div className="text-center py-16 border border-secondary/10 border-dashed rounded-sm bg-secondary/5">
                            <Calendar className="w-10 h-10 text-secondary/40 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-headline mb-1">No {filter !== 'all' ? filter : ''} requests</h3>
                            <p className="text-xs text-paragraph mb-0">You handle all your property visit requests here.</p>
                        </div>
                    ) : (
                        filteredVisits.map(visit => {
                            const p = visit.properties;
                            const seekerName = visit.profiles?.full_name || 'A Seeker';

                            // Extract time from notes
                            let timeDisplay = "Time TBD";
                            const timeMatch = visit.seeker_notes?.match(/Preferred time: (.*)/);
                            if (timeMatch && timeMatch[1]) {
                                timeDisplay = timeMatch[1].split('(')[0].trim();
                            }

                            // Format Date
                            const dateObj = new Date(visit.scheduled_at);
                            const dateDisplay = isNaN(dateObj.getTime()) ? "Date TBD" : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                            return (
                                <div key={visit.id} className="bg-background border border-secondary/15 rounded-sm p-5 hover:border-secondary/40 transition-colors shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                    <div>
                                        <h3 className="text-sm font-bold text-headline mb-1">{p?.title || 'Unknown Property'}</h3>
                                        <p className="text-xs text-paragraph mb-2">Requested by: <span className="font-semibold text-headline">{seekerName}</span></p>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm 
                                                ${visit.status === 'scheduled' ? 'bg-highlight/10 text-highlight' :
                                                    visit.status === 'requested' ? 'bg-tertiary/10 text-tertiary' :
                                                        visit.status === 'not_interested' ? 'bg-red-500/10 text-red-500' :
                                                            'bg-secondary/10 text-paragraph'}`}>
                                                {visit.status.replace('_', ' ')}
                                            </span>

                                            {visit.openTicket && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate('/landlord/tickets', { state: { ticketId: visit.openTicket.id } }) }}
                                                    className="text-[9px] font-bold text-highlight uppercase tracking-wider flex items-center gap-1 bg-highlight/10 px-1.5 py-0.5 rounded-sm border border-highlight/20 hover:bg-highlight/20 transition-colors"
                                                >
                                                    <AlertCircle className="w-3 h-3" /> Open Issue
                                                </button>
                                            )}

                                            {visit.status === 'requested' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleStatusUpdate(visit.id, 'scheduled')} className="text-[10px] font-bold text-highlight uppercase tracking-widest hover:underline flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Accept
                                                    </button>
                                                    <button onClick={() => handleStatusUpdate(visit.id, 'not_interested')} className="text-[10px] font-bold text-paragraph uppercase tracking-widest hover:text-red-500 hover:underline flex items-center gap-1">
                                                        <X className="w-3 h-3" /> Decline
                                                    </button>
                                                </div>
                                            )}
                                            {visit.status === 'scheduled' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleInitiateMoveIn(visit)} className="text-[10px] font-bold text-highlight uppercase tracking-widest hover:underline flex items-center gap-1">
                                                        Initiate Move-In <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-lg font-extrabold">{timeDisplay}</p>
                                        <p className="text-[10px] text-paragraph uppercase font-bold tracking-widest">{dateDisplay}</p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </main>
        </div>
    )
}

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { X, Check, XCircle, FileClock } from 'lucide-react'

interface StayExtension {
    id: string;
    requestDate: string;
    property: string;
    tenant: string;
    requestedUntil: string;
    status: string;
    reason: string | null;
    landlordNote: string | null;
}

export default function LandlordExtensionsPage() {
    const { user } = useAuth()
    const [extensions, setExtensions] = useState<StayExtension[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedExt, setSelectedExt] = useState<StayExtension | null>(null)
    const [landlordNote, setLandlordNote] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!user) return;
        fetchExtensions();
    }, [user])

    const fetchExtensions = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('stay_extensions')
                .select(`
                    id,
                    requested_until,
                    status,
                    reason,
                    landlord_note,
                    created_at,
                    seeker_id,
                    profiles!stay_extensions_seeker_id_fkey (
                        full_name
                    ),
                    move_ins!inner (
                        landlord_id,
                        properties (
                            title
                        )
                    )
                `)
                .eq('move_ins.landlord_id', user!.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            if (data) {
                const formatted: StayExtension[] = data.map((e: any) => ({
                    id: e.id,
                    requestDate: new Date(e.created_at).toLocaleDateString(),
                    property: e.move_ins?.properties?.title || 'Unknown Property',
                    tenant: e.profiles?.full_name || 'Unknown Tenant',
                    requestedUntil: new Date(e.requested_until).toLocaleDateString(),
                    status: e.status,
                    reason: e.reason,
                    landlordNote: e.landlord_note
                }))
                setExtensions(formatted)
            }
        } catch (err) {
            console.error("Error fetching extensions:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
        if (!selectedExt) return

        setSubmitting(true)
        try {
            const { error } = await supabase
                .from('stay_extensions')
                .update({
                    status,
                    landlord_note: landlordNote
                })
                .eq('id', selectedExt.id)

            if (error) throw error

            setSelectedExt(null)
            setLandlordNote('')
            await fetchExtensions()
        } catch (err: any) {
            console.error("Failed to update extension:", err)
            alert("Failed to update request: " + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out]">
            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold mb-1 tracking-tight flex items-center gap-2">
                            <FileClock className="w-6 h-6 text-paragraph" /> Extension Requests
                        </h1>
                        <p className="text-sm text-paragraph">Review and manage tenant stay extension requests.</p>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center py-12 font-bold text-paragraph animate-pulse">Loading extensions...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {extensions.map(ext => (
                            <div key={ext.id} className="bg-background border-2 border-headline/10 rounded-sm p-6 hover:border-highlight/30 transition-all shadow-sm flex flex-col justify-between gap-4 group">
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-black text-headline uppercase tracking-tight">{ext.property}</h3>
                                            <p className="text-xs text-paragraph">Tenant: <span className="font-bold text-headline">{ext.tenant}</span></p>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border-2 
                                            ${ext.status === 'pending' ? 'bg-secondary/5 border-secondary/20 text-paragraph' :
                                                ext.status === 'approved' ? 'bg-green-500/10 border-green-500/30 text-green-600' :
                                                    'bg-red-500/10 border-red-500/30 text-red-600'}`}>
                                            {ext.status}
                                        </span>
                                    </div>

                                    <div className="bg-secondary/5 p-4 rounded-sm border-2 border-secondary/10 mb-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] text-paragraph uppercase font-black tracking-widest mb-1">Requested Until</p>
                                                <p className="text-lg font-black text-highlight">{ext.requestedUntil}</p>
                                            </div>
                                            <p className="text-[10px] font-bold text-paragraph tracking-wider">Requested on: {ext.requestDate}</p>
                                        </div>
                                    </div>

                                    {ext.reason && (
                                        <div className="mb-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-paragraph mb-1">Tenant Reason</p>
                                            <p className="text-xs font-medium text-headline italic">" {ext.reason} "</p>
                                        </div>
                                    )}

                                    {ext.landlordNote && (
                                        <div className="p-3 bg-highlight/5 border-l-4 border-highlight rounded-sm">
                                            <p className="text-[10px] font-black uppercase text-highlight mb-1">Your Note</p>
                                            <p className="text-xs font-bold text-headline">{ext.landlordNote}</p>
                                        </div>
                                    )}
                                </div>

                                {ext.status === 'pending' && (
                                    <button
                                        onClick={() => setSelectedExt(ext)}
                                        className="w-full mt-4 py-3 bg-headline text-background font-black uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                    >
                                        Review Request
                                    </button>
                                )}
                            </div>
                        ))}

                        {extensions.length === 0 && (
                            <div className="col-span-full text-center py-20 border-4 border-dashed border-headline/5 rounded-sm bg-secondary/5">
                                <FileClock className="w-12 h-12 text-secondary/30 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-headline mb-2 uppercase tracking-tighter">No requests found</h3>
                                <p className="text-sm font-bold text-paragraph">Tenant extension requests will appear here once submitted.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Review Modal */}
            {selectedExt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-headline/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-background border-4 border-headline w-full max-w-lg p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
                        <button
                            onClick={() => setSelectedExt(null)}
                            className="absolute top-4 right-4 p-1 hover:bg-secondary/10 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Review Extension</h2>
                            <p className="text-sm font-bold text-paragraph">
                                <span className="text-highlight font-black">{selectedExt.tenant}</span> is requesting more time at <span className="font-black text-headline">{selectedExt.property}</span>
                            </p>
                        </div>

                        <div className="mb-8 p-4 bg-secondary/5 border-2 border-secondary/10 rounded-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-paragraph mb-1">Proposed Stay End</p>
                            <p className="text-xl font-black text-highlight">{selectedExt.requestedUntil}</p>
                        </div>

                        <div className="mb-8">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-paragraph mb-2">Add a Decision Note</label>
                            <textarea
                                placeholder="Explain your decision to the tenant..."
                                value={landlordNote}
                                onChange={(e) => setLandlordNote(e.target.value)}
                                className="w-full bg-background border-2 border-headline/20 p-4 rounded-sm font-bold focus:border-highlight outline-none transition-colors min-h-[120px] resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleUpdateStatus('rejected')}
                                disabled={submitting}
                                className="py-4 bg-red-500 text-white font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all border-2 border-black flex items-center justify-center gap-2"
                            >
                                <XCircle className="w-5 h-5" /> Reject
                            </button>
                            <button
                                onClick={() => handleUpdateStatus('approved')}
                                disabled={submitting}
                                className="py-4 bg-green-500 text-white font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all border-2 border-black flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" /> Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

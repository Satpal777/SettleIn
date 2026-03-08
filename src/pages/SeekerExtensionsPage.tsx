import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { X, FileClock, Plus } from 'lucide-react'

interface StayExtension {
    id: string;
    requestDate: string;
    property: string;
    requestedUntil: string;
    status: string;
    reason: string | null;
    landlordNote: string | null;
}

export default function SeekerExtensionsPage() {
    const { user } = useAuth()
    const [extensions, setExtensions] = useState<StayExtension[]>([])
    const [activeMoveIn, setActiveMoveIn] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [requestedUntil, setRequestedUntil] = useState('')
    const [reason, setReason] = useState('')

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Fetch active/completed move-in for this seeker
            const { data: moveInData } = await supabase
                .from('move_ins')
                .select('*, properties(*)')
                .eq('seeker_id', user!.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (moveInData) setActiveMoveIn(moveInData);

            // 2. Fetch extension requests
            const { data: extData, error } = await supabase
                .from('stay_extensions')
                .select(`
                    id,
                    requested_until,
                    status,
                    reason,
                    landlord_note,
                    created_at,
                    move_ins (
                        properties (
                            title
                        )
                    )
                `)
                .eq('seeker_id', user!.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            if (extData) {
                const formatted: StayExtension[] = extData.map((e: any) => ({
                    id: e.id,
                    requestDate: new Date(e.created_at).toLocaleDateString(),
                    property: e.move_ins?.properties?.title || 'Unknown Property',
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

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeMoveIn || !requestedUntil) return

        setSubmitting(true)
        try {
            const { error } = await supabase
                .from('stay_extensions')
                .insert({
                    move_in_id: activeMoveIn.id,
                    seeker_id: user!.id,
                    requested_until: requestedUntil,
                    reason: reason
                })

            if (error) throw error

            setShowRequestModal(false)
            setRequestedUntil('')
            setReason('')
            await fetchData()
        } catch (err: any) {
            console.error("Failed to submit extension:", err)
            alert("Failed to submit request: " + err.message)
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
                            <FileClock className="w-6 h-6 text-paragraph" /> Stay Extensions
                        </h1>
                        <p className="text-sm text-paragraph">Request additional time on your current stay.</p>
                    </div>
                    {activeMoveIn && (
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="bg-headline text-background font-bold px-4 py-2.5 rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm shrink-0"
                        >
                            <Plus className="w-4 h-4" /> Request Extension
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center py-12 font-bold text-paragraph animate-pulse">Loading extensions...</div>
                ) : (
                    <div className="space-y-4">
                        {extensions.map(ext => (
                            <div key={ext.id} className="bg-background border-2 border-headline/10 rounded-sm p-6 hover:border-highlight/30 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-headline mb-1 uppercase tracking-tight">{ext.property}</h3>
                                    <p className="text-xs text-paragraph mb-3">Requested on: <span className="font-bold text-headline">{ext.requestDate}</span></p>

                                    <div className="flex flex-wrap gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border-2 
                                            ${ext.status === 'pending' ? 'bg-secondary/5 border-secondary/20 text-paragraph' :
                                                ext.status === 'approved' ? 'bg-green-500/10 border-green-500/30 text-green-600' :
                                                    'bg-red-500/10 border-red-500/30 text-red-600'}`}>
                                            {ext.status}
                                        </span>
                                    </div>

                                    {ext.reason && (
                                        <p className="mt-4 text-xs font-medium text-paragraph/80 italic">" {ext.reason} "</p>
                                    )}

                                    {ext.landlordNote && (
                                        <div className="mt-4 p-3 bg-highlight/5 border-l-4 border-highlight rounded-sm">
                                            <p className="text-[10px] font-black uppercase text-highlight mb-1">Landlord Note</p>
                                            <p className="text-xs font-bold text-headline">{ext.landlordNote}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="text-left sm:text-right bg-secondary/5 p-4 rounded-sm border-2 border-secondary/10 min-w-[200px]">
                                    <p className="text-[10px] text-paragraph uppercase font-black tracking-widest mb-2">Requested Until</p>
                                    <div className="text-xl font-black text-highlight">
                                        {ext.requestedUntil}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {extensions.length === 0 && (
                            <div className="text-center py-20 border-4 border-dashed border-headline/5 rounded-sm bg-secondary/5">
                                <FileClock className="w-12 h-12 text-secondary/30 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-headline mb-2 uppercase tracking-tighter">No extension requests</h3>
                                <p className="text-sm font-bold text-paragraph mb-8 max-w-xs mx-auto">If your stay is ending soon, you can request more time here.</p>
                                {!activeMoveIn ? (
                                    <Link to="/seeker/listings" className="text-xs font-black uppercase tracking-widest text-highlight hover:underline decoration-2 underline-offset-4">
                                        Browse New Properties
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => setShowRequestModal(true)}
                                        className="text-xs font-black uppercase tracking-widest text-highlight hover:underline decoration-2 underline-offset-4"
                                    >
                                        Start Your First Request
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-headline/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-background border-4 border-headline w-full max-w-md p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        <button
                            onClick={() => setShowRequestModal(false)}
                            className="absolute top-4 right-4 p-1 hover:bg-secondary/10 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="mb-8">
                            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Request Extension</h2>
                            <p className="text-sm font-bold text-paragraph">Applying for more time at <span className="text-highlight font-black">{activeMoveIn?.properties?.title}</span></p>
                        </div>

                        <form onSubmit={handleSubmitRequest} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-paragraph mb-2">Extended Move-out Date</label>
                                <input
                                    type="date"
                                    required
                                    value={requestedUntil}
                                    onChange={(e) => setRequestedUntil(e.target.value)}
                                    className="w-full bg-background border-2 border-headline/20 p-3 rounded-sm font-bold focus:border-highlight outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-paragraph mb-2">Reason (Optional)</label>
                                <textarea
                                    placeholder="I need more time because..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-background border-2 border-headline/20 p-3 rounded-sm font-bold focus:border-highlight outline-none transition-colors min-h-[100px] resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-highlight text-button-text font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            >
                                {submitting ? 'Submitting...' : 'Send Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

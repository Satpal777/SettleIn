import { useState, useEffect } from 'react'
import { KeyRound, UploadCloud, CheckCircle, Check, Circle, FileText } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import ImageDialog from '../components/shared/ImageDialog'

export default function LandlordMoveInPage() {
    const { user } = useAuth()
    const [moveIns, setMoveIns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
    const [lightboxIndex, setLightboxIndex] = useState(0)
    const [lightboxImages, setLightboxImages] = useState<string[]>([])

    useEffect(() => {
        if (!user) return;
        fetchMoveIns();
    }, [user])

    const fetchMoveIns = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('move_ins')
            .select(`
                id,
                status,
                move_in_date,
                created_at,
                agreement_url,
                seeker_id,
                properties!inner (
                    id,
                    title
                ),
                profiles!move_ins_seeker_id_fkey (
                    full_name
                )
            `)
            .eq('landlord_id', user!.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Error fetching move ins:", error)
            setLoading(false)
            return
        }

        if (data && data.length > 0) {
            // Fetch all documents for these seekers (to account for common docs)
            const seekerIds = data.map(m => m.seeker_id)
            const { data: docsData } = await supabase
                .from('move_in_documents')
                .select('id, uploader_id, label, file_url')
                .in('uploader_id', seekerIds)

            const moveInsWithDocs = data.map(m => ({
                ...m,
                all_seeker_documents: docsData?.filter(d => d.uploader_id === m.seeker_id) || []
            }))
            setMoveIns(moveInsWithDocs)
        } else {
            setMoveIns([])
        }
        setLoading(false)
    }



    const handleAction = async (move: any) => {
        try {
            if (move.status === 'documents') {
                const { error } = await supabase
                    .from('move_ins')
                    .update({
                        status: 'agreement',
                        agreement_url: 'https://fake-storage.com/lease.pdf'
                    })
                    .eq('id', move.id);
                if (error) throw error;
            } else if (move.status === 'inventory') {
                const { error: moveInError } = await supabase
                    .from('move_ins')
                    .update({ status: 'complete' })
                    .eq('id', move.id);
                if (moveInError) throw moveInError;

                // Also unlist the property
                const { error: propError } = await supabase
                    .from('properties')
                    .update({ status: 'rented' })
                    .eq('id', move.properties.id);

                if (propError) console.error("Could not unlist property:", propError);
            }
            fetchMoveIns();
        } catch (err) {
            console.error("Action failed:", err);
            alert("Action failed to complete.");
        }
    }

    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out]">
            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold mb-1 tracking-tight flex items-center gap-2">
                            <KeyRound className="w-6 h-6 text-paragraph" /> Move-ins
                        </h1>
                        <p className="text-sm text-paragraph">Track tenant onboarding and move-in status.</p>
                    </div>
                </div>
            </header>
            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-sm text-paragraph font-semibold animate-pulse">Loading move-ins...</div>
                    ) : moveIns.length === 0 ? (
                        <div className="text-center py-16 border border-secondary/10 border-dashed rounded-sm bg-secondary/5">
                            <KeyRound className="w-10 h-10 text-secondary/40 mx-auto mb-3" />
                            <h3 className="text-base font-bold text-headline mb-1">No active move-ins</h3>
                            <p className="text-xs text-paragraph mb-0">Accept visiting seekers to begin the move-in process.</p>
                        </div>
                    ) : (
                        moveIns.map(move => {
                            const p = move.properties;
                            const tenantName = move.profiles?.full_name || 'A Tenant';
                            const dateObj = new Date(move.move_in_date || move.created_at);
                            const dateDisplay = isNaN(dateObj.getTime()) ? "TBD" : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                            const docCount = move.all_seeker_documents?.length || 0;
                            const docsDone = docCount >= 3;
                            const leaseDone = !!move.agreement_url;
                            const signedDone = move.status === 'inventory' || move.status === 'complete';
                            const finalizedDone = move.status === 'complete';

                            const steps = [
                                { label: 'Documents', done: docsDone },
                                { label: 'Lease Draft', done: leaseDone },
                                { label: 'Signed', done: signedDone },
                                { label: 'Finalized', done: finalizedDone }
                            ];

                            return (
                                <div key={move.id} className="bg-background border border-secondary/15 rounded-sm p-6 hover:border-secondary/40 transition-all shadow-sm flex flex-col gap-6 group">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-base font-bold text-headline mb-1">{p?.title || 'Unknown Property'}</h3>
                                            <p className="text-xs text-paragraph">Tenant: <span className="font-semibold text-headline">{tenantName}</span></p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-lg font-extrabold">{dateDisplay}</p>
                                            <p className="text-[10px] text-paragraph uppercase font-bold tracking-widest">Move-in Date</p>
                                        </div>
                                    </div>

                                    {/* Progress Tracker */}
                                    <div className="flex items-center justify-between relative py-2 mb-2">
                                        <div className="absolute top-12 left-0 right-0 h-0.5 bg-secondary/10 -translate-y-1/2 z-0 mx-8"></div>
                                        {steps.map((step, i) => (
                                            <div key={i} className="relative z-10 flex flex-col items-center gap-2 bg-background px-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${step.done ? 'bg-tertiary border-tertiary text-white shadow-sm' : 'bg-background border-secondary/20 text-paragraph'}`}>
                                                    {step.done ? <Check className="w-4 h-4" /> : <Circle className="w-3 h-3 fill-current opacity-30" />}
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${step.done ? 'text-tertiary' : 'text-paragraph'}`}>{step.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tenant Documents */}
                                    <div className="bg-secondary/5 border border-secondary/10 rounded-sm p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-paragraph">Tenant Documents</h4>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-background border border-secondary/10 rounded-sm">{docCount}/3</span>
                                        </div>
                                        {move.all_seeker_documents?.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {move.all_seeker_documents.map((doc: any) => (
                                                    <button
                                                        key={doc.id}
                                                        onClick={() => {
                                                            const urls = move.all_seeker_documents.map((d: any) => d.file_url);
                                                            const idx = move.all_seeker_documents.indexOf(doc);
                                                            setLightboxImages(urls);
                                                            setLightboxIndex(idx);
                                                            setIsImageDialogOpen(true);
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-background border border-secondary/15 rounded-sm hover:border-highlight transition-colors group/doc"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-paragraph group-hover/doc:text-highlight" />
                                                        <span className="text-[10px] font-bold capitalize text-headline">{doc.label.replace(/_/g, ' ')}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[10px] font-medium text-paragraph italic">No documents uploaded yet.</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-secondary/10 pt-4">
                                        <div className="flex items-center gap-2">
                                            {finalizedDone ? (
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary flex items-center gap-1.5">
                                                    <CheckCircle className="w-4 h-4" /> Process Completed
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-highlight flex items-center gap-1.5 opacity-80">
                                                    Next Milestone: {move.status === 'documents' ? (docsDone ? 'Generate Lease' : 'Tenant Documents') : move.status === 'agreement' ? 'Tenant Signature' : 'Final Confirmation'}
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            {move.status === 'documents' && (
                                                <button
                                                    onClick={() => handleAction(move)}
                                                    disabled={!docsDone}
                                                    className={`text-xs px-6 py-2.5 rounded-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${docsDone ? 'bg-highlight text-button-text hover:opacity-90 shadow-md active:scale-95' : 'bg-secondary/10 text-paragraph cursor-not-allowed opacity-60'}`}
                                                >
                                                    <UploadCloud className="w-4 h-4" /> {docsDone ? 'Draft Lease' : 'Awaiting Documents'}
                                                </button>
                                            )}
                                            {move.status === 'agreement' && (
                                                <button
                                                    disabled
                                                    className="text-xs bg-secondary/10 text-paragraph px-6 py-2.5 rounded-sm font-bold uppercase tracking-widest opacity-60 cursor-not-allowed flex items-center gap-2"
                                                >
                                                    <Circle className="w-4 h-4 animate-pulse" /> Awaiting Signature
                                                </button>
                                            )}
                                            {move.status === 'inventory' && (
                                                <button
                                                    onClick={() => handleAction(move)}
                                                    className="text-xs bg-tertiary text-white px-6 py-2.5 rounded-sm font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 hover:opacity-90 flex items-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" /> Confirm & Finalize
                                                </button>
                                            )}
                                            {move.status === 'complete' && (
                                                <button
                                                    disabled
                                                    className="text-xs bg-secondary/10 text-paragraph px-6 py-2.5 rounded-sm font-bold uppercase tracking-widest opacity-60"
                                                >
                                                    Closed
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </main>

            <ImageDialog
                isOpen={isImageDialogOpen}
                onClose={() => setIsImageDialogOpen(false)}
                images={lightboxImages}
                currentIndex={lightboxIndex}
                onIndexChange={setLightboxIndex}
            />
        </div>
    )
}

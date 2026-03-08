import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, FileText, PenTool, CheckSquare, UploadCloud, FileSearch, Home, PartyPopper, CalendarClock } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import ImageDialog from '../components/shared/ImageDialog'
import { Link } from 'react-router-dom'

export default function SeekerMoveInPage() {
    const { user } = useAuth()
    const [moveIn, setMoveIn] = useState<any>(null)
    const [documents, setDocuments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [uploadingLabel, setUploadingLabel] = useState<string | null>(null)
    const [signature, setSignature] = useState('')
    const [showSignModal, setShowSignModal] = useState(false)
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
    const [lightboxIndex, setLightboxIndex] = useState(0)
    const [lightboxImages, setLightboxImages] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user])

    const fetchData = async () => {
        setLoading(true)

        // Fetch active move_in
        const { data: moveInData } = await supabase
            .from('move_ins')
            .select('*, properties(*)')
            .eq('seeker_id', user!.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (moveInData) {
            setMoveIn(moveInData)
        }

        // Fetch user's documents (satisfies the "common" requirement across move-ins)
        const { data: docsData } = await supabase
            .from('move_in_documents')
            .select('*')
            .eq('uploader_id', user!.id)

        if (docsData) {
            setDocuments(docsData)
        }

        setLoading(false)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !uploadingLabel || !user) return

        setLoading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}/${uploadingLabel}_${Date.now()}.${fileExt}`

            // 1. Upload to Storage
            const { error: storageError } = await supabase.storage
                .from('move_in_files')
                .upload(filePath, file)

            if (storageError) throw storageError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('move_in_files')
                .getPublicUrl(filePath)

            // 3. Save to DB (linked to uploader, move_in optional for common docs)
            const { error: dbError } = await supabase
                .from('move_in_documents')
                .insert({
                    move_in_id: moveIn?.id || null,
                    uploader_id: user.id,
                    label: uploadingLabel,
                    file_url: publicUrl
                })

            if (dbError) throw dbError

            await fetchData()
        } catch (err: any) {
            console.error(err)
            alert("Upload failed: " + (err.message || 'Unknown error. Ensure you have run the migration and created the storage bucket.'))
        } finally {
            setLoading(false)
            setUploadingLabel(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleUploadClick = (label: string) => {
        setUploadingLabel(label)
        fileInputRef.current?.click()
    }

    const handleSignLease = async () => {
        if (!moveIn) return;
        if (!signature.trim()) {
            alert("Please enter your full name to sign.");
            return;
        }

        setLoading(true);
        console.log("Starting e-sign update for move_in:", moveIn.id);

        try {
            const { error: updateError } = await supabase.rpc('sign_lease', {
                target_move_in_id: moveIn.id
            });

            if (updateError) {
                console.error("Move-in sign_lease RPC failed:", updateError);
                throw updateError;
            }

            console.log("Move-in signed successfully via RPC");
            setShowSignModal(false);

            console.log("Refreshing data...");
            await fetchData();
            console.log("Data refresh complete");

        } catch (err: any) {
            console.error("Detailed e-sign error:", err);
            // Handle the generic "Failed to fetch" which is usually CORS or Network
            if (err.message === 'Failed to fetch') {
                alert("Network Error: Failed to connect to Supabase. This could be a CORS issue or your internet connection. Check the browser console for details.");
            } else {
                alert("Error signing lease: " + (err.message || "Unknown error"));
            }
        } finally {
            setLoading(false);
        }
    }

    // Dynamic Checklist Generation
    const hasGovId = documents.find(d => d.label === 'gov_id');
    const hasProofEmp = documents.find(d => d.label === 'proof_of_employment');
    const hasRentalRef = documents.find(d => d.label === 'rental_reference');

    const docsComplete = hasGovId && hasProofEmp && hasRentalRef;
    const isSigned = moveIn?.status === 'inventory' || moveIn?.status === 'complete';

    interface MoveInTask {
        id: string;
        title: string;
        status: 'completed' | 'active' | 'pending';
        date: string | null;
        action: (() => void) | null;
        actionText: string;
    }

    interface MoveInChecklist {
        category: string;
        icon: any;
        tasks: MoveInTask[];
    }

    const CHECKLIST: MoveInChecklist[] = [
        {
            category: 'Document Verification',
            icon: <ShieldCheck className="w-5 h-5" />,
            tasks: [
                {
                    id: '1', title: 'Upload Government ID',
                    status: hasGovId ? 'completed' : 'active',
                    date: hasGovId ? new Date(hasGovId.created_at).toLocaleDateString() : null,
                    action: hasGovId ? () => {
                        setLightboxImages([hasGovId.file_url]);
                        setLightboxIndex(0);
                        setIsImageDialogOpen(true);
                    } : () => handleUploadClick('gov_id'),
                    actionText: hasGovId ? 'View ID' : 'Upload ID'
                },
                {
                    id: '2', title: 'Upload Proof of Employment',
                    status: hasProofEmp ? 'completed' : 'active',
                    date: hasProofEmp ? new Date(hasProofEmp.created_at).toLocaleDateString() : null,
                    action: hasProofEmp ? () => {
                        setLightboxImages([hasProofEmp.file_url]);
                        setLightboxIndex(0);
                        setIsImageDialogOpen(true);
                    } : () => handleUploadClick('proof_of_employment'),
                    actionText: hasProofEmp ? 'View Proof' : 'Upload Proof'
                },
                {
                    id: '3', title: 'Submit Rental Reference',
                    status: hasRentalRef ? 'completed' : 'active',
                    date: hasRentalRef ? new Date(hasRentalRef.created_at).toLocaleDateString() : null,
                    action: hasRentalRef ? () => {
                        setLightboxImages([hasRentalRef.file_url]);
                        setLightboxIndex(0);
                        setIsImageDialogOpen(true);
                    } : () => handleUploadClick('rental_reference'),
                    actionText: hasRentalRef ? 'View Ref' : 'Upload Ref'
                }
            ]
        },
        {
            category: 'Lease Agreement',
            icon: <FileText className="w-5 h-5" />,
            tasks: [
                {
                    id: '4', title: 'Review Lease Terms',
                    status: (moveIn?.status === 'agreement' || isSigned) ? 'completed' : (docsComplete ? 'active' : 'pending'),
                    date: null,
                    action: moveIn?.agreement_url ? () => window.open(moveIn.agreement_url, '_blank') : null,
                    actionText: moveIn?.agreement_url ? 'View Agreement' : 'Awaiting Landlord'
                },
                {
                    id: '5', title: 'E-Sign Digital Agreement',
                    status: isSigned ? 'completed' : (moveIn?.status === 'agreement' ? 'active' : 'pending'),
                    date: null,
                    action: () => setShowSignModal(true), actionText: 'E-Sign Now'
                }
            ]
        }
    ]

    // Calculate global progress
    const allTasks = CHECKLIST.flatMap(c => c.tasks)
    const completedTasks = allTasks.filter(t => t.status === 'completed').length
    const progress = Math.round((completedTasks / allTasks.length) * 100)

    if (moveIn?.status === 'complete') {
        const p = moveIn.properties;
        return (
            <div className="bg-background text-headline min-h-screen flex flex-col items-center justify-center p-6 animate-[fadeIn_0.5s_ease-out]">
                <div className="max-w-md w-full bg-background border-4 border-highlight p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-highlight/10 rounded-full mb-6">
                        <PartyPopper className="w-10 h-10 text-highlight" />
                    </div>
                    <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">Welcome Home!</h1>
                    <p className="text-lg font-bold text-paragraph mb-6">
                        Your move-in to <span className="text-highlight">{(p as any)?.title}</span> is officially complete.
                    </p>
                    <div className="space-y-4">
                        <Link
                            to="/seeker/dashboard"
                            className="w-full block py-3 bg-highlight text-button-text font-black uppercase tracking-widest hover:opacity-90 transition-opacity border-2 border-black"
                        >
                            Go to Dashboard
                        </Link>
                        <Link
                            to="/seeker/extensions"
                            className="w-full flex items-center justify-center gap-2 py-3 bg-secondary/5 hover:bg-secondary/10 text-headline font-bold border-2 border-black transition-colors"
                        >
                            <CalendarClock className="w-5 h-5" /> Request Stay Extension
                        </Link>
                    </div>
                </div>
                <div className="mt-12 flex items-center gap-2 text-sm font-black text-paragraph uppercase tracking-widest">
                    <Home className="w-4 h-4" /> SettleIn Resident
                </div>
            </div>
        )
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-headline">Loading move-in details...</div>
    }

    if (!moveIn) {
        return (
            <div className="bg-background text-headline min-h-screen flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.25s_ease-out]">
                <ShieldCheck className="w-16 h-16 text-secondary/30 mb-4" />
                <h1 className="text-2xl font-extrabold mb-2 tracking-tight">No Active Move-ins</h1>
                <p className="text-sm text-paragraph mb-6 max-w-md">You don't have any ongoing move-in processes. Once a landlord initiates a move-in from your visit request, it will appear here.</p>
                <Link to="/seeker/visits" className="bg-highlight text-white font-bold px-6 py-2.5 rounded-sm active:scale-95 transition-transform shadow-sm">View My Visits</Link>
            </div>
        )
    }

    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out]">

            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-6 py-6 border-l-4 border-highlight">
                    <h1 className="text-2xl font-extrabold mb-1 tracking-tight">Move-in Checklist</h1>
                    <p className="text-sm text-paragraph font-bold">Property: <span className="text-headline">{moveIn.properties?.title || 'Unknown Property'}</span></p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">

                {/* ── Progress Card ─────────────────────────────────────────────── */}
                <section className="bg-background border-2 border-headline rounded-sm p-6 shadow-[4px_4px_0_var(--color-secondary/10)] mb-8">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h2 className="text-sm font-extrabold tracking-widest uppercase mb-1">Overall Progress</h2>
                            <p className="text-xs text-paragraph">{completedTasks} of {allTasks.length} tasks completed</p>
                        </div>
                        <span className="text-3xl font-extrabold text-highlight tracking-tight">{progress}%</span>
                    </div>

                    <div className="h-3 w-full bg-secondary/10 rounded-full overflow-hidden border border-secondary/20">
                        <div
                            className="h-full bg-highlight transition-all duration-1000 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute top-0 bottom-0 left-0 right-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-size-[1rem_1rem] animate-[stripes_1s_linear_infinite]"></div>
                        </div>
                    </div>
                </section>

                {/* ── Checklist Categories ──────────────────────────────────────── */}
                <div className="space-y-6">
                    {CHECKLIST.map((category, idx) => {
                        const isCategoryComplete = category.tasks.every(t => t.status === 'completed')

                        return (
                            <section key={idx} className={`bg-background border rounded-sm p-6 transition-colors ${isCategoryComplete ? 'border-tertiary/30 shadow-[3px_3px_0_var(--color-tertiary\/10)]' : 'border-secondary/15'}`}>

                                <h3 className="text-sm font-extrabold tracking-widest uppercase flex items-center gap-2 mb-6 text-headline">
                                    <span className={isCategoryComplete ? 'text-tertiary' : 'text-paragraph'}>{category.icon}</span>
                                    {category.category}
                                    {isCategoryComplete && <span className="ml-auto text-[10px] bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-sm">Done</span>}
                                </h3>

                                <div className="space-y-3">
                                    {category.tasks.map(task => (
                                        <div
                                            key={task.id}
                                            className={`flex items-center gap-4 p-4 border rounded-sm transition-all ${task.status === 'active' ? 'border-highlight shadow-sm bg-highlight/5' :
                                                task.status === 'completed' ? 'border-secondary/10 bg-background/50 opacity-60' :
                                                    'border-secondary/15 bg-background hover:bg-secondary/5'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${task.status === 'completed' ? 'bg-tertiary border-tertiary' :
                                                task.status === 'active' ? 'border-highlight bg-background' : 'border-secondary/30'
                                                }`}>
                                                {task.status === 'completed' && <CheckSquare className="w-3.5 h-3.5 text-button-text" />}
                                                {task.status === 'active' && <div className="w-2.5 h-2.5 bg-highlight rounded-sm"></div>}
                                            </div>

                                            <div className="flex-1">
                                                <span className={`text-sm font-bold block ${task.status === 'completed' ? 'line-through text-paragraph' : 'text-headline'}`}>
                                                    {task.title}
                                                </span>
                                                {task.date && <span className="text-[10px] text-paragraph uppercase tracking-wider font-semibold">Completed on {task.date}</span>}
                                            </div>

                                            {task.action && (
                                                <button
                                                    onClick={task.action}
                                                    className={`text-xs font-bold px-4 py-1.5 rounded-sm transition-all whitespace-nowrap flex items-center gap-1.5 shadow-sm active:scale-95 ${task.status === 'completed' ? 'bg-secondary/10 text-headline hover:bg-secondary/20' : 'bg-highlight text-button-text hover:opacity-90'
                                                        }`}
                                                >
                                                    {task.actionText.includes('View') ? <FileSearch className="w-3.5 h-3.5" /> :
                                                        task.title.includes('Upload') ? <UploadCloud className="w-3.5 h-3.5" /> :
                                                            <PenTool className="w-3.5 h-3.5" />}
                                                    {task.actionText}
                                                </button>
                                            )}
                                            {task.status === 'active' && !task.action && (
                                                <button disabled className="text-xs font-bold bg-secondary/10 text-paragraph px-4 py-1.5 rounded-sm whitespace-nowrap opacity-60 cursor-not-allowed">
                                                    {task.actionText}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )
                    })}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                />

                {/* E-Sign Modal */}
                {showSignModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-headline/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                        <div className="bg-background border-2 border-headline w-full max-w-md p-8 rounded-sm shadow-[8px_8px_0_var(--color-secondary)]">
                            <div className="flex items-center gap-3 mb-6">
                                <PenTool className="w-6 h-6 text-highlight" />
                                <h3 className="text-xl font-black tracking-tight text-headline uppercase">Digital Signature</h3>
                            </div>

                            <p className="text-sm text-paragraph mb-6 font-medium leading-relaxed">
                                By typing your name below, you agree to the terms of the lease agreement for
                                <span className="text-headline font-extrabold ml-1 uppercase">{moveIn.properties?.title}</span>.
                            </p>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-paragraph uppercase tracking-widest">Full Legal Name</label>
                                    <input
                                        type="text"
                                        placeholder="Type your name to sign"
                                        className="w-full bg-secondary/5 border-2 border-secondary/20 rounded-sm py-3 px-4 text-headline font-bold focus:outline-none focus:border-highlight transition-colors placeholder:font-normal placeholder:opacity-50"
                                        value={signature}
                                        onChange={(e) => setSignature(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowSignModal(false)}
                                        className="flex-1 px-6 py-3 border-2 border-secondary/20 text-headline font-bold uppercase tracking-widest text-xs rounded-sm hover:bg-secondary/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSignLease}
                                        disabled={!signature.trim()}
                                        className="flex-1 px-6 py-3 bg-highlight text-button-text font-bold uppercase tracking-widest text-xs rounded-sm shadow-[4px_4px_0_var(--color-headline)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                    >
                                        Sign & Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <ImageDialog
                    isOpen={isImageDialogOpen}
                    onClose={() => setIsImageDialogOpen(false)}
                    images={lightboxImages}
                    currentIndex={lightboxIndex}
                    onIndexChange={setLightboxIndex}
                />

            </main>
        </div>
    )
}

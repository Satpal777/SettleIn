import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, FileText, PenTool, CheckSquare, UploadCloud, FileSearch, Home, CalendarClock, BedDouble, ImageIcon, MapPin, Info } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import ImageDialog from '../components/shared/ImageDialog'
import { Link } from 'react-router-dom'

export default function SeekerMoveInPage() {
    const { user } = useAuth()
    const [moveIn, setMoveIn] = useState<any>(null)
    const [fullProperty, setFullProperty] = useState<any>(null)
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

            // If move-in is complete, fetch full property details including amenities/images
            if (moveInData.status === 'complete' || moveInData.status === 'inventory') {
                try {
                    const { data: propDetails, error: propError } = await supabase
                        .rpc('get_property_details', { pid: moveInData.property_id })
                        .single()

                    if (propError) throw propError
                    if (propDetails && (propDetails as any).property_data) {
                        const pd = (propDetails as any).property_data
                        setFullProperty({
                            ...pd,
                            gallery: pd.property_images?.map((img: any) => img.url) || [],
                            amenities: pd.property_amenities?.map((pa: any) => pa.amenities?.name).filter(Boolean) || []
                        })
                    }
                } catch (err) {
                    console.error("Error fetching full property details:", err)
                }
            }
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
                    action: () => {
                        const defaultDraft = supabase.storage.from('sampledraft').getPublicUrl('sample_rent_agreement_draft.pdf').data.publicUrl;
                        window.open(defaultDraft, '_blank');
                    },
                    actionText: 'View Agreement'
                },
                {
                    id: '5', title: 'E-Sign Digital Agreement',
                    status: isSigned ? 'completed' : (moveIn?.status === 'agreement' ? 'active' : 'pending'),
                    date: null,
                    action: moveIn?.status === 'agreement' ? () => setShowSignModal(true) : null,
                    actionText: isSigned ? 'Signed' : (moveIn?.status === 'agreement' ? 'E-Sign Now' : 'Awaiting Agreement')
                }
            ]
        }
    ]

    const allTasks = CHECKLIST.flatMap(c => c.tasks)
    const completedTasks = allTasks.filter(t => t.status === 'completed').length
    const progress = Math.round((completedTasks / allTasks.length) * 100)

    if (moveIn?.status === 'complete') {
        const p = fullProperty || moveIn.properties;
        return (
            <div className="bg-background text-headline min-h-screen flex flex-col animate-[fadeIn_0.5s_ease-out]">
                {/* Simplified Header */}
                <header className="px-6 py-8 border-b-2 border-secondary/10 bg-background mb-8">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black uppercase tracking-tighter">Welcome Home!</h1>
                                <span className="text-[10px] font-black bg-tertiary text-white px-2 py-0.5 rounded-sm uppercase tracking-widest">
                                    Move-in Complete
                                </span>
                            </div>
                            <p className="text-sm font-medium text-paragraph">
                                You've successfully moved into <span className="text-highlight font-bold">{(p as any)?.title}</span>
                            </p>
                        </div>
                        <Link to="/seeker/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-highlight text-button-text font-black uppercase tracking-widest text-xs border-2 border-headline shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all rounded-sm">
                            <Home className="w-4 h-4" /> Go to Dashboard
                        </Link>
                    </div>
                </header>

                <main className="max-w-5xl mx-auto w-full px-6 pb-20 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Side: Property Details */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Summary Section */}
                        <section>
                            <h2 className="text-xl font-black uppercase tracking-wider mb-6 pb-2 border-b-2 border-headline flex items-center gap-2">
                                <ImageIcon className="w-6 h-6 text-highlight" /> Property Details
                            </h2>

                            {/* Simple Gallery */}
                            {fullProperty?.gallery?.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                    {fullProperty.gallery.slice(0, 4).map((img: string, i: number) => (
                                        <div key={i}
                                            className="aspect-square bg-secondary/5 border-2 border-secondary/20 rounded-sm overflow-hidden cursor-pointer hover:border-highlight transition-colors"
                                            onClick={() => {
                                                setLightboxImages(fullProperty.gallery);
                                                setLightboxIndex(i);
                                                setIsImageDialogOpen(true);
                                            }}>
                                            <img src={img} alt="Property" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <MapPin className="w-5 h-5 text-highlight mt-1" />
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-paragraph mb-1">Address</h4>
                                            <p className="text-sm font-bold text-headline">
                                                {p?.address}, {p?.city}, {p?.state}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <BedDouble className="w-5 h-5 text-highlight mt-1" />
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-paragraph mb-1">Configuration</h4>
                                            <p className="text-sm font-bold text-headline">
                                                {p?.bedrooms ? `${p.bedrooms} BHK` : 'Studio'} • {p?.bathrooms || 0} Bathrooms
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-paragraph mb-1">Area</h4>
                                            <p className="text-sm font-bold text-headline">{p?.area_sqft ? `${p.area_sqft} sq.ft` : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-paragraph mb-1">Rent</h4>
                                            <p className="text-sm font-bold text-highlight">{p?.price ? `₹${p.price.toLocaleString()}/mo` : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <ShieldCheck className="w-5 h-5 text-highlight mt-1" />
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-paragraph mb-2">Key Amenities</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {fullProperty?.amenities?.map((a: string, i: number) => (
                                                    <span key={i} className="text-[10px] font-bold bg-secondary/5 px-2 py-1 rounded-sm border border-secondary/10 uppercase tracking-widest">
                                                        {a}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-secondary/5 p-6 rounded-sm border-2 border-secondary/10">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-paragraph mb-2">Description</h4>
                                <p className="text-sm font-medium text-paragraph leading-relaxed">
                                    {p?.description || "No description provided."}
                                </p>
                            </div>
                        </section>

                        {/* House Rules Section */}
                        {p?.house_rules && (
                            <section>
                                <h2 className="text-xl font-black uppercase tracking-wider mb-6 pb-2 border-b-2 border-headline flex items-center gap-2">
                                    <Info className="w-6 h-6 text-highlight" /> Living Guidelines
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(() => {
                                        let rulesArr: string[] = [];
                                        try {
                                            if (p.house_rules) {
                                                rulesArr = JSON.parse(p.house_rules);
                                                if (!Array.isArray(rulesArr)) rulesArr = [p.house_rules];
                                            }
                                        } catch (e) {
                                            rulesArr = p.house_rules.split('\n').filter(Boolean);
                                        }
                                        return rulesArr.map((rule: string, i: number) => (
                                            <div key={i} className="flex items-center gap-4 bg-background border-2 border-secondary/10 p-4 rounded-sm">
                                                <div className="w-2 h-2 bg-highlight rounded-full shrink-0"></div>
                                                <span className="text-sm font-bold text-headline">{rule}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Side: Move-in History & Quick Actions */}
                    <div className="space-y-8">
                        <section className="bg-background border-2 border-headline p-6 rounded-sm shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-highlight" /> Move-in Records
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-tertiary/5 border border-tertiary/20 rounded-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-paragraph uppercase tracking-widest">Lease Agreement</span>
                                        <span className="text-[10px] font-black text-tertiary uppercase">Signed</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const defaultDraft = supabase.storage.from('sampledraft').getPublicUrl('sample_rent_agreement_draft.pdf').data.publicUrl;
                                            window.open(defaultDraft, '_blank');
                                        }}
                                        className="w-full py-2 bg-background border-2 border-headline text-[10px] font-black uppercase tracking-widest hover:bg-secondary/5 transition-all"
                                    >
                                        View Agreement
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    {[
                                        { label: 'Government ID', status: hasGovId },
                                        { label: 'Employment Proof', status: hasProofEmp },
                                        { label: 'Rental Reference', status: hasRentalRef }
                                    ].map((doc, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-secondary/10 last:border-0">
                                            <span className="text-xs font-bold text-headline">{doc.label}</span>
                                            <CheckSquare className={`w-3.5 h-3.5 ${doc.status ? 'text-tertiary' : 'text-paragraph/10'}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="bg-background border-2 border-headline p-6 rounded-sm shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CalendarClock className="w-4 h-4 text-highlight" /> Management
                            </h3>
                            <p className="text-xs font-medium text-paragraph mb-6 leading-relaxed">
                                Manage your stay or request extensions directly from the extensions portal.
                            </p>
                            <Link
                                to="/seeker/extensions"
                                className="w-full flex items-center justify-center gap-2 py-3 bg-secondary/5 hover:bg-secondary/10 text-headline font-black uppercase tracking-widest text-xs border-2 border-headline shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all rounded-sm"
                            >
                                <CalendarClock className="w-4 h-4" /> Request Extension
                            </Link>
                        </section>
                    </div>
                </main>
            </div>
        )
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-headline">Loading move-in details...</div>
    }

    if (!moveIn) {
        return (
            <div className="bg-background text-headline min-h-screen flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.25s_ease-out]">
                <div className="w-24 h-24 bg-secondary/5 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck className="w-12 h-12 text-secondary/40" />
                </div>
                <h1 className="text-3xl font-black mb-3 tracking-tight">No Active Move-ins</h1>
                <p className="text-sm text-paragraph mb-8 max-w-md leading-relaxed font-medium">You don't have any ongoing move-in processes. Once a landlord approves your visit and initiates a move-in, your checklist will appear here.</p>
                <Link
                    to="/seeker/visits"
                    className="bg-highlight border-2 border-headline text-button-text font-black uppercase tracking-widest px-8 py-3.5 rounded-sm shadow-sm hover:-translate-y-px active:translate-y-px transition-all text-sm"
                >
                    View My Visits
                </Link>
            </div>
        )
    }

    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out]">

            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <h1 className="text-2xl font-extrabold mb-1 tracking-tight">Move-in Checklist</h1>
                    <p className="text-sm text-paragraph">Property: <span className="font-bold border border-secondary/20 bg-secondary/5 px-2 py-0.5 rounded-sm">{moveIn.properties?.title || 'Unknown Property'}</span></p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">

                <section className="bg-background border-2 border-headline rounded-sm p-6 lg:p-8 mb-10 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-highlight/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative z-10 flex justify-between items-end mb-5">
                        <div>
                            <h2 className="text-sm font-black tracking-widest uppercase mb-1">Overall Progress</h2>
                            <p className="text-xs text-paragraph font-semibold">{completedTasks} of {allTasks.length} tasks completed</p>
                        </div>
                        <span className="text-4xl font-black text-highlight tracking-tight drop-shadow-sm">{progress}%</span>
                    </div>

                    <div className="h-4 w-full bg-secondary/10 rounded-sm overflow-hidden border border-secondary/20 relative z-10 p-0.5">
                        <div
                            className="h-full bg-highlight transition-all duration-1000 ease-out relative rounded-sm"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-size-[1rem_1rem] animate-[stripes_1s_linear_infinite]"></div>
                        </div>
                    </div>
                </section>

                <div className="space-y-8">
                    {CHECKLIST.map((category, idx) => {
                        const isCategoryComplete = category.tasks.every(t => t.status === 'completed')

                        return (
                            <section key={idx} className={`bg-background border-2 rounded-sm p-6 lg:p-8 transition-all duration-300 ${isCategoryComplete ? 'border-tertiary opacity-90' : 'border-secondary/20 shadow-sm hover:border-headline/50'}`}>

                                <h3 className="text-base font-black tracking-widest uppercase flex items-center gap-3 mb-6 text-headline border-b border-secondary/10 pb-4">
                                    <div className={`p-2 rounded-sm ${isCategoryComplete ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary/10 text-paragraph'}`}>
                                        {category.icon}
                                    </div>
                                    {category.category}
                                    {isCategoryComplete && <span className="ml-auto text-[10px] uppercase font-bold tracking-widest bg-tertiary text-white border border-headline px-3 py-1 rounded-sm">Done</span>}
                                </h3>

                                <div className="space-y-4">
                                    {category.tasks.map(task => (
                                        <div
                                            key={task.id}
                                            className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 py-4 border-2 rounded-sm transition-all ${task.status === 'active' ? 'border-highlight bg-background' :
                                                task.status === 'completed' ? 'border-secondary/10 bg-secondary/5 opacity-70' :
                                                    'border-transparent bg-secondary/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors ${task.status === 'completed' ? 'bg-tertiary border-tertiary' :
                                                    task.status === 'active' ? 'border-highlight bg-background' : 'border-secondary/30 bg-background'
                                                    }`}>
                                                    {task.status === 'completed' && <CheckSquare className="w-4 h-4 text-white" />}
                                                    {task.status === 'active' && <div className="w-2.5 h-2.5 bg-highlight rounded-[1px] animate-pulse"></div>}
                                                </div>

                                                <div>
                                                    <span className={`text-sm block ${task.status === 'completed' ? 'line-through text-paragraph font-bold' : 'text-headline font-black'}`}>
                                                        {task.title}
                                                    </span>
                                                    {task.date && <span className="text-[10px] text-paragraph uppercase tracking-widest font-bold mt-0.5 block">Done: {task.date}</span>}
                                                </div>
                                            </div>

                                            <div className="mt-3 sm:mt-0 pl-10 sm:pl-0">
                                                {task.action ? (
                                                    <button
                                                        onClick={task.action}
                                                        className={`text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-sm transition-all whitespace-nowrap flex items-center justify-center gap-2 border-2 ${task.status === 'completed' ? 'bg-background border-secondary/20 text-paragraph hover:border-headline hover:text-headline' : 'bg-highlight border-headline text-button-text shadow-sm hover:-translate-y-px active:translate-y-px active:shadow-none'
                                                            }`}
                                                    >
                                                        {task.actionText.includes('View') ? <FileSearch className="w-4 h-4" /> :
                                                            task.title.includes('Upload') ? <UploadCloud className="w-4 h-4" /> :
                                                                <PenTool className="w-4 h-4" />}
                                                        {task.actionText}
                                                    </button>
                                                ) : (
                                                    <button disabled className="text-xs font-black uppercase tracking-widest bg-secondary/5 border-2 border-secondary/10 text-paragraph/40 px-5 py-2.5 rounded-sm whitespace-nowrap flex items-center justify-center gap-2 cursor-not-allowed">
                                                        {task.actionText === 'E-Sign Now' || task.actionText === 'Signed' || task.actionText === 'Awaiting Agreement' ? <PenTool className="w-4 h-4" /> : null}
                                                        {task.actionText}
                                                    </button>
                                                )}
                                            </div>
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
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-headline/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                        <div className="bg-background border-2 border-headline w-full max-w-md p-8 rounded-sm shadow-lg">
                            <div className="flex items-center gap-3 mb-6 border-b border-secondary/10 pb-4">
                                <div className="p-2 bg-highlight/10 rounded-sm">
                                    <PenTool className="w-6 h-6 text-highlight" />
                                </div>
                                <h3 className="text-xl font-black tracking-widest text-headline uppercase">Digital Signature</h3>
                            </div>

                            <p className="text-sm text-paragraph mb-6 font-medium leading-relaxed">
                                By typing your name below, you agree to the terms of the lease agreement for
                                <span className="text-headline font-black ml-1 uppercase bg-secondary/10 px-1 rounded-sm">{(moveIn.properties as any)?.title}</span>.
                            </p>

                            <div className="space-y-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-headline uppercase tracking-widest">Full Legal Name</label>
                                    <input
                                        type="text"
                                        placeholder="Type your name to sign"
                                        className="w-full bg-background border-2 border-headline rounded-sm py-3 px-4 text-headline font-bold focus:outline-none focus:border-highlight transition-all placeholder:font-normal placeholder:text-paragraph/40"
                                        value={signature}
                                        onChange={(e) => setSignature(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowSignModal(false)}
                                        className="flex-1 px-6 py-3 border-2 border-secondary/20 text-headline font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-sm hover:bg-secondary/10 hover:border-headline transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSignLease}
                                        disabled={!signature.trim()}
                                        className="flex-1 px-4 sm:px-6 py-3 bg-highlight text-button-text font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-sm shadow-sm active:translate-y-px border-2 border-headline transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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

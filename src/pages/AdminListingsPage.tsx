import { useState, useEffect } from 'react'
import { List, CheckCircle, XCircle, MapPin, IndianRupee, Home, ExternalLink, Image as ImageIcon, X } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface PendingProperty {
    id: string
    title: string
    description: string
    address: string
    city: string
    price: number
    bedrooms: number
    bathrooms: number
    area_sqft: number
    house_rules: string[]
    status: string
    created_at: string
    property_images: { url: string; is_cover: boolean }[]
}
export default function AdminListingsPage() {
    const [properties, setProperties] = useState<PendingProperty[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'review' | 'active' | 'rejected'>('review')
    const [selectedProp, setSelectedProp] = useState<PendingProperty | null>(null)

    useEffect(() => {
        fetchProperties()
    }, [activeTab])

    async function fetchProperties() {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .rpc('get_admin_listings')

            if (error) {
                console.error("Error fetching properties:", error)
            } else if (data) {
                // Filter by active tab in frontend and ensure consistency
                const filtered = (data as any[])
                    .filter(p => p.status === activeTab)
                    .map(p => ({
                        ...p,
                        title: p.title || p.name || 'Untitled Property',
                        property_images: p.property_images || []
                    }))
                setProperties(filtered as PendingProperty[])
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleStatusChange(id: string, newStatus: string) {
        const { error } = await supabase
            .from('properties')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) {
            alert("Failed to update status")
            console.error(error)
        } else {
            // Remove from local list to show immediate UI feedback
            setProperties(prev => prev.filter(p => p.id !== id))
            if (selectedProp?.id === id) {
                setSelectedProp(null)
            }
        }
    }

    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out]">
            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold mb-1 tracking-tight flex items-center gap-2">
                            <List className="w-6 h-6 text-paragraph" /> Listings Moderation
                        </h1>
                        <p className="text-sm text-paragraph">Review and approve new property submissions.</p>
                    </div>
                </div>
            </header>
            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* ── Tabs ── */}
                <div className="flex gap-4 mb-6 border-b border-secondary/10">
                    <button
                        onClick={() => setActiveTab('review')}
                        className={`text-sm font-bold pb-2 border-b-2 px-1 transition-colors ${activeTab === 'review' ? 'text-headline border-highlight' : 'text-paragraph border-transparent hover:text-headline hover:border-secondary/20'}`}
                    >
                        Pending Review
                    </button>
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`text-sm font-bold pb-2 border-b-2 px-1 transition-colors ${activeTab === 'active' ? 'text-headline border-highlight' : 'text-paragraph border-transparent hover:text-headline hover:border-secondary/20'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setActiveTab('rejected')}
                        className={`text-sm font-bold pb-2 border-b-2 px-1 transition-colors ${activeTab === 'rejected' ? 'text-headline border-highlight' : 'text-paragraph border-transparent hover:text-headline hover:border-secondary/20'}`}
                    >
                        Archived / Rejected
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20 text-paragraph font-bold">Loading...</div>
                ) : properties.length === 0 ? (
                    <div className="bg-secondary/5 rounded-sm border border-secondary/10 p-12 text-center text-sm">
                        <p className="text-secondary font-medium">All clear! No listings match this status.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {properties.map(prop => {
                            const coverImg = prop.property_images?.find(img => img.is_cover)?.url || prop.property_images?.[0]?.url

                            return (
                                <div key={prop.id} className="bg-background border border-secondary/15 rounded-sm overflow-hidden hover:border-secondary/40 transition-colors shadow-sm flex flex-col">
                                    <div className="h-48 bg-secondary/10 relative">
                                        {coverImg ? (
                                            <img src={coverImg} alt={prop.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-paragraph">
                                                <ImageIcon className="w-8 h-8 opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider text-headline shadow-sm">
                                            {prop.status}
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1">
                                        <h3 className="font-bold text-headline text-lg mb-1 truncate">{prop.title}</h3>
                                        <p className="text-xs text-paragraph flex items-center gap-1.5 mb-4">
                                            <MapPin className="w-3.5 h-3.5" /> {prop.address}, {prop.city}
                                        </p>

                                        <div className="grid grid-cols-2 gap-3 mb-4 text-sm bg-secondary/5 p-3 rounded-sm border border-secondary/10">
                                            <div className="flex items-center gap-2 font-semibold text-headline">
                                                <IndianRupee className="w-4 h-4 text-paragraph" /> ${prop.price}/mo
                                            </div>
                                            <div className="flex items-center gap-2 font-semibold text-headline">
                                                <Home className="w-4 h-4 text-paragraph" /> {prop.bedrooms} Bed{prop.bedrooms > 1 ? 's' : ''}
                                            </div>
                                        </div>

                                        <div className="text-[10px] text-paragraph font-mono mb-2">
                                            Submitted: {new Date(prop.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="mt-auto px-5 pb-5">
                                        <button
                                            onClick={() => setSelectedProp(prop)}
                                            className="w-full py-2.5 bg-secondary/5 hover:bg-secondary/10 border border-secondary/20 rounded-sm text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> Review Property
                                        </button>
                                    </div>

                                    {activeTab === 'review' && (
                                        <div className="flex border-t border-secondary/10 bg-secondary/5">
                                            <button
                                                onClick={() => handleStatusChange(prop.id, 'rejected')}
                                                className="flex-1 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 flex justify-center items-center gap-1.5 transition-colors border-r border-secondary/10"
                                            >
                                                <XCircle className="w-4 h-4" /> Reject
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(prop.id, 'active')}
                                                className="flex-1 py-3 text-xs font-bold text-highlight hover:bg-highlight/10 flex justify-center items-center gap-1.5 transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Approve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* Modal for Inline Review */}
            {selectedProp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-background border border-secondary/20 shadow-2xl rounded-sm w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-[slideInUp_0.3s_ease-out]">
                        <button
                            onClick={() => setSelectedProp(null)}
                            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-background border border-secondary/20 rounded-sm text-paragraph hover:text-headline transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Cover Image */}
                        <div className="h-64 bg-secondary/10 relative">
                            {selectedProp.property_images?.find(img => img.is_cover)?.url || selectedProp.property_images?.[0]?.url ? (
                                <img src={selectedProp.property_images?.find(img => img.is_cover)?.url || selectedProp.property_images?.[0]?.url} alt={selectedProp.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-paragraph flex-col gap-2">
                                    <ImageIcon className="w-12 h-12 opacity-30" />
                                    <span className="text-sm font-bold opacity-50">No Images Provided</span>
                                </div>
                            )}
                        </div>

                        <div className="p-8">
                            <h2 className="text-3xl font-extrabold tracking-tight mb-2">{selectedProp.title}</h2>
                            <p className="text-sm font-semibold text-paragraph flex items-center gap-1.5 mb-8">
                                <MapPin className="w-4 h-4" /> {selectedProp.address}, {selectedProp.city}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 space-y-8">
                                    <section>
                                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-headline mb-3 border-b border-secondary/10 pb-2">Description</h3>
                                        <p className="text-sm text-paragraph leading-relaxed whitespace-pre-wrap">
                                            {selectedProp.description || "No description provided."}
                                        </p>
                                    </section>

                                    <section>
                                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-headline mb-3 border-b border-secondary/10 pb-2">House Rules</h3>
                                        {selectedProp.house_rules && selectedProp.house_rules.length > 0 ? (
                                            <ul className="space-y-2 text-sm text-paragraph">
                                                {selectedProp.house_rules.map((rule, idx) => (
                                                    <li key={idx} className="flex gap-2">
                                                        <span className="text-highlight font-bold">•</span> {rule}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-paragraph italic">No specific house rules documented.</p>
                                        )}
                                    </section>
                                </div>

                                <div className="md:col-span-1 space-y-4">
                                    <div className="bg-secondary/5 border border-secondary/15 rounded-sm p-5 flex flex-col gap-4">
                                        <div>
                                            <p className="text-xs text-paragraph font-semibold uppercase tracking-widest mb-1">Monthly Rent</p>
                                            <p className="text-2xl font-extrabold text-highlight">${selectedProp.price.toLocaleString()}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-secondary/10">
                                            <div>
                                                <p className="text-xs text-paragraph font-semibold">Bedrooms</p>
                                                <p className="font-bold text-headline">{selectedProp.bedrooms}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-paragraph font-semibold">Bathrooms</p>
                                                <p className="font-bold text-headline">{selectedProp.bathrooms}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-paragraph font-semibold">Area SqFt</p>
                                                <p className="font-bold text-headline">{selectedProp.area_sqft || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {activeTab === 'review' && (
                                        <div className="flex flex-col gap-2 mt-4">
                                            <button
                                                onClick={() => handleStatusChange(selectedProp.id, 'active')}
                                                className="w-full py-3 bg-highlight text-white text-sm font-bold rounded-sm hover:-translate-y-px transition-all shadow-sm flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Approve Listing
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(selectedProp.id, 'rejected')}
                                                className="w-full py-3 bg-red-500/10 text-red-500 text-sm font-bold rounded-sm hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

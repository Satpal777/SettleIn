import { useState, useEffect } from 'react'
import { Home, Plus, ChevronRight, MapPin, BedDouble, Ruler, FileText, ShieldCheck, Calendar, Users, Edit, XCircle, CheckCircle2, ArrowLeft, Loader2, AlertTriangle, AlertCircle, LayoutGrid, LayoutList, List, Map as MapIcon } from 'lucide-react'
import PropertyMap from '../components/shared/PropertyMap'
import ImageDialog from '../components/shared/ImageDialog'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import type { Property } from '../types/property'

type Tab = 'all' | 'active' | 'review'

export default function LandlordListingsPage() {
    const { user } = useAuth()

    // Core states
    const [listings, setListings] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<Tab>('all')
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

    // UI states
    const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid')
    const [isMapView, setIsMapView] = useState(false)
    const [activePropertyId, setActivePropertyId] = useState<string | null>(null)
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
    const [lightboxIndex, setLightboxIndex] = useState(0)

    useEffect(() => {
        if (!user) return
        fetchListings()
    }, [user])

    async function fetchListings() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .rpc('get_landlord_listings', { l_id: user!.id })

            if (error) throw error
            if (data) {
                // Fetch all visits for these properties to calculate unique interest
                const { data: visitsData } = await supabase
                    .from('visits')
                    .select('property_id, seeker_id')
                    .in('property_id', (data as any[]).map(p => p.id))

                const mapped = (data as any[]).map((p: any) => {
                    // Count unique seekers for this specific property
                    const uniqueSeekers = new Set(
                        visitsData?.filter(v => v.property_id === p.id).map(v => v.seeker_id)
                    ).size

                    return {
                        ...p,
                        title: p.title || p.name || 'Untitled Property',
                        city: p.city || (p.location && typeof p.location === 'string' && !p.location.startsWith('0101') ? p.location.split(',')[0].trim() : (p.address ? p.address.split(',')[0].trim() : 'Unknown City')),
                        address: p.address || (p.location && typeof p.location === 'string' && !p.location.startsWith('0101') ? p.location : 'Address not available'),
                        available_from: p.available_from || p.availableDate,
                        property_images: p.property_images || (p.image ? [{ url: p.image, is_cover: true }] : []),
                        rating: p.rating || 4.8,
                        image: p.image || (p.property_images?.[0]?.url) || '/platform-discovery.png',
                        interested_count: uniqueSeekers
                    }
                })
                setListings(mapped as any[])
            }
        } catch (err) {
            console.error("Error fetching listings:", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredListings = listings.filter(l => {
        if (activeTab === 'all') return true
        return l.status === activeTab
    })

    const counts = {
        all: listings.length,
        active: listings.filter(l => l.status === 'active').length,
        review: listings.filter(l => l.status === 'review').length
    }

    const handleBackToList = () => {
        setSelectedProperty(null)
    }

    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out] flex flex-col">
            {/* ── Header ── */}
            <header className="border-b border-secondary/10 bg-background sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        {selectedProperty ? (
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleBackToList}
                                    className="p-2.5 bg-secondary/5 hover:bg-secondary/10 border border-secondary/10 rounded-full transition-all group"
                                    title="Back to Listings"
                                >
                                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-extrabold tracking-tight">{selectedProperty.title}</h1>
                                    <p className="text-sm text-paragraph flex items-center gap-1.5 mt-0.5">
                                        <MapPin className="w-3.5 h-3.5" /> {selectedProperty.address}, {selectedProperty.city}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-2xl font-extrabold tracking-tight">My Listings</h1>
                                <p className="text-sm text-paragraph mt-1">Review and manage your property submissions.</p>
                            </>
                        )}
                    </div>

                    {!selectedProperty && (
                        <Link
                            to="/landlord/listings/new"
                            className="bg-highlight text-white px-5 py-2.5 rounded-sm text-sm font-bold flex items-center gap-2 hover:-translate-y-px transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Add Listing
                        </Link>
                    )}
                </div>
            </header>

            <main className={`max-w-7xl mx-auto px-6 py-8 flex-1 w-full ${isMapView && !selectedProperty ? 'flex gap-6 h-[calc(100vh-200px)] min-h-[600px] overflow-hidden' : ''}`}>
                {selectedProperty ? (
                    /* ── Unified Detail View (Matches Seeker Layout) ── */
                    <div className="animate-[fadeIn_0.3s_ease-out] space-y-8">
                        {/* Title & Essentials */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight mb-2">{selectedProperty.title}</h1>
                                <p className="text-sm text-paragraph flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 shrink-0" /> {selectedProperty.address}, {selectedProperty.city}
                                </p>
                            </div>
                            <div className="flex flex-col md:items-end">
                                <p className="text-3xl font-extrabold tracking-tight text-highlight">₹{selectedProperty.price.toLocaleString()} <span className="text-sm text-paragraph font-semibold">/mo</span></p>
                                <p className="text-xs font-bold text-tertiary bg-tertiary/10 px-2 py-1 rounded-sm uppercase tracking-wider mt-2 w-max">
                                    Available {new Date(selectedProperty.available_from || selectedProperty.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Gallery */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="md:col-span-3 h-64 md:h-96 bg-secondary/10 rounded-sm overflow-hidden border border-secondary/15 relative group cursor-pointer"
                                onClick={() => {
                                    const images = selectedProperty.property_images?.map(img => img.url) || []
                                    const currentUrl = (selectedProperty as any).currentImage || (selectedProperty.property_images?.find(img => img.is_cover)?.url || selectedProperty.property_images?.[0]?.url)
                                    const index = images.indexOf(currentUrl)
                                    setLightboxIndex(index >= 0 ? index : 0)
                                    setIsImageDialogOpen(true)
                                }}
                            >
                                {selectedProperty.property_images && selectedProperty.property_images.length > 0 ? (
                                    <img
                                        src={((selectedProperty as any).currentImage) || (selectedProperty.property_images.find(img => img.is_cover)?.url || selectedProperty.property_images[0].url)}
                                        alt={selectedProperty.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-10">
                                        <Home className="w-20 h-20" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <StatusBadge status={selectedProperty.status} large />
                                </div>
                            </div>
                            <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                                {selectedProperty.property_images?.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedProperty({ ...selectedProperty, currentImage: img.url } as any)}
                                        className={`shrink-0 w-24 md:w-full h-24 md:h-[116px] rounded-sm overflow-hidden border-2 transition-all ${((selectedProperty as any).currentImage || selectedProperty.property_images?.find(img => img.is_cover)?.url || selectedProperty.property_images?.[0]?.url) === img.url ? 'border-highlight shadow-sm' : 'border-secondary/10 hover:border-highlight/50'}`}
                                    >
                                        <img src={img.url} alt="Gallery thumbnail" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2-Column Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Left: Info */}
                            <div className="lg:col-span-2 space-y-10">
                                {/* Key Stats */}
                                <div className="flex flex-wrap gap-8 py-6 border-y border-secondary/10">
                                    <div className="flex items-center gap-3">
                                        <BedDouble className="w-5 h-5 text-highlight" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-paragraph tracking-widest leading-none mb-1">Bedrooms</span>
                                            <span className="text-sm font-black">{selectedProperty.bedrooms} Units</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Ruler className="w-5 h-5 text-highlight" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-paragraph tracking-widest leading-none mb-1">Square Area</span>
                                            <span className="text-sm font-black">{selectedProperty.area_sqft || '—'} sq.ft</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-highlight" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-paragraph tracking-widest leading-none mb-1">Available From</span>
                                            <span className="text-sm font-black uppercase">{new Date(selectedProperty.available_from || selectedProperty.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-highlight" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-paragraph tracking-widest leading-none mb-1">Seeker Interest</span>
                                            <span className="text-sm font-black">{selectedProperty.interested_count || 0} Unique Seekers</span>
                                        </div>
                                    </div>
                                </div>

                                <section>
                                    <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-highlight" /> About this property
                                    </h2>
                                    <p className="text-sm text-headline font-medium leading-relaxed bg-secondary/2 p-6 rounded-sm border border-secondary/10 shadow-sm whitespace-pre-wrap">
                                        {selectedProperty.description || "No description provided."}
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                                        <ShieldCheck className="w-5 h-5 text-highlight" /> Property Rules
                                    </h2>
                                    {(() => {
                                        let rules: string[] = [];
                                        try {
                                            rules = typeof selectedProperty.house_rules === 'string'
                                                ? JSON.parse(selectedProperty.house_rules)
                                                : (Array.isArray(selectedProperty.house_rules) ? selectedProperty.house_rules : []);
                                        } catch (e) {
                                            rules = [];
                                        }
                                        return rules && rules.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {rules.map((rule, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-4 bg-background border border-secondary/15 rounded-sm hover:border-secondary/40 transition-colors shadow-sm">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                        <span className="text-sm font-semibold text-headline">{rule}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm italic text-paragraph/60 bg-secondary/5 p-4 rounded-sm border border-dashed border-secondary/10 w-full col-span-2">No custom rules specified.</p>
                                        );
                                    })()}
                                </section>

                                <section>
                                    <h2 className="text-lg font-black uppercase tracking-tight mb-4">Amenities</h2>
                                    {selectedProperty.property_amenities && selectedProperty.property_amenities.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                                            {selectedProperty.property_amenities.map(item => (
                                                <div key={(item as any).amenities.name} className="flex items-center gap-2.5 text-sm font-bold text-headline">
                                                    <CheckCircle2 className="w-4 h-4 text-highlight" />
                                                    {(item as any).amenities.name}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-paragraph italic">No amenities specified.</p>
                                    )}
                                </section>

                                {/* Location / Map */}
                                <section>
                                    <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-highlight" /> Location
                                    </h2>
                                    <p className="text-sm font-bold text-paragraph mb-4">{selectedProperty.address}, {selectedProperty.city}</p>
                                    {selectedProperty.lat && selectedProperty.lng ? (
                                        <div className="h-80 border border-secondary/20 rounded-sm overflow-hidden shadow-sm">
                                            <PropertyMap
                                                interactive={false}
                                                markers={[{
                                                    id: selectedProperty.id,
                                                    lat: selectedProperty.lat,
                                                    lng: selectedProperty.lng,
                                                    price: selectedProperty.price,
                                                    title: selectedProperty.title,
                                                    image: selectedProperty.property_images?.[0]?.url
                                                }]}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-40 border border-secondary/20 rounded-sm flex items-center justify-center bg-secondary/5 border-dashed">
                                            <span className="text-sm font-bold text-paragraph opacity-40">Location Coordinates Unavailable</span>
                                        </div>
                                    )}
                                </section>
                            </div>

                            {/* Right: Management Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="bg-background border-2 border-headline rounded-sm p-6 shadow-sm sticky top-28">
                                    <h3 className="font-extrabold text-xl mb-2">Property Management</h3>
                                    <p className="text-sm text-paragraph mb-6">Manage your listing's visibility and details.</p>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-secondary/5 border border-secondary/10 rounded-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-bold text-paragraph uppercase tracking-widest">Current Status</span>
                                                <span className="text-xs font-black text-highlight uppercase">{selectedProperty.status}</span>
                                            </div>
                                            <p className="text-[10px] text-paragraph uppercase tracking-tighter">Visible to public: {selectedProperty.status === 'active' ? 'Yes' : 'No'}</p>
                                        </div>

                                        <button className="w-full bg-highlight text-white font-bold text-sm py-3.5 rounded-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all shadow-sm">
                                            <Edit className="w-4 h-4" /> Edit Details
                                        </button>
                                        <button className="w-full bg-background border border-rose-500/30 text-rose-500 font-bold text-sm py-3.5 rounded-sm flex items-center justify-center gap-2 hover:bg-rose-50 transition-all">
                                            <XCircle className="w-4 h-4" /> Delete Property
                                        </button>

                                        <div className="pt-4 border-t border-secondary/10">
                                            <Link to="/landlord/visits" className="flex items-center justify-between group p-2 hover:bg-secondary/5 rounded-sm transition-colors">
                                                <span className="text-xs font-bold text-paragraph flex items-center gap-2">
                                                    <Users className="w-4 h-4 opacity-30" /> Visit Requests
                                                </span>
                                                <span className="text-xs font-black text-headline group-hover:text-highlight transition-colors flex items-center">
                                                    Manage (3) <ChevronRight className="w-4 h-4" />
                                                </span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Main Listings View ── */
                    <div className="animate-[fadeIn_0.3s_ease-out] w-full">
                        <div className="flex items-center justify-between mb-8 border-b border-secondary/10">
                            <div className="flex gap-6">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`text-sm font-bold pb-3 border-b-2 px-1 transition-all ${activeTab === 'all' ? 'text-headline border-highlight' : 'text-paragraph border-transparent hover:text-headline'}`}
                                >
                                    All ({counts.all})
                                </button>
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`text-sm font-bold pb-3 border-b-2 px-1 transition-all ${activeTab === 'active' ? 'text-headline border-highlight' : 'text-paragraph border-transparent hover:text-headline'}`}
                                >
                                    Active ({counts.active})
                                </button>
                                <button
                                    onClick={() => setActiveTab('review')}
                                    className={`text-sm font-bold pb-3 border-b-2 px-1 transition-all ${activeTab === 'review' ? 'text-headline border-highlight' : 'text-paragraph border-transparent hover:text-headline'}`}
                                >
                                    Pending Review ({counts.review})
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-3">
                                {/* Layout Toggle */}
                                <div className="flex bg-secondary/10 rounded-sm p-1">
                                    <button
                                        onClick={() => setViewLayout('grid')}
                                        className={`p-1.5 rounded-sm transition-colors ${viewLayout === 'grid' ? 'bg-background shadow-sm text-headline' : 'text-paragraph hover:text-headline'}`}
                                        title="Grid View"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewLayout('list')}
                                        className={`p-1.5 rounded-sm transition-colors ${viewLayout === 'list' ? 'bg-background shadow-sm text-headline' : 'text-paragraph hover:text-headline'}`}
                                        title="List View"
                                    >
                                        <LayoutList className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* View Toggle */}
                                <div className="flex bg-secondary/10 rounded-sm p-1">
                                    <button
                                        onClick={() => setIsMapView(false)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-sm flex items-center gap-1.5 transition-colors ${!isMapView ? 'bg-background shadow-sm text-headline' : 'text-paragraph hover:text-headline'}`}
                                    >
                                        <List className="w-3.5 h-3.5" /> List
                                    </button>
                                    {filteredListings.some(p => p.lat && p.lng) && (
                                        <button
                                            onClick={() => setIsMapView(true)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-sm flex items-center gap-1.5 transition-colors ${isMapView ? 'bg-background shadow-sm text-headline' : 'text-paragraph hover:text-headline'}`}
                                        >
                                            <MapIcon className="w-3.5 h-3.5" /> Map
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 text-paragraph bg-secondary/3 rounded-sm border border-dashed border-secondary/10">
                                <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-10 text-highlight" />
                                <p className="text-sm font-bold uppercase tracking-widest opacity-40">Syncing Portfolio...</p>
                            </div>
                        ) : filteredListings.length > 0 ? (
                            <div className="flex gap-6 overflow-hidden">
                                <div className={`${isMapView ? 'w-full lg:w-1/2 overflow-y-auto pr-2 scrollbar-hide' : 'w-full'}`}>
                                    <div className={`grid gap-6 ${isMapView
                                        ? 'grid-cols-1 xl:grid-cols-2'
                                        : viewLayout === 'grid'
                                            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                                            : 'grid-cols-1'}`}>
                                        {filteredListings.map(listing => (
                                            <LandlordPropertyCard
                                                key={listing.id}
                                                property={listing}
                                                variant={viewLayout === 'list' && !isMapView ? 'horizontal' : 'vertical'}
                                                isActive={activePropertyId === listing.id}
                                                onSelect={() => setSelectedProperty(listing)}
                                                onShowOnMap={() => {
                                                    setIsMapView(true)
                                                    setActivePropertyId(listing.id)
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {isMapView && filteredListings.length > 0 && (
                                    <div className="hidden lg:block w-1/2 h-[calc(100vh-250px)] sticky top-0 rounded-sm overflow-hidden border border-secondary/20 shadow-sm">
                                        <PropertyMap
                                            interactive={true}
                                            activeMarkerId={activePropertyId}
                                            onMarkerClick={setActivePropertyId}
                                            markers={filteredListings.filter(p => p.lat && p.lng).map(p => ({
                                                id: p.id,
                                                lat: p.lat!,
                                                lng: p.lng!,
                                                price: p.price,
                                                title: p.title,
                                                image: p.property_images?.find(img => img.is_cover)?.url || p.property_images?.[0]?.url
                                            }))}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <EmptyState activeTab={activeTab} />
                        )}
                    </div>
                )}
            </main>

            {/* ── Image Lightbox ── */}
            {selectedProperty && (
                <ImageDialog
                    isOpen={isImageDialogOpen}
                    onClose={() => setIsImageDialogOpen(false)}
                    images={selectedProperty.property_images?.map(img => img.url) || []}
                    currentIndex={lightboxIndex}
                    onIndexChange={setLightboxIndex}
                />
            )}
        </div>
    )
}

interface LandlordPropertyCardProps {
    property: Property
    isActive?: boolean
    variant?: 'vertical' | 'horizontal'
    onSelect?: () => void
    onShowOnMap?: () => void
}

function LandlordPropertyCard({ property, isActive = false, variant = 'vertical', onSelect, onShowOnMap }: LandlordPropertyCardProps) {
    const isHorizontal = variant === 'horizontal'
    const coverImage = property.property_images?.find(img => img.is_cover)?.url || property.property_images?.[0]?.url || '/platform-discovery.png'

    return (
        <div
            className={`group flex ${isHorizontal ? 'flex-row min-h-[220px]' : 'flex-col'} bg-background border rounded-sm overflow-hidden transition-all duration-300 ${isActive ? 'border-highlight shadow-md shadow-highlight/20 ring-2 ring-highlight/50' : 'border-secondary/15 hover:border-highlight/30 hover:shadow-md hover:shadow-highlight/10'}`}
        >
            {/* Image Section */}
            <div className={`relative overflow-hidden ${isHorizontal ? 'w-80 shrink-0' : 'h-56'}`}>
                <img
                    src={coverImage}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            </div>

            {/* Content Section */}
            <div className={`p-6 flex flex-col justify-between flex-1 ${isHorizontal ? 'border-l border-secondary/10' : ''}`}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <StatusBadge status={property.status} />
                        <span className="text-[10px] font-bold text-paragraph opacity-40 uppercase tracking-tighter">Listed {new Date(property.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-black text-headline line-clamp-1 tracking-tight group-hover:text-highlight transition-colors">
                            {property.title}
                        </h3>
                        <p className="text-xl font-black text-headline tracking-tight">
                            ₹{property.price.toLocaleString()} <span className="text-xs text-paragraph font-bold opacity-50">/mo</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <p className="flex items-center gap-2 text-sm text-paragraph font-semibold opacity-70">
                            <MapPin className="w-4 h-4" /> {property.city}
                        </p>

                        <div className="flex items-center gap-6 text-xs font-bold text-paragraph/80 border-t border-secondary/5 pt-4">
                            <span className="flex items-center gap-2"><BedDouble className="w-4 h-4 opacity-50" /> {property.bedrooms} Bed</span>
                            <span className="flex items-center gap-2"><Users className="w-4 h-4 opacity-50" /> {property.interested_count || 0} Interested</span>
                            <span className="flex items-center gap-2"><Ruler className="w-4 h-4 opacity-50" /> {property.area_sqft || '—'} sqft</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    {property.lat && property.lng && (
                        <button
                            onClick={(e) => { e.preventDefault(); onShowOnMap?.(); }}
                            className="flex items-center gap-2 px-4 py-2.5 border border-secondary/20 hover:border-highlight/40 text-paragraph text-xs font-bold rounded-sm transition-all"
                        >
                            <MapIcon className="w-4 h-4" /> Pin
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.preventDefault(); onSelect?.(); }}
                        className="flex-1 flex items-center justify-center py-2.5 bg-button hover:opacity-95 text-button-text text-xs font-bold rounded-sm transition-all shadow-sm"
                    >
                        Management View
                    </button>
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status, large }: { status: string, large?: boolean }) {
    if (status === 'active') {
        return (
            <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 rounded-sm border border-emerald-100 ${large ? 'px-4 py-2 text-xs shadow-md bg-white border-2' : 'px-2 py-0.5 text-[8px]'}`}>
                <CheckCircle2 className="w-3 h-3" /> Live
            </span>
        )
    }
    if (status === 'review') {
        return (
            <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-widest bg-amber-50 text-amber-600 rounded-sm border border-amber-100 ${large ? 'px-4 py-2 text-xs shadow-md bg-white border-2' : 'px-2 py-0.5 text-[8px]'}`}>
                <AlertTriangle className="w-3 h-3" /> Review
            </span>
        )
    }
    return (
        <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-widest bg-rose-50 text-rose-600 rounded-sm border border-rose-100 ${large ? 'px-4 py-2 text-xs shadow-md bg-white border-2' : 'px-2 py-0.5 text-[8px]'}`}>
            <XCircle className="w-3 h-3" /> {status}
        </span>
    )
}

function EmptyState({ activeTab }: { activeTab: Tab }) {
    return (
        <div className="bg-background border-2 border-dashed border-secondary/10 rounded-sm py-24 flex flex-col items-center justify-center text-center px-6">
            <AlertCircle className="w-12 h-12 text-paragraph/20 mb-6" />
            <h3 className="text-xl font-extrabold text-headline mb-2">No listings found</h3>
            <p className="text-sm text-paragraph max-w-sm">
                {activeTab === 'all'
                    ? "Your property portfolio is currently empty. Start by subbmitting your first listing for review."
                    : `There are no properties currently filtered as "${activeTab}".`}
            </p>
            {activeTab === 'all' && (
                <Link
                    to="/landlord/listings/new"
                    className="mt-8 bg-highlight text-white px-8 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:-translate-y-1 transition-all shadow-lg shadow-highlight/20"
                >
                    Create Submission
                </Link>
            )}
        </div>
    )
}

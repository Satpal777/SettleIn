import { useState, useEffect } from 'react'
import { Search, MapPin, CalendarDays, IndianRupee, Home, BedDouble, Heart, Map as MapIcon, List, ArrowLeft, Ruler, FileText, ShieldCheck, CheckCircle2, Loader2, Check, LayoutGrid, LayoutList, Bath, X } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import PropertyMap from '../components/shared/PropertyMap'
import ImageDialog from '../components/shared/ImageDialog'
import type { Property as PropertyType } from '../types/property'

import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

function getTomorrowDateString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const offset = tomorrow.getTimezoneOffset()
    tomorrow.setMinutes(tomorrow.getMinutes() - offset)
    return tomorrow.toISOString().split('T')[0]
}

export default function SeekerListingsPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    // Basic search states
    const [searchTerm, setSearchTerm] = useState('')
    const [budgetMin, setBudgetMin] = useState('')
    const [budgetMax, setBudgetMax] = useState('')
    const [moveInDate, setMoveInDate] = useState('')
    const [isMapView, setIsMapView] = useState(false)
    const [activePropertyId, setActivePropertyId] = useState<string | null>(null)
    const [properties, setProperties] = useState<PropertyType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid')
    const [selectedProperty, setSelectedProperty] = useState<PropertyType | null>(null)
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
    const [lightboxIndex, setLightboxIndex] = useState(0)
    const [visitRequested, setVisitRequested] = useState(false)
    const [visitDate, setVisitDate] = useState('')
    const [visitTime, setVisitTime] = useState('')
    const [existingVisitId, setExistingVisitId] = useState<string | null>(null)
    const [isRequestingVisit, setIsRequestingVisit] = useState(false)
    const [isFetchingDetail, setIsFetchingDetail] = useState(false)

    // Autocomplete states
    const [knownLocations, setKnownLocations] = useState<{ id: string, name: string, lat: number, lng: number }[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)

    // Helper to unify property mapping across different fetches
    const mapPropertyData = (p: any): PropertyType => ({
        ...p,
        title: p.title || p.name || 'Untitled Property',
        city: p.city || (p.location && typeof p.location === 'string' && !p.location.startsWith('0101') ? p.location.split(',')[0].trim() : (p.address ? p.address.split(',')[0].trim() : 'Unknown City')),
        address: p.address || (p.location && typeof p.location === 'string' && !p.location.startsWith('0101') ? p.location : 'Address not available'),
        available_from: p.available_from || p.availableDate,
        property_images: p.property_images || (p.image ? [{ url: p.image, is_cover: true }] : []),
        property_amenities: p.property_amenities || [],
        bathrooms: p.bathrooms || 1,
        area_sqft: p.area_sqft || null,
        image: p.image || (p.property_images?.[0]?.url) || '/platform-discovery.png'
    })

    // Extracted into a reusable function for searching
    const fetchProperties = async (searchCity?: string, clearAll?: boolean) => {
        setIsLoading(true)

        try {
            let data: any[] | null = null;
            let error = null;

            if (searchCity && searchCity.trim() !== '') {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(searchCity)}`)
                const geoData = await geoRes.json()

                if (geoData && geoData.length > 0) {
                    const target_lat = parseFloat(geoData[0].lat)
                    const target_lng = parseFloat(geoData[0].lon)

                    const res = await supabase.rpc('get_properties_nearby_v2', {
                        target_lat,
                        target_lng,
                        radius_meters: 50000 // 50km radius
                    })
                    data = res.data; error = res.error;
                } else {
                    data = [];
                }
            } else {
                const res = await supabase.rpc('get_all_properties_with_location_v2')
                data = res.data as any[]; error = res.error;
            }

            if (error) {
                console.error("Error fetching properties:", error)
            } else if (data) {
                let formatted = data.map(mapPropertyData)

                if (!clearAll) {
                    if (budgetMin && !isNaN(Number(budgetMin))) {
                        formatted = formatted.filter(p => p.price >= Number(budgetMin))
                    }
                    if (budgetMax && !isNaN(Number(budgetMax))) {
                        formatted = formatted.filter(p => p.price <= Number(budgetMax))
                    }
                    if (moveInDate) {
                        const selectedDate = new Date(moveInDate).getTime()
                        formatted = formatted.filter(p => {
                            const pDate = new Date(p.available_from || p.created_at).getTime()
                            // Find properties available on or before the selected move-in date
                            return pDate <= selectedDate
                        })
                    }
                }

                setProperties(formatted)

                if (!searchCity || searchCity.trim() === '') {
                    const uniqueLocs = new Map<string, { id: string, name: string, lat: number, lng: number }>()
                    formatted.forEach((p: PropertyType) => {
                        const cit = p.city || 'Unknown'
                        if (!uniqueLocs.has(cit)) {
                            uniqueLocs.set(cit, { id: p.id, name: cit, lat: p.lat || 0, lng: p.lng || 0 })
                        }
                    })
                    setKnownLocations(Array.from(uniqueLocs.values()))
                }
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    // Initial Load
    useEffect(() => {
        fetchProperties()
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setShowSuggestions(false)
        fetchProperties(searchTerm)
    }

    const clearFilters = () => {
        setSearchTerm('')
        setBudgetMin('')
        setBudgetMax('')
        setMoveInDate('')
        fetchProperties()
    }

    // Handle incoming navigation state (e.g. from Shortlist)
    useEffect(() => {
        if (location.state?.selectedPropertyId) {
            handleSelectProperty(location.state.selectedPropertyId)
            // Clear the state so a page refresh doesn't keep reopening it
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location.state?.selectedPropertyId])

    const hasActiveFilters = searchTerm !== '' || budgetMin !== '' || budgetMax !== '' || moveInDate !== '';

    const selectSuggestion = (loc: { id: string, name: string, lat: number, lng: number }) => {
        setSearchTerm(loc.name)
        setShowSuggestions(false)

        setIsLoading(true)
        supabase.rpc('get_properties_nearby_v2', {
            target_lat: loc.lat,
            target_lng: loc.lng,
            radius_meters: 50000
        }).then(({ data, error }) => {
            if (error) console.error("Error fetching nearby properties:", error)
            if (data) {
                let formatted = (data as any[]).map(mapPropertyData)

                // Apply frontend filters
                if (budgetMin && !isNaN(Number(budgetMin))) {
                    formatted = formatted.filter(p => p.price >= Number(budgetMin))
                }
                if (budgetMax && !isNaN(Number(budgetMax))) {
                    formatted = formatted.filter(p => p.price <= Number(budgetMax))
                }
                if (moveInDate) {
                    const selectedDate = new Date(moveInDate).getTime()
                    formatted = formatted.filter(p => {
                        const pDate = new Date(p.available_from || p.created_at).getTime()
                        return pDate <= selectedDate
                    })
                }

                setProperties(formatted)
            }
            setIsLoading(false)
        })
    }

    const fetchPropertyDetail = async (id: string) => {
        setIsFetchingDetail(true)
        setVisitRequested(false)
        setExistingVisitId(null)
        setVisitDate('')
        setVisitTime('')
        try {
            const { data, error } = await supabase
                .rpc('get_property_details', { pid: id })
                .single()

            if (error) throw error
            if (data && (data as any).property_data) {
                const p = (data as any).property_data
                const mapped = {
                    ...p,
                    title: p.title || p.name || 'Untitled Property',
                    city: p.city || (p.location && typeof p.location === 'string' && !p.location.startsWith('0101') ? p.location.split(',')[0].trim() : (p.address ? p.address.split(',')[0].trim() : 'Unknown City')),
                    address: p.address || (p.location && typeof p.location === 'string' && !p.location.startsWith('0101') ? p.location : 'Address not available'),
                    available_from: p.available_from || p.availableDate,
                    property_images: p.property_images || (p.image ? [{ url: p.image, is_cover: true }] : []),
                    property_amenities: p.property_amenities || [],
                    bathrooms: p.bathrooms || 1,
                    area_sqft: p.area_sqft || null,
                    image: p.image || (p.property_images?.[0]?.url) || '/platform-discovery.png'
                }
                setSelectedProperty(mapped as PropertyType)

                if (user) {
                    const { data: visitData } = await supabase
                        .from('visits')
                        .select('*')
                        .eq('property_id', id)
                        .eq('seeker_id', user.id)
                        .in('status', ['requested', 'scheduled'])
                        .maybeSingle();

                    if (visitData) {
                        setVisitRequested(true);
                        setExistingVisitId(visitData.id);
                        if (visitData.scheduled_at) {
                            setVisitDate(visitData.scheduled_at.split('T')[0]);
                        }
                        if (visitData.seeker_notes) {
                            const timeMatch = visitData.seeker_notes.match(/Preferred time: (.*)/);
                            if (timeMatch && timeMatch[1]) {
                                setVisitTime(timeMatch[1]);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching property details:", err)
        } finally {
            setIsFetchingDetail(false)
        }
    }

    const handleSelectProperty = (id: string) => {
        fetchPropertyDetail(id)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleBackToList = () => {
        setSelectedProperty(null)
        setVisitRequested(false)
    }

    const toggleShortlist = async (propertyId: string, currentlyShortlisted: boolean) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Please log in to manage your shortlist.");
                return;
            }

            if (currentlyShortlisted) {
                // Remove from shortlist
                const { error } = await supabase
                    .from('shortlists')
                    .delete()
                    .match({ seeker_id: session.user.id, property_id: propertyId });

                if (error) throw error;
            } else {
                // Add to shortlist
                const { error } = await supabase
                    .from('shortlists')
                    .insert({
                        seeker_id: session.user.id,
                        property_id: propertyId
                    });

                if (error && error.code !== '23505') throw error;
            }

            // Update local state
            setProperties(prev => prev.map(p =>
                p.id === propertyId ? { ...p, is_shortlisted: !currentlyShortlisted } : p
            ));

            if (selectedProperty?.id === propertyId) {
                setSelectedProperty({ ...selectedProperty, is_shortlisted: !currentlyShortlisted });
            }
        } catch (err) {
            console.error("Error toggling shortlist:", err);
            alert("Could not update shortlist. Please try again.");
        }
    }

    const handleRequestVisit = async () => {
        if (!selectedProperty || !user) {
            alert("Please log in to request a visit.");
            return;
        }
        if (!visitDate) {
            alert("Please select a date.");
            return;
        }

        setIsRequestingVisit(true);
        try {
            // Combine date and time (using a generic time if not specified properly)
            const scheduledAt = new Date(visitDate);
            // Time is just a string preference, so we store it in notes
            const notes = `Preferred time: ${visitTime || 'Any time'}`;

            if (existingVisitId) {
                const { error } = await supabase.from('visits').update({
                    scheduled_at: scheduledAt.toISOString(),
                    seeker_notes: notes,
                    status: 'requested' // reset status in case landlord had requested changes
                }).eq('id', existingVisitId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('visits').insert({
                    property_id: selectedProperty.id,
                    seeker_id: user.id,
                    requested_at: new Date().toISOString(),
                    scheduled_at: scheduledAt.toISOString(),
                    status: 'requested',
                    seeker_notes: notes
                }).select().single();

                if (error) throw error;
                if (data) setExistingVisitId(data.id);
            }

            setVisitRequested(true);
        } catch (err: any) {
            console.error("Failed to request visit:", err);
            alert("Failed to request visit. " + (err.message || ""));
        } finally {
            setIsRequestingVisit(false);
        }
    }

    const filteredSuggestions = knownLocations.filter(loc => loc.name.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out]">
            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-6 transition-all duration-300">
                    {selectedProperty ? (
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleBackToList}
                                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-paragraph hover:text-highlight transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Listings
                            </button>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-paragraph uppercase tracking-widest opacity-60">Property Preview</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-extrabold mb-5 tracking-tight">Browse Properties</h1>
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paragraph" />
                                    <input
                                        type="text"
                                        placeholder="City, neighborhood, or zip"
                                        value={searchTerm}
                                        onChange={e => {
                                            setSearchTerm(e.target.value)
                                            setShowSuggestions(true)
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        className="w-full bg-secondary/5 border-2 border-secondary/20 rounded-sm py-2.5 pl-10 pr-4 text-sm font-semibold focus-visible:outline-none focus-visible:border-highlight focus-visible:bg-background transition-colors placeholder:font-normal placeholder:text-paragraph/60"
                                    />
                                    {showSuggestions && searchTerm.length > 0 && filteredSuggestions.length > 0 && (
                                        <div className="absolute top-12 left-0 w-full bg-background border border-secondary/20 shadow-lg rounded-sm overflow-hidden z-50">
                                            {filteredSuggestions.map(loc => (
                                                <button
                                                    key={loc.id}
                                                    type="button"
                                                    onClick={() => selectSuggestion(loc)}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-secondary/10 text-sm font-semibold text-headline transition-colors"
                                                >
                                                    {loc.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-1 sm:flex-none gap-2">
                                    <div className="relative w-full sm:w-32">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paragraph" />
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={budgetMin}
                                            onChange={e => setBudgetMin(e.target.value)}
                                            className="w-full bg-secondary/5 border-2 border-secondary/20 rounded-sm py-2.5 pl-9 pr-3 text-sm font-semibold focus-visible:outline-none focus-visible:border-highlight focus-visible:bg-background transition-colors placeholder:font-normal placeholder:text-paragraph/60"
                                        />
                                    </div>
                                    <span className="flex items-center text-paragraph/50 font-bold">-</span>
                                    <div className="relative w-full sm:w-32">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paragraph" />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={budgetMax}
                                            onChange={e => setBudgetMax(e.target.value)}
                                            className="w-full bg-secondary/5 border-2 border-secondary/20 rounded-sm py-2.5 pl-9 pr-3 text-sm font-semibold focus-visible:outline-none focus-visible:border-highlight focus-visible:bg-background transition-colors placeholder:font-normal placeholder:text-paragraph/60"
                                        />
                                    </div>
                                </div>
                                <div
                                    className="relative flex-1 sm:flex-none sm:w-48 cursor-pointer group"
                                    onClick={() => {
                                        const dateInput = document.getElementById('search-date-input') as HTMLInputElement | null;
                                        if (dateInput) {
                                            try { dateInput.showPicker() } catch (e) { dateInput.focus() }
                                        }
                                    }}
                                >
                                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paragraph pointer-events-none group-hover:text-highlight transition-colors z-10" />
                                    <input
                                        id="search-date-input"
                                        type="date"
                                        min={getTomorrowDateString()}
                                        value={moveInDate}
                                        onChange={e => setMoveInDate(e.target.value)}
                                        onClick={(e) => {
                                            try { (e.target as HTMLInputElement).showPicker() } catch (err) { }
                                        }}
                                        className="w-full bg-secondary/5 border-2 border-secondary/20 rounded-sm py-2.5 pl-10 pr-4 text-sm font-semibold text-paragraph focus-visible:outline-none focus-visible:border-highlight focus-visible:bg-background transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    className="bg-highlight text-button-text font-bold px-6 py-2.5 rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <Search className="w-4 h-4" /> Search
                                </button>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="bg-secondary/10 text-headline font-bold px-4 py-2.5 rounded-sm hover:bg-secondary/20 transition-colors flex items-center justify-center gap-2"
                                        title="Clear all filters"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </header>

            <main className={`${isMapView && !selectedProperty ? 'w-full h-[calc(100vh-140px)] flex flex-col overflow-hidden bg-background' : 'max-w-6xl mx-auto px-6 py-8'}`}>
                {isFetchingDetail ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-10 h-10 text-highlight animate-spin" />
                        <p className="text-sm font-bold text-paragraph">Fetching property details...</p>
                    </div>
                ) : selectedProperty ? (
                    <div className="animate-[fadeIn_0.3s_ease-out] space-y-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight text-headline mb-2">{selectedProperty.title}</h2>
                                <p className="flex items-center gap-2 text-paragraph font-medium">
                                    <MapPin className="w-4 h-4 text-highlight" /> {selectedProperty.address}, {selectedProperty.city}
                                </p>
                            </div>
                            <div className="flex flex-col md:items-end">
                                <p className="text-3xl font-extrabold tracking-tight text-highlight">₹{selectedProperty.price.toLocaleString()} <span className="text-sm text-paragraph font-semibold">/mo</span></p>
                                <p className="text-xs font-bold text-tertiary bg-tertiary/10 px-2 py-1 rounded-sm uppercase tracking-wider mt-2 w-max">
                                    Available {new Date(selectedProperty.available_from || selectedProperty.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

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

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2 space-y-10">
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
                                        <CalendarDays className="w-5 h-5 text-highlight" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-paragraph tracking-widest leading-none mb-1">Available From</span>
                                            <span className="text-sm font-black uppercase">{new Date(selectedProperty.available_from || selectedProperty.created_at).toLocaleDateString()}</span>
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
                                                <div key={item.amenities.name} className="flex items-center gap-2.5 text-sm font-bold text-headline">
                                                    <CheckCircle2 className="w-4 h-4 text-highlight" />
                                                    {item.amenities.name}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-paragraph italic">No amenities specified.</p>
                                    )}
                                </section>

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

                            <div className="space-y-6">
                                <div className="bg-background border border-secondary/15 rounded-sm p-6 shadow-sm sticky top-32">
                                    <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                                        <CalendarDays className="w-5 h-5 text-highlight" /> Request a Visit
                                    </h3>

                                    {visitRequested ? (
                                        <div className="bg-secondary/5 border border-secondary/20 p-6 rounded-sm text-center animate-[scaleUp_0.3s_ease-out]">
                                            <div className="w-12 h-12 bg-highlight/10 text-highlight rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Check className="w-6 h-6" />
                                            </div>
                                            <h4 className="font-black text-headline mb-2 uppercase tracking-tight">
                                                {existingVisitId ? 'Request Saved!' : 'Request Sent!'}
                                            </h4>
                                            <p className="text-xs font-bold text-paragraph leading-relaxed mb-6">The landlord will review your request and get back to you soon.</p>
                                            <button
                                                onClick={() => setVisitRequested(false)}
                                                className="w-full bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 text-headline text-xs font-black uppercase tracking-widest py-3 rounded-sm transition-all shadow-sm active:scale-[0.98]"
                                            >
                                                Edit Request
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-paragraph mb-2">Preferred Date</label>
                                                <div
                                                    className="relative w-full cursor-pointer group"
                                                    onClick={() => {
                                                        const dateInput = document.getElementById('visit-date-input') as HTMLInputElement | null;
                                                        if (dateInput) {
                                                            try { dateInput.showPicker() } catch (e) { dateInput.focus() }
                                                        }
                                                    }}
                                                >
                                                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paragraph pointer-events-none group-hover:text-highlight transition-colors z-10" />
                                                    <input
                                                        id="visit-date-input"
                                                        type="date"
                                                        value={visitDate}
                                                        onChange={(e) => setVisitDate(e.target.value)}
                                                        min={getTomorrowDateString()}
                                                        onClick={(e) => {
                                                            try { (e.target as HTMLInputElement).showPicker() } catch (err) { }
                                                        }}
                                                        className="w-full bg-secondary/5 border border-secondary/15 rounded-sm py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:border-highlight transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-paragraph mb-2">Preferred Time</label>
                                                <select value={visitTime} onChange={(e) => setVisitTime(e.target.value)} className="w-full bg-secondary/5 border border-secondary/15 rounded-sm px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-highlight transition-colors cursor-pointer">
                                                    <option value="" disabled className="bg-background text-headline">Select a time...</option>
                                                    <option value="Morning (9 AM - 12 PM)" className="bg-background text-headline">Morning (9 AM - 12 PM)</option>
                                                    <option value="Afternoon (12 PM - 4 PM)" className="bg-background text-headline">Afternoon (12 PM - 4 PM)</option>
                                                    <option value="Evening (4 PM - 7 PM)" className="bg-background text-headline">Evening (4 PM - 7 PM)</option>
                                                </select>
                                            </div>
                                            <button
                                                onClick={handleRequestVisit}
                                                disabled={isRequestingVisit || !visitDate || !visitTime}
                                                className="w-full bg-highlight text-button-text font-black uppercase tracking-widest py-4 rounded-sm hover:opacity-90 transition-all shadow-md active:scale-[0.98] mt-2 text-xs disabled:opacity-50"
                                            >
                                                {isRequestingVisit ? "Saving..." : (existingVisitId ? "Update Request" : "Request Visit")}
                                            </button>
                                            <button
                                                onClick={() => toggleShortlist(selectedProperty.id, !!selectedProperty.is_shortlisted)}
                                                className={`w-full bg-transparent border-2 text-headline font-black uppercase tracking-widest py-3 rounded-sm transition-all text-[10px] flex items-center justify-center gap-2 mt-4 ${selectedProperty.is_shortlisted ? 'border-red-500/50 text-red-500 hover:border-red-500/80' : 'border-secondary/15 hover:border-highlight/50'}`}
                                            >
                                                <Heart className={`w-3.5 h-3.5 ${selectedProperty.is_shortlisted ? 'fill-current' : ''}`} />
                                                {selectedProperty.is_shortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={`w-full ${isMapView ? 'h-full flex flex-col' : ''}`}>
                        {!isMapView && (
                            <div className="w-full animate-[fadeIn_0.3s_ease-out]">
                                <div className="flex items-center justify-between mb-6">
                                    <p className="text-sm font-bold text-paragraph">
                                        {isLoading ? 'Searching...' : `${properties.length} properties found`}
                                    </p>

                                    <div className="flex items-center gap-4">
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

                                        <div className="flex bg-secondary/10 rounded-sm p-1">
                                            <button
                                                onClick={() => setIsMapView(false)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-sm flex items-center gap-1.5 transition-colors ${!isMapView ? 'bg-background shadow-sm text-headline' : 'text-paragraph hover:text-headline'}`}
                                            >
                                                <List className="w-3.5 h-3.5" /> List
                                            </button>
                                            {properties.some(p => p.lat != null && p.lng != null) && (
                                                <button
                                                    onClick={() => setIsMapView(true)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-sm flex items-center gap-1.5 transition-colors ${isMapView ? 'bg-background shadow-sm text-headline' : 'text-paragraph hover:text-headline'}`}
                                                >
                                                    <MapIcon className="w-3.5 h-3.5" /> Map
                                                </button>
                                            )}
                                        </div>

                                        <select className="bg-primary border-none text-sm font-semibold text-headline focus:ring-0 cursor-pointer outline-none">
                                            <option>Recommended</option>
                                            <option>Price: Low to High</option>
                                            <option>Price: High to Low</option>
                                        </select>
                                    </div>
                                </div>

                                {isLoading ? (
                                    <div className="h-48 flex items-center justify-center font-bold text-paragraph">Loading...</div>
                                ) : properties.length === 0 ? (
                                    <div className="h-48 flex items-center justify-center font-bold text-paragraph flex-col gap-2">
                                        <span>No properties found!</span>
                                    </div>
                                ) : (
                                    <div className={`grid gap-6 ${viewLayout === 'grid'
                                        ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                                        : 'grid-cols-1'}`}>
                                        {properties.map(prop => (
                                            <PropertyCard
                                                key={prop.id}
                                                property={prop}
                                                variant={viewLayout === 'list' ? 'horizontal' : 'vertical'}
                                                isActive={activePropertyId === prop.id}
                                                onSelect={() => handleSelectProperty(prop.id)}
                                                onShowOnMap={() => {
                                                    setIsMapView(true)
                                                    setActivePropertyId(prop.id)
                                                }}
                                                onShortlist={() => toggleShortlist(prop.id, !!prop.is_shortlisted)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {isMapView && !isLoading && properties.length > 0 && (
                            <div className="w-full h-full flex flex-col animate-[fadeIn_0.3s_ease-out]">
                                <div className="flex items-center justify-between mb-6 px-6">
                                    <p className="text-sm font-bold text-paragraph">
                                        Map View — {properties.filter(p => p.lat != null && p.lng != null).length} mapped properties
                                    </p>
                                    <button
                                        onClick={() => setIsMapView(false)}
                                        className="px-3 py-1.5 text-xs font-bold rounded-sm bg-secondary/10 hover:bg-secondary/20 flex items-center gap-1.5 transition-colors"
                                    >
                                        <List className="w-3.5 h-3.5" /> Switch to List
                                    </button>
                                </div>
                                <div className="flex-1 border-t border-secondary/20 relative">
                                    <PropertyMap
                                        interactive={true}
                                        activeMarkerId={activePropertyId}
                                        onMarkerClick={setActivePropertyId}
                                        markers={properties.filter(p => p.lat != null && p.lng != null).map(p => ({
                                            id: p.id,
                                            lat: p.lat!,
                                            lng: p.lng!,
                                            price: p.price,
                                            title: p.title,
                                            image: p.property_images?.find(img => img.is_cover)?.url || p.property_images?.[0]?.url
                                        }))}
                                    />
                                    {/* Quick floating list toggle for map users */}
                                    <div className="absolute top-4 right-4 z-1000 lg:hidden">
                                        <button
                                            onClick={() => setIsMapView(false)}
                                            className="bg-background border border-secondary/20 shadow-lg p-3 rounded-full text-headline hover:text-highlight transition-all active:scale-95"
                                        >
                                            <List className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

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

export interface PropertyCardProps {
    property: PropertyType
    isActive?: boolean
    variant?: 'vertical' | 'horizontal'
    onSelect?: () => void
    onShowOnMap?: () => void
    onShortlist?: () => void
}

export function PropertyCard({ property, isActive = false, variant = 'vertical', onSelect, onShowOnMap, onShortlist }: PropertyCardProps) {
    const isHorizontal = variant === 'horizontal'
    const coverImage = property.property_images?.find(img => img.is_cover)?.url || property.property_images?.[0]?.url || '/platform-discovery.png'

    return (
        <div
            className={`group flex ${isHorizontal ? 'flex-row min-h-[220px]' : 'flex-col'} bg-background border rounded-sm overflow-hidden transition-all duration-300 ${isActive ? 'border-highlight shadow-md shadow-highlight/20 ring-2 ring-highlight/50' : 'border-secondary/15 hover:border-highlight/30 hover:shadow-md hover:shadow-highlight/10'}`}
        >
            <div className={`relative overflow-hidden ${isHorizontal ? 'w-80 shrink-0' : 'h-56'}`}>
                <img
                    src={coverImage}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onShortlist) onShortlist();
                    }}
                    className={`absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-md rounded-full transition-colors shadow-sm ${property.is_shortlisted ? 'text-red-500 hover:text-red-600' : 'text-paragraph hover:text-red-500'}`}>
                    <Heart className={`w-4 h-4 ${property.is_shortlisted ? 'fill-current' : ''}`} />
                </button>
            </div>

            <div className={`p-6 flex flex-col justify-between flex-1 ${isHorizontal ? 'border-l border-secondary/10' : ''}`}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-paragraph opacity-40 uppercase tracking-tighter">
                            Listed on {new Date(property.created_at).toLocaleDateString()}
                        </span>
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

                        <div className="flex flex-col gap-3 border-t border-secondary/5 pt-4">
                            <div className="flex items-center gap-6 text-xs font-bold text-paragraph/80">
                                <span className="flex items-center gap-2"><BedDouble className="w-4 h-4 opacity-50" /> {property.bedrooms} Bed</span>
                                <span className="flex items-center gap-2"><Bath className="w-4 h-4 opacity-50" /> {property.bathrooms || '—'} Bath</span>
                                <span className="flex items-center gap-2"><Ruler className="w-4 h-4 opacity-50" /> {property.area_sqft || '—'} sqft</span>
                            </div>

                            {property.property_amenities && property.property_amenities.length > 0 && (
                                <div className="flex gap-2 w-full overflow-hidden flex-wrap max-h-6 mt-1">
                                    {property.property_amenities.slice(0, 3).map((item, i) => (
                                        <span key={i} className="text-[10px] font-bold text-tertiary bg-tertiary/10 px-2 py-1 rounded-sm uppercase tracking-wider whitespace-nowrap">
                                            {item.amenities.name}
                                        </span>
                                    ))}
                                    {property.property_amenities.length > 3 && (
                                        <span className="text-[10px] font-bold text-paragraph bg-secondary/10 px-2 py-1 rounded-sm uppercase tracking-wider whitespace-nowrap">
                                            +{property.property_amenities.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center gap-3 mt-8">
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
                        className="px-4 flex items-center justify-center py-2.5 bg-button hover:opacity-95 text-button-text text-xs font-bold rounded-sm transition-all shadow-sm"
                    >
                        View Details
                    </button>
                </div>
            </div>
        </div>
    )
}

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Check, BedDouble, ShieldCheck, Image as ImageIcon, Edit, Eye, CalendarDays } from 'lucide-react'
import PropertyMap from '../components/shared/PropertyMap'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'

function getTomorrowDateString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const offset = tomorrow.getTimezoneOffset()
    tomorrow.setMinutes(tomorrow.getMinutes() - offset)
    return tomorrow.toISOString().split('T')[0]
}

export default function ListingDetailsPage() {
    const { id } = useParams()

    const { user } = useAuth()
    const { profile } = useProfile()
    const [property, setProperty] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [mainImage, setMainImage] = useState<string>('')
    const [visitRequested, setVisitRequested] = useState(false)
    const [visitDate, setVisitDate] = useState('')
    const [visitTime, setVisitTime] = useState('')
    const [existingVisitId, setExistingVisitId] = useState<string | null>(null)
    const [isRequestingVisit, setIsRequestingVisit] = useState(false)

    useEffect(() => {
        if (id) fetchPropertyDetails()
    }, [id])

    async function fetchPropertyDetails() {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .rpc('get_property_details', { pid: id })
                .single()

            if (error) throw error
            if (data && (data as any).property_data) {
                const propData = (data as any).property_data

                // Extraction of coordinates is handled by the RPC
                const lat = propData.lat || 0
                const lng = propData.lng || 0

                // Set up imagery correctly
                let images = propData.property_images?.map((img: any) => img.url) || []
                const cover = propData.property_images?.find((img: any) => img.is_cover)?.url
                const amenityList = propData.property_amenities?.map((pa: any) => pa.amenities?.name).filter(Boolean) || []

                setProperty({
                    ...propData,
                    gallery: images,
                    amenities: amenityList,
                    lat,
                    lng
                })

                if (cover) setMainImage(cover)
                else if (images.length > 0) setMainImage(images[0])
            }

            // Check for existing visit request
            if (user && id) {
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

        } catch (err) {
            console.error('Error fetching details:', err)
        }
        setIsLoading(false)
    }

    const handleRequestVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!property || !user) {
            alert("Please log in to request a visit.");
            return;
        }
        if (!visitDate) {
            alert("Please select a date.");
            return;
        }

        setIsRequestingVisit(true);
        try {
            const scheduledAt = new Date(visitDate);
            const notes = `Preferred time: ${visitTime || 'Any time'}`;

            if (existingVisitId) {
                const { error } = await supabase.from('visits').update({
                    scheduled_at: scheduledAt.toISOString(),
                    seeker_notes: notes,
                    status: 'requested'
                }).eq('id', existingVisitId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('visits').insert({
                    property_id: property.id,
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

    if (isLoading) {
        return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-headline">Loading Property...</div>
    }

    if (!property) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4 text-headline">Listing Not Found</h1>
                <Link to="/seeker/listings" className="text-highlight hover:underline font-semibold">← Back to Listings</Link>
            </div>
        )
    }

    return (
        <div className="bg-background text-headline min-h-screen pb-12 animate-[fadeIn_0.25s_ease-out]">
            {/* Header / Breadcrumb */}
            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link
                        to={profile?.is_landlord && property.landlord_id === user?.id ? "/landlord/listings" : "/seeker/listings"}
                        className="text-xs font-bold text-paragraph hover:text-headline uppercase tracking-widest flex items-center gap-2 group transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to {profile?.is_landlord && property.landlord_id === user?.id ? "My Listings" : "Search"}
                    </Link>

                    {property.landlord_id === user?.id && (
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-highlight bg-highlight/10 px-2 py-1 rounded-sm uppercase tracking-widest">
                                Your Property
                            </span>
                            <button className="text-xs font-bold bg-secondary/10 hover:bg-secondary/20 px-3 py-1.5 rounded-sm flex items-center gap-1.5 transition-all">
                                <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 mt-8">
                {/* ── Title & Essentials ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-extrabold tracking-tight">{property.title}</h1>
                        </div>
                        <p className="text-sm text-paragraph flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 shrink-0" /> {property.address}, {property.city}
                        </p>
                    </div>
                    <div className="flex flex-col md:items-end">
                        <p className="text-3xl font-extrabold tracking-tight">₹{property.price.toLocaleString()} <span className="text-sm text-paragraph font-semibold">/mo</span></p>
                        <p className="text-xs font-bold text-tertiary bg-tertiary/10 px-2 py-1 rounded-sm uppercase tracking-wider mt-2 w-max">Available {new Date(property.available_from || property.created_at).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* ── Gallery ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="md:col-span-3 h-64 md:h-96 bg-secondary/10 rounded-sm overflow-hidden border border-secondary/15 flex items-center justify-center">
                        {mainImage ? (
                            <img src={mainImage} alt={property.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 opacity-50">
                                <ImageIcon className="w-12 h-12" />
                                <span className="text-sm font-bold">No Cover Image</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-visible">
                        {property.gallery && property.gallery.map((img: string, i: number) => (
                            <button
                                key={i}
                                onClick={() => setMainImage(img)}
                                className={`shrink-0 w-24 md:w-full h-24 md:h-[116px] rounded-sm overflow-hidden border-2 transition-all ${mainImage === img ? 'border-highlight shadow-sm' : 'border-secondary/10 hover:border-highlight/50'}`}
                            >
                                <img src={img} alt="Gallery thumbnail" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── 2-Column Layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left: Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Key Stats */}
                        <div className="flex flex-wrap gap-6 py-4 border-y border-secondary/10">
                            <div className="flex items-center gap-2">
                                <BedDouble className="w-5 h-5 text-paragraph" />
                                <span className="text-sm font-bold">{property.bedrooms} Bedrooms</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-paragraph" />
                                <span className="text-sm font-bold">{property.area_sqft || 'N/A'} sq.ft</span>
                            </div>
                        </div>

                        {/* About */}
                        <section>
                            <h2 className="text-lg font-extrabold mb-3">About this property</h2>
                            <p className="text-sm text-paragraph leading-relaxed whitespace-pre-wrap">{property.description || 'No description provided.'}</p>
                        </section>

                        {/* Amenities */}
                        <section>
                            <h2 className="text-lg font-extrabold mb-4">Amenities</h2>
                            {property.amenities && property.amenities.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
                                    {property.amenities.map((item: string) => (
                                        <div key={item} className="flex items-center gap-2 text-sm text-headline">
                                            <Check className="w-4 h-4 text-highlight" />
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-paragraph italic">No amenities specified.</p>
                            )}
                        </section>

                        {/* Rules */}
                        <section className="bg-secondary/5 p-6 rounded-sm border border-secondary/10">
                            <h2 className="text-sm font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-paragraph" /> Property Rules
                            </h2>
                            {property.house_rules && property.house_rules.length > 0 ? (
                                <ul className="space-y-2 text-sm text-paragraph">
                                    {property.house_rules.map((rule: string) => (
                                        <li key={rule} className="flex gap-2">
                                            <span className="text-highlight font-bold">•</span> {rule}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-paragraph italic">No specific house rules documented.</p>
                            )}
                        </section>

                        {/* Location / Map */}
                        <section className="mb-8">
                            <h2 className="text-lg font-extrabold mb-4">Location</h2>
                            <p className="text-sm text-paragraph mb-4">{property.address}, {property.city}</p>
                            {property.lat && property.lng ? (
                                <div className="h-80 border border-secondary/20 rounded-sm overflow-hidden">
                                    <PropertyMap
                                        interactive={false}
                                        markers={[{
                                            id: property.id,
                                            lat: property.lat,
                                            lng: property.lng,
                                            price: property.price,
                                            title: property.title,
                                            image: property.gallery?.[0]
                                        }]}
                                    />
                                </div>
                            ) : (
                                <div className="h-40 border border-secondary/20 rounded-sm flex items-center justify-center bg-secondary/5">
                                    <span className="text-sm font-bold text-paragraph">Location Coordinates Unavailable</span>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right: Actions Sidebar */}
                    <div className="lg:col-span-1">
                        {property.landlord_id === user?.id ? (
                            <div className="bg-background border-2 border-highlight rounded-sm p-6 shadow-[4px_4px_0_var(--color-highlight)/10] sticky top-24">
                                <h3 className="font-extrabold text-xl mb-2 text-highlight">Property Management</h3>
                                <p className="text-sm text-paragraph mb-6">You are viewing your own listing.</p>

                                <div className="space-y-4">
                                    <div className="p-4 bg-tertiary/5 border border-tertiary/10 rounded-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-paragraph uppercase tracking-widest">Current Status</span>
                                            <span className="text-xs font-bold text-tertiary uppercase">{property.status}</span>
                                        </div>
                                        <p className="text-[10px] text-paragraph uppercase tracking-tighter">Visible to public: {property.status === 'active' ? 'Yes' : 'No'}</p>
                                    </div>

                                    <button className="w-full bg-highlight text-white font-bold text-sm py-3 rounded-sm flex items-center justify-center gap-2 hover:-translate-y-px transition-all">
                                        <Edit className="w-4 h-4" /> Edit Property Details
                                    </button>
                                    <Link to="/landlord/visits" className="w-full bg-secondary/5 border border-secondary/20 text-headline font-bold text-sm py-3 rounded-sm flex items-center justify-center gap-2 hover:bg-secondary/10 transition-all">
                                        <Eye className="w-4 h-4" /> View Visit Requests
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-background border-2 border-headline rounded-sm p-6 shadow-[4px_4px_0_var(--color-secondary/10)] sticky top-24">
                                <h3 className="font-extrabold text-xl mb-2">Interested?</h3>
                                <p className="text-sm text-paragraph mb-6">Schedule a visit with the landlord.</p>

                                {!visitRequested ? (
                                    <form className="space-y-4" onSubmit={handleRequestVisit}>
                                        <div>
                                            <label className="text-xs font-semibold text-paragraph uppercase tracking-widest mb-1.5 block">Select Date</label>
                                            <div
                                                className="relative w-full cursor-pointer group"
                                                onClick={() => {
                                                    const dateInput = document.getElementById('details-visit-date') as HTMLInputElement | null;
                                                    if (dateInput) {
                                                        try { dateInput.showPicker() } catch (e) { dateInput.focus() }
                                                    }
                                                }}
                                            >
                                                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paragraph pointer-events-none group-hover:text-highlight transition-colors z-10" />
                                                <input
                                                    id="details-visit-date"
                                                    type="date"
                                                    required
                                                    value={visitDate}
                                                    onChange={(e) => setVisitDate(e.target.value)}
                                                    min={getTomorrowDateString()}
                                                    onClick={(e) => {
                                                        try { (e.target as HTMLInputElement).showPicker() } catch (err) { }
                                                    }}
                                                    className="w-full bg-secondary/5 border border-secondary/20 rounded-sm py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-highlight cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-paragraph uppercase tracking-widest mb-1.5 block">Select Time (Approx)</label>
                                            <select required value={visitTime} onChange={(e) => setVisitTime(e.target.value)} className="w-full bg-secondary/5 border border-secondary/20 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-highlight cursor-pointer">
                                                <option value="" disabled className="bg-background text-headline">Select a time...</option>
                                                <option value="Morning (9AM - 12PM)" className="bg-background text-headline">Morning (9AM - 12PM)</option>
                                                <option value="Afternoon (12PM - 4PM)" className="bg-background text-headline">Afternoon (12PM - 4PM)</option>
                                                <option value="Evening (4PM - 7PM)" className="bg-background text-headline">Evening (4PM - 7PM)</option>
                                            </select>
                                        </div>
                                        <div className="pt-2">
                                            <button type="submit" disabled={isRequestingVisit || !visitDate || !visitTime} className="w-full bg-highlight text-button-text font-bold text-sm py-3 rounded-sm hover:-translate-y-px hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50">
                                                {isRequestingVisit ? "Saving..." : (existingVisitId ? "Update Request" : "Request Visit")}
                                            </button>
                                            <button type="button" className="w-full mt-3 bg-secondary/5 hover:bg-secondary/10 border border-secondary/20 text-headline font-bold text-sm py-3 rounded-sm transition-all">
                                                Add to Shortlist
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="bg-secondary/5 border border-secondary/20 p-6 rounded-sm text-center animate-[scaleUp_0.3s_ease-out]">
                                        <div className="w-12 h-12 bg-highlight/10 text-highlight rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Check className="w-6 h-6" />
                                        </div>
                                        <h4 className="font-black text-headline mb-2 uppercase tracking-tight">
                                            {existingVisitId ? 'Request Saved!' : 'Request Sent!'}
                                        </h4>
                                        <p className="text-xs text-paragraph mb-6 font-medium">The landlord will review your request and confirm shortly.</p>
                                        <div className="flex flex-col gap-2">
                                            <Link to="/seeker/visits" className="w-full bg-highlight text-white text-xs font-black uppercase tracking-widest py-3 rounded-sm transition-all shadow-sm hover:opacity-90 active:scale-[0.98]">
                                                View in My Visits
                                            </Link>
                                            <button
                                                onClick={() => setVisitRequested(false)}
                                                className="w-full bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 text-headline text-xs font-black uppercase tracking-widest py-3 rounded-sm transition-all shadow-sm active:scale-[0.98]"
                                            >
                                                Edit Request
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

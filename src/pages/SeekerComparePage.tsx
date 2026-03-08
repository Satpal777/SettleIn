import { useState, useEffect } from 'react'
import { Check, X, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import type { Property as PropertyType } from '../types/property'

export default function SeekerComparePage() {
    const [shortlist, setShortlist] = useState<PropertyType[]>([])
    const [compareIds, setCompareIds] = useState<string[]>(() => {
        const saved = localStorage.getItem('settlein_compare_ids')
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch (e) {
                console.error("Could not parse compare ids", e)
            }
        }
        return [];
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSelectingFor, setIsSelectingFor] = useState<number | null>(null) // index of the slot being selected

    // 1. Fetch the user's shortlist
    const fetchShortlist = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase.rpc('get_shortlisted_properties');
            if (error) throw error;

            if (data) {
                const formatted = (data as any[]).map(p => {
                    const mappedImages = p.property_images || (p.image ? [{ url: p.image, is_cover: true }] : []);
                    return {
                        ...p,
                        title: p.title || p.name || 'Untitled Property',
                        city: p.city || (p.location && typeof p.location === 'string' && !p.location.startsWith('0101') ? p.location.split(',')[0].trim() : (p.address ? p.address.split(',')[0].trim() : 'Unknown City')),
                        address: p.address || (p.location && typeof p.location === 'string' && !p.location.startsWith('0101') ? p.location : 'Address not available'),
                        available_from: p.available_from || p.availableDate,
                        property_images: mappedImages,
                        property_amenities: p.property_amenities || [],
                        bathrooms: p.bathrooms || 1,
                        area_sqft: p.area_sqft || null,
                        image: p.image || '/platform-discovery.png'
                    };
                })
                setShortlist(formatted)
            }
        } catch (error) {
            console.error("Error fetching shortlist:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // 2. Load and Save from localStorage
    useEffect(() => {
        fetchShortlist()
    }, [])

    useEffect(() => {
        localStorage.setItem('settlein_compare_ids', JSON.stringify(compareIds))
    }, [compareIds])

    // Helper functions
    const removeCompare = (idToRemove: string) => {
        setCompareIds(prev => prev.filter(id => id !== idToRemove))
    }

    const addCompare = (idToAdd: string) => {
        if (compareIds.length >= 3) return; // max 3
        if (compareIds.includes(idToAdd)) return; // prevent dupes
        setCompareIds(prev => [...prev, idToAdd])
        setIsSelectingFor(null)
    }

    const comparedProperties = compareIds.map(id => shortlist.find(p => p.id === id)).filter(Boolean) as PropertyType[]
    const slots = [0, 1, 2] // max 3 properties to compare

    // Extract all unique amenities across compared properties
    const allAmenities = new Set<string>()
    comparedProperties.forEach(p => {
        p.property_amenities?.forEach(a => allAmenities.add(a.amenities.name))
    })
    const uniqueAmenitiesList = Array.from(allAmenities).sort()

    return (
        <div className="bg-background text-headline min-h-screen pb-12 animate-[fadeIn_0.25s_ease-out]">
            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold mb-1 tracking-tight">Compare Properties</h1>
                        <p className="text-sm text-paragraph">Review your shortlisted choices side-by-side.</p>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 mt-8 overflow-x-auto relative">
                {isLoading ? (
                    <div className="py-20 text-center font-bold text-paragraph">Loading...</div>
                ) : (
                    <div className="min-w-[768px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="w-1/4 pb-6 font-semibold text-sm text-paragraph uppercase tracking-widest align-bottom">Features</th>
                                    {slots.map((slotIndex) => {
                                        const p = comparedProperties[slotIndex]

                                        if (p) {
                                            const coverImage = p.property_images?.find(img => img.is_cover)?.url || p.property_images?.[0]?.url || '/platform-discovery.png'
                                            return (
                                                <th key={`slot-${slotIndex}`} className="w-1/4 px-4 pb-6 align-top">
                                                    <div className="relative rounded-sm overflow-hidden bg-secondary/5 h-32 mb-3 border border-secondary/10 group">
                                                        <img src={coverImage} className="w-full h-full object-cover mix-blend-multiply opacity-80" alt={p.title} />
                                                        <button
                                                            onClick={() => removeCompare(p.id)}
                                                            className="absolute top-2 right-2 w-6 h-6 bg-background rounded-full flex items-center justify-center hover:bg-red-500/10 text-paragraph hover:text-red-500 transition-colors shadow-sm"
                                                            title="Remove from comparison"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <h3 className="font-bold text-headline text-lg line-clamp-2">{p.title}</h3>
                                                    <p className="text-xs text-paragraph mt-1">{p.city}</p>
                                                </th>
                                            )
                                        } else {
                                            // Empty slot
                                            return (
                                                <th key={`slot-${slotIndex}`} className="w-1/4 px-4 pb-6 align-top relative">
                                                    {isSelectingFor === slotIndex ? (
                                                        <div className="h-48 mb-3 border border-highlight/30 rounded-sm bg-background p-2 shadow-lg z-30 flex flex-col overflow-hidden">
                                                            <div className="flex justify-between items-center mb-2 px-2 pt-1 border-b border-secondary/10 pb-2">
                                                                <span className="text-xs font-bold uppercase tracking-wider text-paragraph">Select from Shortlist</span>
                                                                <button onClick={() => setIsSelectingFor(null)} className="text-paragraph hover:text-headline"><X className="w-4 h-4" /></button>
                                                            </div>
                                                            <div className="overflow-y-auto flex-1 flex flex-col gap-1 pr-1 custom-scrollbar">
                                                                {shortlist.filter(sp => !compareIds.includes(sp.id)).length === 0 ? (
                                                                    <div className="text-xs text-paragraph p-4 text-center">No more shortlisted properties available.</div>
                                                                ) : (
                                                                    shortlist.filter(sp => !compareIds.includes(sp.id)).map(sp => (
                                                                        <button
                                                                            key={sp.id}
                                                                            onClick={() => addCompare(sp.id)}
                                                                            className="text-left text-xs p-2 hover:bg-secondary/10 rounded-sm transition-colors border border-transparent hover:border-secondary/20 flex flex-col gap-1"
                                                                        >
                                                                            <span className="font-bold text-headline truncate">{sp.title}</span>
                                                                            <span className="font-semibold text-paragraph truncate">{sp.city} • ₹{sp.price.toLocaleString()}</span>
                                                                        </button>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-32 mb-3 border-2 border-dashed border-secondary/20 rounded-sm flex items-center justify-center text-paragraph hover:border-highlight/50 hover:bg-highlight/5 transition-all cursor-pointer group" onClick={() => setIsSelectingFor(slotIndex)}>
                                                            <div className="flex flex-col items-center gap-2 group-hover:text-highlight transition-colors">
                                                                <Plus className="w-6 h-6" />
                                                                <span className="text-xs font-bold">Add Property</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </th>
                                            )
                                        }
                                    })}
                                </tr>
                            </thead>

                            {comparedProperties.length > 0 && (
                                <tbody className="text-sm border-t border-secondary/10">
                                    <CompareRow
                                        label="Monthly Rent"
                                        values={slots.map(i => comparedProperties[i] ? <span className="font-extrabold text-lg">₹{comparedProperties[i].price.toLocaleString()}</span> : '-')}
                                    />
                                    <CompareRow
                                        label="Property Type"
                                        values={slots.map(i => comparedProperties[i] ? (comparedProperties[i].type || 'Apartment') : '-')}
                                    />
                                    <CompareRow
                                        label="Bedrooms"
                                        values={slots.map(i => comparedProperties[i] ? `${comparedProperties[i].bedrooms} Beds` : '-')}
                                    />
                                    <CompareRow
                                        label="Bathrooms"
                                        values={slots.map(i => comparedProperties[i] ? `${comparedProperties[i].bathrooms} Baths` : '-')}
                                    />
                                    <CompareRow
                                        label="Square Feet"
                                        values={slots.map(i => comparedProperties[i] ? (comparedProperties[i].area_sqft ? `${comparedProperties[i].area_sqft} sqft` : 'N/A') : '-')}
                                    />
                                    <CompareRow
                                        label="Availability"
                                        values={slots.map(i => comparedProperties[i] ? (comparedProperties[i].available_from ? new Date(comparedProperties[i].available_from!).toLocaleDateString() : 'Available Now') : '-')}
                                    />
                                    {uniqueAmenitiesList.length > 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-6 pt-10 font-black text-headline text-lg tracking-tight border-b border-secondary/10">
                                                Amenities
                                            </td>
                                        </tr>
                                    )}

                                    {uniqueAmenitiesList.map(amenityName => (
                                        <CompareRow
                                            key={amenityName}
                                            label={amenityName}
                                            values={slots.map(i => {
                                                const p = comparedProperties[i];
                                                if (!p) return '-';
                                                const hasAmenity = p.property_amenities?.some(a => a.amenities.name === amenityName);
                                                return hasAmenity ? <Check className="w-5 h-5 text-highlight" /> : <X className="w-5 h-5 text-secondary/40" />
                                            })}
                                        />
                                    ))}

                                    <tr>
                                        <td className="py-4"></td>
                                        {slots.map(i => {
                                            const p = comparedProperties[i]
                                            return (
                                                <td key={`action-${i}`} className="py-4 px-4 text-center">
                                                    {p ? (
                                                        <Link to={`/seeker/listings`} state={{ selectedPropertyId: p.id }} className="block w-full text-xs font-bold bg-secondary/10 hover:bg-highlight hover:text-button-text text-headline py-2 rounded-sm transition-colors border border-secondary/20 hover:border-highlight">
                                                            View Details
                                                        </Link>
                                                    ) : null}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                </tbody>
                            )}
                        </table>

                        {comparedProperties.length === 0 && (
                            <div className="text-center py-12 mt-4 bg-secondary/5 rounded-sm border border-secondary/10">
                                <p className="text-paragraph font-medium">Add properties from your shortlist above to start comparing them.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}

function CompareRow({ label, values }: { label: string, values: React.ReactNode[] }) {
    return (
        <tr className="border-b border-secondary/10 hover:bg-secondary/5 transition-colors">
            <td className="py-4 font-semibold text-paragraph text-xs uppercase tracking-widest">{label}</td>
            {values.map((v, i) => <td key={i} className="py-4 px-4 font-medium text-headline wrap-break-word">{v}</td>)}
        </tr>
    )
}

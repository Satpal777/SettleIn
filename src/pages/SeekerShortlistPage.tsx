import { useState, useEffect } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import type { Property as PropertyType } from '../types/property'
import { PropertyCard } from './SeekerListingsPage'

export default function SeekerShortlistPage() {
    const navigate = useNavigate();
    const [properties, setProperties] = useState<PropertyType[]>([])
    const [isLoading, setIsLoading] = useState(true)

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
                // map property data
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
                setProperties(formatted)
            }
        } catch (error) {
            console.error("Error fetching shortlist:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const removeFromShortlist = async (propertyId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from('shortlists')
                .delete()
                .match({ seeker_id: session.user.id, property_id: propertyId });

            if (error) throw error;

            setProperties(prev => prev.filter(p => p.id !== propertyId));
        } catch (error) {
            console.error("Error removing from shortlist:", error);
            alert("Could not remove property. Please try again.");
        }
    }

    useEffect(() => {
        fetchShortlist()
    }, [])
    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out]">

            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <h1 className="text-2xl font-extrabold mb-1 tracking-tight">My Shortlist <span className="text-highlight">({properties.length})</span></h1>
                    <p className="text-sm text-paragraph">Properties you've saved to compare and revisit later.</p>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-highlight mb-4" />
                        <h2 className="text-lg font-bold">Loading your shortlist...</h2>
                    </div>
                ) : properties.length > 0 ? (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {properties.map(prop => (
                            <PropertyCard
                                key={prop.id}
                                property={prop}
                                onShortlist={() => removeFromShortlist(prop.id)}
                                onSelect={() => navigate('/seeker/listings', { state: { selectedPropertyId: prop.id } })}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-secondary/5 border-2 border-dashed border-secondary/20 rounded-sm">
                        <Heart className="w-10 h-10 text-secondary/40 mx-auto mb-4" />
                        <h2 className="text-lg font-bold">Your shortlist is empty</h2>
                        <p className="text-sm text-paragraph mt-2 mb-6">Save properties you like so you can easily find them later.</p>
                        <Link to="/seeker/listings" className="text-sm font-bold bg-highlight text-button-text px-6 py-2.5 rounded-sm hover:opacity-90 transition-opacity">
                            Browse Properties
                        </Link>
                    </div>
                )}

            </main>
        </div>
    )
}

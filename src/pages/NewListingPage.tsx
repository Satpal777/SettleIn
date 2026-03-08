import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, Calendar } from 'lucide-react'
import { divIcon } from 'leaflet'
import { renderToString } from 'react-dom/server'

// Fixes the "half cut map" issue by forcing leaflet to recalculate its container size
function MapFixer() {
    const map = useMap()

    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize()
        }, 100)
        return () => clearTimeout(timer)
    }, [map])

    return null
}

import type { Amenity } from '../types/property'

export default function NewListingPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [step, setStep] = useState(1)

    // Form Data State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [price, setPrice] = useState('')
    const [bedrooms, setBedrooms] = useState('1')
    const [bathrooms, setBathrooms] = useState('1')
    const [areaSqft, setAreaSqft] = useState('')
    const [availableFrom, setAvailableFrom] = useState('')
    const [houseRules, setHouseRules] = useState<string[]>([])
    const [currentRule, setCurrentRule] = useState('')

    // Location Map State
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(null)
    const [isLocating, setIsLocating] = useState(false)

    // Amenities State
    const [allAmenities, setAllAmenities] = useState<Amenity[]>([])
    const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set())

    // Images State
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        async function loadAmenities() {
            const { data } = await supabase.from('amenities').select('*').order('name')
            if (data) setAllAmenities(data as Amenity[])
        }
        loadAmenities()
    }, [])

    function toggleAmenity(id: string) {
        const next = new Set(selectedAmenities)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedAmenities(next)
    }

    function handleImageFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files) return
        const newFiles = Array.from(e.target.files)
        setImageFiles(prev => [...prev, ...newFiles])
    }

    function removeImageFile(idx: number) {
        setImageFiles(prev => prev.filter((_, i) => i !== idx))
    }

    function handleGeolocation() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser')
            return
        }

        setIsLocating(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoordinates({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
                setIsLocating(false)
            },
            (error) => {
                console.error("Geolocation error:", error)
                alert("Unable to retrieve your location. Please drop a pin on the map instead.")
                setIsLocating(false)
            },
            { enableHighAccuracy: true }
        )
    }

    async function handleNext(e: React.FormEvent) {
        e.preventDefault()
        setStep(s => s + 1)
    }

    const handleAddRule = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault() // Prevent form submission
            const rule = currentRule.trim()
            if (rule && !houseRules.includes(rule)) {
                setHouseRules(prev => [...prev, rule])
            }
            setCurrentRule('')
        }
    }

    const removeRule = (ruleToRemove: string) => {
        setHouseRules(prev => prev.filter(r => r !== ruleToRemove))
    }

    async function handlePrev() {
        setStep(s => s - 1)
    }

    async function handleSubmit() {
        if (!user) return
        setUploading(true)

        try {
            // 1. Insert Property
            const propertyPayload = {
                landlord_id: user.id,
                title,
                description: description || null,
                address,
                city,
                price: parseFloat(price),
                bedrooms: parseInt(bedrooms),
                bathrooms: parseFloat(bathrooms),
                area_sqft: areaSqft ? parseInt(areaSqft) : null,
                available_from: availableFrom || null,
                status: 'review', // Default to review according to schema
                location: coordinates ? `POINT(${coordinates.lng} ${coordinates.lat})` : null,
                house_rules: houseRules.length > 0 ? houseRules : null
            }

            const { data: propertyData, error: propertyError } = await supabase
                .from('properties')
                .insert(propertyPayload)
                .select('id')
                .single()

            if (propertyError) throw propertyError
            const propertyId = propertyData.id

            // 2. Insert Amenities
            if (selectedAmenities.size > 0) {
                const amenitiesPayload = Array.from(selectedAmenities).map(amId => ({
                    property_id: propertyId,
                    amenity_id: amId
                }))

                const { error: amError } = await supabase
                    .from('property_amenities')
                    .insert(amenitiesPayload)

                if (amError) console.error("Amenity insertion error:", amError)
            }

            // 3. Upload Images & Insert Image Links
            if (imageFiles.length > 0) {
                const imagesPayload = []

                for (let i = 0; i < imageFiles.length; i++) {
                    const file = imageFiles[i]
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${propertyId}/${Date.now()}_${i}.${fileExt}`

                    const { error: uploadError } = await supabase.storage
                        .from('property-images')
                        .upload(fileName, file)

                    if (uploadError) {
                        console.error("Failed to upload image:", uploadError)
                        continue
                    }

                    const { data: publicUrlData } = supabase.storage
                        .from('property-images')
                        .getPublicUrl(fileName)

                    imagesPayload.push({
                        property_id: propertyId,
                        url: publicUrlData.publicUrl,
                        is_cover: i === 0, // first image is cover
                        sort_order: i
                    })
                }

                if (imagesPayload.length > 0) {
                    const { error: imgLinkError } = await supabase
                        .from('property_images')
                        .insert(imagesPayload)

                    if (imgLinkError) console.error("Image link error:", imgLinkError)
                }
            }

            navigate('/landlord/dashboard')

        } catch (err) {
            console.error("Failed to create listing", err)
            alert("Failed to create property. Please try again.")
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background text-headline">
            <header className="border-b border-secondary/10 px-6 sm:px-10 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/landlord/dashboard" className="text-sm text-paragraph hover:text-headline transition-colors">
                        ← Dashboard
                    </Link>
                    <span className="text-secondary/30">/</span>
                    <span className="text-sm font-semibold">New Listing</span>
                </div>
                <div className="text-sm font-mono text-paragraph">Step {step} of 4</div>
            </header>

            <main className="max-w-xl mx-auto px-6 py-12">
                <h1 className="text-2xl font-extrabold mb-8 tracking-tight">Create a New Property</h1>

                {step === 1 && (
                    <form onSubmit={handleNext} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold border-b border-secondary/10 pb-2">Basic Info</h2>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-paragraph uppercase tracking-widest">
                                        Title
                                    </label>
                                    <input
                                        required
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="E.g., Sunny 2BHK in Downtown"
                                        className="px-4 py-2.5 rounded-sm border border-secondary/25 bg-background text-sm text-headline focus:outline-none focus:ring-2 focus:ring-highlight"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-paragraph uppercase tracking-widest">
                                        Description
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Describe the main features of the property..."
                                        className="px-4 py-2.5 rounded-sm border border-secondary/25 bg-background text-sm text-headline focus:outline-none focus:ring-2 focus:ring-highlight resize-y"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                type="submit"
                                className="px-6 py-2.5 rounded-sm bg-button text-button-text text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all"
                            >
                                Next Step →
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleNext} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold border-b border-secondary/10 pb-2">Location & Pricing</h2>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-paragraph uppercase tracking-widest">City</label>
                                    <input
                                        required
                                        value={city}
                                        onChange={e => setCity(e.target.value)}
                                        placeholder="E.g., New York"
                                        className="px-4 py-2.5 rounded-sm border border-secondary/25 bg-background text-sm text-headline focus:outline-none focus:ring-2 focus:ring-highlight"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-paragraph uppercase tracking-widest">Address</label>
                                    <input
                                        required
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        placeholder="Full property address"
                                        className="px-4 py-2.5 rounded-sm border border-secondary/25 bg-background text-sm text-headline focus:outline-none focus:ring-2 focus:ring-highlight"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-paragraph uppercase tracking-widest">Monthly Rent (₹)</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        placeholder="E.g., 25000"
                                        className="px-4 py-2.5 rounded-sm border border-secondary/25 bg-background text-sm text-headline focus:outline-none focus:ring-2 focus:ring-highlight"
                                    />
                                </div>
                            </div>

                            {/* Map Location Picker */}
                            <div className="pt-4 border-t border-secondary/10">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-paragraph uppercase tracking-widest">Pin Location on Map</label>
                                    <button
                                        type="button"
                                        onClick={handleGeolocation}
                                        disabled={isLocating}
                                        className="text-xs font-bold text-highlight flex items-center gap-1 hover:underline disabled:opacity-50"
                                    >
                                        <Navigation className="w-3.5 h-3.5" />
                                        {isLocating ? 'Locating...' : 'Use My Location'}
                                    </button>
                                </div>
                                <p className="text-xs text-paragraph mb-3">Click on the map or drag the pin to set the exact location.</p>

                                <div className="h-64 border border-secondary/20 rounded-sm overflow-hidden relative">
                                    <MapContainer
                                        center={coordinates || [20.5937, 78.9629]} // Default to India if no coords
                                        zoom={coordinates ? 15 : 4}
                                        className="w-full h-full"
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <MapFixer />
                                        <LocationMarker position={coordinates} setPosition={setCoordinates} />
                                    </MapContainer>
                                </div>
                                {!coordinates && (
                                    <p className="text-xs font-bold text-tertiary mt-2">
                                        ⚠️ Please pin a location on the map to continue.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button
                                type="button"
                                onClick={handlePrev}
                                className="px-6 py-2.5 rounded-sm border border-secondary/20 text-paragraph text-sm font-bold hover:text-headline transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                type="submit"
                                disabled={!coordinates}
                                className="px-6 py-2.5 rounded-sm bg-button text-button-text text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                Next Step →
                            </button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleNext} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold border-b border-secondary/10 pb-2">Property Details</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-paragraph uppercase tracking-widest">Bedrooms</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        value={bedrooms}
                                        onChange={e => setBedrooms(e.target.value)}
                                        className="px-4 py-2.5 rounded-sm border border-secondary/25 bg-background text-sm text-headline focus:outline-none focus:ring-2 focus:ring-highlight"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-paragraph uppercase tracking-widest">Bathrooms</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={bathrooms}
                                        onChange={e => setBathrooms(e.target.value)}
                                        className="px-4 py-2.5 rounded-sm border border-secondary/25 bg-background text-sm text-headline focus:outline-none focus:ring-2 focus:ring-highlight"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-paragraph uppercase tracking-widest">Area (Sqft)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={areaSqft}
                                        onChange={e => setAreaSqft(e.target.value)}
                                        placeholder="e.g. 1200"
                                        className="px-4 py-2.5 rounded-sm border border-secondary/25 bg-background text-sm text-headline focus:outline-none focus:ring-2 focus:ring-highlight"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-paragraph uppercase tracking-widest">Available From</label>
                                    <div
                                        className="relative cursor-pointer group"
                                        onClick={() => {
                                            const el = document.getElementById('available-from-input') as HTMLInputElement | null;
                                            if (el) try { el.showPicker() } catch (e) { el.focus() }
                                        }}
                                    >
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-paragraph group-hover:text-highlight transition-colors pointer-events-none" />
                                        <input
                                            id="available-from-input"
                                            type="date"
                                            min={new Date().toISOString().split("T")[0]}
                                            value={availableFrom}
                                            onChange={e => setAvailableFrom(e.target.value)}
                                            className="w-full pl-11 pr-4 py-2.5 rounded-sm border border-secondary/25 bg-background text-sm text-headline focus:outline-none focus:ring-2 focus:ring-highlight cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* House Rules */}
                            <div className="pt-4 border-t border-secondary/10">
                                <label className="text-xs font-semibold text-paragraph uppercase tracking-widest mb-1.5 block">
                                    House Rules (Optional)
                                </label>
                                <p className="text-xs text-paragraph mb-3">
                                    Type a rule and press <strong>Enter</strong> to add it to the list.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="text"
                                        value={currentRule}
                                        onChange={e => setCurrentRule(e.target.value)}
                                        onKeyDown={handleAddRule}
                                        placeholder="e.g. No smoking inside, Quiet hours after 10 PM"
                                        className="px-4 py-2.5 rounded-sm border border-secondary/25 bg-background text-sm text-headline focus:outline-none focus:ring-2 focus:ring-highlight w-full"
                                    />
                                </div>
                                {houseRules.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {houseRules.map((rule, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 border border-secondary/20 rounded-sm w-fit text-sm font-semibold text-headline"
                                            >
                                                <span>{rule}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRule(rule)}
                                                    className="w-4 h-4 flex items-center justify-center rounded-sm hover:bg-red-500/20 text-red-500 transition-colors ml-1 leading-none"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button
                                type="button"
                                onClick={handlePrev}
                                className="px-6 py-2.5 rounded-sm border border-secondary/20 text-paragraph text-sm font-bold hover:text-headline transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 rounded-sm bg-button text-button-text text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all"
                            >
                                Next Step →
                            </button>
                        </div>
                    </form>
                )}

                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold border-b border-secondary/10 pb-2">Amenities</h2>
                            <p className="text-sm text-paragraph mb-4">
                                Select all that apply to your property.
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {allAmenities.map(am => (
                                    <label
                                        key={am.id}
                                        className={[
                                            'flex items-center gap-2 p-3 rounded-sm border cursor-pointer select-none transition-all',
                                            selectedAmenities.has(am.id)
                                                ? 'border-highlight bg-highlight/5 text-highlight'
                                                : 'border-secondary/20 bg-background text-headline hover:border-secondary/40'
                                        ].join(' ')}
                                    >
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={selectedAmenities.has(am.id)}
                                            onChange={() => toggleAmenity(am.id)}
                                        />
                                        <span className="text-sm font-semibold">{am.name}</span>
                                    </label>
                                ))}
                                {allAmenities.length === 0 && (
                                    <p className="text-sm text-paragraph col-span-full">No amenities loaded. Check database.</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button
                                type="button"
                                onClick={handlePrev}
                                className="px-6 py-2.5 rounded-sm border border-secondary/20 text-paragraph text-sm font-bold hover:text-headline transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={() => setStep(5)}
                                className="px-6 py-2.5 rounded-sm bg-button text-button-text text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all"
                            >
                                Next Step →
                            </button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-5">
                            <h2 className="text-lg font-bold border-b border-secondary/10 pb-2">Property Images</h2>
                            <p className="text-sm text-paragraph mb-4">
                                Add photos of your property. The first image will be used as the cover photo.
                            </p>

                            <div className="flex flex-col gap-4">
                                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-secondary/30 rounded-sm cursor-pointer hover:bg-secondary/5 transition-colors">
                                    <span className="text-sm font-semibold text-headline mb-1">Click to upload images</span>
                                    <span className="text-xs text-paragraph">PNG, JPG, max 5MB each</span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/png, image/jpeg, image/jpg"
                                        className="hidden"
                                        onChange={handleImageFileSelect}
                                    />
                                </label>

                                {imageFiles.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                                        {imageFiles.map((file, idx) => (
                                            <div key={idx} className="relative group rounded-sm overflow-hidden aspect-square bg-secondary/10 border border-secondary/20">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Upload preview ${idx}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                    <button
                                                        onClick={() => removeImageFile(idx)}
                                                        className="text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                                {idx === 0 && (
                                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-highlight text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm">
                                                        Cover
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between">
                            <button
                                type="button"
                                onClick={handlePrev}
                                disabled={uploading}
                                className="px-6 py-2.5 rounded-sm border border-secondary/20 text-paragraph text-sm font-bold hover:text-headline transition-colors disabled:opacity-40"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={uploading || imageFiles.length === 0}
                                className="px-6 py-2.5 rounded-sm bg-highlight text-white text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
                            >
                                {uploading ? 'Publishing...' : 'Publish Listing'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

/* ── Helper Component for Map Interaction ── */

const customIcon = divIcon({
    html: renderToString(
        <div className="relative -top-6 -left-3 animate-[fadeIn_0.3s_ease-out]">
            <MapPin className="text-highlight fill-highlight/20 w-8 h-8 drop-shadow-md" strokeWidth={2.5} />
            <div className="absolute top-[8px] left-[10px] w-3 h-3 bg-secondary rounded-full" />
        </div>
    ),
    className: 'bg-transparent border-none',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
})

function LocationMarker({
    position,
    setPosition
}: {
    position: { lat: number, lng: number } | null,
    setPosition: (pos: { lat: number, lng: number }) => void
}) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng)
            map.flyTo(e.latlng, map.getZoom())
        }
    })

    // Create a mutable ref to the marker so we can read its drag position
    const markerRef = useRef<any>(null)
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current
                if (marker != null) {
                    setPosition(marker.getLatLng())
                }
            },
        }),
        [setPosition],
    )

    // Ensure map pans if position is set externally (e.g. geolocation)
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15)
        }
    }, [position, map])

    return position === null ? null : (
        <Marker
            position={position}
            icon={customIcon}
            draggable={true}
            eventHandlers={eventHandlers}
            ref={markerRef}
        >
            <Popup className="settlein-popup font-semibold text-headline">
                Property Location
            </Popup>
        </Marker>
    )
}

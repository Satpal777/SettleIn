export type PropertyStatus = 'draft' | 'review' | 'active' | 'rented' | 'rejected'

export interface Property {
    id: string
    landlord_id: string
    title: string
    description: string | null
    address: string
    city: string
    price: number
    bedrooms: number
    bathrooms: number
    area_sqft: number | null
    lat?: number | null
    lng?: number | null
    available_from: string | null
    status: PropertyStatus
    review_notes: string | null
    house_rules: string | string[] | null
    created_at: string
    updated_at: string
    type?: string
    property_images?: { url: string; is_cover: boolean }[]
    property_amenities?: { amenities: { name: string } }[]
    interested_count?: number
    is_shortlisted?: boolean
}

export interface Amenity {
    id: string
    name: string
}

export interface PropertyImage {
    id: string
    property_id: string
    url: string
    is_cover: boolean
    sort_order: number
    created_at: string
}

export interface PropertyAmenity {
    property_id: string
    amenity_id: string
}

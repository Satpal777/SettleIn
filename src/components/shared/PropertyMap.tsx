import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { divIcon } from 'leaflet'
import { renderToString } from 'react-dom/server'
import { Home } from 'lucide-react'
import { Link } from 'react-router-dom'

function MapRecenter({ markers }: { markers: PropertyMarker[] }) {
    const map = useMap()

    useEffect(() => {
        if (markers.length === 0) return
        let minLat = markers[0].lat
        let maxLat = markers[0].lat
        let minLng = markers[0].lng
        let maxLng = markers[0].lng
        markers.forEach(m => {
            if (m.lat < minLat) minLat = m.lat
            if (m.lat > maxLat) maxLat = m.lat
            if (m.lng < minLng) minLng = m.lng
            if (m.lng > maxLng) maxLng = m.lng
        })

        if (markers.length === 1) {
            map.flyTo([markers[0].lat, markers[0].lng], 14, { duration: 1.5 })
        } else {
            map.flyToBounds([
                [minLat, minLng],
                [maxLat, maxLng]
            ], { padding: [50, 50], duration: 1.5 })
        }
    }, [markers, map])

    return null
}

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

function ActiveMarkerZoomer({ markers, activeMarkerId }: { markers: PropertyMarker[], activeMarkerId?: string | null }) {
    const map = useMap()

    useEffect(() => {
        if (!activeMarkerId) return

        const activeMarker = markers.find(m => m.id === activeMarkerId)
        if (activeMarker) {
            map.flyTo([activeMarker.lat, activeMarker.lng], 18, { duration: 1.2 })
        }
    }, [activeMarkerId, markers, map])

    return null
}

export interface PropertyMarker {
    id: string
    lat: number
    lng: number
    price: number
    title: string
    image?: string
}

interface PropertyMapProps {
    markers: PropertyMarker[]
    className?: string
    interactive?: boolean
    activeMarkerId?: string | null
    onMarkerClick?: (id: string) => void
}

const createCustomIcon = (isActive: boolean) => {

    const bgColor = isActive ? 'bg-button' : 'bg-headline'
    const iconColor = isActive ? 'text-button-text' : 'text-background'
    const scale = isActive ? 'scale-110 z-[1000]' : 'scale-100 z-10'
    const pointerColor = isActive ? 'border-t-button' : 'border-t-headline'

    const iconHtml = renderToString(
        <div className={`relative flex flex-col items-center transition-all duration-300 ${scale} animate-[fadeIn_0.3s_ease-out] drop-shadow-md`}>
            <div className={`w-9 h-9 ${bgColor} rounded-full flex items-center justify-center border-2 border-background shadow-sm`}>
                <Home className={`w-4 h-4 ${iconColor}`} strokeWidth={3} />
            </div>
            <div className={`w-0 h-0 border-l-[6px] border-r-[6px] border-t-8 border-l-transparent border-r-transparent ${pointerColor} -mt-px`} />
        </div>
    )

    return divIcon({
        html: iconHtml,
        className: 'bg-transparent border-none',
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -44]
    })
}

export default function PropertyMap({
    markers,
    className = "",
    interactive = true,
    activeMarkerId,
    onMarkerClick
}: PropertyMapProps) {
    const defaultCenter: [number, number] = markers.length > 0
        ? [markers[0].lat, markers[0].lng]
        : [39.8283, -98.5795]

    return (
        <div className={`w-full h-full bg-secondary/10 rounded-sm z-10 relative ${className}`}>
            <MapContainer
                center={defaultCenter}
                zoom={10}
                scrollWheelZoom={interactive}
                dragging={interactive}
                zoomControl={interactive}
                doubleClickZoom={interactive}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                />

                <MapFixer />
                <ActiveMarkerZoomer markers={markers} activeMarkerId={activeMarkerId} />
                <MapRecenter markers={markers} />

                {markers.map(marker => {
                    const isActive = marker.id === activeMarkerId
                    return (
                        <Marker
                            key={marker.id}
                            position={[marker.lat, marker.lng]}
                            icon={createCustomIcon(isActive)}
                            eventHandlers={{
                                click: () => {
                                    if (onMarkerClick) onMarkerClick(marker.id)
                                }
                            }}
                            zIndexOffset={isActive ? 1000 : 0}
                        >
                            <Popup className="settlein-popup">
                                <div className="w-48 overflow-hidden rounded-sm -m-3">
                                    {marker.image && (
                                        <img
                                            src={marker.image}
                                            alt={marker.title}
                                            className="w-full h-24 object-cover"
                                        />
                                    )}
                                    <div className="p-3 bg-background text-headline">
                                        <h4 className="font-bold text-sm truncate mb-1">{marker.title}</h4>
                                        <p className="font-extrabold text-highlight mb-2">
                                            ${marker.price.toLocaleString()}/mo
                                        </p>
                                        <Link
                                            to={`/listings/${marker.id}`}
                                            className="block text-center text-xs font-bold bg-secondary/10 hover:bg-secondary/20 transition-colors py-1.5 rounded-sm"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </div>
    )
}

import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageDialogProps {
    isOpen: boolean
    onClose: () => void
    images: string[]
    currentIndex: number
    onIndexChange: (index: number) => void
}

export default function ImageDialog({ isOpen, onClose, images, currentIndex, onIndexChange }: ImageDialogProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft') handlePrev()
            if (e.key === 'ArrowRight') handleNext()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, currentIndex])

    if (!isOpen) return null

    const handlePrev = () => {
        onIndexChange((currentIndex - 1 + images.length) % images.length)
    }

    const handleNext = () => {
        onIndexChange((currentIndex + 1) % images.length)
    }

    return (
        <div className={`fixed inset-0 z-100 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between text-white bg-linear-to-b from-black/60 to-transparent z-20">
                <span className="text-xs font-black tracking-widest uppercase">
                    Image {currentIndex + 1} of {images.length}
                </span>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="px-4 w-full flex items-center justify-between pointer-events-none z-10">
                <button
                    onClick={handlePrev}
                    className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all active:scale-90 pointer-events-auto"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                    onClick={handleNext}
                    className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all active:scale-90 pointer-events-auto"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            </div>

            <div className="absolute inset-0 flex items-center justify-center p-4 md:p-12 overflow-hidden bg-black/90 backdrop-blur-sm" onClick={onClose}>
                {images[currentIndex] ? (
                    <img
                        src={images[currentIndex]}
                        alt={`Document image ${currentIndex + 1}`}
                        className="max-w-full max-h-full object-contain shadow-2xl animate-[scaleUp_0.3s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.img-error')) {
                                const err = document.createElement('div');
                                err.className = 'img-error text-center text-white';
                                err.innerHTML = `<p class="font-bold">Failed to load image</p><p class="text-xs opacity-60 mt-1">${images[currentIndex]}</p>`;
                                parent.appendChild(err);
                            }
                        }}
                    />
                ) : (
                    <div className="text-white text-center">
                        <p className="font-bold">No image URL found</p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-10 left-0 right-0 overflow-x-auto z-10">
                <div className="flex justify-center items-center gap-3 px-6 mx-auto w-max">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => onIndexChange(i)}
                            className={`shrink-0 w-16 h-16 rounded-sm overflow-hidden border-2 transition-all ${currentIndex === i ? 'border-highlight scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                        >
                            <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

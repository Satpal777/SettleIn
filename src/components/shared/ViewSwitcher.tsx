import type { ActiveView } from '../../hooks/useProfile'
import { ShieldCheck, Search, Home } from 'lucide-react'

interface Props {
    activeView: ActiveView | 'admin'
    onSwitch: (view: ActiveView | 'admin') => void
    isAdmin?: boolean
    variant?: 'horizontal' | 'vertical' | 'icon-only'
}

export default function ViewSwitcher({ activeView, onSwitch, isAdmin, variant = 'horizontal' }: Props) {
    const isVertical = variant === 'vertical'
    const isIconOnly = variant === 'icon-only'

    return (
        <div
            className={[
                'flex rounded-sm border border-secondary/20 overflow-hidden text-xs font-semibold bg-background shrink-0',
                isVertical ? 'flex-col w-full' : 'items-center inline-flex'
            ].join(' ')}
            role="group"
            aria-label="Switch dashboard view"
        >
            {isAdmin && (
                <>
                    <button
                        onClick={() => onSwitch('admin')}
                        aria-pressed={activeView === 'admin'}
                        title="Admin View"
                        className={[
                            'transition-colors duration-150 flex items-center gap-2 justify-center',
                            isIconOnly ? 'p-2' : 'px-3 py-1.5',
                            isVertical ? 'w-full py-2' : '',
                            activeView === 'admin'
                                ? 'bg-highlight text-button-text'
                                : 'text-paragraph hover:text-headline hover:bg-secondary/10',
                        ].join(' ')}
                    >
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        {!isIconOnly && <span>Admin</span>}
                    </button>
                    <span className={`${isVertical ? 'h-px w-full' : 'w-px h-4'} bg-secondary/20 shrink-0`} aria-hidden="true" />
                </>
            )}
            <button
                onClick={() => onSwitch('seeker')}
                aria-pressed={activeView === 'seeker'}
                title="Seeker View"
                className={[
                    'transition-colors duration-150 flex items-center gap-2 justify-center',
                    isIconOnly ? 'p-2' : 'px-3 py-1.5',
                    isVertical ? 'w-full py-2' : '',
                    activeView === 'seeker'
                        ? 'bg-highlight text-button-text'
                        : 'text-paragraph hover:text-headline hover:bg-secondary/10',
                ].join(' ')}
            >
                <Search className="w-3.5 h-3.5 shrink-0" />
                {!isIconOnly && <span>Seeker</span>}
            </button>
            <span className={`${isVertical ? 'h-px w-full' : 'w-px h-4'} bg-secondary/20 shrink-0`} aria-hidden="true" />
            <button
                onClick={() => onSwitch('landlord')}
                aria-pressed={activeView === 'landlord'}
                title="Landlord View"
                className={[
                    'transition-colors duration-150 flex items-center gap-2 justify-center',
                    isIconOnly ? 'p-2' : 'px-3 py-1.5',
                    isVertical ? 'w-full py-2' : '',
                    activeView === 'landlord'
                        ? 'bg-highlight text-button-text'
                        : 'text-paragraph hover:text-headline hover:bg-secondary/10',
                ].join(' ')}
            >
                <Home className="w-3.5 h-3.5 shrink-0" />
                {!isIconOnly && <span>Landlord</span>}
            </button>
        </div>
    )
}

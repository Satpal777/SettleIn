import { Ticket } from 'lucide-react'

export default function AdminTicketsPage() {
    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out]">
            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold mb-1 tracking-tight flex items-center gap-2">
                            <Ticket className="w-6 h-6 text-paragraph" /> Global Tickets
                        </h1>
                        <p className="text-sm text-paragraph">Monitor escalated issues and platform-wide support.</p>
                    </div>
                </div>
            </header>
            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* ── Tabs ── */}
                <div className="flex gap-4 mb-6 border-b border-secondary/10">
                    <button className="text-sm font-bold text-headline pb-2 border-b-2 border-highlight px-1">Escalated</button>
                    <button className="text-sm font-semibold text-paragraph hover:text-headline pb-2 border-b-2 border-transparent hover:border-secondary/20 transition-colors px-1">All Active</button>
                </div>
                <div className="bg-secondary/5 rounded-lg border border-secondary/10 p-12 text-center">
                    <p className="text-secondary font-medium">No escalated tickets currently require admin intervention.</p>
                </div>
            </main>
        </div>
    )
}

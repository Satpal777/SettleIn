import { MessageSquare, ChevronRight } from 'lucide-react'

// Mock Data
const TICKETS = [
    { id: '1', date: 'Oct 20, 2024', property: 'Emerald Gardens - Apt 4B', tenant: 'Alice Johnson', issue: 'Leaky Faucet in Kitchen', status: 'Open', priority: 'Medium' },
    { id: '2', date: 'Oct 18, 2024', property: 'The Pine District Studio', tenant: 'Sarah Connor', issue: 'Heating not working', status: 'In Progress', priority: 'High' }
]

export default function LandlordTicketsPage() {
    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out]">
            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold mb-1 tracking-tight flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-paragraph" /> Support Tickets
                        </h1>
                        <p className="text-sm text-paragraph">Respond to tenant issues and maintenance requests.</p>
                    </div>
                </div>
            </header>
            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="space-y-4">
                    {TICKETS.map(ticket => (
                        <div key={ticket.id} className="bg-background border border-secondary/15 rounded-sm p-5 hover:border-secondary/40 transition-colors shadow-sm flex items-center justify-between group">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-bold text-headline">{ticket.issue}</h3>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${ticket.priority === 'High' ? 'bg-highlight/10 text-highlight' : 'bg-secondary/10 text-secondary'}`}>
                                        {ticket.priority}
                                    </span>
                                </div>
                                <p className="text-xs text-paragraph mb-2">{ticket.property} • <span className="font-semibold text-headline">{ticket.tenant}</span></p>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${ticket.status === 'Open' ? 'bg-highlight/10 text-highlight' : 'bg-tertiary/10 text-tertiary'}`}>
                                        {ticket.status}
                                    </span>
                                    <button className="text-[10px] font-bold uppercase tracking-widest text-paragraph hover:text-highlight transition-all flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                        View Case <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-paragraph uppercase font-bold tracking-widest">{ticket.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}

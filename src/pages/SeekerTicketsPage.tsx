import { useState } from 'react'
import { MessageSquare, CheckCircle2, AlertCircle, Clock, Plus, ArrowLeft, Send } from 'lucide-react'

// Mock Data
const TICKETS = [
    {
        id: 'TKT-001',
        title: 'Query about pet policy',
        status: 'Resolved',
        date: 'Oct 21, 2026',
        lastMessage: 'Agent Sarah replied: Yes, small dogs are allowed with an additional deposit.',
        property: 'Emerald Gardens - Apt 4B',
        thread: [
            { id: 'm1', sender: 'seeker', text: 'Hi, are pets allowed here?', time: 'Oct 21, 10:00 AM' },
            { id: 'm2', sender: 'agent', name: 'Sarah Connor', text: 'Yes, small dogs are allowed with an additional deposit.', time: 'Oct 21, 11:30 AM' }
        ]
    },
    {
        id: 'TKT-002',
        title: 'Gym amenity access hours',
        status: 'Open',
        date: 'Oct 23, 2026',
        lastMessage: 'You asked: What are the exact timings for the building gym?',
        property: 'Emerald Gardens - Apt 4B',
        thread: [
            { id: 'm1', sender: 'seeker', text: 'What are the exact timings for the building gym?', time: 'Oct 23, 02:15 PM' }
        ]
    },
    {
        id: 'TKT-003',
        title: 'Lease name correction',
        status: 'Open',
        date: 'Oct 24, 2026',
        lastMessage: 'You asked: Can we update the middle initial on the draft agreement?',
        property: 'General Inquiry',
        thread: [
            { id: 'm1', sender: 'seeker', text: 'Can we update the middle initial on the draft agreement?', time: 'Oct 24, 09:00 AM' }
        ]
    }
]

export default function SeekerTicketsPage() {
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null)

    const activeTicket = TICKETS.find(t => t.id === activeTicketId)

    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out]">

            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold mb-1 tracking-tight flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-paragraph" /> Support & Queries
                        </h1>
                        <p className="text-sm text-paragraph">Track your questions, maintenance requests, and agent replies.</p>
                    </div>
                    {!activeTicketId && (
                        <button className="bg-headline text-background font-bold px-4 py-2.5 rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm shrink-0">
                            <Plus className="w-4 h-4" /> New Ticket
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">

                {activeTicket ? (
                    /* ── Threaded View ── */
                    <div className="bg-background border-2 border-headline rounded-sm shadow-[4px_4px_0_var(--color-secondary/10)] overflow-hidden flex flex-col h-[600px] animate-[fadeIn_0.2s_ease-out]">

                        {/* Thread Header */}
                        <div className="bg-secondary/5 border-b border-secondary/10 p-4 flex items-center gap-4">
                            <button
                                onClick={() => setActiveTicketId(null)}
                                className="w-8 h-8 flex shrink-0 items-center justify-center rounded-sm hover:bg-secondary/10 transition-colors border border-secondary/20"
                            >
                                <ArrowLeft className="w-4 h-4 text-headline" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-sm font-bold truncate">{activeTicket.title}</h2>
                                    <span className={`text-[9px] shrink-0 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${activeTicket.status === 'Resolved' ? 'bg-tertiary/10 text-tertiary' : 'bg-highlight/10 text-highlight'}`}>
                                        {activeTicket.status}
                                    </span>
                                </div>
                                <p className="text-xs text-paragraph flex items-center gap-2">
                                    <span className="font-semibold">{activeTicket.id}</span>
                                    <span className="w-1 h-1 rounded-full bg-secondary/30"></span>
                                    <span className="truncate">{activeTicket.property}</span>
                                </p>
                            </div>
                        </div>

                        {/* Thread Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-secondary/5 bg-[radial-gradient(var(--color-secondary)_1px,transparent_1px)] bg-size-[20px_20px] opacity-[0.98]">
                            {activeTicket.thread.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === 'seeker' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] ${msg.sender === 'seeker' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>

                                        {msg.sender === 'agent' && (
                                            <span className="text-[10px] font-bold text-paragraph uppercase tracking-wider ml-1">{msg.name}</span>
                                        )}

                                        <div className={`p-4 rounded-sm border ${msg.sender === 'seeker'
                                            ? 'bg-headline text-background border-headline rounded-tr-none'
                                            : 'bg-background text-headline border-secondary/20 shadow-sm rounded-tl-none'
                                            }`}>
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                        </div>

                                        <span className={`text-[10px] font-bold text-paragraph/60 uppercase tracking-widest flex items-center gap-1 ${msg.sender === 'seeker' ? 'mr-1' : 'ml-1'}`}>
                                            <Clock className="w-3 h-3" /> {msg.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Thread Input Area */}
                        {activeTicket.status !== 'Resolved' ? (
                            <div className="p-4 bg-background border-t border-secondary/10 flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Type your reply..."
                                    className="flex-1 bg-secondary/5 border border-secondary/20 rounded-sm px-4 py-2 text-sm focus:outline-none focus:border-highlight focus:ring-1 focus:ring-highlight transition-all"
                                />
                                <button className="bg-highlight hover:bg-highlight/90 text-button-text px-4 py-2 rounded-sm font-bold text-sm transition-colors flex items-center justify-center shadow-sm">
                                    <Send className="w-4 h-4 shrink-0" />
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 bg-background border-t border-secondary/10 text-center">
                                <p className="text-sm text-paragraph font-semibold">This ticket is marked as resolved and closed for new replies.</p>
                            </div>
                        )}

                    </div>
                ) : (
                    /* ── List View ── */
                    <>
                        {/* ── Tabs ── */}
                        <div className="flex gap-4 mb-6 border-b border-secondary/10">
                            <button className="text-sm font-bold text-headline pb-2 border-b-2 border-highlight px-1">All Tickets ({TICKETS.length})</button>
                            <button className="text-sm font-semibold text-paragraph hover:text-headline pb-2 border-b-2 border-transparent hover:border-secondary/20 transition-colors px-1">Open (2)</button>
                            <button className="text-sm font-semibold text-paragraph hover:text-headline pb-2 border-b-2 border-transparent hover:border-secondary/20 transition-colors px-1">Resolved (1)</button>
                        </div>

                        {/* ── Ticket List ── */}
                        <div className="space-y-4">
                            {TICKETS.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setActiveTicketId(ticket.id)}
                                    className="bg-background border border-secondary/15 rounded-sm p-5 hover:border-headline/30 hover:shadow-sm transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="mt-0.5">
                                            {ticket.status === 'Resolved'
                                                ? <CheckCircle2 className="w-5 h-5 text-tertiary" />
                                                : <AlertCircle className="w-5 h-5 text-highlight" />}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="text-sm font-bold group-hover:underline text-headline">{ticket.title}</h3>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${ticket.status === 'Resolved' ? 'bg-tertiary/10 text-tertiary' : 'bg-highlight/10 text-highlight'}`}>
                                                    {ticket.status}
                                                </span>
                                                <span className="text-[10px] text-paragraph border border-secondary/20 px-1.5 py-0.5 rounded-sm bg-secondary/5 font-semibold">
                                                    {ticket.property}
                                                </span>
                                            </div>
                                            <p className="text-xs text-paragraph/80 max-w-xl truncate mt-1.5">{ticket.lastMessage}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 sm:self-start flex flex-col items-end gap-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-paragraph/60 flex items-center gap-1.5 justify-end">
                                            <Clock className="w-3 h-3" /> {ticket.date}
                                        </p>
                                        <span className="text-[10px] text-paragraph border border-secondary/20 px-1.5 py-0.5 rounded-sm group-hover:border-headline/30 transition-colors">{ticket.id}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

            </main>
        </div>
    )
}

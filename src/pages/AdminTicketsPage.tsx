import { useState, useEffect } from 'react'
import { Ticket, Trash2, CheckCircle2, AlertCircle, Clock, ArrowLeft, Send, Search } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function AdminTicketsPage() {
    const { user } = useAuth()
    const [tickets, setTickets] = useState<any[]>([])
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (!user) return;
        fetchTickets();
    }, [user])

    const fetchTickets = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('tickets')
            .select('*, properties:property_id(title), seeker:seeker_id(full_name), landlord:landlord_id(full_name)')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setTickets(data);
        }
        setLoading(false)
    }

    useEffect(() => {
        if (!activeTicketId) {
            setMessages([]);
            return;
        }

        fetchMessages(activeTicketId);

        const channel = supabase
            .channel('ticket_messages_changes_admin')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${activeTicketId}`
                },
                (payload) => {
                    setMessages(prev => [...prev, payload.new]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [activeTicketId])

    const fetchMessages = async (ticketId: string) => {
        const { data, error } = await supabase
            .from('ticket_messages')
            .select('*, profiles:sender_id(full_name, role)')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (!error && data) {
            setMessages(data);
        }
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeTicketId || !user) return;

        const tempMessage = newMessage;
        setNewMessage('');

        const { error } = await supabase
            .from('ticket_messages')
            .insert({
                ticket_id: activeTicketId,
                sender_id: user.id,
                body: tempMessage
            });

        if (error) {
            console.error(error);
            setNewMessage(tempMessage);
            alert("Error sending message");
        }
    }

    const handleDeleteTicket = async (e: React.MouseEvent, ticketId: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this ticket? All messages will be permanently removed. This cannot be undone.")) return;

        const { error } = await supabase
            .from('tickets')
            .delete()
            .eq('id', ticketId);

        if (error) {
            console.error("Error deleting ticket:", error);
            alert("Failed to delete ticket.");
        } else {
            setTickets(prev => prev.filter(t => t.id !== ticketId));
            if (activeTicketId === ticketId) setActiveTicketId(null);
        }
    }

    const activeTicket = tickets.find(t => t.id === activeTicketId)

    const filteredTickets = tickets.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.properties?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                {activeTicket ? (
                    /* ── Threaded View for Ticket ── */
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
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h2 className="text-sm font-bold truncate">{activeTicket.title}</h2>
                                    <span className={`text-[9px] shrink-0 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${activeTicket.status === 'resolved' ? 'bg-tertiary/10 text-tertiary' : 'bg-highlight/10 text-highlight'}`}>
                                        {activeTicket.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <p className="text-xs text-paragraph flex flex-wrap items-center gap-2">
                                    <span className="font-semibold">{activeTicket.id.split('-')[0]}</span>
                                    <span className="w-1 h-1 rounded-full bg-secondary/30 hidden sm:block"></span>
                                    <span className="truncate">{activeTicket.seeker?.full_name || 'Seeker'}</span>
                                    <span className="w-1 h-1 rounded-full bg-secondary/30 hidden sm:block"></span>
                                    <span className="truncate">{activeTicket.properties?.title || 'General Inquiry'}</span>
                                </p>
                            </div>
                            <button onClick={(e) => handleDeleteTicket(e, activeTicket.id)} className="text-xs font-bold border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors px-3 py-1.5 rounded-sm whitespace-nowrap hidden sm:flex items-center gap-1.5">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                        </div>

                        {/* Thread Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-secondary/5">
                            {messages.map(msg => {
                                const isMe = msg.sender_id === user?.id;
                                const senderName = msg.profiles?.full_name || 'Admin';
                                const time = new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>

                                            {!isMe && (
                                                <span className="text-[10px] font-bold text-paragraph uppercase tracking-wider ml-1">{senderName}</span>
                                            )}

                                            <div className={`p-4 rounded-sm border ${isMe
                                                ? 'bg-headline text-background border-headline rounded-tr-none'
                                                : 'bg-background text-headline border-secondary/20 shadow-sm rounded-tl-none'
                                                }`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                            </div>

                                            <span className={`text-[10px] font-bold text-paragraph/60 uppercase tracking-widest flex items-center gap-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                                <Clock className="w-3 h-3" /> {time}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Thread Input Area */}
                        {activeTicket.status !== 'resolved' ? (
                            <div className="p-4 bg-background border-t border-secondary/10 flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Type your reply as Admin..."
                                    className="flex-1 bg-secondary/5 border border-secondary/20 rounded-sm px-4 py-2 text-sm focus:outline-none focus:border-highlight focus:ring-1 focus:ring-highlight transition-all"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button onClick={handleSendMessage} className="bg-highlight hover:bg-highlight/90 text-button-text px-4 py-2 rounded-sm font-bold text-sm transition-colors flex items-center justify-center shadow-sm">
                                    <Send className="w-4 h-4 shrink-0" />
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 bg-background border-t border-secondary/10 text-center flex flex-col items-center justify-center gap-2">
                                <p className="text-sm text-paragraph font-semibold">This ticket is marked as resolved and closed for new replies.</p>
                            </div>
                        )}

                    </div>
                ) : (
                    <>
                        {/* ── Tabs & Search ── */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6 border-b border-secondary/10 pb-4 items-center justify-between">
                            <div className="flex gap-4 overflow-x-auto custom-scrollbar w-full sm:w-auto">
                                <button className="text-sm font-bold text-headline pb-2 border-b-2 border-highlight px-1 whitespace-nowrap">All Tickets ({tickets.length})</button>
                                <button className="text-sm font-semibold text-paragraph hover:text-headline pb-2 border-b-2 border-transparent hover:border-secondary/20 transition-colors px-1 whitespace-nowrap">Open ({tickets.filter(t => t.status !== 'resolved').length})</button>
                                <button className="text-sm font-semibold text-paragraph hover:text-headline pb-2 border-b-2 border-transparent hover:border-secondary/20 transition-colors px-1 whitespace-nowrap">Resolved ({tickets.filter(t => t.status === 'resolved').length})</button>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-paragraph/50" />
                                <input
                                    type="text"
                                    placeholder="Search tickets..."
                                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-secondary/5 border border-secondary/20 rounded-sm focus:outline-none focus:border-highlight focus:ring-1 focus:ring-highlight transition-all"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-sm text-paragraph font-semibold animate-pulse">Loading tickets...</div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="text-center py-20 border border-secondary/10 border-dashed rounded-sm bg-secondary/5">
                                <Ticket className="w-10 h-10 text-secondary/40 mx-auto mb-3" />
                                <h3 className="text-base font-bold text-headline mb-1">No Support Tickets Found</h3>
                                <p className="text-xs text-paragraph mb-0">{searchQuery ? 'Try adjusting your search criteria.' : 'System clear! No tickets have been raised yet.'}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredTickets.map(ticket => {
                                    const dateDisplay = new Date(ticket.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                    return (
                                        <div
                                            key={ticket.id}
                                            onClick={() => setActiveTicketId(ticket.id)}
                                            className="bg-background border border-secondary/15 rounded-sm p-5 hover:border-headline/30 hover:shadow-sm transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="mt-0.5">
                                                    {ticket.status === 'resolved'
                                                        ? <CheckCircle2 className="w-5 h-5 text-tertiary" />
                                                        : <AlertCircle className="w-5 h-5 text-highlight" />}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-1 text-sm">
                                                        <h3 className="font-bold group-hover:underline text-headline">{ticket.title}</h3>
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${ticket.status === 'resolved' ? 'bg-tertiary/10 text-tertiary' : 'bg-highlight/10 text-highlight'}`}>
                                                            {ticket.status.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-[10px] text-paragraph border border-secondary/20 px-1.5 py-0.5 rounded-sm bg-secondary/5 font-semibold truncate max-w-[150px]">
                                                            {ticket.properties?.title || 'General'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-paragraph/80 max-w-xl truncate mt-1.5 flex flex-wrap gap-2 items-center">
                                                        <span>From: <span className="font-semibold text-headline">{ticket.seeker?.full_name || 'Seeker'}</span></span>
                                                        {ticket.landlord && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-secondary/30"></span>
                                                                <span>To: <span className="font-semibold text-headline">{ticket.landlord.full_name}</span></span>
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 sm:self-start flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-paragraph/60 flex items-center gap-1.5 justify-end">
                                                        <Clock className="w-3 h-3" /> {dateDisplay}
                                                    </p>
                                                    <button
                                                        onClick={(e) => handleDeleteTicket(e, ticket.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded-sm text-red-500/70 hover:text-red-500"
                                                        title="Delete Ticket"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <span className="text-[10px] text-paragraph border border-secondary/20 px-1.5 py-0.5 rounded-sm group-hover:border-headline/30 transition-colors bg-background">{ticket.id.split('-')[0]}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

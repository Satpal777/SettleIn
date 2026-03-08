import {
    HelpCircle, Shield, User, Home, ClipboardCheck, MessageSquare,
    Search, Calendar, FileText, CheckCircle2,
    Atom, Type, Wind, Database, Zap, BoxSelect, Map, Cpu
} from 'lucide-react'
import Navbar from '../components/landing/Navbar'

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-background text-headline">
            <Navbar />

            <main className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center justify-center p-3 rounded-sm bg-highlight/10 text-highlight mb-4">
                        <HelpCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">How SettleIn Works</h1>

                    {/* Motivation Section */}
                    <div className="max-w-3xl mx-auto py-6 px-8 rounded-sm border border-highlight/20 bg-highlight/5 mt-8 mb-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-highlight"></div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-highlight/60 mb-3">Buildthon Motivation</h2>
                        <p className="text-lg text-paragraph leading-relaxed italic">
                            SettleIn was developed as part of the <strong className="text-highlight">Chai Code</strong> Buildthon.
                            A huge thanks to <strong className="text-highlight">Hitesh Choudhary</strong> and <strong className="text-tertiary">Piyush sir</strong> for the constant inspiration and technical guidance throughout this journey.
                        </p>
                    </div>

                    <p className="text-lg text-paragraph max-w-2xl mx-auto">
                        Your complete guide to discovering, booking, and managing rentals on our platform.
                    </p>
                </div>

                <div className="space-y-24">
                    {/* Authentication Section */}
                    <section id="auth" className="space-y-8">
                        <div className="flex items-center gap-4 border-b border-secondary/10 pb-4">
                            <Shield className="w-6 h-6 text-highlight" />
                            <h2 className="text-2xl sm:text-3xl font-bold">Account & Privacy</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                            <div className="space-y-6">
                                <p className="text-paragraph leading-relaxed">
                                    We prioritize your security with a <strong>passwordless login system</strong>. No more passwords to remember or lose.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        'Secure login via your email inbox.',
                                        'No passwords required, preventing unauthorized access.',
                                        'Your data is isolated and private by default.',
                                        'Full control over your profile and preferences.'
                                    ].map((text, i) => (
                                        <li key={i} className="flex gap-3 text-sm font-medium">
                                            <CheckCircle2 className="w-5 h-5 text-highlight shrink-0" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="rounded-xl border border-secondary/15 bg-secondary/5 p-6 space-y-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-highlight/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-highlight/10 transition-all"></div>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-highlight" />
                                    Privacy First
                                </h3>
                                <p className="text-sm text-paragraph italic leading-relaxed relative z-10">
                                    "Your documents and personal information are protected by industry-standard encryption and strict access controls, accessible only to you and authorized platform managers."
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Seeker Workflow */}
                    <section id="seeker" className="space-y-8">
                        <div className="flex items-center gap-4 border-b border-secondary/10 pb-4">
                            <Search className="w-6 h-6 text-highlight" />
                            <h2 className="text-2xl sm:text-3xl font-bold">The Seeker Journey</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: <Search className="w-5 h-5" />,
                                    title: '1. Discovery',
                                    desc: 'Browse listings with smart filters. Save favorites to your shortlist and compare them side-by-side.',
                                    img: '/discovery.png'
                                },
                                {
                                    icon: <Calendar className="w-5 h-5" />,
                                    title: '2. Booking',
                                    desc: 'Request property visits with one click. Track scheduled tours directly from your dashboard.',
                                    img: '/booking.png'
                                },
                                {
                                    icon: <FileText className="w-5 h-5" />,
                                    title: '3. Move-in',
                                    desc: 'Upload documents, review lease drafts, and e-sign agreements in a unified digital flow.',
                                    img: '/checklist.png'
                                }
                            ].map((step, i) => (
                                <div key={i} className="space-y-4 group">
                                    <div className="relative aspect-video rounded-lg overflow-hidden border border-secondary/15 mb-4">
                                        <img src={step.img} alt={step.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="w-10 h-10 rounded-sm bg-secondary/10 flex items-center justify-center border border-secondary/20">
                                        {step.icon}
                                    </div>
                                    <h3 className="font-bold">{step.title}</h3>
                                    <p className="text-sm text-paragraph">
                                        {step.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Landlord Workflow */}
                    <section id="landlord" className="space-y-8">
                        <div className="flex items-center gap-4 border-b border-secondary/10 pb-4">
                            <Home className="w-6 h-6 text-highlight" />
                            <h2 className="text-2xl sm:text-3xl font-bold">The Landlord Workflow</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold">Manage with Precision</h3>
                                <p className="text-paragraph leading-relaxed">
                                    From listing creation to resident management, SettleIn provides all the tools you need to manage your properties efficiently.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 rounded-sm border border-secondary/10 bg-secondary/5">
                                        <ClipboardCheck className="w-5 h-5 text-highlight mt-1" />
                                        <div>
                                            <p className="font-bold text-sm">Onboarding Oversight</p>
                                            <p className="text-xs text-paragraph">Verify documents and guide residents through the move-in checklist.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 rounded-sm border border-secondary/10 bg-secondary/5">
                                        <MessageSquare className="w-5 h-5 text-highlight mt-1" />
                                        <div>
                                            <p className="font-bold text-sm">Post-Move Management</p>
                                            <p className="text-xs text-paragraph">Handle extension requests and maintenance tickets with dedicated support tools.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-highlight/5 blur-3xl rounded-full"></div>
                                    <img
                                        src="/dashboard-preview.png"
                                        alt="Landlord UI"
                                        className="relative w-full max-w-[450px] rounded-lg border border-secondary/15 shadow-2xl group-hover:scale-[1.02] transition-transform duration-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Admin Oversight */}
                    <section id="admin" className="space-y-8">
                        <div className="flex items-center gap-4 border-b border-secondary/10 pb-4">
                            <User className="w-6 h-6 text-highlight" />
                            <h2 className="text-2xl sm:text-3xl font-bold">Platform Oversight</h2>
                        </div>
                        <div className="bg-secondary/5 rounded-xl border border-secondary/15 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold">Integrity & Quality</h3>
                                <p className="text-sm text-paragraph leading-relaxed">
                                    Our admin team monitors all activity to ensure SettleIn remains a trusted marketplace. This includes listing verification and dispute resolution.
                                </p>
                            </div>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                {[
                                    'User moderation',
                                    'Listing verification',
                                    'Analytics oversight',
                                    'Ticket intervention'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-paragraph">
                                        <div className="w-1.5 h-1.5 rounded-full bg-highlight"></div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* Tech Stack Section */}
                    <section id="tech-stack" className="space-y-8">
                        <div className="flex items-center gap-4 border-b border-secondary/10 pb-4">
                            <ClipboardCheck className="w-6 h-6 text-highlight" />
                            <h2 className="text-2xl sm:text-3xl font-bold">The Tech Behind SettleIn</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                            {[
                                { name: 'React 19', category: 'Frontend', icon: <Atom className="w-4 h-4" /> },
                                { name: 'TypeScript', category: 'Language', icon: <Type className="w-4 h-4" /> },
                                { name: 'Tailwind 4', category: 'Styling', icon: <Wind className="w-4 h-4" /> },
                                { name: 'Supabase', category: 'Backend/DB', icon: <Database className="w-4 h-4" /> },
                                { name: 'Vite', category: 'Build Tool', icon: <Zap className="w-4 h-4" /> },
                                { name: 'Lucide', category: 'Icons', icon: <BoxSelect className="w-4 h-4" /> },
                                { name: 'Leaflet', category: 'Maps', icon: <Map className="w-4 h-4" /> },
                                { name: 'BUN', category: 'Runtime', icon: <Cpu className="w-4 h-4" /> }
                            ].map((tech) => (
                                <div key={tech.name} className="p-4 rounded-sm border border-secondary/10 bg-secondary/5 text-center transition-all duration-300 hover:border-highlight/30 hover:bg-highlight/5 group relative overflow-hidden">
                                    <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-100 group-hover:text-highlight transition-all">
                                        {tech.icon}
                                    </div>
                                    <p className="text-sm font-bold text-headline group-hover:text-highlight tracking-tight transition-colors">{tech.name}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-paragraph mt-1 font-semibold">{tech.category}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer CTA */}
                <div className="mt-32 text-center p-12 rounded-2xl border border-secondary/15 bg-secondary/5 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-highlight"></div>
                    <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
                    <p className="text-paragraph mb-8">Visit our resident dashboard or contact support through our ticketing system.</p>
                    <a
                        href="https://github.com/Satpal777/SettleIn/tree/main/docs"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center px-8 py-3 rounded-sm bg-button text-button-text font-bold text-sm shadow-xl shadow-button/20 hover:opacity-90 active:scale-95 transition-all"
                    >
                        Visit Project Wiki
                    </a>
                </div>
            </main>
        </div>
    )
}

import { Search, CalendarDays, CheckCircle2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Features() {
    return (
        <section id="features" className="bg-background py-24 sm:py-32 px-6 sm:px-10 overflow-hidden relative">

            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-highlight/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="mx-auto max-w-7xl relative z-10">

                <div className="text-center mb-24 max-w-3xl mx-auto space-y-4">
                    <span className="inline-block px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest bg-highlight/10 text-highlight">
                        The SettleIn Experience
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-headline tracking-tight leading-[1.1]">
                        Everything you need
                    </h2>
                    <p className="text-lg md:text-xl text-paragraph leading-relaxed">
                        Say goodbye to scattered emails and endless paperwork. Our platform brings discovery, booking, and move-in checklists into one beautiful, unified space.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 mb-32">
                    <div className="flex-1 space-y-6">
                        <div className="w-12 h-12 rounded-sm bg-highlight/10 flex items-center justify-center border border-highlight/20 shadow-sm">
                            <Search className="w-6 h-6 text-highlight" />
                        </div>
                        <h3 className="text-3xl sm:text-4xl font-extrabold text-headline tracking-tight">
                            Discover homes that match your lifestyle.
                        </h3>
                        <p className="text-lg text-paragraph leading-relaxed">
                            Browse verified listings with filters for budget, location, and move-in dates. Shortlist your favorites, compare amenities side-by-side, and find the perfect match without the noise.
                        </p>
                        <ul className="space-y-3 pt-4">
                            {['Location & budget filters', 'Side-by-side property comparisons', 'Curated, verified landlord listings'].map(item => (
                                <li key={item} className="flex items-center gap-3 text-sm font-semibold text-headline">
                                    <CheckCircle2 className="w-5 h-5 text-highlight shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex-1 w-full relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-highlight/10 to-transparent rounded-2xl md:rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-60 pointer-events-none"></div>
                        <div className="relative rounded-2xl md:rounded-3xl border border-secondary/15 bg-background shadow-2xl p-2 z-10 overflow-hidden transform group-hover:-translate-y-1 transition-transform duration-500">
                            <img src="/tenant_discovery.png" alt="Property Discovery UI" className="w-full h-auto rounded-xl md:rounded-2xl border border-secondary/10 object-cover" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20 mb-32">
                    <div className="flex-1 space-y-6">
                        <div className="w-12 h-12 rounded-sm bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-sm">
                            <CalendarDays className="w-6 h-6 text-headline" />
                        </div>
                        <h3 className="text-3xl sm:text-4xl font-extrabold text-headline tracking-tight">
                            Schedule tours instantly.
                        </h3>
                        <p className="text-lg text-paragraph leading-relaxed">
                            Book property visits directly through the platform. Pick a time that works for you, get landlord confirmation, and track all your scheduled visits.
                        </p>
                        <ul className="space-y-3 pt-4">
                            {['One-click visit requests', 'Status tracking (Requested → Scheduled)'].map(item => (
                                <li key={item} className="flex items-center gap-3 text-sm font-semibold text-headline">
                                    <CheckCircle2 className="w-5 h-5 text-paragraph shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex-1 w-full relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-secondary/10 to-transparent rounded-2xl md:rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-60 pointer-events-none"></div>
                        <div className="relative rounded-2xl md:rounded-3xl border border-secondary/15 bg-background shadow-2xl p-2 z-10 overflow-hidden transform group-hover:-translate-y-1 transition-transform duration-500">
                            <img src="/tenant_booking.png" alt="Visit Booking UI" className="w-full h-auto rounded-xl md:rounded-2xl border border-secondary/10 object-cover" />
                        </div>
                    </div>
                </div>

                {/* Feature 3: Operations & Move-in */}
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    {/* Text */}
                    <div className="flex-1 space-y-6">
                        <div className="w-12 h-12 rounded-sm bg-tertiary/10 flex items-center justify-center border border-tertiary/20 shadow-sm">
                            <CheckCircle2 className="w-6 h-6 text-tertiary" />
                        </div>
                        <h3 className="text-3xl sm:text-4xl font-extrabold text-headline tracking-tight">
                            A seamless digital move-in process.
                        </h3>
                        <p className="text-lg text-paragraph leading-relaxed">
                            Turn the most stressful part of moving into a straightforward checklist. Upload documents, sign agreements, and manage support tickets or extension requests directly from your tenant dashboard.
                        </p>
                        <ul className="space-y-3 pt-4">
                            {['Step-by-step move-in checklists', 'Secure document uploads & tracking', 'Integrated support ticketing system'].map(item => (
                                <li key={item} className="flex items-center gap-3 text-sm font-semibold text-headline">
                                    <CheckCircle2 className="w-5 h-5 text-tertiary shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Image */}
                    <div className="flex-1 w-full relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-tertiary/10 to-transparent rounded-2xl md:rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-60 pointer-events-none"></div>
                        <div className="relative rounded-2xl md:rounded-3xl border border-secondary/15 bg-background shadow-2xl p-2 z-10 overflow-hidden transform group-hover:-translate-y-1 transition-transform duration-500">
                            <img src="/dashboard_checklist.png" alt="Move-in Checklist UI" className="w-full h-auto rounded-xl md:rounded-2xl border border-secondary/10 object-cover" />
                        </div>
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-24 sm:mt-32 text-center">
                    <div className="inline-flex flex-col items-center p-8 sm:p-12 rounded-2xl border border-secondary/15 bg-secondary/5 relative overflow-hidden backdrop-blur-sm w-full">
                        <div className="absolute top-0 inset-x-0 h-1 bg-highlight"></div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-headline mb-4">Ready to simplify your move?</h3>
                        <p className="text-paragraph mb-8 max-w-lg">Join tenants and landlords experiencing the future of renting.</p>
                        <Link
                            to="/signup"
                            className="inline-flex items-center justify-center gap-2 bg-button text-button-text text-sm font-bold px-8 py-3.5 rounded-sm shadow-xl shadow-button/20 hover:opacity-90 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight group"
                        >
                            Start your journey
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

            </div>
        </section>
    )
}

import { BarChart3 } from 'lucide-react'

export default function AdminAnalyticsPage() {
    return (
        <div className="bg-background text-headline min-h-screen animate-[fadeIn_0.25s_ease-out]">
            <header className="border-b border-secondary/10 bg-background sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold mb-1 tracking-tight flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-paragraph" /> Platform Analytics
                        </h1>
                        <p className="text-sm text-paragraph">Top-level metrics, growth charts, and platform health.</p>
                    </div>
                </div>
            </header>
            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { label: 'Total MRR', value: '$45,200', trend: '+12%' },
                        { label: 'Active Leases', value: '342', trend: '+5%' },
                        { label: 'Avg Time to Rent', value: '14 Days', trend: '-2 Days' }
                    ].map(stat => (
                        <div key={stat.label} className="bg-background border border-secondary/15 rounded-sm p-6 flex flex-col justify-between">
                            <p className="text-sm text-paragraph font-semibold mb-2">{stat.label}</p>
                            <div className="flex items-end justify-between">
                                <p className="text-3xl font-extrabold text-headline">{stat.value}</p>
                                <span className="text-xs font-bold text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded-sm">{stat.trend}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="h-64 bg-secondary/5 border border-secondary/10 rounded-sm flex items-center justify-center">
                    <p className="text-secondary font-medium">Charts integration pending.</p>
                </div>
            </main>
        </div>
    )
}

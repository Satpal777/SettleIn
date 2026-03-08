import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import Features from '../components/landing/Features'

export default function LandingPage() {
    return (
        <div className="bg-background text-headline">
            <Navbar />
            <main>
                <Hero />
                <Features />
            </main>
        </div>
    )
}

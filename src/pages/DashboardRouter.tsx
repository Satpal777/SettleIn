import { Navigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'

export default function DashboardRouter() {
    const { profile, loading } = useProfile()

    if (loading) return <div className="min-h-screen bg-background" aria-hidden="true" />

    if (!profile?.onboarded) return <Navigate to="/onboarding" replace />

    if (profile.role === 'superadmin') return <Navigate to="/admin/dashboard" replace />

    if (profile.active_view === 'landlord') return <Navigate to="/landlord/dashboard" replace />
    return <Navigate to="/seeker/dashboard" replace />
}

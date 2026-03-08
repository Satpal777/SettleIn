import { Navigate } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import type { Profile } from '../../hooks/useProfile'

interface Props {
    check: (profile: Profile) => boolean
    children: React.ReactNode
}

/**
 * Restricts a route based on profile data.
 * Usage examples:
 *   // Superadmin only
 *   <RoleRoute check={p => p.role === 'superadmin'}>
 *   // Landlord view
 *   <RoleRoute check={p => p.is_landlord}>
 *   // Seeker view
 *   <RoleRoute check={p => p.is_seeker}>
 */
export default function RoleRoute({ check, children }: Props) {
    const { profile, loading } = useProfile()

    if (loading) return <div className="min-h-screen bg-background" aria-hidden="true" />
    if (!profile || !check(profile)) return <Navigate to="/dashboard" replace />

    return <>{children}</>
}

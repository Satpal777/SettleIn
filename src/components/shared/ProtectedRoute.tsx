import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Wraps any route that requires the user to be logged in.
 * If not authenticated → redirects to /login.
 * While auth is loading → renders nothing (avoids flash).
 */
export default function ProtectedRoute() {
    const { user, loading } = useAuth()

    if (loading) return (
        <div className="min-h-screen bg-background" aria-hidden="true" />
    )
    if (!user) return <Navigate to="/login" replace />

    return <Outlet />
}

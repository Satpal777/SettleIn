import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

export type Role = 'tenant' | 'ops' | 'admin' | null

/**
 * Fetches the current user's role from the `profiles` table.
 * Returns role + loading state.
 *
 * Usage:
 *   const { role, loading } = useRole()
 */
export function useRole() {
    const { user } = useAuth()
    const [role, setRole] = useState<Role>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setRole(null)
            setLoading(false)
            return
        }

        supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single()
            .then(({ data }) => {
                setRole((data?.role as Role) ?? 'tenant') // default: tenant
                setLoading(false)
            })
    }, [user])

    return { role, loading }
}
